"use client";

import { useRouter } from "next/navigation";
import { Edit, Trash, ExternalLink, BookOpen, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

interface Blog {
  id: string;
  title: string;
  description: string | null;
  url: string;
  author: string | null;
  position: number;
  rating?: number | null;
  thumbnail?: string | null;
  siteName?: string | null;
}

interface DisplayBlogsProps {
  items: Blog[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Helper function to get blog thumbnail or placeholder
const getBlogThumbnail = (blog: Blog): string | null => {
  return blog.thumbnail || null;
};

export const DisplayBlogs = ({
  items,
  onEdit,
  onDelete
}: DisplayBlogsProps) => {
  const router = useRouter();

  const handleBlogClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!items.length) {
    return (
      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 sm:mt-4">
        No blog articles added to this section yet
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6">
      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
        {items.length} Blog {items.length === 1 ? 'Article' : 'Articles'}
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleBlogClick(item.url)}
            className={cn(
              "group flex flex-col xs:flex-row gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg",
              "bg-white dark:bg-slate-900",
              "border border-slate-200 dark:border-slate-700",
              "hover:border-blue-300 dark:hover:border-blue-600",
              "hover:shadow-md",
              "transition-all duration-300",
              "cursor-pointer"
            )}
          >
            {/* Thumbnail - Top on mobile, Left on larger screens */}
            <div className="relative w-full xs:w-32 sm:w-40 h-32 xs:h-20 sm:h-24 flex-shrink-0 rounded-md overflow-hidden">
              {getBlogThumbnail(item) ? (
                <Image
                  src={getBlogThumbnail(item)!}
                  alt={item.title}
                  width={160}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                  <BookOpen className="h-8 w-8 text-blue-400 dark:text-blue-500" />
                </div>
              )}

              {/* External link overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 dark:bg-slate-900/90 rounded-full p-1.5 sm:p-2 transform scale-90 group-hover:scale-100 transition-transform">
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Site name badge */}
              {item.siteName && (
                <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-black/70 backdrop-blur-sm px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] text-white font-medium">
                  {item.siteName}
                </div>
              )}
            </div>

            {/* Details - Bottom on mobile, Right Side on larger screens */}
            <div className="flex-1 min-w-0 flex flex-col">
              <h4 className={cn(
                "text-xs sm:text-sm font-semibold leading-snug mb-1",
                "text-slate-900 dark:text-slate-100",
                "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                "transition-colors duration-300",
                "line-clamp-2"
              )}>
                {item.title}
              </h4>

              {item.description && (
                <p className={cn(
                  "text-[10px] sm:text-xs leading-relaxed mb-1.5 sm:mb-2",
                  "text-slate-600 dark:text-slate-400",
                  "line-clamp-2"
                )}>
                  {item.description}
                </p>
              )}

              {/* Rating and External Link */}
              <div className="flex items-center justify-between mt-auto">
                {item.rating ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-2.5 w-2.5 sm:h-3 sm:w-3",
                          star <= (item.rating || 0)
                            ? "text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    ))}
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 ml-0.5 sm:ml-1">
                      {item.rating}/5
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">
                    No rating
                  </div>
                )}

                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 