/**
 * Tests for useRealTimeMessages hook
 * Source: hooks/use-realtime-messages.ts
 *
 * This hook manages real-time messaging via socket events:
 * - Subscribes to new messages and read-receipt events on mount
 * - Filters messages by conversationId (composite "userId1-userId2" key)
 * - Auto-marks incoming messages as read after a 1-second delay
 * - Exposes sendMessage and markMessageAsRead helpers
 * - Cleans up all socket listeners on unmount
 */

import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock: @/lib/socket-client
// We capture every callback registered via onNewMessage / onMessageRead so
// that individual tests can simulate incoming socket events.
// ---------------------------------------------------------------------------

type NewMessageCallback = (message: Record<string, unknown>) => void;
type MessageReadCallback = (data: {
  messageId: string;
  conversationId: string;
  readAt: string;
}) => void;

let capturedNewMessageCallback: NewMessageCallback | null = null;
let capturedMessageReadCallback: MessageReadCallback | null = null;
const mockUnsubscribeNewMessage = jest.fn();
const mockUnsubscribeMessageRead = jest.fn();

const mockOnNewMessage = jest.fn((cb: NewMessageCallback) => {
  capturedNewMessageCallback = cb;
  return mockUnsubscribeNewMessage;
});

const mockOnMessageRead = jest.fn((cb: MessageReadCallback) => {
  capturedMessageReadCallback = cb;
  return mockUnsubscribeMessageRead;
});

const mockEmitMessageSent = jest.fn();
const mockEmitMessageRead = jest.fn();

jest.mock('@/lib/socket-client', () => ({
  onNewMessage: (...args: Parameters<typeof mockOnNewMessage>) =>
    mockOnNewMessage(...args),
  onMessageRead: (...args: Parameters<typeof mockOnMessageRead>) =>
    mockOnMessageRead(...args),
  emitMessageSent: (...args: Parameters<typeof mockEmitMessageSent>) =>
    mockEmitMessageSent(...args),
  emitMessageRead: (...args: Parameters<typeof mockEmitMessageRead>) =>
    mockEmitMessageRead(...args),
}));

// ---------------------------------------------------------------------------
// Import the hook under test AFTER mocks are wired
// ---------------------------------------------------------------------------
import { useRealTimeMessages } from '@/hooks/use-realtime-messages';

// ---------------------------------------------------------------------------
// Shared test data factories
// ---------------------------------------------------------------------------

// IMPORTANT: User IDs must NOT contain hyphens because the hook uses
// conversationId.split("-")[0] and [1] to extract the two participant IDs.
// A conversationId of "userA-userB" splits into ["userA", "userB"].
const USER_A_ID = 'userAaa111';
const USER_B_ID = 'userBbb222';
const USER_C_ID = 'userCcc333';

/** A composite conversationId formed from USER_A and USER_B */
const CONVERSATION_AB = `${USER_A_ID}-${USER_B_ID}`;

function createMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-001',
    content: 'Hello from B',
    senderId: USER_B_ID,
    recipientId: USER_A_ID,
    createdAt: '2026-03-04T10:00:00.000Z',
    read: false,
    readAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('useRealTimeMessages', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    capturedNewMessageCallback = null;
    capturedMessageReadCallback = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Default props factory -- each test can override individual fields.
  function defaultProps() {
    return {
      conversationId: CONVERSATION_AB,
      userId: USER_A_ID,
      onMessageReceived: jest.fn(),
      onMessageReadUpdate: jest.fn(),
    };
  }

  // ======================================================================
  // 1. Initial state
  // ======================================================================

  describe('initial state and returned API', () => {
    it('returns sendMessage and markMessageAsRead functions', () => {
      const props = defaultProps();
      const { result } = renderHook(() => useRealTimeMessages(props));

      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.markMessageAsRead).toBe('function');
    });

    it('registers onNewMessage listener on mount', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      expect(mockOnNewMessage).toHaveBeenCalledTimes(1);
      expect(typeof mockOnNewMessage.mock.calls[0][0]).toBe('function');
    });

    it('registers onMessageRead listener on mount', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      expect(mockOnMessageRead).toHaveBeenCalledTimes(1);
      expect(typeof mockOnMessageRead.mock.calls[0][0]).toBe('function');
    });
  });

  // ======================================================================
  // 2. Cleanup on unmount
  // ======================================================================

  describe('cleanup on unmount', () => {
    it('calls the unsubscribe function for onNewMessage on unmount', () => {
      const props = defaultProps();
      const { unmount } = renderHook(() => useRealTimeMessages(props));

      expect(mockUnsubscribeNewMessage).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribeNewMessage).toHaveBeenCalledTimes(1);
    });

    it('calls the unsubscribe function for onMessageRead on unmount', () => {
      const props = defaultProps();
      const { unmount } = renderHook(() => useRealTimeMessages(props));

      expect(mockUnsubscribeMessageRead).not.toHaveBeenCalled();

      unmount();

      expect(mockUnsubscribeMessageRead).toHaveBeenCalledTimes(1);
    });
  });

  // ======================================================================
  // 3. Receiving messages (onNewMessage path)
  // ======================================================================

  describe('receiving messages via onNewMessage', () => {
    it('invokes onMessageReceived for a message belonging to this conversation', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const message = createMessage();

      // Simulate a socket event
      act(() => {
        capturedNewMessageCallback?.(message);
      });

      expect(props.onMessageReceived).toHaveBeenCalledTimes(1);
      expect(props.onMessageReceived).toHaveBeenCalledWith(message);
    });

    it('filters out messages that do not belong to this conversation', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      // Message between completely unrelated users
      const unrelatedMessage = createMessage({
        id: 'msg-unrelated',
        senderId: USER_C_ID,
        recipientId: 'userDdd444',
      });

      act(() => {
        capturedNewMessageCallback?.(unrelatedMessage);
      });

      expect(props.onMessageReceived).not.toHaveBeenCalled();
    });

    it('filters out messages where current user is not sender or recipient', () => {
      // Even if one of the participants is in the conversation, if the current
      // user (userId) is neither sender nor recipient, the first check fails.
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      // USER_B sends to USER_C -- current user (USER_A) is neither
      const wrongConvoMessage = createMessage({
        id: 'msg-wrong-convo',
        senderId: USER_B_ID,
        recipientId: USER_C_ID,
      });

      act(() => {
        capturedNewMessageCallback?.(wrongConvoMessage);
      });

      expect(props.onMessageReceived).not.toHaveBeenCalled();
    });

    it('accepts messages where the current user is the sender (outgoing echo)', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      // USER_A sent a message to USER_B (current user is USER_A)
      const outgoingMessage = createMessage({
        id: 'msg-outgoing',
        senderId: USER_A_ID,
        recipientId: USER_B_ID,
      });

      act(() => {
        capturedNewMessageCallback?.(outgoingMessage);
      });

      expect(props.onMessageReceived).toHaveBeenCalledTimes(1);
      expect(props.onMessageReceived).toHaveBeenCalledWith(outgoingMessage);
    });
  });

  // ======================================================================
  // 4. Auto-mark as read
  // ======================================================================

  describe('auto-mark incoming messages as read', () => {
    it('auto-marks an incoming message as read after 1 second if sender is not current user', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const incomingMessage = createMessage({
        id: 'msg-auto-read',
        senderId: USER_B_ID,
        recipientId: USER_A_ID,
      });

      act(() => {
        capturedNewMessageCallback?.(incomingMessage);
      });

      // Before the timeout fires, emitMessageRead should NOT have been called
      expect(mockEmitMessageRead).not.toHaveBeenCalled();

      // Advance timers by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockEmitMessageRead).toHaveBeenCalledTimes(1);
      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-auto-read',
        CONVERSATION_AB
      );
    });

    it('does NOT auto-mark messages sent by the current user', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      // Current user sent a message
      const ownMessage = createMessage({
        id: 'msg-own',
        senderId: USER_A_ID,
        recipientId: USER_B_ID,
      });

      act(() => {
        capturedNewMessageCallback?.(ownMessage);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockEmitMessageRead).not.toHaveBeenCalled();
    });

    it('does not mark as read before the 1-second delay elapses', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const message = createMessage({ id: 'msg-timing' });

      act(() => {
        capturedNewMessageCallback?.(message);
      });

      // Advance only 500ms -- not yet 1 second
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockEmitMessageRead).not.toHaveBeenCalled();

      // Advance to exactly 1000ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(mockEmitMessageRead).toHaveBeenCalledTimes(1);
    });
  });

  // ======================================================================
  // 5. Receiving read receipts (onMessageRead path)
  // ======================================================================

  describe('receiving message read updates', () => {
    it('invokes onMessageReadUpdate for read events matching this conversation', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const readData = {
        messageId: 'msg-001',
        conversationId: CONVERSATION_AB,
        readAt: '2026-03-04T10:01:00.000Z',
      };

      act(() => {
        capturedMessageReadCallback?.(readData);
      });

      expect(props.onMessageReadUpdate).toHaveBeenCalledTimes(1);
      expect(props.onMessageReadUpdate).toHaveBeenCalledWith({
        messageId: 'msg-001',
        readAt: '2026-03-04T10:01:00.000Z',
      });
    });

    it('ignores read events for a different conversation', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const readData = {
        messageId: 'msg-999',
        conversationId: 'other-conversation-id',
        readAt: '2026-03-04T10:05:00.000Z',
      };

      act(() => {
        capturedMessageReadCallback?.(readData);
      });

      expect(props.onMessageReadUpdate).not.toHaveBeenCalled();
    });
  });

  // ======================================================================
  // 6. Sending messages
  // ======================================================================

  describe('sendMessage', () => {
    it('emits the message via emitMessageSent', () => {
      const props = defaultProps();
      const { result } = renderHook(() => useRealTimeMessages(props));

      const outgoing = createMessage({
        id: 'msg-send-001',
        senderId: USER_A_ID,
        recipientId: USER_B_ID,
        content: 'Hello!',
      });

      act(() => {
        result.current.sendMessage(outgoing);
      });

      expect(mockEmitMessageSent).toHaveBeenCalledTimes(1);
      expect(mockEmitMessageSent).toHaveBeenCalledWith(outgoing);
    });

    it('sendMessage is referentially stable across re-renders', () => {
      const props = defaultProps();
      const { result, rerender } = renderHook(() =>
        useRealTimeMessages(props)
      );

      const firstRef = result.current.sendMessage;

      rerender();

      expect(result.current.sendMessage).toBe(firstRef);
    });
  });

  // ======================================================================
  // 7. markMessageAsRead
  // ======================================================================

  describe('markMessageAsRead', () => {
    it('emits message_read via emitMessageRead with the correct arguments', () => {
      const props = defaultProps();
      const { result } = renderHook(() => useRealTimeMessages(props));

      act(() => {
        result.current.markMessageAsRead('msg-manual-read');
      });

      expect(mockEmitMessageRead).toHaveBeenCalledTimes(1);
      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-manual-read',
        CONVERSATION_AB
      );
    });

    it('markMessageAsRead updates when conversationId changes', () => {
      const props = defaultProps();
      const { result, rerender } = renderHook(
        (p: ReturnType<typeof defaultProps>) => useRealTimeMessages(p),
        { initialProps: props }
      );

      const newConvo = `${USER_A_ID}-${USER_C_ID}`;

      rerender({ ...props, conversationId: newConvo });

      act(() => {
        result.current.markMessageAsRead('msg-new-convo');
      });

      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-new-convo',
        newConvo
      );
    });
  });

  // ======================================================================
  // 8. Re-subscription on prop changes
  // ======================================================================

  describe('re-subscription when props change', () => {
    it('re-subscribes to onNewMessage when conversationId changes', () => {
      const props = defaultProps();
      const { rerender } = renderHook(
        (p: ReturnType<typeof defaultProps>) => useRealTimeMessages(p),
        { initialProps: props }
      );

      // Initial subscription
      expect(mockOnNewMessage).toHaveBeenCalledTimes(1);

      // Change conversationId
      rerender({
        ...props,
        conversationId: `${USER_A_ID}-${USER_C_ID}`,
      });

      // The effect should have cleaned up and re-subscribed
      expect(mockUnsubscribeNewMessage).toHaveBeenCalled();
      expect(mockOnNewMessage.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('re-subscribes to onMessageRead when conversationId changes', () => {
      const props = defaultProps();
      const { rerender } = renderHook(
        (p: ReturnType<typeof defaultProps>) => useRealTimeMessages(p),
        { initialProps: props }
      );

      expect(mockOnMessageRead).toHaveBeenCalledTimes(1);

      rerender({
        ...props,
        conversationId: `${USER_A_ID}-${USER_C_ID}`,
      });

      expect(mockUnsubscribeMessageRead).toHaveBeenCalled();
      expect(mockOnMessageRead.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ======================================================================
  // 9. Edge cases
  // ======================================================================

  describe('edge cases', () => {
    it('handles multiple rapid incoming messages correctly', () => {
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const msg1 = createMessage({ id: 'msg-rapid-1', content: 'First' });
      const msg2 = createMessage({ id: 'msg-rapid-2', content: 'Second' });
      const msg3 = createMessage({ id: 'msg-rapid-3', content: 'Third' });

      act(() => {
        capturedNewMessageCallback?.(msg1);
        capturedNewMessageCallback?.(msg2);
        capturedNewMessageCallback?.(msg3);
      });

      expect(props.onMessageReceived).toHaveBeenCalledTimes(3);

      // All three should trigger auto-read after 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockEmitMessageRead).toHaveBeenCalledTimes(3);
      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-rapid-1',
        CONVERSATION_AB
      );
      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-rapid-2',
        CONVERSATION_AB
      );
      expect(mockEmitMessageRead).toHaveBeenCalledWith(
        'msg-rapid-3',
        CONVERSATION_AB
      );
    });

    it('accepts a message where senderId matches the second segment of conversationId', () => {
      // conversationId = "userAaa111-userBbb222"
      // split("-") => ["userAaa111", "userBbb222"]
      // When USER_B sends to USER_A, senderId (USER_B) matches split[1].
      const props = defaultProps();
      renderHook(() => useRealTimeMessages(props));

      const message = createMessage({
        id: 'msg-segment-check',
        senderId: USER_B_ID,
        recipientId: USER_A_ID,
      });

      act(() => {
        capturedNewMessageCallback?.(message);
      });

      expect(props.onMessageReceived).toHaveBeenCalledTimes(1);
    });

    it('does not throw when callbacks fire after unmount pending timers', () => {
      const props = defaultProps();
      const { unmount } = renderHook(() => useRealTimeMessages(props));

      const message = createMessage({ id: 'msg-pre-unmount' });

      act(() => {
        capturedNewMessageCallback?.(message);
      });

      // Unmount before the 1-second auto-read timer fires
      unmount();

      // Advancing timers should not throw
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }).not.toThrow();
    });
  });
});
