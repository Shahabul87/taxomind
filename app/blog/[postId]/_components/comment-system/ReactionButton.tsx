"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import axios from 'axios';
import { logger } from '@/lib/logger';

// Define reaction options
const reactions = [
  { id: 'like', emoji: '👍', label: 'Like', color: '#2563eb' },
  { id: 'love', emoji: '❤️', label: 'Love', color: '#dc2626' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: '#eab308' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: '#7c3aed' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#f59e0b' },
  { id: 'angry', emoji: '😠', label: 'Angry', color: '#ef4444' }
];

interface ReactionType {
  id: string;
  type: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface ReactionButtonProps {
  postId: string;
  commentId: string;
  initialReactions: ReactionType[];
  onReactionUpdate: (updatedComment: any) => void;
  isReply?: boolean;
  parentCommentId?: string;
}

export const ReactionButton = ({
  postId,
  commentId,
  initialReactions,
  onReactionUpdate,
  isReply = false,
  parentCommentId
}: ReactionButtonProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const isSessionLoading = sessionStatus === 'loading';
  const hasSessionError = false; // Session doesn't have error state
  const [showReactions, setShowReactions] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [localReactions, setLocalReactions] = useState<ReactionType[]>(initialReactions || []);
  const [isLoading, setIsLoading] = useState(false);

  // Find current user's reaction if any
  const userReaction = session?.user?.id 
    ? localReactions.find(r => r.userId === session.user.id) 
    : null;

  // Debug log to see component props
  const initialReactionsLength = useMemo(() => initialReactions?.length || 0, [initialReactions]);
  
  useEffect(() => {

  }, [commentId, postId, parentCommentId, isReply, initialReactionsLength]);

  // Update local reactions when initialReactions changes
  useEffect(() => {
    setLocalReactions(initialReactions || []);
  }, [initialReactions]);

  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        cache: 'no-store' // Disable caching to prevent stale data
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      throw error;
    }
  };

  const handleReactionClick = async (type: string) => {
    if (isSessionLoading) {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || hasSessionError) {
      toast.error("Please sign in to react");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      // Optimistically update UI
      let updatedReactions = [...localReactions];
      const existingReaction = localReactions.find(
        r => r.userId === session.user?.id && r.type === type
      );

      if (existingReaction) {
        // Remove reaction if clicking the same one
        updatedReactions = localReactions.filter(r => r.id !== existingReaction.id);
      } else {
        // Remove previous reaction if exists
        updatedReactions = localReactions.filter(r => r.userId !== session.user?.id);
        
        // Add new reaction
        updatedReactions.push({
          id: `temp-${Date.now()}`, // Temporary ID
          type,
          userId: session.user?.id || '',
          user: {
            id: session.user?.id || '',
            name: session.user?.name || null
          }
        });
      }

      // Update locally first
      setLocalReactions(updatedReactions);
      
      // Update parent component
      onReactionUpdate({
        id: commentId,
        reactions: updatedReactions
      });

      // Always use the universal endpoint which is more stable
      const endpoint = `/api/comment-reaction`;
      let payload = {
        type,
        postId,
        replyId: isReply ? commentId : undefined,
        commentId: isReply ? parentCommentId : commentId
      };

      // Use axios instead of fetch for better error handling
      try {
        // Make the API request with axios
        const response = await axios.post(endpoint, payload);

        // Update with real data from server
        if (response.data?.reactions) {
          setLocalReactions(response.data.reactions);
          onReactionUpdate({
            ...response.data,
            id: commentId
          });

        } else {
          logger.warn("API response did not contain reactions array:", response.data);
        }
      } catch (axiosError: any) {
        logger.error("Axios error:", axiosError);
        
        if (axiosError.response) {
          logger.error("Error response:", {
            status: axiosError.response.status,
            data: axiosError.response.data
          });
        }
        
        throw axiosError; // Re-throw to be caught by outer catch
      }
      
      setShowReactions(false);
    } catch (error: any) {
      logger.error("Reaction error:", error);
      // Revert to initial state on error
      setLocalReactions(initialReactions);
      onReactionUpdate({ id: commentId, reactions: initialReactions });
      
      let errorMessage = "Failed to add reaction. Please try again.";
      
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || errorMessage;
        logger.error("Axios error details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get counts for each reaction type
  const reactionCounts = reactions.map(reaction => ({
    ...reaction,
    count: localReactions.filter(r => r.type === reaction.id).length
  }));

  // Get the dominant reaction (most used)
  const dominantReaction = [...reactionCounts]
    .sort((a, b) => b.count - a.count)
    .find(r => r.count > 0);

  // Show reaction summary (what reaction the current user has)
  const activeReaction = userReaction
    ? reactions.find(r => r.id === userReaction.type)
    : null;

  return (
    <div className="relative inline-block">
      {/* Main reaction button */}
      <button
        onMouseEnter={() => setShowReactions(true)}
        onMouseLeave={() => {
          setShowReactions(false);
          setHoveredReaction(null);
        }}
        className={`text-sm px-2 py-1 rounded-md transition-colors ${
          isLoading 
            ? 'opacity-50 cursor-not-allowed' 
            : activeReaction 
                ? `text-[${activeReaction.color}] hover:bg-[${activeReaction.color}]/10` 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        disabled={isLoading}
      >
        {activeReaction ? (
          <span className="flex items-center gap-1">
            <span className="text-base">{activeReaction.emoji}</span>
            <span>{activeReaction.label}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-base">👍</span>
            <span>Like</span>
          </span>
        )}
      </button>

      {/* Reaction popup */}
      <AnimatePresence>
        {showReactions && !isLoading && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -5 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -5 }}
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
                whileHover={{ scale: 1.3, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHoveredReaction(reaction.id)}
                onMouseLeave={() => setHoveredReaction(null)}
                onClick={() => handleReactionClick(reaction.id)}
                className="relative p-1.5 transition-transform"
                disabled={isLoading}
              >
                <span className="text-2xl">{reaction.emoji}</span>
                {hoveredReaction === reaction.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: -4 }}
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

      {/* Reaction summary/counts */}
      {localReactions.length > 0 && (
        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-1">
          {/* Show reaction icons */}
          <div className="flex -space-x-1 mr-1">
            {[...new Set(localReactions.map(r => r.type))]
              .slice(0, 3)
              .map(type => {
                const reactionInfo = reactions.find(r => r.id === type);
                return (
                  <div 
                    key={type}
                    className="w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700"
                    style={{ zIndex: 2 }}
                  >
                    <span className="text-xs">{reactionInfo?.emoji}</span>
                  </div>
                );
              })}
          </div>
          
          {/* Show total count */}
          <span>{localReactions.length}</span>
        </div>
      )}
    </div>
  );
}; 