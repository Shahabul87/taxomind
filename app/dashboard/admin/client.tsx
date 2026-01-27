"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  BarChart3,
  MessageSquare,
  ArrowUpRight,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Fetch data via API to avoid bundling server-only Prisma code in client
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { logger } from '@/lib/logger';

// Type definitions for admin dashboard data
interface AuthProvider {
  provider: string;
  _count: {
    provider: number;
  };
}

interface UserGrowthEntry {
  month: number;
  year: number;
  count: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role?: string;
  image?: string | null;
  isTeacher: boolean;
  createdAt: string;
  emailVerified: string | null;
}

interface UsersStats {
  totalUsers: number;
  lastMonthUsers: number;
  lastWeekUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  monthlyGrowthRate: number;
  weeklyGrowthRate: number;
  verificationRate: number;
}

interface AdditionalStats {
  totalCourses: number;
  totalGroups: number;
  totalResources: number;
  totalMessages: number;
}

interface DashboardData {
  usersStats: UsersStats;
  authProviders: AuthProvider[];
  userGrowth: UserGrowthEntry[];
  recentUsers: RecentUser[];
  additionalStats: AdditionalStats;
}

// Client components for charts
import { 
  ClientLineChart, 
  ClientBarChart, 
  ClientPieChart,
  ClientAreaChart
} from "@/components/charts/client-charts";

// Enterprise Intelligence Dashboard
import { EnterpriseIntelligenceDashboard } from "@/components/admin/enterprise-intelligence-dashboard";

// MFA Status
import { MFAStatusAlert } from "./mfa-status-alert";

