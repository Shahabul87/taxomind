/**
 * @sam-ai/core - State Machine
 * Unified state management for SAM AI Tutor
 */

import type {
  SAMContext,
  SAMMessage,
  SAMAction,
  SAMPageContext,
  SAMFormContext,
  SAMGamificationContext,
} from './types';
import { createDefaultContext } from './types';

// ============================================================================
// STATE TYPES
// ============================================================================

export type SAMState =
  | 'idle'
  | 'ready'
  | 'listening'
  | 'processing'
  | 'streaming'
  | 'analyzing'
  | 'executing'
  | 'error';

export type SAMEventType =
  | 'INITIALIZE'
  | 'OPEN'
  | 'CLOSE'
  | 'MINIMIZE'
  | 'MAXIMIZE'
  | 'SEND_MESSAGE'
  | 'RECEIVE_RESPONSE'
  | 'START_STREAMING'
  | 'STREAM_CHUNK'
  | 'END_STREAMING'
  | 'UPDATE_CONTEXT'
  | 'UPDATE_PAGE'
  | 'UPDATE_FORM'
  | 'UPDATE_GAMIFICATION'
  | 'EXECUTE_ACTION'
  | 'ACTION_COMPLETE'
  | 'ANALYZE'
  | 'ANALYSIS_COMPLETE'
  | 'ERROR'
  | 'RESET'
  | 'CLEAR_CONVERSATION';

export interface SAMEvent {
  type: SAMEventType;
  payload?: unknown;
  timestamp?: Date;
}

// Specific event payloads
export interface SendMessageEvent extends SAMEvent {
  type: 'SEND_MESSAGE';
  payload: string;
}

export interface ReceiveResponseEvent extends SAMEvent {
  type: 'RECEIVE_RESPONSE';
  payload: SAMMessage;
}

export interface StreamChunkEvent extends SAMEvent {
  type: 'STREAM_CHUNK';
  payload: { content: string; messageId: string };
}

export interface UpdateContextEvent extends SAMEvent {
  type: 'UPDATE_CONTEXT';
  payload: Partial<SAMContext>;
}

export interface UpdatePageEvent extends SAMEvent {
  type: 'UPDATE_PAGE';
  payload: Partial<SAMPageContext>;
}

export interface UpdateFormEvent extends SAMEvent {
  type: 'UPDATE_FORM';
  payload: SAMFormContext | null;
}

export interface UpdateGamificationEvent extends SAMEvent {
  type: 'UPDATE_GAMIFICATION';
  payload: Partial<SAMGamificationContext>;
}

export interface ExecuteActionEvent extends SAMEvent {
  type: 'EXECUTE_ACTION';
  payload: SAMAction;
}

export interface AnalyzeEvent extends SAMEvent {
  type: 'ANALYZE';
  payload: { type: string; targetId?: string; data?: unknown };
}

export interface ErrorEvent extends SAMEvent {
  type: 'ERROR';
  payload: { error: Error; recoverable: boolean };
}

// ============================================================================
// STATE MACHINE LISTENER
// ============================================================================

export type SAMStateListener = (
  state: SAMState,
  context: SAMContext,
  event: SAMEvent
) => void;

// ============================================================================
// STATE MACHINE IMPLEMENTATION
// ============================================================================

export class SAMStateMachine {
  private state: SAMState = 'idle';
  private context: SAMContext;
  private listeners: Set<SAMStateListener> = new Set();
  private _streamingMessageId: string | null = null;
  private streamingContent: string = '';

  // Getter for streaming message ID (used for future streaming support)
  get streamingMessageId(): string | null {
    return this._streamingMessageId;
  }

