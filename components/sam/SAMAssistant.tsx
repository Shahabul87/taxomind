"use client";

/**
 * SAMAssistant - Thin wrapper for backward compatibility.
 *
 * The full implementation lives in components/sam/chat/ChatWindow.tsx.
 * This file preserves the public API expected by SAMAssistantWrapper.tsx:
 *   - Named export: SAMAssistant (component)
 *   - Named export: updateOrchestrationState
 *   - Named export: clearOrchestrationState
 */

export { ChatWindow as SAMAssistant } from './chat/ChatWindow';
export { updateOrchestrationState, clearOrchestrationState } from './chat/hooks/use-orchestration';
export type { SAMAssistantProps } from './chat/types';
