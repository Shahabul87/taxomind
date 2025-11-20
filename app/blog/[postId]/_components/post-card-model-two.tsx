"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse from 'html-react-parser';

interface PostCardModelTwoProps {
  data: any[];
}

export const PostCardModelTwo = ({ data }: PostCardModelTwoProps) => {
  const parseHtmlContent = (htmlString: string) => {
    const isPWrapped = htmlString.trim().startsWith('<p>') && htmlString.trim().endsWith('</p>');
    
    return parse(htmlString, {
      replace: (domNode: any) => {
        if (domNode.type === 'tag' && domNode.name === 'p' && domNode.parent === null && isPWrapped) {
          return domNode.children;
        }
        
        if (domNode.type === 'tag') {
          switch (domNode.name) {
            case 'strong':
            case 'b':
              return <span className="font-bold">{domNode.children.map((child: any) => 
                child.data || (child.children && parse(child.children))
              )}</span>;
            case 'em':
            case 'i':
              return <span className="italic">{domNode.children.map((child: any) => 
                child.data || (child.children && parse(child.children))
              )}</span>;
            case 'u':
              return <span className="underline">{domNode.children.map((child: any) => 
                child.data || (child.children && parse(child.children))
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
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500 dark:text-gray-400">No chapters available</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto space-y-4 sm:space-y-6 md:space-y-10 lg:space-y-16 px-2 sm:px-3 md:px-4 lg:px-6 max-w-[85rem]">
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
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-xl" />

          <div className="relative p-3 sm:p-5 md:p-6 lg:p-8 xl:p-12">
            {/* Chapter Badge */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <div className={cn(
                "px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full",
                "bg-gradient-to-r from-purple-600/90 to-blue-600/90",
                "dark:from-purple-400 dark:to-blue-400",
                "shadow-lg shadow-purple-500/20",
                "transform-gpu transition-transform duration-300",
                "group-hover:scale-105"
              )}>
                <span className="text-white text-[10px] sm:text-xs md:text-sm font-medium tracking-wider whitespace-nowrap">
                  Chapter {index + 1}
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-transparent" />
            </div>

            {/* Title */}
            <h2 className={cn(
              "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10",
              "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
              "dark:from-white dark:via-gray-100 dark:to-white",
              "bg-clip-text text-transparent",
              "tracking-tight leading-[1.2] sm:leading-tight",
              "transform-gpu transition-transform duration-300",
              "group-hover:translate-x-1 sm:group-hover:translate-x-2"
            )}>
              {chapter.title}
            </h2>

            {/* Image Container */}
            {chapter.imageUrl && (
              <div className="relative w-full h-[200px] xs:h-[220px] sm:h-[280px] md:h-[350px] lg:h-[450px] xl:h-[500px] mb-3 sm:mb-4 md:mb-6 lg:mb-8 xl:mb-10 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden">
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

            {/* Description */}
            {chapter.description && (
              <div className={cn(
                "prose prose-sm sm:prose-base md:prose-lg lg:prose-xl max-w-none",
                "dark:prose-invert",
                "prose-p:text-gray-700 dark:prose-p:text-gray-300",
                "prose-p:text-sm sm:prose-p:text-base md:prose-p:text-lg",
                "prose-p:leading-relaxed sm:prose-p:leading-relaxed",
                "prose-p:mb-3 sm:prose-p:mb-4",
                "prose-strong:text-gray-900 dark:prose-strong:text-white",
                "prose-strong:text-sm sm:prose-strong:text-base md:prose-strong:text-lg",
                "prose-headings:text-gray-900 dark:prose-headings:text-white",
                "prose-headings:text-base sm:prose-headings:text-lg md:prose-headings:text-xl lg:prose-headings:text-2xl",
                "prose-headings:mt-4 sm:prose-headings:mt-6",
                "prose-headings:mb-2 sm:prose-headings:mb-3",
                "prose-ul:text-sm sm:prose-ul:text-base md:prose-ul:text-lg",
                "prose-ol:text-sm sm:prose-ol:text-base md:prose-ol:text-lg",
                "prose-li:text-sm sm:prose-li:text-base md:prose-li:text-lg",
                "prose-a:text-blue-600 dark:prose-a:text-blue-400",
                "prose-a:text-sm sm:prose-a:text-base",
                "prose-blockquote:text-sm sm:prose-blockquote:text-base md:prose-blockquote:text-lg",
                "prose-code:text-xs sm:prose-code:text-sm",
                "leading-relaxed"
              )}>
                {parseHtmlContent(chapter.description)}
              </div>
            )}

            {/* Decorative Elements */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 mt-3 sm:mt-4 md:mt-6 lg:mt-8 xl:mt-10">
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-purple-500/40 dark:bg-purple-400/60" />
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500/40 dark:bg-blue-400/60" />
              <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 md:h-2 md:w-2 rounded-full bg-cyan-500/40 dark:bg-cyan-400/60" />
            </div>
          </div>

          {/* Border Gradients */}
          <div className="absolute inset-0 border border-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl pointer-events-none" />
        </motion.article>
      ))}
    </div>
  );
};

export default PostCardModelTwo;
