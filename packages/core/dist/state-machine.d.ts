/**
 * @sam-ai/core - State Machine
 * Unified state management for SAM AI Tutor
 */
import type { SAMContext, SAMMessage, SAMAction, SAMPageContext, SAMFormContext, SAMGamificationContext } from './types';
export type SAMState = 'idle' | 'ready' | 'listening' | 'processing' | 'streaming' | 'analyzing' | 'executing' | 'error';
export type SAMEventType = 'INITIALIZE' | 'OPEN' | 'CLOSE' | 'MINIMIZE' | 'MAXIMIZE' | 'SEND_MESSAGE' | 'RECEIVE_RESPONSE' | 'START_STREAMING' | 'STREAM_CHUNK' | 'END_STREAMING' | 'UPDATE_CONTEXT' | 'UPDATE_PAGE' | 'UPDATE_FORM' | 'UPDATE_GAMIFICATION' | 'EXECUTE_ACTION' | 'ACTION_COMPLETE' | 'ANALYZE' | 'ANALYSIS_COMPLETE' | 'ERROR' | 'RESET' | 'CLEAR_CONVERSATION';
export interface SAMEvent {
    type: SAMEventType;
    payload?: unknown;
    timestamp?: Date;
}
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
    payload: {
        content: string;
        messageId: string;
    };
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
    payload: {
        type: string;
        targetId?: string;
        data?: unknown;
    };
}
export interface ErrorEvent extends SAMEvent {
    type: 'ERROR';
    payload: {
        error: Error;
        recoverable: boolean;
    };
}
export type SAMStateListener = (state: SAMState, context: SAMContext, event: SAMEvent) => void;
export declare class SAMStateMachine {
    private state;
    private context;
    private listeners;
    private _streamingMessageId;
    private streamingContent;
    get streamingMessageId(): string | null;
    constructor(initialContext?: Partial<SAMContext>);
    /**
     * Get current state
     */
    getState(): SAMState;
    /**
     * Get current context
     */
    getContext(): SAMContext;
    /**
     * Get a snapshot of state and context
     */
    getSnapshot(): {
        state: SAMState;
        context: SAMContext;
    };
    /**
     * Send an event to the state machine
     */
    send(event: SAMEvent): void;
    /**
     * Subscribe to state changes
     */
    subscribe(listener: SAMStateListener): () => void;
    /**
     * Check if in a specific state
     */
    isInState(state: SAMState): boolean;
    /**
     * Check if SAM is busy (processing, streaming, analyzing, executing)
     */
    isBusy(): boolean;
    /**
     * Check if SAM can accept user input
     */
    canAcceptInput(): boolean;
    private transition;
    private transitionFromIdle;
    private transitionFromReady;
    private transitionFromListening;
    private transitionFromProcessing;
    private transitionFromStreaming;
    private transitionFromAnalyzing;
    private transitionFromExecuting;
    private transitionFromError;
    private handleOpen;
    private handleClose;
    private handleMinimize;
    private handleSendMessage;
    private handleReceiveResponse;
    private handleStartStreaming;
    private handleStreamChunk;
    private handleEndStreaming;
    private handleAnalysisComplete;
    private handleError;
    private handleReset;
    private handleClearConversation;
    private handleUpdateContext;
    private handleUpdatePage;
    private handleUpdateForm;
    private handleUpdateGamification;
    private notify;
    private generateId;
}
export declare function createStateMachine(initialContext?: Partial<SAMContext>): SAMStateMachine;
//# sourceMappingURL=state-machine.d.ts.map