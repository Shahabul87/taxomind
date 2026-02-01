import { useCallback, useRef, useState } from 'react';
import type { ChatMessage, EntityContextState } from '../types';

interface UseSendMessageOptions {
  samSendMessage: (content: string) => Promise<unknown>;
  buildContextUpdate: () => { effectiveEntityContext: EntityContextState };
  onError?: (error: Error) => void;
  onSuccess?: (content: string, entityContext: EntityContextState) => void;
  recordActivity?: () => void;
}

interface UseSendMessageReturn {
  input: string;
  setInput: (value: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  clearError: () => void;
}

export function useSendMessage(options: UseSendMessageOptions): UseSendMessageReturn {
  const { samSendMessage, buildContextUpdate, onError, onSuccess, recordActivity } = options;

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ref for isProcessing to avoid stale closures
  const isProcessingRef = useRef(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isProcessingRef.current) return;
      isProcessingRef.current = true;
      setInput('');
      setError(null);

      recordActivity?.();

      const { effectiveEntityContext } = buildContextUpdate();

      try {
        const result = await samSendMessage(content.trim());

        if (!result) {
          const err = new Error('Failed to get response');
          onError?.(err);
          setError(err.message);
          return;
        }

        onSuccess?.(content, effectiveEntityContext);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
        setError(error.message);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [samSendMessage, buildContextUpdate, onError, onSuccess, recordActivity]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [sendMessage, input]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    input,
    setInput,
    error,
    setError,
    sendMessage,
    handleKeyPress,
    clearError,
  };
}
