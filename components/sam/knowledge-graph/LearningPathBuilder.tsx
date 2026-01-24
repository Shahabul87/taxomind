'use client';

/**
 * LearningPathBuilder Component
 *
 * Interactive tool for generating personalized learning paths through the knowledge graph.
 * Supports multiple strategies and visualizes the optimal route to target concepts.
 *
 * Features:
 * - Strategy selection (FASTEST, THOROUGH, BALANCED)
 * - Target concept picker
 * - Visual path representation
 * - Estimated time and difficulty
 * - Skip mastered concepts option
 *
 * @module components/sam/knowledge-graph
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Route,
  Target,
  Zap,
  BookOpen,
  Scale,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Play,
  RefreshCw,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
  GraduationCap,
  ArrowRight,
  CircleDot,
  MapPin,
  Trophy,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type LearningStrategy = 'FASTEST' | 'THOROUGH' | 'BALANCED';

interface PathConcept {
  id: string;
  name: string;
  type: string;
  description?: string;
  bloomsLevel?: string;
  estimatedMinutes?: number;
  masteryStatus?: 'mastered' | 'proficient' | 'practicing' | 'introduced' | 'not_started';
  masteryScore?: number;
  order: number;
  isPrerequisite: boolean;
  isTarget: boolean;
}

interface GeneratedPath {
  targetConceptIds: string[];
  strategy: LearningStrategy;
  path: PathConcept[];
  totalConcepts: number;
  skippedMastered: number;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completionPercentage: number;
  generatedAt: string;
}

interface AvailableConcept {
  id: string;
  name: string;
  type: string;
  bloomsLevel?: string;
}

interface LearningPathBuilderProps {
  courseId: string;
  onConceptClick?: (conceptId: string) => void;
  onStartLearning?: (path: GeneratedPath) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STRATEGIES = [
  {
    value: 'FASTEST' as const,
    label: 'Fastest Path',
    description: 'Skip mastered concepts, minimal prerequisites',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    value: 'THOROUGH' as const,
    label: 'Thorough Learning',
    description: 'Cover all prerequisites, reinforce fundamentals',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    value: 'BALANCED' as const,
    label: 'Balanced Approach',
    description: 'Optimal mix of speed and depth',
    icon: Scale,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
] as const;

const MASTERY_COLORS = {
  mastered: 'bg-emerald-500',
  proficient: 'bg-blue-500',
  practicing: 'bg-amber-500',
  introduced: 'bg-purple-500',
  not_started: 'bg-gray-400',
};

const BLOOMS_LEVELS = {
  REMEMBER: { label: 'Remember', color: 'bg-slate-500' },
  UNDERSTAND: { label: 'Understand', color: 'bg-blue-500' },
  APPLY: { label: 'Apply', color: 'bg-green-500' },
  ANALYZE: { label: 'Analyze', color: 'bg-amber-500' },
  EVALUATE: { label: 'Evaluate', color: 'bg-orange-500' },
  CREATE: { label: 'Create', color: 'bg-red-500' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Strategy selector card
 */
