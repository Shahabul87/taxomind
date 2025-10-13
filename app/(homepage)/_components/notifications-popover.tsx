"use client"

import { Bell } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { useNotifications } from "@/store/use-notifications"

export const NotificationsPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-gray-700 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-80 rounded-xl backdrop-blur-xl dark:bg-slate-900/95 bg-white/95 border dark:border-slate-700/50 border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b dark:border-slate-700/50 border-slate-200">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b dark:border-slate-700/50 border-slate-200 ${
                    !notification.read ? 'bg-slate-50 dark:bg-gray-800/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm text-slate-900 dark:text-white">{notification.title}</h4>
                    <span className="text-xs text-slate-500 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
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
