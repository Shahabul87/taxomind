'use client';

/**
 * PrerequisiteAnalyzer Component
 *
 * Visualizes prerequisite chains for concepts with gap analysis,
 * readiness scoring, and bottleneck detection.
 *
 * Features:
 * - Prerequisite chain visualization
 * - Gap analysis with missing prerequisites
 * - Readiness score calculation
 * - Bottleneck concept detection
 * - Interactive concept exploration
 *
 * @module components/sam/knowledge-graph
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  GitBranch,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  Brain,
  GraduationCap,
  ArrowDown,
  CircleDot,
  Zap,
  TrendingUp,
  XCircle,
  MinusCircle,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface Prerequisite {
  id: string;
  name: string;
  type: string;
  masteryLevel?: string;
  masteryScore?: number;
  depth: number;
  isBottleneck?: boolean;
  isCritical?: boolean;
}

interface GapAnalysis {
  missingPrerequisites: Prerequisite[];
  weakPrerequisites: Prerequisite[];
  strongPrerequisites: Prerequisite[];
  criticalPath: Prerequisite[];
  bottleneckConcepts: Prerequisite[];
}

interface PrerequisiteAnalysisResult {
  conceptId: string;
  conceptName: string;
  directPrerequisites: Prerequisite[];
  prerequisiteChain: Prerequisite[];
  gapAnalysis: GapAnalysis;
  readinessScore: number;
  estimatedTimeToReady: number;
  recommendation: string;
  analyzedAt: string;
}

interface AvailableConcept {
  id: string;
  name: string;
  type: string;
  bloomsLevel?: string;
}

interface PrerequisiteAnalyzerProps {
  courseId: string;
  initialConceptId?: string;
  onConceptClick?: (conceptId: string) => void;
  onStartRemediation?: (prerequisites: Prerequisite[]) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MASTERY_LEVELS = {
  MASTERED: { label: 'Mastered', color: 'bg-emerald-500', icon: CheckCircle2 },
  PROFICIENT: { label: 'Proficient', color: 'bg-blue-500', icon: TrendingUp },
  PRACTICING: { label: 'Practicing', color: 'bg-amber-500', icon: Clock },
  INTRODUCED: { label: 'Introduced', color: 'bg-purple-500', icon: CircleDot },
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-400', icon: MinusCircle },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Readiness score display
 */
