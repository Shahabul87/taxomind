"use client";

import React, { useEffect, useState } from "react";
import {
  Brain,
  Target,
  Lightbulb,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { WizardData } from "./index";

interface StepLearningProfileProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  isValid: boolean;
  onValidChange: (valid: boolean) => void;
}

const SKILL_LEVELS = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to this topic, starting from scratch",
    color: "from-green-400 to-emerald-500",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Have some foundational knowledge",
    color: "from-blue-400 to-indigo-500",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Solid understanding, looking to deepen expertise",
    color: "from-purple-400 to-violet-500",
  },
] as const;

const LEARNING_STYLES = [
  { value: "visual", label: "Visual", emoji: "👁️", description: "Learn through diagrams, videos, and visual aids" },
  { value: "reading", label: "Reading", emoji: "📖", description: "Learn through reading and documentation" },
  { value: "hands-on", label: "Hands-on", emoji: "🛠️", description: "Learn by building and practicing" },
  { value: "auditory", label: "Auditory", emoji: "🎧", description: "Learn through lectures and podcasts" },
] as const;

const PRIMARY_GOALS = [
  { value: "complete", label: "Complete Course", emoji: "✅", description: "Finish the entire curriculum" },
  { value: "master", label: "Master Topic", emoji: "🎓", description: "Deeply understand core concepts" },
  { value: "certify", label: "Get Certified", emoji: "📜", description: "Prepare for certification exam" },
  { value: "project", label: "Build Project", emoji: "🚀", description: "Apply skills to a real project" },
] as const;

const TARGET_MASTERY = [
  { value: "familiar", label: "Familiar", description: "Understand key concepts" },
  { value: "competent", label: "Competent", description: "Can apply with guidance" },
  { value: "proficient", label: "Proficient", description: "Can work independently" },
  { value: "expert", label: "Expert", description: "Can teach and innovate" },
] as const;

const MOTIVATIONS = [
  { value: "career", label: "Career Growth", emoji: "📈" },
  { value: "personal", label: "Personal Interest", emoji: "💡" },
  { value: "project", label: "Project Requirement", emoji: "📋" },
  { value: "curiosity", label: "Curiosity", emoji: "🔍" },
] as const;

export function StepLearningProfile({
  data,
  onUpdate,
  isValid,
  onValidChange,
}: StepLearningProfileProps) {
  const [priorKnowledgeInput, setPriorKnowledgeInput] = useState("");

  // Validate form
  useEffect(() => {
    const valid =
      !!data.skillLevel &&
      data.learningStyles.length > 0 &&
      !!data.primaryGoal &&
      !!data.targetMastery &&
      !!data.motivation;
    if (valid !== isValid) {
      onValidChange(valid);
    }
  }, [
    data.skillLevel,
    data.learningStyles,
    data.primaryGoal,
    data.targetMastery,
    data.motivation,
    isValid,
    onValidChange,
  ]);

  const toggleLearningStyle = (style: string) => {
    const current = data.learningStyles || [];
    const updated = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    onUpdate({ learningStyles: updated });
  };

  const addPriorKnowledge = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && priorKnowledgeInput.trim()) {
      e.preventDefault();
      const current = data.priorKnowledge || [];
      if (!current.includes(priorKnowledgeInput.trim())) {
        onUpdate({ priorKnowledge: [...current, priorKnowledgeInput.trim()] });
      }
      setPriorKnowledgeInput("");
    }
  };

  const removePriorKnowledge = (topic: string) => {
    const current = data.priorKnowledge || [];
    onUpdate({ priorKnowledge: current.filter((t) => t !== topic) });
  };

  return (
    <div className="space-y-6">
      {/* Skill Level */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-blue-500" />
          Current Skill Level <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {SKILL_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => onUpdate({ skillLevel: level.value })}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                data.skillLevel === level.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
              )}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full bg-gradient-to-r mb-2",
                  level.color
                )}
              />
              <p className="font-medium text-slate-900 dark:text-white">
                {level.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {level.description}
              </p>
              {data.skillLevel === level.value && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Learning Styles */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Learning Styles <span className="text-red-500">*</span>
          <span className="text-xs text-slate-500 ml-1">(Select all that apply)</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {LEARNING_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => toggleLearningStyle(style.value)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
                data.learningStyles?.includes(style.value)
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-amber-300"
              )}
            >
              <span className="text-xl">{style.emoji}</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {style.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  {style.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Prior Knowledge */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          Prior Knowledge
          <span className="text-xs text-slate-500">(Topics you already know)</span>
        </Label>
        <Input
          placeholder="Type a topic and press Enter..."
          value={priorKnowledgeInput}
          onChange={(e) => setPriorKnowledgeInput(e.target.value)}
          onKeyDown={addPriorKnowledge}
          className="mb-2"
        />
        {data.priorKnowledge && data.priorKnowledge.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.priorKnowledge.map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="pl-2.5 pr-1.5 py-1 flex items-center gap-1"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => removePriorKnowledge(topic)}
                  className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Primary Goal */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-rose-500" />
          Primary Goal <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {PRIMARY_GOALS.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => onUpdate({ primaryGoal: goal.value })}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-3",
                data.primaryGoal === goal.value
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-rose-300"
              )}
            >
              <span className="text-xl">{goal.emoji}</span>
              <div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {goal.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {goal.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Mastery & Motivation - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Target Mastery */}
        <div>
          <Label className="mb-2 block">
            Target Mastery <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            {TARGET_MASTERY.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onUpdate({ targetMastery: level.value })}
                className={cn(
                  "w-full p-2.5 rounded-lg border-2 text-left transition-all duration-200",
                  data.targetMastery === level.value
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-violet-300"
                )}
              >
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {level.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {level.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Motivation */}
        <div>
          <Label className="mb-2 block">
            Motivation <span className="text-red-500">*</span>
          </Label>
          <div className="space-y-2">
            {MOTIVATIONS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onUpdate({ motivation: m.value })}
                className={cn(
                  "w-full p-3 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3",
                  data.motivation === m.value
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                )}
              >
                <span className="text-lg">{m.emoji}</span>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {m.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
