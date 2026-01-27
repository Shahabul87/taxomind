"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Coins,
  Download,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  DollarSign,
  Activity,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  Dumbbell,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SubscriptionTier } from "@prisma/client";

// Type definitions
interface TierBreakdown {
  tier: SubscriptionTier;
  count: number;
  totalTokens: number;
  totalGenerations: number;
  totalCost: number;
}

interface GenerationBreakdown {
  type: string;
  count: number;
  tokens: number;
  cost: number;
}

interface DailyTrend {
  date: string;
  tokens: number;
  generations: number;
  cost: number;
}

interface UserTokenUsage {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  subscriptionTier: SubscriptionTier;
  totalTokens: number;
  totalGenerations: number;
  totalCost: number;
  dailyAiUsageCount: number;
  monthlyAiUsageCount: number;
  courseGenerations: number;
  chapterGenerations: number;
  lessonGenerations: number;
  examGenerations: number;
  exerciseGenerations: number;
  lastUsageDate: string | null;
  status: "active" | "inactive" | "at_limit";
}

interface PlatformSummary {
  totalTokens: number;
  totalGenerations: number;
  totalCost: number;
  activeUsers: number;
  totalUsersWithUsage: number;
  tierBreakdown: TierBreakdown[];
  generationBreakdown: GenerationBreakdown[];
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

interface ApiResponse {
  success: boolean;
  data: {
    platformSummary: PlatformSummary;
    users: UserTokenUsage[];
    dailyTrends: DailyTrend[];
  };
  metadata: {
    pagination: Pagination;
    timestamp: string;
    period: string;
    filters: {
      search: string | null;
      tier: string;
      sortBy: string;
      sortOrder: string;
    };
  };
}

// Helper functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatCost = (cost: number): string => {
  return `$${cost.toFixed(2)}`;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getTierColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case "FREE":
      return "bg-slate-100 text-slate-700";
    case "STARTER":
      return "bg-blue-100 text-blue-700";
    case "PROFESSIONAL":
      return "bg-purple-100 text-purple-700";
    case "ENTERPRISE":
      return "bg-amber-100 text-amber-700";
    case "CUSTOM":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "at_limit":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case "inactive":
      return <XCircle className="h-4 w-4 text-slate-400" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case "active":
      return "Active";
    case "at_limit":
      return "At Limit";
    case "inactive":
      return "Inactive";
    default:
      return status;
  }
};

