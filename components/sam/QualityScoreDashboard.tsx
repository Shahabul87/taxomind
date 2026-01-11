'use client';

/**
 * QualityScoreDashboard Component
 *
 * A comprehensive dashboard for instructors to monitor and validate
 * the quality of AI-generated educational content.
 *
 * Features:
 * - Content validation with all quality gates
 * - Real-time scoring and feedback
 * - Gate-by-gate breakdown
 * - Issue tracking and suggestions
 * - Historical validation trends
 */

import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  BarChart3,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Target,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Info,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

interface GateResult {
  gateName: string;
  passed: boolean;
  score: number;
  weight: number;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location?: string;
    suggestedFix?: string;
  }>;
  suggestions: string[];
  processingTimeMs: number;
  metadata?: Record<string, unknown>;
}

interface ValidationResult {
  passed: boolean;
  overallScore: number;
  gateResults: GateResult[];
  failedGates: string[];
  criticalIssues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  }>;
  suggestions: string[];
  iterations: number;
  processingTimeMs: number;
  metadata: {
    timestamp: string;
    enhancementAttempted: boolean;
    reason: string;
  } | null;
}

interface QualityScoreDashboardProps {
  className?: string;
  initialContent?: string;
  initialContentType?: ContentType;
  onValidationComplete?: (result: ValidationResult) => void;
}

type ContentType =
  | 'lesson'
  | 'explanation'
  | 'exercise'
  | 'quiz'
  | 'assessment'
  | 'summary'
  | 'tutorial'
  | 'example'
  | 'feedback'
  | 'answer';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTENT_TYPES: Array<{ value: ContentType; label: string }> = [
  { value: 'lesson', label: 'Lesson' },
  { value: 'explanation', label: 'Explanation' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'summary', label: 'Summary' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'example', label: 'Example' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'answer', label: 'Answer' },
];

