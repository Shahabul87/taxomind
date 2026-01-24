'use client';

/**
 * TaskScheduleModal Component
 *
 * Modal for scheduling a study session for a specific task.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarDays,
  Clock,
  BookOpen,
  Loader2,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SubGoal } from './StudySessionScheduler';

interface TaskScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: SubGoal | null;
  planTitle?: string;
  onSchedule: (data: {
    title: string;
    notes?: string;
    date: Date;
    startTime: string;
    duration: number;
    subGoalId?: string;
    syncToGoogleCalendar: boolean;
  }) => Promise<void>;
}

// Generate time slots (every 30 minutes)
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Format time for display
const formatTimeDisplay = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Quick duration options in minutes
const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hrs' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

export function TaskScheduleModal({
  isOpen,
  onClose,
  task,
  planTitle,
  onSchedule,
}: TaskScheduleModalProps) {
  // Form state
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [syncToGoogleCalendar, setSyncToGoogleCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setDate(new Date());
      setStartTime('09:00');
      setDuration(task.estimatedMinutes || 60);
      setNotes('');
      setSyncToGoogleCalendar(false);
    }
  }, [task]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setIsSubmitting(true);
    try {
      await onSchedule({
        title: task.title,
        notes: notes || undefined,
        date,
        startTime,
        duration,
        subGoalId: task.id,
        syncToGoogleCalendar,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate end time
  const getEndTime = (): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Schedule Study Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task Info */}
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {task.title}
                </h3>
                {planTitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    From: {planTitle}
                  </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Estimated: {task.estimatedMinutes || 60} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, 'EEEE, MMMM d, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDate(newDate);
                      setDatePickerOpen(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Time</Label>
              <Popover open={timePickerOpen} onOpenChange={setTimePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formatTimeDisplay(startTime)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0 z-[10000]" align="start">
                  <div className="h-64 overflow-y-auto p-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setStartTime(slot);
                          setTimePickerOpen(false);
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-sm text-left rounded-md transition-colors',
                          slot === startTime
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        {formatTimeDisplay(slot)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration</Label>
              <Input
                type="number"
                min={15}
                max={480}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDuration(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-colors',
                  duration === opt.value
                    ? 'bg-teal-100 border-teal-300 text-teal-700 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* End Time Display */}
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Session: {formatTimeDisplay(startTime)} → {formatTimeDisplay(getEndTime())} ({duration} min)
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or focus areas for this session..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Google Calendar Sync */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sync to Google Calendar
              </span>
            </div>
            <Switch
              checked={syncToGoogleCalendar}
              onCheckedChange={setSyncToGoogleCalendar}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Schedule Session
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TaskScheduleModal;
