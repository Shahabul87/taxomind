'use client';

/**
 * TeacherSAMInsights
 *
 * SAM AI insights panel for teachers to monitor student learning patterns
 * and identify students who may be struggling.
 *
 * Features:
 * - Student behavior pattern analysis
 * - Struggle detection alerts
 * - Class-wide learning insights
 * - AI confidence calibration metrics
 * - SAM quality metrics monitoring
 * - Course health oversight dashboard
 */

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  Users,
  TrendingUp,
  Activity,
  Target,
  BarChart3,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// SAM AI Components
import { BehaviorPatternsWidget, StruggleDetectionAlert } from '@/components/sam/behavior';
import { CalibrationChart } from '@/components/sam/confidence';
import { QualityMetricsPanel } from '@/components/sam/observability';
import { CourseCreatorOversightDashboard } from '@/components/sam/mentor-dashboard/course-creator-oversight-dashboard';
import { PredictiveInsights } from '@/components/sam/PredictiveInsights';
import { TrendsExplorer } from '@/components/sam/TrendsExplorer';

// ============================================================================
// TYPES
// ============================================================================

interface TeacherSAMInsightsProps {
  userId: string;
  className?: string;
}

// Calibration data type for CalibrationChart
interface CalibrationBucket {
  label: string;
  rangeMin: number;
  rangeMax: number;
  predictedConfidence: number;
  actualAccuracy: number;
  sampleCount: number;
}

interface CalibrationData {
  calibrationScore: number;
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number;
  buckets: CalibrationBucket[];
  totalSamples: number;
  lastUpdated: string;
}

// ============================================================================
// DEFAULT CALIBRATION DATA
// ============================================================================

const DEFAULT_CALIBRATION_DATA: CalibrationData = {
  calibrationScore: 0.85,
  trend: 'improving',
  trendPercentage: 3.2,
  buckets: [
    {
      label: '90-100%',
      rangeMin: 0.9,
      rangeMax: 1.0,
      predictedConfidence: 0.95,
      actualAccuracy: 0.92,
      sampleCount: 45,
    },
    {
      label: '80-90%',
      rangeMin: 0.8,
      rangeMax: 0.9,
      predictedConfidence: 0.85,
      actualAccuracy: 0.83,
      sampleCount: 78,
    },
    {
      label: '70-80%',
      rangeMin: 0.7,
      rangeMax: 0.8,
      predictedConfidence: 0.75,
      actualAccuracy: 0.72,
      sampleCount: 62,
    },
    {
      label: '60-70%',
      rangeMin: 0.6,
      rangeMax: 0.7,
      predictedConfidence: 0.65,
      actualAccuracy: 0.68,
      sampleCount: 34,
    },
    {
      label: '50-60%',
      rangeMin: 0.5,
      rangeMax: 0.6,
      predictedConfidence: 0.55,
      actualAccuracy: 0.58,
      sampleCount: 21,
    },
  ],
  totalSamples: 240,
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeacherSAMInsights({
  userId,
  className,
}: TeacherSAMInsightsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [calibrationPeriod, setCalibrationPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [qualityPeriod, setQualityPeriod] = useState<'day' | 'week' | 'month'>('week');

  // Memoize calibration data to prevent unnecessary re-renders
  const calibrationData = useMemo(() => DEFAULT_CALIBRATION_DATA, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500" />
            SAM AI Teaching Insights
          </CardTitle>
          <CardDescription>
            AI-powered analytics to help you understand and support your students better
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Struggle Detection Alert - Shows when students are struggling */}
      <StruggleDetectionAlert
        position="inline"
        currentTopic="your students"
        onRequestHelp={(struggle) => {
          console.log('Teacher requesting help for struggle:', struggle);
        }}
        onTakeBreak={() => {
          console.log('Teacher taking a break');
        }}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="course-health" className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4" />
            <span className="hidden sm:inline">Course Health</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="ai-quality" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">AI Quality</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Learning Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Class Engagement</span>
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Good
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students Struggling</span>
                    <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
                      3 need attention
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Progress Rate</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Learners Today</span>
                    <span className="text-sm font-medium">24/30</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alert Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Attention Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      3 students showing struggle patterns
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      In Chapter 3: Data Structures
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/30">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      5 students haven&apos;t logged in for 3+ days
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Consider sending a reminder
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Insights - AI-powered learning predictions */}
            <PredictiveInsights
              className="lg:col-span-2"
              compact={false}
            />
          </div>
        </TabsContent>

        {/* Course Health Tab */}
        <TabsContent value="course-health" className="mt-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-rose-500" />
                Course Health Oversight
              </CardTitle>
              <CardDescription>
                Monitor course performance, identify at-risk learners, and manage interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseCreatorOversightDashboard
                onStudentSelect={(userId) => {
                  console.log('Selected student:', userId);
                  // Future: Navigate to student profile or open detail modal
                }}
                onInterventionCreate={(intervention) => {
                  console.log('Intervention created:', intervention);
                  // Future: Show success toast or update UI
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BehaviorPatternsWidget
              maxPatterns={8}
              showDetect
              className="lg:col-span-2"
            />

            {/* Trends Explorer - Analyze learning trends over time */}
            <TrendsExplorer
              className="lg:col-span-2"
              compact={false}
            />
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Insights Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Student Insights
                </CardTitle>
                <CardDescription>
                  AI-detected patterns for your students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Placeholder for student-specific insights */}
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      Student-specific insights will appear here as SAM analyzes learning patterns
                    </p>
                    <p className="text-xs mt-2">
                      Based on enrollment data, quiz performance, and engagement metrics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Struggle Detection for Students */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Students Needing Support
                </CardTitle>
                <CardDescription>
                  Students showing struggle patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StruggleDetectionAlert
                  position="inline"
                  currentTopic="course material"
                  onRequestHelp={(struggle) => {
                    console.log('Teacher requesting help for student struggle:', struggle);
                  }}
                  onTakeBreak={() => {
                    console.log('Recommending break for students');
                  }}
                />
              </CardContent>
            </Card>

            {/* Behavior Patterns for All Students */}
            <BehaviorPatternsWidget
              maxPatterns={6}
              showDetect={false}
              compact
              className="lg:col-span-2"
            />
          </div>
        </TabsContent>

        {/* AI Quality Tab */}
        <TabsContent value="ai-quality" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calibration Chart */}
            <CalibrationChart
              data={calibrationData}
              period={calibrationPeriod}
              onPeriodChange={setCalibrationPeriod}
              showBreakdown
            />

            {/* Quality Metrics Panel */}
            <QualityMetricsPanel
              period={qualityPeriod}
              onPeriodChange={setQualityPeriod}
              showBreakdown
              refreshInterval={60000}
            />

            {/* AI Quality Summary Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  AI Performance Summary
                </CardTitle>
                <CardDescription>
                  Overview of SAM AI performance metrics for your courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-xs text-muted-foreground">Calibration Score</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-xs text-muted-foreground">Response Accuracy</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">4.6/5</div>
                    <div className="text-xs text-muted-foreground">Student Satisfaction</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">240</div>
                    <div className="text-xs text-muted-foreground">AI Interactions</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    SAM AI is performing well with your students. The calibration score indicates
                    that AI confidence levels accurately reflect actual performance. Continue
                    monitoring these metrics to ensure optimal learning support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TeacherSAMInsights;
