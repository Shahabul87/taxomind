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
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FilterPreset, CourseFilters } from "@/types/course";

export interface FilterPresetsProps {
  onPresetSelected: (filters: CourseFilters) => void;
  activePresetId?: string;
}

// Default filter presets
const defaultPresets: FilterPreset[] = [
  {
    id: "all",
    name: "All Courses",
    icon: BookOpen,
    description: "Show all courses",
    filters: {},
    isDefault: true,
    color: "slate",
  },
  {
    id: "high-revenue",
    name: "High Revenue",
    icon: TrendingUp,
    description: "Top performing courses",
    filters: {
      performance: {
        minRevenue: 5000,
      },
    },
    color: "success",
  },
  {
    id: "needs-attention",
    name: "Needs Attention",
    icon: AlertCircle,
    description: "Low completion rate",
    filters: {
      performance: {
        completionRate: { min: 0, max: 50 },
      },
    },
    color: "coral",
  },
  {
    id: "top-rated",
    name: "Top Rated",
    icon: Star,
    description: "4.5+ star rating",
    filters: {
      rating: {
        min: 4.5,
        max: 5.0,
      },
    },
    color: "coral",
  },
  {
    id: "premium",
    name: "Premium",
    icon: DollarSign,
    description: "$100+ courses",
    filters: {
      priceRange: [100, 9999],
    },
    color: "primary",
  },
  {
    id: "low-performers",
    name: "Low Performers",
    icon: Target,
    description: "Under 10 enrollments",
    filters: {
      performance: {
        maxEnrollments: 10,
      },
    },
    color: "teal",
  },
];

type ColorType = "slate" | "success" | "coral" | "primary" | "teal";

const getColorClasses = (color: string, isActive: boolean): string => {
  const colorType = color as ColorType;

  if (isActive) {
    const activeStyles: Record<ColorType, string> = {
      success: "bg-gradient-to-br from-[hsl(152,76%,40%)] to-[hsl(165,70%,45%)] text-white border-transparent shadow-lg shadow-[hsl(152,76%,40%)]/25",
      coral: "bg-gradient-to-br from-[hsl(12,76%,61%)] to-[hsl(35,85%,55%)] text-white border-transparent shadow-lg shadow-[hsl(12,76%,61%)]/25",
      primary: "bg-gradient-to-br from-[hsl(243,75%,58%)] to-[hsl(280,70%,55%)] text-white border-transparent shadow-lg shadow-[hsl(243,75%,58%)]/25",
      teal: "bg-gradient-to-br from-[hsl(173,80%,40%)] to-[hsl(195,75%,45%)] text-white border-transparent shadow-lg shadow-[hsl(173,80%,40%)]/25",
      slate: "bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(280,70%,55%)] text-white border-transparent shadow-lg shadow-[hsl(var(--teacher-primary))]/25",
    };
    return activeStyles[colorType] || activeStyles.slate;
  }

  return "bg-[hsl(var(--teacher-surface))] text-[hsl(var(--teacher-text-muted))] border-[hsl(var(--teacher-border))] hover:border-[hsl(var(--teacher-primary))] hover:text-[hsl(var(--teacher-primary))] hover:bg-[hsl(var(--teacher-primary-muted))]";
};

export const FilterPresets = ({
  onPresetSelected,
  activePresetId = "all",
}: FilterPresetsProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(activePresetId);
  const [customPresets] = useState<FilterPreset[]>([]);

  const allPresets = [...defaultPresets, ...customPresets];

  const handlePresetClick = (preset: FilterPreset) => {
    setSelectedPreset(preset.id);
    onPresetSelected(preset.filters);
  };

  return (
    <div className="teacher-card-premium p-4 sm:p-5 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(280,70%,55%)]">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--teacher-text))]">
              Quick Filters
            </h3>
            <p className="text-xs text-[hsl(var(--teacher-text-muted))] hidden sm:block">
              Filter courses by common criteria
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 h-8 text-xs border-[hsl(var(--teacher-border))] hover:border-[hsl(var(--teacher-primary))] hover:text-[hsl(var(--teacher-primary))] hover:bg-[hsl(var(--teacher-primary-muted))]"
          disabled
        >
          <Plus className="w-3 h-3" />
          <span className="hidden sm:inline">Custom Filter</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Bento Grid of Filter Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <AnimatePresence mode="wait">
          {allPresets.map((preset, index) => {
            const Icon = preset.icon;
            const isActive = selectedPreset === preset.id;

            return (
              <motion.button
                key={preset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "group relative p-3 sm:p-4 rounded-xl border text-left",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teacher-primary))] focus:ring-offset-2",
                  "transition-all duration-300",
                  getColorClasses(preset.color || "slate", isActive)
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md border border-[hsl(var(--teacher-border-subtle))]"
                  >
                    <Check className="w-3 h-3 text-[hsl(var(--teacher-success))]" />
                  </motion.div>
                )}

                {/* Custom Preset Remove Button */}
                {preset.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[hsl(var(--teacher-coral))] rounded-full flex items-center justify-center shadow-md hover:bg-[hsl(12,80%,55%)] transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}

                <div className="flex flex-col gap-2 sm:gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "p-2 rounded-lg inline-flex items-center justify-center w-fit",
                      isActive
                        ? "bg-white/20 backdrop-blur-sm"
                        : "bg-[hsl(var(--teacher-surface-hover))]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive
                          ? "text-white"
                          : "text-[hsl(var(--teacher-text-muted))]"
                      )}
                    />
                  </div>

                  {/* Text */}
                  <div>
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-semibold mb-0.5 truncate",
                        isActive
                          ? "text-white"
                          : "text-[hsl(var(--teacher-text))]"
                      )}
                    >
                      {preset.name}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] sm:text-xs leading-tight line-clamp-2",
                        isActive
                          ? "text-white/75"
                          : "text-[hsl(var(--teacher-text-subtle))]"
                      )}
                    >
                      {preset.description}
                    </p>
                  </div>
                </div>

                {/* Custom Badge */}
                {preset.isCustom && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 right-2 h-4 text-[9px] px-1.5 bg-white/20"
                  >
                    Custom
                  </Badge>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Active Filter Banner */}
      <AnimatePresence>
        {selectedPreset !== "all" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--teacher-primary-muted))] border border-[hsl(var(--teacher-primary))]/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(var(--teacher-primary))]" />
                <span className="text-sm font-medium text-[hsl(var(--teacher-primary))]">
                  Active Filter:
                </span>
                <span className="text-sm text-[hsl(var(--teacher-text))]">
                  {allPresets.find((p) => p.id === selectedPreset)?.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[hsl(var(--teacher-text-muted))] hover:text-[hsl(var(--teacher-primary))] hover:bg-[hsl(var(--teacher-primary-muted))]"
                onClick={() => handlePresetClick(defaultPresets[0])}
              >
                Clear
                <X className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
