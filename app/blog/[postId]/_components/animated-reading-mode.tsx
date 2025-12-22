"use client";

import React from "react";
import Image from "next/image";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@/components/ui/animated-modal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";

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

interface AnimatedReadingModeProps {
  postchapter: ChapterData[];
}

export const AnimatedReadingMode: React.FC<AnimatedReadingModeProps> = ({
  postchapter,
}) => {
  // Handle null/undefined postchapter
  if (!postchapter || !Array.isArray(postchapter) || postchapter.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 bg-blog-bg dark:bg-slate-900">
        <p className="text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-body)]">No chapters available</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 px-4 md:px-6 bg-blog-bg dark:bg-slate-900/50">
      {/* Header - Editorial */}
      <div className="mb-8 space-y-2">
        <h2
          className={cn(
            "text-2xl md:text-3xl lg:text-4xl font-bold",
            "text-blog-text dark:text-white",
            "font-[family-name:var(--font-display)]",
            "tracking-tight"
          )}
        >
          Immersive Reading Experience
        </h2>
        <p className="text-sm md:text-base text-blog-text-muted dark:text-slate-400 font-[family-name:var(--font-body)]">
          Click any chapter card to dive into an immersive reading experience
        </p>
      </div>

      {/* Chapter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {postchapter.map((chapter, index) => (
          <ChapterCard key={chapter.id} chapter={chapter} index={index} />
        ))}
      </div>
    </div>
  );
};

const ChapterCard: React.FC<{ chapter: ChapterData; index: number }> = ({
  chapter,
  index,
}) => {
  const placeholderImage = "https://via.placeholder.com/400x250";

  return (
    <Modal>
      <ModalTrigger
        className={cn(
          "w-full h-auto p-0 rounded-xl overflow-hidden",
          "group cursor-pointer",
          "transition-all duration-300",
          "hover:shadow-2xl hover:-translate-y-1"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative h-full"
        >
          {/* Card Container - Warm Earth */}
          <div className="bg-blog-surface dark:bg-slate-900 border border-blog-border dark:border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={chapter.imageUrl || placeholderImage}
                alt={chapter.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Chapter Badge - Terracotta */}
              <div className="absolute top-3 left-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    "px-3 py-1.5 rounded-full text-xs font-semibold",
                    "bg-gradient-to-r from-blog-primary to-blog-primary-dark",
                    "text-white shadow-lg",
                    "font-[family-name:var(--font-ui)]"
                  )}
                >
                  <BookOpen className="w-3 h-3" />
                  Chapter {chapter.position || index + 1}
                </span>
              </div>

              {/* Status Badge */}
              {chapter.isFree && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blog-accent text-white font-[family-name:var(--font-ui)]">
                    Free
                  </span>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-blog-text dark:text-white mb-2 line-clamp-2 group-hover:text-blog-primary dark:group-hover:text-blog-primary-light transition-colors font-[family-name:var(--font-display)]">
                {chapter.title}
              </h3>

              {chapter.description && (
                <div
                  className="text-sm text-blog-text-muted dark:text-slate-400 line-clamp-2 mb-3 font-[family-name:var(--font-body)]"
                  dangerouslySetInnerHTML={{
                    __html: chapter.description.substring(0, 120) + "...",
                  }}
                />
              )}

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-blog-border dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-blog-text-muted dark:text-slate-500 font-[family-name:var(--font-ui)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>5 min read</span>
                  </div>
                  <div className="flex items-center gap-1 text-blog-primary dark:text-blog-primary-light font-medium">
                    <span>Read now</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </ModalTrigger>

      <ModalBody>
        <ModalContent className="max-h-[70vh] bg-blog-surface dark:bg-slate-900">
          {/* Modal Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  "bg-gradient-to-r from-blog-primary/10 to-blog-accent/10",
                  "text-blog-primary dark:text-blog-primary-light",
                  "border border-blog-primary/30 dark:border-blog-primary/40",
                  "font-[family-name:var(--font-ui)]"
                )}
              >
                <BookOpen className="w-3 h-3" />
                Chapter {chapter.position || index + 1}
              </span>
              {chapter.isFree && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blog-accent/10 text-blog-accent dark:bg-blog-accent/20 dark:text-blog-accent font-[family-name:var(--font-ui)]">
                  Free Chapter
                </span>
              )}
            </div>

            <h4 className="text-2xl md:text-3xl font-bold text-blog-text dark:text-white mb-4 font-[family-name:var(--font-display)]">
              {chapter.title}
            </h4>

            {/* Chapter Image in Modal */}
            {chapter.imageUrl && (
              <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6 border border-blog-border dark:border-slate-700">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}
          </div>

          {/* Chapter Content - Source Serif 4 */}
          <div
            className={cn(
              "prose prose-slate dark:prose-invert max-w-none",
              "font-[family-name:var(--font-body)]",
              "prose-headings:font-bold prose-headings:tracking-tight",
              "prose-headings:font-[family-name:var(--font-display)]",
              "prose-p:text-blog-text dark:prose-p:text-slate-300",
              "prose-p:leading-[1.8]",
              "prose-a:text-blog-primary dark:prose-a:text-blog-primary-light",
              "prose-strong:text-blog-text dark:prose-strong:text-white",
              "prose-code:text-blog-accent dark:prose-code:text-blog-accent",
              "prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950",
              "prose-blockquote:border-l-blog-primary prose-blockquote:bg-blog-primary/5"
            )}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: chapter.description || "No content available for this chapter.",
              }}
            />
          </div>
        </ModalContent>

        <ModalFooter className="gap-4 justify-between">
          <button className="px-4 py-2 bg-blog-bg text-blog-text dark:bg-slate-800 dark:text-white border border-blog-border dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-blog-border dark:hover:bg-slate-700 transition-colors font-[family-name:var(--font-ui)]">
            Close
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blog-primary to-blog-primary-dark text-white rounded-lg text-sm font-medium hover:from-blog-primary-dark hover:to-blog-primary transition-all shadow-lg hover:shadow-xl flex items-center gap-2 font-[family-name:var(--font-ui)]">
            <CheckCircle2 className="w-4 h-4" />
            Mark as Complete
          </button>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
};

export default AnimatedReadingMode;
