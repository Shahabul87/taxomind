'use client';

/**
 * CompetencyDashboard Component
 *
 * Comprehensive skills framework management and career path visualization.
 *
 * Features:
 * - Competency framework visualization
 * - Skill gap analysis
 * - Career path recommendations
 * - Portfolio management
 * - Job role matching
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronRight,
  ChevronDown,
  Briefcase,
  GraduationCap,
  Star,
  Shield,
  Zap,
  Trophy,
  BarChart3,
  PieChart,
  Layers,
  GitBranch,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Building,
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

type ProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT' | 'MASTER';
type CareerLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  progress: number;
  trend: 'improving' | 'stable' | 'declining';
  evidenceCount: number;
  lastAssessed: string;
  subCompetencies?: SubCompetency[];
}

interface SubCompetency {
  id: string;
  name: string;
  proficiency: number;
  required: boolean;
}

interface SkillGap {
  competencyId: string;
  competencyName: string;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  gapSeverity: 'critical' | 'high' | 'medium' | 'low';
  recommendedActions: string[];
  estimatedTimeToClose: string;
}

interface CareerPath {
  id: string;
  title: string;
  level: CareerLevel;
  matchScore: number;
  requiredCompetencies: string[];
  gapCount: number;
  estimatedTimeToReach: string;
  demand: 'high' | 'medium' | 'low';
  salaryRange?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  type: 'project' | 'certification' | 'achievement' | 'experience';
  competencies: string[];
  date: string;
  verified: boolean;
  impactScore?: number;
}

interface CompetencyAssessment {
  overallScore: number;
  levelDistribution: Record<ProficiencyLevel, number>;
  topCompetencies: Competency[];
  competencyGaps: SkillGap[];
  careerPaths: CareerPath[];
  portfolio: PortfolioItem[];
  recommendations: string[];
  lastUpdated: string;
}

interface CompetencyDashboardProps {
  className?: string;
  compact?: boolean;
  frameworkId?: string;
  onAssessmentComplete?: (assessment: CompetencyAssessment) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROFICIENCY_CONFIG: Record<ProficiencyLevel, { label: string; color: string; value: number }> = {
  NOVICE: { label: 'Novice', color: 'bg-gray-400', value: 0 },
  BEGINNER: { label: 'Beginner', color: 'bg-blue-400', value: 20 },
  COMPETENT: { label: 'Competent', color: 'bg-green-400', value: 40 },
  PROFICIENT: { label: 'Proficient', color: 'bg-yellow-400', value: 60 },
  EXPERT: { label: 'Expert', color: 'bg-orange-400', value: 80 },
  MASTER: { label: 'Master', color: 'bg-purple-400', value: 100 },
};

const CAREER_LEVEL_CONFIG = {
  entry: { label: 'Entry Level', icon: GraduationCap, color: 'text-blue-500' },
  mid: { label: 'Mid Level', icon: Briefcase, color: 'text-green-500' },
  senior: { label: 'Senior', icon: Star, color: 'text-yellow-500' },
  lead: { label: 'Lead', icon: Shield, color: 'text-orange-500' },
  executive: { label: 'Executive', icon: Trophy, color: 'text-purple-500' },
};

const GAP_SEVERITY_COLORS = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-600',
  high: 'bg-orange-500/10 border-orange-500/30 text-orange-600',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600',
  low: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OverallScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradient = (s: number) => {
    if (s >= 80) return 'from-green-500 to-emerald-500';
    if (s >= 60) return 'from-blue-500 to-cyan-500';
    if (s >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className={cn('stop-color-current', getGradient(score).split(' ')[0].replace('from-', 'text-'))} />
            <stop offset="100%" className={cn('stop-color-current', getGradient(score).split(' ')[1].replace('to-', 'text-'))} />
          </linearGradient>
        </defs>
        <circle
          className="stroke-muted"
          strokeWidth="8"
          fill="none"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          r="45"
          cx="50"
          cy="50"
          className="transition-all duration-1000"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">Overall Score</span>
      </div>
    </div>
  );
}

function LevelDistributionChart({ distribution }: { distribution: Record<ProficiencyLevel, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const levels = Object.entries(PROFICIENCY_CONFIG) as [ProficiencyLevel, typeof PROFICIENCY_CONFIG.NOVICE][];

  return (
    <div className="space-y-2">
      {levels.map(([level, config]) => {
        const count = distribution[level] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={level} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 truncate">{config.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', config.color)}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function CompetencyCard({
  competency,
  expanded,
  onToggle,
}: {
  competency: Competency;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const currentConfig = PROFICIENCY_CONFIG[competency.currentLevel];
  const targetConfig = PROFICIENCY_CONFIG[competency.targetLevel];
  const TrendIcon = competency.trend === 'improving' ? TrendingUp :
    competency.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = competency.trend === 'improving' ? 'text-green-500' :
    competency.trend === 'declining' ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="p-4 rounded-xl bg-card border hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Award className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{competency.name}</h4>
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
          </div>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            {competency.description}
          </p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', currentConfig.color)} />
                {currentConfig.label}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="flex items-center gap-1">
                {targetConfig.label}
                <span className={cn('w-2 h-2 rounded-full', targetConfig.color)} />
              </span>
            </div>
            <Progress value={competency.progress} className="h-2" />
          </div>

          {/* Sub-competencies (when expanded) */}
          {expanded && competency.subCompetencies && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {competency.subCompetencies.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <span className="text-xs flex-1 truncate">{sub.name}</span>
                  <Progress value={sub.proficiency} className="w-20 h-1.5" />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {sub.proficiency}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary" className="text-xs">
            {competency.evidenceCount} evidence
          </Badge>
          {competency.subCompetencies && (
            <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 px-2">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillGapCard({ gap }: { gap: SkillGap }) {
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      GAP_SEVERITY_COLORS[gap.gapSeverity]
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{gap.competencyName}</span>
        <Badge variant="outline" className="text-xs capitalize">
          {gap.gapSeverity}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span>{PROFICIENCY_CONFIG[gap.currentLevel].label}</span>
        <ArrowRight className="w-3 h-3" />
        <span>{PROFICIENCY_CONFIG[gap.requiredLevel].label}</span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {gap.estimatedTimeToClose}
        </span>
      </div>

      {gap.recommendedActions.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Next step:</span> {gap.recommendedActions[0]}
        </div>
      )}
    </div>
  );
}

function CareerPathCard({ path }: { path: CareerPath }) {
  const config = CAREER_LEVEL_CONFIG[path.level];
  const Icon = config.icon;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg bg-background', config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{path.title}</h4>
            {path.demand === 'high' && (
              <Badge className="bg-green-500/10 text-green-600 text-xs">High demand</Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {path.matchScore}% match
            </span>
            {path.gapCount > 0 && (
              <span className="flex items-center gap-1 text-orange-500">
                <AlertCircle className="w-3 h-3" />
                {path.gapCount} gaps
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {path.estimatedTimeToReach}
            </span>
          </div>

          {path.salaryRange && (
            <span className="text-xs text-muted-foreground">
              💰 {path.salaryRange}
            </span>
          )}
        </div>

        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-1" />
          Explore
        </Button>
      </div>
    </div>
  );
}

function PortfolioItemCard({ item }: { item: PortfolioItem }) {
  const typeIcons = {
    project: Layers,
    certification: Award,
    achievement: Trophy,
    experience: Briefcase,
  };
  const Icon = typeIcons[item.type];

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className="p-2 rounded-lg bg-background">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{item.title}</span>
          {item.verified && (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">{item.type}</span>
          <span>•</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
      </div>
      {item.impactScore && (
        <Badge variant="secondary" className="text-xs">
          {item.impactScore}% impact
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompetencyDashboard({
  className,
  compact = false,
  frameworkId,
  onAssessmentComplete,
}: CompetencyDashboardProps) {
  const [assessment, setAssessment] = useState<CompetencyAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchAssessment = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (frameworkId) params.append('frameworkId', frameworkId);

      const res = await fetch(`/api/sam/competency?action=get-assessment&${params}`);

      if (!res.ok) {
        throw new Error('Failed to fetch competency assessment');
      }

      const data = await res.json();
      if (data.success) {
        setAssessment(data.data.assessment);
        onAssessmentComplete?.(data.data.assessment);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [frameworkId, onAssessmentComplete]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading competency data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAssessment}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 mb-4">
            <Award className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1">No Competency Data</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
            Complete assessments to build your competency profile.
          </p>
          <Button>
            <Target className="w-4 h-4 mr-2" />
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Competency Dashboard</CardTitle>
              <CardDescription>Skills framework &amp; career path analysis</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAssessment}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Section */}
        <div className="flex items-center gap-6">
          <OverallScoreRing score={assessment.overallScore} />
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Level Distribution
            </h4>
            <LevelDistributionChart distribution={assessment.levelDistribution} />
          </div>
        </div>

        {/* Top Competencies */}
        {assessment.topCompetencies.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Top Competencies
              <Badge variant="secondary" className="text-xs">
                {assessment.topCompetencies.length}
              </Badge>
            </h4>
            <div className="space-y-2">
              {assessment.topCompetencies.slice(0, compact ? 2 : 4).map((comp) => (
                <CompetencyCard
                  key={comp.id}
                  competency={comp}
                  expanded={expandedCompetency === comp.id}
                  onToggle={() => setExpandedCompetency(
                    expandedCompetency === comp.id ? null : comp.id
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Skill Gaps */}
        {!compact && assessment.competencyGaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Skill Gaps
              <Badge variant="secondary" className="text-xs">
                {assessment.competencyGaps.length}
              </Badge>
            </h4>
            <div className="space-y-2">
              {assessment.competencyGaps.slice(0, 3).map((gap) => (
                <SkillGapCard key={gap.competencyId} gap={gap} />
              ))}
            </div>
          </div>
        )}

        {/* Career Paths */}
        {assessment.careerPaths.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              Recommended Career Paths
            </h4>
            <div className="space-y-2">
              {assessment.careerPaths.slice(0, compact ? 1 : 2).map((path) => (
                <CareerPathCard key={path.id} path={path} />
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {!compact && assessment.portfolio.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Portfolio Highlights
            </h4>
            <div className="space-y-2">
              {assessment.portfolio.slice(0, 3).map((item) => (
                <PortfolioItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {assessment.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Recommendations
            </h4>
            <div className="space-y-1">
              {assessment.recommendations.slice(0, compact ? 2 : 4).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                  <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompetencyDashboard;
