'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  // Timer, // Retained for Practice tab (hidden)
  AlertTriangle,
  BarChart3,
  Goal,
  ChevronDown,
  Check,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewportHeight } from '@/hooks/useViewportHeight';

export type DashboardView =
  | 'todos'
  | 'analytics'
  | 'skills'
  // | 'practice' // Hidden - backend retained for later
  | 'goals'
  | 'gaps';

interface TabConfig {
  id: DashboardView;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  gradient: string;
  description: string;
  isPrimary?: boolean;
}

// Hidden tabs (will be re-enabled later):
// learning, cognitive, gamification, innovation, create, career, social, insights
const tabs: TabConfig[] = [
  {
    id: 'todos',
    label: 'ToDos',
    shortLabel: 'ToDos',
    icon: CheckSquare,
    gradient: 'from-green-500 to-emerald-500',
    description: 'Tasks & daily activities',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    icon: BarChart3,
    gradient: 'from-indigo-500 to-purple-500',
    description: 'Learning analytics & insights',
  },
  {
    id: 'skills',
    label: 'Skills',
    shortLabel: 'Skills',
    icon: Target,
    gradient: 'from-emerald-500 to-teal-500',
    description: 'Track skill mastery',
  },
  // Practice tab hidden - backend retained for later
  // {
  //   id: 'practice',
  //   label: 'Practice',
  //   shortLabel: 'Practice',
  //   icon: Timer,
  //   gradient: 'from-orange-500 to-red-500',
  //   description: '10,000 hour tracker',
  // },
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
];

interface TabNavigationProps {
  activeTab: DashboardView;
  onTabChange: (tab: DashboardView) => void;
  className?: string;
}

// Mobile Tab Dropdown Component
function MobileTabDropdown({ activeTab, onTabChange }: { activeTab: DashboardView; onTabChange: (tab: DashboardView) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTabConfig = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabConfig.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Active Tab Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
          'bg-gradient-to-r text-white shadow-md',
          activeTabConfig.gradient
        )}
      >
        <ActiveIcon className="h-4 w-4" />
        <span>{activeTabConfig.label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
        >
          <div className="p-2 max-h-80 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-r',
                    tab.gradient
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{tab.description}</div>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-emerald-500" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Desktop Tab Navigation Component
function DesktopTabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
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
                  <span>{tab.label}</span>
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

export function TabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
  const { isMobile } = useViewportHeight();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div className={cn('h-10', className)} />;
  }

  // Mobile: Show dropdown menu for cleaner UX
  if (isMobile) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <MobileTabDropdown activeTab={activeTab} onTabChange={onTabChange} />
      </div>
    );
  }

  // Desktop: Show horizontal scrollable tabs
  return <DesktopTabNavigation activeTab={activeTab} onTabChange={onTabChange} className={className} />;
}

export { tabs as dashboardTabs };
