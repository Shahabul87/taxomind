"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Brain,
  Target,
  Award,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Zap,
  Star,
  BookOpen,
  PlayCircle,
  FileText,
  Code,
  Calculator,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Map,
  Layers,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Lightbulb,
  Rocket,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AnalyticsData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    completionRate: number;
    averageProgress: number;
    engagementScore: number;
    satisfactionScore: number;
  };
  content: {
    totalChapters: number;
    totalSections: number;
    videosWatched: number;
    articlesRead: number;
    exercisesCompleted: number;
    avgTimePerSection: number;
  };
  performance: {
    quizScores: number[];
    assignmentScores: number[];
    bloomsLevelProgress: Record<string, number>;
    learningPathEffectiveness: number;
    retentionRate: number;
  };
  engagement: {
    dailyActiveUsers: number[];
    weeklyEngagement: number[];
    contentInteractions: Record<string, number>;
    peakUsageHours: number[];
    dropoffPoints: string[];
  };
  predictions: {
    completionPrediction: number;
    riskStudents: number;
    successPredictors: string[];
    recommendedActions: string[];
  };
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  enrolledDate: string;
  progress: number;
  lastActive: string;
  completedSections: number;
  totalSections: number;
  currentBloomsLevel: string;
  riskLevel: 'low' | 'medium' | 'high';
  predictedCompletion: string;
  engagementScore: number;
  averageQuizScore: number;
}

interface ContentAnalytics {
  id: string;
  title: string;
  type: 'video' | 'blog' | 'code' | 'quiz' | 'exercise';
  viewCount: number;
  completionRate: number;
  averageTimeSpent: number;
  engagementScore: number;
  difficultyRating: number;
  bloomsLevel: string;
  feedback: {
    likes: number;
    dislikes: number;
    comments: number;
    rating: number;
  };
  performance: {
    dropoffRate: number;
    retentionRate: number;
    successRate: number;
  };
}

interface AdvancedAnalyticsDashboardProps {
  courseId: string;
  courseTitle: string;
}

