'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Reply,
  Pin,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Discussion {
  id: string;
  content: string;
  userId: string;
  sectionId: string;
  parentId: string | null;
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  };
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: 'UPVOTE' | 'DOWNVOTE' | null;
  replies: Discussion[];
  _count: {
    replies: number;
  };
}

interface DiscussionForumProps {
  sectionId: string;
  userId: string | null;
  isEnrolled: boolean;
}

export function DiscussionForum({ sectionId, userId, isEnrolled }: DiscussionForumProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/sections/${sectionId}/discussions`);
      const data = await res.json();
      if (data.success) {
        setDiscussions(data.discussions);
      }
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
      toast.error('Failed to load discussions');
    } finally {
      setIsLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !userId) return;

    setIsPosting(true);
    try {
      const res = await fetch(`/api/sections/${sectionId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchDiscussions();
        toast.success('Comment posted!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to post comment');
      }
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !userId) return;

    setIsPosting(true);
    try {
      const res = await fetch(`/api/sections/${sectionId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId,
        }),
      });

      if (res.ok) {
        setReplyContent('');
        setReplyTo(null);
        fetchDiscussions();
        toast.success('Reply posted!');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to post reply');
      }
    } catch (error) {
      toast.error('Failed to post reply');
    } finally {
      setIsPosting(false);
    }
  };

  const handleVote = async (discussionId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!userId) {
      toast.error('You must be logged in to vote');
      return;
    }

    try {
      const res = await fetch(`/api/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (res.ok) {
        fetchDiscussions();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to vote');
      }
    } catch (error) {
      toast.error('Failed to vote');
    }
  };

  const renderDiscussion = (discussion: Discussion, isReply = false) => (
    <div
      key={discussion.id}
      className={cn(
        'p-4 rounded-lg space-y-3',
        isReply ? 'bg-slate-50 dark:bg-slate-800/50 ml-12' : 'bg-white dark:bg-slate-800 border'
      )}
    >
      {/* User Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={discussion.user.image || undefined} />
            <AvatarFallback>
              {discussion.user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {discussion.user.name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(discussion.createdAt), {
                addSuffix: true,
              })}
            </span>
            {discussion.isPinned && (
              <Badge variant="secondary" className="text-xs">
                <Pin className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            )}
            {discussion.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Report</DropdownMenuItem>
            {userId === discussion.userId && (
              <>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <p className="text-sm whitespace-pre-wrap">{discussion.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Voting */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={discussion.userVote === 'UPVOTE' ? 'default' : 'ghost'}
            onClick={() => handleVote(discussion.id, 'UPVOTE')}
            disabled={!userId || !isEnrolled}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {discussion.upvotes}
          </Button>
          <Button
            size="sm"
            variant={discussion.userVote === 'DOWNVOTE' ? 'default' : 'ghost'}
            onClick={() => handleVote(discussion.id, 'DOWNVOTE')}
            disabled={!userId || !isEnrolled}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {discussion.downvotes}
          </Button>
        </div>

        {/* Score */}
        <Badge variant="outline" className="text-xs">
          Score: {discussion.score}
        </Badge>

        {/* Reply Button */}
        {!isReply && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setReplyTo(discussion.id)}
            disabled={!userId || !isEnrolled}
          >
            <Reply className="h-4 w-4 mr-1" />
            Reply ({discussion._count.replies})
          </Button>
        )}
      </div>

      {/* Reply Form */}
      {replyTo === discussion.id && (
        <div className="ml-12 space-y-2 mt-4">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleReply(discussion.id)}
              disabled={isPosting || !replyContent.trim()}
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Reply
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReplyTo(null);
                setReplyContent('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="space-y-3 mt-4">
          {discussion.replies.map((reply) => renderDiscussion(reply, true))}
        </div>
      )}
    </div>
  );

  if (!isEnrolled && !userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussion
          </CardTitle>
          <CardDescription>
            Enroll in this course to participate in discussions
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Discussion ({discussions.length})
        </CardTitle>
        <CardDescription>
          Ask questions and share insights with fellow learners
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discussion List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-4">No discussions yet. Be the first to start a conversation!</p>
            {isEnrolled && userId && (
              <div className="max-w-md mx-auto space-y-2 text-left">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or share your thoughts..."
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={isPosting || !newComment.trim()}
                  size="sm"
                  className="w-full"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Start Discussion
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
          {/* New Comment Input — shown above existing discussions */}
          {isEnrolled && userId && (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask a question or share your thoughts..."
                rows={3}
                className="resize-none"
              />
              <Button
                onClick={handlePostComment}
                disabled={isPosting || !newComment.trim()}
                className="w-full"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
              <Separator />
            </div>
          )}
          <div className="space-y-4">
            {discussions.map((discussion) => renderDiscussion(discussion))}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