export function ClientAdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to load admin dashboard: ${res.status}`);
        const payload = await res.json();
        const stats = payload?.stats || {};
        const recentUsers = payload?.recentUsers || [];

        const usersStats = {
          totalUsers: stats.totalUsers || 0,
          lastMonthUsers: 0,
          lastWeekUsers: stats.lastWeekUsers || 0,
          verifiedUsers: stats.verifiedUsers || 0,
          unverifiedUsers: stats.unverifiedUsers || Math.max((stats.totalUsers || 0) - (stats.verifiedUsers || 0), 0),
          monthlyGrowthRate: 0,
          weeklyGrowthRate: (stats.totalUsers || 0) > 0 ? ((stats.lastWeekUsers || 0) / stats.totalUsers) * 100 : 0,
          verificationRate: (stats.totalUsers || 0) > 0 ? ((stats.verifiedUsers || 0) / stats.totalUsers) * 100 : 0,
        };

        const additionalStats = {
          totalCourses: stats.totalCourses || 0,
          totalGroups: stats.totalGroups || 0,
          totalResources: stats.totalResources || 0,
          totalMessages: 0,
        };

        setData({
          usersStats,
          authProviders: [],
          userGrowth: [],
          recentUsers,
          additionalStats,
        });
      } catch (error) {
        logger.error("Error fetching admin data:", error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Placeholder data before loading completes
  const statsCards = [
    {
      title: "Total Users",
      value: loading ? "Loading..." : data?.usersStats.totalUsers.toString(),
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
      positive: true
    },
    {
      title: "Verified Users",
      value: loading ? "Loading..." : `${Math.round(data?.usersStats.verificationRate)}%`,
      icon: CheckCircle,
      color: "bg-green-500",
      change: "+5%",
      positive: true
    },
    {
      title: "Weekly Growth",
      value: loading ? "Loading..." : `${Math.round(data?.usersStats.weeklyGrowthRate)}%`,
      icon: BarChart3,
      color: "bg-purple-500",
      change: "+8%",
      positive: true
    },
    {
      title: "Monthly Growth",
      value: loading ? "Loading..." : `${Math.round(data?.usersStats.monthlyGrowthRate)}%`,
      icon: Calendar,
      color: "bg-amber-500",
      change: "-3%",
      positive: false
    }
  ];
  
  // Additional stats data
  const additionalStatsCards = [
    {
      title: "Total Courses",
      value: loading ? "Loading..." : data?.additionalStats.totalCourses.toString(),
      icon: BookOpen,
      color: "bg-indigo-500"
    },
    {
      title: "Total Groups",
      value: loading ? "Loading..." : data?.additionalStats.totalGroups.toString(),
      icon: Users,
      color: "bg-pink-500"
    },
    {
      title: "Total Resources",
      value: loading ? "Loading..." : data?.additionalStats.totalResources.toString(),
      icon: BarChart3,
      color: "bg-teal-500"
    },
    {
      title: "Total Messages",
      value: loading ? "Loading..." : data?.additionalStats.totalMessages.toString(),
      icon: MessageSquare,
      color: "bg-orange-500"
    }
  ];

  if (data) {
    const { usersStats, authProviders, userGrowth, recentUsers, additionalStats } = data;

    // Format data for charts
    const authProvidersData = [
      { name: "Email/Password", value: usersStats.totalUsers - authProviders.reduce((sum, p) => sum + p._count.provider, 0) },
      ...authProviders.map((p) => ({ name: p.provider, value: p._count.provider }))
    ];

    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f472b6', '#f59e0b'];

    const formatUserGrowth = userGrowth.map((entry) => ({
      month: `${entry.month}/${entry.year}`,
      users: entry.count
    }));
  }
  
  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your platform&apos;s statistics and performance.
        </p>
      </div>
      
      {/* MFA Status Alert */}
      <MFAStatusAlert />
      
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
              <h3 className="text-lg font-medium mb-4">User Growth</h3>
              <div className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading user growth data...</p>
                  </div>
                ) : data ? (
                  <ClientAreaChart
                    data={data.userGrowth.map((entry) => ({
                      month: `${entry.month}/${entry.year}`,
                      users: entry.count
                    }))}
                    xDataKey="month"
                    areaDataKey="users"
                    color="#8b5cf6"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Authentication Methods</h3>
              <div className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading authentication data...</p>
                  </div>
                ) : data ? (
                  <ClientPieChart
                    data={[
                      { name: "Email/Password", value: data.usersStats.totalUsers - data.authProviders.reduce((sum, p) => sum + p._count.provider, 0) },
                      ...data.authProviders.map((p) => ({ name: p.provider, value: p._count.provider }))
                    ]}
                    colors={['#8b5cf6', '#3b82f6', '#10b981', '#f472b6', '#f59e0b']}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {additionalStatsCards.map((stat, i) => (
              <AdditionalStatsCard key={i} {...stat} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Recent Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">User</th>
                    <th className="text-left py-3 font-medium">Email</th>
                    <th className="text-left py-3 font-medium">Role</th>
                    <th className="text-left py-3 font-medium">Verified</th>
                    <th className="text-left py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-b">
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Loading user data...
                      </td>
                    </tr>
                  ) : data?.recentUsers ? (
                    data.recentUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                              <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3">{user.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-md text-xs ${
                            user.role === 'ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3">
                          {user.emailVerified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </td>
                        <td className="py-3">{user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : "Unknown"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b">
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No user data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Users by Verification Status</h3>
              <div className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading verification data...</p>
                  </div>
                ) : data ? (
                  <ClientPieChart
                    data={[
                      { name: "Verified", value: data.usersStats.verifiedUsers },
                      { name: "Unverified", value: data.usersStats.unverifiedUsers }
                    ]}
                    colors={["#10b981", "#ef4444"]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Weekly Registration Trend</h3>
              <div className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Loading registration data...</p>
                  </div>
                ) : data ? (
                  <ClientBarChart
                    data={[
                      { name: "Past Month", users: data.usersStats.lastMonthUsers },
                      { name: "Past Week", users: data.usersStats.lastWeekUsers }
                    ]}
                    xDataKey="name"
                    barDataKey="users"
                    color="#3b82f6"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-6 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-medium">Total Courses</h3>
                <p className="text-3xl font-bold mt-2">
                  {loading ? "Loading..." : data?.additionalStats.totalCourses}
                </p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Growth compared to last month
                </div>
                <div className="flex items-center gap-1 text-sm mt-1 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+12%</span>
                </div>
              </div>
              <div className="absolute right-2 top-2 p-2 rounded-full bg-indigo-100">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-indigo-200 rounded-tl-full opacity-50"></div>
            </Card>
            
            <Card className="p-6 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-medium">Total Groups</h3>
                <p className="text-3xl font-bold mt-2">
                  {loading ? "Loading..." : data?.additionalStats.totalGroups}
                </p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Growth compared to last month
                </div>
                <div className="flex items-center gap-1 text-sm mt-1 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+8%</span>
                </div>
              </div>
              <div className="absolute right-2 top-2 p-2 rounded-full bg-pink-100">
                <Users className="h-5 w-5 text-pink-600" />
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-200 rounded-tl-full opacity-50"></div>
            </Card>
            
            <Card className="p-6 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-medium">Total Resources</h3>
                <p className="text-3xl font-bold mt-2">
                  {loading ? "Loading..." : data?.additionalStats.totalResources}
                </p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Growth compared to last month
                </div>
                <div className="flex items-center gap-1 text-sm mt-1 text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+15%</span>
                </div>
              </div>
              <div className="absolute right-2 top-2 p-2 rounded-full bg-teal-100">
                <BarChart3 className="h-5 w-5 text-teal-600" />
              </div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-200 rounded-tl-full opacity-50"></div>
            </Card>
          </div>
          
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Content Distribution</h3>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading content data...</p>
                </div>
              ) : data ? (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
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

// Stats card component
interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
  positive: boolean;
}

function StatsCard({ title, value, icon: Icon, color, change, positive }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold">{value}</p>
          <p className={`ml-2 flex items-center text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
            <ArrowUpRight className={`h-4 w-4 ${!positive && 'rotate-180'}`} />
          </p>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`}></div>
    </Card>
  );
}

// Additional stats card component
interface AdditionalStatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

function AdditionalStatsCard({ title, value, icon: Icon, color }: AdditionalStatsCardProps) {
  return (
    <Card className="flex items-center gap-4 p-6">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
} 
