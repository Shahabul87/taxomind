"use client";

import { useState, useEffect, useCallback } from "react";
import { HeroCard, HeroCardProps } from "./HeroCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSlide extends Omit<HeroCardProps, "className"> {
  id: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number;
  className?: string;
}

export function HeroCarousel({
  slides,
  autoPlayInterval = 5000,
  className,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, nextSlide, slides.length]);

  // Prefers-reduced-motion support
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsAutoPlaying(false);
    }
  }, []);

  if (slides.length === 0) {
    return null;
  }

  const handlePrevClick = () => {
    setIsAutoPlaying(false);
    prevSlide();
  };

  const handleNextClick = () => {
    setIsAutoPlaying(false);
    nextSlide();
  };

  return (
    <div
      className={cn("relative w-full", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured courses"
    >
      {/* Main Carousel Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Display current slide and next slide (on desktop) */}
        <div className="w-full">
          <HeroCard {...slides[currentIndex]} />
        </div>

        {/* Show second card on desktop */}
        <div className="hidden lg:block w-full">
          <HeroCard {...slides[(currentIndex + 1) % slides.length]} />
        </div>
      </div>

      {/* Navigation Arrows - Only show if more than 1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrevClick}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/95 dark:bg-slate-800/95 text-gray-800 dark:text-white shadow-xl hover:shadow-2xl hover:scale-110 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Previous slide"
            type="button"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" strokeWidth={2.5} />
          </button>

          <button
            onClick={handleNextClick}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/95 dark:bg-slate-800/95 text-gray-800 dark:text-white shadow-xl hover:shadow-2xl hover:scale-110 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Next slide"
            type="button"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dots Indicator - Only show if more than 1 slide */}
      {slides.length > 1 && (
        <div
          className="flex justify-center gap-3 mt-8"
          role="tablist"
          aria-label="Slide navigation"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-md",
                index === currentIndex
                  ? "w-10 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 shadow-lg scale-110"
                  : "w-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 hover:scale-110"
              )}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
              role="tab"
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
