import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Participant, ChatMessage, ReactionItem, TaskItem, CaptionItem, LayoutMode, SidebarTab, WaitingGuest, MeetingSummaryStats } from '../types';
import { soundEffects } from '../utils/audioEffects';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Free open relay TURN servers for symmetric NAT / corporate firewall traversal
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay',
    },
  ],
};

interface WebRTCContextType {
  // Connection state
  socket: Socket | null;
  roomId: string | null;
  isInCall: boolean;
  isHost: boolean;
  userName: string;
  setUserName: (name: string) => void;
  isReconnecting: boolean;
  kickedReason: string | null;
  clearKickedReason: () => void;
  joinErrorMessage: string | null;
  clearJoinErrorMessage: () => void;
  actionNotice: string | null;
  isTalkingWhileMuted: boolean;

  // Access Control & Moderation
  isRoomLocked: boolean;
  toggleRoomLock: () => void;
  waitingGuests: WaitingGuest[];
  admitGuest: (socketId: string) => void;
  denyGuest: (socketId: string) => void;
  knockStatus: 'idle' | 'waiting' | 'denied';
  cancelKnock: () => void;

  // Post-Meeting Summary
  summaryStats: MeetingSummaryStats | null;
  clearSummaryStats: () => void;

  // Media
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  activeSpeakerSocketId: string | null;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
  initializeMedia: (audioSource?: string, videoSource?: string) => Promise<MediaStream | null>;

  // Room Participants
  participants: Participant[];
  pinnedSocketId: string | null;
  setPinnedSocketId: (id: string | null) => void;

  // Hand raise
  isHandRaised: boolean;
  toggleHandRaise: () => void;
  lowerAllHands: () => void;

  // Chat
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  togglePinMessage: (id: string, isPinned: boolean) => void;

  // Reactions
  reactions: ReactionItem[];
  sendReaction: (emoji: string) => void;

  // Productivity: Notes & Tasks
  sharedNotes: string;
  updateSharedNotes: (notes: string) => void;
  tasks: TaskItem[];
  addTask: (text: string, priority?: 'high' | 'medium' | 'low', assignee?: string) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Captions
  captions: CaptionItem[];
  isCaptionsEnabled: boolean;
  toggleCaptions: () => void;
  broadcastCaption: (text: string, isFinal: boolean) => void;

