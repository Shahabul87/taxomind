"use client";

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
  Activity,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePredictions } from "../_hooks/use-predictions";

interface SmartPredictionsProps {
  courseId: string;
}

export const SmartPredictions = ({ courseId }: SmartPredictionsProps) => {
  // Fetch predictions from API
  const { data: predictions, isLoading, error, refetch } = usePredictions(courseId);

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "text-red-500 bg-red-100 dark:bg-red-900/30";
      case "medium":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
    }
  };

  const getBurnoutIcon = (risk: string) => {
    switch (risk) {
      case "high":
        return AlertCircle;
      case "medium":
        return Activity;
      default:
        return CheckCircle2;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return { icon: TrendingUp, color: "text-emerald-500" };
      case "declining":
        return { icon: TrendingUp, color: "text-red-500 rotate-180" };
      default:
        return { icon: Activity, color: "text-blue-500" };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Analyzing your learning patterns...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data fallback
  if (!predictions) {
    return null;
  }

  const BurnoutIcon = getBurnoutIcon(predictions.burnoutRisk);
  const trendInfo = getTrendIcon(predictions.insights.weeklyTrend);
  const TrendIcon = trendInfo.icon;

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
          {predictions.daysToComplete === 0 && (
            <Badge className="bg-emerald-500 text-white border-0 mb-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Course Completed!
            </Badge>
          )}

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
              {predictions.recommendedDailyMinutes} min
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 60].map((minutes) => (
              <div
                key={minutes}
                className={cn(
                  "p-2 rounded-lg text-sm font-medium text-center transition-all duration-200",
                  Math.abs(predictions.recommendedDailyMinutes - minutes) < 15
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                )}
              >
                {minutes}m
              </div>
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

        {/* Learning Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Learning Insights
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Most Productive Day
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {predictions.insights.mostProductiveDay}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study Consistency
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {predictions.insights.studyConsistency}%
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avg Session Length
              </p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {predictions.insights.averageSessionLength} min
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Weekly Trend
              </p>
              <div className="flex items-center gap-1">
                <TrendIcon className={cn("w-4 h-4", trendInfo.color)} />
                <p className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {predictions.insights.weeklyTrend}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Note */}
        <div className="p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Brain className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>
              These predictions improve as you learn more. The system adapts to
              your unique learning patterns.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
