"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Eye,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Award,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BloomsLevel } from "@prisma/client";
import { 
  CognitiveAnalytics, 
  StudentCognitiveAnalytics, 
  BloomsLevelPerformance,
  CognitiveAnalyticsEngine 
} from "@/lib/cognitive-analytics";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart
} from "recharts";

interface CognitiveAnalyticsDashboardProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  examId?: string;
  studentId?: string;
  view?: 'teacher' | 'student';
}

const BLOOM_COLORS = {
  REMEMBER: "#3B82F6", // Blue
  UNDERSTAND: "#10B981", // Green
  APPLY: "#F59E0B", // Amber
  ANALYZE: "#F97316", // Orange
  EVALUATE: "#EF4444", // Red
  CREATE: "#8B5CF6" // Purple
};

const STRENGTH_COLORS = {
  strong: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
  developing: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  weak: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
  critical: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Activity,
  declining: TrendingDown
};

const PERFORMANCE_LEVELS = [
  { name: 'Mastery', min: 90, color: '#10B981' },
  { name: 'Proficient', min: 80, color: '#3B82F6' },
  { name: 'Developing', min: 70, color: '#F59E0B' },
  { name: 'Beginning', min: 60, color: '#F97316' },
  { name: 'Below Basic', min: 0, color: '#EF4444' }
];

