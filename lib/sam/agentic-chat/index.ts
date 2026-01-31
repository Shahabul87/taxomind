// Agentic Chat Integration Layer
// Bridges @sam-ai/agentic capabilities with the chat-enhanced API route

export { classifyIntent } from './intent-classifier';
export { AgenticChatProcessor } from './processor';
export { composeAgenticResponse } from './response-composer';
export { CoordinatorBridge, getCoordinatorBridge } from './coordinator-bridge';

export type {
  IntentType,
  ClassifiedIntent,
  AgenticChatData,
  AgenticToolResult,
  GoalContext,
  InterventionContext,
  ConfidenceContext,
  AgenticOptions,
} from './types';

export { AgenticOptionsSchema } from './types';
