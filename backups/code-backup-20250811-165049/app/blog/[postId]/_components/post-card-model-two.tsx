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

  return (
    <div className="max-w-[85rem] mx-auto space-y-16 px-4">
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
            "rounded-3xl overflow-hidden"
          )}
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-900/40 backdrop-blur-xl" />
          
          <div className="relative p-8 lg:p-12">
            {/* Chapter Badge */}
            <div className="flex items-center gap-6 mb-8">
              <div className={cn(
                "px-4 py-2 rounded-full",
                "bg-gradient-to-r from-purple-600/90 to-blue-600/90",
                "dark:from-purple-400 dark:to-blue-400",
                "shadow-lg shadow-purple-500/20",
                "transform-gpu transition-transform duration-300",
                "group-hover:scale-105"
              )}>
                <span className="text-white text-sm font-medium tracking-wider">
                  Chapter {index + 1}
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-transparent" />
            </div>

            {/* Title */}
            <h2 className={cn(
              "text-4xl lg:text-5xl font-bold mb-10",
              "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900",
              "dark:from-white dark:via-gray-100 dark:to-white",
              "bg-clip-text text-transparent",
              "tracking-tight leading-tight",
              "transform-gpu transition-transform duration-300",
              "group-hover:translate-x-2"
            )}>
              {chapter.title}
            </h2>

            {/* Image Container */}
            {chapter.imageUrl && (
              <div className="relative w-full h-[400px] lg:h-[500px] mb-10 rounded-2xl overflow-hidden">
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            {/* Description */}
            <div className={cn(
              "prose prose-lg lg:prose-xl max-w-none",
              "dark:prose-invert",
              "prose-p:text-gray-700 dark:prose-p:text-gray-300",
              "prose-strong:text-gray-900 dark:prose-strong:text-white",
              "prose-headings:text-gray-900 dark:prose-headings:text-white",
              "leading-relaxed"
            )}>
              {parseHtmlContent(chapter.description)}
            </div>

            {/* Decorative Elements */}
            <div className="flex items-center gap-4 mt-10">
              <div className="h-2 w-2 rounded-full bg-purple-500/40 dark:bg-purple-400/60" />
              <div className="h-2 w-2 rounded-full bg-blue-500/40 dark:bg-blue-400/60" />
              <div className="h-2 w-2 rounded-full bg-cyan-500/40 dark:bg-cyan-400/60" />
            </div>
          </div>

          {/* Border Gradients */}
          <div className="absolute inset-0 border border-gradient-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 rounded-3xl pointer-events-none" />
        </motion.article>
      ))}
    </div>
  );
};

export default PostCardModelTwo;
