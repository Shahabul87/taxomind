import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";

interface CourseStatsProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change: string;
  positive: boolean;
  color: "blue" | "green" | "purple" | "amber" | "orange" | "indigo";
}

export const CourseStats = ({
  title,
  value,
  icon,
  change,
  positive,
  color,
}: CourseStatsProps) => {
  const colorMap = {
    blue: {
      bg: "bg-blue-900/20 dark:bg-blue-900/20",
      border: "border-blue-800/30 dark:border-blue-800/30",
      textAccent: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/20 dark:bg-blue-500/20",
      iconBorder: "border-blue-500/30 dark:border-blue-500/30",
    },
    green: {
      bg: "bg-green-900/20 dark:bg-green-900/20",
      border: "border-green-800/30 dark:border-green-800/30",
      textAccent: "text-green-600 dark:text-green-400",
      iconBg: "bg-green-500/20 dark:bg-green-500/20",
      iconBorder: "border-green-500/30 dark:border-green-500/30",
    },
    purple: {
      bg: "bg-purple-900/20 dark:bg-purple-900/20",
      border: "border-purple-800/30 dark:border-purple-800/30",
      textAccent: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/20 dark:bg-purple-500/20",
      iconBorder: "border-purple-500/30 dark:border-purple-500/30",
    },
    amber: {
      bg: "bg-amber-900/20 dark:bg-amber-900/20",
      border: "border-amber-800/30 dark:border-amber-800/30",
      textAccent: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/20 dark:bg-amber-500/20",
      iconBorder: "border-amber-500/30 dark:border-amber-500/30",
    },
    orange: {
      bg: "bg-orange-900/20 dark:bg-orange-900/20",
      border: "border-orange-800/30 dark:border-orange-800/30",
      textAccent: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-500/20 dark:bg-orange-500/20",
      iconBorder: "border-orange-500/30 dark:border-orange-500/30",
    },
    indigo: {
      bg: "bg-indigo-900/20 dark:bg-indigo-900/20",
      border: "border-indigo-800/30 dark:border-indigo-800/30",
      textAccent: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-500/20 dark:bg-indigo-500/20",
      iconBorder: "border-indigo-500/30 dark:border-indigo-500/30",
    },
  };

  const styles = colorMap[color] || colorMap.blue; // Fallback to blue if color not found

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={`p-6 rounded-xl ${styles.bg} ${styles.border} border backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${styles.iconBg} ${styles.iconBorder} border`}>
          {icon}
        </div>
        
        <div className="flex items-center space-x-1">
          {positive ? (
            <ArrowUp className="h-3 w-3 text-green-400" />
          ) : (
            <ArrowDown className="h-3 w-3 text-red-400" />
          )}
          <span className={`text-xs font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {change}
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </h4>
        <div className={`text-2xl font-bold mt-1 ${styles.textAccent}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}; 