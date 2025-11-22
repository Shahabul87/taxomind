"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, User, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/validations/blog";

interface MyPostCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    published: boolean | null;
    category: string | null;
    createdAt: string;
    views?: number;
    comments?: Array<{ id: string }> | { length: number };
  };
}

const MyPostCard: React.FC<MyPostCardProps> = ({ post }) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  // Clean description from HTML tags using DOMPurify
  const getCleanDescription = (description: string | null) => {
    if (!description) return "Discover insights and knowledge in this thoughtfully crafted article.";
    const cleaned = sanitizeHtml(description, { stripTags: true });
    return cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
  };

  // Get reading time
  const getReadingTime = (description: string | null) => {
    if (!description) return 3;
    const cleaned = sanitizeHtml(description, { stripTags: true });
    const words = cleaned.split(' ').filter(word => word.length > 0).length;
    return Math.max(2, Math.ceil(words / 200));
  };

  // Get category gradient based on category name
  const getCategoryGradient = (category: string | null) => {
    if (!category) return 'from-slate-500 to-slate-600';

    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('tutorial') || categoryLower.includes('guide') || categoryLower.includes('how-to')) {
      return 'from-emerald-500 to-teal-500';
    }
    if (categoryLower.includes('news') || categoryLower.includes('announcement') || categoryLower.includes('update')) {
      return 'from-purple-500 to-pink-500';
    }
    if (categoryLower.includes('insight') || categoryLower.includes('opinion') || categoryLower.includes('analysis')) {
      return 'from-orange-500 to-red-500';
    }
    if (categoryLower.includes('technology') || categoryLower.includes('programming') || categoryLower.includes('development')) {
      return 'from-blue-500 to-indigo-500';
    }
    if (categoryLower.includes('design') || categoryLower.includes('ui') || categoryLower.includes('ux')) {
      return 'from-pink-500 to-rose-500';
    }

    return 'from-cyan-500 to-blue-500';
  };

  const categoryGradient = getCategoryGradient(post.category);

  // Helper to get comment count safely
  const getCommentCount = () => {
    if (!post.comments) return 0;
    return Array.isArray(post.comments) ? post.comments.length : post.comments.length || 0;
  };

  // Format view count for display
  const formatViewCount = (views: number | undefined) => {
    if (!views && views !== 0) return '0';
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={true}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-xl sm:hover:shadow-2xl motion-safe:hover:scale-[1.01] sm:motion-safe:hover:scale-[1.02] motion-safe:hover:-translate-y-0.5 sm:motion-safe:hover:-translate-y-1 hover:border-purple-400/50 dark:hover:border-purple-500/50 cursor-pointer"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-red-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none z-10"></div>

      {/* Blog Image with Enhanced Overlay */}
      <div className="relative h-36 sm:h-40 md:h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={75}
            loading="lazy"
            decoding="async"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        )}

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Top Badges Row */}
        <div className="absolute top-1.5 left-1.5 right-1.5 sm:top-2 sm:left-2 sm:right-2 flex items-start justify-between gap-1.5 sm:gap-2 z-20">
          {/* Category Badge */}
          {post.category && (
            <div className={cn("px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r", categoryGradient)}>
              <span className="drop-shadow-sm truncate max-w-[80px] sm:max-w-none">{post.category}</span>
            </div>
          )}

          {/* Reading Time Badge */}
          <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg bg-purple-600/95 text-white backdrop-blur-md border border-purple-400/50 shadow-md whitespace-nowrap">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-[9px] sm:text-[10px] font-semibold">
              {getReadingTime(post.description)} min
            </span>
          </div>
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 sm:bottom-2 sm:left-2 sm:right-2 z-20">
          {/* Quick Stats on Image */}
          <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-wrap">
            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
              <span className="text-white text-[10px] sm:text-xs font-bold">{formatViewCount(post.views)}</span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white flex-shrink-0" />
              <span className="text-white text-[10px] sm:text-xs font-bold">{getCommentCount()}</span>
            </div>
          </div>
        </div>

        {/* Play/Read Button Overlay - Enhanced */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/20">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 motion-safe:animate-pulse motion-reduce:animate-none"></div>
            <div className="relative p-2 sm:p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 motion-safe:group-hover:scale-100 transition-transform duration-500">
              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Content - Compact */}
      <div className="flex-1 p-2.5 sm:p-3 relative z-20 flex flex-col">
        {/* Date Badge */}
        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-500 mb-1.5 sm:mb-2">
          {formatDate(post.createdAt)}
        </div>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold mb-1.5 sm:mb-2 line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 sm:mb-3">
          {getCleanDescription(post.description)}
        </p>

        {/* Compact Stats Row */}
        <div className="mt-auto pt-1.5 sm:pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-0.5 sm:gap-1 md:gap-2">
          <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 min-w-0">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white truncate w-full text-center">
              {getCommentCount()}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 min-w-0">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white truncate w-full text-center">{formatViewCount(post.views)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MyPostCard;
