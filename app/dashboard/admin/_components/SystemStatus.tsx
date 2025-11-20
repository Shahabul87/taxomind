"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, BarChart3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SystemStatusProps {
  activeSessions: number;
  pendingReports: number;
}

export function SystemStatus({ activeSessions, pendingReports }: SystemStatusProps) {
  const statuses = [
    {
      title: "System Health",
      value: "Excellent",
      status: "All systems operational",
      icon: Shield,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      title: "Server Load",
      value: activeSessions > 100 ? "High" : activeSessions > 50 ? "Normal" : "Low",
      status: activeSessions > 100 ? "Monitor performance" : "Normal performance",
      icon: BarChart3,
      gradient: "from-blue-500 to-indigo-500"
    },
    {
      title: "Active Alerts",
      value: pendingReports.toString(),
      status: pendingReports > 10 ? "Requires attention" : "Under control",
      icon: AlertCircle,
      gradient: pendingReports > 10 ? "from-orange-500 to-red-500" : "from-blue-500 to-indigo-500"
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      {statuses.map((status, idx) => (
        <Card
          key={idx}
          className={cn(
            "relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300",
            `bg-gradient-to-br ${status.gradient}`
          )}
        >
          <CardContent className="p-3.5 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0">
                <status.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate ml-2">{status.value}</span>
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-white/90 mb-1 truncate">{status.title}</h3>
            <p className="text-[10px] sm:text-xs text-white/70 line-clamp-2">{status.status}</p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
