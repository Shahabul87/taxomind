'use client';

/**
 * OrchestrationPanel
 *
 * Visualizes the SAM AI orchestration process.
 * Shows engine execution status, results, and metadata.
 *
 * Features:
 * - Real-time engine execution visualization
 * - Engine result cards with expandable details
 * - Performance metrics display
 * - Bloom's taxonomy analysis visualization
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Brain,
  Target,
  User,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Layers,
  RefreshCw,
  Activity,
  ListTodo,
} from 'lucide-react';
import { StepProgressBar, type Step, type StepStatus } from './StepProgressBar';
import { PlanStepCard, type PlanStep, type Resource } from './PlanStepCard';

// ============================================================================
// TYPES
// ============================================================================

export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface BloomsAnalysis {
  distribution: BloomsDistribution;
  dominantLevel: BloomsLevel;
  cognitiveDepth: number;
  balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  gaps: BloomsLevel[];
  recommendations: string[];
}

export interface EngineResult {
  engineName: string;
  success: boolean;
  data: Record<string, unknown> | null;
  metadata: {
    executionTime: number;
    cached: boolean;
    version: string;
    model?: string;
    tokens?: {
      input: number;
      output: number;
    };
  };
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

export interface OrchestrationResult {
  success: boolean;
  results: Record<string, EngineResult>;
  response: {
    message: string;
    suggestions: Array<{ id: string; text: string; type: string }>;
    actions: Array<{ id: string; label: string; type: string }>;
    insights: Record<string, unknown>;
    blooms?: BloomsAnalysis;
  };
  metadata: {
    totalExecutionTime: number;
    enginesExecuted: string[];
    enginesFailed: string[];
    enginesCached: string[];
    parallelTiers: string[][];
  };
}

export interface LearningPlanProgress {
  steps: Step[];
  currentStep?: PlanStep;
  currentStepNumber?: number;
  totalSteps?: number;
}

export interface OrchestrationPanelProps {
  result?: OrchestrationResult | null;
  isProcessing?: boolean;
  onRefresh?: () => void;
  compact?: boolean;
  className?: string;
  /** Optional learning plan progress to show alongside engine execution */
  learningPlan?: LearningPlanProgress;
  /** Callback when a learning step is clicked */
  onStepClick?: (stepId: string, index: number) => void;
  /** Callback when current step is completed */
  onStepComplete?: () => void;
  /** Callback when current step is skipped */
  onStepSkip?: () => void;
  /** Callback when help is requested for current step */
  onStepHelpRequest?: () => void;
  /** Callback when a resource is clicked */
  onResourceClick?: (resource: Resource) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ENGINE_CONFIG: Record<
  string,
  {
    icon: typeof Brain;
    label: string;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  context: {
    icon: Layers,
    label: 'Context Engine',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description: 'Analyzes learning context and user state',
  },
  content: {
    icon: MessageSquare,
    label: 'Content Engine',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description: 'Generates and adapts content',
  },
  assessment: {
    icon: Target,
    label: 'Assessment Engine',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description: 'Evaluates understanding and progress',
  },
  personalization: {
    icon: User,
    label: 'Personalization Engine',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description: 'Adapts to learning style and preferences',
  },
  response: {
    icon: MessageSquare,
    label: 'Response Engine',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    description: 'Generates final response',
  },
  blooms: {
    icon: Brain,
    label: 'Bloom&apos;s Engine',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description: 'Cognitive level analysis',
  },
};

