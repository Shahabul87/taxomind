"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Loader2, Brain, MessageSquare, Target, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from '@/lib/logger';
import { Badge } from "@/components/ui/badge";

interface AISectionContentGeneratorProps {
  sectionTitle: string;
  chapterTitle: string;
  courseId: string;
  chapterId: string;
  sectionId: string;
  contentType: 'learningObjectives' | 'description';
  onGenerate: (content: string) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  existingContent?: string | null;
}

export const AISectionContentGenerator = ({
  sectionTitle,
  chapterTitle,
  courseId,
  chapterId,
  sectionId,
  contentType,
  onGenerate,
  trigger,
  disabled = false,
  existingContent
}: AISectionContentGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [focusArea, setFocusArea] = useState("");

  // Content type specific configurations
  const config = {
    learningObjectives: {
      icon: Target,
      color: 'indigo',
      title: 'AI Learning Objectives Generator',
      description: 'Generate clear, measurable learning objectives using Bloom&apos;s Taxonomy',
      buttonText: 'Generate Learning Objectives',
      promptPlaceholder: 'e.g., "Focus on practical skills", "Include assessment criteria", "Use beginner-friendly language"',
      focusPlaceholder: 'e.g., hands-on practice, theoretical foundations, real-world applications',
      previewTitle: 'Will generate:',
      previewItems: [
        'SMART learning objectives (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Action-oriented objectives using Bloom&apos;s Taxonomy verbs',
        '3-5 clear, distinct objectives formatted as bullet points',
        'Measurable outcomes aligned with section content'
      ]
    },
    description: {
      icon: FileText,
      color: 'blue',
      title: 'AI Section Description Generator',
      description: 'Create engaging, comprehensive section descriptions',
      buttonText: 'Generate Description',
      promptPlaceholder: 'e.g., "Add real-world examples", "Keep it concise", "Focus on practical benefits"',
      focusPlaceholder: 'e.g., beginner-friendly, industry applications, step-by-step approach',
      previewTitle: 'Will generate:',
      previewItems: [
        'Engaging hook to capture student interest',
        'Clear overview of section content and structure',
        'Real-world relevance and practical applications',
        'What students can expect to learn and accomplish'
      ]
    }
  };

  const currentConfig = config[contentType];
  const Icon = currentConfig.icon;

  const colorClasses = {
    indigo: {
      badge: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      outline: 'border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
      icon: 'text-indigo-600 dark:text-indigo-400'
    },
    blue: {
      badge: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      outline: 'border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10',
      icon: 'text-blue-600 dark:text-blue-400'
    }
  };

  const colors = colorClasses[currentConfig.color as 'indigo' | 'blue'];

  const handleGenerate = async () => {
    if (!sectionTitle) {
      toast.error("Section title is required for AI generation");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        sectionTitle,
        chapterTitle,
        courseId,
        chapterId,
        sectionId,
        contentType,
        userPrompt,
        focusArea,
        existingContent
      };

      logger.info('Sending request to AI API:', payload);

      const response = await fetch('/api/ai/section-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('API Error Response:', errorData);

        // Show detailed validation errors if available
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((err: any) =>
            `${err.path?.join('.') || 'field'}: ${err.message}`
          ).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }

        throw new Error(errorData.error || errorData.message || 'Failed to generate content');
      }

      const data = await response.json();

      if (data.success && data.content) {
        onGenerate(data.content);
        toast.success(`${contentType === 'learningObjectives' ? 'Learning objectives' : 'Description'} generated successfully!`);
        setOpen(false);
        setUserPrompt("");
        setFocusArea("");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      logger.error('AI content generation error:', error);
      const errorMessage = error.message || "Failed to generate content. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || !sectionTitle}
      className={cn(
        colors.outline,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className={cn("h-5 w-5", colors.icon)} />
            <span className="font-semibold">{currentConfig.title}</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              {currentConfig.description}
            </span>
          </DialogDescription>

          {/* Context Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className={cn("gap-1.5", colors.badge)}>
              <Icon className="h-3.5 w-3.5" />
              <span className="font-medium">Section: {sectionTitle || "Untitled"}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              <span className="font-medium">Chapter: {chapterTitle}</span>
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Prompt */}
          <div className="space-y-2">
            <Label htmlFor="user-prompt" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
              <MessageSquare className="h-4 w-4" />
              Custom Instructions (Optional)
            </Label>
            <Textarea
              id="user-prompt"
              placeholder={currentConfig.promptPlaceholder}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={3}
              className="resize-none border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Leave empty for default generation, or add specific instructions for customization.
            </p>
          </div>

          {/* Focus Area */}
          <div className="space-y-2">
            <Label htmlFor="focus-area" className="text-gray-700 dark:text-gray-300 font-medium">
              Specific Focus (Optional)
            </Label>
            <Input
              id="focus-area"
              placeholder={currentConfig.focusPlaceholder}
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Existing Content Warning */}
          {existingContent && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Existing content will be replaced</p>
                <p className="text-xs mt-0.5">The AI will generate new content. You can edit it before saving.</p>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Sparkles className={cn("h-4 w-4", colors.icon)} />
              {currentConfig.previewTitle}
            </h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              {currentConfig.previewItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    currentConfig.color === 'indigo' ? 'bg-indigo-500' : 'bg-blue-500'
                  )}></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
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
            disabled={isGenerating || !sectionTitle}
            className={cn(
              colors.button,
              "font-medium px-6 py-2 shadow-md hover:shadow-lg transition-all"
            )}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Generating...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">{currentConfig.buttonText}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
