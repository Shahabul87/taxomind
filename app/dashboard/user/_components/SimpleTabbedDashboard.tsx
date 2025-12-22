"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "next-auth";
import { LayoutDashboard, BookOpen, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

// Tab Loading Skeleton
const TabLoadingSkeleton = () => (
  <div className="p-6 space-y-4 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
  </div>
);

// Lazy-loaded tab components
const OverviewTab = dynamic(
  () => import('./tabs/OverviewTab').then(mod => ({ default: mod.OverviewTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const LearningTab = dynamic(
  () => import('./tabs/LearningTab').then(mod => ({ default: mod.LearningTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const AchievementsTab = dynamic(
  () => import('./tabs/AchievementsTab').then(mod => ({ default: mod.AchievementsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

interface SimpleTabbedDashboardProps {
  user: User;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview', 
    icon: LayoutDashboard,
    description: 'Daily progress & AI insights'
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: BookOpen, 
    description: 'Courses & learning path'
  },
  {
    id: 'achievements',
    label: 'Achievements', 
    icon: Award,
    description: 'Badges & progress'
  }
];

export function SimpleTabbedDashboard({ user }: SimpleTabbedDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} />;
      case 'learning':
        return <LearningTab user={user} />;
      case 'achievements':
        return <AchievementsTab user={user} />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20">
        
        {/* Floating orbs */}
        <motion.div 
          animate={{ 
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"
        />
        <motion.div 
          animate={{ 
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-[30%] -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header with Tab Navigation - Full Width within Sidebar Layout */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 sm:mb-4 gap-3 lg:gap-0">
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                  Welcome back, {user.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base">
                  Your AI-powered learning dashboard
                </p>
              </div>

              {/* Quick Stats - Responsive Layout */}
              <div className="flex items-center justify-center lg:justify-end gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                  <div className="text-xs sm:text-sm text-slate-500">Day Streak</div>
                </div>
                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">87%</div>
                  <div className="text-xs sm:text-sm text-slate-500">Complete</div>
                </div>
                <div className="text-center px-2 sm:px-3">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">94</div>
                  <div className="text-xs sm:text-sm text-slate-500">AI Score</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Full Width Responsive */}
            <div className="w-full overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-full">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 flex-1 min-w-0",
                        "hover:bg-white/50 dark:hover:bg-slate-800/50",
                        activeTab === tab.id
                          ? "bg-white dark:bg-slate-800 shadow-lg text-purple-600 dark:text-purple-400"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium text-xs sm:text-sm md:text-base truncate">{tab.label}</div>
                        <div className="text-xs opacity-70 hidden sm:block truncate">{tab.description}</div>
                      </div>
                      
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 bg-purple-500 rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content - Full Width within Sidebar Layout */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                type: "spring",
                damping: 30,
                stiffness: 300,
                duration: 0.3
              }}
              className="min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-160px)] md:min-h-[calc(100vh-180px)] lg:min-h-[calc(100vh-200px)] w-full"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating AI Tutor */}
      </div>
    </div>
  );
}