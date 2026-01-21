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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  Star,
  MessageSquare,
  Award,
  FileCheck,
  Users,
  Gauge,
  ChevronDown,
  AlertCircle,
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
  bloomsLevel?: string;
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

// Phase 3/4 Types for End Session Dialog
type ProjectOutcome = 'SUCCESS' | 'PARTIAL' | 'FAILED';

interface EndSessionInputs {
  rating?: number;
  notes?: string;
  distractionCount?: number;
  selfRatedDifficulty?: number;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  projectOutcome?: ProjectOutcome;
  peerReviewScore?: number;
}

interface PracticeTimerProps {
  skills?: Skill[];
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

// Bloom's Taxonomy Cognitive Levels
const BLOOMS_LEVELS = [
  { value: 'CREATE', label: 'Create', multiplier: '1.1x', description: 'Building projects, designing solutions' },
  { value: 'EVALUATE', label: 'Evaluate', multiplier: '1.05x', description: 'Code review, comparing approaches' },
  { value: 'ANALYZE', label: 'Analyze', multiplier: '1.0x', description: 'Debugging, understanding patterns' },
  { value: 'APPLY', label: 'Apply', multiplier: '0.9x', description: 'Solving problems, writing code' },
  { value: 'UNDERSTAND', label: 'Understand', multiplier: '0.8x', description: 'Reading docs, watching tutorials' },
  { value: 'REMEMBER', label: 'Remember', multiplier: '0.7x', description: 'Flashcards, memorizing syntax' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeTimer({
  skills: propSkills,
  onSessionComplete,
  className,
}: PracticeTimerProps) {
  // State
  const [skills, setSkills] = useState<Skill[]>(propSkills ?? []);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('DELIBERATE');
  const [focusLevel, setFocusLevel] = useState<string>('HIGH');
  const [bloomsLevel, setBloomsLevel] = useState<string>('APPLY');
  const [notes, setNotes] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCheckingActive, setIsCheckingActive] = useState<boolean>(true);

  // Phase 3/4: End Session Dialog State
  const [showEndDialog, setShowEndDialog] = useState<boolean>(false);
  const [endSessionRating, setEndSessionRating] = useState<number | undefined>(undefined);
  const [endSessionNotes, setEndSessionNotes] = useState<string>('');
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [selfRatedDifficulty, setSelfRatedDifficulty] = useState<number>(3);
  const [assessmentScore, setAssessmentScore] = useState<string>('');
  const [assessmentPassed, setAssessmentPassed] = useState<boolean | undefined>(undefined);
  const [projectOutcome, setProjectOutcome] = useState<ProjectOutcome | undefined>(undefined);
  const [peerReviewScore, setPeerReviewScore] = useState<string>('');
  const [showAdvancedEvidence, setShowAdvancedEvidence] = useState<boolean>(false);

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

  // Fetch skills if not provided via props
  useEffect(() => {
    if (propSkills && propSkills.length > 0) {
      setSkills(propSkills);
      return;
    }

    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/sam/skills');
        const data = await response.json();

        if (data.success && data.data?.skills) {
          setSkills(data.data.skills);
        } else {
          // Fallback: fetch from skill-build-track if main API doesn't exist
          const fallbackResponse = await fetch('/api/skill-build-track');
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.skills) {
            setSkills(fallbackData.skills.map((s: { id: string; name: string; icon?: string }) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
        // Set some default skills as fallback
        setSkills([
          { id: 'default-1', name: 'General Practice', icon: '📚' },
          { id: 'default-2', name: 'Coding', icon: '💻' },
          { id: 'default-3', name: 'Reading', icon: '📖' },
        ]);
      }
    };

    fetchSkills();
  }, [propSkills]);

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
          if (data.data.bloomsLevel) {
            setBloomsLevel(data.data.bloomsLevel);
          }
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
          bloomsLevel,
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

  // End session with Phase 3/4 inputs
  const handleEnd = async (inputs?: EndSessionInputs) => {
    if (!activeSession) return;

    setIsLoading(true);
    try {
      // Build request body with Phase 3/4 fields
      const requestBody: Record<string, unknown> = {
        notes: inputs?.notes || notes || undefined,
        distractionCount: inputs?.distractionCount,
        selfRatedDifficulty: inputs?.selfRatedDifficulty,
      };

      // Add assessment fields if session type is ASSESSMENT
      if (activeSession.sessionType === 'ASSESSMENT' && inputs?.assessmentScore !== undefined) {
        requestBody.assessmentScore = inputs.assessmentScore;
        requestBody.assessmentPassed = inputs.assessmentPassed;
      }

      // Add project outcome if provided
      if (inputs?.projectOutcome) {
        requestBody.projectOutcome = inputs.projectOutcome;
      }

      // Add peer review score if provided
      if (inputs?.peerReviewScore !== undefined) {
        requestBody.peerReviewScore = inputs.peerReviewScore;
      }

      const response = await fetch(
        `/api/sam/practice/sessions/${activeSession.id}/end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      if (data.success) {
        setActiveSession(null);
        setElapsedSeconds(0);
        setNotes('');

        // Reset dialog state
        setShowEndDialog(false);
        setEndSessionRating(undefined);
        setEndSessionNotes('');
        setDistractionCount(0);
        setSelfRatedDifficulty(3);
        setAssessmentScore('');
        setAssessmentPassed(undefined);
        setProjectOutcome(undefined);
        setPeerReviewScore('');
        setShowAdvancedEvidence(false);

        const summary = data.data.summary;
        const qualityScoring = data.data.qualityScoring;

        // Enhanced toast message with Phase 3/4 quality scoring info
        let toastMessage = `Session complete! ${summary.qualityHours.toFixed(2)} quality hours logged`;
        if (qualityScoring) {
          const multiplier = qualityScoring.multiplier ?? summary.qualityMultiplier;
          toastMessage += ` (${multiplier.toFixed(2)}x multiplier)`;
        }
        toast.success(toastMessage, { duration: 5000 });

        if (summary.milestonesEarned > 0) {
          toast.success(
            `You earned ${summary.milestonesEarned} new milestone(s)!`,
            { icon: '🏆', duration: 5000 }
          );
        }

        // Show focus drift recommendations if concerning
        const focusDrift = data.data.focusDrift;
        if (
          focusDrift &&
          (focusDrift.driftSeverity === 'SEVERE' || focusDrift.driftSeverity === 'MODERATE')
        ) {
          setTimeout(() => {
            toast.info('Focus Insight: Consider taking a break before your next session.', {
              duration: 4000,
            });
          }, 1500);
        }

        // Show validation warnings
        const warnings = data.data.warnings;
        if (warnings && warnings.length > 0) {
          setTimeout(() => {
            toast.warning(warnings[0], { duration: 4000 });
          }, 500);
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

  // Handler for dialog submission
  const handleEndWithDialog = async () => {
    const inputs: EndSessionInputs = {
      rating: endSessionRating,
      notes: endSessionNotes || undefined,
      distractionCount,
      selfRatedDifficulty,
    };

    // Add assessment fields if session type is ASSESSMENT
    if (activeSession?.sessionType === 'ASSESSMENT' && assessmentScore) {
      inputs.assessmentScore = parseInt(assessmentScore, 10);
      inputs.assessmentPassed = assessmentPassed;
    }

    // Add project outcome if provided
    if (projectOutcome) {
      inputs.projectOutcome = projectOutcome;
    }

    // Add peer review score if provided
    if (peerReviewScore) {
      inputs.peerReviewScore = parseInt(peerReviewScore, 10);
    }

    await handleEnd(inputs);
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
  const selectedSkillName = skills?.find((s) => s.id === selectedSkill)?.name ?? 'Select a skill';

  // Calculate estimated quality hours
  const getMultiplier = () => {
    const sessionMult = SESSION_TYPES.find((t) => t.value === sessionType)?.multiplier ?? '1.0x';
    const focusMult = FOCUS_LEVELS.find((f) => f.value === focusLevel)?.multiplier ?? '1.0x';
    const bloomsMult = BLOOMS_LEVELS.find((b) => b.value === bloomsLevel)?.multiplier ?? '1.0x';
    const sessionVal = parseFloat(sessionMult);
    const focusVal = parseFloat(focusMult);
    const bloomsVal = parseFloat(bloomsMult);
    return Math.min(sessionVal * focusVal * bloomsVal, 2.5).toFixed(2);
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
                  {(skills ?? []).map((skill) => (
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

            {/* Bloom's Cognitive Level */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Cognitive Level (Bloom&apos;s)
              </label>
              <Select value={bloomsLevel} onValueChange={setBloomsLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOMS_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {level.label}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {level.multiplier}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {level.description}
                        </span>
                      </div>
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
              {SESSION_TYPES.find((t) => t.value === activeSession.sessionType)?.label} |{' '}
              {FOCUS_LEVELS.find((f) => f.value === activeSession.focusLevel)?.label}
              {activeSession.bloomsLevel && (
                <> | {BLOOMS_LEVELS.find((b) => b.value === activeSession.bloomsLevel)?.label}</>
              )}
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
                onClick={() => setShowEndDialog(true)}
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

      {/* Phase 3/4: End Session Dialog with Enhanced Quality Scoring Inputs */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>End Practice Session</DialogTitle>
            <DialogDescription>
              Rate your session quality. Add optional details for better tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Estimated Quality Hours */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Estimated Quality Hours
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                {((elapsedSeconds / 3600) * parseFloat(getMultiplier())).toFixed(3)}
              </p>
            </div>

            {/* Rating Stars */}
            <div className="space-y-2">
              <p className="text-sm font-medium">How productive was this session?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEndSessionRating(star)}
                    className={cn(
                      'p-1 rounded-full transition-colors',
                      endSessionRating && star <= endSessionRating
                        ? 'text-yellow-500'
                        : 'text-slate-300 dark:text-slate-600 hover:text-yellow-400'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8',
                        endSessionRating && star <= endSessionRating && 'fill-current'
                      )}
                    />
                  </button>
                ))}
              </div>
              {endSessionRating && (
                <p className="text-xs text-center text-slate-500">
                  {['Poor', 'Fair', 'Good', 'Great', 'Excellent'][endSessionRating - 1]}
                </p>
              )}
            </div>

            {/* Perceived Difficulty Slider */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Perceived Difficulty
              </Label>
              <Slider
                value={[selfRatedDifficulty]}
                onValueChange={(value) => setSelfRatedDifficulty(value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Very Easy</span>
                <span className="font-medium">
                  {['Very Easy', 'Easy', 'Moderate', 'Challenging', 'Very Hard'][selfRatedDifficulty - 1]}
                </span>
                <span>Very Hard</span>
              </div>
            </div>

            {/* Distraction Count */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Distractions
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDistractionCount(Math.max(0, distractionCount - 1))}
                  disabled={distractionCount === 0}
                >
                  -
                </Button>
                <span className="min-w-[3rem] text-center font-medium">
                  {distractionCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDistractionCount(distractionCount + 1)}
                >
                  +
                </Button>
                <span className="text-xs text-slate-500">times distracted</span>
              </div>
            </div>

            {/* Advanced Quality Evidence (Collapsible) */}
            <Collapsible
              open={showAdvancedEvidence}
              onOpenChange={setShowAdvancedEvidence}
              className="border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-3 h-auto"
                  type="button"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Award className="h-4 w-4" />
                    Advanced Quality Evidence
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      showAdvancedEvidence && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 pt-0 space-y-3">
                {/* Assessment Score (for ASSESSMENT sessions) */}
                {activeSession?.sessionType === 'ASSESSMENT' && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <FileCheck className="h-4 w-4" />
                      Assessment Score (0-100)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Score"
                        min={0}
                        max={100}
                        value={assessmentScore}
                        onChange={(e) => setAssessmentScore(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={assessmentPassed === undefined ? '' : assessmentPassed ? 'passed' : 'failed'}
                        onValueChange={(v) => setAssessmentPassed(v === '' ? undefined : v === 'passed')}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          <SelectItem value="passed">Passed</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Project Outcome */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Project/Task Outcome
                  </Label>
                  <Select
                    value={projectOutcome ?? ''}
                    onValueChange={(v) => setProjectOutcome(v as ProjectOutcome || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      <SelectItem value="SUCCESS">
                        <span className="flex items-center gap-2">
                          <span className="text-green-500">✓</span> Successful
                        </span>
                      </SelectItem>
                      <SelectItem value="PARTIAL">
                        <span className="flex items-center gap-2">
                          <span className="text-amber-500">◐</span> Partial Success
                        </span>
                      </SelectItem>
                      <SelectItem value="FAILED">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500">✗</span> Did Not Complete
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Peer Review Score */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Peer Review Score (0-100)
                  </Label>
                  <Input
                    type="number"
                    placeholder="Score from peer review (optional)"
                    min={0}
                    max={100}
                    value={peerReviewScore}
                    onChange={(e) => setPeerReviewScore(e.target.value)}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Session Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Session Notes (Optional)
              </Label>
              <Textarea
                placeholder="What did you learn? Any reflections?"
                value={endSessionNotes}
                onChange={(e) => setEndSessionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isLoading}
            >
              Keep Practicing
            </Button>
            <Button onClick={handleEndWithDialog} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                'End Session'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
