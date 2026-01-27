'use client';

/**
 * ToolExecutionLog
 *
 * Displays history of AI tool executions and their results.
 * Helps with debugging and understanding AI behavior.
 *
 * Features:
 * - Chronological tool call log
 * - Execution details and timing
 * - Success/failure tracking
 * - Filtering and search
 * - Export capability
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Code,
  ArrowRight,
  AlertTriangle,
  Zap,
  Download,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ToolExecutionLogProps {
  className?: string;
  /** User ID to filter by */
  userId?: string;
  /** Maximum entries to show */
  limit?: number;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Show filters */
  showFilters?: boolean;
}

interface ToolExecution {
  id: string;
  toolName: string;
  toolType: 'query' | 'action' | 'analysis' | 'generation';
  status: 'success' | 'failed' | 'timeout' | 'cancelled';
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  userId: string;
  sessionId: string;
  metadata?: {
    retryCount?: number;
    cacheHit?: boolean;
    costTokens?: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    label: 'Success',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
  timeout: {
    icon: Clock,
    label: 'Timeout',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  cancelled: {
    icon: AlertTriangle,
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
  },
};

const TYPE_COLORS: Record<ToolExecution['toolType'], string> = {
  query: 'text-blue-500 bg-blue-50',
  action: 'text-green-500 bg-green-50',
  analysis: 'text-purple-500 bg-purple-50',
  generation: 'text-amber-500 bg-amber-50',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function truncateJson(obj: unknown, maxLength = 100): string {
  const str = JSON.stringify(obj);
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ExecutionRow({ execution }: { execution: ToolExecution }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[execution.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <div className="flex items-center gap-3">
            {/* Status icon */}
            <div className={cn('p-2 rounded-full', statusConfig.bgColor)}>
              <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
            </div>

            {/* Tool info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {execution.toolName}
                </span>
                <Badge
                  variant="outline"
                  className={cn('text-xs', TYPE_COLORS[execution.toolType])}
                >
                  {execution.toolType}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatTime(execution.startedAt)}</span>
                <span className="text-gray-300">|</span>
                <span>{formatDuration(execution.durationMs)}</span>
                {execution.metadata?.cacheHit && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-amber-600">cached</span>
                  </>
                )}
              </div>
            </div>

            {/* Expand icon */}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 ml-12 space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {/* Input */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              Input
            </div>
            <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto">
              {JSON.stringify(execution.input, null, 2)}
            </pre>
          </div>

          {/* Output or Error */}
          {execution.status === 'success' && execution.output !== undefined && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Output
              </div>
              <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border overflow-x-auto max-h-[200px]">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}

          {execution.error && (
            <div>
              <div className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Error
              </div>
              <pre className="text-xs bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 overflow-x-auto">
                {execution.error}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {execution.metadata && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {execution.metadata.retryCount !== undefined && (
                <span>Retries: {execution.metadata.retryCount}</span>
              )}
              {execution.metadata.costTokens !== undefined && (
                <span>Tokens: {execution.metadata.costTokens}</span>
              )}
              <span>Session: {execution.sessionId.slice(0, 8)}...</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/3 mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <Wrench className="h-6 w-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">No tool executions found</p>
      <p className="text-xs text-gray-400 mt-1">
        Tool calls will appear here as SAM processes requests
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ToolExecutionLog({
  className,
  userId,
  limit = 50,
  refreshInterval,
  showFilters = true,
}: ToolExecutionLogProps) {
  // State
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch executions
  const fetchExecutions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (userId) params.set('userId', userId);

      const response = await fetch(
        `/api/sam/agentic/tools/executions?${params.toString()}`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // API returns { executions: [], pagination: {} } - extract the executions array
          const apiExecutions = Array.isArray(result.data.executions)
            ? result.data.executions
            : Array.isArray(result.data)
              ? result.data
              : [];

          // Map API response to component's expected ToolExecution interface
          const mappedExecutions: ToolExecution[] = apiExecutions.map((exec: {
            executionId?: string;
            id?: string;
            toolName?: string;
            toolType?: string;
            status?: string;
            input?: Record<string, unknown>;
            output?: unknown;
            error?: string | { message?: string };
            durationMs?: number;
            startedAt?: string;
            completedAt?: string;
            userId?: string;
            sessionId?: string;
            planId?: string;
            metadata?: {
              retryCount?: number;
              cacheHit?: boolean;
              costTokens?: number;
            };
          }) => ({
            id: exec.executionId || exec.id || crypto.randomUUID(),
            toolName: exec.toolName || 'Unknown Tool',
            toolType: (exec.toolType as ToolExecution['toolType']) || 'query',
            status: (exec.status?.toLowerCase() as ToolExecution['status']) || 'success',
            input: exec.input || {},
            output: exec.output,
            error: typeof exec.error === 'string' ? exec.error : exec.error?.message,
            durationMs: exec.durationMs || 0,
            startedAt: exec.startedAt || new Date().toISOString(),
            completedAt: exec.completedAt || new Date().toISOString(),
            userId: exec.userId || userId || '',
            sessionId: exec.sessionId || exec.planId || '',
            metadata: exec.metadata,
          }));

          setExecutions(mappedExecutions);
        } else {
          // Ensure we always have an array even on failure
          setExecutions([]);
        }
      } else {
        setExecutions([]);
      }
    } catch (error) {
      console.error('[ToolExecutionLog] Failed to fetch executions:', error);
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, userId]);

  useEffect(() => {
    fetchExecutions();

    if (refreshInterval) {
      const interval = setInterval(fetchExecutions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchExecutions, refreshInterval]);

  // Filter executions - with defensive array check
  const filteredExecutions = useMemo(() => {
    // Ensure executions is always an array
    const safeExecutions = Array.isArray(executions) ? executions : [];

    return safeExecutions.filter((exec) => {
      // Search filter
      if (
        searchQuery &&
        !exec.toolName.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && exec.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && exec.toolType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [executions, searchQuery, statusFilter, typeFilter]);

  // Stats - with defensive array check
  const stats = useMemo(() => {
    // Ensure executions is always an array
    const safeExecutions = Array.isArray(executions) ? executions : [];

    const success = safeExecutions.filter((e) => e.status === 'success').length;
    const failed = safeExecutions.filter((e) => e.status === 'failed').length;
    const avgDuration =
      safeExecutions.length > 0
        ? safeExecutions.reduce((acc, e) => acc + e.durationMs, 0) / safeExecutions.length
        : 0;

    return { total: safeExecutions.length, success, failed, avgDuration };
  }, [executions]);

  // Export as JSON
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(filteredExecutions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tool-executions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredExecutions]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Tool Execution Log</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.total} total
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={fetchExecutions}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Track AI tool calls and their results
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>{stats.success} success</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-3 w-3" />
            <span>{stats.failed} failed</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Avg: {formatDuration(stats.avgDuration)}</span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[110px] h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="query">Query</SelectItem>
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="generation">Generation</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredExecutions.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Execution list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <LoadingState />
          ) : filteredExecutions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2 pr-4">
              {filteredExecutions.map((execution) => (
                <ExecutionRow key={execution.id} execution={execution} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ToolExecutionLog;
