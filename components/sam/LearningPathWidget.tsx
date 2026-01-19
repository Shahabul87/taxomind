'use client';

/**
 * LearningPathWidget Component
 *
 * Displays personalized learning path recommendations and skill tracking
 * from the SAM AI system.
 *
 * Features:
 * - Active learning path visualization
 * - Step-by-step progress tracking
 * - Skill profile overview
 * - Due for review concepts
 * - Path generation actions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Route,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronRight,
  Target,
  Trophy,
  AlertTriangle,
  Brain,
  BookOpen,
  Sparkles,
  ArrowRight,
  Zap,
  RotateCcw,
  GraduationCap,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PathStep {
  order: number;
  conceptId: string;
  conceptName: string;
  action: 'learn' | 'review' | 'practice' | 'assess';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  reason: string;
  prerequisites: string[];
}

interface LearningPath {
  id: string;
  userId: string;
  courseId?: string;
  targetConceptId?: string;
  steps: PathStep[];
  totalEstimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  reason: string;
  createdAt: string;
  expiresAt: string;
}

interface UserSkill {
  conceptId: string;
  conceptName: string;
  masteryLevel: number;
  trend: 'improving' | 'stable' | 'declining' | 'new';
  practiceCount: number;
  lastPracticedAt: string;
  nextReviewAt?: string;
}

interface SkillProfile {
  userId: string;
  skills: UserSkill[];
  masteredConcepts: string[];
  inProgressConcepts: string[];
  strugglingConcepts: string[];
  totalLearningTimeMinutes: number;
  streakDays: number;
  lastActivityAt: string;
}

interface DueForReviewItem {
  conceptId: string;
  conceptName: string;
  masteryLevel: number;
  lastPracticedAt: string;
  nextReviewAt?: string;
  daysSinceLastPractice: number;
}

interface LearningPathWidgetProps {
  className?: string;
  compact?: boolean;
  courseId?: string;
  showSkillProfile?: boolean;
  showDueForReview?: boolean;
  onStepClick?: (step: PathStep) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTION_ICONS = {
  learn: BookOpen,
  review: RotateCcw,
  practice: Zap,
  assess: Target,
};

const ACTION_COLORS = {
  learn: 'text-blue-500 bg-blue-500/10',
  review: 'text-orange-500 bg-orange-500/10',
  practice: 'text-purple-500 bg-purple-500/10',
  assess: 'text-green-500 bg-green-500/10',
};

const PRIORITY_COLORS = {
  critical: 'border-red-500',
  high: 'border-orange-500',
  medium: 'border-yellow-500',
  low: 'border-blue-500',
};

const DIFFICULTY_COLORS = {
  beginner: 'text-green-500 bg-green-500/10',
  intermediate: 'text-blue-500 bg-blue-500/10',
  advanced: 'text-purple-500 bg-purple-500/10',
  expert: 'text-red-500 bg-red-500/10',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StepCard({
  step,
  isActive,
  isCompleted = false,
  onClick,
}: {
  step: PathStep;
  isActive: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}) {
  const Icon = ACTION_ICONS[step.action];

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all cursor-pointer hover:bg-muted/50',
        PRIORITY_COLORS[step.priority],
        isCompleted ? 'bg-muted/30 opacity-75' : '',
        isActive ? 'bg-primary/5 ring-1 ring-primary' : ''
      )}
      onClick={onClick}
    >
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full',
        isCompleted ? 'bg-green-500/20' : ACTION_COLORS[step.action]
      )}>
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : isActive ? (
          <PlayCircle className="w-4 h-4 text-primary" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{step.conceptName}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {step.action}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{step.reason}</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{step.estimatedMinutes}m</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}

function SkillBar({ skill }: { skill: UserSkill }) {
  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'bg-green-500';
    if (level >= 60) return 'bg-blue-500';
    if (level >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm truncate">{skill.conceptName}</span>
        <div className="flex items-center gap-2">
          {skill.trend === 'improving' && <Flame className="w-3 h-3 text-orange-500" />}
          <span className="text-xs font-medium">{skill.masteryLevel}%</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getMasteryColor(skill.masteryLevel))}
          style={{ width: `${skill.masteryLevel}%` }}
        />
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: DueForReviewItem }) {
  const urgency = item.daysSinceLastPractice > 7 ? 'high' : item.daysSinceLastPractice > 3 ? 'medium' : 'low';

  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg border',
      urgency === 'high' ? 'border-red-500/20 bg-red-500/5' :
      urgency === 'medium' ? 'border-yellow-500/20 bg-yellow-500/5' :
      'border-blue-500/20 bg-blue-500/5'
    )}>
      <RotateCcw className={cn(
        'w-4 h-4',
        urgency === 'high' ? 'text-red-500' :
        urgency === 'medium' ? 'text-yellow-500' :
        'text-blue-500'
      )} />
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate">{item.conceptName}</span>
        <p className="text-xs text-muted-foreground">
          {item.daysSinceLastPractice} days ago • {item.masteryLevel}% mastery
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningPathWidget({
  className,
  compact = false,
  courseId,
  showSkillProfile = true,
  showDueForReview = true,
  onStepClick,
}: LearningPathWidgetProps) {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [dueForReview, setDueForReview] = useState<DueForReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    setServiceUnavailable(false);

    try {
      const courseParam = courseId ? `&courseId=${courseId}` : '';

      // Fetch all data in parallel
      const [pathRes, profileRes, reviewRes] = await Promise.all([
        fetch(`/api/sam/agentic/learning-path?action=active-path${courseParam}`),
        showSkillProfile ? fetch(`/api/sam/agentic/learning-path?action=skill-profile`) : Promise.resolve(null),
        showDueForReview ? fetch(`/api/sam/agentic/learning-path?action=due-for-review&limit=5`) : Promise.resolve(null),
      ]);

      const pathData = await pathRes.json();

      // Check for service unavailable (missing API configuration)
      if (pathRes.status === 503 || pathData.code === 'SERVICE_UNAVAILABLE') {
        setServiceUnavailable(true);
        setLoading(false);
        isLoadingRef.current = false;
        return;
      }

      if (!pathRes.ok) {
        throw new Error(pathData.error || 'Failed to fetch learning path');
      }

      if (pathData.success) {
        setPath(pathData.data.path);
      }

      if (profileRes) {
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data.profile);
        }
      }

      if (reviewRes) {
        const reviewData = await reviewRes.json();
        if (reviewData.success) {
          setDueForReview(reviewData.data.dueForReview);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [courseId, showSkillProfile, showDueForReview]);

  const generatePath = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/sam/agentic/learning-path?action=generate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          maxSteps: compact ? 5 : 10,
          maxMinutes: 60,
          includeReview: true,
          focusOnWeakAreas: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPath(data.data.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate path');
    } finally {
      setGenerating(false);
    }
  }, [courseId, compact]);

  // Handler to mark a step as completed
  const markStepCompleted = useCallback(async (stepOrder: number) => {
    if (!path) return;

    try {
      const res = await fetch('/api/sam/agentic/learning-path?action=complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: path.id,
          stepOrder,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedStepOrders(prev => new Set([...prev, stepOrder]));
      }
    } catch (err) {
      console.error('Failed to mark step as completed:', err);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Track completed steps in local state
  const [completedStepOrders, setCompletedStepOrders] = useState<Set<number>>(new Set());

  // Calculate progress
  const completedSteps = completedStepOrders.size;
  const totalSteps = path?.steps.length ?? 0;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Find current step (first non-completed step)
  const currentStepIndex = path?.steps.findIndex((s) => !completedStepOrders.has(s.order)) ?? 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show "Coming Soon" for service unavailable (missing AI configuration)
  if (serviceUnavailable) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Learning Path</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-3 h-3 text-yellow-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              AI-powered personalized learning paths will help you master concepts efficiently.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Requires AI Configuration
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Learning Path</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generatePath}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {path ? 'Regenerate' : 'Generate'}
            </Button>
          </div>
        </div>
        <CardDescription>
          Personalized learning recommendations
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Path */}
        {path && (
          <div className="space-y-4">
            {/* Path Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={DIFFICULTY_COLORS[path.difficulty]}>
                  {path.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ~{path.totalEstimatedMinutes} min
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(path.confidence * 100)}% confidence
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{path.reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{completedSteps}/{totalSteps} steps</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {path.steps.slice(0, compact ? 3 : undefined).map((step, index) => (
                <StepCard
                  key={`${step.conceptId}-${step.order}`}
                  step={step}
                  isActive={index === currentStepIndex}
                  isCompleted={completedStepOrders.has(step.order)}
                  onClick={() => onStepClick?.(step)}
                />
              ))}
              {compact && path.steps.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all {path.steps.length} steps
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* No Path - Generate CTA */}
        {!path && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-medium">No Active Learning Path</h3>
            <p className="text-sm text-muted-foreground max-w-[250px] mb-4">
              Generate a personalized path based on your skills and learning goals.
            </p>
            <Button onClick={generatePath} disabled={generating}>
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Path
            </Button>
          </div>
        )}

        {/* Skill Profile Summary */}
        {showSkillProfile && profile && !compact && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Skill Progress
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="w-3 h-3 text-yellow-500" />
                <span>{profile.masteredConcepts.length} mastered</span>
                {profile.streakDays > 0 && (
                  <>
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{profile.streakDays} day streak</span>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {profile.skills.slice(0, 4).map((skill) => (
                <SkillBar key={skill.conceptId} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Due for Review */}
        {showDueForReview && dueForReview.length > 0 && !compact && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Due for Review
              <Badge variant="secondary" className="text-xs">
                {dueForReview.length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {dueForReview.slice(0, 3).map((item) => (
                <ReviewCard key={item.conceptId} item={item} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LearningPathWidget;
