"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse, { DOMNode, Element } from 'html-react-parser';

interface PostChapter {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  postId: string;
  videoUrl?: string | null;
  position: number;
  isPublished: boolean | null;
  isFree: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PostCardModelTwoProps {
  data: PostChapter[];
}

export const PostCardModelTwo = ({ data }: PostCardModelTwoProps) => {
  const parseHtmlContent = (htmlString: string) => {
    const isPWrapped = htmlString.trim().startsWith('<p>') && htmlString.trim().endsWith('</p>');

    return parse(htmlString, {
      replace: (domNode: DOMNode) => {
        if (domNode.type === 'tag') {
          const element = domNode as Element;
          if (element.name === 'p' && element.parent === null && isPWrapped) {
            return element.children;
          }

          switch (element.name) {
            case 'strong':
            case 'b':
              return <span className="font-bold text-blog-text dark:text-white">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
            case 'em':
            case 'i':
              return <span className="italic text-blog-text-muted dark:text-slate-300">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
            case 'u':
              return <span className="underline decoration-blog-primary/40">{element.children?.map((child) =>
                (child as { data?: string }).data || ((child as Element).children && parse((child as Element).children as unknown as string))
              )}</span>;
          }
        }
        return undefined;
      }
    });
  };

  // Handle null/undefined data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center p-10 bg-blog-bg dark:bg-slate-900">
        <p className="text-blog-text-muted dark:text-slate-400 font-blog-body">No chapters available</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-4 sm:space-y-6 md:space-y-10 lg:space-y-16 px-2 sm:px-3 md:px-4 lg:px-6 max-w-[85rem] bg-blog-bg dark:bg-slate-900/50">
      {data.map((chapter, index) => (
        <motion.article
          key={chapter.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: index * 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          className={cn(
            "group relative",
            "backdrop-blur-xl transition-all duration-500",
            "rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden"
          )}
        >
          {/* Background - Warm Earth Tones */}
          <div className="absolute inset-0 bg-gradient-to-br from-blog-surface/95 to-blog-bg/80 dark:from-slate-800/90 dark:to-slate-900/80 backdrop-blur-xl" />

          <div className="relative p-3 sm:p-5 md:p-6 lg:p-8 xl:p-12">
            {/* Chapter Badge - Terracotta */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <div className={cn(
                "px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full",
                "bg-[#C65D3B]",
                "shadow-lg shadow-[#C65D3B]/20",
                "transform-gpu transition-transform duration-300",
                "group-hover:scale-105"
              )}>
                <span className="text-white text-[10px] sm:text-xs md:text-sm font-medium tracking-wider whitespace-nowrap font-blog-ui">
                  Chapter {index + 1}
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#C65D3B]/30 via-[#87A878]/20 to-transparent" />
            </div>

            {/* Title - Playfair Display */}
            <h2 className={cn(
              "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10",
              "text-blog-text dark:text-white",
              "font-blog-display",
              "tracking-tight leading-[1.2] sm:leading-tight",
              "transform-gpu transition-transform duration-300",
              "group-hover:translate-x-1 sm:group-hover:translate-x-2"
            )}>
              {chapter.title}
            </h2>

            {/* Image Container */}
            {chapter.imageUrl && (
              <div className="relative w-full h-[200px] xs:h-[220px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden border border-blog-border dark:border-slate-700">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className={cn(
                    "object-cover",
                    "transform-gpu transition-all duration-700 ease-out",
                    "group-hover:scale-105",
                    "filter saturate-[1.1]"
                  )}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 85rem"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* Description - Source Serif 4 Body Font */}
            {chapter.description && (
              <div className={cn(
                "prose prose-sm sm:prose-base md:prose-lg lg:prose-xl max-w-none",
                "dark:prose-invert",
                "font-blog-body",
                "prose-p:text-blog-text dark:prose-p:text-slate-300",
                "prose-p:text-sm sm:prose-p:text-base md:prose-p:text-lg",
                "prose-p:leading-[1.75] sm:prose-p:leading-[1.8]",
                "prose-p:mb-3 sm:prose-p:mb-4",
                "prose-strong:text-blog-text dark:prose-strong:text-white",
                "prose-strong:text-sm sm:prose-strong:text-base md:prose-strong:text-lg",
                "prose-headings:text-blog-text dark:prose-headings:text-white",
                "prose-headings:font-blog-display",
                "prose-headings:text-base sm:prose-headings:text-lg md:prose-headings:text-xl lg:prose-headings:text-2xl",
                "prose-headings:mt-4 sm:prose-headings:mt-6",
                "prose-headings:mb-2 sm:prose-headings:mb-3",
                "prose-ul:text-sm sm:prose-ul:text-base md:prose-ul:text-lg",
                "prose-ol:text-sm sm:prose-ol:text-base md:prose-ol:text-lg",
                "prose-li:text-sm sm:prose-li:text-base md:prose-li:text-lg",
                "prose-a:text-blog-primary dark:prose-a:text-blog-primary-light",
                "prose-a:text-sm sm:prose-a:text-base",
                "prose-blockquote:text-sm sm:prose-blockquote:text-base md:prose-blockquote:text-lg",
                "prose-blockquote:border-l-blog-primary prose-blockquote:bg-blog-primary/5",
                "prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic",
                "prose-code:text-xs sm:prose-code:text-sm prose-code:text-blog-accent",
                "leading-[1.75] sm:leading-[1.8]"
              )}>
                {parseHtmlContent(chapter.description)}
              </div>
            )}

            {/* Decorative Elements - Warm Earth Colors */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mt-3 sm:mt-4 md:mt-6 lg:mt-8 xl:mt-10">
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-blog-primary/50 dark:bg-blog-primary/60" />
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-blog-accent/50 dark:bg-blog-accent/60" />
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-blog-gold/50 dark:bg-blog-gold/60" />
            </div>
          </div>

          {/* Border - Warm Earth */}
          <div className="absolute inset-0 border border-blog-border dark:border-slate-700/50 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl pointer-events-none" />
        </motion.article>
      ))}
    </div>
  );
};

export default PostCardModelTwo;
