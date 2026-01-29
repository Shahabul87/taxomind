"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Settings,
  RotateCcw,
  Save,
  X,
  Pencil,
  Zap,
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

// AI Settings types for admin management
interface UserAISettings {
  userId: string;
  dailyAiUsageCount: number;
  monthlyAiUsageCount: number;
  customDailyLimit: number | null;
  customMonthlyLimit: number | null;
  tierDailyLimit: number;
  tierMonthlyLimit: number;
  preferredProvider: string | null;
  subscriptionTier: SubscriptionTier;
  lastUpdated: string | null;
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

  // AI Settings management state
  const [aiSettings, setAiSettings] = useState<UserAISettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // AI Access state
  const [hasAIAccess, setHasAIAccess] = useState(false);
  const [isTogglingAIAccess, setIsTogglingAIAccess] = useState(false);

  // Form state for editing
  const [formDailyLimit, setFormDailyLimit] = useState<string>("");
  const [formMonthlyLimit, setFormMonthlyLimit] = useState<string>("");

  // Use ref to track current request and prevent race conditions
  const requestIdRef = useRef(0);

  // Ref to store the latest fetchData for stable access in effects
  const fetchDataRef = useRef<(resetPage?: boolean) => Promise<void>>();

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
  fetchDataRef.current = fetchData;

  // Initial load and filter changes
  useEffect(() => {
    fetchDataRef.current?.(true);
  }, [period, tierFilter, sortBy, sortOrder]);

