"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  content: string | null;
  imageUrl: string | null;
  position: number;
}

interface VirtualChapterListProps {
  chapters: Chapter[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  renderChapter: (chapter: Chapter, index: number) => React.ReactNode;
  onChapterView?: (chapterId: string, index: number) => void;
}

/**
 * Virtual Scrolling Component for Long Chapter Lists
 * Only renders visible chapters + overscan for optimal performance
 */
export function VirtualChapterList({
  chapters,
  itemHeight = 600,
  containerHeight = 800,
  overscan = 2,
  renderChapter,
  onChapterView,
}: VirtualChapterListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerClientHeight, setContainerClientHeight] = useState(containerHeight);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    chapters.length - 1,
    Math.ceil((scrollTop + containerClientHeight) / itemHeight) + overscan
  );

  const visibleChapters = chapters.slice(startIndex, endIndex + 1);

  // Total height of all chapters
  const totalHeight = chapters.length * itemHeight;

  // Offset for the first visible chapter
  const offsetY = startIndex * itemHeight;

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);
    }
  }, []);

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerClientHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Track visible chapters for analytics
  useEffect(() => {
    if (onChapterView && visibleChapters.length > 0) {
      // Track the first visible chapter
      const firstVisibleChapter = visibleChapters[0];
      const firstVisibleIndex = startIndex;
      onChapterView(firstVisibleChapter.id, firstVisibleIndex);
    }
  }, [startIndex, visibleChapters, onChapterView]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-y-auto",
        "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700",
        "scrollbar-track-transparent"
      )}
      style={{
        height: `${containerClientHeight}px`,
        maxHeight: "100vh",
      }}
    >
      {/* Total height spacer */}
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        {/* Visible chapters container */}
        <div
          style={{
            position: "absolute",
            top: `${offsetY}px`,
            left: 0,
            right: 0,
          }}
        >
          {visibleChapters.map((chapter, localIndex) => {
            const globalIndex = startIndex + localIndex;
            return (
              <div
                key={chapter.id}
                id={`chapter-${chapter.id}`}
                data-chapter-index={globalIndex}
                style={{
                  minHeight: `${itemHeight}px`,
                }}
              >
                {renderChapter(chapter, globalIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to use virtual scrolling with dynamic heights
 */
export function useVirtualScroll({
  itemCount,
  estimatedItemHeight = 600,
  containerHeight = 800,
  overscan = 2,
}: {
  itemCount: number;
  estimatedItemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [heights, setHeights] = useState<Map<number, number>>(new Map());

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / estimatedItemHeight) - overscan
  );
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / estimatedItemHeight) + overscan
  );

  const setItemHeight = useCallback((index: number, height: number) => {
    setHeights((prev) => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  }, []);

  const getItemHeight = useCallback(
    (index: number) => {
      return heights.get(index) || estimatedItemHeight;
    },
    [heights, estimatedItemHeight]
  );

  const totalHeight = Array.from({ length: itemCount }, (_, i) =>
    getItemHeight(i)
  ).reduce((acc, height) => acc + height, 0);

  const offsetY = Array.from({ length: startIndex }, (_, i) =>
    getItemHeight(i)
  ).reduce((acc, height) => acc + height, 0);

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollTop,
    setScrollTop,
    setItemHeight,
    getItemHeight,
  };
}
