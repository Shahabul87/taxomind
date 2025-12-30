/**
 * @sam-ai/core - State Machine Tests
 * Tests for SAMStateMachine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SAMStateMachine,
  createStateMachine,
  type SAMState,
  type SAMEvent,
  type SAMStateListener,
} from '../state-machine';
import type { SAMContext, SAMMessage } from '../types';
import { createMockContext } from './setup';

describe('SAMStateMachine', () => {
  let stateMachine: SAMStateMachine;

  beforeEach(() => {
    stateMachine = new SAMStateMachine();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create state machine with default state', () => {
      expect(stateMachine.getState()).toBe('idle');
    });

    it('should create state machine with default context', () => {
      const context = stateMachine.getContext();
      expect(context.user).toBeDefined();
      expect(context.page).toBeDefined();
      expect(context.conversation).toBeDefined();
    });

    it('should accept initial context overrides', () => {
      const sm = new SAMStateMachine({
        user: { id: 'custom-user', role: 'teacher', preferences: {}, capabilities: [] },
      });

      expect(sm.getContext().user.id).toBe('custom-user');
      expect(sm.getContext().user.role).toBe('teacher');
    });
  });

  // ============================================================================
  // STATE QUERY TESTS
  // ============================================================================

  describe('state queries', () => {
    it('should return current state with getState()', () => {
      expect(stateMachine.getState()).toBe('idle');
    });

    it('should return current context with getContext()', () => {
      const context = stateMachine.getContext();
      expect(context).toBeDefined();
      expect(context.metadata).toBeDefined();
    });

    it('should return snapshot with state and context', () => {
      const snapshot = stateMachine.getSnapshot();
      expect(snapshot.state).toBe('idle');
      expect(snapshot.context).toBeDefined();
    });

    it('should check if in specific state with isInState()', () => {
      expect(stateMachine.isInState('idle')).toBe(true);
      expect(stateMachine.isInState('ready')).toBe(false);
    });

    it('should check if busy with isBusy()', () => {
      expect(stateMachine.isBusy()).toBe(false);

      stateMachine.send({ type: 'INITIALIZE' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'test' });

      expect(stateMachine.isBusy()).toBe(true);
    });

    it('should check if can accept input with canAcceptInput()', () => {
      expect(stateMachine.canAcceptInput()).toBe(false);

      stateMachine.send({ type: 'INITIALIZE' });
      expect(stateMachine.canAcceptInput()).toBe(true);

      stateMachine.send({ type: 'OPEN' });
      expect(stateMachine.canAcceptInput()).toBe(true);
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - IDLE STATE
  // ============================================================================

  describe('transitions from idle', () => {
    it('should transition to ready on INITIALIZE', () => {
      stateMachine.send({ type: 'INITIALIZE' });
      expect(stateMachine.getState()).toBe('ready');
    });

    it('should transition to listening on OPEN', () => {
      stateMachine.send({ type: 'OPEN' });
      expect(stateMachine.getState()).toBe('listening');
      expect(stateMachine.getContext().ui.isOpen).toBe(true);
    });

    it('should stay in idle for unknown events', () => {
      stateMachine.send({ type: 'CLOSE' });
      expect(stateMachine.getState()).toBe('idle');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - READY STATE
  // ============================================================================

  describe('transitions from ready', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'INITIALIZE' });
    });

    it('should transition to listening on OPEN', () => {
      stateMachine.send({ type: 'OPEN' });
      expect(stateMachine.getState()).toBe('listening');
      expect(stateMachine.getContext().ui.isOpen).toBe(true);
    });

    it('should transition to processing on SEND_MESSAGE', () => {
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
      expect(stateMachine.getState()).toBe('processing');
    });

    it('should transition to analyzing on ANALYZE', () => {
      stateMachine.send({ type: 'ANALYZE', payload: { type: 'blooms' } });
      expect(stateMachine.getState()).toBe('analyzing');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - LISTENING STATE
  // ============================================================================

  describe('transitions from listening', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
    });

    it('should transition to ready on CLOSE', () => {
      stateMachine.send({ type: 'CLOSE' });
      expect(stateMachine.getState()).toBe('ready');
      expect(stateMachine.getContext().ui.isOpen).toBe(false);
    });

    it('should stay in listening on MINIMIZE', () => {
      stateMachine.send({ type: 'MINIMIZE' });
      expect(stateMachine.getState()).toBe('listening');
      expect(stateMachine.getContext().ui.isMinimized).toBe(true);
    });

    it('should transition to processing on SEND_MESSAGE', () => {
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
      expect(stateMachine.getState()).toBe('processing');
    });

    it('should add user message to conversation on SEND_MESSAGE', () => {
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello SAM' });

      const messages = stateMachine.getContext().conversation.messages;
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Hello SAM');
    });

    it('should transition to analyzing on ANALYZE', () => {
      stateMachine.send({ type: 'ANALYZE', payload: { type: 'blooms' } });
      expect(stateMachine.getState()).toBe('analyzing');
    });

    it('should transition to executing on EXECUTE_ACTION', () => {
      stateMachine.send({
        type: 'EXECUTE_ACTION',
        payload: { id: '1', type: 'navigate', label: 'Go', payload: {} },
      });
      expect(stateMachine.getState()).toBe('executing');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - PROCESSING STATE
  // ============================================================================

  describe('transitions from processing', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
    });

    it('should transition to listening on RECEIVE_RESPONSE', () => {
      const message: SAMMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello! How can I help?',
        timestamp: new Date(),
      };

      stateMachine.send({ type: 'RECEIVE_RESPONSE', payload: message });
      expect(stateMachine.getState()).toBe('listening');
    });

    it('should add assistant message on RECEIVE_RESPONSE', () => {
      const message: SAMMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Response',
        timestamp: new Date(),
      };

      stateMachine.send({ type: 'RECEIVE_RESPONSE', payload: message });

      const messages = stateMachine.getContext().conversation.messages;
      expect(messages).toHaveLength(2);
      expect(messages[1].role).toBe('assistant');
    });

    it('should transition to streaming on START_STREAMING', () => {
      stateMachine.send({ type: 'START_STREAMING', payload: { messageId: 'msg-1' } });
      expect(stateMachine.getState()).toBe('streaming');
      expect(stateMachine.getContext().conversation.isStreaming).toBe(true);
    });

    it('should transition to error on ERROR', () => {
      stateMachine.send({
        type: 'ERROR',
        payload: { error: new Error('Test error'), recoverable: true },
      });
      expect(stateMachine.getState()).toBe('error');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - STREAMING STATE
  // ============================================================================

  describe('transitions from streaming', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
      stateMachine.send({ type: 'START_STREAMING', payload: { messageId: 'msg-1' } });
    });

    it('should update content on STREAM_CHUNK', () => {
      stateMachine.send({
        type: 'STREAM_CHUNK',
        payload: { content: 'Hello', messageId: 'msg-1' },
      });

      stateMachine.send({
        type: 'STREAM_CHUNK',
        payload: { content: ' World', messageId: 'msg-1' },
      });

      const messages = stateMachine.getContext().conversation.messages;
      const streamingMessage = messages.find((m) => m.id === 'msg-1');
      expect(streamingMessage?.content).toBe('Hello World');
    });

    it('should transition to listening on END_STREAMING', () => {
      stateMachine.send({ type: 'END_STREAMING' });
      expect(stateMachine.getState()).toBe('listening');
      expect(stateMachine.getContext().conversation.isStreaming).toBe(false);
    });

    it('should transition to error on ERROR', () => {
      stateMachine.send({
        type: 'ERROR',
        payload: { error: new Error('Stream error'), recoverable: true },
      });
      expect(stateMachine.getState()).toBe('error');
    });

    it('should expose streamingMessageId during streaming', () => {
      expect(stateMachine.streamingMessageId).toBe('msg-1');
    });

    it('should clear streamingMessageId on END_STREAMING', () => {
      stateMachine.send({ type: 'END_STREAMING' });
      expect(stateMachine.streamingMessageId).toBeNull();
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - ANALYZING STATE
  // ============================================================================

  describe('transitions from analyzing', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'ANALYZE', payload: { type: 'blooms' } });
    });

    it('should transition to listening on ANALYSIS_COMPLETE', () => {
      stateMachine.send({
        type: 'ANALYSIS_COMPLETE',
        payload: { insights: { score: 85 } },
      });
      expect(stateMachine.getState()).toBe('listening');
    });

    it('should add system message on ANALYSIS_COMPLETE', () => {
      stateMachine.send({
        type: 'ANALYSIS_COMPLETE',
        payload: { insights: { score: 85 } },
      });

      const messages = stateMachine.getContext().conversation.messages;
      expect(messages.some((m) => m.role === 'assistant')).toBe(true);
    });

    it('should transition to error on ERROR', () => {
      stateMachine.send({
        type: 'ERROR',
        payload: { error: new Error('Analysis error'), recoverable: true },
      });
      expect(stateMachine.getState()).toBe('error');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - EXECUTING STATE
  // ============================================================================

  describe('transitions from executing', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({
        type: 'EXECUTE_ACTION',
        payload: { id: '1', type: 'generate', label: 'Generate', payload: {} },
      });
    });

    it('should transition to listening on ACTION_COMPLETE', () => {
      stateMachine.send({ type: 'ACTION_COMPLETE' });
      expect(stateMachine.getState()).toBe('listening');
    });

    it('should transition to error on ERROR', () => {
      stateMachine.send({
        type: 'ERROR',
        payload: { error: new Error('Action error'), recoverable: true },
      });
      expect(stateMachine.getState()).toBe('error');
    });
  });

  // ============================================================================
  // STATE TRANSITION TESTS - ERROR STATE
  // ============================================================================

  describe('transitions from error', () => {
    beforeEach(() => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
      stateMachine.send({
        type: 'ERROR',
        payload: { error: new Error('Test'), recoverable: true },
      });
    });

    it('should add error message to conversation', () => {
      const messages = stateMachine.getContext().conversation.messages;
      const errorMsg = messages.find((m) => m.role === 'system');
      expect(errorMsg).toBeDefined();
      expect(errorMsg?.content).toContain('Error');
    });

    it('should transition to ready on RESET', () => {
      stateMachine.send({ type: 'RESET' });
      expect(stateMachine.getState()).toBe('ready');
    });

    it('should transition to listening on OPEN', () => {
      stateMachine.send({ type: 'OPEN' });
      expect(stateMachine.getState()).toBe('listening');
    });

    it('should transition to processing on SEND_MESSAGE', () => {
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Try again' });
      expect(stateMachine.getState()).toBe('processing');
    });
  });

  // ============================================================================
  // GLOBAL EVENT TESTS
  // ============================================================================

  describe('global events', () => {
    it('should handle UPDATE_CONTEXT in any state', () => {
      stateMachine.send({
        type: 'UPDATE_CONTEXT',
        payload: { user: { id: 'new-user', role: 'student', preferences: {}, capabilities: [] } },
      });

      expect(stateMachine.getContext().user.id).toBe('new-user');
    });

    it('should handle UPDATE_PAGE in any state', () => {
      stateMachine.send({
        type: 'UPDATE_PAGE',
        payload: { type: 'course-detail', path: '/courses/123' },
      });

      expect(stateMachine.getContext().page.type).toBe('course-detail');
    });

    it('should handle UPDATE_FORM in any state', () => {
      const formContext = {
        formId: 'form-1',
        formName: 'Course Form',
        fields: {},
        isDirty: false,
        isSubmitting: false,
        isValid: true,
        errors: {},
        touchedFields: new Set<string>(),
        lastUpdated: new Date(),
      };

      stateMachine.send({ type: 'UPDATE_FORM', payload: formContext });
      expect(stateMachine.getContext().form).not.toBeNull();
      expect(stateMachine.getContext().form?.formId).toBe('form-1');
    });

    it('should handle UPDATE_GAMIFICATION in any state', () => {
      stateMachine.send({
        type: 'UPDATE_GAMIFICATION',
        payload: { points: 100, level: 5 },
      });

      expect(stateMachine.getContext().gamification.points).toBe(100);
      expect(stateMachine.getContext().gamification.level).toBe(5);
    });

    it('should handle RESET in any state', () => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });

      stateMachine.send({ type: 'RESET' });

      expect(stateMachine.getState()).toBe('ready');
      expect(stateMachine.getContext().conversation.messages).toHaveLength(0);
    });

    it('should handle CLEAR_CONVERSATION in any state', () => {
      stateMachine.send({ type: 'OPEN' });
      stateMachine.send({ type: 'SEND_MESSAGE', payload: 'Hello' });
      const message: SAMMessage = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hi!',
        timestamp: new Date(),
      };
      stateMachine.send({ type: 'RECEIVE_RESPONSE', payload: message });

      stateMachine.send({ type: 'CLEAR_CONVERSATION' });

      expect(stateMachine.getContext().conversation.messages).toHaveLength(0);
      expect(stateMachine.getContext().conversation.totalMessages).toBe(0);
    });
  });

  // ============================================================================
  // SUBSCRIPTION TESTS
  // ============================================================================

  describe('subscriptions', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      stateMachine.subscribe(listener);

      stateMachine.send({ type: 'INITIALIZE' });

      expect(listener).toHaveBeenCalledWith(
        'ready',
        expect.any(Object),
        expect.objectContaining({ type: 'INITIALIZE' })
      );
    });

    it('should allow multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      stateMachine.subscribe(listener1);
      stateMachine.subscribe(listener2);

      stateMachine.send({ type: 'INITIALIZE' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = stateMachine.subscribe(listener);

      stateMachine.send({ type: 'INITIALIZE' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      stateMachine.send({ type: 'OPEN' });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify when state does not change', () => {
      const listener = vi.fn();
      stateMachine.subscribe(listener);

      // Send event that does not change state
      stateMachine.send({ type: 'CLOSE' }); // idle -> idle

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      stateMachine.subscribe(errorListener);
      stateMachine.subscribe(goodListener);

      // Should not throw
      expect(() => {
        stateMachine.send({ type: 'INITIALIZE' });
      }).not.toThrow();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // TIMESTAMP TESTS
  // ============================================================================

  describe('timestamps', () => {
    it('should add timestamp to events', () => {
      const listener = vi.fn();
      stateMachine.subscribe(listener);

      stateMachine.send({ type: 'INITIALIZE' });

      const event = listener.mock.calls[0][2] as SAMEvent;
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should use provided timestamp if present', () => {
      const listener = vi.fn();
      stateMachine.subscribe(listener);

      const customTimestamp = new Date('2024-01-01');
      stateMachine.send({ type: 'INITIALIZE', timestamp: customTimestamp });

      const event = listener.mock.calls[0][2] as SAMEvent;
      expect(event.timestamp).toEqual(customTimestamp);
    });

    it('should update lastActivityAt on context change', () => {
      const before = stateMachine.getContext().metadata.lastActivityAt;

      // Small delay to ensure different timestamp
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      stateMachine.send({ type: 'INITIALIZE' });

      const after = stateMachine.getContext().metadata.lastActivityAt;
      expect(after.getTime()).toBeGreaterThan(before.getTime());

      vi.useRealTimers();
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createStateMachine', () => {
    it('should create a state machine instance', () => {
      const sm = createStateMachine();
      expect(sm).toBeInstanceOf(SAMStateMachine);
    });

    it('should accept initial context', () => {
      const sm = createStateMachine({
        user: { id: 'test', role: 'admin', preferences: {}, capabilities: [] },
      });
      expect(sm.getContext().user.role).toBe('admin');
    });
  });
});
