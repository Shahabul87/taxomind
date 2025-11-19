"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BookOpen,
  Activity,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("7d");

  // Mock chart data
  const chartData = [
    { day: "Mon", users: 65, revenue: 2400 },
    { day: "Tue", users: 85, revenue: 3200 },
    { day: "Wed", users: 75, revenue: 2800 },
    { day: "Thu", users: 95, revenue: 3600 },
    { day: "Fri", users: 105, revenue: 4200 },
    { day: "Sat", users: 125, revenue: 4800 },
    { day: "Sun", users: 110, revenue: 4400 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Track platform performance and user engagement metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics - Gradient Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Revenue",
              value: "$48,234",
              change: "+12.5%",
              trend: "up",
              icon: DollarSign,
              gradient: "from-emerald-500 to-teal-500",
              hoverGradient: "from-emerald-400/20 to-teal-700/20"
            },
            {
              title: "Active Users",
              value: "2,842",
              change: "+8.2%",
              trend: "up",
              icon: Users,
              gradient: "from-blue-500 to-indigo-500",
              hoverGradient: "from-blue-400/20 to-indigo-700/20"
            },
            {
              title: "Course Completions",
              value: "423",
              change: "-3.4%",
              trend: "down",
              icon: Target,
              gradient: "from-purple-500 to-pink-500",
              hoverGradient: "from-purple-400/20 to-pink-700/20"
            },
            {
              title: "Avg. Session Time",
              value: "42m 18s",
              change: "+5.7%",
              trend: "up",
              icon: Clock,
              gradient: "from-orange-500 to-red-500",
              hoverGradient: "from-orange-400/20 to-red-700/20"
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className={cn(
                "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                `bg-gradient-to-br ${stat.gradient}`
              )}>
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  stat.hoverGradient
                )} />
                <div className="relative p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/90">{stat.title}</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    {stat.trend === "up" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {stat.change} from last period
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Section with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Tabs defaultValue="revenue" className="space-y-4">
            <TabsList className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <TabsTrigger
                value="revenue"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Revenue
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Users
              </TabsTrigger>
              <TabsTrigger
                value="engagement"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Engagement
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="revenue" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-2 p-4">
                    {chartData.map((data, idx) => (
                      <motion.div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.05 }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t relative hover:from-emerald-600 hover:to-teal-500 transition-colors"
                          style={{ height: `${(data.revenue / 5000) * 100}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            ${(data.revenue / 1000).toFixed(1)}k
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{data.day}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end gap-2 p-4">
                    {chartData.map((data, idx) => (
                      <motion.div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + idx * 0.05 }}
                      >
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t relative hover:from-blue-600 hover:to-indigo-500 transition-colors"
                          style={{ height: `${(data.users / 150) * 100}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            {data.users}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{data.day}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      Popular Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "Web Development", students: 342, progress: 85 },
                        { name: "Machine Learning", students: 289, progress: 72 },
                        { name: "Digital Marketing", students: 198, progress: 58 },
                        { name: "Python Basics", students: 156, progress: 45 },
                      ].map((course, idx) => (
                        <motion.div
                          key={idx}
                          className="space-y-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + idx * 0.1 }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{course.name}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{course.students} students</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      User Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { metric: "Page Views", value: "12,453", change: "+8.2%" },
                        { metric: "Video Watched", value: "8,234 hrs", change: "+12.1%" },
                        { metric: "Assignments Submitted", value: "1,892", change: "+5.4%" },
                        { metric: "Forum Posts", value: "423", change: "-2.3%" },
                      ].map((item, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center justify-between py-2 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + idx * 0.1 }}
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">{item.metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
                            <span className={`text-xs font-medium ${
                              item.change.startsWith('+')
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {item.change}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    Course Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Development", courses: 45, revenue: "$125,400", completion: 78 },
                      { category: "Data Science", courses: 28, revenue: "$98,200", completion: 82 },
                      { category: "Marketing", courses: 32, revenue: "$76,800", completion: 71 },
                      { category: "Design", courses: 24, revenue: "$54,300", completion: 69 },
                      { category: "Business", courses: 19, revenue: "$42,100", completion: 75 },
                    ].map((cat, idx) => (
                      <motion.div
                        key={idx}
                        className="grid grid-cols-4 gap-4 items-center py-3 border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 rounded-lg px-2 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{cat.courses} courses</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{cat.revenue}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={cat.completion} className="h-2 flex-1" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 w-10">{cat.completion}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
