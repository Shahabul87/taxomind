"use client";

import { useState } from "react";
import { User } from "next-auth";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Eye,
  BarChart3,
  Calendar,
  Star,
  MessageSquare,
  Video,
  FileText,
  Settings,
  Package,
  ChevronRight,
  Upload,
  PlayCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TeacherDashboardProps {
  user: User;
}

export function TeacherDashboard({ user }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data for demonstration
  const courses = [
    {
      id: "1",
      title: "Advanced React Patterns",
      status: "published",
      students: 234,
      rating: 4.8,
      revenue: 3456,
      completionRate: 78,
      lastUpdated: "2 days ago"
    },
    {
      id: "2",
      title: "Node.js Microservices",
      status: "draft",
      students: 0,
      rating: 0,
      revenue: 0,
      completionRate: 0,
      lastUpdated: "1 week ago"
    },
    {
      id: "3",
      title: "TypeScript Masterclass",
      status: "published",
      students: 156,
      rating: 4.9,
      revenue: 2890,
      completionRate: 82,
      lastUpdated: "3 days ago"
    }
  ];

  const recentActivity = [
    { type: "enrollment", student: "John Doe", course: "Advanced React Patterns", time: "2 hours ago" },
    { type: "review", student: "Jane Smith", course: "TypeScript Masterclass", rating: 5, time: "5 hours ago" },
    { type: "question", student: "Bob Johnson", course: "Advanced React Patterns", time: "1 day ago" },
    { type: "completion", student: "Alice Brown", course: "TypeScript Masterclass", time: "2 days ago" }
  ];

  const upcomingClasses = [
    { course: "Advanced React Patterns", type: "Live Q&A", date: "Today, 3:00 PM", students: 45 },
    { course: "TypeScript Masterclass", type: "Workshop", date: "Tomorrow, 2:00 PM", students: 32 }
  ];

  const stats = {
    totalStudents: 390,
    totalRevenue: 6346,
    avgRating: 4.85,
    totalCourses: 3,
    publishedCourses: 2,
    totalReviews: 89,
    completionRate: 80,
    monthlyGrowth: 12
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Instructor Dashboard</h2>
            <p className="text-sm sm:text-base text-purple-100 mb-4">
              You have {stats.totalStudents} students across {stats.publishedCourses} published courses
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/teacher/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-white border-white hover:bg-white/20" asChild>
                <Link href="/teacher/courses">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Courses
                </Link>
              </Button>
            </div>
          </div>
          <div className="text-center sm:text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-bold">${stats.totalRevenue}</div>
            <div className="text-xs sm:text-sm text-purple-100">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-xs text-green-600">+{stats.monthlyGrowth}% this month</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published Courses</p>
                <p className="text-2xl font-bold">{stats.publishedCourses}</p>
                <p className="text-xs text-muted-foreground">of {stats.totalCourses} total</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                <p className="text-xs text-muted-foreground">{stats.totalReviews} reviews</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-green-600">Above average</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs sm:text-sm">Courses</TabsTrigger>
          <TabsTrigger value="students" className="text-xs sm:text-sm">Students</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Course Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Course Performance</CardTitle>
                <CardDescription>Your top performing courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.filter(c => c.status === "published").map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {course.students} students • ${course.revenue} revenue
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Star className="h-3 w-3 mr-1" />
                          {course.rating}
                        </Badge>
                      </div>
                      <Progress value={course.completionRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {course.completionRate}% completion rate
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest student interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        activity.type === "enrollment" && "bg-blue-100 dark:bg-blue-900/30",
                        activity.type === "review" && "bg-yellow-100 dark:bg-yellow-900/30",
                        activity.type === "question" && "bg-purple-100 dark:bg-purple-900/30",
                        activity.type === "completion" && "bg-green-100 dark:bg-green-900/30"
                      )}>
                        {activity.type === "enrollment" && <Users className="h-4 w-4 text-blue-600" />}
                        {activity.type === "review" && <Star className="h-4 w-4 text-yellow-600" />}
                        {activity.type === "question" && <MessageSquare className="h-4 w-4 text-purple-600" />}
                        {activity.type === "completion" && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.student}</span>
                          {activity.type === "enrollment" && " enrolled in"}
                          {activity.type === "review" && ` rated (${activity.rating}⭐)`}
                          {activity.type === "question" && " asked a question in"}
                          {activity.type === "completion" && " completed"}
                          {" "}
                          <span className="text-muted-foreground">{activity.course}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Live Sessions</CardTitle>
              <CardDescription>Your scheduled live classes and workshops</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingClasses.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Video className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{session.course}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.type} • {session.students} students registered
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>{session.date}</Badge>
                      <Button size="sm" className="mt-2">Start Session</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Manage Your Courses</h3>
            <Button className="w-full sm:w-auto" asChild>
              <Link href="/teacher/create">
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.title}</TableCell>
                      <TableCell>
                        <Badge variant={course.status === "published" ? "success" : "secondary"}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{course.students}</TableCell>
                      <TableCell>
                        {course.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{course.rating}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>${course.revenue}</TableCell>
                      <TableCell>
                      <div className="flex gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/teacher/courses/${course.id}`} aria-label={`Edit course ${course.title}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/teacher/courses/${course.id}/analytics`} aria-label={`View analytics for ${course.title}`}>
                              <BarChart3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/courses/${course.id}`} aria-label={`Preview course ${course.title}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Overview</CardTitle>
              <CardDescription>Manage and communicate with your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Total Active Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">New This Month</p>
                      <p className="text-xl font-bold">48</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Avg. Progress</p>
                      <p className="text-xl font-bold">67%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Questions</p>
                      <p className="text-xl font-bold">12 pending</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Track your teaching performance and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Revenue Trend</p>
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Revenue chart visualization</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Student Engagement</p>
                    <Progress value={72} className="mb-1" />
                    <p className="text-xs text-muted-foreground">72% average engagement</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Content Quality</p>
                    <Progress value={88} className="mb-1" />
                    <p className="text-xs text-muted-foreground">88% quality score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
