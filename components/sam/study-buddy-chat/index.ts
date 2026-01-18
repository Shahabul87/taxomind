/**
 * Study Buddy Chat Components
 *
 * Real-time collaborative study system with chat, sessions,
 * and buddy discovery features.
 *
 * @module components/sam/study-buddy-chat
 */

export { StudyBuddyChat } from './StudyBuddyChat';
export type { StudyBuddyChatProps, StudyBuddy, Conversation } from './StudyBuddyChat';

export { ChatRoom } from './ChatRoom';
export type {
  ChatRoomProps,
  ChatMessage,
  ChatParticipant,
  MessageStatus,
} from './ChatRoom';

export { StudySession } from './StudySession';
export type {
  StudySessionProps,
  StudySessionData,
  SessionStatus,
  SessionGoal,
  SessionResource,
  SessionParticipant,
} from './StudySession';

// Default export for convenience
export { StudyBuddyChat as default } from './StudyBuddyChat';
