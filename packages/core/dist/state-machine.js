/**
 * @sam-ai/core - State Machine
 * Unified state management for SAM AI Tutor
 */
import { createDefaultContext } from './types';
// ============================================================================
// STATE MACHINE IMPLEMENTATION
// ============================================================================
export class SAMStateMachine {
    state = 'idle';
    context;
    listeners = new Set();
    _streamingMessageId = null;
    streamingContent = '';
    // Getter for streaming message ID (used for future streaming support)
    get streamingMessageId() {
        return this._streamingMessageId;
    }
    constructor(initialContext) {
        this.context = createDefaultContext(initialContext);
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Get current context
     */
    getContext() {
        return this.context;
    }
    /**
     * Get a snapshot of state and context
     */
    getSnapshot() {
        return {
            state: this.state,
            context: this.context,
        };
    }
    /**
     * Send an event to the state machine
     */
    send(event) {
        const eventWithTimestamp = {
            ...event,
            timestamp: event.timestamp ?? new Date(),
        };
        const previousState = this.state;
        const previousContext = this.context;
        // Perform transition
        const [nextState, nextContext] = this.transition(this.state, eventWithTimestamp, this.context);
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
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Check if in a specific state
     */
    isInState(state) {
        return this.state === state;
    }
    /**
     * Check if SAM is busy (processing, streaming, analyzing, executing)
     */
    isBusy() {
        return ['processing', 'streaming', 'analyzing', 'executing'].includes(this.state);
    }
    /**
     * Check if SAM can accept user input
     */
    canAcceptInput() {
        return ['ready', 'listening'].includes(this.state);
    }
    // ============================================================================
    // STATE TRANSITIONS
    // ============================================================================
    transition(state, event, context) {
        // Handle global events (can happen in any state)
        switch (event.type) {
            case 'UPDATE_CONTEXT':
                return [state, this.handleUpdateContext(context, event.payload)];
            case 'UPDATE_PAGE':
                return [state, this.handleUpdatePage(context, event.payload)];
            case 'UPDATE_FORM':
                return [state, this.handleUpdateForm(context, event.payload)];
            case 'UPDATE_GAMIFICATION':
                return [state, this.handleUpdateGamification(context, event.payload)];
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
    transitionFromIdle(event, context) {
        switch (event.type) {
            case 'INITIALIZE':
                return ['ready', context];
            case 'OPEN':
                return ['listening', this.handleOpen(context)];
            default:
                return ['idle', context];
        }
    }
    transitionFromReady(event, context) {
        switch (event.type) {
            case 'OPEN':
                return ['listening', this.handleOpen(context)];
            case 'SEND_MESSAGE':
                // Allow sending message even when UI is closed
                return ['processing', this.handleSendMessage(context, event.payload)];
            case 'ANALYZE':
                return ['analyzing', context];
            default:
                return ['ready', context];
        }
    }
    transitionFromListening(event, context) {
        switch (event.type) {
            case 'CLOSE':
                return ['ready', this.handleClose(context)];
            case 'MINIMIZE':
                return ['listening', this.handleMinimize(context)];
            case 'SEND_MESSAGE':
                return ['processing', this.handleSendMessage(context, event.payload)];
            case 'ANALYZE':
                return ['analyzing', context];
            case 'EXECUTE_ACTION':
                return ['executing', context];
            default:
                return ['listening', context];
        }
    }
    transitionFromProcessing(event, context) {
        switch (event.type) {
            case 'RECEIVE_RESPONSE':
                return ['listening', this.handleReceiveResponse(context, event.payload)];
            case 'START_STREAMING':
                this._streamingMessageId = event.payload.messageId;
                this.streamingContent = '';
                return ['streaming', this.handleStartStreaming(context)];
            case 'ERROR':
                return ['error', this.handleError(context, event.payload)];
            default:
                return ['processing', context];
        }
    }
    transitionFromStreaming(event, context) {
        switch (event.type) {
            case 'STREAM_CHUNK':
                return ['streaming', this.handleStreamChunk(context, event.payload)];
            case 'END_STREAMING':
                const finalContext = this.handleEndStreaming(context);
                this._streamingMessageId = null;
                this.streamingContent = '';
                return ['listening', finalContext];
            case 'ERROR':
                this._streamingMessageId = null;
                this.streamingContent = '';
                return ['error', this.handleError(context, event.payload)];
            default:
                return ['streaming', context];
        }
    }
    transitionFromAnalyzing(event, context) {
        switch (event.type) {
            case 'ANALYSIS_COMPLETE':
                return ['listening', this.handleAnalysisComplete(context, event.payload)];
            case 'ERROR':
                return ['error', this.handleError(context, event.payload)];
            default:
                return ['analyzing', context];
        }
    }
    transitionFromExecuting(event, context) {
        switch (event.type) {
            case 'ACTION_COMPLETE':
                return ['listening', context];
            case 'ERROR':
                return ['error', this.handleError(context, event.payload)];
            default:
                return ['executing', context];
        }
    }
    transitionFromError(event, context) {
        switch (event.type) {
            case 'RESET':
                return ['ready', this.handleReset(context)];
            case 'OPEN':
                return ['listening', this.handleOpen(context)];
            case 'SEND_MESSAGE':
                return ['processing', this.handleSendMessage(context, event.payload)];
            default:
                return ['error', context];
        }
    }
    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    handleOpen(context) {
        return {
            ...context,
            ui: {
                ...context.ui,
                isOpen: true,
                isMinimized: false,
            },
        };
    }
    handleClose(context) {
        return {
            ...context,
            ui: {
                ...context.ui,
                isOpen: false,
            },
        };
    }
    handleMinimize(context) {
        return {
            ...context,
            ui: {
                ...context.ui,
                isMinimized: true,
            },
        };
    }
    handleSendMessage(context, content) {
        const message = {
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
    handleReceiveResponse(context, message) {
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
    handleStartStreaming(context) {
        return {
            ...context,
            conversation: {
                ...context.conversation,
                isStreaming: true,
            },
        };
    }
    handleStreamChunk(context, payload) {
        this.streamingContent += payload.content;
        // Find and update the streaming message, or add it if not present
        const messages = [...context.conversation.messages];
        const existingIndex = messages.findIndex((m) => m.id === payload.messageId);
        if (existingIndex >= 0) {
            messages[existingIndex] = {
                ...messages[existingIndex],
                content: this.streamingContent,
            };
        }
        else {
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
    handleEndStreaming(context) {
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
    handleAnalysisComplete(context, payload) {
        // Add analysis result as a system message
        const message = {
            id: this.generateId(),
            role: 'assistant',
            content: 'Analysis complete.',
            timestamp: new Date(),
            metadata: {
                engineInsights: payload,
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
    handleError(context, payload) {
        const message = {
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
    handleReset(context) {
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
    handleClearConversation(context) {
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
    handleUpdateContext(context, partial) {
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
    handleUpdatePage(context, page) {
        return {
            ...context,
            page: {
                ...context.page,
                ...page,
            },
        };
    }
    handleUpdateForm(context, form) {
        return {
            ...context,
            form,
        };
    }
    handleUpdateGamification(context, gamification) {
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
    notify(event) {
        for (const listener of this.listeners) {
            try {
                listener(this.state, this.context, event);
            }
            catch (error) {
                console.error('SAMStateMachine: Listener error', error);
            }
        }
    }
    generateId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createStateMachine(initialContext) {
    return new SAMStateMachine(initialContext);
}
//# sourceMappingURL=state-machine.js.map