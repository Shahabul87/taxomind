'use client';

/**
 * StudyPlanningHub
 *
 * Phase 8 of the engine merge plan - integrating goal planning, daily study management,
 * spaced repetition, check-ins, and memory systems into a cohesive study planning hub.
 *
 * Integrates:
 * - GoalPlanner - Goal creation and management
 * - DailyPlanWidget - Daily focus and progress tracking
 * - PlanProgressTracker - Step-by-step progress visualization
 * - SpacedRepetitionCalendar - Memory retention scheduling
 * - CheckInHistory - Check-in tracking and emotional state
 * - MemoryInsightsWidget - Contextual memory insights
 *
 * @module components/sam/study-planning-hub
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
  Target,
  Calendar,
  Brain,
  History,
  Lightbulb,
  Clock,
  Sparkles,
  ChevronRight,
  Expand,
  RefreshCw,
  Sun,
  CheckCircle,
  TrendingUp,
  Flame,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

// Import sub-components
import { DailyPlanWidget } from '../plans/DailyPlanWidget';
import { SpacedRepetitionCalendar } from '../SpacedRepetitionCalendar';
import { CheckInHistory } from '../CheckInHistory';
import { MemoryInsightsWidget } from '../memory/MemoryInsightsWidget';

// ============================================================================
// TYPES
// ============================================================================

export interface StudyPlanningHubProps {
  className?: string;
  /** Compact display mode */
  compact?: boolean;
  /** Course ID for context */
  courseId?: string;
  /** Chapter ID for context */
  chapterId?: string;
  /** Default active tab */
  defaultTab?: 'overview' | 'daily' | 'reviews' | 'memory';
  /** Callback when a review is completed */
  onReviewComplete?: (conceptId: string, score: number) => void;
  /** Callback when memory insight is selected */
  onInsightSelect?: (insight: unknown) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TAB_CONFIG = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Sun,
    description: 'Daily focus & quick actions',
  },
  {
    id: 'daily',
    label: 'Today',
    icon: Calendar,
    description: 'Daily study plan',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    icon: RotateCcw,
    description: 'Spaced repetition',
  },
  {
    id: 'memory',
    label: 'Memory',
    icon: Brain,
    description: 'Insights & history',
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
  icon: typeof Target;
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
        'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all text-left w-full',
        'hover:shadow-md hover:border-primary/30 active:scale-[0.98]',
        color
      )}
    >
      <div className="p-1.5 sm:p-2 rounded-full bg-background/50 flex-shrink-0">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</div>
        <div className="font-semibold text-xs sm:text-sm truncate">{value}</div>
      </div>
      {trend && (
        <div
          className={cn(
            'text-[10px] sm:text-xs flex-shrink-0',
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
  icon: typeof Target;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border transition-all text-left w-full',
        'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
        color
      )}
    >
      <div className="p-1.5 sm:p-2 rounded-lg bg-background/50 flex-shrink-0">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs sm:text-sm">{title}</div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 sm:mt-1 flex-shrink-0" />
    </button>
  );
}

