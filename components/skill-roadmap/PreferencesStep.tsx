'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, BookOpen, Wrench, Blend, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreferencesStepProps {
  hoursPerWeek: number;
  targetDate: string;
  learningStyle: string;
  includeAssessments: boolean;
  prioritizeQuickWins: boolean;
  onHoursChange: (hours: number) => void;
  onTargetDateChange: (date: string) => void;
  onLearningStyleChange: (style: string) => void;
  onAssessmentsChange: (val: boolean) => void;
  onQuickWinsChange: (val: boolean) => void;
}

const LEARNING_STYLES = [
  {
    value: 'STRUCTURED',
    label: 'Structured',
    desc: 'Follow a clear curriculum with theory first, then practice',
    icon: BookOpen,
  },
  {
    value: 'PROJECT_BASED',
    label: 'Project-Based',
    desc: 'Learn by building real projects from the start',
    icon: Wrench,
  },
  {
    value: 'MIXED',
    label: 'Mixed',
    desc: 'Combine theory and hands-on projects for balanced learning',
    icon: Blend,
  },
] as const;

function getTimeEstimate(hoursPerWeek: number, totalHours: number): string {
  const weeks = Math.ceil(totalHours / hoursPerWeek);
  if (weeks <= 4) return `~${weeks} weeks`;
  const months = Math.round(weeks / 4.3);
  return `~${months} month${months > 1 ? 's' : ''}`;
}

export function PreferencesStep({
  hoursPerWeek,
  targetDate,
  learningStyle,
  includeAssessments,
  prioritizeQuickWins,
  onHoursChange,
  onTargetDateChange,
  onLearningStyleChange,
  onAssessmentsChange,
  onQuickWinsChange,
}: PreferencesStepProps) {
  // Rough estimate: 80-200 hours total depending on skill gap
  const estimatedTotal = 120;

  return (
    <div className="space-y-6">
      {/* Hours per Week */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Hours per week
          </Label>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-violet-500" />
            <span className="font-bold text-violet-600 dark:text-violet-400">
              {hoursPerWeek}h/week
            </span>
            <span className="text-slate-400">
              ({getTimeEstimate(hoursPerWeek, estimatedTotal)} est.)
            </span>
          </div>
        </div>
        <Slider
          value={[hoursPerWeek]}
          onValueChange={([val]) => onHoursChange(val)}
          min={1}
          max={40}
          step={1}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>1h (casual)</span>
          <span>10h (part-time)</span>
          <span>20h (intensive)</span>
          <span>40h (full-time)</span>
        </div>
      </div>

      {/* Target Completion Date */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Target completion date (optional)
        </Label>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => onTargetDateChange(e.target.value)}
            min={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
            className={cn(
              'flex h-11 w-full rounded-xl border-2 border-slate-200 dark:border-slate-700',
              'bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-sm',
              'focus:outline-none focus:border-violet-500 dark:focus:border-violet-400',
              'transition-colors'
            )}
          />
        </div>
      </div>

      {/* Learning Style */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Preferred learning style
        </Label>
        <RadioGroup
          value={learningStyle}
          onValueChange={onLearningStyleChange}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {LEARNING_STYLES.map((style) => {
            const Icon = style.icon;
            return (
              <label
                key={style.value}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all text-center',
                  learningStyle === style.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                )}
              >
                <RadioGroupItem value={style.value} className="sr-only" />
                <div className={cn(
                  'p-2 rounded-lg',
                  learningStyle === style.value
                    ? 'bg-violet-100 dark:bg-violet-900/50'
                    : 'bg-slate-100 dark:bg-slate-800'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    learningStyle === style.value
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-500'
                  )} />
                </div>
                <p className="text-sm font-medium">{style.label}</p>
                <p className="text-xs text-slate-500 leading-snug">{style.desc}</p>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Toggles */}
      <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Include assessments
            </p>
            <p className="text-xs text-slate-500">
              Add knowledge checks after each phase
            </p>
          </div>
          <Switch
            checked={includeAssessments}
            onCheckedChange={onAssessmentsChange}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Prioritize quick wins
            </p>
            <p className="text-xs text-slate-500">
              Put high-impact, easy-to-learn skills early
            </p>
          </div>
          <Switch
            checked={prioritizeQuickWins}
            onCheckedChange={onQuickWinsChange}
          />
        </div>
      </div>
    </div>
  );
}
