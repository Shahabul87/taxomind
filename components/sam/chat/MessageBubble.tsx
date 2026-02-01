"use client";

import React from 'react';
import {
  Copy,
  ClipboardCheck,
  ArrowDownToLine,
  Check,
  Brain,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackButtons } from '@/components/sam/FeedbackButtons';
import { ConfidenceIndicator } from '@/components/sam/confidence';
import { ToolResultCard } from './panels/ToolResultCard';
import type { ChatMessage, AgenticInsight, SelfCritiqueData } from './types';
import type { FormFieldInfo } from '@/lib/sam/form-actions';

interface MessageBubbleProps {
  message: ChatMessage;
  messageIndex: number;
  isLastMessage: boolean;
  isStreaming: boolean;
  sessionId?: string;
  confidence?: AgenticInsight['confidence'];
  // Copy/Insert
  copiedMessageId: string | null;
  insertedMessageId: string | null;
  onCopy: (messageId: string, content: string) => void;
  onInsert: (messageId: string, content: string, targetField?: string) => void;
  // Content helpers
  isInsertableContent: (content: string, userQuery?: string) => boolean;
  detectTargetField: (userQuery: string, detectedForms: Record<string, FormFieldInfo>) => string | null;
  detectedForms: Record<string, FormFieldInfo>;
  getUserQuery: (messageIndex: number) => string | undefined;
  // Self-critique
  selfCritiqueData?: SelfCritiqueData | null;
  showSelfCritique?: boolean;
  isLoadingSelfCritique?: boolean;
  onFetchSelfCritique?: (content: string) => void;
  onDismissSelfCritique?: () => void;
  className?: string;
}

export function MessageBubble({
  message,
  messageIndex,
  isLastMessage,
  isStreaming,
  sessionId,
  confidence,
  copiedMessageId,
  insertedMessageId,
  onCopy,
  onInsert,
  isInsertableContent: checkInsertable,
  detectTargetField: detectTarget,
  detectedForms,
  getUserQuery,
  selfCritiqueData,
  showSelfCritique,
  isLoadingSelfCritique,
  onFetchSelfCritique,
  onDismissSelfCritique,
  className,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isMessageStreaming = isStreaming && isLastMessage && isAssistant;

  const userQuery = message.userQuery || getUserQuery(messageIndex);
  const showActions = isAssistant && !isMessageStreaming && checkInsertable(message.content, userQuery);
  const targetField = userQuery
    ? message.targetField || detectTarget(userQuery, detectedForms)
    : null;

  return (
    <div
      className={cn(
        'flex sam-animate-in',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
      style={{ animationDelay: `${messageIndex * 30}ms` }}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 relative',
          isUser
            ? 'rounded-br-md'
            : 'rounded-bl-md'
        )}
        style={{
          background: isUser
            ? 'var(--sam-bubble-user)'
            : 'var(--sam-bubble-assistant)',
          color: isUser
            ? 'var(--sam-bubble-user-text)'
            : 'var(--sam-bubble-assistant-text)',
        }}
      >
        {/* Assistant avatar indicator */}
        {isAssistant && (
          <div className="flex items-center gap-1.5 mb-1 opacity-60">
            <Sparkles className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase tracking-wider">SAM</span>
          </div>
        )}

        {/* Tool Result Card (rich rendering) */}
        {message.toolResult ? (
          <ToolResultCard
            toolId={message.toolResult.toolId}
            toolName={message.toolResult.toolName}
            result={message.toolResult.result}
            status={message.toolResult.status}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isMessageStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--sam-accent)] animate-pulse rounded-sm" />
            )}
          </p>
        )}

        {/* Copy/Insert Actions */}
        {showActions && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => onCopy(message.id, message.content)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all duration-200',
                copiedMessageId === message.id
                  ? 'bg-[var(--sam-success)]/20 text-[var(--sam-success)]'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20'
              )}
              title="Copy to clipboard"
            >
              {copiedMessageId === message.id ? (
                <>
                  <ClipboardCheck className="h-3 w-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={() =>
                onInsert(message.id, message.content, targetField ?? undefined)
              }
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all duration-200',
                insertedMessageId === message.id
                  ? 'bg-[var(--sam-success)]/20 text-[var(--sam-success)]'
                  : 'bg-[var(--sam-accent)]/10 text-[var(--sam-accent)] hover:bg-[var(--sam-accent)]/20'
              )}
              title={
                targetField
                  ? `Insert into ${targetField} field`
                  : 'Insert into form field'
              }
            >
              {insertedMessageId === message.id ? (
                <>
                  <Check className="h-3 w-3" />
                  <span>Inserted!</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-3 w-3" />
                  <span>
                    {targetField ? `Insert to ${targetField}` : 'Insert'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Feedback Buttons */}
        {isAssistant && !isMessageStreaming && sessionId && (
          <FeedbackButtons
            messageId={message.id}
            sessionId={sessionId}
            className="mt-1.5"
            size="sm"
          />
        )}

        {/* Confidence Indicator */}
        {isAssistant && !isMessageStreaming && confidence && (
          <ConfidenceIndicator
            confidence={confidence.score}
            mode="badge"
            showPercentage={true}
            size="sm"
            className="mt-1"
          />
        )}

        {/* Self-Critique (only on last assistant message) */}
        {isAssistant && !isMessageStreaming && isLastMessage && onFetchSelfCritique && (
          <div className="mt-2">
            {!showSelfCritique && !selfCritiqueData && (
              <button
                onClick={() => onFetchSelfCritique(message.content)}
                disabled={isLoadingSelfCritique}
                className="flex items-center gap-1.5 px-2 py-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                {isLoadingSelfCritique ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3" />
                    <span>View AI Self-Assessment</span>
                  </>
                )}
              </button>
            )}
            {showSelfCritique && selfCritiqueData && onDismissSelfCritique && (
              <div className="mt-2">
                <button
                  onClick={onDismissSelfCritique}
                  className="text-xs opacity-50 hover:opacity-100"
                >
                  Hide assessment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
