/**
 * @sam-ai/agentic - WebSocket Manager Tests
 * Tests for client and server WebSocket connection managers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ClientWebSocketManager,
  ServerConnectionManager,
  createClientWebSocketManager,
  createServerConnectionManager,
  type ServerConnection,
} from '../src/realtime/websocket-manager';
import type { SAMWebSocketEvent, PresenceMetadata } from '../src/realtime/types';
import { SAMEventType, ConnectionState } from '../src/realtime/types';

// ============================================================================
// MOCK WEBSOCKET
// ============================================================================

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;

  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  private messageQueue: string[] = [];

  constructor(url: string) {
    this.url = url;
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: code ?? 1000, reason: reason ?? '' } as CloseEvent);
    }
  }

  // Test helpers
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen({} as Event);
    }
  }

  simulateMessage(data: object): void {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror({} as Event);
    }
  }

  getLastMessage(): string | undefined {
    return this.messageQueue[this.messageQueue.length - 1];
  }

  getMessageCount(): number {
    return this.messageQueue.length;
  }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockPresenceMetadata(): PresenceMetadata {
  return {
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'macOS',
  };
}

function createMockEvent(type: string = SAMEventType.HEARTBEAT): SAMWebSocketEvent {
  return {
    type: type as SAMWebSocketEvent['type'],
    payload: { test: true },
    timestamp: new Date(),
    eventId: 'test-event-id',
    userId: 'test-user',
    sessionId: 'test-session',
  };
}

// ============================================================================
// CLIENT WEBSOCKET MANAGER TESTS
// ============================================================================

describe('ClientWebSocketManager', () => {
  let manager: ClientWebSocketManager;
  let mockLogger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Store original WebSocket
    originalWebSocket = global.WebSocket;

    // Mock WebSocket
    global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    if (manager) {
      manager.disconnect();
    }
    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
  });

  describe('initialization', () => {
    it('should create manager with default config', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });
      expect(manager).toBeDefined();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should create manager with custom config', () => {
      manager = createClientWebSocketManager({
        config: {
          url: 'wss://test.example.com/ws',
          heartbeatInterval: 15000,
        },
        logger: mockLogger,
      });
      expect(manager).toBeDefined();
    });

    it('should report not connected initially', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('connect', () => {
    it('should reject connection without valid WebSocket URL', async () => {
      manager = createClientWebSocketManager({
        config: { url: '' },
        logger: mockLogger,
      });

      await expect(manager.connect('user-123')).rejects.toThrow();
    });

    it('should reject connection with relative URL', async () => {
      manager = createClientWebSocketManager({
        config: { url: '/api/ws' },
        logger: mockLogger,
      });

      await expect(manager.connect('user-123')).rejects.toThrow('WebSocket not configured');
    });

    it('should attempt connection with valid ws:// URL', async () => {
      manager = createClientWebSocketManager({
        config: { url: 'ws://localhost:3000/ws' },
        logger: mockLogger,
      });

      const connectPromise = manager.connect('user-123', createMockPresenceMetadata());

      // Simulate successful connection
      setTimeout(() => {
        const ws = (manager as unknown as { socket: MockWebSocket }).socket;
        if (ws) ws.simulateOpen();
      }, 10);

      await connectPromise;
      expect(manager.isConnected()).toBe(true);
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
    });

    it('should not reconnect if already connected', async () => {
      manager = createClientWebSocketManager({
        config: { url: 'ws://localhost:3000/ws' },
        logger: mockLogger,
      });

      const connectPromise = manager.connect('user-123');

      setTimeout(() => {
        const ws = (manager as unknown as { socket: MockWebSocket }).socket;
        if (ws) ws.simulateOpen();
      }, 10);

      await connectPromise;

      // Try to connect again
      await manager.connect('user-123');
      expect(mockLogger.warn).toHaveBeenCalledWith('Already connected');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and reset state', async () => {
      manager = createClientWebSocketManager({
        config: { url: 'ws://localhost:3000/ws' },
        logger: mockLogger,
      });

      const connectPromise = manager.connect('user-123');

      setTimeout(() => {
        const ws = (manager as unknown as { socket: MockWebSocket }).socket;
        if (ws) ws.simulateOpen();
      }, 10);

      await connectPromise;
      expect(manager.isConnected()).toBe(true);

      manager.disconnect();
      expect(manager.isConnected()).toBe(false);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('event handling', () => {
    it('should register and unregister event handlers', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });

      const handler = vi.fn();
      const unsubscribe = manager.on(SAMEventType.INTERVENTION, handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register connection change handlers', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });

      const handler = vi.fn();
      const unsubscribe = manager.onConnectionChange(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should register error handlers', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });

      const handler = vi.fn();
      const unsubscribe = manager.onError(handler);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('stats', () => {
    it('should return initial stats', () => {
      manager = createClientWebSocketManager({ logger: mockLogger });

      const stats = manager.getStats();
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.reconnectCount).toBe(0);
    });
  });
});

// ============================================================================
// SERVER CONNECTION MANAGER TESTS
// ============================================================================

describe('ServerConnectionManager', () => {
  let manager: ServerConnectionManager;
  let mockLogger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    manager = createServerConnectionManager({ logger: mockLogger });
  });

  describe('initialization', () => {
    it('should create manager with no connections', () => {
      expect(manager.getConnectionCount()).toBe(0);
      expect(manager.getConnectedUserIds()).toEqual([]);
    });
  });

  describe('connection registration', () => {
    it('should register a new connection', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      expect(manager.getConnectionCount()).toBe(1);
      expect(manager.getConnectedUserIds()).toContain('user-1');
    });

    it('should track multiple connections per user', () => {
      const mockSocket1 = { send: vi.fn() };
      const mockSocket2 = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket1, metadata);
      manager.registerConnection('conn-2', 'user-1', mockSocket2, metadata);

      expect(manager.getConnectionCount()).toBe(2);
      expect(manager.getUserConnections('user-1')).toHaveLength(2);
    });

    it('should track connections for different users', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);
      manager.registerConnection('conn-2', 'user-2', mockSocket, metadata);

      expect(manager.getConnectionCount()).toBe(2);
      expect(manager.getConnectedUserIds()).toContain('user-1');
      expect(manager.getConnectedUserIds()).toContain('user-2');
    });
  });

  describe('connection removal', () => {
    it('should remove a connection', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);
      expect(manager.getConnectionCount()).toBe(1);

      manager.removeConnection('conn-1');
      expect(manager.getConnectionCount()).toBe(0);
    });

    it('should remove user from list when last connection removed', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);
      manager.removeConnection('conn-1');

      expect(manager.getConnectedUserIds()).not.toContain('user-1');
      expect(manager.isUserConnected('user-1')).toBe(false);
    });

    it('should keep user when one of multiple connections removed', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);
      manager.registerConnection('conn-2', 'user-1', mockSocket, metadata);
      manager.removeConnection('conn-1');

      expect(manager.isUserConnected('user-1')).toBe(true);
      expect(manager.getUserConnections('user-1')).toHaveLength(1);
    });
  });

  describe('messaging', () => {
    it('should send to specific connection', async () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const event = createMockEvent();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      const result = await manager.sendToConnection('conn-1', event);
      expect(result).toBe(true);
      expect(mockSocket.send).toHaveBeenCalled();
    });

    it('should return false for non-existent connection', async () => {
      const event = createMockEvent();

      const result = await manager.sendToConnection('non-existent', event);
      expect(result).toBe(false);
    });

    it('should send to all user connections', async () => {
      const mockSocket1 = { send: vi.fn() };
      const mockSocket2 = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const event = createMockEvent();

      manager.registerConnection('conn-1', 'user-1', mockSocket1, metadata);
      manager.registerConnection('conn-2', 'user-1', mockSocket2, metadata);

      const count = await manager.sendToUser('user-1', event);
      expect(count).toBe(2);
      expect(mockSocket1.send).toHaveBeenCalled();
      expect(mockSocket2.send).toHaveBeenCalled();
    });

    it('should return 0 for user with no connections', async () => {
      const event = createMockEvent();

      const count = await manager.sendToUser('non-existent', event);
      expect(count).toBe(0);
    });

    it('should broadcast to all connections', async () => {
      const mockSocket1 = { send: vi.fn() };
      const mockSocket2 = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const event = createMockEvent();

      manager.registerConnection('conn-1', 'user-1', mockSocket1, metadata);
      manager.registerConnection('conn-2', 'user-2', mockSocket2, metadata);

      const count = await manager.broadcast(event);
      expect(count).toBe(2);
    });

    it('should broadcast with filter', async () => {
      const mockSocket1 = { send: vi.fn() };
      const mockSocket2 = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const event = createMockEvent();

      manager.registerConnection('conn-1', 'user-1', mockSocket1, metadata);
      manager.registerConnection('conn-2', 'user-2', mockSocket2, metadata);

      const count = await manager.broadcast(event, (conn: ServerConnection) => conn.userId === 'user-1');
      expect(count).toBe(1);
      expect(mockSocket1.send).toHaveBeenCalled();
      expect(mockSocket2.send).not.toHaveBeenCalled();
    });
  });

  describe('queries', () => {
    it('should get connection by id', () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();

      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      const connection = manager.getConnection('conn-1');
      expect(connection).toBeDefined();
      expect(connection?.userId).toBe('user-1');
    });

    it('should return undefined for non-existent connection', () => {
      const connection = manager.getConnection('non-existent');
      expect(connection).toBeUndefined();
    });
  });

  describe('handlers', () => {
    it('should add and call connection handler', async () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const handler = {
        onConnect: vi.fn().mockResolvedValue(undefined),
        onDisconnect: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn().mockResolvedValue(undefined),
      };

      manager.addHandler(handler);
      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler.onConnect).toHaveBeenCalledWith('conn-1', 'user-1', metadata);
    });

    it('should call disconnect handler on removal', async () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const handler = {
        onConnect: vi.fn().mockResolvedValue(undefined),
        onDisconnect: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn().mockResolvedValue(undefined),
      };

      manager.addHandler(handler);
      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);
      manager.removeConnection('conn-1', 'test reason');

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(handler.onDisconnect).toHaveBeenCalledWith('conn-1', 'test reason');
    });

    it('should remove handler', () => {
      const handler = {
        onConnect: vi.fn().mockResolvedValue(undefined),
        onDisconnect: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn().mockResolvedValue(undefined),
      };

      manager.addHandler(handler);
      manager.removeHandler(handler);

      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      // Handler should not be called after removal
      expect(handler.onConnect).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should process incoming messages', async () => {
      const mockSocket = { send: vi.fn() };
      const metadata = createMockPresenceMetadata();
      const handler = {
        onConnect: vi.fn().mockResolvedValue(undefined),
        onDisconnect: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn().mockResolvedValue(undefined),
      };

      manager.addHandler(handler);
      manager.registerConnection('conn-1', 'user-1', mockSocket, metadata);

      const rawMessage = JSON.stringify({
        type: SAMEventType.ACTIVITY,
        payload: { test: true },
        timestamp: new Date().toISOString(),
      });

      await manager.handleMessage('conn-1', rawMessage);

      expect(handler.onMessage).toHaveBeenCalled();
    });

    it('should ignore messages from unknown connections', async () => {
      const handler = {
        onConnect: vi.fn().mockResolvedValue(undefined),
        onDisconnect: vi.fn().mockResolvedValue(undefined),
        onMessage: vi.fn().mockResolvedValue(undefined),
      };

      manager.addHandler(handler);

      const rawMessage = JSON.stringify({
        type: SAMEventType.ACTIVITY,
        payload: {},
        timestamp: new Date().toISOString(),
      });

      await manager.handleMessage('non-existent', rawMessage);

      expect(handler.onMessage).not.toHaveBeenCalled();
    });
  });
});
