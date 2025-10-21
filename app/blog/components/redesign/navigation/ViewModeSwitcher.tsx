"use client";

import { motion } from 'framer-motion';
import {
  Grid3X3, List, Newspaper, GitBranch, Map
} from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'magazine' | 'timeline' | 'map';

interface ViewModeSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  variant?: 'compact' | 'expanded';
}

const viewModes = [
  {
    id: 'grid' as ViewMode,
    label: 'Grid',
    icon: Grid3X3,
    description: 'Classic grid layout'
  },
  {
    id: 'list' as ViewMode,
    label: 'List',
    icon: List,
    description: 'Detailed list view'
  },
  {
    id: 'magazine' as ViewMode,
    label: 'Magazine',
    icon: Newspaper,
    description: 'Editorial layout'
  },
  {
    id: 'timeline' as ViewMode,
    label: 'Timeline',
    icon: GitBranch,
    description: 'Chronological view'
  },
  {
    id: 'map' as ViewMode,
    label: 'Map',
    icon: Map,
    description: 'Geographic view'
  }
];

export function ViewModeSwitcher({
  currentMode,
  onModeChange,
  variant = 'compact'
}: ViewModeSwitcherProps) {

  if (variant === 'expanded') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">View Mode</h3>
        <div className="grid grid-cols-5 gap-2">
          {viewModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;

            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{mode.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeViewMode"
                    className="absolute inset-0 border-2 border-white/30 rounded-xl"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Description */}
        <div className="mt-3 px-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {viewModes.find(m => m.id === currentMode)?.description}
          </p>
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {viewModes.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;

        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onModeChange(mode.id)}
            className={`relative p-2 rounded-md transition-all group ${
              isActive
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={mode.description}
          >
            <Icon className="w-4 h-4" />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {mode.label}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}