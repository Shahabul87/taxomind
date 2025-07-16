"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Play, Clock, Target, TrendingUp, 
  ArrowRight, CheckCircle2, Star, Brain,
  Calendar, Users, MessageSquare, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User } from "next-auth";
import Link from "next/link";

interface SmartLearningHubProps {
  user: User;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
  totalLessons: number;
  completedLessons: number;
  estimatedTime: string;
  lastActivity: string;
}

interface LearningGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: 'on-track' | 'behind' | 'ahead';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

export function SmartLearningHub({ user }: SmartLearningHubProps) {
  // Mock data - in real app, this would come from APIs
  const [activeCourses] = useState<CourseProgress[]>([
    {
      id: "1",
      title: "React Fundamentals",
      progress: 68,
      nextLesson: "useState and useEffect",
      totalLessons: 12,
      completedLessons: 8,
      estimatedTime: "2 hours remaining",
      lastActivity: "2 hours ago"
    },
    {
      id: "2", 
      title: "JavaScript Advanced",
      progress: 34,
      nextLesson: "Async/Await Patterns",
      totalLessons: 15,
      completedLessons: 5,
      estimatedTime: "4 hours remaining",
      lastActivity: "1 day ago"
    }
  ]);

  const [learningGoals] = useState<LearningGoal[]>([
    {
      id: "1",
      title: "Daily Study Time",
      target: 60,
      current: 42,
      unit: "minutes",
      deadline: "Today",
      status: 'on-track'
    },
    {
      id: "2",
      title: "Weekly Progress",
      target: 3,
      current: 2,
      unit: "lessons",
      deadline: "This week",
      status: 'on-track'
    }
  ]);

  const [smartActions] = useState<QuickAction[]>([
    {
      id: "1",
      title: "Continue Learning",
      description: "Resume React course",
      icon: Play,
      color: "bg-purple-500",
      url: "/my-courses",
      priority: 'high'
    },
    {
      id: "2",
      title: "Practice Quiz",
      description: "Test your knowledge",
      icon: Target,
      color: "bg-blue-500", 
      url: "/quiz",
      priority: 'high'
    },
    {
      id: "3",
      title: "Join Study Group",
      description: "Learn with others",
      icon: Users,
      color: "bg-green-500",
      url: "/groups",
      priority: 'medium'
    },
    {
      id: "4",
      title: "AI Tutor Help",
      description: "Get instant assistance",
      icon: Brain,
      color: "bg-orange-500",
      url: "/ai-tutor",
      priority: 'medium'
    }
  ]);

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'on-track': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      case 'behind': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Continue Learning
          </h3>
          <Link href="/my-courses">
            <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {activeCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {course.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Next: {course.nextLesson}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {course.progress}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Progress value={course.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                      <span>{course.estimatedTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400">
                      Last activity: {course.lastActivity}
                    </span>
                    <Link href={`/courses/${course.id}/learn`}>
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                        <Play className="w-4 h-4 mr-1" />
                        Continue
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Learning Goals */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Today&apos;s Goals
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {learningGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {goal.title}
                    </h4>
                    <Badge className={getGoalStatusColor(goal.status)}>
                      {goal.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Deadline: {goal.deadline}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Smart Actions */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recommended Actions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {smartActions.filter(action => action.priority === 'high').map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={action.url}>
                <Card className="bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-1">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Learning Insights
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200/50 dark:border-purple-700/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">87%</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Completion Rate</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200/50 dark:border-blue-700/50">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">12</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Day Streak</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200/50 dark:border-green-700/50">
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">94</div>
              <div className="text-xs text-green-600 dark:text-green-400">AI Score</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200/50 dark:border-orange-700/50">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">2/3</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Weekly Goals</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}