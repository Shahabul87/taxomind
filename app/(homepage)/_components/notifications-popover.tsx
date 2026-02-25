"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { useNotifications } from "@/store/use-notifications"
import { IconButton } from "@/components/ui/icon-button"

export const NotificationsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotifications(s => s.notifications);
  const unreadCount = useNotifications(s => s.unreadCount);
  const fetchNotifications = useNotifications(s => s.fetchNotifications);
  const markAsRead = useNotifications(s => s.markAsRead);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  return (
    <div className="relative">
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="md"
        notification={unreadCount > 0 ? unreadCount : false}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
      </IconButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-[95vw] max-w-[320px] sm:w-80 rounded-xl backdrop-blur-xl dark:bg-slate-900/95 bg-white/95 border dark:border-slate-700/50 border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-3 sm:p-4 border-b dark:border-slate-700/50 border-slate-200">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Notifications</h3>
            </div>
            <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 sm:p-4 border-b dark:border-slate-700/50 border-slate-200 ${
                    !notification.read ? 'bg-slate-50 dark:bg-gray-800/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">{notification.title}</h4>
                    <span className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
