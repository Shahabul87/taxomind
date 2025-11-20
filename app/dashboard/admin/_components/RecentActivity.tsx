"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, CheckCircle, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ActivityItem } from "@/app/api/admin/dashboard/activity/route";

interface RecentActivityProps {
  activities: ActivityItem[];
}

const activityIcons = {
  user: Users,
  course: CheckCircle,
  report: FileText,
  system: Settings,
};

const activityColors = {
  user: "from-blue-500 to-indigo-500",
  course: "from-emerald-500 to-teal-500",
  report: "from-yellow-500 to-amber-500",
  system: "from-purple-500 to-pink-500",
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-semibold">Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="space-y-2.5 sm:space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                No recent activity
              </p>
            ) : (
              activities.map((activity, idx) => {
                const Icon = activityIcons[activity.type];
                const colorGradient = activityColors[activity.type];

                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer touch-manipulation"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <div className={cn(
                      "p-1.5 sm:p-2 rounded-lg bg-gradient-to-r shrink-0",
                      colorGradient
                    )}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-1 mt-0.5">
                        {activity.subtitle}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
