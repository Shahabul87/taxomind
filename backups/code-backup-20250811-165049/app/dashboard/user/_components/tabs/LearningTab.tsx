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
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
      {/* Smart Learning Hub - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <DashboardCard 
          title="Learning Hub" 
          icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
        >
          <SmartLearningHub user={user} />
        </DashboardCard>
      </motion.div>
    </div>
  );
}