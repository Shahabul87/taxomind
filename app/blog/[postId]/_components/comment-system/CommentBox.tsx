"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Smile, Send, Image as ImageIcon } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { logger } from '@/lib/logger';

interface CommentBoxProps {
  postId: string;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
  isReply?: boolean;
}

export const CommentBox = ({
  postId,
  onSubmit,
  placeholder = "Write a comment...",
  buttonText = "Post",
  isReply = false,
}: CommentBoxProps) => {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
    } catch (error) {
      logger.error("Error submitting comment:", error);
      
      let errorMessage = "Failed to submit comment";
      
      if (error instanceof Error) {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "Network connection issue. Please check your connection.";
        } else if (error.message.includes("unauthorized") || error.message.includes("authentication")) {
          errorMessage = "Authentication error. Please try signing in again.";
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${isReply ? 'pl-12 mt-2' : 'mt-4'} relative`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-grow relative rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[60px] border-0 bg-transparent resize-none p-3 pr-12 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!content.trim() || isSubmitting}
              className="h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              onClick={handleSubmit}
            >
              <Send className="h-5 w-5 text-blue-500" />
            </Button>
          </div>
        </div>
      </div>
      
      {showEmojiPicker && (
        <div className="absolute right-0 bottom-full mb-2 z-10">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  );
}; 