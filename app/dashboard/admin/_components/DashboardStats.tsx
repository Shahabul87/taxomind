"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Users, BookOpen, Activity, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardStatsProps {
  totalUsers: number;
  totalCourses: number;
  activeSessions: number;
  pendingReports: number;
  userGrowth: number;
  newCoursesThisMonth: number;
  activeSessionsToday: number;
  newReportsToday: number;
}

export function DashboardStats({
  totalUsers,
  totalCourses,
  activeSessions,
  pendingReports,
  userGrowth,
  newCoursesThisMonth,
  activeSessionsToday,
  newReportsToday,
}: DashboardStatsProps) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      change: userGrowth > 0 ? `+${userGrowth}%` : `${userGrowth}%`,
      trend: userGrowth >= 0 ? "up" : "down",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-400/20 to-blue-700/20"
    },
    {
      title: "Total Courses",
      value: totalCourses.toLocaleString(),
      change: newCoursesThisMonth > 0 ? `+${newCoursesThisMonth} new` : "No new courses",
      trend: newCoursesThisMonth > 0 ? "up" : "neutral",
      icon: BookOpen,
      gradient: "from-emerald-500 to-emerald-600",
      hoverGradient: "from-emerald-400/20 to-emerald-700/20"
    },
    {
      title: "Active Sessions",
      value: activeSessions.toLocaleString(),
      change: activeSessionsToday > 0 ? `+${activeSessionsToday} today` : "No new sessions",
      trend: activeSessionsToday > 0 ? "up" : "neutral",
      icon: Activity,
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-400/20 to-purple-700/20"
    },
    {
      title: "Pending Reports",
      value: pendingReports.toLocaleString(),
      change: newReportsToday > 0 ? `+${newReportsToday} new` : "No new reports",
      trend: "neutral",
      icon: FileText,
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "from-orange-400/20 to-red-700/20"
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          variants={fadeInUp}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className={cn(
            "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
            `bg-gradient-to-br ${stat.gradient}`
          )}>
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              stat.hoverGradient
            )} />
            <div className="relative p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-white/90">{stat.title}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-white/80">
                {stat.trend === "up" && <TrendingUp className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
