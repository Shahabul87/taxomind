'use client';

/**
 * RecommendationWidget Component
 * Displays AI-powered learning recommendations
 *
 * Phase 5: Frontend Integration
 * - Shows personalized learning recommendations
 * - Supports different recommendation types
 * - Allows dismissing and acting on recommendations
 */

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Brain,
  Target,
  Coffee,
  Lightbulb,
  Clock,
  ChevronRight,
  X,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgentic, type Recommendation, type RecommendationBatch } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationWidgetProps {
  className?: string;
  compact?: boolean;
  maxRecommendations?: number;
  availableTime?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showTotalTime?: boolean;
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRecommendationIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    content: <BookOpen className="w-4 h-4" />,
    practice: <Brain className="w-4 h-4" />,
    review: <RefreshCw className="w-4 h-4" />,
    assessment: <Target className="w-4 h-4" />,
    break: <Coffee className="w-4 h-4" />,
    goal: <Lightbulb className="w-4 h-4" />,
  };
  return icons[type] || <Sparkles className="w-4 h-4" />;
}

function getRecommendationColor(type: string) {
  const colors: Record<string, string> = {
    content: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    practice: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    review: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    assessment: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    break: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    goal: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

function getPriorityStyles(priority: string) {
  const styles: Record<string, string> = {
    high: 'border-l-4 border-l-red-500',
    medium: 'border-l-4 border-l-orange-500',
    low: 'border-l-4 border-l-blue-500',
  };
  return styles[priority] || '';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RecommendationCard({
  recommendation,
  compact,
  onDismiss,
  onClick,
}: {
  recommendation: Recommendation;
  compact?: boolean;
  onDismiss?: (id: string) => void;
  onClick?: (recommendation: Recommendation) => void;
}) {
  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-all cursor-pointer',
        getPriorityStyles(recommendation.priority)
      )}
      onClick={() => onClick?.(recommendation)}
    >
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(recommendation.id);
          }}
          className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn('p-2 rounded-lg', getRecommendationColor(recommendation.type))}>
          {getRecommendationIcon(recommendation.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-6">
            {recommendation.title}
          </h4>

          {/* Description */}
          {!compact && recommendation.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {recommendation.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="text-xs">
              {recommendation.type}
            </Badge>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recommendation.estimatedMinutes} min
            </span>
          </div>

          {/* Reason */}
          {!compact && recommendation.reason && (
            <p className="text-xs text-gray-400 italic mt-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 flex-shrink-0" />
              {recommendation.reason}
            </p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 self-center" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecommendationWidget({
  className,
  compact = false,
  maxRecommendations = 5,
  availableTime = 60,
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  showTotalTime = true,
  onRecommendationClick,
}: RecommendationWidgetProps) {
  const {
    recommendations,
    isLoadingRecommendations,
    fetchRecommendations,
    dismissRecommendation,
    error,
  } = useAgentic({
    autoFetchRecommendations: true,
    availableTime,
    recommendationRefreshInterval: autoRefresh ? refreshInterval : undefined,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchRecommendations(availableTime);
    setIsRefreshing(false);
  };

  const handleClick = (recommendation: Recommendation) => {
    if (onRecommendationClick) {
      onRecommendationClick(recommendation);
    } else if (recommendation.targetUrl) {
      window.location.href = recommendation.targetUrl;
    }
  };

  const displayRecommendations = recommendations?.recommendations.slice(0, maxRecommendations) || [];
  const remainingCount = (recommendations?.recommendations.length || 0) - maxRecommendations;
  const totalTime = recommendations?.totalEstimatedTime || 0;

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Recommendations
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingRecommendations || isRefreshing}
          >
            <RefreshCw
              className={cn(
                'w-4 h-4',
                (isLoadingRecommendations || isRefreshing) && 'animate-spin'
              )}
            />
          </Button>
        </div>

        {isLoadingRecommendations && displayRecommendations.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : displayRecommendations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No recommendations right now</p>
        ) : (
          <div className="space-y-2">
            {displayRecommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleClick(rec)}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('p-1 rounded', getRecommendationColor(rec.type))}>
                    {getRecommendationIcon(rec.type)}
                  </div>
                  <span className="text-sm font-medium truncate flex-1">{rec.title}</span>
                  <span className="text-xs text-gray-400">{rec.estimatedMinutes}m</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Learning Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            {showTotalTime && totalTime > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {totalTime} min total
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingRecommendations || isRefreshing}
            >
              <RefreshCw
                className={cn(
                  'w-4 h-4',
                  (isLoadingRecommendations || isRefreshing) && 'animate-spin'
                )}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
            Failed to load recommendations
          </div>
        )}

        {isLoadingRecommendations && displayRecommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
            <p className="text-sm text-gray-500">Generating personalized recommendations...</p>
          </div>
        ) : displayRecommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Zap className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">No recommendations available</p>
            <p className="text-sm text-gray-400">
              Continue learning and SAM will suggest what to do next!
            </p>
            <Button variant="outline" className="mt-4" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                compact={compact}
                onDismiss={dismissRecommendation}
                onClick={handleClick}
              />
            ))}

            {remainingCount > 0 && (
              <p className="text-xs text-gray-400 text-center pt-2">
                +{remainingCount} more recommendations
              </p>
            )}
          </div>
        )}

        {/* Generated timestamp */}
        {recommendations?.generatedAt && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Updated {new Date(recommendations.generatedAt).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default RecommendationWidget;
