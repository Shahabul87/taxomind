"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

export function DashboardHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await res.json();

      if (data.success && data.data) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("[Notifications Error]", error);
      // Keep empty array on error
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "success":
        return "text-emerald-600 dark:text-emerald-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <motion.div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Welcome back, Admin! Here&apos;s your platform overview.
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "relative bg-white dark:bg-slate-800 backdrop-blur-sm",
              "border-slate-300 dark:border-slate-600",
              "text-slate-700 dark:text-slate-300",
              "hover:bg-blue-500 hover:text-white",
              "dark:hover:bg-blue-600 dark:hover:text-white",
              "hover:border-blue-500 dark:hover:border-blue-600",
              "hover:shadow-lg hover:scale-105",
              "transition-all duration-300 shadow-sm"
            )}
          >
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs text-white flex items-center justify-center font-bold shadow-lg"
              >
                {unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 max-h-96 overflow-y-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-slate-200 dark:border-slate-700"
        >
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                  !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                      )}
                      <p className={cn(
                        "text-sm font-medium truncate",
                        getNotificationColor(notification.type)
                      )}>
                        {notification.title}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}
