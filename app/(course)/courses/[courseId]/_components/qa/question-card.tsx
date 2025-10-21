'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageCircle, Pin, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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
  };
  onClick?: () => void;
  onVote?: (value: number) => Promise<void>;
  isVoting?: boolean;
}

export const QuestionCard = ({
  question,
  onClick,
  onVote,
  isVoting = false,
}: QuestionCardProps) => {
  const [localUserVote, setLocalUserVote] = useState(question.userVote || 0);
  const [localUpvotes, setLocalUpvotes] = useState(question.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(question.downvotes);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        'p-6 hover:shadow-md transition-shadow cursor-pointer',
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
          {question.section && (
            <Badge variant="outline" className="text-xs">
              {question.section.title}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <MessageCircle className="w-4 h-4" />
          <span>{question._count.answers}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
        {question.title}
      </h3>

      {/* Content Preview */}
      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
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
            <span className="text-xs text-gray-500 dark:text-gray-400">
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
