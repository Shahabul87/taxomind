"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  MessageCircle,
  User,
  Eye,
  Play,
  ArrowRight,
  Calendar,
  BookOpen,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/validations/blog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ============================================================================
// Types
// ============================================================================

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    published?: boolean | null;
    category: string | null;
    createdAt: string | Date;
    views?: number;
    comments?: Array<{ id: string }> | { length: number };
    user?: { name: string | null; image?: string | null };
    readingTime?: string;
  };
  variant?: "grid" | "list" | "featured" | "compact";
  className?: string;
  priority?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatDate = (dateString: string | Date) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
};

const getCleanDescription = (description: string | null) => {
  if (!description)
    return "Discover insights and knowledge in this thoughtfully crafted article.";
  const cleaned = sanitizeHtml(description, { stripTags: true });
  return cleaned.length > 150 ? cleaned.substring(0, 150) + "..." : cleaned;
};

const getReadingTime = (description: string | null, readingTime?: string) => {
  if (readingTime) return readingTime;
  if (!description) return "3 min read";
  const cleaned = sanitizeHtml(description, { stripTags: true });
  const words = cleaned.split(" ").filter((word) => word.length > 0).length;
  return `${Math.max(2, Math.ceil(words / 200))} min read`;
};

const getCommentCount = (
  comments?: Array<{ id: string }> | { length: number }
) => {
  if (!comments) return 0;
  return Array.isArray(comments) ? comments.length : comments.length || 0;
};

