'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Timer,
  Zap,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

type PomodoroPhase = 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK';
type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED';

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

interface PomodoroTimerProps {
  skillId?: string;
  onPomodoroComplete?: (phase: PomodoroPhase, sessionNumber: number) => void;
  onWorkSessionStart?: () => void;
  settings?: Partial<PomodoroSettings>;
  className?: string;
}

// Default settings
const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

// Phase colors
const PHASE_COLORS: Record<PomodoroPhase, string> = {
  WORK: 'from-red-500 to-orange-500',
  SHORT_BREAK: 'from-green-500 to-emerald-500',
  LONG_BREAK: 'from-blue-500 to-cyan-500',
};

const PHASE_LABELS: Record<PomodoroPhase, string> = {
  WORK: 'Focus Time',
  SHORT_BREAK: 'Short Break',
  LONG_BREAK: 'Long Break',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PomodoroTimer({
  skillId,
  onPomodoroComplete,
  onWorkSessionStart,
  settings: userSettings,
  className,
}: PomodoroTimerProps) {
  const settings = { ...DEFAULT_SETTINGS, ...userSettings };

  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [phase, setPhase] = useState<PomodoroPhase>('WORK');
  const [secondsRemaining, setSecondsRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalCompletedToday, setTotalCompletedToday] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pomodoroSessionId, setPomodoroSessionId] = useState<string | null>(null);

  // Refs for stable callbacks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get duration for current phase
  const getPhaseDuration = useCallback(
    (p: PomodoroPhase): number => {
      switch (p) {
        case 'WORK':
          return settings.workDuration * 60;
        case 'SHORT_BREAK':
          return settings.shortBreakDuration * 60;
        case 'LONG_BREAK':
          return settings.longBreakDuration * 60;
      }
    },
    [settings.workDuration, settings.shortBreakDuration, settings.longBreakDuration]
  );

  // Calculate progress percentage
  const progressPercentage =
    ((getPhaseDuration(phase) - secondsRemaining) / getPhaseDuration(phase)) * 100;

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play notification sound
  const playSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio playback failed (likely no user interaction yet)
      });
    }
  }, [soundEnabled]);

  // Start work session via API (creates a session and returns sessionId)
  const startWorkSession = useCallback(async () => {
    if (!skillId) return;

    try {
      const response = await fetch('/api/sam/practice/pomodoro/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId,
          focusLevel: 'HIGH',
          pomodoroNumber: completedSessions + 1,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.session?.id) {
        setPomodoroSessionId(result.data.session.id);
      } else if (result.error === 'Active session exists' && result.activeSession?.id) {
        // Use existing active session
        setPomodoroSessionId(result.activeSession.id);
      }
    } catch (error) {
      console.error('Failed to start pomodoro session:', error);
    }
  }, [skillId, completedSessions]);

  // Complete work session via API
  const completeWorkSession = useCallback(async () => {
    // Must have a session ID to complete
    if (!pomodoroSessionId) {
      // Fallback: if no session was created (e.g., skillId wasn't set at start)
      // Just log locally without API call
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sam/practice/pomodoro/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: pomodoroSessionId,
          pomodoroNumber: completedSessions + 1,
          wasInterrupted: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Pomodoro session logged!', {
          icon: '🍅',
          description: `+${result.data?.summary?.qualityMinutes ?? 0} quality minutes`,
        });
        // Clear session ID after completion
        setPomodoroSessionId(null);
      }
    } catch (error) {
      console.error('Failed to log pomodoro session:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [pomodoroSessionId, completedSessions]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(() => {
    playSound();

    if (phase === 'WORK') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalCompletedToday((prev) => prev + 1);

      // Log to API if skill selected
      completeWorkSession();

      // Notify parent
      onPomodoroComplete?.('WORK', newCompletedSessions);

      // Determine next break type
      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        setPhase('LONG_BREAK');
        setSecondsRemaining(settings.longBreakDuration * 60);
        toast.success('Time for a long break!', { icon: '☕' });
      } else {
        setPhase('SHORT_BREAK');
        setSecondsRemaining(settings.shortBreakDuration * 60);
        toast.success('Time for a short break!', { icon: '🧘' });
      }
    } else {
      // Break complete, back to work
      onPomodoroComplete?.(phase, completedSessions);
      setPhase('WORK');
      setSecondsRemaining(settings.workDuration * 60);
      toast.info('Break over! Ready to focus?', { icon: '💪' });
    }

    setTimerState('PAUSED');
  }, [
    phase,
    completedSessions,
    settings.sessionsBeforeLongBreak,
    settings.shortBreakDuration,
    settings.longBreakDuration,
    settings.workDuration,
    playSound,
    completeWorkSession,
    onPomodoroComplete,
  ]);

  // Timer tick effect
  useEffect(() => {
    if (timerState === 'RUNNING') {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, handlePhaseComplete]);

  // Start timer
  const handleStart = () => {
    if (phase === 'WORK' && timerState === 'IDLE') {
      onWorkSessionStart?.();
      // Start the API session when beginning a work phase
      startWorkSession();
    }
    setTimerState('RUNNING');
  };

  // Pause timer
  const handlePause = () => {
    setTimerState('PAUSED');
  };

  // Reset timer
  const handleReset = () => {
    setTimerState('IDLE');
    setSecondsRemaining(getPhaseDuration(phase));
  };

  // Skip to next phase
  const handleSkip = () => {
    if (phase === 'WORK') {
      // Can't skip work without completing
      toast.error('Complete your focus session first!');
      return;
    }
    handlePhaseComplete();
  };

  // Change work duration preset
  const handleDurationChange = (duration: string) => {
    if (timerState !== 'IDLE') {
      toast.error('Stop the timer first');
      return;
    }
    const newDuration = parseInt(duration, 10);
    settings.workDuration = newDuration;
    if (phase === 'WORK') {
      setSecondsRemaining(newDuration * 60);
    }
  };

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      {/* Hidden audio element for notifications */}
      <audio
        ref={audioRef}
        src="/sounds/timer-complete.mp3"
        preload="auto"
      />

      <CardHeader className="pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-base sm:text-xl">Pomodoro Timer</span>
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              )}
            </Button>
            <Badge variant="secondary" className="text-xs">
              {totalCompletedToday} today
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
        {/* Phase indicator */}
        <div className="flex justify-center">
          <Badge
            className={cn(
              'px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gradient-to-r text-white',
              PHASE_COLORS[phase]
            )}
          >
            {phase === 'WORK' ? (
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            ) : (
              <Coffee className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            )}
            {PHASE_LABELS[phase]}
          </Badge>
        </div>

        {/* Timer display */}
        <div className="text-center">
          <div
            className={cn(
              'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mono font-bold tracking-tight',
              timerState === 'RUNNING' && 'animate-pulse'
            )}
          >
            {formatTime(secondsRemaining)}
          </div>
          <Progress
            value={progressPercentage}
            className="mt-3 sm:mt-4 h-1.5 sm:h-2"
          />
        </div>

        {/* Session indicators */}
        <div className="flex justify-center gap-2">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-colors',
                i < completedSessions % settings.sessionsBeforeLongBreak
                  ? 'bg-red-500'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {timerState === 'RUNNING' ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={handlePause}
              className="w-full sm:w-32 text-sm sm:text-base"
            >
              <Pause className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={isSubmitting}
              className={cn(
                'w-full sm:w-32 bg-gradient-to-r text-white text-sm sm:text-base',
                PHASE_COLORS[phase]
              )}
            >
              <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              {timerState === 'PAUSED' ? 'Resume' : 'Start'}
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            disabled={timerState === 'IDLE'}
            className="w-full sm:w-auto text-sm sm:text-base"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-0" />
            <span className="sm:hidden ml-1">Reset</span>
          </Button>

          {phase !== 'WORK' && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleSkip}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Skip Break
            </Button>
          )}
        </div>

        {/* Duration presets (only when idle) */}
        {timerState === 'IDLE' && phase === 'WORK' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">Duration:</span>
            <Select
              value={settings.workDuration.toString()}
              onValueChange={handleDurationChange}
            >
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="25">25 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="50">50 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats summary */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{completedSessions} sessions</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Timer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>
              {Math.round(completedSessions * settings.workDuration)} min focused
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
