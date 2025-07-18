"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "next-auth";

// Import the original sidebar for now
import { HomeSidebar } from "@/components/ui/home-sidebar";

// Import existing smart dashboard components

// Import new tab components
import { OverviewTab } from './tabs/OverviewTab';
import { LearningTab } from './tabs/LearningTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { AchievementsTab } from './tabs/AchievementsTab';

interface TabbedDashboardProps {
  user: User;
}

export function TabbedDashboard({ user }: TabbedDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} />;
      case 'learning':
        return <LearningTab user={user} />;
      case 'analytics':
        return <AnalyticsTab user={user} />;
      case 'achievements':
        return <AchievementsTab user={user} />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20">
      {/* Temporary simple sidebar */}
      <div className="w-80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dashboard</h3>
          <div className="space-y-2">
            {['overview', 'learning', 'analytics', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.3))]" />
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

        {/* Tab Content Container */}
        <div className="relative z-10 h-full overflow-y-auto">
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
              className="h-full"
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