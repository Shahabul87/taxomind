import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PostStatsProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change: string;
  positive: boolean;
  color: "emerald" | "teal" | "cyan" | "pink" | "amber";
}

export const PostStats = ({
  title,
  value,
  icon,
  change,
  positive,
  color,
}: PostStatsProps) => {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-900/20",
      border: "border-emerald-800/30",
      textAccent: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
      iconBorder: "border-emerald-500/30",
    },
    teal: {
      bg: "bg-teal-900/20",
      border: "border-teal-800/30",
      textAccent: "text-teal-400",
      iconBg: "bg-teal-500/20",
      iconBorder: "border-teal-500/30",
    },
    cyan: {
      bg: "bg-cyan-900/20",
      border: "border-cyan-800/30",
      textAccent: "text-cyan-400",
      iconBg: "bg-cyan-500/20",
      iconBorder: "border-cyan-500/30",
    },
    pink: {
      bg: "bg-pink-900/20",
      border: "border-pink-800/30",
      textAccent: "text-pink-400",
      iconBg: "bg-pink-500/20",
      iconBorder: "border-pink-500/30",
    },
    amber: {
      bg: "bg-amber-900/20",
      border: "border-amber-800/30",
      textAccent: "text-amber-400",
      iconBg: "bg-amber-500/20",
      iconBorder: "border-amber-500/30",
    },
  };

  const styles = colorMap[color];

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
        <h4 className="text-sm text-gray-400 font-medium">
          {title}
        </h4>
        <div className={`text-2xl font-bold mt-1 ${styles.textAccent}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}; 