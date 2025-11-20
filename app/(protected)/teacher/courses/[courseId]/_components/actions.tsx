"use client";

import axios from "axios";
import { Trash, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';

import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { cn } from "@/lib/utils";

interface ActionsProps {
  disabled: boolean;
  courseId: string;
  isPublished: boolean;
};

export const Actions = ({
  disabled,
  courseId,
  isPublished
}: ActionsProps) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isPublishLoading, setIsPublishLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsPublishLoading(true);

      if (isPublished) {
        await axios.patch(`/api/courses/${courseId}/unpublish`);
        toast.success("Course unpublished");
      } else {
        const response = await axios.patch(`/api/courses/${courseId}/publish`);
        if (response.status === 200) {
          toast.success("Course published");
          confetti.onOpen();
        }
      }

      router.refresh();
    } catch (error: any) {
      logger.error("Publish error:", error);
      if (error.response?.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsPublishLoading(false);
    }
  }
  
  const onDelete = async () => {
    try {
      setIsDeleteLoading(true);

      const response = await axios.delete(`/api/courses/${courseId}`);

      toast.success("Course deleted successfully");
      router.refresh();
      router.push(`/teacher/courses`);
    } catch (error: any) {
      logger.error("[CLIENT] Delete error:", error);
      logger.error("[CLIENT] Error response:", error.response?.data);
      logger.error("[CLIENT] Error status:", error.response?.status);
      
      // Enhanced error handling with specific messages
      if (error.response?.status === 404) {
        const errorData = error.response.data;
        if (errorData?.details) {
          toast.error(`Course not found: ${errorData.details}`);
        } else {
          toast.error("Course not found. It may have already been deleted.");
        }
        // Redirect to courses list since course doesn't exist
        router.push(`/teacher/courses`);
      } else if (error.response?.status === 403) {
        const errorData = error.response.data;
        toast.error("You don't have permission to delete this course.");
        logger.error("[CLIENT] Permission details:", errorData);
      } else if (error.response?.status === 401) {
        toast.error("Please log in again to delete this course.");
        router.push("/auth/login");
      } else if (error.response?.data?.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else if (error.response?.data) {
        toast.error(error.response.data);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsDeleteLoading(false);
    }
  }

  return (
    <div className={cn(
      "flex items-center justify-center md:justify-start",
      "w-full md:w-auto",
      "gap-2 sm:gap-3",
      "min-w-0"
    )}>
      <Button
        onClick={onClick}
        disabled={disabled || isPublishLoading}
        variant="ghost"
        size="sm"
        className={cn(
          "text-xs sm:text-sm font-semibold",
          "h-10 sm:h-10 md:h-11",
          "px-4 sm:px-6",
          "flex items-center justify-center gap-2",
          "relative overflow-hidden group",
          "whitespace-nowrap",
          "w-full sm:w-auto sm:flex-initial",
          "rounded-xl",
          "transition-all duration-200",
          "shadow-md hover:shadow-lg",
          // Enhanced mobile visibility - Publish state (green background)
          !isPublished && "border-2 border-emerald-400 dark:border-emerald-600 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800",
          // Unpublish state (no green, use default ghost style)
          isPublished && "border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
          disabled && "opacity-60 cursor-not-allowed hover:scale-100 hover:shadow-md from-gray-400 to-gray-500 border-gray-400 dark:from-gray-600 dark:to-gray-700 dark:border-gray-600"
        )}
      >
        {isPublishLoading ? (
          <div className="flex items-center gap-x-2">
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
            <span>{isPublished ? "Unpublishing..." : "Publishing..."}</span>
          </div>
        ) : (
          <>
            {isPublished ? (
              <>
                <EyeOff className="h-4 w-4 sm:h-4 md:h-5 flex-shrink-0" />
                <span>Unpublish</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 sm:h-4 md:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Publish Course</span>
                <span className="sm:hidden font-semibold">Publish</span>
              </>
            )}
          </>
        )}
      </Button>
      <ConfirmModal onConfirm={onDelete}>
        <Button
          disabled={isDeleteLoading}
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 sm:h-10",
            "w-9 sm:w-10",
            "flex items-center justify-center",
            "p-0",
            "group relative overflow-hidden",
            "rounded-xl",
            "border border-red-200 dark:border-red-800/50",
            "bg-red-50/50 dark:bg-red-950/30",
            "text-red-600 dark:text-red-400",
            "hover:bg-red-100 dark:hover:bg-red-900/40",
            "hover:border-red-300 dark:hover:border-red-700/60",
            "shadow-sm hover:shadow-md",
            "transition-all duration-200",
            isDeleteLoading && "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-sm"
          )}
        >
          {isDeleteLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="sr-only">Delete course</span>
            </>
          )}
        </Button>
      </ConfirmModal>
    </div>
  )
}