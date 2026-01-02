"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Info,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CalibrationData {
  overallCalibration: {
    averageError: number;
    calibrationScore: number;
    overconfidentPercent: number;
    underconfidentPercent: number;
    calibratedPercent: number;
    totalSamples: number;
  };
  byTopic: Array<{
    topic: string;
    avgPredicted: number;
    avgActual: number;
    avgError: number;
    sampleSize: number;
    trend: 'improving' | 'declining' | 'insufficient_data';
  }>;
  insights: string[];
  recentLogs: Array<{
    topic: string;
    predicted: number;
    actual: number;
    error: number;
    createdAt: string;
  }>;
}

interface ConfidenceCalibrationWidgetProps {
  topic?: string;
  courseId?: string;
  compact?: boolean;
}

export function ConfidenceCalibrationWidget({
  topic,
  courseId,
  compact = false,
}: ConfidenceCalibrationWidgetProps) {
  const [data, setData] = useState<CalibrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCalibration = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (topic) params.append('topic', topic);
      if (courseId) params.append('courseId', courseId);
      params.append('days', '30');

      const response = await fetch(`/api/sam/mentor/confidence?${params}`);
      const result = await response.json();

      if (result.success && result.data.overallCalibration) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch calibration data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, courseId]);

  useEffect(() => {
    fetchCalibration();
  }, [fetchCalibration]);

  if (isLoading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-slate-400">Loading calibration data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardContent className="text-center py-12">
          <Target className="w-12 h-12 mx-auto mb-4 text-slate-500" />
          <p className="text-slate-400">
            No calibration data yet. Complete some assessments to track your confidence accuracy.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overallCalibration, byTopic, insights, recentLogs } = data;
  const calibrationScore = overallCalibration.calibrationScore * 100;

  // Determine calibration quality
  const getCalibrationQuality = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 70) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Needs Work', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  };

  const quality = getCalibrationQuality(calibrationScore);

  // Compact version for sidebar/widget
  if (compact) {
    return (
      <Card className="border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Confidence Calibration</span>
            </div>
            <Badge className={cn("text-xs", quality.bg, quality.color)}>
              {quality.label}
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Accuracy</span>
                <span className="text-white font-medium">{Math.round(calibrationScore)}%</span>
              </div>
              <Progress value={calibrationScore} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-red-500/10">
                <p className="text-lg font-bold text-red-400">
                  {Math.round(overallCalibration.overconfidentPercent)}%
                </p>
                <p className="text-[10px] text-slate-400">Over</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <p className="text-lg font-bold text-green-400">
                  {Math.round(overallCalibration.calibratedPercent)}%
                </p>
                <p className="text-[10px] text-slate-400">Accurate</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <p className="text-lg font-bold text-blue-400">
                  {Math.round(overallCalibration.underconfidentPercent)}%
                </p>
                <p className="text-[10px] text-slate-400">Under</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <div className="space-y-6">
      {/* Main Calibration Card */}
      <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <CardHeader className="relative border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Confidence Calibration</CardTitle>
                <CardDescription className="text-slate-400">
                  How well your predictions match reality
                </CardDescription>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Calibration measures how accurate your confidence predictions are.
                    A well-calibrated learner knows what they know and what they do not know.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="relative p-6">
          {/* Main Score */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#calibrationGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 440" }}
                  animate={{ strokeDasharray: `${(calibrationScore / 100) * 440} 440` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="calibrationGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{Math.round(calibrationScore)}%</span>
                <Badge className={cn("mt-1", quality.bg, quality.color)}>{quality.label}</Badge>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
              <TrendingUp className="w-5 h-5 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {Math.round(overallCalibration.overconfidentPercent)}%
              </p>
              <p className="text-xs text-red-300">Overconfident</p>
            </div>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {Math.round(overallCalibration.calibratedPercent)}%
              </p>
              <p className="text-xs text-green-300">Well Calibrated</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <TrendingDown className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {Math.round(overallCalibration.underconfidentPercent)}%
              </p>
              <p className="text-xs text-blue-300">Underconfident</p>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="space-y-2 mb-6">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                >
                  <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-300">{insight}</p>
                </motion.div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 text-center">
            Based on {overallCalibration.totalSamples} predictions over the last 30 days
          </p>
        </CardContent>
      </Card>

      {/* Topic Breakdown */}
      {byTopic.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <CardHeader className="border-b border-white/10">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <CardTitle className="text-lg text-white">Calibration by Topic</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-4">
              {byTopic.slice(0, 5).map((topic, index) => (
                <motion.div
                  key={topic.topic}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white truncate">{topic.topic}</h4>
                    <div className="flex items-center gap-2">
                      {topic.trend === 'improving' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Improving
                        </Badge>
                      )}
                      {topic.trend === 'declining' && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Declining
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Predicted</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={topic.avgPredicted * 100}
                          className="h-2 flex-1"
                          indicatorClassName="bg-purple-500"
                        />
                        <span className="text-sm text-white w-12 text-right">
                          {Math.round(topic.avgPredicted * 100)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Actual</p>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={topic.avgActual * 100}
                          className="h-2 flex-1"
                          indicatorClassName="bg-blue-500"
                        />
                        <span className="text-sm text-white w-12 text-right">
                          {Math.round(topic.avgActual * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{topic.sampleSize} samples</span>
                    <span className={cn(
                      "font-medium",
                      topic.avgError < 0.1 ? "text-green-400" :
                      topic.avgError < 0.2 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {Math.round(topic.avgError * 100)}% error
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Predictions */}
      {recentLogs.length > 0 && (
        <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-lg text-white">Recent Predictions</CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-2">
              {recentLogs.slice(0, 5).map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{log.topic}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-purple-400 font-medium">{Math.round(log.predicted * 100)}%</p>
                      <p className="text-[10px] text-slate-500">Predicted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-400 font-medium">{Math.round((log.actual ?? 0) * 100)}%</p>
                      <p className="text-[10px] text-slate-500">Actual</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      (log.error ?? 0) < 0.1 ? "bg-green-500/20 text-green-400" :
                      (log.error ?? 0) < 0.2 ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {log.error !== null && log.error !== undefined ? (
                        log.predicted > (log.actual ?? 0) ? '↑' : '↓'
                      ) : '–'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
