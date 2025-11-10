"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  Play,
  CheckCircle,
  Target,
  Brain,
  BarChart3,
  Zap,
  Users,
  Star,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LearnerDashboardProps {
  user: User;
}

export function LearnerDashboard({ user }: LearnerDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [learningStreak, setLearningStreak] = useState(7);
  const [completedCourses, setCompletedCourses] = useState(3);
  const [enrolledCourses, setEnrolledCourses] = useState(12);
  const [certificates, setCertificates] = useState(3);

  // Mock data for demonstration
  const recentCourses = [
    {
      id: "1",
      title: "Advanced React Patterns",
      instructor: "John Doe",
      progress: 75,
      thumbnail: "/placeholder-course.jpg",
      lastAccessed: "2 hours ago",
      totalLessons: 24,
      completedLessons: 18
    },
    {
      id: "2",
      title: "Node.js Microservices",
      instructor: "Jane Smith",
      progress: 45,
      thumbnail: "/placeholder-course.jpg",
      lastAccessed: "Yesterday",
      totalLessons: 32,
      completedLessons: 14
    },
    {
      id: "3",
      title: "TypeScript Fundamentals",
      instructor: "Bob Johnson",
      progress: 90,
      thumbnail: "/placeholder-course.jpg",
      lastAccessed: "3 days ago",
      totalLessons: 20,
      completedLessons: 18
    }
  ];

  const upcomingDeadlines = [
    { course: "Advanced React Patterns", task: "Final Project", dueIn: "2 days", type: "assignment" },
    { course: "Node.js Microservices", task: "Quiz 3", dueIn: "5 days", type: "quiz" },
    { course: "TypeScript Fundamentals", task: "Certification Exam", dueIn: "1 week", type: "exam" }
  ];

  const achievements = [
    { id: 1, name: "Fast Learner", description: "Complete 5 lessons in one day", icon: Zap, earned: true },
    { id: 2, name: "Consistent", description: "7-day learning streak", icon: TrendingUp, earned: true },
    { id: 3, name: "Explorer", description: "Enroll in 10 courses", icon: Brain, earned: true },
    { id: 4, name: "Expert", description: "Earn 5 certificates", icon: Award, earned: false }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-xl shadow-md p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
            <p className="text-sm sm:text-base text-indigo-100 mb-4">
              You&apos;re on a {learningStreak}-day learning streak! Keep it up! 🔥
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/courses">
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-white border-white hover:bg-white/20" asChild>
                <Link href="/my-courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Courses
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-bold">{completedCourses}</div>
            <div className="text-xs sm:text-sm text-indigo-100">Courses Completed</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrolledCourses}</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Certificates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{certificates}</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">124</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">89%</p>
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs sm:text-sm">My Courses</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs sm:text-sm">Achievements</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs sm:text-sm">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent Courses */}
            <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
                <CardTitle className="text-gray-900 dark:text-white">Continue Learning</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">Pick up where you left off</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">by {course.instructor}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={course.progress} className="flex-1 h-2" />
                        <span className="text-xs font-medium">{course.progress}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {course.completedLessons}/{course.totalLessons} lessons • {course.lastAccessed}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/courses/${course.id}/learn`} aria-label={`Continue ${course.title}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
              <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
                <CardTitle className="text-gray-900 dark:text-white">Upcoming Deadlines</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">Don&apos;t miss these important dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        deadline.type === "assignment" && "bg-blue-100 dark:bg-blue-900/30",
                        deadline.type === "quiz" && "bg-green-100 dark:bg-green-900/30",
                        deadline.type === "exam" && "bg-red-100 dark:bg-red-900/30"
                      )}>
                        {deadline.type === "assignment" && <Target className="h-4 w-4 text-blue-600" />}
                        {deadline.type === "quiz" && <Brain className="h-4 w-4 text-green-600" />}
                        {deadline.type === "exam" && <Award className="h-4 w-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{deadline.task}</p>
                        <p className="text-xs text-muted-foreground">{deadline.course}</p>
                      </div>
                    </div>
                    <Badge variant={deadline.dueIn.includes("day") ? "destructive" : "secondary"}>
                      {deadline.dueIn}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Learning Progress */}
          <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
            <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
              <CardTitle className="text-gray-900 dark:text-white">Learning Progress This Week</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your daily study time and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                  // Use deterministic values based on index
                  const progressValue = index === 0 ? 100 : 
                                       index === 1 ? 80 : 
                                       index === 2 ? 60 :
                                       index === 3 ? 40 :
                                       index === 4 ? 20 : 0;
                  const hoursValue = index === 0 ? "3h" :
                                    index === 1 ? "3h" :
                                    index === 2 ? "2h" :
                                    index === 3 ? "2h" :
                                    index === 4 ? "1h" : "0h";
                  
                  return (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-10">{day}</span>
                      <Progress 
                        value={progressValue} 
                        className="flex-1 h-3" 
                      />
                      <span className="text-sm text-muted-foreground w-16">
                        {hoursValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentCourses.map((course) => (
              <Card key={course.id} className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-500 rounded-t-xl" />
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{course.instructor}</p>
                  <Progress value={course.progress} className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Button className="w-full mt-4" variant="outline" asChild>
                    <Link href={`/courses/${course.id}/learn`}>Continue Learning</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className={cn(
                  "shadow-md rounded-xl backdrop-blur-md transition-all",
                  achievement.earned
                    ? "border-green-500 bg-white/70 dark:bg-gray-900/70"
                    : "opacity-50 border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70"
                )}>
                  <CardContent className="p-6 text-center">
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                      achievement.earned ? "bg-green-100 dark:bg-green-900/30" : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Icon className={cn(
                        "h-8 w-8",
                        achievement.earned ? "text-green-600" : "text-slate-400"
                      )} />
                    </div>
                    <h4 className="font-semibold mb-1">{achievement.name}</h4>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {achievement.earned && (
                      <Badge className="mt-2" variant="success">Earned</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="shadow-md rounded-xl border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md">
            <CardHeader className="border-b border-gray-200/70 dark:border-gray-800/70">
              <CardTitle className="text-gray-900 dark:text-white">Learning Schedule</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">Your upcoming classes and study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">React Patterns - Live Session</h4>
                      <p className="text-sm text-muted-foreground">with John Doe</p>
                    </div>
                    <Badge>Today, 3:00 PM</Badge>
                  </div>
                  <Button size="sm">Join Session</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">Node.js Q&A Session</h4>
                      <p className="text-sm text-muted-foreground">with Jane Smith</p>
                    </div>
                    <Badge variant="secondary">Tomorrow, 2:00 PM</Badge>
                  </div>
                  <Button size="sm" variant="outline">Set Reminder</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
