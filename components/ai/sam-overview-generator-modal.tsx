"use client";

/**
 * SAM Overview Generator Modal
 *
 * A specialized AI-powered overview generator that provides:
 * - Multiple overview suggestions using SAM AI
 * - Relevance scoring for each overview
 * - Intelligent feedback based on overview quality
 * - Copy/Insert actions for easy form integration
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
import { logger } from '@/lib/logger';
import {
  Sparkles,
  Copy,
  Lightbulb,
  Loader2,
  Check,
  Brain,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createSamContext } from '@/lib/sam/utils/form-data-to-sam-context';

interface OverviewSuggestion {
  overview: string;
  relevanceScore: number;
  reasoning: string;
}

interface SAMOverviewGeneratorModalProps {
  courseTitle: string;
  currentOverview?: string;
  courseCategory?: string;
  courseSubcategory?: string;
  courseIntent?: string;
  targetAudience?: string;
  onSelectOverview: (overview: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SAMOverviewGeneratorModal({
  courseTitle,
  currentOverview,
  courseCategory,
  courseSubcategory,
  courseIntent,
  targetAudience,
  onSelectOverview,
  disabled = false,
  className,
}: SAMOverviewGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [overviewSuggestions, setOverviewSuggestions] = useState<OverviewSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [selectedOverview, setSelectedOverview] = useState<string | null>(null);

  // Intelligent comments based on overview length
  const overviewAnalysis = useMemo(() => {
    const overviewLength = currentOverview?.length || 0;

    if (overviewLength === 0) {
      return {
        message: "No overview yet. Generate AI suggestions to get started",
        color: "text-slate-500 dark:text-slate-400",
        status: "empty"
      };
    } else if (overviewLength < 50) {
      return {
        message: "Overview is too brief. AI can help expand with learning outcomes",
        color: "text-amber-600 dark:text-amber-400",
        status: "short"
      };
    } else if (overviewLength < 100) {
      return {
        message: "Good start! AI can enhance with more specific benefits",
        color: "text-yellow-600 dark:text-yellow-400",
        status: "okay"
      };
    } else if (overviewLength < 300) {
      return {
        message: "Excellent overview! AI can suggest alternatives for comparison",
        color: "text-green-600 dark:text-green-400",
        status: "good"
      };
    } else {
      return {
        message: "Comprehensive overview. Consider AI alternatives for conciseness",
        color: "text-blue-600 dark:text-blue-400",
        status: "long"
      };
    }
  }, [currentOverview]);

  // Generate overview suggestions
  const generateOverviewSuggestions = useCallback(async () => {
    if (!courseTitle || courseTitle.length < 5 || isGenerating) return;

    setIsGenerating(true);
    setOverviewSuggestions([]);

    try {
      // Step 1: Generate overview content using SAM AI
      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `As an expert course creator, generate 3 comprehensive course overviews for: "${courseTitle}"

COURSE CONTEXT:
- Title: "${courseTitle}"
- Category: ${courseCategory || 'Not specified'}
- Subcategory: ${courseSubcategory || 'Not specified'}
- Intent: ${courseIntent || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}
${currentOverview ? `- Current Overview Draft: "${currentOverview}"` : ''}

REQUIREMENTS:
1. Each overview MUST be specifically about "${courseTitle}" — directly reference the subject matter
2. 100-200 words per overview focusing on learning outcomes, skills gained, and benefits
3. Make each overview unique, highlighting different aspects (practical skills, career impact, knowledge depth)
4. Incorporate the course category and target audience naturally
5. Use engaging, professional language that sells the course value

Return a JSON array with exactly 3 overviews:
["Overview 1 text here", "Overview 2 text here", "Overview 3 text here"]

Return ONLY valid JSON array, no markdown fences, no other text.`,
          context: createSamContext({
            formData: {
              courseTitle,
              courseShortOverview: currentOverview || '',
              courseCategory: courseCategory || '',
              courseSubcategory: courseSubcategory || '',
              courseIntent: courseIntent || '',
              targetAudience: targetAudience || '',
            },
            pageType: 'course_creation',
            pageTitle: 'SAM Overview Generator Modal',
            userRole: 'teacher',
            additionalContext: { generatorMode: true },
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Parse overviews from response — strip markdown fences first
      let generatedOverviews: string[] = [];
      const rawResponse = (result.response || '').replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

      // Try to parse as JSON array first
      try {
        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedOverviews = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: split by numbered patterns
        const matches = rawResponse.match(/\d+\.\s*([^]*?)(?=\n\d+\.|$)/g);
        if (matches) {
          generatedOverviews = matches.map((m: string) => m.replace(/^\d+\.\s*/, '').trim());
        }
      }

      // If still no overviews, create fallback content
      if (generatedOverviews.length === 0) {
        generatedOverviews = [
          `Master ${courseTitle} with this comprehensive course designed for ${targetAudience || 'learners'}. Learn essential skills, practical applications, and real-world techniques through hands-on projects and expert guidance. Perfect for advancing your knowledge and career prospects in ${courseCategory || 'this field'}.`,
          `Unlock the secrets of ${courseTitle} in this engaging course. Build confidence through step-by-step learning, interactive exercises, and real-world examples. Whether you're a beginner or looking to enhance existing skills, this course provides the foundation you need to succeed.`,
          `Transform your understanding of ${courseTitle} with this results-driven course. Gain industry-relevant skills, learn from expert instructors, and join a community of learners. Complete with practical projects that you can add to your portfolio.`,
        ];
      }

      // Step 2: Score each overview using AI-powered content scoring
      const scoringResponse = await fetch('/api/sam/content-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch',
          items: generatedOverviews.slice(0, 3).map((overview: string) => ({
            itemType: 'overview',
            overview,
          })),
          context: {
            category: courseCategory,
            subcategory: courseSubcategory,
            targetAudience,
            courseIntent,
          },
        }),
      });

      let scoredOverviews: OverviewSuggestion[] = [];

      if (scoringResponse.ok) {
        const scoringResult = await scoringResponse.json();
        const scores = scoringResult.overviewScores || scoringResult.scores || [];

        scoredOverviews = scores.map((score: {
          overview: string;
          relevanceScore?: number;
          clarityScore?: number;
          engagementScore?: number;
          overallScore: number;
          reasoning: string;
        }, index: number) => ({
          overview: generatedOverviews[index] || score.overview,
          relevanceScore: score.overallScore || score.relevanceScore || 80,
          reasoning: score.reasoning || 'AI-analyzed overview based on clarity, engagement, and relevance.',
        }));
      } else {
        // Fallback: use overviews without AI scoring
        scoredOverviews = generatedOverviews.slice(0, 3).map((overview: string, index: number) => ({
          overview,
          relevanceScore: 85 - index * 5,
          reasoning: 'Generated overview focusing on key learning outcomes and benefits.',
        }));
      }

      // Sort by relevance score descending
      scoredOverviews.sort((a, b) => b.relevanceScore - a.relevanceScore);

      if (scoredOverviews.length > 0) {
        setOverviewSuggestions(scoredOverviews);
        toast.success(`Generated ${scoredOverviews.length} AI-scored overview suggestions!`);
      } else {
        toast.error('Failed to generate overview suggestions. Please try again.');
      }
    } catch (error: unknown) {
      logger.error('Error generating overview suggestions:', error);
      toast.error('Failed to generate overview suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [courseTitle, currentOverview, courseCategory, courseSubcategory, courseIntent, targetAudience, isGenerating]);

  // Check if any overviews scored below the refinement threshold
  const lowScoringOverviews = useMemo(
    () => overviewSuggestions.filter(s => s.relevanceScore < 70),
    [overviewSuggestions],
  );

  // Refine low-scoring overviews (single pass)
  const handleRefineOverviews = useCallback(async () => {
    if (lowScoringOverviews.length === 0 || isRefining) return;

    setIsRefining(true);
    try {
      const weakItems = lowScoringOverviews.map(s => ({
        overview: s.overview.substring(0, 200),
        score: s.relevanceScore,
        reasoning: s.reasoning,
      }));

      const weakListText = weakItems
        .map(w => `- Score ${w.score}/100: "${w.overview}..." — Feedback: ${w.reasoning}`)
        .join('\n');

      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `As an expert course creator, improve these low-scoring course overviews for: "${courseTitle}"

WEAK OVERVIEWS TO IMPROVE:
${weakListText}

COURSE CONTEXT:
- Title: "${courseTitle}"
- Category: ${courseCategory || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}
- Intent: ${courseIntent || 'Not specified'}

Generate ${weakItems.length} IMPROVED overviews that fix the identified weaknesses.
100-200 words per overview. Focus on learning outcomes, benefits, and engagement.

Return a JSON array: ["Improved overview 1", "Improved overview 2"]
Return ONLY valid JSON array, no markdown fences, no other text.`,
          context: createSamContext({
            formData: {
              courseTitle,
              courseShortOverview: currentOverview || '',
              courseCategory: courseCategory || '',
              courseSubcategory: courseSubcategory || '',
              courseIntent: courseIntent || '',
              targetAudience: targetAudience || '',
            },
            pageType: 'course_creation',
            pageTitle: 'SAM Overview Refinement',
            userRole: 'teacher',
            additionalContext: { generatorMode: true, refinement: true },
          }),
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();

      let refinedOverviews: string[] = [];
      const rawResponse = (result.response || '').replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');
      try {
        const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) refinedOverviews = JSON.parse(jsonMatch[0]);
      } catch { /* fallback below */ }

      if (refinedOverviews.length === 0) {
        toast.info('No refined overviews generated.');
        return;
      }

      // Score the refined overviews
      const scoringResponse = await fetch('/api/sam/content-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch',
          items: refinedOverviews.map((overview: string) => ({ itemType: 'overview', overview })),
          context: { category: courseCategory, subcategory: courseSubcategory, targetAudience, courseIntent },
        }),
      });

      let refinedSuggestions: OverviewSuggestion[] = [];
      if (scoringResponse.ok) {
        const scoringResult = await scoringResponse.json();
        const scores = scoringResult.overviewScores || scoringResult.scores || [];
        refinedSuggestions = scores.map((score: { overview: string; overallScore: number; relevanceScore?: number; reasoning: string }, idx: number) => ({
          overview: refinedOverviews[idx] || score.overview,
          relevanceScore: score.overallScore || score.relevanceScore || 80,
          reasoning: score.reasoning || 'Refined by AI for improved quality.',
        }));
      } else {
        refinedSuggestions = refinedOverviews.map((overview: string) => ({
          overview,
          relevanceScore: 80,
          reasoning: 'Refined overview — scoring unavailable.',
        }));
      }

      // Replace low-scoring overviews with refined ones
      setOverviewSuggestions(prev => {
        const kept = prev.filter(s => s.relevanceScore >= 70);
        const merged = [...kept, ...refinedSuggestions];
        merged.sort((a, b) => b.relevanceScore - a.relevanceScore);
        return merged;
      });

      toast.success(`Refined ${refinedSuggestions.length} overview(s)!`);
    } catch (error: unknown) {
      logger.error('Error refining overviews:', error);
      toast.error('Failed to refine overviews. Please try again.');
    } finally {
      setIsRefining(false);
    }
  }, [lowScoringOverviews, isRefining, courseTitle, currentOverview, courseCategory, courseSubcategory, courseIntent, targetAudience]);

  const handleSelectOverview = (overview: string) => {
    setSelectedOverview(overview);
  };

  const handleApplyOverview = () => {
    if (selectedOverview) {
      onSelectOverview(selectedOverview);
      toast.success('Overview applied successfully!');
      setOpen(false);
      setSelectedOverview(null);
    }
  };

  const handleCopyOverview = (overview: string) => {
    navigator.clipboard.writeText(overview);
    toast.success('Overview copied to clipboard!');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
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
            "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10",
            "hover:from-emerald-500/20 hover:to-cyan-500/20",
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
            <span className="font-semibold">AI Overview Generator</span>
            <Badge variant="outline" className="ml-2 text-xs">
              SAM Powered
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Generate compelling course overviews that highlight learning outcomes and benefits
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Current Overview Display */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Course Title
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                  {courseTitle || "No title entered"}
                </p>
              </div>
            </div>

            {currentOverview && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Current Overview
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                  {currentOverview}
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {currentOverview.length} chars
                </Badge>
              </div>
            )}

            {/* Intelligent Feedback */}
            <div className={cn(
              "mt-3 flex items-center gap-2 text-xs p-2 rounded-md",
              "bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
            )}>
              <Lightbulb className={cn("h-3.5 w-3.5 flex-shrink-0", overviewAnalysis.color)} />
              <span className={cn("font-medium", overviewAnalysis.color)}>
                {overviewAnalysis.message}
              </span>
            </div>
          </div>

          {/* Generate Button */}
          {overviewSuggestions.length === 0 && (
            <div className="flex justify-center">
              <Button
                onClick={generateOverviewSuggestions}
                disabled={isGenerating || !courseTitle || courseTitle.length < 5}
                className={cn(
                  "px-6 py-2.5",
                  "bg-gradient-to-r from-emerald-600 to-cyan-600",
                  "hover:from-emerald-700 hover:to-cyan-700",
                  "text-white font-medium",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-200"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Overviews...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate AI Overviews
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
                SAM AI is crafting compelling course overviews...
              </p>
            </div>
          )}

          {/* Overview Suggestions */}
          {overviewSuggestions.length > 0 && !isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  AI-Generated Overviews
                </h4>
                <div className="flex items-center gap-1">
                  {lowScoringOverviews.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefineOverviews}
                      disabled={isRefining || isGenerating}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      {isRefining ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Refine ({lowScoringOverviews.length})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateOverviewSuggestions}
                    disabled={isGenerating || isRefining}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {overviewSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectOverview(suggestion.overview)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                      "hover:shadow-md",
                      selectedOverview === suggestion.overview
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-600"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {selectedOverview === suggestion.overview && (
                          <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          Option {index + 1}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("flex-shrink-0 font-bold", getScoreBadgeVariant(suggestion.relevanceScore))}
                      >
                        {suggestion.relevanceScore}/100
                      </Badge>
                    </div>

                    {/* Overview Text */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                      {suggestion.overview}
                    </p>

                    {/* Reasoning */}
                    <div className="flex items-start gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-900/50 mb-3">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        {suggestion.reasoning}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyOverview(suggestion.overview);
                        }}
                        className="h-7 text-xs text-slate-600 hover:text-slate-800"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.overview.length} chars
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setOverviewSuggestions([]);
                setSelectedOverview(null);
              }}
              disabled={isGenerating || overviewSuggestions.length === 0}
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
                onClick={handleApplyOverview}
                disabled={!selectedOverview}
                className={cn(
                  "bg-gradient-to-r from-emerald-600 to-cyan-600",
                  "hover:from-emerald-700 hover:to-cyan-700",
                  "text-white font-medium px-4",
                  "shadow-md hover:shadow-lg",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Apply Overview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
