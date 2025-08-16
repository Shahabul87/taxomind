"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, Calendar, User, ArrowRight, Eye, TrendingUp } from "lucide-react";

interface WideCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    published: boolean | null;
    category: string | null;
    createdAt: string;
    views?: number;
    comments?: {
      length: number;
    };
  };
}

const WideCard: React.FC<WideCardProps> = ({ post }) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Recent';
    }
  };

  // Clean description from HTML tags
  const getCleanDescription = (description: string | null) => {
    if (!description) return "Discover insights and knowledge in this thoughtfully crafted article.";
    const cleaned = description.replace(/<[^>]*>/g, '');
    return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
  };

  // Get reading time
  const getReadingTime = (description: string | null) => {
    if (!description) return 3;
    const words = description.replace(/<[^>]*>/g, '').split(' ').length;
    return Math.max(2, Math.ceil(words / 200));
  };

  // Get category color scheme
  const getCategoryColors = (category: string | null) => {
    if (!category) return {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300'
    };

    const categoryLower = category.toLowerCase();
    
    const colorMap: Record<string, { bg: string; text: string }> = {
      'ai & machine learning': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
      'programming': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      'ui/ux design': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300' },
      'web development': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
      'cybersecurity': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
      'technology': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
    };
    
    return colorMap[categoryLower] || {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300'
    };
  };

  const categoryColors = getCategoryColors(post.category);

  return (
    <Link href={`/blog/${post.id}`} className="group block">
      <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group-hover:border-purple-300 dark:group-hover:border-purple-600">
        
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="relative md:w-80 h-48 md:h-auto overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {/* Category Badge */}
            {post.category && (
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1.5 ${categoryColors.bg} ${categoryColors.text} text-sm font-medium rounded-full`}>
                  {post.category}
                </span>
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                post.published 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
              }`}>
                {post.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 md:p-8 flex flex-col">
            {/* Title */}
            <h3 className="text-xl md:text-2xl font-bold mb-3 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              {post.title}
            </h3>
            
            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed line-clamp-3 flex-1 mb-6">
              {getCleanDescription(post.description)}
            </p>

            {/* Meta Information */}
            <div className="space-y-4">
              {/* Stats Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{getReadingTime(post.description)} min read</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    <span>{post.views || 0} views</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    <span>{post.comments?.length || 0} comments</span>
                  </div>
                </div>
                
                <div className="flex items-center text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  <span className="text-sm font-medium mr-2">Read More</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
              
              {/* Engagement Indicators */}
              {(post.views && post.views > 1000) && (
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-orange-500 mr-2" />
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Trending Article</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default WideCard;