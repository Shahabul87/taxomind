"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse from "html-react-parser";

interface PostChapterData {
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
  content: string | null;
}

interface FocusModeProps {
  data: PostChapterData[];
}

export const FocusMode = ({ data }: FocusModeProps) => {
  const parseHtmlContent = (htmlString: string | null): React.ReactNode => {
    if (!htmlString || htmlString.trim() === "") {
      return <p className="text-gray-500">No description available</p>;
    }

    const isPWrapped = htmlString.trim().startsWith("<p>") && htmlString.trim().endsWith("</p>");

    return parse(htmlString, {
      replace: (domNode: any) => {
        if (
          domNode.type === "tag" &&
          domNode.name === "p" &&
          domNode.parent === null &&
          isPWrapped
        ) {
          return domNode.children;
        }

        if (domNode.type === "tag") {
          switch (domNode.name) {
            case "strong":
            case "b":
              return (
                <span className="font-bold">
                  {domNode.children.map((child: any) =>
                    child.data || (child.children && parse(child.children))
                  )}
                </span>
              );
            case "em":
            case "i":
              return (
                <span className="italic">
                  {domNode.children.map((child: any) =>
                    child.data || (child.children && parse(child.children))
                  )}
                </span>
              );
          }
        }
        return undefined;
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {data.map((chapter, index) => (
          <motion.article
            key={chapter.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: index * 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-24 scroll-mt-24"
          >
            {/* Chapter Number */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.3 + 0.2 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold text-lg shadow-lg">
                {index + 1}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-purple-300 via-blue-300 to-transparent dark:from-purple-700 dark:via-blue-700" />
            </motion.div>

            {/* Chapter Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.3 + 0.3 }}
              className="text-4xl md:text-5xl font-extrabold mb-10 bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text text-transparent leading-tight"
            >
              {chapter.title}
            </motion.h2>

            {/* Chapter Image */}
            {chapter.imageUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.3 + 0.4 }}
                className="relative w-full h-[500px] mb-12 rounded-2xl overflow-hidden shadow-2xl"
              >
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </motion.div>
            )}

            {/* Chapter Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: index * 0.3 + 0.5 }}
              className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6"
            >
              {parseHtmlContent(chapter.description)}
            </motion.div>

            {/* Chapter Divider */}
            {index < data.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.8, delay: index * 0.3 + 0.6 }}
                className="mt-20 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"
              />
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
};

export default FocusMode;
