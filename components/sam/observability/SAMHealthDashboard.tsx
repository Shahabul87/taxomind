'use client';

/**
 * SAMHealthDashboard
 *
 * Admin dashboard for monitoring SAM system health.
 * Shows real-time status, metrics, and alerts.
 *
 * Features:
 * - System status overview
 * - Service health checks
 * - Error rate monitoring
 * - Performance metrics
 * - Alert management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  Loader2,
  Shield,
  Database,
  Server,
  Brain,
  MessageSquare,
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SAMHealthDashboardProps {
  className?: string;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Callback when refresh is triggered */
  onRefresh?: () => Promise<void>;
  /** Compact display mode */
  compact?: boolean;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  metrics: SystemMetrics;
  alerts: HealthAlert[];
  lastChecked: string;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency?: number;
  lastCheck: string;
  details?: string;
}

interface SystemMetrics {
  requestsPerMinute: number;
  requestsPerMinuteTrend: 'up' | 'down' | 'stable';
  avgLatencyMs: number;
  avgLatencyTrend: 'up' | 'down' | 'stable';
  errorRate: number;
  errorRateTrend: 'up' | 'down' | 'stable';
  activeConnections: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

interface HealthAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle,
    label: 'Healthy',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  degraded: {
    icon: AlertTriangle,
    label: 'Degraded',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  unhealthy: {
    icon: XCircle,
    label: 'Unhealthy',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  unknown: {
    icon: Clock,
    label: 'Unknown',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
  },
};

const SERVICE_ICONS: Record<string, typeof Server> = {
  'AI Service': Brain,
  'Database': Database,
  'API Gateway': Server,
  'Memory Service': HardDrive,
  'Auth Service': Shield,
  'Realtime': Zap,
  default: Server,
};

const SEVERITY_CONFIG = {
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  warning: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  info: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  return `${Math.floor(diffMins / 60)}h ago`;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function OverallStatus({ status }: { status: HealthStatus['overall'] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg',
        config.bgColor
      )}
    >
      <div className="p-3 rounded-full bg-white dark:bg-gray-900">
        <Icon className={cn('h-6 w-6', config.color)} />
      </div>
      <div>
        <div className={cn('text-lg font-semibold', config.color)}>
          System {config.label}
        </div>
        <div className="text-sm text-gray-500">
          All core services operational
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: ServiceHealth }) {
  const config = STATUS_CONFIG[service.status];
  const Icon = SERVICE_ICONS[service.name] || SERVICE_ICONS.default;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-full', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div>
          <div className="text-sm font-medium">{service.name}</div>
          {service.latency !== undefined && (
            <div className="text-xs text-gray-500">
              {formatLatency(service.latency)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusIcon className={cn('h-4 w-4', config.color)} />
        <span className={cn('text-xs', config.color)}>{config.label}</span>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  threshold,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  threshold?: { warning: number; critical: number };
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  const isWarning = threshold && value >= threshold.warning && value < threshold.critical;
  const isCritical = threshold && value >= threshold.critical;

  return (
    <div className="p-3 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-4 w-4 text-gray-400" />
        {trend && <TrendIcon className={cn('h-3 w-3', trendColor)} />}
      </div>
      <div
        className={cn(
          'text-xl font-semibold',
          isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : ''
        )}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function AlertItem({
  alert,
  onAcknowledge,
}: {
  alert: HealthAlert;
  onAcknowledge?: (id: string) => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity];

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        config.bgColor,
        config.borderColor,
        alert.acknowledged && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className={cn('text-sm font-medium', config.color)}>
            {alert.title}
          </div>
          <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
          <div className="text-xs text-gray-400 mt-1">
            {formatTimeAgo(alert.timestamp)}
          </div>
        </div>
        {!alert.acknowledged && onAcknowledge && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0"
          >
            Ack
          </Button>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SAMHealthDashboard({
  className,
  refreshInterval = 30000,
  onRefresh,
  compact = false,
}: SAMHealthDashboardProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch health data
  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/agentic/health');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHealth(result.data);
        }
      }
    } catch (error) {
      console.error('[SAMHealthDashboard] Failed to fetch health:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    await fetchHealth();
    setIsRefreshing(false);
  }, [onRefresh, fetchHealth]);

  // Initial fetch and polling
  useEffect(() => {
    fetchHealth();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, refreshInterval]);

  // Handle alert acknowledgment
  const handleAcknowledge = useCallback((alertId: string) => {
    setHealth((prev) =>
      prev
        ? {
            ...prev,
            alerts: prev.alerts.map((a) =>
              a.id === alertId ? { ...a, acknowledged: true } : a
            ),
          }
        : null
    );
  }, []);

  // Count unacknowledged alerts
  const unackedAlerts = useMemo(
    () => health?.alerts.filter((a) => !a.acknowledged).length ?? 0,
    [health?.alerts]
  );

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-base">SAM System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <p className="text-sm text-gray-500">Unable to fetch health data</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact mode
  if (compact) {
    const config = STATUS_CONFIG[health.overall];
    const StatusIcon = config.icon;

    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          className
        )}
      >
        <StatusIcon className={cn('h-5 w-5', config.color)} />
        <div className="flex-1">
          <div className="text-sm font-medium">
            SAM: {config.label}
          </div>
          <div className="text-xs text-gray-500">
            {health.metrics.requestsPerMinute} req/min
          </div>
        </div>
        {unackedAlerts > 0 && (
          <Badge variant="outline" className="text-xs text-amber-600">
            {unackedAlerts} alerts
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">SAM System Health</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {unackedAlerts > 0 && (
              <Badge variant="outline" className="text-amber-600 bg-amber-50">
                {unackedAlerts} alerts
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Last checked: {formatTimeAgo(health.lastChecked)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall status */}
        <OverallStatus status={health.overall} />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Gauge}
            label="Requests/min"
            value={health.metrics.requestsPerMinute}
            unit=""
            trend={health.metrics.requestsPerMinuteTrend}
          />
          <MetricCard
            icon={Clock}
            label="Avg Latency"
            value={health.metrics.avgLatencyMs}
            unit="ms"
            trend={health.metrics.avgLatencyTrend}
            threshold={{ warning: 500, critical: 1000 }}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Error Rate"
            value={Number((health.metrics.errorRate * 100).toFixed(2))}
            unit="%"
            trend={health.metrics.errorRateTrend}
            threshold={{ warning: 1, critical: 5 }}
          />
          <MetricCard
            icon={Zap}
            label="Connections"
            value={health.metrics.activeConnections}
            unit=""
          />
        </div>

        {/* Resource usage */}
        {(health.metrics.cpuUsage !== undefined ||
          health.metrics.memoryUsage !== undefined) && (
          <div className="grid grid-cols-2 gap-3">
            {health.metrics.cpuUsage !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    CPU
                  </span>
                  <span>{health.metrics.cpuUsage}%</span>
                </div>
                <Progress value={health.metrics.cpuUsage} className="h-1.5" />
              </div>
            )}
            {health.metrics.memoryUsage !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    Memory
                  </span>
                  <span>{health.metrics.memoryUsage}%</span>
                </div>
                <Progress value={health.metrics.memoryUsage} className="h-1.5" />
              </div>
            )}
          </div>
        )}

        {/* Services */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Services ({health.services.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {health.services.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>
        </div>

        {/* Alerts */}
        {health.alerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recent Alerts ({health.alerts.length})
            </div>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2 pr-4">
                {health.alerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SAMHealthDashboard;
