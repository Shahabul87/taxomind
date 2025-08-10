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
      "gap-2 sm:gap-x-2"
    )}>
      <Button
        onClick={onClick}
        disabled={disabled || isPublishLoading}
        variant="ghost"
        size="sm"
        className={cn(
          "bg-purple-500/10 hover:bg-purple-500/20",
          "text-purple-700 dark:text-purple-300",
          "hover:text-purple-800 dark:hover:text-purple-200",
          "border border-purple-200/20 dark:border-purple-500/20",
          "transition-all duration-200",
          "text-xs sm:text-sm",
          "h-8 sm:h-9",
          "px-2 sm:px-4",
          "flex items-center justify-center",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {isPublishLoading ? (
          <div className="flex items-center gap-x-2">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            <span>{isPublished ? "Unpublishing..." : "Publishing..."}</span>
          </div>
        ) : (
          <>
            {isPublished ? (
              <>
                <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Publish
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
            "bg-rose-500/10 hover:bg-rose-500/20",
            "text-rose-700 dark:text-rose-300",
            "hover:text-rose-800 dark:hover:text-rose-200",
            "border border-rose-200/20 dark:border-rose-500/20",
            "transition-all duration-200",
            "h-8 sm:h-9",
            "px-2 sm:px-3",
            "flex items-center justify-center",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isDeleteLoading ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </Button>
      </ConfirmModal>
    </div>
  )
}