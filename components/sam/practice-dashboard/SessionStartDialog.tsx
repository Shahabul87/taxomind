'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Zap, Brain, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  SessionStartDialogProps,
  PracticeSessionType,
  PracticeFocusLevel,
  BloomsLevel,
} from './types';

// Default session type info if not provided by API
const DEFAULT_SESSION_TYPE_INFO = [
  { type: 'DELIBERATE' as const, multiplier: 1.5, label: 'Deliberate Practice', description: 'Focused, intentional practice with specific improvement goals', bestFor: 'Targeting weak areas' },
  { type: 'POMODORO' as const, multiplier: 1.35, label: 'Pomodoro', description: 'Time-boxed deep work sessions', bestFor: 'Focused work' },
  { type: 'GUIDED' as const, multiplier: 1.2, label: 'Guided Learning', description: 'Following structured tutorials', bestFor: 'Learning new concepts' },
  { type: 'ASSESSMENT' as const, multiplier: 1.4, label: 'Assessment', description: 'Testing knowledge through quizzes', bestFor: 'Measuring progress' },
  { type: 'CASUAL' as const, multiplier: 0.8, label: 'Casual', description: 'Light, relaxed practice', bestFor: 'Exploration' },
  { type: 'REVIEW' as const, multiplier: 1.1, label: 'Review', description: 'Reviewing previously learned material', bestFor: 'Spaced repetition' },
];

const DEFAULT_BLOOMS_INFO = [
  { level: 'CREATE' as const, multiplier: 1.5, label: 'Create', description: 'Producing new work', cognitiveEffort: 'highest', examples: [] },
  { level: 'EVALUATE' as const, multiplier: 1.4, label: 'Evaluate', description: 'Judging, critiquing', cognitiveEffort: 'very high', examples: [] },
  { level: 'ANALYZE' as const, multiplier: 1.3, label: 'Analyze', description: 'Breaking down, examining', cognitiveEffort: 'high', examples: [] },
  { level: 'APPLY' as const, multiplier: 1.2, label: 'Apply', description: 'Using knowledge in new situations', cognitiveEffort: 'moderate', examples: [] },
  { level: 'UNDERSTAND' as const, multiplier: 1.1, label: 'Understand', description: 'Explaining, summarizing', cognitiveEffort: 'basic', examples: [] },
  { level: 'REMEMBER' as const, multiplier: 1.0, label: 'Remember', description: 'Recalling facts', cognitiveEffort: 'minimal', examples: [] },
];

const FOCUS_LEVELS: { value: PracticeFocusLevel; label: string; multiplier: number }[] = [
  { value: 'DEEP_FLOW', label: 'Deep Flow', multiplier: 1.5 },
  { value: 'HIGH', label: 'High Focus', multiplier: 1.25 },
  { value: 'MEDIUM', label: 'Medium Focus', multiplier: 1.0 },
  { value: 'LOW', label: 'Low Focus', multiplier: 0.75 },
  { value: 'VERY_LOW', label: 'Very Low Focus', multiplier: 0.5 },
];

export function SessionStartDialog({
  open,
  onOpenChange,
  onStart,
  sessionTypeInfo = DEFAULT_SESSION_TYPE_INFO,
  bloomsLevelInfo = DEFAULT_BLOOMS_INFO,
  isLoading,
}: SessionStartDialogProps) {
  const [skillId, setSkillId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [sessionType, setSessionType] = useState<PracticeSessionType>('DELIBERATE');
  const [focusLevel, setFocusLevel] = useState<PracticeFocusLevel>('MEDIUM');
  const [bloomsLevel, setBloomsLevel] = useState<BloomsLevel | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSkillId('');
      setSkillName('');
      setSessionType('DELIBERATE');
      setFocusLevel('MEDIUM');
      setBloomsLevel(undefined);
      setNotes('');
    }
  }, [open]);

  // Calculate estimated multiplier
  const estimatedMultiplier = React.useMemo(() => {
    const sessionMult = sessionTypeInfo.find(s => s.type === sessionType)?.multiplier ?? 1;
    const focusMult = FOCUS_LEVELS.find(f => f.value === focusLevel)?.multiplier ?? 1;
    const bloomsMult = bloomsLevel ? (bloomsLevelInfo.find(b => b.level === bloomsLevel)?.multiplier ?? 1) : 1;
    return Math.pow(sessionMult * focusMult * bloomsMult, 1/3);
  }, [sessionType, focusLevel, bloomsLevel, sessionTypeInfo, bloomsLevelInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate a skill ID if not provided
    const finalSkillId = skillId || `skill-${Date.now()}`;

    await onStart({
      skillId: finalSkillId,
      skillName: skillName || undefined,
      sessionType,
      focusLevel,
      bloomsLevel,
      notes: notes || undefined,
    });
  }, [skillId, skillName, sessionType, focusLevel, bloomsLevel, notes, onStart]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start Practice Session</DialogTitle>
          <DialogDescription>
            Configure your practice session to maximize quality hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Skill Input */}
          <div className="space-y-2">
            <Label htmlFor="skillName">What are you practicing?</Label>
            <Input
              id="skillName"
              placeholder="e.g., JavaScript, React, Machine Learning..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              required
            />
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Session Type</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Session type affects quality multiplier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={sessionType} onValueChange={(v) => setSessionType(v as PracticeSessionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                {sessionTypeInfo.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    <div className="flex items-center gap-2">
                      <span>{type.label}</span>
                      <span className="text-xs text-emerald-600">×{type.multiplier}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {sessionTypeInfo.find(s => s.type === sessionType)?.description}
            </p>
          </div>

          {/* Focus Level */}
          <div className="space-y-2">
            <Label>Focus Level</Label>
            <RadioGroup
              value={focusLevel}
              onValueChange={(v) => setFocusLevel(v as PracticeFocusLevel)}
              className="grid grid-cols-5 gap-2"
            >
              {FOCUS_LEVELS.map((level) => (
                <div key={level.value} className="text-center">
                  <RadioGroupItem
                    value={level.value}
                    id={level.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={level.value}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-xs',
                      focusLevel === level.value && 'border-primary bg-primary/5'
                    )}
                  >
                    <span className="font-medium">{level.label.split(' ')[0]}</span>
                    <span className="text-emerald-600">×{level.multiplier}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Bloom&apos;s Level (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Cognitive Level (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Brain className="h-4 w-4 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Based on Bloom&apos;s Taxonomy. Higher cognitive levels earn better multipliers.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={bloomsLevel || ''} onValueChange={(v) => setBloomsLevel(v as BloomsLevel || undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cognitive level (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not specified</SelectItem>
                {bloomsLevelInfo.map((level) => (
                  <SelectItem key={level.level} value={level.level}>
                    <div className="flex items-center gap-2">
                      <span>{level.label}</span>
                      <span className="text-xs text-emerald-600">×{level.multiplier}</span>
                      <span className="text-xs text-slate-400">({level.cognitiveEffort})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Session Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="What do you plan to focus on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Estimated Multiplier Display */}
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Estimated Quality Multiplier
              </span>
            </div>
            <span className="text-lg font-bold text-emerald-600">
              ×{estimatedMultiplier.toFixed(2)}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !skillName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SessionStartDialog;
