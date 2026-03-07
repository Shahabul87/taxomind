import Link from 'next/link';
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
      className="flex flex-col items-center justify-center text-center py-12 sm:py-16 md:py-20 px-4"
    >
      {/* Icon Container */}
      <div className="relative mb-4 sm:mb-5 md:mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-xl"></div>
        <div className="relative p-4 sm:p-5 md:p-6 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <div className="text-slate-400 dark:text-slate-500 scale-75 sm:scale-90 md:scale-100">{icon}</div>
        </div>
      </div>

      {/* Text Content */}
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 tracking-tight px-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 sm:mb-7 md:mb-8 max-w-md leading-relaxed px-2">
        {description}
      </p>

      {/* Action Button */}
      <Link href={actionLink}>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all h-10 sm:h-11"
        >
          {actionText}
        </motion.button>
      </Link>
    </motion.div>
  );
};
