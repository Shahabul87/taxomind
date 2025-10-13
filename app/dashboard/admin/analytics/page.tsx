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
    <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Track platform performance and user engagement metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">$48,234</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400">+12.5%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">2,842</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400">+8.2%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Course Completions
                </CardTitle>
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">423</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="text-xs text-red-600 dark:text-red-400">-3.4%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Avg. Session Time
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">42m 18s</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-600 dark:text-green-400">+5.7%</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="bg-slate-100 dark:bg-slate-900/50">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              Users
            </TabsTrigger>
            <TabsTrigger value="engagement" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              Engagement
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              Courses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 dark:text-slate-100">Revenue Overview</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end gap-2">
                  {chartData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-t relative"
                           style={{ height: `${(data.revenue / 5000) * 100}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-600 dark:text-slate-300">
                          ${(data.revenue / 1000).toFixed(1)}k
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{data.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 dark:text-slate-100">User Growth</CardTitle>
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-end gap-2">
                  {chartData.map((data, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-blue-500 dark:bg-blue-600 rounded-t relative"
                           style={{ height: `${(data.users / 150) * 100}%` }}>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-slate-600 dark:text-slate-300">
                          {data.users}
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400">{data.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">Popular Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Web Development", students: 342, progress: 85 },
                      { name: "Machine Learning", students: 289, progress: 72 },
                      { name: "Digital Marketing", students: 198, progress: 58 },
                      { name: "Python Basics", students: 156, progress: 45 },
                    ].map((course, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{course.name}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{course.students} students</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100">User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { metric: "Page Views", value: "12,453", change: "+8.2%" },
                      { metric: "Video Watched", value: "8,234 hrs", change: "+12.1%" },
                      { metric: "Assignments Submitted", value: "1,892", change: "+5.4%" },
                      { metric: "Forum Posts", value: "423", change: "-2.3%" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                        <span className="text-sm text-slate-700 dark:text-slate-300">{item.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
                          <span className={`text-xs ${
                            item.change.startsWith('+')
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {item.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Course Performance</CardTitle>
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
                    <div key={idx} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{cat.courses} courses</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{cat.revenue}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cat.completion} className="h-2" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{cat.completion}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}