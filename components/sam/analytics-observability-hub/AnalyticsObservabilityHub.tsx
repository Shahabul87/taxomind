'use client';

/**
 * AnalyticsObservabilityHub
 *
 * Phase 7 of the engine merge plan - integrating analytics, observability,
 * and prediction engines into a cohesive monitoring and insights hub.
 *
 * Integrates:
 * - SAMHealthDashboard - System health monitoring
 * - ToolExecutionLog - Tool execution tracking
 * - BehaviorPatternsWidget - Learning behavior analysis
 * - PredictiveInsights - AI-powered predictions
 * - TrendsExplorer - Industry trends and market insights
 *
 * @module components/sam/analytics-observability-hub
 */

import { useState, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Activity,
  TrendingUp,
  Brain,
  Wrench,
  LineChart,
  Gauge,
  Eye,
  Sparkles,
  ChevronRight,
  Expand,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Flame,
} from 'lucide-react';

// Import sub-components
import { SAMHealthDashboard } from '../observability/SAMHealthDashboard';
import { ToolExecutionLog } from '../observability/ToolExecutionLog';
import { BehaviorPatternsWidget } from '../behavior/BehaviorPatternsWidget';
import { PredictiveInsights } from '../PredictiveInsights';
import { TrendsExplorer } from '../TrendsExplorer';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsObservabilityHubProps {
  className?: string;
  /** Compact display mode */
  compact?: boolean;
  /** User ID for filtering */
  userId?: string;
  /** Course ID for context */
  courseId?: string;
  /** Default active tab */
  defaultTab?: 'overview' | 'behavior' | 'predictions' | 'trends' | 'tools';
  /** Callback when a pattern is clicked */
  onPatternClick?: (pattern: unknown) => void;
  /** Callback when a trend is clicked */
  onTrendClick?: (trend: unknown) => void;
  /** Callback when an intervention is clicked */
  onInterventionClick?: (intervention: unknown) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TAB_CONFIG = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'System health & quick stats',
  },
  {
    id: 'behavior',
    label: 'Behavior',
    icon: Brain,
    description: 'Learning patterns & insights',
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: LineChart,
    description: 'AI-powered forecasts',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: TrendingUp,
    description: 'Industry & market insights',
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    description: 'Execution logs & debugging',
  },
] as const;

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function QuickMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
  onClick,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all text-left w-full',
        'hover:shadow-md hover:border-primary/30',
        color
      )}
    >
      <div className="p-2 rounded-full bg-background/50">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
      {trend && (
        <div
          className={cn(
            'text-xs',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'stable' && 'text-gray-500'
          )}
        >
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'stable' && '→'}
        </div>
      )}
    </button>
  );
}

function QuickAccessCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border transition-all text-left w-full',
        'hover:shadow-lg hover:scale-[1.02]',
        color
      )}
    >
      <div className="p-2 rounded-lg bg-background/50">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
    </button>
  );
}

