'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  Timer,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Compass,
  Wand2,
  BarChart3,
  Goal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardView =
  | 'learning'
  | 'analytics'
  | 'skills'
  | 'practice'
  | 'gamification'
  | 'goals'
  | 'gaps'
  | 'innovation'
  | 'discover'
  | 'create';

interface TabConfig {
  id: DashboardView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  gradient: string;
  description: string;
  isPrimary?: boolean;
}

const tabs: TabConfig[] = [
  {
    id: 'learning',
    label: 'Learning',
    shortLabel: 'Learn',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-indigo-500',
    description: 'AI-powered learning hub',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    shortLabel: 'Stats',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Learning analytics & insights',
    isPrimary: true,
  },
  {
    id: 'skills',
    label: 'Skills',
    shortLabel: 'Skills',
    icon: Target,
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Track skill mastery',
  },
  {
    id: 'practice',
    label: 'Practice',
    shortLabel: 'Practice',
    icon: Timer,
    gradient: 'from-orange-500 to-red-500',
    description: '10,000 hour tracker',
  },
  {
    id: 'gamification',
    label: 'Achievements',
    shortLabel: 'Awards',
    icon: Trophy,
    gradient: 'from-amber-500 to-yellow-500',
    description: 'Badges & leaderboards',
  },
  {
    id: 'goals',
    label: 'Goals',
    shortLabel: 'Goals',
    icon: Goal,
    gradient: 'from-rose-500 to-pink-500',
    description: 'Track your goals & milestones',
  },
  {
    id: 'gaps',
    label: 'Gaps',
    shortLabel: 'Gaps',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-500',
    description: 'Knowledge gap analysis',
  },
  {
    id: 'innovation',
    label: 'Innovation',
    shortLabel: 'New',
    icon: Lightbulb,
    gradient: 'from-yellow-500 to-orange-500',
    description: 'Experimental features',
  },
  {
    id: 'discover',
    label: 'Discover',
    shortLabel: 'Find',
    icon: Compass,
    gradient: 'from-cyan-500 to-blue-500',
    description: 'Course marketplace',
  },
  {
    id: 'create',
    label: 'Create',
    shortLabel: 'Create',
    icon: Wand2,
    gradient: 'from-violet-500 to-purple-500',
    description: 'Creator studio',
  },
];

interface TabNavigationProps {
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
  className?: string;
}

export function TabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  // Handle scroll to show/hide fade indicators
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftFade(scrollLeft > 10);
    setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeElement = scrollRef.current.querySelector(`[data-tab="${activeTab}"]`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Left fade gradient */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-800 to-transparent z-10 pointer-events-none transition-opacity duration-200',
          showLeftFade ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Dashboard sections"
      >
        <div className="flex items-center gap-1 px-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            // Special styling for Assess (primary) tab when not active
            const isPrimaryInactive = tab.isPrimary && !isActive;

            return (
              <motion.button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                  isActive && 'text-white shadow-md',
                  !isActive && !isPrimaryInactive && 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50',
                  isPrimaryInactive && 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
              >
                {/* Gradient background for active state */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className={cn('absolute inset-0 rounded-lg bg-gradient-to-r', tab.gradient)}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right fade gradient */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-800 to-transparent z-10 pointer-events-none transition-opacity duration-200',
          showRightFade ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

export { tabs as dashboardTabs };