function StrategySelector({
  selected,
  onSelect,
}: {
  selected: LearningStrategy;
  onSelect: (strategy: LearningStrategy) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STRATEGIES.map((strategy) => {
        const Icon = strategy.icon;
        const isSelected = selected === strategy.value;

        return (
          <button
            key={strategy.value}
            onClick={() => onSelect(strategy.value)}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-left',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-transparent bg-muted/50 hover:bg-muted'
            )}
          >
            <div className={cn('p-2 rounded-lg w-fit mb-2', strategy.bgColor)}>
              <Icon className={cn('w-4 h-4', strategy.color)} />
            </div>
            <h4 className="font-medium text-sm">{strategy.label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {strategy.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Target concept picker
 */
function TargetPicker({
  availableConcepts,
  selectedIds,
  onSelect,
  onRemove,
  maxSelections = 5,
}: {
  availableConcepts: AvailableConcept[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  maxSelections?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const unselectedConcepts = availableConcepts.filter(
    (c) => !selectedIds.includes(c.id)
  );
  const selectedConcepts = availableConcepts.filter((c) =>
    selectedIds.includes(c.id)
  );

  return (
    <div className="space-y-3">
      {/* Selected targets */}
      {selectedConcepts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedConcepts.map((concept) => (
            <Badge
              key={concept.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
            >
              <Target className="w-3 h-3 text-primary" />
              <span className="max-w-32 truncate">{concept.name}</span>
              <button
                onClick={() => onRemove(concept.id)}
                className="ml-1 p-0.5 hover:bg-muted rounded"
              >
                &times;
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Concept picker */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between"
            disabled={selectedIds.length >= maxSelections}
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              {selectedIds.length === 0
                ? 'Select target concepts'
                : `Add more targets (${selectedIds.length}/${maxSelections})`}
            </span>
            <ChevronDown
              className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-48 mt-2 border rounded-lg">
            <div className="p-2 space-y-1">
              {unselectedConcepts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No more concepts available
                </p>
              ) : (
                unselectedConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    onClick={() => {
                      onSelect(concept.id);
                      if (selectedIds.length + 1 >= maxSelections) {
                        setIsOpen(false);
                      }
                    }}
                    className="w-full p-2 rounded-lg hover:bg-muted text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{concept.name}</span>
                    </div>
                    {concept.bloomsLevel && BLOOMS_LEVELS[concept.bloomsLevel as keyof typeof BLOOMS_LEVELS] && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] shrink-0 text-white border-0',
                          BLOOMS_LEVELS[concept.bloomsLevel as keyof typeof BLOOMS_LEVELS].color
                        )}
                      >
                        {BLOOMS_LEVELS[concept.bloomsLevel as keyof typeof BLOOMS_LEVELS].label}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Path visualization
 */
function PathVisualization({
  path,
  onConceptClick,
}: {
  path: GeneratedPath;
  onConceptClick?: (conceptId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Path summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-2xl font-bold text-primary">{path.totalConcepts}</div>
          <div className="text-xs text-muted-foreground">Concepts</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-2xl font-bold text-emerald-600">{path.skippedMastered}</div>
          <div className="text-xs text-muted-foreground">Skipped</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(path.estimatedMinutes / 60)}h
          </div>
          <div className="text-xs text-muted-foreground">Est. Time</div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {path.completionPercentage}%
          </div>
          <div className="text-xs text-muted-foreground">Progress</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{path.completionPercentage}%</span>
        </div>
        <Progress value={path.completionPercentage} className="h-2" />
      </div>

      {/* Path steps */}
      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {path.path.map((concept, index) => {
            const masteryColor =
              MASTERY_COLORS[concept.masteryStatus ?? 'not_started'];
            const isLast = index === path.path.length - 1;
            const bloomsInfo = concept.bloomsLevel
              ? BLOOMS_LEVELS[concept.bloomsLevel as keyof typeof BLOOMS_LEVELS]
              : null;

            return (
              <div key={concept.id} className="relative">
                {/* Connecting line */}
                {!isLast && (
                  <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-muted-foreground/20" />
                )}

                <div
                  className={cn(
                    'p-3 rounded-xl border bg-card hover:shadow-sm transition-all cursor-pointer',
                    concept.isTarget && 'ring-2 ring-primary',
                    concept.masteryStatus === 'mastered' && 'opacity-60'
                  )}
                  onClick={() => onConceptClick?.(concept.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Step indicator */}
                    <div className="relative">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white',
                          concept.isTarget
                            ? 'bg-primary'
                            : concept.isPrerequisite
                            ? 'bg-amber-500'
                            : masteryColor
                        )}
                      >
                        {concept.isTarget ? (
                          <Trophy className="w-5 h-5" />
                        ) : concept.masteryStatus === 'mastered' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {concept.name}
                        </h4>
                        {concept.isTarget && (
                          <Badge variant="default" className="text-[10px]">
                            Target
                          </Badge>
                        )}
                        {concept.isPrerequisite && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">
                            Prerequisite
                          </Badge>
                        )}
                      </div>

                      {concept.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                          {concept.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs">
                        {bloomsInfo && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] text-white border-0',
                                    bloomsInfo.color
                                  )}
                                >
                                  {bloomsInfo.label}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Bloom&apos;s Taxonomy Level</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {concept.estimatedMinutes && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{concept.estimatedMinutes}min</span>
                          </div>
                        )}

                        {concept.masteryScore !== undefined && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GraduationCap className="w-3 h-3" />
                            <span>{concept.masteryScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningPathBuilder({
  courseId,
  onConceptClick,
  onStartLearning,
  className,
  compact = false,
}: LearningPathBuilderProps) {
  const [strategy, setStrategy] = useState<LearningStrategy>('BALANCED');
  const [targetConceptIds, setTargetConceptIds] = useState<string[]>([]);
  const [skipMastered, setSkipMastered] = useState(true);
  const [availableConcepts, setAvailableConcepts] = useState<AvailableConcept[]>([]);
  const [generatedPath, setGeneratedPath] = useState<GeneratedPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConcepts, setIsLoadingConcepts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

  // Generate learning path
  const generatePath = useCallback(async () => {
    if (targetConceptIds.length === 0) {
      setError('Please select at least one target concept');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sam/knowledge-graph-engine/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          targetConceptIds,
          strategy,
          skipMastered,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate learning path');

      const data = await res.json();
      if (data.success) {
        setGeneratedPath(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to generate path');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate path');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, targetConceptIds, strategy, skipMastered]);

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

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
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Learning Path Builder</CardTitle>
              <CardDescription className="text-xs">
                Generate personalized learning routes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
            <Route className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-center">
            <h3 className="font-medium text-slate-700 dark:text-slate-300">No Course Selected</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Select a course to build a personalized learning path
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state - actual errors (API failures, etc.)
  if (error && !generatedPath) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Learning Path Builder</CardTitle>
              <CardDescription className="text-xs">
                Generate personalized learning routes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground text-center">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchConcepts}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className={cn(compact && 'pb-2')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Learning Path Builder</CardTitle>
              {!compact && (
                <CardDescription className="text-xs">
                  Generate personalized learning routes
                </CardDescription>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Settings Panel */}
        <Collapsible open={showSettings || !generatedPath} onOpenChange={setShowSettings}>
          <CollapsibleContent className="space-y-4">
            {/* Strategy Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Learning Strategy</Label>
              <StrategySelector selected={strategy} onSelect={setStrategy} />
            </div>

            {/* Target Concepts */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Target Concepts</Label>
              <TargetPicker
                availableConcepts={availableConcepts}
                selectedIds={targetConceptIds}
                onSelect={(id) => setTargetConceptIds([...targetConceptIds, id])}
                onRemove={(id) =>
                  setTargetConceptIds(targetConceptIds.filter((t) => t !== id))
                }
              />
            </div>

            {/* Options */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <Label htmlFor="skip-mastered" className="text-sm cursor-pointer">
                  Skip mastered concepts
                </Label>
              </div>
              <Switch
                id="skip-mastered"
                checked={skipMastered}
                onCheckedChange={setSkipMastered}
              />
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={generatePath}
              disabled={isLoading || targetConceptIds.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Path...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Learning Path
                </>
              )}
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Error display */}
        {error && generatedPath && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Generated Path */}
        {generatedPath && (
          <div className="space-y-4">
            {showSettings && <div className="border-t pt-4" />}

            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Your Learning Path
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  generatedPath.difficulty === 'beginner' && 'text-green-600',
                  generatedPath.difficulty === 'intermediate' && 'text-amber-600',
                  generatedPath.difficulty === 'advanced' && 'text-red-600'
                )}
              >
                {generatedPath.difficulty}
              </Badge>
            </div>

            <PathVisualization path={generatedPath} onConceptClick={onConceptClick} />

            {/* Start Learning Button */}
            {onStartLearning && (
              <Button
                className="w-full"
                size="lg"
                onClick={() => onStartLearning(generatedPath)}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Learning Path
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LearningPathBuilder;
