"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface BookModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
    textAlign: "left" | "center" | "justify";
  };
}

export default function BookMode({ chapters, preferences }: BookModeProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      chapterRefs.current.forEach((ref, index) => {
        if (ref) {
          const { offsetTop, offsetHeight } = ref;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setCurrentChapterIndex(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentChapter = chapters[currentChapterIndex];

  return (
    <div className="relative">
      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Text Content (Scrollable) */}
          <div className="space-y-16">
            {chapters.map((chapter, index) => (
              <motion.section
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                ref={(el) => {
                  chapterRefs.current[index] = el;
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="scroll-mt-20 min-h-screen lg:min-h-[80vh]"
              >
                {/* Chapter Number Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-4 ring-1 ring-indigo-500/20 dark:ring-indigo-500/30 shadow-sm">
                  Chapter {chapter.position}
                </div>

                {/* Chapter Title */}
                <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
                  {chapter.title}
                </h2>

                {/* Chapter Content */}
                {chapter.content || chapter.description ? (
                  <div
                    className={`prose prose-lg dark:prose-invert max-w-none ${fontFamilyClass} prose-headings:bg-gradient-to-r prose-headings:from-indigo-900 prose-headings:to-purple-900 dark:prose-headings:from-indigo-200 dark:prose-headings:to-purple-200 prose-headings:bg-clip-text prose-headings:text-transparent prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-code:text-purple-600 dark:prose-code:text-purple-400 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded`}
                    style={{
                      fontSize: `${preferences.fontSize}px`,
                      lineHeight: preferences.lineHeight,
                      textAlign: preferences.textAlign,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: chapter.content || chapter.description || "",
                    }}
                  />
                ) : (
                  <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-6 my-4 ring-1 ring-amber-500/10 dark:ring-amber-500/20">
                    <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                      ⚠️ No content available for this chapter. Please add
                      content through the editor.
                    </p>
                  </div>
                )}
              </motion.section>
            ))}
          </div>

          {/* Right Side - Sticky Image */}
          <div className="hidden lg:block">
            <div className="sticky top-20 h-[calc(100vh-8rem)]">
              <motion.div
                key={currentChapterIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-2xl ring-1 ring-indigo-500/10 dark:ring-indigo-500/20"
              >
                {currentChapter?.imageUrl ? (
                  <>
                    <Image
                      src={currentChapter.imageUrl}
                      alt={currentChapter.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                    {/* Chapter Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-2">
                        Chapter {currentChapter.position}
                      </div>
                      <h3 className="text-2xl font-bold line-clamp-2">
                        {currentChapter.title}
                      </h3>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-400 dark:text-slate-500">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-indigo-600 dark:text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">No image for this chapter</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Show images inline */}
      <div className="lg:hidden max-w-3xl mx-auto px-4 space-y-16">
        {chapters.map((chapter, index) => (
          <div key={`mobile-${chapter.id}`} className="space-y-6">
            {chapter.imageUrl && (
              <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
