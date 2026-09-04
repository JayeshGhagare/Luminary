export type ThemeMode = 'crimson' | 'crimson-light' | 'cinematic' | 'midnight' | 'dark' | 'light';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  tagline: string;
  badge: string;
  previewBg: string;
  previewAccent: string;
  previewText: string;
  description: string;
}

export interface Participant {
  socketId: string;
  id: string;
  name: string;
  avatar?: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  handRaisedTime: number | null;
  isHost: boolean;
  stream?: MediaStream;
  screenStream?: MediaStream;
  volumeLevel?: number; // 0 to 100 for active speaker ring
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  timestamp: number;
  isPinned: boolean;
}

export interface ReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  socketId: string;
  timestamp: number;
  leftOffset?: number; // percentage across screen for organic floating
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

export type SidebarTab = 'none' | 'people' | 'chat' | 'notes' | 'activities' | 'info' | 'host';

export type LayoutMode = 'auto' | 'tiled' | 'spotlight' | 'sidebar';

export interface CaptionItem {
  socketId: string;
  speakerName: string;
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface WaitingGuest {
  socketId: string;
  name: string;
  avatar?: string;
  timestamp: number;
}

export interface MeetingSummaryStats {
  roomId: string;
  durationSeconds: number;
  totalParticipants: number;
  tasksCreated: number;
  tasksCompleted: number;
  notesWordCount: number;
  messagesCount: number;
  leftAt: number;
}

