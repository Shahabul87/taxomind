'use client';

/**
 * ScaffoldingStrategyPanel Component
 *
 * Displays pedagogical scaffolding recommendations based on student performance
 * and learning context. Uses the @sam-ai/pedagogy scaffolding analysis.
 *
 * Features:
 * - Current scaffolding level indicator
 * - Zone of Proximal Development (ZPD) visualization
 * - Recommended teaching strategies
 * - Fading schedule recommendations
 * - Strategy effectiveness tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Lightbulb,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Minus,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  GraduationCap,
  Brain,
  MessageSquare,
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

interface ScaffoldingLevel {
  level: 'high' | 'medium' | 'low' | 'minimal';
  description: string;
  techniques: string[];
}

interface ZPDAnalysis {
  currentLevel: number;
  targetLevel: number;
  zpdRange: {
    lower: number;
    upper: number;
  };
  readinessScore: number;
  confidence: number;
}

interface ScaffoldingStrategy {
  id: string;
  name: string;
  type: 'questioning' | 'modeling' | 'hinting' | 'coaching' | 'fading';
  description: string;
  applicability: number;
  effort: 'low' | 'medium' | 'high';
  expectedImpact: 'low' | 'medium' | 'high';
  steps: string[];
}

interface FadingRecommendation {
  currentPhase: 'high_support' | 'moderate_support' | 'low_support' | 'independence';
  nextPhase: string;
  readyToProgress: boolean;
  progressionCriteria: string[];
  estimatedTimeToNextPhase: string;
}

interface ScaffoldingAnalysis {
  userId: string;
  courseId?: string;
  conceptId?: string;
  currentLevel: ScaffoldingLevel;
  zpd: ZPDAnalysis;
  recommendedStrategies: ScaffoldingStrategy[];
  fading: FadingRecommendation;
  recentEffectiveness: {
    strategyId: string;
    successRate: number;
    usageCount: number;
  }[];
  metadata: {
    analyzedAt: string;
    dataPointsUsed: number;
    confidence: number;
  };
}

interface ScaffoldingStrategyPanelProps {
  userId: string;
  courseId?: string;
  conceptId?: string;
  className?: string;
  compact?: boolean;
  onStrategySelect?: (strategy: ScaffoldingStrategy) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEVEL_COLORS = {
  high: 'text-purple-500',
  medium: 'text-blue-500',
  low: 'text-green-500',
  minimal: 'text-emerald-500',
};

const LEVEL_BG_COLORS = {
  high: 'bg-purple-500/10',
  medium: 'bg-blue-500/10',
  low: 'bg-green-500/10',
  minimal: 'bg-emerald-500/10',
};

const STRATEGY_ICONS: Record<string, React.ElementType> = {
  questioning: MessageSquare,
  modeling: BookOpen,
  hinting: Lightbulb,
  coaching: GraduationCap,
  fading: TrendingDown,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ZPDVisualization({ zpd }: { zpd: ZPDAnalysis }) {
  const zpdWidth = ((zpd.zpdRange.upper - zpd.zpdRange.lower) / 100) * 100;
  const currentPosition = zpd.currentLevel;
  const targetPosition = zpd.targetLevel;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Current Ability</span>
        <span>Target Mastery</span>
      </div>

      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
        {/* ZPD Zone */}
        <div
          className="absolute h-full bg-blue-500/20 border-l-2 border-r-2 border-blue-500/50"
          style={{
            left: `${zpd.zpdRange.lower}%`,
            width: `${zpdWidth}%`,
          }}
        />

        {/* Current Level Marker */}
        <div
          className="absolute top-0 h-full w-1 bg-green-500 transition-all duration-500"
          style={{ left: `${currentPosition}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        </div>

        {/* Target Level Marker */}
        <div
          className="absolute top-0 h-full w-1 bg-purple-500 transition-all duration-500"
          style={{ left: `${targetPosition}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-purple-500 border-2 border-white" />
        </div>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Current: {zpd.currentLevel}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500/30" />
          <span>ZPD Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Target: {zpd.targetLevel}%</span>
        </div>
      </div>
    </div>
  );
}

