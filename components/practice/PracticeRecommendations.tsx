'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  Flame,
  Brain,
  Play,
  RefreshCw,
  Loader2,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Recommendation {
  id: string;
  type: 'SKILL_FOCUS' | 'STREAK_RISK' | 'MILESTONE_NEAR' | 'QUALITY_BOOST' | 'REST' | 'BALANCE';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionLabel?: string;
  skillId?: string;
  skillName?: string;
  skillIcon?: string;
  metadata?: {
    hoursToMilestone?: number;
    streakDays?: number;
    qualityGap?: number;
    suggestedDuration?: number;
  };
}

interface PracticeRecommendationsProps {
  onStartPractice?: (skillId: string) => void;
  onViewSkill?: (skillId: string) => void;
  limit?: number;
  showRefresh?: boolean;
  className?: string;
}

// Recommendation type icons and colors
const RECOMMENDATION_CONFIG: Record<
  Recommendation['type'],
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  SKILL_FOCUS: {
    icon: <Target className="h-5 w-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  STREAK_RISK: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  MILESTONE_NEAR: {
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  QUALITY_BOOST: {
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  REST: {
    icon: <Clock className="h-5 w-5" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
  },
  BALANCE: {
    icon: <Brain className="h-5 w-5" />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
  },
};

const PRIORITY_BADGES: Record<
  Recommendation['priority'],
  { variant: 'default' | 'secondary' | 'outline'; label: string }
> = {
  HIGH: { variant: 'default', label: 'Urgent' },
  MEDIUM: { variant: 'secondary', label: 'Suggested' },
  LOW: { variant: 'outline', label: 'Optional' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeRecommendations({
  onStartPractice,
  onViewSkill,
  limit = 5,
  showRefresh = true,
  className,
}: PracticeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recommendations
  const fetchRecommendations = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const response = await fetch(`/api/sam/practice/recommendations?limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  // Handle action click
  const handleAction = (rec: Recommendation) => {
    if (rec.skillId) {
      if (rec.type === 'SKILL_FOCUS' || rec.type === 'STREAK_RISK' || rec.type === 'MILESTONE_NEAR') {
        onStartPractice?.(rec.skillId);
      } else {
        onViewSkill?.(rec.skillId);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            SAM Recommendations
          </CardTitle>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRecommendations(false)}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No recommendations yet.</p>
            <p className="text-sm">Start practicing to get personalized tips!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAction={() => handleAction(rec)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction: () => void;
}

function RecommendationCard({ recommendation, onAction }: RecommendationCardProps) {
  const config = RECOMMENDATION_CONFIG[recommendation.type];
  const priorityBadge = PRIORITY_BADGES[recommendation.priority];

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        config.bgColor,
        'hover:border-primary/30 cursor-pointer'
      )}
      onClick={onAction}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-full bg-background', config.color)}>
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{recommendation.title}</span>
            <Badge variant={priorityBadge.variant} className="text-xs">
              {priorityBadge.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">
            {recommendation.description}
          </p>

          {/* Metadata display */}
          {recommendation.metadata && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {recommendation.metadata.hoursToMilestone !== undefined && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {recommendation.metadata.hoursToMilestone.toFixed(1)}h to milestone
                </span>
              )}
              {recommendation.metadata.streakDays !== undefined && (
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {recommendation.metadata.streakDays}d streak
                </span>
              )}
              {recommendation.metadata.suggestedDuration !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.metadata.suggestedDuration} min suggested
                </span>
              )}
            </div>
          )}

          {/* Skill info */}
          {recommendation.skillName && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {recommendation.skillIcon && <span>{recommendation.skillIcon}</span>}
              <span className="text-muted-foreground">{recommendation.skillName}</span>
            </div>
          )}
        </div>

        {/* Action indicator */}
        {recommendation.actionLabel && (
          <Button variant="ghost" size="sm" className="shrink-0">
            {recommendation.type === 'SKILL_FOCUS' ||
            recommendation.type === 'STREAK_RISK' ||
            recommendation.type === 'MILESTONE_NEAR' ? (
              <Play className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{recommendation.actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface CompactRecommendationsProps {
  onStartPractice?: (skillId: string) => void;
  className?: string;
}

export function CompactRecommendations({
  onStartPractice,
  className,
}: CompactRecommendationsProps) {
  const [topRecommendation, setTopRecommendation] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const response = await fetch('/api/sam/practice/recommendations?limit=1');
        const result = await response.json();

        if (result.success && result.data.recommendations.length > 0) {
          setTopRecommendation(result.data.recommendations[0]);
        }
      } catch (error) {
        console.error('Error fetching top recommendation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTop();
  }, []);

  if (isLoading || !topRecommendation) {
    return null;
  }

  const config = RECOMMENDATION_CONFIG[topRecommendation.type];

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        config.bgColor,
        'hover:border-primary/30',
        className
      )}
      onClick={() => {
        if (topRecommendation.skillId) {
          onStartPractice?.(topRecommendation.skillId);
        }
      }}
    >
      <div className={cn('p-1.5 rounded-full bg-background', config.color)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{topRecommendation.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {topRecommendation.description}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
