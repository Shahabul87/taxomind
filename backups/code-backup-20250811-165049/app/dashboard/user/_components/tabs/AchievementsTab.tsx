"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { Award } from "lucide-react";
import { DashboardCard } from '@/components/ui/dashboard-card';
import { GamificationEngine } from '../smart-dashboard/GamificationEngine';

interface AchievementsTabProps {
  user: User;
}

export function AchievementsTab({ user }: AchievementsTabProps) {
  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Gamification Engine - Full Width within Sidebar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <DashboardCard 
          title="Achievements & Badges" 
          icon={<Award className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
        >
          <GamificationEngine user={user} />
        </DashboardCard>
      </motion.div>
    </div>
  );
}