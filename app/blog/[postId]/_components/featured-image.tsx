"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedImageProps {
  imageUrl: string;
  title: string;
}

export const FeaturedImage = ({ imageUrl, title }: FeaturedImageProps) => {
  const [showImage, setShowImage] = useState(true);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-gray-200 text-xs sm:text-sm"
          onClick={() => setShowImage(!showImage)}
        >
          {showImage ? (
            <>
              <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Hide Image</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Show Image</span>
            </>
          )}
        </Button>
      </div>
      {showImage && (
        <div className="relative w-full rounded-lg sm:rounded-xl overflow-hidden border border-gray-700/50">
          <div className="relative w-full aspect-[16/9] bg-slate-200 dark:bg-slate-700">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
              priority
              quality={75}
              loading="eager"
              fetchPriority="high"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjwvc3ZnPg=="
            />
          </div>
        </div>
      )}
    </div>
  );
};
