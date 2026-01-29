"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  GraduationCap,
  Paperclip,
  HelpCircle,
  FileText,
  AlertCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

  const searchQueryRef = useRef(searchQuery);
  searchQueryRef.current = searchQuery;

  const fetchConversations = useCallback(async () => {
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
          console.warn("User not authenticated");
        } else {
          console.warn(`Failed to fetch conversations, status: ${response.status}`);
        }
        setConversations([]);
        return;
      }

      const data = await response.json();

      if (data.error || !Array.isArray(data)) {
        console.warn("Invalid response from API:", data);
        setConversations([]);
        return;
      }

      const conversationMap = new Map<string, Conversation>();

      data.forEach((message: any) => {
        const otherUser = message.senderId === userId
          ? message.User_Message_recipientIdToUser
          : message.User_Message_senderIdToUser;

        const convKey = `${Math.min(message.senderId, message.recipientId)}-${Math.max(message.senderId, message.recipientId)}`;

        if (!conversationMap.has(convKey) || new Date(message.createdAt) > new Date(conversationMap.get(convKey)!.lastMessage.timestamp)) {
          conversationMap.set(convKey, {
            id: convKey,
            instructor: {
              id: otherUser.id,
              name: otherUser.name,
              avatar: otherUser.image,
              online: false,
              responseTime: "2-3 hours",
            },
            course: null,
            lastMessage: {
              content: message.content,
              timestamp: new Date(message.createdAt),
              isOwn: message.senderId === userId,
            },
            category: "GENERAL",
            priority: "NORMAL",
            unread: message.senderId !== userId && !message.read ? 1 : 0,
            hasAttachment: false,
            attachmentCount: 0,
          });
        } else {
          const existing = conversationMap.get(convKey);
          if (existing && message.senderId !== userId && !message.read) {
            existing.unread += 1;
          }
        }
      });

      let convList = Array.from(conversationMap.values());

      const currentSearchQuery = searchQueryRef.current;
      if (currentSearchQuery) {
        convList = convList.filter(
          (conv) =>
            conv.instructor.name?.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            conv.lastMessage.content.toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
            conv.course?.title.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );
      }

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
  }, [userId, sortBy]);

  useEffect(() => {
    fetchConversations();
  }, [filter, fetchConversations]);

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
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-[hsl(var(--msg-primary))] animate-spin mb-3" />
        <p className="text-sm text-[hsl(var(--msg-text-muted))]">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center msg-empty-state">
        <div className="msg-empty-icon mb-4">
          <MessageSquare className="w-8 h-8 text-[hsl(var(--msg-primary))]" />
        </div>
        <h3 className="font-semibold text-[hsl(var(--msg-text))] mb-1">No conversations</h3>
        <p className="text-sm text-[hsl(var(--msg-text-muted))] max-w-[200px]">
          Start a new conversation to begin messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto msg-scrollbar">
      <div className="p-3 space-y-2">
        {conversations.map((conv, index) => {
          const isActive = activeChat === conv.id;

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onChatSelect(conv.id)}
              className={cn(
                "msg-conversation-card",
                isActive && "active"
              )}
            >
              {/* Avatar Section */}
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0 msg-avatar-ring">
                  <Avatar className="w-12 h-12 border-2 border-[hsl(var(--msg-surface))]">
                    <AvatarImage src={conv.instructor.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white font-semibold">
                      {conv.instructor.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online Status */}
                  {conv.instructor.online && (
                    <div className="msg-status-online" />
                  )}

                  {/* Instructor Badge */}
                  <div className="absolute -top-1 -left-1 p-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm">
                    <GraduationCap className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[hsl(var(--msg-text))] truncate">
                        {conv.instructor.name || "Unknown"}
                      </h4>
                      <p className="text-[11px] text-[hsl(var(--msg-text-subtle))]">
                        {conv.instructor.responseTime}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[11px] text-[hsl(var(--msg-text-subtle))]">
                        {formatDistanceToNow(conv.lastMessage.timestamp, { addSuffix: true })}
                      </span>

                      {conv.priority === "URGENT" && (
                        <Badge className="h-5 px-1.5 text-[10px] font-semibold bg-gradient-to-r from-rose-500 to-red-500 text-white border-0">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 min-w-0">
                      {/* Category Tag */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[hsl(var(--msg-text-subtle))]">
                          {getCategoryIcon(conv.category)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-[hsl(var(--msg-text-subtle))] font-medium">
                          {conv.category.replace("_", " ")}
                        </span>
                      </div>

                      <p className={cn(
                        "text-sm leading-relaxed truncate",
                        conv.unread > 0
                          ? "text-[hsl(var(--msg-text))] font-medium"
                          : "text-[hsl(var(--msg-text-muted))]"
                      )}>
                        {conv.lastMessage.isOwn && (
                          <span className="text-[hsl(var(--msg-text-subtle))]">You: </span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {conv.unread > 0 && (
                      <div className="msg-unread-badge">
                        {conv.unread}
                      </div>
                    )}
                  </div>

                  {/* Attachments Badge */}
                  {conv.hasAttachment && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        className="h-5 px-2 text-[10px] border-[hsl(var(--msg-border))] text-[hsl(var(--msg-text-muted))]"
                      >
                        <Paperclip className="w-3 h-3 mr-1" />
                        {conv.attachmentCount} file{conv.attachmentCount > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}

                  {/* Course Badge */}
                  {conv.course && (
                    <div className="mt-2">
                      <Badge className="h-5 px-2 text-[10px] bg-gradient-to-r from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white border-0">
                        {conv.course.title.length > 20
                          ? conv.course.title.substring(0, 20) + "..."
                          : conv.course.title}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