function ReadinessScoreCard({
  score,
  timeToReady,
  recommendation,
}: {
  score: number;
  timeToReady: number;
  recommendation: string;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-blue-600';
    if (s >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-blue-500';
    if (s >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Readiness Score</h4>
          <div className={cn('text-4xl font-bold', getScoreColor(score))}>
            {score}%
          </div>
        </div>
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            score >= 80 ? 'bg-emerald-500/20' : score >= 60 ? 'bg-blue-500/20' : score >= 40 ? 'bg-amber-500/20' : 'bg-red-500/20'
          )}
        >
          {score >= 80 ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : score >= 60 ? (
            <TrendingUp className="w-8 h-8 text-blue-600" />
          ) : score >= 40 ? (
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
        </div>
      </div>

      <Progress value={score} className={cn('h-2 mb-3', getScoreBg(score))} />

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>
            {timeToReady > 0 ? `${Math.round(timeToReady / 60)}h to ready` : 'Ready to learn'}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{recommendation}</p>
    </div>
  );
}

/**
 * Gap analysis summary
 */
function GapAnalysisSummary({
  gapAnalysis,
  onConceptClick,
}: {
  gapAnalysis: GapAnalysis;
  onConceptClick?: (conceptId: string) => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const sections = [
    {
      key: 'missing',
      title: 'Missing Prerequisites',
      items: gapAnalysis.missingPrerequisites,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      description: 'Concepts you haven&apos;t started yet',
    },
    {
      key: 'weak',
      title: 'Weak Prerequisites',
      items: gapAnalysis.weakPrerequisites,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      description: 'Concepts that need more practice',
    },
    {
      key: 'bottleneck',
      title: 'Bottleneck Concepts',
      items: gapAnalysis.bottleneckConcepts,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      description: 'Critical concepts blocking progress',
    },
    {
      key: 'strong',
      title: 'Strong Foundation',
      items: gapAnalysis.strongPrerequisites,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      description: 'Well-mastered prerequisites',
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        if (section.items.length === 0) return null;

        const Icon = section.icon;
        const isExpanded = expandedSection === section.key;

        return (
          <Collapsible
            key={section.key}
            open={isExpanded}
            onOpenChange={(open) => setExpandedSection(open ? section.key : null)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full p-3 rounded-lg flex items-center justify-between transition-all',
                  section.bgColor,
                  'hover:opacity-80'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-5 h-5', section.color)} />
                  <div className="text-left">
                    <h4 className="text-sm font-medium">{section.title}</h4>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{section.items.length}</Badge>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1 pl-4">
                {section.items.map((prereq) => {
                  const masteryInfo =
                    MASTERY_LEVELS[prereq.masteryLevel as keyof typeof MASTERY_LEVELS] ||
                    MASTERY_LEVELS.NOT_STARTED;
                  const MasteryIcon = masteryInfo.icon;

                  return (
                    <button
                      key={prereq.id}
                      className="w-full p-2 rounded-lg hover:bg-muted flex items-center justify-between text-left"
                      onClick={() => onConceptClick?.(prereq.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <MasteryIcon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            masteryInfo.color.replace('bg-', 'text-')
                          )}
                        />
                        <span className="text-sm truncate">{prereq.name}</span>
                        {prereq.isBottleneck && (
                          <Badge variant="outline" className="text-[10px] text-purple-600">
                            Bottleneck
                          </Badge>
                        )}
                        {prereq.isCritical && (
                          <Badge variant="outline" className="text-[10px] text-red-600">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {prereq.masteryScore !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {prereq.masteryScore}%
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

/**
 * Prerequisite chain visualization
 */
function PrerequisiteChain({
  chain,
  onConceptClick,
}: {
  chain: Prerequisite[];
  onConceptClick?: (conceptId: string) => void;
}) {
  const groupedByDepth = chain.reduce<Record<number, Prerequisite[]>>((acc, prereq) => {
    const depth = prereq.depth;
    if (!acc[depth]) acc[depth] = [];
    acc[depth].push(prereq);
    return acc;
  }, {});

  const depths = Object.keys(groupedByDepth)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      {depths.map((depth) => {
        const prereqs = groupedByDepth[depth];

        return (
          <div key={depth} className="relative">
            {/* Depth label */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Level {depth}
              </Badge>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Concepts at this depth */}
            <div className="grid grid-cols-2 gap-2">
              {prereqs.map((prereq) => {
                const masteryInfo =
                  MASTERY_LEVELS[prereq.masteryLevel as keyof typeof MASTERY_LEVELS] ||
                  MASTERY_LEVELS.NOT_STARTED;
                const MasteryIcon = masteryInfo.icon;

                return (
                  <button
                    key={prereq.id}
                    onClick={() => onConceptClick?.(prereq.id)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all hover:shadow-sm',
                      prereq.isBottleneck && 'ring-2 ring-purple-500',
                      prereq.isCritical && 'ring-2 ring-red-500'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-white',
                          masteryInfo.color
                        )}
                      >
                        <MasteryIcon className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium truncate flex-1">
                        {prereq.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{masteryInfo.label}</span>
                      {prereq.masteryScore !== undefined && (
                        <span className="ml-auto">{prereq.masteryScore}%</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Arrow to next level */}
            {depth > Math.min(...depths) && (
              <div className="flex justify-center my-2">
                <ArrowDown className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PrerequisiteAnalyzer({
  courseId,
  initialConceptId,
  onConceptClick,
  onStartRemediation,
  className,
  compact = false,
}: PrerequisiteAnalyzerProps) {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(
    initialConceptId ?? null
  );
  const [availableConcepts, setAvailableConcepts] = useState<AvailableConcept[]>([]);
  const [analysis, setAnalysis] = useState<PrerequisiteAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'gaps' | 'chain'>('gaps');
  const isLoadingRef = useRef(false);

  // Fetch available concepts
  const fetchConcepts = useCallback(async () => {
    // Guard: Don't fetch if no courseId provided (handled by empty state)
    if (!courseId) {
      setIsLoadingConcepts(false);
      return;
    }

    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingConcepts(true);

    try {
      const res = await fetch(
        `/api/sam/knowledge-graph-engine/graph?courseId=${courseId}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch concepts');
      }

      const data = await res.json();
      if (data.success && data.data.concepts) {
        setAvailableConcepts(
          data.data.concepts.map((c: { id: string; name: string; type: string; bloomsLevel?: string }) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            bloomsLevel: c.bloomsLevel,
          }))
        );
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concepts');
    } finally {
      setIsLoadingConcepts(false);
      isLoadingRef.current = false;
    }
  }, [courseId]);

  // Analyze prerequisites
  const analyzePrerequisites = useCallback(async (conceptId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sam/knowledge-graph-engine/prerequisites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          conceptId,
          includeGapAnalysis: true,
          includeReadiness: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze prerequisites');

      const data = await res.json();
      if (data.success) {
        setAnalysis(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to analyze');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Handle concept selection
  const handleConceptSelect = useCallback(
    (conceptId: string) => {
      setSelectedConceptId(conceptId);
      analyzePrerequisites(conceptId);
    },
    [analyzePrerequisites]
  );

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  useEffect(() => {
    if (initialConceptId) {
      analyzePrerequisites(initialConceptId);
    }
  }, [initialConceptId, analyzePrerequisites]);

  // Loading state
  if (isLoadingConcepts) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading concepts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - No course selected (informational, not error)
  if (!courseId) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <GitBranch className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm">Prerequisite Analyzer</CardTitle>
              <CardDescription className="text-xs">
                Analyze prerequisites and readiness
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
            <GitBranch className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-slate-700 dark:text-slate-300">No Course Selected</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Select a course to analyze prerequisites and your readiness
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={cn(compact && 'pb-2')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <GitBranch className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm">Prerequisite Analyzer</CardTitle>
              {!compact && (
                <CardDescription className="text-xs">
                  Analyze prerequisites and readiness
                </CardDescription>
              )}
            </div>
          </div>
          {analysis && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => selectedConceptId && analyzePrerequisites(selectedConceptId)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Concept Selector */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Select concept to analyze</label>
          <Select
            value={selectedConceptId ?? ''}
            onValueChange={handleConceptSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a concept..." />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-48">
                {availableConcepts.map((concept) => (
                  <SelectItem key={concept.id} value={concept.id}>
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3" />
                      {concept.name}
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Analyzing prerequisites...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Analysis Results */}
        {analysis && !isLoading && (
          <div className="space-y-4">
            {/* Concept being analyzed */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-medium text-sm">{analysis.conceptName}</h4>
                <p className="text-xs text-muted-foreground">
                  {analysis.prerequisiteChain.length} prerequisites in chain
                </p>
              </div>
            </div>

            {/* Readiness Score */}
            <ReadinessScoreCard
              score={analysis.readinessScore}
              timeToReady={analysis.estimatedTimeToReady}
              recommendation={analysis.recommendation}
            />

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'gaps' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('gaps')}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Gap Analysis
              </Button>
              <Button
                variant={viewMode === 'chain' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setViewMode('chain')}
              >
                <Layers className="w-4 h-4 mr-2" />
                Prerequisite Chain
              </Button>
            </div>

            {/* Gap Analysis View */}
            {viewMode === 'gaps' && (
              <div className="space-y-4">
                <GapAnalysisSummary
                  gapAnalysis={analysis.gapAnalysis}
                  onConceptClick={onConceptClick}
                />

                {/* Start Remediation Button */}
                {onStartRemediation &&
                  (analysis.gapAnalysis.missingPrerequisites.length > 0 ||
                    analysis.gapAnalysis.weakPrerequisites.length > 0) && (
                    <Button
                      className="w-full"
                      onClick={() =>
                        onStartRemediation([
                          ...analysis.gapAnalysis.missingPrerequisites,
                          ...analysis.gapAnalysis.weakPrerequisites,
                        ])
                      }
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Start Prerequisite Review
                    </Button>
                  )}
              </div>
            )}

            {/* Chain View */}
            {viewMode === 'chain' && (
              <ScrollArea className="h-64">
                <PrerequisiteChain
                  chain={analysis.prerequisiteChain}
                  onConceptClick={onConceptClick}
                />
              </ScrollArea>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedConceptId && !isLoading && (
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-sm mb-1">Select a Concept</h3>
            <p className="text-xs text-muted-foreground">
              Choose a concept above to analyze its prerequisites and your readiness
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PrerequisiteAnalyzer;
