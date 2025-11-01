"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  description: string | null;
  imageUrl: string | null;
  position: number;
}

interface ImmersiveModeProps {
  chapters: Chapter[];
  preferences: {
    fontSize: number;
    lineHeight: number;
    fontFamily: "sans" | "serif" | "mono";
  };
}

interface ChapterSectionProps {
  chapter: Chapter;
  index: number;
  totalChapters: number;
  scrollYProgress: MotionValue<number>;
  fontFamilyClass: string;
  fontSize: number;
  lineHeight: number;
}

function ChapterSection({ chapter, index, totalChapters, scrollYProgress, fontFamilyClass, fontSize, lineHeight }: ChapterSectionProps) {
  const start = index / totalChapters;
  const end = (index + 1) / totalChapters;

  const opacity = useTransform(scrollYProgress, [start - 0.1, start, end, end + 0.1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [start, end], [0.95, 1]);

  return (
    <motion.div
      key={chapter.id}
      id={`chapter-${chapter.id}`}
      style={{ opacity, scale }}
      className="min-h-screen flex items-center justify-center relative scroll-mt-20"
    >
            {chapter.imageUrl && (
              <div className="absolute inset-0 -z-10">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
              </div>
            )}

            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
              <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white">
                {chapter.title}
              </h2>
              {chapter.content || chapter.description ? (
                <div
                  className={`prose prose-xl prose-invert max-w-3xl mx-auto ${fontFamilyClass}`}
                  style={{
                    fontSize: `${fontSize + 4}px`,
                    lineHeight: lineHeight + 0.2,
                  }}
                  dangerouslySetInnerHTML={{ __html: chapter.content || chapter.description || '' }}
                />
              ) : (
                <div className="bg-yellow-50/10 border border-yellow-200/30 rounded-lg p-6 max-w-2xl mx-auto">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ No content available for this chapter. Please add content through the editor.
                  </p>
                </div>
              )}
            </div>
    </motion.div>
  );
}

export default function ImmersiveMode({ chapters, preferences }: ImmersiveModeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const fontFamilyClass = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  }[preferences.fontFamily];

  return (
    <div ref={containerRef} className="relative">
      {chapters.map((chapter, index) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          index={index}
          totalChapters={chapters.length}
          scrollYProgress={scrollYProgress}
          fontFamilyClass={fontFamilyClass}
          fontSize={preferences.fontSize}
          lineHeight={preferences.lineHeight}
        />
      ))}
    </div>
  );
}