  constructor(initialContext?: Partial<SAMContext>) {
    this.context = createDefaultContext(initialContext);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get current state
   */
  getState(): SAMState {
    return this.state;
  }

  /**
   * Get current context
   */
  getContext(): SAMContext {
    return this.context;
  }

  /**
   * Get a snapshot of state and context
   */
  getSnapshot(): { state: SAMState; context: SAMContext } {
    return {
      state: this.state,
      context: this.context,
    };
  }

  /**
   * Send an event to the state machine
   */
  send(event: SAMEvent): void {
    const eventWithTimestamp: SAMEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date(),
    };

    const previousState = this.state;
    const previousContext = this.context;

    // Perform transition
    const [nextState, nextContext] = this.transition(
      this.state,
      eventWithTimestamp,
      this.context
    );

    // Update if changed
    if (nextState !== previousState || nextContext !== previousContext) {
      this.state = nextState;
      this.context = {
        ...nextContext,
        metadata: {
          ...nextContext.metadata,
          lastActivityAt: new Date(),
        },
      };
      this.notify(eventWithTimestamp);
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: SAMStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if in a specific state
   */
  isInState(state: SAMState): boolean {
    return this.state === state;
  }

  /**
   * Check if SAM is busy (processing, streaming, analyzing, executing)
   */
  isBusy(): boolean {
    return ['processing', 'streaming', 'analyzing', 'executing'].includes(this.state);
  }

  /**
   * Check if SAM can accept user input
   */
  canAcceptInput(): boolean {
    return ['ready', 'listening'].includes(this.state);
  }

  // ============================================================================
  // STATE TRANSITIONS
  // ============================================================================

  private transition(
    state: SAMState,
    event: SAMEvent,
    context: SAMContext
  ): [SAMState, SAMContext] {
    // Handle global events (can happen in any state)
    switch (event.type) {
      case 'UPDATE_CONTEXT':
        return [state, this.handleUpdateContext(context, event.payload as Partial<SAMContext>)];

      case 'UPDATE_PAGE':
        return [state, this.handleUpdatePage(context, event.payload as Partial<SAMPageContext>)];

      case 'UPDATE_FORM':
        return [state, this.handleUpdateForm(context, event.payload as SAMFormContext | null)];

      case 'UPDATE_GAMIFICATION':
        return [state, this.handleUpdateGamification(context, event.payload as Partial<SAMGamificationContext>)];

      case 'RESET':
        return ['ready', this.handleReset(context)];

      case 'CLEAR_CONVERSATION':
        return [state, this.handleClearConversation(context)];
    }

    // State-specific transitions
    switch (state) {
      case 'idle':
        return this.transitionFromIdle(event, context);

      case 'ready':
        return this.transitionFromReady(event, context);

      case 'listening':
        return this.transitionFromListening(event, context);

      case 'processing':
        return this.transitionFromProcessing(event, context);

      case 'streaming':
        return this.transitionFromStreaming(event, context);

      case 'analyzing':
        return this.transitionFromAnalyzing(event, context);

      case 'executing':
        return this.transitionFromExecuting(event, context);

      case 'error':
        return this.transitionFromError(event, context);

      default:
        return [state, context];
    }
  }

  private transitionFromIdle(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'INITIALIZE':
        return ['ready', context];

      case 'OPEN':
        return ['listening', this.handleOpen(context)];

      default:
        return ['idle', context];
    }
  }

  private transitionFromReady(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'OPEN':
        return ['listening', this.handleOpen(context)];

      case 'SEND_MESSAGE':
        // Allow sending message even when UI is closed
        return ['processing', this.handleSendMessage(context, event.payload as string)];

      case 'ANALYZE':
        return ['analyzing', context];

      default:
        return ['ready', context];
    }
  }

