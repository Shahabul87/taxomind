'use client';

/**
 * MicrolearningWidget Component
 *
 * Interactive bite-sized learning module generator with gamified progress tracking.
 *
 * Features:
 * - Quick lesson generation (5-15 min sessions)
 * - Device-responsive learning
 * - Gamification with XP and streaks
 * - Visual progress indicators
 * - Learning style adaptation
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Zap,
  Clock,
  Play,
  Pause,
  CheckCircle2,
  BookOpen,
  Brain,
  Target,
  Trophy,
  Flame,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronRight,
  Star,
  Timer,
  Rocket,
  Coffee,
  Sun,
  Moon,
  AlertCircle,
  Volume2,
  Video,
  FileText,
  Gamepad2,
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

type ModuleType = 'CONCEPT' | 'PRACTICE' | 'QUIZ' | 'REVIEW' | 'SUMMARY' | 'FLASHCARD' | 'VIDEO' | 'AUDIO' | 'INTERACTIVE';
type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ModuleStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

interface MicroModule {
  id: string;
  title: string;
  type: ModuleType;
  contentChunks: ContentChunk[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  xpReward: number;
  tags: string[];
}

interface ContentChunk {
  id: string;
  type: 'text' | 'visual' | 'interactive' | 'quiz';
  content: string;
  duration: number;
}

interface MicroSession {
  id: string;
  userId: string;
  moduleId: string;
  status: ModuleStatus;
  startedAt: string;
  completedAt?: string;
  progressPercent: number;
  xpEarned: number;
  streakBonus: number;
  completedChunks: string[];
}

interface LearnerProfile {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  modulesCompleted: number;
  totalLearningMinutes: number;
  preferredDuration: number;
  preferredDevice: DeviceType;
  preferredTypes: ModuleType[];
  lastSessionAt?: string;
}

interface MicrolearningWidgetProps {
  className?: string;
  compact?: boolean;
  topicId?: string;
  courseId?: string;
  onModuleStart?: (module: MicroModule) => void;
  onModuleComplete?: (session: MicroSession) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODULE_TYPE_CONFIG = {
  CONCEPT: { icon: BookOpen, color: 'text-blue-500 bg-blue-500/10', label: 'Concept' },
  PRACTICE: { icon: Target, color: 'text-green-500 bg-green-500/10', label: 'Practice' },
  QUIZ: { icon: Brain, color: 'text-purple-500 bg-purple-500/10', label: 'Quiz' },
  REVIEW: { icon: RefreshCw, color: 'text-orange-500 bg-orange-500/10', label: 'Review' },
  SUMMARY: { icon: FileText, color: 'text-cyan-500 bg-cyan-500/10', label: 'Summary' },
  FLASHCARD: { icon: Zap, color: 'text-yellow-500 bg-yellow-500/10', label: 'Flashcard' },
  VIDEO: { icon: Video, color: 'text-red-500 bg-red-500/10', label: 'Video' },
  AUDIO: { icon: Volume2, color: 'text-pink-500 bg-pink-500/10', label: 'Audio' },
  INTERACTIVE: { icon: Gamepad2, color: 'text-indigo-500 bg-indigo-500/10', label: 'Interactive' },
};

const DURATION_OPTIONS = [
  { value: 5, label: '5 min', icon: Coffee, description: 'Quick break' },
  { value: 10, label: '10 min', icon: Sun, description: 'Short session' },
  { value: 15, label: '15 min', icon: Moon, description: 'Full focus' },
];

const DIFFICULTY_COLORS = {
  beginner: 'border-green-500/50 bg-green-500/5',
  intermediate: 'border-blue-500/50 bg-blue-500/5',
  advanced: 'border-purple-500/50 bg-purple-500/5',
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function XpBadge({ xp, bonus }: { xp: number; bonus?: number }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
      <span className="text-xs font-bold text-yellow-600">+{xp} XP</span>
      {bonus && bonus > 0 && (
        <span className="text-xs text-orange-500">+{bonus}</span>
      )}
    </div>
  );
}

function StreakIndicator({ streak, isActive }: { streak: number; isActive?: boolean }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full transition-all',
            isActive
              ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
              : 'bg-muted/50'
          )}>
            <Flame className={cn(
              'w-3 h-3 transition-colors',
              isActive ? 'text-orange-500' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-xs font-bold',
              isActive ? 'text-orange-600' : 'text-muted-foreground'
            )}>
              {streak}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{streak} day learning streak!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DurationSelector({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DURATION_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all hover:scale-[1.02]',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-transparent bg-muted/50 hover:bg-muted'
            )}
          >
            <Icon className={cn(
              'w-5 h-5 transition-colors',
              isSelected ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-sm font-semibold',
              isSelected ? 'text-primary' : 'text-foreground'
            )}>
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModuleCard({
  module,
  isActive,
  session,
  onStart,
  onContinue,
}: {
  module: MicroModule;
  isActive?: boolean;
  session?: MicroSession;
  onStart?: () => void;
  onContinue?: () => void;
}) {
  const config = MODULE_TYPE_CONFIG[module.type];
  const Icon = config.icon;
  const isInProgress = session?.status === 'in_progress';
  const isCompleted = session?.status === 'completed';

  return (
    <div className={cn(
      'relative p-4 rounded-xl border-2 transition-all hover:shadow-lg',
      isActive ? 'border-primary shadow-md' : 'border-transparent',
      isCompleted ? 'bg-green-500/5 border-green-500/30' : 'bg-card',
      DIFFICULTY_COLORS[module.difficulty]
    )}>
      {/* Completion badge */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={cn('p-2.5 rounded-lg', config.color)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm truncate">{module.title}</h4>
            <Badge variant="outline" className="text-xs capitalize shrink-0">
              {config.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {module.estimatedDuration}m
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {module.xpReward} XP
            </span>
          </div>

          {/* Progress bar for in-progress modules */}
          {isInProgress && session && (
            <div className="space-y-1 mb-2">
              <Progress value={session.progressPercent} className="h-1.5" />
              <span className="text-xs text-muted-foreground">
                {session.progressPercent}% complete
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {module.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {isCompleted ? (
            <Button variant="ghost" size="sm" className="text-green-600">
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          ) : isInProgress ? (
            <Button size="sm" onClick={onContinue} className="shadow-sm">
              <Play className="w-4 h-4 mr-1" />
              Continue
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onStart}>
              <Rocket className="w-4 h-4 mr-1" />
              Start
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsOverview({ profile }: { profile: LearnerProfile }) {
  const stats = [
    {
      label: 'Total XP',
      value: profile.totalXp.toLocaleString(),
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      label: 'Modules',
      value: profile.modulesCompleted,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      label: 'Minutes',
      value: profile.totalLearningMinutes,
      icon: Timer,
      color: 'text-blue-500',
    },
    {
      label: 'Best Streak',
      value: profile.longestStreak,
      icon: Trophy,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex flex-col items-center p-2 rounded-lg bg-muted/50"
          >
            <Icon className={cn('w-4 h-4 mb-1', stat.color)} />
            <span className="text-lg font-bold">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MicrolearningWidget({
  className,
  compact = false,
  topicId,
  courseId,
  onModuleStart,
  onModuleComplete,
}: MicrolearningWidgetProps) {
  const [modules, setModules] = useState<MicroModule[]>([]);
  const [sessions, setSessions] = useState<Record<string, MicroSession>>({});
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [showDurationSelector, setShowDurationSelector] = useState(false);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (topicId) params.append('topicId', topicId);
      if (courseId) params.append('courseId', courseId);

      const [modulesRes, profileRes] = await Promise.all([
        fetch(`/api/sam/microlearning?action=list-modules&${params}`),
        fetch('/api/sam/microlearning?action=learner-profile'),
      ]);

      if (!modulesRes.ok || !profileRes.ok) {
        throw new Error('Failed to fetch microlearning data');
      }

      const [modulesData, profileData] = await Promise.all([
        modulesRes.json(),
        profileRes.json(),
      ]);

      if (modulesData.success) {
        setModules(modulesData.data.modules || []);
        setSessions(modulesData.data.sessions || {});
      }

      if (profileData.success) {
        setProfile(profileData.data.profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [topicId, courseId]);

  const generateModule = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/sam/microlearning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-module',
          data: {
            topicId,
            courseId,
            targetDuration: selectedDuration,
            deviceType: 'desktop',
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data.module) {
        setModules((prev) => [data.data.module, ...prev]);
        setShowDurationSelector(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate module');
    } finally {
      setGenerating(false);
    }
  }, [topicId, courseId, selectedDuration]);

  const startModule = useCallback(async (module: MicroModule) => {
    try {
      const res = await fetch('/api/sam/microlearning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-session',
          data: { moduleId: module.id },
        }),
      });

      const data = await res.json();
      if (data.success && data.data.session) {
        setSessions((prev) => ({
          ...prev,
          [module.id]: data.data.session,
        }));
        onModuleStart?.(module);
      }
    } catch (err) {
      console.error('Failed to start module:', err);
    }
  }, [onModuleStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading microlearning...</p>
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
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
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
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Quick Learning</CardTitle>
              <CardDescription>Bite-sized lessons for busy schedules</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <>
                <StreakIndicator streak={profile.currentStreak} isActive={profile.currentStreak > 0} />
                <XpBadge xp={profile.totalXp} />
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stats Overview */}
        {profile && !compact && <StatsOverview profile={profile} />}

        {/* Duration Selector */}
        {showDurationSelector && (
          <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-dashed">
            <h4 className="font-medium text-sm">How much time do you have?</h4>
            <DurationSelector
              selected={selectedDuration}
              onSelect={setSelectedDuration}
            />
            <div className="flex gap-2">
              <Button
                onClick={generateModule}
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Lesson
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDurationSelector(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Generate CTA */}
        {!showDurationSelector && (
          <Button
            variant="outline"
            className="w-full border-dashed hover:border-primary hover:bg-primary/5"
            onClick={() => setShowDurationSelector(true)}
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            Generate New Quick Lesson
          </Button>
        )}

        {/* Modules List */}
        {modules.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Available Modules
              <Badge variant="secondary" className="text-xs">
                {modules.length}
              </Badge>
            </h4>
            <div className="space-y-2">
              {modules.slice(0, compact ? 2 : 5).map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  session={sessions[module.id]}
                  onStart={() => startModule(module)}
                  onContinue={() => onModuleStart?.(module)}
                />
              ))}
            </div>
            {modules.length > (compact ? 2 : 5) && (
              <Button variant="ghost" size="sm" className="w-full">
                View all {modules.length} modules
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {modules.length === 0 && !showDurationSelector && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/10 mb-4">
              <Rocket className="w-10 h-10 text-yellow-600" />
            </div>
            <h3 className="font-semibold mb-1">Ready for Quick Learning?</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
              Generate personalized bite-sized lessons that fit your schedule.
            </p>
            <Button onClick={() => setShowDurationSelector(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Get Started
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MicrolearningWidget;
