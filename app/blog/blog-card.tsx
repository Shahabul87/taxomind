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
      bg: 'bg-gray-100/90 dark:bg-gray-800/90',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200/50 dark:border-gray-700/50'
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
    <Link href={`/blog/${post.id}`} className="group block h-full">
      <article className="h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-white/5 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all duration-300 overflow-hidden flex flex-col group-hover:scale-[1.02] transform">
        
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-600 dark:group-hover:to-gray-700 transition-all duration-300">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-300 dark:bg-gray-600 rounded-xl flex items-center justify-center group-hover:bg-gray-400 dark:group-hover:bg-gray-500 transition-colors duration-300">
                  <User className="w-8 h-8 text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No Image</p>
              </div>
            </div>
          )}
          
          {/* Category Badge with Dynamic Colors */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1.5 ${categoryColors.bg} backdrop-blur-sm text-xs font-bold ${categoryColors.text} rounded-full shadow-sm border ${categoryColors.border} transition-all duration-300 group-hover:scale-105`}>
                {post.category}
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full backdrop-blur-sm border transition-all duration-300 group-hover:scale-105 ${
              post.published 
                ? 'bg-emerald-100/90 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50'
                : 'bg-amber-100/90 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-700/50'
            }`}>
              {post.published ? 'Live' : 'Draft'}
            </span>
          </div>

          {/* Subtle overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col">
          
          {/* Elegant Title with Gradient Effect */}
          <h3 className="text-xl font-bold mb-3 line-clamp-2 leading-tight transition-all duration-300 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-blue-600 dark:group-hover:from-blue-400 dark:group-hover:via-purple-400 dark:group-hover:to-blue-400">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1 mb-5 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                {getCleanDescription(post.description)}
              </p>

          {/* Meta Information */}
          <div className="mt-auto space-y-3">
            
            {/* Stats Row */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-medium">{getReadingTime(post.description)} min read</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="font-medium">{post.comments?.length || 0} comments</span>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-medium">{formatDate(post.createdAt)}</span>
              </div>
            </div>
            
            {/* Elegant Divider */}
            <div className="border-t border-gray-100 dark:border-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-colors duration-300" />

            {/* Enhanced Call to Action */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                Continue Reading
              </span>
              <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300">
                <span className="text-sm font-bold">Read More</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle bottom accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent group-hover:via-blue-400 dark:group-hover:via-blue-500 transition-all duration-300" />
      </article>
    </Link>
  );
};

export default MyPostCard;
