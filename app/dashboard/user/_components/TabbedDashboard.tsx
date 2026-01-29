"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "next-auth";
import dynamic from "next/dynamic";
import { Brain, LayoutDashboard, BookOpen, BarChart3, Trophy } from "lucide-react";
import { ReactErrorBoundary } from "@/components/react-error-boundary";

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

// Lazy-loaded tab components for better code splitting
const OverviewTab = dynamic(
  () => import('./tabs/OverviewTab').then(mod => ({ default: mod.OverviewTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const LearningTab = dynamic(
  () => import('./tabs/LearningTab').then(mod => ({ default: mod.LearningTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const AnalyticsTab = dynamic(
  () => import('./tabs/AnalyticsTab').then(mod => ({ default: mod.AnalyticsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const AchievementsTab = dynamic(
  () => import('./tabs/AchievementsTab').then(mod => ({ default: mod.AchievementsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const CognitiveTab = dynamic(
  () => import('./tabs/CognitiveTab').then(mod => ({ default: mod.CognitiveTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

// Tab configuration with icons
const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'cognitive', label: 'Cognitive', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
] as const;

interface TabbedDashboardProps {
  user: User;
}

export function TabbedDashboard({ user }: TabbedDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const renderTabContent = () => {
    const tabLabel = TABS.find(t => t.id === activeTab)?.label ?? 'Tab';
    let content: React.ReactNode;

    switch (activeTab) {
      case 'overview':
        content = <OverviewTab user={user} />;
        break;
      case 'learning':
        content = <LearningTab user={user} />;
        break;
      case 'cognitive':
        content = <CognitiveTab user={user} />;
        break;
      case 'analytics':
        content = <AnalyticsTab user={user} />;
        break;
      case 'achievements':
        content = <AchievementsTab user={user} />;
        break;
      default:
        content = <OverviewTab user={user} />;
    }

    return (
      <ReactErrorBoundary key={activeTab} name={tabLabel}>
        {content}
      </ReactErrorBoundary>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-950 dark:via-purple-950/20 dark:to-blue-950/20">
      {/* Sidebar */}
      <div className="w-80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-r border-slate-200/50 dark:border-slate-700/50">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dashboard</h3>
          <div className="space-y-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'cognitive' && (
                    <span className="ml-auto text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                      New
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
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