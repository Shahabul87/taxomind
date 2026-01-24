"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, FileText, Calendar, Bell } from "lucide-react";
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

interface CreateBlogPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BlogPlanData) => void;
}

export interface BlogPlanData {
  title: string;
  description?: string;
  topics: string[];
  startPublishingDate: Date;
  postFrequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  specificDays?: string; // e.g., "Monday, Thursday"
  platform?: string;
  targetAudience?: string;
  contentGoal: "TRAFFIC" | "PORTFOLIO" | "MONETIZATION" | "KNOWLEDGE_SHARING";
  notifications: {
    writingReminders: boolean;
    publishingReminders: boolean;
    deadlineAlerts: boolean;
  };
  syncToGoogleCalendar: boolean;
}

export function CreateBlogPlanModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateBlogPlanModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [startPublishingDate, setStartPublishingDate] = useState<Date>();
  const [postFrequency, setPostFrequency] = useState<"DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY">("WEEKLY");
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentGoal, setContentGoal] = useState<"TRAFFIC" | "PORTFOLIO" | "MONETIZATION" | "KNOWLEDGE_SHARING">("KNOWLEDGE_SHARING");
  const [writingReminders, setWritingReminders] = useState(true);
  const [publishingReminders, setPublishingReminders] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [syncToGoogle, setSyncToGoogle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startPublishingDate) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description,
        topics: topics ? topics.split(",").map((t) => t.trim()) : [],
        startPublishingDate,
        postFrequency,
        specificDays: specificDays.join(", "),
        platform,
        targetAudience,
        contentGoal,
        notifications: {
          writingReminders,
          publishingReminders,
          deadlineAlerts,
        },
        syncToGoogleCalendar: syncToGoogle,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setTopics("");
      setStartPublishingDate(undefined);
      setPostFrequency("WEEKLY");
      setSpecificDays([]);
      setPlatform("");
      setTargetAudience("");
      setContentGoal("KNOWLEDGE_SHARING");
      setWritingReminders(true);
      setPublishingReminders(true);
      setDeadlineAlerts(true);
      setSyncToGoogle(true);
      onClose();
    } catch (error) {
      console.error("Error creating blog plan:", error);
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
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create Blog Plan
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan your content publishing journey
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
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Basic Information
              </h3>

              <div>
                <Label htmlFor="title">
                  Blog Series Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Mastering React Patterns"
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
                  placeholder="What will this blog series cover?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="topics">Topics</Label>
                <Input
                  id="topics"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="React, TypeScript, Performance (comma-separated)"
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform">Publishing Platform</Label>
                  <Input
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="E.g., Medium, Dev.to, Personal Blog"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Content Goal</Label>
                  <Select value={contentGoal} onValueChange={(value) => setContentGoal(value as typeof contentGoal)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRAFFIC">Increase Traffic</SelectItem>
                      <SelectItem value="PORTFOLIO">Build Portfolio</SelectItem>
                      <SelectItem value="MONETIZATION">Monetization</SelectItem>
                      <SelectItem value="KNOWLEDGE_SHARING">Knowledge Sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="E.g., Junior developers, Tech enthusiasts"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Publishing Schedule */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Publishing Schedule
              </h3>

              <div>
                <Label>
                  Start Publishing Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-2",
                        !startPublishingDate && "text-slate-500"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startPublishingDate ? format(startPublishingDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startPublishingDate}
                      onSelect={setStartPublishingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Post Frequency</Label>
                  <Select value={postFrequency} onValueChange={(value) => setPostFrequency(value as typeof postFrequency)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Specific Days</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-2",
                          specificDays.length === 0 && "text-slate-500"
                        )}
                      >
                        {specificDays.length > 0
                          ? specificDays.join(", ")
                          : "Select days"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 z-[10000]" align="start">
                      <div className="space-y-1">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                          <label
                            key={day}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={specificDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSpecificDays([...specificDays, day]);
                                } else {
                                  setSpecificDays(specificDays.filter((d) => d !== day));
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{day}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
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
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Writing Reminders</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Get notified 2 days before publish date</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWritingReminders(!writingReminders)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      writingReminders ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        writingReminders ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Publishing Reminders</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Notify on publishing day</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishingReminders(!publishingReminders)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      publishingReminders ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        publishingReminders ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">Deadline Alerts</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Alert if content isn&apos;t ready</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeadlineAlerts(!deadlineAlerts)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      deadlineAlerts ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        deadlineAlerts ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Google Calendar Sync */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Google Calendar Sync</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Auto-schedule writing & publishing dates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncToGoogle(!syncToGoogle)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    syncToGoogle ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-600"
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
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
              disabled={isSubmitting || !title || !startPublishingDate}
            >
              {isSubmitting ? "Creating..." : "Create Blog Plan"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
