"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  Activity,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Bell,
  Search,
  ChevronRight,
  Eye,
  UserPlus,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  PieChart,
  FileText,
  Shield,
  Zap,
  Award,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
// Remove useTheme import as it might not be available
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

interface ModernAdminDashboardProps {
  user: User;
}

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeUsers: number;
  userGrowth: number;
  revenueGrowth: number;
  courseGrowth: number;
  activeGrowth: number;
  recentActivities: Activity[];
  topCourses: Course[];
  userMetrics: UserMetrics;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "user" | "course" | "purchase" | "system";
}

interface Course {
  id: string;
  title: string;
  enrollments: number;
  revenue: number;
  rating: number;
  progress: number;
}

interface UserMetrics {
  newToday: number;
  newWeek: number;
  newMonth: number;
  verified: number;
  unverified: number;
  byCountry: { country: string; count: number }[];
}

// Mock data generators - moved outside component to avoid recreating on every render
const generateMockActivities = (): Activity[] => {
  const actions = [
    { user: "John Doe", action: "enrolled in", target: "React Masterclass", type: "course" as const },
    { user: "Sarah Smith", action: "completed", target: "JavaScript Basics", type: "course" as const },
    { user: "Mike Johnson", action: "purchased", target: "Premium Subscription", type: "purchase" as const },
    { user: "Emily Brown", action: "joined", target: "the platform", type: "user" as const },
    { user: "System", action: "generated", target: "monthly report", type: "system" as const },
  ];

  return actions.map((action, index) => ({
    id: `activity-${index}`,
    ...action,
    time: `${Math.floor(Math.random() * 59)} minutes ago`,
  }));
};

const generateMockCourses = (): Course[] => {
  const courses = [
    "React Masterclass",
    "Node.js Advanced",
    "Python for Beginners",
    "Data Science Fundamentals",
    "UI/UX Design Principles",
  ];

  return courses.map((title, index) => ({
    id: `course-${index}`,
    title,
    enrollments: Math.floor(Math.random() * 500) + 100,
    revenue: Math.floor(Math.random() * 10000) + 2000,
    rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
    progress: Math.floor(Math.random() * 100),
  }));
};

const generateMockCountries = () => [
  { country: "United States", count: 450 },
  { country: "United Kingdom", count: 280 },
  { country: "Canada", count: 190 },
  { country: "Australia", count: 150 },
  { country: "India", count: 120 },
];

const generateMockStats = (): DashboardStats => ({
  totalUsers: 1234,
  totalCourses: 56,
  totalRevenue: 45678,
  activeUsers: 890,
  userGrowth: 12.5,
  revenueGrowth: 8.2,
  courseGrowth: 15.3,
  activeGrowth: 5.8,
  recentActivities: generateMockActivities(),
  topCourses: generateMockCourses(),
  userMetrics: {
    newToday: 12,
    newWeek: 78,
    newMonth: 234,
    verified: 1100,
    unverified: 134,
    byCountry: generateMockCountries(),
  }
});

// Sidebar navigation items
const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", value: "overview" },
  { icon: Users, label: "Users", value: "users" },
  { icon: BookOpen, label: "Courses", value: "courses" },
  { icon: DollarSign, label: "Revenue", value: "revenue" },
  { icon: Activity, label: "Analytics", value: "analytics" },
  { icon: MessageSquare, label: "Messages", value: "messages" },
  { icon: Shield, label: "Security", value: "security" },
  { icon: Settings, label: "Settings", value: "settings" },
];

