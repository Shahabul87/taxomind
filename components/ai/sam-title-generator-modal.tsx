"use client";

/**
 * SAM Title Generator Modal
 *
 * A specialized AI-powered title generator that provides:
 * - Multiple title suggestions using SAM AI
 * - Marketing, Branding, and Sales scoring for each title (inline, single API call)
 * - Intelligent feedback based on title length
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
  Wand2,
  Loader2,
  TrendingUp,
  Award,
  Star,
  Check,
  Brain,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TitleSuggestion {
  title: string;
  marketingScore: number;
  brandingScore: number;
  salesScore: number;
  overallScore: number;
  reasoning: string;
  source?: 'ai' | 'heuristic';
}

interface SAMTitleGeneratorModalProps {
  currentTitle: string;
  courseOverview?: string;
  courseCategory?: string;
  courseSubcategory?: string;
  courseIntent?: string;
  targetAudience?: string;
  difficulty?: string;
  onSelectTitle: (title: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SAMTitleGeneratorModal({
  currentTitle,
  courseOverview,
  courseCategory,
  courseSubcategory,
  courseIntent,
  targetAudience,
  difficulty,
  onSelectTitle,
  disabled = false,
  className,
}: SAMTitleGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);

  // Intelligent comments based on title length
  const titleAnalysis = useMemo(() => {
    const titleLength = currentTitle?.length || 0;

    if (titleLength === 0) {
      return {
        message: "Enter a course title first to generate AI suggestions",
        color: "text-slate-500 dark:text-slate-400",
        status: "empty"
      };
    } else if (titleLength < 10) {
      return {
        message: "Title is too short. Add more descriptive words for better suggestions",
        color: "text-amber-600 dark:text-amber-400",
        status: "short"
      };
    } else if (titleLength < 15) {
      return {
        message: "Good start! AI can suggest more compelling alternatives",
        color: "text-yellow-600 dark:text-yellow-400",
        status: "okay"
      };
    } else if (titleLength < 60) {
      return {
        message: "Great title length! Perfect for AI optimization",
        color: "text-green-600 dark:text-green-400",
        status: "good"
      };
    } else {
      return {
        message: "Title might be long. AI will suggest concise alternatives",
        color: "text-blue-600 dark:text-blue-400",
        status: "long"
      };
    }
  }, [currentTitle]);

  // Generate title suggestions — single API call returns titles WITH scores
  const generateTitleSuggestions = useCallback(async () => {
    if (!currentTitle || currentTitle.length < 5 || isGenerating) return;

    setIsGenerating(true);
    setTitleSuggestions([]);

    try {
      const response = await fetch('/api/sam/title-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle,
          overview: courseOverview,
          category: courseCategory,
          subcategory: courseSubcategory,
          difficulty: difficulty || 'BEGINNER',
          intent: courseIntent,
          targetAudience,
          count: 5,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.error || 'Something went wrong. Please try again.';
        toast.error(message);
        return;
      }

      const result = await response.json();

      // Use inline scored titles from the merged API response
      const scoredTitles: Array<{
        title: string;
        marketingScore: number;
        brandingScore: number;
        salesScore: number;
        overallScore: number;
        reasoning: string;
      }> = result.scoredTitles || [];

      let suggestions: TitleSuggestion[];

      if (scoredTitles.length > 0) {
        // New format: scores are inline
        suggestions = scoredTitles.map(score => ({
          title: score.title,
          marketingScore: score.marketingScore ?? 75,
          brandingScore: score.brandingScore ?? 75,
          salesScore: score.salesScore ?? 75,
          overallScore: score.overallScore ?? 75,
          reasoning: score.reasoning || 'AI-analyzed title based on marketing effectiveness and audience appeal.',
          source: 'ai' as const,
        }));
      } else {
        // Fallback: legacy format with just titles array
        const generatedTitles: string[] = result.titles || [];
        suggestions = generatedTitles.map(title => ({
          title,
          marketingScore: 70,
          brandingScore: 70,
          salesScore: 70,
          overallScore: 70,
          reasoning: 'AI-generated title based on your course topic.',
          source: 'heuristic' as const,
        }));
      }

      if (suggestions.length === 0) {
        toast.error('No title suggestions generated. Try a different title.');
        return;
      }

      // Sort by overall score descending
      suggestions.sort((a, b) => b.overallScore - a.overallScore);

      setTitleSuggestions(suggestions);
      toast.success(`Generated ${suggestions.length} AI-scored title suggestions!`);
    } catch (error: unknown) {
      logger.error('Error generating title suggestions:', error);
      toast.error('Failed to generate title suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentTitle, courseOverview, courseCategory, courseSubcategory, courseIntent, targetAudience, difficulty, isGenerating]);

  // Check if any titles scored below the refinement threshold
  const lowScoringTitles = useMemo(
    () => titleSuggestions.filter(s => s.overallScore < 70),
    [titleSuggestions],
  );

  // Detect if scores are heuristic (AI scoring was unavailable)
  const hasHeuristicScores = useMemo(
    () => titleSuggestions.some(s => s.source === 'heuristic'),
    [titleSuggestions],
  );

  // Refine low-scoring titles — single API call returns titles WITH scores
  const handleRefineTitles = useCallback(async () => {
    if (lowScoringTitles.length === 0 || isRefining) return;

    setIsRefining(true);
    try {
      const weakTitles = lowScoringTitles.map(s => ({
        title: s.title,
        score: s.overallScore,
        issues: [
          s.marketingScore < 70 ? 'weak marketing appeal' : '',
          s.brandingScore < 70 ? 'weak branding' : '',
          s.salesScore < 70 ? 'weak sales impact' : '',
        ].filter(Boolean),
      }));

      const response = await fetch('/api/sam/title-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle,
          overview: courseOverview,
          category: courseCategory,
          subcategory: courseSubcategory,
          difficulty: difficulty || 'BEGINNER',
          intent: courseIntent,
          targetAudience,
          count: weakTitles.length,
          refinementContext: { weakTitles },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        toast.error(errorBody?.error || 'Something went wrong. Please try again.');
        return;
      }
      const result = await response.json();

      // Use inline scored titles from the merged API response
      const scoredTitles: Array<{
        title: string;
        marketingScore: number;
        brandingScore: number;
        salesScore: number;
        overallScore: number;
        reasoning: string;
      }> = result.scoredTitles || [];

      const refinedSuggestions: TitleSuggestion[] = scoredTitles.map(score => ({
        title: score.title,
        marketingScore: score.marketingScore ?? 75,
        brandingScore: score.brandingScore ?? 75,
        salesScore: score.salesScore ?? 75,
        overallScore: score.overallScore ?? 75,
        reasoning: score.reasoning || 'Refined by AI for improved quality.',
        source: 'ai' as const,
      }));

      if (refinedSuggestions.length === 0) {
        toast.info('No refined titles generated. The current titles may already be optimal.');
        return;
      }

      // Replace low-scoring titles with refined ones (only if refined score is better)
      setTitleSuggestions(prev => {
        const kept = prev.filter(s => s.overallScore >= 70);
        const merged = [...kept, ...refinedSuggestions];
        merged.sort((a, b) => b.overallScore - a.overallScore);
        return merged;
      });

      toast.success(`Refined ${refinedSuggestions.length} title(s)!`);
    } catch (error: unknown) {
      logger.error('Error refining titles:', error);
      toast.error('Failed to refine titles. Please try again.');
    } finally {
      setIsRefining(false);
    }
  }, [lowScoringTitles, isRefining, currentTitle, courseOverview, courseCategory, courseSubcategory, courseIntent, targetAudience, difficulty]);

  const handleSelectTitle = (title: string) => {
    setSelectedTitle(title);
  };

  const handleApplyTitle = () => {
    if (selectedTitle) {
      onSelectTitle(selectedTitle);
      toast.success('Title applied successfully!');
      setOpen(false);
      setSelectedTitle(null);
    }
  };

  const handleCopyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    toast.success('Title copied to clipboard!');
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
          disabled={disabled || !currentTitle || currentTitle.length < 5}
          className={cn(
            "h-9 sm:h-10 px-3 sm:px-4",
            "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
            "hover:from-purple-500/20 hover:to-pink-500/20",
            "border-purple-200 dark:border-purple-700",
            "text-purple-700 dark:text-purple-300",
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
            <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">AI Title Generator</span>
            <Badge variant="outline" className="ml-2 text-xs">
              SAM Powered
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            Generate compelling course titles optimized for marketing, branding, and sales
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Current Title Display */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Current Title
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                  {currentTitle || "No title entered"}
                </p>
              </div>
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {currentTitle?.length || 0} chars
              </Badge>
            </div>

            {/* Intelligent Feedback */}
            <div className={cn(
              "mt-3 flex items-center gap-2 text-xs p-2 rounded-md",
              "bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50"
            )}>
              <Lightbulb className={cn("h-3.5 w-3.5 flex-shrink-0", titleAnalysis.color)} />
              <span className={cn("font-medium", titleAnalysis.color)}>
                {titleAnalysis.message}
              </span>
            </div>
          </div>

          {/* Generate Button */}
          {titleSuggestions.length === 0 && (
            <div className="flex justify-center">
              <Button
                onClick={generateTitleSuggestions}
                disabled={isGenerating || !currentTitle || currentTitle.length < 5}
                className={cn(
                  "px-6 py-2.5",
                  "bg-gradient-to-r from-purple-600 to-pink-600",
                  "hover:from-purple-700 hover:to-pink-700",
                  "text-white font-medium",
                  "shadow-lg hover:shadow-xl",
                  "transition-all duration-200"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Titles...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate AI Titles
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 dark:border-purple-800" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                SAM AI is analyzing and generating optimized titles...
              </p>
            </div>
          )}

          {/* Title Suggestions */}
          {titleSuggestions.length > 0 && !isGenerating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI-Generated Titles
                </h4>
                <div className="flex items-center gap-1">
                  {lowScoringTitles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefineTitles}
                      disabled={isRefining || isGenerating}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      {isRefining ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Refine ({lowScoringTitles.length})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateTitleSuggestions}
                    disabled={isGenerating || isRefining}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              </div>

              {hasHeuristicScores && (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                  <Lightbulb className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Scores are estimated (AI scoring was unavailable). Regenerate for AI-powered scores.</span>
                </div>
              )}

              <div className="space-y-2.5">
                {titleSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectTitle(suggestion.title)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all duration-200",
                      "hover:shadow-md",
                      selectedTitle === suggestion.title
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-2 ring-purple-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-purple-300 dark:hover:border-purple-600"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {selectedTitle === suggestion.title && (
                          <Check className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words">
                          {suggestion.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {suggestion.source === 'heuristic' && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                            Est.
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("font-bold", getScoreBadgeVariant(suggestion.overallScore))}
                        >
                          {suggestion.overallScore}/100
                        </Badge>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-1 text-xs">
                        <TrendingUp className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">Marketing:</span>
                        <span className={cn("font-semibold", getScoreColor(suggestion.marketingScore))}>
                          {suggestion.marketingScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Award className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">Branding:</span>
                        <span className={cn("font-semibold", getScoreColor(suggestion.brandingScore))}>
                          {suggestion.brandingScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">Sales:</span>
                        <span className={cn("font-semibold", getScoreColor(suggestion.salesScore))}>
                          {suggestion.salesScore}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {suggestion.reasoning}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTitle(suggestion.title);
                        }}
                        className="h-7 text-xs text-slate-600 hover:text-slate-800"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
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
                setTitleSuggestions([]);
                setSelectedTitle(null);
              }}
              disabled={isGenerating || titleSuggestions.length === 0}
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
                onClick={handleApplyTitle}
                disabled={!selectedTitle}
                className={cn(
                  "bg-gradient-to-r from-purple-600 to-pink-600",
                  "hover:from-purple-700 hover:to-pink-700",
                  "text-white font-medium px-4",
                  "shadow-md hover:shadow-lg",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Apply Title
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
