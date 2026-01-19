'use client';

/**
 * SkillBuildTracker Dashboard Component
 *
 * A comprehensive skill development tracking interface featuring:
 * - Skill profile overview with animated stats
 * - Interactive skills grid with multi-dimensional scoring
 * - Decay alert panel with urgency indicators
 * - Learning roadmap timeline viewer
 * - Practice session logging modal
 *
 * Design: Enterprise Professional with Light/Dark Mode Support
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Flame,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Play,
  Brain,
  Zap,
  Shield,
  BookOpen,
  Code,
  Briefcase,
  Users,
  Award,
  Check,
  Timer,
  Activity,
  CircleDot,
  Rocket,
  Layers,
  GraduationCap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

type SkillCategory =
  | 'TECHNICAL'
  | 'SOFT'
  | 'DOMAIN'
  | 'TOOL'
  | 'METHODOLOGY'
  | 'CERTIFICATION'
  | 'LEADERSHIP';

type DecayRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SkillDimensions {
  mastery: number;
  retention: number;
  application: number;
  confidence: number;
  calibration: number;
}

interface SkillProfile {
  id: string;
  skillId: string;
  skillName: string;
  category: SkillCategory;
  dimensions: SkillDimensions;
  compositeScore: number;
  proficiencyLevel: ProficiencyLevel;
  decayRisk: DecayRisk;
  daysUntilReview: number;
  streak: number;
  velocityTrend: 'ACCELERATING' | 'STEADY' | 'SLOWING' | 'STAGNANT' | 'DECLINING';
  lastPracticedAt?: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  targetDate?: Date;
  skills: Array<{ name: string; targetLevel: ProficiencyLevel }>;
}

interface Roadmap {
  id: string;
  title: string;
  completionPercentage: number;
  totalHours: number;
  remainingHours: number;
  targetDate?: Date;
  milestones: Milestone[];
}

interface SkillBuildTrackerProps {
  profiles?: SkillProfile[];
  roadmap?: Roadmap;
  totalSkills?: number;
  averageScore?: number;
  currentStreak?: number;
  atRiskCount?: number;
  onRecordPractice?: (data: {
    skillId: string;
    duration: number;
    score?: number;
    isAssessment: boolean;
    notes?: string;
  }) => Promise<void>;
  onStartReview?: (skillId: string) => void;
  onCompleteReview?: (data: {
    skillId: string;
    confidence: number;
    quality: 'EASY' | 'GOOD' | 'HARD' | 'AGAIN';
    notes?: string;
  }) => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Light/Dark mode compatible color configurations
const LEVEL_CONFIG: Record<ProficiencyLevel, { label: string; color: string; bgColor: string; gradient: string; threshold: number }> = {
  NOVICE: { label: 'Novice', color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', gradient: 'from-slate-400 to-slate-500', threshold: 0 },
  BEGINNER: { label: 'Beginner', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', gradient: 'from-blue-500 to-blue-600', threshold: 15 },
  COMPETENT: { label: 'Competent', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/30', gradient: 'from-cyan-500 to-cyan-600', threshold: 35 },
  PROFICIENT: { label: 'Proficient', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', gradient: 'from-emerald-500 to-emerald-600', threshold: 55 },
  ADVANCED: { label: 'Advanced', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-900/30', gradient: 'from-violet-500 to-violet-600', threshold: 70 },
  EXPERT: { label: 'Expert', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', gradient: 'from-amber-500 to-amber-600', threshold: 85 },
  STRATEGIST: { label: 'Strategist', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/30', gradient: 'from-rose-500 to-fuchsia-500', threshold: 95 },
};

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; icon: typeof Code; color: string }> = {
  TECHNICAL: { label: 'Technical', icon: Code, color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30' },
  SOFT: { label: 'Soft Skills', icon: Users, color: 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-500/30' },
  DOMAIN: { label: 'Domain', icon: Brain, color: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30' },
  TOOL: { label: 'Tool', icon: Zap, color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
  METHODOLOGY: { label: 'Methodology', icon: Target, color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
  CERTIFICATION: { label: 'Certification', icon: Award, color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
  LEADERSHIP: { label: 'Leadership', icon: Briefcase, color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30' },
};

const DECAY_CONFIG: Record<DecayRisk, { color: string; bgColor: string; borderColor: string }> = {
  LOW: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', borderColor: 'border-emerald-200 dark:border-emerald-500/20' },
  MEDIUM: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', borderColor: 'border-amber-200 dark:border-amber-500/20' },
  HIGH: { color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-500/10', borderColor: 'border-orange-200 dark:border-orange-500/20' },
  CRITICAL: { color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10', borderColor: 'border-rose-200 dark:border-rose-500/20' },
};

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROFILES: SkillProfile[] = [
  {
    id: '1',
    skillId: 'react',
    skillName: 'React.js',
    category: 'TECHNICAL',
    dimensions: { mastery: 78, retention: 82, application: 75, confidence: 80, calibration: 72 },
    compositeScore: 77.5,
    proficiencyLevel: 'ADVANCED',
    decayRisk: 'LOW',
    daysUntilReview: 12,
    streak: 15,
    velocityTrend: 'ACCELERATING',
    lastPracticedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    skillId: 'typescript',
    skillName: 'TypeScript',
    category: 'TECHNICAL',
    dimensions: { mastery: 85, retention: 78, application: 82, confidence: 88, calibration: 80 },
    compositeScore: 82.6,
    proficiencyLevel: 'EXPERT',
    decayRisk: 'LOW',
    daysUntilReview: 18,
    streak: 22,
    velocityTrend: 'STEADY',
    lastPracticedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    skillId: 'communication',
    skillName: 'Communication',
    category: 'SOFT',
    dimensions: { mastery: 65, retention: 58, application: 70, confidence: 72, calibration: 68 },
    compositeScore: 65.2,
    proficiencyLevel: 'PROFICIENT',
    decayRisk: 'HIGH',
    daysUntilReview: 2,
    streak: 3,
    velocityTrend: 'SLOWING',
    lastPracticedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    skillId: 'system-design',
    skillName: 'System Design',
    category: 'DOMAIN',
    dimensions: { mastery: 52, retention: 48, application: 45, confidence: 55, calibration: 50 },
    compositeScore: 49.8,
    proficiencyLevel: 'COMPETENT',
    decayRisk: 'CRITICAL',
    daysUntilReview: 0,
    streak: 0,
    velocityTrend: 'DECLINING',
    lastPracticedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    skillId: 'docker',
    skillName: 'Docker',
    category: 'TOOL',
    dimensions: { mastery: 42, retention: 38, application: 35, confidence: 45, calibration: 40 },
    compositeScore: 39.8,
    proficiencyLevel: 'COMPETENT',
    decayRisk: 'MEDIUM',
    daysUntilReview: 5,
    streak: 7,
    velocityTrend: 'STEADY',
    lastPracticedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    skillId: 'agile',
    skillName: 'Agile Methodology',
    category: 'METHODOLOGY',
    dimensions: { mastery: 72, retention: 68, application: 75, confidence: 78, calibration: 70 },
    compositeScore: 72.0,
    proficiencyLevel: 'ADVANCED',
    decayRisk: 'LOW',
    daysUntilReview: 10,
    streak: 12,
    velocityTrend: 'ACCELERATING',
    lastPracticedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_ROADMAP: Roadmap = {
  id: 'rm-1',
  title: 'Full-Stack Developer Path',
  completionPercentage: 45,
  totalHours: 120,
  remainingHours: 66,
  targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  milestones: [
    {
      id: 'm1',
      title: 'Frontend Foundations',
      description: 'Master core frontend technologies',
      status: 'COMPLETED',
      skills: [
        { name: 'React.js', targetLevel: 'ADVANCED' },
        { name: 'TypeScript', targetLevel: 'PROFICIENT' },
      ],
    },
    {
      id: 'm2',
      title: 'Advanced Frontend',
      description: 'State management and performance',
      status: 'IN_PROGRESS',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      skills: [
        { name: 'Redux', targetLevel: 'ADVANCED' },
        { name: 'Testing', targetLevel: 'PROFICIENT' },
      ],
    },
    {
      id: 'm3',
      title: 'Backend Development',
      description: 'Server-side programming mastery',
      status: 'AVAILABLE',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      skills: [
        { name: 'Node.js', targetLevel: 'ADVANCED' },
        { name: 'PostgreSQL', targetLevel: 'PROFICIENT' },
      ],
    },
    {
      id: 'm4',
      title: 'DevOps & Deployment',
      description: 'CI/CD and cloud infrastructure',
      status: 'LOCKED',
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      skills: [
        { name: 'Docker', targetLevel: 'ADVANCED' },
        { name: 'AWS', targetLevel: 'PROFICIENT' },
      ],
    },
    {
      id: 'm5',
      title: 'System Design',
      description: 'Architecture and scalability',
      status: 'LOCKED',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      skills: [
        { name: 'System Design', targetLevel: 'EXPERT' },
        { name: 'Microservices', targetLevel: 'ADVANCED' },
      ],
    },
  ],
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Animated circular progress ring with light/dark mode support
 */
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress)}
        </motion.span>
        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Score</span>
      </div>
    </div>
  );
}

