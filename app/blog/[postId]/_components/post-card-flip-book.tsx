"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import parse, { DOMNode, Element } from 'html-react-parser';
import { logger } from '@/lib/logger';

interface PostChapter {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  videoUrl?: string | null;
  position: number;
  isPublished: boolean | null;
  isFree: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PostCardFlipBookProps {
  data: PostChapter[];
}

export const PostCardFlipBook = ({ data }: PostCardFlipBookProps) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Validate data
  const hasValidData = data && Array.isArray(data) && data.length > 0;

  useEffect(() => {
    if (!hasValidData) {
      logger.error("Invalid or empty data provided to FlipBook");
      return;
    }
    console.log("FlipBook Data:", data); // Debug log
  }, [data, hasValidData]);

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        setDimensions({
          width: containerRef.current?.offsetWidth || 0,
          height: containerRef.current?.offsetHeight || 0,
        });
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, []);

  // Early return after all hooks
  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center p-10 bg-blog-bg dark:bg-slate-900">
        <p className="text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-body)]">No chapters available</p>
      </div>
    );
  }

  const paginate = (newDirection: number) => {
    if (!data || !data.length) return;
    const newSpread = currentSpread + newDirection;
    if (newSpread >= 0 && newSpread < Math.ceil(data.length / 2)) {
      setDirection(newDirection);
      setCurrentSpread(newSpread);
    }
  };

  // If no data, show loading state
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-12rem)] flex items-center justify-center bg-gradient-to-br from-blog-bg to-blog-surface dark:from-slate-900 dark:to-slate-800 rounded-3xl">
        <div className="text-xl text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-body)]">
          No content available
        </div>
      </div>
    );
  }

  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return null;
    return parse(htmlString, {
      replace: (domNode: DOMNode) => {
        if (domNode.type === 'tag') {
          const element = domNode as Element;
          switch (element.name) {
            case 'p':
              return <p className="mb-4 text-blog-text dark:text-slate-300 font-[family-name:var(--font-body)] leading-[1.8]">{element.children?.map((child) => (child as { data?: string }).data || '')}</p>;
            case 'strong':
              return <span className="font-bold text-blog-text dark:text-white">{element.children?.map((child) => (child as { data?: string }).data || '')}</span>;
            case 'em':
              return <span className="italic text-blog-text-muted dark:text-slate-300">{element.children?.map((child) => (child as { data?: string }).data || '')}</span>;
          }
        }
        return undefined;
      }
    });
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? dimensions.width : -dimensions.width,
      opacity: 0,
      rotateY: direction > 0 ? -15 : 15,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? dimensions.width : -dimensions.width,
      opacity: 0,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  return (
    <>
      <style jsx>{`
        .flip-book-page::-webkit-scrollbar {
          width: 8px;
        }
        .flip-book-page::-webkit-scrollbar-track {
          background: transparent;
        }
        .flip-book-page::-webkit-scrollbar-thumb {
          background: hsl(var(--blog-border));
          border-radius: 4px;
        }
        .flip-book-page::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--blog-primary) / 0.3);
        }
        .dark .flip-book-page::-webkit-scrollbar-thumb {
          background: rgb(51 65 85);
        }
        .dark .flip-book-page::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105);
        }
      `}</style>
      <div className="relative w-full h-[80vh] flex items-center justify-center bg-gradient-to-br from-blog-bg to-blog-surface dark:from-slate-900 dark:to-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-blog-border dark:border-slate-700">
        {/* Book Shadow Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-blog-primary/5 to-transparent dark:from-white/5" />

      {/* Book Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center perspective-1000 px-4 py-6"
      >
        {/* Book Spine Shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

        {/* Navigation Buttons */}
        <button
          onClick={() => paginate(-1)}
          disabled={currentSpread === 0}
          className={cn(
            "absolute left-0 z-20 p-2 rounded-full",
            "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
            "border border-slate-200 dark:border-slate-700",
            "text-slate-800 dark:text-slate-200",
            "transition-all duration-200 ease-out",
            "hover:scale-110 hover:bg-white dark:hover:bg-slate-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => paginate(1)}
          disabled={currentSpread >= Math.ceil(data.length / 2) - 1}
          className={cn(
            "absolute right-0 z-20 p-2 rounded-full",
            "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
            "border border-slate-200 dark:border-slate-700",
            "text-slate-800 dark:text-slate-200",
            "transition-all duration-200 ease-out",
            "hover:scale-110 hover:bg-white dark:hover:bg-slate-800",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Pages Content */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSpread}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              rotateY: { duration: 0.4 },
            }}
            className="absolute w-full h-full flex gap-4 px-12"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Left Page */}
            <div className={cn(
              "flip-book-page",
              "flex-1 relative p-6 lg:p-8",
              "bg-blog-surface dark:bg-slate-900",
              "rounded-l-2xl shadow-2xl",
              "overflow-y-auto overflow-x-hidden",
              "border-l border-t border-b border-blog-border dark:border-slate-800",
              "max-h-full"
            )}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--blog-border)) transparent'
            }}>
              <div className="absolute top-4 right-4 text-sm font-medium text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-ui)]">
                Page {currentSpread * 2 + 1}
              </div>
              <div className="space-y-6">
                <h2 className={cn(
                  "text-3xl font-bold",
                  "text-blog-text dark:text-white",
                  "font-[family-name:var(--font-display)]"
                )}>
                  {data[currentSpread * 2]?.title || 'Untitled'}
                </h2>

                {/* Image Modal Trigger */}
                {data[currentSpread * 2]?.imageUrl && (
                  <div className="relative group cursor-pointer">
                    <div className="relative w-full h-[180px] rounded-xl overflow-hidden border-2 border-blog-border dark:border-slate-700 transition-transform duration-300 group-hover:scale-[1.02]">
                      <Image
                        src={data[currentSpread * 2].imageUrl || '/placeholder.svg'}
                        alt={data[currentSpread * 2].title || 'Post image'}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-[family-name:var(--font-ui)]">
                        Click to enlarge
                      </div>
                    </div>
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none font-[family-name:var(--font-body)] prose-p:text-blog-text dark:prose-p:text-slate-300 prose-p:leading-[1.8]">
                  {parseHtmlContent(data[currentSpread * 2]?.description ?? '')}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent via-blog-primary/5 to-blog-primary/10 dark:via-slate-800/50 dark:to-slate-700/50 rounded-tl-2xl pointer-events-none" />
            </div>

            {/* Right Page */}
            {data[currentSpread * 2 + 1] && (
              <div className={cn(
                "flip-book-page",
                "flex-1 relative p-6 lg:p-8",
                "bg-blog-surface dark:bg-slate-900",
                "rounded-r-2xl shadow-2xl",
                "overflow-y-auto overflow-x-hidden",
                "border-r border-t border-b border-blog-border dark:border-slate-800",
                "max-h-full"
              )}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'hsl(var(--blog-border)) transparent'
              }}>
                <div className="absolute top-4 right-4 text-sm font-medium text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-ui)]">
                  Page {currentSpread * 2 + 2}
                </div>
                <div className="space-y-6">
                  <h2 className={cn(
                    "text-3xl font-bold",
                    "text-blog-text dark:text-white",
                    "font-[family-name:var(--font-display)]"
                  )}>
                    {data[currentSpread * 2 + 1]?.title || 'Untitled'}
                  </h2>

                  {/* Image Modal Trigger */}
                  {data[currentSpread * 2 + 1]?.imageUrl && (
                    <div className="relative group cursor-pointer">
                      <div className="relative w-full h-[180px] rounded-xl overflow-hidden border-2 border-blog-border dark:border-slate-700 transition-transform duration-300 group-hover:scale-[1.02]">
                        <Image
                          src={data[currentSpread * 2 + 1].imageUrl || '/placeholder.svg'}
                          alt={data[currentSpread * 2 + 1].title || 'Post image'}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-[family-name:var(--font-ui)]">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none font-[family-name:var(--font-body)] prose-p:text-blog-text dark:prose-p:text-slate-300 prose-p:leading-[1.8]">
                    {parseHtmlContent(data[currentSpread * 2 + 1]?.description ?? '')}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent via-blog-primary/5 to-blog-primary/10 dark:via-slate-800/50 dark:to-slate-700/50 rounded-tl-2xl pointer-events-none" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Progress Bar - Warm Earth */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {Array.from({ length: Math.ceil(data.length / 2) }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentSpread === index
                ? "bg-blog-primary w-4"
                : "bg-blog-border dark:bg-slate-600"
            )}
          />
        ))}
      </div>
    </div>
    </>
  );
};

export default PostCardFlipBook; 