"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "next-auth";
import { 
  LayoutDashboard, BookOpen, BarChart3, Award,
  Brain, Target, Clock, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Import tab components  
import { OverviewTab } from './tabs/OverviewTab';
import { LearningTab } from './tabs/LearningTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { AchievementsTab } from './tabs/AchievementsTab';
import { FloatingAITutor } from './smart-dashboard/FloatingAITutor';

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
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Performance & predictions'
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
      case 'analytics':
        return <AnalyticsTab user={user} />;
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
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0.3))]" />
        
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
        {/* Header with Tab Navigation */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 dark:from-white dark:to-purple-300 bg-clip-text text-transparent">
                  Welcome back, {user.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Your AI-powered learning dashboard
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</div>
                  <div className="text-xs text-slate-500">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">87%</div>
                  <div className="text-xs text-slate-500">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">94</div>
                  <div className="text-xs text-slate-500">AI Score</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      "hover:bg-white/50 dark:hover:bg-slate-800/50",
                      activeTab === tab.id
                        ? "bg-white dark:bg-slate-800 shadow-lg text-purple-600 dark:text-purple-400"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs opacity-70">{tab.description}</div>
                    </div>
                    
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative">
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
              className="min-h-[calc(100vh-200px)]"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating AI Tutor */}
        <FloatingAITutor user={user} />
      </div>
    </div>
  );
}