function OverviewTab({
  onNavigate,
  userId,
}: {
  onNavigate: (tab: string) => void;
  userId?: string;
}) {
  return (
    <div className="space-y-6">
      {/* System Health Quick View */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          System Status
        </h3>
        <SAMHealthDashboard compact className="border-0 shadow-none" />
      </div>

      {/* Quick Metrics Grid */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Gauge className="h-4 w-4" />
          Quick Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickMetricCard
            icon={Brain}
            label="Patterns"
            value="View"
            color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
            onClick={() => onNavigate('behavior')}
          />
          <QuickMetricCard
            icon={LineChart}
            label="Predictions"
            value="Analyze"
            color="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600"
            onClick={() => onNavigate('predictions')}
          />
          <QuickMetricCard
            icon={TrendingUp}
            label="Trends"
            value="Explore"
            trend="up"
            color="bg-orange-50 dark:bg-orange-950/30 text-orange-600"
            onClick={() => onNavigate('trends')}
          />
          <QuickMetricCard
            icon={Wrench}
            label="Tools"
            value="Monitor"
            color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
            onClick={() => onNavigate('tools')}
          />
        </div>
      </div>

      {/* Quick Access Panels */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <QuickAccessCard
            icon={Brain}
            title="Learning Patterns"
            description="Analyze your behavior patterns and learning style"
            color="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
            onClick={() => onNavigate('behavior')}
          />
          <QuickAccessCard
            icon={Target}
            title="Predictive Insights"
            description="AI-powered predictions and recommendations"
            color="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30"
            onClick={() => onNavigate('predictions')}
          />
          <QuickAccessCard
            icon={Flame}
            title="Market Trends"
            description="Industry trends and skill demand insights"
            color="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30"
            onClick={() => onNavigate('trends')}
          />
          <QuickAccessCard
            icon={Eye}
            title="Tool Execution Log"
            description="Monitor AI tool calls and performance"
            color="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
            onClick={() => onNavigate('tools')}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('behavior')}>
          <Brain className="h-4 w-4 mr-1" />
          Detect Patterns
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('predictions')}>
          <LineChart className="h-4 w-4 mr-1" />
          View Predictions
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('trends')}>
          <TrendingUp className="h-4 w-4 mr-1" />
          Explore Trends
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AnalyticsObservabilityHub({
  className,
  compact = false,
  userId,
  courseId,
  defaultTab = 'overview',
  onPatternClick,
  onTrendClick,
  onInterventionClick,
}: AnalyticsObservabilityHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as typeof activeTab);
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Analytics &amp; Observability Hub</CardTitle>
              <CardDescription>
                System monitoring, behavior analysis, and predictive insights
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh all data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <OverviewTab onNavigate={handleNavigate} userId={userId} />
              </TabsContent>

              {/* Behavior Tab */}
              <TabsContent value="behavior" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Learning Behavior Patterns</h3>
                      <p className="text-sm text-muted-foreground">
                        Detected patterns in your learning behavior
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Expand className="h-4 w-4 mr-1" />
                          Expand
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Learning Behavior Analysis</DialogTitle>
                          <DialogDescription>
                            Comprehensive view of your detected learning patterns
                          </DialogDescription>
                        </DialogHeader>
                        <BehaviorPatternsWidget
                          maxPatterns={20}
                          showDetect
                          onPatternClick={onPatternClick}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <BehaviorPatternsWidget
                    compact={compact}
                    maxPatterns={5}
                    showDetect
                    onPatternClick={onPatternClick}
                  />
                </div>
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">AI-Powered Predictions</h3>
                      <p className="text-sm text-muted-foreground">
                        Learning outcome forecasts and recommendations
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Expand className="h-4 w-4 mr-1" />
                          Expand
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Predictive Insights</DialogTitle>
                          <DialogDescription>
                            Detailed predictions and risk assessment
                          </DialogDescription>
                        </DialogHeader>
                        <PredictiveInsights
                          userId={userId}
                          courseId={courseId}
                          onInterventionClick={onInterventionClick}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <PredictiveInsights
                    compact={compact}
                    userId={userId}
                    courseId={courseId}
                    onInterventionClick={onInterventionClick}
                  />
                </div>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Industry Trends &amp; Market Insights</h3>
                      <p className="text-sm text-muted-foreground">
                        Skill demand and market analysis
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Expand className="h-4 w-4 mr-1" />
                          Expand
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Trends Explorer</DialogTitle>
                          <DialogDescription>
                            Comprehensive industry trends and skill demand analysis
                          </DialogDescription>
                        </DialogHeader>
                        <TrendsExplorer onTrendClick={onTrendClick} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <TrendsExplorer compact={compact} onTrendClick={onTrendClick} />
                </div>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="mt-0">
                <div className="space-y-4">
                  {/* System Health */}
                  <div>
                    <h3 className="font-medium mb-3">System Health</h3>
                    <SAMHealthDashboard compact={compact} />
                  </div>

                  {/* Tool Execution Log */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Tool Execution Log</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Expand className="h-4 w-4 mr-1" />
                            Expand
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Tool Execution Log</DialogTitle>
                            <DialogDescription>
                              Complete history of AI tool executions
                            </DialogDescription>
                          </DialogHeader>
                          <ToolExecutionLog
                            userId={userId}
                            limit={100}
                            showFilters
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <ToolExecutionLog
                      userId={userId}
                      limit={compact ? 10 : 20}
                      showFilters={!compact}
                    />
                  </div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AnalyticsObservabilityHub;
