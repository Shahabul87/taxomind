"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
}

/**
 * Progressive Image Component with LQIP (Low Quality Image Placeholder)
 * Implements blur-up effect for better perceived performance
 */
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  sizes,
  quality = 75,
  onLoad,
}: ProgressiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string>(src);

  // Generate LQIP (Low Quality Image Placeholder) URL
  // For Next.js Image Optimization, we use a smaller quality
  const lqipSrc = src.includes("?")
    ? `${src}&q=10&blur=10`
    : `${src}?q=10&blur=10`;

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
  }, [src]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoad?.();
  };

  if (fill) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        {/* LQIP Placeholder */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            isLoading ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={lqipSrc}
            alt={alt}
            fill
            className="blur-lg scale-110"
            priority={priority}
            quality={10}
            sizes={sizes}
          />
        </div>

        {/* Full Quality Image */}
        <Image
          src={imageSrc}
          alt={alt}
          fill
          className={cn(
            "transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          priority={priority}
          quality={quality}
          sizes={sizes}
          onLoad={handleLoadingComplete}
        />

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* LQIP Placeholder */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isLoading ? "opacity-100" : "opacity-0"
        )}
        style={{ width, height }}
      >
        <Image
          src={lqipSrc}
          alt={alt}
          width={width}
          height={height}
          className="blur-lg scale-110"
          priority={priority}
          quality={10}
        />
      </div>

      {/* Full Quality Image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoadingComplete}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Image with automatic WebP detection and srcset
 */
interface ResponsiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 16 / 9,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
    >
      {/* Skeleton loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority={priority}
        sizes={sizes}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(src: string) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new window.Image();

    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = src;
  }, [src]);

  return { imgSrc, isLoading };
}
