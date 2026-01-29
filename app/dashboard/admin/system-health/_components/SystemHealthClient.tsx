"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Loader2,
  MemoryStick,
  RefreshCw,
  Server,
  Shield,
  Globe,
  HeartPulse,
  TrendingDown,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceStatus {
  status: "up" | "down" | "not_configured";
  responseTime?: number;
  error?: string;
}

interface SystemHealthData {
  status: "healthy" | "degraded" | "unhealthy";
  healthScore: number;
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    samAI: {
      status: "initialized" | "not_initialized";
      circuitBreaker: string;
      adapterSource: string | null;
    };
    embedding: {
      status: "initialized" | "not_initialized";
    };
  };
  database: {
    totalQueries: number;
    errorCount: number;
    errorRate: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
      avg: number;
      max: number;
    };
  };
  api: {
    stats: {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    } | null;
    slowOperations: Array<{
      name: string;
      duration: number;
      timestamp: string;
    }>;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    heapUsagePercent: number;
  };
  cache: {
    size: number;
    maxSize: number;
  };
  rateLimiting: {
    totalBuckets: number;
    bucketsByCategory: Record<string, number>;
  };
  environment: {
    nodeEnv: string;
    platform: string;
    version: string;
  };
  samHealth: {
    healthScore: number;
    components: Array<{
      name: string;
      status: "healthy" | "degraded" | "unhealthy";
      errorRate: number;
      latencyMs: number;
    }>;
    alerts: Array<{
      id: string;
      ruleName: string;
      severity: string;
      message: string;
      triggeredAt: string;
      acknowledgedAt: string | null;
    }>;
    metrics: {
      activeConnections: number;
      memoryUsageMb: number;
      errorRate: number;
      latencyP50Ms: number;
      latencyP95Ms: number;
    };
  } | null;
  syntheticMonitor: {
    status: "healthy" | "degraded" | "error";
    totalResponseTime: number;
    services: {
      database: { status: string; error: string | null };
      posts: { status: string; count: number; error: string | null };
      courses: { status: string; count: number; error: string | null };
    };
    performance: {
      averageResponseTime: number;
      status: "good" | "warning" | "poor";
    };
  } | null;
  recommendations: string[];
}

type RefreshInterval = 15 | 30 | 60 | 0;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "Off", value: 0 },
];

const CATEGORY_LIMITS: Record<string, { maxTokens: number; rate: string }> = {
  "sam:standard": { maxTokens: 100, rate: "10/s" },
  "sam:ai": { maxTokens: 20, rate: "2/s" },
  "sam:tools": { maxTokens: 10, rate: "1/s" },
  "sam:readonly": { maxTokens: 200, rate: "20/s" },
  "sam:heavy": { maxTokens: 5, rate: "1/5s" },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SystemHealthClient() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(30);
  const [refreshing, setRefreshing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/system-health", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        throw new Error(json.error?.message ?? "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(
        () => fetchData(),
        refreshInterval * 1000
      );
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, fetchData]);

  // ------ Loading state ------
  if (loading) return <LoadingSkeleton />;

  // ------ Error state ------
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg font-medium text-neutral-700">
          Failed to load system health data
        </p>
        <p className="text-sm text-neutral-500">{error}</p>
        <Button onClick={() => fetchData(true)} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <TooltipProvider>
      <motion.div
        className="space-y-6 p-4 md:p-6 lg:p-8"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* Section A: Header */}
        <HeaderBar
          data={data}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
          onManualRefresh={() => fetchData(true)}
          refreshing={refreshing}
        />

        {/* Section B: Overall Status */}
        <motion.div variants={fadeUp}>
          <OverallStatusBanner data={data} />
        </motion.div>

        {/* Section C: Service Health Grid */}
        <motion.div variants={fadeUp}>
          <ServiceHealthGrid data={data} />
        </motion.div>

        {/* Section D: Performance Metric Cards */}
        <motion.div variants={fadeUp}>
          <PerformanceMetrics data={data} />
        </motion.div>

        {/* Section E: Tabbed Detail Panels */}
        <motion.div variants={fadeUp}>
          <DetailTabs data={data} />
        </motion.div>

        {/* Section F: Recommendations */}
        <motion.div variants={fadeUp}>
          <Recommendations recommendations={data.recommendations} />
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

