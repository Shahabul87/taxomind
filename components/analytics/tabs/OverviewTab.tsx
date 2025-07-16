"use client";

import { motion } from "framer-motion";
import { Clock, Activity, Target, Zap, BookOpen, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewTabProps {
  analytics: any;
  performance: any;
  pulse: any;
}

export function OverviewTab({ analytics, performance, pulse }: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Smart Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {analytics && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Total Time</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(analytics.summary.totalLearningTime / 60)}h
                  </div>
                  <div className="text-xs text-white/80">
                    {analytics.summary.totalLearningTime % 60}m additional
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Engagement</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.summary.averageEngagementScore}%
                  </div>
                  <div className="text-xs text-white/80">Average score</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-purple-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Progress</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.summary.overallProgress}%
                  </div>
                  <div className="text-xs text-white/80">Overall completion</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.summary.currentStreak}
                  </div>
                  <div className="text-xs text-white/80">Days strong</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-indigo-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Courses</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.summary.activeCourses}
                  </div>
                  <div className="text-xs text-white/80">Active learning</div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-amber-500 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">Achievements</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {analytics.summary.totalAchievements}
                  </div>
                  <div className="text-xs text-white/80">Unlocked</div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Today's Activity Summary */}
      {pulse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Today&apos;s Learning Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl border-0 shadow-md">
                  <div className="text-2xl font-bold text-white">
                    {Math.round(pulse.todayStats.totalStudyTime / 60)}h
                  </div>
                  <div className="text-sm text-white/80">Study Time</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl border-0 shadow-md">
                  <div className="text-2xl font-bold text-white">
                    {pulse.todayStats.sessionCount}
                  </div>
                  <div className="text-sm text-white/80">Sessions</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl border-0 shadow-md">
                  <div className="text-2xl font-bold text-white">
                    {pulse.todayStats.averageEngagement}%
                  </div>
                  <div className="text-sm text-white/80">Engagement</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-rose-400 to-rose-500 rounded-xl border-0 shadow-md">
                  <div className="text-2xl font-bold text-white">
                    {pulse.weeklyMomentum.streak}
                  </div>
                  <div className="text-sm text-white/80">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}