export const CognitiveAnalyticsDashboard = ({
  courseId,
  chapterId,
  sectionId,
  examId,
  studentId,
  view = 'teacher'
}: CognitiveAnalyticsDashboardProps) => {
  const [analyticsData, setAnalyticsData] = useState<CognitiveAnalytics | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>(studentId || 'all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const analyticsEngine = CognitiveAnalyticsEngine.getInstance();

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration - in real implementation, this would fetch from API
      const mockAnalytics = await generateMockAnalyticsData();
      setAnalyticsData(mockAnalytics);
    } catch (error) {
      logger.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyticsData();
  }, [courseId, chapterId, sectionId, examId, selectedStudent, selectedTimeRange, loadAnalyticsData]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadAnalyticsData();
    setIsRefreshing(false);
  };

  const generateMockAnalyticsData = async (): Promise<CognitiveAnalytics> => {
    // Mock implementation - replace with actual API calls
    return {
      studentAnalytics: {
        cognitiveProfile: {
          dominantThinkingStyle: ['ANALYZE', 'EVALUATE'],
          cognitiveRange: { min: 'REMEMBER', max: 'CREATE' },
          preferredQuestionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
          optimalCognitiveLoad: 3.2,
          metacognitiveDevelopment: 0.75,
          criticalThinkingIndex: 0.82,
          creativityIndex: 0.68
        },
        strengthsAndWeaknesses: {
          cognitiveStrengths: ['ANALYZE', 'EVALUATE'],
          cognitiveWeaknesses: ['REMEMBER', 'CREATE'],
          skillGaps: [
            {
              prerequisiteLevel: 'UNDERSTAND',
              targetLevel: 'CREATE',
              gapSize: 0.4,
              recommendedInterventions: ['Creative thinking exercises', 'Design projects'],
              estimatedTimeToClose: 15
            }
          ],
          emergingStrengths: ['APPLY'],
          persistentChallenges: ['REMEMBER']
        },
        learningProgression: {
          progressionPath: [],
          velocityByLevel: {
            REMEMBER: 0.6,
            UNDERSTAND: 0.8,
            APPLY: 0.7,
            ANALYZE: 0.9,
            EVALUATE: 0.85,
            CREATE: 0.5
          },
          plateauIdentification: [],
          breakthroughMoments: [],
          nextLevelReadiness: []
        },
        predictiveInsights: {
          riskFactors: [],
          successPredictors: []
        } as any,
        personalizedRecommendations: []
      },
      classAnalytics: {
        classProfile: {
          averageCognitiveProfile: {
            dominantThinkingStyle: ['ANALYZE', 'EVALUATE'],
            cognitiveRange: { min: 'REMEMBER', max: 'CREATE' },
            preferredQuestionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
            optimalCognitiveLoad: 3.2,
            metacognitiveDevelopment: 0.75,
            criticalThinkingIndex: 0.82,
            creativityIndex: 0.68
          },
          cognitiveDispersion: 0.65,
          dominantClassCharacteristics: ['Analytical', 'Collaborative'],
          learningCultureIndicators: []
        },
        bloomsDistribution: {
          current: {} as any,
          optimal: {} as any,
          gaps: {} as any,
          redistributionSuggestions: []
        },
        performanceComparison: {
          classVsIndividual: {} as any,
          benchmarkComparison: {} as any,
          progressIndicators: []
        },
        collaborativeLearningOpportunities: [],
        classLevelInterventions: []
      } as any,
      courseAnalytics: {
        curriculumAlignment: {
          bloomsAlignment: {
            REMEMBER: 0.85,
            UNDERSTAND: 0.82,
            APPLY: 0.76,
            ANALYZE: 0.71,
            EVALUATE: 0.68,
            CREATE: 0.62
          },
          cognitiveFlowAnalysis: [],
          scaffoldingEffectiveness: 0.78,
          gapIdentification: [],
          improvementRecommendations: []
        },
        cognitiveProgression: {
          idealProgression: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
          actualProgression: {},
          progressionPatterns: [],
          accelerationOpportunities: []
        },
        assessmentEffectiveness: {
          cognitiveValidation: {
            REMEMBER: 0.85,
            UNDERSTAND: 0.82,
            APPLY: 0.76,
            ANALYZE: 0.71,
            EVALUATE: 0.68,
            CREATE: 0.62
          },
          difficultyCalibration: {},
          discriminationAnalysis: {},
          feedbackQuality: 0.8,
          adaptiveElements: []
        },
        learningOutcomeAchievement: {
          outcomeAlignment: {},
          achievementRates: {},
          skillTransfer: {},
          competencyDevelopment: [],
          outcomeRecommendations: []
        }
      } as any,
      bloomsDistributionAnalysis: {
        currentDistribution: {
          REMEMBER: 15,
          UNDERSTAND: 20,
          APPLY: 25,
          ANALYZE: 20,
          EVALUATE: 12,
          CREATE: 8
        },
        optimalDistribution: {
          REMEMBER: 16,
          UNDERSTAND: 22,
          APPLY: 24,
          ANALYZE: 18,
          EVALUATE: 12,
          CREATE: 8
        },
        distributionHealth: {
          balanceScore: 0.85,
          progressionAlignment: 0.78,
          cognitiveLoadDistribution: 0.82,
          criticalIssues: []
        },
        rebalancingRecommendations: []
      },
      learningGapAnalysis: {
        identifiedGaps: [],
        gapSeverity: {
          overallSeverity: 0.3,
          severityByLevel: {
            REMEMBER: 0.2,
            UNDERSTAND: 0.3,
            APPLY: 0.4,
            ANALYZE: 0.3,
            EVALUATE: 0.2,
            CREATE: 0.5
          },
          criticalGaps: 2,
          resolvableGaps: 5
        },
        interventionPriorities: [],
        resourceAllocation: []
      },
      recommendationEngine: {
        studentRecommendations: [],
        instructorRecommendations: [],
        systemRecommendations: [],
        adaptiveAdjustments: []
      }
    };
  };

  const getPerformanceLevel = (score: number) => {
    for (const level of PERFORMANCE_LEVELS) {
      if (score >= level.min) {
        return level;
      }
    }
    return PERFORMANCE_LEVELS[PERFORMANCE_LEVELS.length - 1];
  };

  const BloomsPerformanceChart = () => {
    if (!analyticsData) return null;

    const chartData = Object.entries(analyticsData.bloomsDistributionAnalysis.currentDistribution).map(
      ([level, questions]) => ({
        level,
        performance: Math.round(Math.random() * 100), // Mock performance data
        questions: questions,
        color: BLOOM_COLORS[level as BloomsLevel]
      })
    );

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Bloom&apos;s Taxonomy Performance
          </CardTitle>
          <CardDescription>
            Student performance across cognitive levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 border rounded shadow-lg">
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm">Performance: {data.performance}%</p>
                      <p className="text-sm">Questions: {data.questions}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="performance" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const CognitiveRadarChart = () => {
    if (!analyticsData) return null;

    const radarData = Object.entries(analyticsData.bloomsDistributionAnalysis.currentDistribution).map(
      ([level, questions]) => ({
        level: level.toLowerCase(),
        performance: Math.round(Math.random() * 100), // Mock performance data
        fullMark: 100
      })
    );

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Cognitive Profile Radar
          </CardTitle>
          <CardDescription>
            Comprehensive view of cognitive strengths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="level" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Performance" 
                dataKey="performance" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const StrengthsWeaknessesCard = () => {
    if (!analyticsData) return null;

    const { cognitiveStrengths, cognitiveWeaknesses, emergingStrengths, persistentChallenges } = 
      analyticsData.studentAnalytics.strengthsAndWeaknesses;

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-600" />
            Cognitive Strengths & Areas for Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </h4>
              <div className="space-y-2">
                {cognitiveStrengths.map((level) => (
                  <Badge key={level} className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {level}
                  </Badge>
                ))}
              </div>
              
              {emergingStrengths.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-blue-600 mb-1">Emerging Strengths</h5>
                  <div className="space-y-1">
                    {emergingStrengths.map((level) => (
                      <Badge key={level} variant="outline" className="text-blue-600 border-blue-300">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-amber-600 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Areas for Growth
              </h4>
              <div className="space-y-2">
                {cognitiveWeaknesses.map((level) => (
                  <Badge key={level} className="bg-amber-50 text-amber-700 border-amber-200">
                    {level}
                  </Badge>
                ))}
              </div>
              
              {persistentChallenges.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-600 mb-1">Persistent Challenges</h5>
                  <div className="space-y-1">
                    {persistentChallenges.map((level) => (
                      <Badge key={level} variant="outline" className="text-red-600 border-red-300">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const LearningVelocityChart = () => {
    if (!analyticsData) return null;

    const velocityData = Object.entries(analyticsData.studentAnalytics.learningProgression.velocityByLevel).map(
      ([level, velocity]) => ({
        level,
        velocity: Math.round(velocity * 100),
        color: BLOOM_COLORS[level as BloomsLevel]
      })
    );

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Learning Velocity by Cognitive Level
          </CardTitle>
          <CardDescription>
            Speed of mastery across different thinking levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="velocity" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const CognitiveProfileCard = () => {
    if (!analyticsData) return null;

    const { cognitiveProfile } = analyticsData.studentAnalytics;

    return (
      <Card className={cn(
        "bg-gradient-to-br from-white via-gray-50 to-white",
        "dark:from-gray-800 dark:via-gray-850 dark:to-gray-800",
        "border border-gray-200/60 dark:border-gray-700/60",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Cognitive Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Metacognitive Development</h4>
              <div className="space-y-1">
                <Progress value={cognitiveProfile.metacognitiveDevelopment * 100} className="h-2" />
                <p className="text-xs text-gray-500">{Math.round(cognitiveProfile.metacognitiveDevelopment * 100)}%</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Critical Thinking Index</h4>
              <div className="space-y-1">
                <Progress value={cognitiveProfile.criticalThinkingIndex * 100} className="h-2" />
                <p className="text-xs text-gray-500">{Math.round(cognitiveProfile.criticalThinkingIndex * 100)}%</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Creativity Index</h4>
              <div className="space-y-1">
                <Progress value={cognitiveProfile.creativityIndex * 100} className="h-2" />
                <p className="text-xs text-gray-500">{Math.round(cognitiveProfile.creativityIndex * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Dominant Thinking Style</h5>
                <div className="space-y-1">
                  {cognitiveProfile.dominantThinkingStyle.map((style) => (
                    <Badge key={style} variant="outline" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Optimal Cognitive Load</h5>
                <div className="flex items-center gap-2">
                  <Progress value={(cognitiveProfile.optimalCognitiveLoad / 5) * 100} className="h-2 flex-1" />
                  <span className="text-xs">{cognitiveProfile.optimalCognitiveLoad}/5</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading cognitive analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No analytics data available. Complete some assessments to view cognitive insights.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Cognitive Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive analysis of learning patterns and cognitive development
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {view === 'teacher' && (
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="student1">John Doe</SelectItem>
                <SelectItem value="student2">Jane Smith</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive Profile</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BloomsPerformanceChart />
            <CognitiveRadarChart />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrengthsWeaknessesCard />
            <LearningVelocityChart />
          </div>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-6">
          <CognitiveProfileCard />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add more cognitive-specific charts here */}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance-specific content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BloomsPerformanceChart />
            <LearningVelocityChart />
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Recommendations and insights */}
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Based on cognitive analysis, personalized recommendations will appear here.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};