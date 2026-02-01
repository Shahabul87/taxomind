"use client";

import React, { useCallback, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from './types';
import type { FormFieldInfo } from '@/lib/sam/form-actions';

interface MessageAreaProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  isStreaming: boolean;
  error: string | null;
  onDismissError: () => void;
  sessionId?: string;
  // Copy/Insert
  copiedMessageId: string | null;
  insertedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
  onInsert: (messageId: string, content: string, targetField?: string) => void;
  isInsertableContent: (content: string, userQuery?: string) => boolean;
  detectTargetField: (userQuery: string, detectedForms: Record<string, FormFieldInfo>) => string | null;
  detectedForms: Record<string, FormFieldInfo>;
  // Quick actions
  quickActions?: Array<{ label: string; icon: React.ReactNode; action: string; isAnalysis?: boolean }>;
  onQuickAction?: (action: string) => void;
  className?: string;
}

export function MessageArea({
  messages,
  isProcessing,
  isStreaming,
  error,
  onDismissError,
  sessionId,
  copiedMessageId,
  insertedMessageId,
  onCopy,
  onInsert,
  isInsertableContent,
  detectTargetField,
  detectedForms,
  quickActions,
  onQuickAction,
  className,
}: MessageAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getUserQuery = useCallback(
    (messageIndex: number): string | undefined => {
      if (messageIndex > 0) {
        const prevMessage = messages[messageIndex - 1];
        if (prevMessage?.role === 'user') {
          return prevMessage.content;
        }
      }
      return undefined;
    },
    [messages]
  );

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-4 py-3 space-y-3 sam-scrollbar',
        className
      )}
    >
      {/* Empty state with quick actions */}
      {messages.length === 0 && quickActions && onQuickAction && (
        <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--sam-accent)', opacity: 0.15 }}
          >
            <span className="text-2xl">🧠</span>
          </div>
          <div className="text-center">
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--sam-text)' }}
            >
              How can I help?
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--sam-text-secondary)' }}
            >
              Ask a question or try a quick action
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center max-w-[300px]">
            {quickActions.slice(0, 4).map((qa, idx) => (
              <button
                key={idx}
                onClick={() => onQuickAction(qa.action)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                  'border border-[var(--sam-border)]',
                  'text-[var(--sam-text-secondary)]',
                  'hover:bg-[var(--sam-accent)] hover:text-white hover:border-[var(--sam-accent)]',
                  'transition-all duration-200 active:scale-95'
                )}
              >
                {qa.icon}
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.map((message, idx) => (
        <MessageBubble
          key={message.id}
          message={message}
          messageIndex={idx}
          isLastMessage={idx === messages.length - 1}
          isStreaming={isStreaming}
          sessionId={sessionId}
          copiedMessageId={copiedMessageId}
          insertedMessageId={insertedMessageId}
          onCopy={onCopy}
          onInsert={onInsert}
          isInsertableContent={isInsertableContent}
          detectTargetField={detectTargetField}
          detectedForms={detectedForms}
          getUserQuery={getUserQuery}
        />
      ))}

      {/* Typing indicator */}
      {isProcessing &&
        messages[messages.length - 1]?.role !== 'assistant' && (
          <TypingIndicator />
        )}

      {/* Error display */}
      {error && (
        <div
          className="rounded-xl p-3 flex items-start gap-2 sam-animate-in"
          style={{
            background: 'var(--sam-error)',
            opacity: 0.1,
          }}
        >
          <AlertCircle className="h-4 w-4 text-[var(--sam-error)] mt-0.5" />
          <div>
            <p className="text-sm text-[var(--sam-error)]">{error}</p>
            <button
              onClick={onDismissError}
              className="text-xs text-[var(--sam-error)] hover:underline mt-1 opacity-70"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
