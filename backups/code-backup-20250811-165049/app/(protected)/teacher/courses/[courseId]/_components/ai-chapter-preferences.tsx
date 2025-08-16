"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseQuestionDifficulty } from "@/lib/ai-course-types";
import { logger } from '@/lib/logger';

export interface AIChapterGenerationPreferences {
  chapterCount: number;
  difficulty: CourseQuestionDifficulty;
  targetDuration: string;
  focusAreas: string[];
  includeKeywords?: string;
  additionalInstructions?: string;
}

interface AIChapterPreferencesDialogProps {
  onGenerate: (preferences: AIChapterGenerationPreferences) => Promise<void>;
  isGenerating: boolean;
  disabled?: boolean;
  courseTitle?: string;
  courseDescription?: string;
  trigger?: React.ReactNode;
}

const difficultyOptions = {
  [CourseQuestionDifficulty.BEGINNER]: { label: "Beginner", description: "Foundational concepts, step-by-step" },
  [CourseQuestionDifficulty.INTERMEDIATE]: { label: "Intermediate", description: "Building on basics, practical applications" },
  [CourseQuestionDifficulty.ADVANCED]: { label: "Advanced", description: "Complex topics, expert-level content" }
};

const durationOptions = [
  { value: "2-3 hours", label: "2-3 hours per chapter" },
  { value: "3-4 hours", label: "3-4 hours per chapter" },
  { value: "4-6 hours", label: "4-6 hours per chapter" },
  { value: "6-8 hours", label: "6-8 hours per chapter" },
  { value: "custom", label: "Custom duration" }
];

const focusAreaOptions = [
  "Practical Applications",
  "Theoretical Foundations",
  "Hands-on Projects",
  "Real-world Examples",
  "Industry Best Practices",
  "Problem Solving",
  "Case Studies",
  "Technical Skills",
  "Critical Thinking",
  "Creative Projects",
  "Professional Development",
  "Assessment & Evaluation"
];

export const AIChapterPreferencesDialog = ({
  onGenerate,
  isGenerating,
  disabled = false,
  courseTitle,
  courseDescription,
  trigger
}: AIChapterPreferencesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AIChapterGenerationPreferences>({
    chapterCount: 5,
    difficulty: CourseQuestionDifficulty.INTERMEDIATE,
    targetDuration: "3-4 hours",
    focusAreas: [],
    includeKeywords: "",
    additionalInstructions: ""
  });
  const [customDuration, setCustomDuration] = useState("");

  const handleGenerate = async () => {
    const finalPreferences = {
      ...preferences,
      targetDuration: preferences.targetDuration === "custom" ? customDuration : preferences.targetDuration
    };
    
    try {
      await onGenerate(finalPreferences);
      // Only close modal on successful completion
      setOpen(false);
    } catch (error) {
      logger.error('Chapter generation failed:', error);
      // Keep modal open on error to allow retry
      // The error will be handled by the parent component
    }
  };

  const toggleFocusArea = (area: string) => {
    setPreferences(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || isGenerating}
      className={cn(
        "text-purple-700 dark:text-purple-300",
        "border-purple-200 dark:border-purple-700",
        "hover:text-purple-800 dark:hover:text-purple-200",
        "hover:bg-purple-50 dark:hover:bg-purple-500/10",
        "w-full sm:w-auto",
        "justify-center"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Chapters with AI
        </>
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Generate Chapters with AI</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Generate multiple chapters automatically for your course.
            </span>
          </DialogDescription>
          {courseTitle && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700 mt-2">
              <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Course: {courseTitle}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Chapter Count */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Number of Chapters</Label>
            <Input
              type="number"
              placeholder="Enter number of chapters (2-20)"
              min="2"
              max="20"
              value={preferences.chapterCount}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value && value >= 2 && value <= 20) {
                  setPreferences(prev => ({ ...prev, chapterCount: value }));
                }
              }}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Difficulty Level</Label>
            <Select
              value={preferences.difficulty}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, difficulty: value as CourseQuestionDifficulty }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(difficultyOptions).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    {option.label} - {option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Duration */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Target Duration per Chapter</Label>
            <Select
              value={preferences.targetDuration}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, targetDuration: value }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {preferences.targetDuration === "custom" && (
              <div className="mt-2">
                <Input
                  placeholder="e.g., 2-3 hours, 45 minutes"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
            )}
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Focus Areas (Optional)</Label>
            <Input
              placeholder="e.g., Practical Applications, Hands-on Projects"
              value={preferences.focusAreas.join(", ")}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                focusAreas: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              }))}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-gray-700 dark:text-gray-300 font-medium">Include Keywords (Optional)</Label>
            <Input
              id="keywords"
              placeholder="e.g., React, JavaScript, web development"
              value={preferences.includeKeywords}
              onChange={(e) => setPreferences(prev => ({ ...prev, includeKeywords: e.target.value }))}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-gray-700 dark:text-gray-300 font-medium">Additional Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Any specific requirements for chapter generation..."
              value={preferences.additionalInstructions}
              onChange={(e) => setPreferences(prev => ({ ...prev, additionalInstructions: e.target.value }))}
              rows={3}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={() => {
              // Force close the modal
              setOpen(false);
            }}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {isGenerating ? "Stop & Close" : "Cancel"}
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || preferences.chapterCount < 2}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating {preferences.chapterCount} Chapters...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Generate {preferences.chapterCount} Chapters</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
