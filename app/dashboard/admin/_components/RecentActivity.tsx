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
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                No recent activity
              </p>
            ) : (
              activities.map((activity, idx) => {
                const Icon = activityIcons[activity.type];
                const colorGradient = activityColors[activity.type];

                return (
                  <motion.div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200 cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-r",
                      colorGradient
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {activity.subtitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
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
