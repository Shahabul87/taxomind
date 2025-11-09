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
      className="relative overflow-hidden py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
      aria-labelledby="featured-blog-heading"
    >
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" />
        <div className="absolute bottom-40 left-20 w-96 h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          className="mb-12 sm:mb-16 text-center"
          variants={fadeInUp}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/30 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Latest Insights</span>
          </div>

          <h2
            id="featured-blog-heading"
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-4"
          >
            <span className="block">Featured</span>
            <span className="block bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Blog Posts
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Read our latest blog posts and stay up to date with the latest trends
          </p>
        </motion.div>

        {/* Controls Bar */}
        <div className="mb-8 space-y-4">
          {/* Category Select and Results Info */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category Select */}
            <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as BlogCategoryKey)}>
              <SelectTrigger className="w-52 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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

            {/* Results Info */}
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'Post' : 'Posts'}
              </h3>
              {activeCategory !== 'all' && (
                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  {BLOG_CATEGORIES.find(c => c.key === activeCategory)?.label}
                </Badge>
              )}
            </div>
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
                  className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  variants={staggerContainer}
                  initial="hidden"
                  animate={isInView ? 'visible' : 'hidden'}
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
                      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No posts found in this category.</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Try selecting a different topic</p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* View All CTA */}
                {filteredPosts.length > 6 && (
                  <motion.div
                    className="mt-8 flex justify-center"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      href="/blog"
                      className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    >
                      View All {filteredPosts.length} Posts
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
