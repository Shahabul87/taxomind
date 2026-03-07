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
    if (!replyContent.trim() || !comment.id) return;
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

  // Visual nesting indicator for mobile - Editorial colors
  const getBorderClass = () => {
    if (depth === 0) return "";
    return "border-l-2 border-blog-primary/30 dark:border-blog-primary/40 pl-2 sm:pl-2.5 md:pl-0 md:border-l-0";
  };

  return (
    <div className={cn("flex gap-2 sm:gap-2.5 md:gap-3", getIndentClass(), getBorderClass())}>
      {/* Avatar - smaller on mobile for nested comments */}
      <Avatar className={cn("mt-0.5 sm:mt-1 flex-shrink-0 ring-2 ring-blog-primary/10", depth > 0 ? "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" : "w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9")}>
        <AvatarImage src={(comment.User?.image || comment.user?.image) || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blog-primary to-blog-primary/80 text-white text-[10px] sm:text-xs font-blog-ui">
          {(comment.User?.name || comment.user?.name)?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* Comment Bubble - Editorial Style */}
        <div className="group relative">
          {isEditing ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[50px] sm:min-h-[60px] text-sm resize-none border border-slate-200 dark:border-slate-700 bg-blog-bg dark:bg-slate-900 focus:border-blog-primary/50 focus:ring-1 focus:ring-blog-primary/30 rounded-lg font-blog-body"
                autoFocus
              />
              <div className="flex gap-2 mt-2 sm:mt-3">
                <Button size="sm" onClick={handleEditSubmit} className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 bg-blog-primary hover:bg-blog-primary/90 rounded-lg font-blog-ui">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-blog-ui"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 inline-block max-w-full border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-white font-blog-display">
                  {comment.User?.name || comment.user?.name || "Anonymous"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 break-words whitespace-pre-wrap leading-relaxed font-blog-body">
                {comment.content}
              </p>
            </div>
          )}

          {/* Like Badge - Terracotta accent */}
          {likeCount > 0 && !isEditing && (
            <div className="absolute -bottom-1.5 sm:-bottom-2 right-0 bg-white dark:bg-slate-700 rounded-full px-1.5 sm:px-2 py-0.5 border border-slate-200 dark:border-slate-600 shadow-sm flex items-center gap-1">
              <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blog-primary fill-current" />
              <span className="text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 font-blog-ui">
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

        {/* Action Buttons - Editorial Style */}
        {!isEditing && (
          <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 ml-2 sm:ml-3 flex-wrap font-blog-ui">
            <button
              onClick={handleLike}
              className={cn(
                "text-[10px] sm:text-xs font-semibold transition-colors touch-manipulation py-0.5 px-1.5 rounded-md",
                isLiked
                  ? "text-blog-primary bg-blog-primary/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-blog-primary hover:bg-blog-primary/5"
              )}
            >
              Like
            </button>
            <button
              onClick={() => setShowReplyBox(!showReplyBox)}
              className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blog-accent hover:bg-blog-accent/5 transition-colors touch-manipulation py-0.5 px-1.5 rounded-md"
            >
              Reply
            </button>
            <span className="text-[9px] sm:text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
              {isMounted ? timeText : ""}
            </span>
          </div>
        )}

        {/* Reply Input - Editorial Style */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 sm:mt-2.5 flex gap-2 sm:gap-2.5 p-2 sm:p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ring-2 ring-blog-accent/20">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blog-accent to-blog-accent/80 text-white text-[8px] sm:text-[10px] font-blog-ui">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative min-w-0">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[50px] sm:min-h-[55px] text-xs sm:text-sm resize-none rounded-lg bg-blog-bg dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blog-accent/50 focus:ring-1 focus:ring-blog-accent/30 pr-9 sm:pr-10 py-2 font-blog-body placeholder:text-slate-400"
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
                  className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 h-6 w-6 sm:h-7 sm:w-7 p-0 rounded-full bg-blog-accent hover:bg-blog-accent/90 disabled:bg-slate-300 dark:disabled:bg-slate-600 shadow-sm"
                  aria-label="Send reply"
                >
                  <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested Replies - Editorial Style */}
        {hasReplies && (
          <div className="mt-2 sm:mt-3">
            {depth < 3 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-[10px] sm:text-xs font-semibold text-blog-primary dark:text-blog-primary hover:underline mb-1.5 sm:mb-2 touch-manipulation py-0.5 font-blog-ui"
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

  // --- Tree Utilities ---

  /** Extract actual data from API response wrapper ({ success, data, meta }) */
  const extractApiData = (response: { data: Record<string, unknown> }): Record<string, unknown> => {
    const body = response.data;
    if ('success' in body && 'data' in body && typeof body.data === 'object' && body.data !== null) {
      return body.data as Record<string, unknown>;
    }
    return body;
  };

  /** Find whether an item is a top-level comment or nested reply */
  const findItemInTree = (
    itemId: string
  ): { type: 'comment' | 'reply'; rootCommentId: string; depth: number } | null => {
    for (const comment of comments) {
      if (comment.id === itemId) {
        return { type: 'comment', rootCommentId: comment.id, depth: 0 };
      }
      if (comment.replies) {
        const found = findInReplies(comment.replies, itemId);
        if (found) {
          return { type: 'reply', rootCommentId: comment.id, depth: found.depth };
        }
      }
    }
    return null;
  };

  const findInReplies = (
    replies: Comment[],
    targetId: string
  ): { depth: number } | null => {
    for (const reply of replies) {
      if (reply.id === targetId) return { depth: reply.depth || 0 };
      if (reply.replies) {
        const found = findInReplies(reply.replies, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  /** Recursively update an item anywhere in the comment tree */
  const updateItemInTree = (
    items: Comment[],
    targetId: string,
    updater: (item: Comment) => Comment
  ): Comment[] => {
    return items.map((item) => {
      if (item.id === targetId) return updater(item);
      if (item.replies) {
        return { ...item, replies: updateItemInTree(item.replies, targetId, updater) };
      }
      return item;
    });
  };

  /** Recursively remove an item from the comment tree */
  const removeItemFromTree = (items: Comment[], targetId: string): Comment[] => {
    return items
      .filter((item) => item.id !== targetId)
      .map((item) => {
        if (item.replies) {
          return { ...item, replies: removeItemFromTree(item.replies, targetId) };
        }
        return item;
      });
  };

  /** Add a reply to a specific parent anywhere in the tree */
  const addReplyToTree = (
    items: Comment[],
    parentId: string,
    newReply: Comment
  ): Comment[] => {
    return items.map((item) => {
      if (item.id === parentId) {
        return { ...item, replies: [...(item.replies || []), newReply] };
      }
      if (item.replies) {
        return { ...item, replies: addReplyToTree(item.replies, parentId, newReply) };
      }
      return item;
    });
  };

  /** Build a Comment object from API response data with session fallbacks */
  const buildCommentFromResponse = (
    apiData: Record<string, unknown>,
    overrides: Partial<Comment>
  ): Comment => {
    return {
      id: (apiData.id as string) || '',
      content: (apiData.content as string) || '',
      createdAt: (apiData.createdAt as string) || new Date().toISOString(),
      updatedAt: (apiData.updatedAt as string) || new Date().toISOString(),
      userId: (apiData.userId as string) || session?.user?.id || '',
      postId,
      parentId: null,
      depth: 0,
      User: (apiData.User as Comment['User']) || {
        id: session?.user?.id || '',
        name: session?.user?.name || null,
        image: session?.user?.image || null,
      },
      user: (apiData.user as Comment['user']) || (apiData.User as Comment['user']) || {
        id: session?.user?.id || '',
        name: session?.user?.name || null,
        image: session?.user?.image || null,
      },
      replies: [],
      isLiked: false,
      likeCount: 0,
      ...overrides,
    };
  };

  // --- Handlers ---

  const handleAddComment = async () => {
    if (!newComment.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content: newComment,
      });

      const apiData = extractApiData(response);
      const newCommentData = buildCommentFromResponse(apiData, {
        parentId: null,
        depth: 0,
      });

      setComments((prev) => [newCommentData, ...prev]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch {
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

    try {
      const location = findItemInTree(parentId);
      if (!location) {
        toast.error("Parent comment not found");
        return;
      }

      const { rootCommentId, type, depth: parentDepth } = location;

      const response = await axios.post(
        `/api/posts/${postId}/comments/${rootCommentId}/replies`,
        {
          content,
          ...(type === 'reply' ? { parentReplyId: parentId } : {}),
        }
      );

      const apiData = extractApiData(response);
      const newReplyData = buildCommentFromResponse(apiData, {
        parentId,
        depth: parentDepth + 1,
      });

      setComments((prev) => addReplyToTree(prev, parentId, newReplyData));
      toast.success("Reply posted!");
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(axiosError.response?.data?.error || "Failed to post reply");
    }
  };

  const handleEdit = async (itemId: string, content: string) => {
    try {
      const location = findItemInTree(itemId);
      if (!location) {
        toast.error("Item not found");
        return;
      }

      if (location.type === 'comment') {
        await axios.patch(`/api/posts/${postId}/comments/${itemId}`, { content });
      } else {
        await axios.patch(
          `/api/posts/${postId}/comments/${location.rootCommentId}/replies/${itemId}`,
          { content }
        );
      }

      setComments((prev) =>
        updateItemInTree(prev, itemId, (item) => ({
          ...item,
          content,
          updatedAt: new Date().toISOString(),
        }))
      );
      toast.success("Updated successfully!");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      const location = findItemInTree(itemId);
      if (!location) {
        toast.error("Item not found");
        return;
      }

      if (location.type === 'comment') {
        await axios.delete(`/api/posts/${postId}/comments/${itemId}`);
      } else {
        await axios.delete(
          `/api/posts/${postId}/comments/${location.rootCommentId}/replies/${itemId}`
        );
      }

      setComments((prev) => removeItemFromTree(prev, itemId));
      toast.success("Deleted successfully!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleLike = async (itemId: string) => {
    // Optimistic update for instant UI feedback
    setComments((prev) =>
      updateItemInTree(prev, itemId, (item) => ({
        ...item,
        isLiked: !item.isLiked,
        likeCount: item.isLiked
          ? (item.likeCount || 1) - 1
          : (item.likeCount || 0) + 1,
      }))
    );

    try {
      const location = findItemInTree(itemId);
      if (!location) return;

      if (location.type === 'comment') {
        await axios.post(
          `/api/posts/${postId}/comments/${itemId}/reactions`,
          { type: "LIKE" }
        );
      } else {
        await axios.post(
          `/api/posts/${postId}/comments/${location.rootCommentId}/replies/${itemId}/reactions`,
          { type: "LIKE" }
        );
      }
    } catch {
      // Revert optimistic update on failure
      setComments((prev) =>
        updateItemInTree(prev, itemId, (item) => ({
          ...item,
          isLiked: !item.isLiked,
          likeCount: item.isLiked
            ? (item.likeCount || 1) - 1
            : (item.likeCount || 0) + 1,
        }))
      );
      toast.error("Failed to like");
    }
  };

  const sortedComments = [...comments]
    .filter((comment) => !!comment.id)
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.likeCount || 0) - (a.likeCount || 0);
    });

  return (
    <div className="w-full bg-blog-bg dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
      {/* Header - Editorial Style */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-2 bg-blog-primary/10 rounded-xl">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blog-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white font-blog-display">
              Comments
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-blog-ui">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </p>
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "popular")}
          className="text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-blog-primary/30 focus:border-blog-primary/50 cursor-pointer flex-shrink-0 px-3 py-1.5 rounded-lg font-blog-ui"
          aria-label="Sort comments by"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Relevant</option>
        </select>
      </div>

      {/* Comment Input - Editorial Style */}
      {session ? (
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex-shrink-0 ring-2 ring-blog-primary/20">
            <AvatarImage src={session.user?.image || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blog-primary to-blog-primary/80 text-white text-xs sm:text-sm font-blog-ui">
              {session.user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 relative min-w-0">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] sm:min-h-[70px] md:min-h-[80px] text-sm resize-none rounded-xl bg-blog-bg dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blog-primary/50 focus:ring-1 focus:ring-blog-primary/30 pr-10 sm:pr-12 py-2.5 sm:py-3 font-blog-body placeholder:text-slate-400"
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
              className="absolute bottom-2 sm:bottom-2.5 right-2 sm:right-2.5 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full bg-blog-primary hover:bg-blog-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-600 shadow-lg shadow-blog-primary/20"
              aria-label="Post comment"
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 mb-4 sm:mb-5 md:mb-6 text-center border border-slate-200 dark:border-slate-700">
          <MessageCircle className="w-8 h-8 mx-auto text-blog-primary/50 mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-blog-body">
            Please sign in to join the conversation
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 sm:space-y-4">
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
          <div className="text-center py-8 sm:py-10 md:py-12 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-3 bg-blog-primary/10 rounded-full w-fit mx-auto mb-3">
              <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blog-primary" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white mb-1 font-blog-display">
              No comments yet
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-blog-body">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
