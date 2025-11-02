"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse from 'html-react-parser';
import { ChevronDown, BookOpen } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface BookModeReadingProps {
  chapters: Chapter[];
}

export const BookModeReading = ({ chapters }: BookModeReadingProps) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle null/undefined chapters
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
      </div>
    );
  }

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(progress);

      // Determine which chapter is currently active based on scroll position
      contentRefs.current.forEach((ref, index) => {
        if (!ref) return;

        const rect = ref.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // If the chapter is in the viewport (with some offset for better UX)
        if (
          rect.top < containerRect.height / 2 &&
          rect.bottom > containerRect.height / 2
        ) {
          setActiveChapterIndex(index);
        }
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return null;

    const isPWrapped = htmlString.trim().startsWith('<p>') && htmlString.trim().endsWith('</p>');

    return parse(htmlString, {
      replace: (domNode: any) => {
        if (domNode.type === 'tag' && domNode.name === 'p' && domNode.parent === null && isPWrapped) {
          return domNode.children;
        }

        if (domNode.type === 'tag') {
          switch (domNode.name) {
            case 'strong':
            case 'b':
              return <span className="font-bold">{domNode.children.map((child: any) =>
                child.data || (child.children && parse(child.children))
              )}</span>;
            case 'em':
            case 'i':
              return <span className="italic">{domNode.children.map((child: any) =>
                child.data || (child.children && parse(child.children))
              )}</span>;
            case 'u':
              return <span className="underline">{domNode.children.map((child: any) =>
                child.data || (child.children && parse(child.children))
              )}</span>;
          }
        }
        return undefined;
      }
    });
  };

  const activeChapter = chapters[activeChapterIndex];

  return (
    <div className="relative w-full h-full">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Chapter Indicator */}
      <div className="fixed top-4 left-4 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Chapter {activeChapterIndex + 1} of {chapters.length}
          </span>
        </div>
      </div>

      {/* Main Book Layout */}
      <div className="grid lg:grid-cols-2 gap-0 h-screen">
        {/* Left Column - Scrollable Content */}
        <div
          ref={containerRef}
          className="order-2 lg:order-1 overflow-y-auto h-full scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 space-y-0">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                ref={(el) => {
                  contentRefs.current[index] = el;
                }}
                className="min-h-screen flex flex-col justify-center py-12"
              >
                {/* Chapter Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 tracking-wider uppercase">
                      Chapter {index + 1}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                  </div>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                    {chapter.title}
                  </h2>
                </motion.div>

                {/* Chapter Content */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={cn(
                    "prose prose-lg dark:prose-invert max-w-none",
                    "prose-headings:text-gray-900 dark:prose-headings:text-white",
                    "prose-p:text-gray-700 dark:prose-p:text-gray-300",
                    "prose-p:leading-relaxed prose-p:text-justify",
                    "prose-strong:text-gray-900 dark:prose-strong:text-white",
                    "prose-em:text-gray-800 dark:prose-em:text-gray-200",
                    "prose-a:text-purple-600 dark:prose-a:text-purple-400",
                    "prose-a:no-underline hover:prose-a:underline"
                  )}
                >
                  {chapter.description ? (
                    <div className="text-lg leading-relaxed">
                      {parseHtmlContent(chapter.description)}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      No content available for this chapter.
                    </p>
                  )}
                </motion.div>

                {/* Chapter Separator */}
                {index < chapters.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 mb-12 flex flex-col items-center gap-4"
                  >
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                    <ChevronDown className="w-6 h-6 text-gray-400 dark:text-gray-600 animate-bounce" />
                  </motion.div>
                )}
              </div>
            ))}

            {/* End of Book */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="min-h-screen flex items-center justify-center"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  End of Chapter
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You&apos;ve completed all chapters
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Sticky Image */}
        <div className="order-1 lg:order-2 relative h-full bg-gray-100 dark:bg-gray-900">
          <div className="sticky top-0 h-screen flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {activeChapter.imageUrl ? (
                <motion.div
                  key={activeChapter.id}
                  initial={{ opacity: 0, scale: 0.95, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateY: 15 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative w-full h-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800"
                  style={{
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  <Image
                    src={activeChapter.imageUrl}
                    alt={activeChapter.title}
                    fill
                    className="object-cover"
                    sizes="50vw"
                    priority
                  />

                  {/* Image Overlay with Chapter Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium opacity-80 mb-1">
                      Chapter {activeChapterIndex + 1}
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold line-clamp-2">
                      {activeChapter.title}
                    </h3>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`placeholder-${activeChapter.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col items-center justify-center w-full h-full max-h-[80vh] rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-dashed border-purple-500/30 dark:border-purple-500/20 p-8"
                >
                  <BookOpen className="w-16 h-16 text-purple-500/50 dark:text-purple-400/50 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    No image for this chapter
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
                    Chapter {activeChapterIndex + 1}: {activeChapter.title}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookModeReading;
