"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <AnimatePresence>
        {showImage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative w-full rounded-lg sm:rounded-xl overflow-hidden border border-gray-700/50"
          >
            <div className="relative w-full h-48 sm:h-64 md:h-80 lg:h-96">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
                priority
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
