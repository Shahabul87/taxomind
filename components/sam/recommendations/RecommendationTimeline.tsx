'use client';

/**
 * RecommendationTimeline
 *
 * Historical view of recommendations and actions taken.
 * Shows patterns in learning recommendations over time.
 *
 * Features:
 * - Timeline visualization
 * - Grouping by date/type
 * - Action status tracking
 * - Filter and search
 * - Export capability
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  History,
  Search,
  Filter,
  Check,
  X,
  Clock,
  AlarmClock,
  BookOpen,
  Target,
  Brain,
  FileQuestion,
  Coffee,
  Flag,
  Calendar,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { RecommendationType } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationTimelineProps {
  className?: string;
  /** User ID to fetch history for */
  userId?: string;
  /** Maximum items to display */
  limit?: number;
  /** Group by date */
  groupByDate?: boolean;
  /** Show filters */
  showFilters?: boolean;
}

interface TimelineItem {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  reason: string;
  status: 'completed' | 'dismissed' | 'snoozed' | 'pending';
  createdAt: string;
  completedAt?: string;
  snoozedUntil?: string;
}

interface TimelineGroup {
  date: string;
  label: string;
  items: TimelineItem[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_ICONS: Record<RecommendationType, typeof BookOpen> = {
  content: BookOpen,
  practice: Target,
  review: Brain,
  assessment: FileQuestion,
  break: Coffee,
  goal: Flag,
};

const TYPE_COLORS: Record<RecommendationType, string> = {
  content: 'text-blue-500',
  practice: 'text-green-500',
  review: 'text-purple-500',
  assessment: 'text-amber-500',
  break: 'text-orange-500',
  goal: 'text-red-500',
};

const STATUS_CONFIG: Record<
  TimelineItem['status'],
  {
    icon: typeof Check;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  completed: {
    icon: Check,
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  dismissed: {
    icon: X,
    label: 'Dismissed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
  },
  snoozed: {
    icon: AlarmClock,
    label: 'Snoozed',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return formatDate(dateString);
}

function groupItemsByDate(items: TimelineItem[]): TimelineGroup[] {
  const groups: Record<string, TimelineItem[]> = {};

  items.forEach((item) => {
    const dateKey = new Date(item.createdAt).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
  });

  return Object.entries(groups)
    .map(([dateKey, groupItems]) => ({
      date: dateKey,
      label: getDateLabel(groupItems[0].createdAt),
      items: groupItems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TimelineItemRow({
  item,
  isFirst,
  isLast,
}: {
  item: TimelineItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = TYPE_ICONS[item.type] || BookOpen;
  const statusConfig = STATUS_CONFIG[item.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-3 top-10 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900',
          TYPE_COLORS[item.type].replace('text-', 'border-')
        )}
      >
        <Icon className={cn('h-3 w-3', TYPE_COLORS[item.type])} />
      </div>

      {/* Content */}
      <div className="pb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{item.title}</span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', statusConfig.color, statusConfig.bgColor)}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatTime(item.createdAt)}
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
              {item.reason && (
                <div className="text-xs text-gray-500 italic">
                  Reason: {item.reason}
                </div>
              )}
              {item.completedAt && (
                <div className="text-xs text-green-600">
                  Completed at {formatTime(item.completedAt)}
                </div>
              )}
              {item.snoozedUntil && (
                <div className="text-xs text-amber-600">
                  Snoozed until {formatDate(item.snoozedUntil)} {formatTime(item.snoozedUntil)}
                </div>
              )}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

function DateGroupHeader({
  label,
  count,
  completedCount,
}: {
  label: string;
  count: number;
  completedCount: number;
}) {
  return (
    <div className="flex items-center justify-between py-2 mb-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{count} recommendations</span>
        <span className="text-green-600">({completedCount} completed)</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 pl-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative">
          <Skeleton className="absolute left-[-32px] top-3 h-6 w-6 rounded-full" />
          <div className="p-3 rounded-lg border">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <History className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No recommendation history yet
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Your recommendations will appear here as you interact with them
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendationTimeline({
  className,
  userId,
  limit = 50,
  groupByDate = true,
  showFilters = true,
}: RecommendationTimelineProps) {
  // State
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (userId) params.set('userId', userId);

      const response = await fetch(
        `/api/sam/agentic/recommendations/history?${params.toString()}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setItems(result.data);
        }
      }
    } catch (error) {
      console.error('[RecommendationTimeline] Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, typeFilter, statusFilter]);

  // Group by date
  const groupedItems = useMemo(() => {
    if (!groupByDate) {
      return [
        {
          date: 'all',
          label: 'All Recommendations',
          items: filteredItems,
        },
      ];
    }
    return groupItemsByDate(filteredItems);
  }, [filteredItems, groupByDate]);

  // Stats
  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === 'completed').length;
    const dismissed = items.filter((i) => i.status === 'dismissed').length;
    const snoozed = items.filter((i) => i.status === 'snoozed').length;
    return { total: items.length, completed, dismissed, snoozed };
  }, [items]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Recommendation History</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchHistory}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Track your learning recommendations over time
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">{stats.total} total</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-3 w-3" />
            <span>{stats.completed} completed</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <AlarmClock className="h-3 w-3" />
            <span>{stats.snoozed} snoozed</span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="goal">Goal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="snoozed">Snoozed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <LoadingState />
          ) : filteredItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {groupedItems.map((group) => (
                <div key={group.date}>
                  {groupByDate && (
                    <DateGroupHeader
                      label={group.label}
                      count={group.items.length}
                      completedCount={
                        group.items.filter((i) => i.status === 'completed').length
                      }
                    />
                  )}
                  <div>
                    {group.items.map((item, index) => (
                      <TimelineItemRow
                        key={item.id}
                        item={item}
                        isFirst={index === 0}
                        isLast={index === group.items.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RecommendationTimeline;
