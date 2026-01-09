"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionData) => void;
}

export interface SessionData {
  title: string;
  notes?: string;
  startTime: Date;
  duration: number; // minutes
  syncToGoogleCalendar: boolean;
}

export function ScheduleSessionModal({
  isOpen,
  onClose,
  onSubmit,
}: ScheduleSessionModalProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    // Combine date and time
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        notes,
        startTime: startDateTime,
        duration: parseInt(duration),
        syncToGoogleCalendar: syncToGoogle,
      });

      setTitle("");
      setNotes("");
      setDate(undefined);
      setStartTime("09:00");
      setDuration("60");
      setSyncToGoogle(true);
      onClose();
    } catch (error) {
      console.error("Error scheduling session:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Schedule Session
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Block time for focused study
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">
              Session Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., React study session"
              className="mt-2"
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What will you work on?"
              rows={2}
              className="mt-2"
            />
          </div>

          <div>
            <Label>
              Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
                    !date && "text-slate-500"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Google Calendar Sync
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Add to your calendar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSyncToGoogle(!syncToGoogle)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                syncToGoogle ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  syncToGoogle ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
              disabled={isSubmitting || !title || !date}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
