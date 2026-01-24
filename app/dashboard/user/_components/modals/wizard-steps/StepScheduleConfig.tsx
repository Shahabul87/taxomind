"use client";

import React, { useEffect } from "react";
import { format, addWeeks } from "date-fns";
import { Calendar, Clock, CalendarDays, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { WizardData } from "./index";

interface StepScheduleConfigProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  isValid: boolean;
  onValidChange: (valid: boolean) => void;
}

const TIME_SLOTS = [
  { value: "morning", label: "Morning", description: "6 AM - 12 PM", emoji: "🌅" },
  { value: "afternoon", label: "Afternoon", description: "12 PM - 6 PM", emoji: "☀️" },
  { value: "evening", label: "Evening", description: "6 PM - 12 AM", emoji: "🌙" },
  { value: "flexible", label: "Flexible", description: "Any time", emoji: "⏰" },
] as const;

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
] as const;

export function StepScheduleConfig({
  data,
  onUpdate,
  isValid,
  onValidChange,
}: StepScheduleConfigProps) {
  // Initialize with defaults if not set
  useEffect(() => {
    if (!data.startDate) {
      onUpdate({ startDate: new Date() });
    }
    if (!data.targetEndDate) {
      onUpdate({ targetEndDate: addWeeks(new Date(), 8) });
    }
    if (!data.preferredTimeSlot) {
      onUpdate({ preferredTimeSlot: "flexible" });
    }
    if (!data.dailyStudyHours) {
      onUpdate({ dailyStudyHours: 2 });
    }
    if (!data.studyDays || data.studyDays.length === 0) {
      onUpdate({ studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"] });
    }
    if (data.includePractice === undefined) {
      onUpdate({ includePractice: true });
    }
    if (data.includeAssessments === undefined) {
      onUpdate({ includeAssessments: true });
    }
    if (data.includeProjects === undefined) {
      onUpdate({ includeProjects: false });
    }
  }, []);

  // Validate form
  useEffect(() => {
    const valid =
      !!data.startDate &&
      !!data.targetEndDate &&
      data.targetEndDate > data.startDate &&
      !!data.preferredTimeSlot &&
      data.dailyStudyHours > 0 &&
      data.studyDays?.length > 0;
    if (valid !== isValid) {
      onValidChange(valid);
    }
  }, [
    data.startDate,
    data.targetEndDate,
    data.preferredTimeSlot,
    data.dailyStudyHours,
    data.studyDays,
    isValid,
    onValidChange,
  ]);

  const toggleStudyDay = (day: string) => {
    const current = data.studyDays || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    onUpdate({ studyDays: updated });
  };

  const calculateWeeks = () => {
    if (!data.startDate || !data.targetEndDate) return 0;
    const diffTime = Math.abs(
      data.targetEndDate.getTime() - data.startDate.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const calculateTotalHours = () => {
    const weeks = calculateWeeks();
    const daysPerWeek = data.studyDays?.length || 5;
    return weeks * daysPerWeek * (data.dailyStudyHours || 2);
  };

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Start Date <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.startDate && "text-slate-500"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {data.startDate
                  ? format(data.startDate, "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[10000]" align="start">
              <CalendarComponent
                mode="single"
                selected={data.startDate}
                onSelect={(date) => date && onUpdate({ startDate: date })}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-rose-500" />
            Target End Date <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.targetEndDate && "text-slate-500"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {data.targetEndDate
                  ? format(data.targetEndDate, "PPP")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[10000]" align="start">
              <CalendarComponent
                mode="single"
                selected={data.targetEndDate}
                onSelect={(date) => date && onUpdate({ targetEndDate: date })}
                initialFocus
                disabled={(date) =>
                  date <= (data.startDate || new Date())
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Study Plan Duration
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {calculateWeeks()} weeks
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Estimated Total
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {calculateTotalHours()} hours
            </p>
          </div>
        </div>
      </div>

      {/* Preferred Time Slot */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-amber-500" />
          Preferred Study Time <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => onUpdate({ preferredTimeSlot: slot.value })}
              className={cn(
                "p-3 rounded-xl border-2 text-center transition-all duration-200",
                data.preferredTimeSlot === slot.value
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-amber-300"
              )}
            >
              <span className="text-xl block mb-1">{slot.emoji}</span>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                {slot.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {slot.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Study Hours */}
      <div>
        <Label className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" />
            Daily Study Hours
          </span>
          <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
            {data.dailyStudyHours || 2} hrs/day
          </span>
        </Label>
        <Slider
          value={[data.dailyStudyHours || 2]}
          onValueChange={([value]) => onUpdate({ dailyStudyHours: value })}
          min={0.5}
          max={6}
          step={0.5}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>30 min</span>
          <span>6 hours</span>
        </div>
      </div>

      {/* Study Days */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <CalendarDays className="h-4 w-4 text-emerald-500" />
          Study Days <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleStudyDay(day.value)}
              className={cn(
                "flex-1 py-2.5 rounded-lg border-2 font-medium text-sm transition-all duration-200",
                data.studyDays?.includes(day.value)
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300"
              )}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Preferences */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <CheckSquare className="h-4 w-4 text-rose-500" />
          Include in Plan
        </Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                Practice Exercises
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hands-on coding or problem-solving tasks
              </p>
            </div>
            <Switch
              checked={data.includePractice ?? true}
              onCheckedChange={(checked) =>
                onUpdate({ includePractice: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                Quizzes & Assessments
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Knowledge checks and self-assessments
              </p>
            </div>
            <Switch
              checked={data.includeAssessments ?? true}
              onCheckedChange={(checked) =>
                onUpdate({ includeAssessments: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">
                Project Milestones
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Build real projects to apply learning
              </p>
            </div>
            <Switch
              checked={data.includeProjects ?? false}
              onCheckedChange={(checked) =>
                onUpdate({ includeProjects: checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
