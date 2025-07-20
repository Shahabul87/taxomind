"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    suggestions: string[];
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
    type: 'content' | 'structure' | 'activity';
    title: string;
    description: string;
    examples: string[];
  }>;
  insights?: string[];
  improvementPlan?: any;
}

export function CourseDepthAnalyzer({ courseId, courseData }: CourseDepthAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showSamChat, setShowSamChat] = useState(false);

  // Analyze course depth
  const analyzeCourse = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/course-depth-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysisData(data.analysis);
      toast.success('Course analysis completed successfully!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze course depth');
    } finally {
      setIsAnalyzing(false);
    }
  }, [courseId]);

  // Auto-analyze on mount if no data
  useEffect(() => {
    if (!analysisData && courseData.chapters.length > 0) {
      analyzeCourse();
    }
  }, [analysisData, courseData.chapters.length, analyzeCourse]);

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
      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-400/25 to-cyan-400/25 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/15 to-purple-400/15 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 shadow-2xl p-6 space-y-6 relative rounded-2xl">
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeCourse}
            disabled={isAnalyzing}
            className="bg-white/60 dark:bg-slate-800/60 border-white/30 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isAnalyzing && "animate-spin")} />
            Re-analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            disabled={!analysisData}
            className="bg-white/60 dark:bg-slate-800/60 border-white/30 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => askSam()}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Ask SAM
          </Button>
        </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative p-8 rounded-2xl backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-white/20 shadow-xl">
            <div className="relative">
              <Brain className="h-16 w-16 text-purple-600 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Analyzing course depth...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Score</h3>
                <p className={cn("text-3xl font-bold mt-2", getScoreColor(overallScore))}>
                  {overallScore}/100
                </p>
                <Progress value={overallScore} className="mt-2" />
              </Card>
              
              <Card className="p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Depth</h3>
                <p className={cn("text-3xl font-bold mt-2", getScoreColor(analysisData.scores.depth))}>
                  {analysisData.scores.depth}
                </p>
                <Progress value={analysisData.scores.depth} className="mt-2" />
              </Card>
              
              <Card className="p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</h3>
                <p className={cn("text-3xl font-bold mt-2", getScoreColor(analysisData.scores.balance))}>
                  {analysisData.scores.balance}
                </p>
                <Progress value={analysisData.scores.balance} className="mt-2" />
              </Card>
              
              <Card className="p-4 text-center backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border-white/20 shadow-xl">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Complexity</h3>
                <p className={cn("text-3xl font-bold mt-2", getScoreColor(analysisData.scores.complexity))}>
                  {analysisData.scores.complexity}
                </p>
                <Progress value={analysisData.scores.complexity} className="mt-2" />
              </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">Overview</TabsTrigger>
                <TabsTrigger value="chapters" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">Chapters</TabsTrigger>
                <TabsTrigger value="objectives" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">Objectives</TabsTrigger>
                <TabsTrigger value="recommendations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-indigo-500/20 data-[state=active]:border-purple-300 dark:data-[state=active]:border-purple-600">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                        <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-2xl font-bold">
                        {courseData.whatYouWillLearn?.length || 0}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Learning Objectives
                    </p>
                  </Card>
                  
                  <Card className="p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-green-500/20 backdrop-blur-sm">
                        <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-2xl font-bold">
                        {courseData.chapters.length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Chapters
                    </p>
                  </Card>
                  
                  <Card className="p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-purple-500/20 backdrop-blur-sm">
                        <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-2xl font-bold">
                        {Math.max(...Object.values(analysisData.overallDistribution))}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Dominant Level
                    </p>
                  </Card>
                  
                  <Card className="p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-yellow-500/20 backdrop-blur-sm">
                        <AlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-2xl font-bold">
                        {analysisData.gaps.filter(g => g.severity === 'high').length}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
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

              <TabsContent value="objectives" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Learning Objectives Analysis
                  </h3>
                  
                  {analysisData.objectivesAnalysis.map((obj, index) => (
                    <Card key={index} className="p-4 backdrop-blur-md bg-white/60 dark:bg-slate-800/60 border-white/20 shadow-lg hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{obj.objective}</p>
                          <Badge variant="outline" className="ml-2 bg-white/50 dark:bg-slate-700/50 border-white/30">
                            {obj.bloomsLevel}
                          </Badge>
                        </div>
                        
                        {obj.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              Suggestions:
                            </p>
                            {obj.suggestions.map((suggestion, idx) => (
                              <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4">
                                • {suggestion}
                              </p>
                            ))}
                          </div>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => askSam(`Improve this learning objective: "${obj.objective}"`)}
                          className="mt-2 bg-white/30 dark:bg-slate-800/30 border-white/20 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-slate-800/50"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Improve with SAM
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
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
        <div className="text-center py-12">
          <div className="p-8 rounded-2xl backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-white/20 shadow-xl inline-block mb-6">
            <Brain className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            No Analysis Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click the analyze button to get insights into your course depth
          </p>
          <Button 
            onClick={analyzeCourse}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyze Course
          </Button>
        </div>
      )}
    </div>
    </div>
  );
}