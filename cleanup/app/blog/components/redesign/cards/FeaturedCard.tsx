"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Eye, MessageCircle, Heart,
  Bookmark, Share2, TrendingUp, Award, Zap
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
  featured?: boolean;
  trending?: boolean;
}

interface FeaturedCardProps {
  post: Post;
  variant?: 'default' | 'spotlight' | 'hero';
  priority?: boolean;
}

export function FeaturedCard({ post, variant = 'default', priority = false }: FeaturedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLiked(!isLiked);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSaved(!isSaved);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description || '',
          url: `/blog/${post.id}`,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  if (variant === 'hero') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl"
      >
        <Link href={`/blog/${post.id}`} className="block">
          {/* Large Image with Parallax Effect */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {post.imageUrl ? (
              <motion.div
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative w-full h-full"
              >
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 75vw"
                  priority={priority}
                />
              </motion.div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90" />

            {/* Floating Badges */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
              {post.featured && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg"
                >
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-xs font-semibold text-white">Featured</span>
                </motion.div>
              )}
              {post.trending && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
                >
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-xs font-semibold text-white">Trending</span>
                </motion.div>
              )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8">
              {/* Category */}
              {post.category && (
                <div className="inline-block px-4 py-2 mb-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                  <span className="text-sm font-medium text-white">{post.category}</span>
                </div>
              )}

              {/* Title */}
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 line-clamp-2">
                {post.title}
              </h2>

              {/* Description */}
              {post.description && (
                <p className="text-lg text-gray-200 line-clamp-2 mb-6">
                  {post.description}
                </p>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {post.user && (
                    <div className="flex items-center gap-2">
                      {post.user.image ? (
                        <Image
                          src={post.user.image}
                          alt={post.user.name || 'Author'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                      )}
                      <span className="text-sm text-gray-200">{post.user.name}</span>
                    </div>
                  )}

                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>

                  {post.readingTime && (
                    <span className="text-sm text-gray-300 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readingTime}
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                      isLiked
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    aria-label={isLiked ? 'Unlike post' : 'Like post'}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                      isSaved
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    aria-label={isSaved ? 'Remove bookmark' : 'Save post'}
                  >
                    <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors"
                    aria-label="Share post"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  // Default and Spotlight variants
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
        variant === 'spotlight'
          ? 'bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 backdrop-blur-sm border border-purple-500/20'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <Link href={`/blog/${post.id}`} className="block">
        {/* Image with Hover Effect */}
        <div className="relative aspect-[16/10] overflow-hidden">
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
                priority={priority}
              />
            </motion.div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500" />
          )}

          {/* Overlay with Progress Ring */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Badges */}
          {(post.featured || post.trending) && (
            <div className="absolute top-4 right-4">
              {post.featured && (
                <div className="px-3 py-1 bg-yellow-500/90 backdrop-blur-sm rounded-full shadow-lg">
                  <span className="text-xs font-semibold text-white">Featured</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category & Reading Time */}
          <div className="flex items-center justify-between mb-3">
            {post.category && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                variant === 'spotlight'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
              }`}>
                {post.category}
              </span>
            )}
            {post.readingTime && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readingTime}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-xl font-bold mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${
            variant === 'spotlight' ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            {post.title}
          </h3>

          {/* Description */}
          {post.description && (
            <p className={`text-sm line-clamp-2 mb-4 ${
              variant === 'spotlight' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {post.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
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
                <span className={`text-sm ${
                  variant === 'spotlight' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {post.user.name}
                </span>
              </div>
            )}

            {/* Stats */}
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
    </motion.article>
  );
}
