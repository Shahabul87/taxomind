"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  Users,
  Star,
  Trophy
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickStatsBarProps {
  totalCourses: number;
  newCoursesThisWeek: number;
  activeLearners: number;
  averageRating: number;
  completionRate: number;
}

export function QuickStatsBar({
  totalCourses,
  newCoursesThisWeek,
  activeLearners,
  averageRating,
  completionRate
}: QuickStatsBarProps) {
  const stats = [
    {
      label: "Total Courses",
      value: totalCourses.toLocaleString(),
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      label: "New This Week",
      value: `+${newCoursesThisWeek}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      label: "Active Learners",
      value: activeLearners.toLocaleString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
    {
      label: "Average Rating",
      value: averageRating.toFixed(1),
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      suffix: "★"
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: Trophy,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                      <Icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">
                        {stat.value}
                        {stat.suffix && <span className={stat.color}>{stat.suffix}</span>}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}