function OverviewTab({
  onNavigate,
  courseId,
}: {
  onNavigate: (tab: string) => void;
  courseId?: string;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Daily Plan Quick View */}
      <div>
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
          <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Today&apos;s Focus
        </h3>
        <DailyPlanWidget compact />
      </div>

      {/* Quick Metrics Grid */}
      <div>
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
          <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Quick Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <QuickMetricCard
            icon={Target}
            label="Active Goals"
            value="View"
            color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
            onClick={() => onNavigate('goals')}
          />
          <QuickMetricCard
            icon={Calendar}
            label="Daily Plan"
            value="Start"
            color="bg-green-50 dark:bg-green-950/30 text-green-600"
            onClick={() => onNavigate('daily')}
          />
          <QuickMetricCard
            icon={RotateCcw}
            label="Reviews Due"
            value="Check"
            trend="up"
            color="bg-orange-50 dark:bg-orange-950/30 text-orange-600"
            onClick={() => onNavigate('reviews')}
          />
          <QuickMetricCard
            icon={Brain}
            label="Memory"
            value="Insights"
            color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
            onClick={() => onNavigate('memory')}
          />
        </div>
      </div>

      {/* Quick Access Panels */}
      <div>
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Quick Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <QuickAccessCard
            icon={Target}
            title="Goal Planner"
            description="Create and manage your learning goals"
            color="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30"
            onClick={() => onNavigate('goals')}
          />
          <QuickAccessCard
            icon={RotateCcw}
            title="Spaced Repetition"
            description="Review concepts for optimal retention"
            color="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
            onClick={() => onNavigate('reviews')}
          />
          <QuickAccessCard
            icon={History}
            title="Check-in History"
            description="View your learning journey and check-ins"
            color="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
            onClick={() => onNavigate('memory')}
          />
          <QuickAccessCard
            icon={Lightbulb}
            title="Memory Insights"
            description="Contextual insights from your learning"
            color="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
            onClick={() => onNavigate('memory')}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" onClick={() => onNavigate('goals')}>
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          New Goal
        </Button>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" onClick={() => onNavigate('reviews')}>
          <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          Start Review
        </Button>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3" onClick={() => onNavigate('daily')}>
          <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
          Study Now
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyPlanningHub({
  className,
  compact = false,
  courseId,
  chapterId,
  defaultTab = 'overview',
  onReviewComplete,
  onInsightSelect,
}: StudyPlanningHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleNavigate = useCallback((tab: string) => {
    setActiveTab(tab as typeof activeTab);
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-lg font-semibold text-slate-900 dark:text-white truncate">Study Planning &amp; Memory Hub</CardTitle>
              <CardDescription className="text-[11px] sm:text-sm hidden xs:block">
                Goals, daily plans, spaced repetition, and memory insights
              </CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh all data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-3 sm:px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4 mb-3 sm:mb-4 h-9 sm:h-10">
            {TAB_CONFIG.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs px-1 sm:px-2"
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline truncate">{tab.label}</span>
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
                <OverviewTab onNavigate={handleNavigate} courseId={courseId} />
              </TabsContent>

              {/* Daily Tab */}
              <TabsContent value="daily" className="mt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium">Today&apos;s Study Plan</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Your daily learning schedule and progress
                      </p>
                    </div>
                  </div>
                  <DailyPlanWidget
                    dailyGoalMinutes={60}
                    onStepComplete={async (planId, stepId) => {
                      console.log('Step completed:', planId, stepId);
                    }}
                    onStepStart={async (planId, stepId) => {
                      console.log('Step started:', planId, stepId);
                    }}
                  />
                </div>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium">Spaced Repetition Reviews</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Optimize memory retention with scheduled reviews
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                          <Expand className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Expand
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Spaced Repetition Calendar</DialogTitle>
                          <DialogDescription>
                            Full calendar view with review scheduling
                          </DialogDescription>
                        </DialogHeader>
                        <SpacedRepetitionCalendar
                          showStats
                          showCalendar
                          showReviewList
                          onReviewComplete={onReviewComplete}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <SpacedRepetitionCalendar
                    compact={compact}
                    showStats
                    showReviewList
                    maxReviews={5}
                    onReviewComplete={onReviewComplete}
                  />
                </div>
              </TabsContent>

              {/* Memory Tab */}
              <TabsContent value="memory" className="mt-0">
                <div className="space-y-4 sm:space-y-6">
                  {/* Memory Insights */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-base font-medium">Memory Insights</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                            <Expand className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Expand
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Memory Insights</DialogTitle>
                            <DialogDescription>
                              Detailed view of your learning memory and context
                            </DialogDescription>
                          </DialogHeader>
                          <MemoryInsightsWidget
                            courseId={courseId}
                            maxInsights={20}
                            showRefresh
                            onInsightSelect={onInsightSelect}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <MemoryInsightsWidget
                      compact={compact}
                      courseId={courseId}
                      maxInsights={5}
                      showRefresh
                      onInsightSelect={onInsightSelect}
                    />
                  </div>

                  {/* Check-in History */}
                  <div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-base font-medium">Check-in History</h3>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                            <Expand className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Expand
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Check-in History</DialogTitle>
                            <DialogDescription>
                              Your complete check-in and emotional journey
                            </DialogDescription>
                          </DialogHeader>
                          <CheckInHistory limit={50} showFilters />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CheckInHistory
                      limit={compact ? 3 : 5}
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

export default StudyPlanningHub;
