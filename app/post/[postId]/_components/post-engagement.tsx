"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2, Printer, Download, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostEngagementProps {
  postId: string;
  initialLikes?: number;
  initialBookmarked?: boolean;
}

export function PostEngagement({ postId, initialLikes = 0, initialBookmarked = false }: PostEngagementProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Reactions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "transition-all",
                liked && "text-red-500"
              )}
            >
              <Heart className={cn("w-5 h-5 mr-2", liked && "fill-current")} />
              <span>{likes}</span>
            </Button>

            <Button variant="ghost" size="sm">
              <ThumbsUp className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Like</span>
            </Button>

            <Button variant="ghost" size="sm">
              <MessageCircle className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Comment</span>
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={cn(
                "transition-all",
                bookmarked && "text-blue-500"
              )}
            >
              <Bookmark className={cn("w-5 h-5", bookmarked && "fill-current")} />
              <span className="hidden md:inline ml-2">
                {bookmarked ? "Saved" : "Save"}
              </span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline ml-2">Share</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handlePrint} className="hidden md:flex">
              <Printer className="w-5 h-5 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
