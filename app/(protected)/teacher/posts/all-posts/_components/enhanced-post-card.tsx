"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Eye,
  MessageCircle,
  Heart,
  Edit,
  Trash2,
  MoreVertical,
  ExternalLink,
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SelectionCheckbox } from "./bulk-actions-bar";
import type { Post, ViewMode } from "./types";

interface EnhancedPostCardProps {
  post: Post;
  viewMode: ViewMode;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: () => void;
  onDelete: () => void;
}

// Get category styling
const getCategoryStyle = (category: string | null): { gradient: string; text: string } => {
  if (!category) return { gradient: 'from-slate-500 to-slate-600', text: 'text-slate-500' };

  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('tutorial') || categoryLower.includes('guide')) {
    return { gradient: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (categoryLower.includes('news') || categoryLower.includes('announcement')) {
    return { gradient: 'from-purple-500 to-pink-500', text: 'text-purple-600 dark:text-purple-400' };
  }
  if (categoryLower.includes('technology') || categoryLower.includes('programming')) {
    return { gradient: 'from-blue-500 to-indigo-500', text: 'text-blue-600 dark:text-blue-400' };
  }
  if (categoryLower.includes('biology') || categoryLower.includes('science')) {
    return { gradient: 'from-green-500 to-emerald-500', text: 'text-green-600 dark:text-green-400' };
  }

  return { gradient: 'from-violet-500 to-indigo-500', text: 'text-violet-600 dark:text-violet-400' };
};

// Clean description from HTML
const cleanDescription = (desc: string | null): string => {
  if (!desc) return "No description available for this post.";
  const cleaned = desc.replace(/<[^>]*>/g, '').trim();
  if (!cleaned) return "No description available for this post.";
  return cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
};

export const EnhancedPostCard = ({
  post,
  viewMode,
  isSelected = false,
  isSelectionMode = false,
  onSelect,
  onDelete,
}: EnhancedPostCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const postDate = typeof post.createdAt === 'string' ? new Date(post.createdAt) : post.createdAt;
  const formattedDate = format(postDate, "MMM d, yyyy");
  const formattedTime = format(postDate, "h:mm a");
  const categoryStyle = getCategoryStyle(post.category);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/blog/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  if (viewMode === "grid") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={cn(
            "group relative bg-white dark:bg-slate-800/90 rounded-xl overflow-hidden border h-full flex flex-col transition-all duration-300",
            isSelected
              ? "border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10"
              : "border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl"
          )}
        >
          {/* Selection checkbox */}
          {(isSelectionMode || isHovered) && onSelect && (
            <div className="absolute top-3 left-3 z-30">
              <SelectionCheckbox
                isSelected={isSelected}
                onToggle={onSelect}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded"
              />
            </div>
          )}

          {/* Image Section */}
          <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
            {post.imageUrl && post.imageUrl.trim() ? (
              <Image
                src={post.imageUrl}
                alt={post.title || "Post image"}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                quality={85}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-14 h-14 text-slate-300 dark:text-slate-600" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Top badges */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              {post.published ? (
                <Badge className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/30 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-amber-500/90 backdrop-blur-sm border border-amber-400/30 shadow-sm">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Draft
                </Badge>
              )}
            </div>

            {/* Category badge */}
            {post.category && (
              <div className="absolute top-3 right-3 mt-8 z-20">
                <Badge className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r backdrop-blur-sm shadow-sm",
                  categoryStyle.gradient
                )}>
                  {post.category}
                </Badge>
              </div>
            )}

            {/* Bottom stats */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-20">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                <Eye className="w-3 h-3" />
                <span>{post.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                <Heart className="w-3 h-3" />
                <span>{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                <MessageCircle className="w-3 h-3" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>

            {/* Quick action overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-25 bg-black/30">
              <div className="flex items-center gap-3">
                <Link href={`/teacher/posts/${post.id}`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-violet-500 hover:text-white transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </motion.div>
                </Link>
                {post.published && (
                  <Link href={`/blog/${post.id}`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2, delay: 0.05 }}
                      className="p-3 rounded-full bg-white/95 text-slate-700 shadow-lg hover:bg-emerald-500 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </motion.div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col">
            {/* Date */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {post.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
              {cleanDescription(post.description)}
            </p>

            {/* Footer actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
              <Link href={`/teacher/posts/${post.id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-medium border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-all"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/posts/${post.id}`} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </Link>
                  </DropdownMenuItem>
                  {post.published && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${post.id}`} className="cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Live
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-rose-600 dark:text-rose-400 cursor-pointer focus:text-rose-700 dark:focus:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete &quot;{post.title}&quot; and all associated data including comments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // List view
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "group relative bg-white dark:bg-slate-800/90 rounded-xl overflow-hidden border transition-all duration-300",
          isSelected
            ? "border-violet-500 ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10"
            : "border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg"
        )}
      >
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
          {/* Selection + Thumbnail */}
          <div className="flex gap-3 items-start">
            {(isSelectionMode || isHovered) && onSelect && (
              <div className="pt-1">
                <SelectionCheckbox
                  isSelected={isSelected}
                  onToggle={onSelect}
                />
              </div>
            )}

            {/* Thumbnail */}
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
              {post.imageUrl && post.imageUrl.trim() ? (
                <Image
                  src={post.imageUrl}
                  alt={post.title || "Post image"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  quality={80}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {post.title}
              </h3>

              <div className="flex items-center gap-2 flex-shrink-0">
                {post.published ? (
                  <Badge className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge className="px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                )}

                {post.category && (
                  <Badge className={cn("px-2 py-0.5 text-[10px] font-semibold border-0", categoryStyle.text, "bg-slate-100 dark:bg-slate-700")}>
                    {post.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedTime}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {cleanDescription(post.description)}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">{post.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                <MessageCircle className="w-3.5 h-3.5 text-violet-500" />
                <span className="font-medium">{post.comments?.length || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 mt-auto">
              <Link href={`/teacher/posts/${post.id}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>

              {post.published && (
                <Link href={`/blog/${post.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/posts/${post.id}`} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Post
                    </Link>
                  </DropdownMenuItem>
                  {post.published && (
                    <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete &quot;{post.title}&quot; and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
