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
      console.error('AI section generation error:', error);
      toast.error("Failed to generate sections. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !chapterTitle}
      className={cn(
        "text-cyan-700 dark:text-cyan-300",
        "border-cyan-200 dark:border-cyan-700",
        "hover:text-cyan-800 dark:hover:text-cyan-200",
        "hover:bg-cyan-50 dark:hover:bg-cyan-500/10",
        "transition-all duration-200"
      )}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Generate Sections with AI
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <span className="font-semibold">AI Section Generator</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Generate multiple chapter sections automatically using AI.
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm bg-cyan-50 dark:bg-cyan-900/30 p-3 rounded-lg border border-cyan-200 dark:border-cyan-700 mt-2">
            <Wand2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="font-medium text-cyan-800 dark:text-cyan-200">
              Chapter: {chapterTitle || "Untitled Chapter"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Section Count */}
          <div className="space-y-3">
            <Label htmlFor="section-count" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
              <LayoutGrid className="h-4 w-4" />
              Number of Sections
            </Label>
            
            {/* Counter with +/- buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSectionCount(Math.max(0, sectionCount - 1))}
                disabled={sectionCount <= 0}
                className="h-10 w-10 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-16 flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/30 border-2 border-cyan-200 dark:border-cyan-700 rounded-lg">
                  <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                    {sectionCount}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">sections</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSectionCount(Math.min(10, sectionCount + 1))}
                disabled={sectionCount >= 10}
                className="h-10 w-10 p-0 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Use +/- buttons to select 0-10 sections
            </p>
          </div>

          {/* User Prompt */}
          <div className="space-y-2">
            <Label htmlFor="user-prompt" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
              <MessageSquare className="h-4 w-4" />
              How would you like to structure the sections? (Optional)
            </Label>
            <Textarea
              id="user-prompt"
              placeholder={`e.g., "Start with theory, then practical examples" or "Focus on hands-on exercises" or "Include lots of real-world examples"`}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="resize-none border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty for default structure, or add specific instructions.
            </p>
          </div>

          {/* Focus Area */}
          <div className="space-y-2">
            <Label htmlFor="focus-area" className="text-gray-700 dark:text-gray-300 font-medium">
              Specific Topic/Focus (Optional)
            </Label>
            <Input
              id="focus-area"
              placeholder="e.g., practical applications, theory fundamentals, etc."
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Preview */}
          {sectionCount > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                AI will generate {sectionCount} sections:
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {sectionCount >= 1 && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full flex-shrink-0"></div>
                    <span>Introduction and overview section</span>
                  </div>
                )}
                {sectionCount > 2 && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span>{Math.max(0, sectionCount - 2)} core content sections</span>
                  </div>
                )}
                {sectionCount >= 2 && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span>Assessment/review section</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 pt-6">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isGenerating}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !chapterTitle || sectionCount < 1}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating {sectionCount} Sections...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Generate {sectionCount} Sections</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
