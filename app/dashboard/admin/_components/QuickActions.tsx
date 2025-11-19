"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Users, BookOpen, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Add User",
      icon: Users,
      gradient: "from-blue-500 to-indigo-500",
      onClick: () => router.push("/dashboard/admin/users"),
    },
    {
      label: "Create Course",
      icon: BookOpen,
      gradient: "from-emerald-500 to-teal-500",
      onClick: () => router.push("/dashboard/admin/courses"),
    },
    {
      label: "View Reports",
      icon: FileText,
      gradient: "from-orange-500 to-red-500",
      onClick: () => router.push("/dashboard/admin/reports"),
    },
    {
      label: "Settings",
      icon: Settings,
      gradient: "from-purple-500 to-pink-500",
      onClick: () => router.push("/dashboard/admin/settings"),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
              >
                <Button
                  onClick={action.onClick}
                  variant="outline"
                  className="h-24 w-full flex-col gap-3 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-300 group"
                >
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-r transition-transform duration-300 group-hover:scale-110",
                    action.gradient
                  )}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {action.label}
                  </span>
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
