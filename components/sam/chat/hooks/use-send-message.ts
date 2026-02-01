import { useCallback, useRef, useState } from 'react';
import type { EntityContextState } from '../types';
import { cacheResponse } from '@/lib/sam/cache/response-cache';

interface UseSendMessageOptions {
  samSendMessage: (content: string) => Promise<unknown>;
  buildContextUpdate: () => { effectiveEntityContext: EntityContextState };
  onError?: (error: Error) => void;
  onSuccess?: (content: string, entityContext: EntityContextState) => void;
  recordActivity?: () => void;
  onDegradedFailure?: () => void;
  onDegradedSuccess?: () => void;
  mode?: string;
  pageType?: string;
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
  const {
    samSendMessage,
    buildContextUpdate,
    onError,
    onSuccess,
    recordActivity,
    onDegradedFailure,
    onDegradedSuccess,
    mode,
    pageType,
  } = options;

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
          onDegradedFailure?.();
          onError?.(err);
          setError(err.message);
          return;
        }

        onDegradedSuccess?.();
        onSuccess?.(content, effectiveEntityContext);

        // Cache response for degraded mode fallback
        const resultObj = result as Record<string, unknown> | undefined;
        const responseText = typeof resultObj?.response === 'string' ? resultObj.response : '';
        const confidence =
          (resultObj?.insights as Record<string, unknown> | undefined)?.agentic != null
            ? ((resultObj?.insights as Record<string, unknown>)?.agentic as Record<string, unknown>)
                ?.confidence
              ? (
                  ((resultObj?.insights as Record<string, unknown>)?.agentic as Record<string, unknown>)
                    ?.confidence as Record<string, unknown>
                )?.score
              : undefined
            : undefined;

        if (responseText && mode && pageType) {
          cacheResponse(
            content.trim(),
            responseText,
            mode,
            pageType,
            typeof confidence === 'number' ? confidence : 0.8,
          );
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onDegradedFailure?.();
        onError?.(error);
        setError(error.message);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [samSendMessage, buildContextUpdate, onError, onSuccess, recordActivity, onDegradedFailure, onDegradedSuccess, mode, pageType]
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
