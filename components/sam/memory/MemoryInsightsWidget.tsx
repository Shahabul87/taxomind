'use client';

/**
 * MemoryInsightsWidget
 *
 * Compact widget showing relevant memories for the current learning context.
 * Automatically searches and displays contextual insights from SAM memory.
 *
 * Features:
 * - Context-aware memory search
 * - Auto-refresh on context change
 * - Compact card display
 * - Click to expand details
 * - Integration with SAMAssistant
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  Brain,
  MessageSquare,
  BookOpen,
  Clock,
  ChevronRight,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useSAMMemory } from '@sam-ai/react';
import type { MemorySearchResult } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface MemoryInsightsWidgetProps {
  className?: string;
  /** Current learning context (topic, concept, or course) */
  context?: string;
  /** Course ID for filtering */
  courseId?: string;
  /** Maximum insights to show */
  maxInsights?: number;
  /** Auto-refresh interval in ms (0 to disable) */
  refreshInterval?: number;
  /** Callback when insight is selected */
  onInsightSelect?: (insight: MemorySearchResult) => void;
  /** Show refresh button */
  showRefresh?: boolean;
  /** Title override */
  title?: string;
  /** Minimal mode - just icons and tooltips */
  minimal?: boolean;
  /** Compact display mode */
  compact?: boolean;
}

