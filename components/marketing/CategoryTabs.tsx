'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface CategoryTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function CategoryTabs({ tabs, activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <div className="relative mb-12">
      {/* Tab container with light background */}
      <div className="inline-flex w-full gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1.5 scrollbar-hide sm:gap-2 md:w-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative shrink-0 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                sm:px-5 sm:text-base
                ${
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active tab background */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Tab content */}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
