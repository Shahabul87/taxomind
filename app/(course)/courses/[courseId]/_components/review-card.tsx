"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import { Star, User, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string | Date;
    user: {
      name: string | null;
      image: string | null;
    };
    helpfulCount?: number;
    viewerHasVoted?: boolean;
  };
  index: number;
  canVote?: boolean;
  onToggleHelpful?: (reviewId: string, hasVoted: boolean) => void;
}

export const ReviewCard = ({ review, index, canVote = false, onToggleHelpful }: ReviewCardProps): JSX.Element => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className="p-3 sm:p-4 md:p-5 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 w-full overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3">
          {review.user.image ? (
            <Image
              src={review.user.image}
              alt={review.user.name ?? "User"}
              width={48}
              height={48}
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-200 md:text-base">
              {review.user.name ?? "Anonymous User"}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={`star-${review.id}-${i}`}
                  className={cn(
                    "w-3.5 h-3.5 sm:w-4 sm:h-4",
                    i < review.rating 
                      ? "text-amber-500 dark:text-yellow-400 fill-current" 
                      : "text-gray-300 dark:text-gray-500"
                  )}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          {new Date(review.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      <p className="mt-2 sm:mt-3 text-gray-700 dark:text-gray-300 leading-relaxed break-words word-break-anywhere md:text-base">
        {review.comment}
      </p>
      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => onToggleHelpful && onToggleHelpful(review.id, !!review.viewerHasVoted)}
          disabled={!canVote}
          aria-pressed={!!review.viewerHasVoted}
          aria-label={`${review.viewerHasVoted ? 'Unmark' : 'Mark'} as helpful`}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
            ${review.viewerHasVoted
              ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
              : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/60'}
            ${!canVote ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
          `}
          title={canVote ? 'Mark this review as helpful' : 'Sign in to vote'}
        >
          <ThumbsUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${review.viewerHasVoted ? 'text-blue-600' : ''}`} aria-hidden="true" />
          <span>Helpful</span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-white/70 dark:bg-white/10">
            {review.helpfulCount ?? 0}
          </span>
        </button>
      </div>
    </motion.div>
  );
}; 
