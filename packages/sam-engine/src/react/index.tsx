/**
 * SAM Engine React Components
 * Optional React integration for the SAM Engine
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useRef,
  ReactNode 
} from 'react';
import { SAMEngine } from '../sam-engine';
import type { 
  SAMContext, 
  SAMResponse, 
  SAMEngineConfig, 
  Message,
  User
} from '../types';

// Context type
interface SAMContextValue {
  engine: SAMEngine | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  messages: Message[];
  sendMessage: (message: string, context?: Partial<SAMContext>) => Promise<SAMResponse | null>;
  clearConversation: () => Promise<void>;
  updateContext: (context: Partial<SAMContext>) => void;
}

// Create context
const SAMReactContext = createContext<SAMContextValue | null>(null);

/**
 * SAM Provider Component
 */
export interface SAMProviderProps {
  children: ReactNode;
  config?: SAMEngineConfig;
  user?: User;
  initialContext?: Partial<SAMContext>;
  onError?: (error: Error) => void;
  onMessage?: (message: Message) => void;
}

export function SAMProvider({
  children,
  config,
  user = { id: 'anonymous', isTeacher: false },
  initialContext = {},
  onError,
  onMessage
}: SAMProviderProps) {
  const [engine, setEngine] = useState<SAMEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [context, setContext] = useState<SAMContext>({
    user,
    ...initialContext
  });

  const engineRef = useRef<SAMEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const samEngine = new SAMEngine(config);
        await samEngine.initialize();
        
        // Set up event listeners
        samEngine.on('message.received', (event) => {
          if (onMessage && event.data) {
            onMessage({
              role: 'assistant',
              content: event.data.message,
              timestamp: new Date()
            });
          }
        });

        samEngine.on('error.occurred', (event) => {
          if (onError && event.error) {
            onError(new Error(event.error));
          }
        });

        engineRef.current = samEngine;
        setEngine(samEngine);
        setIsInitialized(true);
      } catch (err: any) {
        setError(err.message);
        if (onError) {
          onError(err);
        }
      }
    };

    initEngine();

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [config, onError, onMessage]);

  // Send message
  const sendMessage = useCallback(async (
    message: string,
    additionalContext?: Partial<SAMContext>
  ): Promise<SAMResponse | null> => {
    if (!engine || !isInitialized) {
      setError('SAM Engine is not initialized');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullContext = {
        ...context,
        ...additionalContext
      };

      const response = await engine.process(fullContext, message);

      // Update messages
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: message,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          metadata: {
            suggestions: response.suggestions,
            contextInsights: response.contextInsights
          }
        }
      ]);

      return response;
    } catch (err: any) {
      setError(err.message);
      if (onError) {
        onError(err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [engine, isInitialized, context, onError]);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    if (!engine) return;

    try {
      await engine.clearConversation(
        context.user.id,
        context.courseId
      );
      setMessages([]);
    } catch (err: any) {
      setError(err.message);
    }
  }, [engine, context]);

  // Update context
  const updateContext = useCallback((newContext: Partial<SAMContext>) => {
    setContext(prev => ({
      ...prev,
      ...newContext
    }));
  }, []);

  const value: SAMContextValue = {
    engine,
    isInitialized,
    isLoading,
    error,
    messages,
    sendMessage,
    clearConversation,
    updateContext
  };

  return (
    <SAMReactContext.Provider value={value}>
      {children}
    </SAMReactContext.Provider>
  );
}

/**
 * Hook to use SAM Engine
 */
export function useSAM() {
  const context = useContext(SAMReactContext);
  
  if (!context) {
    throw new Error('useSAM must be used within a SAMProvider');
  }
  
  return context;
}

/**
 * SAM Chat Component
 */
export interface SAMChatProps {
  className?: string;
  placeholder?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  maxHeight?: string;
  onSendMessage?: (message: string, response: SAMResponse) => void;
}

export function SAMChat({
  className = '',
  placeholder = 'Ask SAM anything...',
  showSuggestions = true,
  autoFocus = false,
  maxHeight = '400px',
  onSendMessage
}: SAMChatProps) {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    error,
    clearConversation 
  } = useSAM();
  
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract suggestions from last message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.metadata?.suggestions) {
      setSuggestions(lastMessage.metadata.suggestions);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setSuggestions([]);

    const response = await sendMessage(message);
    
    if (response && onSendMessage) {
      onSendMessage(message, response);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`sam-chat ${className}`}>
      {/* Messages */}
      <div 
        className="sam-chat-messages"
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`sam-message sam-message-${message.role}`}
          >
            <div className="sam-message-content">
              {message.content}
            </div>
            {message.role === 'assistant' && message.metadata?.contextInsights && (
              <div className="sam-message-insights">
                {message.metadata.contextInsights.observation && (
                  <div className="sam-insight">
                    <strong>Observation:</strong> {message.metadata.contextInsights.observation}
                  </div>
                )}
                {message.metadata.contextInsights.recommendation && (
                  <div className="sam-insight">
                    <strong>Recommendation:</strong> {message.metadata.contextInsights.recommendation}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="sam-message sam-message-loading">
            <div className="sam-loading-indicator">SAM is thinking...</div>
          </div>
        )}
        {error && (
          <div className="sam-message sam-message-error">
            <div className="sam-error-content">Error: {error}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="sam-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="sam-suggestion"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="sam-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isLoading}
          className="sam-input"
          rows={2}
        />
        <div className="sam-chat-actions">
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="sam-send-button"
          >
            Send
          </button>
          <button
            onClick={clearConversation}
            disabled={isLoading || messages.length === 0}
            className="sam-clear-button"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SAM Floating Assistant
 */
export interface SAMFloatingAssistantProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultOpen?: boolean;
  buttonText?: string;
  title?: string;
}

export function SAMFloatingAssistant({
  position = 'bottom-right',
  defaultOpen = false,
  buttonText = 'Ask SAM',
  title = 'SAM Assistant'
}: SAMFloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {isOpen ? (
        <div className="sam-floating-panel">
          <div className="sam-floating-header">
            <h3>{title}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="sam-close-button"
            >
              ×
            </button>
          </div>
          <SAMChat maxHeight="300px" autoFocus />
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="sam-floating-button"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

// Export hooks
export { useSAM as useSAMEngine };

// Export context for advanced use cases
export { SAMReactContext };