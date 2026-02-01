'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Brain,
  TrendingUp,
  Trophy,
  Clock,
  Target,
  RefreshCw,
  Filter,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  Sparkles,
  BarChart3,
  Zap,
  Flame,
  Calendar,
  GraduationCap,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CourseInsightCard, CourseInsightData } from './CourseInsightCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface CourseInsightsProps {
  className?: string;
  initialCourses?: CourseInsightData[];
  compact?: boolean;
  maxCourses?: number;
  showHeader?: boolean;
  showFilters?: boolean;
  showOverview?: boolean;
}

type SortOption = 'recent' | 'progress' | 'mastery' | 'engagement' | 'name';
type FilterOption = 'all' | 'in-progress' | 'completed' | 'not-started' | 'at-risk';
type ViewMode = 'grid' | 'list';

interface OverviewMetric {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color: string;
}



export function CourseInsights({
  className,
  initialCourses,
  compact = false,
  maxCourses,
  showHeader = true,
  showFilters = true,
  showOverview = true,
}: CourseInsightsProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseInsightData[]>(initialCourses || []);
  const [isLoading, setIsLoading] = useState(!initialCourses);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch courses on mount
  useEffect(() => {
    if (!initialCourses) {
      const fetchCourses = async () => {
        setIsLoading(true);
        try {
          // Try to fetch from API
          const response = await fetch('/api/sam/course-insights');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setCourses(data.data);
              setLoadError(null);
            } else {
              setCourses([]);
              setLoadError('No course insights available yet.');
            }
          } else {
            setCourses([]);
            setLoadError('Failed to load course insights.');
          }
        } catch {
          setCourses([]);
          setLoadError('Failed to load course insights.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchCourses();
    }
  }, [initialCourses]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/sam/course-insights');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCourses(data.data);
          setLoadError(null);
        }
      }
    } catch {
      setLoadError('Failed to refresh course insights.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'in-progress':
        result = result.filter((c) => c.progress > 0 && c.progress < 100);
        break;
      case 'completed':
        result = result.filter((c) => c.progress >= 100);
        break;
      case 'not-started':
        result = result.filter((c) => c.progress === 0);
        break;
      case 'at-risk':
        result = result.filter((c) => c.engagementScore < 50 || c.learningVelocity < 1);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => {
          const aDate = a.lastStudied ? new Date(a.lastStudied).getTime() : 0;
          const bDate = b.lastStudied ? new Date(b.lastStudied).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case 'progress':
        result.sort((a, b) => b.progress - a.progress);
        break;
      case 'mastery':
        result.sort((a, b) => b.masteryLevel - a.masteryLevel);
        break;
      case 'engagement':
        result.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    // Apply limit
    if (maxCourses) {
      result = result.slice(0, maxCourses);
    }

    return result;
  }, [courses, searchQuery, filterBy, sortBy, maxCourses]);

  // Calculate overview metrics
  const overviewMetrics: OverviewMetric[] = useMemo(() => {
    if (courses.length === 0) return [];

    const totalStudyTime = courses.reduce((sum, c) => sum + c.studyTimeMinutes, 0);
    const avgMastery = Math.round(courses.reduce((sum, c) => sum + c.masteryLevel, 0) / courses.length);
    const avgEngagement = Math.round(courses.reduce((sum, c) => sum + c.engagementScore, 0) / courses.length);
    const totalCompleted = courses.filter((c) => c.progress >= 100).length;
    const atRiskCourses = courses.filter((c) => c.engagementScore < 50).length;
    const currentStreak = Math.max(...courses.map((c) => c.currentStreak));

    const formatTime = (minutes: number): string => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      return hours >= 24 ? `${Math.round(hours / 24)}d` : `${hours}h`;
    };

    return [
      {
        icon: BookOpen,
        label: 'Active Courses',
        value: courses.filter((c) => c.progress > 0 && c.progress < 100).length,
        change: `${courses.length} total`,
        changeType: 'neutral',
        color: 'bg-blue-500',
      },
      {
        icon: Clock,
        label: 'Total Study Time',
        value: formatTime(totalStudyTime),
        change: 'all time',
        changeType: 'neutral',
        color: 'bg-emerald-500',
      },
      {
        icon: Brain,
        label: 'Avg Mastery',
        value: `${avgMastery}%`,
        change: avgMastery >= 70 ? 'On track' : 'Needs focus',
        changeType: avgMastery >= 70 ? 'positive' : 'negative',
        color: 'bg-purple-500',
      },
      {
        icon: Zap,
        label: 'Avg Engagement',
        value: `${avgEngagement}%`,
        change: avgEngagement >= 70 ? 'Strong' : 'Declining',
        changeType: avgEngagement >= 70 ? 'positive' : 'negative',
        color: 'bg-amber-500',
      },
      {
        icon: Trophy,
        label: 'Completed',
        value: totalCompleted,
        change: `of ${courses.length}`,
        changeType: 'positive',
        color: 'bg-indigo-500',
      },
      {
        icon: Flame,
        label: 'Best Streak',
        value: `${currentStreak}d`,
        change: currentStreak >= 7 ? 'Great!' : 'Keep going',
        changeType: currentStreak >= 7 ? 'positive' : 'neutral',
        color: 'bg-orange-500',
      },
    ];
  }, [courses]);

  // Get high-priority insights across all courses
  const priorityInsights = useMemo(() => {
    return courses
      .flatMap((c) =>
        c.insights
          .filter((i) => i.priority === 'high')
          .map((i) => ({ ...i, courseName: c.title, courseId: c.id }))
      )
      .slice(0, 3);
  }, [courses]);

  if (compact) {
    return (
      <Card className={cn('border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Course Insights
            </span>
            <Badge variant="secondary" className="font-normal">
              {courses.length} courses
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="h-16 w-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.slice(0, 3).map((course) => (
                <CourseInsightCard
                  key={course.id}
                  course={course}
                  compact
                  onContinue={() => router.push(`/courses/${course.id}/learn`)}
                />
              ))}
              {courses.length > 3 && (
                <Link href="/dashboard/insights">
                  <Button variant="ghost" className="w-full gap-2 text-sm">
                    View All {courses.length} Courses
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-6 w-6 text-indigo-500" />
              Course Insights
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              AI-powered analysis of your learning progress and personalized recommendations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      )}

      {/* Overview Metrics */}
      {showOverview && !isLoading && overviewMetrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {overviewMetrics.map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/80"
            >
              <div className={cn('mb-2 inline-flex rounded-lg p-2', metric.color)}>
                <metric.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
              {metric.change && (
                <p
                  className={cn(
                    'mt-0.5 text-xs',
                    metric.changeType === 'positive' && 'text-emerald-600',
                    metric.changeType === 'negative' && 'text-red-500',
                    metric.changeType === 'neutral' && 'text-slate-500'
                  )}
                >
                  {metric.change}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Priority Insights Banner */}
      {priorityInsights.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                  Action Required
                </h3>
                <div className="mt-2 space-y-2">
                  {priorityInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-amber-700 dark:text-amber-400">
                        <span className="font-medium">{insight.courseName}:</span> {insight.title}
                      </span>
                      {insight.actionable && insight.action && (
                        <Link href={insight.action.href}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            {insight.action.label}
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterBy} onValueChange={(v) => setFilterBy(v as FilterOption)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
                <SelectItem value="at-risk">At Risk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="mastery">Mastery</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-slate-50 p-1 dark:bg-slate-800">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCourses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              No courses found
            </h3>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
              {loadError
                ? loadError
                : searchQuery || filterBy !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start learning by enrolling in a course'}
            </p>
            <Link href="/courses">
              <Button className="mt-4 gap-2">
                <GraduationCap className="h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Course Grid/List */}
      {!isLoading && filteredCourses.length > 0 && (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2'
              : 'space-y-4'
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                layout
              >
                <CourseInsightCard
                  course={course}
                  onContinue={() => router.push(`/courses/${course.id}/learn`)}
                  onViewDetails={() => router.push(`/courses/${course.id}/insights`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Load More */}
      {!isLoading && filteredCourses.length > 0 && maxCourses && courses.length > maxCourses && (
        <div className="flex justify-center">
          <Link href="/dashboard/insights">
            <Button variant="outline" className="gap-2">
              View All Courses
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