  // UI state
  activeSidebar: SidebarTab;
  setActiveSidebar: (tab: SidebarTab) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  // Actions
  joinMeeting: (roomId: string, name: string) => Promise<void>;
  leaveMeeting: () => void;
  muteAllParticipants: () => void;
  kickParticipant: (targetSocketId: string) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem('meet_username');
    if (saved) return saved;
    const num = typeof window !== 'undefined' && window.crypto?.getRandomValues
      ? (window.crypto.getRandomValues(new Uint16Array(1))[0] % 900) + 100
      : Math.floor(100 + Math.random() * 900);
    return `Guest ${num}`;
  });

  // Local media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeakerSocketId, setActiveSpeakerSocketId] = useState<string | null>(null);

  // Participants & Peer connections
  const [participants, setParticipants] = useState<Participant[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [pinnedSocketId, setPinnedSocketId] = useState<string | null>(null);

  // Hand raise
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Chat & Reactions
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ReactionItem[]>([]);

  // Productivity
  const [sharedNotes, setSharedNotes] = useState<string>('# Meeting Notes\n- Agenda:\n  - Introductions\n  - Discussion\n  - Action items\n');
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  // Captions
  const [captions, setCaptions] = useState<CaptionItem[]>([]);
  const [isCaptionsEnabled, setIsCaptionsEnabled] = useState(false);

  // Resilience and error states
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isTalkingWhileMuted, setIsTalkingWhileMuted] = useState(false);

  // Access control & waiting room state
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [waitingGuests, setWaitingGuests] = useState<WaitingGuest[]>([]);
  const [knockStatus, setKnockStatus] = useState<'idle' | 'waiting' | 'denied'>('idle');

  // Post-meeting summary statistics
  const [summaryStats, setSummaryStats] = useState<MeetingSummaryStats | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const peakParticipantsRef = useRef<number>(1);

  // VAD refs for talking-while-muted and active speaker level detection
  const vadTrackRef = useRef<MediaStreamTrack | null>(null);
  const vadAudioCtxRef = useRef<AudioContext | null>(null);
  const vadAnimFrameRef = useRef<number | null>(null);
  const muteToastTimerRef = useRef<any>(null);
  const lastSpeakingEmitRef = useRef<number>(0);

  const clearKickedReason = () => setKickedReason(null);
  const clearJoinErrorMessage = () => setJoinErrorMessage(null);
  const cancelKnock = () => setKnockStatus('idle');
  const clearSummaryStats = () => setSummaryStats(null);

  // Voice Activity Detection: detects speaking while muted & broadcasts volume levels
  useEffect(() => {
    if (!localStream || localStream.getAudioTracks().length === 0) {
      if (vadAnimFrameRef.current) cancelAnimationFrame(vadAnimFrameRef.current);
      if (vadTrackRef.current) {
        vadTrackRef.current.stop();
        vadTrackRef.current = null;
      }
      if (vadAudioCtxRef.current && vadAudioCtxRef.current.state !== 'closed') {
        vadAudioCtxRef.current.close().catch(() => {});
        vadAudioCtxRef.current = null;
      }
      setIsTalkingWhileMuted(false);
      return;
    }

    if (vadTrackRef.current) {
      vadTrackRef.current.stop();
    }

    try {
      const sourceAudioTrack = localStream.getAudioTracks()[0];
      // Clone track so hardware input persists even when transmission track is disabled
      const clonedTrack = sourceAudioTrack.clone();
      clonedTrack.enabled = true;
      vadTrackRef.current = clonedTrack;

      const vadStream = new MediaStream([clonedTrack]);
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      vadAudioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(vadStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));

        if (isAudioMuted) {
          if (normalized > 16) {
            setIsTalkingWhileMuted(true);
            if (muteToastTimerRef.current) clearTimeout(muteToastTimerRef.current);
            muteToastTimerRef.current = setTimeout(() => {
              setIsTalkingWhileMuted(false);
            }, 2500);
          }
        } else {
          setIsTalkingWhileMuted(false);
          const now = Date.now();
          if (socket && roomId && isInCall && now - lastSpeakingEmitRef.current > 160) {
            lastSpeakingEmitRef.current = now;
            socket.emit('speaking-level', { roomId, volume: normalized });
          }
        }

        vadAnimFrameRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('VAD audio monitor setup error:', e);
    }

    return () => {
      if (vadAnimFrameRef.current) cancelAnimationFrame(vadAnimFrameRef.current);
      if (vadTrackRef.current) {
        vadTrackRef.current.stop();
        vadTrackRef.current = null;
      }
      if (vadAudioCtxRef.current && vadAudioCtxRef.current.state !== 'closed') {
        vadAudioCtxRef.current.close().catch(() => {});
        vadAudioCtxRef.current = null;
      }
      if (muteToastTimerRef.current) clearTimeout(muteToastTimerRef.current);
    };
  }, [localStream, isAudioMuted, socket, roomId, isInCall]);

  // UI state
  const [activeSidebar, setActiveSidebar] = useState<SidebarTab>('none');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');

  // Socket initialization
  useEffect(() => {
    // Connect to backend server (configurable via VITE_SERVER_URL)
    const envUrl = (import.meta as any).env?.VITE_SERVER_URL;
    const backendUrl = envUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : `http://${window.location.hostname}:5000`);

    const socketInstance = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });

    socketInstance.io.on('reconnect_attempt', () => {
      setIsReconnecting(true);
    });

    socketInstance.io.on('reconnect', () => {
      console.log('Socket reconnected successfully');
      setIsReconnecting(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Initialize camera and mic
  const initializeMedia = useCallback(async (audioDeviceId?: string, videoDeviceId?: string) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId
          ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsAudioMuted(false);
      setIsVideoMuted(false);
      return stream;
    } catch (err) {
      console.warn('Could not acquire audio/video with full constraints, falling back:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setLocalStream(fallbackStream);
        return fallbackStream;
      } catch (fallbackErr) {
        console.error('Failed to get user media entirely:', fallbackErr);
        return null;
      }
    }
  }, [localStream]);

  // Create Peer Connection
  const createPeerConnection = useCallback((remoteSocketId: string, currentLocalStream: MediaStream | null) => {
    if (peerConnections.current.has(remoteSocketId)) {
      return peerConnections.current.get(remoteSocketId)!;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(remoteSocketId, pc);

    // Add local tracks to peer connection
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === remoteSocketId) {
            return { ...p, stream: remoteStream };
          }
          return p;
        })
      );
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal-ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn(`ICE failed for peer ${remoteSocketId}, attempting ICE restart...`);
        try {
          pc.restartIce();
        } catch (err) {
          console.error('ICE restart failed:', err);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        console.warn(`Peer connection failed with ${remoteSocketId}`);
        try {
          pc.restartIce();
        } catch {
          pc.close();
          peerConnections.current.delete(remoteSocketId);
        }
      } else if (pc.connectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            pc.close();
            peerConnections.current.delete(remoteSocketId);
          }
        }, 4000);
      }
    };

    return pc;
  }, [socket]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket) return;

    socket.on('room-joined', async ({ self, participants: existingPeers, notes, tasks: roomTasks, isLocked, waitingQueue }) => {
      setIsHost(self.isHost);
      setIsRoomLocked(Boolean(isLocked));
      if (waitingQueue) setWaitingGuests(waitingQueue);
      setKnockStatus('idle');
      setIsInCall(true);
      callStartTimeRef.current = Date.now();
      peakParticipantsRef.current = Math.max(peakParticipantsRef.current, existingPeers.length + 1);

      if (notes) setSharedNotes(notes);
      if (roomTasks) setTasks(roomTasks);

      // Create peer connections for all existing users and send offer
      const formattedPeers: Participant[] = existingPeers.map((p: any) => ({
        ...p,
        stream: undefined,
      }));
      setParticipants(formattedPeers);

      for (const peer of existingPeers) {
        const pc = createPeerConnection(peer.socketId, localStream);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('signal-offer', {
            to: peer.socketId,
            offer,
          });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    });

    socket.on('user-joined', (newUser: Participant) => {
      soundEffects.playUserJoin();
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === newUser.socketId)) return prev;
        const next = [...prev, newUser];
        peakParticipantsRef.current = Math.max(peakParticipantsRef.current, next.length + 1);
        return next;
      });
    });

    socket.on('user-left', ({ socketId }) => {
      soundEffects.playUserLeave();
      if (peerConnections.current.has(socketId)) {
        peerConnections.current.get(socketId)?.close();
        peerConnections.current.delete(socketId);
      }
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      if (pinnedSocketId === socketId) setPinnedSocketId(null);
      if (activeSpeakerSocketId === socketId) setActiveSpeakerSocketId(null);
    });

    // WebRTC Signaling Offers
    socket.on('signal-offer', async ({ from, offer }) => {
      const pc = createPeerConnection(from, localStream);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('signal-answer', {
          to: from,
          answer,
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // WebRTC Signaling Answers
    socket.on('signal-answer', async ({ from, answer }) => {
      const pc = peerConnections.current.get(from);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote answer:', err);
        }
      }
    });

    // WebRTC ICE Candidates
    socket.on('signal-ice-candidate', async ({ from, candidate }) => {
      const pc = peerConnections.current.get(from);
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Participant media state updates
    socket.on('participant-media-changed', ({ socketId, isAudioMuted, isVideoMuted, isScreenSharing }) => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === socketId) {
            return {
              ...p,
              isAudioMuted: isAudioMuted ?? p.isAudioMuted,
              isVideoMuted: isVideoMuted ?? p.isVideoMuted,
              isScreenSharing: isScreenSharing ?? p.isScreenSharing,
            };
          }
          return p;
        })
      );
    });

    // Speaking levels for glowing ring
    socket.on('peer-speaking-level', ({ socketId, volume }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, volumeLevel: volume } : p))
      );
      if (volume > 18) {
        setActiveSpeakerSocketId(socketId);
      } else if (activeSpeakerSocketId === socketId && volume < 5) {
        setActiveSpeakerSocketId(null);
      }
    });

    // Hand raise toggle
    socket.on('participant-hand-toggled', ({ socketId, isHandRaised: raised, timestamp }) => {
      if (raised) soundEffects.playHandRaise();
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.socketId === socketId) {
            return { ...p, isHandRaised: raised, handRaisedTime: timestamp };
          }
          return p;
        })
      );
    });

    socket.on('all-hands-lowered', () => {
      setIsHandRaised(false);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, isHandRaised: false, handRaisedTime: null }))
      );
    });

    // Reactions
    socket.on('receive-reaction', (reaction: ReactionItem) => {
      soundEffects.playReactionPop();
      const reactionWithOffset = {
        ...reaction,
        leftOffset: 15 + Math.random() * 70, // Random 15-85% across screen width
      };
      setReactions((prev) => [...prev, reactionWithOffset]);

      // Remove after animation finishes (2.8s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2900);
    });

    // Chat messages
    socket.on('receive-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('message-pin-updated', ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
      );
    });

    // Shared Notes & Tasks
    socket.on('receive-shared-notes', ({ notes }) => {
      setSharedNotes(notes);
    });

    socket.on('receive-shared-tasks', ({ tasks: newTasks }) => {
      setTasks(newTasks);
    });

    // Captions
    socket.on('receive-caption', (caption: CaptionItem) => {
      setCaptions((prev) => {
        const filtered = prev.filter((c) => c.socketId !== caption.socketId);
        return [...filtered, caption];
      });
      // Remove caption after 4 seconds of silence
      setTimeout(() => {
        setCaptions((prev) => prev.filter((c) => c.timestamp !== caption.timestamp));
      }, 4500);
    });

    // Host force mute
    socket.on('force-mute-mic', () => {
      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        setIsAudioMuted(true);
      }
    });

    // Host reassignment listener
    socket.on('host-reassigned', ({ newHostSocketId }) => {
      if (newHostSocketId === socket.id) {
        setIsHost(true);
      }
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          isHost: p.socketId === newHostSocketId,
        }))
      );
    });

    // Room join error (e.g. room full / invalid room)
    socket.on('join-error', ({ message }) => {
      setJoinErrorMessage(message || 'Unable to join meeting.');
      leaveMeeting();
    });

    // Unauthorized action feedback
    socket.on('action-unauthorized', ({ message }) => {
      setActionNotice(message || 'Only the meeting host can perform this action.');
      setTimeout(() => setActionNotice(null), 4000);
    });

    // Host kick (non-blocking in-app notification)
    socket.on('kicked-from-room', ({ reason } = {}) => {
      setKickedReason(reason || 'You were removed from the meeting by the host.');
      leaveMeeting();
    });

    // Access Control Listeners
    socket.on('guest-waiting', () => {
      setKnockStatus('waiting');
      setIsInCall(false);
    });

    socket.on('knock-admitted', ({ roomId: admittedRoomId }) => {
      setKnockStatus('idle');
      soundEffects.playUserJoin();
      // Re-issue join-room now that the host has admitted us
      socket.emit('join-room', {
        roomId: admittedRoomId,
        user: {
          id: socket.id,
          name: userName,
          isAudioMuted,
          isVideoMuted,
          isScreenSharing: false,
        },
      });
    });

    socket.on('knock-denied', () => {
      setKnockStatus('denied');
      setIsInCall(false);
    });

    socket.on('waiting-queue-updated', ({ waitingQueue: newQueue }) => {
      setWaitingGuests(newQueue || []);
      if (newQueue && newQueue.length > 0) {
        soundEffects.playHandRaise();
      }
    });

    socket.on('room-lock-changed', ({ isLocked }) => {
      setIsRoomLocked(Boolean(isLocked));
    });

    return () => {
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('signal-offer');
      socket.off('signal-answer');
      socket.off('signal-ice-candidate');
      socket.off('participant-media-changed');
      socket.off('peer-speaking-level');
      socket.off('participant-hand-toggled');
      socket.off('all-hands-lowered');
      socket.off('receive-reaction');
      socket.off('receive-message');
      socket.off('message-pin-updated');
      socket.off('receive-shared-notes');
      socket.off('receive-shared-tasks');
      socket.off('receive-caption');
      socket.off('force-mute-mic');
      socket.off('host-reassigned');
      socket.off('join-error');
      socket.off('action-unauthorized');
      socket.off('kicked-from-room');
      socket.off('guest-waiting');
      socket.off('knock-admitted');
      socket.off('knock-denied');
      socket.off('waiting-queue-updated');
      socket.off('room-lock-changed');
    };
  }, [socket, localStream, createPeerConnection, activeSpeakerSocketId, pinnedSocketId, userName, isAudioMuted, isVideoMuted]);

  // Join Room
  const joinMeeting = async (targetRoomId: string, name: string) => {
    if (!socket) return;
    setUserName(name);
    localStorage.setItem('meet_username', name);
    setRoomId(targetRoomId);
    setKnockStatus('idle');

    // Acquire media if not already acquired
    let stream = localStream;
    if (!stream) {
      stream = await initializeMedia();
    }

    socket.emit('join-room', {
      roomId: targetRoomId,
      user: {
        id: socket.id,
        name,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing: false,
      },
    });
  };

  // Leave Meeting
  const leaveMeeting = () => {
    // Generate post-meeting summary stats before resetting state
    if (isInCall && roomId) {
      const duration = callStartTimeRef.current
        ? Math.max(1, Math.round((Date.now() - callStartTimeRef.current) / 1000))
        : 0;
      const stats: MeetingSummaryStats = {
        roomId,
        durationSeconds: duration,
        totalParticipants: Math.max(peakParticipantsRef.current, participants.length + 1),
        tasksCreated: tasks.length,
        tasksCompleted: tasks.filter((t) => t.completed).length,
        notesWordCount: sharedNotes.trim().split(/\s+/).filter(Boolean).length,
        messagesCount: messages.length,
        leftAt: Date.now(),
      };
      setSummaryStats(stats);
    }

    callStartTimeRef.current = null;
    peakParticipantsRef.current = 1;

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
    }
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    if (vadTrackRef.current) {
      vadTrackRef.current.stop();
      vadTrackRef.current = null;
    }
    if (vadAudioCtxRef.current && vadAudioCtxRef.current.state !== 'closed') {
      vadAudioCtxRef.current.close().catch(() => {});
      vadAudioCtxRef.current = null;
    }
    if (vadAnimFrameRef.current) {
      cancelAnimationFrame(vadAnimFrameRef.current);
      vadAnimFrameRef.current = null;
    }
    setIsTalkingWhileMuted(false);

    setIsInCall(false);
    setParticipants([]);
    setMessages([]);
    setReactions([]);
    setCaptions([]);
    setIsScreenSharing(false);
    setIsHandRaised(false);
    setPinnedSocketId(null);
  };

  // Toggle Audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMutedState = !audioTrack.enabled;
        setIsAudioMuted(newMutedState);

        if (socket && roomId) {
          socket.emit('update-media-state', {
            roomId,
            audioMuted: newMutedState,
          });
        }
      }
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newMutedState = !videoTrack.enabled;
        setIsVideoMuted(newMutedState);

        if (socket && roomId) {
          socket.emit('update-media-state', {
            roomId,
            videoMuted: newMutedState,
          });
        }
      }
    }
  };

  // Toggle Screen Share with Audio
  const toggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      // Stop sharing
      screenStream.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);

      // Restore camera track in peer connections and renegotiate
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        for (const [peerSocketId, pc] of peerConnections.current.entries()) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender && videoTrack) {
            await videoSender.replaceTrack(videoTrack).catch(() => {});
          }
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('signal-offer', { to: peerSocketId, offer });
          } catch (e) {
            console.warn('Renegotiation offer error on stop:', e);
          }
        }
      }

      if (socket && roomId) {
        socket.emit('update-media-state', { roomId, screenSharing: false });
      }
    } else {
      // Start sharing with audio support
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
          } as MediaTrackConstraints,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        const screenVideoTrack = displayStream.getVideoTracks()[0];
        const screenAudioTrack = displayStream.getAudioTracks()[0];

        // Replace track in all peer connections and renegotiate
        for (const [peerSocketId, pc] of peerConnections.current.entries()) {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender && screenVideoTrack) {
            await videoSender.replaceTrack(screenVideoTrack).catch(() => {});
          }

          if (screenAudioTrack) {
            try {
              pc.addTrack(screenAudioTrack, displayStream);
            } catch {
              // track might already be added
            }
          }

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket?.emit('signal-offer', { to: peerSocketId, offer });
          } catch (e) {
            console.warn('Renegotiation offer error on start:', e);
          }
        }

        screenVideoTrack.onended = () => {
          toggleScreenShare();
        };

        setScreenStream(displayStream);
        setIsScreenSharing(true);

        if (socket && roomId) {
          socket.emit('update-media-state', { roomId, screenSharing: true });
        }
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) soundEffects.playHandRaise();
    if (socket && roomId) {
      socket.emit('toggle-hand', { roomId, isRaised: nextState });
    }
  };

  // Lower All Hands (Host)
  const lowerAllHands = () => {
    if (socket && roomId) {
      socket.emit('lower-all-hands', { roomId });
    }
  };

  // Send Reaction
  const sendReaction = (emoji: string) => {
    soundEffects.playReactionPop();
    const newReaction: ReactionItem = {
      id: crypto.randomUUID(),
      emoji,
      senderName: userName,
      socketId: socket?.id || 'self',
      timestamp: Date.now(),
      leftOffset: 20 + Math.random() * 60,
    };
    setReactions((prev) => [...prev, newReaction]);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2900);

    if (socket && roomId) {
      socket.emit('send-reaction', { roomId, emoji, senderName: userName });
    }
  };

  // Send Chat Message
  const sendMessage = (text: string) => {
    if (!text.trim() || !socket || !roomId) return;
    socket.emit('send-message', { roomId, text, senderName: userName });
  };

  const togglePinMessage = (id: string, isPinned: boolean) => {
    if (!socket || !roomId) return;
    socket.emit('toggle-pin-message', { roomId, messageId: id, isPinned });
  };

  // Shared Notes
  const updateSharedNotes = (newNotes: string) => {
    setSharedNotes(newNotes);
    if (socket && roomId) {
      socket.emit('update-shared-notes', { roomId, notes: newNotes, updatedBy: userName });
    }
  };

  // Tasks
  const addTask = (text: string, priority: 'high' | 'medium' | 'low' = 'medium', assignee?: string) => {
    if (!text.trim()) return;
    const newTask: TaskItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      assignee: assignee || userName,
      createdAt: Date.now(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    if (socket && roomId) {
      socket.emit('update-shared-tasks', { roomId, tasks: updated });
    }
  };

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) soundEffects.playTaskCompleted();
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    setTasks(updated);
    if (socket && roomId) {
      socket.emit('update-shared-tasks', { roomId, tasks: updated });
    }
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    if (socket && roomId) {
      socket.emit('update-shared-tasks', { roomId, tasks: updated });
    }
  };

  // Captions
  const toggleCaptions = () => {
    setIsCaptionsEnabled((prev) => !prev);
  };

  const broadcastCaption = (text: string, isFinal: boolean) => {
    if (!socket || !roomId || !text.trim()) return;
    socket.emit('send-caption', { roomId, text, speakerName: userName, isFinal });
  };

  // Host Controls & Moderation
  const muteAllParticipants = () => {
    if (socket && roomId) {
      socket.emit('mute-all-participants', { roomId });
    }
  };

  const kickParticipant = (targetSocketId: string) => {
    if (socket && roomId) {
      socket.emit('kick-participant', { roomId, targetSocketId });
    }
  };

  const toggleRoomLock = () => {
    if (socket && roomId) {
      socket.emit('toggle-room-lock', { roomId, isLocked: !isRoomLocked });
    }
  };

  const admitGuest = (guestSocketId: string) => {
    if (socket && roomId) {
      socket.emit('admit-guest', { roomId, guestSocketId });
    }
  };

  const denyGuest = (guestSocketId: string) => {
    if (socket && roomId) {
      socket.emit('deny-guest', { roomId, guestSocketId });
    }
  };

  return (
    <WebRTCContext.Provider
      value={{
        socket,
        roomId,
        isInCall,
        isHost,
        userName,
        setUserName,
        isReconnecting,
        kickedReason,
        clearKickedReason,
        joinErrorMessage,
        clearJoinErrorMessage,
        actionNotice,
        isTalkingWhileMuted,
        isRoomLocked,
        toggleRoomLock,
        waitingGuests,
        admitGuest,
        denyGuest,
        knockStatus,
        cancelKnock,
        summaryStats,
        clearSummaryStats,
        localStream,
        screenStream,
        isAudioMuted,
        isVideoMuted,
        isScreenSharing,
        activeSpeakerSocketId,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        initializeMedia,
        participants,
        pinnedSocketId,
        setPinnedSocketId,
        isHandRaised,
        toggleHandRaise,
        lowerAllHands,
        messages,
        sendMessage,
        togglePinMessage,
        reactions,
        sendReaction,
        sharedNotes,
        updateSharedNotes,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        captions,
        isCaptionsEnabled,
        toggleCaptions,
        broadcastCaption,
        activeSidebar,
        setActiveSidebar,
        layoutMode,
        setLayoutMode,
        joinMeeting,
        leaveMeeting,
        muteAllParticipants,
        kickParticipant,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