const formatViewCount = (views: number | undefined) => {
  if (!views && views !== 0) return "0";
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const getCategoryGradient = (category: string | null) => {
  if (!category) return "from-slate-500 to-slate-600";

  const categoryLower = category.toLowerCase();

  if (
    categoryLower.includes("tutorial") ||
    categoryLower.includes("guide") ||
    categoryLower.includes("how-to")
  ) {
    return "from-emerald-500 to-teal-500";
  }
  if (
    categoryLower.includes("news") ||
    categoryLower.includes("announcement") ||
    categoryLower.includes("update")
  ) {
    return "from-purple-500 to-pink-500";
  }
  if (
    categoryLower.includes("insight") ||
    categoryLower.includes("opinion") ||
    categoryLower.includes("analysis")
  ) {
    return "from-orange-500 to-red-500";
  }
  if (
    categoryLower.includes("technology") ||
    categoryLower.includes("programming") ||
    categoryLower.includes("development")
  ) {
    return "from-blue-500 to-indigo-500";
  }
  if (
    categoryLower.includes("design") ||
    categoryLower.includes("ui") ||
    categoryLower.includes("ux")
  ) {
    return "from-pink-500 to-rose-500";
  }

  return "from-cyan-500 to-blue-500";
};

// ============================================================================
// Grid View Card
// ============================================================================

function GridCard({ post, priority = false }: BlogCardProps) {
  const categoryGradient = getCategoryGradient(post.category);
  const isHot = (post.views || 0) > 100;

  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/5 hover:border-violet-300/50 dark:hover:border-violet-600/50 hover:-translate-y-1"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-10" />

      {/* Image Container */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={80}
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 via-indigo-50 to-purple-100 dark:from-violet-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 via-transparent to-pink-600/0 opacity-0 group-hover:from-violet-600/20 group-hover:to-indigo-600/20 group-hover:opacity-100 transition-all duration-500" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-20">
          {post.category && (
            <Badge
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-lg border border-white/20 bg-gradient-to-r",
                categoryGradient
              )}
            >
              {post.category}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 text-white backdrop-blur-md border border-white/10 shadow-lg">
            <Clock className="w-3 h-3" />
            <span className="text-[11px] font-semibold">
              {getReadingTime(post.description, post.readingTime)}
            </span>
          </div>
        </div>

        {/* Bottom Stats on Image */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
            <Eye className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">
              {formatViewCount(post.views)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/20">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold">
              {getCommentCount(post.comments)}
            </span>
          </div>
          {isHot && (
            <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">Hot</span>
            </div>
          )}
        </div>

        {/* Play/Read Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/10">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
              <Play className="h-6 w-6 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 relative z-20 flex flex-col">
        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
          <Calendar className="w-3 h-3" />
          {formatDate(post.createdAt)}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold mb-2 line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {getCleanDescription(post.description)}
        </p>

        {/* Author & Stats Footer */}
        <div className="mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            {post.user?.name ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7 ring-2 ring-white dark:ring-slate-700 shadow-sm">
                  {post.user.image ? (
                    <AvatarImage src={post.user.image} alt={post.user.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                    {post.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[100px]">
                  {post.user.name}
                </span>
              </div>
            ) : (
              <div className="w-1" />
            )}
            <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-semibold group-hover:gap-2 transition-all duration-300">
              Read more
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// List View Card
// ============================================================================

function ListCard({ post, priority = false }: BlogCardProps) {
  const categoryGradient = getCategoryGradient(post.category);
  const isHot = (post.views || 0) > 100;

  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10 dark:hover:shadow-violet-500/5 hover:border-violet-300/50 dark:hover:border-violet-600/50"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-violet-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none z-10" />

      <div className="relative flex flex-col sm:flex-row">
        {/* Image Container */}
        <div className="relative w-full sm:w-72 md:w-80 h-48 sm:h-auto sm:min-h-[200px] flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
              sizes="(max-width: 640px) 100vw, 320px"
              quality={80}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-100 via-indigo-50 to-purple-100 dark:from-violet-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/30">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
            </div>
          )}

          {/* Category Badge */}
          {post.category && (
            <Badge
              className={cn(
                "absolute top-3 left-3 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md shadow-lg border border-white/20 bg-gradient-to-r",
                categoryGradient
              )}
            >
              {post.category}
            </Badge>
          )}

          {/* Hot Badge */}
          {isHot && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">Hot</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col relative z-20">
          {/* Meta Row */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.createdAt)}
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {getReadingTime(post.description, post.readingTime)}
            </div>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1.5 font-medium text-violet-600 dark:text-violet-400">
              <Eye className="w-3.5 h-3.5" />
              {formatViewCount(post.views)} views
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold mb-3 line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-300">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed">
            {getCleanDescription(post.description)}
          </p>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
            {post.user?.name ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-slate-700 shadow-md">
                  {post.user.image ? (
                    <AvatarImage src={post.user.image} alt={post.user.name} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                    {post.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {post.user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Author
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Anonymous
                </p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {getCommentCount(post.comments)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-sm font-semibold group-hover:gap-2 transition-all duration-300">
                Read more
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Featured Card (Large)
// ============================================================================

function FeaturedCard({ post, priority = true }: BlogCardProps) {
  const categoryGradient = getCategoryGradient(post.category);

  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/20 dark:hover:shadow-violet-500/10"
    >
      {/* Image Container */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            quality={85}
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-white/80" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
          {/* Category */}
          {post.category && (
            <Badge
              className={cn(
                "w-fit mb-4 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md shadow-lg border border-white/20 bg-gradient-to-r",
                categoryGradient
              )}
            >
              {post.category}
            </Badge>
          )}

          {/* Title */}
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2 leading-tight group-hover:text-violet-200 transition-colors duration-300">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-200 line-clamp-2 mb-4 max-w-2xl">
            {getCleanDescription(post.description)}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-slate-300">
            {post.user?.name && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 ring-2 ring-white/30">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">
                    {post.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{post.user.name}</span>
              </div>
            )}
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {formatViewCount(post.views)}
            </span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {getReadingTime(post.description, post.readingTime)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Compact Card
// ============================================================================

function CompactCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group flex gap-4 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="80px"
            quality={60}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-violet-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {post.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {formatViewCount(post.views)}
          </span>
          <span>|</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Main Export Component
// ============================================================================

export function BlogCardEnhanced({
  post,
  variant = "grid",
  className,
  priority = false,
}: BlogCardProps) {
  const components = {
    grid: GridCard,
    list: ListCard,
    featured: FeaturedCard,
    compact: CompactCard,
  };

  const Component = components[variant];

  return (
    <div className={className}>
      <Component post={post} priority={priority} />
    </div>
  );
}

export { GridCard, ListCard, FeaturedCard, CompactCard };
