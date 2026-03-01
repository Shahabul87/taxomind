"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Check,
  CheckCheck,
  ArrowLeft,
  Phone,
  Video,
  Star,
  Calendar,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplatesPopover } from "./templates-popover";
import { TypingIndicator } from "./typing-indicator";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { useRealTimeMessages } from "@/hooks/use-realtime-messages";
import { connectSocket, joinConversation, leaveConversation } from "@/lib/socket-client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  category: string;
  priority: string;
  read: boolean;
  User_Message_senderIdToUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
  MessageAttachment: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

interface ChatViewProps {
  chatId: string;
  userId: string;
  onBack?: () => void;
}

export const ChatView = ({ chatId, userId, onBack }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [priority, setPriority] = useState("NORMAL");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string | null;
    image: string | null;
    email?: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const otherUserRef = useRef(otherUser);
  otherUserRef.current = otherUser;

  // Initialize typing indicator
  const {
    typingUsers,
    isAnyoneTyping,
    handleTyping,
    handleStopTyping,
  } = useTypingIndicator(chatId, userId);

  // Initialize real-time messages
  const { sendMessage } = useRealTimeMessages({
    conversationId: chatId,
    userId,
    onMessageReceived: (message: unknown) => {
      setMessages((prev) => [...prev, message as Message]);
    },
    onMessageReadUpdate: ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOtherUser = useCallback(async () => {
    try {
      const [user1, user2] = chatId.split("-");
      const otherUserId = user1 === userId ? user2 : user1;

      const response = await fetch(`/api/users/${otherUserId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setOtherUser({
            id: result.data.id,
            name: result.data.name,
            image: result.data.image,
            email: result.data.email,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch other user:", error);
    }
  }, [chatId, userId]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("User not authenticated");
        }
        setMessages([]);
        return;
      }

      const data = await response.json();

      if (data.error || !Array.isArray(data)) {
        setMessages([]);
        return;
      }

      const [user1, user2] = chatId.split("-");
      const conversationMessages = data.filter(
        (msg: Message) =>
          (msg.senderId === user1 || msg.senderId === user2) &&
          (msg.senderId === userId || msg.User_Message_senderIdToUser.id === userId)
      );

      setMessages(conversationMessages);

      if (conversationMessages.length > 0 && !otherUserRef.current) {
        const firstOtherMessage = conversationMessages.find(
          (msg: Message) => msg.senderId !== userId
        );
        if (firstOtherMessage) {
          setOtherUser(firstOtherMessage.User_Message_senderIdToUser);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [chatId, userId]);

  // Connect to Socket.io and join conversation
  useEffect(() => {
    connectSocket().then((socket) => {
      socket.on("connect", () => {
        joinConversation(chatId);
      });

      if (socket.connected) {
        joinConversation(chatId);
      }
    });

    return () => {
      leaveConversation(chatId);
    };
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
  }, [fetchMessages, fetchOtherUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      handleStopTyping();

      const [user1, user2] = chatId.split("-");
      const recipientId = user1 === userId ? user2 : user1;

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          content: newMessage,
          category,
          priority,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        sendMessage({
          ...data,
          conversationId: chatId,
        });

        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center msg-empty-state">
        <div className="msg-empty-icon mb-4">
          <Loader2 className="w-8 h-8 text-[hsl(var(--msg-primary))] animate-spin" />
        </div>
        <p className="text-sm text-[hsl(var(--msg-text-muted))]">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col msg-chat-view">
      {/* Premium Chat Header */}
      <div className="msg-chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Back button for mobile */}
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="lg:hidden h-9 w-9 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-text))] hover:bg-[hsl(var(--msg-surface-hover))]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}

            {/* Avatar with status */}
            <div className="relative flex-shrink-0 msg-avatar-ring">
              <Avatar className="w-11 h-11 border-2 border-[hsl(var(--msg-surface))]">
                <AvatarImage src={otherUser?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white font-semibold">
                  {otherUser?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="msg-status-online" />
              <div className="absolute -top-1 -left-1 p-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm">
                <GraduationCap className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[hsl(var(--msg-text))] truncate">
                  {otherUser?.name || "Unknown"}
                </h3>
                <Badge className="h-5 px-2 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                  Instructor
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--msg-text-subtle))] flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--msg-success))]" />
                  Online
                </span>
                <span>•</span>
                <span>Avg response: 2-3 hours</span>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-primary))] hover:bg-[hsl(var(--msg-primary-muted))] hidden sm:flex"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-primary))] hover:bg-[hsl(var(--msg-primary-muted))] hidden sm:flex"
            >
              <Video className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-text))] hover:bg-[hsl(var(--msg-surface-hover))]"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[hsl(var(--msg-surface))] border-[hsl(var(--msg-border))]"
              >
                <DropdownMenuItem className="text-[hsl(var(--msg-text))] focus:bg-[hsl(var(--msg-surface-hover))]">
                  <Star className="w-4 h-4 mr-2" />
                  Star Conversation
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[hsl(var(--msg-text))] focus:bg-[hsl(var(--msg-surface-hover))]">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[hsl(var(--msg-border))]" />
                <DropdownMenuItem className="text-[hsl(var(--msg-text))] focus:bg-[hsl(var(--msg-surface-hover))]">
                  View Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 msg-scrollbar msg-messages-area">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center msg-empty-state">
            <div className="msg-empty-icon mb-4">
              <Send className="w-8 h-8 text-[hsl(var(--msg-primary))]" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--msg-text))] mb-1">Start a conversation</h3>
            <p className="text-sm text-[hsl(var(--msg-text-muted))] text-center max-w-[200px]">
              Send your first message to {otherUser?.name || "this user"}
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === userId;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId === userId);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-3", isOwn && "flex-row-reverse")}
              >
                {/* Avatar for other user */}
                {!isOwn && (
                  <div className={cn("w-8 flex-shrink-0", !showAvatar && "invisible")}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.User_Message_senderIdToUser.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-[hsl(var(--msg-primary))] to-[hsl(var(--msg-cyan))] text-white text-xs">
                        {message.User_Message_senderIdToUser.name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className={cn("flex flex-col max-w-[75%]", isOwn ? "items-end" : "items-start")}>
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-1 px-1">
                    {!isOwn && showAvatar && (
                      <span className="text-xs font-medium text-[hsl(var(--msg-text-muted))]">
                        {message.User_Message_senderIdToUser.name}
                      </span>
                    )}
                    <span className="text-[11px] text-[hsl(var(--msg-text-subtle))]">
                      {format(new Date(message.createdAt), "HH:mm")}
                    </span>
                    {isOwn && (
                      <div className="flex items-center">
                        {message.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[hsl(var(--msg-cyan))]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--msg-text-subtle))]" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={isOwn ? "msg-bubble-own" : "msg-bubble-other"}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>

                    {/* Attachments */}
                    {message.MessageAttachment?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.MessageAttachment.map((file) => (
                          <div
                            key={file.id}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                              isOwn
                                ? "bg-white/15 hover:bg-white/25"
                                : "bg-[hsl(var(--msg-surface-hover))] hover:bg-[hsl(var(--msg-border))]"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg",
                              isOwn ? "bg-white/20" : "bg-[hsl(var(--msg-primary-muted))]"
                            )}>
                              {getFileIcon(file.fileType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.fileName}
                              </p>
                              <p className={cn(
                                "text-xs",
                                isOwn ? "text-white/70" : "text-[hsl(var(--msg-text-subtle))]"
                              )}>
                                {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                            <Download className="w-4 h-4 flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Category Tag */}
                    {message.category !== "GENERAL" && (
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            isOwn ? "border-white/30 text-white/90" : "border-[hsl(var(--msg-border))] text-[hsl(var(--msg-text-muted))]"
                          )}
                        >
                          {message.category.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing Indicator */}
        <AnimatePresence>
          {isAnyoneTyping && (
            <TypingIndicator
              typingUsers={typingUsers}
              userAvatar={otherUser?.image}
            />
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="msg-input-area">
        {/* Category & Priority Selectors */}
        <div className="mb-3 flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={cn(
              "w-[160px] h-9 text-sm rounded-lg",
              "bg-[hsl(var(--msg-surface))]",
              "border-[hsl(var(--msg-border))]",
              "text-[hsl(var(--msg-text))]"
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--msg-surface))] border-[hsl(var(--msg-border))]">
              <SelectItem value="GENERAL" className="text-[hsl(var(--msg-text))]">General</SelectItem>
              <SelectItem value="QUESTION" className="text-[hsl(var(--msg-text))]">Question</SelectItem>
              <SelectItem value="ASSIGNMENT" className="text-[hsl(var(--msg-text))]">Assignment Help</SelectItem>
              <SelectItem value="TECHNICAL_ISSUE" className="text-[hsl(var(--msg-text))]">Technical Issue</SelectItem>
              <SelectItem value="FEEDBACK" className="text-[hsl(var(--msg-text))]">Feedback</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={priority === "URGENT" ? "default" : "outline"}
            size="sm"
            onClick={() => setPriority(priority === "URGENT" ? "NORMAL" : "URGENT")}
            className={cn(
              "h-9 px-3 text-sm rounded-lg",
              priority === "URGENT"
                ? "bg-gradient-to-r from-rose-500 to-red-500 text-white border-0 shadow-lg shadow-rose-500/25"
                : "border-[hsl(var(--msg-border))] text-[hsl(var(--msg-text-muted))] hover:border-rose-500/50 hover:text-rose-500"
            )}
          >
            {priority === "URGENT" ? "🔥 Urgent" : "Mark Urgent"}
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-primary))] hover:bg-[hsl(var(--msg-primary-muted))]"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onBlur={handleStopTyping}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none pr-24 rounded-xl",
                "bg-[hsl(var(--msg-surface))]",
                "border-[hsl(var(--msg-border))]",
                "text-[hsl(var(--msg-text))]",
                "placeholder:text-[hsl(var(--msg-text-subtle))]",
                "focus:border-[hsl(var(--msg-primary))]",
                "focus:ring-2 focus:ring-[hsl(var(--msg-primary))]/10"
              )}
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <span className="text-[10px] text-[hsl(var(--msg-text-subtle))] mr-1">
                {newMessage.length}/2000
              </span>
              <TemplatesPopover
                onSelectTemplate={(content) => setNewMessage(content)}
                currentCategory={category}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[hsl(var(--msg-text-muted))] hover:text-[hsl(var(--msg-primary))] hidden sm:flex"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              "msg-send-btn h-10 w-10 flex-shrink-0",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-center">
          <span className="text-[10px] text-[hsl(var(--msg-text-subtle))]">
            Press <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--msg-border))] bg-[hsl(var(--msg-surface))] mx-1">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 rounded border border-[hsl(var(--msg-border))] bg-[hsl(var(--msg-surface))] mx-1">Shift+Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
};
