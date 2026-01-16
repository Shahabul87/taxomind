'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  Clock,
  Target,
  Zap,
  Brain,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface Skill {
  id: string;
  name: string;
  category?: string;
  icon?: string;
}

interface ActiveSession {
  id: string;
  skillId: string;
  sessionType: string;
  focusLevel: string;
  status: 'ACTIVE' | 'PAUSED';
  startedAt: string;
  pausedDurationSeconds: number;
  currentElapsedSeconds?: number;
}

interface SessionSummary {
  rawHours: number;
  qualityHours: number;
  qualityMultiplier: number;
  totalQualityHours: number;
  proficiencyLevel: string;
  currentStreak: number;
  milestonesEarned: number;
}

interface PracticeTimerProps {
  skills: Skill[];
  onSessionComplete?: (summary: SessionSummary) => void;
  className?: string;
}

const SESSION_TYPES = [
  { value: 'DELIBERATE', label: 'Deliberate Practice', multiplier: '1.5x', icon: Target },
  { value: 'POMODORO', label: 'Pomodoro Session', multiplier: '1.4x', icon: Clock },
  { value: 'GUIDED', label: 'SAM-Guided', multiplier: '1.25x', icon: Brain },
  { value: 'CASUAL', label: 'Casual Learning', multiplier: '1.0x', icon: Zap },
];

