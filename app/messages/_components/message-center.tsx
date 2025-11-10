"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Search,
  HelpCircle,
  FileText,
  Star,
  AlertCircle,
  Plus,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatList } from "./chat-list";
import { ChatView } from "./chat-view";
import { NewMessageDialog } from "./new-message-dialog";
import { SearchDialog } from "./search-dialog";

interface MessageCenterProps {
  userId: string | undefined;
}

type FilterType = "all" | "questions" | "assignments" | "starred" | "urgent";
type SortType = "recent" | "unread" | "priority" | "course";

export const MessageCenter = ({ userId }: MessageCenterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const handleMessageSelect = (messageId: string) => {
    // TODO: Navigate to the message in the chat view
    console.log("Selected message:", messageId);
  };

  if (!userId) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex flex-col bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                   border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-lg"
      >
        {/* Header with Search and New Message */}
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Messages
            </h2>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Filter conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchDialogOpen(true)}
                className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700
                         text-slate-900 dark:text-white cursor-pointer"
                readOnly
              />
            </div>
            <Button
              onClick={() => setIsNewMessageOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600
                       hover:to-indigo-600 text-white shadow-md"
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="p-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", icon: MessageCircle, label: "All", color: "slate" },
              { value: "questions", icon: HelpCircle, label: "Questions", color: "blue" },
              { value: "assignments", icon: FileText, label: "Assignments", color: "purple" },
              { value: "starred", icon: Star, label: "Starred", color: "yellow" },
              { value: "urgent", icon: AlertCircle, label: "Urgent", color: "red" },
            ].map((item) => (
              <Button
                key={item.value}
                variant={filter === item.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter(item.value as FilterType)}
                className={`
                  text-xs h-8
                  ${filter === item.value
                    ? item.value === "questions"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : item.value === "assignments"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : item.value === "starred"
                      ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                      : item.value === "urgent"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                      : "bg-gradient-to-r from-slate-500 to-slate-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }
                `}
              >
                <item.icon className="w-3 h-3 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="unread">Unread First</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="course">By Course</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chat List */}
        <ChatList
          searchQuery={searchQuery}
          activeChat={activeChat}
          onChatSelect={setActiveChat}
          filter={filter}
          sortBy={sortBy}
          userId={userId}
        />
      </motion.div>

      {/* Main Chat View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
                   border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-lg"
      >
        {activeChat ? (
          <ChatView chatId={activeChat} userId={userId} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20
                          dark:to-indigo-950/20 rounded-2xl mb-4">
              <MessageCircle className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
              No conversation selected
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Select a conversation to start messaging with your instructor
            </p>
          </div>
        )}
      </motion.div>

      <NewMessageDialog
        open={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        userId={userId}
        onChatStart={(recipientIds) => {
          // For 1-on-1 chat, use consistent chatId format
          const chatId = recipientIds.length === 1
            ? `${userId}-${recipientIds[0]}`
            : `group-${Date.now()}`;
          setActiveChat(chatId);
          setIsNewMessageOpen(false);
        }}
      />

      <SearchDialog
        open={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        onMessageSelect={handleMessageSelect}
      />
    </div>
  );
}; 