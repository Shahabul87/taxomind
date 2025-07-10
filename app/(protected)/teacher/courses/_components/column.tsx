"use client"

import { Course as PrismaCourse } from "@prisma/client"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2, Calendar, Loader2, BookOpen, Tag, DollarSign, BookCheck } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import axios from "axios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CourseWithCategory = {
  id: string;
  title: string;
  category: { name: string } | null;
  price: number | null;
  isPublished: boolean;
  createdAt: Date;
}

export const columns: ColumnDef<CourseWithCategory>[] = [
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
          className="hover:bg-transparent hover:text-purple-600 dark:hover:text-purple-400 px-0 font-medium"
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
            className="hover:bg-transparent hover:text-purple-600 dark:hover:text-purple-400 px-0 font-medium"
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
            "bg-purple-50 dark:bg-purple-500/10",
            "text-purple-700 dark:text-purple-300",
            "border border-purple-200 dark:border-purple-500/20"
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
          className="hover:bg-transparent hover:text-purple-600 dark:hover:text-purple-400 px-0 font-medium"
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
          className="hover:bg-transparent hover:text-purple-600 dark:hover:text-purple-400 px-0 font-medium"
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
          className="hover:bg-transparent hover:text-purple-600 dark:hover:text-purple-400 px-0 font-medium"
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
        } catch (error) {
          console.error('Date formatting error:', error);
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
                <Link href={`/teacher/courses/${id}`}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Pencil className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
      await axios.delete(`/api/courses/${courseId}`);
      toast.success("Course deleted");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
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