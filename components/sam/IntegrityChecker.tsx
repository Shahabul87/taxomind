'use client';

/**
 * IntegrityChecker Component
 *
 * Academic integrity verification tool with plagiarism and AI detection.
 *
 * Features:
 * - Plagiarism detection with source matching
 * - AI-generated content detection
 * - Writing style consistency analysis
 * - Detailed integrity reports
 * - Historical comparison
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  Bot,
  Copy,
  Fingerprint,
  BarChart3,
  Clock,
  FileWarning,
  Sparkles,
  AlertCircle,
  Info,
  ExternalLink,
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

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type CheckType = 'plagiarism' | 'ai-detection' | 'consistency';

interface PlagiarismMatch {
  id: string;
  sourceId: string;
  sourceType: 'student_answer' | 'external_source' | 'course_content';
  sourceName: string;
  matchedText: string;
  originalText: string;
  similarity: number;
  startPosition: number;
  endPosition: number;
}

interface PlagiarismResult {
  isPlagiarized: boolean;
  overallSimilarity: number;
  matches: PlagiarismMatch[];
  confidence: number;
}

interface AIDetectionResult {
  isAIGenerated: boolean;
  probability: number;
  confidence: number;
  indicators: AIIndicator[];
  perplexityScore: number;
  burstinessScore: number;
}

interface AIIndicator {
  name: string;
  score: number;
  description: string;
  weight: number;
}

interface ConsistencyResult {
  isConsistent: boolean;
  overallScore: number;
  styleDrift: number;
  vocabularyConsistency: number;
  syntaxConsistency: number;
  anomalies: ConsistencyAnomaly[];
}

interface ConsistencyAnomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: string;
}

interface IntegrityCheckResult {
  id: string;
  overallRisk: RiskLevel;
  overallScore: number;
  plagiarism?: PlagiarismResult;
  aiDetection?: AIDetectionResult;
  consistency?: ConsistencyResult;
  recommendations: string[];
  timestamp: string;
}

interface IntegrityCheckerProps {
  className?: string;
  compact?: boolean;
  defaultText?: string;
  onCheckComplete?: (result: IntegrityCheckResult) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_LEVEL_CONFIG = {
  low: {
    label: 'Low Risk',
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
    icon: ShieldCheck,
    bgColor: 'from-green-500/20 to-emerald-500/20',
  },
  medium: {
    label: 'Medium Risk',
    color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    icon: Shield,
    bgColor: 'from-yellow-500/20 to-orange-500/20',
  },
  high: {
    label: 'High Risk',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    icon: ShieldAlert,
    bgColor: 'from-orange-500/20 to-red-500/20',
  },
  critical: {
    label: 'Critical Risk',
    color: 'bg-red-500/10 text-red-600 border-red-500/30',
    icon: ShieldAlert,
    bgColor: 'from-red-500/20 to-pink-500/20',
  },
};

const CHECK_TYPE_CONFIG = {
  plagiarism: {
    label: 'Plagiarism Check',
    icon: Copy,
    color: 'text-blue-500 bg-blue-500/10',
    description: 'Compare against known sources',
  },
  'ai-detection': {
    label: 'AI Detection',
    icon: Bot,
    color: 'text-purple-500 bg-purple-500/10',
    description: 'Detect AI-generated content',
  },
  consistency: {
    label: 'Style Consistency',
    icon: Fingerprint,
    color: 'text-orange-500 bg-orange-500/10',
    description: 'Analyze writing patterns',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function RiskGauge({ risk, score }: { risk: RiskLevel; score: number }) {
  const config = RISK_LEVEL_CONFIG[risk];
  const Icon = config.icon;

  return (
    <div className={cn(
      'p-6 rounded-2xl bg-gradient-to-br text-center',
      config.bgColor
    )}>
      <Icon className={cn(
        'w-12 h-12 mx-auto mb-3',
        risk === 'low' ? 'text-green-600' :
        risk === 'medium' ? 'text-yellow-600' :
        risk === 'high' ? 'text-orange-600' : 'text-red-600'
      )} />
      <div className="text-3xl font-bold mb-1">{score}%</div>
      <Badge className={cn('text-sm', config.color)}>{config.label}</Badge>
    </div>
  );
}

function CheckTypeSelector({
  selected,
  onToggle,
}: {
  selected: CheckType[];
  onToggle: (type: CheckType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.entries(CHECK_TYPE_CONFIG) as [CheckType, typeof CHECK_TYPE_CONFIG.plagiarism][]).map(
        ([key, config]) => {
          const Icon = config.icon;
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              )}
            >
              <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn(
                'text-xs font-medium text-center',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}>
                {config.label}
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 70 70">
          <circle
            className="stroke-muted"
            strokeWidth="6"
            fill="none"
            r="30"
            cx="35"
            cy="35"
          />
          <circle
            className={cn('transition-all duration-700', color)}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            r="30"
            cx="35"
            cy="35"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{score}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

function PlagiarismMatchCard({ match }: { match: PlagiarismMatch }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-muted/30 border border-red-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FileWarning className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">{match.sourceName}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {match.sourceType.replace('_', ' ')}
          </Badge>
        </div>
        <Badge className="bg-red-500/10 text-red-600 text-xs">
          {match.similarity}% match
        </Badge>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {expanded ? 'Hide details' : 'Show matched text'}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="p-2 rounded bg-red-500/5 border border-red-500/20">
            <span className="text-xs text-muted-foreground block mb-1">Your text:</span>
            <p className="text-sm">{match.matchedText}</p>
          </div>
          <div className="p-2 rounded bg-muted">
            <span className="text-xs text-muted-foreground block mb-1">Source text:</span>
            <p className="text-sm">{match.originalText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AIIndicatorBar({ indicator }: { indicator: AIIndicator }) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{indicator.name}</span>
              <span className="font-medium">{indicator.score}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getColor(indicator.score))}
                style={{ width: `${indicator.score}%` }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-[200px]">{indicator.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ConsistencyAnomalyCard({ anomaly }: { anomaly: ConsistencyAnomaly }) {
  const severityColors = {
    low: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
    medium: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
    high: 'bg-red-500/10 border-red-500/20 text-red-600',
  };

  return (
    <div className={cn('p-2 rounded-lg border', severityColors[anomaly.severity])}>
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-3 h-3" />
        <span className="text-xs font-medium capitalize">{anomaly.type}</span>
        <Badge variant="outline" className="text-xs capitalize ml-auto">
          {anomaly.severity}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{anomaly.description}</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IntegrityChecker({
  className,
  compact = false,
  defaultText = '',
  onCheckComplete,
}: IntegrityCheckerProps) {
  const [text, setText] = useState(defaultText);
  const [selectedChecks, setSelectedChecks] = useState<CheckType[]>(['plagiarism', 'ai-detection', 'consistency']);
  const [result, setResult] = useState<IntegrityCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCheckingRef = useRef(false);

  const toggleCheck = useCallback((type: CheckType) => {
    setSelectedChecks((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }, []);

  const runCheck = useCallback(async () => {
    if (isCheckingRef.current || text.trim().length < 50) return;
    isCheckingRef.current = true;
    setChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/sam/integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-integrity-check',
          data: {
            answerId: `check-${Date.now()}`,
            text,
            studentId: 'current-user',
            examId: 'manual-check',
            options: {
              checks: selectedChecks,
            },
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        onCheckComplete?.(data.data);
      } else {
        throw new Error(data.error?.message || 'Check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run integrity check');
    } finally {
      setChecking(false);
      isCheckingRef.current = false;
    }
  }, [text, selectedChecks, onCheckComplete]);

  const reset = useCallback(() => {
    setResult(null);
    setText('');
    setError(null);
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Integrity Checker</CardTitle>
              <CardDescription>Verify academic integrity of submissions</CardDescription>
            </div>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-1" />
              New Check
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!result ? (
          <>
            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Check</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type the text you want to check for integrity (minimum 50 characters)..."
                className="min-h-[150px] resize-none"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{text.length} characters</span>
                {text.length < 50 && text.length > 0 && (
                  <span className="text-orange-500">Minimum 50 characters required</span>
                )}
              </div>
            </div>

            {/* Check Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Check Types</label>
              <CheckTypeSelector selected={selectedChecks} onToggle={toggleCheck} />
            </div>

            {/* Run Check Button */}
            <Button
              className="w-full"
              onClick={runCheck}
              disabled={checking || text.trim().length < 50 || selectedChecks.length === 0}
            >
              {checking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Run Integrity Check
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <RiskGauge risk={result.overallRisk} score={result.overallScore} />

            {/* Score Breakdown */}
            <div className="flex justify-around py-4 border-y">
              {result.plagiarism && (
                <ScoreRing
                  score={100 - result.plagiarism.overallSimilarity}
                  label="Originality"
                  color={result.plagiarism.overallSimilarity > 30 ? 'stroke-red-500' : 'stroke-green-500'}
                />
              )}
              {result.aiDetection && (
                <ScoreRing
                  score={100 - result.aiDetection.probability}
                  label="Human-Written"
                  color={result.aiDetection.probability > 50 ? 'stroke-purple-500' : 'stroke-green-500'}
                />
              )}
              {result.consistency && (
                <ScoreRing
                  score={result.consistency.overallScore}
                  label="Consistency"
                  color={result.consistency.overallScore < 60 ? 'stroke-orange-500' : 'stroke-green-500'}
                />
              )}
            </div>

            {/* Plagiarism Details */}
            {result.plagiarism && result.plagiarism.matches.length > 0 && !compact && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Copy className="w-4 h-4 text-red-500" />
                  Plagiarism Matches ({result.plagiarism.matches.length})
                </h4>
                <div className="space-y-2">
                  {result.plagiarism.matches.slice(0, 3).map((match) => (
                    <PlagiarismMatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* AI Detection Details */}
            {result.aiDetection && !compact && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-500" />
                  AI Detection Analysis
                </h4>
                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="text-center">
                    <span className="text-2xl font-bold">{result.aiDetection.perplexityScore.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground block">Perplexity</span>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold">{result.aiDetection.burstinessScore.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground block">Burstiness</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.aiDetection.indicators.slice(0, 4).map((indicator, i) => (
                    <AIIndicatorBar key={i} indicator={indicator} />
                  ))}
                </div>
              </div>
            )}

            {/* Consistency Details */}
            {result.consistency && result.consistency.anomalies.length > 0 && !compact && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-orange-500" />
                  Style Anomalies ({result.consistency.anomalies.length})
                </h4>
                <div className="space-y-2">
                  {result.consistency.anomalies.slice(0, 3).map((anomaly, i) => (
                    <ConsistencyAnomalyCard key={i} anomaly={anomaly} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Recommendations
                </h4>
                <div className="space-y-1">
                  {result.recommendations.slice(0, compact ? 2 : 4).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
              <Clock className="w-3 h-3 mr-1" />
              Checked at {new Date(result.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default IntegrityChecker;
