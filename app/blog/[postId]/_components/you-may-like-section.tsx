"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, MessageCircle, TrendingUp, Calendar, Sparkles, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from '@/lib/logger';

// Type definitions for Post data
interface PostUser {
  name: string;
}

interface RecommendedPost {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  published: boolean;
  category: string;
  createdAt: string;
  User: PostUser;
  readTime: number;
  views: number;
  comments: number;
  trending: boolean;
}

// Extended dummy data for all categories
const dummyPosts: RecommendedPost[] = [
  {
    id: "post1",
    title: "Understanding the Future of AI in Web Development",
    description: "Exploring how artificial intelligence is transforming the way we build websites and web applications.",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8YWklMjBiYWNrZ3JvdW5kfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Technology",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "John Doe" },
    readTime: 8,
    views: 1234,
    comments: 12,
    trending: true
  },
  {
    id: "post2",
    title: "The Complete Guide to Next.js 14",
    description: "Learn about the latest features in Next.js 14 and how to leverage them for better web applications.",
    imageUrl: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8cmVhY3QlMjBjb2RlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Programming",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Jane Smith" },
    readTime: 12,
    views: 2345,
    comments: 18,
    trending: true
  },
  {
    id: "post3",
    title: "Designing for Dark Mode: Best Practices",
    description: "Discover the principles and techniques for creating beautiful dark mode experiences in your web projects.",
    imageUrl: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8ZGFyayUyMG1vZGV8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Design",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Mike Johnson" },
    readTime: 6,
    views: 987,
    comments: 5,
    trending: false
  },
  {
    id: "post4",
    title: "Building Accessible UIs with React and TypeScript",
    description: "Learn how to create inclusive user interfaces that everyone can use, regardless of abilities.",
    imageUrl: "https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGNvZGluZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Accessibility",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Sarah Williams" },
    readTime: 10,
    views: 3456,
    comments: 23,
    trending: true
  },
  {
    id: "post5",
    title: "Mastering CSS Grid Layout in 2024",
    description: "A comprehensive guide to modern CSS Grid techniques and best practices for responsive layouts.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "CSS",
    createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "David Lee" },
    readTime: 15,
    views: 876,
    comments: 7,
    trending: false
  },
  {
    id: "post6",
    title: "GraphQL vs REST: Which Should You Choose?",
    description: "An in-depth comparison of GraphQL and REST APIs with real-world examples and use cases.",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "API",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Emily Chen" },
    readTime: 11,
    views: 5432,
    comments: 31,
    trending: true
  },
  {
    id: "post7",
    title: "Serverless Architecture: A Practical Guide",
    description: "Understanding serverless computing and how to build scalable applications without managing servers.",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Cloud",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Robert Taylor" },
    readTime: 14,
    views: 2109,
    comments: 16,
    trending: false
  },
  {
    id: "post8",
    title: "TypeScript Tips and Tricks for Advanced Developers",
    description: "Level up your TypeScript skills with these advanced patterns and techniques used by professionals.",
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "TypeScript",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Lisa Anderson" },
    readTime: 9,
    views: 4321,
    comments: 28,
    trending: true
  },
  {
    id: "post9",
    title: "Performance Optimization in React Applications",
    description: "Learn proven strategies to make your React apps faster and more efficient.",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Performance",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Kevin Brown" },
    readTime: 13,
    views: 1876,
    comments: 14,
    trending: false
  },
  {
    id: "post10",
    title: "Web Security Best Practices for Modern Applications",
    description: "Essential security measures every developer should implement to protect their web applications.",
    imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Security",
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    User: { name: "Michelle Davis" },
    readTime: 16,
    views: 6543,
    comments: 42,
    trending: true
  }
];

interface YouMayLikeSectionProps {
  postId: string;
  category: string | null;
  useDummyData?: boolean;
}

type TabType = 'similar' | 'recent' | 'trending';

