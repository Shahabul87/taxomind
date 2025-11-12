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
  Trash,
  MoreVertical,
  ExternalLink,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  Settings,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

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

interface PostCardProps {
  post: any;
  viewMode: "grid" | "list";
  onDelete: () => void;
}

export const PostCard = ({ post, viewMode, onDelete }: PostCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Format the post date
  const formattedDate = format(new Date(post.createdAt), "MMM d, yyyy");
  const formattedTime = format(new Date(post.createdAt), "h:mm a");

  // Clean description from HTML tags
  const cleanDescription = (desc: string | null) => {
    if (!desc) return "No description available.";
    const cleaned = desc.replace(/<[^>]*>/g, '');
    return cleaned.length > 100 ? cleaned.substring(0, 100) + '...' : cleaned;
  };

  // Get category gradient
  const getCategoryGradient = (category: string | null) => {
    if (!category) return 'from-slate-500 to-slate-600';
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('tutorial') || categoryLower.includes('guide')) {
      return 'from-emerald-500 to-teal-500';
    }
    if (categoryLower.includes('news') || categoryLower.includes('announcement')) {
      return 'from-purple-500 to-pink-500';
    }
    if (categoryLower.includes('technology') || categoryLower.includes('programming')) {
      return 'from-blue-500 to-indigo-500';
    }
    return 'from-cyan-500 to-blue-500';
  };

  const categoryGradient = getCategoryGradient(post.category);

  if (viewMode === "grid") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-purple-400/50 dark:hover:border-purple-500/50"
        >
          {/* Hover Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-indigo-500/5 transition-all duration-500 pointer-events-none z-10"></div>

          {/* Featured Image with Enhanced Overlay */}
          <div className="relative h-40 sm:h-44 w-full overflow-hidden">
            {post.imageUrl && post.imageUrl.trim() ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                quality={90}
                unoptimized={!post.imageUrl || post.imageUrl.includes('placeholder')}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-pink-500/20">
                <FileText className="w-16 h-16 text-slate-400 dark:text-slate-500 opacity-50" />
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Top Badges Row */}
            <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-20">
              {/* Status Badge - Left */}
              {post.published ? (
                <Badge className="px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r from-emerald-500 to-teal-500">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge className="px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r from-amber-500 to-orange-500">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Draft
                </Badge>
              )}

              {/* Category Badge - Right */}
              {post.category && (
                <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r", categoryGradient)}>
                  <span className="drop-shadow-sm">{post.category}</span>
                </div>
              )}
            </div>

            {/* Bottom Stats on Image */}
            <div className="absolute bottom-2 left-2 right-2 z-20">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
                  <Eye className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-bold">{post.views || 0}</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
                  <Heart className="w-3 h-3 text-red-300" />
                  <span className="text-white text-xs font-bold">{post.likes?.length || 0}</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
                  <MessageCircle className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-bold">{post.comments?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Link href={`/teacher/posts/${post.id}`}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative p-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
                      <Edit className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
                {post.published && (
                  <Link href={`/blog/${post.id}`}>
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative p-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500 delay-75">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3 relative z-20 flex flex-col">
            {/* Date & Time Badge */}
            <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{formattedTime}</span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold mb-2 line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {post.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
              {cleanDescription(post.description)}
            </p>

            {/* Actions Footer */}
            <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-2">
              <Link href={`/teacher/posts/${post.id}`} className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400/50"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/posts/${post.id}`} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Post
                    </Link>
                  </DropdownMenuItem>
                  {post.published && (
                    <DropdownMenuItem asChild>
                      <Link href={`/blog/${post.id}`} className="cursor-pointer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your post and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
  // List view - Enhanced with glassmorphic design
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-2xl transition-all duration-500 hover:border-purple-400/50 dark:hover:border-purple-500/50"
      >
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-indigo-500/5 transition-all duration-500 pointer-events-none"></div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 relative z-10">
          {/* Image Thumbnail */}
          <div className="relative h-32 w-32 sm:h-28 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden">
            {post.imageUrl && post.imageUrl.trim() ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                quality={90}
                unoptimized={!post.imageUrl || post.imageUrl.includes('placeholder')}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-pink-500/20">
                <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 opacity-50" />
              </div>
            )}
            {/* Gradient Overlay on Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {/* Header with Title and Badges */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {post.title}
              </h3>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status Badge */}
                {post.published ? (
                  <Badge className="px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Published
                  </Badge>
                ) : (
                  <Badge className="px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                )}

                {/* Category Badge */}
                {post.category && (
                  <Badge className={cn("px-2 py-1 text-[10px] font-bold text-white bg-gradient-to-r border-0", categoryGradient)}>
                    {post.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formattedTime}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {cleanDescription(post.description)}
            </p>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{post.views || 0}</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <Heart className="w-4 h-4 text-red-500 dark:text-red-400" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{post.likes?.length || 0}</span>
              </div>

              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100/80 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
                <MessageCircle className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span className="text-slate-700 dark:text-slate-300 font-semibold">{post.comments?.length || 0}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
              <Link href={`/teacher/posts/${post.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-600/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400/50"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </Link>

              {post.published && (
                <Link href={`/blog/${post.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-600/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400/50"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View Live
                  </Button>
                </Link>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-white/50 dark:bg-slate-900/50 border-slate-300/50 dark:border-slate-600/50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400/50"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-auto hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/posts/${post.id}`} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Post
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/teacher/posts/${post.id}`} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Content
                    </Link>
                  </DropdownMenuItem>
                  {post.published && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${post.id}`} className="cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Site
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 