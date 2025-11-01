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

interface MagazineLayoutProps {
  data: PostChapterData[];
}

export const MagazineLayout = ({ data }: MagazineLayoutProps) => {
  const parseHtmlContent = (htmlString: string | null): React.ReactNode => {
    if (!htmlString || htmlString.trim() === "") {
      return <p className="text-gray-500">No description available</p>;
    }

    return parse(htmlString, {
      replace: (domNode: any) => {
        if (domNode.type === "tag") {
          switch (domNode.name) {
            case "p":
              return (
                <p className="mb-4 first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-purple-600 dark:first-letter:text-purple-400">
                  {domNode.children.map((child: any) => child.data || "")}
                </p>
              );
            case "strong":
            case "b":
              return (
                <span className="font-bold">
                  {domNode.children.map((child: any) => child.data || "")}
                </span>
              );
            case "em":
            case "i":
              return (
                <span className="italic">
                  {domNode.children.map((child: any) => child.data || "")}
                </span>
              );
          }
        }
        return undefined;
      },
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {data.map((chapter, index) => (
          <motion.section
            key={chapter.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            className={cn(
              "mb-16 pb-16",
              index < data.length - 1 &&
                "border-b-2 border-gray-200 dark:border-gray-800"
            )}
          >
            {/* Magazine Header */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 + 0.1 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className="w-1 h-12 bg-gradient-to-b from-purple-600 to-blue-600" />
                <div>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Chapter {index + 1}
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mt-1">
                    {chapter.title}
                  </h2>
                </div>
              </motion.div>
            </div>

            {/* Magazine Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-8">
                {chapter.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.2 }}
                    className="relative w-full h-[450px] mb-8 rounded-lg overflow-hidden shadow-xl"
                  >
                    <Image
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                  className="prose prose-lg dark:prose-invert max-w-none columns-1 md:columns-2 gap-8 prose-p:text-gray-700 dark:prose-p:text-gray-300"
                >
                  {parseHtmlContent(chapter.description)}
                </motion.div>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="lg:col-span-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 + 0.4 }}
                  className="sticky top-24 space-y-6"
                >
                  {/* Pull Quote */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border-l-4 border-purple-600">
                    <svg
                      className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                    </svg>
                    <blockquote className="text-xl font-serif italic text-gray-800 dark:text-gray-200">
                      {chapter.title}
                    </blockquote>
                  </div>

                  {/* Key Points */}
                  <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Key Points
                    </h3>
                    <ul className="space-y-3">
                      {[1, 2, 3].map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                            {point}
                          </span>
                          <span>Important insight from this chapter</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stats Box */}
                  <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl text-white">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-3xl font-bold">{index + 1}</p>
                        <p className="text-xs text-gray-300">Chapter</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold">
                          {Math.ceil((chapter.description?.split(/\s+/).length || 0) / 200)}
                        </p>
                        <p className="text-xs text-gray-300">Min Read</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
};

export default MagazineLayout;
