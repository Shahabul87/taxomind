"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Carousel, Card } from "./post-card-carousel-model";
import { cn } from "@/lib/utils";
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
  const placeholderImage = 'https://via.placeholder.com/300';

  // Handle null/undefined postchapter
  if (!postchapter || !Array.isArray(postchapter) || postchapter.length === 0) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
      </div>
    );
  }

  const data = postchapter.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    src: chapter.imageUrl || placeholderImage,
    content: (
      <div onClick={() => {
        setSelectedChapter(chapter);
        setShowModal(true);
      }}>
        <DummyContent postchapter={[chapter]} />
      </div>
    ),
  }));

  const cards = data.map((card, index) => (
    <Card key={card.id} card={card} index={index} />
  ));

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

      {/* Modal - Full Screen on Mobile */}
      {showModal && selectedChapter && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900">
          {/* Mobile: Full Screen Layout */}
          <div className="h-full w-full flex flex-col md:hidden">
            {/* Image at Top - Full Width */}
            {selectedChapter.imageUrl && (
              <div className="relative w-full h-[40vh] flex-shrink-0">
                <Image
                  src={selectedChapter.imageUrl}
                  alt={selectedChapter.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Close Button on Image */}
                <button
                  onClick={() => setShowModal(false)}
                  className={cn(
                    "absolute top-3 right-3 z-10",
                    "p-2 rounded-full",
                    "bg-white/90 hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800",
                    "text-slate-900 dark:text-white",
                    "transition-all duration-200",
                    "shadow-xl backdrop-blur-sm"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Chapter Badge on Image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <span className={cn(
                    "inline-block text-xs font-medium",
                    "bg-gradient-to-r from-purple-500 to-blue-500",
                    "px-3 py-1.5 rounded-full",
                    "text-white",
                    "shadow-lg"
                  )}>
                    Chapter {selectedChapter.position || 1}
                  </span>
                </div>
              </div>
            )}

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
              <div className="p-4 space-y-4">
                {/* Title */}
                <h3 className={cn(
                  "text-2xl font-bold",
                  "text-slate-900 dark:text-white",
                  "tracking-tight leading-tight"
                )}>
                  {selectedChapter.title}
                </h3>

                {/* Description */}
                <div className={cn(
                  "prose prose-sm dark:prose-invert max-w-none",
                  "text-slate-700 dark:text-slate-300",
                  "leading-relaxed"
                )}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedChapter.description || "No description available",
                    }}
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
                      dangerouslySetInnerHTML={{
                        __html: selectedChapter.description || "No description available",
                      }}
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
      )}
    </>
  );
};

const DummyContent: React.FC<{ postchapter: ChapterData[] }> = ({ postchapter }) => {
  const chapter = postchapter[0];

  if (!chapter) {
    return (
      <div className={cn(
        "text-center",
        "bg-gradient-to-r from-purple-600/80 to-blue-600/80 dark:from-purple-200/80 dark:to-blue-200/80",
        "bg-clip-text text-transparent",
        "font-medium"
      )}>
        No chapter data available.
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white/90 dark:bg-slate-800/90",
      "backdrop-blur-sm",
      "p-3 sm:p-4 md:p-6 lg:p-10 rounded-xl md:rounded-2xl lg:rounded-3xl mb-2 md:mb-4",
      "border border-slate-200/50 dark:border-slate-700/50 shadow-lg",
      "cursor-pointer hover:shadow-xl transition-shadow duration-300"
    )}>
      {/* Image First on Mobile */}
      {chapter.imageUrl && (
        <div className="relative w-full h-[180px] sm:h-[200px] md:h-[240px] lg:h-[320px] mb-3 sm:mb-4 md:mb-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 dark:from-purple-500/10 to-blue-500/5 dark:to-blue-500/10 rounded-lg md:rounded-xl z-10" />
          <Image
            src={chapter.imageUrl}
            alt={chapter.title || "Chapter image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover rounded-lg md:rounded-xl",
              "transition-transform duration-500",
              "group-hover:scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 dark:from-black/50 to-transparent rounded-lg md:rounded-xl z-20" />

          {/* Chapter Badge on Image */}
          <div className="absolute top-2 left-2 z-30">
            <span className={cn(
              "text-xs font-medium",
              "bg-gradient-to-r from-purple-500/95 to-blue-500/95",
              "px-2.5 py-1 rounded-full",
              "text-white shadow-lg"
            )}>
              Chapter {chapter.position || 1}
            </span>
          </div>
        </div>
      )}

      {/* Title */}
      <h4 className={cn(
        "text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 md:mb-4",
        "text-slate-900 dark:text-white",
        "line-clamp-2",
        "tracking-tight leading-tight"
      )}>
        {chapter.title}
      </h4>

      {/* Description Preview */}
      <div className={cn(
        "prose prose-sm md:prose-base max-w-none",
        "text-slate-700 dark:text-slate-300",
        "line-clamp-3 sm:line-clamp-4"
      )}>
        <div
          dangerouslySetInnerHTML={{
            __html: chapter.description || "No description available",
          }}
          className={cn(
            "prose-headings:text-slate-900 dark:prose-headings:text-white",
            "prose-p:m-0"
          )}
        />
      </div>

      {/* Tap to view hint */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-purple-400/40" />
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-blue-400/40" />
          <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-cyan-400/40" />
        </div>
        <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Tap to read more →
        </span>
      </div>
    </div>
  );
};

export default PostCardCarouselDemo;
  