  // Page changes
  useEffect(() => {
    fetchDataRef.current?.(false);
  }, [currentPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDataRef.current?.(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Fetch AI settings for selected user
  const fetchAISettings = useCallback(async (userId: string) => {
    setIsLoadingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/ai-settings`);
      const result = await response.json();

      if (result.success) {
        setAiSettings(result.data);
        // Initialize form values
        setFormDailyLimit(result.data.customDailyLimit?.toString() ?? "");
        setFormMonthlyLimit(result.data.customMonthlyLimit?.toString() ?? "");
      } else {
        setSettingsError(result.error?.message || "Failed to fetch AI settings");
      }
    } catch {
      setSettingsError("Failed to fetch AI settings");
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Fetch AI access status for selected user
  const fetchAIAccess = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/ai-access`);
      const result = await response.json();
      if (result.success) {
        setHasAIAccess(result.data.hasAIAccess);
      }
    } catch {
      // Silently fail - AI access toggle will just show default state
    }
  }, []);

  // Toggle AI access for selected user
  const toggleAIAccess = async (newValue: boolean) => {
    if (!selectedUser) return;

    setIsTogglingAIAccess(true);
    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/ai-access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasAIAccess: newValue }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setHasAIAccess(result.data.hasAIAccess);
        setSettingsSuccess(
          newValue ? "AI access granted to user" : "AI access revoked from user"
        );
      } else {
        setSettingsError(result.error?.message || "Failed to update AI access");
      }
    } catch {
      setSettingsError("Failed to update AI access");
    } finally {
      setIsTogglingAIAccess(false);
    }
  };

  // Update AI settings
  const updateAISettings = async (updates: {
    customDailyLimit?: number | null;
    customMonthlyLimit?: number | null;
    resetDailyUsage?: boolean;
    resetMonthlyUsage?: boolean;
  }) => {
    if (!selectedUser) return;

    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/users/${selectedUser.id}/ai-settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      const result = await response.json();

      if (result.success) {
        setAiSettings(result.data);
        setSettingsSuccess(result.message || "Settings updated successfully");
        setIsEditingSettings(false);
        // Refresh the user list to show updated values
        fetchData(false);
      } else {
        setSettingsError(result.error?.message || "Failed to update settings");
      }
    } catch {
      setSettingsError("Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle save settings
  const handleSaveSettings = () => {
    const dailyLimit = formDailyLimit.trim() === "" ? null : parseInt(formDailyLimit, 10);
    const monthlyLimit = formMonthlyLimit.trim() === "" ? null : parseInt(formMonthlyLimit, 10);

    // Validate inputs
    if (dailyLimit !== null && (isNaN(dailyLimit) || dailyLimit < 0)) {
      setSettingsError("Daily limit must be a positive number or empty");
      return;
    }
    if (monthlyLimit !== null && (isNaN(monthlyLimit) || monthlyLimit < 0)) {
      setSettingsError("Monthly limit must be a positive number or empty");
      return;
    }

    updateAISettings({
      customDailyLimit: dailyLimit,
      customMonthlyLimit: monthlyLimit,
    });
  };

  // Handle reset usage
  const handleResetDailyUsage = () => {
    if (confirm("Are you sure you want to reset this user's daily usage to 0?")) {
      updateAISettings({ resetDailyUsage: true });
    }
  };

  const handleResetMonthlyUsage = () => {
    if (confirm("Are you sure you want to reset this user's monthly usage to 0?")) {
      updateAISettings({ resetMonthlyUsage: true });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditingSettings(false);
    setSettingsError(null);
    // Reset form to current values
    setFormDailyLimit(aiSettings?.customDailyLimit?.toString() ?? "");
    setFormMonthlyLimit(aiSettings?.customMonthlyLimit?.toString() ?? "");
  };

  // Effect to fetch AI settings and access when user modal opens
  useEffect(() => {
    if (isUserModalOpen && selectedUser) {
      fetchAISettings(selectedUser.id);
      fetchAIAccess(selectedUser.id);
    } else {
      // Reset states when modal closes
      setAiSettings(null);
      setIsEditingSettings(false);
      setSettingsError(null);
      setSettingsSuccess(null);
      setHasAIAccess(false);
    }
  }, [isUserModalOpen, selectedUser, fetchAISettings, fetchAIAccess]);

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

      {/* User Detail Modal - Premium Design */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {/* Visually hidden title for accessibility */}
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selectedUser ? `User Details: ${selectedUser.name || selectedUser.email}` : "User Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col">
              {/* Premium Header with Gradient */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 pb-16">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-white/30 shadow-xl">
                      <AvatarImage src={selectedUser.image || undefined} />
                      <AvatarFallback className="bg-white/20 text-white text-xl font-bold backdrop-blur-sm">
                        {(selectedUser.name || selectedUser.email || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {selectedUser.name || "Unknown User"}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {selectedUser.email || "No email"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn(
                          "font-semibold shadow-sm",
                          selectedUser.subscriptionTier === "FREE" && "bg-slate-100 text-slate-700",
                          selectedUser.subscriptionTier === "STARTER" && "bg-blue-100 text-blue-700",
                          selectedUser.subscriptionTier === "PROFESSIONAL" && "bg-purple-100 text-purple-700",
                          selectedUser.subscriptionTier === "ENTERPRISE" && "bg-amber-100 text-amber-700",
                          selectedUser.subscriptionTier === "CUSTOM" && "bg-emerald-100 text-emerald-700"
                        )}>
                          {selectedUser.subscriptionTier}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "bg-white/10 border-white/30 text-white backdrop-blur-sm",
                          selectedUser.status === "active" && "border-emerald-300",
                          selectedUser.status === "at_limit" && "border-amber-300",
                          selectedUser.status === "inactive" && "border-slate-300"
                        )}>
                          {getStatusIcon(selectedUser.status)}
                          <span className="ml-1">{getStatusLabel(selectedUser.status)}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards - Floating Design */}
              <div className="px-6 -mt-10 relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Tokens", value: formatNumber(selectedUser.totalTokens), icon: Coins, gradient: "from-amber-400 to-orange-500" },
                    { label: "Generations", value: formatNumber(selectedUser.totalGenerations), icon: Sparkles, gradient: "from-purple-400 to-pink-500" },
                    { label: "Total Cost", value: formatCost(selectedUser.totalCost), icon: DollarSign, gradient: "from-emerald-400 to-teal-500" },
                    { label: "Last Activity", value: formatDate(selectedUser.lastUsageDate), icon: Activity, gradient: "from-blue-400 to-indigo-500" },
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 hover:shadow-xl transition-shadow"
                    >
                      <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", stat.gradient)}>
                        <stat.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                      <div className="text-xs text-slate-500">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 space-y-6">
                {/* Current Usage with Visual Progress */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    Current Usage
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Daily Usage</span>
                        <span className="text-sm font-bold text-indigo-600">
                          {selectedUser.dailyAiUsageCount}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((selectedUser.dailyAiUsageCount / 100) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Monthly Usage</span>
                        <span className="text-sm font-bold text-purple-600">
                          {selectedUser.monthlyAiUsageCount}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((selectedUser.monthlyAiUsageCount / 1000) * 100, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin AI Access Toggle */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700">
                          Grant AI Access
                        </h3>
                        <p className="text-xs text-slate-500">
                          Bypass premium subscription for AI features
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "font-medium text-xs",
                          hasAIAccess
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {hasAIAccess ? "Granted" : "Not Granted"}
                      </Badge>
                      <Switch
                        checked={hasAIAccess}
                        onCheckedChange={toggleAIAccess}
                        disabled={isTogglingAIAccess}
                      />
                    </div>
                  </div>
                </div>

                {/* Generation Breakdown - Icon Grid */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Generation Breakdown
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Courses", value: selectedUser.courseGenerations, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50" },
                      { label: "Chapters", value: selectedUser.chapterGenerations, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
                      { label: "Lessons", value: selectedUser.lessonGenerations, icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-50" },
                      { label: "Exams", value: selectedUser.examGenerations, icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50" },
                      { label: "Exercises", value: selectedUser.exerciseGenerations, icon: Dumbbell, color: "text-pink-500", bg: "bg-pink-50" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={cn("rounded-xl p-3 text-center transition-transform hover:scale-105", item.bg)}
                      >
                        <item.icon className={cn("h-5 w-5 mx-auto mb-1", item.color)} />
                        <div className="text-lg font-bold text-slate-900">{item.value}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Settings Management Section - Premium Card */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Settings className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">AI Settings Management</h3>
                        <p className="text-white/70 text-xs">Configure custom limits and reset usage</p>
                      </div>
                    </div>
                    {!isEditingSettings && !isLoadingSettings && aiSettings && (
                      <Button
                        size="sm"
                        onClick={() => setIsEditingSettings(true)}
                        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit Settings
                      </Button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Loading state */}
                    {isLoadingSettings && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
                        </div>
                        <span className="mt-4 text-slate-600 text-sm">Loading AI settings...</span>
                      </div>
                    )}

                    {/* Error state with retry */}
                    {!isLoadingSettings && settingsError && !aiSettings && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-red-600 font-medium mb-2">Failed to load settings</p>
                        <p className="text-slate-500 text-sm mb-4">{settingsError}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchAISettings(selectedUser.id)}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Retry
                        </Button>
                      </div>
                    )}

                    {/* Success/Error toasts */}
                    {settingsError && aiSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-3"
                      >
                        <div className="p-1.5 bg-red-500 rounded-full">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-red-700 text-sm font-medium">{settingsError}</span>
                      </motion.div>
                    )}
                    {settingsSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-3"
                      >
                        <div className="p-1.5 bg-emerald-500 rounded-full">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-emerald-700 text-sm font-medium">{settingsSuccess}</span>
                      </motion.div>
                    )}

                    {/* Settings content */}
                    {!isLoadingSettings && aiSettings && (
                      <div className="space-y-5">
                        {/* Usage Progress Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-slate-600">Daily Usage</span>
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                {Math.round((aiSettings.dailyAiUsageCount / (aiSettings.customDailyLimit ?? aiSettings.tierDailyLimit)) * 100)}%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">
                              {aiSettings.dailyAiUsageCount}
                              <span className="text-sm font-normal text-slate-400">
                                {" "}/ {aiSettings.customDailyLimit ?? aiSettings.tierDailyLimit}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min((aiSettings.dailyAiUsageCount / (aiSettings.customDailyLimit ?? aiSettings.tierDailyLimit)) * 100, 100)}%`
                                }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              />
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-slate-600">Monthly Usage</span>
                              <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                {Math.round((aiSettings.monthlyAiUsageCount / (aiSettings.customMonthlyLimit ?? aiSettings.tierMonthlyLimit)) * 100)}%
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 mb-1">
                              {aiSettings.monthlyAiUsageCount}
                              <span className="text-sm font-normal text-slate-400">
                                {" "}/ {aiSettings.customMonthlyLimit ?? aiSettings.tierMonthlyLimit}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min((aiSettings.monthlyAiUsageCount / (aiSettings.customMonthlyLimit ?? aiSettings.tierMonthlyLimit)) * 100, 100)}%`
                                }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tier Defaults Info */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 bg-blue-500 rounded">
                              <Users className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-blue-700">
                              Tier Defaults ({aiSettings.subscriptionTier})
                            </span>
                          </div>
                          <div className="flex gap-8 text-sm">
                            <div>
                              <span className="text-blue-600">Daily Limit:</span>{" "}
                              <span className="font-bold text-blue-900">{aiSettings.tierDailyLimit}</span>
                            </div>
                            <div>
                              <span className="text-blue-600">Monthly Limit:</span>{" "}
                              <span className="font-bold text-blue-900">{aiSettings.tierMonthlyLimit}</span>
                            </div>
                          </div>
                        </div>

                        {/* Custom Overrides */}
                        {isEditingSettings ? (
                          <div className="bg-white rounded-xl p-4 border-2 border-dashed border-purple-200">
                            <h4 className="text-sm font-semibold text-purple-700 mb-4 flex items-center gap-2">
                              <Pencil className="h-4 w-4" />
                              Custom Override Limits
                            </h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                  Custom Daily Limit
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Leave empty for tier default"
                                  value={formDailyLimit}
                                  onChange={(e) => setFormDailyLimit(e.target.value)}
                                  className="bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                  Custom Monthly Limit
                                </label>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="Leave empty for tier default"
                                  value={formMonthlyLimit}
                                  onChange={(e) => setFormMonthlyLimit(e.target.value)}
                                  className="bg-slate-50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
                              Leave fields empty to use tier defaults. Custom limits override tier defaults.
                            </p>

                            {/* Reset Actions */}
                            <div className="flex gap-2 mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetDailyUsage}
                                disabled={isSavingSettings}
                                className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-100"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Reset Daily to 0
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResetMonthlyUsage}
                                disabled={isSavingSettings}
                                className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-100"
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Reset Monthly to 0
                              </Button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                disabled={isSavingSettings}
                              >
                                <X className="h-3.5 w-3.5 mr-1.5" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md"
                              >
                                {isSavingSettings ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1 bg-purple-500 rounded">
                                <Settings className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm font-semibold text-purple-700">Custom Overrides</span>
                            </div>
                            <div className="flex gap-8 text-sm">
                              <div>
                                <span className="text-purple-600">Daily:</span>{" "}
                                <span className="font-bold text-purple-900">
                                  {aiSettings.customDailyLimit ?? "Using tier default"}
                                </span>
                              </div>
                              <div>
                                <span className="text-purple-600">Monthly:</span>{" "}
                                <span className="font-bold text-purple-900">
                                  {aiSettings.customMonthlyLimit ?? "Using tier default"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Last Updated */}
                        {aiSettings.lastUpdated && (
                          <p className="text-xs text-slate-400 text-right">
                            Settings last updated: {formatDate(aiSettings.lastUpdated)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
