'use client';

/**
 * ChatRoom Component
 *
 * Real-time chat interface for study buddy conversations.
 * Features message threading, typing indicators, reactions,
 * and integration with the collaboration system.
 *
 * @module components/sam/study-buddy-chat/ChatRoom
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  ChevronDown,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  File,
  Mic,
  X,
  Reply,
  Trash2,
  Copy,
  Pin,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

// Quick reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '💡'];

// Quick message templates for study coordination
const QUICK_MESSAGES = [
  { label: 'Ready to study?', message: "Hey! Ready to start our study session? 📚" },
  { label: 'Need a break', message: "Let&apos;s take a 5 minute break! ☕" },
  { label: 'Got a question', message: "I have a question about what we&apos;re studying..." },
  { label: 'Great progress!', message: "We&apos;re making great progress! Keep it up! 🎉" },
  { label: 'Let&apos;s review', message: "Should we review what we covered?" },
  { label: 'Wrapping up', message: "I need to wrap up soon. Good session! 👋" },
];

// Types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  reactions?: Record<string, string[]>; // emoji -> userIds
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  attachments?: {
    id: string;
    name: string;
    type: 'image' | 'file' | 'audio';
    url: string;
    size?: number;
  }[];
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'typing' | 'away' | 'offline';
  lastSeen?: Date;
}

export interface ChatRoomProps {
  className?: string;
  roomId: string;
  currentUserId: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  isLoading?: boolean;
  onSendMessage: (content: string, replyToId?: string) => Promise<void>;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onPinMessage?: (messageId: string) => Promise<void>;
  onStartCall?: (type: 'voice' | 'video') => void;
  onTyping?: (isTyping: boolean) => void;
  maxHeight?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function ChatRoom({
  className,
  roomId,
  currentUserId,
  participants,
  messages,
  isLoading = false,
  onSendMessage,
  onReaction,
  onDeleteMessage,
  onPinMessage,
  onStartCall,
  onTyping,
  maxHeight = '600px',
  showHeader = true,
  compact = false,
}: ChatRoomProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get other participant (for 1:1 chat display)
  const otherParticipant = useMemo(
    () => participants.find((p) => p.id !== currentUserId),
    [participants, currentUserId]
  );

  // Filter messages by search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(query) ||
        m.senderName.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';

    filteredMessages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      let dateLabel: string;

      if (isToday(messageDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(messageDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(messageDate, 'MMMM d, yyyy');
      }

      if (dateLabel !== currentDate) {
        groups.push({ date: dateLabel, messages: [message] });
        currentDate = dateLabel;
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  }, [filteredMessages]);

  // Typing indicator
  const typingParticipants = useMemo(
    () =>
      participants.filter((p) => p.id !== currentUserId && p.status === 'typing'),
    [participants, currentUserId]
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollDown) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, showScrollDown]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollDown(false);
  }, []);

  // Handle input change with typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);

      // Trigger typing indicator
      if (onTyping) {
        onTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 2000);
      }
    },
    [onTyping]
  );

  // Send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(inputValue.trim(), replyTo?.id);
      setInputValue('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [inputValue, isSending, onSendMessage, replyTo]);

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Quick message handler
  const handleQuickMessage = useCallback(
    async (message: string) => {
      setIsSending(true);
      try {
        await onSendMessage(message);
      } catch (error) {
        console.error('Failed to send quick message:', error);
      } finally {
        setIsSending(false);
      }
    },
    [onSendMessage]
  );

  // Get status icon
  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-zinc-500" />;
      case 'sent':
        return <Check className="h-3 w-3 text-zinc-500" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-zinc-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 shadow-2xl backdrop-blur-xl',
        className
      )}
      style={{ height: maxHeight }}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            {otherParticipant && (
              <>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherParticipant.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {otherParticipant.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900',
                      otherParticipant.status === 'online'
                        ? 'bg-emerald-500'
                        : otherParticipant.status === 'typing'
                          ? 'bg-blue-500'
                          : otherParticipant.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-zinc-500'
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-100">
                    {otherParticipant.name}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {otherParticipant.status === 'online'
                      ? 'Online'
                      : otherParticipant.status === 'typing'
                        ? 'Typing...'
                        : otherParticipant.lastSeen
                          ? `Last seen ${formatDistanceToNow(otherParticipant.lastSeen, { addSuffix: true })}`
                          : 'Offline'}
                  </p>
                </div>
              </>
            )}
            {participants.length > 2 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((p) => (
                    <Avatar key={p.id} className="h-8 w-8 border-2 border-zinc-900">
                      <AvatarImage src={p.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xs text-white">
                        {p.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-zinc-400">
                  {participants.length} participants
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSearch(!showSearch)}
                    className={cn(
                      'h-9 w-9 text-zinc-400 hover:text-zinc-100',
                      showSearch && 'bg-zinc-800 text-zinc-100'
                    )}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onStartCall && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onStartCall('voice')}
                        className="h-9 w-9 text-zinc-400 hover:text-emerald-400"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice call</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onStartCall('video')}
                        className="h-9 w-9 text-zinc-400 hover:text-blue-400"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video call</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-zinc-800 bg-zinc-900"
              >
                <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                  Mute notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                  Clear chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-zinc-800/40 px-4 py-2"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 border-zinc-800/60 bg-zinc-900/50 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-zinc-500"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-1 text-xs text-zinc-500">
                {filteredMessages.length} results found
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1"
        onScroll={handleScroll as unknown as React.UIEventHandler<HTMLDivElement>}
      >
        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p className="text-sm">Loading messages...</p>
            </div>
          ) : groupedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                <Send className="h-8 w-8 text-indigo-400" />
              </div>
              <h4 className="mb-1 text-sm font-medium text-zinc-300">
                Start the conversation
              </h4>
              <p className="text-xs text-zinc-500">
                Send a message to begin your study session
              </p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800/60" />
                  <Badge
                    variant="outline"
                    className="border-zinc-700/50 px-3 py-1 text-xs text-zinc-500"
                  >
                    {group.date}
                  </Badge>
                  <div className="h-px flex-1 bg-zinc-800/60" />
                </div>

                {/* Messages in group */}
                <div className="space-y-2">
                  {group.messages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const showAvatar =
                      index === 0 ||
                      group.messages[index - 1].senderId !== message.senderId;

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        compact={compact}
                        onReply={() => setReplyTo(message)}
                        onReaction={onReaction}
                        onDelete={onDeleteMessage}
                        onPin={onPinMessage}
                        getStatusIcon={getStatusIcon}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {typingParticipants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-2 px-2"
              >
                <div className="flex items-center gap-1 rounded-2xl bg-zinc-800/50 px-3 py-2">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500" />
                  </span>
                </div>
                <span className="text-xs text-zinc-500">
                  {typingParticipants.map((p) => p.name).join(', ')}{' '}
                  {typingParticipants.length === 1 ? 'is' : 'are'} typing...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToBottom}
              className="gap-2 rounded-full border-zinc-700/50 bg-zinc-800/90 text-zinc-300 shadow-lg backdrop-blur-sm hover:bg-zinc-700"
            >
              <ChevronDown className="h-4 w-4" />
              New messages
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-800/40 bg-zinc-900/50 px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-indigo-400" />
                <div className="border-l-2 border-indigo-500/50 pl-2">
                  <p className="text-xs font-medium text-indigo-400">
                    {replyTo.senderName}
                  </p>
                  <p className="line-clamp-1 text-xs text-zinc-500">
                    {replyTo.content}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 text-zinc-500 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="border-t border-zinc-800/60 p-4">
        {/* Quick messages */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
          {QUICK_MESSAGES.map((qm) => (
            <Button
              key={qm.label}
              variant="outline"
              size="sm"
              onClick={() => handleQuickMessage(qm.message)}
              disabled={isSending}
              className="shrink-0 border-zinc-700/50 bg-zinc-800/30 text-xs text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            >
              {qm.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-100"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto border-zinc-800 bg-zinc-900 p-2"
            >
              <div className="flex gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setInputValue((prev) => prev + emoji)}
                    className="rounded p-1.5 text-lg hover:bg-zinc-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-zinc-400 hover:text-zinc-100"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className="flex-1 border-zinc-800/60 bg-zinc-900/50 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          />

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 p-0 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  compact: boolean;
  onReply: () => void;
  onReaction: (messageId: string, emoji: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onPin?: (messageId: string) => Promise<void>;
  getStatusIcon: (status: MessageStatus) => React.ReactNode;
}

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  compact,
  onReply,
  onReaction,
  onDelete,
  onPin,
  getStatusIcon,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('group flex gap-2', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isOwn && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs text-white">
              {message.senderName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
        {/* Sender name (for group chats) */}
        {showAvatar && !isOwn && !compact && (
          <p className="mb-1 text-xs font-medium text-zinc-400">
            {message.senderName}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={cn(
              'mb-1 rounded-lg border-l-2 border-indigo-500/50 bg-zinc-800/30 px-2 py-1',
              isOwn ? 'text-right' : 'text-left'
            )}
          >
            <p className="text-[10px] font-medium text-indigo-400">
              {message.replyTo.senderName}
            </p>
            <p className="line-clamp-1 text-xs text-zinc-500">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Pinned indicator */}
        {message.isPinned && (
          <div className="mb-1 flex items-center gap-1 text-amber-400">
            <Pin className="h-3 w-3" />
            <span className="text-[10px]">Pinned</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-2',
            isOwn
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-zinc-800/80 text-zinc-100'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 rounded-lg bg-black/20 p-2"
                >
                  {attachment.type === 'image' ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : attachment.type === 'audio' ? (
                    <Mic className="h-4 w-4" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <span className="text-xs">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.entries(message.reactions).map(([emoji, userIds]) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                    isOwn
                      ? 'bg-white/20 hover:bg-white/30'
                      : 'bg-zinc-700/50 hover:bg-zinc-700'
                  )}
                >
                  {emoji}
                  <span>{userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and status */}
        <div
          className={cn(
            'mt-1 flex items-center gap-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] text-zinc-600">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
          {message.isEdited && (
            <span className="text-[10px] text-zinc-600">(edited)</span>
          )}
          {isOwn && getStatusIcon(message.status)}
        </div>
      </div>

      {/* Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-1 self-center"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
                >
                  <Smile className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="w-auto border-zinc-800 bg-zinc-900 p-1"
              >
                <div className="flex gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(message.id, emoji)}
                      className="rounded p-1 text-sm hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={onReply}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
            >
              <Reply className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isOwn ? 'end' : 'start'}
                className="w-40 border-zinc-800 bg-zinc-900"
              >
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy
                </DropdownMenuItem>
                {onPin && (
                  <DropdownMenuItem
                    onClick={() => onPin(message.id)}
                    className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    <Pin className="mr-2 h-3.5 w-3.5" />
                    {message.isPinned ? 'Unpin' : 'Pin'}
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => onDelete(message.id)}
                      className="text-rose-400 focus:bg-zinc-800 focus:text-rose-300"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ChatRoom;
