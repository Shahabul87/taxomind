"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  Code,
  FileQuestion,
  RotateCcw,
  RefreshCw,
  GripVertical,
  Edit3,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WizardData, GeneratedPlan, GeneratedWeek, GeneratedTask } from "./index";

interface StepAIPreviewProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  isValid: boolean;
  onValidChange: (valid: boolean) => void;
  generatedPlan: GeneratedPlan | null;
  onGeneratedPlanChange: (plan: GeneratedPlan | null) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

const TASK_TYPE_CONFIG = {
  LEARN: { icon: BookOpen, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30", label: "Learn" },
  PRACTICE: { icon: Code, color: "text-green-500 bg-green-100 dark:bg-green-900/30", label: "Practice" },
  ASSESS: { icon: FileQuestion, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30", label: "Quiz" },
  REVIEW: { icon: RotateCcw, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30", label: "Review" },
  PROJECT: { icon: Lightbulb, color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30", label: "Project" },
} as const;

export function StepAIPreview({
  data,
  onUpdate,
  isValid,
  onValidChange,
  generatedPlan,
  onGeneratedPlanChange,
  isGenerating,
  onGenerate,
}: StepAIPreviewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Validate - plan must be generated
  useEffect(() => {
    const valid = !!generatedPlan && generatedPlan.weeks.length > 0;
    if (valid !== isValid) {
      onValidChange(valid);
    }
  }, [generatedPlan, isValid, onValidChange]);

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleTaskReorder = (weekNumber: number, newTasks: GeneratedTask[]) => {
    if (!generatedPlan) return;
    const updatedWeeks = generatedPlan.weeks.map((week) =>
      week.weekNumber === weekNumber ? { ...week, tasks: newTasks } : week
    );
    onGeneratedPlanChange({ ...generatedPlan, weeks: updatedWeeks });
  };

  const handleEditTask = (taskId: string, newTitle: string) => {
    if (!generatedPlan) return;
    const updatedWeeks = generatedPlan.weeks.map((week) => ({
      ...week,
      tasks: week.tasks.map((task) =>
        task.id === taskId ? { ...task, title: newTitle } : task
      ),
    }));
    onGeneratedPlanChange({ ...generatedPlan, weeks: updatedWeeks });
    setEditingTask(null);
  };

  const handleDeleteTask = (weekNumber: number, taskId: string) => {
    if (!generatedPlan) return;
    const updatedWeeks = generatedPlan.weeks.map((week) =>
      week.weekNumber === weekNumber
        ? { ...week, tasks: week.tasks.filter((t) => t.id !== taskId) }
        : week
    );
    // Update total tasks count
    const totalTasks = updatedWeeks.reduce((sum, w) => sum + w.tasks.length, 0);
    onGeneratedPlanChange({ ...generatedPlan, weeks: updatedWeeks, totalTasks });
  };

  if (!generatedPlan && !isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-purple-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Ready to Generate Your Plan
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-6">
          Based on your preferences, SAM AI will create a personalized study plan
          with daily tasks tailored to your learning style and goals.
        </p>
        <Button
          onClick={onGenerate}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Study Plan
        </Button>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-purple-500/30"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-2">
          SAM is Creating Your Plan...
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Analyzing your preferences and building a personalized study schedule
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan Summary Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            {generatedPlan?.planTitle}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Regenerate
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {generatedPlan?.totalWeeks}
            </p>
            <p className="text-xs text-slate-500">Weeks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {generatedPlan?.totalTasks}
            </p>
            <p className="text-xs text-slate-500">Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {generatedPlan?.estimatedHours.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">Hours</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {generatedPlan?.milestones.length}
            </p>
            <p className="text-xs text-slate-500">Milestones</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Drag tasks to reorder, click to edit titles, or delete tasks you don&apos;t need.
        </p>
      </div>

      {/* Weeks List */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {generatedPlan?.weeks.map((week) => (
          <div
            key={week.weekNumber}
            className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
          >
            {/* Week Header */}
            <button
              type="button"
              onClick={() => toggleWeek(week.weekNumber)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedWeeks.has(week.weekNumber) ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
                <div className="text-left">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Week {week.weekNumber}: {week.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {week.tasks.length} tasks
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from(new Set(week.tasks.map((t) => t.type))).map((type) => {
                  const config = TASK_TYPE_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className={cn("px-2 py-0.5", config.color)}
                    >
                      <Icon className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            </button>

            {/* Week Tasks */}
            <AnimatePresence>
              {expandedWeeks.has(week.weekNumber) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Reorder.Group
                    values={week.tasks}
                    onReorder={(tasks) => handleTaskReorder(week.weekNumber, tasks)}
                    className="p-2 space-y-2"
                  >
                    {week.tasks.map((task) => {
                      const config = TASK_TYPE_CONFIG[task.type];
                      const Icon = config.icon;
                      const isEditing = editingTask === task.id;

                      return (
                        <Reorder.Item
                          key={task.id}
                          value={task}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing",
                            "hover:shadow-md transition-shadow"
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <div className={cn("p-1.5 rounded-lg", config.color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  className="h-7 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleEditTask(task.id, editingTitle);
                                    } else if (e.key === "Escape") {
                                      setEditingTask(null);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleEditTask(task.id, editingTitle)}
                                  className="p-1 hover:bg-green-100 rounded"
                                >
                                  <Check className="h-4 w-4 text-green-500" />
                                </button>
                                <button
                                  onClick={() => setEditingTask(null)}
                                  className="p-1 hover:bg-red-100 rounded"
                                >
                                  <X className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                  Day {task.dayNumber}: {task.title}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  {task.description}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {task.estimatedMinutes}m
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-1.5",
                                task.difficulty === "EASY"
                                  ? "border-green-300 text-green-600"
                                  : task.difficulty === "MEDIUM"
                                  ? "border-amber-300 text-amber-600"
                                  : "border-red-300 text-red-600"
                              )}
                            >
                              {task.difficulty.toLowerCase()}
                            </Badge>
                            {!isEditing && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingTask(task.id);
                                    setEditingTitle(task.title);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(week.weekNumber, task.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                </button>
                              </>
                            )}
                          </div>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Milestones */}
      {generatedPlan?.milestones && generatedPlan.milestones.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <h4 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
            🏆 Milestones
          </h4>
          <div className="space-y-2">
            {generatedPlan.milestones.map((milestone, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-slate-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-300">
                  W{milestone.afterWeek}
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {milestone.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
