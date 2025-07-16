"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { 
  BookOpen,
  PlayCircle,
  Clock,
  CheckCircle,
  Circle,
  TrendingUp,
  Target,
  Calendar,
  Users,
  Star,
  ArrowRight,
  Bookmark,
  Trophy,
  Flame,
  Brain,
  Timer,
  Award,
  Activity as ActivityIcon,
  ChevronRight,
  Book,
  Play
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface LearningProgressHubProps {
  courses: any[];
  enrollments: any[];
  progress: any;
}

export default function LearningProgressHub({ 
  courses, 
  enrollments, 
  progress 
}: LearningProgressHubProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use real data from props
  const learningStats = {
    totalEnrolled: enrollments?.length || 0,
    completed: 0, // Will be calculated from real progress data
    inProgress: enrollments?.length || 0,
    weeklyHours: 0, // Will come from real analytics
    currentStreak: 0, // Will come from real analytics  
    totalHours: 0, // Will come from real analytics
    certificatesEarned: 0, // Will come from real data
    avgProgress: 0 // Will be calculated from real progress
  };

  const activeLearningPaths = enrollments?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Progress Hub</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your learning journey and achieve your goals
            </p>
          </div>
        </div>
        <Link href="/my-courses">
          <Button variant="outline" className="hidden sm:flex">
            View All Courses
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Learning Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Active
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {learningStats.totalEnrolled}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Courses</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-teal-900/20 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Completed
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {learningStats.completed}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Courses Finished</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-orange-200 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Learning
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {learningStats.weeklyHours}h
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-fuchsia-900/20 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  Average
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {learningStats.avgProgress}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progress Rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Learning Paths - Takes 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Continue Learning
            </h3>
            <Link href="/my-courses">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {activeLearningPaths.length > 0 ? (
            <div className="space-y-4">
              {activeLearningPaths.map((enrollment: any, index: number) => {
                const course = enrollment.course;
                
                return (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <div className="relative flex-shrink-0">
                            <Image
                              src={course.imageUrl || "/placeholder-course.jpg"}
                              alt={course.title}
                              className="w-20 h-20 rounded-xl object-cover"
                              width={80}
                              height={80}
                            />
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {course.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {course.category?.name || "General"}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="h-3 w-3" />
                                  <span>{course.activeLearners || 0} students</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                  Ready to continue learning?
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <BookOpen className="h-3 w-3" />
                                    <span>Course Material</span>
                                  </div>
                                  <Link href={`/courses/${course.id}/learn`}>
                                    <Button size="sm" className="text-xs h-8">
                                      <PlayCircle className="h-3 w-3 mr-1" />
                                      Continue Learning
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-dashed border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-8 text-center">
                <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Courses
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Start your learning journey by enrolling in a course
                </p>
                <Link href="/discover">
                  <Button>
                    Explore Courses
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Course Information */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">Total Enrolled</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{learningStats.totalEnrolled}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{learningStats.inProgress}</span>
              </div>
              <Link href="/my-courses">
                <Button variant="outline" size="sm" className="w-full">
                  View All Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 