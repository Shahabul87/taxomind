"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse, { DOMNode, Element } from 'html-react-parser';
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

  // Validate chapters data
  const hasValidChapters = chapters && Array.isArray(chapters) && chapters.length > 0;

  useEffect(() => {
    if (!hasValidChapters) return;
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
  }, [hasValidChapters]);

  const parseHtmlContent = (htmlString: string) => {
    if (!htmlString) return null;

    const isPWrapped = htmlString.trim().startsWith('<p>') && htmlString.trim().endsWith('</p>');

    return parse(htmlString, {
      replace: (domNode: DOMNode) => {
        if (domNode.type === 'tag') {
          const element = domNode as Element;
          if (element.name === 'p' && element.parent === null && isPWrapped) {
            return element.children;
          }

          switch (element.name) {
            case 'strong':
            case 'b':
              return <span className="font-bold text-blog-text dark:text-white">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
            case 'em':
            case 'i':
              return <span className="italic text-blog-text-muted dark:text-slate-300">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
            case 'u':
              return <span className="underline decoration-blog-primary/40">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
          }
        }
        return undefined;
      }
    });
  };

  // Early return after all hooks
  if (!hasValidChapters) {
    return (
      <div className="flex items-center justify-center p-10 bg-blog-bg dark:bg-slate-900">
        <p className="text-blog-text-muted dark:text-slate-400 font-blog-body">No chapters available</p>
      </div>
    );
  }

  const activeChapter = chapters[activeChapterIndex];

  return (
    <div className="relative w-full h-full bg-blog-bg dark:bg-slate-900">
      {/* Progress Bar - Terracotta to Sage Gradient */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-blog-border dark:bg-slate-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-blog-primary via-blog-accent to-blog-gold"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Chapter Indicator - Warm Earth */}
      <div className="fixed top-4 left-4 z-40 bg-blog-surface/95 dark:bg-slate-800/95 backdrop-blur-sm px-4 py-2 rounded-full border border-blog-border dark:border-slate-700 shadow-lg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blog-primary dark:text-blog-primary-light" />
          <span className="text-sm font-medium text-blog-text dark:text-white font-blog-ui">
            Chapter {activeChapterIndex + 1} of {chapters.length}
          </span>
        </div>
      </div>

      {/* Main Book Layout */}
      <div className="grid lg:grid-cols-2 gap-0 h-screen">
        {/* Left Column - Scrollable Content */}
        <div
          ref={containerRef}
          className="order-2 lg:order-1 overflow-y-auto h-full scroll-smooth bg-blog-surface dark:bg-slate-900"
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
                {/* Chapter Title - Editorial */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blog-primary to-transparent" />
                    <span className="text-xs font-semibold text-blog-primary dark:text-blog-primary-light tracking-wider uppercase font-blog-ui">
                      Chapter {index + 1}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blog-primary to-transparent" />
                  </div>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blog-text dark:text-white leading-tight mb-6 font-blog-display">
                    {chapter.title}
                  </h2>
                </motion.div>

                {/* Chapter Content - Source Serif 4 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={cn(
                    "prose prose-lg dark:prose-invert max-w-none",
                    "font-blog-body",
                    "prose-headings:text-blog-text dark:prose-headings:text-white",
                    "prose-headings:font-blog-display",
                    "prose-p:text-blog-text dark:prose-p:text-slate-300",
                    "prose-p:leading-[1.8] prose-p:text-justify",
                    "prose-strong:text-blog-text dark:prose-strong:text-white",
                    "prose-em:text-blog-text-muted dark:prose-em:text-slate-300",
                    "prose-a:text-blog-primary dark:prose-a:text-blog-primary-light",
                    "prose-a:no-underline hover:prose-a:underline",
                    "prose-blockquote:border-l-blog-primary prose-blockquote:bg-blog-primary/5",
                    "prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic"
                  )}
                >
                  {chapter.description ? (
                    <div className="text-lg leading-[1.8]">
                      {parseHtmlContent(chapter.description)}
                    </div>
                  ) : (
                    <p className="text-blog-text-muted dark:text-slate-400 italic">
                      No content available for this chapter.
                    </p>
                  )}
                </motion.div>

                {/* Chapter Separator - Warm Earth */}
                {index < chapters.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 mb-12 flex flex-col items-center gap-4"
                  >
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-blog-border dark:via-slate-700 to-transparent" />
                    <ChevronDown className="w-6 h-6 text-blog-text-muted dark:text-slate-600 animate-bounce" />
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blog-primary to-blog-accent mb-4">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blog-text dark:text-white mb-2 font-blog-display">
                  End of Chapter
                </h3>
                <p className="text-blog-text-muted dark:text-slate-400 font-blog-body">
                  You&apos;ve completed all chapters
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column - Sticky Image */}
        <div className="order-1 lg:order-2 relative h-full bg-blog-bg dark:bg-slate-800">
          <div className="sticky top-0 h-screen flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {activeChapter.imageUrl ? (
                <motion.div
                  key={activeChapter.id}
                  initial={{ opacity: 0, scale: 0.95, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.95, rotateY: 15 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative w-full h-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border-4 border-blog-surface dark:border-slate-700"
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

                  {/* Image Overlay with Chapter Info - Warm Earth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-sm font-medium opacity-80 mb-1 font-blog-ui">
                      Chapter {activeChapterIndex + 1}
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold line-clamp-2 font-blog-display">
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
                  className="flex flex-col items-center justify-center w-full h-full max-h-[80vh] rounded-2xl bg-gradient-to-br from-blog-primary/10 to-blog-accent/10 border-2 border-dashed border-blog-primary/30 dark:border-blog-primary/20 p-8"
                >
                  <BookOpen className="w-16 h-16 text-blog-primary/50 dark:text-blog-primary-light/50 mb-4" />
                  <p className="text-blog-text-muted dark:text-slate-400 text-center font-blog-body">
                    No image for this chapter
                  </p>
                  <p className="text-sm text-blog-text-muted dark:text-slate-500 mt-2 text-center font-blog-ui">
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
