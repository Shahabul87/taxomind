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
      <div className="w-full h-full py-2 md:py-4">
        <div className="space-y-1 md:space-y-2 mb-2 md:mb-4 px-2 md:px-4">
          <h2 className={cn(
            "max-w-7xl mx-auto",
            "text-xl md:text-3xl lg:text-4xl font-bold",
            "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400",
            "bg-clip-text text-transparent",
            "tracking-tight leading-tight",
            "font-heading"
          )}>
            Explore Chapters
          </h2>
          <p className={cn(
            "max-w-7xl mx-auto",
            "text-xs md:text-sm",
            "text-slate-600 dark:text-slate-300",
            "font-light tracking-wide"
          )}>
            Click on any chapter to view full details
          </p>
        </div>
        <Carousel items={cards} />
      </div>

      {/* Modal */}
      {showModal && selectedChapter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
          <div className="relative w-full max-w-6xl mx-4 my-4 md:my-8">
            <div className="relative w-full rounded-3xl bg-white/95 dark:bg-slate-800/95 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl backdrop-blur-sm">
              <div className="sticky top-0 z-50 w-full flex justify-end bg-gradient-to-b from-white/95 via-white/80 to-transparent dark:from-slate-800/95 dark:via-slate-800/80 dark:to-transparent backdrop-blur-sm rounded-t-3xl">
                <button
                  onClick={() => setShowModal(false)}
                  className={cn(
                    "m-3 md:m-4",
                    "p-2 rounded-full",
                    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600",
                    "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white",
                    "transition-all duration-200",
                    "shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-600/50"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 -mt-12 md:-mt-14">
                <div className="flex items-center gap-3 md:gap-4 pt-12 md:pt-14">
                  <span className={cn(
                    "text-xs md:text-sm font-medium",
                    "bg-gradient-to-r from-purple-500/90 to-blue-500/90 dark:from-purple-500/90 dark:to-blue-500/90",
                    "px-2.5 md:px-3 py-0.5 md:py-1 rounded-full",
                    "text-white/95",
                    "shadow-lg shadow-purple-500/10",
                    "border border-purple-400/20"
                  )}>
                    Chapter {selectedChapter.position || 1}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 dark:from-purple-500/30 via-blue-500/10 dark:via-blue-500/20 to-transparent" />
                </div>

                <h3 className={cn(
                  "text-2xl md:text-3xl lg:text-4xl font-bold",
                  "text-slate-900 dark:text-white",
                  "tracking-tight leading-tight",
                  "font-heading"
                )}>
                  {selectedChapter.title}
                </h3>

                {selectedChapter.imageUrl && (
                  <div className="relative w-full h-[30vh] md:h-[35vh] lg:h-[45vh] rounded-xl overflow-hidden">
                    <Image
                      src={selectedChapter.imageUrl}
                      alt={selectedChapter.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className={cn(
                  "prose dark:prose-invert max-w-none",
                  "text-sm md:text-base lg:text-lg",
                  "text-slate-700 dark:text-slate-300",
                  "leading-relaxed tracking-wide"
                )}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: selectedChapter.description || "No description available",
                    }}
                    className="text-justify"
                  />
                </div>

                <div className="hidden md:block pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-purple-400/30 dark:bg-purple-400/50" />
                    <div className="h-1 w-1 rounded-full bg-blue-400/30 dark:bg-blue-400/50" />
                    <div className="h-1 w-1 rounded-full bg-cyan-400/30 dark:bg-cyan-400/50" />
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
      "p-4 md:p-8 lg:p-12 rounded-2xl md:rounded-3xl mb-2 md:mb-4",
      "border border-slate-200/50 dark:border-slate-700/50 shadow-lg"
    )}>
      <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-6">
        <span className={cn(
          "text-xs md:text-sm font-medium",
          "bg-gradient-to-r from-purple-500/90 to-blue-500/90 dark:from-purple-400/80 dark:to-blue-400/80",
          "px-2 md:px-3 py-0.5 md:py-1 rounded-full",
          "text-white"
        )}>
          Chapter {chapter.position || 1}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-transparent" />
      </div>

      <div className={cn(
        "prose max-w-4xl mx-auto",
        "text-sm md:text-base lg:text-lg",
        "font-light tracking-wide",
        "leading-relaxed"
      )}>
        <div
          dangerouslySetInnerHTML={{
            __html: chapter.description || "No description available",
          }}
          className={cn(
            "text-slate-700 dark:text-slate-300",
            "text-justify",
            "prose-headings:text-slate-900 dark:prose-headings:text-white",
            "prose-strong:text-slate-800 dark:prose-strong:text-slate-100",
            "prose-em:text-slate-700 dark:prose-em:text-slate-300",
            "prose-code:text-slate-800 dark:prose-code:text-slate-200",
            "prose-a:text-blue-600 dark:prose-a:text-blue-400",
            "hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300"
          )}
        />
      </div>

      {chapter.imageUrl && (
        <div className="relative w-full h-[15rem] md:h-[20rem] lg:h-[28rem] mt-4 md:mt-8 group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 dark:from-purple-500/10 to-blue-500/5 dark:to-blue-500/10 rounded-xl z-10" />
          <Image
            src={chapter.imageUrl}
            alt={chapter.title || "Chapter image"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover rounded-xl",
              "transition-transform duration-500",
              "group-hover:scale-105"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 dark:from-gray-900/50 to-transparent rounded-xl z-20" />
        </div>
      )}

      <div className="hidden lg:block mt-6">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-purple-400/30 dark:bg-purple-400/50" />
          <div className="h-1 w-1 rounded-full bg-blue-400/30 dark:bg-blue-400/50" />
          <div className="h-1 w-1 rounded-full bg-cyan-400/30 dark:bg-cyan-400/50" />
        </div>
      </div>
    </div>
  );
};

export default PostCardCarouselDemo;
  