/**
 * Multi-dimensional skill radar mini visualization with light/dark mode support
 */
function DimensionBars({ dimensions }: { dimensions: SkillDimensions }) {
  const bars = [
    { key: 'mastery', label: 'M', value: dimensions.mastery, color: 'bg-cyan-500', tooltip: 'Mastery' },
    { key: 'retention', label: 'R', value: dimensions.retention, color: 'bg-emerald-500', tooltip: 'Retention' },
    { key: 'application', label: 'A', value: dimensions.application, color: 'bg-violet-500', tooltip: 'Application' },
  ];

  return (
    <div className="flex gap-1.5 items-end h-8">
      {bars.map((bar, index) => (
        <div key={bar.key} className="flex flex-col items-center gap-0.5 group" title={bar.tooltip}>
          <motion.div
            className={cn('w-2.5 rounded-t shadow-sm', bar.color)}
            initial={{ height: 0 }}
            animate={{ height: `${(bar.value / 100) * 24}px` }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          />
          <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Skill Profile Overview Card with enterprise light/dark mode design
 */
function SkillOverviewCard({
  totalSkills,
  averageScore,
  currentStreak,
  atRiskCount,
  levelDistribution,
}: {
  totalSkills: number;
  averageScore: number;
  currentStreak: number;
  atRiskCount: number;
  levelDistribution: Record<ProficiencyLevel, number>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 shadow-sm">
        {/* Subtle decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/30 via-transparent to-emerald-50/30 dark:from-cyan-500/5 dark:via-transparent dark:to-emerald-500/5" />

        <CardHeader className="relative pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-500/20 dark:to-emerald-500/20 border border-cyan-200 dark:border-cyan-500/20 shadow-sm">
              <GraduationCap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Skill Profile</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your learning journey overview</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progress Ring */}
            <div className="flex flex-col items-center justify-center py-2">
              <ProgressRing progress={averageScore} />
              <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">Average Mastery</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors hover:border-slate-200 dark:hover:border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-500/20">
                    <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Skills</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalSkills}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors hover:border-slate-200 dark:hover:border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20">
                    <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Streak</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentStreak}<span className="text-base font-medium text-slate-400">d</span></p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors hover:border-slate-200 dark:hover:border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Velocity</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+12%</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 transition-colors hover:border-slate-200 dark:hover:border-slate-600/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">At Risk</span>
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atRiskCount}</p>
              </div>
            </div>

            {/* Level Distribution */}
            <div className="space-y-2.5 py-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Level Distribution</p>
              {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                const count = levelDistribution[level as ProficiencyLevel] || 0;
                const percentage = totalSkills > 0 ? (count / totalSkills) * 100 : 0;

                return (
                  <div key={level} className="flex items-center gap-2">
                    <span className={cn('text-xs font-medium w-20 truncate', config.color)}>{config.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full bg-gradient-to-r', config.gradient)}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Individual Skill Card with enterprise light/dark mode design
 */
function SkillCard({
  profile,
  onPractice,
  index,
}: {
  profile: SkillProfile;
  onPractice: (skillId: string) => void;
  index: number;
}) {
  const levelConfig = LEVEL_CONFIG[profile.proficiencyLevel];
  const categoryConfig = CATEGORY_CONFIG[profile.category];
  const decayConfig = DECAY_CONFIG[profile.decayRisk];
  const CategoryIcon = categoryConfig.icon;

  const velocityIcon = {
    ACCELERATING: <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    STEADY: <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />,
    SLOWING: <TrendingDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    STAGNANT: <CircleDot className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />,
    DECLINING: <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className={cn(
        'relative overflow-hidden border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 transition-all duration-300 shadow-sm',
        'hover:border-slate-300 dark:hover:border-slate-600/50 hover:shadow-md',
        profile.decayRisk === 'CRITICAL' && 'border-rose-300 dark:border-rose-500/30 ring-1 ring-rose-100 dark:ring-rose-500/10',
        profile.decayRisk === 'HIGH' && 'border-orange-300 dark:border-orange-500/30 ring-1 ring-orange-100 dark:ring-orange-500/10'
      )}>
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-50/50 dark:from-cyan-500/5 via-transparent to-emerald-50/50 dark:to-emerald-500/5" />

        <CardContent className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{profile.skillName}</h3>
                {profile.decayRisk !== 'LOW' && (
                  <motion.div
                    animate={profile.decayRisk === 'CRITICAL' ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <AlertTriangle className={cn('w-4 h-4 flex-shrink-0', decayConfig.color)} />
                  </motion.div>
                )}
              </div>
              <Badge variant="outline" className={cn('text-[10px] border font-medium', categoryConfig.color)}>
                <CategoryIcon className="w-3 h-3 mr-1" />
                {categoryConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {velocityIcon[profile.velocityTrend]}
            </div>
          </div>

          {/* Score & Level */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {Math.round(profile.compositeScore)}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">/100</span>
              </div>
              <Badge className={cn('mt-1 bg-gradient-to-r text-white text-[10px] font-medium shadow-sm', levelConfig.gradient)}>
                {levelConfig.label}
              </Badge>
            </div>
            <DimensionBars dimensions={profile.dimensions} />
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="font-medium">{(() => {
                const next = getNextLevel(profile.proficiencyLevel);
                return next ? `To ${LEVEL_CONFIG[next].label}` : 'Max Level';
              })()}</span>
              <span className="font-medium">{getProgressToNextLevel(profile.compositeScore, profile.proficiencyLevel)}%</span>
            </div>
            <Progress
              value={getProgressToNextLevel(profile.compositeScore, profile.proficiencyLevel)}
              className="h-1.5 bg-slate-100 dark:bg-slate-800"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{profile.daysUntilReview}d</span>
              </div>
              {profile.streak > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-medium">{profile.streak}</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-3 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
              onClick={() => onPractice(profile.skillId)}
            >
              <Play className="w-3 h-3 mr-1" />
              Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Decay Alert Panel with enterprise light/dark mode design
 */
function DecayAlertPanel({
  atRiskProfiles,
  onStartReview,
}: {
  atRiskProfiles: SkillProfile[];
  onStartReview: (skillId: string) => void;
}) {
  if (atRiskProfiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">All Skills Protected</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">No skills at risk of decay. Keep up the great work!</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 dark:from-amber-500/5 via-transparent to-rose-50/30 dark:to-rose-500/5" />

        <CardHeader className="relative pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 dark:from-amber-500/20 dark:to-rose-500/20 border border-amber-200 dark:border-amber-500/20 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Decay Alerts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {atRiskProfiles.length} skill{atRiskProfiles.length > 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-3">
          <AnimatePresence>
            {atRiskProfiles.map((profile, index) => {
              const decayConfig = DECAY_CONFIG[profile.decayRisk];

              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl border',
                    decayConfig.bgColor,
                    decayConfig.borderColor,
                    profile.decayRisk === 'CRITICAL' && 'animate-pulse'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      profile.decayRisk === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
                    )}>
                      {profile.decayRisk === 'CRITICAL' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{profile.skillName}</p>
                      <p className={cn('text-xs font-medium', decayConfig.color)}>
                        {profile.daysUntilReview === 0
                          ? 'Review overdue!'
                          : `Review in ${profile.daysUntilReview} day${profile.daysUntilReview > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={cn(
                      'h-8 font-medium shadow-sm',
                      profile.decayRisk === 'CRITICAL'
                        ? 'bg-rose-500 hover:bg-rose-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    )}
                    onClick={() => onStartReview(profile.skillId)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Review Now
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Learning Roadmap Timeline with enterprise light/dark mode design
 */
function RoadmapTimeline({ roadmap }: { roadmap: Roadmap }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 dark:from-violet-500/5 via-transparent to-cyan-50/30 dark:to-cyan-500/5" />

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20 border border-violet-200 dark:border-violet-500/20 shadow-sm">
                <Rocket className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{roadmap.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {roadmap.remainingHours}h remaining &bull; Target: {roadmap.targetDate?.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {roadmap.completionPercentage}%
              </span>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Complete</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${roadmap.completionPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-4">
              {roadmap.milestones.map((milestone, index) => {
                const isCompleted = milestone.status === 'COMPLETED';
                const isInProgress = milestone.status === 'IN_PROGRESS';
                const isLocked = milestone.status === 'LOCKED';

                return (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="relative flex gap-4"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      'relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-sm',
                      isCompleted && 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500',
                      isInProgress && 'bg-cyan-100 dark:bg-cyan-500/20 border-cyan-400 dark:border-cyan-500',
                      !isCompleted && !isInProgress && 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                    )}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : isInProgress ? (
                        <Play className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      ) : isLocked ? (
                        <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <CircleDot className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>

                    {/* Milestone content */}
                    <div className={cn(
                      'flex-1 p-4 rounded-xl border',
                      isCompleted && 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20',
                      isInProgress && 'bg-cyan-50 dark:bg-cyan-500/5 border-cyan-200 dark:border-cyan-500/20',
                      !isCompleted && !isInProgress && 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50',
                      isLocked && 'opacity-60'
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={cn(
                            'font-semibold',
                            isCompleted && 'text-emerald-700 dark:text-emerald-400',
                            isInProgress && 'text-cyan-700 dark:text-cyan-400',
                            !isCompleted && !isInProgress && 'text-slate-700 dark:text-slate-300'
                          )}>
                            {milestone.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{milestone.description}</p>
                        </div>
                        {milestone.targetDate && (
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {milestone.targetDate.toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {milestone.skills.map((skill) => (
                          <Badge
                            key={skill.name}
                            variant="outline"
                            className={cn(
                              'text-[10px] font-medium',
                              isCompleted && 'border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
                              isInProgress && 'border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400',
                              !isCompleted && !isInProgress && 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {skill.name} &rarr; {LEVEL_CONFIG[skill.targetLevel].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Practice Session Modal with enterprise light/dark mode design
 */
function PracticeModal({
  isOpen,
  onClose,
  selectedSkillId,
  profiles,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedSkillId?: string;
  profiles: SkillProfile[];
  onSubmit: (data: {
    skillId: string;
    duration: number;
    score?: number;
    isAssessment: boolean;
    notes?: string;
  }) => Promise<void>;
}) {
  const [skillId, setSkillId] = useState(selectedSkillId || '');
  const [duration, setDuration] = useState(30);
  const [score, setScore] = useState<number | undefined>();
  const [isAssessment, setIsAssessment] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!skillId) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ skillId, duration, score, isAssessment, notes: notes || undefined });
      onClose();
    } catch (error) {
      console.error('Failed to record practice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 sm:max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 dark:from-cyan-500/5 via-transparent to-emerald-50/50 dark:to-emerald-500/5 rounded-lg" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-500/20 dark:to-emerald-500/20 shadow-sm">
              <Timer className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            Log Practice Session
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Record your practice to track progress and prevent skill decay.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-4 py-4">
          {/* Skill Selection */}
          <div className="space-y-2">
            <Label htmlFor="skill" className="text-slate-700 dark:text-slate-300 font-medium">Skill</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                {profiles.map((profile) => (
                  <SelectItem
                    key={profile.skillId}
                    value={profile.skillId}
                    className="text-slate-900 dark:text-slate-100 focus:bg-slate-100 dark:focus:bg-slate-700"
                  >
                    {profile.skillName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-slate-700 dark:text-slate-300 font-medium">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              max={480}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Assessment Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="space-y-0.5">
              <Label htmlFor="assessment" className="text-slate-700 dark:text-slate-300 font-medium">Formal Assessment</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Was this a test or quiz?</p>
            </div>
            <Switch
              id="assessment"
              checked={isAssessment}
              onCheckedChange={setIsAssessment}
            />
          </div>

          {/* Score (shown if assessment) */}
          {isAssessment && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label htmlFor="score" className="text-slate-700 dark:text-slate-300 font-medium">Score (0-100)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                value={score ?? ''}
                onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Enter your score"
              />
            </motion.div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
              placeholder="What did you practice? Any insights?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="relative">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!skillId || isSubmitting}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Timer className="w-4 h-4 mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Log Practice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Review Session Modal - for spaced repetition review
 * Enterprise light/dark mode design with confidence rating
 */
function ReviewSessionModal({
  isOpen,
  onClose,
  skillId,
  skillName,
  skillLevel,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
  skillLevel: ProficiencyLevel;
  onSubmit: (data: {
    skillId: string;
    confidence: number;
    quality: 'EASY' | 'GOOD' | 'HARD' | 'AGAIN';
    notes?: string;
  }) => Promise<void>;
}) {
  const [confidence, setConfidence] = useState(3);
  const [quality, setQuality] = useState<'EASY' | 'GOOD' | 'HARD' | 'AGAIN'>('GOOD');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfidence(3);
      setQuality('GOOD');
      setNotes('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ skillId, confidence, quality, notes: notes || undefined });
      handleOpenChange(false);
    } catch (error) {
      console.error('Failed to record review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const qualityOptions = [
    { value: 'AGAIN', label: 'Again', description: 'Need more practice', color: 'bg-rose-500', interval: '< 1 day' },
    { value: 'HARD', label: 'Hard', description: 'Struggled to recall', color: 'bg-amber-500', interval: '1-2 days' },
    { value: 'GOOD', label: 'Good', description: 'Recalled with effort', color: 'bg-emerald-500', interval: '3-7 days' },
    { value: 'EASY', label: 'Easy', description: 'Instant recall', color: 'bg-cyan-500', interval: '1-2 weeks' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 sm:max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 dark:from-violet-500/5 via-transparent to-amber-50/50 dark:to-amber-500/5 rounded-lg" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-amber-100 dark:from-violet-500/20 dark:to-amber-500/20 shadow-sm">
              <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            Review Session
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Rate your recall to optimize your learning schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-5 py-4">
          {/* Skill Being Reviewed */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1">Reviewing</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{skillName}</h3>
              </div>
              <Badge className={cn(
                'px-3 py-1 text-xs font-semibold',
                LEVEL_CONFIG[skillLevel].bgColor,
                LEVEL_CONFIG[skillLevel].color
              )}>
                {LEVEL_CONFIG[skillLevel].label}
              </Badge>
            </div>
          </div>

          {/* Confidence Rating */}
          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">
              Confidence Level
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={cn(
                    'flex-1 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-sm',
                    confidence === level
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              {confidence === 1 && 'Very unsure - need to study more'}
              {confidence === 2 && 'Somewhat unsure - gaps in knowledge'}
              {confidence === 3 && 'Neutral - know the basics'}
              {confidence === 4 && 'Confident - solid understanding'}
              {confidence === 5 && 'Very confident - mastered this'}
            </p>
          </div>

          {/* Quality Rating */}
          <div className="space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-medium">
              How was your recall?
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setQuality(option.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    quality === option.value
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('w-2 h-2 rounded-full', option.color)} />
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{option.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Next: {option.interval}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="review-notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes (optional)</Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none"
              placeholder="Any insights from this review?"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="relative">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-violet-500 to-amber-500 text-white hover:from-violet-600 hover:to-amber-600 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Brain className="w-4 h-4 mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getNextLevel(current: ProficiencyLevel): ProficiencyLevel | null {
  const levels: ProficiencyLevel[] = [
    'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
  ];
  const currentIndex = levels.indexOf(current);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
}

function getProgressToNextLevel(score: number, currentLevel: ProficiencyLevel): number {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 100;

  const currentThreshold = LEVEL_CONFIG[currentLevel].threshold;
  const nextThreshold = LEVEL_CONFIG[nextLevel].threshold;
  const range = nextThreshold - currentThreshold;
  const progress = score - currentThreshold;

  return Math.round(Math.min(100, Math.max(0, (progress / range) * 100)));
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SkillBuildTracker({
  profiles = MOCK_PROFILES,
  roadmap = MOCK_ROADMAP,
  totalSkills = MOCK_PROFILES.length,
  averageScore = 64.5,
  currentStreak = 15,
  atRiskCount = 2,
  onRecordPractice,
  onStartReview,
  onCompleteReview,
}: SkillBuildTrackerProps) {
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewSkill, setSelectedReviewSkill] = useState<SkillProfile | undefined>();

  // Calculate level distribution
  const levelDistribution = useMemo(() => {
    const distribution: Record<ProficiencyLevel, number> = {
      NOVICE: 0,
      BEGINNER: 0,
      COMPETENT: 0,
      PROFICIENT: 0,
      ADVANCED: 0,
      EXPERT: 0,
      STRATEGIST: 0,
    };

    profiles.forEach((p) => {
      distribution[p.proficiencyLevel]++;
    });

    return distribution;
  }, [profiles]);

  // Get at-risk profiles
  const atRiskProfiles = useMemo(() => {
    return profiles
      .filter((p) => p.decayRisk === 'HIGH' || p.decayRisk === 'CRITICAL')
      .sort((a, b) => a.daysUntilReview - b.daysUntilReview);
  }, [profiles]);

  const handlePracticeClick = (skillId: string) => {
    setSelectedSkillId(skillId);
    setIsPracticeModalOpen(true);
  };

  const handleRecordPractice = async (data: {
    skillId: string;
    duration: number;
    score?: number;
    isAssessment: boolean;
    notes?: string;
  }) => {
    if (onRecordPractice) {
      await onRecordPractice(data);
    } else {
      console.log('Practice recorded:', data);
    }
  };

  const handleStartReview = (skillId: string) => {
    if (onStartReview) {
      onStartReview(skillId);
    } else {
      // Open the review modal by default
      const skill = profiles.find((p) => p.skillId === skillId);
      if (skill) {
        setSelectedReviewSkill(skill);
        setIsReviewModalOpen(true);
      }
    }
  };

  const handleCompleteReview = async (data: {
    skillId: string;
    confidence: number;
    quality: 'EASY' | 'GOOD' | 'HARD' | 'AGAIN';
    notes?: string;
  }) => {
    if (onCompleteReview) {
      await onCompleteReview(data);
    } else {
      console.log('Review completed:', data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
      {/* Subtle background gradient - lighter for better contrast */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-50/30 via-transparent to-emerald-50/30 dark:from-cyan-950/20 dark:via-transparent dark:to-emerald-950/20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              <span className="bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Skill Development
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">Track, practice, and master your skills</p>
          </div>
          <Button
            onClick={() => setIsPracticeModalOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-shadow"
          >
            <Play className="w-4 h-4 mr-2" />
            Log Practice
          </Button>
        </motion.div>

        {/* Overview Card */}
        <SkillOverviewCard
          totalSkills={totalSkills}
          averageScore={averageScore}
          currentStreak={currentStreak}
          atRiskCount={atRiskCount}
          levelDistribution={levelDistribution}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skills Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your Skills</h2>
              <Badge variant="outline" className="border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-700 dark:text-slate-400 font-medium">
                {profiles.length} skills
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profiles.map((profile, index) => (
                <SkillCard
                  key={profile.id}
                  profile={profile}
                  onPractice={handlePracticeClick}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Decay Alerts */}
            <DecayAlertPanel
              atRiskProfiles={atRiskProfiles}
              onStartReview={handleStartReview}
            />

            {/* Roadmap */}
            <RoadmapTimeline roadmap={roadmap} />
          </div>
        </div>
      </div>

      {/* Practice Modal */}
      <PracticeModal
        isOpen={isPracticeModalOpen}
        onClose={() => {
          setIsPracticeModalOpen(false);
          setSelectedSkillId(undefined);
        }}
        selectedSkillId={selectedSkillId}
        profiles={profiles}
        onSubmit={handleRecordPractice}
      />

      {/* Review Session Modal */}
      {selectedReviewSkill && (
        <ReviewSessionModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedReviewSkill(undefined);
          }}
          skillId={selectedReviewSkill.skillId}
          skillName={selectedReviewSkill.skillName}
          skillLevel={selectedReviewSkill.proficiencyLevel}
          onSubmit={handleCompleteReview}
        />
      )}
    </div>
  );
}
