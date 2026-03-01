"use client";

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Sparkles, ChevronRight, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedBackground } from './AnimatedBackground';
import { SearchBar } from './SearchBar';
import { motion, AnimatePresence } from 'framer-motion';

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
  tags?: string[];
}

interface HeroSectionProps {
  featuredPosts: Post[];
  onSearch?: (query: string) => void;
}

export function HeroSection({ featuredPosts, onSearch }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate featured posts
  useEffect(() => {
    if (!isAutoPlaying || featuredPosts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredPosts.length]);

  const currentPost = featuredPosts[currentIndex] || featuredPosts[0];

  if (!currentPost) return null;

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Content Container */}
      <div className="relative z-10 h-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          {/* Top Section - Search & Trending */}
          <div className="mb-12 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 mb-6">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  Discover Amazing Content
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Explore. Learn. Innovate.
                </span>
              </h1>

              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Dive into our collection of articles, tutorials, and insights from industry experts
              </p>
            </motion.div>

            {/* Smart Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <SearchBar onSearch={onSearch} />
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex justify-center gap-8 mt-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{featuredPosts.length}+</div>
                <div className="text-sm text-gray-400">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm text-gray-400">Readers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-sm text-gray-400">Topics</div>
              </div>
            </motion.div>
          </div>

          {/* Featured Post Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Featured Post Image */}
              <div className="relative group cursor-pointer"
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                <Link href={`/blog/${currentPost.id}`}>
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    {currentPost.imageUrl ? (
                      <Image
                        src={currentPost.imageUrl}
                        alt={currentPost.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Ken Burns Effect */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                </Link>

                {/* Post Indicators */}
                {featuredPosts.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {featuredPosts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentIndex(index);
                          setIsAutoPlaying(false);
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex
                            ? 'w-8 bg-white'
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Post Content */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPost.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Category & Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {currentPost.category && (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30">
                          {currentPost.category}
                        </span>
                      )}

                      <div className="flex items-center gap-4 text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(currentPost.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>

                        {currentPost.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {currentPost.readingTime}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                      <Link
                        href={`/blog/${currentPost.id}`}
                        className="hover:text-purple-300 transition-colors duration-300"
                      >
                        {currentPost.title}
                      </Link>
                    </h2>

                    {/* Description */}
                    {currentPost.description && (
                      <p className="text-lg text-gray-300 line-clamp-3">
                        {currentPost.description}
                      </p>
                    )}

                    {/* Author & CTA */}
                    <div className="flex items-center justify-between">
                      {currentPost.user && (
                        <div className="flex items-center gap-3">
                          {currentPost.user.image ? (
                            <Image
                              src={currentPost.user.image}
                              alt={currentPost.user.name || 'Author'}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-white">
                              {currentPost.user.name}
                            </div>
                            <div className="text-xs text-gray-400">Author</div>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/blog/${currentPost.id}`}
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        Read Article
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>

                    {/* Tags */}
                    {currentPost.tags && currentPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-4">
                        {currentPost.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 text-xs rounded-full bg-white/10 text-gray-300 backdrop-blur-sm"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Trending Indicator */}
            <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold flex items-center gap-1 animate-pulse">
              <TrendingUp className="w-3 h-3" />
              Featured
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-sm">Scroll to explore</span>
            <ChevronRight className="w-5 h-5 rotate-90 animate-bounce" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}