'use client';

/**
 * StudyBuddyChat Component
 *
 * Comprehensive study buddy collaboration interface combining
 * real-time chat, study sessions, and buddy discovery.
 *
 * @module components/sam/study-buddy-chat/StudyBuddyChat
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Users,
  MessageSquare,
  BookOpen,
  Search,
  Plus,
  ChevronLeft,
  Settings,
  Bell,
  BellOff,
  UserPlus,
  X,
  Video,
  Phone,
  Loader2,
  Sparkles,
  Timer,
  Target,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useRealtime } from '@sam-ai/react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ChatRoom, type ChatMessage, type ChatParticipant } from './ChatRoom';
import { StudySession, type StudySessionData, type SessionStatus } from './StudySession';

// Types
export interface StudyBuddy {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'studying' | 'away' | 'offline';
  currentActivity?: string;
  compatibilityScore: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    unread: boolean;
  };
}

export interface Conversation {
  id: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  session?: StudySessionData;
  lastActivity: Date;
  unreadCount: number;
}

export interface StudyBuddyChatProps {
  className?: string;
  defaultConversationId?: string;
  showBuddyFinder?: boolean;
  onStartSession?: (buddyIds: string[]) => Promise<string>;
}

export function StudyBuddyChat({
  className,
  defaultConversationId,
  showBuddyFinder = true,
  onStartSession,
}: StudyBuddyChatProps) {
  const user = useCurrentUser();
  const { connectionState, isConnected } = useRealtime();

  // State
  const [activeTab, setActiveTab] = useState<'chats' | 'discover'>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    defaultConversationId ?? null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedBuddies, setSelectedBuddies] = useState<string[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load conversations and buddies
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load conversations
        const convResponse = await fetch('/api/sam/agentic/collaboration?action=get-session');
        if (convResponse.ok) {
          const convData = await convResponse.json();
          if (convData.success && convData.data?.session) {
            // Transform to our format
            setConversations([
              {
                id: convData.data.session.id,
                participants: convData.data.session.collaborators.map((c: { id: string; name: string; avatar?: string; isOnline?: boolean }) => ({
                  id: c.id,
                  name: c.name,
                  avatar: c.avatar,
                  status: c.isOnline ? 'online' : 'offline',
                })),
                messages: [],
                lastActivity: new Date(convData.data.session.createdAt),
                unreadCount: 0,
              },
            ]);
          }
        }

        // Load buddies
        const buddiesResponse = await fetch('/api/sam/presence/buddies');
        if (buddiesResponse.ok) {
          const buddiesData = await buddiesResponse.json();
          if (buddiesData.success && buddiesData.data) {
            // API returns { data: { buddies: [...], meta: {...} } }
            const buddyArray = Array.isArray(buddiesData.data.buddies)
              ? buddiesData.data.buddies
              : Array.isArray(buddiesData.data)
                ? buddiesData.data
                : [];
            setBuddies(buddyArray);
          }
        }
      } catch (error) {
        console.error('Failed to load study buddy data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.participants.some(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          c.messages.some((m) => m.content.toLowerCase().includes(query))
      )
    );
  }, [conversations, searchQuery]);

  // Filter buddies by search
  const filteredBuddies = useMemo(() => {
    const buddyArray = Array.isArray(buddies) ? buddies : [];
    if (!searchQuery.trim()) return buddyArray;
    const query = searchQuery.toLowerCase();
    return buddyArray.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.currentActivity?.toLowerCase().includes(query)
    );
  }, [buddies, searchQuery]);

  // Get active conversation data
  const activeConvo = useMemo(
    () => conversations.find((c) => c.id === activeConversation),
    [conversations, activeConversation]
  );

  // Handlers
  const handleSendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!activeConversation || !user?.id) return;

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        senderName: user.name ?? 'You',
        senderAvatar: user.image ?? undefined,
        content,
        timestamp: new Date(),
        status: 'sending',
        replyTo: replyToId
          ? activeConvo?.messages.find((m) => m.id === replyToId)
            ? {
                id: replyToId,
                senderName:
                  activeConvo?.messages.find((m) => m.id === replyToId)
                    ?.senderName ?? '',
                content:
                  activeConvo?.messages.find((m) => m.id === replyToId)
                    ?.content ?? '',
              }
            : undefined
          : undefined,
      };

      // Optimistically add message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation
            ? { ...c, messages: [...c.messages, newMessage] }
            : c
        )
      );

      try {
        // Record activity
        await fetch('/api/sam/agentic/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'record',
            sessionId: activeConversation,
            activityType: 'message',
            target: content,
          }),
        });

        // Update message status
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === newMessage.id ? { ...m, status: 'sent' as const } : m
                  ),
                }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to send message:', error);
        // Update message status to failed
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === newMessage.id ? { ...m, status: 'failed' as const } : m
                  ),
                }
              : c
          )
        );
      }
    },
    [activeConversation, activeConvo?.messages, user]
  );

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!activeConversation || !user?.id) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation
          ? {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== messageId) return m;
                const reactions = { ...m.reactions };
                if (!reactions[emoji]) {
                  reactions[emoji] = [user.id!];
                } else if (reactions[emoji].includes(user.id!)) {
                  reactions[emoji] = reactions[emoji].filter((id) => id !== user.id);
                  if (reactions[emoji].length === 0) delete reactions[emoji];
                } else {
                  reactions[emoji].push(user.id!);
                }
                return { ...m, reactions };
              }),
            }
          : c
      )
    );
  }, [activeConversation, user?.id]);

  const handleStartConversation = useCallback(
    async (buddyId: string) => {
      const buddy = buddies.find((b) => b.id === buddyId);
      if (!buddy || !user?.id) return;

      // Check if conversation already exists
      const existing = conversations.find((c) =>
        c.participants.some((p) => p.id === buddyId)
      );
      if (existing) {
        setActiveConversation(existing.id);
        return;
      }

      // Create new conversation
      try {
        const response = await fetch('/api/sam/agentic/collaboration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            name: `Study Session with ${buddy.name}`,
            description: `Collaborative study session`,
            contentType: 'DOCUMENT',
            contentId: `study-${Date.now()}`,
            sessionType: 'study',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.session) {
            const newConvo: Conversation = {
              id: data.data.session.id,
              participants: [
                {
                  id: user.id,
                  name: user.name ?? 'You',
                  avatar: user.image ?? undefined,
                  status: 'online',
                },
                {
                  id: buddy.id,
                  name: buddy.name,
                  avatar: buddy.avatar,
                  status: buddy.status === 'studying' ? 'online' : buddy.status,
                },
              ],
              messages: [],
              lastActivity: new Date(),
              unreadCount: 0,
            };
            setConversations((prev) => [newConvo, ...prev]);
            setActiveConversation(newConvo.id);
            toast.success(`Started conversation with ${buddy.name}`);
          }
        }
      } catch (error) {
        console.error('Failed to start conversation:', error);
        toast.error('Failed to start conversation');
      }
    },
    [buddies, conversations, user]
  );

  const handleCreateGroupSession = useCallback(async () => {
    if (selectedBuddies.length === 0 || !user?.id) return;

    try {
      const selectedNames = selectedBuddies
        .map((id) => buddies.find((b) => b.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const response = await fetch('/api/sam/agentic/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: `Group Study: ${selectedNames}`,
          description: 'Collaborative group study session',
          contentType: 'DOCUMENT',
          contentId: `group-${Date.now()}`,
          sessionType: 'group_study',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.session) {
          const participants: ChatParticipant[] = [
            {
              id: user.id,
              name: user.name ?? 'You',
              avatar: user.image ?? undefined,
              status: 'online',
            },
            ...selectedBuddies.map((id) => {
              const buddy = buddies.find((b) => b.id === id)!;
              return {
                id: buddy.id,
                name: buddy.name,
                avatar: buddy.avatar,
                status: (buddy.status === 'studying' ? 'online' : buddy.status) as ChatParticipant['status'],
              };
            }),
          ];

          const newConvo: Conversation = {
            id: data.data.session.id,
            participants,
            messages: [],
            lastActivity: new Date(),
            unreadCount: 0,
          };
          setConversations((prev) => [newConvo, ...prev]);
          setActiveConversation(newConvo.id);
          setSelectedBuddies([]);
          setShowNewSession(false);
          toast.success('Group study session created!');
        }
      }
    } catch (error) {
      console.error('Failed to create group session:', error);
      toast.error('Failed to create group session');
    }
  }, [selectedBuddies, buddies, user]);

  // Render conversation list item
  const renderConversationItem = (convo: Conversation) => {
    const otherParticipants = convo.participants.filter(
      (p) => p.id !== user?.id
    );
    const displayName =
      otherParticipants.length === 1
        ? otherParticipants[0].name
        : `${otherParticipants[0]?.name} + ${otherParticipants.length - 1}`;

    return (
      <button
        key={convo.id}
        onClick={() => setActiveConversation(convo.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200',
          activeConversation === convo.id
            ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30'
            : 'hover:bg-zinc-800/50'
        )}
      >
        {otherParticipants.length === 1 ? (
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherParticipants[0].avatar} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {otherParticipants[0].name[0]}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900',
                otherParticipants[0].status === 'online'
                  ? 'bg-emerald-500'
                  : otherParticipants[0].status === 'typing'
                    ? 'bg-blue-500'
                    : 'bg-zinc-500'
              )}
            />
          </div>
        ) : (
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="flex -space-x-3">
              {otherParticipants.slice(0, 2).map((p, i) => (
                <Avatar
                  key={p.id}
                  className={cn('h-8 w-8 border-2 border-zinc-900', i > 0 && '-ml-3')}
                >
                  <AvatarImage src={p.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs text-white">
                    {p.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="truncate text-sm font-medium text-zinc-100">
              {displayName}
            </h4>
            {convo.unreadCount > 0 && (
              <Badge className="ml-2 h-5 min-w-[20px] rounded-full bg-indigo-500 px-1.5 text-[10px] text-white">
                {convo.unreadCount}
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-zinc-500">
            {convo.messages.length > 0
              ? convo.messages[convo.messages.length - 1].content
              : 'No messages yet'}
          </p>
        </div>
      </button>
    );
  };

  // Render buddy item
  const renderBuddyItem = (buddy: StudyBuddy) => (
    <button
      key={buddy.id}
      onClick={() => handleStartConversation(buddy.id)}
      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 hover:bg-zinc-800/50"
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={buddy.avatar} />
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            {buddy.name[0]}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900',
            buddy.status === 'online'
              ? 'bg-emerald-500'
              : buddy.status === 'studying'
                ? 'bg-blue-500'
                : buddy.status === 'away'
                  ? 'bg-amber-500'
                  : 'bg-zinc-500'
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="truncate text-sm font-medium text-zinc-100">
            {buddy.name}
          </h4>
          <Badge
            variant="outline"
            className={cn(
              'ml-2 border-transparent px-2 py-0 text-[10px]',
              buddy.compatibilityScore >= 80
                ? 'bg-emerald-500/10 text-emerald-400'
                : buddy.compatibilityScore >= 60
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-zinc-500/10 text-zinc-400'
            )}
          >
            {buddy.compatibilityScore}% match
          </Badge>
        </div>
        <p className="truncate text-xs text-zinc-500">
          {buddy.currentActivity ?? buddy.status}
        </p>
      </div>
    </button>
  );

  return (
    <div
      className={cn(
        'flex h-full overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/98 to-zinc-950/98 shadow-2xl backdrop-blur-xl',
        className
      )}
    >
      {/* Sidebar */}
      <AnimatePresence>
        {(!isMobileView || !activeConversation) && (
          <motion.div
            initial={isMobileView ? { x: -100, opacity: 0 } : false}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className={cn(
              'flex flex-col border-r border-zinc-800/60',
              isMobileView ? 'w-full' : 'w-80'
            )}
          >
            {/* Sidebar Header */}
            <div className="border-b border-zinc-800/60 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-100">
                      Study Buddies
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {connectionState === 'connected' ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                      ) : (
                        'Connecting...'
                      )}
                    </p>
                  </div>
                </div>

                <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
                  <DialogTrigger asChild>
                    <Button
                      size="icon"
                      className="h-9 w-9 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md border-zinc-800 bg-zinc-900">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-100">
                        Create Group Study Session
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500">
                        Select buddies to invite to your study session
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <ScrollArea className="h-64">
                        <div className="space-y-2 pr-4">
                          {buddies
                            .filter((b) => b.status !== 'offline')
                            .map((buddy) => (
                              <button
                                key={buddy.id}
                                onClick={() =>
                                  setSelectedBuddies((prev) =>
                                    prev.includes(buddy.id)
                                      ? prev.filter((id) => id !== buddy.id)
                                      : [...prev, buddy.id]
                                  )
                                }
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg p-3 transition-all',
                                  selectedBuddies.includes(buddy.id)
                                    ? 'bg-indigo-500/10 border border-indigo-500/30'
                                    : 'hover:bg-zinc-800/50 border border-transparent'
                                )}
                              >
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={buddy.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                    {buddy.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium text-zinc-200">
                                    {buddy.name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {buddy.status}
                                  </p>
                                </div>
                                {selectedBuddies.includes(buddy.id) && (
                                  <Badge className="bg-indigo-500 text-white">
                                    Selected
                                  </Badge>
                                )}
                              </button>
                            ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedBuddies([]);
                          setShowNewSession(false);
                        }}
                        className="text-zinc-400"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateGroupSession}
                        disabled={selectedBuddies.length === 0}
                        className="bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        Create Session ({selectedBuddies.length})
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 border-zinc-800/60 bg-zinc-900/50 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'chats' | 'discover')}
              className="flex flex-1 flex-col"
            >
              <TabsList className="mx-4 mt-3 grid grid-cols-2 bg-zinc-800/50">
                <TabsTrigger
                  value="chats"
                  className="gap-2 data-[state=active]:bg-indigo-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chats
                </TabsTrigger>
                <TabsTrigger
                  value="discover"
                  className="gap-2 data-[state=active]:bg-indigo-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Discover
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="chats" className="m-0 p-4 pt-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                      <Loader2 className="mb-3 h-8 w-8 animate-spin" />
                      <p className="text-sm">Loading conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
                        <MessageSquare className="h-8 w-8 text-zinc-600" />
                      </div>
                      <h4 className="mb-1 text-sm font-medium text-zinc-400">
                        No conversations yet
                      </h4>
                      <p className="mb-4 text-xs text-zinc-500">
                        Find study buddies to start chatting
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('discover')}
                        className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        <UserPlus className="h-4 w-4" />
                        Find Buddies
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredConversations.map(renderConversationItem)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="discover" className="m-0 p-4 pt-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                      <Loader2 className="mb-3 h-8 w-8 animate-spin" />
                      <p className="text-sm">Finding study buddies...</p>
                    </div>
                  ) : filteredBuddies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
                        <Users className="h-8 w-8 text-zinc-600" />
                      </div>
                      <h4 className="mb-1 text-sm font-medium text-zinc-400">
                        No buddies found
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {searchQuery
                          ? 'Try a different search'
                          : 'Check back later for matches'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredBuddies.map(renderBuddyItem)}
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeConversation && activeConvo ? (
          <>
            {/* Mobile back button */}
            {isMobileView && (
              <div className="border-b border-zinc-800/60 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveConversation(null)}
                  className="gap-2 text-zinc-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            )}

            <ChatRoom
              className="flex-1 border-0 rounded-none shadow-none"
              roomId={activeConversation}
              currentUserId={user?.id ?? ''}
              participants={activeConvo.participants}
              messages={activeConvo.messages}
              onSendMessage={handleSendMessage}
              onReaction={handleReaction}
              onStartCall={(type) =>
                toast.info(`${type === 'video' ? 'Video' : 'Voice'} calls coming soon!`)
              }
              showHeader={!isMobileView}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Users className="h-12 w-12 text-indigo-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-zinc-100">
              Study Together
            </h3>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">
              Connect with study buddies, share resources, and learn together
              in real-time
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => setActiveTab('discover')}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500"
              >
                <UserPlus className="h-4 w-4" />
                Find Study Buddies
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewSession(true)}
                className="gap-2 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyBuddyChat;
