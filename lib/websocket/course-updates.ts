"use client";

import { CourseUpdateEvent } from "@/types/course";
import { logger } from "@/lib/logger";

export type UpdateCallback = (event: CourseUpdateEvent) => void;

export class CourseWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, UpdateCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(private url?: string) {
    // Use environment variable or default to current host
    this.url = url || (typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/courses`
      : undefined);
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      logger.info('WebSocket already connecting or connected');
      return;
    }

    if (!this.url) {
      logger.error('WebSocket URL not available');
      return;
    }

    try {
      this.isConnecting = true;
      logger.info('Connecting to WebSocket', { url: this.url });

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        logger.info('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Send authentication if needed
        this.authenticate();

        // Start ping/pong to keep connection alive
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error });
        }
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error', { error });
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        logger.info('WebSocket closed');
        this.isConnecting = false;
        this.stopPing();
        this.attemptReconnect();
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection', { error });
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    logger.info('Disconnecting WebSocket');
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to updates
   */
  subscribe(id: string, callback: UpdateCallback): () => void {
    this.listeners.set(id, callback);
    logger.info('Subscribed to updates', { id });

    // Ensure connection is active
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(id: string): void {
    this.listeners.delete(id);
    logger.info('Unsubscribed from updates', { id });

    // Disconnect if no more listeners
    if (this.listeners.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Send a message to the server
   */
  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      logger.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: CourseUpdateEvent): void {
    logger.info('Received WebSocket message', { type: data.type });

    // Notify all listeners
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error('Error in WebSocket listener callback', { error });
      }
    });
  }

  /**
   * Authenticate with the server
   */
  private authenticate(): void {
    // Get auth token from localStorage or cookie
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (token) {
      this.send({
        type: 'AUTH',
        token,
      });
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('Attempting to reconnect', {
      attempt: this.reconnectAttempts,
      delay
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.CLOSED:
      case WebSocket.CLOSING:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

// Singleton instance
let wsClient: CourseWebSocketClient | null = null;

/**
 * Get WebSocket client instance
 */
export function getCourseWebSocketClient(): CourseWebSocketClient {
  if (!wsClient) {
    wsClient = new CourseWebSocketClient();
  }
  return wsClient;
}

/**
 * Hook for using WebSocket updates in React components
 */
export function useCourseWebSocket(callback: UpdateCallback): {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  disconnect: () => void;
} {
  const client = getCourseWebSocketClient();
  const [status, setStatus] = React.useState(client.getStatus());

  React.useEffect(() => {
    // Subscribe to updates
    const unsubscribe = client.subscribe('dashboard', callback);

    // Update status periodically
    const statusInterval = setInterval(() => {
      setStatus(client.getStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [callback, client]);

  return {
    status,
    disconnect: () => client.disconnect(),
  };
}

// Export for use in components
import React from 'react';
