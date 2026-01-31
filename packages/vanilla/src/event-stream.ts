/**
 * SSE EventSource wrapper for real-time SAM events
 */

import type { SSEEvent, EventCallback } from './types';

export interface EventStreamOptions {
  baseUrl: string;
  apiKey?: string;
  maxReconnectAttempts?: number;
}

export class SAMEventStream {
  private eventSource: EventSource | null = null;
  private listeners = new Map<string, Set<EventCallback>>();
  private reconnectAttempts = 0;
  private maxReconnects: number;
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: EventStreamOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.maxReconnects = options.maxReconnectAttempts ?? 10;
  }

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (typeof EventSource === 'undefined') {
      throw new Error('EventSource not available in this environment');
    }

    const url = `${this.baseUrl}/api/sam/realtime/events`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        this.emit(data.type, data);
        this.emit('*', data); // Wildcard listener
      } catch {
        // Ignore malformed events
      }
    };

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;

      if (this.reconnectAttempts < this.maxReconnects) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    };
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  private emit(eventType: string, event: SSEEvent): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      for (const cb of callbacks) {
        cb(event);
      }
    }
  }
}
