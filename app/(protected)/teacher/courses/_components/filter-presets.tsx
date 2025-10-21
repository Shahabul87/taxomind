"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  AlertCircle,
  Star,
  DollarSign,
  Target,
  BookOpen,
  Check,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FilterPreset, CourseFilters } from "@/types/course";

export interface FilterPresetsProps {
  onPresetSelected: (filters: CourseFilters) => void;
  activePresetId?: string;
}

// Default filter presets
const defaultPresets: FilterPreset[] = [
  {
    id: 'all',
    name: 'All Courses',
    icon: BookOpen,
    description: 'Show all courses',
    filters: {},
    isDefault: true,
    color: 'gray',
  },
  {
    id: 'high-revenue',
    name: 'High Revenue',
    icon: TrendingUp,
    description: 'Courses generating significant revenue',
    filters: {
      performance: {
        minRevenue: 5000,
      },
    },
    color: 'green',
  },
  {
    id: 'needs-attention',
    name: 'Needs Attention',
    icon: AlertCircle,
    description: 'Courses with low completion or engagement',
    filters: {
      performance: {
        completionRate: { min: 0, max: 50 },
      },
    },
    color: 'amber',
  },
  {
    id: 'top-rated',
    name: 'Top Rated',
    icon: Star,
    description: 'Highly rated courses (4.5+ stars)',
    filters: {
      rating: {
        min: 4.5,
        max: 5.0,
      },
    },
    color: 'yellow',
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: DollarSign,
    description: 'High-priced courses ($100+)',
    filters: {
      priceRange: [100, 9999],
    },
    color: 'purple',
  },
  {
    id: 'low-performers',
    name: 'Low Performers',
    icon: Target,
    description: 'Courses with fewer than 10 enrollments',
    filters: {
      performance: {
        maxEnrollments: 10,
      },
    },
    color: 'red',
  },
];

export const FilterPresets = ({
  onPresetSelected,
  activePresetId = 'all',
}: FilterPresetsProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(activePresetId);
  const [customPresets] = useState<FilterPreset[]>([]);

  const allPresets = [...defaultPresets, ...customPresets];

  const handlePresetClick = (preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    onPresetSelected(preset.filters);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = "transition-all duration-200";

    if (isActive) {
      switch (color) {
        case 'green':
          return `${baseClasses} bg-green-500 text-white border-green-600 shadow-lg shadow-green-200 dark:shadow-green-900/50`;
        case 'amber':
          return `${baseClasses} bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/50`;
        case 'yellow':
          return `${baseClasses} bg-yellow-500 text-white border-yellow-600 shadow-lg shadow-yellow-200 dark:shadow-yellow-900/50`;
        case 'purple':
          return `${baseClasses} bg-purple-500 text-white border-purple-600 shadow-lg shadow-purple-200 dark:shadow-purple-900/50`;
        case 'red':
          return `${baseClasses} bg-red-500 text-white border-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/50`;
        default:
          return `${baseClasses} bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50`;
      }
    }

    return `${baseClasses} bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600`;
  };

  return (
    <Card className="border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            Quick Filters
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
            Filter courses by common criteria
          </p>
        </div>

        {/* Create Custom Preset Button (placeholder) */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-7 sm:h-8 text-xs flex-shrink-0"
          disabled
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Custom</span>
        </Button>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <AnimatePresence mode="wait">
          {allPresets.map((preset, index) => {
            const Icon = preset.icon;
            const isActive = selectedPreset === preset.id;

            return (
              <motion.button
                key={preset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "relative p-2.5 sm:p-3 rounded-lg border text-left",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1",
                  getColorClasses(preset.color || 'gray', isActive)
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md"
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                  </motion.div>
                )}

                {/* Custom Preset Remove Button */}
                {preset.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle custom preset removal
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </button>
                )}

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <div className={cn(
                    "p-1.5 sm:p-2 rounded-md inline-flex items-center justify-center w-fit",
                    isActive
                      ? "bg-white/20 backdrop-blur-sm"
                      : "bg-gray-100 dark:bg-gray-700"
                  )}>
                    <Icon className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4",
                      isActive ? "text-white" : "text-gray-600 dark:text-gray-300"
                    )} />
                  </div>

                  <div>
                    <p className={cn(
                      "text-xs font-semibold mb-0.5 truncate",
                      isActive ? "text-white" : "text-gray-900 dark:text-white"
                    )}>
                      {preset.name}
                    </p>
                    <p className={cn(
                      "text-[10px] leading-tight line-clamp-2",
                      isActive
                        ? "text-white/80"
                        : "text-gray-500 dark:text-gray-400"
                    )}>
                      {preset.description}
                    </p>
                  </div>
                </div>

                {/* Custom Badge */}
                {preset.isCustom && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 h-4 text-[9px] px-1.5"
                  >
                    Custom
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Active Filter Info */}
      {selectedPreset !== 'all' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Active Filter
              </Badge>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {allPresets.find(p => p.id === selectedPreset)?.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handlePresetClick(defaultPresets[0])}
            >
              Clear
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
};
