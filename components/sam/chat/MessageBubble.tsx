"use client";

import React from 'react';
import {
  Copy,
  ClipboardCheck,
  ArrowDownToLine,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackButtons } from '@/components/sam/FeedbackButtons';
import { ToolResultCard } from './panels/ToolResultCard';
import { EngineTransparencyPanel } from './panels/EngineTransparencyPanel';
import { SkillRoadmapToolRenderer } from './SkillRoadmapToolRenderer';
import { NavigatorToolRenderer } from './NavigatorToolRenderer';
import { LearningAnalyticsToolRenderer } from './LearningAnalyticsToolRenderer';
import type { ChatMessage } from './types';
import type { FormFieldInfo } from '@/lib/sam/form-actions';

interface MessageBubbleProps {
  message: ChatMessage;
  messageIndex: number;
  isLastMessage: boolean;
  isStreaming: boolean;
  sessionId?: string;
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
  // Conversational tool support
  onSendMessage?: (message: string) => void;
  className?: string;
}

export function MessageBubble({
  message,
  messageIndex,
  isLastMessage,
  isStreaming,
  sessionId,
  copiedMessageId,
  insertedMessageId,
  onCopy,
  onInsert,
  isInsertableContent: checkInsertable,
  detectTargetField: detectTarget,
  detectedForms,
  getUserQuery,
  onSendMessage,
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
          // Check for conversational tool results with valid output
          (() => {
            const toolId = message.toolResult!.toolId;
            // Tool execution returns { success, output }, extract the nested output
            const toolOutput = (message.toolResult!.result as { output?: unknown })?.output as Record<string, unknown> | null;

            // Skill Roadmap Tool
            if (toolId === 'sam-skill-roadmap-generator') {
              const skillRoadmapOutput = toolOutput as Parameters<typeof SkillRoadmapToolRenderer>[0]['output'] | null;
              const hasValidOutput = skillRoadmapOutput?.type === 'conversation' || skillRoadmapOutput?.type === 'generate_roadmap';

              if (hasValidOutput && onSendMessage) {
                return (
                  <SkillRoadmapToolRenderer
                    output={skillRoadmapOutput}
                    onSendMessage={onSendMessage}
                    onViewRoadmap={(roadmapId) => {
                      onSendMessage(`Show me the roadmap ${roadmapId}`);
                    }}
                    isInteractive={isLastMessage && !isMessageStreaming}
                  />
                );
              }
            }

            // Skill Navigator Tool
            if (toolId === 'sam-skill-navigator') {
              const navigatorOutput = toolOutput as Parameters<typeof NavigatorToolRenderer>[0]['output'] | null;
              const hasValidOutput = navigatorOutput?.type === 'conversation' || navigatorOutput?.type === 'generate_roadmap';

              if (hasValidOutput && onSendMessage) {
                return (
                  <NavigatorToolRenderer
                    output={navigatorOutput}
                    onSendMessage={onSendMessage}
                    onViewRoadmap={(roadmapId) => {
                      onSendMessage(`Show me the roadmap ${roadmapId}`);
                    }}
                    isInteractive={isLastMessage && !isMessageStreaming}
                  />
                );
              }
            }

            // Learning Analytics Tool
            if (toolId === 'sam-learning-analytics') {
              const analyticsOutput = toolOutput as Parameters<typeof LearningAnalyticsToolRenderer>[0]['output'] | null;
              const hasValidOutput = analyticsOutput?.type === 'conversation' || analyticsOutput?.type === 'generate_analytics';

              if (hasValidOutput && onSendMessage) {
                return (
                  <LearningAnalyticsToolRenderer
                    output={analyticsOutput}
                    onSendMessage={onSendMessage}
                    isInteractive={isLastMessage && !isMessageStreaming}
                  />
                );
              }
            }

            // Default tool result card for other tools
            return (
              <ToolResultCard
                toolId={message.toolResult!.toolId}
                toolName={message.toolResult!.toolName}
                result={message.toolResult!.result}
                status={message.toolResult!.status}
              />
            );
          })()
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
            {isMessageStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--sam-accent)] animate-pulse rounded-sm" />
            )}
          </p>
        )}

        {/* Engine Transparency Panel */}
        {isAssistant && message.engineInsights && (
          <EngineTransparencyPanel insights={message.engineInsights} />
        )}

        {/* Actions row: Copy, Insert, Feedback — all on one line */}
        {isAssistant && !isMessageStreaming && (
          <div className="flex items-center gap-1 mt-2">
            {showActions && (
              <>
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
              </>
            )}

            {sessionId && (
              <FeedbackButtons
                messageId={message.id}
                sessionId={sessionId}
                size="sm"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
