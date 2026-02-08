'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';
import Link from 'next/link';
import MyPostCard from "@/app/blog/blog-card";
import { BookOpen, Code, Lightbulb, Newspaper, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
}

interface Post {
  id: string;
  createdAt: string | Date;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  updatedAt: Date;
  published: boolean;
  category: string | null;
  comments?: Comment[];
}

interface FeaturedBlogPostsProps {
  posts: Post[];
}

type BlogCategoryKey = 'all' | 'tutorials' | 'news' | 'insights' | 'other';

const BLOG_CATEGORIES = [
  { key: 'all' as BlogCategoryKey, label: 'All Posts', icon: Newspaper, gradient: 'from-blue-500 to-indigo-500' },
  { key: 'tutorials' as BlogCategoryKey, label: 'Tutorials', icon: Code, gradient: 'from-emerald-500 to-teal-500' },
  { key: 'news' as BlogCategoryKey, label: 'News', icon: BookOpen, gradient: 'from-purple-500 to-pink-500' },
  { key: 'insights' as BlogCategoryKey, label: 'Insights', icon: Lightbulb, gradient: 'from-orange-500 to-red-500' },
];

export const FeaturedBlogPostsSection = ({ posts }: FeaturedBlogPostsProps) => {
  const [activeCategory, setActiveCategory] = useState<BlogCategoryKey>('all');
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  // Hide entire section when there are no posts
  if (posts.length === 0) return null;

  // Filter posts by category
  const filteredPosts = activeCategory === 'all'
    ? posts
    : posts.filter(post => {
        const categoryName = post.category?.toLowerCase() || '';
        if (activeCategory === 'tutorials') return categoryName.includes('tutorial') || categoryName.includes('guide') || categoryName.includes('how-to');
        if (activeCategory === 'news') return categoryName.includes('news') || categoryName.includes('announcement') || categoryName.includes('update');
        if (activeCategory === 'insights') return categoryName.includes('insight') || categoryName.includes('opinion') || categoryName.includes('analysis');
        return false;
      });

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.6,
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
      aria-labelledby="featured-blog-heading"
    >
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-20 sm:opacity-30" aria-hidden="true">
        <div className="absolute top-20 right-4 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
        <div className="absolute bottom-40 left-4 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading — left-aligned, single line */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100/80 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-500/30 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Latest Insights</span>
              </div>
              <h2
                id="featured-blog-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Featured{' '}
                <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  Blog Posts
                </span>
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                Read our latest blog posts and stay up to date with the latest trends
              </p>
            </div>

            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group whitespace-nowrap"
            >
              View all posts
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Controls Bar — single row: filter left, count right */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as BlogCategoryKey)}>
                <SelectTrigger
                  className="w-full sm:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                  aria-label="Browse blog topics"
                >
                  <SelectValue placeholder="Browse Topics" />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.key} value={category.key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {activeCategory !== 'all' && (
                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs sm:text-sm self-center">
                  {BLOG_CATEGORIES.find(c => c.key === activeCategory)?.label}
                </Badge>
              )}
            </div>

            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'Post' : 'Posts'}
            </span>
          </div>
        </div>

        {/* Blog Post Cards Grid (Full Width) */}
        <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.3 }}
              >
                <motion.div
                  className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
                  style={{ willChange: 'opacity' }}
                >
                  {filteredPosts.length > 0 ? (
                    filteredPosts.slice(0, 6).map((post, index) => (
                      <motion.div
                        key={post.id}
                        variants={fadeInUp}
                        transition={{ delay: index * 0.1 }}
                      >
                        <MyPostCard
                          post={{
                            ...post,
                            createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString()
                          }}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full">
                      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400">No posts found in this category.</p>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-2">Try selecting a different topic</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* View All CTA */}
                {filteredPosts.length > 6 && (
                  <motion.div
                    className="mt-6 sm:mt-8 flex justify-center px-4"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      href="/blog"
                      className="group inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      View All {filteredPosts.length} Posts
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
