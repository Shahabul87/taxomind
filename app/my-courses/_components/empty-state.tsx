import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
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
      className="flex flex-col items-center justify-center text-center py-20"
    >
      {/* Icon Container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-xl"></div>
        <div className="relative p-6 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
        {title}
      </h3>

      <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      <Link href={actionLink}>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
        >
          {actionText}
        </motion.button>
      </Link>
    </motion.div>
  );
};
