"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Mail, AlertCircle, BookOpen, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  title: string;
  message: string;
  content?: string | null;
  type: string;
  notificationType?: string | null;
  read: boolean;
  messageId?: string | null;
  link?: string | null;
  createdAt: string;
  Message?: {
    id: string;
    content: string;
    senderId: string;
    User_Message_senderIdToUser: {
      id: string;
      name: string | null;
      image: string | null;
    };
  } | null;
}

interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown = ({ className }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
      });

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n.id === notificationId);
        return deleted && !deleted.read ? prev - 1 : prev;
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.notificationType) {
      case "NEW_MESSAGE":
        return <Mail className="w-4 h-4 text-blue-500" />;
      case "MESSAGE_REPLY":
        return <MessageSquare className="w-4 h-4 text-indigo-500" />;
      case "URGENT_MESSAGE":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "ASSIGNMENT_REMINDER":
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case "COURSE_UPDATE":
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.link) {
      window.location.href = notification.link;
    } else if (notification.messageId) {
      window.location.href = `/messages?messageId=${notification.messageId}`;
    }

    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
        >
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center
                       bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold
                       rounded-full px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20
                            dark:to-indigo-950/20 rounded-xl mb-3">
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                No notifications
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`relative p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                              cursor-pointer ${!notification.read ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon/Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        {notification.Message?.User_Message_senderIdToUser ? (
                          <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-700">
                            <AvatarImage
                              src={notification.Message.User_Message_senderIdToUser.image || undefined}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                              {notification.Message.User_Message_senderIdToUser.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100
                                        dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm text-slate-900 dark:text-white truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500
                                          rounded-full flex-shrink-0 mt-1.5" />
                          )}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                          {notification.content || notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>

                          {notification.notificationType && (
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-300 dark:border-slate-600"
                            >
                              {notification.notificationType.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-center cursor-pointer text-blue-600 dark:text-blue-400
                       hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20"
              onClick={() => {
                window.location.href = "/notifications";
                setOpen(false);
              }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
