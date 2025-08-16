"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionText: string;
  actionLink: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  actionLink,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center p-10 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm"
    >
      <div className="p-5 mb-6 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-700/30">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        {description}
      </p>
      
      <Link href={actionLink}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md hover:shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/20"
        >
          {actionText}
        </motion.button>
      </Link>
    </motion.div>
  );
}; 