"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar, Plus, Trash2 } from "lucide-react";
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

interface SetGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalData) => void;
}

export interface GoalData {
  title: string;
  description?: string;
  type: "COURSE_COMPLETION" | "SKILL_MASTERY" | "TIME_MILESTONE" | "GRADE_TARGET" | "CERTIFICATION" | "CUSTOM";
  targetDate: Date;
  milestones: { title: string; targetDate: Date }[];
}

export function SetGoalModal({ isOpen, onClose, onSubmit }: SetGoalModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GoalData["type"]>("COURSE_COMPLETION");
  const [targetDate, setTargetDate] = useState<Date>();
  const [milestones, setMilestones] = useState<{ title: string; targetDate: Date | undefined }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMilestone = () => {
    setMilestones([...milestones, { title: "", targetDate: undefined }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: "title" | "targetDate", value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !targetDate) return;

    const validMilestones = milestones.filter(m => m.title && m.targetDate);

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description,
        type,
        targetDate,
        milestones: validMilestones as { title: string; targetDate: Date }[],
      });

      // Reset form
      setTitle("");
      setDescription("");
      setType("COURSE_COMPLETION");
      setTargetDate(undefined);
      setMilestones([]);
      onClose();
    } catch (error) {
      console.error("Error creating goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Set Goal
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track your progress with milestones
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Goal Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Complete React Certification"
              className="mt-2"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What do you want to achieve?"
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Type and Target Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">
                Goal Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={(val) => setType(val as any)}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COURSE_COMPLETION">Course Completion</SelectItem>
                  <SelectItem value="SKILL_MASTERY">Skill Mastery</SelectItem>
                  <SelectItem value="TIME_MILESTONE">Time Milestone</SelectItem>
                  <SelectItem value="GRADE_TARGET">Grade Target</SelectItem>
                  <SelectItem value="CERTIFICATION">Certification</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Target Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !targetDate && "text-slate-500"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Milestones (Optional)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addMilestone}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </div>

            <AnimatePresence>
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <Input
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, "title", e.target.value)}
                        placeholder="Milestone title..."
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !milestone.targetDate && "text-slate-500"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {milestone.targetDate ? format(milestone.targetDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={milestone.targetDate}
                            onSelect={(date) => updateMilestone(index, "targetDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Actions */}
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
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              disabled={isSubmitting || !title || !targetDate}
            >
              {isSubmitting ? "Creating..." : "Set Goal"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
