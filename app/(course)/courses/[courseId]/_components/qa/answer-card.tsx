'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, CheckCircle2, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnswerCardProps {
  answer: {
    id: string;
    content: string;
    upvotes: number;
    downvotes: number;
    isInstructor: boolean;
    isBestAnswer: boolean;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    userVote?: number;
    canMarkBest?: boolean;
  };
  onVote?: (value: number) => Promise<void>;
  onMarkBest?: () => Promise<void>;
  isVoting?: boolean;
}

export const AnswerCard = ({
  answer,
  onVote,
  onMarkBest,
  isVoting = false,
}: AnswerCardProps) => {
  const [localUserVote, setLocalUserVote] = useState(answer.userVote || 0);
  const [localUpvotes, setLocalUpvotes] = useState(answer.upvotes);
  const [localDownvotes, setLocalDownvotes] = useState(answer.downvotes);

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
      setLocalUpvotes(answer.upvotes);
      setLocalDownvotes(answer.downvotes);
    }
  };

  const netScore = localUpvotes - localDownvotes;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
        answer.isBestAnswer && 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          {answer.user.image ? (
            <Image
              src={answer.user.image}
              alt={answer.user.name || 'User'}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-300 font-medium">
                {answer.user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}

          {/* User Info & Badges */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {answer.user.name || 'Anonymous'}
              </span>
              {answer.isInstructor && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  <Award className="w-3 h-3 mr-1" />
                  Instructor
                </Badge>
              )}
              {answer.isBestAnswer && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Best Answer
                </Badge>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Mark Best Answer Button */}
        {!answer.isBestAnswer && answer.canMarkBest && onMarkBest && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkBest}
            disabled={isVoting}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark as Best
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none mb-4">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {answer.content}
        </p>
      </div>

      {/* Footer - Voting Controls */}
      {onVote && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 px-3',
              localUserVote === 1 && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
            )}
            onClick={() => handleVote(1)}
            disabled={isVoting}
          >
            <ThumbsUp className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{localUpvotes}</span>
          </Button>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">
            {netScore > 0 && '+'}
            {netScore}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 px-3',
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
    </motion.div>
  );
};
