'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AlertCircle, ArrowRight, BarChart3, Brain, History, Sparkles, RefreshCw, Loader2, TrendingUp } from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/use-advanced-analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnterpriseUnifiedAnalytics } from '@/components/analytics/EnterpriseUnifiedAnalytics';
import { AnalyticsErrorBoundary } from '@/components/analytics/ErrorBoundary';
import { AnalyticsDashboardSkeleton } from '@/components/analytics/enterprise/Skeleton';
import { MobileLayout } from '@/components/layouts/MobileLayout';
import { LearningAnalyticsDashboard } from '../_components/learning-command-center/analytics';
import { RecommendationTimeline } from '@/components/sam/recommendations';
import {
  MetaLearningInsightsWidget,
  LearningPathWidget,
  BiasDetectionReport,
  ScaffoldingStrategyPanel,
  MetacognitionPanel,
  MicrolearningWidget,
  CompetencyDashboard,
} from '@/components/sam';
import { BloomsMasteryLoop } from '@/components/sam/BloomsMasteryLoop';

// Phase 1: Assessment Studio - AI Exam Feedback Panel
import { AIExamFeedbackPanel } from '@/components/sam/assessment-studio';
import {
  RetentionCurveChart,
  WeeklyTrendsChart,
  LevelProgressionChart,
  SkillTrajectoryChart,
  EfficiencyDashboard,
  MasteryProgressChart,
  RecommendationInsightsWidget,
} from '@/components/sam/analytics';
import { OrchestrationPanel } from '@/components/sam/OrchestrationPanel';
import { BloomsProgressChart } from '@/components/sam/student-dashboard/blooms-progress-chart';
import { CognitivePerformanceMetrics } from '@/components/sam/student-dashboard/cognitive-performance-metrics';
import { LearningPathVisualization } from '@/components/sam/student-dashboard/learning-path-visualization';
import { SkillsInventory } from '@/components/sam/student-dashboard/skills-inventory';
import { ExtendedUser } from '@/next-auth';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { BloomsLevel } from '@prisma/client';

/**
 * Stable demo user object to prevent unnecessary re-renders.
 * Used when user is not authenticated to display demo analytics data.
 */
const DEMO_USER: ExtendedUser = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com',
  image: null,
  isTwoFactorEnabled: false,
  isOAuth: false,
} satisfies ExtendedUser;

/**
 * Learning Insights Grid Component
 * Displays BloomsProgressChart, CognitivePerformanceMetrics,
 * LearningPathVisualization, and SkillsInventory in a 2x2 grid layout
 */
interface LearningInsightsGridProps {
  userId: string;
  courseId?: string;
}

interface LearningGap {
  level: BloomsLevel;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

function LearningInsightsGrid({ userId, courseId }: LearningInsightsGridProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    studentProgress: {
      bloomsScores: Record<BloomsLevel, number>;
      strengthAreas: string[];
      weaknessAreas: string[];
    } | null;
    cognitiveProfile: {
      overallCognitiveLevel: number;
      optimalLearningStyle: string;
      skillsInventory: {
        criticalThinking: number;
        creativity: number;
        problemSolving: number;
        comprehension: number;
        retention: number;
      };
      performancePatterns?: {
        trend: string;
        consistency: number;
        growthRate: number;
      };
      learningTrajectory?: Array<{
        date: string;
        score: number;
      }>;
    } | null;
    performanceMetrics: Record<BloomsLevel, {
      avgAccuracy: number;
      avgResponseTime: number;
      totalAttempts: number;
      improvementTrend: string;
    }> | null;
    recentPerformance: Array<{
      bloomsLevel: BloomsLevel;
      accuracy: number;
      avgResponseTime: number;
      totalAttempts: number;
      improvementRate: number;
      recordedAt: Date;
    }>;
  } | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch student progress data from SAM API
      const progressResponse = await fetch(
        `/api/sam/blooms-analysis/student?studentId=${userId}${courseId ? `&courseId=${courseId}` : ''}`
      );

      if (!progressResponse.ok) {
        throw new Error('Failed to fetch student progress');
      }

