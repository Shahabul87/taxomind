"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  BarChart3,
  BookOpen,
  Clock,
  Trophy,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  Star,
  RefreshCw,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdaptiveAssessmentContentProps {
  sectionId: string;
  courseId: string;
  chapterId: string;
}

interface CognitiveLevelAnalysis {
  bloomsLevel: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  difficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

interface AdaptiveRecommendation {
  type: 'strength' | 'improvement' | 'challenge' | 'practice';
  title: string;
  description: string;
  bloomsLevel?: string;
  difficulty?: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

interface AssessmentAnalysis {
  overallPerformance: {
    totalAttempts: number;
    averageScore: number;
    improvement: number;
    consistency: number;
    trend: string;
  };
  cognitiveLevels: CognitiveLevelAnalysis[];
  recommendations: AdaptiveRecommendation[];
  learningMetrics: {
    learningVelocity: number;
    knowledgeRetention: number;
    studyFrequency: string;
  };
}

interface AdaptiveQuestion {
  id: string;
  type: string;
  difficulty: string;
  bloomsLevel: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  learningObjective: string;
  scaffolding?: string;
}

export const AdaptiveAssessmentContent = ({ sectionId, courseId, chapterId }: AdaptiveAssessmentContentProps) => {
  const [analysis, setAnalysis] = useState<AssessmentAnalysis | null>(null);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<AdaptiveQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "cognitive" | "recommendations" | "practice">("overview");

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/adaptive-assessment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        toast.error('Failed to load assessment analysis');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('Failed to load assessment analysis');
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const generateAdaptiveQuestions = async (focusMode: 'remedial' | 'advancement' | 'mixed' = 'mixed') => {
    try {
      setGeneratingQuestions(true);
      const response = await fetch('/api/adaptive-assessment/recommend-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sectionId, 
          focusMode,
          questionCount: 5 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdaptiveQuestions(data.questions);
        setActiveView('practice');
        toast.success(`Generated ${data.questions.length} adaptive questions!`);
      } else {
        toast.error('Failed to generate adaptive questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate adaptive questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const refreshAnalysis = async () => {
    setAnalyzing(true);
    await fetchAnalysis();
    setAnalyzing(false);
    toast.success('Analysis refreshed!');
  };

  const getBloomsColor = (level: string) => {
    const colors = {
      'REMEMBER': 'bg-blue-100 text-blue-700 border-blue-200',
      'UNDERSTAND': 'bg-green-100 text-green-700 border-green-200',
      'APPLY': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'ANALYZE': 'bg-orange-100 text-orange-700 border-orange-200',
      'EVALUATE': 'bg-red-100 text-red-700 border-red-200',
      'CREATE': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No Assessment Data
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Complete some exams to unlock adaptive assessment insights.
        </p>
        <Button onClick={() => setActiveView('practice')}>
          <Play className="w-4 h-4 mr-2" />
          Start Practice Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Adaptive Assessment
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            AI-powered learning insights and personalized recommendations
          </p>
        </div>
        <Button
          onClick={refreshAnalysis}
          disabled={analyzing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", analyzing && "animate-spin")} />
          Refresh Analysis
        </Button>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cognitive" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Cognitive Levels
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Adaptive Practice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-semibold">Average Score</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analysis.overallPerformance.averageScore.toFixed(1)}%
                </p>
                <p className={cn(
                  "text-sm",
                  analysis.overallPerformance.improvement > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {analysis.overallPerformance.improvement > 0 ? '+' : ''}{analysis.overallPerformance.improvement.toFixed(1)}% change
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Consistency</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analysis.overallPerformance.consistency.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Performance stability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Learning Velocity</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analysis.learningMetrics.learningVelocity.toFixed(1)}d
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Between attempts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold">Retention</h3>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analysis.learningMetrics.knowledgeRetention.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Knowledge retention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Trend</span>
                  <Badge 
                    variant={analysis.overallPerformance.trend === 'improving' ? 'default' : 
                            analysis.overallPerformance.trend === 'declining' ? 'destructive' : 'secondary'}
                  >
                    {analysis.overallPerformance.trend}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {analysis.overallPerformance.totalAttempts}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Attempts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {analysis.learningMetrics.studyFrequency}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Study Frequency</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {analysis.cognitiveLevels.length}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Levels Practiced</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          {/* Bloom's Taxonomy Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Bloom&apos;s Taxonomy Analysis
              </CardTitle>
              <CardDescription>
                Your performance across different cognitive levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.cognitiveLevels.map((level) => (
                  <div key={level.bloomsLevel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getBloomsColor(level.bloomsLevel)}>
                          {level.bloomsLevel.toLowerCase()}
                        </Badge>
                        <span className="text-sm font-medium">
                          {level.correctAnswers}/{level.totalQuestions} correct
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {level.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={level.accuracy} className="h-2" />
                    
                    {/* Difficulty Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-medium">Easy</p>
                        <p className="text-slate-600">
                          {level.difficulty.easy.total > 0 
                            ? `${((level.difficulty.easy.correct / level.difficulty.easy.total) * 100).toFixed(0)}%`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Medium</p>
                        <p className="text-slate-600">
                          {level.difficulty.medium.total > 0 
                            ? `${((level.difficulty.medium.correct / level.difficulty.medium.total) * 100).toFixed(0)}%`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Hard</p>
                        <p className="text-slate-600">
                          {level.difficulty.hard.total > 0 
                            ? `${((level.difficulty.hard.correct / level.difficulty.hard.total) * 100).toFixed(0)}%`
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Adaptive Recommendations */}
          <div className="space-y-4">
            {analysis.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn("border-l-4", getPriorityColor(rec.priority))}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {rec.description}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{rec.priority} priority</Badge>
                        <Badge variant="secondary">{rec.type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Action Items:</h4>
                      <ul className="space-y-1">
                        {rec.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {(rec.bloomsLevel || rec.difficulty) && (
                      <div className="flex gap-2 mt-4">
                        {rec.bloomsLevel && (
                          <Badge className={getBloomsColor(rec.bloomsLevel)}>
                            {rec.bloomsLevel.toLowerCase()}
                          </Badge>
                        )}
                        {rec.difficulty && (
                          <Badge variant="outline">
                            {rec.difficulty.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          {/* Adaptive Practice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Adaptive Practice Sessions
              </CardTitle>
              <CardDescription>
                AI-generated questions tailored to your learning needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => generateAdaptiveQuestions('remedial')}
                  disabled={generatingQuestions}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <div className="text-center">
                    <p className="font-medium">Remedial Practice</p>
                    <p className="text-xs text-slate-600">Focus on weak areas</p>
                  </div>
                </Button>

                <Button
                  onClick={() => generateAdaptiveQuestions('mixed')}
                  disabled={generatingQuestions}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <Target className="w-6 h-6" />
                  <div className="text-center">
                    <p className="font-medium">Balanced Practice</p>
                    <p className="text-xs">Mixed difficulty levels</p>
                  </div>
                </Button>

                <Button
                  onClick={() => generateAdaptiveQuestions('advancement')}
                  disabled={generatingQuestions}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  <div className="text-center">
                    <p className="font-medium">Advanced Practice</p>
                    <p className="text-xs text-slate-600">Challenge yourself</p>
                  </div>
                </Button>
              </div>

              {generatingQuestions && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Generating adaptive questions...</p>
                </div>
              )}

              {adaptiveQuestions.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-lg">Generated Practice Questions</h4>
                  {adaptiveQuestions.map((question, index) => (
                    <Card key={question.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">Question {index + 1}</CardTitle>
                            <p className="text-sm text-slate-600 mt-1">{question.question}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getBloomsColor(question.bloomsLevel.toUpperCase())}>
                              {question.bloomsLevel}
                            </Badge>
                            <Badge variant="outline">{question.difficulty}</Badge>
                            <Badge variant="secondary">{question.points} pts</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-sm">
                            <strong>Learning Objective:</strong> {question.learningObjective}
                          </p>
                          {question.scaffolding && (
                            <p className="text-sm bg-blue-50 p-2 rounded border-l-4 border-l-blue-500">
                              <strong>Hint:</strong> {question.scaffolding}
                            </p>
                          )}
                          <Button size="sm" className="mt-2">
                            <Play className="w-4 h-4 mr-2" />
                            Start Question
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};