function StrategyCard({
  strategy,
  onSelect,
}: {
  strategy: ScaffoldingStrategy;
  onSelect?: () => void;
}) {
  const Icon = STRATEGY_ICONS[strategy.type] ?? Lightbulb;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-xl p-4 transition-all duration-200 hover:shadow-md',
        'cursor-pointer'
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {strategy.name}
              <Badge variant="outline" className="text-xs">
                {strategy.type}
              </Badge>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {strategy.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            {Math.round(strategy.applicability * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">match</div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Effort:</span>
              <Badge
                variant="outline"
                className={cn(
                  strategy.effort === 'low' && 'bg-green-500/10 text-green-700',
                  strategy.effort === 'medium' && 'bg-yellow-500/10 text-yellow-700',
                  strategy.effort === 'high' && 'bg-red-500/10 text-red-700'
                )}
              >
                {strategy.effort}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Impact:</span>
              <Badge
                variant="outline"
                className={cn(
                  strategy.expectedImpact === 'high' && 'bg-green-500/10 text-green-700',
                  strategy.expectedImpact === 'medium' && 'bg-yellow-500/10 text-yellow-700',
                  strategy.expectedImpact === 'low' && 'bg-red-500/10 text-red-700'
                )}
              >
                {strategy.expectedImpact}
              </Badge>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Implementation Steps</h5>
            <ol className="space-y-2">
              {strategy.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {onSelect && (
            <Button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Apply This Strategy
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FadingProgress({ fading }: { fading: FadingRecommendation }) {
  const phases = ['high_support', 'moderate_support', 'low_support', 'independence'];
  const currentIndex = phases.indexOf(fading.currentPhase);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {phases.map((phase, i) => (
          <React.Fragment key={phase}>
            <div
              className={cn(
                'flex flex-col items-center gap-1',
                i <= currentIndex ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  i < currentIndex && 'bg-primary text-primary-foreground',
                  i === currentIndex && 'bg-primary/20 border-2 border-primary',
                  i > currentIndex && 'bg-muted'
                )}
              >
                {i < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs text-center max-w-[80px]">
                {phase.replace('_', ' ')}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5',
                  i < currentIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Ready to progress:</span>
          {fading.readyToProgress ? (
            <Badge className="bg-green-500/10 text-green-700">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Yes
            </Badge>
          ) : (
            <Badge variant="outline">Not yet</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Next phase: <strong>{fading.nextPhase}</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Estimated time: {fading.estimatedTimeToNextPhase}
        </p>
      </div>

      {fading.progressionCriteria.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">Progression Criteria</h5>
          <ul className="space-y-1">
            {fading.progressionCriteria.map((criterion, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-3 h-3" />
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScaffoldingStrategyPanel({
  userId,
  courseId,
  conceptId,
  className,
  compact = false,
  onStrategySelect,
}: ScaffoldingStrategyPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ScaffoldingAnalysis | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ userId });
      if (courseId) params.set('courseId', courseId);
      if (conceptId) params.set('conceptId', conceptId);

      const response = await fetch(`/api/sam/scaffolding/analyze?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to fetch analysis');
      }

      setAnalysis(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [userId, courseId, conceptId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
          <Button variant="outline" onClick={fetchAnalysis}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Scaffolding Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  LEVEL_BG_COLORS[analysis.currentLevel.level]
                )}
              >
                <Brain className={cn('w-5 h-5', LEVEL_COLORS[analysis.currentLevel.level])} />
              </div>
              <div>
                <div className={cn('font-medium capitalize', LEVEL_COLORS[analysis.currentLevel.level])}>
                  {analysis.currentLevel.level} Support
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysis.recommendedStrategies.length} strategies available
                </div>
              </div>
            </div>
            <Badge variant="outline">
              ZPD: {analysis.zpd.currentLevel}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Scaffolding Strategy Panel
              </CardTitle>
              <CardDescription>
                Personalized teaching recommendations based on student progress
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Current Level & ZPD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Support Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'p-4 rounded-xl',
                  LEVEL_BG_COLORS[analysis.currentLevel.level]
                )}
              >
                <Brain className={cn('w-8 h-8', LEVEL_COLORS[analysis.currentLevel.level])} />
              </div>
              <div>
                <div
                  className={cn(
                    'text-2xl font-bold capitalize',
                    LEVEL_COLORS[analysis.currentLevel.level]
                  )}
                >
                  {analysis.currentLevel.level}
                </div>
                <p className="text-sm text-muted-foreground">
                  {analysis.currentLevel.description}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <h5 className="text-sm font-medium mb-2">Active Techniques</h5>
              <div className="flex flex-wrap gap-2">
                {analysis.currentLevel.techniques.map((tech, i) => (
                  <Badge key={i} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Zone of Proximal Development
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>The ZPD represents the gap between what a learner can do independently and what they can achieve with guidance.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ZPDVisualization zpd={analysis.zpd} />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Readiness Score</span>
              <div className="flex items-center gap-2">
                <Progress value={analysis.zpd.readinessScore * 100} className="w-24" />
                <span className="font-medium">{Math.round(analysis.zpd.readinessScore * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Strategies & Fading */}
      <Tabs defaultValue="strategies">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="strategies">
            Recommended Strategies ({analysis.recommendedStrategies.length})
          </TabsTrigger>
          <TabsTrigger value="fading">Fading Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="mt-4 space-y-4">
          {analysis.recommendedStrategies.length > 0 ? (
            analysis.recommendedStrategies.map((strategy) => (
              <StrategyCard
                key={strategy.id}
                strategy={strategy}
                onSelect={onStrategySelect ? () => onStrategySelect(strategy) : undefined}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No specific strategies needed right now.</p>
                <p className="text-sm">The student is progressing well independently.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fading" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Support Fading Progress</CardTitle>
              <CardDescription>
                Gradual reduction of support as the learner gains independence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FadingProgress fading={analysis.fading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Strategy Effectiveness */}
      {analysis.recentEffectiveness.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Strategy Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recentEffectiveness.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{item.strategyId}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Progress value={item.successRate * 100} className="w-24" />
                      <span className="text-sm font-medium">
                        {Math.round(item.successRate * 100)}%
                      </span>
                    </div>
                    <Badge variant="outline">{item.usageCount} uses</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Footer */}
      <div className="text-xs text-muted-foreground text-center">
        Last analyzed: {new Date(analysis.metadata.analyzedAt).toLocaleString()}
        {' '}&bull;{' '}
        Based on {analysis.metadata.dataPointsUsed} data points
        {' '}&bull;{' '}
        Confidence: {Math.round(analysis.metadata.confidence * 100)}%
      </div>
    </div>
  );
}

export default ScaffoldingStrategyPanel;
