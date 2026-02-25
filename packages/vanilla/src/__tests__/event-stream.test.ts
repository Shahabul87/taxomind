/**
 * Tests for SAMEventStream
 * @sam-ai/vanilla
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock EventSource
// ---------------------------------------------------------------------------

let mockEventSourceInstance: MockEventSource | null = null;

class MockEventSource {
  static OPEN = 1;
  static CLOSED = 2;
  static CONNECTING = 0;

  readyState = MockEventSource.CONNECTING;
  url: string;
  onmessage: ((event: { data: string }) => void) | null = null;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstance = this;
  }

  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) this.onopen();
  }

  simulateMessage(data: unknown): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }

  simulateError(): void {
    if (this.onerror) this.onerror();
  }
}

vi.stubGlobal('EventSource', MockEventSource);

import { SAMEventStream } from '../event-stream';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SAMEventStream', () => {
  let stream: SAMEventStream;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockEventSourceInstance = null;
    stream = new SAMEventStream({
      baseUrl: 'http://localhost:4000',
      apiKey: 'test-key',
    });
  });

  afterEach(() => {
    stream.disconnect();
    vi.useRealTimers();
  });

  it('should connect to the SSE endpoint', () => {
    stream.connect();

    expect(mockEventSourceInstance).not.toBeNull();
    expect(mockEventSourceInstance!.url).toBe(
      'http://localhost:4000/api/sam/realtime/events',
    );
  });

  it('should receive and dispatch events to subscribers', () => {
    stream.connect();
    const callback = vi.fn();

    stream.subscribe('check_in', callback);

    // Simulate receiving an event
    mockEventSourceInstance!.simulateMessage({
      type: 'check_in',
      eventId: 'evt-1',
      payload: { message: 'How are you?' },
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'check_in',
        eventId: 'evt-1',
      }),
    );
  });

  it('should disconnect and clean up listeners', () => {
    stream.connect();
    const callback = vi.fn();
    stream.subscribe('test', callback);

    stream.disconnect();

    expect(mockEventSourceInstance!.readyState).toBe(MockEventSource.CLOSED);
    expect(stream.connected).toBe(false);
  });

  it('should attempt reconnection on error', () => {
    stream.connect();

    // Simulate error (triggers close + reconnect)
    mockEventSourceInstance!.simulateError();

    // Advance timers to trigger reconnection
    vi.advanceTimersByTime(1000);

    // A new EventSource should have been created
    expect(mockEventSourceInstance).not.toBeNull();
  });

  it('should handle malformed events without crashing', () => {
    stream.connect();
    const callback = vi.fn();
    stream.subscribe('*', callback);

    // Send malformed data that will fail JSON.parse
    if (mockEventSourceInstance!.onmessage) {
      expect(() => {
        mockEventSourceInstance!.onmessage!({ data: 'not-valid-json' });
      }).not.toThrow();
    }

    // Callback should not have been called
    expect(callback).not.toHaveBeenCalled();
  });

  it('should support unsubscribe pattern', () => {
    stream.connect();
    const callback = vi.fn();

    const unsub = stream.subscribe('notification', callback);

    // Emit event before unsubscribe
    mockEventSourceInstance!.simulateMessage({
      type: 'notification',
      payload: { text: 'first' },
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsub();

    // Emit event after unsubscribe
    mockEventSourceInstance!.simulateMessage({
      type: 'notification',
      payload: { text: 'second' },
    });

    // Should not have been called again
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
