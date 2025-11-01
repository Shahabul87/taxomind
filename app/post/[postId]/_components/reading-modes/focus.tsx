"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface FocusModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
  };
}

export default function FocusMode({ chapters, preferences }: FocusModeProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const currentChapter = chapters[currentChapterIndex];

  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Centered narrow column for focused reading */}
      <motion.article
        key={currentChapterIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-2xl mx-auto px-6 py-12"
      >
        {/* Chapter Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Chapter {currentChapterIndex + 1} of {chapters.length}</span>
            <span>{Math.round(((currentChapterIndex + 1) / chapters.length) * 100)}% Complete</span>
          </div>
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Chapter Title */}
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {currentChapter.title}
        </h2>

        {/* Chapter Image */}
        {currentChapter.imageUrl && (
          <div className="relative w-full h-80 mb-8 rounded-lg overflow-hidden">
            <Image
              src={currentChapter.imageUrl}
              alt={currentChapter.title}
              fill
              className="object-cover"
              sizes="672px"
            />
          </div>
        )}

        {/* Chapter Content */}
        {currentChapter.content || currentChapter.description ? (
          <div
            className={`prose prose-xl dark:prose-invert max-w-none ${fontFamilyClass}`}
            style={{
              fontSize: `${preferences.fontSize + 2}px`,
              lineHeight: preferences.lineHeight + 0.1,
            }}
            dangerouslySetInnerHTML={{ __html: currentChapter.content || currentChapter.description || '' }}
          />
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 my-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              ⚠️ No content available for this chapter. Please add content through the editor.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={prevChapter}
            disabled={currentChapterIndex === 0}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={nextChapter}
            disabled={currentChapterIndex === chapters.length - 1}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Chapter
          </button>
        </div>
      </motion.article>
    </div>
  );
}
