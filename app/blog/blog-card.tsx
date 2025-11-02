"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, Calendar, User, ArrowRight, Eye, Heart } from "lucide-react";

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
    <Link href={`/blog/${post.id}`} prefetch={false} className="group block h-full">
      <article className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-purple-300/50 dark:hover:border-purple-500/50">

        {/* Image Section with Enhanced Gradient Overlay */}
        <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold">No Image Available</p>
              </div>
            </div>
          )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Category Badge with Dynamic Gradient */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <div className={`px-3 py-1.5 bg-gradient-to-r ${categoryGradient} text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm border border-white/20`}>
                {post.category}
              </div>
            </div>
          )}

          {/* Reading Time Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
              <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {getReadingTime(post.description)} min
              </span>
            </div>
          </div>

          {/* Engagement Badges - Bottom (appears on hover) */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">2.4k</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <Heart className="w-3 h-3 text-red-500 dark:text-red-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">156</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section - Enhanced Spacing */}
        <div className="flex-1 p-5 flex flex-col min-h-0">

          {/* Date Badge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(post.createdAt)}</span>
          </div>

          {/* Title - Premium Typography */}
          <h3 className="text-lg font-bold mb-2.5 line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
            {post.title}
          </h3>

          {/* Description - Clean and Readable */}
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-grow">
            {getCleanDescription(post.description)}
          </p>

          {/* Meta Information - Glassmorphic Container */}
          <div className="mt-auto space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">

            {/* Stats Row - Enhanced Design */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50">
                <MessageCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {post.comments?.length || 0} {(post.comments?.length || 0) === 1 ? 'Comment' : 'Comments'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/50">
                <Clock className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {getReadingTime(post.description)} min read
                </span>
              </div>
            </div>

            {/* Call to Action - Premium Button */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <span className="text-sm font-semibold">Read Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MyPostCard;
