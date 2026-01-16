'use client';

/**
 * SAM Health Monitoring Page
 *
 * Admin dashboard for monitoring SAM AI system health and quality metrics.
 * Provides observability into:
 * - Overall system health and service status
 * - Tool execution history and debugging
 * - Response quality metrics and trends
 */

import { useState, useCallback } from 'react';
import {
  SAMHealthDashboard,
  ToolExecutionLog,
  QualityMetricsPanel,
} from '@/components/sam/observability';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Loader2, Activity, Wrench, Sparkles } from 'lucide-react';

export default function SAMHealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qualityPeriod, setQualityPeriod] = useState<'day' | 'week' | 'month'>(
    'week'
  );

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    // Brief delay to allow visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            SAM AI Health Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor system health, tool executions, and quality metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Auto-refresh: 30s
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All
          </Button>
        </div>
      </div>

      {/* Desktop Layout: Side-by-side view */}
      <div className="hidden lg:block">
        {/* Full-width SAM Health Dashboard */}
        <SAMHealthDashboard
          className="mb-6"
          refreshInterval={30000}
          onRefresh={handleRefreshAll}
        />

        {/* Two-column grid for Tool Execution and Quality Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <ToolExecutionLog
            limit={50}
            refreshInterval={30000}
            showFilters={true}
          />
          <QualityMetricsPanel
            period={qualityPeriod}
            onPeriodChange={setQualityPeriod}
            showBreakdown={true}
            refreshInterval={60000}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout: Tabbed view */}
      <div className="lg:hidden">
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-1">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="mt-4">
            <SAMHealthDashboard
              refreshInterval={30000}
              onRefresh={handleRefreshAll}
            />
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <ToolExecutionLog
              limit={50}
              refreshInterval={30000}
              showFilters={true}
            />
          </TabsContent>

          <TabsContent value="quality" className="mt-4">
            <QualityMetricsPanel
              period={qualityPeriod}
              onPeriodChange={setQualityPeriod}
              showBreakdown={true}
              refreshInterval={60000}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
