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
  size = 140,
  strokeWidth = 10,
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
      <svg width={size} height={size} className="rotate-[-90deg] drop-shadow-lg">
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
            filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.4))',
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Enhanced Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold bg-gradient-to-r from-cyan-600 via-emerald-600 to-teal-600 dark:from-cyan-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress)}
        </motion.span>
        <span className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">Score</span>
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
      className="group"
    >
      <Card className="relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Subtle decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/20 via-emerald-50/15 to-teal-50/20 dark:from-cyan-500/5 dark:via-emerald-500/3 dark:to-teal-500/5" />

        <CardHeader className="relative pb-3 sm:pb-4 md:pb-6 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20 flex-shrink-0"
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate">Skill Profile Overview</h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">Your comprehensive learning journey</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          {/* Mobile: Stack vertically, Tablet+: Grid layout */}
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Progress Ring - Centered on mobile */}
            <div className="flex flex-col items-center justify-center py-2 sm:py-3 md:py-4 order-1 lg:order-none">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="scale-75 sm:scale-90 md:scale-100"
              >
                <ProgressRing progress={averageScore} />
              </motion.div>
              <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Average Mastery</p>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Across all skills</p>
            </div>

            {/* Stats Grid - 2x2 on all sizes */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 order-2 lg:order-none">
              <motion.div
                whileHover={{ y: -2 }}
                className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-500/10 dark:to-cyan-500/5 border border-cyan-200/50 dark:border-cyan-500/20 transition-all hover:shadow-md hover:border-cyan-300 dark:hover:border-cyan-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-1.5 sm:mb-2 md:mb-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20">
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">Skills</span>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalSkills}</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-500/10 dark:to-orange-500/5 border border-orange-200/50 dark:border-orange-500/20 transition-all hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-1.5 sm:mb-2 md:mb-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">Streak</span>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{currentStreak}<span className="text-sm sm:text-base md:text-lg font-semibold text-slate-500 dark:text-slate-400 ml-0.5 sm:ml-1">d</span></p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20 transition-all hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-1.5 sm:mb-2 md:mb-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20">
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">Velocity</span>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">+12%</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 border border-amber-200/50 dark:border-amber-500/20 transition-all hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/30"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-1.5 sm:mb-2 md:mb-3">
                  <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">At Risk</span>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">{atRiskCount}</p>
              </motion.div>
            </div>

            {/* Level Distribution - Collapsible on mobile via scrollable */}
            <div className="space-y-2 sm:space-y-2.5 md:space-y-3 py-1 sm:py-2 order-3 lg:order-none">
              <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 sm:mb-3 md:mb-4">Level Distribution</p>
              <div className="max-h-32 sm:max-h-40 md:max-h-none overflow-y-auto space-y-1.5 sm:space-y-2 md:space-y-3 pr-1">
                {Object.entries(LEVEL_CONFIG).map(([level, config]) => {
                  const count = levelDistribution[level as ProficiencyLevel] || 0;
                  const percentage = totalSkills > 0 ? (count / totalSkills) * 100 : 0;

                  return (
                    <motion.div
                      key={level}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + Object.keys(LEVEL_CONFIG).indexOf(level) * 0.05 }}
                      className="group"
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <span className={cn('text-[10px] sm:text-xs font-semibold w-16 sm:w-20 md:w-24 truncate', config.color)}>{config.label}</span>
                        <div className="flex-1 h-1.5 sm:h-2 md:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            className={cn('h-full rounded-full bg-gradient-to-r shadow-sm', config.gradient)}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 w-5 sm:w-6 md:w-8 text-right">{count}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Individual Skill Card with enterprise light/dark mode design
 * Optimized for mobile with touch-friendly targets
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
    ACCELERATING: <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />,
    STEADY: <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-600 dark:text-cyan-400" />,
    SLOWING: <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400" />,
    STAGNANT: <CircleDot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500" />,
    DECLINING: <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600 dark:text-rose-400" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="group"
    >
      <Card className={cn(
        'relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 shadow-sm sm:shadow-md',
        'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg sm:hover:shadow-xl hover:shadow-cyan-500/10',
        profile.decayRisk === 'CRITICAL' && 'border-rose-400 dark:border-rose-500 ring-1 sm:ring-2 ring-rose-200 dark:ring-rose-500/20 shadow-rose-500/20',
        profile.decayRisk === 'HIGH' && 'border-orange-400 dark:border-orange-500 ring-1 sm:ring-2 ring-orange-200 dark:ring-orange-500/20 shadow-orange-500/20'
      )}>
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-cyan-50/30 dark:from-cyan-500/5 via-transparent to-emerald-50/30 dark:to-emerald-500/5" />

        <CardContent className="relative p-2.5 sm:p-3 md:p-4 lg:p-5">
          {/* Compact Header for mobile */}
          <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4 gap-1.5 sm:gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-1.5 sm:mb-2">
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-100 truncate">{profile.skillName}</h3>
                {profile.decayRisk !== 'LOW' && (
                  <motion.div
                    animate={profile.decayRisk === 'CRITICAL' ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex-shrink-0"
                  >
                    <AlertTriangle className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5', decayConfig.color)} />
                  </motion.div>
                )}
              </div>
              <Badge variant="outline" className={cn('text-[10px] sm:text-xs border sm:border-2 font-semibold px-1 sm:px-1.5 md:px-2 py-0.5', categoryConfig.color)}>
                <CategoryIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 mr-0.5 sm:mr-1 md:mr-1.5" />
                <span className="hidden xs:inline">{categoryConfig.label}</span>
                <span className="xs:hidden">{categoryConfig.label.slice(0, 4)}</span>
              </Badge>
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1 ml-1 sm:ml-2 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0"
            >
              {velocityIcon[profile.velocityTrend]}
            </motion.div>
          </div>

          {/* Score & Level - Compact on mobile */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-1.5 mb-1 sm:mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {Math.round(profile.compositeScore)}
                </span>
                <span className="text-[10px] sm:text-xs md:text-sm text-slate-400 dark:text-slate-500 font-medium">/100</span>
              </div>
              <Badge className={cn('bg-gradient-to-r text-white text-[10px] sm:text-xs font-semibold shadow-sm sm:shadow-md px-1.5 sm:px-2 md:px-3 py-0.5', levelConfig.gradient)}>
                {levelConfig.label}
              </Badge>
            </div>
            <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 hidden xs:block">
              <DimensionBars dimensions={profile.dimensions} />
            </div>
          </div>

          {/* Progress bar - Simplified on mobile */}
          <div className="mb-2 sm:mb-3 md:mb-4">
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mb-1 sm:mb-2">
              <span className="font-medium sm:font-semibold truncate">{(() => {
                const next = getNextLevel(profile.proficiencyLevel);
                return next ? `To ${LEVEL_CONFIG[next].label}` : 'Max';
              })()}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400 ml-1">{getProgressToNextLevel(profile.compositeScore, profile.proficiencyLevel)}%</span>
            </div>
            <div className="relative">
              <Progress
                value={getProgressToNextLevel(profile.compositeScore, profile.proficiencyLevel)}
                className="h-1.5 sm:h-2 bg-slate-100 dark:bg-slate-800 shadow-inner"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full opacity-20"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressToNextLevel(profile.compositeScore, profile.proficiencyLevel)}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>

          {/* Footer - Touch-friendly on mobile */}
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800 gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 flex-1 min-w-0">
              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                <span className="font-semibold whitespace-nowrap">{profile.daysUntilReview}d</span>
              </div>
              {profile.streak > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-1 rounded-md bg-orange-100 dark:bg-orange-500/20">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-orange-500 flex-shrink-0" />
                  <span className="font-semibold whitespace-nowrap">{profile.streak}</span>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 sm:h-8 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500 hover:to-emerald-500 transition-all duration-200 flex-shrink-0 touch-manipulation"
              onClick={() => onPractice(profile.skillId)}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1 md:mr-1.5" />
              <span className="hidden sm:inline">Practice</span>
              <span className="sm:hidden">Go</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Decay Alert Panel with enterprise light/dark mode design
 * Optimized for mobile with compact layout
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
        <Card className="border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 shadow-md sm:shadow-lg">
          <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8 text-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 md:mb-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center"
            >
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
            </motion.div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-1 sm:mb-2">All Skills Protected</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">No skills at risk of decay. Keep up the great work!</p>
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
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-md sm:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/20 dark:from-amber-500/5 via-transparent to-rose-50/20 dark:to-rose-500/5" />

        <CardHeader className="relative pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 shadow-lg shadow-amber-500/30 flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">Decay Alerts</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1">
                  {atRiskProfiles.length} skill{atRiskProfiles.length > 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-1.5 sm:space-y-2 md:space-y-3 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-none overflow-y-auto">
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
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex flex-col xs:flex-row items-start xs:items-center justify-between p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border sm:border-2 shadow-sm sm:shadow-md gap-2 sm:gap-3',
                    decayConfig.bgColor,
                    decayConfig.borderColor,
                    profile.decayRisk === 'CRITICAL' && 'ring-1 sm:ring-2 ring-rose-300 dark:ring-rose-500/30'
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0 w-full xs:w-auto">
                    <motion.div
                      animate={profile.decayRisk === 'CRITICAL' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={cn(
                        'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center shadow-sm sm:shadow-md flex-shrink-0',
                        profile.decayRisk === 'CRITICAL' ? 'bg-gradient-to-br from-rose-400 to-rose-500' : 'bg-gradient-to-br from-amber-400 to-amber-500'
                      )}
                    >
                      {profile.decayRisk === 'CRITICAL' ? (
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      ) : (
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs sm:text-sm md:text-base text-slate-900 dark:text-white truncate">{profile.skillName}</p>
                      <p className={cn('text-[10px] sm:text-xs font-semibold mt-0.5', decayConfig.color)}>
                        {profile.daysUntilReview === 0
                          ? 'Review overdue!'
                          : `Review in ${profile.daysUntilReview}d`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={cn(
                      'h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-semibold shadow-md sm:shadow-lg hover:shadow-xl transition-all w-full xs:w-auto touch-manipulation',
                      profile.decayRisk === 'CRITICAL'
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                    )}
                    onClick={() => onStartReview(profile.skillId)}
                  >
                    <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-0.5 sm:mr-1 md:mr-1.5" />
                    <span className="hidden xs:inline">Review</span>
                    <span className="xs:hidden">Go</span>
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
 * Optimized for mobile with compact timeline view
 */
function RoadmapTimeline({ roadmap }: { roadmap: Roadmap }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-md sm:shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/20 dark:from-violet-500/5 via-transparent to-cyan-50/20 dark:to-cyan-500/5" />

        <CardHeader className="relative pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 md:pt-6">
          <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30 flex-shrink-0"
              >
                <Rocket className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">{roadmap.title}</h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-1">
                  {roadmap.remainingHours}h left • {roadmap.targetDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-violet-600 via-cyan-600 to-teal-600 dark:from-violet-400 dark:via-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
                {roadmap.completionPercentage}%
              </span>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Done</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          {/* Progress bar */}
          <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
            <div className="h-2 sm:h-2.5 md:h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-teal-500 rounded-full shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: `${roadmap.completionPercentage}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
              <span className="font-medium">{roadmap.completionPercentage}%</span>
              <span className="font-medium">{roadmap.remainingHours}h left</span>
            </div>
          </div>

          {/* Timeline - Scrollable on mobile */}
          <div className="relative max-h-48 sm:max-h-64 md:max-h-80 lg:max-h-none overflow-y-auto pr-1">
            {/* Timeline line */}
            <div className="absolute left-3 sm:left-4 md:left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-2 sm:space-y-3 md:space-y-4">
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
                    className="relative flex gap-2 sm:gap-3 md:gap-4"
                  >
                    {/* Timeline dot - Compact on mobile */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'relative z-10 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center border sm:border-2 shadow-md sm:shadow-lg flex-shrink-0',
                        isCompleted && 'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-500 dark:border-emerald-400 shadow-emerald-500/30',
                        isInProgress && 'bg-gradient-to-br from-cyan-400 to-cyan-500 border-cyan-500 dark:border-cyan-400 shadow-cyan-500/30',
                        !isCompleted && !isInProgress && 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                      ) : isInProgress ? (
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                      ) : isLocked ? (
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <CircleDot className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-slate-400 dark:text-slate-500" />
                      )}
                    </motion.div>

                    {/* Milestone content - Compact on mobile */}
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        'flex-1 p-2 sm:p-3 md:p-4 lg:p-5 rounded-md sm:rounded-lg md:rounded-xl border sm:border-2 shadow-sm sm:shadow-md transition-all',
                        isCompleted && 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border-emerald-300 dark:border-emerald-500/30',
                        isInProgress && 'bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-500/10 dark:to-cyan-500/5 border-cyan-300 dark:border-cyan-500/30',
                        !isCompleted && !isInProgress && 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50',
                        isLocked && 'opacity-60'
                      )}
                    >
                      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-1 sm:gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(
                            'font-bold text-xs sm:text-sm md:text-base truncate',
                            isCompleted && 'text-emerald-700 dark:text-emerald-400',
                            isInProgress && 'text-cyan-700 dark:text-cyan-400',
                            !isCompleted && !isInProgress && 'text-slate-700 dark:text-slate-300'
                          )}>
                            {milestone.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">{milestone.description}</p>
                        </div>
                        {milestone.targetDate && (
                          <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 dark:bg-slate-800 whitespace-nowrap self-start flex-shrink-0">
                            {milestone.targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Skills - Horizontal scroll on mobile */}
                      <div className="flex flex-nowrap sm:flex-wrap gap-1 sm:gap-1.5 md:gap-2 mt-2 sm:mt-3 md:mt-4 overflow-x-auto pb-1 -mx-1 px-1">
                        {milestone.skills.map((skill) => (
                          <Badge
                            key={skill.name}
                            variant="outline"
                            className={cn(
                              'text-[9px] sm:text-[10px] md:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 border sm:border-2 whitespace-nowrap flex-shrink-0',
                              isCompleted && 'border-emerald-400 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
                              isInProgress && 'border-cyan-400 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10',
                              !isCompleted && !isInProgress && 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                            )}
                          >
                            {skill.name} → {LEVEL_CONFIG[skill.targetLevel].label}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
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
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[calc(100%-2rem)] max-w-md mx-auto rounded-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 dark:from-cyan-500/5 via-transparent to-emerald-50/50 dark:to-emerald-500/5 rounded-xl sm:rounded-2xl" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-100 to-emerald-100 dark:from-cyan-500/20 dark:to-emerald-500/20 shadow-sm">
              <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            Log Practice Session
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
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

        <DialogFooter className="relative flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-10 sm:h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!skillId || isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600 shadow-sm h-10 sm:h-9 text-sm touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Timer className="w-4 h-4 mr-1.5 sm:mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5 sm:mr-2" />
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
      <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[calc(100%-2rem)] max-w-md mx-auto rounded-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 dark:from-violet-500/5 via-transparent to-amber-50/50 dark:to-amber-500/5 rounded-xl sm:rounded-2xl" />

        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-slate-100 text-base sm:text-lg">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-100 to-amber-100 dark:from-violet-500/20 dark:to-amber-500/20 shadow-sm">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
            </div>
            Review Session
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Rate your recall to optimize your learning schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="relative space-y-3 sm:space-y-4 md:space-y-5 py-3 sm:py-4">
          {/* Skill Being Reviewed */}
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-0.5 sm:mb-1">Reviewing</p>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{skillName}</h3>
              </div>
              <Badge className={cn(
                'px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold flex-shrink-0',
                LEVEL_CONFIG[skillLevel].bgColor,
                LEVEL_CONFIG[skillLevel].color
              )}>
                {LEVEL_CONFIG[skillLevel].label}
              </Badge>
            </div>
          </div>

          {/* Confidence Rating */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
              Confidence Level
            </Label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level)}
                  className={cn(
                    'flex-1 py-2.5 sm:py-3 rounded-md sm:rounded-lg border sm:border-2 transition-all duration-200 font-medium text-xs sm:text-sm touch-manipulation',
                    confidence === level
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center">
              {confidence === 1 && 'Very unsure - need more study'}
              {confidence === 2 && 'Somewhat unsure - gaps exist'}
              {confidence === 3 && 'Neutral - know basics'}
              {confidence === 4 && 'Confident - solid grasp'}
              {confidence === 5 && 'Very confident - mastered'}
            </p>
          </div>

          {/* Quality Rating */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">
              How was your recall?
            </Label>
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setQuality(option.value)}
                  className={cn(
                    'p-2 sm:p-3 rounded-lg sm:rounded-xl border sm:border-2 transition-all duration-200 text-left touch-manipulation',
                    quality === option.value
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                    <div className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', option.color)} />
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{option.label}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{option.description}</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 sm:mt-1">Next: {option.interval}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="review-notes" className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm">Notes (optional)</Label>
            <Textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 resize-none text-sm"
              placeholder="Any insights from this review?"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="relative flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-10 sm:h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-amber-500 text-white hover:from-violet-600 hover:to-amber-600 shadow-sm h-10 sm:h-9 text-sm touch-manipulation"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Brain className="w-4 h-4 mr-1.5 sm:mr-2" />
                </motion.div>
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Complete Review</span>
                <span className="xs:hidden">Submit</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-cyan-50/20 dark:from-slate-950 dark:via-emerald-950/10 dark:to-cyan-950/10 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8">
      {/* Enhanced background with animated gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-50/40 via-emerald-50/30 to-teal-50/40 dark:from-cyan-950/30 dark:via-emerald-950/20 dark:to-teal-950/30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.05),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
        {/* Mobile-first Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between pb-1 sm:pb-2"
        >
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10 flex-shrink-0">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-600 via-emerald-600 to-teal-600 dark:from-cyan-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                    Skill Development
                  </span>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm lg:text-base font-medium line-clamp-1 sm:line-clamp-none">
                  Track, practice, and master your skills with AI-powered insights
                </p>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full md:w-auto"
          >
            <Button
              onClick={() => setIsPracticeModalOpen(true)}
              size="default"
              className="w-full md:w-auto h-9 sm:h-10 md:h-11 px-3 sm:px-4 md:px-6 bg-gradient-to-r from-cyan-500 via-emerald-500 to-teal-500 text-white hover:from-cyan-600 hover:via-emerald-600 hover:to-teal-600 shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] text-xs sm:text-sm md:text-base font-medium"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Log Practice Session</span>
              <span className="sm:hidden">Log Practice</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Overview Card */}
        <SkillOverviewCard
          totalSkills={totalSkills}
          averageScore={averageScore}
          currentStreak={currentStreak}
          atRiskCount={atRiskCount}
          levelDistribution={levelDistribution}
        />

        {/* Mobile-first Main Grid - Single column on mobile, 3-col on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* Skills Grid - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0">
                <div className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex-shrink-0">
                  <Code className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                </div>
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">Your Skills</h2>
              </div>
              <Badge variant="outline" className="border sm:border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm flex-shrink-0">
                {profiles.length} {profiles.length === 1 ? 'skill' : 'skills'}
              </Badge>
            </motion.div>
            {/* Skills cards - 1 col on mobile, 2 on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
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

          {/* Sidebar - Show at top on mobile (alerts first), sidebar on desktop */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6 order-1 lg:order-2">
            {/* Decay Alerts - Priority on mobile */}
            <DecayAlertPanel
              atRiskProfiles={atRiskProfiles}
              onStartReview={handleStartReview}
            />

            {/* Roadmap - Collapsible feel on mobile */}
            {roadmap && <RoadmapTimeline roadmap={roadmap} />}
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
