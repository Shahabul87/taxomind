'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RechartsLine as Line,
  RechartsLineChart as LineChart,
  RechartsBar as Bar,
  RechartsBarChart as BarChart,
  RechartsXAxis as XAxis,
  RechartsYAxis as YAxis,
  RechartsCartesianGrid as CartesianGrid,
  RechartsTooltip as Tooltip,
  RechartsLegend as Legend,
  RechartsResponsiveContainer as ResponsiveContainer,
} from '@/components/lazy-imports';
import { Activity, Clock, TrendingUp, Award } from 'lucide-react';
import { BloomsLevel } from '@prisma/client';

interface PerformanceMetric {
  bloomsLevel: BloomsLevel;
  accuracy: number;
  avgResponseTime: number;
  totalAttempts: number;
  improvementRate: number;
  recordedAt: Date;
}

interface CognitivePerformanceMetricsProps {
  performanceMetrics: Record<BloomsLevel, any>;
  recentPerformance: PerformanceMetric[];
  learningTrajectory?: any[];
}

export function CognitivePerformanceMetrics({
  performanceMetrics,
  recentPerformance,
  learningTrajectory = [],
}: CognitivePerformanceMetricsProps) {
  // Prepare data for accuracy chart
  const accuracyData = Object.entries(performanceMetrics).map(([level, metrics]) => ({
    level: level.charAt(0) + level.slice(1).toLowerCase(),
    accuracy: metrics.avgAccuracy || 0,
    attempts: metrics.totalAttempts || 0,
  }));

  // Prepare data for response time chart
  const responseTimeData = Object.entries(performanceMetrics).map(([level, metrics]) => ({
    level: level.charAt(0) + level.slice(1).toLowerCase(),
    time: metrics.avgResponseTime || 0,
  }));

  // Prepare trend data
  const trendData = recentPerformance
    .slice(0, 10)
    .reverse()
    .map((metric, index) => ({
      day: `Day ${index + 1}`,
      accuracy: metric.accuracy,
      level: metric.bloomsLevel.charAt(0) + metric.bloomsLevel.slice(1).toLowerCase(),
    }));

  const getPerformanceInsight = (metrics: Record<BloomsLevel, any>): string => {
    const avgAccuracy = Object.values(metrics)
      .reduce((sum: number, m: any) => sum + (m.avgAccuracy || 0), 0) / 6;
    
    if (avgAccuracy > 80) return 'Excellent performance! You&apos;re mastering the material.';
    if (avgAccuracy > 60) return 'Good progress! Keep practicing to improve further.';
    if (avgAccuracy > 40) return 'You&apos;re on the right track. Focus on weak areas.';
    return 'Let&apos;s work together to improve your understanding.';
  };

  const getImprovementTrend = (metrics: Record<BloomsLevel, any>): string => {
    const trends = Object.values(metrics)
      .map((m: any) => m.improvementTrend)
      .filter(Boolean);
    
    const improving = trends.filter(t => t === 'improving').length;
    const declining = trends.filter(t => t === 'declining').length;
    
    if (improving > declining) return 'improving';
    if (declining > improving) return 'declining';
    return 'stable';
  };

  const overallTrend = getImprovementTrend(performanceMetrics);

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Average Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Object.values(performanceMetrics)
                .reduce((sum: number, m: any) => sum + (m.avgAccuracy || 0), 0) / 6
              ).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all cognitive levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Object.values(performanceMetrics)
                .reduce((sum: number, m: any) => sum + (m.avgResponseTime || 0), 0) / 6 / 1000
              ).toFixed(1)}s
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Per question
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overall Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                overallTrend === 'improving' ? 'text-green-600' :
                overallTrend === 'declining' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {overallTrend === 'improving' ? '↑' :
                 overallTrend === 'declining' ? '↓' : '→'}
              </span>
              <span className="text-lg capitalize">{overallTrend}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Based on recent performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy by Bloom's Level */}
      <Card>
        <CardHeader>
          <CardTitle>Accuracy by Cognitive Level</CardTitle>
          <CardDescription>
            How well you perform at each level of thinking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Response Time Analysis</CardTitle>
          <CardDescription>
            Average time spent on questions at each level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `${(value / 1000).toFixed(1)}s`}
                />
                <Bar dataKey="time" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Trend</CardTitle>
            <CardDescription>
              Your accuracy over the last 10 sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {getPerformanceInsight(performanceMetrics)}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommendations:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                {Object.entries(performanceMetrics).map(([level, metrics]) => {
                  if (metrics.avgAccuracy < 60) {
                    return (
                      <li key={level} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>
                          Focus on <strong>{level.charAt(0) + level.slice(1).toLowerCase()}</strong> level 
                          questions to improve your {metrics.avgAccuracy.toFixed(0)}% accuracy
                        </span>
                      </li>
                    );
                  }
                  return null;
                }).filter(Boolean)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}