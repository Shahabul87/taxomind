'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Sparkles,
  Target,
  Lightbulb,
  Plus,
  ChevronDown,
  ChevronRight,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CognitiveQualityBadge } from '@/components/course/cognitive-quality-badge';

interface Recommendation {
  id: string;
  type: 'quick_win' | 'improvement' | 'advanced';
  title: string;
  description: string;
  level: string;
  impact: number;
  chapterId?: string;
  chapterTitle?: string;
  actionLabel: string;
}

interface Distribution {
  remember: number;
  understand: number;
  apply: number;
  analyze: number;
  evaluate: number;
  create: number;
}

interface CognitiveRecommendationsPanelProps {
  courseId: string;
  onAddRecommendation?: (recommendation: Recommendation) => void;
  className?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  REMEMBER: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  UNDERSTAND: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30',
  APPLY: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
  ANALYZE: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
  EVALUATE: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  CREATE: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
};

const TYPE_ICONS: Record<string, typeof Lightbulb> = {
  quick_win: Lightbulb,
  improvement: Target,
  advanced: Sparkles,
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  quick_win: { label: 'Quick Win', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  improvement: { label: 'Improvement', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  advanced: { label: 'Advanced', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};

function calculateEstimatedGrade(currentScore: number, recommendations: Recommendation[]): string {
  const potentialImprovement = recommendations.reduce((sum, rec) => sum + rec.impact, 0);
  const estimatedScore = Math.min(100, currentScore + potentialImprovement);

  if (estimatedScore >= 90) return 'A+';
  if (estimatedScore >= 80) return 'A';
  if (estimatedScore >= 70) return 'B';
  if (estimatedScore >= 60) return 'C';
  return 'D';
}

export function CognitiveRecommendationsPanel({
  courseId,
  onAddRecommendation,
  className,
}: CognitiveRecommendationsPanelProps) {
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set());
  const [implementedRecs, setImplementedRecs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    currentGrade: string;
    currentScore: number;
    distribution: Distribution;
    recommendations: Recommendation[];
  } | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/courses/${courseId}/cognitive-recommendations`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to load recommendations');
        }
      } catch {
        setError('Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [courseId]);

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)} data-recommendations-panel>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('overflow-hidden', className)} data-recommendations-panel>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
          <p className="text-sm text-slate-500">{error || 'Unable to load recommendations'}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { currentGrade, currentScore, distribution, recommendations } = data;
  const estimatedGrade = calculateEstimatedGrade(currentScore, recommendations);
  const potentialImprovement = recommendations.reduce((sum, rec) => sum + rec.impact, 0);

  const toggleExpanded = (id: string) => {
    setExpandedRecs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImplement = (rec: Recommendation) => {
    setImplementedRecs((prev) => new Set([...prev, rec.id]));
    onAddRecommendation?.(rec);
  };

  const quickWins = recommendations.filter((r) => r.type === 'quick_win');
  const improvements = recommendations.filter((r) => r.type === 'improvement');
  const advanced = recommendations.filter((r) => r.type === 'advanced');

  return (
    <Card className={cn('overflow-hidden', className)} data-recommendations-panel>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" />
              SAM&apos;s Cognitive Quality Recommendations
            </CardTitle>
            <CardDescription className="text-purple-100 mt-1">
              AI-powered suggestions to improve your course&apos;s cognitive impact
            </CardDescription>
          </div>
          <CognitiveQualityBadge grade={currentGrade} score={currentScore} size="lg" />
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Current vs Potential */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Current</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{currentGrade}</div>
            <div className="text-xs text-slate-500">{currentScore}/100</div>
          </div>

          <motion.div
            initial={{ x: 0 }}
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-1 px-3"
          >
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              +{potentialImprovement} pts
            </span>
          </motion.div>

          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Potential</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {estimatedGrade}
            </div>
            <div className="text-xs text-slate-500">
              {Math.min(100, currentScore + potentialImprovement)}/100
            </div>
          </div>
        </div>

        {/* Distribution Overview */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Current Cognitive Distribution
          </div>
          <div className="space-y-2">
            {Object.entries(distribution).map(([level, value]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 capitalize">{level}</span>
                <div className="flex-1">
                  <Progress value={value} className="h-2" />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-10 text-right">
                  {Math.round(value)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-500" />
              <h3 className="font-medium text-slate-900 dark:text-white">Quick Wins</h3>
              <Badge variant="secondary" className="text-xs">
                {quickWins.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {quickWins.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isExpanded={expandedRecs.has(rec.id)}
                  isImplemented={implementedRecs.has(rec.id)}
                  onToggle={() => toggleExpanded(rec.id)}
                  onImplement={() => handleImplement(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {improvements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium text-slate-900 dark:text-white">Improvements</h3>
              <Badge variant="secondary" className="text-xs">
                {improvements.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {improvements.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isExpanded={expandedRecs.has(rec.id)}
                  isImplemented={implementedRecs.has(rec.id)}
                  onToggle={() => toggleExpanded(rec.id)}
                  onImplement={() => handleImplement(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Advanced */}
        {advanced.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <h3 className="font-medium text-slate-900 dark:text-white">Advanced</h3>
              <Badge variant="secondary" className="text-xs">
                {advanced.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {advanced.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  isExpanded={expandedRecs.has(rec.id)}
                  isImplemented={implementedRecs.has(rec.id)}
                  onToggle={() => toggleExpanded(rec.id)}
                  onImplement={() => handleImplement(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recommendations.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Excellent Cognitive Quality!
            </h3>
            <p className="text-sm text-slate-500">
              Your course meets all cognitive quality standards.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual Recommendation Card
function RecommendationCard({
  recommendation,
  isExpanded,
  isImplemented,
  onToggle,
  onImplement,
}: {
  recommendation: Recommendation;
  isExpanded: boolean;
  isImplemented: boolean;
  onToggle: () => void;
  onImplement: () => void;
}) {
  const Icon = TYPE_ICONS[recommendation.type];
  const typeInfo = TYPE_LABELS[recommendation.type];
  const levelColor = LEVEL_COLORS[recommendation.level] || LEVEL_COLORS.REMEMBER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border transition-colors',
        isImplemented
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full p-4 flex items-center gap-3 text-left">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
              isImplemented
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            )}
          >
            {isImplemented ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-slate-900 dark:text-white truncate">
                {recommendation.title}
              </span>
              <Badge variant="secondary" className={cn('text-xs', typeInfo.color)}>
                {typeInfo.label}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', levelColor)}>
                {recommendation.level}
              </Badge>
            </div>
            {recommendation.chapterTitle && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {recommendation.chapterTitle}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              +{recommendation.impact} pts
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {recommendation.description}
              </p>
            </div>
            {!isImplemented && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onImplement();
                }}
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {recommendation.actionLabel}
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
