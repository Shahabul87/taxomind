"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Carousel, Card } from "./post-card-carousel-model";
import { cn } from "@/lib/utils";
import { createSanitizedMarkup } from "@/lib/utils/sanitize-html";
import { X } from "lucide-react";

interface ChapterData {
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
}

interface PostCardModelTwoProps {
  postchapter: ChapterData[];
}

export const PostCardCarouselDemo: React.FC<PostCardModelTwoProps> = ({ postchapter }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);
  const [mounted, setMounted] = useState(false);
  const placeholderImage = 'https://via.placeholder.com/300';

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle null/undefined postchapter
  if (!postchapter || !Array.isArray(postchapter) || postchapter.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
      </div>
    );
  }

  const data = postchapter.map((chapter, index) => ({
    id: chapter.id,
    title: chapter.title,
    src: chapter.imageUrl || placeholderImage,
    content: (
      <div
        onClick={() => {
          setSelectedChapter(chapter);
          setShowModal(true);
        }}
        className="cursor-pointer"
      >
        <SimpleCard chapter={chapter} index={index} />
      </div>
    ),
  }));

  const cards = data.map((card, index) => (
    <Card key={card.id} card={card} index={index} />
  ));

  const modalContent = showModal && selectedChapter && mounted && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 overflow-hidden">
          {/* Mobile: Full Screen Layout */}
          <div className="h-full w-full flex flex-col md:hidden">
            {/* Image at Top - Full Width, No Padding */}
            {selectedChapter.imageUrl && (
              <div className="relative w-full h-[45vh] flex-shrink-0">
                <Image
                  src={selectedChapter.imageUrl}
                  alt={selectedChapter.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                {/* Close Button on Image - Top Right Corner */}
                <button
                  onClick={() => setShowModal(false)}
                  className={cn(
                    "absolute top-2 right-2 z-10",
                    "p-2.5 rounded-full",
                    "bg-white/95 hover:bg-white",
                    "text-slate-900",
                    "transition-all duration-200",
                    "shadow-2xl"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Chapter Badge on Image - Bottom Left */}
                <div className="absolute bottom-3 left-3">
                  <span className={cn(
                    "inline-block text-xs font-semibold",
                    "bg-gradient-to-r from-purple-600 to-blue-600",
                    "px-3 py-1.5 rounded-full",
                    "text-white",
                    "shadow-xl"
                  )}>
                    Chapter {selectedChapter.position || 1}
                  </span>
                </div>
              </div>
            )}

            {/* Content Area - Scrollable, Edge-to-Edge */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
              <div className="px-3 pt-3 pb-4 space-y-2.5">
                {/* Title */}
                <h3 className={cn(
                  "text-xl font-bold",
                  "text-slate-900 dark:text-white",
                  "tracking-tight leading-tight"
                )}>
                  {selectedChapter.title}
                </h3>

                {/* Description */}
                <div className={cn(
                  "prose prose-sm dark:prose-invert max-w-none",
                  "text-slate-700 dark:text-slate-300",
                  "leading-relaxed",
                  "prose-p:my-2 prose-headings:my-2"
                )}>
                  <div
                    dangerouslySetInnerHTML={createSanitizedMarkup(selectedChapter.description || "No description available")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Modal with Max Width */}
          <div className="hidden md:flex items-start justify-center overflow-y-auto h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
            <div className="relative w-full max-w-6xl mx-4 my-8">
              <div className="relative w-full rounded-3xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Desktop Image at Top */}
                {selectedChapter.imageUrl && (
                  <div className="relative w-full h-[45vh]">
                    <Image
                      src={selectedChapter.imageUrl}
                      alt={selectedChapter.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Close Button */}
                    <button
                      onClick={() => setShowModal(false)}
                      className={cn(
                        "absolute top-4 right-4",
                        "p-2 rounded-full",
                        "bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800",
                        "text-slate-900 dark:text-white",
                        "transition-all duration-200",
                        "shadow-xl backdrop-blur-sm"
                      )}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Desktop Content */}
                <div className="p-6 lg:p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-sm font-medium",
                      "bg-gradient-to-r from-purple-500/90 to-blue-500/90",
                      "px-3 py-1 rounded-full",
                      "text-white/95",
                      "shadow-lg"
                    )}>
                      Chapter {selectedChapter.position || 1}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 via-blue-500/10 to-transparent" />
                  </div>

                  <h3 className={cn(
                    "text-3xl lg:text-4xl font-bold",
                    "text-slate-900 dark:text-white",
                    "tracking-tight leading-tight"
                  )}>
                    {selectedChapter.title}
                  </h3>

                  <div className={cn(
                    "prose prose-lg dark:prose-invert max-w-none",
                    "text-slate-700 dark:text-slate-300",
                    "leading-relaxed"
                  )}>
                    <div
                      dangerouslySetInnerHTML={createSanitizedMarkup(selectedChapter.description || "No description available")}
                    />
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400/40" />
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400/40" />
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );

  return (
    <>
      <div className="w-full h-full py-2 sm:py-3 md:py-4">
        <div className="space-y-1 mb-3 sm:mb-4 md:mb-6 px-3 sm:px-4 md:px-6">
          <h2 className={cn(
            "max-w-7xl mx-auto",
            "text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold",
            "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400",
            "bg-clip-text text-transparent",
            "tracking-tight leading-tight"
          )}>
            Explore Chapters
          </h2>
          <p className={cn(
            "max-w-7xl mx-auto",
            "text-xs sm:text-sm",
            "text-slate-600 dark:text-slate-300",
            "font-light"
          )}>
            Tap any chapter to view full details
          </p>
        </div>
        <Carousel items={cards} />
      </div>

      {/* Render modal via Portal to escape parent containers */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};

// Simple, clean card component for carousel
const SimpleCard: React.FC<{ chapter: ChapterData; index: number }> = ({ chapter, index }) => {
  return (
    <div className={cn(
      "relative w-full h-[400px] sm:h-[450px] md:h-[500px]",
      "rounded-2xl overflow-hidden",
      "shadow-xl hover:shadow-2xl transition-all duration-300",
      "group cursor-pointer"
    )}>
      {/* Background Image */}
      {chapter.imageUrl && (
        <Image
          src={chapter.imageUrl}
          alt={chapter.title || "Chapter image"}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
        {/* Chapter Badge */}
        <div className="mb-3">
          <span className={cn(
            "inline-block text-xs sm:text-sm font-semibold",
            "bg-gradient-to-r from-purple-600 to-blue-600",
            "px-3 py-1.5 rounded-full",
            "text-white shadow-xl"
          )}>
            Chapter {index + 1}
          </span>
        </div>

        {/* Title */}
        <h3 className={cn(
          "text-xl sm:text-2xl md:text-3xl font-bold mb-3",
          "text-white",
          "line-clamp-2",
          "tracking-tight leading-tight"
        )}>
          {chapter.title}
        </h3>

        {/* Tap Indicator */}
        <div className="flex items-center gap-2 text-white/80 text-sm">
          <span>Tap to read</span>
          <span className="text-lg">→</span>
        </div>
      </div>

      {/* Tap effect overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
    </div>
  );
};

export default PostCardCarouselDemo;
  



