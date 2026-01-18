'use client';

/**
 * CertificationTracker Component
 *
 * Comprehensive certification pathway tracker for professional development.
 * Tracks certification progress, shows skill-to-certification mapping,
 * and provides AI-powered recommendations based on career goals.
 *
 * Features:
 * - Visual certification pathway with progress indicators
 * - Skill gap analysis and readiness scoring
 * - Market value insights (salary impact, demand)
 * - Study planning integration
 * - Practice exam score tracking
 *
 * @module components/sam/certification
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Award,
  Briefcase,
  Target,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  CircleDot,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
  Play,
  Pause,
  BarChart3,
  DollarSign,
  Users,
  Building,
  Star,
  Sparkles,
  BookOpen,
  GraduationCap,
  Shield,
  Cloud,
  Code,
  Database,
  Palette,
  Megaphone,
  X,
  ExternalLink,
  Filter,
  Search,
  ArrowRight,
  Zap,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface LearningPathStep {
  step: number;
  title: string;
  description: string;
  duration: number;
}

interface MarketValue {
  salaryImpact: number;
  demandScore: number;
  jobOpenings: number;
}

interface SkillRequirement {
  skillId: string;
  skillName: string;
  userLevel: number;
  requiredLevel: number;
}

interface CertificationRecommendation {
  id: string;
  name: string;
  provider: string;
  category: string;
  difficulty: string;
  description: string;
  skillsRequired: SkillRequirement[];
  skillsCovered: string[];
  estimatedPrepTime: number;
  examDuration: number;
  examCost: number;
  renewalPeriod?: number;
  marketValue: MarketValue;
  prerequisites: string[];
  matchScore: number;
  readinessScore: number;
  learningPath?: LearningPathStep[];
}

interface CertificationProgress {
  id?: string;
  certificationId: string;
  certificationName: string;
  provider: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED' | 'EXPIRED';
  startDate?: Date | string;
  targetDate?: Date | string;
  completedDate?: Date | string;
  expiryDate?: Date | string;
  studyProgress: number;
  studyHoursLogged: number;
  practiceExamScores: number[];
  nextMilestone?: { title: string; dueDate: Date | string };
}

interface CertificationSummary {
  totalCompleted: number;
  inProgressCount: number;
  recommendationCount: number;
  avgReadinessScore: number;
  suggestedCategory: string;
}

interface CertificationTrackerProps {
  className?: string;
  courseId?: string;
  onCertificationStart?: (certId: string) => void;
  onCertificationComplete?: (certId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<string, { icon: typeof Cloud; color: string; label: string }> = {
  CLOUD: { icon: Cloud, color: 'text-blue-500 bg-blue-500/10', label: 'Cloud' },
  SECURITY: { icon: Shield, color: 'text-red-500 bg-red-500/10', label: 'Security' },
  DATA: { icon: Database, color: 'text-green-500 bg-green-500/10', label: 'Data' },
  DEVELOPMENT: { icon: Code, color: 'text-purple-500 bg-purple-500/10', label: 'Development' },
  PROJECT_MANAGEMENT: { icon: Briefcase, color: 'text-orange-500 bg-orange-500/10', label: 'Project Mgmt' },
  DESIGN: { icon: Palette, color: 'text-pink-500 bg-pink-500/10', label: 'Design' },
  MARKETING: { icon: Megaphone, color: 'text-yellow-500 bg-yellow-500/10', label: 'Marketing' },
  OTHER: { icon: Award, color: 'text-gray-500 bg-gray-500/10', label: 'Other' },
};

const DIFFICULTY_CONFIG: Record<string, { color: string; label: string; bgColor: string }> = {
  beginner: { color: 'text-green-600', label: 'Beginner', bgColor: 'bg-green-500/10' },
  intermediate: { color: 'text-yellow-600', label: 'Intermediate', bgColor: 'bg-yellow-500/10' },
  advanced: { color: 'text-orange-600', label: 'Advanced', bgColor: 'bg-orange-500/10' },
  expert: { color: 'text-red-600', label: 'Expert', bgColor: 'bg-red-500/10' },
};

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  NOT_STARTED: { icon: Circle, color: 'text-muted-foreground', label: 'Not Started' },
  IN_PROGRESS: { icon: CircleDot, color: 'text-blue-500', label: 'In Progress' },
  SCHEDULED: { icon: Calendar, color: 'text-purple-500', label: 'Exam Scheduled' },
  COMPLETED: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  EXPIRED: { icon: AlertCircle, color: 'text-red-500', label: 'Expired' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Circular progress gauge for readiness/match scores
 */
