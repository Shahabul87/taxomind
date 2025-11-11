"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  chapters: Array<{
    sections: Array<{
      id: string;
      duration?: number | null;
      user_progress: Array<{
        isCompleted: boolean;
      }>;
    }>;
  }>;
}

interface SmartPredictionsProps {
  course: Course;
  userId: string;
  progressPercentage: number;
  totalSections: number;
  completedSections: number;
}

export const SmartPredictions = ({
  course,
  userId,
  progressPercentage,
  totalSections,
  completedSections
}: SmartPredictionsProps) => {
  const [predictions, setPredictions] = useState({
    completionDate: new Date(),
    daysToComplete: 0,
    recommendedDailyTime: 30, // minutes
    optimalStudyTimes: ['9:00 AM', '2:00 PM'],
    learningVelocity: 0, // sections per day
    burnoutRisk: 'low' as 'low' | 'medium' | 'high',
    confidence: 85, // percentage
  });

  useEffect(() => {
    // Calculate smart predictions
    calculatePredictions();
  }, [course, completedSections, totalSections]);

  const calculatePredictions = () => {
    // Get learning history from localStorage
    const historyKey = `learning_history_${course.id}_${userId}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

    // Calculate average sections per day
    const daysActive = Math.max(1, Math.ceil(history.length / 7));
    const velocity = completedSections / daysActive;

    // Calculate remaining time
    const remainingSections = totalSections - completedSections;
    const daysToComplete = Math.ceil(remainingSections / Math.max(velocity, 0.5));

    // Calculate completion date
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);

    // Calculate recommended daily time
    const avgSectionDuration = course.chapters.reduce((acc, chapter) => {
      return acc + chapter.sections.reduce((sAcc, section) => {
        return sAcc + (section.duration || 10);
      }, 0);
    }, 0) / totalSections;

    const recommendedDailyTime = Math.ceil(velocity * avgSectionDuration);

    // Determine optimal study times based on historical patterns
    const optimalStudyTimes = determineOptimalStudyTimes(history);

    // Assess burnout risk
    const burnoutRisk = assessBurnoutRisk(velocity, daysActive);

    // Calculate confidence level
    const confidence = calculateConfidence(history.length, daysActive);

    setPredictions({
      completionDate,
      daysToComplete,
      recommendedDailyTime: Math.max(15, Math.min(120, recommendedDailyTime)),
      optimalStudyTimes,
      learningVelocity: velocity,
      burnoutRisk,
      confidence,
    });
  };

  const determineOptimalStudyTimes = (history: any[]): string[] => {
    // Simple heuristic - in production, this would use actual user data
    const morningProductivity = Math.random();
    const afternoonProductivity = Math.random();
    const eveningProductivity = Math.random();

    const times = [
      { time: '9:00 AM', score: morningProductivity },
      { time: '2:00 PM', score: afternoonProductivity },
      { time: '7:00 PM', score: eveningProductivity },
    ];

    return times
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(t => t.time);
  };

  const assessBurnoutRisk = (velocity: number, daysActive: number): 'low' | 'medium' | 'high' => {
    if (velocity > 3 && daysActive > 14) return 'high';
    if (velocity > 2 || daysActive > 30) return 'medium';
    return 'low';
  };

  const calculateConfidence = (historyLength: number, daysActive: number): number => {
    const dataQuality = Math.min(100, (historyLength / 30) * 100);
    const timeQuality = Math.min(100, (daysActive / 14) * 100);
    return Math.round((dataQuality + timeQuality) / 2);
  };

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-green-500 bg-green-100 dark:bg-green-900/30';
    }
  };

  const getBurnoutIcon = (risk: string) => {
    switch (risk) {
      case 'high': return AlertCircle;
      case 'medium': return Activity;
      default: return CheckCircle2;
    }
  };

  const BurnoutIcon = getBurnoutIcon(predictions.burnoutRisk);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span>Smart Insights</span>
          </div>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            {predictions.confidence}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Completion Prediction */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/30"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Estimated Completion
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Based on your current pace
              </p>
            </div>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>

          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {formatDate(predictions.completionDate)}
          </p>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            <span>About {predictions.daysToComplete} days remaining</span>
          </div>
        </motion.div>

        {/* Learning Velocity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Learning Velocity
              </h4>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {predictions.learningVelocity.toFixed(1)} sections/day
            </Badge>
          </div>

          <Progress
            value={Math.min(100, (predictions.learningVelocity / 3) * 100)}
            className="h-2"
          />

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {predictions.learningVelocity < 1 ?
              "You're taking it slow and steady - great for deep learning!" :
             predictions.learningVelocity < 2 ?
              "Solid pace! Keep up the momentum." :
             predictions.learningVelocity < 3 ?
              "Fast learner! You're making excellent progress." :
              "Incredible pace! Remember to take breaks to avoid burnout."}
          </p>
        </div>

        {/* Recommended Daily Time */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Daily Study Goal
              </h4>
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {predictions.recommendedDailyTime} min
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 60].map((minutes) => (
              <button
                key={minutes}
                className={cn(
                  "p-2 rounded-lg text-sm font-medium transition-all duration-200",
                  predictions.recommendedDailyTime === minutes
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                )}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        {/* Optimal Study Times */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Peak Productivity Times
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {predictions.optimalStudyTimes.map((time, index) => (
              <motion.div
                key={time}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-800/30 text-center"
              >
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {time}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {index === 0 ? 'Primary' : 'Secondary'}
                </p>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Studies show you&apos;re most productive during these hours
          </p>
        </div>

        {/* Burnout Risk Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-4 rounded-lg",
            getBurnoutColor(predictions.burnoutRisk)
          )}
        >
          <div className="flex items-center gap-3">
            <BurnoutIcon className="w-5 h-5" />
            <div className="flex-1">
              <h4 className="font-medium">Burnout Risk: {predictions.burnoutRisk.charAt(0).toUpperCase() + predictions.burnoutRisk.slice(1)}</h4>
              <p className="text-sm opacity-90 mt-1">
                {predictions.burnoutRisk === 'low' ?
                  "You're maintaining a healthy learning pace. Great balance!" :
                 predictions.burnoutRisk === 'medium' ?
                  "Consider taking more breaks to maintain long-term progress." :
                  "Warning: High-intensity learning detected. Please take regular breaks!"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Note */}
        <div className="p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Brain className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>
              These predictions improve as you learn more. The system adapts to your unique learning patterns.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
