// =============================================================================
// SAM Chat - Public API
// =============================================================================

// Root container
export { ChatWindow } from './ChatWindow';

// UI Components
export { ChatHeader } from './ChatHeader';
export { InfoDrawer } from './InfoDrawer';
export { MessageArea } from './MessageArea';
export { MessageBubble } from './MessageBubble';
export { TypingIndicator } from './TypingIndicator';
export { SuggestionChips } from './SuggestionChips';
export { ChatInput } from './ChatInput';
export { FloatingButton } from './FloatingButton';

// Panels
export { ProgressPanel } from './panels/ProgressPanel';
export { ToolsPanel } from './panels/ToolsPanel';
export { MemoryPanel } from './panels/MemoryPanel';

// Hooks
export { useDragResize } from './hooks/use-drag-resize';
export { useChatWindow } from './hooks/use-chat-window';
// Page utilities (pure functions, no hooks)
export { detectPageName, getPageCapabilities, buildBreadcrumbs } from './utils/page-utils';
export { useSendMessage } from './hooks/use-send-message';
export { useOrchestration } from './hooks/use-orchestration';
export { useChatTools } from './hooks/use-tools';
export { useGamification } from './hooks/use-gamification';
export { useSelfCritique } from './hooks/use-self-critique';
export { useProactiveFeatures } from './hooks/use-proactive-features';
export { useBehaviorTracking } from './hooks/use-behavior-tracking';
export { useFormDetection } from './hooks/use-form-detection';
export { useMessageActions } from './hooks/use-message-actions';

// Types
export type {
  WindowState,
  ThemeMode,
  InfoDrawerTab,
  ResizeHandle,
  WindowPosition,
  WindowSize,
  ChatMessage,
  SAMSuggestion,
  SAMAction,
  PageContext,
  WindowCourseContext,
  EntityContextState,
  SAMInsights,
  ProactiveCheckIn,
  ProactiveIntervention,
  ToolSummary,
  ToolExecutionResult,
  ToolConfirmation,
  ToolStatus,
  OrchestrationInsight,
  OrchestrationContextInput,
  XPProgress,
  SelfCritiqueData,
  SAMAssistantProps,
} from './types';
