"use client"

import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessages } from "@/store/use-messages"
import { IconButton } from "@/components/ui/icon-button"

export const MessagesPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, unreadCount, fetchMessages, markAsRead } = useMessages();

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  return (
    <div className="relative">
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="md"
        notification={unreadCount > 0 ? unreadCount : false}
        aria-label="Messages"
      >
        <MessageSquare className="w-5 h-5" />
      </IconButton>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-[95vw] max-w-[320px] sm:w-80 rounded-xl backdrop-blur-xl dark:bg-slate-900/95 bg-white/95 border dark:border-slate-700/50 border-slate-200 shadow-2xl overflow-hidden"
          >
            <div className="p-3 sm:p-4 border-b dark:border-slate-700/50 border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Messages</h3>
              <Link href="/dashboard/user/messages" className="text-xs sm:text-sm text-purple-600 hover:text-purple-700">
                View All
              </Link>
            </div>
            <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`p-3 sm:p-4 border-b dark:border-slate-700/50 border-slate-200 ${
                    !message.read ? 'bg-slate-50 dark:bg-gray-800/50' : ''
                  }`}
                  onClick={() => markAsRead(message.id)}
                >
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarImage src={message.User_Message_senderIdToUser?.image || undefined} />
                      <AvatarFallback>{message.User_Message_senderIdToUser?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white">{message.User_Message_senderIdToUser?.name || 'Unknown'}</h4>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-500">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
