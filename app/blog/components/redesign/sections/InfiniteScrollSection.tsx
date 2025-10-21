"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, ArrowUp } from 'lucide-react';
import { StandardCard } from '../cards/StandardCard';
import { CompactCard } from '../cards/CompactCard';
import { SkeletonCard } from '../cards/SkeletonCard';
import type { ViewMode } from '../navigation/ViewModeSwitcher';

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
}

interface InfiniteScrollSectionProps {
  initialPosts: Post[];
  viewMode: ViewMode;
  loadMorePosts: (page: number) => Promise<Post[]>;
  hasMore?: boolean;
  mode?: 'infinite' | 'paged';
}

export function InfiniteScrollSection({
  initialPosts,
  viewMode,
  loadMorePosts,
  hasMore = true,
  mode = 'infinite'
}: InfiniteScrollSectionProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(hasMore);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load more posts
  const loadMore = useCallback(async () => {
    if (mode !== 'infinite') return; // disabled in paged mode
    if (loading || !hasMorePosts) return;

    setLoading(true);
    setError(null);

    try {
      const newPosts = await loadMorePosts(page + 1);

      if (newPosts.length === 0) {
        setHasMorePosts(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to load more posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMorePosts, page, loadMorePosts, mode]);

  // Set up intersection observer
  useEffect(() => {
    if (mode !== 'infinite') return; // disable observer in paged mode
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMorePosts, loading, mode]);

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retry loading
  const retry = () => {
    setError(null);
    loadMore();
  };

  // Render posts based on view mode
  const renderPosts = () => {
    switch (viewMode) {
      case 'grid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index % 9 * 0.05 }}
                >
                  <StandardCard post={post} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index % 10 * 0.03 }}
                >
                  <StandardCard post={post} layout="horizontal" index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );

      case 'magazine':
        return (
          <div className="grid grid-cols-12 gap-6">
            <AnimatePresence>
              {posts.map((post, index) => {
                // Magazine layout with varied column spans
                const isFeature = index % 7 === 0;
                const isLarge = index % 7 === 1 || index % 7 === 2;
                const colSpan = isFeature ? 'col-span-12' : isLarge ? 'col-span-12 md:col-span-6' : 'col-span-12 md:col-span-6 lg:col-span-4';

                return (
                  <motion.div
                    key={post.id}
                    className={colSpan}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index % 7 * 0.05 }}
                  >
                    <StandardCard post={post} index={index} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        );

      case 'timeline':
        return (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-indigo-500" />

            <div className="space-y-8">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, delay: index % 10 * 0.05 }}
                    className="relative pl-20"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-6 top-6 w-5 h-5 bg-white dark:bg-gray-900 border-4 border-purple-500 rounded-full" />

                    {/* Date */}
                    <div className="absolute left-0 top-5 text-xs text-gray-500 dark:text-gray-400 -rotate-45 origin-right">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    <StandardCard post={post} index={index} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      case 'map':
        // Simplified map view (would need actual map integration)
        return (
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 min-h-[600px]">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="text-9xl font-bold text-indigo-600">🗺️</div>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index % 9 * 0.05,
                      type: 'spring'
                    }}
                  >
                    <CompactCard post={post} index={index} variant="accent" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Posts Container */}
      {renderPosts()}

      {/* Loading Indicator (infinite mode only) */}
      {mode === 'infinite' && loading && (
        <div className="mt-8 flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} variant="standard" index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800"
        >
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </motion.div>
      )}

      {/* Load More Trigger (infinite mode only) */}
      {mode === 'infinite' && hasMorePosts && !error && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          )}
        </div>
      )}

      {/* End of Content */}
      {!hasMorePosts && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              You&apos;ve reached the end
            </span>
          </div>
        </motion.div>
      )}

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
