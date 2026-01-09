'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  Circle,
  AlertCircle,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Code,
  Users,
  Target,
  MessageSquare,
  GraduationCap,
  MoreHorizontal,
  ArrowRight,
  Plus,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LearningActivity, ActivityStatus, ActivityType } from './types';

interface TodayScheduleProps {
  activities: LearningActivity[];
  onActivityClick?: (activity: LearningActivity) => void;
  onAddActivity?: () => void;
}

const activityTypeConfig: Record<ActivityType, { icon: React.ElementType; color: string; bgColor: string }> = {
  STUDY_SESSION: { icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  VIDEO_LESSON: { icon: Video, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  READING: { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  QUIZ: { icon: HelpCircle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ASSIGNMENT: { icon: FileText, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
  PROJECT: { icon: Code, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  PRACTICE: { icon: Code, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  LIVE_CLASS: { icon: Users, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  DISCUSSION: { icon: MessageSquare, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  REVIEW: { icon: BookOpen, color: 'text-teal-500', bgColor: 'bg-teal-500/10' },
  EXAM: { icon: GraduationCap, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  GOAL_MILESTONE: { icon: Target, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
};

const statusConfig: Record<ActivityStatus, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
  COMPLETED: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Completed', bgColor: 'bg-emerald-500/10' },
  IN_PROGRESS: { icon: PlayCircle, color: 'text-blue-500', label: 'In Progress', bgColor: 'bg-blue-500/10' },
  NOT_STARTED: { icon: Circle, color: 'text-slate-400', label: 'Not Started', bgColor: 'bg-slate-500/10' },
  OVERDUE: { icon: AlertCircle, color: 'text-red-500', label: 'Overdue', bgColor: 'bg-red-500/10' },
  SKIPPED: { icon: Circle, color: 'text-slate-300', label: 'Skipped', bgColor: 'bg-slate-500/10' },
  RESCHEDULED: { icon: Clock, color: 'text-amber-500', label: 'Rescheduled', bgColor: 'bg-amber-500/10' },
};

function ActivityCard({
  activity,
  index,
  onClick,
}: {
  activity: LearningActivity;
  index: number;
  onClick?: () => void;
}) {
  const typeConfig = activityTypeConfig[activity.type];
  const StatusIcon = statusConfig[activity.status].icon;
  const TypeIcon = typeConfig.icon;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getActionButton = () => {
    switch (activity.status) {
      case 'COMPLETED':
        return (
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
            View Notes
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Resume <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        );
      case 'NOT_STARTED':
        return (
          <Button variant="outline" size="sm">
            Start <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        );
      case 'OVERDUE':
        return (
          <Button variant="destructive" size="sm">
            Start Now
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <div
        className={`relative flex gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
          activity.status === 'COMPLETED'
            ? 'border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20'
            : activity.status === 'IN_PROGRESS'
              ? 'border-blue-200/50 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20'
              : activity.status === 'OVERDUE'
                ? 'border-red-200/50 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20'
                : 'border-slate-200/50 bg-white/50 dark:border-slate-700/50 dark:bg-slate-800/50'
        }`}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        {/* Time Column */}
        <div className="flex w-20 flex-shrink-0 flex-col items-center">
          <div className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Clock className="h-3 w-3" />
            {activity.startTime}
          </div>
          {activity.endTime && (
            <div className="text-xs text-slate-400">to {activity.endTime}</div>
          )}
          <div className="mt-1 text-xs text-slate-400">
            {formatDuration(activity.estimatedDuration)}
          </div>
        </div>

        {/* Divider Line */}
        <div className="relative flex flex-col items-center">
          <div className={`h-4 w-4 rounded-full ${typeConfig.bgColor} flex items-center justify-center`}>
            <TypeIcon className={`h-2.5 w-2.5 ${typeConfig.color}`} />
          </div>
          <div className={`flex-1 w-0.5 ${
            activity.status === 'COMPLETED'
              ? 'bg-emerald-300 dark:bg-emerald-700'
              : 'bg-slate-200 dark:bg-slate-700'
          }`} />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-slate-900 dark:text-white">
                  {activity.title}
                </h4>
                <Badge
                  variant="secondary"
                  className={`${statusConfig[activity.status].bgColor} ${statusConfig[activity.status].color} text-xs`}
                >
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig[activity.status].label}
                </Badge>
              </div>
              {activity.courseName && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {activity.courseName}
                  {activity.chapterName && ` • ${activity.chapterName}`}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  suppressHydrationWarning
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                <DropdownMenuItem>Skip</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress Bar for In Progress items */}
          {activity.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-2">
              <Progress value={activity.progress} className="h-2 flex-1" />
              <span className="text-xs font-medium text-blue-600">{activity.progress}%</span>
            </div>
          )}

          {/* Tags and Action */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {activity.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-slate-500"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {getActionButton()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TodaySchedule({ activities, onActivityClick, onAddActivity }: TodayScheduleProps) {
  // Sort activities by start time
  const sortedActivities = [...activities].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return a.startTime.localeCompare(b.startTime);
  });

  const completedCount = activities.filter((a) => a.status === 'COMPLETED').length;
  const totalMinutes = activities.reduce((sum, a) => sum + a.estimatedDuration, 0);
  const completedMinutes = activities
    .filter((a) => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.actualDuration || a.estimatedDuration), 0);

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-500" />
            Today&apos;s Schedule
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {completedCount}/{activities.length}
              </span>{' '}
              completed
            </div>
            <Button variant="outline" size="sm" onClick={onAddActivity}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Progress summary */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">
              {Math.round(completedMinutes / 60 * 10) / 10}h done
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-slate-600 dark:text-slate-400">
              {Math.round((totalMinutes - completedMinutes) / 60 * 10) / 10}h remaining
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {sortedActivities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <Calendar className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                No activities scheduled for today
              </p>
              <Button variant="outline" className="mt-4" onClick={onAddActivity}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule a session
              </Button>
            </motion.div>
          ) : (
            sortedActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                onClick={() => onActivityClick?.(activity)}
              />
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
