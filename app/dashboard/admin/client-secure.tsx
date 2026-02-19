"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Activity,
  Users,
  BookOpen,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Download,
  Shield,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAdminDashboardDataSecure } from "@/actions/admin-secure";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import secure chart components
import { 
  ClientLineChart, 
  ClientBarChart, 
  ClientPieChart,
  ClientAreaChart
} from "@/components/charts/client-charts";

// Enterprise Intelligence Dashboard
import { EnterpriseIntelligenceDashboard } from "@/components/admin/enterprise-intelligence-dashboard";

interface DashboardData {
  usersStats: {
    totalUsers: number;
    lastMonthUsers: number;
    lastWeekUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    monthlyGrowthRate: number;
    weeklyGrowthRate: number;
    verificationRate: number;
  };
  authProviders: Array<{ provider: string; _count: { provider: number } }>;
  userGrowth: Array<{ month: number; year: number; count: number }>;
  recentUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
    emailVerified: Date | null;
  }>;
  additionalStats: {
    totalCourses: number;
    totalGroups: number;
    totalResources: number;
    totalMessages: number;
  };
  metadata?: {
    lastUpdated: string;
    appliedFilters: Record<string, unknown>;
  };
}

// Time range type for dashboard filters
type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export function SecureClientAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Secure data fetching with error handling
  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);

      const result = await getAdminDashboardDataSecure({ timeRange });
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch data");
      }
      
      setData(result.data as DashboardData);
      setError(null);
      setLastRefresh(new Date());
      
      if (showRefreshIndicator) {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (err) {
      logger.error("Dashboard error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      
      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes("Unauthorized")) {
          toast.error("You are not authorized to view this page");
          router.push("/dashboard/user");
        } else if (err.message.includes("Too many requests")) {
          toast.error("Too many requests. Please wait before refreshing again.");
        } else {
          toast.error(err.message);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, timeRange]);

  // Initial data fetch with cleanup
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      if (mounted && !document.hidden) {
        fetchData();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchData(true);
  };

  // Loading skeleton
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              onClick={handleRefresh}
              className="ml-2 p-0 h-auto"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data available. Please refresh the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Users",
      value: data.usersStats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
      change: `${data.usersStats.weeklyGrowthRate > 0 ? '+' : ''}${data.usersStats.weeklyGrowthRate.toFixed(1)}%`,
      positive: data.usersStats.weeklyGrowthRate > 0
    },
    {
      title: "Verified Users",
      value: `${data.usersStats.verificationRate.toFixed(0)}%`,
      icon: CheckCircle,
      color: "bg-green-500",
      change: `${data.usersStats.verifiedUsers} users`,
      positive: true
    },
    {
      title: "Weekly Growth",
      value: `${data.usersStats.weeklyGrowthRate.toFixed(1)}%`,
      icon: BarChart3,
      color: "bg-purple-500",
      change: `${data.usersStats.lastWeekUsers} new`,
      positive: data.usersStats.weeklyGrowthRate > 0
    },
    {
      title: "Monthly Growth",
      value: `${data.usersStats.monthlyGrowthRate.toFixed(1)}%`,
      icon: Calendar,
      color: "bg-amber-500",
      change: `${data.usersStats.lastMonthUsers} new`,
      positive: data.usersStats.monthlyGrowthRate > 0
    }
  ];

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Admin Dashboard
            <Shield className="h-8 w-8 text-muted-foreground" />
          </h1>
          <p className="text-muted-foreground">
            Secure overview of your platform&apos;s statistics and performance.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Last updated: {format(lastRefresh, 'HH:mm:ss')}
          </p>
        </div>
      </div>

      {/* Main stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="enterprise">Enterprise Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">User Growth Trend</h3>
              <div className="h-[300px]">
                <ClientAreaChart 
                  data={data.userGrowth.map(entry => ({
                    month: `${entry.month}/${entry.year}`,
                    users: entry.count
                  }))} 
                  xDataKey="month" 
                  areaDataKey="users" 
                  color="#8b5cf6"
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Authentication Methods</h3>
              <div className="h-[300px]">
                <ClientPieChart 
                  data={[
                    { 
                      name: "Email/Password", 
                      value: data.usersStats.totalUsers - data.authProviders.reduce((sum, p) => sum + p._count.provider, 0) 
                    },
                    ...data.authProviders.map(p => ({ 
                      name: p.provider, 
                      value: p._count.provider 
                    }))
                  ]} 
                  colors={['#8b5cf6', '#3b82f6', '#10b981', '#f472b6', '#f59e0b']} 
                />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ContentStatsCard
              title="Total Courses"
              value={data.additionalStats.totalCourses}
              icon={BookOpen}
              color="bg-indigo-500"
            />
            <ContentStatsCard
              title="Total Groups"
              value={data.additionalStats.totalGroups}
              icon={Users}
              color="bg-pink-500"
            />
            <ContentStatsCard
              title="Total Resources"
              value={data.additionalStats.totalResources}
              icon={BarChart3}
              color="bg-teal-500"
            />
            <ContentStatsCard
              title="Total Messages"
              value={data.additionalStats.totalMessages}
              icon={MessageSquare}
              color="bg-orange-500"
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Recent Users</h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">User</th>
                    <th className="text-left py-3 font-medium">Email</th>
                    <th className="text-left py-3 font-medium">Status</th>
                    <th className="text-left py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="py-3">
                        {user.emailVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Verification Status</h3>
              <div className="h-[300px]">
                <ClientPieChart
                  data={[
                    { name: "Verified", value: data.usersStats.verifiedUsers },
                    { name: "Unverified", value: data.usersStats.unverifiedUsers }
                  ]}
                  colors={["#10b981", "#ef4444"]}
                />
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Growth Overview</h3>
              <div className="h-[300px]">
                <ClientBarChart
                  data={[
                    { name: "Last Month", users: data.usersStats.lastMonthUsers },
                    { name: "Last Week", users: data.usersStats.lastWeekUsers }
                  ]}
                  xDataKey="name"
                  barDataKey="users"
                  color="#3b82f6"
                />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Content Distribution</h3>
            <div className="h-[400px]">
              <ClientBarChart
                data={[
                  { name: "Courses", count: data.additionalStats.totalCourses },
                  { name: "Groups", count: data.additionalStats.totalGroups },
                  { name: "Resources", count: data.additionalStats.totalResources },
                  { name: "Messages", count: data.additionalStats.totalMessages }
                ]}
                xDataKey="name"
                barDataKey="count"
                color="#f59e0b"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="enterprise" className="space-y-4">
          <EnterpriseIntelligenceDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stats card component with improved styling
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  change,
  positive
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
  positive: boolean;
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold">{value}</p>
          <p className={`ml-2 flex items-center text-sm ${
            positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {change}
            <ArrowUpRight className={`h-4 w-4 ${!positive && 'rotate-180'}`} />
          </p>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`}></div>
    </Card>
  );
}

// Content stats card component
function ContentStatsCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-6 transition-all hover:shadow-lg">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
      </div>
    </Card>
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </div>
  );
}