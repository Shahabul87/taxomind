"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Video as VideoIcon, Star, Play, ExternalLink, Plus, Film, Globe, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { VideoAccessTier } from "@prisma/client";

interface DisplayVideosProps {
  videos: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    rating: number | null;
    thumbnail?: string | null;
    platform?: string | null;
    accessTier?: VideoAccessTier;
  }[];
  onVideoClick: (url: string) => void;
}

const tierConfig = {
  FREE: { label: "Free", icon: Globe, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  ENROLLED: { label: "Enrolled", icon: Shield, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  PREMIUM: { label: "Premium", icon: Crown, className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
} as const;

// Helper function to extract YouTube video ID
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtu\.be\/([^"&?\/\s]{11})/,
    /[?&]v=([^"&?\/\s]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
};

// Helper function to get video thumbnail
const getVideoThumbnail = (video: DisplayVideosProps['videos'][0]): string | null => {
  // If thumbnail is already stored, use it
  if (video.thumbnail) return video.thumbnail;

  // If it's a YouTube URL, generate thumbnail URL
  if (video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'))) {
    const videoId = extractYouTubeId(video.url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  return null;
};

// Empty State Illustration Component
const EmptyVideoIllustration = () => (
  <div className="relative">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/30 dark:from-blue-900/20 dark:to-cyan-900/10 rounded-full blur-2xl" />

    {/* Main illustration */}
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Video frame */}
      <div className="relative w-24 h-16 sm:w-32 sm:h-20 mx-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800 dark:to-cyan-800 rounded-lg shadow-lg" />
        <div className="absolute inset-1 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-md" />

        {/* Play button */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 dark:bg-white/80 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 ml-0.5" />
          </div>
        </motion.div>

        {/* Decorative film strips */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="absolute -top-2 -left-2 w-6 h-6 sm:w-8 sm:h-8"
        >
          <Film className="w-full h-full text-blue-400/60 dark:text-blue-500/40" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-2 -right-2 w-5 h-5 sm:w-6 sm:h-6"
        >
          <VideoIcon className="w-full h-full text-cyan-400/60 dark:text-cyan-500/40" />
        </motion.div>
      </div>

      {/* Dotted line decoration */}
      <div className="flex justify-center gap-1 mt-3">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            className="w-1 h-1 rounded-full bg-blue-400 dark:bg-blue-500"
          />
        ))}
      </div>
    </motion.div>
  </div>
);

export const DisplayVideos = ({
  videos,
  onVideoClick,
}: DisplayVideosProps) => {
  if (!videos.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-8 sm:py-12 px-4"
      >
        <EmptyVideoIllustration />

        <h4 className="mt-5 sm:mt-6 text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
          No videos yet
        </h4>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center max-w-[280px]">
          Add video resources to help students learn visually and engage with the material
        </p>

        {/* CTA hint */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
          <Plus className="w-3.5 h-3.5" />
          <span>Click &quot;Add video&quot; above to get started</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6">
      <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
        {videos.length} Video {videos.length === 1 ? 'Resource' : 'Resources'}
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => video.url && onVideoClick(video.url)}
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
              {getVideoThumbnail(video) ? (
                <Image
                  src={getVideoThumbnail(video)!}
                  alt={video.title}
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
                  <VideoIcon className="h-8 w-8 text-blue-400 dark:text-blue-500" />
                </div>
              )}

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 dark:bg-slate-900/90 rounded-full p-1.5 sm:p-2 transform scale-90 group-hover:scale-100 transition-transform">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                </div>
              </div>

              {/* Platform badge */}
              {video.platform && (
                <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 bg-black/70 backdrop-blur-sm px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] text-white font-medium">
                  {video.platform}
                </div>
              )}

              {/* Access Tier badge */}
              {video.accessTier && (() => {
                const tier = tierConfig[video.accessTier];
                const TierIcon = tier.icon;
                return (
                  <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5">
                    <Badge variant="outline" className={cn("text-[9px] sm:text-[10px] px-1.5 py-0.5 gap-1 border", tier.className)}>
                      <TierIcon className="h-2.5 w-2.5" />
                      {tier.label}
                    </Badge>
                  </div>
                );
              })()}
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
                {video.title}
              </h4>

              {video.description && (
                <p className={cn(
                  "text-[10px] sm:text-xs leading-relaxed mb-1.5 sm:mb-2",
                  "text-slate-600 dark:text-slate-400",
                  "line-clamp-2"
                )}>
                  {video.description}
                </p>
              )}

              {/* Rating and External Link */}
              <div className="flex items-center justify-between mt-auto">
                {video.rating ? (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-2.5 w-2.5 sm:h-3 sm:w-3",
                          star <= (video.rating || 0)
                            ? "text-yellow-500 dark:text-yellow-400 fill-yellow-500 dark:fill-yellow-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    ))}
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 ml-0.5 sm:ml-1">
                      {video.rating}/5
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