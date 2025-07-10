"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIGenerationPreferences {
  length: "short" | "medium" | "long" | "custom";
  customLength?: number;
  tone: "professional" | "casual" | "engaging" | "academic";
  focusAreas: string[];
  targetAudience?: string;
  includeKeywords?: string;
  additionalInstructions?: string;
}

interface AIGenerationPreferencesDialogProps {
  type: "title" | "description" | "objectives";
  onGenerate: (preferences: AIGenerationPreferences) => Promise<void>;
  isGenerating: boolean;
  disabled?: boolean;
  trigger?: React.ReactNode;
}

const lengthOptions = {
  short: { label: "Short", description: "50-100 words", words: 75 },
  medium: { label: "Medium", description: "100-200 words", words: 150 },
  long: { label: "Long", description: "200-300 words", words: 250 },
  custom: { label: "Custom", description: "Specify word count", words: 0 }
};

const toneOptions = {
  professional: { label: "Professional", description: "Formal, business-oriented" },
  casual: { label: "Casual", description: "Friendly, conversational" },
  engaging: { label: "Engaging", description: "Exciting, motivational" },
  academic: { label: "Academic", description: "Educational, scholarly" }
};

const focusAreaOptions = {
  description: [
    "Practical Skills",
    "Theoretical Knowledge", 
    "Hands-on Projects",
    "Real-world Applications",
    "Industry Best Practices",
    "Step-by-step Learning",
    "Problem Solving",
    "Career Development"
  ],
  title: [
    "Skill-focused",
    "Outcome-based",
    "Beginner-friendly",
    "Advanced Level",
    "Comprehensive",
    "Quick Learning",
    "Certification Prep",
    "Professional Development"
  ],
  objectives: [
    "Skill Mastery",
    "Knowledge Acquisition",
    "Practical Application",
    "Critical Thinking",
    "Problem Solving",
    "Creative Projects",
    "Professional Skills",
    "Technical Proficiency"
  ]
};

export const AIGenerationPreferencesDialog = ({
  type,
  onGenerate,
  isGenerating,
  disabled = false,
  trigger
}: AIGenerationPreferencesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AIGenerationPreferences>({
    length: "medium",
    tone: "professional",
    focusAreas: [],
    targetAudience: "",
    includeKeywords: "",
    additionalInstructions: ""
  });

  const handleGenerate = async () => {
    await onGenerate(preferences);
    setOpen(false);
  };

  const toggleFocusArea = (area: string) => {
    setPreferences(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const getContentTypeLabel = () => {
    switch (type) {
      case "title": return "Course Title";
      case "description": return "Course Description";
      case "objectives": return "Learning Objectives";
      default: return "Content";
    }
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
        "hover:bg-purple-50 dark:hover:bg-purple-500/10"
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
          Generate with AI
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
            <span className="font-semibold">Generate {getContentTypeLabel()}</span>
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block text-gray-600 dark:text-gray-300">
              Customize how AI generates your {getContentTypeLabel().toLowerCase()}.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Length Selection */}
          {type !== "title" && (
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300 font-medium">Content Length</Label>
              <Select
                value={preferences.length}
                onValueChange={(value) => setPreferences(prev => ({ ...prev, length: value as any }))}
              >
                <SelectTrigger className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(lengthOptions).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.label} ({option.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {preferences.length === "custom" && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Enter word count (10-500)"
                    min="10"
                    max="500"
                    value={preferences.customLength || ""}
                    onChange={(e) => setPreferences(prev => ({ 
                      ...prev, 
                      customLength: parseInt(e.target.value) || undefined 
                    }))}
                    className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Tone & Style</Label>
            <Select
              value={preferences.tone}
              onValueChange={(value) => setPreferences(prev => ({ ...prev, tone: value as any }))}
            >
              <SelectTrigger className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(toneOptions).map(([key, option]) => (
                  <SelectItem key={key} value={key}>
                    {option.label} - {option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Focus Areas */}
          <div className="space-y-2">
            <Label className="text-gray-700 dark:text-gray-300 font-medium">Focus Areas (Optional)</Label>
            <Input
              placeholder="e.g., Practical Skills, Real-world Applications"
              value={preferences.focusAreas.join(", ")}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                focusAreas: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              }))}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="target-audience" className="text-gray-700 dark:text-gray-300 font-medium">Target Audience (Optional)</Label>
            <Input
              id="target-audience"
              placeholder="e.g., Beginner developers, Marketing professionals"
              value={preferences.targetAudience}
              onChange={(e) => setPreferences(prev => ({ ...prev, targetAudience: e.target.value }))}
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
              placeholder="Any specific requirements or style preferences..."
              value={preferences.additionalInstructions}
              onChange={(e) => setPreferences(prev => ({ ...prev, additionalInstructions: e.target.value }))}
              rows={2}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
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
            disabled={isGenerating}
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
                <span className="font-medium">Generate {getContentTypeLabel()}</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};