'use client';

/**
 * StudyBuddyFinder
 *
 * Presence-based study buddy matching component.
 * Helps learners find and connect with study partners based on
 * shared courses, learning goals, and availability.
 *
 * Features:
 * - Real-time presence awareness
 * - Course/topic matching
 * - Availability indicators
 * - Quick connect actions
 * - Compatibility scoring
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Users,
  Search,
  MessageSquare,
  UserPlus,
  BookOpen,
  Clock,
  Star,
  Sparkles,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Circle,
  Zap,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type BuddyStatus = 'online' | 'studying' | 'away' | 'offline';
export type MatchReason = 'same_course' | 'similar_goal' | 'same_topic' | 'complementary_skills';

export interface StudyBuddy {
  id: string;
  name: string;
  avatar?: string;
  status: BuddyStatus;
  currentActivity?: string;
  sharedCourses: string[];
  sharedTopics: string[];
  compatibilityScore: number; // 0-100
  matchReasons: MatchReason[];
  lastActive?: string;
  studyStreak?: number;
}

export interface StudyBuddyFinderProps {
  className?: string;
  /** Maximum buddies to display */
  limit?: number;
  /** Filter by status */
  statusFilter?: BuddyStatus | 'all';
  /** Minimum compatibility score */
  minCompatibility?: number;
  /** Compact mode */
  compact?: boolean;
  /** On buddy click callback */
  onBuddyClick?: (buddy: StudyBuddy) => void;
  /** On connect click callback */
  onConnect?: (buddyId: string) => void;
  /** On message click callback */
  onMessage?: (buddyId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  BuddyStatus,
  { label: string; color: string; icon: typeof Circle }
> = {
  online: {
    label: 'Online',
    color: 'bg-green-500',
    icon: Circle,
  },
  studying: {
    label: 'Studying',
    color: 'bg-blue-500',
    icon: BookOpen,
  },
  away: {
    label: 'Away',
    color: 'bg-amber-500',
    icon: Clock,
  },
  offline: {
    label: 'Offline',
    color: 'bg-gray-400',
    icon: Circle,
  },
};

const MATCH_REASON_CONFIG: Record<
  MatchReason,
  { label: string; icon: typeof BookOpen }
> = {
  same_course: {
    label: 'Same Course',
    icon: BookOpen,
  },
  similar_goal: {
    label: 'Similar Goal',
    icon: Star,
  },
  same_topic: {
    label: 'Same Topic',
    icon: Zap,
  },
  complementary_skills: {
    label: 'Complementary Skills',
    icon: Sparkles,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatLastActive(dateString?: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function getCompatibilityColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
  if (score >= 40) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
  return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
}

// ============================================================================
// COMPONENTS
// ============================================================================

function BuddySkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

function BuddyCard({
  buddy,
  compact,
  onBuddyClick,
  onConnect,
  onMessage,
}: {
  buddy: StudyBuddy;
  compact: boolean;
  onBuddyClick?: () => void;
  onConnect?: () => void;
  onMessage?: () => void;
}) {
  const statusConfig = STATUS_CONFIG[buddy.status];
  const compatibilityColor = getCompatibilityColor(buddy.compatibilityScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        'border rounded-lg transition-colors cursor-pointer',
        'hover:border-indigo-200 dark:hover:border-indigo-800',
        'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
      )}
      onClick={onBuddyClick}
    >
      <div className={cn('p-3', compact ? 'space-y-2' : 'space-y-3')}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className={compact ? 'h-8 w-8' : 'h-10 w-10'}>
              <AvatarImage src={buddy.avatar} alt={buddy.name} />
              <AvatarFallback className="text-xs">
                {getInitials(buddy.name)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900',
                statusConfig.color
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{buddy.name}</span>
              {buddy.studyStreak && buddy.studyStreak > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 text-amber-600"
                      >
                        🔥 {buddy.studyStreak}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{buddy.studyStreak} day study streak!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {buddy.status === 'studying' && buddy.currentActivity
                ? buddy.currentActivity
                : statusConfig.label}
            </p>
          </div>

          <Badge variant="outline" className={cn('text-xs', compatibilityColor)}>
            {buddy.compatibilityScore}% match
          </Badge>
        </div>

        {/* Match reasons */}
        {!compact && buddy.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {buddy.matchReasons.slice(0, 3).map((reason) => {
              const config = MATCH_REASON_CONFIG[reason];
              const Icon = config.icon;
              return (
                <Badge
                  key={reason}
                  variant="secondary"
                  className="text-xs gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        )}

        {/* Shared courses/topics */}
        {!compact && (buddy.sharedCourses.length > 0 || buddy.sharedTopics.length > 0) && (
          <div className="text-xs text-muted-foreground">
            {buddy.sharedCourses.length > 0 && (
              <p className="truncate">
                📚 {buddy.sharedCourses.slice(0, 2).join(', ')}
                {buddy.sharedCourses.length > 2 && ` +${buddy.sharedCourses.length - 2}`}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {formatLastActive(buddy.lastActive)}
          </span>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage?.();
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConnect?.();
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connect as study buddy</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyBuddyFinder({
  className,
  limit = 10,
  statusFilter = 'all',
  minCompatibility = 0,
  compact = false,
  onBuddyClick,
  onConnect,
  onMessage,
}: StudyBuddyFinderProps) {
  const [buddies, setBuddies] = useState<StudyBuddy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<BuddyStatus | 'all'>(statusFilter);

  const fetchBuddies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        minCompatibility: minCompatibility.toString(),
      });
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/sam/presence/buddies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch study buddies');

      const data = await response.json();
      if (data.success && data.data?.buddies) {
        setBuddies(data.data.buddies);
      } else {
        setBuddies([]);
      }
    } catch (err) {
      console.error('[StudyBuddyFinder] Fetch error:', err);
      setError('Failed to load study buddies');
    } finally {
      setIsLoading(false);
    }
  }, [limit, filter, minCompatibility]);

  useEffect(() => {
    fetchBuddies();
  }, [fetchBuddies]);

  const filteredBuddies = useMemo(() => {
    let result = buddies;

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter((b) => b.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.sharedCourses.some((c) => c.toLowerCase().includes(query)) ||
          b.sharedTopics.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Sort by compatibility score (descending)
    result.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return result;
  }, [buddies, filter, searchQuery]);

  const stats = useMemo(() => {
    const online = buddies.filter(
      (b) => b.status === 'online' || b.status === 'studying'
    ).length;
    const highMatch = buddies.filter((b) => b.compatibilityScore >= 70).length;
    return { total: buddies.length, online, highMatch };
  }, [buddies]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base">Study Buddies</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchBuddies}
            disabled={isLoading}
            className="h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          {stats.online} online • {stats.highMatch} high matches
        </CardDescription>
      </CardHeader>

      {/* Search and filters */}
      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, course, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-full">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CardContent className="pt-0">
        {error ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="ghost" size="sm" onClick={fetchBuddies} className="mt-2">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <BuddySkeleton key={i} />
            ))}
          </div>
        ) : filteredBuddies.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'No buddies match your search'
                : 'No study buddies found'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
            <div className="space-y-2 pr-4">
              <AnimatePresence mode="popLayout">
                {filteredBuddies.map((buddy) => (
                  <BuddyCard
                    key={buddy.id}
                    buddy={buddy}
                    compact={compact}
                    onBuddyClick={() => onBuddyClick?.(buddy)}
                    onConnect={() => onConnect?.(buddy.id)}
                    onMessage={() => onMessage?.(buddy.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        {/* Quick stats footer */}
        {!isLoading && filteredBuddies.length > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />
              {stats.online} available now
            </span>
            <span>
              <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
              {stats.highMatch} great matches
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudyBuddyFinder;
