"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, PenTool, Users, Target, 
  Zap, ChevronRight, Clock, Star,
  MessageCircle, Trophy, TrendingUp,
  Play, Pause, RotateCcw, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "next-auth";
import Link from "next/link";

interface SmartActionDashboardProps {
  user: User;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  url: string;
  type: "primary" | "secondary" | "tertiary";
  estimatedTime?: string;
  isNew?: boolean;
}

interface RecentActivity {
  id: string;
  title: string;
  type: "course" | "quiz" | "project" | "discussion";
  progress: number;
  lastAccessed: string;
  url: string;
}

export function SmartActionDashboard({ user }: SmartActionDashboardProps) {
  const [quickActions] = useState<QuickAction[]>([
    {
      id: "1",
      title: "Continue Learning",
      description: "Pick up where you left off",
      icon: Play,
      color: "from-purple-600 to-blue-600",
      url: "/courses/react-basics/learn",
      type: "primary",
      estimatedTime: "15 min"
    },
    {
      id: "2",
      title: "Take Quiz",
      description: "Test your knowledge",
      icon: Zap,
      color: "from-purple-500 to-pink-600",
      url: "/quiz/quick-react",
      type: "secondary",
      estimatedTime: "5 min"
    },
    {
      id: "3",
      title: "AI Tutor Session",
      description: "Get personalized help",
      icon: MessageCircle,
      color: "from-green-500 to-emerald-600",
      url: "/ai-tutor",
      type: "secondary",
      estimatedTime: "10 min",
      isNew: true
    },
    {
      id: "4",
      title: "Create Course",
      description: "Share your knowledge",
      icon: PenTool,
      color: "from-orange-500 to-red-600",
      url: "/courses/create",
      type: "tertiary"
    },
    {
      id: "5",
      title: "Join Study Group",
      description: "Learn with others",
      icon: Users,
      color: "from-blue-500 to-purple-600",
      url: "/groups/active",
      type: "tertiary"
    },
    {
      id: "6",
      title: "View Analytics",
      description: "Track your progress",
      icon: TrendingUp,
      color: "from-purple-500 to-blue-500",
      url: "/my-courses/analytics",
      type: "tertiary"
    }
  ]);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      title: "React Hooks Deep Dive",
      type: "course",
      progress: 65,
      lastAccessed: "2 hours ago",
      url: "/courses/react-hooks"
    },
    {
      id: "2",
      title: "JavaScript Fundamentals Quiz",
      type: "quiz",
      progress: 100,
      lastAccessed: "1 day ago",
      url: "/quiz/js-fundamentals"
    },
    {
      id: "3",
      title: "Build a Todo App",
      type: "project",
      progress: 30,
      lastAccessed: "2 days ago",
      url: "/projects/todo-app"
    },
    {
      id: "4",
      title: "React Best Practices Discussion",
      type: "discussion",
      progress: 0,
      lastAccessed: "3 days ago",
      url: "/discussions/react-best-practices"
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "course": return BookOpen;
      case "quiz": return Zap;
      case "project": return Target;
      case "discussion": return MessageCircle;
      default: return BookOpen;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "course": return "text-blue-600";
      case "quiz": return "text-purple-600";
      case "project": return "text-green-600";
      case "discussion": return "text-orange-600";
      default: return "text-slate-400";
    }
  };

  const primaryActions = quickActions.filter(action => action.type === "primary");
  const secondaryActions = quickActions.filter(action => action.type === "secondary");
  const tertiaryActions = quickActions.filter(action => action.type === "tertiary");

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Smart Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {primaryActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={action.url}>
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-6 bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <ActionIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{action.title}</h3>
                              {action.isNew && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{action.description}</p>
                            {action.estimatedTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">{action.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-purple-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-white">Quick Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={action.url}>
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-4 bg-slate-800/60 hover:bg-slate-700/80 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`p-2 rounded-full bg-gradient-to-r ${action.color} text-white group-hover:scale-110 transition-transform`}>
                            <ActionIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-white">{action.title}</h4>
                              {action.isNew && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-400">{action.description}</p>
                            {action.estimatedTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-xs text-slate-500">{action.estimatedTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-slate-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-100">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <span className="text-white">Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={activity.url}>
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-3 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`p-2 rounded-full bg-white/60 group-hover:bg-white/80 transition-colors`}>
                            <ActivityIcon className={`w-4 h-4 ${getActivityColor(activity.type)}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-medium text-white mb-1">{activity.title}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500">{activity.lastAccessed}</span>
                              {activity.progress > 0 && (
                                <span className="text-xs font-medium text-slate-300">
                                  {activity.progress}%
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tertiary Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-green-50/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Plus className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-white">Explore More</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tertiaryActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={action.url}>
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 rounded-lg transition-all duration-200 group"
                      >
                        <div className="text-center">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${action.color} text-white mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                            <ActionIcon className="w-5 h-5" />
                          </div>
                          <h4 className="font-medium text-white mb-1">{action.title}</h4>
                          <p className="text-sm text-slate-400">{action.description}</p>
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}