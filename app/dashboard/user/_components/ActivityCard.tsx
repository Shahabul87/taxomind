"use client";

import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  BookOpen,
  FileText,
  Video,
  MessageSquare,
  Award,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

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

interface ActivityCardProps {
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
  points?: number;
  priority: Priority;
  estimatedMinutes?: number;
  actualMinutes?: number;
  tags?: string[];
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  viewMode?: "grid" | "list";
}

const activityIcons: Record<ActivityType, React.ElementType> = {
  ASSIGNMENT: FileText,
  QUIZ: BookOpen,
  EXAM: Award,
  READING: BookOpen,
  VIDEO: Video,
  DISCUSSION: MessageSquare,
  STUDY_SESSION: Calendar,
  PROJECT: FileText,
  PRESENTATION: FileText,
  CUSTOM: Circle,
};

const activityColors: Record<ActivityType, string> = {
  ASSIGNMENT: "from-blue-500 to-indigo-500",
  QUIZ: "from-purple-500 to-pink-500",
  EXAM: "from-red-500 to-orange-500",
  READING: "from-emerald-500 to-teal-500",
  VIDEO: "from-cyan-500 to-blue-500",
  DISCUSSION: "from-violet-500 to-purple-500",
  STUDY_SESSION: "from-indigo-500 to-blue-500",
  PROJECT: "from-orange-500 to-amber-500",
  PRESENTATION: "from-pink-500 to-rose-500",
  CUSTOM: "from-slate-500 to-slate-600",
};

const statusColors: Record<ActivityStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  IN_PROGRESS: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  SUBMITTED: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  GRADED: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  OVERDUE: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
};

const priorityColors: Record<Priority, string> = {
  LOW: "bg-slate-200 dark:bg-slate-700",
  MEDIUM: "bg-blue-200 dark:bg-blue-700",
  HIGH: "bg-orange-200 dark:bg-orange-700",
  URGENT: "bg-red-200 dark:bg-red-700",
};

const priorityDots: Record<Priority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export function ActivityCard({
  id,
  type,
  title,
  description,
  course,
  dueDate,
  completedAt,
  status,
  points,
  priority,
  estimatedMinutes,
  actualMinutes,
  tags = [],
  onViewDetails,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleFavorite,
  isFavorite = false,
  viewMode = "list",
}: ActivityCardProps) {
  const Icon = activityIcons[type];
  const isCompleted = status === "SUBMITTED" || status === "GRADED";
  const isOverdue = status === "OVERDUE";

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (isOverdue) return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <Circle className="h-5 w-5 text-slate-400" />;
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 0) return "Overdue";
    if (diffHours < 24) return `Due in ${diffHours}h`;
    if (diffDays < 7) return `Due in ${diffDays}d`;
    return `Due ${format(date, "MMM d")}`;
  };

  // Grid view card
  if (viewMode === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "group relative overflow-hidden",
          "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
          "border border-slate-200/50 dark:border-slate-700/50",
          "rounded-2xl shadow-lg hover:shadow-xl",
          "transition-all duration-300 cursor-pointer"
        )}
        onClick={() => onViewDetails?.(id)}
      >
        {/* Top color bar */}
        <div className={cn("h-2 bg-gradient-to-r", activityColors[type])} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn("p-2 rounded-lg bg-gradient-to-r", activityColors[type])}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {title}
                </h3>
                {course && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {course.title}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails?.(id); }}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(id); }}>
                  <Star className={cn("h-4 w-4 mr-2", isFavorite && "fill-yellow-500 text-yellow-500")} />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            {/* Status and Due Date */}
            <div className="flex items-center justify-between">
              <Badge className={cn("text-xs", statusColors[status])}>
                {status.replace("_", " ")}
              </Badge>
              {dueDate && (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDueDate(dueDate)}</span>
                </div>
              )}
            </div>

            {/* Points and Priority */}
            <div className="flex items-center justify-between">
              {points !== undefined && (
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {points} pts
                  </span>
                </div>
              )}
              <div className="flex gap-0.5">
                {[...Array(priorityDots[priority])].map((_, i) => (
                  <div key={i} className={cn("h-1.5 w-1.5 rounded-full", priorityColors[priority])} />
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-2 py-0">
                    {tag}
                  </Badge>
                ))}
                {tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    +{tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // List view card
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden",
        "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
        "border border-slate-200/50 dark:border-slate-700/50",
        "rounded-xl shadow-md hover:shadow-lg",
        "transition-all duration-300 cursor-pointer"
      )}
      onClick={() => onViewDetails?.(id)}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Left: Status Indicator */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(id);
            }}
            className="transition-transform hover:scale-110"
          >
            {getStatusIcon()}
          </button>
        </div>

        {/* Icon */}
        <div className={cn("flex-shrink-0 p-2 rounded-lg bg-gradient-to-r", activityColors[type])}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {title}
            </h3>
            {isFavorite && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {course && (
              <>
                <span className="truncate">{course.title}</span>
                <span>•</span>
              </>
            )}
            {dueDate && <span>{formatDueDate(dueDate)}</span>}
            {points !== undefined && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-500" />
                  {points} pts
                </span>
              </>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Right: Status and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge className={cn("text-xs", statusColors[status])}>
            {status.replace("_", " ")}
          </Badge>

          <div className="flex gap-0.5">
            {[...Array(priorityDots[priority])].map((_, i) => (
              <div key={i} className={cn("h-1.5 w-1.5 rounded-full", priorityColors[priority])} />
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails?.(id); }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(id); }}>
                <Star className={cn("h-4 w-4 mr-2", isFavorite && "fill-yellow-500 text-yellow-500")} />
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(id); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(id); }} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bar for in-progress items */}
      {status === "IN_PROGRESS" && estimatedMinutes && actualMinutes !== undefined && (
        <div className="px-4 pb-3">
          <Progress
            value={(actualMinutes / estimatedMinutes) * 100}
            className="h-1.5"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {actualMinutes} / {estimatedMinutes} minutes
          </p>
        </div>
      )}
    </motion.div>
  );
}
