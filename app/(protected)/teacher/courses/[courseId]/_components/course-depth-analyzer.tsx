"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logger } from '@/lib/logger';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  BarChart3,
  Lightbulb,
  BookOpen,
  Zap,
  ArrowRight,
  RefreshCw,
  Download,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsPyramidVisualization } from "./blooms-pyramid-visualization";
import { DepthInsightsPanel } from "./depth-insights-panel";
import { ImprovementRecommendations } from "./improvement-recommendations";
import { ChapterDepthAnalysis } from "./chapter-depth-analysis";
import { toast } from "sonner";
import { SamStandardsInfo, SamStandardsBadge } from "@/sam/components/integration/sam-standards-info";

interface CourseDepthAnalyzerProps {
  courseId: string;
  courseData: {
    title: string;
    description?: string;
    whatYouWillLearn?: string[];
    chapters: any[];
  };
  completionStatus?: any;
}

interface AnalysisData {
  overallDistribution: Record<string, number>;
  chapterAnalysis: Array<{
    chapterTitle: string;
    bloomsLevel: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  objectivesAnalysis: Array<{
    objective: string;
    bloomsLevel: string;
    actionVerb?: string;
    smartCriteria?: {
      specific: { score: number; feedback: string };
      measurable: { score: number; feedback: string };
      achievable: { score: number; feedback: string };
      relevant: { score: number; feedback: string };
      timeBound: { score: number; feedback: string };
    };
    clarityScore?: number;
    verbStrength?: 'weak' | 'moderate' | 'strong';
    suggestions: string[];
    improvedVersion?: string;
  }>;
  scores: {
    depth: number;
    balance: number;
    complexity: number;
    completeness: number;
  };
  gaps: Array<{
    level: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    type: 'content' | 'structure' | 'activity' | 'assessment' | 'objectives';
    category?: string;
    title: string;
    description: string;
    impact?: string;
    effort?: 'low' | 'medium' | 'high';
    examples: string[];
    actionSteps?: string[];
  }>;
  insights?: string[];
  improvementPlan?: any;
  samEngineResults?: {
    bloomsAnalysis?: any;
    marketAnalysis?: any;
    qualityAnalysis?: any;
    completionAnalysis?: any;
  };
  bloomsInsights?: {
    dominantLevel: string;
    missingLevels: string[];
    balanceScore: number;
    improvementSuggestions: string[];
  };
}

export function CourseDepthAnalyzer({ courseId, courseData }: CourseDepthAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSamChat, setShowSamChat] = useState(false);
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Analyze course depth
  const analyzeCourse = useCallback(async (forceReanalyze = false) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/course-depth-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, forceReanalyze })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysisData(data.analysis);
      setIsCached(data.cached || false);
      setHasInitialAnalysis(true);
      
      if (data.cached) {
        toast.info('Loaded cached analysis (content unchanged)');
      } else {
        toast.success('Course analysis completed successfully!');
      }
    } catch (error: any) {
      logger.error('Analysis error:', error);
      toast.error('Failed to analyze course depth');
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseId]);

  // Removed auto-analysis on mount to save tokens
  // User must click "Analyze Course" or "Re-analyze" button to trigger analysis

  // Calculate overall score
  const overallScore = analysisData 
    ? Math.round((analysisData.scores.depth + analysisData.scores.balance + 
                  analysisData.scores.complexity + analysisData.scores.completeness) / 4)
    : 0;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return '';
    }
  };

  // Export analysis report
  const exportReport = () => {
    if (!analysisData) return;
    
    const report = {
      courseTitle: courseData.title,
      analysisDate: new Date().toISOString(),
      ...analysisData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-depth-analysis-${courseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analysis report exported successfully!');
  };

  // Open SAM chat with context
  const askSam = (context?: string) => {
    const message = context || 
      `Help me improve my course based on the depth analysis. The course currently has a depth score of ${overallScore}/100.`;
    
    // Dispatch event for SAM
    window.dispatchEvent(new CustomEvent('sam-context-message', {
      detail: {
        message,
        context: {
          analysisData,
          courseData
        }
      }
    }));
    
    setShowSamChat(true);
  };

  return (
    <div className="w-full relative">
      {/* Floating Background Orbs - Hidden on mobile */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-400/25 to-cyan-400/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 shadow-2xl p-2.5 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 relative rounded-lg sm:rounded-xl md:rounded-2xl">
        {/* Cached Indicator */}
        {isCached && analysisData && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 md:top-4 md:left-4 flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-slate-900/60 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 rounded-full backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
            <CheckCircle2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="hidden sm:inline">Using cached analysis</span>
            <span className="sm:hidden">Cached</span>
          </div>
        )}
        
        {/* Header with Standards Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 md:gap-4 pt-5 sm:pt-6 md:pt-0">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
            <SamStandardsBadge />
            <SamStandardsInfo />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => analyzeCourse(true)} // Force re-analysis
              disabled={isAnalyzing}
              className="bg-white/60 dark:bg-slate-800/60 border-white/30 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2", isAnalyzing && "animate-spin")} />
              Re-analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              disabled={!analysisData}
              className="bg-white/60 dark:bg-slate-800/60 border-white/30 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => askSam()}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
            >
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Ask SAM</span>
              <span className="sm:hidden">SAM</span>
            </Button>
          </div>
        </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4">
          <div className="relative p-6 sm:p-8 rounded-xl sm:rounded-2xl backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-white/20 shadow-xl">
            <div className="relative">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
              </div>
            </div>
          </div>
          <div className="text-center px-4">
            <p className="text-base sm:text-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Analyzing course depth...
            </p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              This may take a few moments as we examine your content
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisData && !isAnalyzing && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Score Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <Card className="p-2.5 sm:p-3 md:p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Overall Score</h3>
                <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-1 sm:mt-1.5 md:mt-2", getScoreColor(overallScore))}>
                  {overallScore}/100
                </p>
                <Progress value={overallScore} className="mt-1 sm:mt-1.5 md:mt-2 h-1 sm:h-1.5 md:h-2" />
              </Card>
              
              <Card className="p-2.5 sm:p-3 md:p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Depth</h3>
                <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-1 sm:mt-1.5 md:mt-2", getScoreColor(analysisData.scores.depth))}>
                  {analysisData.scores.depth}
                </p>
                <Progress value={analysisData.scores.depth} className="mt-1 sm:mt-1.5 md:mt-2 h-1 sm:h-1.5 md:h-2" />
              </Card>
              
              <Card className="p-2.5 sm:p-3 md:p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Balance</h3>
                <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-1 sm:mt-1.5 md:mt-2", getScoreColor(analysisData.scores.balance))}>
                  {analysisData.scores.balance}
                </p>
                <Progress value={analysisData.scores.balance} className="mt-1 sm:mt-1.5 md:mt-2 h-1 sm:h-1.5 md:h-2" />
              </Card>
              
              <Card className="p-2.5 sm:p-3 md:p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Complexity</h3>
                <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mt-1 sm:mt-1.5 md:mt-2", getScoreColor(analysisData.scores.complexity))}>
                  {analysisData.scores.complexity}
                </p>
                <Progress value={analysisData.scores.complexity} className="mt-1 sm:mt-1.5 md:mt-2 h-1 sm:h-1.5 md:h-2" />
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="w-full overflow-x-auto scrollbar-hidden -mx-2 sm:mx-0 px-2 sm:px-0">
                <TabsList className="inline-flex w-full min-w-[500px] xs:min-w-[550px] sm:min-w-0 sm:grid sm:grid-cols-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 h-auto p-0.5 sm:p-1">
                  <TabsTrigger value="overview" className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600 flex-shrink-0 whitespace-nowrap">Overview</TabsTrigger>
                  <TabsTrigger value="chapters" className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600 flex-shrink-0 whitespace-nowrap">Chapters</TabsTrigger>
                  <TabsTrigger value="objectives" className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600 flex-shrink-0 whitespace-nowrap">Objectives</TabsTrigger>
                  <TabsTrigger value="recommendations" className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 xs:py-2 sm:py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600 flex-shrink-0 whitespace-nowrap">Recommendations</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
                {/* Course Health Score */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6">
                  <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-white/20 shadow-xl">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2.5 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Course Cognitive Health
                    </h3>
                    <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                      <div className="text-center">
                        <div className="relative inline-flex">
                          <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                            <svg className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallScore / 100)}`}
                                className={cn(
                                  "transition-all duration-1000",
                                  overallScore >= 80 ? "text-green-500" :
                                  overallScore >= 60 ? "text-yellow-500" :
                                  "text-red-500"
                                )}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={cn("text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold", getScoreColor(overallScore))}>
                                {overallScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-1.5 sm:mt-2 md:mt-3 text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Overall Course Quality
                        </p>
                      </div>
                      
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm">
                          <span>Cognitive Depth</span>
                          <span className={getScoreColor(analysisData.scores.depth)}>{analysisData.scores.depth}%</span>
                        </div>
                        <Progress value={analysisData.scores.depth} className="h-1 sm:h-1.5 md:h-2" />
                        
                        <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm">
                          <span>Content Balance</span>
                          <span className={getScoreColor(analysisData.scores.balance)}>{analysisData.scores.balance}%</span>
                        </div>
                        <Progress value={analysisData.scores.balance} className="h-1 sm:h-1.5 md:h-2" />
                        
                        <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm">
                          <span>Complexity Level</span>
                          <span className={getScoreColor(analysisData.scores.complexity)}>{analysisData.scores.complexity}%</span>
                        </div>
                        <Progress value={analysisData.scores.complexity} className="h-1 sm:h-1.5 md:h-2" />
                      </div>
                    </div>
                  </Card>

                  {/* Bloom's Insights */}
                  <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-white/20 shadow-xl">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2.5 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Bloom&apos;s Taxonomy Insights
                    </h3>
                    {analysisData.bloomsInsights ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-2.5 sm:p-3 md:p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
                          <p className="text-xs sm:text-sm font-medium mb-1">Dominant Level</p>
                          <Badge className="mb-1.5 sm:mb-2 text-[10px] xs:text-xs" variant="secondary">
                            {analysisData.bloomsInsights.dominantLevel}
                          </Badge>
                          <p className="text-[10px] xs:text-xs sm:text-xs text-gray-600 dark:text-gray-400 break-words">
                            Your course primarily focuses on {analysisData.bloomsInsights.dominantLevel.toLowerCase()} level activities
                          </p>
                        </div>
                        
                        {analysisData.bloomsInsights.missingLevels.length > 0 && (
                          <div className="p-2.5 sm:p-3 md:p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg backdrop-blur-sm">
                            <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Missing Levels</p>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              {analysisData.bloomsInsights.missingLevels.map((level, idx) => (
                                <Badge key={idx} variant="outline" className="text-[9px] xs:text-[10px] sm:text-xs">
                                  {level}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="p-2.5 sm:p-3 md:p-4 bg-green-50/50 dark:bg-green-900/20 rounded-lg backdrop-blur-sm">
                          <p className="text-xs sm:text-sm font-medium mb-1">Balance Score</p>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Progress value={analysisData.bloomsInsights.balanceScore} className="flex-1 h-1.5 sm:h-2" />
                            <span className="text-xs sm:text-sm font-medium">{analysisData.bloomsInsights.balanceScore}%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-2.5 sm:p-3 md:p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm animate-pulse">
                          <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-300 dark:bg-gray-700 rounded mb-1.5 sm:mb-2"></div>
                          <div className="h-5 sm:h-6 w-28 sm:w-32 bg-gray-300 dark:bg-gray-700 rounded mb-1.5 sm:mb-2"></div>
                          <div className="h-2.5 sm:h-3 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="p-2.5 sm:p-3 md:p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
                          <p className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Analyzing Bloom&apos;s taxonomy distribution...
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Bloom's Pyramid */}
                <BloomsPyramidVisualization 
                  distribution={analysisData.overallDistribution}
                  onLevelClick={(level) => askSam(`How can I add more ${level} level activities to my course?`)}
                />

                {/* Key Insights */}
                <DepthInsightsPanel 
                  insights={analysisData.insights || []}
                  gaps={analysisData.gaps}
                  onAskSam={askSam}
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  <Card className="p-2.5 sm:p-3 md:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-1 xs:p-1.5 sm:p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                        <Target className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold">
                        {courseData.whatYouWillLearn?.length || 0}
                      </span>
                    </div>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-1.5 md:mt-2">
                      Learning Objectives
                    </p>
                  </Card>
                  
                  <Card className="p-2.5 sm:p-3 md:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-1 xs:p-1.5 sm:p-2 rounded-lg bg-green-500/20 backdrop-blur-sm">
                        <BookOpen className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold">
                        {courseData.chapters.length}
                      </span>
                    </div>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-1.5 md:mt-2">
                      Chapters
                    </p>
                  </Card>
                  
                  <Card className="p-2.5 sm:p-3 md:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-1 xs:p-1.5 sm:p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                        <TrendingUp className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold">
                        {Math.max(...Object.values(analysisData.overallDistribution))}%
                      </span>
                    </div>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-1.5 md:mt-2">
                      Dominant Level
                    </p>
                  </Card>
                  
                  <Card className="p-2.5 sm:p-3 md:p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-1 xs:p-1.5 sm:p-2 rounded-lg bg-yellow-500/20 backdrop-blur-sm">
                        <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold">
                        {analysisData.gaps.filter(g => g.severity === 'high').length}
                      </span>
                    </div>
                    <p className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-1.5 md:mt-2">
                      Critical Gaps
                    </p>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="chapters" className="mt-6">
                <ChapterDepthAnalysis 
                  chapters={analysisData.chapterAnalysis}
                  onImproveChapter={(chapter) => askSam(`How can I improve the depth of chapter: ${chapter}?`)}
                />
              </TabsContent>

              <TabsContent value="objectives" className="mt-3 sm:mt-4 md:mt-6 space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5 sm:mb-3 md:mb-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1.5 sm:gap-2">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    Learning Objectives Analysis
                  </h3>
                  <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {analysisData.objectivesAnalysis.length} objectives analyzed
                  </div>
                </div>

                {/* SMART Criteria Overview */}
                <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-white/20 shadow-xl">
                  <h4 className="text-xs sm:text-sm md:text-base font-semibold mb-2.5 sm:mb-3 md:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    SMART Criteria Overview
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2 md:gap-3">
                    {['Specific', 'Measurable', 'Achievable', 'Relevant', 'Time-bound'].map((criterion, idx) => {
                      const avgScore = analysisData.objectivesAnalysis.reduce((acc, obj) => {
                        const key = criterion.toLowerCase().replace('-', '') as keyof typeof obj.smartCriteria;
                        const criteriaItem = obj.smartCriteria?.[key];
                        const score = criteriaItem && typeof criteriaItem === 'object' && 'score' in criteriaItem ? (criteriaItem as any).score : 0;
                        return acc + (score || 0);
                      }, 0) / (analysisData.objectivesAnalysis.length || 1);
                      
                      return (
                        <div key={idx} className="text-center p-1.5 sm:p-2 md:p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
                          <p className="text-[9px] xs:text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 break-words">{criterion}</p>
                          <p className={cn("text-base xs:text-lg sm:text-xl md:text-2xl font-bold", getScoreColor(avgScore))}>
                            {Math.round(avgScore)}%
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                
                {/* Individual Objectives Analysis */}
                <div className="space-y-3 sm:space-y-4">
                  {analysisData.objectivesAnalysis.map((obj, index) => {
                    const smartAverage = obj.smartCriteria 
                      ? Object.values(obj.smartCriteria).reduce((acc, criterion) => acc + criterion.score, 0) / 5
                      : 0;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-3 sm:p-4 md:p-6 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                          <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                            {/* Objective Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2.5 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg break-words">{obj.objective}</p>
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mt-1.5 sm:mt-2">
                                  <Badge variant="outline" className="bg-white/50 dark:bg-slate-700/50 border-white/30 text-[9px] xs:text-[10px] sm:text-xs">
                                    {obj.bloomsLevel}
                                  </Badge>
                                  {obj.actionVerb && (
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "bg-white/50 dark:bg-slate-700/50 border-white/30 text-[9px] xs:text-[10px] sm:text-xs",
                                        obj.verbStrength === 'strong' ? 'text-green-700 dark:text-green-400' :
                                        obj.verbStrength === 'moderate' ? 'text-yellow-700 dark:text-yellow-400' :
                                        'text-red-700 dark:text-red-400'
                                      )}
                                    >
                                      <span className="hidden sm:inline">Verb: {obj.actionVerb} ({obj.verbStrength})</span>
                                      <span className="sm:hidden">{obj.actionVerb}</span>
                                    </Badge>
                                  )}
                                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                    <span className="text-[9px] xs:text-[10px] sm:text-xs">Clarity:</span>
                                    <span className={cn("text-[10px] xs:text-xs sm:text-sm font-semibold", getScoreColor(obj.clarityScore || 0))}>
                                      {obj.clarityScore || 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-center flex-shrink-0">
                                <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">SMART Score</p>
                                <p className={cn("text-lg sm:text-xl md:text-2xl font-bold", getScoreColor(smartAverage))}>
                                  {Math.round(smartAverage)}%
                                </p>
                              </div>
                            </div>
                            
                            {/* SMART Criteria Breakdown */}
                            {obj.smartCriteria && (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                                {Object.entries(obj.smartCriteria).map(([criterion, data]) => (
                                  <div key={criterion} className="p-1.5 sm:p-2 md:p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg backdrop-blur-sm">
                                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                      <p className="text-[9px] xs:text-[10px] sm:text-xs font-medium capitalize truncate pr-0.5 sm:pr-1">{criterion}</p>
                                      <span className={cn("text-[10px] xs:text-xs sm:text-sm font-bold flex-shrink-0", getScoreColor(data.score))}>
                                        {data.score}%
                                      </span>
                                    </div>
                                    <Progress value={data.score} className="h-0.5 sm:h-1 mb-0.5 sm:mb-1" />
                                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 line-clamp-2 break-words">
                                      {data.feedback}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Suggestions */}
                            {obj.suggestions.length > 0 && (
                              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-2.5 sm:p-3 md:p-4 rounded-lg backdrop-blur-sm">
                                <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                  <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  Improvement Suggestions
                                </p>
                                <ul className="space-y-0.5 sm:space-y-1">
                                  {obj.suggestions.map((suggestion, idx) => (
                                    <li key={idx} className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5 sm:gap-2 break-words">
                                      <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Improved Version */}
                            {obj.improvedVersion && (
                              <div className="bg-green-50/50 dark:bg-green-900/20 p-2.5 sm:p-3 md:p-4 rounded-lg backdrop-blur-sm">
                                <p className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  Suggested Improvement
                                </p>
                                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 italic break-words">
                                  &ldquo;{obj.improvedVersion}&rdquo;
                                </p>
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 pt-1.5 sm:pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => askSam(`Improve this learning objective: "${obj.objective}"`)}
                                className="bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
                              >
                                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden sm:inline">Improve with SAM</span>
                                <span className="sm:hidden">Improve</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => askSam(`Create activities for this objective: "${obj.objective}"`)}
                                className="bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50 h-9 sm:h-10 text-xs sm:text-sm w-full xs:w-auto"
                              >
                                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden sm:inline">Generate Activities</span>
                                <span className="sm:hidden">Activities</span>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {analysisData.objectivesAnalysis.length === 0 && (
                  <Card className="p-6 sm:p-8 md:p-12 text-center backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-xl">
                    <Target className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mx-auto text-gray-400 mb-3 sm:mb-4" />
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 break-words px-2">
                      No learning objectives found. Add objectives to your course for analysis.
                    </p>
                    <Button
                      onClick={() => askSam("Help me create effective learning objectives for my course")}
                      className="mt-3 sm:mt-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Create Objectives with SAM
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="mt-6">
                <ImprovementRecommendations 
                  recommendations={analysisData.recommendations}
                  improvementPlan={analysisData.improvementPlan}
                  onImplement={(rec) => askSam(`Help me implement: ${rec.title}`)}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty State */}
      {!analysisData && !isAnalyzing && (
        <div className="text-center py-6 sm:py-8 md:py-12 px-2 sm:px-4">
          <div className="p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl md:rounded-2xl backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-white/20 shadow-xl inline-block mb-3 sm:mb-4 md:mb-6">
            <Brain className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg font-medium mb-1.5 sm:mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            No Analysis Available
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 break-words px-2">
            Click the analyze button to get insights into your course depth
          </p>
          <Button 
            onClick={() => analyzeCourse(false)} // Use cache if available
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base w-full sm:w-auto"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Analyze Course
          </Button>
        </div>
      )}
    </div>
    </div>
  );
}