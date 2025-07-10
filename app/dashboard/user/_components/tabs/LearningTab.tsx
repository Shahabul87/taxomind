"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { BookOpen } from "lucide-react";
import { DashboardCard } from '@/components/ui/dashboard-card';
import { SmartLearningHub } from '../smart-dashboard/SmartLearningHub';

interface LearningTabProps {
  user: User;
}

export function LearningTab({ user }: LearningTabProps) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Smart Learning Hub */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardCard 
          title="Learning Hub" 
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
        >
          <SmartLearningHub user={user} />
        </DashboardCard>
      </motion.div>
    </div>
  );
}