'use client';

/**
 * SocialLearningFeed Component
 *
 * Social learning features and community engagement feed.
 *
 * Features:
 * - Learning achievement sharing
 * - Discussion threads
 * - Community challenges
 * - Knowledge sharing
 * - Peer interactions
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Heart,
  Share2,
  Award,
  BookOpen,
  Trophy,
  Target,
  RefreshCw,
  Loader2,
  ChevronRight,
  Plus,
  Send,
  AlertCircle,
  Sparkles,
  Clock,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Flag,
  Zap,
  Star,
  Users,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type PostType = 'achievement' | 'discussion' | 'question' | 'resource' | 'challenge';

interface FeedPost {
  id: string;
  type: PostType;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadge?: string;
  content: string;
  title?: string;
  media?: { type: 'image' | 'video'; url: string }[];
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  achievement?: {
    type: string;
    title: string;
    description: string;
    xp: number;
  };
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  reward: number;
  progress?: number;
  joined: boolean;
}

interface SocialLearningFeedProps {
  className?: string;
  compact?: boolean;
  filter?: PostType;
  onPostClick?: (post: FeedPost) => void;
  onChallengeJoin?: (challengeId: string) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POST_TYPE_CONFIG = {
  achievement: { icon: Trophy, color: 'text-yellow-500 bg-yellow-500/10', label: 'Achievement' },
  discussion: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/10', label: 'Discussion' },
  question: { icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10', label: 'Question' },
  resource: { icon: BookOpen, color: 'text-green-500 bg-green-500/10', label: 'Resource' },
  challenge: { icon: Target, color: 'text-orange-500 bg-orange-500/10', label: 'Challenge' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PostCard({
  post,
  onClick,
  onLike,
  onBookmark,
  onShare,
}: {
  post: FeedPost;
  onClick?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
}) {
  const config = POST_TYPE_CONFIG[post.type];
  const Icon = config.icon;
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-card border hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={post.authorAvatar} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {post.authorName.split(' ').map((n) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{post.authorName}</span>
            {post.authorBadge && (
              <Badge variant="secondary" className="text-xs">{post.authorBadge}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon className={cn('w-3 h-3', config.color.split(' ')[0])} />
              {config.label}
            </span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Achievement Banner */}
      {post.achievement && (
        <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-500/20">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <span className="font-semibold text-sm block">{post.achievement.title}</span>
              <span className="text-xs text-muted-foreground">{post.achievement.description}</span>
            </div>
            <Badge className="ml-auto bg-yellow-500/20 text-yellow-600">
              +{post.achievement.xp} XP
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      {post.title && (
        <h4 className="font-semibold mb-2 cursor-pointer hover:text-primary" onClick={onClick}>
          {post.title}
        </h4>
      )}
      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.content}</p>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-muted hover:bg-muted/80 cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-1', post.isLiked && 'text-red-500')}
            onClick={onLike}
          >
            <Heart className={cn('w-4 h-4', post.isLiked && 'fill-current')} />
            {post.likes}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            {post.comments}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={onShare}>
            <Share2 className="w-4 h-4" />
            {post.shares}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className={cn(post.isBookmarked && 'text-primary')}
          onClick={onBookmark}
        >
          <Bookmark className={cn('w-4 h-4', post.isBookmarked && 'fill-current')} />
        </Button>
      </div>
    </div>
  );
}

function ChallengeCard({
  challenge,
  onJoin,
}: {
  challenge: Challenge;
  onJoin?: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <Target className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{challenge.title}</span>
            <Badge className="bg-orange-500/20 text-orange-600 text-xs">
              {challenge.daysLeft}d left
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {challenge.participants} joined
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {challenge.reward} XP reward
            </span>
          </div>

          {challenge.joined && challenge.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Progress</span>
                <span>{challenge.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant={challenge.joined ? 'secondary' : 'default'}
          onClick={onJoin}
          disabled={challenge.joined}
        >
          {challenge.joined ? 'Joined' : 'Join'}
        </Button>
      </div>
    </div>
  );
}

function CreatePostInput({ onPost }: { onPost?: (content: string) => void }) {
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handlePost = () => {
    if (content.trim()) {
      onPost?.(content);
      setContent('');
      setExpanded(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-muted/30 border">
      {!expanded ? (
        <button
          className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded(true)}
        >
          Share your learning journey...
        </button>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an achievement, ask a question, or start a discussion..."
            className="min-h-[100px] resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Trophy className="w-4 h-4 mr-1" />
                Achievement
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-1" />
                Question
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handlePost} disabled={!content.trim()}>
                <Send className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTabs({
  selected,
  onSelect,
}: {
  selected: PostType | null;
  onSelect: (type: PostType | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Button
        variant={selected === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelect(null)}
      >
        All
      </Button>
      {(Object.entries(POST_TYPE_CONFIG) as [PostType, typeof POST_TYPE_CONFIG.achievement][]).map(
        ([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={selected === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelect(key)}
              className="gap-1 shrink-0"
            >
              <Icon className="w-3 h-3" />
              {config.label}
            </Button>
          );
        }
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SocialLearningFeed({
  className,
  compact = false,
  filter,
  onPostClick,
  onChallengeJoin,
}: SocialLearningFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<PostType | null>(filter || null);
  const isLoadingRef = useRef(false);

  const fetchFeed = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedFilter) params.append('type', selectedFilter);

      const [feedRes, challengesRes] = await Promise.all([
        fetch(`/api/sam/agentic/social/feed?${params}`),
        fetch('/api/sam/agentic/social/challenges?limit=3'),
      ]);

      const [feedData, challengesData] = await Promise.all([
        feedRes.json(),
        challengesRes.json(),
      ]);

      if (feedData.success) setPosts(feedData.data.posts || []);
      if (challengesData.success) setChallenges(challengesData.data.challenges || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [selectedFilter]);

  const handleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  const handleBookmark = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      )
    );
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading feed...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchFeed}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
              <MessageCircle className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Learning Community</CardTitle>
              <CardDescription>Share, discuss, and grow together</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchFeed}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Create Post */}
        {!compact && <CreatePostInput />}

        {/* Filter Tabs */}
        {!compact && <FilterTabs selected={selectedFilter} onSelect={setSelectedFilter} />}

        {/* Active Challenges */}
        {challenges.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Active Challenges
            </h4>
            <div className="space-y-2">
              {challenges.slice(0, compact ? 1 : 2).map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => onChallengeJoin?.(challenge.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feed Posts */}
        {posts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recent Activity
            </h4>
            <div className="space-y-3">
              {posts.slice(0, compact ? 3 : 10).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => onPostClick?.(post)}
                  onLike={() => handleLike(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                />
              ))}
            </div>
            {posts.length > (compact ? 3 : 10) && (
              <Button variant="ghost" className="w-full">
                Load more
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && challenges.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-pink-500/10 to-rose-500/10 mb-4">
              <MessageCircle className="w-10 h-10 text-pink-600" />
            </div>
            <h3 className="font-semibold mb-1">Join the Conversation</h3>
            <p className="text-sm text-muted-foreground max-w-[280px] mb-4">
              Share your achievements and connect with fellow learners.
            </p>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SocialLearningFeed;