// ===========================================================================
// Section A: Header
// ===========================================================================

function HeaderBar({
  data,
  refreshInterval,
  onRefreshIntervalChange,
  onManualRefresh,
  refreshing,
}: {
  data: SystemHealthData;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (v: RefreshInterval) => void;
  onManualRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          System Health &amp; Performance
        </h1>
        <p className="text-sm text-neutral-500">
          Real-time monitoring of all platform services
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Refresh interval selector */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          {REFRESH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRefreshIntervalChange(opt.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                refreshInterval === opt.value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onManualRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>

        {/* Last updated */}
        <span className="hidden text-xs text-neutral-400 sm:inline-block">
          Updated{" "}
          {formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

// ===========================================================================
// Section B: Overall Status Banner
// ===========================================================================

function OverallStatusBanner({ data }: { data: SystemHealthData }) {
  const statusConfig = {
    healthy: {
      bg: "from-emerald-50 to-green-50 border-emerald-200",
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
      badge: "bg-emerald-100 text-emerald-700",
      label: "Healthy",
      scoreColor: "text-emerald-600",
      strokeColor: "#059669",
    },
    degraded: {
      bg: "from-amber-50 to-yellow-50 border-amber-200",
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      badge: "bg-amber-100 text-amber-700",
      label: "Degraded",
      scoreColor: "text-amber-600",
      strokeColor: "#d97706",
    },
    unhealthy: {
      bg: "from-red-50 to-rose-50 border-red-200",
      icon: <XCircle className="h-6 w-6 text-red-600" />,
      badge: "bg-red-100 text-red-700",
      label: "Unhealthy",
      scoreColor: "text-red-600",
      strokeColor: "#dc2626",
    },
  };

  const cfg = statusConfig[data.status];

  return (
    <Card
      className={cn(
        "border bg-gradient-to-r overflow-hidden",
        cfg.bg
      )}
    >
      <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Status + Label */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm">
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold px-2.5 py-0.5 rounded-full", cfg.badge)}>
                {cfg.label}
              </span>
              <Badge variant="outline" className="text-xs font-normal">
                {data.environment.nodeEnv === "production"
                  ? "Production"
                  : "Development"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              v{data.environment.version} &middot; {data.environment.platform}
            </p>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="flex items-center gap-6">
          <HealthScoreGauge
            score={data.healthScore}
            color={cfg.strokeColor}
            textColor={cfg.scoreColor}
          />

          {/* Uptime */}
          <div className="text-center">
            <p className="text-xs font-medium text-neutral-500">Uptime</p>
            <p className="text-lg font-semibold text-neutral-800">
              {formatUptime(data.uptime)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthScoreGauge({
  score,
  color,
  textColor,
}: {
  score: number;
  color: string;
  textColor: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-24 w-24">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-xl font-bold", textColor)}>{score}</span>
        <span className="text-[10px] text-neutral-400">/ 100</span>
      </div>
    </div>
  );
}

// ===========================================================================
// Section C: Service Health Grid
// ===========================================================================

function ServiceHealthGrid({ data }: { data: SystemHealthData }) {
  const services = [
    {
      name: "Database",
      icon: <Database className="h-5 w-5" />,
      status: data.services.database.status,
      detail: data.services.database.responseTime
        ? `${data.services.database.responseTime}ms`
        : undefined,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Cache / Redis",
      icon: <HardDrive className="h-5 w-5" />,
      status: data.services.redis.status,
      detail:
        data.services.redis.status === "not_configured"
          ? "Not configured"
          : data.services.redis.responseTime
            ? `${data.services.redis.responseTime}ms`
            : undefined,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      name: "SAM AI",
      icon: <Brain className="h-5 w-5" />,
      status: data.services.samAI.status === "initialized" ? "up" : "down",
      detail: data.services.samAI.adapterSource ?? "No adapter",
      extra: data.services.samAI.circuitBreaker,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      name: "Embedding",
      icon: <Cpu className="h-5 w-5" />,
      status:
        data.services.embedding.status === "initialized" ? "up" : "down",
      gradient: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {services.map((svc) => (
        <Card key={svc.name} className="overflow-hidden">
          <div className={cn("h-1 bg-gradient-to-r", svc.gradient)} />
          <CardContent className="flex items-start gap-3 p-4">
            <div
              className={cn(
                "rounded-lg p-2 text-white bg-gradient-to-br",
                svc.gradient
              )}
            >
              {svc.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">
                  {svc.name}
                </p>
                <StatusDot status={svc.status as string} />
              </div>
              {svc.detail && (
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {svc.detail}
                </p>
              )}
              {svc.extra && (
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-1 text-[10px]",
                    svc.extra === "closed"
                      ? "border-emerald-200 text-emerald-600"
                      : svc.extra === "open"
                        ? "border-red-200 text-red-600"
                        : "border-amber-200 text-amber-600"
                  )}
                >
                  CB: {svc.extra}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "up"
      ? "bg-emerald-500"
      : status === "not_configured"
        ? "bg-neutral-400"
        : "bg-red-500";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex h-3 w-3">
          {status === "up" && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          )}
          <span
            className={cn("relative inline-flex h-3 w-3 rounded-full", color)}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs capitalize">{status.replace("_", " ")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ===========================================================================
// Section D: Performance Metrics
// ===========================================================================

function PerformanceMetrics({ data }: { data: SystemHealthData }) {
  const cards = [
    {
      label: "Avg Response Time",
      value: data.api.stats ? `${Math.round(data.api.stats.avg)}ms` : "N/A",
      icon: <Clock className="h-4 w-4" />,
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      label: "P95 Latency",
      value: data.api.stats ? `${Math.round(data.api.stats.p95)}ms` : "N/A",
      icon: <Gauge className="h-4 w-4" />,
      gradient: "from-violet-600 to-purple-600",
    },
    {
      label: "Total Queries",
      value: formatNumber(data.database.totalQueries),
      icon: <Zap className="h-4 w-4" />,
      gradient: "from-emerald-600 to-teal-600",
    },
    {
      label: "Error Rate",
      value: `${data.database.errorRate}%`,
      icon:
        data.database.errorRate > 5 ? (
          <TrendingDown className="h-4 w-4" />
        ) : (
          <Shield className="h-4 w-4" />
        ),
      gradient:
        data.database.errorRate > 5
          ? "from-red-600 to-rose-600"
          : data.database.errorRate > 1
            ? "from-amber-600 to-orange-600"
            : "from-emerald-600 to-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                card.gradient
              )}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">
                {card.label}
              </p>
              <p className="text-xl font-bold text-neutral-900">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ===========================================================================
// Section E: Tabbed Detail Panels
// ===========================================================================

function DetailTabs({ data }: { data: SystemHealthData }) {
  return (
    <Tabs defaultValue="database" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="api">API Perf</TabsTrigger>
        <TabsTrigger value="memory">Memory</TabsTrigger>
        <TabsTrigger value="ratelimit">Rate Limiting</TabsTrigger>
        <TabsTrigger value="sam-health" className="gap-1">
          <HeartPulse className="h-3.5 w-3.5 hidden sm:inline-block" />
          SAM Health
        </TabsTrigger>
        <TabsTrigger value="synthetic" className="gap-1">
          <Globe className="h-3.5 w-3.5 hidden sm:inline-block" />
          Synthetic
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Database */}
      <TabsContent value="database">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Database Metrics</CardTitle>
            <CardDescription>
              Query performance and connection pool health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Latency percentiles */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-neutral-700">
                Latency Percentiles (ms)
              </p>
              {(
                [
                  { label: "P50", value: data.database.latency.p50 },
                  { label: "P95", value: data.database.latency.p95 },
                  { label: "P99", value: data.database.latency.p99 },
                  { label: "Avg", value: data.database.latency.avg },
                  { label: "Max", value: data.database.latency.max },
                ] as const
              ).map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-neutral-500">
                    {item.label}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          item.value > 1000
                            ? "bg-red-500"
                            : item.value > 500
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        )}
                        style={{
                          width: `${Math.min(100, (item.value / Math.max(data.database.latency.max, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-xs font-mono text-neutral-600">
                    {item.value}ms
                  </span>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 rounded-lg border border-neutral-200 p-4">
              <div className="text-center">
                <p className="text-xs text-neutral-500">Total Queries</p>
                <p className="text-lg font-bold text-neutral-800">
                  {formatNumber(data.database.totalQueries)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Errors</p>
                <p className="text-lg font-bold text-neutral-800">
                  {formatNumber(data.database.errorCount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">Error Rate</p>
                <p
                  className={cn(
                    "text-lg font-bold",
                    data.database.errorRate >= 5
                      ? "text-red-600"
                      : data.database.errorRate >= 1
                        ? "text-amber-600"
                        : "text-emerald-600"
                  )}
                >
                  {data.database.errorRate}%
                </p>
              </div>
            </div>

            {/* Error rate progress bar */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Query Error Rate</span>
                <span
                  className={cn(
                    "font-medium",
                    data.database.errorRate >= 5
                      ? "text-red-600"
                      : data.database.errorRate >= 1
                        ? "text-amber-600"
                        : "text-emerald-600"
                  )}
                >
                  {data.database.errorRate}%
                </span>
              </div>
              <Progress
                value={Math.min(data.database.errorRate, 100)}
                className={cn(
                  "h-2",
                  data.database.errorRate >= 5
                    ? "[&>div]:bg-red-500"
                    : data.database.errorRate >= 1
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500"
                )}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 2: API Performance */}
      <TabsContent value="api">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">API Performance</CardTitle>
            <CardDescription>
              Request timing statistics and slow operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.api.stats ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {(
                    [
                      { label: "Count", value: data.api.stats.count, unit: "" },
                      {
                        label: "Min",
                        value: data.api.stats.min,
                        unit: "ms",
                      },
                      {
                        label: "Max",
                        value: data.api.stats.max,
                        unit: "ms",
                      },
                      {
                        label: "Avg",
                        value: data.api.stats.avg,
                        unit: "ms",
                      },
                      {
                        label: "P50",
                        value: data.api.stats.p50,
                        unit: "ms",
                      },
                      {
                        label: "P95",
                        value: data.api.stats.p95,
                        unit: "ms",
                      },
                      {
                        label: "P99",
                        value: data.api.stats.p99,
                        unit: "ms",
                      },
                    ] as const
                  ).map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg border border-neutral-200 p-3 text-center"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-neutral-800">
                        {Math.round(s.value)}
                        <span className="text-xs font-normal text-neutral-400">
                          {s.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                No API metrics recorded yet. Metrics begin collecting after the
                first monitored request.
              </p>
            )}

            {/* Slow operations */}
            {data.api.slowOperations.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  Slow Operations (&gt;500ms)
                </p>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                          Operation
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                          Duration
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {data.api.slowOperations.map((op, i) => (
                        <tr key={`${op.name}-${i}`}>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                            {op.name}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                op.duration > 2000
                                  ? "bg-red-100 text-red-700"
                                  : op.duration > 1000
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-yellow-100 text-yellow-700"
                              )}
                            >
                              {op.duration}ms
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-neutral-500">
                            {formatDistanceToNow(new Date(op.timestamp), {
                              addSuffix: true,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.api.slowOperations.length === 0 && data.api.stats && (
              <p className="text-sm text-neutral-500">
                No slow operations detected. All requests completed within
                acceptable thresholds.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 3: Memory */}
      <TabsContent value="memory">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Memory &amp; Resources
            </CardTitle>
            <CardDescription>
              Node.js process memory utilization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Heap usage gauge */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-8">
              <div className="flex flex-col items-center">
                <HealthScoreGauge
                  score={Math.round(data.memory.heapUsagePercent)}
                  color={
                    data.memory.heapUsagePercent > 90
                      ? "#dc2626"
                      : data.memory.heapUsagePercent > 75
                        ? "#d97706"
                        : "#059669"
                  }
                  textColor={
                    data.memory.heapUsagePercent > 90
                      ? "text-red-600"
                      : data.memory.heapUsagePercent > 75
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }
                />
                <p className="mt-1 text-xs text-neutral-500">Heap Usage</p>
              </div>

              <div className="flex-1 space-y-4 w-full">
                {(
                  [
                    {
                      label: "Heap Used",
                      value: data.memory.heapUsed,
                      max: data.memory.heapTotal,
                      icon: <MemoryStick className="h-4 w-4 text-blue-500" />,
                    },
                    {
                      label: "Heap Total",
                      value: data.memory.heapTotal,
                      max: data.memory.rss,
                      icon: <Server className="h-4 w-4 text-violet-500" />,
                    },
                    {
                      label: "RSS",
                      value: data.memory.rss,
                      max: data.memory.rss * 1.5,
                      icon: <Activity className="h-4 w-4 text-amber-500" />,
                    },
                  ] as const
                ).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {item.icon}
                        <span className="text-xs font-medium text-neutral-600">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-neutral-500">
                        {item.value} MB
                      </span>
                    </div>
                    <Progress
                      value={Math.min(
                        100,
                        (item.value / Math.max(item.max, 1)) * 100
                      )}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cache info */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">
                In-Memory Cache
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Entries</p>
                  <p className="text-lg font-bold text-neutral-800">
                    {data.cache.size}
                    <span className="text-xs font-normal text-neutral-400">
                      {" "}
                      / {data.cache.maxSize}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Utilization</p>
                  <p className="text-lg font-bold text-neutral-800">
                    {data.cache.maxSize > 0
                      ? Math.round(
                          (data.cache.size / data.cache.maxSize) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 4: Rate Limiting */}
      <TabsContent value="ratelimit">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rate Limiting</CardTitle>
            <CardDescription>
              Active token buckets and category configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total buckets */}
            <div className="rounded-lg border border-neutral-200 p-4 text-center">
              <p className="text-xs text-neutral-500">
                Active Token Buckets
              </p>
              <p className="text-3xl font-bold text-neutral-800">
                {data.rateLimiting.totalBuckets}
              </p>
            </div>

            {/* Buckets by category */}
            {Object.keys(data.rateLimiting.bucketsByCategory).length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  Buckets by Category
                </p>
                <div className="overflow-x-auto rounded-lg border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-neutral-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                          Category
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                          Active Buckets
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {Object.entries(data.rateLimiting.bucketsByCategory).map(
                        ([cat, count]) => (
                          <tr key={cat}>
                            <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                              {cat}
                            </td>
                            <td className="px-3 py-2 text-right text-xs font-bold text-neutral-800">
                              {count}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No active rate limit buckets. Buckets are created when users
                make requests.
              </p>
            )}

            {/* Category limits reference */}
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                Category Limits Reference
              </p>
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                        Category
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                        Burst Capacity
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                        Refill Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {Object.entries(CATEGORY_LIMITS).map(([cat, cfg]) => (
                      <tr key={cat}>
                        <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                          {cat}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-neutral-600">
                          {cfg.maxTokens}
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-neutral-600">
                          {cfg.rate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 5: SAM Health */}
      <TabsContent value="sam-health">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              SAM AI Component Health
            </CardTitle>
            <CardDescription>
              Real-time health metrics from SAM AI subsystems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.samHealth ? (
              <>
                {/* SAM Health Score */}
                <div className="flex items-center gap-4 rounded-lg border border-neutral-200 p-4">
                  <HealthScoreGauge
                    score={data.samHealth.healthScore}
                    color={
                      data.samHealth.healthScore >= 80
                        ? "#059669"
                        : data.samHealth.healthScore >= 50
                          ? "#d97706"
                          : "#dc2626"
                    }
                    textColor={
                      data.samHealth.healthScore >= 80
                        ? "text-emerald-600"
                        : data.samHealth.healthScore >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                    }
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      SAM Health Score
                    </p>
                    <p className="text-xs text-neutral-500">
                      Aggregated from all SAM AI components
                    </p>
                  </div>
                </div>

                {/* Component health table */}
                {data.samHealth.components.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-neutral-700">
                      Component Status
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-neutral-200">
                      <table className="w-full text-sm">
                        <thead className="border-b border-neutral-200 bg-neutral-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                              Component
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500">
                              Status
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                              Error Rate
                            </th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                              Latency
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {data.samHealth.components.map((comp) => (
                            <tr key={comp.name}>
                              <td className="px-3 py-2 font-mono text-xs text-neutral-700">
                                {comp.name}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px]",
                                    comp.status === "healthy"
                                      ? "border-emerald-200 text-emerald-600"
                                      : comp.status === "degraded"
                                        ? "border-amber-200 text-amber-600"
                                        : "border-red-200 text-red-600"
                                  )}
                                >
                                  {comp.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right text-xs font-mono text-neutral-600">
                                {comp.errorRate}%
                              </td>
                              <td className="px-3 py-2 text-right text-xs font-mono text-neutral-600">
                                {comp.latencyMs}ms
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[
                    {
                      label: "Connections",
                      value: data.samHealth.metrics.activeConnections,
                      unit: "",
                    },
                    {
                      label: "Memory",
                      value: data.samHealth.metrics.memoryUsageMb,
                      unit: "MB",
                    },
                    {
                      label: "Error Rate",
                      value: data.samHealth.metrics.errorRate,
                      unit: "%",
                    },
                    {
                      label: "P50 Latency",
                      value: data.samHealth.metrics.latencyP50Ms,
                      unit: "ms",
                    },
                    {
                      label: "P95 Latency",
                      value: data.samHealth.metrics.latencyP95Ms,
                      unit: "ms",
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-lg border border-neutral-200 p-3 text-center"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                        {m.label}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-neutral-800">
                        {m.value}
                        <span className="text-xs font-normal text-neutral-400">
                          {m.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                {data.samHealth.alerts.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-neutral-700">
                      Active Alerts ({data.samHealth.alerts.length})
                    </p>
                    <div className="space-y-2">
                      {data.samHealth.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border p-3",
                            alert.severity === "critical"
                              ? "border-red-200 bg-red-50"
                              : alert.severity === "warning"
                                ? "border-amber-200 bg-amber-50"
                                : "border-blue-200 bg-blue-50"
                          )}
                        >
                          <AlertTriangle
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              alert.severity === "critical"
                                ? "text-red-600"
                                : alert.severity === "warning"
                                  ? "text-amber-600"
                                  : "text-blue-600"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-neutral-700">
                                {alert.ruleName}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px]",
                                  alert.severity === "critical"
                                    ? "border-red-200 text-red-600"
                                    : alert.severity === "warning"
                                      ? "border-amber-200 text-amber-600"
                                      : "border-blue-200 text-blue-600"
                                )}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs text-neutral-600">
                              {alert.message}
                            </p>
                            <p className="mt-1 text-[10px] text-neutral-400">
                              Triggered{" "}
                              {formatDistanceToNow(
                                new Date(alert.triggeredAt),
                                { addSuffix: true }
                              )}
                              {alert.acknowledgedAt && " · Acknowledged"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.samHealth.alerts.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    No active alerts. All SAM AI components are operating within
                    thresholds.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                SAM telemetry is not available. The service may not be
                initialized.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab 6: Synthetic Monitor */}
      <TabsContent value="synthetic">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Synthetic Monitor</CardTitle>
            <CardDescription>
              End-to-end data path verification via live queries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.syntheticMonitor ? (
              <>
                {/* Overall status */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center gap-3">
                    <StatusDot
                      status={
                        data.syntheticMonitor.status === "healthy"
                          ? "up"
                          : "down"
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        System Status
                      </p>
                      <p className="text-xs text-neutral-500">
                        Tested database, posts, and courses data paths
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-neutral-800">
                      {data.syntheticMonitor.totalResponseTime}ms
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        data.syntheticMonitor.performance.status === "good"
                          ? "border-emerald-200 text-emerald-600"
                          : data.syntheticMonitor.performance.status ===
                              "warning"
                            ? "border-amber-200 text-amber-600"
                            : "border-red-200 text-red-600"
                      )}
                    >
                      {data.syntheticMonitor.performance.status}
                    </Badge>
                  </div>
                </div>

                {/* Services table */}
                <div>
                  <p className="mb-2 text-sm font-medium text-neutral-700">
                    Service Checks
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-neutral-200">
                    <table className="w-full text-sm">
                      <thead className="border-b border-neutral-200 bg-neutral-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500">
                            Service
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-neutral-500">
                            Status
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        <tr>
                          <td className="px-3 py-2 text-xs text-neutral-700">
                            Database
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                data.syntheticMonitor.services.database
                                  .status === "healthy"
                                  ? "border-emerald-200 text-emerald-600"
                                  : "border-red-200 text-red-600"
                              )}
                            >
                              {
                                data.syntheticMonitor.services.database
                                  .status
                              }
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-neutral-500">
                            {data.syntheticMonitor.services.database.error ??
                              "OK"}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-xs text-neutral-700">
                            Posts API
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                data.syntheticMonitor.services.posts
                                  .status === "healthy"
                                  ? "border-emerald-200 text-emerald-600"
                                  : "border-red-200 text-red-600"
                              )}
                            >
                              {data.syntheticMonitor.services.posts.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-neutral-500">
                            {data.syntheticMonitor.services.posts.error ??
                              `${data.syntheticMonitor.services.posts.count} returned`}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-xs text-neutral-700">
                            Courses API
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                data.syntheticMonitor.services.courses
                                  .status === "healthy"
                                  ? "border-emerald-200 text-emerald-600"
                                  : "border-red-200 text-red-600"
                              )}
                            >
                              {
                                data.syntheticMonitor.services.courses
                                  .status
                              }
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-xs text-neutral-500">
                            {data.syntheticMonitor.services.courses.error ??
                              `${data.syntheticMonitor.services.courses.count} returned`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance */}
                <div className="rounded-lg border border-neutral-200 p-4">
                  <p className="mb-2 text-sm font-medium text-neutral-700">
                    Performance
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">
                        Avg Response Time
                      </p>
                      <p className="text-lg font-bold text-neutral-800">
                        {
                          data.syntheticMonitor.performance
                            .averageResponseTime
                        }
                        ms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Threshold</p>
                      <p className="text-lg font-bold text-neutral-800">
                        500ms
                        <span className="text-xs font-normal text-neutral-400">
                          {" "}
                          target
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress
                      value={Math.min(
                        100,
                        (data.syntheticMonitor.totalResponseTime / 1500) *
                          100
                      )}
                      className={cn(
                        "h-2",
                        data.syntheticMonitor.performance.status === "good"
                          ? "[&>div]:bg-emerald-500"
                          : data.syntheticMonitor.performance.status ===
                              "warning"
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-red-500"
                      )}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
                      <span>0ms</span>
                      <span>500ms</span>
                      <span>1000ms</span>
                      <span>1500ms+</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">
                Synthetic monitoring data is unavailable. The monitor may have
                timed out or encountered an error.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ===========================================================================
// Section F: Recommendations
// ===========================================================================

function Recommendations({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recommendations</CardTitle>
        <CardDescription>
          Actionable suggestions based on current system state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, i) => {
          const isPositive = rec.includes("operating normally");
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                isPositive
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              )}
            >
              {isPositive ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              )}
              <p
                className={cn(
                  "text-sm",
                  isPositive ? "text-emerald-800" : "text-amber-800"
                )}
              >
                {rec}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// Loading Skeleton
// ===========================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Status banner */}
      <Skeleton className="h-28 w-full rounded-xl" />

      {/* Service cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

// ===========================================================================
// Helpers
// ===========================================================================

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
