"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  Bell,
  Grid3x3,
  List,
  BookOpen,
  Clock,
  CheckSquare,
  Target,
  Sparkles,
  X,
  Check,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DashboardHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  unreadCount?: number;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: "done" | "missed" | "upcoming";
  time: string;
  actionUrl?: string;
}

export function DashboardHeader({
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<
    "all" | "done" | "missed" | "upcoming"
  >("all");

  // Quick action items
  const quickActions: QuickAction[] = [
    {
      icon: BookOpen,
      label: "Create Study Plan",
      description: "AI-powered learning schedule",
      gradient: "from-blue-500 to-indigo-500",
      onClick: () => {
        console.log("Create study plan");
        setIsQuickCreateOpen(false);
      },
    },
    {
      icon: Clock,
      label: "Schedule Session",
      description: "Sync with Google Calendar",
      gradient: "from-emerald-500 to-teal-500",
      onClick: () => {
        console.log("Schedule session");
        setIsQuickCreateOpen(false);
      },
    },
    {
      icon: CheckSquare,
      label: "Add Todo",
      description: "Quick task management",
      gradient: "from-purple-500 to-pink-500",
      onClick: () => {
        console.log("Add todo");
        setIsQuickCreateOpen(false);
      },
    },
    {
      icon: Target,
      label: "Set Goal",
      description: "Track your progress",
      gradient: "from-orange-500 to-red-500",
      onClick: () => {
        console.log("Set goal");
        setIsQuickCreateOpen(false);
      },
    },
    {
      icon: Sparkles,
      label: "AI Assistant",
      description: "Get personalized help",
      gradient: "from-violet-500 to-purple-500",
      onClick: () => {
        console.log("Open AI assistant");
        setIsQuickCreateOpen(false);
      },
    },
  ];

  // Mock notifications (will be replaced with real data)
  const mockNotifications: NotificationItem[] = [
    {
      id: "1",
      title: "Assignment Completed",
      description: "Great job on Chapter 5 Quiz!",
      category: "done",
      time: "2 hours ago",
      actionUrl: "/courses/1",
    },
    {
      id: "2",
      title: "Missed Deadline",
      description: "Project submission was due yesterday",
      category: "missed",
      time: "1 day ago",
      actionUrl: "/courses/2",
    },
    {
      id: "3",
      title: "Study Session Tomorrow",
      description: "Math review at 2:00 PM",
      category: "upcoming",
      time: "in 1 day",
      actionUrl: "/calendar",
    },
    {
      id: "4",
      title: "Quiz Due Soon",
      description: "Physics quiz due in 3 days",
      category: "upcoming",
      time: "in 3 days",
      actionUrl: "/courses/3",
    },
  ];

  const filteredNotifications =
    notificationTab === "all"
      ? mockNotifications
      : mockNotifications.filter((n) => n.category === notificationTab);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "done":
        return <Check className="h-4 w-4" />;
      case "missed":
        return <AlertCircle className="h-4 w-4" />;
      case "upcoming":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "done":
        return "bg-emerald-500";
      case "missed":
        return "bg-red-500";
      case "upcoming":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-16 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Today Selector */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "group relative overflow-hidden",
                  "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                  "border-slate-200/50 dark:border-slate-700/50",
                  "hover:shadow-lg transition-all duration-300",
                  "text-slate-900 dark:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="font-medium">
                    {format(selectedDate, "MMM d, yyyy")}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50"
              align="start"
            >
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setIsCalendarOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Center: Quick Actions & Notifications */}
          <div className="flex items-center gap-2">
            {/* Quick Create Menu */}
            <Popover
              open={isQuickCreateOpen}
              onOpenChange={setIsQuickCreateOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  className={cn(
                    "group relative overflow-hidden",
                    "bg-gradient-to-r from-blue-500 to-indigo-500",
                    "hover:from-blue-600 hover:to-indigo-600",
                    "text-white shadow-lg hover:shadow-xl",
                    "transition-all duration-300 hover:scale-105"
                  )}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-2xl"
                align="center"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Quick Create
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsQuickCreateOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={action.onClick}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl",
                            "bg-slate-50 dark:bg-slate-700/50",
                            "hover:bg-slate-100 dark:hover:bg-slate-700",
                            "transition-all duration-200",
                            "border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg bg-gradient-to-r",
                              action.gradient
                            )}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {action.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {action.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover
              open={isNotificationsOpen}
              onOpenChange={setIsNotificationsOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "relative",
                    "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                    "border-slate-200/50 dark:border-slate-700/50",
                    "hover:shadow-lg transition-all duration-300"
                  )}
                >
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 p-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-xl rounded-2xl"
                align="end"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Notification Tabs */}
                  <div className="flex gap-2 mb-4">
                    {["all", "done", "missed", "upcoming"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() =>
                          setNotificationTab(
                            tab as "all" | "done" | "missed" | "upcoming"
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                          notificationTab === tab
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                            : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <Separator className="mb-4" />

                  {/* Notifications List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No notifications
                      </div>
                    ) : (
                      filteredNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-3 rounded-xl",
                            "bg-slate-50 dark:bg-slate-700/50",
                            "hover:bg-slate-100 dark:hover:bg-slate-700",
                            "transition-all duration-200 cursor-pointer",
                            "border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "p-1.5 rounded-lg text-white",
                                getCategoryColor(notification.category)
                              )}
                            >
                              {getCategoryIcon(notification.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {notification.description}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right: View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "transition-all duration-200",
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "transition-all duration-200",
                viewMode === "list"
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
