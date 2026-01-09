'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
  FileText,
  Target,
  Diamond,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  LearningGanttItem,
  GanttViewConfig,
  PlannedVsAccomplished,
  GanttCourseInfo,
  GanttMilestone,
} from './types';

interface LearningGanttProps {
  items: LearningGanttItem[];
  summary: PlannedVsAccomplished;
  courses: GanttCourseInfo[];
  onItemClick?: (item: LearningGanttItem) => void;
  onViewDetails?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  COURSE: BookOpen,
  CHAPTER: FileText,
  LESSON: GraduationCap,
  STUDY_PLAN: Calendar,
  GOAL: Target,
  MILESTONE: Diamond,
};

const STATUS_CONFIG = {
  NOT_STARTED: { color: 'bg-slate-300 dark:bg-slate-600', label: 'Not Started' },
  ON_TRACK: { color: 'bg-indigo-500', label: 'On Track' },
  AHEAD: { color: 'bg-emerald-500', label: 'Ahead' },
  BEHIND: { color: 'bg-amber-500', label: 'Behind' },
  COMPLETED: { color: 'bg-emerald-500', label: 'Completed' },
  OVERDUE: { color: 'bg-red-500', label: 'Overdue' },
};

export function LearningGantt({
  items,
  summary,
  courses,
  onItemClick,
  onViewDetails,
}: LearningGanttProps) {
  const [viewConfig, setViewConfig] = useState<GanttViewConfig>({
    view: 'week',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    showPlanned: true,
    showActual: true,
    showMilestones: true,
    groupBy: 'course',
    expandAll: true,
  });

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCourse, setSelectedCourse] = useState<string>('all');

  // Generate date columns based on view
  const dateColumns = useMemo(() => {
    const columns: { date: Date; label: string; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = viewConfig.view === 'week' ? 7 : viewConfig.view === 'month' ? 30 : 14;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - Math.floor(days / 3));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isToday = date.toDateString() === today.toDateString();

      columns.push({
        date,
        label:
          viewConfig.view === 'week'
            ? date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
            : date.getDate().toString(),
        isToday,
      });
    }

    return columns;
  }, [viewConfig.view]);

  // Filter items by course
  const filteredItems = useMemo(() => {
    if (selectedCourse === 'all') return items;
    return items.filter(
      (item) => item.courseId === selectedCourse || item.type === 'GOAL'
    );
  }, [items, selectedCourse]);

  // Toggle item expansion
  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Expand/Collapse all
  const toggleAllExpanded = useCallback(() => {
    if (expandedItems.size > 0) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set(items.map((item) => item.id)));
    }
  }, [items, expandedItems.size]);

  // Calculate bar position and width for an item
  const getBarStyle = useCallback(
    (item: LearningGanttItem, type: 'planned' | 'actual') => {
      const start = type === 'planned' ? item.plannedStart : item.actualStart;
      const end = type === 'planned' ? item.plannedEnd : item.actualEnd;

      if (!start || !end) return null;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const columnWidth = 100 / dateColumns.length;

      // Find start and end positions
      let startIdx = -1;
      let endIdx = -1;

      dateColumns.forEach((col, idx) => {
        const colDate = new Date(col.date);
        colDate.setHours(0, 0, 0, 0);
        const checkStart = new Date(startDate);
        checkStart.setHours(0, 0, 0, 0);
        const checkEnd = new Date(endDate);
        checkEnd.setHours(0, 0, 0, 0);

        if (colDate.getTime() === checkStart.getTime()) startIdx = idx;
        if (colDate.getTime() === checkEnd.getTime()) endIdx = idx;
      });

      // If dates are outside visible range
      if (startIdx === -1 && endIdx === -1) return null;
      if (startIdx === -1) startIdx = 0;
      if (endIdx === -1) endIdx = dateColumns.length - 1;

      const left = startIdx * columnWidth;
      const width = (endIdx - startIdx + 1) * columnWidth;

      return { left: `${left}%`, width: `${width}%` };
    },
    [dateColumns]
  );

  // Get milestone position
  const getMilestonePosition = useCallback(
    (milestone: GanttMilestone) => {
      const milestoneDate = new Date(milestone.date);
      milestoneDate.setHours(0, 0, 0, 0);

      const columnWidth = 100 / dateColumns.length;

      const idx = dateColumns.findIndex((col) => {
        const colDate = new Date(col.date);
        colDate.setHours(0, 0, 0, 0);
        return colDate.getTime() === milestoneDate.getTime();
      });

      if (idx === -1) return null;

      return `${idx * columnWidth + columnWidth / 2}%`;
    },
    [dateColumns]
  );

  // Render a single Gantt row
  const renderGanttRow = (item: LearningGanttItem, depth: number = 0) => {
    const Icon = ICON_MAP[item.type] || BookOpen;
    const statusConfig = STATUS_CONFIG[item.status];
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const plannedStyle = getBarStyle(item, 'planned');
    const actualStyle = getBarStyle(item, 'actual');

    return (
      <React.Fragment key={item.id}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="group flex border-b border-slate-200 dark:border-slate-700"
        >
          {/* Left side: Item info */}
          <div
            className="flex w-64 flex-shrink-0 items-center gap-2 border-r border-slate-200 px-3 py-2 dark:border-slate-700"
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(item.id)}
                className="rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}

            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />

            <Icon className="h-4 w-4 text-slate-500" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onItemClick?.(item)}
                  className="truncate text-left text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
                >
                  {item.title}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-slate-500">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="secondary"
                      className={`${statusConfig.color} text-white`}
                    >
                      {statusConfig.label}
                    </Badge>
                    <span className="text-slate-500">
                      {item.actualProgress}% complete
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right side: Gantt bars */}
          <div className="relative flex-1">
            {/* Date columns grid */}
            <div className="absolute inset-0 flex">
              {dateColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex-1 border-r border-slate-100 dark:border-slate-800 ${
                    col.isToday ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* Bars container */}
            <div className="relative h-full py-1">
              {/* Planned bar */}
              {viewConfig.showPlanned && plannedStyle && (
                <div
                  className="absolute top-1 h-3 rounded-full bg-slate-300/60 dark:bg-slate-600/60"
                  style={plannedStyle}
                />
              )}

              {/* Actual bar */}
              {viewConfig.showActual && actualStyle && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: actualStyle.width }}
                  transition={{ duration: 0.5 }}
                  className={`absolute bottom-1 h-3 rounded-full ${statusConfig.color}`}
                  style={{ left: actualStyle.left }}
                />
              )}

              {/* Milestones */}
              {viewConfig.showMilestones &&
                item.milestones.map((milestone) => {
                  const position = getMilestonePosition(milestone);
                  if (!position) return null;

                  return (
                    <Tooltip key={milestone.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: position }}
                        >
                          <Diamond
                            className={`h-4 w-4 ${
                              milestone.completed
                                ? 'fill-emerald-500 text-emerald-500'
                                : 'fill-amber-500 text-amber-500'
                            }`}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-slate-500">
                            {new Date(milestone.date).toLocaleDateString()}
                          </p>
                          <p
                            className={
                              milestone.completed
                                ? 'text-emerald-500'
                                : 'text-amber-500'
                            }
                          >
                            {milestone.completed ? 'Completed' : 'Pending'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex w-20 flex-shrink-0 items-center justify-center border-l border-slate-200 dark:border-slate-700">
            <span
              className={`text-xs font-medium ${
                item.actualProgress >= item.plannedProgress
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            >
              {item.actualProgress}%
            </span>
          </div>
        </motion.div>

        {/* Render children if expanded */}
        <AnimatePresence>
          {isExpanded &&
            hasChildren &&
            item.children?.map((child) => renderGanttRow(child, depth + 1))}
        </AnimatePresence>
      </React.Fragment>
    );
  };

  return (
    <TooltipProvider>
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Learning Journey
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* Course Filter */}
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-8 w-[180px]">
                  <Filter className="mr-2 h-3 w-3" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        {course.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                {(['week', 'month'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() =>
                      setViewConfig((prev) => ({ ...prev, view }))
                    }
                    className={`rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors ${
                      viewConfig.view === view
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllExpanded}
                className="h-8 w-8 p-0"
              >
                {expandedItems.size > 0 ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {onViewDetails && (
                <Button variant="ghost" size="sm" onClick={onViewDetails}>
                  Full View
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700">
              <Clock className="mr-1 h-3 w-3" />
              {summary.planned.totalHours}h planned
            </Badge>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            >
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {summary.accomplished.totalHours}h completed
            </Badge>
            <Badge
              variant="secondary"
              className={
                summary.variance.hours >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }
            >
              {summary.variance.hours >= 0 ? (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              ) : (
                <AlertTriangle className="mr-1 h-3 w-3" />
              )}
              {summary.variance.hours >= 0 ? '+' : ''}
              {summary.variance.hours}h {summary.variance.status.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Legend */}
          <div className="flex items-center justify-end gap-4 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-slate-300/60 dark:bg-slate-600/60" />
              <span className="text-xs text-slate-500">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-6 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-500">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <Diamond className="h-3 w-3 fill-amber-500 text-amber-500" />
              <span className="text-xs text-slate-500">Milestone</span>
            </div>
          </div>

          {/* Header row with dates */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <div className="w-64 flex-shrink-0 border-r border-slate-200 px-3 py-2 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500">
                Activity
              </span>
            </div>
            <div className="flex flex-1">
              {dateColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex-1 border-r border-slate-100 px-1 py-2 text-center dark:border-slate-800 ${
                    col.isToday
                      ? 'bg-indigo-50 font-medium text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                      : ''
                  }`}
                >
                  <span className="text-xs text-slate-500">{col.label}</span>
                </div>
              ))}
            </div>
            <div className="w-20 flex-shrink-0 border-l border-slate-200 px-2 py-2 text-center dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500">%</span>
            </div>
          </div>

          {/* Gantt rows */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => renderGanttRow(item, 0))
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No learning activities found
              </div>
            )}
          </div>

          {/* Footer with course summary */}
          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex flex-wrap gap-3">
              {courses.map((course) => (
                <Tooltip key={course.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {course.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {course.totalProgress}%
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-medium">{course.title}</p>
                      <p className="text-slate-500">
                        {course.completedHours}h / {course.totalHours}h completed
                      </p>
                      <p className="text-slate-500">
                        {course.chaptersCount} chapters, {course.lessonsCount}{' '}
                        lessons
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
