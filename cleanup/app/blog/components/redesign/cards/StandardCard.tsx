"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Eye, MessageCircle, ArrowUpRight,
  Bookmark, TrendingUp, Hash
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  views: number;
  readingTime?: string;
  user?: {
    name: string | null;
    image?: string | null;
  };
  comments?: { length: number };
  tags?: string[];
  trending?: boolean;
}

interface StandardCardProps {
  post: Post;
  layout?: 'vertical' | 'horizontal';
  index?: number;
}

export function StandardCard({ post, layout = 'vertical', index = 0 }: StandardCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

  if (layout === 'horizontal') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        whileHover={{ x: 4 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
      >
        <Link href={`/blog/${post.id}`} className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-48 h-32 sm:h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, 192px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
            )}

            {/* Trending Badge */}
            {post.trending && (
              <div className="absolute top-2 left-2">
                <div className="px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-md">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Category & Date */}
              <div className="flex items-center gap-3 mb-2">
                {post.category && (
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {post.category}
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {post.title}
              </h3>

              {/* Description */}
              {post.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {post.description}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {/* Author */}
              {post.user && (
                <div className="flex items-center gap-2">
                  {post.user.image ? (
                    <Image
                      src={post.user.image}
                      alt={post.user.name || 'Author'}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {post.user.name}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${
              isSaved
                ? 'bg-blue-500/20 text-blue-500'
                : 'bg-white/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-400 hover:text-blue-500'
            }`}
            aria-label={isSaved ? 'Remove bookmark' : 'Save post'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </motion.button>
        </div>
      </motion.article>
    );
  }

  // Vertical Layout
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <Link href={`/blog/${post.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-700">
          {post.imageUrl ? (
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full"
            >
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
          )}

          {/* Overlay on Hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-end p-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg"
            >
              <ArrowUpRight className="w-5 h-5 text-gray-900" />
            </motion.div>
          </motion.div>

          {/* Category Badge */}
          {post.category && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-xs font-medium text-purple-600 dark:text-purple-400">
                {post.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Meta Info */}
          <div className="flex items-center gap-3 mb-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {post.readingTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
              {post.description}
            </p>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Author */}
            {post.user && (
              <div className="flex items-center gap-2">
                {post.user.image ? (
                  <Image
                    src={post.user.image}
                    alt={post.user.name || 'Author'}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {post.user.name}
                </span>
              </div>
            )}

            {/* Engagement */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.views}
              </span>
              {post.comments && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {post.comments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Save Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        className={`absolute top-4 right-4 p-2 rounded-lg backdrop-blur-sm transition-all ${
          isSaved
            ? 'bg-blue-500 text-white'
            : 'bg-white/90 dark:bg-gray-700/90 text-gray-600 dark:text-gray-400 hover:text-blue-500'
        }`}
        aria-label={isSaved ? 'Remove bookmark' : 'Save post'}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </motion.button>
    </motion.article>
  );
}
