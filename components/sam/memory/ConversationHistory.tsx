'use client';

/**
 * ConversationHistory
 *
 * Displays past conversation context from SAM memory.
 * Shows conversation turns with role indicators and timestamps.
 *
 * Features:
 * - Load conversation by session ID
 * - Visual role differentiation (User, Assistant, System, Tool)
 * - Timestamp display
 * - Expandable turn content
 * - Session selection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  User,
  Bot,
  Settings,
  Wrench,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  Hash,
} from 'lucide-react';
import { useSAMMemory } from '@sam-ai/react';
import type { ConversationTurn } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface ConversationHistoryProps {
  className?: string;
  /** Session ID to load */
  sessionId?: string;
  /** Maximum turns to load */
  maxTurns?: number;
  /** Show session selector */
  showSessionSelector?: boolean;
  /** Callback when turn is clicked */
  onTurnClick?: (turn: ConversationTurn) => void;
  /** Compact mode for embedding */
  compact?: boolean;
  /** Auto-load on mount */
  autoLoad?: boolean;
}

type TurnRole = 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_CONFIG: Record<
  TurnRole,
  {
    icon: typeof User;
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  USER: {
    icon: User,
    label: 'You',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  ASSISTANT: {
    icon: Bot,
    label: 'SAM',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  SYSTEM: {
    icon: Settings,
    label: 'System',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  TOOL: {
    icon: Wrench,
    label: 'Tool',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TurnCard({
  turn,
  expanded,
  onToggle,
  onClick,
  isFirst,
  isLast,
}: {
  turn: ConversationTurn;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const role = turn.role as TurnRole;
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.SYSTEM;
  const Icon = config.icon;

  const contentPreview = turn.content.slice(0, 150);
  const hasMore = turn.content.length > 150;

  return (
    <div
      className={cn(
        'relative pl-8',
        !isLast && 'pb-4'
      )}
    >
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-3 top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Role avatar */}
      <div
        className={cn(
          'absolute left-0 top-0 p-1.5 rounded-full border-2 bg-white dark:bg-gray-900',
          config.borderColor
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', config.textColor)} />
      </div>

      {/* Content card */}
      <div
        className={cn(
          'rounded-lg border p-3 cursor-pointer transition-colors',
          config.bgColor,
          config.borderColor,
          'hover:shadow-sm'
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', config.textColor)}>
              {config.label}
            </span>
            <Badge variant="outline" className="text-xs">
              #{turn.turnNumber}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span title={formatFullDate(turn.createdAt)}>
              {formatTimeAgo(turn.createdAt)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm">
          {expanded ? (
            <p className="whitespace-pre-wrap">{turn.content}</p>
          ) : (
            <p>
              {contentPreview}
              {hasMore && '...'}
            </p>
          )}
        </div>

        {/* Expand toggle */}
        {hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              'flex items-center gap-1 mt-2 text-xs',
              config.textColor,
              'hover:underline'
            )}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="pl-8 relative">
          <Skeleton className="absolute left-0 top-0 h-7 w-7 rounded-full" />
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSessionId }: { hasSessionId: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <MessageSquare className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100">
        {hasSessionId ? 'No conversation found' : 'Enter a session ID'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
        {hasSessionId
          ? 'This session has no recorded conversation turns'
          : 'Enter a session ID to view conversation history'}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationHistory({
  className,
  sessionId: initialSessionId,
  maxTurns = 50,
  showSessionSelector = true,
  onTurnClick,
  compact = false,
  autoLoad = false,
}: ConversationHistoryProps) {
  // State
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [expandedTurns, setExpandedTurns] = useState<Set<string>>(new Set());

  // Hooks
  const {
    getConversationContext,
    conversationHistory,
    isLoadingConversation,
    error,
    clearError,
  } = useSAMMemory({ debug: false });

  // Load conversation
  const loadConversation = useCallback(async () => {
    if (!sessionId.trim()) return;
    clearError();
    await getConversationContext(sessionId, maxTurns);
  }, [sessionId, maxTurns, getConversationContext, clearError]);

  // Auto-load on mount or sessionId change
  useEffect(() => {
    if (autoLoad && sessionId) {
      loadConversation();
    }
  }, [autoLoad, sessionId, loadConversation]);

  // Update internal sessionId when prop changes
  useEffect(() => {
    if (initialSessionId && initialSessionId !== sessionId) {
      setSessionId(initialSessionId);
    }
  }, [initialSessionId, sessionId]);

  // Handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        loadConversation();
      }
    },
    [loadConversation]
  );

  const toggleExpanded = useCallback((turnId: string) => {
    setExpandedTurns((prev) => {
      const next = new Set(prev);
      if (next.has(turnId)) {
        next.delete(turnId);
      } else {
        next.add(turnId);
      }
      return next;
    });
  }, []);

  // Memoized values
  const sortedTurns = useMemo(() => {
    return [...conversationHistory].sort(
      (a, b) => a.turnNumber - b.turnNumber
    );
  }, [conversationHistory]);

  const hasHistory = sortedTurns.length > 0;

  // Summary stats
  const stats = useMemo(() => {
    const roleCount: Record<string, number> = {};
    sortedTurns.forEach((turn) => {
      roleCount[turn.role] = (roleCount[turn.role] || 0) + 1;
    });
    return roleCount;
  }, [sortedTurns]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <CardTitle className={compact ? 'text-base' : undefined}>
            Conversation History
          </CardTitle>
        </div>
        {!compact && (
          <CardDescription>
            View past conversations with SAM
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session selector */}
        {showSessionSelector && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter session ID..."
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button
              onClick={loadConversation}
              disabled={isLoadingConversation || !sessionId.trim()}
            >
              {isLoadingConversation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        {/* Stats bar */}
        {hasHistory && (
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {sortedTurns.length} turn{sortedTurns.length !== 1 ? 's' : ''}
            </div>
            {Object.entries(stats).map(([role, count]) => {
              const config = ROLE_CONFIG[role as TurnRole] || ROLE_CONFIG.SYSTEM;
              return (
                <Badge key={role} variant="outline" className="text-xs">
                  <span className={config.textColor}>{config.label}:</span>{' '}
                  {count}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Conversation Timeline */}
        <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
          {isLoadingConversation ? (
            <LoadingState />
          ) : hasHistory ? (
            <div className="pr-4">
              {sortedTurns.map((turn, index) => (
                <TurnCard
                  key={turn.id}
                  turn={turn}
                  expanded={expandedTurns.has(turn.id)}
                  onToggle={() => toggleExpanded(turn.id)}
                  onClick={() => onTurnClick?.(turn)}
                  isFirst={index === 0}
                  isLast={index === sortedTurns.length - 1}
                />
              ))}
            </div>
          ) : (
            <EmptyState hasSessionId={!!sessionId} />
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ConversationHistory;
