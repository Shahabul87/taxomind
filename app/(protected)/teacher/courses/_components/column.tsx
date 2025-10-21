"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2, Calendar, Loader2, BookOpen, Tag, DollarSign, BookCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CourseTableData } from "@/types/course";
import { APIResponse } from "@/types/api";
import {
  trackCourseDeletion,
  trackCourseEdit,
} from "@/lib/analytics/course-analytics";

export const columns: ColumnDef<CourseTableData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent hover:text-gray-900 dark:hover:text-white px-0 font-medium"
        >
          <BookOpen className="mr-2 h-4 w-4 text-gray-400" />
          Title
          <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      
      return (
        <div className="font-medium text-gray-900 dark:text-gray-100 max-w-[220px] truncate">
          {title}
        </div>
      );
    }
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent hover:text-gray-900 dark:hover:text-white px-0 font-medium"
          >
            <Tag className="mr-2 h-4 w-4 text-gray-400" />
            Category
            <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const category = row.original.category?.name || "Uncategorized";
      
      return (
        <div className={cn(
          "flex justify-center items-center",
          "text-center",
          "w-full",
          "px-2 py-1"
        )}>
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-gray-100 dark:bg-gray-700",
            "text-gray-700 dark:text-gray-200",
            "border border-gray-200 dark:border-gray-600"
          )}>
            {category}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return row.original.category?.name?.toLowerCase() === value.toLowerCase();
    }
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent hover:text-gray-900 dark:hover:text-white px-0 font-medium"
        >
          <DollarSign className="mr-2 h-4 w-4 text-gray-400" />
          Price
          <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price") || "0");
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(price);

      return (
        <div className={cn(
          "font-medium",
          price > 0 ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
        )}>
          {formatted}
        </div>
      )
    }
  },
  {
    accessorKey: "isPublished",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent hover:text-gray-900 dark:hover:text-white px-0 font-medium"
        >
          <BookCheck className="mr-2 h-4 w-4 text-gray-400" />
          Status
          <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isPublished = row.getValue("isPublished") || false;

      return (
        <Badge className={cn(
          "px-2.5 py-0.5 text-xs font-semibold",
          isPublished 
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" 
            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
          "border"
        )}>
          {isPublished ? "Published" : "Draft"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent hover:text-gray-900 dark:hover:text-white px-0 font-medium"
        >
          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
          Created
          <ArrowUpDown className="ml-2 h-3 w-3 text-gray-400" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt")
      
      const formatDate = (dateValue: any) => {
        try {
          if (!dateValue) return 'N/A';
          const dateObj = new Date(dateValue);
          if (isNaN(dateObj.getTime())) return 'Invalid Date';
          return format(dateObj, 'MMM dd, yyyy');
        } catch (error: any) {
          logger.error('Date formatting error:', error);
          return 'Invalid Date';
        }
      };
      
      return (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
          {formatDate(date)}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id } = row.original;

      return (
        <div className="flex items-center justify-end gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/teacher/courses/${id}`}
                  onClick={() => {
                    // Track course edit navigation
                    trackCourseEdit(id, {
                      courseId: id,
                      action: 'navigate_to_edit',
                      source: 'teacher_dashboard',
                    });
                  }}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit course</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DeleteCourseButton courseId={id} />
        </div>
      );
    }
  }
];

interface DeleteCourseButtonProps {
  courseId: string;
}

const DeleteCourseButton = ({ courseId }: DeleteCourseButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onDelete = async () => {
    try {
      setIsLoading(true);

      const response = await axios.delete<APIResponse>(`/api/courses/${courseId}`);

      if (response.data.success) {
        toast.success("Course deleted successfully");

        // Track course deletion
        trackCourseDeletion(courseId, {
          source: 'teacher_dashboard',
          action: 'single_delete',
        });

        router.refresh();

        // Log successful deletion for analytics
        logger.info('Course deleted', { courseId });
      } else {
        // Handle API-level failure
        const errorMessage = response.data.error || "Failed to delete course";
        toast.error(errorMessage);
        logger.error('Course deletion failed at API level', {
          courseId,
          error: response.data.error
        });
      }
    } catch (error) {
      // Enhanced error handling with specific error types
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<APIResponse>;

        if (axiosError.response) {
          // Server responded with error status
          const errorMessage = axiosError.response.data?.error ||
            `Failed to delete course (${axiosError.response.status})`;
          toast.error(errorMessage);

          logger.error('Course deletion failed - Server error', {
            courseId,
            status: axiosError.response.status,
            error: axiosError.response.data?.error
          });
        } else if (axiosError.request) {
          // Request made but no response received
          toast.error("Network error. Please check your connection and try again.");
          logger.error('Course deletion failed - Network error', { courseId });
        } else {
          // Something else went wrong
          toast.error("An unexpected error occurred");
          logger.error('Course deletion failed - Unknown error', {
            courseId,
            error: axiosError.message
          });
        }
      } else {
        // Non-Axios error
        toast.error("An unexpected error occurred");
        logger.error('Course deletion failed - Non-Axios error', {
          courseId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <AlertDialog>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-600 dark:text-rose-400" />
                ) : (
                  <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                )}
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete course</p>
          </TooltipContent>
          <AlertDialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-gray-900 dark:text-white">
                Delete Course
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-300 text-base">
                Are you sure you want to delete this course?
                <br />
                <span className="text-rose-500 dark:text-rose-400 font-medium">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tooltip>
    </TooltipProvider>
  );
};
