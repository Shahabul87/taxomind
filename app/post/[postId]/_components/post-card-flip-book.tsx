"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import parse from 'html-react-parser';
import { logger } from '@/lib/logger';

interface PostChapterData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  isPublished: boolean | null;
  isFree: boolean | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  content: string | null;
}

interface PostCardFlipBookProps {
  data: PostChapterData[];
}

export const PostCardFlipBook = ({ data }: PostCardFlipBookProps) => {
  const [currentSpread, setCurrentSpread] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    console.log("FlipBook Data:", data); // Debug log
    if (!Array.isArray(data) || data.length === 0) {
      logger.error("Invalid or empty data provided to FlipBook");
      return;
    }
  }, [data]);

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
      <div className="w-full h-[calc(100vh-12rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-3xl">
        <div className="text-xl text-gray-600 dark:text-gray-400">
          No content available
        </div>
      </div>
    );
  }

  const parseHtmlContent = (htmlString: string | null): React.ReactNode => {
    // Handle null, undefined, or empty string
    if (!htmlString || htmlString.trim() === '') {
      return <p className="text-gray-500 dark:text-gray-400 text-sm">No description available</p>;
    }

    return parse(htmlString, {
      replace: (domNode: any) => {
        if (domNode.type === 'tag') {
          switch (domNode.name) {
            case 'p':
              return <p className="mb-4">{domNode.children.map((child: any) => child.data || '')}</p>;
            case 'strong':
              return <span className="font-bold">{domNode.children.map((child: any) => child.data || '')}</span>;
            case 'em':
              return <span className="italic">{domNode.children.map((child: any) => child.data || '')}</span>;
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
    <div className="relative w-full h-[calc(100vh-12rem)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl overflow-hidden">
      {/* Book Shadow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent dark:from-white/5" />
      
      {/* Book Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[90%] flex items-center justify-center perspective-1000 px-2"
      >
        {/* Book Spine Shadow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />

        {/* Navigation Buttons */}
        <button
          onClick={() => paginate(-1)}
          disabled={currentSpread === 0}
          className={cn(
            "absolute left-0 z-20 p-2 rounded-full",
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
            "border border-gray-200 dark:border-gray-700",
            "text-gray-800 dark:text-gray-200",
            "transition-all duration-200 ease-out",
            "hover:scale-110 hover:bg-white dark:hover:bg-gray-800",
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
            "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
            "border border-gray-200 dark:border-gray-700",
            "text-gray-800 dark:text-gray-200",
            "transition-all duration-200 ease-out",
            "hover:scale-110 hover:bg-white dark:hover:bg-gray-800",
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
              "flex-1 relative p-6 lg:p-8",
              "bg-white dark:bg-gray-900",
              "rounded-l-2xl shadow-2xl",
              "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
              "border-l border-t border-b border-gray-100 dark:border-gray-800",
              "[&::-webkit-scrollbar]:absolute [&::-webkit-scrollbar]:right-0",
              "[&::-webkit-scrollbar-track]:bg-transparent",
              "[&::-webkit-scrollbar-thumb]:rounded-full"
            )}>
              <div className="absolute top-4 right-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                Page {currentSpread * 2 + 1}
              </div>
              <div className="space-y-6">
                <h2 className={cn(
                  "text-3xl font-bold",
                  "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
                  "dark:from-white dark:via-gray-100 dark:to-white",
                  "bg-clip-text text-transparent"
                )}>
                  {data[currentSpread * 2]?.title || 'Untitled'}
                </h2>

                {/* Image Modal Trigger */}
                {data[currentSpread * 2]?.imageUrl && (
                  <div className="relative group cursor-pointer">
                    <div className="relative w-full h-[180px] rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 transition-transform duration-300 group-hover:scale-[1.02]">
                      <Image
                        src={data[currentSpread * 2].imageUrl || '/placeholder.png'}
                        alt={data[currentSpread * 2].title || 'Post image'}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Click to enlarge
                      </div>
                    </div>
                  </div>
                )}

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {parseHtmlContent(data[currentSpread * 2]?.description)}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent via-gray-100/50 to-gray-200/50 dark:via-gray-800/50 dark:to-gray-700/50 rounded-tl-2xl pointer-events-none" />
            </div>

            {/* Right Page */}
            {data[currentSpread * 2 + 1] && (
              <div className={cn(
                "flex-1 relative p-6 lg:p-8",
                "bg-white dark:bg-gray-900",
                "rounded-r-2xl shadow-2xl",
                "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
                "border-r border-t border-b border-gray-100 dark:border-gray-800",
                "[&::-webkit-scrollbar]:absolute [&::-webkit-scrollbar]:right-0",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:rounded-full"
              )}>
                <div className="absolute top-4 right-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Page {currentSpread * 2 + 2}
                </div>
                <div className="space-y-6">
                  <h2 className={cn(
                    "text-3xl font-bold",
                    "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
                    "dark:from-white dark:via-gray-100 dark:to-white",
                    "bg-clip-text text-transparent"
                  )}>
                    {data[currentSpread * 2 + 1]?.title || 'Untitled'}
                  </h2>

                  {/* Image Modal Trigger */}
                  {data[currentSpread * 2 + 1]?.imageUrl && (
                    <div className="relative group cursor-pointer">
                      <div className="relative w-full h-[180px] rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 transition-transform duration-300 group-hover:scale-[1.02]">
                        <Image
                          src={data[currentSpread * 2 + 1].imageUrl || '/placeholder.png'}
                          alt={data[currentSpread * 2 + 1].title || 'Post image'}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {parseHtmlContent(data[currentSpread * 2 + 1]?.description)}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-br from-transparent via-gray-100/50 to-gray-200/50 dark:via-gray-800/50 dark:to-gray-700/50 rounded-tl-2xl pointer-events-none" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Page Progress Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {Array.from({ length: Math.ceil(data.length / 2) }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentSpread === index
                ? "bg-purple-500 w-4"
                : "bg-gray-300 dark:bg-gray-600"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default PostCardFlipBook; 