"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostchapterActionsVelenProps {
  disabled: boolean;
  postId: string;
  chapterId: string;
  isPublished: boolean;
}

export const PostchapterActionsVelen = ({
  disabled,
  postId,
  chapterId,
  isPublished
}: PostchapterActionsVelenProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      if (isPublished) {
        await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}/unpublish`);
        toast.success("Chapter unpublished", {
          description: "Your chapter is now hidden from readers"
        });
      } else {
        await axios.patch(`/api/posts/${postId}/postchapters/${chapterId}/publish`);
        toast.success("Chapter published!", {
          description: "Your chapter is now live and visible",
          icon: <Sparkles className="h-4 w-4" />
        });
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="sm"
      className={cn(
        "relative overflow-hidden group",
        "h-9 px-4 rounded-lg",
        "text-sm font-semibold",
        "transition-all duration-200",
        "active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        isPublished ? [
          // Unpublish styling
          "bg-amber-500 hover:bg-amber-600",
          "text-white",
          "shadow-sm shadow-amber-500/20",
          "hover:shadow-md hover:shadow-amber-500/30",
        ] : [
          // Publish styling
          "bg-gradient-to-r from-emerald-500 to-teal-500",
          "hover:from-emerald-600 hover:to-teal-600",
          "text-white",
          "shadow-sm shadow-emerald-500/20",
          "hover:shadow-md hover:shadow-emerald-500/30",
        ]
      )}
    >
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : isPublished ? (
          <>
            <EyeOff className="h-4 w-4" />
            <span>Unpublish</span>
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            <span>Publish Chapter</span>
          </>
        )}
      </div>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </Button>
  );
};
