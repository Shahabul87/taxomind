'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as NextAuthUser } from 'next-auth';

// Sub-tab content components
import { DashboardSubTab } from './tabs/DashboardSubTab';
import { StudySubTab } from './tabs/StudySubTab';
import { SocialSubTab } from './tabs/SocialSubTab';
import { AIToolsSubTab } from './tabs/AIToolsSubTab';

// Note: Analytics is a top-level header tab, not a sub-tab here
export type LearningSubTab = 'dashboard' | 'study' | 'social' | 'ai-tools';

interface SubTabConfig {
  id: LearningSubTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SUB_TABS: SubTabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & quick actions',
  },
  {
    id: 'study',
    label: 'Study',
    icon: BookOpen,
    description: 'Practice & review tools',
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
    description: 'Collaborate & connect',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: Sparkles,
    description: 'Smart learning assistants',
  },
];

interface LearningTabsContainerProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
  };
  onCreateStudyPlan?: () => void;
}

export function LearningTabsContainer({ user, onCreateStudyPlan }: LearningTabsContainerProps) {
  const [activeSubTab, setActiveSubTab] = useState<LearningSubTab>('dashboard');

  const renderContent = () => {
    switch (activeSubTab) {
      case 'dashboard':
        return <DashboardSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />;
      case 'study':
        return <StudySubTab user={user} />;
      case 'social':
        return <SocialSubTab user={user} />;
      case 'ai-tools':
        return <AIToolsSubTab user={user} />;
      default:
        return <DashboardSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />;
    }
  };

  return (
    <div className="min-h-full">
      {/* Sub-Tab Navigation */}
      <div className="sticky top-14 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeSubTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sub-Tab Content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LearningTabsContainer;