const BLOOMS_COLORS: Record<BloomsLevel, string> = {
  REMEMBER: 'bg-red-500',
  UNDERSTAND: 'bg-orange-500',
  APPLY: 'bg-yellow-500',
  ANALYZE: 'bg-green-500',
  EVALUATE: 'bg-blue-500',
  CREATE: 'bg-purple-500',
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function EngineCard({
  result,
  expanded,
  onToggle,
  compact,
}: {
  result: EngineResult;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const config = ENGINE_CONFIG[result.engineName.toLowerCase()] || {
    icon: Activity,
    label: result.engineName,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    description: 'Custom engine',
  };

  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg',
                config.bgColor,
                result.success ? '' : 'opacity-60'
              )}
            >
              <Icon className={cn('h-4 w-4', config.color)} />
              {result.success ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs">{result.metadata.executionTime}ms</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{config.label}</div>
              <div className="text-xs text-muted-foreground">
                {result.success ? 'Completed' : 'Failed'} in {result.metadata.executionTime}ms
              </div>
              {result.metadata.cached && (
                <Badge variant="outline" className="text-xs">
                  Cached
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className={cn('rounded-lg border', config.bgColor)}>
        <CollapsibleTrigger className="w-full p-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', config.bgColor, 'border')}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div>
                <div className="font-medium text-sm">{config.label}</div>
                <div className="text-xs text-muted-foreground">{config.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result.metadata.cached && (
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Cached
                </Badge>
              )}
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <div className="text-xs text-muted-foreground">
                {result.metadata.executionTime}ms
              </div>
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t space-y-2">
            {result.error && (
              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded text-xs text-red-600 dark:text-red-400">
                <strong>Error:</strong> {result.error.message}
                {result.error.recoverable && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Recoverable
                  </Badge>
                )}
              </div>
            )}
            {result.metadata.model && (
              <div className="text-xs">
                <strong>Model:</strong> {result.metadata.model}
              </div>
            )}
            {result.metadata.tokens && (
              <div className="text-xs">
                <strong>Tokens:</strong> {result.metadata.tokens.input} in /{' '}
                {result.metadata.tokens.output} out
              </div>
            )}
            {result.data && Object.keys(result.data).length > 0 && (
              <div className="text-xs">
                <strong>Data keys:</strong> {Object.keys(result.data).join(', ')}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function BloomsVisualization({ analysis }: { analysis: BloomsAnalysis }) {
  const levels: BloomsLevel[] = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ];

  const maxValue = Math.max(...Object.values(analysis.distribution), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-pink-500" />
          <span className="font-medium text-sm">Cognitive Analysis</span>
        </div>
        <Badge
          className={cn(
            analysis.balance === 'well-balanced'
              ? 'bg-green-100 text-green-700'
              : analysis.balance === 'bottom-heavy'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-purple-100 text-purple-700'
          )}
        >
          {analysis.balance}
        </Badge>
      </div>

      <div className="space-y-2">
        {levels.map((level) => (
          <div key={level} className="flex items-center gap-2">
            <span className="text-xs w-20 truncate">{level}</span>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(analysis.distribution[level] / maxValue) * 100}%` }}
                transition={{ duration: 0.5, delay: levels.indexOf(level) * 0.1 }}
                className={cn('h-full rounded-full', BLOOMS_COLORS[level])}
              />
            </div>
            <span className="text-xs w-8 text-right">
              {Math.round(analysis.distribution[level])}%
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Cognitive Depth: {analysis.cognitiveDepth}%</span>
        <span>Dominant: {analysis.dominantLevel}</span>
      </div>

      {analysis.gaps.length > 0 && (
        <div className="text-xs text-amber-600 dark:text-amber-400">
          Gaps detected: {analysis.gaps.join(', ')}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrchestrationPanel({
  result,
  isProcessing = false,
  onRefresh,
  compact = false,
  className,
  learningPlan,
  onStepClick,
  onStepComplete,
  onStepSkip,
  onStepHelpRequest,
  onResourceClick,
}: OrchestrationPanelProps) {
  const [expandedEngine, setExpandedEngine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'engines' | 'plan'>(
    learningPlan?.currentStep ? 'plan' : 'engines'
  );

  const engineResults = useMemo(() => {
    if (!result?.results) return [];
    return Object.entries(result.results).map(([name, engineResult]) => ({
      ...engineResult,
      engineName: name,
    }));
  }, [result]);

  const stats = useMemo(() => {
    if (!result?.metadata) {
      return { total: 0, succeeded: 0, failed: 0, cached: 0, time: 0 };
    }
    return {
      total: result.metadata.enginesExecuted.length,
      succeeded: result.metadata.enginesExecuted.length - result.metadata.enginesFailed.length,
      failed: result.metadata.enginesFailed.length,
      cached: result.metadata.enginesCached.length,
      time: result.metadata.totalExecutionTime,
    };
  }, [result]);

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-base">Orchestration</CardTitle>
            </div>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            ) : (
              <Badge variant="outline" className="text-xs">
                {stats.time}ms
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-2">
            {isProcessing ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            ) : (
              engineResults.map((engineResult) => (
                <EngineCard
                  key={engineResult.engineName}
                  result={engineResult}
                  expanded={false}
                  onToggle={() => {}}
                  compact
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper to render engine results content
  const renderEngineContent = () => (
    <div className="space-y-4">
      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-sm text-muted-foreground">Processing through engines...</p>
        </div>
      ) : (
        <>
          {/* Engine Results */}
          <div className="space-y-2">
            {engineResults.map((engineResult) => (
              <EngineCard
                key={engineResult.engineName}
                result={engineResult}
                expanded={expandedEngine === engineResult.engineName}
                onToggle={() =>
                  setExpandedEngine(
                    expandedEngine === engineResult.engineName
                      ? null
                      : engineResult.engineName
                  )
                }
              />
            ))}
          </div>

          {/* Bloom&apos;s Analysis */}
          {result?.response.blooms && (
            <div className="pt-4 border-t">
              <BloomsVisualization analysis={result.response.blooms} />
            </div>
          )}

          {/* Response Preview */}
          {result?.response.message && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                <span className="font-medium text-sm">Response Preview</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {result.response.message}
              </p>
              {result.response.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.response.suggestions.slice(0, 3).map((suggestion) => (
                    <Badge key={suggestion.id} variant="secondary" className="text-xs">
                      {suggestion.text}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Helper to render learning plan content
  const renderLearningPlanContent = () => {
    if (!learningPlan) return null;

    return (
      <div className="space-y-4">
        {/* Step Progress Bar */}
        {learningPlan.steps.length > 0 && (
          <StepProgressBar
            steps={learningPlan.steps}
            compact={false}
            clickable
            onStepClick={onStepClick}
            showLabels
            showLines
            orientation="horizontal"
          />
        )}

        {/* Current Step Card */}
        {learningPlan.currentStep && (
          <PlanStepCard
            step={learningPlan.currentStep}
            stepNumber={learningPlan.currentStepNumber ?? 1}
            totalSteps={learningPlan.totalSteps ?? learningPlan.steps.length}
            isActive
            onComplete={onStepComplete}
            onSkip={onStepSkip}
            onRequestHelp={onStepHelpRequest}
            onResourceClick={onResourceClick}
            isLoading={isProcessing}
          />
        )}

        {/* Empty state when no current step */}
        {!learningPlan.currentStep && learningPlan.steps.length > 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">All steps completed!</p>
            <p className="text-sm text-muted-foreground">
              Great job finishing your learning plan.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <CardTitle>SAM Orchestration</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isProcessing}
                className="h-8 w-8"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Multi-engine AI processing pipeline</CardDescription>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1 text-xs">
            <Activity className="h-3 w-3" />
            <span>{stats.total} engines</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span>{stats.succeeded} succeeded</span>
          </div>
          {stats.failed > 0 && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <XCircle className="h-3 w-3" />
              <span>{stats.failed} failed</span>
            </div>
          )}
          {stats.cached > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Zap className="h-3 w-3" />
              <span>{stats.cached} cached</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs ml-auto">
            <Clock className="h-3 w-3" />
            <span>{stats.time}ms total</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {learningPlan ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'engines' | 'plan')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="engines" className="gap-2">
                <Activity className="h-4 w-4" />
                Engines
              </TabsTrigger>
              <TabsTrigger value="plan" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Learning Plan
                {learningPlan.currentStep && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {learningPlan.currentStepNumber ?? 1}/{learningPlan.totalSteps ?? learningPlan.steps.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] pr-4">
              <TabsContent value="engines" className="mt-0">
                {renderEngineContent()}
              </TabsContent>

              <TabsContent value="plan" className="mt-0">
                {renderLearningPlanContent()}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            {renderEngineContent()}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default OrchestrationPanel;
