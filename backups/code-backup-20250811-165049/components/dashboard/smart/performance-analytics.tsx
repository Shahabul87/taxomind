"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Award,
  Users,
  BookOpen,
  Activity,
  Zap,
  Brain,
  Star,
  ArrowUp,
  ArrowDown,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

interface PerformanceAnalyticsProps {
  analytics: any;
  trends: any;
  benchmarks: any;
}

export default function PerformanceAnalytics({ 
  analytics, 
  trends, 
  benchmarks 
}: PerformanceAnalyticsProps) {
  // Ensure props are defined to prevent undefined errors
  const safeAnalytics = analytics || null;
  const safeTrends = trends || null;
  const safeBenchmarks = benchmarks || null;

  // Mock analytics data
  const mockAnalytics = {
    learningVelocity: {
      current: 85,
      previous: 78,
      trend: "up",
      description: "Lessons completed per week"
    },
    engagementScore: {
      current: 92,
      previous: 89,
      trend: "up", 
      description: "Overall platform engagement"
    },
    retentionRate: {
      current: 76,
      previous: 82,
      trend: "down",
      description: "Course completion rate"
    },
    averageSessionTime: {
      current: 45,
      previous: 38,
      trend: "up",
      description: "Minutes per session"
    }
  };

  const mockTrends = {
    weeklyProgress: [
      { week: "Week 1", lessons: 5, hours: 8 },
      { week: "Week 2", lessons: 7, hours: 12 },
      { week: "Week 3", lessons: 4, hours: 6 },
      { week: "Week 4", lessons: 9, hours: 15 },
      { week: "Week 5", lessons: 6, hours: 10 },
      { week: "Week 6", lessons: 8, hours: 13 },
      { week: "Week 7", lessons: 11, hours: 18 }
    ],
    skillAcquisition: [
      { skill: "React", progress: 85, change: +12 },
      { skill: "TypeScript", progress: 70, change: +15 },
      { skill: "Node.js", progress: 65, change: -3 },
      { skill: "System Design", progress: 45, change: +8 }
    ],
    monthlyGoals: {
      completed: 3,
      total: 5,
      onTrack: 1,
      behind: 1
    }
  };

  const displayAnalytics = safeAnalytics || mockAnalytics;
  const displayTrends = safeTrends || mockTrends;

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? ArrowUp : ArrowDown;
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400";
  };

  const analyticsCards = [
    {
      title: "Learning Velocity",
      ...displayAnalytics.learningVelocity,
      icon: TrendingUp,
      color: "blue"
    },
    {
      title: "Engagement Score", 
      ...displayAnalytics.engagementScore,
      icon: Activity,
      color: "green"
    },
    {
      title: "Retention Rate",
      ...displayAnalytics.retentionRate,
      icon: Target,
      color: "orange"
    },
    {
      title: "Session Time",
      ...displayAnalytics.averageSessionTime,
      icon: Clock,
      color: "purple"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const maxLessons = Math.max(...(displayTrends.weeklyProgress || []).map((w: any) => w.lessons || 0));
  const maxHours = Math.max(...(displayTrends.weeklyProgress || []).map((w: any) => w.hours || 0));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Performance Analytics</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Insights into your learning patterns and progress
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Brain className="h-3 w-3 mr-1" />
            AI Analyzed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analyticsCards.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = getTrendIcon(metric.trend);
            const trendColor = getTrendColor(metric.trend);
            const colorClasses = getColorClasses(metric.color);
            
            return (
              <motion.div
                key={`metric-${metric.title}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${colorClasses} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {metric.current > metric.previous ? '+' : ''}
                          {metric.current - metric.previous}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {metric.current}
                        {metric.title.includes('Rate') || metric.title.includes('Score') ? '%' : ''}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {metric.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {metric.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Weekly Progress Chart */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            Weekly Learning Progress
          </h4>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="space-y-4">
              {(displayTrends.weeklyProgress || []).map((week: any, index: number) => (
                <motion.div
                  key={`week-${week.week}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
                    {week.week}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Lessons</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {week.lessons}
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(week.lessons / maxLessons) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Hours</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {week.hours}h
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(week.hours / maxHours) * 100}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Progression */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            Skill Acquisition Trends
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(displayTrends.skillAcquisition || []).map((skill: any, index: number) => (
              <motion.div
                key={`skill-${skill.skill}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {skill.skill}
                  </span>
                  <div className={`flex items-center gap-1 ${skill.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {skill.change >= 0 ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {skill.change > 0 ? '+' : ''}{skill.change}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={skill.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{skill.progress}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Goals Summary */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            Monthly Goals Status
          </h4>
          
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            >
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {displayTrends.monthlyGoals?.completed || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85 }}
              className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            >
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {displayTrends.monthlyGoals?.onTrack || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">On Track</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
            >
              <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                {displayTrends.monthlyGoals?.behind || 0}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Behind</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.95 }}
              className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {displayTrends.monthlyGoals?.total || 5}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Goals</p>
            </motion.div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Performance Insights</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              📈 <strong>Strong momentum:</strong> Your learning velocity has increased by 9% this month, indicating improved focus and consistency.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              ⏰ <strong>Optimal learning time:</strong> Your highest engagement occurs between 9-11 AM. Consider scheduling important lessons during this window.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              🎯 <strong>Goal optimization:</strong> You&apos;re 15% more likely to complete goals when broken into smaller milestones. Consider restructuring your current objectives.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Detailed Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 