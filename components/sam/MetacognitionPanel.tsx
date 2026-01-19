'use client';

/**
 * MetacognitionPanel Component
 *
 * Self-reflection and study habit analysis tool for deeper learning awareness.
 *
 * Features:
 * - Pre/during/post learning reflections
 * - Cognitive load assessment
 * - Study habit tracking
 * - Learning strategy recommendations
 * - Confidence calibration
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Brain,
  Lightbulb,
  Target,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronRight,
  MessageSquare,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Send,
  History,
  Compass,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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

type ReflectionType = 'PRE_LEARNING' | 'DURING_LEARNING' | 'POST_LEARNING';
type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
type CognitiveLoadLevel = 'low' | 'optimal' | 'high' | 'overload';

interface ReflectionPrompt {
  id: string;
  question: string;
  category: 'awareness' | 'planning' | 'monitoring' | 'evaluation';
  required: boolean;
}

interface ReflectionResponse {
  promptId: string;
  response: string;
  confidenceRating?: number;
  timestamp: string;
}

interface CognitiveLoadAssessment {
  level: CognitiveLoadLevel;
  intrinsicLoad: number;
  extraneousLoad: number;
  germaneLoad: number;
  overallScore: number;
  recommendations: string[];
}

interface StudyHabit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'occasionally' | 'rarely';
  effectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
  lastPracticed?: string;
}

interface LearningStrategy {
  id: string;
  name: string;
  description: string;
  suitability: number;
  evidenceStrength: 'strong' | 'moderate' | 'emerging';
  timeInvestment: 'low' | 'medium' | 'high';
  recommended: boolean;
}

interface MetacognitionAnalysis {
  overallAwareness: number;
  selfRegulation: number;
  strategicPlanning: number;
  cognitiveLoad: CognitiveLoadAssessment;
  habits: StudyHabit[];
  recommendedStrategies: LearningStrategy[];
  insights: string[];
  actionItems: string[];
}

interface MetacognitionPanelProps {
  className?: string;
  compact?: boolean;
  sessionId?: string;
  onReflectionComplete?: (analysis: MetacognitionAnalysis) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REFLECTION_PHASES = {
  PRE_LEARNING: {
    label: 'Before Learning',
    icon: Compass,
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    description: 'Set intentions and activate prior knowledge',
  },
  DURING_LEARNING: {
    label: 'While Learning',
    icon: Eye,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    description: 'Monitor comprehension and adjust strategies',
  },
  POST_LEARNING: {
    label: 'After Learning',
    icon: BarChart3,
    color: 'text-green-500 bg-green-500/10 border-green-500/30',
    description: 'Evaluate outcomes and plan next steps',
  },
};

const COGNITIVE_LOAD_COLORS = {
  low: 'text-blue-500 bg-blue-500/10',
  optimal: 'text-green-500 bg-green-500/10',
  high: 'text-yellow-500 bg-yellow-500/10',
  overload: 'text-red-500 bg-red-500/10',
};

const DEFAULT_PROMPTS: Record<ReflectionType, ReflectionPrompt[]> = {
  PRE_LEARNING: [
    { id: 'pre-1', question: 'What do I already know about this topic?', category: 'awareness', required: true },
    { id: 'pre-2', question: 'What do I want to learn from this session?', category: 'planning', required: true },
    { id: 'pre-3', question: 'What strategies will help me learn this effectively?', category: 'planning', required: false },
  ],
  DURING_LEARNING: [
    { id: 'during-1', question: 'Am I understanding the main concepts?', category: 'monitoring', required: true },
    { id: 'during-2', question: 'What questions or confusions do I have?', category: 'monitoring', required: true },
    { id: 'during-3', question: 'Should I adjust my learning approach?', category: 'monitoring', required: false },
  ],
  POST_LEARNING: [
    { id: 'post-1', question: 'What did I learn that was new or surprising?', category: 'evaluation', required: true },
    { id: 'post-2', question: 'What was difficult or confusing?', category: 'evaluation', required: true },
    { id: 'post-3', question: 'How can I apply this knowledge?', category: 'evaluation', required: false },
  ],
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PhaseSelector({
  selected,
  onSelect,
}: {
  selected: ReflectionType;
  onSelect: (phase: ReflectionType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.entries(REFLECTION_PHASES) as [ReflectionType, typeof REFLECTION_PHASES.PRE_LEARNING][]).map(
        ([key, phase]) => {
          const Icon = phase.icon;
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                isSelected
                  ? `${phase.color} border-current shadow-sm`
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              )}
            >
              <Icon className={cn('w-5 h-5', isSelected ? '' : 'text-muted-foreground')} />
              <span className={cn(
                'text-xs font-medium text-center',
                isSelected ? '' : 'text-muted-foreground'
              )}>
                {phase.label}
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}

function CognitiveLoadGauge({ assessment }: { assessment: CognitiveLoadAssessment }) {
  const config = COGNITIVE_LOAD_COLORS[assessment.level];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Cognitive Load
        </h4>
        <Badge className={cn('capitalize', config)}>{assessment.level}</Badge>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all',
            assessment.level === 'overload' ? 'bg-red-500' :
            assessment.level === 'high' ? 'bg-yellow-500' :
            assessment.level === 'optimal' ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: `${assessment.overallScore}%` }}
        />
        {/* Optimal zone indicator */}
        <div className="absolute inset-y-0 left-[40%] w-[30%] border-x-2 border-green-500/50 bg-green-500/10" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <span className="block text-muted-foreground">Intrinsic</span>
          <span className="font-semibold">{assessment.intrinsicLoad}%</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <span className="block text-muted-foreground">Extraneous</span>
          <span className="font-semibold">{assessment.extraneousLoad}%</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <span className="block text-muted-foreground">Germane</span>
          <span className="font-semibold">{assessment.germaneLoad}%</span>
        </div>
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  response,
  onResponseChange,
  onConfidenceChange,
}: {
  prompt: ReflectionPrompt;
  response?: ReflectionResponse;
  onResponseChange: (value: string) => void;
  onConfidenceChange?: (value: number) => void;
}) {
  const categoryColors = {
    awareness: 'border-l-blue-500',
    planning: 'border-l-purple-500',
    monitoring: 'border-l-yellow-500',
    evaluation: 'border-l-green-500',
  };

  return (
    <div className={cn(
      'p-4 rounded-lg bg-muted/30 border-l-4',
      categoryColors[prompt.category]
    )}>
      <div className="flex items-start gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">{prompt.question}</p>
          {prompt.required && (
            <span className="text-xs text-red-500">* Required</span>
          )}
        </div>
      </div>

      <Textarea
        value={response?.response || ''}
        onChange={(e) => onResponseChange(e.target.value)}
        placeholder="Your reflection..."
        className="min-h-[80px] bg-background/50 resize-none"
      />

      {onConfidenceChange && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => onConfidenceChange(level)}
                className={cn(
                  'w-6 h-6 rounded-full text-xs font-medium transition-all',
                  response?.confidenceRating === level
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitCard({ habit }: { habit: StudyHabit }) {
  const TrendIcon = habit.trend === 'improving' ? TrendingUp :
    habit.trend === 'declining' ? TrendingDown : Minus;

  const trendColor = habit.trend === 'improving' ? 'text-green-500' :
    habit.trend === 'declining' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{habit.name}</span>
          <TrendIcon className={cn('w-3 h-3', trendColor)} />
        </div>
        <span className="text-xs text-muted-foreground capitalize">{habit.frequency}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold">{habit.effectiveness}%</span>
        <Progress value={habit.effectiveness} className="w-16 h-1.5 mt-1" />
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: LearningStrategy }) {
  const evidenceColors = {
    strong: 'bg-green-500/10 text-green-600 border-green-500/30',
    moderate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    emerging: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  };

  return (
    <div className={cn(
      'p-3 rounded-lg border transition-all hover:shadow-md',
      strategy.recommended ? 'border-primary/50 bg-primary/5' : 'border-transparent bg-muted/30'
    )}>
      <div className="flex items-start gap-3">
        {strategy.recommended && (
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{strategy.name}</span>
            <Badge variant="outline" className={cn('text-xs', evidenceColors[strategy.evidenceStrength])}>
              {strategy.evidenceStrength}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{strategy.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {strategy.suitability}% match
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {strategy.timeInvestment} effort
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AwarenessRing({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return 'stroke-green-500';
    if (v >= 60) return 'stroke-blue-500';
    if (v >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          <circle
            className="stroke-muted"
            strokeWidth="6"
            fill="none"
            r="35"
            cx="40"
            cy="40"
          />
          <circle
            className={cn('transition-all duration-700', getColor(value))}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            r="35"
            cx="40"
            cy="40"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{value}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetacognitionPanel({
  className,
  compact = false,
  sessionId,
  onReflectionComplete,
}: MetacognitionPanelProps) {
  const [phase, setPhase] = useState<ReflectionType>('PRE_LEARNING');
  const [responses, setResponses] = useState<Record<string, ReflectionResponse>>({});
  const [analysis, setAnalysis] = useState<MetacognitionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const prompts = DEFAULT_PROMPTS[phase];
  const phaseConfig = REFLECTION_PHASES[phase];

  const updateResponse = useCallback((promptId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        promptId,
        response: value,
        timestamp: new Date().toISOString(),
      },
    }));
  }, []);

  const updateConfidence = useCallback((promptId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [promptId]: {
        ...prev[promptId],
        promptId,
        confidenceRating: value,
        timestamp: new Date().toISOString(),
      },
    }));
  }, []);

  const submitReflection = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/sam/metacognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-reflection',
          data: {
            sessionId,
            reflectionType: phase,
            responses: Object.values(responses).filter((r) => r.response.trim()),
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data.analysis);
        onReflectionComplete?.(data.data.analysis);
      } else {
        throw new Error(data.error?.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze reflection');
    } finally {
      setAnalyzing(false);
      isLoadingRef.current = false;
    }
  }, [sessionId, phase, responses, onReflectionComplete]);

  const hasRequiredResponses = prompts
    .filter((p) => p.required)
    .every((p) => responses[p.id]?.response?.trim());

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Metacognition</CardTitle>
              <CardDescription>Reflect on your learning process</CardDescription>
            </div>
          </div>
          {analysis && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnalysis(null)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              New Reflection
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!analysis ? (
          <>
            {/* Phase Selector */}
            <PhaseSelector selected={phase} onSelect={setPhase} />

            {/* Phase Description */}
            <div className={cn(
              'p-3 rounded-lg border',
              phaseConfig.color
            )}>
              <p className="text-sm">{phaseConfig.description}</p>
            </div>

            {/* Reflection Prompts */}
            <div className="space-y-3">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  response={responses[prompt.id]}
                  onResponseChange={(value) => updateResponse(prompt.id, value)}
                  onConfidenceChange={
                    phase === 'DURING_LEARNING'
                      ? (value) => updateConfidence(prompt.id, value)
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={submitReflection}
              disabled={analyzing || !hasRequiredResponses}
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Analyze Reflection
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Analysis Results */}
            <div className="flex justify-center gap-6">
              <AwarenessRing value={analysis.overallAwareness} label="Awareness" />
              <AwarenessRing value={analysis.selfRegulation} label="Self-Regulation" />
              <AwarenessRing value={analysis.strategicPlanning} label="Planning" />
            </div>

            {/* Cognitive Load */}
            {!compact && (
              <CognitiveLoadGauge assessment={analysis.cognitiveLoad} />
            )}

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Insights
                </h4>
                <div className="space-y-1">
                  {analysis.insights.slice(0, compact ? 2 : 4).map((insight, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Habits */}
            {!compact && analysis.habits.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Study Habits
                </h4>
                <div className="space-y-2">
                  {analysis.habits.slice(0, 3).map((habit) => (
                    <HabitCard key={habit.id} habit={habit} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Strategies */}
            {analysis.recommendedStrategies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Recommended Strategies
                </h4>
                <div className="space-y-2">
                  {analysis.recommendedStrategies
                    .filter((s) => s.recommended)
                    .slice(0, compact ? 1 : 3)
                    .map((strategy) => (
                      <StrategyCard key={strategy.id} strategy={strategy} />
                    ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {!compact && analysis.actionItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Action Items
                </h4>
                <div className="space-y-1">
                  {analysis.actionItems.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default MetacognitionPanel;
