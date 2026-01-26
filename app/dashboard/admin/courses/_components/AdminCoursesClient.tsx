"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Plus,
  MoreVertical,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CourseWithStats {
  id: string;
  title: string;
  instructor: string;
  instructorId: string;
  category: string;
  students: number;
  rating: number;
  price: number;
  revenue: number;
  status: "Active" | "Draft" | "Under Review";
  lastUpdated: string;
  progress: number;
  imageUrl: string | null;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  avgRating: number;
  newCoursesThisMonth: number;
  newStudentsThisWeek: number;
  revenueGrowth: number;
  totalReviews: number;
}

interface AdminCoursesClientProps {
  initialCourses: CourseWithStats[];
  stats: CourseStats;
  categories: string[];
}

export function AdminCoursesClient({
  initialCourses,
  stats,
  categories,
}: AdminCoursesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    return initialCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || course.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || course.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialCourses, searchQuery, filterCategory, filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Under Review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}`);
  };

  const handleViewAnalytics = (courseId: string) => {
    router.push(`/teacher/courses/${courseId}/analytics`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              Courses Management
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor all platform courses
            </p>
          </div>
          <Link href="/teacher/create">
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto min-h-[44px] text-sm sm:text-base">
              <Plus className="mr-2 h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Create New Course</span>
              <span className="sm:hidden">Create Course</span>
            </Button>
          </Link>
        </motion.div>

        {/* Stats Cards - Real Data */}
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Courses",
              value: stats.totalCourses.toString(),
              change: `+${stats.newCoursesThisMonth} this month`,
              icon: BookOpen,
              gradient: "from-blue-500 to-indigo-500",
              hoverGradient: "from-blue-400/20 to-indigo-700/20",
            },
            {
              title: "Total Students",
              value: stats.totalStudents.toLocaleString(),
              change: `+${stats.newStudentsThisWeek} this week`,
              icon: Users,
              gradient: "from-emerald-500 to-teal-500",
              hoverGradient: "from-emerald-400/20 to-teal-700/20",
            },
            {
              title: "Total Revenue",
              value: formatCurrency(stats.totalRevenue),
              change:
                stats.revenueGrowth >= 0
                  ? `+${stats.revenueGrowth}% growth`
                  : `${stats.revenueGrowth}% decline`,
              icon: DollarSign,
              gradient: "from-purple-500 to-pink-500",
              hoverGradient: "from-purple-400/20 to-pink-700/20",
            },
            {
              title: "Avg. Rating",
              value: stats.avgRating.toFixed(1),
              change: `Based on ${stats.totalReviews.toLocaleString()} reviews`,
              icon: Star,
              gradient: "from-yellow-500 to-amber-500",
              hoverGradient: "from-yellow-400/20 to-amber-700/20",
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card
                className={cn(
                  "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
                  `bg-gradient-to-br ${stat.gradient}`
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    stat.hoverGradient
                  )}
                />
                <div className="relative p-3.5 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/90 truncate">
                      {stat.title}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/80">
                    {stat.change.includes("+") && (
                      <TrendingUp className="w-3 h-3 shrink-0" />
                    )}
                    <span className="truncate">{stat.change}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Courses Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold">
                    All Courses ({filteredCourses.length})
                  </span>
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full md:w-[250px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 focus:bg-white dark:focus:bg-slate-900 min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-full md:w-[150px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 min-h-[44px] text-base sm:text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[150px] bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-600/50 min-h-[44px] text-base sm:text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              {/* Mobile Card View / Desktop Table View */}
              {filteredCourses.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <BookOpen className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400 dark:text-slate-600 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                    {initialCourses.length === 0
                      ? "No courses have been created yet"
                      : "No courses found matching your criteria"}
                  </p>
                  {initialCourses.length === 0 && (
                    <Link href="/teacher/create">
                      <Button className="mt-4">Create Your First Course</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {filteredCourses.map((course, idx) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                          <CardContent className="p-4 space-y-3">
                            {/* Course Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base line-clamp-2 mb-1">
                                  {course.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  by {course.instructor}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-slate-500 dark:text-slate-400"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[calc(100vw-4rem)]"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleViewCourse(course.id)}
                                    className="touch-manipulation"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Course
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditCourse(course.id)}
                                    className="touch-manipulation"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Course
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewAnalytics(course.id)
                                    }
                                    className="touch-manipulation"
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Analytics
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Course Details Grid */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Category
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "mt-1 text-[10px] border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50"
                                  )}
                                >
                                  {course.category}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Status
                                </p>
                                <Badge
                                  className={cn(
                                    "mt-1 text-[10px]",
                                    getStatusColor(course.status)
                                  )}
                                >
                                  {course.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Students
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Users className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {course.students.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Rating
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {course.rating}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Price, Revenue, and Progress */}
                            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Price
                                </span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                  {course.price > 0
                                    ? formatCurrency(course.price)
                                    : "Free"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  Revenue
                                </span>
                                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(course.revenue)}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Progress
                                  </span>
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {course.progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={course.progress}
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-900/80">
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Course
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Category
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Students
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Rating
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Price
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Revenue
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Progress
                          </TableHead>
                          <TableHead className="text-slate-700 dark:text-slate-300 font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourses.map((course, idx) => (
                          <motion.tr
                            key={course.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {course.title}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  by {course.instructor}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50"
                              >
                                {course.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {course.students.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-slate-600 dark:text-slate-300">
                                  {course.rating}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300 font-medium">
                              {course.price > 0
                                ? formatCurrency(course.price)
                                : "Free"}
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-300 font-medium">
                              {formatCurrency(course.revenue)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(course.status)}>
                                {course.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="w-24">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={course.progress}
                                    className="h-2"
                                  />
                                  <span className="text-xs text-slate-500 dark:text-slate-400 w-10">
                                    {course.progress}%
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors duration-200"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200 dark:border-slate-700"
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                                  <DropdownMenuItem
                                    onClick={() => handleViewCourse(course.id)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Course
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEditCourse(course.id)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Course
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewAnalytics(course.id)
                                    }
                                    className="hover:bg-slate-100 dark:hover:bg-slate-700"
                                  >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View Analytics
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
