"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CoursePlan {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  targetCompletionDate: string | null;
  daysPerWeek: number;
  timePerSession: number;
  difficultyLevel: string;
  courseType: string;
  learningGoals: string | null;
  studyReminders: boolean;
  progressCheckins: boolean;
  milestoneAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: string;
  createdAt: string;
}

interface UpdateCoursePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CoursePlan;
  onSuccess: (updatedPlan: CoursePlan) => void;
}

export function UpdateCoursePlanModal({ isOpen, onClose, plan, onSuccess }: UpdateCoursePlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: plan.title,
    description: plan.description || "",
    startDate: new Date(plan.startDate),
    targetCompletionDate: plan.targetCompletionDate ? new Date(plan.targetCompletionDate) : undefined,
    daysPerWeek: plan.daysPerWeek,
    timePerSession: plan.timePerSession,
    difficultyLevel: plan.difficultyLevel,
    courseType: plan.courseType,
    learningGoals: plan.learningGoals || "",
    status: plan.status,
    notifications: {
      studyReminders: plan.studyReminders,
      progressCheckins: plan.progressCheckins,
      milestoneAlerts: plan.milestoneAlerts,
    },
    syncToGoogleCalendar: plan.syncToGoogleCalendar,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/course-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate.toISOString(),
          targetCompletionDate: formData.targetCompletionDate?.toISOString() || null,
          daysPerWeek: formData.daysPerWeek,
          timePerSession: formData.timePerSession,
          difficultyLevel: formData.difficultyLevel,
          courseType: formData.courseType,
          learningGoals: formData.learningGoals || null,
          status: formData.status,
          studyReminders: formData.notifications.studyReminders,
          progressCheckins: formData.notifications.progressCheckins,
          milestoneAlerts: formData.notifications.milestoneAlerts,
          syncToGoogleCalendar: formData.syncToGoogleCalendar,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        toast.error(result.error?.message || "Failed to update course plan");
      }
    } catch (error) {
      console.error("Error updating course plan:", error);
      toast.error("Failed to update course plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Course Plan</DialogTitle>
          <DialogDescription>
            Modify your learning plan details and preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Plan Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Master React Development"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What do you want to achieve?"
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Target Completion</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.targetCompletionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.targetCompletionDate ? (
                        format(formData.targetCompletionDate, "PPP")
                      ) : (
                        <span>Optional</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.targetCompletionDate}
                      onSelect={(date) => setFormData({ ...formData, targetCompletionDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Study Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daysPerWeek">Days per Week *</Label>
                <Input
                  id="daysPerWeek"
                  type="number"
                  min="1"
                  max="7"
                  value={formData.daysPerWeek}
                  onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timePerSession">Minutes per Session *</Label>
                <Input
                  id="timePerSession"
                  type="number"
                  min="15"
                  max="480"
                  value={formData.timePerSession}
                  onChange={(e) => setFormData({ ...formData, timePerSession: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Difficulty & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty Level *</Label>
                <Select
                  value={formData.difficultyLevel}
                  onValueChange={(value) => setFormData({ ...formData, difficultyLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Course Type *</Label>
                <Select
                  value={formData.courseType}
                  onValueChange={(value) => setFormData({ ...formData, courseType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="READING">Reading</SelectItem>
                    <SelectItem value="PRACTICE">Practice</SelectItem>
                    <SelectItem value="MIXED">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Learning Goals */}
            <div className="space-y-2">
              <Label htmlFor="learningGoals">Learning Goals</Label>
              <Textarea
                id="learningGoals"
                value={formData.learningGoals}
                onChange={(e) => setFormData({ ...formData, learningGoals: e.target.value })}
                placeholder="What specific skills or knowledge do you want to gain?"
                rows={3}
              />
            </div>

            {/* Notifications */}
            <div className="space-y-3 border-t pt-4">
              <Label>Notifications</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="studyReminders" className="cursor-pointer">
                    Study Reminders
                  </Label>
                  <Switch
                    id="studyReminders"
                    checked={formData.notifications.studyReminders}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, studyReminders: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="progressCheckins" className="cursor-pointer">
                    Progress Check-ins
                  </Label>
                  <Switch
                    id="progressCheckins"
                    checked={formData.notifications.progressCheckins}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, progressCheckins: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="milestoneAlerts" className="cursor-pointer">
                    Milestone Alerts
                  </Label>
                  <Switch
                    id="milestoneAlerts"
                    checked={formData.notifications.milestoneAlerts}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, milestoneAlerts: checked },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Google Calendar */}
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="googleCalendar" className="cursor-pointer">
                  Sync to Google Calendar
                </Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Automatically add study sessions to your calendar
                </p>
              </div>
              <Switch
                id="googleCalendar"
                checked={formData.syncToGoogleCalendar}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, syncToGoogleCalendar: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
