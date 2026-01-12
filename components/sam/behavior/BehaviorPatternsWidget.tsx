'use client';

/**
 * BehaviorPatternsWidget
 *
 * Dashboard widget displaying detected learning behavior patterns.
 * Shows insights about user's learning habits and preferences.
 *
 * Features:
 * - Pattern type categorization with icons
 * - Confidence indicators
 * - Frequency tracking
 * - Trigger new pattern detection
 * - Auto-refresh capability
 */

import { useState, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Activity,
  TrendingDown,
  BookOpen,
  Clock,
  Heart,
  Gauge,
  Brain,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Info,
} from 'lucide-react';
import { useBehaviorPatterns } from '@sam-ai/react';
import type { BehaviorPattern, PatternType } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface BehaviorPatternsWidgetProps {
  className?: string;
  /** Maximum patterns to display */
  maxPatterns?: number;
  /** Show detect button */
  showDetect?: boolean;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Compact mode */
  compact?: boolean;
  /** Callback when pattern is clicked */
  onPatternClick?: (pattern: BehaviorPattern) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PATTERN_CONFIG: Record<
  PatternType,
  {
    icon: typeof Activity;
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  STRUGGLE: {
    icon: AlertCircle,
    label: 'Struggle',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    description: 'Areas where you face challenges',
  },
  ENGAGEMENT_DROP: {
    icon: TrendingDown,
    label: 'Engagement',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'Patterns in focus and attention',
  },
  LEARNING_STYLE: {
    icon: BookOpen,
    label: 'Style',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description: 'How you learn best',
  },
  TIME_PREFERENCE: {
    icon: Clock,
    label: 'Time',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'When you learn best',
  },
  TOPIC_AFFINITY: {
    icon: Heart,
    label: 'Interests',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description: 'Topics you gravitate towards',
  },
  PACE: {
    icon: Gauge,
    label: 'Pace',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description: 'Your learning speed patterns',
  },
  RETENTION: {
    icon: Brain,
    label: 'Retention',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    description: 'How well you remember content',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return 'Recently';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 0.8) return { label: 'High', color: 'text-green-600' };
  if (confidence >= 0.6) return { label: 'Medium', color: 'text-amber-600' };
  return { label: 'Low', color: 'text-gray-600' };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PatternCard({
  pattern,
  expanded,
  onToggle,
  onClick,
  compact,
}: {
  pattern: BehaviorPattern;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  compact?: boolean;
}) {
  const config = PATTERN_CONFIG[pattern.type] || PATTERN_CONFIG.LEARNING_STYLE;
  const Icon = config.icon;
  const confidencePercent = Math.round(pattern.confidence * 100);
  const confidenceLevel = getConfidenceLevel(pattern.confidence);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg border transition-colors w-full text-left',
                config.bgColor,
                'hover:shadow-sm'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', config.color)} />
              <span className="text-sm font-medium truncate">{pattern.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {confidencePercent}%
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">{pattern.name}</div>
              <p className="text-xs text-gray-500">{pattern.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        config.bgColor,
        expanded && 'shadow-sm'
      )}
    >
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full p-3 text-left">
          <div className="flex items-start gap-3">
            <div className={cn('p-2 rounded-full', config.bgColor, 'border')}>
              <Icon className={cn('h-4 w-4', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{pattern.name}</span>
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {pattern.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className={cn('text-sm font-medium', confidenceLevel.color)}>
                  {confidencePercent}%
                </div>
                <div className="text-[10px] text-gray-400">confidence</div>
              </div>
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 border-t space-y-3">
            {/* Confidence bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Confidence Level</span>
                <span className={confidenceLevel.color}>{confidenceLevel.label}</span>
              </div>
              <Progress value={confidencePercent} className="h-1.5" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-gray-500">Frequency</div>
                <div className="font-medium">{pattern.frequency} occurrences</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-gray-500">First Detected</div>
                <div className="font-medium">{formatTimeAgo(pattern.firstDetected)}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-gray-500">Last Seen</div>
                <div className="font-medium">{formatTimeAgo(pattern.lastDetected)}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-gray-500">Category</div>
                <div className="font-medium">{config.description}</div>
              </div>
            </div>

            {/* Action */}
            {onClick && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={onClick}
              >
                <Target className="h-3 w-3 mr-1" />
                View Details
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PatternSummaryBar({ patterns }: { patterns: BehaviorPattern[] }) {
  const summary = useMemo(() => {
    const byType: Record<string, number> = {};
    patterns.forEach((p) => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });
    return Object.entries(byType)
      .map(([type, count]) => ({
        type: type as PatternType,
        count,
        config: PATTERN_CONFIG[type as PatternType] || PATTERN_CONFIG.LEARNING_STYLE,
      }))
      .sort((a, b) => b.count - a.count);
  }, [patterns]);

  if (summary.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {summary.map(({ type, count, config }) => {
        if (!config) return null;
        const Icon = config.icon;
        return (
          <div
            key={type}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              config.bgColor
            )}
          >
            <Icon className={cn('h-3 w-3', config.color)} />
            <span className={config.color}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onDetect, isDetecting }: { onDetect: () => void; isDetecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Activity className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-gray-100">
        No patterns detected yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
        Continue learning to help SAM understand your patterns
      </p>
      <Button onClick={onDetect} disabled={isDetecting} className="mt-4">
        {isDetecting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Zap className="h-4 w-4 mr-2" />
        )}
        Run Detection
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BehaviorPatternsWidget({
  className,
  maxPatterns = 10,
  showDetect = true,
  refreshInterval,
  compact = false,
  onPatternClick,
}: BehaviorPatternsWidgetProps) {
  // State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Hooks
  const {
    patterns,
    isLoading,
    isDetecting,
    error,
    refresh,
    detectPatterns,
  } = useBehaviorPatterns({
    autoFetch: true,
    refreshInterval,
  });

  // Memoized values
  const displayPatterns = useMemo(() => {
    return patterns.slice(0, maxPatterns);
  }, [patterns, maxPatterns]);

  const hasPatterns = displayPatterns.length > 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className={compact ? 'pb-2' : undefined}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            <CardTitle className={compact ? 'text-base' : undefined}>
              Learning Patterns
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {showDetect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => detectPatterns()}
                disabled={isDetecting}
                className="h-8"
              >
                {isDetecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Detect
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={refresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {!compact && (
          <CardDescription>
            Detected patterns in your learning behavior
          </CardDescription>
        )}

        {/* Summary bar */}
        {hasPatterns && <PatternSummaryBar patterns={displayPatterns} />}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error.message}</span>
          </div>
        )}

        {/* Content */}
        <ScrollArea className={compact ? 'h-[240px]' : 'h-[350px]'}>
          {isLoading ? (
            <LoadingState />
          ) : hasPatterns ? (
            <div className="space-y-2 pr-2">
              {displayPatterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  expanded={expandedId === pattern.id}
                  onToggle={() =>
                    setExpandedId(expandedId === pattern.id ? null : pattern.id)
                  }
                  onClick={onPatternClick ? () => onPatternClick(pattern) : undefined}
                  compact={compact}
                />
              ))}
            </div>
          ) : (
            <EmptyState onDetect={detectPatterns} isDetecting={isDetecting} />
          )}
        </ScrollArea>

        {/* Info footer */}
        {hasPatterns && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3.5 w-3.5" />
            <span>
              {patterns.length} pattern{patterns.length !== 1 ? 's' : ''} detected
              {patterns.length > maxPatterns && ` (showing ${maxPatterns})`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BehaviorPatternsWidget;
