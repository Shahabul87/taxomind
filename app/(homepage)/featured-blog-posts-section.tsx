'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import MyPostCard from "@/app/blog/blog-card";
import { BookOpen, Code, Lightbulb, Newspaper } from 'lucide-react';

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
  { key: 'all' as BlogCategoryKey, label: 'All Posts', icon: <Newspaper className="h-5 w-5" /> },
  { key: 'tutorials' as BlogCategoryKey, label: 'Tutorials', icon: <Code className="h-5 w-5" /> },
  { key: 'news' as BlogCategoryKey, label: 'News', icon: <BookOpen className="h-5 w-5" /> },
  { key: 'insights' as BlogCategoryKey, label: 'Insights', icon: <Lightbulb className="h-5 w-5" /> },
];

export const FeaturedBlogPostsSection = ({ posts }: FeaturedBlogPostsProps) => {
  const [activeCategory, setActiveCategory] = useState<BlogCategoryKey>('all');

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

  return (
    <section className="relative overflow-hidden py-20 bg-background" aria-labelledby="featured-blog-heading">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Heading */}
        <div className="mb-16 text-center">
          <h2
            id="featured-blog-heading"
            className="relative inline-block text-[clamp(2rem,5vw,3.75rem)] font-bold tracking-tight text-foreground"
          >
            <span
              className="absolute inset-x-0 bottom-2 -z-10 h-4 bg-purple-500/20"
              aria-hidden="true"
            />
            Featured Blog Posts
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Read our latest blog posts and stay up to date with the latest trends
          </p>
        </div>

        {/* Main Content Grid - 4 columns: 1 for categories, 3 for blog cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Left Column: Category List (1/4 width) */}
          <div className="lg:col-span-1">
            <div>
              <h3 className="mb-6 text-xl font-semibold text-foreground">Browse by Topic</h3>

              {/* Category list with hover effects */}
              <ul className="space-y-3">
                {BLOG_CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.key;
                  return (
                    <li key={category.key}>
                      <button
                        onClick={() => setActiveCategory(category.key)}
                        className={`w-full group flex items-center gap-3 rounded-lg py-2 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          isActive
                            ? 'bg-surface-muted'
                            : 'hover:bg-surface-muted'
                        }`}
                      >
                        {/* Icon */}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${
                            isActive
                              ? 'text-brand'
                              : 'text-muted-foreground'
                          }`}
                          aria-hidden="true"
                        >
                          {category.icon}
                        </span>

                        {/* Label */}
                        <span className={`text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-brand'
                            : 'text-foreground group-hover:text-brand'
                        }`}>
                          {category.label}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            className="ml-auto h-2 w-2 rounded-full bg-brand"
                            layoutId="blogCategoryActiveIndicator"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Post count info */}
              <div className="mt-6 text-sm text-muted-foreground">
                Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} in {BLOG_CATEGORIES.find(c => c.key === activeCategory)?.label}
              </div>
            </div>
          </div>

          {/* Right Column: Blog Post Cards Grid (3/4 width) */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.slice(0, 6).map((post) => (
                      <MyPostCard
                        key={post.id}
                        post={post as any}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No posts found in this category.</p>
                    </div>
                  )}
                </div>

                {/* View All CTA */}
                {filteredPosts.length > 6 && (
                  <div className="mt-6">
                    <Link
                      href="/blog"
                      className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      View All {filteredPosts.length} Posts
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}; 
