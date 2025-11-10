"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, GraduationCap, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface CreateCoursePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CoursePlanData) => void;
}

export interface CoursePlanData {
  title: string;
  description?: string;
  startDate: Date;
  targetCompletionDate?: Date;
  daysPerWeek: number;
  timePerSession: number; // minutes
  difficultyLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  courseType: "VIDEO" | "READING" | "PRACTICE" | "MIXED";
  learningGoals?: string;
  notifications: {
    studyReminders: boolean;
    progressCheckins: boolean;
    milestoneAlerts: boolean;
  };
  syncToGoogleCalendar: boolean;
}

export function CreateCoursePlanModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCoursePlanModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [targetCompletionDate, setTargetCompletionDate] = useState<Date>();
  const [daysPerWeek, setDaysPerWeek] = useState("3");
  const [timePerSession, setTimePerSession] = useState("60");
  const [difficultyLevel, setDifficultyLevel] = useState<"BEGINNER" | "INTERMEDIATE" | "ADVANCED">("BEGINNER");
  const [courseType, setCourseType] = useState<"VIDEO" | "READING" | "PRACTICE" | "MIXED">("MIXED");
  const [learningGoals, setLearningGoals] = useState("");
  const [studyReminders, setStudyReminders] = useState(true);
  const [progressCheckins, setProgressCheckins] = useState(true);
  const [milestoneAlerts, setMilestoneAlerts] = useState(true);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description,
        startDate,
        targetCompletionDate,
        daysPerWeek: parseInt(daysPerWeek),
        timePerSession: parseInt(timePerSession),
        difficultyLevel,
        courseType,
        learningGoals,
        notifications: {
          studyReminders,
          progressCheckins,
          milestoneAlerts,
        },
        syncToGoogleCalendar: syncToGoogle,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setStartDate(undefined);
      setTargetCompletionDate(undefined);
      setDaysPerWeek("3");
      setTimePerSession("60");
      setDifficultyLevel("BEGINNER");
      setCourseType("MIXED");
      setLearningGoals("");
      setStudyReminders(true);
      setProgressCheckins(true);
      setMilestoneAlerts(true);
      setSyncToGoogle(true);
      onClose();
    } catch (error) {
      console.error("Error creating course plan:", error);
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
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create Course Plan
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan your learning journey
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Basic Information
              </h3>

              <div>
                <Label htmlFor="title">
                  Course Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Advanced JavaScript Masterclass"
                  className="mt-2"
                  required
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you learn in this course?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty Level</Label>
                  <Select value={difficultyLevel} onValueChange={(value) => setDifficultyLevel(value as typeof difficultyLevel)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Course Type</Label>
                  <Select value={courseType} onValueChange={(value) => setCourseType(value as typeof courseType)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video-based</SelectItem>
                      <SelectItem value="READING">Reading-based</SelectItem>
                      <SelectItem value="PRACTICE">Hands-on Practice</SelectItem>
                      <SelectItem value="MIXED">Mixed Content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="learningGoals">Learning Goals</Label>
                <Textarea
                  id="learningGoals"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder="What do you want to achieve? (e.g., Build 3 projects, Master async programming...)"
                  rows={2}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Study Schedule
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !startDate && "text-slate-500"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Target Completion Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          !targetCompletionDate && "text-slate-500"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {targetCompletionDate ? format(targetCompletionDate, "PPP") : "Pick target date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={targetCompletionDate}
                        onSelect={setTargetCompletionDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="daysPerWeek">Days per Week</Label>
                  <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day/week</SelectItem>
                      <SelectItem value="2">2 days/week</SelectItem>
                      <SelectItem value="3">3 days/week</SelectItem>
                      <SelectItem value="4">4 days/week</SelectItem>
                      <SelectItem value="5">5 days/week</SelectItem>
                      <SelectItem value="6">6 days/week</SelectItem>
                      <SelectItem value="7">Every day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timePerSession">Time per Session</Label>
                  <Select value={timePerSession} onValueChange={setTimePerSession}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="180">3 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications & Reminders
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Study Reminders</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Get notified before each study session</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStudyReminders(!studyReminders)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      studyReminders ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        studyReminders ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Progress Check-ins</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Weekly summary of your progress</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProgressCheckins(!progressCheckins)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      progressCheckins ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        progressCheckins ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Milestone Alerts</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Celebrate when you hit milestones</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMilestoneAlerts(!milestoneAlerts)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      milestoneAlerts ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        milestoneAlerts ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Google Calendar Sync */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Google Calendar Sync</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Auto-schedule study sessions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncToGoogle(!syncToGoogle)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    syncToGoogle ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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
              className="bg-gradient-to-r from-indigo-500 to-violet-500"
              disabled={isSubmitting || !title || !startDate}
            >
              {isSubmitting ? "Creating..." : "Create Course Plan"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
