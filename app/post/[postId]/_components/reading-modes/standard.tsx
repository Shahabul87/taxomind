"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface StandardModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
    textAlign: "left" | "center" | "justify";
  };
}

export default function StandardMode({ chapters, preferences }: StandardModeProps) {
  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {chapters.map((chapter, index) => (
        <motion.section
          key={chapter.id}
          id={`chapter-${chapter.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="mb-16 scroll-mt-20"
        >
          {/* Enterprise Chapter Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/70 dark:border-slate-800/70 overflow-hidden ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {/* Chapter Image */}
            {chapter.imageUrl && (
              <div className="relative w-full h-64 md:h-96 overflow-hidden">
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

            {/* Chapter Content Container */}
            <div className="p-8 md:p-10">
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
                  dangerouslySetInnerHTML={{ __html: chapter.content || chapter.description || '' }}
                />
              ) : (
                <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-6 my-4 ring-1 ring-amber-500/10 dark:ring-amber-500/20">
                  <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
                    ⚠️ No content available for this chapter. Please add content through the editor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      ))}
    </article>
  );
}
