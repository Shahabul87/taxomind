"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorBubbleProps {
  message: string;
  id?: string;
}

export const ErrorBubble = ({ message, id }: ErrorBubbleProps) => {
  if (!message) return null;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 -bottom-16 z-10"
    >
      <div className="relative">
        {/* Arrow pointing up */}
        <div className="absolute -top-2 left-4 w-3 h-3 bg-red-50 dark:bg-red-900/20 border-l-2 border-t-2 border-red-200 dark:border-red-800 transform rotate-45" />

        {/* Error bubble */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 shadow-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              {message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
