"use client";

import React, { useState } from "react";
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
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Mock data for courses
const mockCourses = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    instructor: "John Doe",
    category: "Development",
    students: 1234,
    rating: 4.8,
    price: 89.99,
    revenue: 110998.66,
    status: "Active",
    lastUpdated: "2024-10-01",
    progress: 100,
  },
  {
    id: "2",
    title: "Machine Learning Fundamentals",
    instructor: "Jane Smith",
    category: "Data Science",
    students: 856,
    rating: 4.9,
    price: 129.99,
    revenue: 111231.44,
    status: "Active",
    lastUpdated: "2024-10-05",
    progress: 100,
  },
  {
    id: "3",
    title: "Digital Marketing Masterclass",
    instructor: "Mike Johnson",
    category: "Marketing",
    students: 567,
    rating: 4.6,
    price: 69.99,
    revenue: 39684.33,
    status: "Draft",
    lastUpdated: "2024-10-10",
    progress: 75,
  },
  {
    id: "4",
    title: "Python for Beginners",
    instructor: "Sarah Williams",
    category: "Programming",
    students: 2103,
    rating: 4.7,
    price: 49.99,
    revenue: 105127.97,
    status: "Active",
    lastUpdated: "2024-09-28",
    progress: 100,
  },
  {
    id: "5",
    title: "UI/UX Design Principles",
    instructor: "Robert Brown",
    category: "Design",
    students: 423,
    rating: 4.5,
    price: 79.99,
    revenue: 33835.77,
    status: "Under Review",
    lastUpdated: "2024-10-08",
    progress: 90,
  },
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter courses based on search and filters
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    const matchesStatus = filterStatus === "all" || course.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Draft": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Under Review": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-6 overflow-y-auto p-6 md:p-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Courses Management</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Manage and monitor all platform courses
            </p>
          </div>
          <Button className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
            <Plus className="mr-2 h-4 w-4" />
            Create New Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">156</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                +8 from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">4,983</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                +243 this week
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">$400.9k</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                +18% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Avg. Rating
                </CardTitle>
                <Star className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">4.7</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Based on 12k reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">All Courses</CardTitle>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full md:w-[250px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[150px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600">
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
          <CardContent>
            {/* Courses Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-700">
                    <TableHead className="text-slate-600 dark:text-slate-300">Course</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Category</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Students</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Rating</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Price</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Revenue</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Progress</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="border-slate-200 dark:border-slate-700">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{course.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">by {course.instructor}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
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
                          <span className="text-slate-600 dark:text-slate-300">{course.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {formatCurrency(course.price)}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">
                        {formatCurrency(course.revenue)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-20">
                          <Progress value={course.progress} className="h-2" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">{course.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                            <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem className="hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}