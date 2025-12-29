"use client";

/**
 * SAM Learning Objectives Generator Modal
 *
 * A specialized AI-powered learning objectives generator that provides:
 * - Multiple learning objective suggestions using SAM AI
 * - Bloom's Taxonomy verb integration
 * - Action verb recommendations
 * - Bulk insert functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/lib/logger';
import {
  Sparkles,
  Wand2,
  Loader2,
  Check,
  Brain,
  Target,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ObjectiveSuggestion {
  objective: string;
  bloomsLevel: string;
  actionVerb: string;
}

interface SAMLearningObjectivesGeneratorModalProps {
  courseTitle: string;
  courseOverview?: string;
  courseCategory?: string;
  targetAudience?: string;
  difficulty?: string;
  existingObjectives?: string[];
  onAddObjectives: (objectives: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
  UNDERSTAND: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  APPLY: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  ANALYZE: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  EVALUATE: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  CREATE: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
};

export function SAMLearningObjectivesGeneratorModal({
  courseTitle,
  courseOverview,
  courseCategory,
  targetAudience,
  difficulty,
  existingObjectives = [],
  onAddObjectives,
  disabled = false,
  className,
}: SAMLearningObjectivesGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ObjectiveSuggestion[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  // Analysis of current state
  const objectivesAnalysis = useMemo(() => {
    const count = existingObjectives.length;

    if (count === 0) {
      return {
        message: "No objectives yet. Generate AI suggestions to get started",
        color: "text-slate-500 dark:text-slate-400",
        status: "empty"
      };
    } else if (count < 2) {
      return {
        message: "Add at least 2 objectives. AI can help generate more",
        color: "text-amber-600 dark:text-amber-400",
        status: "needs_more"
      };
    } else if (count < 5) {
      return {
        message: "Good progress! Consider adding more for comprehensive coverage",
        color: "text-blue-600 dark:text-blue-400",
        status: "good"
      };
    } else {
      return {
        message: "Excellent coverage! AI can suggest complementary objectives",
        color: "text-green-600 dark:text-green-400",
        status: "excellent"
      };
    }
  }, [existingObjectives]);

  // Generate learning objectives
  const generateObjectives = useCallback(async () => {
    if (!courseTitle || courseTitle.length < 5 || isGenerating) return;

    setIsGenerating(true);
    setSuggestions([]);
    setSelectedObjectives(new Set());

    try {
      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `As an expert instructional designer, generate 6 specific, measurable learning objectives for the course: "${courseTitle}"

Course Details:
- Overview: ${courseOverview || 'Not specified'}
- Category: ${courseCategory || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}
- Difficulty: ${difficulty || 'Intermediate'}
- Existing Objectives: ${existingObjectives.length > 0 ? existingObjectives.join('; ') : 'None yet'}

Requirements:
1. Each objective MUST start with a Bloom's Taxonomy action verb
2. Objectives should be specific, measurable, achievable, relevant, and time-bound (SMART)
3. Cover different cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
4. Avoid duplicating existing objectives
5. Focus on what students will be able to DO after completing the course

Return a JSON array with exactly 6 objectives in this format:
[
  {
    "objective": "Full learning objective statement starting with action verb",
    "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "actionVerb": "The action verb used (e.g., Define, Explain, Implement)"
  }
]

Return ONLY valid JSON array, no other text.`,
          context: {
            pageData: {
              pageType: 'course_creation',
              title: 'Learning Objectives Generator',
              forms: [],
              links: [],
            },
            learningContext: {
              userRole: 'teacher',
              currentCourse: {
                title: courseTitle,
                category: courseCategory,
              },
            },
            tutorPersonality: {
              tone: 'professional',
              teachingMethod: 'structured',
              responseStyle: 'concise',
            },
            emotion: 'neutral',
          },
          conversationHistory: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Parse objectives from response
      let parsedObjectives: ObjectiveSuggestion[] = [];

      try {
        const jsonMatch = result.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedObjectives = parsed.map((item: { objective: string; bloomsLevel?: string; actionVerb?: string }) => ({
            objective: item.objective,
            bloomsLevel: item.bloomsLevel || 'UNDERSTAND',
            actionVerb: item.actionVerb || item.objective.split(' ')[0],
          }));
        }
      } catch {
        // Fallback: extract objectives from text
        const lines = result.response.split('\n').filter((line: string) =>
          line.trim().length > 20 &&
          /^[A-Z]/.test(line.trim())
        );

        parsedObjectives = lines.slice(0, 6).map((line: string) => {
          const cleanLine = line.replace(/^[\d\-\.\)]+\s*/, '').trim();
          const firstWord = cleanLine.split(' ')[0];
          return {
            objective: cleanLine,
            bloomsLevel: detectBloomsLevel(firstWord),
            actionVerb: firstWord,
          };
        });
      }

      // If still no objectives, create fallback
      if (parsedObjectives.length === 0) {
        parsedObjectives = generateFallbackObjectives(courseTitle, difficulty || 'Intermediate');
      }

      // Filter out any that match existing objectives
      const filteredObjectives = parsedObjectives.filter(
        obj => !existingObjectives.some(
          existing => existing.toLowerCase().includes(obj.objective.toLowerCase().slice(0, 30))
        )
      );

      if (filteredObjectives.length > 0) {
        setSuggestions(filteredObjectives);
        toast.success(`Generated ${filteredObjectives.length} learning objective suggestions!`);
      } else {
        toast.info('All generated objectives already exist. Try regenerating for new ideas.');
      }
    } catch (error: unknown) {
      logger.error('Error generating learning objectives:', error);
      toast.error('Failed to generate objectives. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [courseTitle, courseOverview, courseCategory, targetAudience, difficulty, existingObjectives, isGenerating]);

  const toggleObjective = (index: number) => {
    setSelectedObjectives(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedObjectives.size === suggestions.length) {
      setSelectedObjectives(new Set());
    } else {
      setSelectedObjectives(new Set(suggestions.map((_, i) => i)));
    }
  };

  const handleAddSelected = () => {
    const objectivesToAdd = suggestions
      .filter((_, index) => selectedObjectives.has(index))
      .map(s => s.objective);

    if (objectivesToAdd.length > 0) {
      onAddObjectives(objectivesToAdd);
      toast.success(`Added ${objectivesToAdd.length} learning objective(s)!`);
      setOpen(false);
      setSuggestions([]);
      setSelectedObjectives(new Set());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !courseTitle || courseTitle.length < 5}
          className={cn(
            "h-9 sm:h-10 px-3 sm:px-4",
            "bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
            "hover:from-emerald-500/20 hover:to-teal-500/20",
            "border-emerald-200 dark:border-emerald-700",
            "text-emerald-700 dark:text-emerald-300",
            "font-medium text-xs sm:text-sm",
            "transition-all duration-200",
            "shadow-sm hover:shadow-md",
            className
          )}
        >
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Generate with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">AI Learning Objectives Generator</span>
            <Badge variant="outline" className="ml-2 text-xs">
              SAM Powered
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Generate SMART learning objectives using Bloom&apos;s Taxonomy action verbs
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Current State Display */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Course
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                  {courseTitle || "No title entered"}
                </p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {existingObjectives.length} objective(s)
              </Badge>
            </div>

            {/* Analysis Feedback */}
            <div className={cn(
              "mt-3 flex items-center gap-2 text-xs p-2 rounded-md",
              "bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
            )}>
              <Lightbulb className={cn("h-3.5 w-3.5 flex-shrink-0", objectivesAnalysis.color)} />
              <span className={cn("font-medium", objectivesAnalysis.color)}>
                {objectivesAnalysis.message}
              </span>
            </div>
          </div>

          {/* Generate Button */}
          {suggestions.length === 0 && (
            <div className="flex justify-center">
              <Button
                onClick={generateObjectives}
                disabled={isGenerating || !courseTitle || courseTitle.length < 5}
                className={cn(
                  "px-6 py-2.5",
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "hover:from-emerald-700 hover:to-teal-700",
                  "text-white font-medium",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-200"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Objectives...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Objectives
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-800" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                SAM AI is crafting SMART learning objectives...
              </p>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && !isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  AI-Generated Objectives
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    className="text-xs text-slate-600 hover:text-slate-800"
                  >
                    {selectedObjectives.size === suggestions.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateObjectives}
                    disabled={isGenerating}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => toggleObjective(index)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                      "hover:shadow-md",
                      selectedObjectives.has(index)
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-600"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedObjectives.has(index)}
                        onCheckedChange={() => toggleObjective(index)}
                        className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-medium", BLOOMS_COLORS[suggestion.bloomsLevel])}
                          >
                            {suggestion.bloomsLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                            {suggestion.actionVerb}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {suggestion.objective}
                        </p>
                      </div>
                      {selectedObjectives.has(index) && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedObjectives.size > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <Check className="h-4 w-4 inline mr-1" />
                    {selectedObjectives.size} objective(s) selected to add
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setSuggestions([]);
                setSelectedObjectives(new Set());
              }}
              disabled={isGenerating || suggestions.length === 0}
              className="text-slate-500 hover:text-slate-700"
            >
              Clear Results
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedObjectives.size === 0}
                className={cn(
                  "bg-gradient-to-r from-emerald-600 to-teal-600",
                  "hover:from-emerald-700 hover:to-teal-700",
                  "text-white font-medium px-4",
                  "shadow-md hover:shadow-lg",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Add Selected ({selectedObjectives.size})
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to detect Bloom's level from action verb
function detectBloomsLevel(verb: string): string {
  const verbLower = verb.toLowerCase();

  const bloomsVerbs: Record<string, string[]> = {
    REMEMBER: ['define', 'list', 'identify', 'name', 'recall', 'recognize', 'state', 'describe', 'match', 'label'],
    UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 'illustrate', 'paraphrase'],
    APPLY: ['apply', 'demonstrate', 'implement', 'use', 'execute', 'solve', 'practice', 'calculate', 'show', 'operate'],
    ANALYZE: ['analyze', 'examine', 'investigate', 'differentiate', 'organize', 'deconstruct', 'attribute', 'outline', 'structure'],
    EVALUATE: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'defend', 'argue', 'support', 'appraise', 'recommend'],
    CREATE: ['create', 'design', 'develop', 'construct', 'produce', 'invent', 'compose', 'formulate', 'generate', 'plan', 'build'],
  };

  for (const [level, verbs] of Object.entries(bloomsVerbs)) {
    if (verbs.includes(verbLower)) {
      return level;
    }
  }

  return 'UNDERSTAND';
}

// Fallback objective generator
function generateFallbackObjectives(courseTitle: string, difficulty: string): ObjectiveSuggestion[] {
  const templates = [
    { verb: 'Understand', level: 'UNDERSTAND', template: `Understand the fundamental concepts and principles of ${courseTitle}` },
    { verb: 'Apply', level: 'APPLY', template: `Apply learned techniques to solve real-world problems related to ${courseTitle}` },
    { verb: 'Analyze', level: 'ANALYZE', template: `Analyze complex scenarios and identify appropriate solutions using ${courseTitle} knowledge` },
    { verb: 'Create', level: 'CREATE', template: `Create original projects demonstrating mastery of ${courseTitle} concepts` },
    { verb: 'Evaluate', level: 'EVALUATE', template: `Evaluate different approaches and best practices in ${courseTitle}` },
    { verb: 'Implement', level: 'APPLY', template: `Implement industry-standard practices and methodologies for ${courseTitle}` },
  ];

  return templates.map(t => ({
    objective: t.template,
    bloomsLevel: t.level,
    actionVerb: t.verb,
  }));
}
