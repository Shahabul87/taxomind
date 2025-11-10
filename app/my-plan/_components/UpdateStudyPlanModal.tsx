"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  weeklyHoursGoal: number;
  status: string;
  aiGenerated: boolean;
  aiPrompt: string | null;
  createdAt: string;
}

interface UpdateStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: StudyPlan;
  onSuccess: (updatedPlan: StudyPlan) => void;
}

export function UpdateStudyPlanModal({ isOpen, onClose, plan, onSuccess }: UpdateStudyPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: plan.title,
    description: plan.description || "",
    startDate: new Date(plan.startDate),
    endDate: new Date(plan.endDate),
    weeklyHoursGoal: plan.weeklyHoursGoal,
    status: plan.status,
    aiPrompt: plan.aiPrompt || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.endDate <= formData.startDate) {
      toast.error("End date must be after start date");
      return;
    }

    if (formData.weeklyHoursGoal < 1 || formData.weeklyHoursGoal > 168) {
      toast.error("Weekly hours goal must be between 1 and 168");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/dashboard/study-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          weeklyHoursGoal: formData.weeklyHoursGoal,
          status: formData.status,
          aiPrompt: formData.aiPrompt || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
      } else {
        toast.error(result.error?.message || "Failed to update study plan");
      }
    } catch (error) {
      console.error("Error updating study plan:", error);
      toast.error("Failed to update study plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Study Plan</DialogTitle>
          <DialogDescription>
            Modify your study plan details and schedule
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
                placeholder="e.g., Deep Learning Study Plan"
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
                placeholder="What will you focus on in this study plan?"
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
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Weekly Hours Goal */}
            <div className="space-y-2">
              <Label htmlFor="weeklyHoursGoal">Weekly Hours Goal *</Label>
              <Input
                id="weeklyHoursGoal"
                type="number"
                min="1"
                max="168"
                value={formData.weeklyHoursGoal}
                onChange={(e) => setFormData({ ...formData, weeklyHoursGoal: parseInt(e.target.value) })}
                placeholder="e.g., 10"
                required
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Number of hours you plan to study each week (1-168)
              </p>
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

            {/* AI Prompt (Read-only if AI generated) */}
            {plan.aiGenerated && (
              <div className="space-y-2">
                <Label htmlFor="aiPrompt">AI Prompt (Original)</Label>
                <Textarea
                  id="aiPrompt"
                  value={formData.aiPrompt}
                  onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                  placeholder="The prompt used to generate this plan"
                  rows={3}
                  className="bg-purple-50 dark:bg-purple-900/20"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This plan was AI-generated. The original prompt is shown above.
                </p>
              </div>
            )}
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
