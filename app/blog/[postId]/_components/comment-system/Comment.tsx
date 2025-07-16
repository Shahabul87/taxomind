"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { CommentBox } from "./CommentBox";
import { ReactionButton } from "./ReactionButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";
import { TimeAgo } from "@/app/components/ui/time-ago";

interface ReactionType {
  id: string;
  type: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

export interface CommentType {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt?: Date;
  parentReplyId?: string | null;
  depth?: number; // Track nesting level
  path?: string; // Full hierarchical path
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  reactions: ReactionType[];
  replies?: CommentType[];
  _delete?: boolean; // Flag for UI deletions
}

interface CommentProps {
  comment: CommentType;
  postId: string;
  depth?: number;
  parentId?: string;
  onDelete?: (commentId: string) => Promise<void>;
  onReact?: (commentId: string, reactionType: string) => Promise<void>;
  onReply?: (commentId: string, content: string) => Promise<void>;
  onUpdate?: (commentId: string, content: string) => Promise<void>;
  onCommentUpdate?: (updatedComment: Partial<CommentType>) => void;
}

const MAX_REPLY_DEPTH = 5;
const REPLIES_TO_SHOW = 3;

export const Comment = ({
  comment,
  postId,
  depth = 0,
  parentId,
  onDelete,
  onReact,
  onReply,
  onUpdate,
  onCommentUpdate,
}: CommentProps) => {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [localComment, setLocalComment] = useState<CommentType>(comment);
  const [showAllReplies, setShowAllReplies] = useState(false);
  
  const isSessionLoading = sessionStatus === 'loading';
  const hasSessionError = sessionStatus === 'error';
  
  // Debug logging
  useEffect(() => {
    if (depth > 0) {
      console.log(`Reply comment ${localComment.id} with parent ${parentId || 'unknown'}, depth: ${depth}`);
    }
  }, [depth, localComment.id, parentId]);
  
  useEffect(() => {
    if (depth > 0) {
      console.log(`[Reply ${comment.id}] Depth: ${depth}, Parent: ${parentId}, Has replies: ${comment.replies?.length || 0}`);
      if (comment.parentReplyId) {
        console.log(`  → This is a nested reply to reply ${comment.parentReplyId}`);
      }
      if (comment.replies?.length) {
        console.log(`  → This reply has ${comment.replies.length} nested replies`);
      }
    }
  }, [comment, depth, parentId]);
  
  const isAuthor = session?.user?.id === comment.userId;
  const canReply = depth < MAX_REPLY_DEPTH;
  const hasReplies = localComment.replies && localComment.replies.length > 0;
  
  // If we have more than REPLIES_TO_SHOW replies, show a "Show more" button
  const visibleReplies = hasReplies 
    ? (showAllReplies 
        ? localComment.replies 
        : localComment.replies!.slice(0, REPLIES_TO_SHOW))
    : [];
  
  const hiddenRepliesCount = hasReplies 
    ? localComment.replies!.length - (showAllReplies ? 0 : REPLIES_TO_SHOW) 
    : 0;

  const handleReply = async (content: string) => {
    if (!onReply) return;
    
    if (isSessionLoading) {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || hasSessionError) {
      toast.error("Please sign in to reply");
      return;
    }
    
    // Check for maximum nesting depth
    if (depth >= MAX_REPLY_DEPTH) {
      toast.error(`Cannot add more nested replies (maximum depth of ${MAX_REPLY_DEPTH} reached)`);
      setIsReplying(false);
      return;
    }
    
    try {
      if (depth > 0) {
        // This is a reply to another reply
        console.log(`Replying to a reply: ${localComment.id}, parent: ${parentId}, depth: ${depth}`);
        
        // Try both APIs for nested replies - using create-nested-reply for consistent handling
        try {
          // Add detailed debugger for troubleshooting
          console.log("Sending nested reply request:", {
            content,
            postId,
            commentId: parentId,
            parentReplyId: localComment.id,
            currentDepth: depth,
            time: new Date().toISOString()
          });
          
          // Create the request with all needed data
          const requestData = {
            content,
            postId,
            commentId: parentId, // This is the top-level comment ID
            parentReplyId: localComment.id // This is the direct parent reply
          };
          
          console.log("Request data (stringified):", JSON.stringify(requestData));
          console.log("DEBUGGING - Current Reply:", {
            replyId: localComment.id,
            depth,
            parentId,
            parentReplyId: localComment.parentReplyId,
            fullComment: localComment
          });
          
          // Try the primary nested reply API first
          let response;
          
          try {
            // Add more detailed debugging
            console.log(`Attempting primary API call to /api/create-nested-reply...`);
            
            response = await axios.post(`/api/create-nested-reply`, requestData, {
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log("Primary API call successful");
          } catch (primaryApiError) {
            console.error("Primary API failed with error:", primaryApiError);
            
            if (axios.isAxiosError(primaryApiError)) {
              console.error("Primary API error details:", {
                status: primaryApiError.response?.status,
                statusText: primaryApiError.response?.statusText,
                data: primaryApiError.response?.data,
                message: primaryApiError.message
              });
            }
            
            // If the primary API fails, try the fallback
            console.log("Attempting fallback API call to /api/nested-replies...");
            
            try {
              response = await axios.post(`/api/nested-replies`, requestData, {
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              console.log("Fallback API call successful");
            } catch (fallbackError) {
              console.error("Fallback API failed with error:", fallbackError);
              
              if (axios.isAxiosError(fallbackError)) {
                console.error("Fallback API error details:", {
                  status: fallbackError.response?.status,
                  statusText: fallbackError.response?.statusText,
                  data: fallbackError.response?.data,
                  message: fallbackError.message
                });
              }
              
              // If both APIs fail, try the third fallback
              console.log("Attempting third fallback API call to /api/nested-reply...");
              
              try {
                response = await axios.post(`/api/nested-reply`, requestData, {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log("Third fallback API call successful");
              } catch (thirdError) {
                console.error("Third fallback also failed:", thirdError);
                
                // Last resort - use the simple-reply API that has minimal validation
                console.log("LAST RESORT: Trying simplified API at /api/simple-reply...");
                
                response = await axios.post(`/api/simple-reply`, requestData, {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log("Simple reply API call successful");
              }
            }
          }
          
          console.log("Nested reply created successfully:", response.data);
          
          // Ensure the reply has the correct structure
          const newReply = {
            ...response.data,
            replies: [], // Initialize nested replies array
            user: response.data.user || {
              id: session.user.id,
              name: session.user.name,
              image: session.user.image
            },
            reactions: response.data.reactions || [],
            depth: depth + 1, // Set the correct depth
            path: response.data.path || `${parentId}/${localComment.id}/${response.data.id}`
          };
          
          // Force show all replies when a new one is added
          setShowAllReplies(true);
          
          // Add to local state for immediate UI feedback - be careful with optimistic updates
          setLocalComment(prev => {
            // Clone the current replies array or create a new one
            const updatedReplies = [...(prev.replies || [])];
            // Add the new reply
            updatedReplies.push(newReply);
            // Return the updated state
            return {
              ...prev,
              replies: updatedReplies
            };
          });
          
          // Update parent component state
          if (onCommentUpdate) {
            // Create a new array instead of modifying the existing one
            const updatedReplies = [...(localComment.replies || []), newReply];
            
            onCommentUpdate({
              id: localComment.id,
              replies: updatedReplies
            });
          }
          
          // Hide the reply form
          setIsReplying(false);
          
          // Show success message
          toast.success("Reply added successfully");
        } catch (apiError) {
          console.error("Nested reply API error:", apiError);
          
          if (axios.isAxiosError(apiError)) {
            const statusCode = apiError.response?.status;
            const responseData = apiError.response?.data;
            
            console.error(`API Error - Status: ${statusCode}, Message:`, responseData);
            
            // Detailed error based on status code
            if (statusCode === 401) {
              toast.error("You must be signed in to reply");
            } else if (statusCode === 404) {
              toast.error("The comment or post was not found");
              console.error("404 Details:", apiError.response?.data);
            } else if (statusCode === 400) {
              toast.error(`Bad request: ${responseData?.error || 'Invalid data'}`);
            } else {
              toast.error(`Error: ${apiError.response?.data?.error || apiError.message}`);
            }
          } else {
            console.error("Non-Axios error:", apiError);
            toast.error("Failed to add reply. Please try again.");
          }
        }
      } else {
        // This is a direct reply to a comment
        await onReply(localComment.id, content);
      }
      
      setIsReplying(false);
    } catch (error) {
      console.error("Error replying:", error);
      
      // Provide more detailed error messages
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error("Error: API endpoint not found.");
          console.error("API endpoint not found. Details:", error.response?.data);
        } else if (error.response?.status === 400) {
          toast.error(error.response.data?.error || "Invalid request when adding reply");
        } else if (error.response?.status === 401) {
          toast.error("You must be signed in to reply");
        } else {
          toast.error(error.response?.data?.error || "Failed to add reply. Please try again.");
        }
      } else {
        toast.error("Failed to add reply. Please try again.");
      }
    }
  };

  const handleUpdate = async () => {
    if (!onUpdate || !isEditing) return;
    
    if (isSessionLoading) {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || hasSessionError) {
      toast.error("Please sign in to update");
      return;
    }
    
    try {
      // Different update approaches based on depth
      if (depth > 0) {
        // This is a nested reply, use dedicated endpoint with proper URL encoding
        console.log(`Updating nested reply: ${localComment.id}, content: ${editContent.slice(0, 20)}...`);
        
        // Properly encode the URL parameters
        const url = `/api/update-nested-reply?` + 
          new URLSearchParams({
            postId,
            commentId: parentId || '',
            replyId: localComment.id
          }).toString();
        
        console.log(`Update URL: ${url}`);
        const response = await axios.patch(url, {
          content: editContent
        });
        
        const updatedReply = response.data;
        
        // Update local state
        setLocalComment({
          ...localComment,
          content: editContent,
          updatedAt: updatedReply.updatedAt || new Date()
        });
        
        // Update parent component state
        if (onCommentUpdate) {
          onCommentUpdate({
            id: localComment.id,
            content: editContent,
            updatedAt: updatedReply.updatedAt || new Date()
          });
        }
      } else {
        // Standard comment/reply update via parent handler
        await onUpdate(localComment.id, editContent);
        setLocalComment({
          ...localComment,
          content: editContent
        });
      }
      
      setIsEditing(false);
      toast.success("Update successful");
    } catch (error) {
      console.error("Error updating comment/reply:", error);
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Message:`, error.response?.data);
        toast.error(`Failed to update: ${error.response?.data?.error || error.message}`);
      } else {
        toast.error("Failed to update");
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (isSessionLoading) {
      toast.info("Session is loading, please wait...");
      return;
    }
    
    if (!session?.user || hasSessionError) {
      toast.error("Please sign in to delete");
      return;
    }
    
    // Check if this comment already has a deletion failed message
    // If so, clean it before attempting deletion again
    if (localComment.content.includes("(deletion failed, please try again)")) {
      // Update local state to clean the error message first
      const cleanContent = localComment.content.replace(/ \(deletion failed, please try again\)+/g, "");
      setLocalComment(prev => ({
        ...prev,
        content: cleanContent
      }));
    }
    
    try {
      // Immediately hide from UI for better user experience
      if (depth > 0 && parentId && onCommentUpdate) {
        // For nested replies, immediately remove from parent's replies array
        onCommentUpdate({
          id: localComment.id,
          _delete: true // Special flag to indicate deletion
        });
      }
      
      // Use different delete strategies based on the depth
      if (depth > 0) {
        // This is a nested reply, use dedicated endpoint
        console.log(`Attempting to delete nested reply:`, {
          replyId: localComment.id,
          parentId,
          postId,
          depth
        });
        
        // Properly encode the URL parameters
        const url = `/api/delete-nested-reply?` + 
          new URLSearchParams({
            postId,
            replyId: localComment.id
          }).toString();
        
        console.log(`Delete URL: ${url}`);
        await axios.delete(url);
        
        // Success message
        toast.success("Reply deleted successfully");
      } else {
        // This is a regular comment or top-level reply
        await onDelete(localComment.id);
      }
    } catch (error) {
      console.error("Error deleting comment/reply:", error);
      
      // If deletion fails, restore the comment in UI
      if (depth > 0 && parentId && onCommentUpdate) {
        // Clean any previous deletion failure messages before restoring
        let cleanContent = localComment.content;
        // Remove any previously added deletion failure messages
        cleanContent = cleanContent.replace(/ \(deletion failed, please try again\)+/g, "");
        
        // Restore the comment with a note - only add it once
        onCommentUpdate({
          id: localComment.id,
          content: cleanContent + " (deletion failed, please try again)",
          _delete: false // Make sure it's not marked for deletion anymore
        });
      }
      
      if (axios.isAxiosError(error)) {
        console.error(`Status: ${error.response?.status}, Message:`, error.response?.data);
        
        // More specific error messages
        if (error.response?.status === 404) {
          toast.error("The comment was not found. It may have been already deleted.");
        } else if (error.response?.status === 403) {
          toast.error("You don't have permission to delete this comment.");
        } else {
          toast.error(`Failed to delete: ${error.response?.data?.error || error.message}`);
        }
      } else {
        toast.error("Failed to delete");
      }
    }
  };

  const handleReactionUpdate = (updatedComment: Partial<CommentType>) => {
    console.log(`Reaction update in ${depth > 0 ? 'reply' : 'comment'}:`, {
      commentId: localComment.id,
      parentId,
      depth,
      updatedReactions: updatedComment.reactions?.length || 0
    });
    
    setLocalComment(prev => ({
      ...prev,
      reactions: updatedComment.reactions || prev.reactions
    }));
    
    if (onCommentUpdate) {
      onCommentUpdate({
        ...updatedComment,
        id: localComment.id
      });
    }
  };

  return (
    <div className={cn("flex flex-col", depth > 0 ? "ml-8 mt-3" : "")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={localComment.user.image || ""} />
            <AvatarFallback>{localComment.user.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>

        {/* Comment content */}
        <div className="flex-grow">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">
                  {localComment.user.name}
                </div>
                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={handleUpdate}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditContent(localComment.content);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm mt-1">{localComment.content}</div>
                )}
              </div>

              {/* Actions dropdown */}
              {isAuthor && !isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-500"
                      onClick={handleDelete}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Comment actions */}
          <div className="flex items-center gap-4 text-xs px-2 mt-1">
            <ReactionButton
              postId={postId}
              commentId={localComment.id}
              initialReactions={localComment.reactions}
              onReactionUpdate={handleReactionUpdate}
              isReply={depth > 0}
              parentCommentId={depth > 0 ? parentId : undefined}
            />
            
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Reply
              </button>
            )}
            
            <span className="text-gray-400">
              <TimeAgo date={localComment.createdAt} />
              {localComment.updatedAt && 
                localComment.updatedAt.toString() !== localComment.createdAt.toString() && 
                " (edited)"}
            </span>
          </div>

          {/* Reply form */}
          {isReplying && (
            <CommentBox
              postId={postId}
              onSubmit={handleReply}
              placeholder="Write a reply..."
              buttonText="Reply"
              isReply={true}
            />
          )}

          {/* Replies */}
          {hasReplies && visibleReplies.length > 0 && (
            <div className="mt-2">
              {visibleReplies.map((reply) => (
                <Comment
                  key={`reply-${reply.id}`}
                  comment={{
                    ...reply,
                    postId: postId
                  }}
                  postId={postId}
                  depth={depth + 1}
                  parentId={localComment.id}
                  onDelete={onDelete}
                  onReact={onReact}
                  onReply={canReply ? onReply : undefined}
                  onUpdate={onUpdate}
                  onCommentUpdate={(updatedReply) => {
                    console.log(`Reply update for parent comment ${localComment.id}:`, updatedReply);
                    
                    // Check if this is a delete operation
                    if (updatedReply._delete) {
                      console.log(`Deleting reply ${updatedReply.id} from UI`);
                      // Filter out the deleted reply
                      const updatedReplies = (localComment.replies || []).filter(r => 
                        r.id !== updatedReply.id
                      );
                      
                      // Update local state first for immediate UI feedback
                      setLocalComment(prev => ({
                        ...prev,
                        replies: updatedReplies
                      }));
                      
                      // Update parent component state
                      if (onCommentUpdate) {
                        onCommentUpdate({
                          ...localComment,
                          replies: updatedReplies
                        });
                      }
                      return;
                    }
                    
                    // Handle case where a deletion was attempted but failed
                    // and the comment was restored with the failure message
                    if (updatedReply._delete === false && updatedReply.content) {
                      console.log(`Restoring previously deleted reply ${updatedReply.id}`);
                    }
                    
                    // Regular update (not deletion)
                    // Find the updated reply in the list
                    const updatedReplies = (localComment.replies || []).map(r => 
                      r.id === updatedReply.id 
                        ? { ...r, ...updatedReply } 
                        : r
                    );
                    
                    // Update local state first for immediate UI feedback
                    setLocalComment(prev => ({
                      ...prev,
                      replies: updatedReplies
                    }));
                    
                    // Update parent component state
                    if (onCommentUpdate) {
                      onCommentUpdate({
                        ...localComment,
                        replies: updatedReplies
                      });
                    }
                  }}
                />
              ))}
              
              {/* Show more replies button */}
              {hiddenRepliesCount > 0 && (
                <button
                  onClick={() => setShowAllReplies(true)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 ml-8 mt-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Show {hiddenRepliesCount} more {hiddenRepliesCount === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 