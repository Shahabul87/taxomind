"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Star,
  BookOpen,
  Award,
  BarChart3,
  Eye,
} from "lucide-react";
import { CourseEnhanced } from "@/types/course";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface CourseDrillDownProps {
  course: CourseEnhanced;
  trigger?: React.ReactNode;
}

export const CourseDrillDown = ({ course, trigger }: CourseDrillDownProps) => {
  const [open, setOpen] = useState(false);

  // Mock detailed analytics
  const enrollmentData = course.analytics.enrollmentTrend.slice(0, 30);
  const completionData = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    completed: Math.floor(Math.random() * 20) + 10,
    inProgress: Math.floor(Math.random() * 30) + 20,
  }));

  const chapterEngagement = Array.from({ length: 8 }, (_, i) => ({
    chapter: `Ch ${i + 1}`,
    views: Math.floor(Math.random() * 100) + 50,
    completion: Math.floor(Math.random() * 40) + 60,
  }));

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 h-7 sm:h-8">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">View Details</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl truncate pr-8">{course.title}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Comprehensive analytics and performance insights
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full mt-3 sm:mt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2">
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2">
              <span className="hidden sm:inline">Engagement</span>
              <span className="sm:hidden">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="students" className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2">
              Students
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <MetricCard
                icon={Users}
                label="Total Students"
                value={course._count?.Purchase || 0}
                change={course.performance.growthRate}
              />
              <MetricCard
                icon={Target}
                label="Completion Rate"
                value={`${course.analytics.completionRate.toFixed(1)}%`}
                trend={course.performance.completionTrend}
              />
              <MetricCard
                icon={Star}
                label="Avg Rating"
                value={course.performance.averageRating.toFixed(1)}
                subtitle={`${course.performance.totalReviews} reviews`}
              />
              <MetricCard
                icon={TrendingUp}
                label="Revenue"
                value={`$${course.performance.currentRevenue.toLocaleString()}`}
                change={course.performance.growthRate}
              />
            </div>

            {/* Enrollment Trend */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg">Enrollment Trend (30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={enrollmentData}>
                    <defs>
                      <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#9ca3af" style={{ fontSize: '10px' }} interval="preserveStartEnd" />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '10px' }} width={35} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      fillOpacity={1}
                      fill="url(#colorEnroll)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Completion Progress */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Weekly Completion</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={completionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#9ca3af" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '10px' }} width={35} />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                      <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chapter Engagement */}
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Chapter Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chapterEngagement} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '10px' }} />
                      <YAxis dataKey="chapter" type="category" stroke="#9ca3af" style={{ fontSize: '10px' }} width={30} />
                      <Tooltip />
                      <Bar dataKey="views" fill="#6366f1" name="Views" />
                      <Bar dataKey="completion" fill="#8b5cf6" name="Completion %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                    ${course.analytics.revenueMetrics.total.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1">
                    ${course.analytics.revenueMetrics.perStudent.toFixed(2)} per student
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                    ${course.analytics.revenueMetrics.monthly.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1 truncate">
                    Projected: ${course.analytics.revenueMetrics.projectedMonthly.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                    {course.analytics.revenueMetrics.growth.toFixed(1)}%
                  </p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1">Month over month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Student Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium">Engagement Score</span>
                      <span className="text-xs sm:text-sm font-bold">{course.analytics.engagementScore.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.analytics.engagementScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium">Retention Rate</span>
                      <span className="text-xs sm:text-sm font-bold">{course.analytics.retentionRate.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.analytics.retentionRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm font-medium">Satisfaction</span>
                      <span className="text-xs sm:text-sm font-bold">{course.analytics.studentSatisfaction.toFixed(1)}/5.0</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(course.analytics.studentSatisfaction / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '5 Stars', value: course.reviews?.ratingDistribution[5] || 40 },
                          { name: '4 Stars', value: course.reviews?.ratingDistribution[4] || 38 },
                          { name: '3 Stars', value: course.reviews?.ratingDistribution[3] || 15 },
                          { name: '2 Stars', value: course.reviews?.ratingDistribution[2] || 5 },
                          { name: '1 Star', value: course.reviews?.ratingDistribution[1] || 2 },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const MetricCard = ({ icon: Icon, label, value, change, trend, subtitle }: MetricCardProps) => {
  return (
    <Card>
      <CardContent className="p-2.5 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
            <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
            {change !== undefined && (
              <p className={cn(
                "text-[10px] sm:text-xs font-medium",
                change >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
              </p>
            )}
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
