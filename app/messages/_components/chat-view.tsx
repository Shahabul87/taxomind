"use client";

import { useState, useRef, useEffect } from "react";
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
  X,
  Check,
  CheckCheck,
  ArrowLeft
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplatesPopover } from "./templates-popover";
import { TypingIndicator } from "./typing-indicator";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import { useRealTimeMessages } from "@/hooks/use-realtime-messages";
import { connectSocket, joinConversation, leaveConversation, emitMessageSent } from "@/lib/socket-client";

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
  const [currentUserName, setCurrentUserName] = useState("User");
  const [otherUser, setOtherUser] = useState<{
    id: string;
    name: string | null;
    image: string | null;
    email?: string | null;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize typing indicator
  const {
    typingUsers,
    isAnyoneTyping,
    handleTyping,
    handleStopTyping,
  } = useTypingIndicator(chatId, userId);

  // Initialize real-time messages
  const { sendMessage, markMessageAsRead } = useRealTimeMessages({
    conversationId: chatId,
    userId,
    onMessageReceived: (message) => {
      // Add new message to the list
      setMessages((prev) => [...prev, message as any]);
    },
    onMessageReadUpdate: ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    },
  });

  // Connect to Socket.io and join conversation
  useEffect(() => {
    const socket = connectSocket();

    // Join the conversation room
    socket.on("connect", () => {
      joinConversation(chatId);
    });

    // If already connected, join immediately
    if (socket.connected) {
      joinConversation(chatId);
    }

    return () => {
      leaveConversation(chatId);
    };
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOtherUser = async () => {
    try {
      // Parse chatId to get other user's ID
      const [user1, user2] = chatId.split("-");
      const otherUserId = user1 === userId ? user2 : user1;

      // Fetch user info from the users API
      const response = await fetch(`/api/users/${otherUserId}`);
      if (response.ok) {
        const result = await response.json();
        // API returns { success: true, data: userDetails }
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
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/messages", {
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
          console.warn(`Failed to fetch messages, status: ${response.status}`);
        }
        setMessages([]);
        return;
      }

      const data = await response.json();

      // Check if response has error
      if (data.error || !Array.isArray(data)) {
        console.warn("Invalid response from API:", data);
        setMessages([]);
        return;
      }

      // Filter messages for this conversation
      const [user1, user2] = chatId.split("-");
      const conversationMessages = data.filter(
        (msg: Message) =>
          (msg.senderId === user1 || msg.senderId === user2) &&
          (msg.senderId === userId || msg.User_Message_senderIdToUser.id === userId)
      );

      setMessages(conversationMessages);

      // If we have messages but no otherUser yet, extract from messages
      if (conversationMessages.length > 0 && !otherUser) {
        const firstOtherMessage = conversationMessages.find(
          (msg) => msg.senderId !== userId
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
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      // Stop typing indicator
      handleStopTyping();

      // Get recipient ID from chatId
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

        // Emit message via Socket.io for real-time delivery
        sendMessage({
          ...data,
          conversationId: chatId,
        });

        setNewMessage("");
        fetchMessages(); // Refresh messages
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
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200/50 dark:border-slate-700/50
                    bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Back button for mobile */}
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="lg:hidden h-8 w-8 sm:h-9 sm:w-9 mr-1"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            )}
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0">
              <AvatarImage src={otherUser?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-sm sm:text-base">
                {otherUser?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                  {otherUser?.name || "Unknown"}
                </h3>
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[10px] sm:text-xs flex-shrink-0">
                  Instructor
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                Online • Avg response: 2-3 hours
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Course</DropdownMenuItem>
              <DropdownMenuItem>Schedule Meeting</DropdownMenuItem>
              <DropdownMenuItem>Star Conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === userId;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {!isOwn && (
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarImage src={message.User_Message_senderIdToUser.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                    {message.User_Message_senderIdToUser.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[70%]`}>
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1">
                  {!isOwn && (
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {message.User_Message_senderIdToUser.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {format(new Date(message.createdAt), "HH:mm")}
                  </span>
                  {isOwn && (
                    <div className="flex items-center gap-1">
                      {message.read ? (
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`
                    relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm
                    ${isOwn
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    }
                  `}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  {/* Attachments */}
                  {message.MessageAttachment?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.MessageAttachment.map((file) => (
                        <div
                          key={file.id}
                          className={`
                            flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all
                            ${isOwn
                              ? "bg-white/20 hover:bg-white/30"
                              : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }
                          `}
                        >
                          <div className={`p-2 rounded-lg ${
                            isOwn ? "bg-white/30" : "bg-blue-100 dark:bg-blue-900"
                          }`}>
                            {getFileIcon(file.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isOwn ? "text-white" : "text-slate-900 dark:text-white"
                            }`}>
                              {file.fileName}
                            </p>
                            <p className={`text-xs ${
                              isOwn ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                            }`}>
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                          <Download className={`w-4 h-4 ${
                            isOwn ? "text-white" : "text-slate-600 dark:text-slate-400"
                          }`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Category Tag */}
                  {message.category !== "GENERAL" && (
                    <div className="mt-2">
                      <Badge variant="outline" className={`text-xs ${
                        isOwn ? "border-white/50 text-white" : ""
                      }`}>
                        {message.category}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

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

      {/* Input Area */}
      <div className="p-3 sm:p-4 mb-[35px] sm:mb-0 border-t border-slate-200/50 dark:border-slate-700/50
                    bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        {/* Message Category Selector */}
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full xs:w-[140px] sm:w-[180px] bg-white dark:bg-slate-900 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL">General Question</SelectItem>
              <SelectItem value="QUESTION">Question</SelectItem>
              <SelectItem value="ASSIGNMENT">Assignment Help</SelectItem>
              <SelectItem value="TECHNICAL_ISSUE">Technical Issue</SelectItem>
              <SelectItem value="FEEDBACK">Feedback</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={priority === "URGENT" ? "default" : "outline"}
            size="sm"
            onClick={() => setPriority(priority === "URGENT" ? "NORMAL" : "URGENT")}
            className={`h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 ${
              priority === "URGENT" ? "bg-gradient-to-r from-orange-500 to-red-500" : ""
            }`}
          >
            {priority === "URGENT" ? "Urgent" : "Mark Urgent"}
          </Button>
        </div>

        {/* Input Area */}
        <div className="flex gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
          </Button>

          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping(); // Trigger typing indicator
            }}
            onBlur={handleStopTyping}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="min-h-[36px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] resize-none bg-white dark:bg-slate-900
                     border-slate-200 dark:border-slate-700 text-sm sm:text-base flex-1"
            rows={1}
          />

          <TemplatesPopover
            onSelectTemplate={(content) => setNewMessage(content)}
            currentCategory={category}
          />

          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 hidden sm:flex">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-400" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600
                     text-white shadow-md hover:shadow-lg transition-all duration-300 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            size="icon"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        <div className="mt-2 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs text-slate-400">
            {newMessage.length}/2000
          </span>
          <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
            Press Enter to send • Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
};
