'use client';

/**
 * LearningPathOptimizer Component
 *
 * Displays personalized learning path recommendations and allows
 * students to optimize their learning journey through the course content.
 *
 * Features:
 * - Visual learning path representation
 * - Skill gap analysis
 * - Recommended next steps
 * - Path comparison options
 * - Progress tracking along the path
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Route,
  Target,
  CheckCircle2,
  Circle,
  Lock,
  Star,
  TrendingUp,
  Clock,
  BookOpen,
  Play,
  Lightbulb,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap,
  Brain,
  BarChart3,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PathNode {
  id: string;
  title: string;
  type: 'concept' | 'skill' | 'assessment' | 'milestone';
  status: 'completed' | 'current' | 'available' | 'locked';
  masteryLevel: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  description?: string;
  resources?: string[];
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  type: 'recommended' | 'fastest' | 'comprehensive' | 'custom';
  nodes: PathNode[];
  totalEstimatedTime: number;
  completionRate: number;
  efficiency: number;
}

interface SkillGap {
  skillId: string;
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  recommendedActions: string[];
}

interface PathRecommendation {
  userId: string;
  courseId: string;
  currentNodeId?: string;
  primaryPath: LearningPath;
  alternativePaths: LearningPath[];
  skillGaps: SkillGap[];
  nextSteps: PathNode[];
  achievements: {
    name: string;
    description: string;
    earnedAt?: string;
    progress: number;
  }[];
  metadata: {
    generatedAt: string;
    basedOnDataPoints: number;
    modelConfidence: number;
  };
}

interface LearningPathOptimizerProps {
  userId: string;
  courseId: string;
  className?: string;
  onNodeSelect?: (node: PathNode) => void;
  onPathChange?: (path: LearningPath) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NODE_STATUS_COLORS = {
  completed: 'bg-green-500 text-white',
  current: 'bg-blue-500 text-white ring-4 ring-blue-500/30',
  available: 'bg-primary/20 text-primary',
  locked: 'bg-muted text-muted-foreground',
};

const DIFFICULTY_COLORS = {
  easy: 'text-green-500',
  medium: 'text-yellow-500',
  hard: 'text-red-500',
};

const PATH_TYPE_ICONS: Record<string, React.ElementType> = {
  recommended: Sparkles,
  fastest: Zap,
  comprehensive: BookOpen,
  custom: Target,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PathNodeCard({
  node,
  isLast,
  onSelect,
}: {
  node: PathNode;
  isLast: boolean;
  onSelect?: () => void;
}) {
  const StatusIcon =
    node.status === 'completed'
      ? CheckCircle2
      : node.status === 'locked'
        ? Lock
        : node.status === 'current'
          ? Play
          : Circle;

  return (
    <div className="relative">
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-6 top-12 w-0.5 h-8 -ml-px',
            node.status === 'completed' ? 'bg-green-500' : 'bg-muted'
          )}
        />
      )}

      <div
        className={cn(
          'flex items-start gap-4 p-4 rounded-xl border transition-all duration-200',
          node.status === 'current' && 'border-blue-500 bg-blue-500/5',
          node.status === 'locked' && 'opacity-60',
          node.status !== 'locked' && 'hover:shadow-md cursor-pointer'
        )}
        onClick={node.status !== 'locked' ? onSelect : undefined}
      >
        {/* Status Icon */}
        <div className={cn('p-2 rounded-full shrink-0', NODE_STATUS_COLORS[node.status])}>
          <StatusIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{node.title}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {node.type}
            </Badge>
          </div>

          {node.description && (
            <p className="text-sm text-muted-foreground mb-2">{node.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {node.estimatedTime}min
            </span>
            <span className={cn('flex items-center gap-1', DIFFICULTY_COLORS[node.difficulty])}>
              <Star className="w-3 h-3" />
              {node.difficulty}
            </span>
            {node.status !== 'locked' && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {node.masteryLevel}% mastery
              </span>
            )}
          </div>
        </div>

        {/* Action */}
        {node.status === 'current' && (
          <Button size="sm" className="shrink-0">
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {node.status === 'available' && (
          <Button variant="outline" size="sm" className="shrink-0">
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

function PathSelector({
  paths,
  selectedPath,
  onSelect,
}: {
  paths: LearningPath[];
  selectedPath: LearningPath;
  onSelect: (path: LearningPath) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {paths.map((path) => {
        const Icon = PATH_TYPE_ICONS[path.type] ?? Target;
        const isSelected = path.id === selectedPath.id;

        return (
          <div
            key={path.id}
            className={cn(
              'p-4 rounded-xl border cursor-pointer transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'hover:border-primary/50 hover:bg-muted/50'
            )}
            onClick={() => onSelect(path)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn('w-5 h-5', isSelected && 'text-primary')} />
              <span className="font-medium text-sm">{path.name}</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{Math.round(path.totalEstimatedTime / 60)}h</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span>{Math.round(path.completionRate)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Efficiency:</span>
                <span>{Math.round(path.efficiency)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillGapCard({ gap }: { gap: SkillGap }) {
  const gapSize = gap.targetLevel - gap.currentLevel;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border',
        gap.priority === 'high' && 'border-red-500/30 bg-red-500/5',
        gap.priority === 'medium' && 'border-yellow-500/30 bg-yellow-500/5',
        gap.priority === 'low' && 'border-blue-500/30 bg-blue-500/5'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <h4 className="font-medium">{gap.skillName}</h4>
        </div>
        <Badge
          variant="outline"
          className={cn(
            gap.priority === 'high' && 'bg-red-500/10 text-red-700',
            gap.priority === 'medium' && 'bg-yellow-500/10 text-yellow-700',
            gap.priority === 'low' && 'bg-blue-500/10 text-blue-700'
          )}
        >
          {gap.priority} priority
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-sm">
          <span>Current: {gap.currentLevel}%</span>
          <span>Target: {gap.targetLevel}%</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary/30 rounded-full"
            style={{ width: `${gap.targetLevel}%` }}
          />
          <div
            className="absolute h-full bg-primary rounded-full"
            style={{ width: `${gap.currentLevel}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Gap: {gapSize}%
        </div>
      </div>

      {gap.recommendedActions.length > 0 && (
        <div>
          <h5 className="text-xs font-medium mb-2">Recommended Actions</h5>
          <ul className="space-y-1">
            {gap.recommendedActions.slice(0, 3).map((action, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lightbulb className="w-3 h-3" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: PathRecommendation['achievements'][0] }) {
  const isEarned = !!achievement.earnedAt;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative p-3 rounded-xl border transition-all duration-200',
              isEarned
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-muted/50 border-muted'
            )}
          >
            <Trophy
              className={cn(
                'w-8 h-8 mx-auto',
                isEarned ? 'text-yellow-500' : 'text-muted-foreground'
              )}
            />
            {!isEarned && (
              <div className="absolute bottom-2 left-0 right-0">
                <Progress value={achievement.progress} className="h-1" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{achievement.name}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          {isEarned ? (
            <p className="text-xs text-green-500 mt-1">
              Earned: {new Date(achievement.earnedAt!).toLocaleDateString()}
            </p>
          ) : (
            <p className="text-xs mt-1">{achievement.progress}% complete</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningPathOptimizer({
  userId,
  courseId,
  className,
  onNodeSelect,
  onPathChange,
}: LearningPathOptimizerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<PathRecommendation | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sam/learning-path/recommend?userId=${userId}&courseId=${courseId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to fetch recommendations');
      }

      setRecommendation(data.data);
      setSelectedPath(data.data.primaryPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  const handlePathChange = (path: LearningPath) => {
    setSelectedPath(path);
    onPathChange?.(path);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Optimizing your learning path...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={fetchRecommendation}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation || !selectedPath) {
    return null;
  }

  const allPaths = [recommendation.primaryPath, ...recommendation.alternativePaths];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5 text-primary" />
                Learning Path Optimizer
              </CardTitle>
              <CardDescription>
                Personalized pathway recommendations based on your progress
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecommendation}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Path Selector */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Choose Your Path</CardTitle>
        </CardHeader>
        <CardContent>
          <PathSelector
            paths={allPaths}
            selectedPath={selectedPath}
            onSelect={handlePathChange}
          />
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(selectedPath.completionRate)}%
                </div>
                <div className="text-sm text-muted-foreground">Path Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(selectedPath.totalEstimatedTime / 60)}h
                </div>
                <div className="text-sm text-muted-foreground">Remaining Time</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <BarChart3 className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(selectedPath.efficiency)}%
                </div>
                <div className="text-sm text-muted-foreground">Path Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Path, Skill Gaps, Achievements */}
      <Tabs defaultValue="path">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="path">Learning Path</TabsTrigger>
          <TabsTrigger value="gaps">Skill Gaps ({recommendation.skillGaps.length})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="path" className="mt-4 space-y-2">
          {selectedPath.nodes.map((node, i) => (
            <PathNodeCard
              key={node.id}
              node={node}
              isLast={i === selectedPath.nodes.length - 1}
              onSelect={() => onNodeSelect?.(node)}
            />
          ))}
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendation.skillGaps.length > 0 ? (
              recommendation.skillGaps.map((gap) => (
                <SkillGapCard key={gap.skillId} gap={gap} />
              ))
            ) : (
              <Card className="col-span-2">
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h4 className="font-medium">No skill gaps detected</h4>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re on track with all required skills!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {recommendation.achievements.map((achievement, i) => (
                  <AchievementBadge key={i} achievement={achievement} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      {recommendation.nextSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendation.nextSteps.slice(0, 3).map((node) => (
                <div
                  key={node.id}
                  className="p-4 rounded-xl border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all"
                  onClick={() => onNodeSelect?.(node)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {node.type}
                    </Badge>
                    <span className={cn('text-xs', DIFFICULTY_COLORS[node.difficulty])}>
                      {node.difficulty}
                    </span>
                  </div>
                  <h4 className="font-medium mb-1">{node.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {node.estimatedTime}min
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Generated at: {new Date(recommendation.metadata.generatedAt).toLocaleString()}
        {' '}&bull;{' '}
        Based on {recommendation.metadata.basedOnDataPoints} data points
        {' '}&bull;{' '}
        Confidence: {Math.round(recommendation.metadata.modelConfidence * 100)}%
      </div>
    </div>
  );
}

export default LearningPathOptimizer;
