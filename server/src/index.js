import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// In-memory room store
// rooms[roomId] = { participants: Map<socketId, user>, notes: string, tasks: Array }
const rooms = new Map();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size, timestamp: new Date().toISOString() });
});

// Validate or check room existence
app.get('/api/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  res.json({
    roomId,
    exists: !!room,
    participantCount: room ? room.participants.size : 0,
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        participants: new Map(),
        notes: '# Meeting Notes\n- Agenda:\n  - Introductions\n  - Discussion\n  - Action items\n',
        tasks: [],
      });
    }

    const room = rooms.get(roomId);
    const userData = {
      socketId: socket.id,
      id: user.id || socket.id,
      name: user.name || 'Guest Participant',
      avatar: user.avatar || '',
      isAudioMuted: user.isAudioMuted ?? false,
      isVideoMuted: user.isVideoMuted ?? false,
      isScreenSharing: user.isScreenSharing ?? false,
      isHandRaised: false,
      handRaisedTime: null,
      isHost: room.participants.size === 0, // First user is host
    };

    room.participants.set(socket.id, userData);

    // Send existing room state to new user
    const existingUsers = Array.from(room.participants.values()).filter(
      (p) => p.socketId !== socket.id
    );

    socket.emit('room-joined', {
      self: userData,
      participants: existingUsers,
      notes: room.notes,
      tasks: room.tasks,
    });

    // Notify others in room
    socket.to(roomId).emit('user-joined', userData);
    console.log(`User ${userData.name} (${socket.id}) joined room ${roomId}. Total: ${room.participants.size}`);
  });

  // WebRTC Signaling: Offer
  socket.on('signal-offer', ({ to, offer }) => {
    io.to(to).emit('signal-offer', {
      from: socket.id,
      offer,
    });
  });

  // WebRTC Signaling: Answer
  socket.on('signal-answer', ({ to, answer }) => {
    io.to(to).emit('signal-answer', {
      from: socket.id,
      answer,
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('signal-ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('signal-ice-candidate', {
      from: socket.id,
      candidate,
    });
  });

  // Media state updates (mute, cam toggle, screen share)
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

  // Active speaker volume level (for glowing border detection)
  socket.on('speaking-level', ({ roomId, volume }) => {
    socket.to(roomId).emit('peer-speaking-level', {
      socketId: socket.id,
      volume,
    });
  });

  // Hand raise toggle
  socket.on('toggle-hand', ({ roomId, isRaised }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const participant = room.participants.get(socket.id);
    if (participant) {
      participant.isHandRaised = isRaised;
      participant.handRaisedTime = isRaised ? Date.now() : null;
      io.to(roomId).emit('participant-hand-toggled', {
        socketId: socket.id,
        name: participant.name,
        isHandRaised: isRaised,
        timestamp: participant.handRaisedTime,
      });
    }
  });

  // Lower all hands (Host action)
  socket.on('lower-all-hands', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    for (const p of room.participants.values()) {
      p.isHandRaised = false;
      p.handRaisedTime = null;
    }
    io.to(roomId).emit('all-hands-lowered');
  });

  // Emoji Reactions
  socket.on('send-reaction', ({ roomId, emoji, senderName }) => {
    io.to(roomId).emit('receive-reaction', {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      senderName,
      socketId: socket.id,
      timestamp: Date.now(),
    });
  });

  // Live Chat
  socket.on('send-message', ({ roomId, text, senderName }) => {
    const message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: socket.id,
      senderName: senderName || 'Guest',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      isPinned: false,
    };
    io.to(roomId).emit('receive-message', message);
  });

  // Pin / Unpin message
  socket.on('toggle-pin-message', ({ roomId, messageId, isPinned }) => {
    io.to(roomId).emit('message-pin-updated', { messageId, isPinned });
  });

  // Real-time Shared Meeting Notes
  socket.on('update-shared-notes', ({ roomId, notes, updatedBy }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.notes = notes;
      socket.to(roomId).emit('receive-shared-notes', { notes, updatedBy });
    }
  });

  // Real-time Shared To-Do Tasks
  socket.on('update-shared-tasks', ({ roomId, tasks }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.tasks = tasks;
      socket.to(roomId).emit('receive-shared-tasks', { tasks });
    }
  });

  // Live Captions (Web Speech API broadcast)
  socket.on('send-caption', ({ roomId, text, speakerName, isFinal }) => {
    socket.to(roomId).emit('receive-caption', {
      socketId: socket.id,
      speakerName,
      text,
      isFinal,
      timestamp: Date.now(),
    });
  });

  // Host Controls: Mute All
  socket.on('mute-all-participants', ({ roomId }) => {
    socket.to(roomId).emit('force-mute-mic');
  });

  // Host Controls: Kick
  socket.on('kick-participant', ({ roomId, targetSocketId }) => {
    io.to(targetSocketId).emit('kicked-from-room');
  });

  // Disconnect handler
  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        const participant = room.participants.get(socket.id);
        room.participants.delete(socket.id);

        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          name: participant ? participant.name : 'A participant',
        });

        console.log(`User ${socket.id} left room ${roomId}. Remaining: ${room.participants.size}`);

        // If room is empty, clean up after 5 minutes
        if (room.participants.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).participants.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} destroyed due to inactivity.`);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Google Meet Clone signaling server running on http://localhost:${PORT}`);
});
