"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Smile,
  Image as ImageIcon,
  X,
  Edit2,
  Trash2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  postId: string;
  parentId: string | null;
  depth: number;
  User?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count?: {
    replies: number;
    reactions: number;
  };
  replies?: Comment[];
  isLiked?: boolean;
  likeCount?: number;
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

const CommentItem = ({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  depth = 0,
}: {
  comment: Comment;
  onReply: (commentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  depth?: number;
}) => {
  const { data: session } = useSession();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showReplies, setShowReplies] = useState(true);
  const [timeText, setTimeText] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  const isOwnComment = session?.user?.id === comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Validate comment has required fields on mount
  useEffect(() => {
    if (!comment.id) {
      console.error('[CommentItem] Mounted without id:', {
        comment,
        hasContent: !!comment.content,
        hasUserId: !!comment.userId,
        depth
      });
    }
  }, [comment, depth]);

  // Fix hydration mismatch by updating time on client only
  useEffect(() => {
    setIsMounted(true);
    const updateTime = () => {
      if (!comment.createdAt) {
        setTimeText("just now");
        return;
      }
      try {
        setTimeText(formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }));
      } catch (error) {
        setTimeText("just now");
      }
    };

    updateTime();
    // Update time every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [comment.createdAt]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike(comment.id);
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;

    if (!comment.id) {
      console.error('Cannot reply: comment.id is missing', { comment });
      toast.error("Unable to reply: comment data is invalid");
      return;
    }

    console.log('Submitting reply:', { commentId: comment.id, replyContent });
    onReply(comment.id, replyContent);
    setReplyContent("");
    setShowReplyBox(false);
  };

  const handleEditSubmit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent);
      setIsEditing(false);
    }
  };

  // Responsive indentation - minimal on mobile, larger on desktop
  const getIndentClass = () => {
    if (depth === 0) return "";
    const clampedDepth = Math.min(depth, 3);
    // Mobile: 4px per level (max 12px), Tablet: 8px per level, Desktop: 32px per level
    const indentMap: Record<number, string> = {
      1: "ml-1 sm:ml-2 md:ml-8",    // Mobile: 4px, Tablet: 8px, Desktop: 32px
      2: "ml-2 sm:ml-4 md:ml-16",   // Mobile: 8px, Tablet: 16px, Desktop: 64px
      3: "ml-3 sm:ml-6 md:ml-24",   // Mobile: 12px, Tablet: 24px, Desktop: 96px
    };
    return indentMap[clampedDepth] || "";
  };

  // Visual nesting indicator for mobile
  const getBorderClass = () => {
    if (depth === 0) return "";
    return "border-l-2 border-blue-200 dark:border-blue-800 pl-1 sm:pl-1.5 md:pl-0 md:border-l-0";
  };

  return (
    <div className={cn("flex gap-1 sm:gap-1.5 md:gap-2", getIndentClass(), getBorderClass())}>
      {/* Avatar - smaller on mobile for nested comments */}
      <Avatar className={cn("mt-0.5 sm:mt-1 flex-shrink-0", depth > 0 ? "w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" : "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8")}>
        <AvatarImage src={(comment.User?.image || comment.user?.image) || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] sm:text-xs">
          {(comment.User?.name || comment.user?.name)?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Comment Bubble */}
        <div className="group relative">
          {isEditing ? (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[45px] sm:min-h-[50px] md:min-h-[60px] text-xs sm:text-sm resize-none border-0 bg-transparent focus-visible:ring-0"
                autoFocus
              />
              <div className="flex gap-1 sm:gap-1.5 md:gap-2 mt-1 sm:mt-1.5 md:mt-2">
                <Button size="sm" onClick={handleEditSubmit} className="h-6 sm:h-7 md:h-8 text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="h-6 sm:h-7 md:h-8 text-[10px] sm:text-xs md:text-sm px-1.5 sm:px-2 md:px-3"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl md:rounded-2xl px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 md:py-2 inline-block max-w-full">
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1">
                <span className="font-semibold text-[10px] sm:text-xs md:text-sm text-gray-900 dark:text-white">
                  {comment.User?.name || comment.user?.name || "Anonymous"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs md:text-sm text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          )}

          {/* Like Badge */}
          {likeCount > 0 && !isEditing && (
            <div className="absolute -bottom-1 sm:-bottom-1.5 md:-bottom-2 right-0 bg-white dark:bg-gray-700 rounded-full px-1 sm:px-1.5 md:px-2 py-0.5 border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-0.5 sm:gap-1">
              <ThumbsUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-blue-600 dark:text-blue-400 fill-current" />
              <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300">
                {likeCount}
              </span>
            </div>
          )}

          {/* More Options (always visible on mobile, hover on desktop) */}
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -right-4 sm:-right-6 md:-right-8 top-0 sm:top-0.5 md:top-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 p-0"
                  aria-label="Comment options"
                >
                  <MoreHorizontal className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 sm:w-48">
                {isOwnComment && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="text-xs sm:text-sm">
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="text-xs sm:text-sm">
                  <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mt-0.5 sm:mt-1 ml-1.5 sm:ml-2 md:ml-3 flex-wrap">
            <button
              onClick={handleLike}
              className={cn(
                "text-[9px] sm:text-[10px] md:text-xs font-semibold transition-colors touch-manipulation py-0.5 px-1 rounded",
                isLiked
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              Like
            </button>
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors touch-manipulation py-0.5 px-1 rounded"
            >
              Reply
            </button>
            <span className="text-[8px] sm:text-[9px] md:text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
              {isMounted ? timeText : ""}
            </span>
          </div>
        )}

        {/* Reply Input */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 sm:mt-1.5 md:mt-2 flex gap-1 sm:gap-1.5 md:gap-2"
            >
              <Avatar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[8px] sm:text-[10px] md:text-xs">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative min-w-0">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[45px] sm:min-h-[50px] md:min-h-[60px] text-[11px] sm:text-xs md:text-sm resize-none rounded-lg sm:rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 border-0 pr-7 sm:pr-8 md:pr-10 py-1 sm:py-1.5 md:py-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim()}
                  className="absolute bottom-1 sm:bottom-1.5 md:bottom-2 right-1 sm:right-1.5 md:right-2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 rounded-full"
                  aria-label="Send reply"
                >
                  <Send className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        {hasReplies && (
          <div className="mt-1.5 sm:mt-2 md:mt-3">
            {depth < 3 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1 sm:mb-1.5 md:mb-2 touch-manipulation py-0.5"
              >
                {showReplies
                  ? `Hide ${comment.replies?.length} ${
                      comment.replies?.length === 1 ? "reply" : "replies"
                    }`
                  : `View ${comment.replies?.length} ${
                      comment.replies?.length === 1 ? "reply" : "replies"
                    }`}
              </button>
            )}

            <AnimatePresence mode="wait">
              {showReplies && comment.replies && comment.replies.length > 0 && (
                <motion.div
                  key={`replies-container-${comment.id}-${depth}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-1.5 sm:space-y-2 md:space-y-3"
                >
                  {comment.replies.map((reply, index) => (
                    <CommentItem
                      key={`${reply.id}-${index}-depth-${depth}`}
                      comment={reply}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onLike={onLike}
                      depth={depth + 1}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

// Raw reply data from database
interface RawReply {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  postId: string;
  parentId?: string | null;
  depth: number;
  User?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  other_Reply?: RawReply[];
  _count?: {
    replies: number;
    reactions: number;
  };
}

// Transform Reply objects to match Comment structure
const transformReplies = (replies: RawReply[]): Comment[] => {
  if (!replies || !Array.isArray(replies)) return [];

  return replies
    .filter((reply) => reply && reply.id) // Filter out invalid replies
    .map((reply) => ({
      ...reply,
      parentId: reply.parentId || null,
      User: reply.User || reply.user,
      user: reply.User || reply.user,
      replies: reply.other_Reply ? transformReplies(reply.other_Reply) : [],
    }));
};

export const CommentSection = ({
  postId,
  initialComments = [],
}: CommentSectionProps) => {
  const { data: session } = useSession();

  // Transform initial comments to handle nested replies
  const transformedComments = initialComments
    .filter((comment) => comment && comment.id) // Filter out invalid comments
    .map((comment) => {
      return {
        ...comment,
        User: comment.User || comment.user,
        user: comment.User || comment.user,
        replies: comment.replies ? transformReplies(comment.replies) : [],
      };
    });

  const [comments, setComments] = useState<Comment[]>(transformedComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");

  const handleAddComment = async () => {
    if (!newComment.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment,
      });

      // Ensure user data is included in the new comment
      // IMPORTANT: Initialize replies array to match the structure expected by the component
      const newCommentData: Comment = {
        ...response.data,
        User: response.data.User || {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
        user: response.data.user || {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
        replies: [], // Initialize empty replies array for new comments
        depth: 0,
        isLiked: false,
        likeCount: 0,
      };

      setComments([newCommentData, ...comments]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!session) {
      toast.error("Please sign in to reply");
      return;
    }

    console.log('handleReply called:', { parentId, content, session: session.user?.id });

    try {
      // Find the parent to determine if it's a comment or reply
      let parentComment: Comment | null = null;
      let parentReply: Comment | null = null;
      let commentId: string | null = null;

      // Check if parentId is a top-level comment
      for (const comment of comments) {
        if (comment.id === parentId) {
          parentComment = comment;
          commentId = comment.id;
          break;
        }
        // Check if it's a reply within this comment's replies
        if (comment.replies) {
          const findReply = (replies: Comment[]): Comment | null => {
            for (const reply of replies) {
              if (reply.id === parentId) {
                return reply;
              }
              if (reply.replies) {
                const found = findReply(reply.replies);
                if (found) return found;
              }
            }
            return null;
          };
          parentReply = findReply(comment.replies);
          if (parentReply) {
            commentId = comment.id;
            break;
          }
        }
      }

      if (!commentId) {
        console.error('Parent comment not found for parentId:', parentId);
        toast.error("Parent comment not found");
        return;
      }

      console.log('Found parent:', { commentId, parentComment: !!parentComment, parentReply: !!parentReply });

      let response;
      if (parentComment) {
        // Replying to a top-level comment
        console.log('Posting reply to comment:', { postId, commentId, content });
        response = await axios.post(
          `/api/posts/${postId}/comments/${commentId}/replies`,
          { content }
        );
      } else {
        // Replying to a reply
        console.log('Posting nested reply:', { postId, commentId, parentId, content });
        response = await axios.post(
          `/api/posts/${postId}/comments/${commentId}/replies`,
          { content, parentReplyId: parentId }
        );
      }
      console.log('Reply response:', response.data);

      // Ensure user data is included in the new reply
      // IMPORTANT: Initialize replies array and other fields to match the structure expected by the component
      const newReplyData: Comment = {
        ...response.data,
        User: response.data.User || {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
        user: response.data.user || {
          id: session.user.id,
          name: session.user.name,
          image: session.user.image,
        },
        replies: [], // Initialize empty replies array for consistency
        depth: parentComment ? 1 : (parentReply ? 2 : 0), // Set appropriate depth
        isLiked: false,
        likeCount: 0,
      };

      // Update comments with new reply
      setComments((prev) => {
        const updateReplies = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === commentId) {
              if (comment.id === parentId) {
                // Adding reply to this comment
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newReplyData],
                };
              } else {
                // Adding nested reply somewhere in this comment's reply tree
                const addNestedReply = (replies: Comment[]): Comment[] => {
                  return replies.map((reply) => {
                    if (reply.id === parentId) {
                      return {
                        ...reply,
                        replies: [...(reply.replies || []), newReplyData],
                      };
                    }
                    if (reply.replies) {
                      return {
                        ...reply,
                        replies: addNestedReply(reply.replies),
                      };
                    }
                    return reply;
                  });
                };
                return {
                  ...comment,
                  replies: comment.replies ? addNestedReply(comment.replies) : [],
                };
              }
            }
            return comment;
          });
        };
        return updateReplies(prev);
      });

      toast.success("Reply posted!");
    } catch (error) {
      const axiosError = error as { message?: string; response?: { data?: { error?: string }; status?: number } };
      console.error("Reply error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status
      });
      toast.error(axiosError.response?.data?.error || "Failed to post reply");
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await axios.patch(`/api/posts/${postId}/comments/${commentId}`, {
        content,
      });
      // Update local state
      toast.success("Comment updated!");
    } catch (error) {
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}/comments/${commentId}`);
      setComments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      );
      toast.success("Comment deleted!");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async (itemId: string) => {
    try {
      // Find if this is a comment or a reply
      let isComment = false;
      let parentCommentId: string | null = null;

      // Check if itemId is a top-level comment
      for (const comment of comments) {
        if (comment.id === itemId) {
          isComment = true;
          break;
        }

        // Check if it's a reply within this comment's replies
        if (comment.replies) {
          const findReply = (replies: Comment[], commentId: string): boolean => {
            for (const reply of replies) {
              if (reply.id === itemId) {
                parentCommentId = commentId;
                return true;
              }
              if (reply.replies) {
                const found = findReply(reply.replies, commentId);
                if (found) return true;
              }
            }
            return false;
          };
          if (findReply(comment.replies, comment.id)) {
            break;
          }
        }
      }

      if (isComment) {
        // Like a comment
        await axios.post(
          `/api/posts/${postId}/comments/${itemId}/reactions`,
          { type: "LIKE" }
        );
      } else if (parentCommentId) {
        // Like a reply
        await axios.post(
          `/api/posts/${postId}/comments/${parentCommentId}/replies/${itemId}/reactions`,
          { type: "LIKE" }
        );
      }

      // Update local state to show the like immediately
      setComments((prev) => {
        const updateLikes = (items: Comment[]): Comment[] => {
          return items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                isLiked: !item.isLiked,
                likeCount: item.isLiked
                  ? (item.likeCount || 1) - 1
                  : (item.likeCount || 0) + 1,
              };
            }
            if (item.replies) {
              return {
                ...item,
                replies: updateLikes(item.replies),
              };
            }
            return item;
          });
        };
        return updateLikes(prev);
      });

    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to like");
    }
  };

  const sortedComments = [...comments]
    .filter(comment => {
      // Filter out invalid comments without IDs
      if (!comment.id) {
        console.warn('Filtering out comment without id:', comment);
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.likeCount || 0) - (a.likeCount || 0);
    });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4 gap-2">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0">
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Comments ({comments.length})</span>
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "popular")}
          className="text-[10px] sm:text-xs md:text-sm bg-transparent border-0 text-gray-600 dark:text-gray-400 focus:ring-0 cursor-pointer flex-shrink-0 px-1 py-0.5 rounded"
          aria-label="Sort comments by"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Relevant</option>
        </select>
      </div>

      {/* Comment Input */}
      {session ? (
        <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 md:mb-6">
          <Avatar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mt-0.5 sm:mt-1 flex-shrink-0">
            <AvatarImage src={session.user?.image || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px] sm:text-xs">
              {session.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative min-w-0">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[50px] sm:min-h-[60px] md:min-h-[80px] text-xs sm:text-sm resize-none rounded-lg sm:rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 border-0 pr-7 sm:pr-8 md:pr-10 py-1.5 sm:py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSubmitting}
              className="absolute bottom-1 sm:bottom-1.5 md:bottom-2 right-1 sm:right-1.5 md:right-2 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 p-0 rounded-full"
              aria-label="Post comment"
            >
              <Send className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-6 text-center">
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Please sign in to comment
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLike={handleLike}
          />
        ))}

        {comments.length === 0 && (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-gray-300 dark:text-gray-600 mb-1.5 sm:mb-2 md:mb-3" />
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
