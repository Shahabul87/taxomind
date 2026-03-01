"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, TrendingUp,
  Eye, MessageCircle, Clock, Flame
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
  trendingScore?: number;
}

interface TrendingCarouselProps {
  posts: Post[];
  title?: string;
  autoPlay?: boolean;
  interval?: number;
}

export function TrendingCarousel({
  posts,
  title = "Trending This Week",
  autoPlay = true,
  interval = 5000
}: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isHovered && posts.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % posts.length);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, posts.length, interval]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (posts.length === 0) return null;

  return (
    <div className="relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-semibold animate-pulse">
            HOT
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gradient-to-r from-purple-600/5 via-blue-600/5 to-indigo-600/5 rounded-3xl p-8 border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Image Section */}
              <motion.div
                className="relative aspect-[16/10] rounded-2xl overflow-hidden group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {posts[currentIndex].imageUrl ? (
                  <>
                    <Image
                      src={posts[currentIndex].imageUrl}
                      alt={posts[currentIndex].title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
                )}

                {/* Trending Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-full">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    #{currentIndex + 1} Trending
                  </span>
                </div>

                {/* Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">{posts[currentIndex].views}</span>
                    </div>
                    {posts[currentIndex].comments && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{posts[currentIndex].comments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Content Section */}
              <div className="space-y-4">
                {/* Category & Reading Time */}
                <div className="flex items-center gap-3">
                  {posts[currentIndex].category && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                      {posts[currentIndex].category}
                    </span>
                  )}
                  {posts[currentIndex].readingTime && (
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {posts[currentIndex].readingTime}
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white line-clamp-2">
                  {posts[currentIndex].title}
                </h3>

                {/* Description */}
                {posts[currentIndex].description && (
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {posts[currentIndex].description}
                  </p>
                )}

                {/* Author */}
                {posts[currentIndex].user && (
                  <div className="flex items-center gap-3">
                    {posts[currentIndex].user.image && (
                      <Image
                        src={posts[currentIndex].user.image}
                        alt={posts[currentIndex].user.name || 'Author'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {posts[currentIndex].user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(posts[currentIndex].createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {posts[currentIndex].tags && posts[currentIndex].tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {posts[currentIndex].tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Read Article
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Quick Navigation Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {posts.slice(0, 4).map((post, index) => (
          <motion.button
            key={post.id}
            onClick={() => goToSlide(index)}
            whileHover={{ y: -2 }}
            className={`p-4 rounded-xl text-left transition-all ${
              index === currentIndex
                ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-purple-500'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${
                index === currentIndex ? 'text-purple-600' : 'text-gray-400'
              }`} />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                #{index + 1}
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {post.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {post.views} views
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}