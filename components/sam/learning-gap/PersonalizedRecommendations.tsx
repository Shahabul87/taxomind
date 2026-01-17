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
        'rounded-lg border-l-4 bg-card border p-4 transition-all hover:shadow-md cursor-pointer',
        priorityConfig.color
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn('rounded-lg p-2 shrink-0', typeConfig.color)}>
          <TypeIcon className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">{recommendation.title}</span>
            <Badge variant="outline" className={cn('text-xs', priorityConfig.badge)}>
              {recommendation.priority}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {recommendation.description}
          </p>

          {/* Impact Indicator */}
          <div className="space-y-1 mb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expected Impact</span>
              <span className="font-medium text-green-600">
                +{recommendation.expectedImpact}%
              </span>
            </div>
            <Progress
              value={recommendation.expectedImpact}
              className="h-1.5"
            />
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recommendation.estimatedTime} min
            </span>
            <span className={cn('flex items-center gap-1', difficultyConfig.color)}>
              <Zap className="h-3 w-3" />
              {difficultyConfig.label}
            </span>
            {ResourceIcon && (
              <span className="flex items-center gap-1">
                <ResourceIcon className="h-3 w-3" />
                {recommendation.resourceType}
              </span>
            )}
          </div>

          {/* Reason */}
          <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
            <span className="italic">{recommendation.reason}</span>
          </div>
        </div>

        {/* Action */}
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Recommendations</CardTitle>
              <CardDescription>
                Personalized actions to close your gaps
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            +{totalImpact}% potential
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Priority Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-red-500/10 p-2 text-center">
            <span className="text-lg font-bold text-red-600">{highPriority.length}</span>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </div>
          <div className="rounded-lg bg-yellow-500/10 p-2 text-center">
            <span className="text-lg font-bold text-yellow-600">{mediumPriority.length}</span>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-2 text-center">
            <span className="text-lg font-bold text-blue-600">{lowPriority.length}</span>
            <p className="text-xs text-muted-foreground">Low</p>
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
          <div className="rounded-lg bg-muted/50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold">No Recommendations Yet</h4>
            <p className="text-sm text-muted-foreground">
              Complete more activities to get personalized AI recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PersonalizedRecommendations;
