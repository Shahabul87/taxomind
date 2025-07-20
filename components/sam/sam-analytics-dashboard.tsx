"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Target, 
  Brain, 
  Calendar, 
  Activity,
  Sparkles,
  Award,
  AlertCircle,
  ChevronRight,
  Eye,
  ThumbsUp,
  BookOpen,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type ComprehensiveAnalytics } from '@/lib/sam-analytics-engine';

// Chart components (simplified - in production, use a chart library like recharts)
const SimpleLineChart = ({ data, color = 'blue' }: { data: Array<{ date: string; value: number }>, color?: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  return (
    <div className="relative h-40 w-full">
      <svg className="w-full h-full">
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;
          
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              className={`fill-${color}-500`}
            />
          );
        })}
        <polyline
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke={`rgb(59, 130, 246)`}
          strokeWidth="2"
          className="opacity-50"
        />
      </svg>
    </div>
  );
};

const HeatMap = ({ data }: { data: Array<{ hour: number; frequency: number }> }) => {
  const maxFreq = Math.max(...data.map(d => d.frequency));
  
  return (
    <div className="grid grid-cols-24 gap-1">
      {data.map((hour) => {
        const intensity = maxFreq > 0 ? hour.frequency / maxFreq : 0;
        return (
          <div
            key={hour.hour}
            className={cn(
              "h-6 w-full rounded-sm",
              intensity === 0 && "bg-gray-100 dark:bg-gray-800",
              intensity > 0 && intensity <= 0.25 && "bg-blue-200 dark:bg-blue-900",
              intensity > 0.25 && intensity <= 0.5 && "bg-blue-400 dark:bg-blue-700",
              intensity > 0.5 && intensity <= 0.75 && "bg-blue-600 dark:bg-blue-600",
              intensity > 0.75 && "bg-blue-800 dark:bg-blue-500"
            )}
            title={`${hour.hour}:00 - ${hour.frequency} activities`}
          />
        );
      })}
    </div>
  );
};

interface SAMAnalyticsDashboardProps {
  courseId?: string;
}

export function SAMAnalyticsDashboard({ courseId }: SAMAnalyticsDashboardProps) {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!session?.user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/sam/analytics/comprehensive?courseId=${courseId || ''}&range=${selectedTimeRange}`);
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [session?.user?.id, courseId, selectedTimeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  const { metrics, contentInsights, behaviorPatterns, personalizedInsights, trends } = analytics;

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Learning Analytics & Insights</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Powered by SAM AI to help you understand and improve your learning
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement Score</p>
                <p className="text-2xl font-bold">{Math.round(metrics.engagementScore)}%</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={metrics.engagementScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learning Velocity</p>
                <p className="text-2xl font-bold">{metrics.learningVelocity.toFixed(1)}</p>
                <p className="text-xs text-gray-500">actions/day</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Content Quality</p>
                <p className="text-2xl font-bold">{Math.round(metrics.contentQuality * 10)}/10</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <Progress value={metrics.contentQuality * 10} max={10} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Usage</p>
                <p className="text-2xl font-bold">{Math.round(contentInsights.aiAssistanceRate)}%</p>
              </div>
              <Brain className="h-8 w-8 text-orange-600" />
            </div>
            <Progress value={contentInsights.aiAssistanceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Personalized Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {personalizedInsights.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-600" />
                  Areas for Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {personalizedInsights.areasForImprovement.map((area, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5" />
                    <p className="text-sm">{area}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {personalizedInsights.recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Next Milestone */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Next Milestone</h3>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {personalizedInsights.predictedNextMilestone}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Estimated time: {personalizedInsights.estimatedTimeToGoal} days
                  </p>
                </div>
                <Award className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Behavior Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          {/* Working Hours Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Daily Activity Pattern
              </CardTitle>
              <CardDescription>Your most active hours (0-23)</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatMap data={behaviorPatterns.workingHours} />
              <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
              <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-400">
                Most active: {metrics.mostActiveTime}
              </p>
            </CardContent>
          </Card>

          {/* Weekly Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Weekly Activity Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {behaviorPatterns.weeklyPattern.map((day) => (
                  <div key={day.day} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24">{day.day}</span>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                        style={{ 
                          width: `${(day.activity / Math.max(...behaviorPatterns.weeklyPattern.map(d => d.activity))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {day.activity}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Feature Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(behaviorPatterns.featureUsagePattern)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([feature, count]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-sm">{feature}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(count / metrics.totalInteractions) * 100} className="w-24 h-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Analytics Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Content Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Content Length</span>
                  <span className="font-medium">{Math.round(contentInsights.averageContentLength)} words</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={contentInsights.contentCompletionRate} className="w-24 h-2" />
                    <span className="font-medium">{Math.round(contentInsights.contentCompletionRate)}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Time to Complete</span>
                  <span className="font-medium">{contentInsights.timeToComplete.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Suggestion Acceptance</span>
                  <div className="flex items-center gap-2">
                    <Progress value={contentInsights.suggestionAcceptanceRate} className="w-24 h-2" />
                    <span className="font-medium">{Math.round(contentInsights.suggestionAcceptanceRate)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Most Edited Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  Focus Areas
                </CardTitle>
                <CardDescription>Sections with most edits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contentInsights.mostEditedSections.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No section data available</p>
                ) : (
                  contentInsights.mostEditedSections.map((section, index) => (
                    <div key={section.sectionId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{section.title || section.sectionId}</span>
                      </div>
                      <Badge variant="secondary">{section.editCount} edits</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Learning Path Progression */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-purple-600" />
                Learning Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {behaviorPatterns.learningPathProgression.slice(0, 10).map((milestone, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">
                      {milestone.date}
                    </span>
                    <span className="text-sm">{milestone.milestone}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Points Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Points Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={trends.pointsTrend.map(p => ({ date: p.date, value: p.points }))} 
                color="blue" 
              />
            </CardContent>
          </Card>

          {/* Engagement Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Engagement Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={trends.engagementTrend.map(e => ({ date: e.date, value: e.score }))} 
                color="green" 
              />
            </CardContent>
          </Card>

          {/* Productivity Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Productivity Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart 
                data={trends.productivityTrend.map(p => ({ date: p.date, value: p.itemsCompleted }))} 
                color="purple" 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}