"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import parse from "html-react-parser";
import { Calendar, Clock, TrendingUp } from "lucide-react";

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

interface TimelineViewProps {
  data: PostChapterData[];
}

export const TimelineView = ({ data }: TimelineViewProps) => {
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
                <p className="mb-3 text-gray-700 dark:text-gray-300">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Timeline Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4"
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Chapter Journey</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
          >
            Timeline View
          </motion.h1>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-cyan-500 transform -translate-x-1/2 hidden md:block" />

          {/* Timeline Items */}
          <div className="space-y-12">
            {data.map((chapter, index) => {
              const isEven = index % 2 === 0;
              const readTime = Math.ceil((chapter.description?.split(/\s+/).length || 0) / 200);

              return (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={cn(
                    "relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center",
                    !isEven && "md:flex-row-reverse"
                  )}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10 hidden md:flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.2 + 0.3,
                        type: "spring",
                      }}
                      className="relative flex items-center justify-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-900 border-4 border-purple-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold bg-gradient-to-br from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {index + 1}
                        </span>
                      </div>
                      {/* Pulse Effect */}
                      <motion.div
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 rounded-full bg-purple-500"
                      />
                    </motion.div>
                  </div>

                  {/* Content Card - Left or Right */}
                  <div
                    className={cn(
                      "md:col-span-1",
                      isEven ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"
                    )}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.2 + 0.2 }}
                      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden group hover:shadow-2xl transition-shadow duration-300"
                    >
                      {/* Card Header */}
                      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {new Date(chapter.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {chapter.title}
                        </h3>
                      </div>

                      {/* Card Image */}
                      {chapter.imageUrl && (
                        <div className="relative w-full h-64 overflow-hidden">
                          <Image
                            src={chapter.imageUrl}
                            alt={chapter.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none mb-4 line-clamp-4">
                          {parseHtmlContent(chapter.description)}
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span>{readTime} min read</span>
                          </div>
                          <div className="ml-auto">
                            <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
                              Read More
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:col-span-1" />
                </motion.div>
              );
            })}
          </div>

          {/* Timeline End Marker */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: data.length * 0.2 + 0.5 }}
            className="relative mt-12 flex justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
