"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Search,
  HelpCircle,
  FileText,
  Star,
  AlertCircle,
  Plus,
  Filter,
  Sparkles,
  Users,
  Inbox,
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
import { cn } from "@/lib/utils";

interface MessageCenterProps {
  userId: string | undefined;
}

type FilterType = "all" | "questions" | "assignments" | "starred" | "urgent";
type SortType = "recent" | "unread" | "priority" | "course";

const filterOptions = [
  { value: "all", icon: Inbox, label: "All", color: "default" },
  { value: "questions", icon: HelpCircle, label: "Questions", color: "cyan" },
  { value: "assignments", icon: FileText, label: "Assignments", color: "violet" },
  { value: "starred", icon: Star, label: "Starred", color: "amber" },
  { value: "urgent", icon: AlertCircle, label: "Urgent", color: "rose" },
];

export const MessageCenter = ({ userId }: MessageCenterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");

  const handleMessageSelect = (messageId: string) => {
    console.log("Selected message:", messageId);
  };

  if (!userId) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 lg:gap-5 msg-container relative overflow-hidden rounded-2xl lg:rounded-3xl">
      {/* Sidebar Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "w-full lg:w-[340px] xl:w-[380px] flex flex-col msg-panel",
          activeChat ? "hidden lg:flex" : "flex"
        )}
      >
        {/* Header Section */}
        <div className="p-4 lg:p-5 border-b border-[hsl(var(--msg-border-subtle))]">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl msg-header-gradient">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(var(--msg-success))] rounded-full border-2 border-[hsl(var(--msg-surface))]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--msg-text))]">
                  Messages
                </h2>
                <p className="text-xs text-[hsl(var(--msg-text-muted))]">
                  Stay connected with your team
                </p>
              </div>
            </div>

            {/* New Message Button */}
            <Button
              onClick={() => setIsNewMessageOpen(true)}
              className={cn(
                "msg-send-btn w-11 h-11",
                "hover:scale-105 active:scale-95"
              )}
              size="icon"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--msg-text-subtle))]" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchDialogOpen(true)}
              className={cn(
                "pl-10 h-11 text-sm rounded-xl cursor-pointer",
                "bg-[hsl(var(--msg-surface-hover))]",
                "border-[hsl(var(--msg-border))]",
                "text-[hsl(var(--msg-text))]",
                "placeholder:text-[hsl(var(--msg-text-subtle))]",
                "focus:border-[hsl(var(--msg-primary))]",
                "focus:ring-2 focus:ring-[hsl(var(--msg-primary))]/10"
              )}
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[hsl(var(--msg-border))] bg-[hsl(var(--msg-surface))] px-1.5 font-mono text-[10px] text-[hsl(var(--msg-text-subtle))]">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="p-3 lg:p-4 border-b border-[hsl(var(--msg-border-subtle))]">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => {
              const isActive = filter === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value as FilterType)}
                  className={cn(
                    "msg-filter-chip",
                    isActive && "active"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort Options */}
        <div className="px-4 py-3 border-b border-[hsl(var(--msg-border-subtle))]">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className={cn(
              "h-10 text-sm rounded-xl",
              "bg-[hsl(var(--msg-surface))]",
              "border-[hsl(var(--msg-border))]",
              "text-[hsl(var(--msg-text))]"
            )}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[hsl(var(--msg-text-muted))]" />
                <SelectValue placeholder="Sort by..." />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--msg-surface))] border-[hsl(var(--msg-border))]">
              <SelectItem value="recent" className="text-[hsl(var(--msg-text))]">Most Recent</SelectItem>
              <SelectItem value="unread" className="text-[hsl(var(--msg-text))]">Unread First</SelectItem>
              <SelectItem value="priority" className="text-[hsl(var(--msg-text))]">Priority</SelectItem>
              <SelectItem value="course" className="text-[hsl(var(--msg-text))]">By Course</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            searchQuery={searchQuery}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            filter={filter}
            sortBy={sortBy}
            userId={userId}
          />
        </div>
      </motion.div>

      {/* Main Chat View Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "flex-1 msg-panel overflow-hidden",
          activeChat ? "flex" : "hidden lg:flex"
        )}
      >
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key={activeChat}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <ChatView
                chatId={activeChat}
                userId={userId}
                onBack={() => setActiveChat(null)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center msg-empty-state"
            >
              {/* Decorative Background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] opacity-5 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-[hsl(var(--msg-rose))] to-[hsl(var(--msg-primary))] opacity-5 blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="msg-empty-icon mb-6">
                  <MessageCircle className="w-10 h-10 text-[hsl(var(--msg-primary))]" />
                </div>

                <h3 className="text-xl font-semibold text-[hsl(var(--msg-text))] mb-2">
                  No conversation selected
                </h3>
                <p className="text-sm text-[hsl(var(--msg-text-muted))] text-center max-w-sm mb-6">
                  Select a conversation from the sidebar or start a new one to begin messaging
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setIsNewMessageOpen(true)}
                    className={cn(
                      "h-11 px-6 rounded-xl font-medium",
                      "bg-gradient-to-r from-[hsl(var(--msg-primary))] to-[hsl(258,85%,55%)]",
                      "text-white shadow-lg shadow-[hsl(var(--msg-primary))]/25",
                      "hover:shadow-xl hover:shadow-[hsl(var(--msg-primary))]/30",
                      "transition-all duration-300 hover:scale-[1.02]"
                    )}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsSearchDialogOpen(true)}
                    className={cn(
                      "h-11 px-6 rounded-xl font-medium",
                      "border-[hsl(var(--msg-border))]",
                      "text-[hsl(var(--msg-text))]",
                      "hover:border-[hsl(var(--msg-primary))]",
                      "hover:text-[hsl(var(--msg-primary))]",
                      "hover:bg-[hsl(var(--msg-primary-muted))]"
                    )}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Messages
                  </Button>
                </div>

                {/* Quick Tips */}
                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--msg-text-subtle))]">
                    <kbd className="h-5 px-2 rounded border border-[hsl(var(--msg-border))] bg-[hsl(var(--msg-surface))]">⌘K</kbd>
                    <span>Quick search</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--msg-text-subtle))]">
                    <kbd className="h-5 px-2 rounded border border-[hsl(var(--msg-border))] bg-[hsl(var(--msg-surface))]">⌘N</kbd>
                    <span>New message</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dialogs */}
      <NewMessageDialog
        open={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        userId={userId}
        onChatStart={(recipientIds) => {
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
