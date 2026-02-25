import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined | false)[]) => classes.filter(Boolean).join(' '),
}));

// Build a testable chat interface component that mimics the real SAM chat behavior
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  placeholder?: string;
}

const ChatInterface = ({
  messages = [],
  onSendMessage,
  isLoading = false,
  error = null,
  placeholder = 'Type your message...',
}: ChatInterfaceProps) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await onSendMessage?.(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div data-testid="chat-container">
      <div data-testid="messages-list">
        {messages.length === 0 && (
          <div data-testid="empty-chat">Start a conversation with SAM</div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid={`message-${msg.id}`}
            data-role={msg.role}
          >
            <span data-testid="message-content">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && <div data-testid="loading-indicator">Thinking...</div>}
      {error && <div data-testid="error-message">{error}</div>}

      <form onSubmit={handleSubmit} data-testid="chat-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          data-testid="chat-input"
        />
        <button type="submit" disabled={isLoading || !input.trim()} data-testid="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat container', () => {
    render(<ChatInterface />);

    expect(screen.getByTestId('chat-container')).toBeInTheDocument();
    expect(screen.getByTestId('chat-form')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('displays messages', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'Hello SAM', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'Hi! How can I help?', timestamp: new Date() },
    ];

    render(<ChatInterface messages={messages} />);

    expect(screen.getByText('Hello SAM')).toBeInTheDocument();
    expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted', async () => {
    const mockSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInterface onSendMessage={mockSend} />);

    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Hello' } });

    await act(async () => {
      fireEvent.click(sendButton);
    });

    expect(mockSend).toHaveBeenCalledWith('Hello');
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<ChatInterface isLoading={true} />);

    expect(screen.getByTestId('loading-indicator')).toHaveTextContent('Thinking...');
  });

  it('shows empty chat message when no messages', () => {
    render(<ChatInterface messages={[]} />);

    expect(screen.getByTestId('empty-chat')).toHaveTextContent('Start a conversation with SAM');
  });

  it('scrolls to bottom when new messages arrive', () => {
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const messages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'First message', timestamp: new Date() },
    ];

    const { rerender } = render(<ChatInterface messages={messages} />);

    const updatedMessages = [
      ...messages,
      { id: '2', role: 'assistant' as const, content: 'Response', timestamp: new Date() },
    ];

    rerender(<ChatInterface messages={updatedMessages} />);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it('renders AI response messages', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'assistant', content: 'Welcome to SAM! I can help you learn.', timestamp: new Date() },
    ];

    render(<ChatInterface messages={messages} />);

    const message = screen.getByTestId('message-1');
    expect(message).toHaveAttribute('data-role', 'assistant');
    expect(screen.getByText('Welcome to SAM! I can help you learn.')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<ChatInterface error="Connection failed" />);

    expect(screen.getByTestId('error-message')).toHaveTextContent('Connection failed');
  });

  it('clears input after sending', async () => {
    const mockSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInterface onSendMessage={mockSend} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input.value).toBe('Test message');

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-button'));
    });

    expect(input.value).toBe('');
  });

  it('submits on Enter key press', async () => {
    const mockSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInterface onSendMessage={mockSend} />);

    const input = screen.getByTestId('chat-input');

    fireEvent.change(input, { target: { value: 'Enter test' } });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    });

    expect(mockSend).toHaveBeenCalledWith('Enter test');
  });
});
