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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
            <p className="text-blue-100 mb-4">
              You&apos;re on a {learningStreak}-day learning streak! Keep it up! 🔥
            </p>
            <div className="flex gap-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/courses">
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20" asChild>
                <Link href="/my-courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Courses
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completedCourses}</div>
            <div className="text-sm text-blue-100">Courses Completed</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                <p className="text-2xl font-bold">{enrolledCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">{certificates}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learning Hours</p>
                <p className="text-2xl font-bold">124</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold">89%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>Pick up where you left off</CardDescription>
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
                      <Link href={`/courses/${course.id}/learn`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>Don&apos;t miss these important dates</CardDescription>
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
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress This Week</CardTitle>
              <CardDescription>Your daily study time and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-10">{day}</span>
                    <Progress 
                      value={index < 5 ? Math.random() * 100 : 0} 
                      className="flex-1 h-3" 
                    />
                    <span className="text-sm text-muted-foreground w-16">
                      {index < 5 ? `${Math.floor(Math.random() * 3 + 1)}h` : "0h"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <Card key={achievement.id} className={cn(
                  "transition-all",
                  achievement.earned ? "border-green-500" : "opacity-50"
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
          <Card>
            <CardHeader>
              <CardTitle>Learning Schedule</CardTitle>
              <CardDescription>Your upcoming classes and study sessions</CardDescription>
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