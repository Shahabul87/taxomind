"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Mobile bottom sheet animation
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh]"
      >
        <div className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t-2 border-blue-500/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <h4 className="font-semibold text-sm truncate">{title}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[calc(60vh-8rem)] p-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: explanation }}
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

  // Desktop tooltip animation
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed z-50 w-96 max-w-sm"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-blue-500/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <h4 className="font-semibold text-sm truncate">{title}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-white/20 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-96 p-4">
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: explanation }}
          />
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Move your mouse away or press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to close
          </p>
        </div>
      </div>
    </motion.div>
  );
};
