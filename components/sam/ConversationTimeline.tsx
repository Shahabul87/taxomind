'use client';

/**
 * ConversationTimeline Component
 *
 * A visual timeline for viewing conversation history with SAM.
 * Displays memory events, conversation summaries, and learning interactions.
 *
 * Features:
 * - Chronological conversation display
 * - Message grouping by session
 * - Memory search capabilities
 * - Session filtering
 * - Expandable conversation details
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  BookOpen,
  Brain,
  Sparkles,
  History,
  XCircle,
  MessageCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ConversationMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL' | 'SAM';
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
  tokenCount?: number;
  intent?: string;
  sentiment?: number;
}

interface ConversationSession {
  id: string;
  sessionId: string;
  courseId?: string;
  courseName?: string;
  chapterId?: string;
  chapterName?: string;
  startedAt: Date;
  messageCount: number;
  messages: ConversationMessage[];
  summary?: string;
  topics?: string[];
}

interface ConversationSummary {
  id: string;
  title?: string;
  courseId?: string;
  chapterId?: string;
  startedAt: Date;
  messageCount: number;
  lastMessage?: string;
  topics?: string[];
}

interface ConversationTimelineProps {
  className?: string;
  courseId?: string;
  chapterId?: string;
  maxSessions?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  compact?: boolean;
  onSessionSelect?: (session: ConversationSession) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_STYLES: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  USER: {
    icon: User,
    bg: 'bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-300',
    label: 'You',
  },
  ASSISTANT: {
    icon: Bot,
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    label: 'SAM',
  },
  SAM: {
    icon: Bot,
    bg: 'bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-300',
    label: 'SAM',
  },
  SYSTEM: {
    icon: Sparkles,
    bg: 'bg-gray-500/10',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'System',
  },
  TOOL: {
    icon: Layers,
    bg: 'bg-green-500/10',
    text: 'text-green-700 dark:text-green-300',
    label: 'Tool',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MessageBubble({ message, compact = false }: { message: ConversationMessage; compact?: boolean }) {
  const style = ROLE_STYLES[message.role] ?? ROLE_STYLES.SYSTEM;
  const Icon = style.icon;
  const isUser = message.role === 'USER';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', style.bg)}>
        <Icon className={cn('w-4 h-4', style.text)} />
      </div>
      <div className={cn('flex-1 max-w-[80%]', isUser && 'text-right')}>
        <div className={cn('flex items-center gap-2 mb-1', isUser && 'flex-row-reverse')}>
          <span className={cn('text-xs font-medium', style.text)}>{style.label}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(message.createdAt)}</span>
          {message.intent && (
            <Badge variant="outline" className="text-xs">
              {message.intent}
            </Badge>
          )}
        </div>
        <div
          className={cn(
            'rounded-xl p-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-none'
              : 'bg-muted rounded-tl-none'
          )}
        >
          {compact ? truncateText(message.content, 200) : message.content}
        </div>
        {message.sentiment !== undefined && (
          <div className="mt-1">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                message.sentiment > 0.3 && 'bg-green-500/10 text-green-700',
                message.sentiment < -0.3 && 'bg-red-500/10 text-red-700'
              )}
            >
              {message.sentiment > 0.3 ? 'Positive' : message.sentiment < -0.3 ? 'Negative' : 'Neutral'}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
  onSelect,
  compact = false,
}: {
  session: ConversationSession;
  expanded: boolean;
  onToggle: () => void;
  onSelect?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/30">
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium truncate">
                    {session.courseName ?? 'General Conversation'}
                  </span>
                  {session.chapterName && (
                    <>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">
                        {session.chapterName}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(session.startedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {session.messageCount} messages
                  </span>
                </div>
                {session.summary && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {session.summary}
                  </p>
                )}
                {session.topics && session.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.topics.slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {session.topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{session.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {onSelect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                  >
                    View
                  </Button>
                )}
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4 py-4">
                {session.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} compact={compact} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConversationTimeline({
  className,
  courseId,
  chapterId,
  maxSessions = 20,
  showSearch = true,
  showFilters = true,
  compact = false,
  onSessionSelect,
}: ConversationTimelineProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Fetch conversation summaries
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (chapterId) params.append('chapterId', chapterId);
      params.append('limit', String(maxSessions));

      const response = await fetch(`/api/sam/conversations/summaries?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to fetch conversations');
      }

      // Transform summaries to sessions
      const transformedSessions: ConversationSession[] = (data.data ?? []).map(
        (summary: ConversationSummary & { messages?: ConversationMessage[] }) => ({
          id: summary.id,
          sessionId: summary.id,
          courseId: summary.courseId,
          courseName: summary.title,
          chapterId: summary.chapterId,
          startedAt: new Date(summary.startedAt),
          messageCount: summary.messageCount ?? 0,
          messages: summary.messages ?? [],
          summary: summary.lastMessage,
          topics: summary.topics,
        })
      );

      setSessions(transformedSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId, maxSessions]);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let result = sessions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (session) =>
          session.courseName?.toLowerCase().includes(query) ||
          session.summary?.toLowerCase().includes(query) ||
          session.topics?.some((t) => t.toLowerCase().includes(query)) ||
          session.messages.some((m) => m.content.toLowerCase().includes(query))
      );
    }

    if (filterCourse !== 'all') {
      result = result.filter((session) => session.courseId === filterCourse);
    }

    return result;
  }, [sessions, searchQuery, filterCourse]);

  // Get unique courses for filter
  const uniqueCourses = useMemo(() => {
    const courses = new Map<string, string>();
    sessions.forEach((session) => {
      if (session.courseId && session.courseName) {
        courses.set(session.courseId, session.courseName);
      }
    });
    return Array.from(courses.entries());
  }, [sessions]);

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(filteredSessions.length / pageSize);
  const paginatedSessions = filteredSessions.slice(page * pageSize, (page + 1) * pageSize);

  // Handle session toggle
  const handleToggleSession = useCallback((sessionId: string) => {
    setExpandedSession((prev) => (prev === sessionId ? null : sessionId));
  }, []);

  // Loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Conversation Timeline
          </CardTitle>
          <CardDescription>Loading your conversation history...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SessionSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="font-medium text-lg mb-2">Failed to Load Timeline</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSessions} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Conversation Timeline
            </CardTitle>
            <CardDescription>
              {sessions.length} conversation{sessions.length !== 1 ? 's' : ''} in your history
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchSessions}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>

        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {showSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
            {showFilters && uniqueCourses.length > 0 && (
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No Conversations Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Start a conversation with SAM to see it here'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  expanded={expandedSession === session.id}
                  onToggle={() => handleToggleSession(session.id)}
                  onSelect={onSessionSelect ? () => onSessionSelect(session) : undefined}
                  compact={compact}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversationTimeline;
