"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, User, Eye, Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyPostCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    published: boolean | null;
    category: string | null;
    createdAt: string;
    comments?: {
      length: number;
    };
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

  // Clean description from HTML tags
  const getCleanDescription = (description: string | null) => {
    if (!description) return "Discover insights and knowledge in this thoughtfully crafted article.";
    const cleaned = description.replace(/<[^>]*>/g, '');
    return cleaned.length > 120 ? cleaned.substring(0, 120) + '...' : cleaned;
  };

  // Get reading time
  const getReadingTime = (description: string | null) => {
    if (!description) return 3;
    const words = description.replace(/<[^>]*>/g, '').split(' ').length;
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

  return (
    <Link
      href={`/blog/${post.id}`}
      prefetch={false}
      className="group relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 hover:border-purple-400/50 dark:hover:border-purple-500/50 cursor-pointer"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-red-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-red-500/5 transition-all duration-500 pointer-events-none z-10"></div>

      {/* Blog Image with Enhanced Overlay */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={90}
            unoptimized={!post.imageUrl}
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
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2 z-20">
          {/* Category Badge */}
          {post.category && (
            <div className={cn("px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur-md shadow-md border border-white/20 bg-gradient-to-r", categoryGradient)}>
              <span className="drop-shadow-sm">{post.category}</span>
            </div>
          )}

          {/* Reading Time Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/95 text-white backdrop-blur-md border border-purple-400/50 shadow-md">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-semibold">
              {getReadingTime(post.description)} min
            </span>
          </div>
        </div>

        {/* Bottom Info on Image */}
        <div className="absolute bottom-2 left-2 right-2 z-20">
          {/* Quick Stats on Image */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Eye className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">2.4k</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <Heart className="w-3 h-3 text-red-300" />
              <span className="text-white text-xs font-bold">156</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-md border border-white/30">
              <MessageCircle className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-bold">{post.comments?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Play/Read Button Overlay - Enhanced */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 bg-slate-900/20">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 backdrop-blur-sm border-2 border-white/40 text-white shadow-2xl transform scale-0 group-hover:scale-100 transition-transform duration-500">
              <Play className="h-5 w-5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Content - Compact */}
      <div className="flex-1 p-3 relative z-20 flex flex-col">
        {/* Date Badge */}
        <div className="text-[10px] text-slate-500 dark:text-slate-500 mb-2">
          {formatDate(post.createdAt)}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold mb-2 line-clamp-2 leading-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
          {getCleanDescription(post.description)}
        </p>

        {/* Compact Stats Row */}
        <div className="mt-auto pt-2 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 gap-1">
          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <MessageCircle className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {post.comments?.length || 0}
            </span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Eye className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">2.4k</span>
          </div>

          <div className="flex flex-col items-center gap-0.5 flex-1 p-1.5 rounded-lg bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50">
            <Heart className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">156</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MyPostCard;
