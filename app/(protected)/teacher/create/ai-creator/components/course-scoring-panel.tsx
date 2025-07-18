"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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

  // Generate enhanced title suggestions with scoring
  const generateTitleSuggestions = useCallback(async () => {
    if (!formData.courseTitle || isGeneratingTitles) return;
    
    setIsGeneratingTitles(true);
    try {
      const response = await fetch('/api/sam/enhanced-title-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTitle: formData.courseTitle,
          overview: formData.courseShortOverview,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          intent: formData.courseIntent,
          targetAudience: formData.targetAudience,
          includeScoring: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setTitleSuggestions(result.suggestions || []);
      setShowTitleSuggestions(true);
    } catch (error) {
      console.error('Error generating title suggestions:', error);
      toast.error('Failed to generate title suggestions');
    } finally {
      setIsGeneratingTitles(false);
    }
  }, [formData.courseTitle, formData.courseShortOverview, formData.courseCategory, formData.courseSubcategory, formData.courseIntent, formData.targetAudience, isGeneratingTitles]);

  // Generate overview suggestions with web search
  const generateOverviewSuggestions = useCallback(async () => {
    if (!formData.courseTitle || isGeneratingOverviews) return;
    
    setIsGeneratingOverviews(true);
    try {
      const response = await fetch('/api/sam/enhanced-overview-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.courseTitle,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          intent: formData.courseIntent,
          targetAudience: formData.targetAudience,
          currentOverview: formData.courseShortOverview,
          includeWebSearch: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      setOverviewSuggestions(result.suggestions || []);
      setShowOverviewSuggestions(true);
    } catch (error) {
      console.error('Error generating overview suggestions:', error);
      toast.error('Failed to generate overview suggestions');
    } finally {
      setIsGeneratingOverviews(false);
    }
  }, [formData.courseTitle, formData.courseShortOverview, formData.courseCategory, formData.courseSubcategory, formData.courseIntent, formData.targetAudience, isGeneratingOverviews]);

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

  // Auto-generate title suggestions when title changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.courseTitle && formData.courseTitle.length >= 5 && !isGeneratingTitles) {
        generateTitleSuggestions();
        setShowTitleSuggestions(true);
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.courseTitle, generateTitleSuggestions, isGeneratingTitles]);

  // Auto-generate overview suggestions when title changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.courseTitle && formData.courseTitle.length >= 5 && !isGeneratingOverviews) {
        generateOverviewSuggestions();
        setShowOverviewSuggestions(true);
      }
    }, 2500); // Wait 2.5 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData.courseTitle, generateOverviewSuggestions, isGeneratingOverviews]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Course Quality Score with Glass Effect - Fixed Position */}
      <div className="sticky top-4 z-10">
        <Card className={cn(
          "p-4 border-2 transition-all duration-300 backdrop-blur-md shadow-xl",
          getScoreColor(courseScore)
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <h3 className="font-semibold text-sm">Course Quality Score</h3>
            </div>
            <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
              {getScoreLabel(courseScore)}
            </Badge>
          </div>
          
          <div className="text-center mb-3">
            <div className="text-3xl font-bold">{courseScore}/100</div>
            <Progress value={courseScore} className="h-2 mt-2" />
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Title Quality</span>
              <span>{Math.min(25, Math.max(0, (formData.courseTitle?.length || 0) > 15 ? 25 : (formData.courseTitle?.length || 0) > 10 ? 20 : (formData.courseTitle?.length || 0) > 5 ? 15 : (formData.courseTitle?.length || 0) > 0 ? 10 : 0))}/25</span>
            </div>
            <div className="flex justify-between">
              <span>Overview Quality</span>
              <span>{Math.min(35, Math.max(0, (formData.courseShortOverview?.length || 0) > 150 ? 35 : (formData.courseShortOverview?.length || 0) > 100 ? 30 : (formData.courseShortOverview?.length || 0) > 50 ? 25 : (formData.courseShortOverview?.length || 0) > 20 ? 15 : (formData.courseShortOverview?.length || 0) > 0 ? 10 : 0))}/35</span>
            </div>
            <div className="flex justify-between">
              <span>Category</span>
              <span>{formData.courseCategory ? 20 : 0}/20</span>
            </div>
            <div className="flex justify-between">
              <span>Subcategory</span>
              <span>{formData.courseSubcategory ? 10 : 0}/10</span>
            </div>
            <div className="flex justify-between">
              <span>Intent</span>
              <span>{formData.courseIntent ? 10 : 0}/10</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Scrollable AI Suggestions Container */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">

      {/* Title Suggestions with Glass Effect */}
      <Card className="p-4 backdrop-blur-md bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI Title Suggestions
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowTitleSuggestions(!showTitleSuggestions)}
          >
            {showTitleSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Intelligent Comment for Title */}
        <div className={`text-xs mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 ${generateIntelligentComments.titleColor}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
            <span className="font-medium">{generateIntelligentComments.title}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={generateTitleSuggestions}
            disabled={!formData.courseTitle || formData.courseTitle.length < 5 || isGeneratingTitles}
            className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
          >
            {isGeneratingTitles ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Wand2 className="h-3 w-3 mr-2" />Generate Titles</>
            )}
          </Button>
        </div>
        
        {showTitleSuggestions && (
          <div className="space-y-3">
            {titleSuggestions.map((suggestion, index) => (
                <div key={index} className="p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1 pr-2">
                      {suggestion.title}
                    </p>
                    <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/30">
                      {suggestion.overallScore}/100
                    </Badge>
                  </div>
                  
                  <div className="flex gap-1 mb-2">
                    <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-900/50 border-white/30">
                      <TrendingUp className="h-2 w-2 mr-1" />
                      Marketing: {suggestion.marketingScore}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-900/50 border-white/30">
                      <Award className="h-2 w-2 mr-1" />
                      Branding: {suggestion.brandingScore}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-white/50 dark:bg-slate-900/50 border-white/30">
                      <Star className="h-2 w-2 mr-1" />
                      Sales: {suggestion.salesScore}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {suggestion.reasoning}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyTitle(suggestion.title)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => insertTitle(suggestion.title)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
                      Insert
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Overview Suggestions with Glass Effect */}
      <Card className="p-4 backdrop-blur-md bg-gradient-to-r from-green-500/10 via-blue-500/10 to-cyan-500/10 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-green-600" />
            AI Overview Suggestions
          </h3>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowOverviewSuggestions(!showOverviewSuggestions)}
          >
            {showOverviewSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        
        {/* Intelligent Comment for Overview */}
        <div className={`text-xs mb-3 p-2 rounded-lg bg-white/30 dark:bg-slate-800/30 border border-white/20 ${generateIntelligentComments.overviewColor}`}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
            <span className="font-medium">{generateIntelligentComments.overview}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={generateOverviewSuggestions}
            disabled={!formData.courseTitle || formData.courseTitle.length < 5 || isGeneratingOverviews}
            className="flex-1 bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm"
          >
            {isGeneratingOverviews ? (
              <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Lightbulb className="h-3 w-3 mr-2" />Generate Overviews</>
            )}
          </Button>
        </div>
        
        {showOverviewSuggestions && (
          <div className="space-y-3">
            {overviewSuggestions.map((suggestion, index) => (
              <div key={index} className="p-3 backdrop-blur-sm bg-white/70 dark:bg-slate-800/70 rounded-lg border border-white/20 shadow-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                    {suggestion.overview}
                  </p>
                  <Badge variant="outline" className="text-xs bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300/30 ml-2 flex-shrink-0">
                    {suggestion.relevanceScore}/100
                  </Badge>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  {suggestion.reasoning}
                </p>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyOverview(suggestion.overview)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => insertOverview(suggestion.overview)} className="bg-white/50 dark:bg-slate-800/50 border-white/20 backdrop-blur-sm">
                    Insert
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      </div> {/* End of scrollable container */}
    </div>
  );
}