export const AdvancedAnalyticsDashboard = ({ 
  courseId, 
  courseTitle 
}: AdvancedAnalyticsDashboardProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [showPredictions, setShowPredictions] = useState(false);

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/analytics?timeframe=${selectedTimeframe}`);
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setAnalytics(data.analytics);
      setStudentProgress(data.studentProgress);
      setContentAnalytics(data.contentAnalytics);
      
      toast.success("Analytics data updated");
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
      
      // Mock data for demonstration
      setAnalytics({
        overview: {
          totalStudents: 245,
          activeStudents: 189,
          completionRate: 73.2,
          averageProgress: 67.8,
          engagementScore: 8.4,
          satisfactionScore: 4.6
        },
        content: {
          totalChapters: 8,
          totalSections: 32,
          videosWatched: 1567,
          articlesRead: 2341,
          exercisesCompleted: 892,
          avgTimePerSection: 23.5
        },
        performance: {
          quizScores: [78, 82, 85, 79, 88, 91, 87, 83],
          assignmentScores: [81, 85, 88, 83, 89, 92, 86, 84],
          bloomsLevelProgress: {
            REMEMBER: 85,
            UNDERSTAND: 78,
            APPLY: 71,
            ANALYZE: 64,
            EVALUATE: 52,
            CREATE: 43
          },
          learningPathEffectiveness: 82.3,
          retentionRate: 89.1
        },
        engagement: {
          dailyActiveUsers: [45, 52, 38, 61, 55, 49, 43],
          weeklyEngagement: [78, 82, 75, 85, 79, 88, 84],
          contentInteractions: {
            videos: 45,
            blogs: 32,
            code: 28,
            quizzes: 41,
            exercises: 35
          },
          peakUsageHours: [9, 14, 19, 21],
          dropoffPoints: ['Chapter 4: Advanced Concepts', 'Section 12: Complex Applications']
        },
        predictions: {
          completionPrediction: 76.8,
          riskStudents: 23,
          successPredictors: ['Video engagement', 'Quiz performance', 'Discussion participation'],
          recommendedActions: ['Add more interactive content', 'Provide additional support for struggling students', 'Optimize content difficulty curve']
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, selectedTimeframe]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  const generateReport = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/analytics/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: selectedTimeframe, metrics: selectedMetric })
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-analytics-${courseId}-${Date.now()}.pdf`;
      a.click();
      
      toast.success("Analytics report downloaded");
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const OverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Student Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">
                {analytics?.overview.activeStudents}/{analytics?.overview.totalStudents}
              </span>
              <Badge variant="secondary">
                {((analytics?.overview.activeStudents || 0) / (analytics?.overview.totalStudents || 1) * 100).toFixed(1)}% Active
              </Badge>
            </div>
            <Progress 
              value={(analytics?.overview.activeStudents || 0) / (analytics?.overview.totalStudents || 1) * 100} 
              className="h-2"
            />
            <div className="text-sm text-gray-600">
              Engagement Score: {analytics?.overview.engagementScore}/10
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Course Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-green-600">
                {analytics?.overview.completionRate}%
              </span>
              <Badge variant="secondary">
                Avg: {analytics?.overview.averageProgress}%
              </Badge>
            </div>
            <Progress 
              value={analytics?.overview.completionRate || 0} 
              className="h-2"
            />
            <div className="text-sm text-gray-600">
              {Math.round((analytics?.overview.completionRate || 0) / 100 * (analytics?.overview.totalStudents || 0))} students completed
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-5 w-5 text-purple-600" />
            Satisfaction Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-600">
                {analytics?.overview?.satisfactionScore || 0}/5
              </span>
              <Badge variant="secondary">
                {(analytics?.overview?.satisfactionScore ?? 0) >= 4.5 ? 'Excellent' : 
                 (analytics?.overview?.satisfactionScore ?? 0) >= 4.0 ? 'Good' : 
                 (analytics?.overview?.satisfactionScore ?? 0) >= 3.5 ? 'Average' : 'Needs Improvement'}
              </Badge>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= (analytics?.overview.satisfactionScore || 0) 
                      ? "fill-purple-600 text-purple-600" 
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Based on student feedback
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ContentPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Content Engagement by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.engagement.contentInteractions && Object.entries(analytics.engagement.contentInteractions).map(([type, engagement]) => {
                const icons = {
                  videos: PlayCircle,
                  blogs: FileText,
                  code: Code,
                  quizzes: Target,
                  exercises: Zap
                };
                const IconComponent = icons[type as keyof typeof icons] || BookOpen;
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <span className="capitalize">{type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={engagement} className="w-24 h-2" />
                      <span className="text-sm font-medium">{engagement}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Bloom&apos;s Taxonomy Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.performance.bloomsLevelProgress && Object.entries(analytics.performance.bloomsLevelProgress).map(([level, progress]) => (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{level.toLowerCase()}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Learning Path Effectiveness
          </CardTitle>
          <CardDescription>
            Analysis of how effectively students progress through the course structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {analytics?.performance.learningPathEffectiveness}%
              </div>
              <div className="text-sm text-gray-600">Path Effectiveness</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics?.performance.retentionRate}%
              </div>
              <div className="text-sm text-gray-600">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics?.content.avgTimePerSection}m
              </div>
              <div className="text-sm text-gray-600">Avg Time per Section</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const StudentAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Student Risk Assessment
          </CardTitle>
          <CardDescription>
            Identify students who may need additional support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analytics?.predictions.riskStudents}
              </div>
              <div className="text-sm text-red-700">High Risk Students</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round((analytics?.overview.totalStudents || 0) * 0.15)}
              </div>
              <div className="text-sm text-yellow-700">Medium Risk Students</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(analytics?.overview.totalStudents || 0) - (analytics?.predictions.riskStudents || 0) - Math.round((analytics?.overview.totalStudents || 0) * 0.15)}
              </div>
              <div className="text-sm text-green-700">Low Risk Students</div>
            </div>
          </div>

          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> Reach out to high-risk students with additional support materials and one-on-one guidance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Engagement Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <div key={day} className="space-y-2">
                  <div className="text-xs font-medium text-gray-600">{day}</div>
                  <div 
                    className="bg-blue-200 dark:bg-blue-700 rounded"
                    style={{ 
                      height: `${(analytics?.engagement.dailyActiveUsers[index] || 0) / 70 * 100}px`,
                      minHeight: '20px'
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    {analytics?.engagement.dailyActiveUsers[index] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PredictiveAnalytics = () => (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-indigo-600" />
            Predictive Insights
          </CardTitle>
          <CardDescription>
            AI-powered predictions and recommendations for course optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Completion Prediction</h4>
                <div className="flex items-center gap-3">
                  <Progress value={analytics?.predictions.completionPrediction || 0} className="flex-1" />
                  <span className="text-lg font-bold text-indigo-600">
                    {analytics?.predictions.completionPrediction}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Predicted final completion rate based on current trends
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Success Predictors</h4>
                <div className="space-y-2">
                  {analytics?.predictions.successPredictors.map((predictor, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{predictor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recommended Actions</h4>
              <div className="space-y-3">
                {analytics?.predictions.recommendedActions.map((action, index) => (
                  <Alert key={index}>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      {action}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Early Warning System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Drop-off Alert:</strong> High drop-off rate detected in Chapter 4. Consider adding more engaging content or reducing difficulty.
              </AlertDescription>
            </Alert>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>Opportunity:</strong> Students who complete video content have 40% higher quiz scores. Consider adding more video explanations.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 animate-pulse text-blue-600" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Advanced Course Analytics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive insights and predictive analytics for {courseTitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
          <TabsTrigger value="predictions">Predictive Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewMetrics />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentPerformance />
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <StudentAnalytics />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};