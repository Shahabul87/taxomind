"use client";

import { motion } from "framer-motion";
import {
  MapPin, ChevronRight, CheckCircle2, Clock,
  Target, Sparkles, TrendingUp, BookOpen,
  Play, Loader2, RefreshCw, Trophy, Flame,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";
import Link from "next/link";
import { useLearningJourney } from "@/hooks/use-learning-journey";

interface LearningJourneyMapProps {
  user: User;
}

export function LearningJourneyMap({ user }: LearningJourneyMapProps) {
  const { data, loading, error, refresh } = useLearningJourney();

  const getNodeIcon = (type: string, status: string) => {
    if (status === "completed") return CheckCircle2;
    if (status === "current") return Play;
    if (status === "upcoming") return Clock;
    if (status === "locked") return Target;

    switch (type) {
      case "course": return BookOpen;
      case "skill": return Sparkles;
      case "milestone": return Target;
      case "project": return TrendingUp;
      case "goal": return Target;
      default: return MapPin;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case "completed": return "from-green-500 to-emerald-500";
      case "current": return "from-blue-500 to-indigo-500";
      case "upcoming": return "from-purple-500 to-pink-500";
      case "locked": return "from-gray-400 to-gray-500";
      default: return "from-gray-400 to-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "current": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "upcoming": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "locked": return "bg-gray-100 text-slate-400 dark:bg-gray-800/30 dark:text-slate-500";
      default: return "bg-gray-100 text-slate-400 dark:bg-gray-800/30 dark:text-slate-500";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-slate-400 dark:bg-gray-800/30 dark:text-slate-500";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-sm text-slate-400">Loading your learning journey...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-slate-400">{error}</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state - no goals or journey data
  if (!data || data.nodes.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-white">Your Learning Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Start Your Journey</h3>
            <p className="text-sm text-slate-400 mb-4 max-w-md">
              Create your first learning goal to begin tracking your progress and see your personalized learning path.
            </p>
            <Link href="/dashboard/user/goals?action=create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Target className="w-4 h-4 mr-2" />
                Create First Goal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { nodes, summary, currentNodeId, overallProgress } = data;
  const currentNode = nodes.find(node => node.id === currentNodeId);
  const completedNodes = nodes.filter(node => node.status === "completed");
  const upcomingNodes = nodes.filter(node => node.status === "upcoming" || node.status === "locked");

  return (
    <div className="space-y-6">
      {/* Journey Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-white">Your Learning Journey</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                className="text-slate-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-slate-700/50">
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {completedNodes.length}
                </div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-700/50">
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {currentNode ? "1" : "0"}
                </div>
                <div className="text-xs text-slate-400">In Progress</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-700/50">
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {upcomingNodes.length}
                </div>
                <div className="text-xs text-slate-400">Upcoming</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-700/50">
                <div className="text-2xl font-bold text-indigo-500 mb-1">
                  {overallProgress}%
                </div>
                <div className="text-xs text-slate-400">Progress</div>
              </div>
            </div>

            {/* Streak and XP Info */}
            {(summary.currentStreak > 0 || summary.totalXP > 0) && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                {summary.currentStreak > 0 && (
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="text-sm text-white font-medium">{summary.currentStreak} day streak</span>
                  </div>
                )}
                {summary.totalXP > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-white font-medium">{summary.totalXP.toLocaleString()} XP</span>
                  </div>
                )}
                {summary.level > 1 && (
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                    Level {summary.level}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Focus */}
      {currentNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-white">Current Focus</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {currentNode.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getStatusColor(currentNode.status)}>
                      {currentNode.status}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(currentNode.difficulty)}>
                      {currentNode.difficulty}
                    </Badge>
                    <Badge variant="outline" className="border-slate-500/50 text-slate-400">
                      {currentNode.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {currentNode.progress}%
                  </div>
                  <div className="text-sm text-slate-400">
                    {currentNode.estimatedTime}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Progress value={currentNode.progress} className="h-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    Keep going! You&apos;re making great progress.
                  </span>
                  {currentNode.url && (
                    <Link href={currentNode.url}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Continue Learning
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Journey Path */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-white">Learning Path</span>
              </CardTitle>
              <Link href="/dashboard/user/goals">
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View All Goals
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nodes.slice(0, 8).map((node, index) => {
                const NodeIcon = getNodeIcon(node.type, node.status);

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="relative flex items-center gap-4 p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all duration-200"
                  >
                    {/* Node Icon */}
                    <div className={`p-3 rounded-full bg-gradient-to-r ${getNodeColor(node.status)} text-white flex-shrink-0`}>
                      <NodeIcon className="w-5 h-5" />
                    </div>

                    {/* Node Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white truncate">
                          {node.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge className={getStatusColor(node.status)}>
                            {node.status}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(node.difficulty)}>
                            {node.difficulty}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{node.estimatedTime}</span>
                          <span className="text-slate-500">•</span>
                          <span className="capitalize">{node.type}</span>
                        </div>
                        {node.progress > 0 && node.status !== "completed" && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-600 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${node.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-300">
                              {node.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      {node.status === "current" && node.url && (
                        <Link href={node.url}>
                          <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                            Continue
                          </Button>
                        </Link>
                      )}
                      {node.status === "completed" && (
                        <div className="p-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                      {node.status === "upcoming" && (
                        <div className="p-2">
                          <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                      )}
                      {node.status === "locked" && (
                        <div className="p-2">
                          <Target className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {nodes.length > 8 && (
                <Link href="/dashboard/user/goals">
                  <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                    View {nodes.length - 8} more items
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
