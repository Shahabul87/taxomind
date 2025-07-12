"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MessageCircle, Calendar, User, ArrowRight, Eye } from "lucide-react";

interface CompactCardProps {
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

const CompactCard: React.FC<CompactCardProps> = ({ post }) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
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
    return cleaned.length > 80 ? cleaned.substring(0, 80) + '...' : cleaned;
  };

  // Get reading time
  const getReadingTime = (description: string | null) => {
    if (!description) return 3;
    const words = description.replace(/<[^>]*>/g, '').split(' ').length;
    return Math.max(2, Math.ceil(words / 200));
  };

  return (
    <Link href={`/blog/${post.id}`} className="group block h-full">
      <article className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        
        {/* Image Section */}
        <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-gray-700">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {/* Category Badge */}
          {post.category && (
            <div className="absolute top-2 left-2">
              <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 text-xs font-medium text-gray-700 dark:text-gray-300 rounded">
                {post.category}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {getCleanDescription(post.description)}
          </p>

          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <span>{formatDate(post.createdAt)}</span>
              <span>•</span>
              <span>{getReadingTime(post.description)} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                <span>{post.views || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default CompactCard;