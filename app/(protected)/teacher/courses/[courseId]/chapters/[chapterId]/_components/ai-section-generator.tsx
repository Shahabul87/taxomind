"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, Brain, MessageSquare, Wand2, LayoutGrid, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface AISectionGeneratorProps {
  chapterTitle: string;
  courseId: string;
  chapterId: string;
  onGenerate: (sections: any[]) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export const AISectionGenerator = ({
  chapterTitle,
  courseId,
  chapterId,
  onGenerate,
  trigger,
  disabled = false
}: AISectionGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sectionCount, setSectionCount] = useState(0);
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");

  const handleGenerate = async () => {
    if (!chapterTitle) {
      toast.error("Chapter title is required for AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/chapter-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle,
          courseId,
          chapterId,
          sectionCount,
          userPrompt,
          focusArea
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate sections');
      }

      const data = await response.json();
      
      if (data.success && data.sections) {
        onGenerate(data.sections);
        toast.success(`${data.sections.length} sections generated successfully!`);
        setOpen(false);
        setUserPrompt("");
        setFocusArea("");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      logger.error('AI section generation error:', error);
      toast.error("Failed to generate sections. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const defaultTrigger = (
    <Button
      size="sm"
      disabled={disabled || !chapterTitle}
      className={cn(
        "h-9 sm:h-10 px-3 sm:px-4 w-full xs:w-auto",
        "bg-gradient-to-r from-sky-500 to-blue-500",
        "hover:from-sky-600 hover:to-blue-600",
        "text-white font-semibold text-xs sm:text-sm",
        "shadow-md hover:shadow-lg",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "justify-center xs:justify-start"
      )}
    >
      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
      <span className="whitespace-nowrap">Generate with AI</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg md:max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-slate-900 dark:text-slate-100">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="font-semibold">AI Section Generator</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Generate multiple chapter sections automatically using AI.
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-xs sm:text-sm bg-sky-50 dark:bg-sky-900/30 p-2.5 sm:p-3 rounded-lg border border-sky-200 dark:border-sky-700 mt-2">
            <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
            <span className="font-medium text-sky-800 dark:text-sky-200 truncate">
              Chapter: {chapterTitle || "Untitled Chapter"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
          {/* Section Count */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="section-count" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              Number of Sections
            </Label>

            {/* Counter with +/- buttons */}
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSectionCount(Math.max(0, sectionCount - 1))}
                disabled={sectionCount <= 0}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
              >
                <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
              </Button>

              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <div className="h-10 w-14 sm:h-12 sm:w-16 flex items-center justify-center bg-sky-50 dark:bg-sky-900/30 border-2 border-sky-200 dark:border-sky-700 rounded-lg">
                  <span className="text-xl sm:text-2xl font-bold text-sky-700 dark:text-sky-300">
                    {sectionCount}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">sections</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSectionCount(Math.min(10, sectionCount + 1))}
                disabled={sectionCount >= 10}
                className="h-9 w-9 sm:h-10 sm:w-10 p-0 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
              </Button>
            </div>

            <p className="text-[10px] sm:text-xs text-center text-slate-500 dark:text-slate-400 px-2">
              Use +/- buttons to select 0-10 sections
            </p>
          </div>

          {/* User Prompt */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="user-prompt" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="leading-tight">How would you like to structure the sections? (Optional)</span>
            </Label>
            <Textarea
              id="user-prompt"
              placeholder={`e.g., "Start with theory, then practical examples" or "Focus on hands-on exercises" or "Include lots of real-world examples"`}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="resize-none border-slate-300 dark:border-slate-600 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 w-full"
            />
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              Leave empty for default structure, or add specific instructions.
            </p>
          </div>

          {/* Focus Area */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="focus-area" className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              Specific Topic/Focus (Optional)
            </Label>
            <Input
              id="focus-area"
              placeholder="e.g., practical applications, theory fundamentals, etc."
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="border-slate-300 dark:border-slate-600 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-9 sm:h-10"
            />
          </div>

          {/* Preview */}
          {sectionCount > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 sm:mb-3">
                AI will generate {sectionCount} sections:
              </h4>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5 sm:space-y-2">
                {sectionCount >= 1 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-sky-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">Introduction and overview section</span>
                  </div>
                )}
                {sectionCount > 2 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">{Math.max(0, sectionCount - 2)} core content sections</span>
                  </div>
                )}
                {sectionCount >= 2 && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span className="break-words">Assessment/review section</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-2 sm:gap-3 pt-4 sm:pt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isGenerating}
            className={cn(
              "border-slate-300 dark:border-slate-600",
              "text-slate-700 dark:text-slate-300",
              "hover:bg-slate-50 dark:hover:bg-slate-800",
              "w-full xs:w-auto",
              "h-10 sm:h-9",
              "text-xs sm:text-sm",
              "justify-center xs:justify-start"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !chapterTitle || sectionCount < 1}
            className={cn(
              "bg-gradient-to-r from-sky-500 to-blue-500",
              "hover:from-sky-600 hover:to-blue-600",
              "text-white font-semibold",
              "px-4 sm:px-6 py-2",
              "shadow-md hover:shadow-lg transition-all",
              "w-full xs:w-auto",
              "h-10 sm:h-9",
              "text-xs sm:text-sm",
              "justify-center xs:justify-start",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span className="font-semibold whitespace-nowrap">Generating {sectionCount} Sections...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-semibold whitespace-nowrap">Generate {sectionCount} Sections</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
