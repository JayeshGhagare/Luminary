// Named constants for Luminary meeting platform

export const VOLUME_ACTIVE_THRESHOLD = 16;
export const VOLUME_SILENCE_THRESHOLD = 5;
export const SPEAKING_EMIT_THROTTLE_MS = 160;

export const REACTION_TTL_MS = 2900;
export const ROOM_DESTROY_GRACE_MS = 300000; // 5 minutes
export const MAX_PARTICIPANTS = 25;
export const TASK_UNDO_TIMEOUT_MS = 5000;
export const NOTES_DEBOUNCE_MS = 350;

export const DEFAULT_NOTES_TEMPLATE = `# Meeting Notes
- Agenda:
  - Introductions
  - Discussion
  - Action items
`;

export const REACTION_EMOJIS = ['💖', '👍', '🎉', '👏', '😂', '😮', '😢', '🤔', '👎'] as const;
