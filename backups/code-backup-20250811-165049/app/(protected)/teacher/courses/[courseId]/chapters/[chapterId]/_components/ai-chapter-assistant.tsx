"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, Brain, MessageSquare, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';

interface AIChapterAssistantProps {
  chapterTitle: string;
  type: "description" | "objectives";
  onGenerate: (content: string) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export const AIChapterAssistant = ({
  chapterTitle,
  type,
  onGenerate,
  trigger,
  disabled = false
}: AIChapterAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");

  const getDefaultPrompt = () => {
    if (type === "description") {
      return `Create a comprehensive description for this chapter that explains what students will learn and how it fits into the overall course.`;
    } else {
      return `Generate clear, measurable learning objectives that students will achieve after completing this chapter.`;
    }
  };

  const handleGenerate = async () => {
    if (!chapterTitle) {
      toast.error("Chapter title is required for AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/chapter-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle,
          type,
          userPrompt: userPrompt || getDefaultPrompt(),
          focusArea
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        onGenerate(data.content);
        toast.success(`Chapter ${type} generated successfully!`);
        setOpen(false);
        setUserPrompt("");
        setFocusArea("");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      logger.error('AI generation error:', error);
      toast.error(`Failed to generate ${type}. Please try again.`);
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
        "text-purple-700 dark:text-purple-300",
        "border-purple-200 dark:border-purple-700",
        "hover:text-purple-800 dark:hover:text-purple-200",
        "hover:bg-purple-50 dark:hover:bg-purple-500/10",
        "transition-all duration-200"
      )}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Generate with AI
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
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">AI Chapter Assistant</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Generate {type === "description" ? "description" : "learning objectives"} for your chapter using AI.
            </span>
          </DialogDescription>
          <div className="flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg border border-purple-200 dark:border-purple-700 mt-2">
            <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-800 dark:text-purple-200">
              Chapter: {chapterTitle || "Untitled Chapter"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Prompt */}
          <div className="space-y-2">
            <Label htmlFor="user-prompt" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
              <MessageSquare className="h-4 w-4" />
              What would you like to focus on? (Optional)
            </Label>
            <Textarea
              id="user-prompt"
              placeholder={`e.g., "Focus on practical applications" or "Make it beginner-friendly" or "Include real-world examples"`}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="resize-none border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use default AI prompt, or add specific instructions.
            </p>
          </div>

          {/* Focus Area */}
          <div className="space-y-2">
            <Label htmlFor="focus-area" className="text-gray-700 dark:text-gray-300 font-medium">Specific Topic/Focus (Optional)</Label>
            <Input
              id="focus-area"
              placeholder="e.g., JavaScript fundamentals, UI design principles, etc."
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">AI will generate:</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {type === "description" 
                ? "A comprehensive chapter description based on the title and your instructions"
                : "Clear, measurable learning objectives that align with the chapter content"}
            </p>
          </div>
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
            disabled={isGenerating || !chapterTitle}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Generate {type === "description" ? "Description" : "Objectives"}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
