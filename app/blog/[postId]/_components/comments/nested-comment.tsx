import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageCircle, Heart, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactionButton } from "../reaction-button";
import { formatDistanceToNow } from "date-fns";

interface ReactionType {
  id: string;
  type: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface CommentType {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  reactions: ReactionType[];
  replies?: CommentType[];
}

interface NestedCommentProps {
  comment: CommentType;
  level?: number;
  currentUserId?: string;
  onReply: (commentId: string, content: string, parentId?: string) => Promise<void>;
  onReact: (commentId: string, reactionType: string) => Promise<void>;
  onCommentUpdate?: (updatedComment: CommentType) => void;
}

const MAX_NESTING_LEVEL = 3;

export const NestedComment = ({
  comment,
  level = 0,
  currentUserId,
  onReply,
  onReact,
  onCommentUpdate
}: NestedCommentProps) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [localComment, setLocalComment] = useState(comment);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    await onReply(localComment.id, replyContent);
    setReplyContent("");
    setIsReplying(false);
  };

  const handleReactionUpdate = useCallback((updatedComment: CommentType) => {

    setLocalComment(prev => ({
      ...prev,
      reactions: updatedComment.reactions
    }));

    if (onCommentUpdate) {
      onCommentUpdate({
        ...localComment,
        reactions: updatedComment.reactions
      });
    }
  }, [onCommentUpdate, localComment]);

  // Generate responsive margin classes based on nesting level
  // Mobile: minimal indent (max 16px), Desktop: larger indent (max 72px)
  const getIndentClass = () => {
    if (level === 0) return '';
    const clampedLevel = Math.min(level, MAX_NESTING_LEVEL);
    // Mobile: 4px per level (max 12px), Desktop: 24px per level (max 72px)
    const indentMap: Record<number, string> = {
      1: 'ml-1 sm:ml-6',      // Mobile: 4px, Desktop: 24px
      2: 'ml-2 sm:ml-12',     // Mobile: 8px, Desktop: 48px
      3: 'ml-3 sm:ml-[72px]', // Mobile: 12px, Desktop: 72px
    };
    return indentMap[clampedLevel] || '';
  };

  // Add visual nesting indicator for mobile with border
  const getBorderClass = () => {
    if (level === 0) return '';
    return 'border-l-2 border-gray-300 dark:border-gray-600 pl-2 sm:pl-0 sm:border-l-0';
  };

  // Adjust padding based on nesting level - less padding for deeper nesting on mobile
  const getPaddingClass = () => {
    if (level >= 2) {
      return 'p-1.5 sm:p-3 md:p-4'; // Reduced padding on mobile for nested comments
    }
    return 'p-2 sm:p-3 md:p-4';
  };

  return (
    <div className={cn("relative", getIndentClass(), getBorderClass())}>
      <div className={cn(
        "flex gap-2 sm:gap-3 md:gap-4 rounded-md sm:rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50",
        getPaddingClass()
      )}>
        <Avatar className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
          <AvatarImage src={localComment.user.image || ''} />
          <AvatarFallback className="text-xs sm:text-sm">
            {localComment.user.name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
            <span className="font-semibold text-[11px] sm:text-sm truncate">
              {localComment.user.name}
            </span>
            <span className="text-[9px] sm:text-xs text-gray-500 flex-shrink-0">
              {formatDistanceToNow(new Date(localComment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-[11px] sm:text-sm text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2 break-words leading-relaxed">
            {localComment.content}
          </p>

          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 text-xs sm:text-sm flex-wrap">
            <ReactionButton
              postId={localComment.postId}
              commentId={localComment.id}
              initialReactions={localComment.reactions}
              onReactionUpdate={handleReactionUpdate}
            />

            {level < MAX_NESTING_LEVEL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-6 sm:h-8 px-1.5 sm:px-3 text-[10px] sm:text-sm touch-manipulation min-w-[50px]"
              >
                Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-1.5 sm:p-2.5 text-[11px] sm:text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 min-h-[50px] sm:min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a reply..."
              />
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  className="h-7 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm touch-manipulation flex-1 sm:flex-initial"
                >
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                  }}
                  className="h-7 sm:h-9 px-2 sm:px-4 text-[10px] sm:text-sm touch-manipulation flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {localComment.replies && localComment.replies.length > 0 && (
        <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
          {localComment.replies.map((reply) => (
            <NestedComment
              key={reply.id}
              comment={reply}
              level={level + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onReact={onReact}
              onCommentUpdate={(updatedReply) => {
                setLocalComment(prev => ({
                  ...prev,
                  replies: prev.replies?.map(r =>
                    r.id === updatedReply.id ? updatedReply : r
                  )
                }));
                if (onCommentUpdate) {
                  onCommentUpdate(localComment);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 