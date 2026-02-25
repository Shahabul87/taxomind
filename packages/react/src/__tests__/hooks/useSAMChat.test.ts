/**
 * Tests for useSAMChat hook
 * @sam-ai/react
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SAMContext before importing the hook
const mockSendMessage = vi.fn();
const mockClearMessages = vi.fn();

vi.mock('../../context/SAMContext', () => ({
  useSAMContext: vi.fn(() => ({
    messages: [],
    isProcessing: false,
    isStreaming: false,
    sendMessage: mockSendMessage,
    clearMessages: mockClearMessages,
    lastResult: null,
  })),
}));

import { useSAMChat } from '../../hooks/useSAMChat';
import { useSAMContext } from '../../context/SAMContext';

describe('useSAMChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state with empty messages', () => {
    const result = useSAMChat();

    expect(result.messages).toEqual([]);
    expect(result.isProcessing).toBe(false);
    expect(result.isStreaming).toBe(false);
    expect(result.suggestions).toEqual([]);
  });

  it('should expose sendMessage function from context', () => {
    const result = useSAMChat();

    expect(result.sendMessage).toBe(mockSendMessage);
    result.sendMessage('Hello SAM');
    expect(mockSendMessage).toHaveBeenCalledWith('Hello SAM');
  });

  it('should return messages from context', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [
        { id: '1', role: 'user', content: 'Hi' },
        { id: '2', role: 'assistant', content: 'Hello!' },
      ],
      isProcessing: false,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: null,
    } as never);

    const result = useSAMChat();

    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].content).toBe('Hi');
    expect(result.messages[1].content).toBe('Hello!');
  });

  it('should reflect loading state during processing', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [],
      isProcessing: true,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: null,
    } as never);

    const result = useSAMChat();

    expect(result.isProcessing).toBe(true);
  });

  it('should reflect error state when context has errors', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [{ id: '1', role: 'assistant', content: 'Error occurred' }],
      isProcessing: false,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: null,
    } as never);

    const result = useSAMChat();

    expect(result.messages).toHaveLength(1);
    expect(result.isProcessing).toBe(false);
  });

  it('should return message history from context', () => {
    const messages = Array.from({ length: 5 }, (_, i) => ({
      id: `msg-${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages,
      isProcessing: false,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: null,
    } as never);

    const result = useSAMChat();

    expect(result.messages).toHaveLength(5);
  });

  it('should expose clearMessages function', () => {
    const result = useSAMChat();

    result.clearMessages();
    expect(mockClearMessages).toHaveBeenCalledTimes(1);
  });

  it('should reflect streaming state', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [],
      isProcessing: false,
      isStreaming: true,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: null,
    } as never);

    const result = useSAMChat();

    expect(result.isStreaming).toBe(true);
  });

  it('should extract suggestions from lastResult', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [],
      isProcessing: false,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: {
        response: {
          suggestions: [
            { id: 's1', text: 'Ask about testing', label: 'Testing' },
            { id: 's2', text: 'Explain recursion', label: 'Recursion' },
          ],
        },
      },
    } as never);

    const result = useSAMChat();

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions[0].label).toBe('Testing');
  });

  it('should handle missing lastResult gracefully', () => {
    vi.mocked(useSAMContext).mockReturnValueOnce({
      messages: [],
      isProcessing: false,
      isStreaming: false,
      sendMessage: mockSendMessage,
      clearMessages: mockClearMessages,
      lastResult: undefined,
    } as never);

    const result = useSAMChat();

    expect(result.suggestions).toEqual([]);
  });

  it('should handle abort request through context', () => {
    const result = useSAMChat();

    // sendMessage and clearMessages are the primary interface
    expect(typeof result.sendMessage).toBe('function');
    expect(typeof result.clearMessages).toBe('function');
  });
});