export const YouMayLikeSection = ({
  postId,
  category,
  useDummyData = true
}: YouMayLikeSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('similar');
  const [posts, setPosts] = useState<RecommendedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (useDummyData) {
      setPosts(dummyPosts);
      setIsLoading(false);
    } else {
      // Fetch real data from API
      const fetchPosts = async () => {
        try {
          const response = await fetch(`/api/posts/recommended?postId=${postId}&category=${category || ''}`);
          if (response.ok) {
            const data = await response.json();
            setPosts(data as RecommendedPost[]);
          } else {
            setPosts(dummyPosts);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error("Error fetching posts:", errorMessage);
          setPosts(dummyPosts);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPosts();
    }
  }, [postId, category, useDummyData]);

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'similar':
        // Filter by same category
        return posts.filter(post => post.category === category).slice(0, 8);
      case 'recent':
        // Sort by date (newest first)
        return [...posts].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 8);
      case 'trending':
        // Sort by views or trending flag
        return posts.filter(post => post.trending).slice(0, 8);
      default:
        return posts.slice(0, 8);
    }
  };

  const filteredPosts = getFilteredPosts();

  if (!isLoading && posts.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const tabs = [
    { id: 'similar' as TabType, label: 'Most Similar', icon: Sparkles },
    { id: 'recent' as TabType, label: 'Most Recent', icon: Calendar },
    { id: 'trending' as TabType, label: 'Most Trending', icon: TrendingUp }
  ];

  return (
    <section className="my-8 sm:my-12 md:my-16 space-y-4 sm:space-y-6 md:space-y-8 bg-blog-bg dark:bg-slate-900/50 py-8 sm:py-10 md:py-12 px-4 sm:px-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      {/* Header - Editorial Style */}
      <div className="text-center space-y-2 sm:space-y-3 md:space-y-4 px-2 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-transparent to-blog-primary/50" />
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blog-primary" />
          <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-l from-transparent to-blog-primary/50" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-white font-blog-display tracking-tight px-2"
        >
          You May Also Like
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-blog-body max-w-md mx-auto"
        >
          Discover more stories that match your interests
        </motion.p>
        <div className="h-0.5 sm:h-1 w-16 sm:w-20 md:w-24 mx-auto bg-gradient-to-r from-blog-primary via-blog-accent to-blog-gold rounded-full" />
      </div>

      {/* Tabs - Editorial Style */}
      <div className="flex justify-center px-2 sm:px-0">
        <div className="inline-flex bg-white dark:bg-slate-800 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1 sm:gap-1.5 w-full sm:w-auto max-w-full overflow-x-auto scrollbar-hide border border-slate-200 dark:border-slate-700 shadow-sm">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 flex-shrink-0 font-blog-ui",
                activeTab === tab.id
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-blog-primary dark:hover:text-white hover:bg-blog-primary/5 dark:hover:bg-slate-700/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-blog-primary rounded-lg sm:rounded-xl shadow-lg shadow-blog-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10 text-xs sm:text-sm md:text-base whitespace-nowrap">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'similar' && <SimilarPostsLayout posts={filteredPosts} formatDate={formatDate} />}
          {activeTab === 'recent' && <RecentPostsLayout posts={filteredPosts} formatDate={formatDate} />}
          {activeTab === 'trending' && <TrendingPostsLayout posts={filteredPosts} formatDate={formatDate} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

// Most Similar - Horizontal Card Layout (Image Left, Details Right)
const SimilarPostsLayout = ({ posts, formatDate }: { posts: RecommendedPost[], formatDate: (date: string) => string }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <BookOpen className="w-10 h-10 mx-auto text-blog-text-muted/40 mb-3" />
        <p className="text-sm sm:text-base text-blog-text-muted font-blog-body">
          No articles found in this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/blog/${post.id}`}>
            <div className="group flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blog-primary/50 dark:hover:border-blog-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-blog-primary/10">
              {/* Image - Top on Mobile, Left on Desktop */}
              <div className="relative w-full sm:w-32 md:w-40 h-40 sm:h-32 md:h-40 flex-shrink-0 overflow-hidden">
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 160px"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {post.category && (
                  <div className="absolute bottom-2 left-2 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blog-primary text-white text-[10px] sm:text-xs font-medium rounded-full font-blog-ui shadow-lg">
                    {post.category}
                  </div>
                )}
              </div>

              {/* Details - Bottom on Mobile, Right on Desktop */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white line-clamp-2 group-hover:text-blog-primary dark:group-hover:text-blog-primary transition-colors mb-1.5 sm:mb-2 font-blog-display">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 sm:mb-3 font-blog-body leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 flex-wrap font-blog-ui">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-accent" />
                    <span className="truncate">{post.User?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-gold" />
                    <span>{post.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-primary" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

// Most Recent - Grid Card Layout (Image on Top)
const RecentPostsLayout = ({ posts, formatDate }: { posts: RecommendedPost[], formatDate: (date: string) => string }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <BookOpen className="w-10 h-10 mx-auto text-blog-text-muted/40 mb-3" />
        <p className="text-sm sm:text-base text-blog-text-muted font-blog-body">
          No articles found in this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/blog/${post.id}`}>
            <div className="group bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-blog-accent/50 dark:hover:border-blog-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-blog-accent/10 h-full flex flex-col">
              {/* Image - Top */}
              <div className="relative w-full h-36 sm:h-40 md:h-48 overflow-hidden">
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-3 sm:py-1 bg-blog-accent text-white text-[10px] sm:text-xs font-medium rounded-full font-blog-ui shadow-lg">
                  New
                </div>
              </div>

              {/* Details - Bottom */}
              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
                {post.category && (
                  <span className="inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blog-accent/10 dark:bg-blog-accent/20 text-blog-accent text-[10px] sm:text-xs font-medium rounded-full w-fit font-blog-ui border border-blog-accent/30">
                    {post.category}
                  </span>
                )}

                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white line-clamp-2 group-hover:text-blog-accent dark:group-hover:text-blog-accent transition-colors font-blog-display">
                  {post.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1 font-blog-body leading-relaxed">
                  {post.description}
                </p>

                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 gap-2 font-blog-ui">
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-slate-500 min-w-0">
                    <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-gold" />
                    <span className="truncate">{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 flex-shrink-0">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blog-primary" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blog-accent" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

// Most Trending - Compact List Layout (Small Thumbnails)
const TrendingPostsLayout = ({ posts, formatDate }: { posts: RecommendedPost[], formatDate: (date: string) => string }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <BookOpen className="w-10 h-10 mx-auto text-blog-text-muted/40 mb-3" />
        <p className="text-sm sm:text-base text-blog-text-muted font-blog-body">
          No articles found in this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/blog/${post.id}`}>
            <div className="group flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blog-gold/50 dark:hover:border-blog-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-blog-gold/10">
              {/* Rank Badge - Gold accent */}
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-blog-gold to-blog-gold/80 text-white font-bold rounded-lg sm:rounded-xl text-sm sm:text-lg shadow-lg shadow-blog-gold/20 font-blog-display">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="80px"
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xs sm:text-sm md:text-base text-slate-800 dark:text-white line-clamp-2 group-hover:text-blog-gold dark:group-hover:text-blog-gold transition-colors mb-1.5 sm:mb-2 font-blog-display">
                  {post.title}
                </h3>

                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500 flex-wrap font-blog-ui">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blog-gold flex-shrink-0" />
                    <span className="font-medium text-blog-gold dark:text-blog-gold truncate">{post.views} views</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-accent" />
                    <span>{post.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 text-blog-primary" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default YouMayLikeSection;
