/**
 * Image Optimization System with Next.js Image
 * Phase 3.2: Advanced image loading and optimization strategies
 * Part of Enterprise Code Quality Plan Phase 3
 */

import Image from 'next/image';
import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Image configuration types
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
}

interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

interface AvatarImageProps extends Omit<OptimizedImageProps, 'fill' | 'sizes'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'circle' | 'square' | 'rounded';
  showFallback?: boolean;
}

interface LazyImageProps extends OptimizedImageProps {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

// Image size presets
const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
} as const;

// Avatar size mappings
const AVATAR_SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

// Aspect ratio mappings
const ASPECT_RATIOS = {
  square: 1,
  video: 16 / 9,
  portrait: 3 / 4,
  landscape: 4 / 3,
} as const;

/**
 * Generate blur placeholder for better loading experience
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

/**
 * Generate responsive image sizes string
 */
export function generateSizes(breakpoints?: ResponsiveImageProps['breakpoints']): string {
  if (!breakpoints) {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }

  const sizes = [];
  
  if (breakpoints.sm) sizes.push(`(max-width: 640px) ${breakpoints.sm}px`);
  if (breakpoints.md) sizes.push(`(max-width: 768px) ${breakpoints.md}px`);
  if (breakpoints.lg) sizes.push(`(max-width: 1024px) ${breakpoints.lg}px`);
  if (breakpoints.xl) sizes.push(`(max-width: 1280px) ${breakpoints.xl}px`);
  
  // Default fallback
  sizes.push('100vw');
  
  return sizes.join(', ');
}

/**
 * Optimized Image component with error handling and fallbacks
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  className,
  style,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  loading = 'lazy',
  ...props
}, ref) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Memoize blur data URL
  const memoizedBlurDataURL = useMemo(() => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === 'blur' && width && height) {
      return generateBlurDataURL(Math.min(width, 10), Math.min(height, 10));
    }
    return undefined;
  }, [blurDataURL, placeholder, width, height]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
    onError?.();
  }, [imgSrc, fallbackSrc, onError]);

  const imageProps = {
    src: imgSrc,
    alt,
    quality,
    priority,
    loading,
    onLoad: handleLoad,
    onError: handleError,
    className: cn('transition-opacity duration-300',
      isLoading && 'opacity-50',
      hasError && 'opacity-75',
      className
    ),
    style,
    ...props,
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={memoizedBlurDataURL}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      sizes={sizes}
      placeholder={placeholder}
      blurDataURL={memoizedBlurDataURL}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Responsive Image component that adapts to container size
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  aspectRatio = 'video',
  breakpoints,
  className,
  ...props
}) => {
  const ratio = typeof aspectRatio === 'number' ? aspectRatio : ASPECT_RATIOS[aspectRatio];
  const paddingTop = `${(1 / ratio) * 100}%`;
  const sizes = generateSizes(breakpoints);

  return (
    <div 
      className={cn('relative w-full overflow-hidden', className)}
      style={{ paddingTop }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="absolute inset-0 object-cover"
        {...props}
      />
    </div>
  );
};

/**
 * Avatar Image component with predefined sizes and shapes
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  alt,
  size = 'md',
  shape = 'circle',
  showFallback = true,
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dimensions = typeof size === 'number' ? size : AVATAR_SIZES[size];
  
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (hasError && showFallback) {
    return (
      <div
        className={cn('bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold',
          shapeClasses[shape],
          className
        )}
        style={{ width: dimensions, height: dimensions }}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', shapeClasses[shape], className)}
      style={{ width: dimensions, height: dimensions }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={dimensions}
        height={dimensions}
        className={cn('object-cover transition-opacity duration-300',
          isLoading && 'opacity-0')}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </div>
  );
};

/**
 * Lazy Image with Intersection Observer
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [imgRef, setImgRef] = useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!imgRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(imgRef);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef);

    return () => {
      observer.unobserve(imgRef);
    };
  }, [imgRef, threshold, rootMargin, triggerOnce]);

  return (
    <div ref={setImgRef}>
      {isVisible ? (
        <OptimizedImage src={src} alt={alt} {...props} />
      ) : (
        <div 
          className={cn('bg-gray-200 animate-pulse', props.className)}
          style={{ 
            width: props.width, 
            height: props.height,
            aspectRatio: props.fill ? undefined : 'auto'
          }}
        />
      )}
    </div>
  );
};

/**
 * Image Gallery with optimized loading
 */
interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  columns?: number;
  spacing?: number;
  onImageClick?: (index: number) => void;
  loading?: 'lazy' | 'eager';
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  spacing = 4,
  onImageClick,
  loading = 'lazy',
}) => {
  const handleImageClick = useCallback((index: number) => {
    onImageClick?.(index);
  }, [onImageClick]);

  return (
    <div 
      className="grid gap-4"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${spacing * 0.25}rem`
      }}
    >
      {images.map((image, index) => (
        <div
          key={index}
          className="group cursor-pointer"
          onClick={() => handleImageClick(index)}
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            aspectRatio="square"
            className="group-hover:scale-105 transition-transform duration-300"
            loading={loading}
            priority={index < 6} // Prioritize first 6 images
          />
          {image.caption && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              {image.caption}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Hero Image component for large banner images
 */
interface HeroImageProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

export const HeroImage: React.FC<HeroImageProps> = ({
  src,
  alt,
  overlay = false,
  overlayColor = 'black',
  overlayOpacity = 0.4,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh]', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover"
        {...props}
      />
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
          }}
        />
      )}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Utility functions for image optimization
 */
export const imageUtils = {
  // Generate srcSet for responsive images
  generateSrcSet: (baseSrc: string, sizes: number[]): string => {
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ');
  },

  // Get optimal image size based on container
  getOptimalSize: (containerWidth: number, devicePixelRatio: number = 1): number => {
    const targetWidth = containerWidth * devicePixelRatio;
    const sizes = [150, 300, 600, 1200, 1920];
    return sizes.find(size => size >= targetWidth) || sizes[sizes.length - 1];
  },

  // Check if image format is supported
  supportsWebP: (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('webp') > -1;
  },

  supportsAVIF: (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('avif') > -1;
  },

  // Preload critical images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Batch preload multiple images
  preloadImages: async (sources: string[]): Promise<void> => {
    await Promise.all(sources.map(src => imageUtils.preloadImage(src)));
  },
};

// Performance monitoring for images
export class ImagePerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static trackImageLoad(src: string, loadTime: number): void {
    this.metrics.set(src, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Image Performance] ${src} loaded in ${loadTime}ms`);
    }
  }

  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  static getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values());
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

export type { 
  OptimizedImageProps, 
  ResponsiveImageProps, 
  AvatarImageProps, 
  LazyImageProps,
  ImageGalleryProps,
  HeroImageProps
};