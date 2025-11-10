"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isYesterday, isPast, isFuture, startOfDay } from "date-fns";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityCard } from "./ActivityCard";

type ActivityType =
  | "ASSIGNMENT"
  | "QUIZ"
  | "EXAM"
  | "READING"
  | "VIDEO"
  | "DISCUSSION"
  | "STUDY_SESSION"
  | "PROJECT"
  | "PRESENTATION"
  | "CUSTOM";

type ActivityStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "OVERDUE"
  | "CANCELLED";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  course?: {
    id: string;
    title: string;
    description?: string;
  };
  dueDate?: Date;
  completedAt?: Date;
  status: ActivityStatus;
  points: number;
  priority: Priority;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags: string[];
  googleEventId?: string;
  calendarSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ActivityStreamProps {
  activities: Activity[];
  viewMode: "grid" | "list";
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  selectedDate?: Date;
}

interface GroupedActivities {
  date: Date;
  label: string;
  activities: Activity[];
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function ActivityStream({
  activities,
  viewMode,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleFavorite,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  selectedDate = new Date(),
}: ActivityStreamProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Handle load more
  const handleLoadMore = React.useCallback(async () => {
    if (!onLoadMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, isLoadingMore]);

  // Group activities by date
  const groupedActivities = React.useMemo(() => {
    const groups = new Map<string, GroupedActivities>();

    activities.forEach((activity) => {
      if (!activity.dueDate) return;

      const dateKey = format(startOfDay(activity.dueDate), "yyyy-MM-dd");

      if (!groups.has(dateKey)) {
        const activityDate = startOfDay(activity.dueDate);
        const label = getDateLabel(activity.dueDate);

        groups.set(dateKey, {
          date: activityDate,
          label,
          activities: [],
          isPast: isPast(activityDate) && !isToday(activityDate),
          isToday: isToday(activityDate),
          isFuture: isFuture(activityDate) && !isToday(activityDate),
        });
      }

      groups.get(dateKey)!.activities.push(activity);
    });

    // Sort groups by date
    return Array.from(groups.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [activities]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoadingMore, isLoading, handleLoadMore]);

  function getDateLabel(date: Date): string {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";

    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0 && diffDays <= 7) {
      return format(date, "EEEE"); // Weekday name
    }

    return format(date, "MMMM d, yyyy");
  }

  const getDateLabelColor = (group: GroupedActivities) => {
    if (group.isToday) return "from-blue-500 to-indigo-500";
    if (group.isPast) return "from-slate-400 to-slate-500";
    if (group.isFuture) return "from-emerald-500 to-teal-500";
    return "from-slate-500 to-slate-600";
  };

  if (activities.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full mb-6">
          <CalendarIcon className="h-16 w-16 text-blue-500/50" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No activities yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Start adding activities to your dashboard using the quick create menu above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grouped Activities */}
      <AnimatePresence mode="popLayout">
        {groupedActivities.map((group, groupIndex) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
          >
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl",
                  "bg-gradient-to-r text-white shadow-md",
                  getDateLabelColor(group)
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="font-semibold text-sm">{group.label}</span>
                <span className="text-xs opacity-80">
                  ({group.activities.length})
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700" />
            </div>

            {/* Activities Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ActivityCard
                      {...activity}
                      viewMode="grid"
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleComplete={onToggleComplete}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {group.activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ActivityCard
                      {...activity}
                      viewMode="list"
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleComplete={onToggleComplete}
                      onToggleFavorite={onToggleFavorite}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Loading More Indicator */}
      {(isLoadingMore || isLoading) && (
        <div className="flex items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading activities...</span>
          </motion.div>
        </div>
      )}

      {/* Infinite Scroll Observer Target */}
      {hasMore && <div ref={observerTarget} className="h-4" />}

      {/* End of List Message */}
      {!hasMore && activities.length > 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              You&apos;re all caught up!
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Export CheckCircle2 for the end of list message
import { CheckCircle2 } from "lucide-react";
