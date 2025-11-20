"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import {
  GraduationCap,
  Paperclip,
  HelpCircle,
  FileText,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
  id: string;
  instructor: {
    id: string;
    name: string | null;
    avatar: string | null;
    online: boolean;
    responseTime: string;
  };
  course: {
    id: string;
    title: string;
  } | null;
  lastMessage: {
    content: string;
    timestamp: Date;
    isOwn: boolean;
  };
  category: string;
  priority: string;
  unread: number;
  hasAttachment: boolean;
  attachmentCount: number;
}

interface ChatListProps {
  searchQuery: string;
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  filter: "all" | "questions" | "assignments" | "starred" | "urgent";
  sortBy: "recent" | "unread" | "priority" | "course";
  userId: string;
}

export const ChatList = ({
  searchQuery,
  activeChat,
  onChatSelect,
  filter,
  sortBy,
  userId,
}: ChatListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sortBy]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/messages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, fail silently
          console.warn("User not authenticated");
        } else {
          console.warn(`Failed to fetch conversations, status: ${response.status}`);
        }
        setConversations([]);
        return;
      }

      const data = await response.json();

      // Check if response has error or is not an array
      if (data.error || !Array.isArray(data)) {
        console.warn("Invalid response from API:", data);
        setConversations([]);
        return;
      }

      // Group messages by conversation (sender/recipient pair)
      const conversationMap = new Map<string, any>();

      data.forEach((message: any) => {
        const otherUser = message.senderId === userId
          ? message.User_Message_recipientIdToUser
          : message.User_Message_senderIdToUser;

        const convKey = `${Math.min(message.senderId, message.recipientId)}-${Math.max(message.senderId, message.recipientId)}`;

        if (!conversationMap.has(convKey) || new Date(message.createdAt) > new Date(conversationMap.get(convKey).lastMessage.timestamp)) {
          conversationMap.set(convKey, {
            id: convKey,
            instructor: {
              id: otherUser.id,
              name: otherUser.name,
              avatar: otherUser.image,
              online: false, // TODO: Implement online status
              responseTime: "2-3 hours", // TODO: Calculate from data
            },
            course: null, // Course relation not available in Message model
            lastMessage: {
              content: message.content,
              timestamp: new Date(message.createdAt),
              isOwn: message.senderId === userId,
            },
            category: "GENERAL", // Default category
            priority: "NORMAL", // Default priority
            unread: message.senderId !== userId && !message.read ? 1 : 0,
            hasAttachment: false, // MessageAttachment relation not available
            attachmentCount: 0,
          });
        } else {
          const existing = conversationMap.get(convKey);
          if (message.senderId !== userId && !message.read) {
            existing.unread += 1;
          }
        }
      });

      let convList = Array.from(conversationMap.values());

      // Apply search filter
      if (searchQuery) {
        convList = convList.filter(
          (conv) =>
            conv.instructor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply sorting
      convList.sort((a, b) => {
        if (sortBy === "recent") {
          return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
        } else if (sortBy === "unread") {
          return b.unread - a.unread;
        } else if (sortBy === "priority") {
          const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
        } else if (sortBy === "course") {
          return (a.course?.title || "").localeCompare(b.course?.title || "");
        }
        return 0;
      });

      setConversations(convList);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "QUESTION":
        return <HelpCircle className="w-3 h-3" />;
      case "ASSIGNMENT":
        return <FileText className="w-3 h-3" />;
      case "TECHNICAL_ISSUE":
        return <AlertCircle className="w-3 h-3" />;
      case "FEEDBACK":
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20
                      dark:to-indigo-950/20 rounded-lg sm:rounded-xl mb-3">
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
        </div>
        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1 text-sm sm:text-base">No conversations</h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4">
          Start a new conversation with an instructor
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="space-y-2 p-2 sm:p-3">
        {conversations.map((conv, index) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onChatSelect(conv.id)}
            className={`
              group relative p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-300 active:scale-[0.98]
              ${activeChat === conv.id
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
              }
            `}
          >
            {/* Course Badge */}
            {conv.course && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                  {conv.course.title.length > 15
                    ? conv.course.title.substring(0, 15) + "..."
                    : conv.course.title}
                </Badge>
              </div>
            )}

            {/* Instructor Avatar & Info */}
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white dark:border-slate-700">
                  <AvatarImage src={conv.instructor.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm sm:text-base">
                    {conv.instructor.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Online Status */}
                {conv.instructor.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500
                              rounded-full border-2 border-white dark:border-slate-800" />
                )}

                {/* Instructor Badge */}
                <div className="absolute -top-0.5 -left-0.5 sm:-top-1 sm:-left-1 bg-gradient-to-r from-yellow-500 to-amber-500
                            rounded-full p-0.5 sm:p-1">
                  <GraduationCap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-1 gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {conv.instructor.name || "Unknown"}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                      Instructor • {conv.instructor.responseTime}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(conv.lastMessage.timestamp, { addSuffix: true })}
                    </span>
                    {/* Priority Badge */}
                    {conv.priority === "URGENT" && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Last Message Preview */}
                <div className="mt-1.5 sm:mt-2 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Category Icon */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <div className="text-slate-500 dark:text-slate-400">
                        {getCategoryIcon(conv.category)}
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                        {conv.category}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm truncate leading-relaxed ${
                      conv.unread > 0
                        ? 'text-slate-900 dark:text-white font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {conv.lastMessage.isOwn ? "You: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {conv.unread > 0 && (
                    <div className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gradient-to-r from-blue-500 to-indigo-500
                                  text-white text-[10px] sm:text-xs font-bold rounded-full min-w-[20px] sm:min-w-[24px] text-center flex-shrink-0">
                      {conv.unread}
                    </div>
                  )}
                </div>

                {/* Quick Action Tags */}
                {conv.hasAttachment && (
                  <div className="mt-2 flex gap-1">
                    <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                      <Paperclip className="w-3 h-3 mr-1" />
                      {conv.attachmentCount}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 