interface CategorizedInsight extends MemorySearchResult {
  category: 'strength' | 'struggle' | 'preference' | 'recent' | 'related';
  priority: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG = {
  strength: {
    icon: CheckCircle,
    label: 'Strength',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description: 'Areas where you excel',
  },
  struggle: {
    icon: AlertTriangle,
    label: 'Challenge',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'Areas needing attention',
  },
  preference: {
    icon: Target,
    label: 'Preference',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description: 'Your learning preferences',
  },
  recent: {
    icon: Clock,
    label: 'Recent',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'Recently discussed topics',
  },
  related: {
    icon: TrendingUp,
    label: 'Related',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    description: 'Related learning content',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function categorizeInsight(result: MemorySearchResult): CategorizedInsight {
  const metadata = result.metadata || {};
  const memoryType = (metadata.memoryType as string) || '';
  const content = result.content?.toLowerCase() || '';
  const score = result.score || 0;

  // Categorize based on memory type and content
  if (memoryType === 'STRUGGLE_POINT' || content.includes('struggl') || content.includes('difficult')) {
    return { ...result, category: 'struggle', priority: 3 };
  }
  if (memoryType === 'PREFERENCE' || content.includes('prefer') || content.includes('like')) {
    return { ...result, category: 'preference', priority: 2 };
  }
  if (memoryType === 'SKILL' && score > 0.8) {
    return { ...result, category: 'strength', priority: 4 };
  }
  if (memoryType === 'LEARNING_EVENT' || memoryType === 'INTERACTION') {
    return { ...result, category: 'recent', priority: 1 };
  }

  return { ...result, category: 'related', priority: 0 };
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function InsightCard({
  insight,
  onClick,
  minimal,
}: {
  insight: CategorizedInsight;
  onClick?: () => void;
  minimal?: boolean;
}) {
  const config = CATEGORY_CONFIG[insight.category];
  const Icon = config.icon;
  const metadata = insight.metadata || {};
  const title = (metadata.title as string) || insight.content?.slice(0, 40) || 'Insight';
  const timestamp = metadata.createdAt as string;

  if (minimal) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                'p-2 rounded-full transition-colors',
                config.bgColor,
                'hover:opacity-80'
              )}
            >
              <Icon className={cn('h-4 w-4', config.color)} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium text-sm">{title}</div>
              <p className="text-xs text-gray-500">
                {insight.content?.slice(0, 100)}
                {(insight.content?.length ?? 0) > 100 ? '...' : ''}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-2.5 rounded-lg border transition-all',
        config.bgColor,
        'hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600',
        'group'
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn('p-1.5 rounded-full', config.bgColor)}>
          <Icon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate">{title}</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
            {insight.content?.slice(0, 80)}
            {(insight.content?.length ?? 0) > 80 ? '...' : ''}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.color)}>
              {config.label}
            </Badge>
            {timestamp && (
              <span className="text-[10px] text-gray-400">
                {formatTimeAgo(timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function LoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-2.5 rounded-lg border">
          <div className="flex items-start gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ context }: { context?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <Lightbulb className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {context
          ? `No insights found for "${context}"`
          : 'Start learning to build your memory insights'}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MemoryInsightsWidget({
  className,
  context,
  courseId,
  maxInsights = 5,
  refreshInterval = 0,
  onInsightSelect,
  showRefresh = true,
  title = 'Memory Insights',
  minimal = false,
  compact = false,
}: MemoryInsightsWidgetProps) {
  // State
  const [insights, setInsights] = useState<CategorizedInsight[]>([]);
  const [lastContext, setLastContext] = useState<string>('');

  // Hooks
  const {
    searchMemories,
    isSearching,
    error,
    clearError,
  } = useSAMMemory({ debug: false });

  // Fetch insights based on context
  const fetchInsights = useCallback(async () => {
    if (!context?.trim()) {
      setInsights([]);
      return;
    }

    clearError();

    // Search both memories and conversations
    const [memoryResults, conversationResults] = await Promise.all([
      searchMemories(context, 'memories', {
        topK: maxInsights,
        courseId,
        minScore: 0.5,
      }),
      searchMemories(context, 'conversations', {
        topK: Math.floor(maxInsights / 2),
        minScore: 0.6,
      }),
    ]);

    // Combine and categorize
    const combined = [...memoryResults, ...conversationResults];
    const categorized = combined.map(categorizeInsight);

    // Sort by priority and score
    categorized.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (b.score || 0) - (a.score || 0);
    });

    // Take top insights
    setInsights(categorized.slice(0, maxInsights));
    setLastContext(context);
  }, [context, courseId, maxInsights, searchMemories, clearError]);

  // Fetch on context change
  useEffect(() => {
    if (context !== lastContext) {
      fetchInsights();
    }
  }, [context, lastContext, fetchInsights]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0 || !context) return;

    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, context, fetchInsights]);

  // Category summary
  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    insights.forEach((insight) => {
      summary[insight.category] = (summary[insight.category] || 0) + 1;
    });
    return summary;
  }, [insights]);

  const hasInsights = insights.length > 0;

  // Minimal mode - just show icons
  if (minimal) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {isSearching && (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        )}
        {!isSearching && hasInsights && (
          <>
            {insights.slice(0, 4).map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onClick={() => onInsightSelect?.(insight)}
                minimal
              />
            ))}
            {insights.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{insights.length - 4}
              </Badge>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={fetchInsights}
                disabled={isSearching || !context}
              >
                {isSearching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Category summary chips */}
        {hasInsights && Object.keys(categorySummary).length > 1 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {Object.entries(categorySummary).map(([category, count]) => {
              const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
              if (!config) return null;
              return (
                <Badge
                  key={category}
                  variant="outline"
                  className={cn('text-[10px] px-1.5', config.color)}
                >
                  {count} {config.label}
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Context indicator */}
        {context && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Insights for: &quot;{context.slice(0, 30)}{context.length > 30 ? '...' : ''}&quot;</span>
          </div>
        )}

        {/* Insights list */}
        <ScrollArea className="h-[200px]">
          {isSearching ? (
            <LoadingState count={maxInsights} />
          ) : hasInsights ? (
            <div className="space-y-2 pr-2">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => onInsightSelect?.(insight)}
                />
              ))}
            </div>
          ) : (
            <EmptyState context={context} />
          )}
        </ScrollArea>

        {/* Error indicator */}
        {error && (
          <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MemoryInsightsWidget;
