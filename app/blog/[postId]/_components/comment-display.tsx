"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Post, Comment } from "@prisma/client";
import Image from "next/image";
import { logger } from '@/lib/logger';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { currentUser } from '@/lib/auth'
import { ReplyModal } from "./reply-modal";
import { Textarea } from "@/components/ui/textarea";
import { CommentHeader } from "./comments/comment-header";
import { CommentContent } from "./comments/comment-content";
import { CommentActions } from "./comments/comment-actions";
import { CommentReplies } from "./comments/comment-replies";
import { NestedComment } from "./comments/nested-comment";

// Define the component props with replies as a separate field on initialData
interface ReplyType {
  id: string;
  content: string;  // Changed from replyContent to content
  userId: string;
  commentId: string;
  postId: string;
  parentReplyId: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  reactions: Array<{
    id: string;
    type: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
    };
  }>;
  childReplies?: ReplyType[]; // Add this for nested replies
}

interface CommentDisplayProps {
  initialData: Post & {
    comments: Array<{
      id: string;
      content: string;
      userId: string;
      createdAt: Date;
      user: {
        id: string;
        name: string;
        image: string | null;
      };
      reactions: Array<{
        id: string;
        type: string;
        userId: string;
        user: {
          id: string;
          name: string | null;
        };
      }>;
      replies: Array<{
        id: string;
        content: string;
        userId: string;
        createdAt: Date;
        user: {
          id: string;
          name: string;
          image: string | null;
        };
        reactions: Array<{
          id: string;
          type: string;
          userId: string;
          user: {
            id: string;
            name: string | null;
          };
        }>;
      }>;
    }>;
  };
  postId: string;
}

const formSchema = z.object({
  replyContent: z.string().min(1, {
    message: "Reply is required",
  }),
});

const emojiOptions = [
  "👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "😍", "😆", "😎",
  "😱", "🎉", "💯", "😅", "🥳", "😤", "😋", "😡", "😴", "🤔"
];

// Add this type for nested reply submission
interface NestedReplyValues {
  replyContent: string;
}

// Add this sorting function at the top level
const sortByDate = <T extends { createdAt: Date }>(items: T[] | undefined | null): T[] => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Update the helper function to return separate counts
const getCommentCounts = (comments: any[] | null | undefined, replies: ReplyType[] | null | undefined) => {
  return {
    comments: comments?.length || 0,
    replies: replies?.length || 0,
    total: (comments?.length || 0) + (replies?.length || 0)
  };
};

// Add these types
interface ReactionButtonProps {
  type: '👍' | '❤️';  // Changed from 'like' | 'love' to emoji types
  count: number;
  isActive: boolean;
  onClick: () => void;
}

// Replace the existing ReactionButton component with this one
const ReactionButton = ({ type, count, isActive, onClick }: ReactionButtonProps) => {
  const isLove = type === '❤️';

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full touch-manipulation",
        "transition-all duration-200",
        isActive
          ? isLove ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
          : "hover:bg-gray-800/50 text-gray-400 hover:text-gray-300"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-base sm:text-lg">{type}</span>
      {count > 0 && (
        <span className={cn(
          "text-xs sm:text-sm",
          isActive
            ? isLove ? "text-red-400" : "text-blue-400"
            : "text-gray-400"
        )}>
          {count}
        </span>
      )}
    </motion.button>
  );
};

// Add this type for reply reactions
interface ReplyReaction {
  id: string;
  type: string;
  userId: string;
  user: {
    id: string;  // Add this line
    name: string | null;
  };
}

// Add this type for replies
interface Reply {
  id: string;
  replyContent: string | null;  // Change this to match ReplyType
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
  reactions: ReplyReaction[];
}

const CommentDisplay: React.FC<CommentDisplayProps> = ({ initialData, postId }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialData.comments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!session?.user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {

      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment,
      });

      const newCommentData = response.data;

      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      toast.success("Comment added successfully!");
    } catch (error: any) {
      logger.error("Error creating comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string, content: string, parentId?: string) => {
    if (!session?.user) {
      toast.error("Please sign in to reply");
      return;
    }

    try {

      const response = await axios.post(`/api/posts/${postId}/comments/${commentId}/replies`, {
        content,
        parentId
      });

      const newReply = response.data;

      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      }));

      toast.success("Reply added successfully!");
    } catch (error: any) {
      logger.error("Error creating reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleReaction = async (commentId: string, reactionType: string) => {
    if (!session?.user) {
      toast.error("Please sign in to react");
      return;
    }

    try {

      const response = await axios.post(`/api/posts/${postId}/comments/${commentId}/reactions`, {
        type: reactionType
      });

      const updatedComment = response.data;

      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return updatedComment;
        }
        return comment;
      }));
    } catch (error: any) {
      logger.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* New comment input */}
      <div className="space-y-3 sm:space-y-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
        />
        <Button
          onClick={handleSubmitComment}
          disabled={isSubmitting || !newComment.trim()}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>

      {/* Comments list */}
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {comments.map((comment) => {
          const commentWithPostId = {
            ...comment,
            postId,
            replies: comment.replies?.map(reply => ({...reply, postId})) || []
          };
          return (
            <NestedComment
              key={comment.id}
              comment={commentWithPostId}
              currentUserId={session?.user?.id}
              onReply={handleReply}
              onReact={handleReaction}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CommentDisplay;
