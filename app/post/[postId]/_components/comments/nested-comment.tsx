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
const INDENT_SIZE = 24;

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

  return (
    <div
      className="relative"
      style={{
        marginLeft: level > 0 ? `${Math.min(level, MAX_NESTING_LEVEL) * INDENT_SIZE}px` : 0
      }}
    >
      <div className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
        <Avatar className="h-10 w-10">
          <AvatarImage src={localComment.user.image || ''} />
          <AvatarFallback>{localComment.user.name?.[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {localComment.user.name}
            </span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(localComment.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {localComment.content}
          </p>

          <div className="flex items-center gap-4 text-sm">
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
              >
                Reply
              </Button>
            )}
          </div>

          {isReplying && (
            <div className="mt-4 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                placeholder="Write a reply..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
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
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {localComment.replies?.map((reply) => (
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
  );
}; 