const FOCUS_LEVELS = [
  { value: 'DEEP_FLOW', label: 'Deep Flow', multiplier: '1.5x' },
  { value: 'HIGH', label: 'High Focus', multiplier: '1.25x' },
  { value: 'MEDIUM', label: 'Medium Focus', multiplier: '1.0x' },
  { value: 'LOW', label: 'Low Focus', multiplier: '0.75x' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeTimer({
  skills,
  onSessionComplete,
  className,
}: PracticeTimerProps) {
  // State
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('DELIBERATE');
  const [focusLevel, setFocusLevel] = useState<string>('HIGH');
  const [notes, setNotes] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingActive, setIsCheckingActive] = useState<boolean>(true);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/sam/practice/sessions/active');
        const data = await response.json();

        if (data.success && data.data) {
          setActiveSession(data.data);
          setElapsedSeconds(data.data.currentElapsedSeconds ?? 0);
          setSelectedSkill(data.data.skillId);
          setSessionType(data.data.sessionType);
          setFocusLevel(data.data.focusLevel);
        }
      } catch (error) {
        console.error('Error checking active session:', error);
      } finally {
        setIsCheckingActive(false);
      }
    };

    checkActiveSession();
  }, []);

  // Timer effect
  useEffect(() => {
    if (activeSession?.status === 'ACTIVE') {
      startTimeRef.current = new Date();

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeSession?.status]);

  // Start session
  const handleStart = async () => {
    if (!selectedSkill) {
      toast.error('Please select a skill to practice');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sam/practice/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkill,
          sessionType,
          focusLevel,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveSession(data.data);
        setElapsedSeconds(0);
        toast.success('Practice session started!');
      } else {
        toast.error(data.error ?? 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  };

  // Pause session
  const handlePause = async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sam/practice/sessions/${activeSession.id}/pause`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        setActiveSession(data.data);
        toast.info('Session paused');
      } else {
        toast.error(data.error ?? 'Failed to pause session');
      }
    } catch (error) {
      console.error('Error pausing session:', error);
      toast.error('Failed to pause session');
    } finally {
      setIsLoading(false);
    }
  };

  // Resume session
  const handleResume = async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sam/practice/sessions/${activeSession.id}/resume`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success) {
        setActiveSession(data.data);
        toast.success('Session resumed');
      } else {
        toast.error(data.error ?? 'Failed to resume session');
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      toast.error('Failed to resume session');
    } finally {
      setIsLoading(false);
    }
  };

  // End session
  const handleEnd = async () => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sam/practice/sessions/${activeSession.id}/end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: notes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveSession(null);
        setElapsedSeconds(0);
        setNotes('');

        const summary = data.data.summary;
        toast.success(
          `Session complete! ${summary.qualityHours.toFixed(2)} quality hours logged`,
          { duration: 5000 }
        );

        if (summary.milestonesEarned > 0) {
          toast.success(
            `You earned ${summary.milestonesEarned} new milestone(s)!`,
            { icon: '🏆', duration: 5000 }
          );
        }

        onSessionComplete?.(summary);
      } else {
        toast.error(data.error ?? 'Failed to end session');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  // Abandon session
  const handleAbandon = async () => {
    if (!activeSession) return;

    const confirmed = window.confirm(
      'Are you sure? Abandoning will not record any practice time.'
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sam/practice/sessions/${activeSession.id}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        setActiveSession(null);
        setElapsedSeconds(0);
        setNotes('');
        toast.info('Session abandoned');
      } else {
        toast.error(data.error ?? 'Failed to abandon session');
      }
    } catch (error) {
      console.error('Error abandoning session:', error);
      toast.error('Failed to abandon session');
    } finally {
      setIsLoading(false);
    }
  };

  // Get selected skill name
  const selectedSkillName = skills.find((s) => s.id === selectedSkill)?.name ?? 'Select a skill';

  // Calculate estimated quality hours
  const getMultiplier = () => {
    const sessionMult = SESSION_TYPES.find((t) => t.value === sessionType)?.multiplier ?? '1.0x';
    const focusMult = FOCUS_LEVELS.find((f) => f.value === focusLevel)?.multiplier ?? '1.0x';
    const sessionVal = parseFloat(sessionMult);
    const focusVal = parseFloat(focusMult);
    return Math.min(sessionVal * focusVal, 2.5).toFixed(2);
  };

  if (isCheckingActive) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Practice Timer
          {activeSession && (
            <Badge
              variant={activeSession.status === 'ACTIVE' ? 'default' : 'secondary'}
              className="ml-auto"
            >
              {activeSession.status === 'ACTIVE' ? 'Running' : 'Paused'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center py-4">
          <div
            className={cn(
              'text-5xl font-mono font-bold tabular-nums',
              activeSession?.status === 'ACTIVE' ? 'text-green-500' : 'text-muted-foreground'
            )}
          >
            {formatTime(elapsedSeconds)}
          </div>
          {activeSession && (
            <p className="text-sm text-muted-foreground mt-2">
              Quality Multiplier: {getMultiplier()}x
            </p>
          )}
        </div>

        {/* Session Configuration */}
        {!activeSession && (
          <div className="space-y-3">
            {/* Skill Selection */}
            <div>
              <label className="text-sm font-medium mb-1 block">Skill</label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill to practice" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.icon && <span className="mr-2">{skill.icon}</span>}
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">Session Type</label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {type.multiplier}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Focus Level */}
            <div>
              <label className="text-sm font-medium mb-1 block">Focus Level</label>
              <Select value={focusLevel} onValueChange={setFocusLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className="flex items-center gap-2">
                        {level.label}
                        <Badge variant="outline" className="ml-auto text-xs">
                          {level.multiplier}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
              <Textarea
                placeholder="What are you working on?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Active Session Info */}
        {activeSession && (
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <p className="font-medium">{selectedSkillName}</p>
            <p className="text-sm text-muted-foreground">
              {SESSION_TYPES.find((t) => t.value === activeSession.sessionType)?.label} | {' '}
              {FOCUS_LEVELS.find((f) => f.value === activeSession.focusLevel)?.label}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!activeSession ? (
            <Button
              className="flex-1"
              onClick={handleStart}
              disabled={isLoading || !selectedSkill}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Practice
            </Button>
          ) : (
            <>
              {activeSession.status === 'ACTIVE' ? (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handlePause}
                  disabled={isLoading}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleResume}
                  disabled={isLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                variant="default"
                className="flex-1"
                onClick={handleEnd}
                disabled={isLoading}
              >
                <Square className="h-4 w-4 mr-2" />
                End
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAbandon}
                disabled={isLoading}
                title="Abandon session"
              >
                <span className="text-xs">X</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
