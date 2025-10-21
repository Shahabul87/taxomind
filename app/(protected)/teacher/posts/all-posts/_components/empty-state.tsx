import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  actionLink: string;
  actionText: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  actionLink,
  actionText,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-16"
    >
      <div className="p-5 rounded-full bg-gray-800/50 border border-gray-700/50 mb-6">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-400 mb-8 max-w-md">
        {description}
      </p>
      
      <Link href={actionLink}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg"
        >
          {actionText}
        </motion.button>
      </Link>
    </motion.div>
  );
}; 