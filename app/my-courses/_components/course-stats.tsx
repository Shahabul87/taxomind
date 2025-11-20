import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface CourseStatsProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change: string;
  positive: boolean;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'orange' | 'indigo';
}

export const CourseStats = ({ title, value, icon, change, positive, color }: CourseStatsProps) => {
  // Analytics page gradient card style
  const colorMap = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-400/20 to-blue-700/20',
      iconBg: 'bg-white/20',
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-400/20 to-emerald-700/20',
      iconBg: 'bg-white/20',
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-400/20 to-purple-700/20',
      iconBg: 'bg-white/20',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      hoverGradient: 'from-amber-400/20 to-orange-700/20',
      iconBg: 'bg-white/20',
    },
    orange: {
      gradient: 'from-orange-500 to-red-500',
      hoverGradient: 'from-orange-400/20 to-red-700/20',
      iconBg: 'bg-white/20',
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      hoverGradient: 'from-indigo-400/20 to-indigo-700/20',
      iconBg: 'bg-white/20',
    },
  };

  const styles = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`group relative overflow-hidden bg-gradient-to-br ${styles.gradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-lg`}
    >
      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${styles.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      {/* Content */}
      <div className="relative p-2.5 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className={`p-1.5 sm:p-2 ${styles.iconBg} rounded-lg flex-shrink-0`}>{icon}</div>
          <span className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 truncate">{title}</span>
        </div>

        <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">{value}</div>

        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-white/80">
          {positive ? <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <ArrowDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          <span className="truncate">{change}</span>
        </div>
      </div>
    </motion.div>
  );
};
