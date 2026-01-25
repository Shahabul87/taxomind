'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as NextAuthUser } from 'next-auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Sub-tab content components
import { ToDosSubTab } from './tabs/ToDosSubTab';
import { StudySubTab } from './tabs/StudySubTab';
import { SocialSubTab } from './tabs/SocialSubTab';
import { AIToolsSubTab } from './tabs/AIToolsSubTab';

// Note: Analytics is a top-level header tab, not a sub-tab here
export type LearningSubTab = 'todos' | 'study' | 'social' | 'ai-tools';

interface SubTabConfig {
  id: LearningSubTab;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
}

const SUB_TABS: SubTabConfig[] = [
  {
    id: 'todos',
    label: 'ToDos',
    shortLabel: 'ToDos',
    icon: CheckSquare,
    description: 'Today&apos;s tasks & activities',
  },
  {
    id: 'study',
    label: 'Study',
    shortLabel: 'Study',
    icon: BookOpen,
    description: 'Practice & review tools',
  },
  {
    id: 'social',
    label: 'Social',
    shortLabel: 'Social',
    icon: Users,
    description: 'Collaborate & connect',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    shortLabel: 'AI',
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
  const [activeSubTab, setActiveSubTab] = useState<LearningSubTab>('todos');

  const renderContent = () => {
    switch (activeSubTab) {
      case 'todos':
        return <ToDosSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />;
      case 'study':
        return <StudySubTab user={user} />;
      case 'social':
        return <SocialSubTab user={user} />;
      case 'ai-tools':
        return <AIToolsSubTab user={user} />;
      default:
        return <ToDosSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />;
    }
  };

  return (
    <div className="min-h-full">
      {/* Compact Inline Sub-Tab Selector - No sticky, inline with content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pt-2">
        <TooltipProvider delayDuration={300}>
          <nav className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/50">
            {SUB_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveSubTab(tab.id)}
                      className={cn(
                        'relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {/* Show short label on mobile, full label on larger screens */}
                      <span className="hidden xs:inline sm:hidden">{tab.shortLabel}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{tab.label}</p>
                    <p className="text-slate-400">{tab.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>

      {/* Sub-Tab Content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4">
        {renderContent()}
      </div>
    </div>
  );
}

export default LearningTabsContainer;
