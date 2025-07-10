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
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Gamification Engine */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCard 
          title="Achievements & Badges" 
          icon={<Award className="w-5 h-5 text-orange-600" />}
        >
          <GamificationEngine user={user} />
        </DashboardCard>
      </motion.div>
    </div>
  );
}