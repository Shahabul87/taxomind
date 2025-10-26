"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, Calendar, User, ArrowRight } from "lucide-react";

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
    return cleaned.length > 140 ? cleaned.substring(0, 140) + '...' : cleaned;
  };

  // Get reading time
  const getReadingTime = (description: string | null) => {
    if (!description) return 3;
    const words = description.replace(/<[^>]*>/g, '').split(' ').length;
    return Math.max(2, Math.ceil(words / 200));
  };

  // Get category color scheme based on category name
  const getCategoryColors = (category: string | null) => {
    if (!category) return {
      bg: 'bg-slate-100/90 dark:bg-gray-800/90',
      text: 'text-slate-700 dark:text-gray-300',
      border: 'border-slate-200/50 dark:border-gray-700/50'
    };

    const categoryLower = category.toLowerCase();
    
    // Define color schemes for different categories
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      // Technology & Programming
      'technology': { bg: 'bg-blue-100/90 dark:bg-blue-900/70', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50 dark:border-blue-700/50' },
      'programming': { bg: 'bg-indigo-100/90 dark:bg-indigo-900/70', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200/50 dark:border-indigo-700/50' },
      'development': { bg: 'bg-purple-100/90 dark:bg-purple-900/70', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200/50 dark:border-purple-700/50' },
      'ai': { bg: 'bg-violet-100/90 dark:bg-violet-900/70', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200/50 dark:border-violet-700/50' },
      'machine learning': { bg: 'bg-violet-100/90 dark:bg-violet-900/70', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200/50 dark:border-violet-700/50' },
      
      // Design & Creative
      'design': { bg: 'bg-pink-100/90 dark:bg-pink-900/70', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200/50 dark:border-pink-700/50' },
      'ui/ux': { bg: 'bg-rose-100/90 dark:bg-rose-900/70', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200/50 dark:border-rose-700/50' },
      'art': { bg: 'bg-fuchsia-100/90 dark:bg-fuchsia-900/70', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200/50 dark:border-fuchsia-700/50' },
      
      // Business & Finance
      'business': { bg: 'bg-emerald-100/90 dark:bg-emerald-900/70', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/50 dark:border-emerald-700/50' },
      'finance': { bg: 'bg-green-100/90 dark:bg-green-900/70', text: 'text-green-700 dark:text-green-300', border: 'border-green-200/50 dark:border-green-700/50' },
      'marketing': { bg: 'bg-teal-100/90 dark:bg-teal-900/70', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200/50 dark:border-teal-700/50' },
      
      // Lifestyle & Personal
      'lifestyle': { bg: 'bg-orange-100/90 dark:bg-orange-900/70', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/50 dark:border-orange-700/50' },
      'health': { bg: 'bg-lime-100/90 dark:bg-lime-900/70', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200/50 dark:border-lime-700/50' },
      'travel': { bg: 'bg-sky-100/90 dark:bg-sky-900/70', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200/50 dark:border-sky-700/50' },
      'food': { bg: 'bg-amber-100/90 dark:bg-amber-900/70', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200/50 dark:border-amber-700/50' },
      
      // Education & Learning
      'education': { bg: 'bg-cyan-100/90 dark:bg-cyan-900/70', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200/50 dark:border-cyan-700/50' },
      'tutorial': { bg: 'bg-blue-100/90 dark:bg-blue-900/70', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/50 dark:border-blue-700/50' },
      'guide': { bg: 'bg-indigo-100/90 dark:bg-indigo-900/70', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200/50 dark:border-indigo-700/50' },
      
      // News & Opinion
      'news': { bg: 'bg-slate-100/90 dark:bg-slate-800/90', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200/50 dark:border-slate-700/50' },
      'opinion': { bg: 'bg-neutral-100/90 dark:bg-neutral-800/90', text: 'text-neutral-700 dark:text-neutral-300', border: 'border-neutral-200/50 dark:border-neutral-700/50' },
      'review': { bg: 'bg-yellow-100/90 dark:bg-yellow-900/70', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200/50 dark:border-yellow-700/50' }
    };
    
    // Check for exact matches first
    if (colorMap[categoryLower]) {
      return colorMap[categoryLower];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(colorMap)) {
      if (categoryLower.includes(key) || key.includes(categoryLower)) {
        return value;
      }
    }

    // Default fallback with a subtle color
    return {
      bg: 'bg-slate-100/90 dark:bg-slate-800/90',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200/50 dark:border-slate-700/50'
    };
  };

  const categoryColors = getCategoryColors(post.category);

  return (
    <Link href={`/blog/${post.id}`} prefetch={false} className="group block h-full">
      <article className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden flex flex-col">

        {/* Image Section - Reduced height for better proportion */}
        <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-slate-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">No Image</p>
              </div>
            </div>
          )}

          {/* Category Badge - Simplified */}
          {post.category && (
            <div className="absolute top-2.5 left-2.5">
              <span className={`px-2.5 py-1 ${categoryColors.bg} backdrop-blur-sm text-xs font-semibold ${categoryColors.text} rounded-md shadow-sm border ${categoryColors.border}`}>
                {post.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section - Optimized spacing */}
        <div className="flex-1 p-4 flex flex-col min-h-0">

          {/* Title - Properly sized and clamped */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-snug text-foreground group-hover:text-brand transition-colors duration-300">
            {post.title}
          </h3>

          {/* Description - Fixed height allocation */}
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4 flex-grow-0">
            {getCleanDescription(post.description)}
          </p>

          {/* Meta Information - Compact and well-organized */}
          <div className="mt-auto space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">

            {/* Stats Row - Single line with proper spacing */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{getReadingTime(post.description)} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{post.comments?.length || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* Call to Action - Simplified */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1.5 text-brand group-hover:gap-2 transition-all duration-300">
                <span className="text-sm font-semibold">Read More</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default MyPostCard;
