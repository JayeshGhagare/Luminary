import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

app.use(cors({
  origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(','),
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN === '*' ? '*' : CLIENT_ORIGIN.split(','),
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const MAX_PARTICIPANTS_PER_ROOM = parseInt(process.env.MAX_PARTICIPANTS_PER_ROOM || '12', 10);
const ROOM_DESTROY_TIMEOUT_MS = parseInt(process.env.ROOM_DESTROY_TIMEOUT_MS || '300000', 10); // 5 minutes

// In-memory room store
// rooms[roomId] = { participants: Map<socketId, user>, notes: string, tasks: Array, cleanupTimer: Timeout }
const rooms = new Map();

// Rate limiting map: socketId:action -> { count, resetAt }
const rateLimitMap = new Map();
const isRateLimited = (socketId, action, maxPerSecond = 8) => {
  const now = Date.now();
  const key = `${socketId}:${action}`;
  const record = rateLimitMap.get(key) || { count: 0, resetAt: now + 1000 };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + 1000;
    rateLimitMap.set(key, record);
    return false;
  }
  record.count += 1;
  return record.count > maxPerSecond;
};

// Helper to check host authorization
const isRoomHost = (roomId, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return false;
  const p = room.participants.get(socketId);
  return !!(p && p.isHost);
};

// Health & Monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Room status query
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  res.json({
    roomId,
    exists: !!room,
    participantCount: room ? room.participants.size : 0,
    maxCapacity: MAX_PARTICIPANTS_PER_ROOM,
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join Room
  socket.on('join-room', ({ roomId, user = {} }) => {
    if (!roomId || typeof roomId !== 'string') {
      socket.emit('join-error', { message: 'Invalid room ID provided.' });
      return;
    }

    const cleanRoomId = roomId.trim().slice(0, 50);

    // Cancel pending room deletion timer if someone rejoins within grace period
    if (rooms.has(cleanRoomId)) {
      const existingRoom = rooms.get(cleanRoomId);
      if (existingRoom.cleanupTimer) {
        clearTimeout(existingRoom.cleanupTimer);
        existingRoom.cleanupTimer = null;
        console.log(`Cancelled destruction timer for room ${cleanRoomId} on rejoin`);
      }

      // Enforce participant cap for WebRTC mesh scalability
      if (existingRoom.participants.size >= MAX_PARTICIPANTS_PER_ROOM) {
        socket.emit('join-error', {
          message: `This meeting is at full capacity (${MAX_PARTICIPANTS_PER_ROOM} participants max for mesh performance).`,
        });
        return;
      }
    } else {
      rooms.set(cleanRoomId, {
        participants: new Map(),
        notes: '# Meeting Notes\n- Agenda:\n  - Introductions\n  - Discussion\n  - Action items\n',
        tasks: [],
        cleanupTimer: null,
      });
    }

    socket.join(cleanRoomId);
    const room = rooms.get(cleanRoomId);

    const cleanName = typeof user.name === 'string' && user.name.trim()
      ? user.name.trim().slice(0, 40)
      : 'Guest Participant';

    const userData = {
      socketId: socket.id,
      id: user.id || socket.id,
      name: cleanName,
      avatar: user.avatar || '',
      isAudioMuted: Boolean(user.isAudioMuted),
      isVideoMuted: Boolean(user.isVideoMuted),
      isScreenSharing: Boolean(user.isScreenSharing),
      isHandRaised: false,
      handRaisedTime: null,
      isHost: room.participants.size === 0, // First user is host
    };

    room.participants.set(socket.id, userData);

    // Existing peers in the room
    const existingUsers = Array.from(room.participants.values()).filter(
      (p) => p.socketId !== socket.id
    );

    socket.emit('room-joined', {
      self: userData,
      participants: existingUsers,
      notes: room.notes,
      tasks: room.tasks,
    });

    // Broadcast new joiner to room
    socket.to(cleanRoomId).emit('user-joined', userData);
    console.log(`User ${cleanName} (${socket.id}) joined ${cleanRoomId}. Room size: ${room.participants.size}`);
  });

  // WebRTC Signaling relays
  socket.on('signal-offer', ({ to, offer }) => {
    if (to && offer) {
      io.to(to).emit('signal-offer', { from: socket.id, offer });
    }
  });

  socket.on('signal-answer', ({ to, answer }) => {
    if (to && answer) {
      io.to(to).emit('signal-answer', { from: socket.id, answer });
    }
  });

  socket.on('signal-ice-candidate', ({ to, candidate }) => {
    if (to && candidate) {
      io.to(to).emit('signal-ice-candidate', { from: socket.id, candidate });
    }
  });

  // Media state updates
  socket.on('update-media-state', ({ roomId, audioMuted, videoMuted, screenSharing }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (participant) {
      if (typeof audioMuted === 'boolean') participant.isAudioMuted = audioMuted;
      if (typeof videoMuted === 'boolean') participant.isVideoMuted = videoMuted;
      if (typeof screenSharing === 'boolean') participant.isScreenSharing = screenSharing;
      socket.to(roomId).emit('participant-media-changed', {
        socketId: socket.id,
        isAudioMuted: participant.isAudioMuted,
        isVideoMuted: participant.isVideoMuted,
        isScreenSharing: participant.isScreenSharing,
      });
    }
  });

  // Active speaker volume level
  socket.on('speaking-level', ({ roomId, volume }) => {
    if (typeof volume === 'number') {
      socket.to(roomId).emit('peer-speaking-level', {
        socketId: socket.id,
        volume: Math.max(0, Math.min(100, Math.round(volume))),
      });
    }
  });

  // Hand raise
  socket.on('toggle-hand', ({ roomId, isRaised }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (participant) {
      participant.isHandRaised = Boolean(isRaised);
      participant.handRaisedTime = participant.isHandRaised ? Date.now() : null;
      io.to(roomId).emit('participant-hand-toggled', {
        socketId: socket.id,
        name: participant.name,
        isHandRaised: participant.isHandRaised,
        timestamp: participant.handRaisedTime,
      });
    }
  });

  // Host Action: Lower all hands (Protected)
  socket.on('lower-all-hands', ({ roomId }) => {
    if (!isRoomHost(roomId, socket.id)) {
      socket.emit('action-unauthorized', { action: 'lower-all-hands' });
      return;
    }
    const room = rooms.get(roomId);
    if (!room) return;
    for (const p of room.participants.values()) {
      p.isHandRaised = false;
      p.handRaisedTime = null;
    }
    io.to(roomId).emit('all-hands-lowered');
  });

  // Emoji Reactions (Rate-limited & sanitized)
  socket.on('send-reaction', ({ roomId, emoji, senderName }) => {
    if (isRateLimited(socket.id, 'reaction', 6)) return;
    if (!emoji || typeof emoji !== 'string') return;

    io.to(roomId).emit('receive-reaction', {
      id: crypto.randomUUID(),
      emoji: emoji.slice(0, 4),
      senderName: (senderName || 'Guest').slice(0, 30),
      socketId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Live Chat (Rate-limited & sanitized)
  socket.on('send-message', ({ roomId, text, senderName }) => {
    if (isRateLimited(socket.id, 'chat', 5)) return;
    if (!text || typeof text !== 'string' || !text.trim()) return;

    const message = {
      id: crypto.randomUUID(),
      senderId: socket.id,
      senderName: (senderName || 'Guest').slice(0, 30),
      text: text.trim().slice(0, 1500),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      isPinned: false,
    };
    io.to(roomId).emit('receive-message', message);
  });

  // Pin message (Host only)
  socket.on('toggle-pin-message', ({ roomId, messageId, isPinned }) => {
    if (!isRoomHost(roomId, socket.id)) return;
    io.to(roomId).emit('message-pin-updated', { messageId, isPinned: Boolean(isPinned) });
  });

  // Shared Meeting Notes
  socket.on('update-shared-notes', ({ roomId, notes, updatedBy }) => {
    const room = rooms.get(roomId);
    if (room && typeof notes === 'string') {
      room.notes = notes.slice(0, 50000);
      socket.to(roomId).emit('receive-shared-notes', {
        notes: room.notes,
        updatedBy: (updatedBy || 'Someone').slice(0, 30),
      });
    }
  });

  // Shared Tasks
  socket.on('update-shared-tasks', ({ roomId, tasks }) => {
    const room = rooms.get(roomId);
    if (room && Array.isArray(tasks)) {
      room.tasks = tasks.slice(0, 100);
      socket.to(roomId).emit('receive-shared-tasks', { tasks: room.tasks });
    }
  });

  // Live Captions relay
  socket.on('send-caption', ({ roomId, text, speakerName, isFinal }) => {
    if (!text || typeof text !== 'string' || !text.trim()) return;
    socket.to(roomId).emit('receive-caption', {
      socketId: socket.id,
      speakerName: (speakerName || 'Speaker').slice(0, 30),
      text: text.trim().slice(0, 300),
      isFinal: Boolean(isFinal),
      timestamp: Date.now(),
    });
  });

  // Host Action: Mute All (Protected)
  socket.on('mute-all-participants', ({ roomId }) => {
    if (!isRoomHost(roomId, socket.id)) {
      socket.emit('action-unauthorized', { message: 'Unauthorized: Only the host can mute all participants.' });
      return;
    }
    socket.to(roomId).emit('force-mute-mic');
    console.log(`Host ${socket.id} muted all participants in room ${roomId}`);
  });

  // Host Action: Kick Participant (Protected)
  socket.on('kick-participant', ({ roomId, targetSocketId }) => {
    if (!isRoomHost(roomId, socket.id)) {
      socket.emit('action-unauthorized', { message: 'Unauthorized: Only the host can remove participants.' });
      return;
    }
    io.to(targetSocketId).emit('kicked-from-room', {
      reason: 'You were removed from the meeting by the host.',
    });
    console.log(`Host ${socket.id} kicked participant ${targetSocketId} from room ${roomId}`);
  });

  // Disconnection & Host Reassignment
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const participant = room.participants.get(socket.id);
        const wasHost = participant && participant.isHost;

        room.participants.delete(socket.id);

        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          name: participant ? participant.name : 'A participant',
        });

        console.log(`User ${socket.id} left room ${roomId}. Remaining: ${room.participants.size}`);

        // AUTOMATIC HOST REASSIGNMENT: If host left, promote oldest remaining participant
        if (wasHost && room.participants.size > 0) {
          const nextHost = room.participants.values().next().value;
          if (nextHost) {
            nextHost.isHost = true;
            io.to(roomId).emit('host-reassigned', {
              newHostSocketId: nextHost.socketId,
              name: nextHost.name,
            });
            console.log(`Host reassigned to ${nextHost.name} (${nextHost.socketId}) in room ${roomId}`);
          }
        }

        // Clean up empty room after grace timeout
        if (room.participants.size === 0) {
          room.cleanupTimer = setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).participants.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} destroyed due to inactivity.`);
            }
          }, ROOM_DESTROY_TIMEOUT_MS);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    // Clean rate limits
    for (const key of rateLimitMap.keys()) {
      if (key.startsWith(socket.id)) {
        rateLimitMap.delete(key);
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

server.listen(PORT, () => {
  console.log(`Luminary signaling server running on http://localhost:${PORT}`);
});
