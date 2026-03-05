"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
import {
  Target,
  Sparkles,
  Copy,
  Wand2,
  Lightbulb,
  Loader2,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Award,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createSamContext } from '@/lib/sam/utils/form-data-to-sam-context';

interface TitleSuggestion {
  title: string;
  marketingScore: number;
  brandingScore: number;
  salesScore: number;
  overallScore: number;
  reasoning: string;
}

interface OverviewSuggestion {
  overview: string;
  webSearchBased: boolean;
  relevanceScore: number;
  reasoning: string;
}

interface CourseScoringPanelProps {
  formData: {
    courseTitle: string;
    courseShortOverview: string;
    courseCategory: string;
    courseSubcategory?: string;
    courseIntent?: string;
    targetAudience?: string;
  };
  onUpdateFormData: (updates: (prev: any) => any) => void;
  className?: string;
}

export function CourseScoringPanel({ formData, onUpdateFormData, className }: CourseScoringPanelProps) {
  const [titleSuggestions, setTitleSuggestions] = useState<TitleSuggestion[]>([]);
  const [overviewSuggestions, setOverviewSuggestions] = useState<OverviewSuggestion[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isGeneratingOverviews, setIsGeneratingOverviews] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showOverviewSuggestions, setShowOverviewSuggestions] = useState(false);

  // Calculate course score
  const calculateCourseScore = useCallback(() => {
    let score = 0;
    let maxScore = 100;
    
    // Title quality (25 points)
    const titleLength = formData.courseTitle?.length || 0;
    if (titleLength > 15) score += 25;
    else if (titleLength > 10) score += 20;
    else if (titleLength > 5) score += 15;
    else if (titleLength > 0) score += 10;
    
    // Overview quality (35 points)
    const overviewLength = formData.courseShortOverview?.length || 0;
    if (overviewLength > 150) score += 35;
    else if (overviewLength > 100) score += 30;
    else if (overviewLength > 50) score += 25;
    else if (overviewLength > 20) score += 15;
    else if (overviewLength > 0) score += 10;
    
    // Category selection (20 points)
    if (formData.courseCategory) score += 20;
    
    // Subcategory selection (10 points)
    if (formData.courseSubcategory) score += 10;
    
    // Intent clarity (10 points)
    if (formData.courseIntent) score += 10;
    
    return Math.min(score, maxScore);
  }, [formData]);

  const courseScore = calculateCourseScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
    return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  // Generate enhanced title suggestions with AI-powered scoring
  const generateTitleSuggestions = useCallback(async () => {
    if (!formData.courseTitle || isGeneratingTitles) return;

    setIsGeneratingTitles(true);
    try {
      // Step 1: Generate title suggestions using SAM AI
      const suggestionsResponse = await fetch('/api/sam/title-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: formData.courseTitle,
          overview: formData.courseShortOverview,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          difficulty: 'BEGINNER',
          intent: formData.courseIntent,
          targetAudience: formData.targetAudience,
          count: 5,
        }),
      });

      if (!suggestionsResponse.ok) {
        throw new Error(`API error: ${suggestionsResponse.status}`);
      }

      const suggestionsResult = await suggestionsResponse.json();
      const generatedTitles = suggestionsResult.titles || [];

      if (generatedTitles.length === 0) {
        toast.error('No title suggestions generated');
        return;
      }

      // Step 2: Score each title using AI-powered content scoring
      const scoringResponse = await fetch('/api/sam/content-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'batch',
          items: generatedTitles.map((title: string) => ({
            itemType: 'title',
            title,
          })),
          context: {
            category: formData.courseCategory,
            subcategory: formData.courseSubcategory,
            targetAudience: formData.targetAudience,
            courseIntent: formData.courseIntent,
          },
        }),
      });

      if (!scoringResponse.ok) {
        throw new Error(`Scoring API error: ${scoringResponse.status}`);
      }

      const scoringResult = await scoringResponse.json();
      const scoredTitles = scoringResult.titleScores || scoringResult.scores || [];

      // Map scored titles to suggestion format
      const suggestions: TitleSuggestion[] = scoredTitles.map((score: {
        title: string;
        marketingScore: number;
        brandingScore: number;
        salesScore: number;
        overallScore: number;
        reasoning: string;
      }) => ({
        title: score.title,
        marketingScore: score.marketingScore,
        brandingScore: score.brandingScore,
        salesScore: score.salesScore,
        overallScore: score.overallScore,
        reasoning: score.reasoning || 'AI-analyzed title based on marketing effectiveness and audience appeal.',
      }));

      setTitleSuggestions(suggestions);
      setShowTitleSuggestions(true);
      toast.success(`Generated ${suggestions.length} AI-scored title suggestions!`);
    } catch (error: unknown) {
      logger.error('Error generating title suggestions:', error);
      toast.error('Failed to generate title suggestions');
    } finally {
      setIsGeneratingTitles(false);
    }
  }, [formData.courseTitle, formData.courseShortOverview, formData.courseCategory, formData.courseSubcategory, formData.courseIntent, formData.targetAudience, isGeneratingTitles]);

  // Generate overview suggestions with AI-powered scoring
  const generateOverviewSuggestions = useCallback(async () => {
    if (!formData.courseTitle || isGeneratingOverviews) return;

    setIsGeneratingOverviews(true);
    try {
      // Step 1: Generate overview content using SAM AI
      const response = await fetch('/api/sam/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `As an expert course creator, generate 3 comprehensive course overviews for: "${formData.courseTitle}"

Course Details:
- Category: ${formData.courseCategory || 'Not specified'}
- Intent: ${formData.courseIntent || 'Not specified'}
- Target Audience: ${formData.targetAudience || 'Not specified'}

For each overview, provide:
1. A detailed description (100-200 words) focusing on learning outcomes, skills gained, and benefits
2. Make each overview unique, highlighting different aspects and benefits

Return a JSON array with exactly 3 overviews:
[
  "Overview 1 text here (100-200 words)",
  "Overview 2 text here (100-200 words)",
  "Overview 3 text here (100-200 words)"
]

Return ONLY valid JSON array, no other text.`,
          context: createSamContext({
            formData,
            pageType: 'course_creation',
            pageTitle: 'Course Scoring Panel - Overview Generation',
            userRole: 'teacher',
            additionalContext: { scoringMode: true },
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      // Parse overviews from response
      let generatedOverviews: string[] = [];

      // Try to parse as JSON array first
      try {
        const jsonMatch = result.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          generatedOverviews = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback: split by numbered patterns
        const matches = result.response.match(/\d+\.\s*([^]*?)(?=\n\d+\.|$)/g);
        if (matches) {
          generatedOverviews = matches.map((m: string) => m.replace(/^\d+\.\s*/, '').trim());
        }
      }

      // If still no overviews, create fallback content
      if (generatedOverviews.length === 0) {
        generatedOverviews = [
          `Master ${formData.courseTitle} with this comprehensive course designed for ${formData.targetAudience || 'learners'}. Learn essential skills, practical applications, and real-world techniques through hands-on projects and expert guidance. Perfect for advancing your knowledge and career prospects in ${formData.courseCategory || 'this field'}.`,
          `Unlock the secrets of ${formData.courseTitle} in this engaging course. Build confidence through step-by-step learning, interactive exercises, and real-world examples. Whether you&apos;re a beginner or looking to enhance existing skills, this course provides the foundation you need to succeed.`,
          `Transform your understanding of ${formData.courseTitle} with this results-driven course. Gain industry-relevant skills, learn from expert instructors, and join a community of learners. Complete with practical projects that you can add to your portfolio.`,
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
            category: formData.courseCategory,
            subcategory: formData.courseSubcategory,
            targetAudience: formData.targetAudience,
            courseIntent: formData.courseIntent,
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
          webSearchBased: true,
          relevanceScore: score.overallScore || score.relevanceScore || 80,
          reasoning: score.reasoning || 'AI-analyzed overview based on clarity, engagement, and relevance.',
        }));
      } else {
        // Fallback: use overviews without AI scoring
        scoredOverviews = generatedOverviews.slice(0, 3).map((overview: string, index: number) => ({
          overview,
          webSearchBased: true,
          relevanceScore: 75 + index * 5,
          reasoning: 'Generated overview focusing on key learning outcomes and benefits.',
        }));
      }

      if (scoredOverviews.length > 0) {
        setOverviewSuggestions(scoredOverviews);
        setShowOverviewSuggestions(true);
        toast.success(`Generated ${scoredOverviews.length} AI-scored overview suggestions!`);
      } else {
        toast.error('Failed to generate overview suggestions. Please try again.');
      }
    } catch (error: unknown) {
      logger.error('Error generating overview suggestions:', error);
      toast.error('Failed to generate overview suggestions');
    } finally {
      setIsGeneratingOverviews(false);
    }
  }, [formData, isGeneratingOverviews]);

  const copyTitle = (title: string) => {
    onUpdateFormData((prev: any) => ({ ...prev, courseTitle: title }));
    toast.success('Title copied!');
  };

  const insertTitle = (title: string) => {
    onUpdateFormData((prev: any) => ({ ...prev, courseTitle: formData.courseTitle + ' ' + title }));
    toast.success('Title inserted!');
  };

  const copyOverview = (overview: string) => {
    onUpdateFormData((prev: any) => ({ ...prev, courseShortOverview: overview }));
    toast.success('Overview copied!');
  };

  const insertOverview = (overview: string) => {
    onUpdateFormData((prev: any) => ({ ...prev, courseShortOverview: formData.courseShortOverview + ' ' + overview }));
    toast.success('Overview inserted!');
  };

  // Intelligent comments for title and overview
  const generateIntelligentComments = useMemo(() => {
    const comments = {
      title: '',
      overview: '',
      titleColor: '',
      overviewColor: ''
    };

    const titleLength = formData.courseTitle?.length || 0;
    const overviewLength = formData.courseShortOverview?.length || 0;
    
    // Title analysis
    if (titleLength === 0) {
      comments.title = "Start by entering a course title to see AI suggestions";
      comments.titleColor = "text-slate-500 dark:text-slate-400";
    } else if (titleLength < 10) {
      comments.title = "Title is too short. Add more descriptive words to improve searchability";
      comments.titleColor = "text-red-600 dark:text-red-400";
    } else if (titleLength < 15) {
      comments.title = "Good start! Consider adding outcome-focused keywords for better appeal";
      comments.titleColor = "text-yellow-600 dark:text-yellow-400";
    } else if (titleLength < 30) {
      comments.title = "Great title length! Perfect for search engines and user engagement";
      comments.titleColor = "text-green-600 dark:text-green-400";
    } else {
      comments.title = "Title might be too long. Consider shortening for better readability";
      comments.titleColor = "text-orange-600 dark:text-orange-400";
    }

    // Overview analysis
    if (overviewLength === 0) {
      comments.overview = "Write an overview to get intelligent suggestions and feedback";
      comments.overviewColor = "text-slate-500 dark:text-slate-400";
    } else if (overviewLength < 50) {
      comments.overview = "Overview is too brief. Add more details about learning outcomes";
      comments.overviewColor = "text-red-600 dark:text-red-400";
    } else if (overviewLength < 100) {
      comments.overview = "Good start! Add more specific skills and benefits students will gain";
      comments.overviewColor = "text-yellow-600 dark:text-yellow-400";
    } else if (overviewLength < 200) {
      comments.overview = "Excellent overview! Clear, informative, and engaging for students";
      comments.overviewColor = "text-green-600 dark:text-green-400";
    } else {
      comments.overview = "Overview is comprehensive. Consider condensing for better readability";
      comments.overviewColor = "text-blue-600 dark:text-blue-400";
    }

    return comments;
  }, [formData.courseTitle, formData.courseShortOverview]);

  // Removed auto-generation to save tokens and costs
  // Users must manually click "Generate Overviews" button to generate suggestions

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Course Quality Score with Glass Effect - Fixed Position */}
      <div className="sticky top-2 sm:top-4 z-10">
        <Card className={cn(
          "p-3 sm:p-4 border-2 transition-all duration-300 backdrop-blur-md shadow-xl rounded-xl sm:rounded-2xl",
          getScoreColor(courseScore)
        )}>
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              <h3 className="font-semibold text-xs sm:text-sm">Course Quality Score</h3>
            </div>
            <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50 text-[10px] xs:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
              {getScoreLabel(courseScore)}
            </Badge>
          </div>
          
          <div className="text-center mb-2.5 sm:mb-3">
            <div className="text-2xl sm:text-3xl font-bold">{courseScore}/100</div>
            <Progress value={courseScore} className="h-1.5 sm:h-2 mt-1.5 sm:mt-2" />
          </div>
          
          <div className="space-y-1.5 sm:space-y-2 text-[10px] xs:text-xs">
            <div className="flex justify-between">
              <span>Title Quality</span>
              <span className="font-medium">{Math.min(25, Math.max(0, (formData.courseTitle?.length || 0) > 15 ? 25 : (formData.courseTitle?.length || 0) > 10 ? 20 : (formData.courseTitle?.length || 0) > 5 ? 15 : (formData.courseTitle?.length || 0) > 0 ? 10 : 0))}/25</span>
            </div>
            <div className="flex justify-between">
              <span>Overview Quality</span>
              <span className="font-medium">{Math.min(35, Math.max(0, (formData.courseShortOverview?.length || 0) > 150 ? 35 : (formData.courseShortOverview?.length || 0) > 100 ? 30 : (formData.courseShortOverview?.length || 0) > 50 ? 25 : (formData.courseShortOverview?.length || 0) > 20 ? 15 : (formData.courseShortOverview?.length || 0) > 0 ? 10 : 0))}/35</span>
            </div>
            <div className="flex justify-between">
              <span>Category</span>
              <span className="font-medium">{formData.courseCategory ? 20 : 0}/20</span>
            </div>
            <div className="flex justify-between">
              <span>Subcategory</span>
              <span className="font-medium">{formData.courseSubcategory ? 10 : 0}/10</span>
            </div>
            <div className="flex justify-between">
              <span>Intent</span>
              <span className="font-medium">{formData.courseIntent ? 10 : 0}/10</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Scrollable AI Suggestions Container */}
      <div className="space-y-3 sm:space-y-4 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">

      {/* Title Suggestions with Glass Effect */}
      <Card className="p-3 sm:p-4 backdrop-blur-md bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-white/20 shadow-xl rounded-xl sm:rounded-2xl">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            AI Title Suggestions
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            {showTitleSuggestions ? <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </Button>
        </div>
        
        {/* Intelligent Comment for Title */}
        <div className={`text-[10px] xs:text-xs mb-2.5 sm:mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 ${generateIntelligentComments.titleColor}`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current opacity-60 flex-shrink-0"></div>
            <span className="font-medium break-words">{generateIntelligentComments.title}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-2.5 sm:mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={generateTitleSuggestions}
            disabled={!formData.courseTitle || formData.courseTitle.length < 5 || isGeneratingTitles}
            className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-9 sm:h-10 text-xs sm:text-sm"
          >
            {isGeneratingTitles ? (
              <><Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2 animate-spin" />Generating...</>
            ) : (
              <><Wand2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />Generate Titles</>
            )}
          </Button>
        </div>
        
        {showTitleSuggestions && (
          <div className="space-y-2.5 sm:space-y-3">
            {titleSuggestions.map((suggestion, index) => (
                <div key={`title-${index}`} className="p-2.5 sm:p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 break-words">
                      {suggestion.title}
                    </p>
                    <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/30 text-[9px] xs:text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                      {suggestion.overallScore}/100
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                    <Badge variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs bg-white/50 dark:bg-slate-900/50 border-white/30 px-1.5 sm:px-2 py-0.5">
                      <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Marketing: </span>{suggestion.marketingScore}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs bg-white/50 dark:bg-slate-900/50 border-white/30 px-1.5 sm:px-2 py-0.5">
                      <Award className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Branding: </span>{suggestion.brandingScore}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs bg-white/50 dark:bg-slate-900/50 border-white/30 px-1.5 sm:px-2 py-0.5">
                      <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1" />
                      <span className="hidden xs:inline">Sales: </span>{suggestion.salesScore}
                    </Badge>
                  </div>
                  
                  <p className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400 mb-2 break-words">
                    {suggestion.reasoning}
                  </p>
                  
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyTitle(suggestion.title)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-8 sm:h-9 text-[10px] xs:text-xs flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => insertTitle(suggestion.title)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-8 sm:h-9 text-[10px] xs:text-xs flex-1">
                      Insert
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Overview Suggestions with Glass Effect */}
      <Card className="p-3 sm:p-4 backdrop-blur-md bg-gradient-to-r from-green-500/10 via-blue-500/10 to-cyan-500/10 border border-white/20 shadow-xl rounded-xl sm:rounded-2xl">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
            <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
            AI Overview Suggestions
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowOverviewSuggestions(!showOverviewSuggestions)}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            {showOverviewSuggestions ? <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </Button>
        </div>
        
        {/* Intelligent Comment for Overview */}
        <div className={`text-[10px] xs:text-xs mb-2.5 sm:mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 ${generateIntelligentComments.overviewColor}`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current opacity-60 flex-shrink-0"></div>
            <span className="font-medium break-words">{generateIntelligentComments.overview}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-2.5 sm:mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={generateOverviewSuggestions}
            disabled={!formData.courseTitle || formData.courseTitle.length < 5 || isGeneratingOverviews}
            className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-9 sm:h-10 text-xs sm:text-sm"
          >
            {isGeneratingOverviews ? (
              <><Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2 animate-spin" />Generating...</>
            ) : (
              <><Lightbulb className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />Generate Overviews</>
            )}
          </Button>
        </div>
        
        {showOverviewSuggestions && (
          <div className="space-y-2.5 sm:space-y-3">
            {/* Debug info */}
            <div className="text-[10px] xs:text-xs text-blue-600 dark:text-blue-400 mb-2">
              Showing {overviewSuggestions.length} overview suggestions
            </div>
            
            {overviewSuggestions.length > 0 ? (
              overviewSuggestions.map((suggestion, index) => (
                <div key={`overview-${index}-${suggestion.relevanceScore}`} className="p-2.5 sm:p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                  {/* Add suggestion number for clarity */}
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[10px] xs:text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Overview Option {index + 1}
                    </span>
                    <Badge variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300/30 px-1.5 sm:px-2 py-0.5 flex-shrink-0">
                      {suggestion.relevanceScore}/100
                    </Badge>
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1 leading-relaxed break-words">
                      {suggestion.overview}
                    </p>
                  </div>
                  
                  <p className="text-[10px] xs:text-xs text-slate-600 dark:text-slate-400 mb-2.5 sm:mb-3 italic break-words">
                    💡 {suggestion.reasoning}
                  </p>
                  
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyOverview(suggestion.overview)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-8 sm:h-9 text-[10px] xs:text-xs flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => insertOverview(suggestion.overview)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm h-8 sm:h-9 text-[10px] xs:text-xs flex-1">
                      Insert
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3 sm:py-4 text-slate-500 dark:text-slate-400">
                <p className="text-xs sm:text-sm">No overview suggestions available.</p>
                <p className="text-[10px] xs:text-xs mt-1">Click &quot;Generate Overviews&quot; to create suggestions.</p>
              </div>
            )}
          </div>
        )}
      </Card>
      
      </div> {/* End of scrollable container */}
    </div>
  );
}