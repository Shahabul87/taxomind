'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROFICIENCY_LEVELS = [
  { value: 'NOVICE', label: 'Novice', desc: 'Basic awareness' },
  { value: 'BEGINNER', label: 'Beginner', desc: 'Limited experience' },
  { value: 'COMPETENT', label: 'Competent', desc: 'Works independently' },
  { value: 'PROFICIENT', label: 'Proficient', desc: 'Handles complex tasks' },
  { value: 'ADVANCED', label: 'Advanced', desc: 'Deep expertise' },
  { value: 'EXPERT', label: 'Expert', desc: 'Recognized authority' },
  { value: 'STRATEGIST', label: 'Strategist', desc: 'Industry leader' },
] as const;

const POPULAR_SKILLS = [
  'React', 'Python', 'TypeScript', 'Data Science',
  'AWS', 'Machine Learning', 'Node.js', 'Docker',
  'SQL', 'System Design', 'Kubernetes', 'GraphQL',
];

interface SkillInputStepProps {
  skillName: string;
  currentLevel: string;
  targetLevel: string;
  onSkillNameChange: (name: string) => void;
  onCurrentLevelChange: (level: string) => void;
  onTargetLevelChange: (level: string) => void;
}

export function SkillInputStep({
  skillName,
  currentLevel,
  targetLevel,
  onSkillNameChange,
  onCurrentLevelChange,
  onTargetLevelChange,
}: SkillInputStepProps) {
  const [isFocused, setIsFocused] = useState(false);

  const currentIdx = PROFICIENCY_LEVELS.findIndex(l => l.value === currentLevel);
  const isTargetValid = useCallback((targetValue: string) => {
    const targetIdx = PROFICIENCY_LEVELS.findIndex(l => l.value === targetValue);
    return targetIdx > currentIdx;
  }, [currentIdx]);

  return (
    <div className="space-y-6">
      {/* Skill Name Input */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          What skill do you want to master?
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="e.g., React Development, Machine Learning, AWS..."
            value={skillName}
            onChange={(e) => onSkillNameChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="pl-10 h-12 text-base rounded-xl border-2 focus:border-violet-500 dark:focus:border-violet-400"
          />
        </div>

        {/* Popular Skills Quick-Select */}
        {(!skillName || isFocused) && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Popular Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map((skill) => (
                <Button
                  key={skill}
                  variant="outline"
                  size="sm"
                  onClick={() => onSkillNameChange(skill)}
                  className={cn(
                    'rounded-full text-xs h-8 border-2 transition-all',
                    skillName === skill
                      ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300'
                      : 'hover:border-violet-300'
                  )}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {skill}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Level */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Your current level
        </Label>
        <RadioGroup
          value={currentLevel}
          onValueChange={(val) => {
            onCurrentLevelChange(val);
            // Auto-adjust target if it became invalid
            const newCurrentIdx = PROFICIENCY_LEVELS.findIndex(l => l.value === val);
            const targetIdx = PROFICIENCY_LEVELS.findIndex(l => l.value === targetLevel);
            if (targetIdx <= newCurrentIdx) {
              const nextLevel = PROFICIENCY_LEVELS[newCurrentIdx + 1];
              if (nextLevel) onTargetLevelChange(nextLevel.value);
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
        >
          {PROFICIENCY_LEVELS.map((level) => (
            <label
              key={level.value}
              className={cn(
                'flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                currentLevel === level.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              )}
            >
              <RadioGroupItem value={level.value} className="mt-0.5" />
              <div>
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-xs text-slate-500">{level.desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Target Level */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Target level
        </Label>
        <RadioGroup
          value={targetLevel}
          onValueChange={onTargetLevelChange}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
        >
          {PROFICIENCY_LEVELS.map((level) => {
            const disabled = !isTargetValid(level.value);
            return (
              <label
                key={level.value}
                className={cn(
                  'flex items-start gap-2 p-3 rounded-xl border-2 transition-all',
                  disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'cursor-pointer',
                  targetLevel === level.value && !disabled
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : !disabled
                      ? 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <RadioGroupItem
                  value={level.value}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{level.label}</p>
                  <p className="text-xs text-slate-500">{level.desc}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
