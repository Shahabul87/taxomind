"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, BookOpen, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createRichSanitizedMarkup } from '@/lib/utils/sanitize-html';

interface ExplanationTooltipProps {
  explanation: string;
  title: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const ExplanationTooltip = ({
  explanation,
  title,
  position,
  onClose
}: ExplanationTooltipProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'base' | 'lg' | 'xl'>('sm');
  const [size, setSize] = useState({ width: 384, height: 400 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle Esc key to close tooltip
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Font size controls
  const increaseFontSize = () => {
    const sizes: Array<'xs' | 'sm' | 'base' | 'lg' | 'xl'> = ['xs', 'sm', 'base', 'lg', 'xl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      setFontSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: Array<'xs' | 'sm' | 'base' | 'lg' | 'xl'> = ['xs', 'sm', 'base', 'lg', 'xl'];
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      setFontSize(sizes[currentIndex - 1]);
    }
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;

      setSize({
        width: Math.max(300, resizeRef.current.startWidth + deltaX),
        height: Math.max(200, resizeRef.current.startHeight + deltaY),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Get prose class based on font size
  const getProseClass = () => {
    const baseClasses = "prose dark:prose-invert max-w-none prose-headings:text-blue-900 dark:prose-headings:text-blue-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ol:text-gray-700 dark:prose-ol:text-gray-300 prose-li:marker:text-blue-500 dark:prose-li:marker:text-blue-400 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-pink-50 dark:prose-code:bg-pink-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded";

    const sizeClass = {
      xs: 'prose-xs',
      sm: 'prose-sm',
      base: 'prose-base',
      lg: 'prose-lg',
      xl: 'prose-xl'
    }[fontSize];

    return `${baseClasses} ${sizeClass}`;
  };

  // Mobile bottom sheet animation - draggable version
  if (isMobile) {
    return (
      <motion.div
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          // Close if dragged down more than 100px
          if (info.offset.y > 100) {
            onClose();
          }
        }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh]"
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t-2 border-blue-500/30 overflow-hidden">
          {/* Header - Drag handle */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 mb-1 cursor-grab active:cursor-grabbing" />
            <div className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <h4 className="font-semibold text-sm truncate">{title}</h4>
              </div>

              {/* Font size controls */}
              <div className="flex items-center gap-1 mr-2" onPointerDown={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decreaseFontSize}
                  disabled={fontSize === 'xs'}
                  className="h-6 w-6 p-0 hover:bg-white/20 text-white disabled:opacity-30"
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs font-medium px-1">{fontSize.toUpperCase()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={increaseFontSize}
                  disabled={fontSize === 'xl'}
                  className="h-6 w-6 p-0 hover:bg-white/20 text-white disabled:opacity-30"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea
            className="max-h-[calc(60vh-8rem)] p-4 bg-white dark:bg-gray-900"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              className={getProseClass()}
              dangerouslySetInnerHTML={createRichSanitizedMarkup(explanation)}
            />
          </ScrollArea>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              💡 Swipe down or press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop tooltip animation - draggable and resizable version
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        minWidth: '300px',
        maxWidth: '90vw',
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-blue-500/30 overflow-hidden relative">
        {/* Header - Drag handle with controls */}
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-grab active:cursor-grabbing">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="h-4 w-4 flex-shrink-0" />
            <h4 className="font-semibold text-sm truncate">{title}</h4>
          </div>

          {/* Font size controls */}
          <div className="flex items-center gap-1 mr-2" onPointerDown={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              disabled={fontSize === 'xs'}
              className="h-6 w-6 p-0 hover:bg-white/20 text-white cursor-pointer disabled:opacity-30"
              title="Decrease font size"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs font-medium px-1">{fontSize.toUpperCase()}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              disabled={fontSize === 'xl'}
              className="h-6 w-6 p-0 hover:bg-white/20 text-white cursor-pointer disabled:opacity-30"
              title="Increase font size"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-6 w-6 p-0 hover:bg-white/20 text-white cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea
          className="p-4 cursor-auto bg-white dark:bg-gray-900"
          style={{ height: `${size.height}px`, maxHeight: '80vh' }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className={getProseClass()}
            dangerouslySetInnerHTML={createRichSanitizedMarkup(explanation)}
          />
        </ScrollArea>

        {/* Footer with resize hint */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Drag to move • Resize from corner • Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close
          </p>
        </div>

        {/* Resize handle - bottom right corner */}
        <div
          onMouseDown={handleResizeStart}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize group"
          title="Drag to resize"
        >
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-blue-500 group-hover:border-blue-600 transition-colors" />
          <Maximize2 className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};
