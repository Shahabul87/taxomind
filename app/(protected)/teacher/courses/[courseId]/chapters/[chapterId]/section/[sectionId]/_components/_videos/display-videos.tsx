"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Video as VideoIcon, Star, Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisplayVideosProps {
  videos: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    rating: number | null;
    thumbnail?: string | null;
    platform?: string | null;
  }[];
  onVideoClick: (url: string) => void;
}

export const DisplayVideos = ({
  videos,
  onVideoClick,
}: DisplayVideosProps) => {
  if (!videos.length) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-4">
        No videos added to this section yet
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {videos.length} Video Resources
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => video.url && onVideoClick(video.url)}
            className={cn(
              "group rounded-lg",
              "bg-white/50 dark:bg-gray-900/50",
              "border border-gray-200 dark:border-gray-700/50",
              "hover:bg-gray-50 dark:hover:bg-gray-800/70",
              "transition-all duration-300",
              "cursor-pointer",
              "overflow-hidden"
            )}
          >
            <div className="relative h-32 bg-gray-200 dark:bg-gray-800">
              {video.thumbnail ? (
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={320}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                  <VideoIcon className="h-10 w-10 text-blue-300 dark:text-blue-500" />
                </div>
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <div className="bg-black/60 rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>

              {video.platform && (
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                  <span className="text-white text-xs">{video.platform}</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="space-y-1">
                <h4 className={cn(
                  "text-sm font-medium",
                  "text-gray-900 dark:text-gray-200",
                  "group-hover:text-blue-700 dark:group-hover:text-blue-300",
                  "transition-colors duration-300",
                  "line-clamp-1"
                )}>
                  {video.title}
                </h4>
                <p className={cn(
                  "text-xs",
                  "text-gray-600 dark:text-gray-400",
                  "transition-colors duration-300",
                  "line-clamp-2"
                )}>
                  {video.description}
                </p>
              </div>

              <div className={cn(
                "flex items-center justify-between mt-3",
                "pt-2 border-t",
                "border-gray-200 dark:border-gray-700/50"
              )}>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-3.5 w-3.5",
                        star <= (video.rating || 0)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300 dark:text-gray-600"
                      )}
                    />
                  ))}
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 