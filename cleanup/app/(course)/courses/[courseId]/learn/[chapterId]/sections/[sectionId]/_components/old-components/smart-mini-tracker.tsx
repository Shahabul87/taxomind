"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Calendar,
  Flame,
  Star
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SmartMiniTrackerProps {
  currentSection: number;
  totalSections: number;
  completedSections: number;
  estimatedTimePerSection?: number; // in minutes
  courseId: string;
  userId: string;
}

export const SmartMiniTracker = ({
  currentSection,
  totalSections,
  completedSections,
  estimatedTimePerSection = 10,
  courseId,
  userId
}: SmartMiniTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [sessionTime, setSessionTime] = useState(0);
  const [streak, setStreak] = useState(0);

  // Update session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Load streak from localStorage
  useEffect(() => {
    const streakData = localStorage.getItem(`streak_${courseId}_${userId}`);
    if (streakData) {
      const parsed = JSON.parse(streakData);
      setStreak(parsed.current || 0);
    }
  }, [courseId, userId]);

  const progressPercentage = (completedSections / totalSections) * 100;
  const remainingSections = totalSections - completedSections;
  const estimatedTimeRemaining = remainingSections * estimatedTimePerSection;

  // Calculate velocity (sections per minute)
  const velocity = sessionTime > 0 ? completedSections / (sessionTime / 60) : 0;
  const predictedCompletionTime = velocity > 0 ? remainingSections / velocity : estimatedTimeRemaining;

  // Calculate ETA
  const eta = new Date(Date.now() + predictedCompletionTime * 60 * 1000);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getMotivationMessage = () => {
    if (progressPercentage === 100) return "🎉 Course Complete!";
    if (progressPercentage >= 90) return "Almost there! You're crushing it!";
    if (progressPercentage >= 75) return "Great momentum! Keep pushing!";
    if (progressPercentage >= 50) return "Halfway there! You got this!";
    if (progressPercentage >= 25) return "Strong start! Stay focused!";
    return "Let's do this! 💪";
  };

  const getProgressColor = () => {
    if (progressPercentage >= 80) return "from-green-500 to-emerald-500";
    if (progressPercentage >= 60) return "from-blue-500 to-cyan-500";
    if (progressPercentage >= 40) return "from-yellow-500 to-orange-500";
    if (progressPercentage >= 20) return "from-orange-500 to-red-500";
    return "from-slate-500 to-slate-600";
  };

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Compact View */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
              getProgressColor()
            )}>
              {progressPercentage === 100 ? (
                <Trophy className="w-6 h-6 text-white" />
              ) : (
                <Target className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round(progressPercentage)}% Complete
                </p>
                {streak > 0 && (
                  <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 border-orange-300 text-orange-700 dark:text-orange-300">
                    <Flame className="w-3 h-3 mr-1" />
                    {streak}
                  </Badge>
                )}
              </div>
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full bg-gradient-to-r", getProgressColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp className="w-5 h-5 text-slate-400" />
            </motion.div>
          </button>

          {/* Expanded View */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-slate-200 dark:border-slate-700"
              >
                <div className="p-4 space-y-4">
                  {/* Motivation Message */}
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {getMotivationMessage()}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Completed
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {completedSections}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        of {totalSections} sections
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Remaining
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {remainingSections}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        sections left
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Session
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatTime(sessionTime)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        time learning
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Velocity
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {velocity.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        sections/min
                      </p>
                    </div>
                  </div>

                  {/* AI Predictions */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      AI Predictions
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Estimated completion
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Time remaining
                          </span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                          ~{Math.ceil(predictedCompletionTime)} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  {progressPercentage < 100 && (
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-2">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            Quick Tip
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            {velocity > 0.5
                              ? "You're learning fast! Take short breaks to retain more."
                              : "Take your time and absorb the content fully."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
