"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, TrendingUp, ArrowRight } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  createdAt: string;
  views: number;
  readingTime?: string;
  user?: {
    name: string | null;
    image?: string | null;
  };
  trending?: boolean;
}

interface CompactCardProps {
  post: Post;
  index?: number;
  showImage?: boolean;
  variant?: 'default' | 'minimal' | 'accent';
}

export function CompactCard({
  post,
  index = 0,
  showImage = true,
  variant = 'default'
}: CompactCardProps) {

  if (variant === 'minimal') {
    return (
      <motion.article
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ x: 4 }}
        className="group"
      >
        <Link
          href={`/blog/${post.id}`}
          className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          {/* Number/Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 flex items-center justify-center">
            {post.trending ? (
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            ) : (
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
              {post.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span>•</span>
              <span>{post.views} views</span>
              {post.readingTime && (
                <>
                  <span>•</span>
                  <span>{post.readingTime}</span>
                </>
              )}
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </Link>
      </motion.article>
    );
  }

  if (variant === 'accent') {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        className="group relative"
      >
        <Link href={`/blog/${post.id}`}>
          <div className="relative p-4 rounded-xl bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 border border-purple-200/50 dark:border-purple-700/30 hover:border-purple-400/50 dark:hover:border-purple-600/50 transition-all">
            {/* Category Accent */}
            <div className="absolute top-0 left-4 w-1 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-b-full" />

            {/* Content */}
            <div className="pl-4">
              {post.category && (
                <span className="inline-block text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                  {post.category}
                </span>
              )}

              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {post.title}
              </h3>

              {post.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-3">
                  {post.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.views}
                  </span>
                </div>

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
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  // Default Variant
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Link href={`/blog/${post.id}`} className="flex gap-4">
        {/* Thumbnail */}
        {showImage && (
          <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
            )}

            {post.trending && (
              <div className="absolute top-1 right-1 p-1 bg-red-500 rounded">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category & Date */}
          <div className="flex items-center gap-2 mb-1">
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {post.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Author */}
            {post.user && (
              <div className="flex items-center gap-1.5">
                {post.user.image ? (
                  <Image
                    src={post.user.image}
                    alt={post.user.name || 'Author'}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {post.user.name}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {post.readingTime && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {post.readingTime}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {post.views}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}