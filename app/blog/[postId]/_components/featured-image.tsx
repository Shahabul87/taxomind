"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Camera, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeaturedImageProps {
  imageUrl: string;
  title: string;
  caption?: string;
  photographer?: string;
}

export const FeaturedImage = ({ imageUrl, title, caption, photographer }: FeaturedImageProps) => {
  const [showImage, setShowImage] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="space-y-3 sm:space-y-4 blog-content-reveal blog-delay-4">
      {/* Controls Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-blog-text-muted font-blog-ui">
          {photographer && (
            <div className="flex items-center gap-1.5 text-xs">
              <Camera className="w-3.5 h-3.5" />
              <span>Photo by {photographer}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 text-blog-text-muted hover:text-blog-primary text-xs font-blog-ui transition-colors"
            aria-label="View fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-blog-text-muted hover:text-blog-primary text-xs font-blog-ui transition-colors"
            onClick={() => setShowImage(!showImage)}
            aria-label={showImage ? "Hide image" : "Show image"}
          >
            {showImage ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Show</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Featured Image with Cinematic Animation */}
      <AnimatePresence mode="wait">
        {showImage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1]
            }}
            className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden border border-blog-border shadow-lg shadow-blog-primary/5"
          >
            {/* Image Container */}
            <div className="relative w-full aspect-[16/9] bg-blog-surface">
              {/* Gradient Overlay for Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10 pointer-events-none" />

              {/* Loading Skeleton */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-blog-surface via-blog-surface-elevated to-blog-surface animate-pulse" />
              )}

              <Image
                src={imageUrl}
                alt={title}
                fill
                className={cn(
                  "object-cover transition-all duration-700",
                  isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
                )}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                priority
                quality={85}
                loading="eager"
                fetchPriority="high"
                onLoad={() => setIsLoaded(true)}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0ZBRjZGMSIvPjwvc3ZnPg=="
              />

              {/* Caption Bar */}
              {caption && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent"
                >
                  <p className="text-white/90 text-xs sm:text-sm font-blog-body italic">
                    {caption}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Decorative Corner Accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/30 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-white/30 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br-lg pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close fullscreen"
              >
                <EyeOff className="w-6 h-6" />
              </Button>
              {caption && (
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white/80 text-sm font-blog-body italic">
                    {caption}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
