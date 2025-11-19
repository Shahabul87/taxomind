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
      className="grid gap-4 md:grid-cols-3"
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
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <status.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{status.value}</span>
            </div>
            <h3 className="text-sm font-medium text-white/90 mb-1">{status.title}</h3>
            <p className="text-xs text-white/70">{status.status}</p>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