function ScoreGauge({
  score,
  label,
  size = 'md',
  showLabel = true,
}: {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const sizeConfig = {
    sm: { dim: 48, stroke: 3, textSize: 'text-xs' },
    md: { dim: 64, stroke: 4, textSize: 'text-sm' },
    lg: { dim: 80, stroke: 5, textSize: 'text-base' },
  };
  const config = sizeConfig[size];

  const getColor = (s: number) => {
    if (s >= 80) return 'stroke-green-500';
    if (s >= 60) return 'stroke-blue-500';
    if (s >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.dim, height: config.dim }}>
        <svg
          className="transform -rotate-90"
          width={config.dim}
          height={config.dim}
          viewBox="0 0 36 36"
        >
          <circle
            className="stroke-muted"
            strokeWidth={config.stroke}
            fill="none"
            cx="18"
            cy="18"
            r="15.9155"
          />
          <circle
            className={cn(getColor(score))}
            strokeWidth={config.stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${score}, 100`}
            cx="18"
            cy="18"
            r="15.9155"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.textSize)}>{score}%</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">{label}</span>
      )}
    </div>
  );
}

/**
 * Skill gap indicator showing user level vs required level
 */
function SkillGapIndicator({ skill }: { skill: SkillRequirement }) {
  const gap = skill.requiredLevel - skill.userLevel;
  const isReady = gap <= 0;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{skill.skillName}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isReady ? 'bg-green-500' : 'bg-yellow-500'
            )}
            style={{ width: `${Math.min((skill.userLevel / skill.requiredLevel) * 100, 100)}%` }}
          />
        </div>
        <span className={cn('text-xs font-medium', isReady ? 'text-green-500' : 'text-yellow-500')}>
          {skill.userLevel}/{skill.requiredLevel}
        </span>
      </div>
    </div>
  );
}

/**
 * Market value insights display
 */
function MarketValueCard({ marketValue }: { marketValue: MarketValue }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold text-green-600">+{marketValue.salaryImpact}%</div>
              <div className="text-xs text-muted-foreground">Salary Impact</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Average salary increase after certification</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-bold text-blue-600">{marketValue.demandScore}</div>
              <div className="text-xs text-muted-foreground">Demand Score</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Market demand score (0-100)</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="p-3 rounded-lg bg-purple-500/10 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <div className="text-lg font-bold text-purple-600">
                {(marketValue.jobOpenings / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-muted-foreground">Job Openings</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>Estimated job openings requiring this certification</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

/**
 * Learning path timeline visualization
 */
function LearningPathTimeline({ steps, currentStep = 0 }: { steps: LearningPathStep[]; currentStep?: number }) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step.step} className="flex gap-4 pb-4 last:pb-0">
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                  isComplete
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-background border-muted text-muted-foreground'
                )}
              >
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.step}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[24px]',
                    isComplete ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pt-1">
              <div className="flex items-center justify-between">
                <h4 className={cn('font-medium', isCurrent && 'text-blue-600')}>{step.title}</h4>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {step.duration}h
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Certification recommendation card
 */
function CertificationCard({
  cert,
  onStart,
  onViewDetails,
}: {
  cert: CertificationRecommendation;
  onStart?: () => void;
  onViewDetails?: () => void;
}) {
  const categoryConfig = CATEGORY_CONFIG[cert.category] || CATEGORY_CONFIG.OTHER;
  const difficultyConfig = DIFFICULTY_CONFIG[cert.difficulty] || DIFFICULTY_CONFIG.intermediate;
  const CategoryIcon = categoryConfig.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Category icon */}
          <div className={cn('p-3 rounded-xl', categoryConfig.color)}>
            <CategoryIcon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold line-clamp-1">{cert.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="w-3.5 h-3.5" />
                  <span>{cert.provider}</span>
                </div>
              </div>
              <Badge className={cn('shrink-0', difficultyConfig.bgColor, difficultyConfig.color)}>
                {difficultyConfig.label}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{cert.description}</p>

            {/* Scores */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <ScoreGauge score={cert.matchScore} label="Match" size="sm" showLabel={false} />
                <div className="text-xs">
                  <div className="font-medium">{cert.matchScore}%</div>
                  <div className="text-muted-foreground">Match</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ScoreGauge score={cert.readinessScore} label="Ready" size="sm" showLabel={false} />
                <div className="text-xs">
                  <div className="font-medium">{cert.readinessScore}%</div>
                  <div className="text-muted-foreground">Ready</div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {cert.estimatedPrepTime}h prep
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                {cert.examDuration} min exam
              </Badge>
              <Badge variant="outline" className="text-xs">
                <DollarSign className="w-3 h-3 mr-1" />
                ${cert.examCost}
              </Badge>
              {cert.renewalPeriod && (
                <Badge variant="outline" className="text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {cert.renewalPeriod}yr renewal
                </Badge>
              )}
            </div>

            {/* Skills covered */}
            <div className="flex flex-wrap gap-1 mb-3">
              {cert.skillsCovered.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                >
                  {skill}
                </span>
              ))}
              {cert.skillsCovered.length > 4 && (
                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                  +{cert.skillsCovered.length - 4} more
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" onClick={onStart}>
                <Plus className="w-4 h-4 mr-1" />
                Start Tracking
              </Button>
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * In-progress certification card with progress tracking
 */
function ProgressCard({
  progress,
  cert,
  onUpdateProgress,
  onLogHours,
  onAddScore,
}: {
  progress: CertificationProgress;
  cert?: CertificationRecommendation;
  onUpdateProgress?: (value: number) => void;
  onLogHours?: (hours: number) => void;
  onAddScore?: (score: number) => void;
}) {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [logValue, setLogValue] = useState('');

  const statusConfig = STATUS_CONFIG[progress.status] || STATUS_CONFIG.NOT_STARTED;
  const StatusIcon = statusConfig.icon;

  const avgScore =
    progress.practiceExamScores.length > 0
      ? Math.round(
          progress.practiceExamScores.reduce((a, b) => a + b, 0) / progress.practiceExamScores.length
        )
      : null;

  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold">{progress.certificationName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="w-3.5 h-3.5" />
                <span>{progress.provider}</span>
                <span>•</span>
                <StatusIcon className={cn('w-3.5 h-3.5', statusConfig.color)} />
                <span className={statusConfig.color}>{statusConfig.label}</span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogDialog(true)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Log Study Hours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowScoreDialog(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Add Practice Score
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Exam
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Study Progress</span>
              <span className="font-medium">{progress.studyProgress}%</span>
            </div>
            <Progress value={progress.studyProgress} className="h-2" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{progress.studyHoursLogged}</div>
              <div className="text-xs text-muted-foreground">Hours Logged</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{progress.practiceExamScores.length}</div>
              <div className="text-xs text-muted-foreground">Practice Tests</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <div className="text-lg font-bold">{avgScore ?? '-'}</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>

          {/* Target date */}
          {progress.targetDate && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>
                Target:{' '}
                {new Date(progress.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Practice exam scores chart */}
          {progress.practiceExamScores.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm font-medium mb-2">Practice Exam Scores</div>
              <div className="flex items-end gap-1 h-12">
                {progress.practiceExamScores.slice(-10).map((score, idx) => (
                  <TooltipProvider key={idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'flex-1 rounded-t transition-all',
                            score >= 80
                              ? 'bg-green-500'
                              : score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          )}
                          style={{ height: `${Math.max(score, 10)}%` }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>Score: {score}%</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>First</span>
                <span>Latest</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Hours Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Study Hours</DialogTitle>
            <DialogDescription>
              Track your study time for {progress.certificationName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="hours">Hours studied</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g., 2.5"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onLogHours?.(parseFloat(logValue));
                setShowLogDialog(false);
                setLogValue('');
              }}
              disabled={!logValue || parseFloat(logValue) <= 0}
            >
              Log Hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Score Dialog */}
      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Practice Exam Score</DialogTitle>
            <DialogDescription>Record your practice exam score (0-100)</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="score">Score (%)</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              placeholder="e.g., 75"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScoreDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onAddScore?.(parseInt(logValue));
                setShowScoreDialog(false);
                setLogValue('');
              }}
              disabled={!logValue || parseInt(logValue) < 0 || parseInt(logValue) > 100}
            >
              Add Score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Certification detail sheet
 */
function CertificationDetailSheet({
  cert,
  open,
  onOpenChange,
  onStart,
}: {
  cert: CertificationRecommendation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart?: () => void;
}) {
  if (!cert) return null;

  const categoryConfig = CATEGORY_CONFIG[cert.category] || CATEGORY_CONFIG.OTHER;
  const CategoryIcon = categoryConfig.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-xl', categoryConfig.color)}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div>
              <SheetTitle>{cert.name}</SheetTitle>
              <SheetDescription>{cert.provider}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          {/* Scores */}
          <div className="flex justify-center gap-8">
            <ScoreGauge score={cert.matchScore} label="Match Score" size="lg" />
            <ScoreGauge score={cert.readinessScore} label="Readiness" size="lg" />
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">About This Certification</h4>
            <p className="text-sm text-muted-foreground">{cert.description}</p>
          </div>

          {/* Market Value */}
          <div>
            <h4 className="text-sm font-medium mb-3">Market Value</h4>
            <MarketValueCard marketValue={cert.marketValue} />
          </div>

          {/* Skills Covered */}
          <div>
            <h4 className="text-sm font-medium mb-2">Skills You&apos;ll Gain</h4>
            <div className="flex flex-wrap gap-2">
              {cert.skillsCovered.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skill Gap Analysis */}
          {cert.skillsRequired.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Skill Gap Analysis</h4>
              <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                {cert.skillsRequired.map((skill) => (
                  <SkillGapIndicator key={skill.skillId} skill={skill} />
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {cert.prerequisites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
              <ul className="space-y-1">
                {cert.prerequisites.map((prereq) => (
                  <li key={prereq} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRight className="w-4 h-4" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Path */}
          {cert.learningPath && cert.learningPath.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Suggested Learning Path</h4>
              <LearningPathTimeline steps={cert.learningPath} />
            </div>
          )}

          {/* Exam Details */}
          <div>
            <h4 className="text-sm font-medium mb-2">Exam Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  Prep Time
                </div>
                <div className="font-semibold">{cert.estimatedPrepTime} hours</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Timer className="w-4 h-4" />
                  Exam Duration
                </div>
                <div className="font-semibold">{cert.examDuration} minutes</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="w-4 h-4" />
                  Exam Cost
                </div>
                <div className="font-semibold">${cert.examCost}</div>
              </div>
              {cert.renewalPeriod && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <RefreshCw className="w-4 h-4" />
                    Renewal
                  </div>
                  <div className="font-semibold">Every {cert.renewalPeriod} years</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onStart}>
            <Plus className="w-4 h-4 mr-2" />
            Start Tracking
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CertificationTracker({
  className,
  courseId,
  onCertificationStart,
  onCertificationComplete,
}: CertificationTrackerProps) {
  const { toast } = useToast();

  // State
  const [summary, setSummary] = useState<CertificationSummary | null>(null);
  const [recommendations, setRecommendations] = useState<CertificationRecommendation[]>([]);
  const [inProgress, setInProgress] = useState<CertificationProgress[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail view
  const [selectedCert, setSelectedCert] = useState<CertificationRecommendation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Ref to prevent double fetching
  const isLoadingRef = useRef(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        includeInProgress: 'true',
        limit: '50',
      });

      if (categoryFilter !== 'all') {
        params.set('category', categoryFilter);
      }
      if (difficultyFilter !== 'all') {
        params.set('difficulty', difficultyFilter);
      }

      const res = await fetch(`/api/sam/certification-pathways?${params.toString()}`);

      if (!res.ok) {
        throw new Error('Failed to fetch certification data');
      }

      const data = await res.json();

      if (data.success) {
        setSummary(data.data.summary);
        setRecommendations(data.data.recommendations || []);
        setInProgress(data.data.inProgress || []);
        setCompletedIds(data.data.completedIds || []);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch certifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certifications');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [categoryFilter, difficultyFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Start tracking a certification
  const handleStartTracking = async (cert: CertificationRecommendation) => {
    try {
      const res = await fetch('/api/sam/certification-pathways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificationId: cert.id,
          certificationName: cert.name,
          provider: cert.provider,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Certification Tracking Started',
          description: `Now tracking ${cert.name}`,
        });
        setDetailOpen(false);
        onCertificationStart?.(cert.id);
        fetchData();
      } else {
        throw new Error(data.error?.message || 'Failed to start tracking');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to start tracking',
        variant: 'destructive',
      });
    }
  };

  // Update progress
  const handleUpdateProgress = async (certificationId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/sam/certification-pathways', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationId, ...updates }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: 'Progress Updated',
          description: 'Your certification progress has been updated',
        });
        fetchData();
      } else {
        throw new Error(data.error?.message || 'Failed to update progress');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update progress',
        variant: 'destructive',
      });
    }
  };

  // Filter recommendations
  const filteredRecommendations = recommendations.filter((cert) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cert.name.toLowerCase().includes(query) ||
        cert.provider.toLowerCase().includes(query) ||
        cert.skillsCovered.some((s) => s.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading certifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Certification Pathways</CardTitle>
                <CardDescription>Track your professional certifications and career goals</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 text-center">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{summary.totalCompleted}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                <CircleDot className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{summary.inProgressCount}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/10 text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-600">{summary.recommendationCount}</div>
                <div className="text-sm text-muted-foreground">Recommended</div>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 text-center">
                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-600">{summary.avgReadinessScore}%</div>
                <div className="text-sm text-muted-foreground">Avg Readiness</div>
              </div>
            </div>
          )}

          <Tabs defaultValue="in-progress" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="in-progress" className="flex items-center gap-2">
                <CircleDot className="w-4 h-4" />
                In Progress ({inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Explore
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed ({completedIds.length})
              </TabsTrigger>
            </TabsList>

            {/* In Progress Tab */}
            <TabsContent value="in-progress" className="mt-4">
              {inProgress.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-muted/30">
                  <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Active Certifications</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking a certification to see your progress here
                  </p>
                  <Button
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]');
                      const exploreTab = tabsList?.querySelector('[value="recommendations"]') as HTMLElement;
                      exploreTab?.click();
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Explore Certifications
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {inProgress.map((progress) => (
                    <ProgressCard
                      key={progress.certificationId}
                      progress={progress}
                      onLogHours={(hours) =>
                        handleUpdateProgress(progress.certificationId, {
                          studyHoursLogged: progress.studyHoursLogged + hours,
                        })
                      }
                      onAddScore={(score) =>
                        handleUpdateProgress(progress.certificationId, {
                          practiceExamScore: score,
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="mt-4 space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search certifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-[160px]">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Certification list */}
              <div className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No certifications match your filters
                  </div>
                ) : (
                  filteredRecommendations.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      cert={cert}
                      onStart={() => handleStartTracking(cert)}
                      onViewDetails={() => {
                        setSelectedCert(cert);
                        setDetailOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Completed Tab */}
            <TabsContent value="completed" className="mt-4">
              {completedIds.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl bg-muted/30">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Completed Certifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete a certification to see it here
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {completedIds.map((certId) => {
                    const cert = recommendations.find((r) => r.id === certId);
                    if (!cert) return null;

                    return (
                      <Card key={certId} className="p-4 border-l-4 border-l-green-500">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.provider}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <CertificationDetailSheet
        cert={selectedCert}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStart={() => selectedCert && handleStartTracking(selectedCert)}
      />
    </>
  );
}

export default CertificationTracker;
