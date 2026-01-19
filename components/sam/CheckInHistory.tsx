'use client';

/**
 * CheckInHistory
 *
 * Displays a history of past SAM check-ins and their responses.
 * Shows patterns in learner engagement and emotional state over time.
 *
 * Features:
 * - Chronological list of past check-ins
 * - Response summaries and actions taken
 * - Emotional state tracking
 * - Filtering by type and date range
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  History,
  Clock,
  TrendingUp,
  Target,
  MessageSquare,
  Award,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { CheckInType } from './CheckInModal';

// ============================================================================
// TYPES
// ============================================================================

export interface CheckInHistoryItem {
  id: string;
  type: CheckInType;
  message: string;
  status: 'responded' | 'dismissed' | 'expired';
  createdAt: string;
  respondedAt?: string;
  response?: {
    answers: Array<{ questionId: string; value: string | number | boolean }>;
    selectedActions: string[];
    emotionalState?: string;
  };
}

export interface CheckInHistoryProps {
  className?: string;
  /** Maximum items to display */
  limit?: number;
  /** Filter by type */
  typeFilter?: CheckInType | 'all';
  /** Show filtering controls */
  showFilters?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** On item click callback */
  onItemClick?: (item: CheckInHistoryItem) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHECK_IN_CONFIG: Record<
  CheckInType,
  { icon: typeof Clock; label: string; color: string }
> = {
  daily_reminder: {
    icon: Clock,
    label: 'Daily Reminder',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  },
  progress_check: {
    icon: TrendingUp,
    label: 'Progress Check',
    color: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  },
  struggle_detection: {
    icon: AlertTriangle,
    label: 'Support Alert',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  },
  milestone_celebration: {
    icon: Award,
    label: 'Milestone',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  },
  inactivity_reengagement: {
    icon: MessageSquare,
    label: 'Re-engagement',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30',
  },
  streak_risk: {
    icon: AlertTriangle,
    label: 'Streak Risk',
    color: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  },
  weekly_summary: {
    icon: Calendar,
    label: 'Weekly Summary',
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  },
};

const STATUS_CONFIG: Record<
  CheckInHistoryItem['status'],
  { icon: typeof CheckCircle2; label: string; color: string }
> = {
  responded: {
    icon: CheckCircle2,
    label: 'Responded',
    color: 'text-green-600',
  },
  dismissed: {
    icon: XCircle,
    label: 'Dismissed',
    color: 'text-gray-500',
  },
  expired: {
    icon: Clock,
    label: 'Expired',
    color: 'text-amber-500',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// COMPONENTS
// ============================================================================

function HistoryItemSkeleton() {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function HistoryItem({
  item,
  expanded,
  onToggle,
  onClick,
  compact,
}: {
  item: CheckInHistoryItem;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  compact?: boolean;
}) {
  const config = CHECK_IN_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];
  const Icon = config.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'border rounded-lg transition-colors',
        'hover:border-indigo-200 dark:hover:border-indigo-800',
        expanded && 'border-indigo-300 dark:border-indigo-700'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-full', config.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{config.label}</span>
              <Badge
                variant="outline"
                className={cn('text-xs', statusConfig.color)}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {!compact && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {item.message}
          </p>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t pt-3 space-y-3">
              <p className="text-sm">{item.message}</p>

              {item.response && (
                <div className="space-y-2">
                  {item.response.emotionalState && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Mood:</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.response.emotionalState}
                      </Badge>
                    </div>
                  )}

                  {item.response.answers.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        {item.response.answers.length} question(s) answered
                      </span>
                    </div>
                  )}

                  {item.response.selectedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.response.selectedActions.map((action) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {onClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClick}
                  className="w-full"
                >
                  View Details
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CheckInHistory({
  className,
  limit = 20,
  typeFilter = 'all',
  showFilters = true,
  compact = false,
  onItemClick,
}: CheckInHistoryProps) {
  const [items, setItems] = useState<CheckInHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CheckInType | 'all'>(typeFilter);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const response = await fetch(`/api/sam/agentic/checkins/history?${params}`);

      if (!response.ok) {
        // Parse the error response to get more details
        let errorMessage = 'Failed to fetch check-in history';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (response.status === 401) {
            errorMessage = 'Please sign in to view check-in history';
          }
          console.error('[CheckInHistory] API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        } catch {
          console.error('[CheckInHistory] API error:', {
            status: response.status,
            statusText: response.statusText,
          });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success && data.data?.history) {
        setItems(data.data.history);
      } else {
        setItems([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load check-in history';
      console.error('[CheckInHistory] Fetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
    const total = items.length;
    const responded = items.filter((i) => i.status === 'responded').length;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    return { total, responded, responseRate };
  }, [items]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base">Check-In History</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchHistory}
            disabled={isLoading}
            className="h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          {stats.total} check-ins • {stats.responseRate}% response rate
        </CardDescription>
      </CardHeader>

      {showFilters && (
        <div className="px-4 pb-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CHECK_IN_CONFIG).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <CardContent className="pt-0">
        {error ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchHistory} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <HistoryItemSkeleton key={i} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-6">
            <History className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">No check-in history yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggle={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    onClick={onItemClick ? () => onItemClick(item) : undefined}
                    compact={compact}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default CheckInHistory;
