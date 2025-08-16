"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { 
  Calendar, Clock, Target, TrendingUp, 
  BookOpen, Brain, Zap, PlayCircle,
  CheckCircle2, Timer, Award, MessageSquare,
  AlertTriangle, Shield, Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIWelcomeHub } from '../smart-dashboard/AIWelcomeHub';
import { PostAnalyticsWidget } from './PostAnalyticsWidget';
import { PredictiveAnalyticsEnhanced } from '../smart-dashboard/PredictiveAnalyticsEnhanced';
import { cn } from "@/lib/utils";

interface OverviewTabEnhancedProps {
  user: User;
  enrolledCourses?: any[];
}

export function OverviewTabEnhanced({ user, enrolledCourses = [] }: OverviewTabEnhancedProps) {
  const todayStats = {
    studyTime: 42,
    goalTime: 60,
    completedTasks: 3,
    totalTasks: 7,
    focusScore: 87,
    streak: 12,
    // New SAM AI-powered metrics
    learningEfficiency: 92,
    riskLevel: "low" as "high" | "medium" | "low",
    predictedCompletion: 85,
  };

  const upcomingActivities = [
    {
      id: 1,
      title: "React Hooks Deep Dive",
      type: "lesson",
      time: "2:30 PM",
      duration: "45 min",
      status: "scheduled",
      color: "bg-blue-500",
      aiRecommended: true,
    },
    {
      id: 2,
      title: "JavaScript Quiz #3",
      type: "quiz",
      time: "4:00 PM", 
      duration: "20 min",
      status: "pending",
      color: "bg-purple-500",
      aiRecommended: false,
    },
    {
      id: 3,
      title: "Code Review Session",
      type: "meeting",
      time: "5:30 PM",
      duration: "30 min", 
      status: "scheduled",
      color: "bg-green-500",
      aiRecommended: false,
    }
  ];

  const quickActions = [
    {
      icon: PlayCircle,
      label: "Continue Learning",
      description: "Resume React course",
      color: "bg-blue-500",
      href: "/my-courses",
      aiPriority: "high",
    },
    {
      icon: Brain,
      label: "AI Tutor Chat",
      description: "Get instant help",
      color: "bg-purple-500",
      href: "/ai-tutor",
      aiPriority: "medium",
    },
    {
      icon: Target,
      label: "Practice Quiz",
      description: "Test your knowledge",
      color: "bg-green-500",
      href: "/quiz",
      aiPriority: "high",
    },
    {
      icon: Shield,
      label: "Risk Assessment",
      description: "View AI insights",
      color: "bg-orange-500",
      href: "#predictive",
      aiPriority: "low",
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "border-red-500/50 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "border-green-500/50 bg-green-50 dark:bg-green-900/20";
      default:
        return "border-gray-500/50";
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* AI Welcome Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <AIWelcomeHub user={user} />
      </motion.div>

      {/* AI Risk Alert (if needed) */}
      {todayStats.riskLevel === "high" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-lg border-2",
            getRiskColor(todayStats.riskLevel)
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100">
                SAM AI Risk Alert
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Your learning progress is at risk. SAM AI recommends immediate intervention to get back on track.
              </p>
              <Button 
                size="sm" 
                variant="destructive" 
                className="mt-2"
                onClick={() => {
                  const element = document.getElementById('predictive-analytics');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Interventions
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's Overview Grid - Enhanced with AI Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Column: Today's Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-4 sm:space-y-6"
        >
          {/* Enhanced Daily Progress Card with AI Insights */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Today&apos;s Progress
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Study Time */}
                <div className="text-center p-3 sm:p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mx-auto mb-2">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {todayStats.studyTime}m
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    of {todayStats.goalTime}m goal
                  </div>
                  <Progress 
                    value={(todayStats.studyTime / todayStats.goalTime) * 100}
                    className="mt-2 h-1.5 sm:h-2"
                  />
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    AI: On track
                  </div>
                </div>

                {/* Learning Efficiency (NEW) */}
                <div className="text-center p-3 sm:p-4 rounded-lg bg-purple-50/50 dark:bg-purple-900/20">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full mx-auto mb-2 relative">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {todayStats.learningEfficiency}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    AI efficiency
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8%
                  </Badge>
                </div>

                {/* Predicted Completion (NEW) */}
                <div className="text-center p-3 sm:p-4 rounded-lg bg-green-50/50 dark:bg-green-900/20">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-2">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {todayStats.predictedCompletion}%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    completion prob.
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    AI prediction
                  </div>
                </div>

                {/* Streak */}
                <div className="text-center p-3 sm:p-4 rounded-lg bg-orange-50/50 dark:bg-orange-900/20">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full mx-auto mb-2">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {todayStats.streak}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    day streak
                  </div>
                  <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    🔥 Hot
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Quick Actions */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Quick Actions
                </div>
                <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300">
                  AI Prioritized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {quickActions
                  .sort((a, b) => {
                    const priority: Record<string, number> = { high: 3, medium: 2, low: 1 };
                    return (priority[b.aiPriority] || 1) - (priority[a.aiPriority] || 1);
                  })
                  .map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative"
                  >
                    {action.aiPriority === "high" && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-0.5">
                          AI
                        </Badge>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className={cn(
                        "h-auto p-3 sm:p-4 flex flex-col items-center gap-2 w-full",
                        "bg-white/50 dark:bg-slate-800/50",
                        "border-slate-200/50 dark:border-slate-700/50",
                        "hover:bg-white/80 dark:hover:bg-slate-700/80",
                        action.aiPriority === "high" && "ring-2 ring-purple-500/20"
                      )}
                      onClick={() => {
                        if (action.href === "#predictive") {
                          const element = document.getElementById('predictive-analytics');
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${action.color} flex items-center justify-center`}>
                        <action.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white">
                          {action.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                          {action.description}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Upcoming Activities & Post Analytics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* AI-Enhanced Upcoming Activities */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Coming Up Today
                </div>
                <Badge variant="outline" className="text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Optimized
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {upcomingActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg",
                    "bg-white/50 dark:bg-slate-700/50",
                    "border border-slate-200/50 dark:border-slate-600/50",
                    activity.aiRecommended && "ring-1 ring-purple-500/30"
                  )}
                >
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${activity.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate flex items-center gap-2">
                      {activity.title}
                      {activity.aiRecommended && (
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time} • {activity.duration}
                    </div>
                  </div>
                  <Badge 
                    variant={activity.status === 'scheduled' ? 'default' : 'secondary'}
                    className="text-xs flex-shrink-0"
                  >
                    {activity.status}
                  </Badge>
                </motion.div>
              ))}
              
              <Button variant="outline" className="w-full mt-3 sm:mt-4 bg-white/50 dark:bg-slate-800/50 text-xs sm:text-sm">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                View Full Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Post Analytics Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PostAnalyticsWidget user={user} />
          </motion.div>
        </motion.div>
      </div>

      {/* SAM AI Predictive Analytics Section */}
      <motion.div
        id="predictive-analytics"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full"
      >
        <PredictiveAnalyticsEnhanced user={user} enrolledCourses={enrolledCourses} />
      </motion.div>

      {/* Current Learning Focus - Full Width Responsive */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="w-full"
      >
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                Current Learning Focus
              </div>
              <Badge className="bg-gradient-to-r from-green-100 to-blue-100 text-green-700 dark:from-green-900/30 dark:to-blue-900/30 dark:text-green-300">
                <Brain className="w-3 h-3 mr-1" />
                AI Personalized
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Active Course with AI Progress */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Active Course</h4>
                <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-700/50">
                  <div className="font-medium text-sm sm:text-base text-blue-900 dark:text-blue-300">
                    React Fundamentals
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 mt-1">
                    Chapter 5: Advanced Hooks
                  </div>
                  <Progress value={68} className="mt-2 sm:mt-3 h-1.5 sm:h-2" />
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      68% Complete
                    </div>
                    <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      AI: On track
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Next Milestone with AI Prediction */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Next Milestone</h4>
                <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-700/50">
                  <div className="font-medium text-sm sm:text-base text-green-900 dark:text-green-300">
                    Complete React Course
                  </div>
                  <div className="text-xs sm:text-sm text-green-700 dark:text-green-400 mt-1">
                    3 chapters remaining
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-green-600 dark:text-green-400">
                      🎯 Est. completion: 5 days
                    </div>
                    <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      85% likely
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Enhanced AI Recommendation */}
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  SAM AI Suggests
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </h4>
                <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-700/50">
                  <div className="font-medium text-sm sm:text-base text-purple-900 dark:text-purple-300">
                    Practice JavaScript Exercises
                  </div>
                  <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 mt-1">
                    Based on your learning pattern
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                    40% faster learning with practice
                  </div>
                  <Button size="sm" className="mt-2 sm:mt-3 text-xs sm:text-sm bg-purple-500 hover:bg-purple-600 text-white">
                    Start AI-Guided Practice
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}