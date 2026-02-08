"use client";

import axios from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { cn } from "@/lib/utils";

interface ActionsProps {
  disabled: boolean;
  postId: string;
  isPublished: boolean;
}

export const PostActions = ({
  disabled,
  postId,
  isPublished
}: ActionsProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      if (isPublished) {
        await axios.patch(`/api/posts/${postId}/unpublish`);
        toast.success("Post unpublished");
      } else {
        await axios.patch(`/api/posts/${postId}/publish`);
        toast.success("Post published");
        confetti.onOpen();
      }

      router.refresh();
    } catch (error) {
      logger.error("[POST_ACTIONS] Publish/unpublish failed:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  const onDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/posts/${postId}`);

      toast.success("Post deleted");
      router.refresh();
      router.push('/teacher/posts/all-posts');
    } catch (error) {
      logger.error("[POST_ACTIONS] Delete failed:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          "w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-lg transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isPublished ? [
            "bg-amber-500 dark:bg-amber-600 text-white",
            "hover:bg-amber-600 dark:hover:bg-amber-700",
            "focus:ring-amber-500 dark:focus:ring-amber-600",
            "disabled:bg-amber-300 dark:disabled:bg-amber-800"
          ].join(' ') : [
            "bg-violet-600 dark:bg-violet-600 text-white",
            "hover:bg-violet-700 dark:hover:bg-violet-700",
            "focus:ring-violet-500 dark:focus:ring-violet-600",
            "disabled:bg-violet-300 dark:disabled:bg-violet-800"
          ].join(' '),
          "disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {isPublished ? "Unpublish" : "Publish"}
        </span>
      </Button>

      <ConfirmModal onConfirm={onDelete}>
        <Button
          size="sm"
          disabled={isLoading}
          aria-label="Delete post"
          className={cn(
            "w-full sm:w-auto aspect-square sm:aspect-auto p-2 sm:p-2.5 rounded-lg transition-colors",
            "bg-rose-500 dark:bg-rose-600 text-white",
            "hover:bg-rose-600 dark:hover:bg-rose-700",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            "focus:ring-rose-500 dark:focus:ring-rose-600",
            "disabled:bg-rose-300 dark:disabled:bg-rose-800",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Trash className="h-5 w-5" />
            <span className="inline sm:hidden">Delete Post</span>
          </div>
        </Button>
      </ConfirmModal>
    </div>
  );
}
