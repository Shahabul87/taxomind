'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { TabKey } from '@/lib/paths/data';

interface CategoryTabsProps {
  tabs: Array<{ key: TabKey; label: string }>;
  activeTab: TabKey;
  onTabChange: (key: TabKey) => void;
}

export default function CategoryTabs({ tabs, activeTab, onTabChange }: CategoryTabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex];
    onTabChange(newTab.key);

    // Focus the new tab
    const tabElements = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    if (tabElements && tabElements[newIndex]) {
      tabElements[newIndex].focus();
    }
  };

  return (
    <div className="mb-12 flex justify-center">
      <div
        ref={tabListRef}
        role="tablist"
        aria-label="Learning path categories"
        className="inline-flex gap-2 rounded-full bg-surface-muted p-1.5"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.key)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                relative rounded-full px-6 py-2.5 text-sm font-semibold transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${
                  isActive
                    ? 'bg-surface text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-surface/50 hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