      const progressData = await progressResponse.json();
      setDashboardData(progressData.data);
    } catch (error) {
      logger.error('Error fetching learning insights data:', error);
      // Set demo data for display
      setDashboardData({
        studentProgress: {
          bloomsScores: {
            REMEMBER: 75,
            UNDERSTAND: 68,
            APPLY: 55,
            ANALYZE: 42,
            EVALUATE: 30,
            CREATE: 20,
          },
          strengthAreas: ['REMEMBER', 'UNDERSTAND'],
          weaknessAreas: ['EVALUATE', 'CREATE'],
        },
        cognitiveProfile: {
          overallCognitiveLevel: 48,
          optimalLearningStyle: 'visual',
          skillsInventory: {
            criticalThinking: 55,
            creativity: 45,
            problemSolving: 60,
            comprehension: 70,
            retention: 65,
          },
          performancePatterns: {
            trend: 'improving',
            consistency: 72,
            growthRate: 5.2,
          },
        },
        performanceMetrics: {
          REMEMBER: { avgAccuracy: 75, avgResponseTime: 5000, totalAttempts: 50, improvementTrend: 'stable' },
          UNDERSTAND: { avgAccuracy: 68, avgResponseTime: 8000, totalAttempts: 45, improvementTrend: 'improving' },
          APPLY: { avgAccuracy: 55, avgResponseTime: 12000, totalAttempts: 35, improvementTrend: 'improving' },
          ANALYZE: { avgAccuracy: 42, avgResponseTime: 15000, totalAttempts: 25, improvementTrend: 'stable' },
          EVALUATE: { avgAccuracy: 30, avgResponseTime: 18000, totalAttempts: 15, improvementTrend: 'declining' },
          CREATE: { avgAccuracy: 20, avgResponseTime: 25000, totalAttempts: 10, improvementTrend: 'stable' },
        },
        recentPerformance: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, courseId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
    toast({
      title: 'Refreshing',
      description: 'Updating your learning insights...',
    });
  };

  const handleActivityClick = (activity: string) => {
    toast({
      title: 'Activity Selected',
      description: `Opening ${activity}...`,
    });
  };

  // Helper functions for learning path visualization
  const buildLearningPathStages = (bloomsScores: Record<BloomsLevel, number>) => {
    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const activities: Record<BloomsLevel, string[]> = {
      REMEMBER: ['Flashcards', 'Quizzes', 'Memory Games'],
      UNDERSTAND: ['Concept Maps', 'Summaries', 'Discussions'],
      APPLY: ['Practice Problems', 'Case Studies', 'Simulations'],
      ANALYZE: ['Comparisons', 'Research', 'Data Analysis'],
      EVALUATE: ['Critiques', 'Debates', 'Reviews'],
      CREATE: ['Projects', 'Presentations', 'Original Work'],
    };

    return levels.map((level) => ({
      level,
      mastery: bloomsScores[level] || 0,
      activities: activities[level],
      timeEstimate: 30 + levels.indexOf(level) * 15,
    }));
  };

  const getCurrentStage = (bloomsScores: Record<BloomsLevel, number>) => {
    const levels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    for (let i = levels.length - 1; i >= 0; i--) {
      if ((bloomsScores[levels[i]] || 0) > 50) {
        return i;
      }
    }

    return 0;
  };

  const identifyLearningGaps = (studentProgress: typeof dashboardData extends null ? never : NonNullable<typeof dashboardData>['studentProgress']): LearningGap[] => {
    if (!studentProgress) return [];

    const gaps: LearningGap[] = [];
    const weakAreas = studentProgress.weaknessAreas || [];

    weakAreas.forEach((area: string) => {
      gaps.push({
        level: area as BloomsLevel,
        severity: 'medium' as const,
        description: `Your ${area.toLowerCase()} skills need improvement`,
        suggestions: [
          `Practice more ${area.toLowerCase()}-focused activities`,
          `Review ${area.toLowerCase()} concepts`,
          `Complete ${area.toLowerCase()} assessments`,
        ],
      });
    });

    return gaps;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-slate-500 dark:text-slate-400">Loading learning insights...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="py-12 text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400">
            No learning data available yet. Start learning to see your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { studentProgress, cognitiveProfile, performanceMetrics, recentPerformance } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Insights
        </Button>
      </div>

      {/* Top Row: Bloom&apos;s Progress Chart and Cognitive Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bloom&apos;s Progress Chart */}
        <div className="rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {studentProgress && (
            <BloomsProgressChart
              bloomsScores={studentProgress.bloomsScores}
              strengthAreas={studentProgress.strengthAreas}
              weaknessAreas={studentProgress.weaknessAreas}
              overallLevel={cognitiveProfile?.overallCognitiveLevel || 0}
            />
          )}
        </div>

        {/* Cognitive Performance Metrics */}
        <div className="rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {performanceMetrics && (
            <CognitivePerformanceMetrics
              performanceMetrics={performanceMetrics}
              recentPerformance={recentPerformance || []}
              learningTrajectory={cognitiveProfile?.learningTrajectory}
            />
          )}
        </div>
      </div>

      {/* Bottom Row: Learning Path Visualization and Skills Inventory */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Learning Path Visualization */}
        <div className="rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {studentProgress && cognitiveProfile && (
            <LearningPathVisualization
              currentPath={{
                stages: buildLearningPathStages(studentProgress.bloomsScores),
                currentStage: getCurrentStage(studentProgress.bloomsScores),
                completionPercentage: cognitiveProfile.overallCognitiveLevel || 0,
              }}
              gaps={identifyLearningGaps(studentProgress)}
              onActivityClick={handleActivityClick}
            />
          )}
        </div>

        {/* Skills Inventory */}
        <div className="rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {cognitiveProfile && (
            <SkillsInventory
              skillsInventory={cognitiveProfile.skillsInventory || {
                criticalThinking: 0,
                creativity: 0,
                problemSolving: 0,
                comprehension: 0,
                retention: 0,
              }}
              performancePatterns={cognitiveProfile.performancePatterns}
              optimalLearningStyle={cognitiveProfile.optimalLearningStyle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Advanced Analytics Content Component
 * Uses the useAdvancedAnalytics hook to fetch and display advanced analytics data
 */
function AdvancedAnalyticsContent() {
  const { data, loading, error, refresh, isStale } = useAdvancedAnalytics({
    enabled: true,
    days: 30,
  });
  const { toast } = useToast();

  const handleRefresh = () => {
    refresh();
    toast({
      title: 'Refreshing',
      description: 'Updating your advanced analytics...',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-slate-500 dark:text-slate-400">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Failed to load advanced analytics: {error}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-slate-200 dark:border-slate-700">
        <CardContent className="py-12 text-center">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="text-slate-500 dark:text-slate-400">
            No analytics data available yet. Start learning to see your progress!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Advanced Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Deep dive into your learning patterns, retention, and efficiency metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStale && (
            <span className="text-xs text-amber-600 dark:text-amber-400">Data may be outdated</span>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Mastery Progress Section */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Overall Mastery Progress
        </h3>
        <MasteryProgressChart
          masteryHistory={data.mastery.history}
          courseMastery={data.mastery.courses}
          topicMastery={data.mastery.topics}
          milestones={data.mastery.milestones}
          overallMastery={data.mastery.overallMastery}
          className="w-full"
        />
      </section>

      {/* Retention and Memory Section */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Memory Retention Analysis
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Visualize your forgetting curve and how spaced repetition improves retention
        </p>
        <RetentionCurveChart
          retentionData={data.retention.dataPoints}
          topicRetention={data.retention.topicRetention}
          averageRetention={data.retention.averageRetention}
          optimalReviewInterval={data.retention.optimalReviewInterval}
          className="w-full"
        />
      </section>

      {/* Weekly Trends Section */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Weekly Learning Patterns
        </h3>
        <WeeklyTrendsChart
          dailyData={data.weekly.dailyData}
          weeklyComparison={data.weekly.comparison}
          hourlyActivity={data.weekly.hourlyActivity}
          currentWeekGoal={data.weekly.weeklyGoal}
          className="w-full"
        />
      </section>

      {/* Two-column grid for smaller visualizations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skill Trajectory */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Skill Development Trajectories
          </h3>
          <SkillTrajectoryChart
            skills={data.skills.items}
            categories={data.skills.categories}
            targetMastery={data.skills.targetMastery}
            className="w-full"
          />
        </section>

        {/* Level Progression */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            XP &amp; Level Progression
          </h3>
          <LevelProgressionChart
            xpHistory={data.level.xpHistory}
            currentLevel={data.level.currentLevel}
            currentXP={data.level.currentXP}
            xpToNextLevel={data.level.xpToNextLevel}
            totalXP={data.level.totalXP}
            milestones={data.level.milestones}
            achievements={data.level.achievements}
            dailyXPGoal={data.level.dailyXPGoal}
            className="w-full"
          />
        </section>
      </div>

      {/* Learning Efficiency Section */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Learning Efficiency Metrics
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Analyze how effectively you convert study time into mastery
        </p>
        <EfficiencyDashboard
          metrics={data.efficiency.metrics}
          topicEfficiency={data.efficiency.topicEfficiency}
          recentSessions={data.efficiency.recentSessions}
          weeklyGoal={data.efficiency.weeklyGoal}
          className="w-full"
        />
      </section>

      {/* Recommendation Insights Section */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recommendation Effectiveness
        </h3>
        <RecommendationInsightsWidget
          insights={data.recommendations.insights}
          recentRecommendations={data.recommendations.recent}
          overallFollowRate={data.recommendations.overallFollowRate}
          overallEffectiveness={data.recommendations.overallEffectiveness}
          totalRecommendations={data.recommendations.total}
          onRefresh={handleRefresh}
          isLoading={loading}
          className="w-full"
        />
      </section>
    </div>
  );
}

/**
 * User Analytics Page - Enterprise Edition
 *
 * A comprehensive analytics dashboard with:
 * - Learning Analytics Dashboard (Phase 5) with heatmap, progress, insights
 * - Enterprise Unified Analytics for detailed metrics
 * - Proper skeleton loading states
 * - Improved empty states with CTAs
 *
 * Route: `/dashboard/user/analytics`
 * Access: Public (shows demo data if not authenticated)
 */
export default function UserAnalyticsPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'learning' | 'detailed' | 'recommendations' | 'ai-insights' | 'advanced'>('learning');

  // Memoize the user to prevent unnecessary re-renders
  const user = useMemo((): ExtendedUser | null => {
    if (status === 'loading' || !isInitialized) return null;
    if (session?.user) return session.user;
    return DEMO_USER;
  }, [session?.user, status, isInitialized]);

  // Stable error reset function
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setError('User not authenticated');
      setIsInitialized(true);
      return;
    }

    if (session?.user) {
      setError(null);
      setIsInitialized(true);
    } else {
      setError('No user data available');
      setIsInitialized(true);
    }
  }, [session?.user, status]);

  // Loading state with skeleton
  if (status === 'loading') {
    return (
      <MobileLayout
        user={null}
        showHeader={true}
        showSidebar={false}
        showBottomBar={false}
        contentClassName="bg-slate-50 dark:bg-slate-900"
      >
        <div className="p-4 sm:p-6">
          <AnalyticsDashboardSkeleton />
        </div>
      </MobileLayout>
    );
  }

  // Error state when no user
  if (error && !user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900 sm:p-6">
        <Card className="mx-auto mt-12 max-w-lg border-red-200 bg-white dark:border-red-800 dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Unable to Load Analytics</h2>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {error === 'User not authenticated'
                ? 'Sign in to view your personalized learning analytics and track your progress.'
                : 'We encountered an issue loading your analytics. This is usually temporary.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {error === 'User not authenticated' ? (
                <Button
                  onClick={() => (window.location.href = '/auth/signin')}
                  className="gap-2"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="outline" onClick={resetError}>
                  Try Again
                </Button>
              )}
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MobileLayout
      user={user}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={false}
      contentClassName="bg-slate-50 dark:bg-slate-900"
    >
      {/* Demo mode notice - subtle and non-intrusive */}
      {error && (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-center text-sm text-blue-700 dark:text-blue-300">
            Viewing demo analytics —{' '}
            <a href="/auth/signin" className="font-medium underline">
              Sign in
            </a>{' '}
            for your personalized data
          </p>
        </div>
      )}

      <div className="p-4 sm:p-6">
        {/* Analytics View Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-4xl grid-cols-5 bg-slate-100/80 dark:bg-slate-800/80">
            <TabsTrigger value="learning" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="detailed" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Detailed</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Recs</span>
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          {/* Learning Analytics Tab (Phase 5) */}
          <TabsContent value="learning">
            <AnalyticsErrorBoundary>
              <LearningAnalyticsDashboard
                defaultTab="overview"
                onRefresh={async () => {
                  // Could trigger API refresh here
                  console.log('Refreshing learning analytics...');
                }}
              />
            </AnalyticsErrorBoundary>
          </TabsContent>

          {/* Detailed Analytics Tab (Enterprise) */}
          <TabsContent value="detailed">
            <AnalyticsErrorBoundary>
              <div className="space-y-8">
                {/* Phase 1: AI Exam Feedback Panel - EvaluationEngine Integration */}
                <section>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    AI Exam Feedback
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    View AI-powered analysis and feedback from your completed exams
                  </p>
                  <AIExamFeedbackPanel
                    userId={user.id}
                    compact={false}
                    maxAttempts={10}
                    className="w-full"
                  />
                </section>

                {/* Enterprise Unified Analytics */}
                <EnterpriseUnifiedAnalytics
                  user={user}
                  variant="fullpage"
                  className="min-h-screen"
                />
              </div>
            </AnalyticsErrorBoundary>
          </TabsContent>

          {/* Advanced Analytics Tab (Phase 3) */}
          <TabsContent value="advanced">
            <AnalyticsErrorBoundary>
              <AdvancedAnalyticsContent />
            </AnalyticsErrorBoundary>
          </TabsContent>

          {/* Recommendations History Tab */}
          <TabsContent value="recommendations">
            <AnalyticsErrorBoundary>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Recommendation History
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Track your learning recommendations and actions over time
                  </p>
                </div>
                <RecommendationTimeline
                  userId={user.id}
                  limit={50}
                  groupByDate={true}
                  showFilters={true}
                  className="max-w-4xl"
                />
              </div>
            </AnalyticsErrorBoundary>
          </TabsContent>

          {/* AI Insights Tab - Meta-Learning & Learning Path */}
          <TabsContent value="ai-insights">
            <AnalyticsErrorBoundary>
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    AI-Powered Learning Insights
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Discover your learning patterns and get personalized path recommendations
                  </p>
                </div>

                {/* Two-column grid for widgets */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Meta-Learning Insights */}
                  <MetaLearningInsightsWidget
                    className="h-full"
                  />

                  {/* Learning Path */}
                  <LearningPathWidget
                    className="h-full"
                  />
                </div>

                {/* SAM Orchestration Panel - Shows AI processing pipeline */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    SAM AI Orchestration
                  </h3>
                  <OrchestrationPanel
                    compact={true}
                    className="w-full"
                  />
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Bloom&apos;s Mastery Loop
                  </h3>
                  <BloomsMasteryLoop className="w-full" />
                </div>

                {/* Scaffolding Strategies - Personalized learning approach */}
                <ScaffoldingStrategyPanel
                  userId={user.id}
                  compact={false}
                  className="w-full"
                />

                {/* AI Fairness & Bias Analysis */}
                <BiasDetectionReport
                  className="w-full"
                  autoRefresh={false}
                />

                {/* Metacognition & Self-Reflection */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Metacognition & Self-Reflection
                  </h3>
                  <MetacognitionPanel
                    compact={false}
                    className="w-full"
                  />
                </div>

                {/* Competency Framework */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Skills & Competencies
                  </h3>
                  <CompetencyDashboard
                    compact={false}
                    className="w-full"
                  />
                </div>

                {/* Microlearning Quick Sessions */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Quick Learning Sessions
                  </h3>
                  <MicrolearningWidget
                    compact={false}
                    className="w-full"
                  />
                </div>

                {/* Cognitive Development Dashboard - Bloom's Taxonomy */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    Cognitive Development
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Track your progress across Bloom&apos;s Taxonomy cognitive levels and skill development
                  </p>

                  {/* Learning Insights Grid - Direct component integration */}
                  <LearningInsightsGrid userId={user.id} />
                </div>
              </div>
            </AnalyticsErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
