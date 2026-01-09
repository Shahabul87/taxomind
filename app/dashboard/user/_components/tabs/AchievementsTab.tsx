"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { Award, Trophy, Sparkles } from "lucide-react";
import { GamificationEngine } from "../smart-dashboard/GamificationEngine";

interface AchievementsTabProps {
  user: User;
}

export function AchievementsTab({ user }: AchievementsTabProps) {
  return (
    <div className="w-full min-h-full bg-slate-50/50 dark:bg-slate-950/50">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 sm:px-6 pt-6 pb-4"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-rose-900/30 shadow-sm">
            <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Achievements &amp; Rewards
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Track your progress and unlock new badges
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-4 sm:px-6 pb-8"
      >
        <GamificationEngine user={user} />
      </motion.div>
    </div>
  );
}