export function ModernAdminDashboard({ user }: ModernAdminDashboardProps) {
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  // Initialize with mock data immediately to prevent loading issues
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 1234,
    totalCourses: 56,
    totalRevenue: 45678,
    activeUsers: 890,
    userGrowth: 12.5,
    revenueGrowth: 8.2,
    courseGrowth: 15.3,
    activeGrowth: 5.8,
    recentActivities: [],
    topCourses: [],
    userMetrics: {
      newToday: 12,
      newWeek: 78,
      newMonth: 234,
      verified: 1100,
      unverified: 134,
      byCountry: [],
    }
  });
  const [loading, setLoading] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }

    // Initialize with mock data
    setStats({
      totalUsers: 1234,
      totalCourses: 56,
      totalRevenue: 45678,
      activeUsers: 890,
      userGrowth: 12.5,
      revenueGrowth: 8.2,
      courseGrowth: 15.3,
      activeGrowth: 5.8,
      recentActivities: generateMockActivities(),
      topCourses: generateMockCourses(),
      userMetrics: {
        newToday: 12,
        newWeek: 78,
        newMonth: 234,
        verified: 1100,
        unverified: 134,
        byCountry: generateMockCountries(),
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Set a timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch('/api/admin/dashboard', {
          cache: 'no-store',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();

          // Transform and enrich the data
          const enrichedStats: DashboardStats = {
            totalUsers: data.stats?.totalUsers || 0,
            totalCourses: data.stats?.totalCourses || 0,
            totalRevenue: Math.floor(Math.random() * 50000) + 10000, // Mock revenue
            activeUsers: Math.floor((data.stats?.totalUsers || 0) * 0.7),
            userGrowth: 12.5,
            revenueGrowth: 8.2,
            courseGrowth: 15.3,
            activeGrowth: 5.8,
            recentActivities: generateMockActivities(),
            topCourses: generateMockCourses(),
            userMetrics: {
              newToday: Math.floor(Math.random() * 10) + 1,
              newWeek: data.stats?.lastWeekUsers || 0,
              newMonth: Math.floor(Math.random() * 100) + 20,
              verified: data.stats?.verifiedUsers || 0,
              unverified: Math.max(0, (data.stats?.totalUsers || 0) - (data.stats?.verifiedUsers || 0)),
              byCountry: generateMockCountries(),
            }
          };

          setStats(enrichedStats);
        } else {
          // Use mock data if response is not ok
          setStats(generateMockStats());
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.log('Fetch timeout or error, using mock data');
        // Use mock data on timeout or error
        setStats(generateMockStats());
      }
    } catch (error) {
      console.error('Error in dashboard data setup:', error);
      // Set mock data on error
      setStats(generateMockStats());
    } finally {
      setLoading(false);
    }
  }, []);

  // Disable API fetch for now - using mock data
  // useEffect(() => {
  //   fetchDashboardData();
  // }, [fetchDashboardData]);

  // Stat cards configuration
  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: stats.userGrowth,
      trend: "up" as const,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: stats.revenueGrowth,
      trend: "up" as const,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Active Courses",
      value: stats.totalCourses.toString(),
      icon: BookOpen,
      change: stats.courseGrowth,
      trend: "up" as const,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      change: stats.activeGrowth,
      trend: "down" as const,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out",
        "bg-card border-r",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:inset-auto"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Taxomind Admin
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === item.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </ScrollArea>

          {/* User section */}
          <div className="border-t p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                    <AvatarFallback>{user.name?.[0] || "A"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{user.name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-600 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Page title */}
              <div>
                <h1 className="text-3xl font-bold">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                  Welcome back, {user.name || "Admin"}! Here&apos;s what&apos;s happening with your platform.
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                  <Card key={stat.title} className="relative overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <div className={cn("rounded-full p-2", stat.bgColor)}>
                          <stat.icon className={cn("h-4 w-4", stat.color)} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{stat.value}</span>
                        <span className={cn(
                          "flex items-center text-sm font-medium",
                          stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {stat.change}%
                        </span>
                      </div>
                    </CardContent>
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-1",
                      stat.trend === "up" ? "bg-green-500" : "bg-red-500"
                    )} />
                  </Card>
                ))}
              </div>

              {/* Charts and tables */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions on your platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      <div className="space-y-4">
                        {stats.recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4">
                            <div className={cn(
                              "rounded-full p-2",
                              activity.type === "user" && "bg-blue-100 dark:bg-blue-900/30",
                              activity.type === "course" && "bg-purple-100 dark:bg-purple-900/30",
                              activity.type === "purchase" && "bg-green-100 dark:bg-green-900/30",
                              activity.type === "system" && "bg-gray-100 dark:bg-gray-900/30"
                            )}>
                              {activity.type === "user" && <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                              {activity.type === "course" && <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                              {activity.type === "purchase" && <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />}
                              {activity.type === "system" && <Zap className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{activity.user}</span>{" "}
                                <span className="text-muted-foreground">{activity.action}</span>{" "}
                                <span className="font-medium">{activity.target}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Top Courses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Courses</CardTitle>
                    <CardDescription>Courses with highest engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topCourses.map((course) => (
                        <div key={course.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{course.title}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {course.enrollments} students
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ${course.revenue.toLocaleString()}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Award className="h-3 w-3 text-yellow-500" />
                                  <span className="text-xs">{course.rating}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Metrics</CardTitle>
                  <CardDescription>Detailed user statistics and demographics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">New Users</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Today</span>
                          <span className="font-medium">{stats?.userMetrics.newToday}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">This Week</span>
                          <span className="font-medium">{stats?.userMetrics.newWeek}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">This Month</span>
                          <span className="font-medium">{stats?.userMetrics.newMonth}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Verified</span>
                          <Badge variant="default">{stats?.userMetrics.verified}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Unverified</span>
                          <Badge variant="secondary">{stats?.userMetrics.unverified}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Top Countries</p>
                      <div className="space-y-1">
                        {stats?.userMetrics.byCountry.slice(0, 3).map((country) => (
                          <div key={country.country} className="flex items-center justify-between">
                            <span className="text-sm">{country.country}</span>
                            <span className="font-medium">{country.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Other tabs content */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground">Manage and monitor all platform users</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">User management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Course Management</h1>
                <p className="text-muted-foreground">Manage courses and learning content</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Course management interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Revenue Analytics</h1>
                <p className="text-muted-foreground">Track revenue and financial metrics</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Revenue analytics coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Platform Analytics</h1>
                <p className="text-muted-foreground">Deep insights into platform performance</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Advanced analytics coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Messages</h1>
                <p className="text-muted-foreground">Communication center</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Messaging system coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Security Center</h1>
                <p className="text-muted-foreground">Platform security and compliance</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Security management coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Platform Settings</h1>
                <p className="text-muted-foreground">Configure platform settings and preferences</p>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">Settings interface coming soon...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}