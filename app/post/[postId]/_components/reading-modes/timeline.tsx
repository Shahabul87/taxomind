"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Clock } from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface TimelineModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
  };
}

export default function TimelineMode({ chapters, preferences }: TimelineModeProps) {
  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="relative">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500" />

        {chapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            id={`chapter-${chapter.id}`}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="relative mb-16 scroll-mt-20"
          >
            <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 border-4 border-white dark:border-gray-900 z-10" />

            <div className="ml-16 md:ml-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 text-sm text-blue-500 font-semibold mb-2">
                <Clock className="w-4 h-4" />
                <span>Chapter {index + 1}</span>
              </div>

              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {chapter.title}
              </h3>

              {chapter.imageUrl && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                  <Image
                    src={chapter.imageUrl}
                    alt={chapter.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}

              {chapter.content || chapter.description ? (
                <div
                  className={`prose prose-sm dark:prose-invert max-w-none ${fontFamilyClass}`}
                  style={{
                    fontSize: `${preferences.fontSize - 2}px`,
                    lineHeight: preferences.lineHeight,
                  }}
                  dangerouslySetInnerHTML={{ __html: chapter.content || chapter.description || '' }}
                />
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                    ⚠️ No content available for this chapter.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
