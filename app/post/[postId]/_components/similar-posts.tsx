"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MyPostCard from "@/app/blog/blog-card";
import { ChevronRight, X } from "lucide-react";
import { logger } from '@/lib/logger';

// Dummy data for similar posts
const dummySimilarPosts = [
  {
    id: "dummy1",
    title: "Understanding the Future of AI in Web Development",
    description: "Exploring how artificial intelligence is transforming the way we build websites and web applications.",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8YWklMjBiYWNrZ3JvdW5kfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Technology",
    createdAt: new Date().toISOString(),
    comments: { length: 12 }
  },
  {
    id: "dummy2",
    title: "The Complete Guide to Next.js 14",
    description: "Learn about the latest features in Next.js 14 and how to leverage them for better web applications.",
    imageUrl: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8cmVhY3QlMjBjb2RlfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Programming",
    createdAt: new Date().toISOString(),
    comments: { length: 8 }
  },
  {
    id: "dummy3",
    title: "Designing for Dark Mode: Best Practices",
    description: "Discover the principles and techniques for creating beautiful dark mode experiences in your web projects.",
    imageUrl: "https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8ZGFyayUyMG1vZGV8ZW58MHx8MHx8&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Design",
    createdAt: new Date().toISOString(),
    comments: { length: 5 }
  },
  {
    id: "dummy4",
    title: "Building Accessible UIs with React and TypeScript",
    description: "Learn how to create inclusive user interfaces that everyone can use, regardless of abilities.",
    imageUrl: "https://images.unsplash.com/photo-1523800503107-5bc3ba2a6f81?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTR8fGNvZGluZ3xlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60",
    published: true,
    category: "Accessibility",
    createdAt: new Date().toISOString(),
    comments: { length: 3 }
  }
];

interface SimilarPostsProps {
  postId: string;
  category: string | null;
  useDummyData?: boolean;
}

export const SimilarPosts = ({ 
  postId, 
  category, 
  useDummyData = true 
}: SimilarPostsProps) => {
  const [similarPosts, setSimilarPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);

  useEffect(() => {
    // Show floating button after scrolling down 300px
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // If using dummy data, set it directly
    if (useDummyData) {
      setSimilarPosts(dummySimilarPosts);
      setIsLoading(false);
    } else {
      // In a real implementation, you'd fetch real data here
      const fetchSimilarPosts = async () => {
        try {
          const response = await fetch(`/api/posts/similar?postId=${postId}&category=${category || ''}`);
          if (response.ok) {
            const data = await response.json();
            setSimilarPosts(data);
          } else {
            // Fallback to dummy data if API fails
            setSimilarPosts(dummySimilarPosts);
          }
        } catch (error: any) {
          logger.error("Error fetching similar posts:", error);
          setSimilarPosts(dummySimilarPosts);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSimilarPosts();
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [postId, category, useDummyData]);

  // If no similar posts available, don't render anything
  if (!isLoading && similarPosts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Inline Similar Posts Section */}
      <section className="space-y-8 my-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent">
            You May Also Like
          </h2>
          <div className="h-px w-full max-w-[200px] mx-auto bg-gray-200 dark:bg-gradient-to-r dark:from-transparent dark:via-purple-500/50 dark:to-transparent mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarPosts.map((post) => (
            <MyPostCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* Floating Button */}
      <AnimatePresence>
        {showFloatingButton && !showSidePanel && (
          <motion.button
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            onClick={() => setShowSidePanel(true)}
            className="fixed bottom-8 right-8 z-50 p-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
            aria-label="Show similar posts"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Side Panel */}
      <AnimatePresence>
        {showSidePanel && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Similar Posts
                </h3>
                <button
                  onClick={() => setShowSidePanel(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {similarPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => {
                      window.location.href = `/blog/${post.id}`;
                      setShowSidePanel(false);
                    }}
                  >
                    <MyPostCard post={post} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Overlay */}
      <AnimatePresence>
        {showSidePanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setShowSidePanel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SimilarPosts; 