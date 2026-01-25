'use client';

/**
 * PersonalizedRecommendations Component
 *
 * AI-powered gap closing suggestions sorted by priority
 * with expected impact percentages.
 */

import React from 'react';
import {
  Sparkles,
  BookOpen,
  Target,
  RefreshCw,
  ClipboardCheck,
  Users,
  Clock,
  Zap,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  Dumbbell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { PersonalizedRecommendationsProps, GapRecommendation } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const TYPE_CONFIG: Record<
  GapRecommendation['type'],
  { icon: typeof BookOpen; color: string; label: string }
> = {
  content: {
    icon: BookOpen,
    color: 'text-blue-600 bg-blue-500/10',
    label: 'Content',
  },
  practice: {
    icon: Target,
    color: 'text-green-600 bg-green-500/10',
    label: 'Practice',
  },
  review: {
    icon: RefreshCw,
    color: 'text-orange-600 bg-orange-500/10',
    label: 'Review',
  },
  assessment: {
    icon: ClipboardCheck,
    color: 'text-purple-600 bg-purple-500/10',
    label: 'Assessment',
  },
  tutor: {
    icon: Users,
    color: 'text-cyan-600 bg-cyan-500/10',
    label: 'Tutoring',
  },
};

const RESOURCE_TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  article: FileText,
  quiz: HelpCircle,
  exercise: Dumbbell,
  session: Users,
};

const PRIORITY_CONFIG = {
  high: {
    color: 'border-l-red-500',
    badge: 'bg-red-500/10 text-red-600 border-red-500/30',
  },
  medium: {
    color: 'border-l-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  },
  low: {
    color: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
};

const DIFFICULTY_CONFIG = {
  easy: { color: 'text-green-600', label: 'Easy' },
  medium: { color: 'text-yellow-600', label: 'Medium' },
  hard: { color: 'text-red-600', label: 'Hard' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RecommendationCard({
  recommendation,
  onClick,
}: {
  recommendation: GapRecommendation;
  onClick?: () => void;
}) {
  const typeConfig = TYPE_CONFIG[recommendation.type];
  const TypeIcon = typeConfig.icon;
  const priorityConfig = PRIORITY_CONFIG[recommendation.priority];
  const difficultyConfig = DIFFICULTY_CONFIG[recommendation.difficulty];
  const ResourceIcon = recommendation.resourceType
    ? RESOURCE_TYPE_ICONS[recommendation.resourceType] ?? FileText
    : null;

  return (
    <div
      className={cn(
        'rounded-lg border-l-4 bg-white dark:bg-slate-800 border-2 p-3 sm:p-4 transition-all duration-200 hover:shadow-lg cursor-pointer',
        priorityConfig.color,
        recommendation.priority === 'high' && 'border-l-red-500 border-slate-200 dark:border-slate-700',
        recommendation.priority === 'medium' && 'border-l-yellow-500 border-slate-200 dark:border-slate-700',
        recommendation.priority === 'low' && 'border-l-blue-500 border-slate-200 dark:border-slate-700'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 sm:gap-4">
        {/* Type Icon */}
        <div className={cn('rounded-lg p-2 sm:p-2.5 shrink-0 shadow-sm', typeConfig.color)}>
          <TypeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">{recommendation.title}</span>
            <Badge variant="outline" className={cn('text-[10px] sm:text-xs font-semibold border-2', priorityConfig.badge)}>
              {recommendation.priority}
            </Badge>
          </div>

          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 sm:mb-3 line-clamp-2">
            {recommendation.description}
          </p>

          {/* Impact Indicator */}
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Expected Impact</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                +{recommendation.expectedImpact}%
              </span>
            </div>
            <Progress
              value={recommendation.expectedImpact}
              className="h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700"
            />
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium text-slate-600 dark:text-slate-300 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              {recommendation.estimatedTime} min
            </span>
            <span className={cn('flex items-center gap-1', difficultyConfig.color)}>
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              {difficultyConfig.label}
            </span>
            {ResourceIcon && (
              <span className="flex items-center gap-1">
                <ResourceIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {recommendation.resourceType}
              </span>
            )}
          </div>

          {/* Reason */}
          <div className="mt-2 sm:mt-3 flex items-start gap-1.5 sm:gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700">
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
            <span className="italic">{recommendation.reason}</span>
          </div>
        </div>

        {/* Action */}
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PersonalizedRecommendations({
  recommendations,
  onActionClick,
  className,
}: PersonalizedRecommendationsProps) {
  // Group by priority
  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  // Calculate total potential impact
  const totalImpact = recommendations.reduce(
    (sum, r) => sum + r.expectedImpact,
    0
  );

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-2.5">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">AI Recommendations</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Personalized actions to close your gaps
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 font-semibold border-2 text-xs">
            +{totalImpact}% potential
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 p-4 sm:p-6">
        {/* Priority Summary */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <div className="rounded-lg bg-red-500/10 p-1.5 sm:p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-red-600">{highPriority.length}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">High Priority</p>
          </div>
          <div className="rounded-lg bg-yellow-500/10 p-1.5 sm:p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-yellow-600">{mediumPriority.length}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-1.5 sm:p-2 text-center">
            <span className="text-base sm:text-lg font-bold text-blue-600">{lowPriority.length}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Low</p>
          </div>
        </div>

        {/* Recommendation Cards */}
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.slice(0, 6).map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onClick={() => onActionClick?.(rec)}
              />
            ))}
            {recommendations.length > 6 && (
              <Button variant="ghost" className="w-full" size="sm">
                View all {recommendations.length} recommendations
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 p-4 sm:p-6 text-center">
            <div className="mx-auto mb-2 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold">No Recommendations Yet</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Complete more activities to get personalized AI recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PersonalizedRecommendations;
