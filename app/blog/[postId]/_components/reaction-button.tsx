"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import axios from 'axios';
import { logger } from '@/lib/logger';

const reactions = [
  { id: 'like', emoji: '👍', label: 'Like', color: '#2563eb' },
  { id: 'love', emoji: '❤️', label: 'Love', color: '#dc2626' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: '#eab308' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: '#eab308' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#eab308' },
  { id: 'angry', emoji: '😠', label: 'Angry', color: '#ef4444' }
];

interface ReactionButtonProps {
  postId: string;
  commentId: string;
  initialReactions: any[];
  onReactionUpdate: (updatedComment: any) => void;
}

export const ReactionButton = ({ 
  postId, 
  commentId, 
  initialReactions,
  onReactionUpdate 
}: ReactionButtonProps) => {
  const { data: session } = useSession();
  const [showReactions, setShowReactions] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [localReactions, setLocalReactions] = useState(initialReactions);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's current reaction if any
  const userReaction = localReactions?.find(
    reaction => reaction.userId === session?.user?.id
  );

  const handleReactionClick = async (type: string) => {
    if (!session?.user) {
      toast.error("Please sign in to react");
      return;
    }

    if (isLoading) return;

    // Validate IDs
    if (!postId || !commentId) {
      logger.error("Missing required IDs:", { postId, commentId });
      toast.error("Missing required data");
      return;
    }

    try {
      setIsLoading(true);

      // Optimistically update the UI
      const existingReaction = localReactions.find(
        r => r.userId === session.user?.id && r.type === type
      );

      let updatedReactions;
      if (existingReaction) {
        // Remove reaction
        updatedReactions = localReactions.filter(r => r.id !== existingReaction.id);
      } else {
        // Add new reaction
        const newReaction = {
          id: Math.random().toString(), // Temporary ID
          type,
          userId: session.user.id,
          user: {
            id: session.user.id,
            name: session.user.name
          }
        };
        updatedReactions = [...localReactions, newReaction];
      }

      // Update local state immediately
      setLocalReactions(updatedReactions);
      
      // Update parent component
      onReactionUpdate({
        id: commentId,
        reactions: updatedReactions
      });

      // Make API call
      const response = await axios.post(
        `/api/posts/${postId}/comments/${commentId}/reactions`,
        { type }
      );

      // Update with server response
      if (response.data) {
        // Check if the response has reactions property
        const updatedReactions = response.data.reactions || [];
        setLocalReactions(updatedReactions);
        onReactionUpdate(response.data);
        setShowReactions(false);
      }
    } catch (error: any) {
      logger.error("Reaction error:", error.response || error);
      // Revert to initial state on error
      setLocalReactions(initialReactions);
      onReactionUpdate({ id: commentId, reactions: initialReactions });
      
      // Show specific error message from the API response
      const errorMessage = error.response?.data?.error || "Failed to add reaction. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update local reactions when initialReactions changes
  if (JSON.stringify(initialReactions) !== JSON.stringify(localReactions)) {
    setLocalReactions(initialReactions);
  }

  return (
    <div className="relative inline-block">
      {/* Main reaction button */}
      <button
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => {
          setShowReactions(false);
          setHoveredReaction(null);
        }}
        className={`text-sm transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-500'
        }`}
        disabled={isLoading}
      >
        {userReaction ? (
          <span className="flex items-center gap-1">
            <span className="text-lg" style={{ color: reactions.find(r => r.id === userReaction.type)?.color }}>
              {reactions.find(r => r.id === userReaction.type)?.emoji}
            </span>
            <span>{reactions.find(r => r.id === userReaction.type)?.label}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-lg">👍</span>
            <span>React</span>
          </span>
        )}
      </button>

      {/* Reaction popup */}
      <AnimatePresence>
        {showReactions && !isLoading && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-2 py-1 flex gap-1 border border-gray-200 dark:border-gray-700 z-50"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => {
              setShowReactions(false);
              setHoveredReaction(null);
            }}
          >
            {reactions.map((reaction) => (
              <motion.button
                key={reaction.id}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredReaction(reaction.id)}
                onMouseLeave={() => setHoveredReaction(null)}
                onClick={() => handleReactionClick(reaction.id)}
                className="relative p-1 transition-transform"
                disabled={isLoading}
              >
                <span className="text-2xl">{reaction.emoji}</span>
                {hoveredReaction === reaction.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50"
                  >
                    {reaction.label}
                  </motion.div>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction counts */}
      {localReactions?.length > 0 && (
        <div className="mt-1 text-sm text-gray-500">
          {reactions.map(reaction => {
            const count = localReactions.filter(r => r.type === reaction.id).length;
            if (count > 0) {
              return (
                <motion.span
                  key={reaction.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mr-2 inline-flex items-center"
                  style={{ color: reaction.color }}
                >
                  {reaction.emoji} {count}
                </motion.span>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}; 