const DIFFICULTY_LEVELS: Array<{ value: DifficultyLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const BLOOMS_LEVELS: Array<{ value: BloomsLevel; label: string; description: string }> = [
  { value: 'REMEMBER', label: 'Remember', description: 'Recall facts and basic concepts' },
  { value: 'UNDERSTAND', label: 'Understand', description: 'Explain ideas or concepts' },
  { value: 'APPLY', label: 'Apply', description: 'Use information in new situations' },
  { value: 'ANALYZE', label: 'Analyze', description: 'Draw connections among ideas' },
  { value: 'EVALUATE', label: 'Evaluate', description: 'Justify a decision' },
  { value: 'CREATE', label: 'Create', description: 'Produce new or original work' },
];

const GATE_INFO: Record<string, { icon: React.ElementType; color: string; description: string }> = {
  CompletenessGate: {
    icon: FileText,
    color: 'text-blue-500',
    description: 'Checks content completeness, sections, and coverage',
  },
  ExampleQualityGate: {
    icon: Lightbulb,
    color: 'text-yellow-500',
    description: 'Validates quality and quantity of examples',
  },
  DifficultyMatchGate: {
    icon: Target,
    color: 'text-purple-500',
    description: 'Ensures difficulty matches target level',
  },
  StructureGate: {
    icon: BookOpen,
    color: 'text-green-500',
    description: 'Validates formatting and structure',
  },
  DepthGate: {
    icon: BarChart3,
    color: 'text-orange-500',
    description: 'Checks cognitive depth and critical thinking',
  },
};

const SEVERITY_COLORS = {
  critical: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrokeColor = (s: number) => {
    if (s >= 80) return 'stroke-green-500';
    if (s >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-1000', getStrokeColor(score))}
        />
      </svg>
      <div className={cn('absolute inset-0 flex items-center justify-center font-bold', getScoreColor(score))}>
        {Math.round(score)}
      </div>
    </div>
  );
}

function GateCard({ result }: { result: GateResult }) {
  const [expanded, setExpanded] = useState(false);
  const info = GATE_INFO[result.gateName] ?? {
    icon: Shield,
    color: 'text-muted-foreground',
    description: 'Quality gate',
  };
  const Icon = info.icon;

  return (
    <div
      className={cn(
        'border rounded-xl p-4 transition-all duration-200',
        result.passed
          ? 'border-green-500/30 bg-green-500/5'
          : 'border-red-500/30 bg-red-500/5'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-background', info.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{result.gateName.replace('Gate', '')}</h4>
              {result.passed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={cn('text-2xl font-bold', result.score >= 75 ? 'text-green-500' : 'text-red-500')}>
              {Math.round(result.score)}
            </div>
            <div className="text-xs text-muted-foreground">{result.processingTimeMs}ms</div>
          </div>
          {(result.issues.length > 0 || result.suggestions.length > 0) && (
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {result.issues.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Issues ({result.issues.length})
              </h5>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={cn('p-3 rounded-lg border text-sm', SEVERITY_COLORS[issue.severity])}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span>{issue.description}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {issue.severity}
                      </Badge>
                    </div>
                    {issue.suggestedFix && (
                      <p className="mt-2 text-xs opacity-80">
                        <span className="font-medium">Fix:</span> {issue.suggestedFix}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Suggestions
              </h5>
              <ul className="space-y-1">
                {result.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QualityScoreDashboard({
  className,
  initialContent = '',
  initialContentType = 'lesson',
  onValidationComplete,
}: QualityScoreDashboardProps) {
  const [content, setContent] = useState(initialContent);
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [bloomsLevel, setBloomsLevel] = useState<BloomsLevel>('UNDERSTAND');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(false);

  const handleValidate = useCallback(async () => {
    if (!content.trim() || content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sam/quality/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: contentType,
          targetDifficulty: difficulty,
          targetBloomsLevel: bloomsLevel,
          quickValidation: quickMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Validation failed');
      }

      setResult(data.data);
      onValidationComplete?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate content');
    } finally {
      setLoading(false);
    }
  }, [content, contentType, difficulty, bloomsLevel, quickMode, onValidationComplete]);

  const handleReset = useCallback(() => {
    setContent('');
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Content Quality Dashboard
              </CardTitle>
              <CardDescription>
                Validate AI-generated educational content through multiple quality gates
              </CardDescription>
            </div>
            {result && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                New Validation
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {!result ? (
        /* Input Form */
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Content Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Content to Validate</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your educational content here..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} characters • Minimum 10 required
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Difficulty</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Target Bloom&apos;s Level</label>
                <Select value={bloomsLevel} onValueChange={(v) => setBloomsLevel(v as BloomsLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOMS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Mode Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quickMode"
                checked={quickMode}
                onChange={(e) => setQuickMode(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="quickMode" className="text-sm text-muted-foreground">
                Quick validation (essential gates only)
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleValidate}
              disabled={loading || content.length < 10}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Validate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Results */
        <div className="space-y-6">
          {/* Overall Score Card */}
          <Card className={cn(result.passed ? 'border-green-500/30' : 'border-red-500/30')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <ScoreGauge score={result.overallScore} />
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {result.passed ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          Content Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-red-500" />
                          Content Failed
                        </>
                      )}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {result.metadata?.reason ?? 'Validation complete'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Processed in {result.processingTimeMs}ms</span>
                      {result.iterations > 1 && (
                        <span>{result.iterations} iterations</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-2">Gates Summary</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {result.gateResults.filter((g) => g.passed).length} Passed
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-700">
                      <XCircle className="w-3 h-3 mr-1" />
                      {result.failedGates.length} Failed
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critical Issues Alert */}
          {result.criticalIssues.length > 0 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-5 h-5" />
                  Critical Issues Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.criticalIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{issue.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gate Results */}
          <Tabs defaultValue="gates" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gates">Gate Results</TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions ({result.suggestions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="gates" className="mt-4 space-y-4">
              {result.gateResults.map((gate, i) => (
                <GateCard key={i} result={gate} />
              ))}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {result.suggestions.length > 0 ? (
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>No suggestions - your content looks great!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

export default QualityScoreDashboard;
