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

interface MagazineModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
  };
}

export default function MagazineMode({ chapters, preferences }: MagazineModeProps) {
  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  return (
    <article className="max-w-7xl mx-auto px-4 py-8">
      {chapters.map((chapter, index) => (
        <motion.section
          key={chapter.id}
          id={`chapter-${chapter.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="mb-16 scroll-mt-20"
        >
          <div className="mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-serif">
              {chapter.title}
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chapter.imageUrl && (
              <div className="relative w-full h-96 rounded-lg overflow-hidden">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}

            {chapter.content || chapter.description ? (
              <div className={chapter.imageUrl ? "" : "lg:col-span-2"}>
                <div
                  className={`prose prose-lg dark:prose-invert max-w-none ${fontFamilyClass} columns-1 md:columns-2 gap-8`}
                  style={{
                    fontSize: `${preferences.fontSize}px`,
                    lineHeight: preferences.lineHeight,
                    textAlign: "justify",
                  }}
                  dangerouslySetInnerHTML={{ __html: chapter.content || chapter.description || '' }}
                />
              </div>
            ) : (
              <div className="lg:col-span-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ No content available for this chapter. Please add content through the editor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.section>
      ))}
    </article>
  );
}