  private transitionFromListening(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'CLOSE':
        return ['ready', this.handleClose(context)];

      case 'MINIMIZE':
        return ['listening', this.handleMinimize(context)];

      case 'SEND_MESSAGE':
        return ['processing', this.handleSendMessage(context, event.payload as string)];

      case 'ANALYZE':
        return ['analyzing', context];

      case 'EXECUTE_ACTION':
        return ['executing', context];

      default:
        return ['listening', context];
    }
  }

  private transitionFromProcessing(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'RECEIVE_RESPONSE':
        return ['listening', this.handleReceiveResponse(context, event.payload as SAMMessage)];

      case 'START_STREAMING':
        this._streamingMessageId = (event.payload as { messageId: string }).messageId;
        this.streamingContent = '';
        return ['streaming', this.handleStartStreaming(context)];

      case 'ERROR':
        return ['error', this.handleError(context, event.payload as ErrorEvent['payload'])];

      default:
        return ['processing', context];
    }
  }

  private transitionFromStreaming(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'STREAM_CHUNK':
        return ['streaming', this.handleStreamChunk(context, event.payload as StreamChunkEvent['payload'])];

      case 'END_STREAMING':
        const finalContext = this.handleEndStreaming(context);
        this._streamingMessageId = null;
        this.streamingContent = '';
        return ['listening', finalContext];

      case 'ERROR':
        this._streamingMessageId = null;
        this.streamingContent = '';
        return ['error', this.handleError(context, event.payload as ErrorEvent['payload'])];

      default:
        return ['streaming', context];
    }
  }

  private transitionFromAnalyzing(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'ANALYSIS_COMPLETE':
        return ['listening', this.handleAnalysisComplete(context, event.payload)];

      case 'ERROR':
        return ['error', this.handleError(context, event.payload as ErrorEvent['payload'])];

      default:
        return ['analyzing', context];
    }
  }

  private transitionFromExecuting(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'ACTION_COMPLETE':
        return ['listening', context];

      case 'ERROR':
        return ['error', this.handleError(context, event.payload as ErrorEvent['payload'])];

      default:
        return ['executing', context];
    }
  }

  private transitionFromError(event: SAMEvent, context: SAMContext): [SAMState, SAMContext] {
    switch (event.type) {
      case 'RESET':
        return ['ready', this.handleReset(context)];

      case 'OPEN':
        return ['listening', this.handleOpen(context)];

      case 'SEND_MESSAGE':
        return ['processing', this.handleSendMessage(context, event.payload as string)];

      default:
        return ['error', context];
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private handleOpen(context: SAMContext): SAMContext {
    return {
      ...context,
      ui: {
        ...context.ui,
        isOpen: true,
        isMinimized: false,
      },
    };
  }

  private handleClose(context: SAMContext): SAMContext {
    return {
      ...context,
      ui: {
        ...context.ui,
        isOpen: false,
      },
    };
  }

  private handleMinimize(context: SAMContext): SAMContext {
    return {
      ...context,
      ui: {
        ...context.ui,
        isMinimized: true,
      },
    };
  }

  private handleSendMessage(context: SAMContext, content: string): SAMContext {
    const message: SAMMessage = {
      id: this.generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: new Date(),
        totalMessages: context.conversation.totalMessages + 1,
      },
    };
  }

  private handleReceiveResponse(context: SAMContext, message: SAMMessage): SAMContext {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: new Date(),
        totalMessages: context.conversation.totalMessages + 1,
        isStreaming: false,
      },
    };
  }

  private handleStartStreaming(context: SAMContext): SAMContext {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        isStreaming: true,
      },
    };
  }

  private handleStreamChunk(
    context: SAMContext,
    payload: { content: string; messageId: string }
  ): SAMContext {
    this.streamingContent += payload.content;

    // Find and update the streaming message, or add it if not present
    const messages = [...context.conversation.messages];
    const existingIndex = messages.findIndex((m) => m.id === payload.messageId);

    if (existingIndex >= 0) {
      messages[existingIndex] = {
        ...messages[existingIndex],
        content: this.streamingContent,
      };
    } else {
      messages.push({
        id: payload.messageId,
        role: 'assistant',
        content: this.streamingContent,
        timestamp: new Date(),
      });
    }

    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages,
      },
    };
  }

  private handleEndStreaming(context: SAMContext): SAMContext {
    return {
      ...context,
      conversation: {
        ...context.conversation,
        isStreaming: false,
        lastMessageAt: new Date(),
        totalMessages: context.conversation.totalMessages + 1,
      },
    };
  }

  private handleAnalysisComplete(context: SAMContext, payload: unknown): SAMContext {
    // Add analysis result as a system message
    const message: SAMMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: 'Analysis complete.',
      timestamp: new Date(),
      metadata: {
        engineInsights: payload as Record<string, unknown>,
      },
    };

    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        lastMessageAt: new Date(),
        totalMessages: context.conversation.totalMessages + 1,
      },
    };
  }

  private handleError(
    context: SAMContext,
    payload: { error: Error; recoverable: boolean }
  ): SAMContext {
    const message: SAMMessage = {
      id: this.generateId(),
      role: 'system',
      content: `Error: ${payload.error.message}`,
      timestamp: new Date(),
      metadata: {
        engineInsights: {
          error: true,
          recoverable: payload.recoverable,
        },
      },
    };

    return {
      ...context,
      conversation: {
        ...context.conversation,
        messages: [...context.conversation.messages, message],
        isStreaming: false,
      },
    };
  }

  private handleReset(context: SAMContext): SAMContext {
    return createDefaultContext({
      user: context.user,
      page: context.page,
      ui: { ...context.ui, isOpen: false },
      metadata: {
        ...context.metadata,
        lastActivityAt: new Date(),
      },
    });
  }

  private handleClearConversation(context: SAMContext): SAMContext {
    return {
      ...context,
      conversation: {
        id: null,
        messages: [],
        isStreaming: false,
        lastMessageAt: null,
        totalMessages: 0,
      },
    };
  }

  private handleUpdateContext(
    context: SAMContext,
    partial: Partial<SAMContext>
  ): SAMContext {
    return {
      ...context,
      ...partial,
      user: partial.user ? { ...context.user, ...partial.user } : context.user,
      page: partial.page ? { ...context.page, ...partial.page } : context.page,
      conversation: partial.conversation
        ? { ...context.conversation, ...partial.conversation }
        : context.conversation,
      gamification: partial.gamification
        ? { ...context.gamification, ...partial.gamification }
        : context.gamification,
      ui: partial.ui ? { ...context.ui, ...partial.ui } : context.ui,
    };
  }

  private handleUpdatePage(
    context: SAMContext,
    page: Partial<SAMPageContext>
  ): SAMContext {
    return {
      ...context,
      page: {
        ...context.page,
        ...page,
      },
    };
  }

  private handleUpdateForm(
    context: SAMContext,
    form: SAMFormContext | null
  ): SAMContext {
    return {
      ...context,
      form,
    };
  }

  private handleUpdateGamification(
    context: SAMContext,
    gamification: Partial<SAMGamificationContext>
  ): SAMContext {
    return {
      ...context,
      gamification: {
        ...context.gamification,
        ...gamification,
      },
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private notify(event: SAMEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state, this.context, event);
      } catch (error) {
        console.error('SAMStateMachine: Listener error', error);
      }
    }
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createStateMachine(
  initialContext?: Partial<SAMContext>
): SAMStateMachine {
  return new SAMStateMachine(initialContext);
}