export function UserTokenUsageClient() {
  // State
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [period, setPeriod] = useState("month");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalTokens");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState<UserTokenUsage | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Use ref to track current request and prevent race conditions
  const requestIdRef = useRef(0);

  // Fetch data function
  const fetchData = useCallback(async (resetPage = false) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    const page = resetPage ? 1 : currentPage;
    if (resetPage) {
      setCurrentPage(1);
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        period,
        tier: tierFilter,
        sortBy,
        sortOrder,
      });

      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const response = await fetch(`/api/admin/user-token-usage?${params}`);

      // Only update if this is still the latest request
      if (requestId !== requestIdRef.current) return;

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        if (response.status === 401) {
          setError("Admin authentication required. Please log in as an admin.");
        } else {
          setError(`Server error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setPagination(result.metadata?.pagination || null);
      } else {
        // Show detailed error message from API
        const errorMessage = result.error?.message || "Failed to fetch data";
        setError(errorMessage);
        console.error("[UserTokenUsage] API Error:", result.error);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError("An error occurred while fetching data. Please try again.");
      console.error("[UserTokenUsage] Fetch Error:", err);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, period, searchQuery, tierFilter, sortBy, sortOrder]);

  // Initial load and filter changes
  useEffect(() => {
    fetchData(true);
  }, [period, tierFilter, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Page changes
  useEffect(() => {
    fetchData(false);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Export function
  const handleExport = () => {
    if (!data) return;

    const csvContent = [
      [
        "Name",
        "Email",
        "Tier",
        "Total Tokens",
        "Total Generations",
        "Total Cost",
        "Daily Usage",
        "Monthly Usage",
        "Status",
        "Last Activity",
      ].join(","),
      ...data.users.map((user) =>
        [
          user.name || "",
          user.email || "",
          user.subscriptionTier,
          user.totalTokens,
          user.totalGenerations,
          user.totalCost.toFixed(2),
          user.dailyAiUsageCount,
          user.monthlyAiUsageCount,
          user.status,
          user.lastUsageDate || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-token-usage-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Calculate chart heights for bar charts
  const maxGenerations = data
    ? Math.max(...data.platformSummary.generationBreakdown.map((g) => g.count), 1)
    : 1;

  const maxTierGenerations = data
    ? Math.max(...data.platformSummary.tierBreakdown.map((t) => t.totalGenerations), 1)
    : 1;

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600">Loading token usage data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-lg font-semibold">Error Loading Data</h2>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => fetchData(true)}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Page Header */}
        <motion.div
          className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 truncate flex items-center gap-3">
              <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
              User Token Usage
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600">
              Monitor and analyze AI token consumption across all platform users
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white/80 backdrop-blur-sm border-slate-200/50 min-h-[44px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Last 24 hours</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">Last 30 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md w-full sm:w-auto min-h-[44px]"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Tokens",
              value: formatNumber(data.platformSummary.totalTokens),
              icon: Coins,
              gradient: "from-amber-500 to-orange-500",
            },
            {
              title: "Total Generations",
              value: formatNumber(data.platformSummary.totalGenerations),
              icon: Sparkles,
              gradient: "from-purple-500 to-pink-500",
            },
            {
              title: "Total Cost",
              value: formatCost(data.platformSummary.totalCost),
              icon: DollarSign,
              gradient: "from-emerald-500 to-teal-500",
            },
            {
              title: "Active Users",
              value: formatNumber(data.platformSummary.activeUsers),
              icon: Users,
              gradient: "from-blue-500 to-indigo-500",
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
                <div className="relative p-3.5 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-white/90 truncate">
                      {stat.title}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Tabs defaultValue="users" className="space-y-3 sm:space-y-4">
            <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
              <TabsList className="bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 shadow-sm inline-flex min-w-full sm:min-w-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  By User
                </TabsTrigger>
                <TabsTrigger
                  value="tiers"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  By Tier
                </TabsTrigger>
                <TabsTrigger
                  value="trends"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px] flex-1 sm:flex-initial"
                >
                  Trends
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Generation Type Breakdown */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-slate-900">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      Generation Types
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.platformSummary.generationBreakdown.map((gen, idx) => {
                        const icons: Record<string, React.ReactNode> = {
                          Courses: <BookOpen className="h-4 w-4" />,
                          Chapters: <FileText className="h-4 w-4" />,
                          Lessons: <GraduationCap className="h-4 w-4" />,
                          Exams: <ClipboardList className="h-4 w-4" />,
                          Exercises: <Dumbbell className="h-4 w-4" />,
                        };
                        const percentage = maxGenerations > 0 ? (gen.count / maxGenerations) * 100 : 0;

                        return (
                          <motion.div
                            key={gen.type}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500">{icons[gen.type]}</span>
                                <span className="text-sm font-medium text-slate-700">
                                  {gen.type}
                                </span>
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {formatNumber(gen.count)}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Tier Breakdown Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-slate-900">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      Usage by Tier
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-end gap-2 p-4">
                      {data.platformSummary.tierBreakdown.map((tier, idx) => {
                        const height =
                          maxTierGenerations > 0
                            ? (tier.totalGenerations / maxTierGenerations) * 100
                            : 0;

                        const colors: Record<string, string> = {
                          FREE: "from-slate-400 to-slate-500",
                          STARTER: "from-blue-400 to-blue-500",
                          PROFESSIONAL: "from-purple-400 to-purple-500",
                          ENTERPRISE: "from-amber-400 to-amber-500",
                          CUSTOM: "from-emerald-400 to-emerald-500",
                        };

                        return (
                          <motion.div
                            key={tier.tier}
                            className="flex-1 flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * idx }}
                          >
                            <div className="text-xs font-medium text-slate-700">
                              {formatNumber(tier.totalGenerations)}
                            </div>
                            <div
                              className={cn(
                                "w-full rounded-t bg-gradient-to-t min-h-[8px] transition-all hover:opacity-80",
                                colors[tier.tier]
                              )}
                              style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <div className="text-xs text-slate-600 truncate max-w-full">
                              {tier.tier}
                            </div>
                            <div className="text-xs text-slate-400">
                              {tier.count} users
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {/* Filters */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 min-h-[44px]"
                      />
                    </div>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                        <SelectValue placeholder="Filter by tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Tier</TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-slate-100/50 transition-colors"
                          onClick={() => handleSort("totalTokens")}
                        >
                          <div className="flex items-center gap-1">
                            Tokens
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-slate-100/50 transition-colors"
                          onClick={() => handleSort("totalGenerations")}
                        >
                          <div className="flex items-center gap-1">
                            Generations
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold cursor-pointer hover:bg-slate-100/50 transition-colors"
                          onClick={() => handleSort("totalCost")}
                        >
                          <div className="flex items-center gap-1">
                            Cost
                            <ArrowUpDown className="h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">
                          Daily/Monthly
                        </TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">
                          Last Activity
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                          </TableCell>
                        </TableRow>
                      ) : data.users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-slate-500"
                          >
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.users.map((user, idx) => (
                          <TableRow
                            key={user.id}
                            className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsUserModalOpen(true);
                            }}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                                    {(user.name || user.email || "U")[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">
                                    {user.name || "Unknown"}
                                  </div>
                                  <div className="text-xs text-slate-500 truncate">
                                    {user.email || "No email"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("font-medium", getTierColor(user.subscriptionTier))}>
                                {user.subscriptionTier}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatNumber(user.totalTokens)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatNumber(user.totalGenerations)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCost(user.totalCost)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-sm">
                                <span className="font-medium">{user.dailyAiUsageCount}</span>
                                <span className="text-slate-400"> / </span>
                                <span className="font-medium">{user.monthlyAiUsageCount}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(user.status)}
                                <span className="text-sm">{getStatusLabel(user.status)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-600">
                              {formatDate(user.lastUsageDate)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50">
                    <div className="text-sm text-slate-600">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of{" "}
                      {pagination.totalItems} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-slate-600">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                        }
                        disabled={currentPage === pagination.totalPages || isLoading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Tiers Tab */}
            <TabsContent value="tiers" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.platformSummary.tierBreakdown.map((tier, idx) => {
                  const gradients: Record<string, string> = {
                    FREE: "from-slate-500 to-slate-600",
                    STARTER: "from-blue-500 to-blue-600",
                    PROFESSIONAL: "from-purple-500 to-purple-600",
                    ENTERPRISE: "from-amber-500 to-amber-600",
                    CUSTOM: "from-emerald-500 to-emerald-600",
                  };

                  return (
                    <motion.div
                      key={tier.tier}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                    >
                      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg overflow-hidden">
                        <div
                          className={cn(
                            "h-2 bg-gradient-to-r",
                            gradients[tier.tier]
                          )}
                        />
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center justify-between">
                            <Badge className={cn("font-medium text-base px-3 py-1", getTierColor(tier.tier))}>
                              {tier.tier}
                            </Badge>
                            <span className="text-2xl font-bold text-slate-900">
                              {tier.count}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-slate-500">users</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-slate-900">
                                {formatNumber(tier.totalTokens)}
                              </div>
                              <div className="text-xs text-slate-500">Tokens</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900">
                                {formatNumber(tier.totalGenerations)}
                              </div>
                              <div className="text-xs text-slate-500">Generations</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-slate-900">
                                {formatCost(tier.totalCost)}
                              </div>
                              <div className="text-xs text-slate-500">Cost</div>
                            </div>
                          </div>
                          {tier.count > 0 && (
                            <div className="pt-2 border-t border-slate-200/50">
                              <div className="text-xs text-slate-500">
                                Avg. per user:{" "}
                                <span className="font-medium text-slate-700">
                                  {formatNumber(Math.round(tier.totalTokens / tier.count))} tokens
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-4">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Usage Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.dailyTrends.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-slate-500">
                      No trend data available for the selected period
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-end gap-1 p-4 overflow-x-auto">
                      {data.dailyTrends.map((trend, idx) => {
                        const maxTokens = Math.max(
                          ...data.dailyTrends.map((t) => t.tokens),
                          1
                        );
                        const height = (trend.tokens / maxTokens) * 100;

                        return (
                          <motion.div
                            key={trend.date}
                            className="flex-1 min-w-[20px] max-w-[40px] flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.02 * idx }}
                          >
                            <div className="text-[10px] font-medium text-slate-600 -rotate-45 origin-bottom-left whitespace-nowrap">
                              {formatNumber(trend.tokens)}
                            </div>
                            <div
                              className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t hover:from-orange-600 hover:to-amber-500 transition-colors min-h-[4px]"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${trend.date}: ${formatNumber(trend.tokens)} tokens, ${trend.generations} generations`}
                            />
                            <div className="text-[8px] text-slate-500 -rotate-45 origin-top-left whitespace-nowrap">
                              {trend.date.slice(5)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* User Detail Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                      {(selectedUser.name || selectedUser.email || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {selectedUser.name || "Unknown User"}
                    </div>
                    <div className="text-sm text-slate-500 font-normal">
                      {selectedUser.email || "No email"}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <Badge className={cn("font-medium", getTierColor(selectedUser.subscriptionTier))}>
                    {selectedUser.subscriptionTier}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedUser.status)}
                    <span className="text-sm">{getStatusLabel(selectedUser.status)}</span>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {formatNumber(selectedUser.totalTokens)}
                    </div>
                    <div className="text-xs text-slate-500">Total Tokens</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {formatNumber(selectedUser.totalGenerations)}
                    </div>
                    <div className="text-xs text-slate-500">Generations</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {formatCost(selectedUser.totalCost)}
                    </div>
                    <div className="text-xs text-slate-500">Total Cost</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {formatDate(selectedUser.lastUsageDate)}
                    </div>
                    <div className="text-xs text-slate-500">Last Activity</div>
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Usage Limits</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Daily Usage</span>
                      <span className="font-medium">{selectedUser.dailyAiUsageCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Monthly Usage</span>
                      <span className="font-medium">{selectedUser.monthlyAiUsageCount}</span>
                    </div>
                  </div>
                </div>

                {/* Generation Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Generation Breakdown</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Courses", value: selectedUser.courseGenerations, icon: BookOpen },
                      { label: "Chapters", value: selectedUser.chapterGenerations, icon: FileText },
                      { label: "Lessons", value: selectedUser.lessonGenerations, icon: GraduationCap },
                      { label: "Exams", value: selectedUser.examGenerations, icon: ClipboardList },
                      { label: "Exercises", value: selectedUser.exerciseGenerations, icon: Dumbbell },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-slate-50 rounded-lg p-3 text-center"
                      >
                        <item.icon className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                        <div className="text-lg font-bold text-slate-900">
                          {item.value}
                        </div>
                        <div className="text-xs text-slate-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
