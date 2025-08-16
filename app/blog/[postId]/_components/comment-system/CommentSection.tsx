"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import axios from "axios";
import { Comment, CommentType } from "./Comment";
import { CommentBox } from "./CommentBox";
import { Post } from "@prisma/client";
import { MessageSquare, Filter, Clock, ThumbsUp } from "lucide-react";
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { CommentPagination } from "./CommentPagination";

interface CommentSectionProps {
  postId: string;
  initialComments?: CommentType[];
}

type SortOption = "newest" | "oldest" | "popular";

export const CommentSection = ({ postId, initialComments = [] }: CommentSectionProps) => {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  const [isLoading, setIsLoading] = useState(!initialComments.length);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionError, setIsSessionError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasMore: false
  });
  
  // Get page from URL or default to 1
  const page = parseInt(searchParams.get('page') || '1');
  
  const updateUrlWithPage = useCallback((newPage: number) => {
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    
    // Set new page value
    params.set('page', newPage.toString());
    
    // Update the URL without refreshing
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const fetchComments = useCallback(async (pageToFetch = 1, sortOption = 'newest') => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pageToFetch.toString(),
        sortBy: sortOption
      });
      
      const response = await axios.get(`/api/posts/${postId}/comments?${params}`);
      const { data: fetchedComments, pagination: paginationData } = response.data;
      
      // Process the comments to properly structure nested replies
      const commentsWithStructuredReplies = fetchedComments.map((comment: CommentType) => {
        // If comment has replies, organize them into a proper tree structure
        if (comment.replies && comment.replies.length > 0) {
          // Build a map for efficient lookup
          const replyMap = new Map<string, CommentType>();
          
          // First pass: add all replies to the map with initialized children arrays
          comment.replies.forEach((reply: CommentType) => {
            replyMap.set(reply.id, {
              ...reply,
              replies: [] // Initialize empty replies array for each reply
            });
          });
          
          // Organize by using the stored path or depth
          const topLevelReplies: CommentType[] = [];
          
          // Sort replies by depth for consistent processing
          const sortedReplies = [...comment.replies].sort((a, b) => 
            (a.depth || 0) - (b.depth || 0)
          );
          
          // Build the hierarchical structure
          sortedReplies.forEach((reply: any) => {
            const replyWithReplies = replyMap.get(reply.id);
            
            if (!replyWithReplies) return;
            
            // If it has a parentReplyId, add it to its parent's replies
            if (reply.parentReplyId) {
              const parentReply = replyMap.get(reply.parentReplyId);
              if (parentReply) {
                parentReply.replies = [...(parentReply.replies || []), replyWithReplies];
              } else {
                // Fallback if parent not found (shouldn't happen with valid data)
                topLevelReplies.push(replyWithReplies);
              }
            } else {
              // This is a top-level reply (direct reply to the comment)
              topLevelReplies.push(replyWithReplies);
            }
          });
          
          // Replace flat replies array with the hierarchical structure
          return {
            ...comment,
            replies: topLevelReplies
          };
        }
        
        return comment;
      });
      
      setComments(commentsWithStructuredReplies);
      setPagination(paginationData);
      
      // Update page in URL if it doesn't match
      if (window.location.search.indexOf(`page=${pageToFetch}`) === -1) {
        updateUrlWithPage(pageToFetch);
      }
    } catch (error: any) {
      logger.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [postId, updateUrlWithPage]);

  // Add useEffect to handle session errors
  useEffect(() => {
    if (status === 'loading') return;
    
    // Session doesn't have 'error' status, only 'loading', 'authenticated', 'unauthenticated'
    // We can consider unauthenticated as a non-error state
    setIsSessionError(false);
  }, [status]);

  // Fetch comments when page or sort changes
  useEffect(() => {
    if (page !== pagination.page || initialComments.length === 0) {
      fetchComments(page, sortBy);
    }
  }, [page, sortBy, fetchComments, pagination.page, initialComments.length]);

  // Handle URL parameter changes (for browser back/forward navigation)
  useEffect(() => {
    // Get sort parameter from URL
    const urlSortBy = searchParams.get('sortBy') as SortOption;
    
    // If sort parameter exists and is different from current, update it
    if (urlSortBy && urlSortBy !== sortBy) {
      setSortBy(urlSortBy);
    }
    
    // Get page from URL
    const urlPage = parseInt(searchParams.get('page') || '1');
    
    // Fetch comments if the page or sort has changed
    if (urlPage !== pagination.page || (urlSortBy && urlSortBy !== sortBy)) {
      fetchComments(urlPage, urlSortBy || sortBy);
    }
  }, [searchParams, sortBy, pagination.page, fetchComments]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateUrlWithPage(newPage);
  };

  const handleAddComment = async (content: string) => {
    if (status === 'loading') {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || isSessionError) {
      toast.error("Please sign in to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content,
      });

      const newComment = response.data;
      
      // Refresh the first page of comments since we've added a new one
      // This ensures we respect the sorting and pagination
      fetchComments(1, sortBy);
      
      toast.success("Comment added");
    } catch (error: any) {
      logger.error("Error adding comment:", error);
      
      // Handle rate limit errors
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const rateLimitInfo = error.response.data?.rateLimitInfo;
        const errorMessage = error.response.data?.error || "You're commenting too quickly. Please wait a moment.";
        
        toast.error(errorMessage);
      } else {
        toast.error("Failed to add comment");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    if (!session?.user) {
      toast.error("Please sign in to reply");
      return;
    }

    try {
      // For top-level replies to comments
      const response = await axios.post(`/api/posts/${postId}/comments/${commentId}/replies`, {
        content,
      });

      const newReply = response.data;

      // Update the comments state with the new reply
      setComments(prev => 
        prev.map(comment => {
          if (comment.id === commentId) {
            // Add the new reply to this comment
            return {
              ...comment,
              replies: [...(comment.replies || []), {
                ...newReply,
                replies: [] // Initialize an empty replies array for nested structure
              }]
            };
          }
          return comment;
        })
      );
      
      toast.success("Reply added");
    } catch (error: any) {
      logger.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const handleUpdate = async (commentId: string, content: string) => {
    if (status === 'loading') {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || isSessionError) {
      toast.error("Please sign in to update this comment");
      return;
    }

    try {
      // Check if it's a top-level comment or a reply by looking at our current state
      const isTopLevelComment = comments.some(c => c.id === commentId);
      let updatedComment: any;
      
      if (isTopLevelComment) {
        // It's a top-level comment - use the standard endpoint
        const response = await axios.patch(`/api/posts/${postId}/comments/${commentId}`, {
          content,
        });
        updatedComment = response.data;
        
        // Update top-level comment in state
        setComments(prev => 
          prev.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                content: updatedComment.content,
                updatedAt: updatedComment.updatedAt
              };
            }
            return comment;
          })
        );
      } else {
        // It's a reply - we need to find which comment it belongs to
        let parentCommentId: string | null = null;
        let isNestedReply = false;
        
        // Find if this is a first-level reply or deeper
        for (const comment of comments) {
          // Check if it's a direct reply to this comment
          const isDirectReply = comment.replies?.some(r => r.id === commentId);
          if (isDirectReply) {
            parentCommentId = comment.id;
            break;
          }
          
          // Check if it's a deeper nested reply
          const hasNestedReply = comment.replies?.some(r => {
            // Recursively check if this reply or any of its children contains our target
            const checkReplies = (replies: CommentType[] | undefined): boolean => {
              if (!replies || replies.length === 0) return false;
              return replies.some(nr => 
                nr.id === commentId || checkReplies(nr.replies)
              );
            };
            
            return checkReplies(r.replies);
          });
          
          if (hasNestedReply) {
            parentCommentId = comment.id;
            isNestedReply = true;
            break;
          }
        }
        
        if (isNestedReply) {
          // This is a nested reply (beyond first level) - use the nested-reply update endpoint
          console.log(`Updating nested reply: ${commentId}, content: ${content.slice(0, 20)}...`);
          
          // Use the specialized API for updating nested replies
          const response = await axios.patch(`/api/update-nested-reply?${new URLSearchParams({
            postId,
            replyId: commentId
          }).toString()}`, {
            content
          });
          
          updatedComment = response.data;
        } else if (parentCommentId) {
          // It's a first-level reply - use the standard replies endpoint
          const response = await axios.patch(
            `/api/posts/${postId}/comments/${parentCommentId}/replies/${commentId}`,
            { content }
          );
          updatedComment = response.data;
        } else {
          // Couldn't find parent - try the generic endpoint as fallback
          const response = await axios.patch(`/api/posts/${postId}/comments/${commentId}`, {
            content,
          });
          updatedComment = response.data;
        }
        
        // Update comments state with the updated reply using recursive function
        setComments(prev => 
          prev.map(comment => {
            // Helper function to recursively update the reply in the tree
            const updateReplyContent = (replies: CommentType[] | undefined): CommentType[] => {
              if (!replies || replies.length === 0) return [];
              
              return replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    content,
                    updatedAt: updatedComment.updatedAt
                  };
                }
                
                // Recursively update nested replies
                if (reply.replies && reply.replies.length > 0) {
                  return {
                    ...reply,
                    replies: updateReplyContent(reply.replies)
                  };
                }
                
                return reply;
              });
            };
            
            // Apply the recursive update function
            return {
              ...comment,
              replies: updateReplyContent(comment.replies)
            };
          })
        );
      }
      
      toast.success("Comment updated");
    } catch (error: any) {
      logger.error("Error updating comment/reply:", error);
      
      // More detailed error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("The comment or reply was not found");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to update this");
        } else {
          toast.error(`Failed to update: ${error.response?.data?.error || error.message}`);
        }
      } else {
        toast.error("Failed to update comment");
      }
    }
  };

  const handleDelete = async (commentId: string) => {
    if (status === 'loading') {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || isSessionError) {
      toast.error("Please sign in to delete this comment");
      return;
    }

    try {
      // Check if it's a top-level comment or a reply by looking at our current state
      const isTopLevelComment = comments.some(c => c.id === commentId);
      
      if (isTopLevelComment) {
        // It's a top-level comment - use the standard endpoint
        await axios.delete(`/api/posts/${postId}/comments/${commentId}`);
      } else {
        // It's a reply - we need to find which comment it belongs to
        let parentCommentId: string | null = null;
        let isNestedReply = false;
        
        // Find if this is a first-level reply or deeper
        for (const comment of comments) {
          // Check if it's a direct reply to this comment
          const isDirectReply = comment.replies?.some(r => r.id === commentId);
          if (isDirectReply) {
            parentCommentId = comment.id;
            break;
          }
          
          // Check if it's a deeper nested reply
          const hasNestedReply = comment.replies?.some(r => {
            // Recursively check if this reply or any of its children contains our target
            const checkReplies = (replies: CommentType[] | undefined): boolean => {
              if (!replies || replies.length === 0) return false;
              return replies.some(nr => 
                nr.id === commentId || checkReplies(nr.replies)
              );
            };
            
            return checkReplies(r.replies);
          });
          
          if (hasNestedReply) {
            parentCommentId = comment.id;
            isNestedReply = true;
            break;
          }
        }
        
        if (isNestedReply) {
          // This is a nested reply (beyond first level) - use the nested-reply delete endpoint

          // Use the specialized API for deleting nested replies
          await axios.delete(`/api/delete-nested-reply?${new URLSearchParams({
            postId,
            replyId: commentId
          }).toString()}`);
        } else if (parentCommentId) {
          // It's a first-level reply - use the standard replies endpoint
          await axios.delete(`/api/posts/${postId}/comments/${parentCommentId}/replies/${commentId}`);
        } else {
          // Couldn't find parent - try the generic endpoint
          await axios.delete(`/api/posts/${postId}/comments/${commentId}`);
        }
      }
      
      // If a top-level comment was deleted, refresh the entire list
      // Otherwise, update the comment state optimistically
      if (isTopLevelComment) {
        // Refresh the current page of comments
        fetchComments(pagination.page, sortBy);
      } else {
        // Update the comment state optimistically
        setComments(prev => {
          // First check if it's a top-level comment
          if (isTopLevelComment) {
            return prev.filter(c => c.id !== commentId);
          }
          
          // Otherwise, recursively filter out the reply from all comments
          return prev.map(comment => {
            // Helper function to recursively remove the reply from the tree
            const filterReplies = (replies: CommentType[] | undefined): CommentType[] => {
              if (!replies || replies.length === 0) return [];
              
              return replies
                .filter(r => r.id !== commentId) // Remove direct match
                .map(r => ({
                  ...r,
                  // Recursively filter child replies too
                  replies: filterReplies(r.replies)
                }));
            };
            
            return {
              ...comment,
              replies: filterReplies(comment.replies)
            };
          });
        });
      }
      
      toast.success("Comment deleted");
    } catch (error: any) {
      logger.error("Error deleting comment/reply:", error);
      
      // More detailed error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("The comment or reply was not found");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to delete this");
        } else {
          toast.error(`Failed to delete: ${error.response?.data?.error || error.message}`);
        }
      } else {
        toast.error("Failed to delete comment");
      }
    }
  };

  const handleReact = async (commentId: string, reactionType: string, isReply = false) => {
    if (!session?.user) {
      toast.error("Please sign in to react");
      return;
    }

    try {

      // The API call is handled by the ReactionButton component, 
      // but we're providing this function for consistent interface
      return;
    } catch (error: any) {
      logger.error("Error reacting to comment:", error);
      toast.error("Failed to react to comment");
      throw error;
    }
  };

  // Sort comments based on selected option
  const sortComments = (comments: CommentType[], sortOption: SortOption): CommentType[] => {
    switch (sortOption) {
      case "newest":
        return [...comments].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return [...comments].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "popular":
        return [...comments].sort((a, b) => 
          (b.reactions?.length || 0) - (a.reactions?.length || 0)
        );
      default:
        return comments;
    }
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    
    // When sort changes, always go back to page 1
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    params.set('sortBy', value);
    
    // Update URL and refresh data
    router.push(`?${params.toString()}`, { scroll: false });
    
    // Fetch comments with new sort
    fetchComments(1, value);
  };

  // Get the sorted comments
  const sortedComments = sortComments(comments, sortBy);

  // Helper function to update nested replies in the comments tree
  const updateNestedReplyState = (
    comments: CommentType[], 
    commentId: string, 
    replyId: string, 
    updateFn: (reply: CommentType) => CommentType
  ): CommentType[] => {
    return comments.map(comment => {
      // If this is the target comment
      if (comment.id === commentId) {
        // First check if we should filter out the reply (if updateFn returns null)
        if (typeof updateFn === 'function') {
          const updatedReplies = comment.replies?.map(reply => {
            if (reply.id === replyId) {
              const updatedReply = updateFn(reply);
              return updatedReply ? updatedReply : null;
            }
            
            // Also check nested replies within this reply
            if (reply.replies && reply.replies.length > 0) {
              return {
                ...reply,
                replies: reply.replies
                  .map(nestedReply => 
                    nestedReply.id === replyId 
                      ? (updateFn(nestedReply) || null)
                      : nestedReply
                  )
                  .filter(Boolean) // Remove any null values
              };
            }
            
            return reply;
          }).filter(Boolean) as CommentType[]; // Filter out any null values
          
          return {
            ...comment,
            replies: updatedReplies || []
          };
        }
      }
      return comment;
    });
  };

  // Helper function to count all comments and their nested replies
  const getTotalCommentCount = (comments: CommentType[]): number => {
    let count = comments.length;
    
    // Add all nested replies
    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        // Helper function to recursively count nested replies
        const countReplies = (replies: CommentType[]): number => {
          if (!replies || replies.length === 0) return 0;
          
          let replyCount = replies.length;
          
          // Add counts from deeper nested replies
          for (const reply of replies) {
            if (reply.replies && reply.replies.length > 0) {
              replyCount += countReplies(reply.replies);
            }
          }
          
          return replyCount;
        };
        
        count += countReplies(comment.replies);
      }
    }
    
    return count;
  };

  return (
    <div className="mt-10">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <h2 className="text-2xl font-bold">
          Comments ({getTotalCommentCount(comments)})
        </h2>
      </div>

      {/* Comment Sort Options */}
      <div className="flex justify-between items-center mb-6">
        <Select
          value={sortBy}
          onValueChange={(value) => handleSortChange(value as SortOption)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Newest</span>
              </div>
            </SelectItem>
            <SelectItem value="oldest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Oldest</span>
              </div>
            </SelectItem>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                <span>Most Reactions</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Comment Box */}
      <div className="mb-8">
        <CommentBox
          postId={postId}
          onSubmit={handleAddComment}
        />
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : sortedComments.length > 0 ? (
          <>
            {sortedComments.map(comment => (
              <Comment
                key={`comment-${comment.id}`}
                comment={comment}
                postId={postId}
                onDelete={handleDelete}
                onReact={handleReact}
                onReply={handleReply}
                onUpdate={handleUpdate}
                onCommentUpdate={(updatedComment) => {
                  // Check if this is a direct update to the comment
                  if (updatedComment.id === comment.id) {
                    setComments(prev => 
                      prev.map(c => c.id === updatedComment.id ? {...c, ...updatedComment} : c)
                    );
                    return;
                  }
                  
                  // If we get here, it's likely a nested reply update

                  // Helper function to recursively process nested replies
                  const processNestedReplies = (replies: CommentType[]): CommentType[] => {
                    if (!replies || replies.length === 0) return [];
                    
                    return replies.map(reply => {
                      // If this is the reply being updated
                      if (reply.id === updatedComment.id) {
                        // Check if this is a delete operation
                        if (updatedComment._delete === true) {

                          return null; // Will be filtered out
                        }
                        
                        // Check if this is a "restore after failed deletion" operation
                        if (updatedComment._delete === false) {

                          // Make sure we use the updated content that doesn't accumulate error messages
                          return { ...reply, ...updatedComment };
                        }
                        
                        // Regular update
                        return { ...reply, ...updatedComment };
                      }
                      
                      // If this reply has nested replies, process them recursively too
                      if (reply.replies && reply.replies.length > 0) {
                        const updatedNestedReplies = processNestedReplies(reply.replies);

                        // Check if any nested replies were deleted - this improves deletion of child replies
                        const hadNestedReplies = reply.replies.length > 0;
                        const hasRepliesAfterUpdate = updatedNestedReplies.length > 0;

                        // If this reply had replies, but all its replies were deleted,
                        // we need to update its UI state to reflect it has no more replies
                        if (hadNestedReplies && !hasRepliesAfterUpdate) {
}
                        return {
                          ...reply,
                          replies: updatedNestedReplies
                        };
                      }
                      
                      // No changes to this reply
                      return reply;
                    }).filter(Boolean) as CommentType[]; // Filter out null values (deleted replies)
                  };
                  
                  // Update the comment with processed replies
                  setComments(prev => 
                    prev.map(c => {
                      if (c.id === comment.id) {
                        const processedReplies = processNestedReplies(c.replies || []);
                        return {
                          ...c,
                          replies: processedReplies
                        };
                      }
                      return c;
                    })
                  );
                }}
              />
            ))}
            
            {/* Add pagination */}
            <CommentPagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-10">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">No comments yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to comment on this post!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 