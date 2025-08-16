"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Activity, Bell, Users, MessageCircle, 
  Clock, Star, TrendingUp, Zap,
  Eye, ThumbsUp, BookOpen, Award,
  Circle, CheckCircle2, AlertCircle,
  Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "next-auth";
import { useStableRealtimePulse } from '@/hooks/use-stable-analytics';

interface RealtimePulseProps {
  user: User;
}

interface LiveActivity {
  id: string;
  type: "enrollment" | "completion" | "review" | "comment" | "achievement" | "milestone";
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
  color: string;
  user?: {
    name: string;
    avatar?: string;
  };
  course?: {
    title: string;
    id: string;
  };
}

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend: "up" | "down" | "stable";
  lastUpdated: Date;
}

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  action?: string;
}

export function RealtimePulse({ user }: RealtimePulseProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Use optimized real-time pulse data with less aggressive polling
  const { 
    pulse, 
    loading, 
    error, 
    refreshPulse 
  } = useStableRealtimePulse();

  // Memoized utility functions for better performance (moved before early returns)
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "normal": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "critical": return "text-red-600";
      default: return "text-slate-400";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "normal": return CheckCircle2;
      case "warning": return AlertCircle;
      case "critical": return AlertCircle;
      default: return Circle;
    }
  }, []);

  const formatTimeAgo = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  // Utility function for notification colors
  function getNotificationColor(type: string) {
    const colors = {
      success: "bg-green-50/80 dark:bg-green-900/20 border-green-200/50 dark:border-green-500/30",
      info: "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-500/30", 
      warning: "bg-yellow-50/80 dark:bg-yellow-900/20 border-yellow-200/50 dark:border-yellow-500/30",
      error: "bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-500/30"
    };
    return colors[type as keyof typeof colors] || "bg-gray-50/80 dark:bg-gray-900/20 border-gray-200/50 dark:border-gray-500/30";
  }

  // Memoized data processing for better performance (moved before early returns)
  const systemMetrics = useMemo(() => {
    // Fallback demo data for when API is not available
    if (!pulse) {
      return [
        {
          id: "1",
          name: "Today's Study Time",
          value: 3,
          unit: "hours",
          status: "normal" as const,
          trend: "up" as const,
          lastUpdated: new Date()
        },
        {
          id: "2",
          name: "Learning Sessions",
          value: 5,
          unit: "today",
          status: "normal" as const,
          trend: "up" as const,
          lastUpdated: new Date()
        },
        {
          id: "3",
          name: "Current Streak",
          value: 7,
          unit: "days",
          status: "normal" as const,
          trend: "up" as const,
          lastUpdated: new Date()
        },
        {
          id: "4",
          name: "Engagement Score",
          value: 85,
          unit: "%",
          status: "normal" as const,
          trend: "stable" as const,
          lastUpdated: new Date()
        }
      ];
    }
    
    return [
      {
        id: "1",
        name: "Today's Study Time",
        value: Math.round(pulse.todayStats.totalStudyTime / 60) || 0,
        unit: "hours",
        status: "normal" as const,
        trend: "up" as const,
        lastUpdated: new Date()
      },
      {
        id: "2",
        name: "Learning Sessions",
        value: pulse.todayStats.sessionCount || 0,
        unit: "today",
        status: "normal" as const,
        trend: pulse.todayStats.sessionCount > 0 ? "up" as const : "stable" as const,
        lastUpdated: new Date()
      },
      {
        id: "3",
        name: "Current Streak",
        value: pulse.weeklyMomentum.streak || 0,
        unit: "days",
        status: pulse.weeklyMomentum.streak >= 3 ? "normal" as const : "warning" as const,
        trend: pulse.weeklyMomentum.streak > 3 ? "up" as const : 
               pulse.weeklyMomentum.streak < 2 ? "down" as const : "stable" as const,
        lastUpdated: new Date()
      },
      {
        id: "4",
        name: "Engagement Score",
        value: pulse.todayStats.averageEngagement || 0,
        unit: "%",
        status: pulse.todayStats.averageEngagement >= 70 ? "normal" as const : "warning" as const,
        trend: "stable" as const,
        lastUpdated: new Date()
      }
    ];
  }, [pulse]);

  const recentActivities = useMemo(() => {
    // Fallback demo data for activities
    if (!pulse) {
      return [
        {
          id: "1",
          type: "completion" as const,
          title: "Completed",
          description: "React Fundamentals - Chapter 3",
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          icon: CheckCircle2,
          color: "text-green-600",
          user: { name: user.name || 'You' }
        },
        {
          id: "2", 
          type: "enrollment" as const,
          title: "Started Learning",
          description: "Advanced JavaScript Concepts",
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          icon: BookOpen,
          color: "text-blue-600",
          user: { name: user.name || 'You' }
        },
        {
          id: "3",
          type: "achievement" as const,
          title: "Quiz Taken",
          description: "JavaScript Quiz - Score: 85%",
          timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          icon: Award,
          color: "text-purple-600",
          user: { name: user.name || 'You' }
        }
      ];
    }
    
    // Return fallback activities since pulse.recentActivities doesn't exist in the current data structure
    return [
      {
        id: "fallback-1",
        type: "completion" as const,
        title: "Chapter Completed",
        description: "You completed a learning section",
        timestamp: new Date(),
        icon: CheckCircle2,
        color: "text-green-500",
        user: { name: user.name || 'You' }
      }
    ];
  }, [pulse, user.name]);

  const notifications = useMemo(() => {
    // Fallback demo data for notifications
    if (!pulse) {
      return [
        {
          id: "1",
          type: "success" as const,
          title: "Great Progress!",
          message: "You've completed 3 chapters this week. Keep up the excellent work!",
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          read: false,
          actionable: true,
          action: "View Progress"
        },
        {
          id: "2",
          type: "info" as const,
          title: "Learning Recommendation",
          message: "Based on your progress, we recommend practicing more JavaScript exercises.",
          timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
          read: false,
          actionable: true,
          action: "View Exercises"
        },
        {
          id: "3",
          type: "warning" as const,
          title: "Study Reminder",
          message: "You haven't studied in 2 days. Consider a quick review session.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: true,
          actionable: true,
          action: "Start Session"
        }
      ];
    }
    
    // Return fallback notifications since pulse.aiInsights doesn't exist in the current data structure
    return [
      {
        id: "fallback-notification-1",
        type: "info" as const,
        title: "Keep Learning!",
        message: "You're making great progress with your courses",
        timestamp: new Date(),
        read: false,
        actionable: false,
        action: undefined
      }
    ];
  }, [pulse]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Reduced time update frequency to minimize visual movement
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds to reduce visual movement
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600 dark:text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">Loading real-time pulse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-red-200/50 dark:border-red-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error loading pulse data</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {error}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPulse}
            className="mt-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  function getActivityTitle(activityType: string): string {
    if (activityType.includes('COMPLETE')) return 'Completed';
    if (activityType.includes('START')) return 'Started Learning';
    if (activityType.includes('QUIZ')) return 'Quiz Taken';
    return 'Activity';
  }

  function getActivityIcon(activityType: string) {
    if (activityType.includes('COMPLETE')) return CheckCircle2;
    if (activityType.includes('START')) return BookOpen;
    if (activityType.includes('QUIZ')) return Award;
    return Activity;
  }

  function getActivityColor(activityType: string): string {
    if (activityType.includes('COMPLETE')) return 'text-green-600';
    if (activityType.includes('START')) return 'text-blue-600';
    if (activityType.includes('QUIZ')) return 'text-purple-600';
    return 'text-slate-600';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* System Metrics */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-900/30 dark:to-cyan-900/20 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-800 dark:text-slate-100 font-semibold">Learning Pulse</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    false ? 'bg-green-500 shadow-green-500/50 shadow-lg animate-pulse' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Offline
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={refreshPulse}
                    className="h-6 w-6 p-0 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => {
              const StatusIcon = getStatusIcon(metric.status);
              return (
                <div
                  key={metric.id}
                  className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-600/30 rounded-lg backdrop-blur-sm hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-4 h-4 ${getStatusColor(metric.status)}`} />
                    <div>
                      <h4 className="font-medium text-slate-800 dark:text-slate-100">{metric.name}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {formatTimeAgo(metric.lastUpdated)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {metric.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">{metric.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Activities */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/30 dark:from-green-900/30 dark:to-emerald-900/20 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100/80 dark:bg-green-900/40 backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-slate-800 dark:text-slate-100 font-semibold">Live Activities</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {recentActivities.slice(0, 5).map((activity, index) => {
              const ActivityIcon = activity.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-white/40 dark:bg-slate-800/40 border border-slate-200/30 dark:border-slate-600/30 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="p-2 rounded-full bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm">
                    <ActivityIcon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-800 dark:text-slate-100">{activity.title}</h4>
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{activity.description}</p>
                    {activity.user && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-500">{activity.user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/30 dark:from-purple-900/30 dark:to-violet-900/20 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100/80 dark:bg-purple-900/40 backdrop-blur-sm relative">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs text-white font-bold">
                    {unreadNotifications}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="text-slate-800 dark:text-slate-100 font-semibold">AI Insights</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {unreadNotifications} new insights
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-2 backdrop-blur-sm ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-800 dark:text-slate-100">{notification.title}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{notification.message}</p>
                {notification.actionable && (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
                    {notification.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}