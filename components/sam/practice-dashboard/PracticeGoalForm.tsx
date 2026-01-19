'use client';

import React, { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Target, Clock, Zap, Flame, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PracticeGoalFormProps, GoalType } from './types';

const GOAL_TYPES: { value: GoalType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'QUALITY_HOURS', label: 'Quality Hours', icon: Zap, description: 'Track quality-adjusted practice hours' },
  { value: 'HOURS', label: 'Raw Hours', icon: Clock, description: 'Track total practice time' },
  { value: 'SESSIONS', label: 'Sessions', icon: Target, description: 'Complete a number of sessions' },
  { value: 'STREAK', label: 'Streak', icon: Flame, description: 'Maintain consecutive practice days' },
  { value: 'WEEKLY_HOURS', label: 'Weekly Hours', icon: Calendar, description: 'Practice hours per week' },
];

export function PracticeGoalForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: PracticeGoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('QUALITY_HOURS');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [skillName, setSkillName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'DAILY' | 'WEEKLY' | 'NONE'>('NONE');

  const isEditing = Boolean(initialData?.id);

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setGoalType((initialData?.goalType as GoalType) || 'QUALITY_HOURS');
      setTargetValue(initialData?.targetValue || 10);
      setSkillName(initialData?.skillName || '');
      setDeadline(initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : '');
      setReminderEnabled(initialData?.reminderEnabled || false);
      setReminderFrequency(initialData?.reminderFrequency || 'NONE');
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      title,
      description: description || undefined,
      goalType,
      targetValue,
      skillName: skillName || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      reminderEnabled,
      reminderFrequency: reminderEnabled ? reminderFrequency : 'NONE',
    });
  };

  const selectedGoalType = GOAL_TYPES.find((t) => t.value === goalType);
  const GoalIcon = selectedGoalType?.icon || Target;

  // Get unit label based on goal type
  const getUnitLabel = (type: GoalType): string => {
    switch (type) {
      case 'QUALITY_HOURS':
      case 'HOURS':
      case 'WEEKLY_HOURS':
        return 'hours';
      case 'SESSIONS':
        return 'sessions';
      case 'STREAK':
        return 'days';
      default:
        return 'units';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            Set a practice goal to stay motivated and track your progress.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Master React Hooks, Complete 100 hours..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GOAL_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setGoalType(type.value)}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border p-3 transition-all text-center',
                      goalType === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                    )}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedGoalType?.description}
            </p>
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="targetValue">Target</Label>
            <div className="flex items-center gap-2">
              <Input
                id="targetValue"
                type="number"
                min={1}
                step={goalType === 'QUALITY_HOURS' || goalType === 'HOURS' ? 0.5 : 1}
                value={targetValue}
                onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
                className="flex-1"
                required
              />
              <span className="text-sm text-slate-500 dark:text-slate-400 w-20">
                {getUnitLabel(goalType)}
              </span>
            </div>
          </div>

          {/* Skill (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="skillName">Skill (Optional)</Label>
            <Input
              id="skillName"
              placeholder="e.g., JavaScript, Python..."
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leave empty to track across all skills
            </p>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What do you want to achieve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Reminders */}
          <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminderEnabled" className="cursor-pointer">
                Enable Reminders
              </Label>
              <Switch
                id="reminderEnabled"
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label>Reminder Frequency</Label>
                <Select
                  value={reminderFrequency}
                  onValueChange={(v) => setReminderFrequency(v as typeof reminderFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3">
            <div className="flex items-center gap-2">
              <GoalIcon className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {title || 'Your Goal'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Target: {targetValue} {getUnitLabel(goalType)}
                  {skillName && ` in ${skillName}`}
                  {deadline && ` by ${new Date(deadline).toLocaleDateString()}`}
                </p>
              </div>
            </div>
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
            <Button type="submit" disabled={isLoading || !title.trim() || targetValue <= 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default PracticeGoalForm;
