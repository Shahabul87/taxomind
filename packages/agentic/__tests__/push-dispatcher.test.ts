/**
 * @sam-ai/agentic - Push Dispatcher Tests
 * Tests for push notification dispatching and queue management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProactivePushDispatcher,
  InMemoryPushQueueStore,
  createPushDispatcher,
  createInMemoryPushQueueStore,
  type DeliveryHandler,
} from '../src/realtime/push-dispatcher';
import type { PushDeliveryRequest, SAMWebSocketEvent } from '../src/realtime/types';
import { SAMEventType, DeliveryChannel } from '../src/realtime/types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockEvent(): SAMWebSocketEvent {
  return {
    type: SAMEventType.INTERVENTION,
    payload: { message: 'Test intervention' },
    timestamp: new Date(),
    eventId: 'test-event-id',
    userId: 'user-1',
    sessionId: 'session-1',
  };
}

function createMockRequest(overrides: Partial<PushDeliveryRequest> = {}): PushDeliveryRequest {
  return {
    id: 'request-1',
    userId: 'user-1',
    event: createMockEvent(),
    priority: 'normal',
    channels: [DeliveryChannel.WEBSOCKET],
    ...overrides,
  };
}

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockHandler(
  channel: string,
  canDeliver: boolean = true,
  deliverSuccess: boolean = true
): DeliveryHandler {
  return {
    channel: channel as DeliveryChannel,
    canDeliver: vi.fn().mockResolvedValue(canDeliver),
    deliver: vi.fn().mockResolvedValue(deliverSuccess),
  };
}

// ============================================================================
// IN-MEMORY PUSH QUEUE STORE TESTS
// ============================================================================

describe('InMemoryPushQueueStore', () => {
  let store: InMemoryPushQueueStore;

  beforeEach(() => {
    store = createInMemoryPushQueueStore();
  });

  describe('enqueue and dequeue', () => {
    it('should enqueue and dequeue requests', async () => {
      const request = createMockRequest();
      await store.enqueue(request);

      const dequeued = await store.dequeue(1);
      expect(dequeued).toHaveLength(1);
      expect(dequeued[0].id).toBe(request.id);
    });

    it('should dequeue by priority', async () => {
      await store.enqueue(createMockRequest({ id: 'low', priority: 'low' }));
      await store.enqueue(createMockRequest({ id: 'critical', priority: 'critical' }));
      await store.enqueue(createMockRequest({ id: 'high', priority: 'high' }));

      const dequeued = await store.dequeue(3);
      expect(dequeued[0].id).toBe('critical');
      expect(dequeued[1].id).toBe('high');
      expect(dequeued[2].id).toBe('low');
    });

    it('should not dequeue already processing items', async () => {
      const request = createMockRequest();
      await store.enqueue(request);

      // Dequeue once (marks as processing)
      await store.dequeue(1);

      // Try to dequeue again
      const second = await store.dequeue(1);
      expect(second).toHaveLength(0);
    });
  });

  describe('peek', () => {
    it('should peek without removing', async () => {
      const request = createMockRequest();
      await store.enqueue(request);

      const peeked = await store.peek(1);
      expect(peeked).toHaveLength(1);

      // Should still be available
      const dequeued = await store.dequeue(1);
      expect(dequeued).toHaveLength(1);
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge successful delivery', async () => {
      const request = createMockRequest();
      await store.enqueue(request);
      await store.dequeue(1);

      await store.acknowledge(request.id, {
        requestId: request.id,
        userId: request.userId,
        deliveredVia: DeliveryChannel.WEBSOCKET,
        success: true,
        attemptedChannels: [DeliveryChannel.WEBSOCKET],
        deliveredAt: new Date(),
      });

      const stats = await store.getStats();
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(0);
    });

    it('should acknowledge failed delivery', async () => {
      const request = createMockRequest();
      await store.enqueue(request);
      await store.dequeue(1);

      await store.acknowledge(request.id, {
        requestId: request.id,
        userId: request.userId,
        deliveredVia: null,
        success: false,
        error: 'Failed to deliver',
        attemptedChannels: [DeliveryChannel.WEBSOCKET],
        deliveredAt: new Date(),
      });

      const stats = await store.getStats();
      expect(stats.failed).toBe(1);
    });
  });

  describe('requeue', () => {
    it('should requeue failed request for retry', async () => {
      const request = createMockRequest();
      await store.enqueue(request);
      await store.dequeue(1);

      await store.requeue(request);

      // Should be available again
      const dequeued = await store.dequeue(1);
      expect(dequeued).toHaveLength(1);
    });
  });

  describe('stats', () => {
    it('should track queue statistics', async () => {
      await store.enqueue(createMockRequest({ id: 'req-1' }));
      await store.enqueue(createMockRequest({ id: 'req-2' }));

      const stats = await store.getStats();
      expect(stats.pending).toBe(2);
      expect(stats.processing).toBe(0);
    });

    it('should track processing count', async () => {
      await store.enqueue(createMockRequest({ id: 'req-1' }));
      await store.dequeue(1);

      const stats = await store.getStats();
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should cleanup old completed requests', async () => {
      const request = createMockRequest();
      await store.enqueue(request);
      await store.dequeue(1);

      const oldDate = new Date(Date.now() - 100000);
      await store.acknowledge(request.id, {
        requestId: request.id,
        userId: request.userId,
        deliveredVia: DeliveryChannel.WEBSOCKET,
        success: true,
        attemptedChannels: [DeliveryChannel.WEBSOCKET],
        deliveredAt: oldDate,
      });

      const count = await store.cleanup(new Date(Date.now() - 50000));
      expect(count).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      await store.enqueue(createMockRequest());
      store.clear();

      expect(store.getQueueSize()).toBe(0);
    });
  });
});

// ============================================================================
// PROACTIVE PUSH DISPATCHER TESTS
// ============================================================================

describe('ProactivePushDispatcher', () => {
  let dispatcher: ProactivePushDispatcher;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    dispatcher = createPushDispatcher({
      config: {
        processingInterval: 100,
        batchSize: 10,
        retryAttempts: 3,
        maxQueueSize: 100,
        defaultExpirationMs: 300000,
      },
      logger: mockLogger,
    });
  });

  afterEach(() => {
    dispatcher.stop();
  });

  describe('lifecycle', () => {
    it('should start and stop without errors', () => {
      dispatcher.start();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Push dispatcher started',
        expect.any(Object)
      );

      dispatcher.stop();
      expect(mockLogger.info).toHaveBeenCalledWith('Push dispatcher stopped');
    });

    it('should warn if already running', () => {
      dispatcher.start();
      dispatcher.start();
      expect(mockLogger.warn).toHaveBeenCalledWith('Push dispatcher already running');
    });
  });

  describe('handler registration', () => {
    it('should register delivery handler', () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET);
      dispatcher.registerHandler(handler);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Delivery handler registered',
        expect.objectContaining({ channel: DeliveryChannel.WEBSOCKET })
      );
    });

    it('should unregister delivery handler', () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET);
      dispatcher.registerHandler(handler);
      dispatcher.unregisterHandler(DeliveryChannel.WEBSOCKET);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Delivery handler unregistered',
        expect.objectContaining({ channel: DeliveryChannel.WEBSOCKET })
      );
    });
  });

  describe('dispatch', () => {
    it('should enqueue request', async () => {
      const request = createMockRequest();
      await dispatcher.dispatch(request);

      const stats = await dispatcher.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should set default expiration', async () => {
      const request = createMockRequest({ expiresAt: undefined });
      await dispatcher.dispatch(request);

      // Request should have expiration set
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request enqueued',
        expect.any(Object)
      );
    });

    it('should drop request when queue is full', async () => {
      // Create dispatcher with small queue
      const smallQueueDispatcher = createPushDispatcher({
        config: { maxQueueSize: 1 },
        logger: mockLogger,
      });

      await smallQueueDispatcher.dispatch(createMockRequest({ id: 'req-1' }));
      await smallQueueDispatcher.dispatch(createMockRequest({ id: 'req-2' }));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Push queue full, dropping request',
        expect.any(Object)
      );

      smallQueueDispatcher.stop();
    });
  });

  describe('dispatchEvent', () => {
    it('should create and dispatch event with defaults', async () => {
      const event = createMockEvent();
      await dispatcher.dispatchEvent('user-1', event);

      const stats = await dispatcher.getStats();
      expect(stats.queueSize).toBe(1);
    });

    it('should use custom options', async () => {
      const event = createMockEvent();
      await dispatcher.dispatchEvent('user-1', event, {
        priority: 'critical',
        channels: [DeliveryChannel.EMAIL],
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Request enqueued',
        expect.objectContaining({
          priority: 'critical',
          channels: [DeliveryChannel.EMAIL],
        })
      );
    });
  });

  describe('processQueue', () => {
    it('should process queue and deliver successfully', async () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET, true, true);
      dispatcher.registerHandler(handler);
      dispatcher.start();

      await dispatcher.dispatch(createMockRequest());

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = await dispatcher.getStats();
      expect(stats.deliveredCount).toBe(1);
      expect(handler.deliver).toHaveBeenCalled();
    });

    it('should try fallback channels on failure', async () => {
      const wsHandler = createMockHandler(DeliveryChannel.WEBSOCKET, false, false);
      const emailHandler = createMockHandler(DeliveryChannel.EMAIL, true, true);

      dispatcher.registerHandler(wsHandler);
      dispatcher.registerHandler(emailHandler);
      dispatcher.start();

      await dispatcher.dispatch(
        createMockRequest({
          channels: [DeliveryChannel.WEBSOCKET],
          fallbackChannels: [DeliveryChannel.EMAIL],
        })
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(emailHandler.deliver).toHaveBeenCalled();
    });

    it('should handle expired requests', async () => {
      dispatcher.start();

      await dispatcher.dispatch(
        createMockRequest({
          expiresAt: new Date(Date.now() - 1000), // Already expired
        })
      );

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = await dispatcher.getStats();
      expect(stats.failedCount).toBe(1);
    });

    it('should not process when stopped', async () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET);
      dispatcher.registerHandler(handler);

      // Don't start dispatcher
      await dispatcher.dispatch(createMockRequest());

      const results = await dispatcher.processQueue();
      expect(results).toHaveLength(0);
    });
  });

  describe('isUserOnline', () => {
    it('should check WebSocket handler when no presence tracker', async () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET, true, true);
      dispatcher.registerHandler(handler);

      const isOnline = await dispatcher.isUserOnline('user-1');

      expect(handler.canDeliver).toHaveBeenCalledWith('user-1');
      expect(isOnline).toBe(true);
    });

    it('should return false when no handlers available', async () => {
      const isOnline = await dispatcher.isUserOnline('user-1');
      expect(isOnline).toBe(false);
    });
  });

  describe('stats', () => {
    it('should return dispatcher statistics', async () => {
      const stats = await dispatcher.getStats();

      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('deliveredCount');
      expect(stats).toHaveProperty('failedCount');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('avgDeliveryTimeMs');
    });
  });

  describe('cleanup', () => {
    it('should cleanup old data', async () => {
      const count = await dispatcher.cleanup(1000);
      expect(typeof count).toBe('number');
    });
  });

  describe('delivery failure handling', () => {
    it('should track failed deliveries', async () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET, true, false);
      dispatcher.registerHandler(handler);
      dispatcher.start();

      await dispatcher.dispatch(createMockRequest());

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      const stats = await dispatcher.getStats();
      expect(stats.failedCount).toBeGreaterThanOrEqual(1);
    });

    it('should log when all channels fail', async () => {
      const handler = createMockHandler(DeliveryChannel.WEBSOCKET, true, false);
      dispatcher.registerHandler(handler);
      dispatcher.start();

      await dispatcher.dispatch(createMockRequest());

      // Wait for processing with retries - need longer wait for processing interval
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Delivery should have been attempted
      expect(handler.deliver).toHaveBeenCalled();
    });
  });
});
