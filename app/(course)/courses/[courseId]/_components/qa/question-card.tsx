'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageCircle, Pin, Check, Bell, BellOff, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    content: string;
    upvotes: number;
    downvotes: number;
    isAnswered: boolean;
    isPinned: boolean;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    section?: {
      id: string;
      title: string;
    } | null;
    _count: {
      answers: number;
      votes: number;
    };
    userVote?: number;
    hasInstructorAnswer?: boolean;
    isSubscribed?: boolean;
  };
  onClick?: () => void;
  onVote?: (value: number) => Promise<void>;
  isVoting?: boolean;
  courseId?: string;
  isInstructor?: boolean;
  onPinChange?: (newPinned: boolean) => void;
}

export const QuestionCard = ({
  question,
  onClick,
  onVote,
  isVoting = false,
  courseId,
  isInstructor = false,
  onPinChange,
}: QuestionCardProps) => {
  const [localUserVote, setLocalUserVote] = useState(question.userVote || 0);
  const [localUpvotes, setLocalUpvotes] = useState(question.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(question.downvotes);
  const [subscribed, setSubscribed] = useState<boolean>(Boolean(question.isSubscribed));
  const [pinned, setPinned] = useState<boolean>(Boolean(question.isPinned));

  const handleVote = async (value: number) => {
    if (!onVote || isVoting) return;

    // Optimistic update
    const previousVote = localUserVote;
    const newVote = previousVote === value ? 0 : value;

    // Calculate vote changes
    let upvoteDelta = 0;
    let downvoteDelta = 0;

    if (previousVote === 1) upvoteDelta = -1;
    if (previousVote === -1) downvoteDelta = -1;
    if (newVote === 1) upvoteDelta += 1;
    if (newVote === -1) downvoteDelta += 1;

    setLocalUserVote(newVote);
    setLocalUpvotes((prev) => prev + upvoteDelta);
    setLocalDownvotes((prev) => prev + downvoteDelta);

    try {
      await onVote(newVote);
    } catch (error) {
      // Revert on error
      setLocalUserVote(previousVote);
      setLocalUpvotes(question.upvotes);
      setLocalDownvotes(question.downvotes);
    }
  };

  const netScore = localUpvotes - localDownvotes;

  const handleSubscribe = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/${question.id}/subscribe`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to subscribe');
      toast.success('Subscribed to updates for this question');
      setSubscribed(true);
    } catch (e) {
      toast.error('Failed to subscribe');
    }
  };

  const handleUnsubscribe = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/${question.id}/subscribe`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to unsubscribe');
      toast.success('Unsubscribed from this question');
      setSubscribed(false);
    } catch (e) {
      toast.error('Failed to unsubscribe');
    }
  };

  const handleReport = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/questions/${question.id}/report`, { method: 'POST', body: JSON.stringify({ reason: 'inappropriate' }), headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message || 'Failed to report');
      toast.success('Report submitted');
    } catch (e) {
      toast.error('Failed to report');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'p-6 transition-shadow cursor-pointer shadow-none md:hover:shadow-md',
        question.isPinned && 'border-l-4 border-l-purple-500'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {question.isPinned && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
              <Pin className="w-3 h-3 mr-1" />
              Pinned
            </Badge>
          )}
          {question.isAnswered && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
              <Check className="w-3 h-3 mr-1" />
              Answered
            </Badge>
          )}
          {'isLocked' in question && (question as any).isLocked && (
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
              🔒 Locked
            </Badge>
          )}
          {'mergedIntoId' in question && (question as any).mergedIntoId && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              Merged
            </Badge>
          )}
          {question.hasInstructorAnswer && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              Instructor Answered
            </Badge>
          )}
          {question.section && (
            <Badge variant="outline" className="text-xs">
              {question.section.title}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            <span>{question._count.answers}</span>
          </div>
          {subscribed ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleUnsubscribe(); }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
              aria-label="Unsubscribe"
              title="Unsubscribe"
            >
              <BellOff className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleSubscribe(); }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Subscribe to updates"
              title="Subscribe"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleReport(); }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Report question"
            title="Report"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
        {question.title}
      </h3>

      {/* Merged into link */}
      {courseId && ('mergedIntoId' in question) && (question as any).mergedIntoId && (
        <div className="mb-2 text-xs">
          <a
            href={`/courses/${courseId}/questions/${(question as any).mergedIntoId}`}
            className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Merged into → {(question as any).mergedIntoId}
          </a>
        </div>
      )}

      {/* Instructor moderation toolbar */}
      {isInstructor && courseId && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetch(`/api/courses/${courseId}/questions/${question.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPinned: !pinned }) })
                .then(async (res) => {
                  if (!res.ok) throw new Error((await res.json())?.error?.message || 'Failed');
                  setPinned(!pinned);
                  onPinChange?.(!pinned);
                })
                .catch(() => toast.error('Failed to update pin'));
            }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${pinned ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'}`}
            title={pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3 h-3" /> {pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!courseId) return;
              const next = !(question as any).isLocked;
              fetch(`/api/courses/${courseId}/questions/${question.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isLocked: next }) })
                .then(async (res) => {
                  if (!res.ok) throw new Error((await res.json())?.error?.message || 'Failed');
                  (question as any).isLocked = next;
                  toast.success(next ? 'Locked' : 'Unlocked');
                })
                .catch(() => toast.error('Failed to toggle lock'));
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
            title="Lock"
          >
            🔒 {('isLocked' in question && (question as any).isLocked) ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!courseId) return;
              const target = prompt('Enter target Question ID to merge into');
              if (!target) return;
              fetch(`/api/courses/${courseId}/questions/${question.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mergedIntoId: target }) })
                .then(async (res) => {
                  if (!res.ok) throw new Error((await res.json())?.error?.message || 'Failed');
                  (question as any).mergedIntoId = target;
                  toast.success('Merged');
                })
                .catch(() => toast.error('Failed to merge'));
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600"
            title="Merge"
          >
            🔗 Merge
          </button>
        </div>
      )}

      {/* Content Preview */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
        {question.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* User Info */}
        <div className="flex items-center gap-2">
          {question.user.image ? (
            <Image
              src={question.user.image}
              alt={question.user.name || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-300 text-sm font-medium">
                {question.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {question.user.name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Voting Controls */}
        {onVote && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2',
                localUserVote === 1 && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
              )}
              onClick={() => handleVote(1)}
              disabled={isVoting}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{localUpvotes}</span>
            </Button>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {netScore > 0 && '+'}
              {netScore}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2',
                localUserVote === -1 && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
              )}
              onClick={() => handleVote(-1)}
              disabled={isVoting}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{localDownvotes}</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
