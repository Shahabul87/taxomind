"use client";

/**
 * BloomsDistributionPicker
 *
 * Interactive radial/donut chart for configuring Bloom's Taxonomy distribution.
 * Features drag-to-adjust segments and real-time percentage updates.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Brain,
  Lightbulb,
  Wrench,
  Search,
  Scale,
  Sparkles,
  Info,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Bloom's Taxonomy levels with metadata
const BLOOMS_LEVELS = [
  {
    key: "REMEMBER",
    label: "Remember",
    description: "Recall facts and basic concepts",
    icon: Brain,
    color: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-500",
    textColor: "text-slate-400",
    ringColor: "ring-slate-500/30",
    verbs: ["Define", "List", "Recall", "Identify"],
  },
  {
    key: "UNDERSTAND",
    label: "Understand",
    description: "Explain ideas or concepts",
    icon: Lightbulb,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500",
    textColor: "text-blue-400",
    ringColor: "ring-blue-500/30",
    verbs: ["Describe", "Explain", "Summarize", "Interpret"],
  },
  {
    key: "APPLY",
    label: "Apply",
    description: "Use information in new situations",
    icon: Wrench,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500",
    textColor: "text-emerald-400",
    ringColor: "ring-emerald-500/30",
    verbs: ["Execute", "Implement", "Solve", "Demonstrate"],
  },
  {
    key: "ANALYZE",
    label: "Analyze",
    description: "Draw connections among ideas",
    icon: Search,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500",
    textColor: "text-amber-400",
    ringColor: "ring-amber-500/30",
    verbs: ["Differentiate", "Organize", "Compare", "Deconstruct"],
  },
  {
    key: "EVALUATE",
    label: "Evaluate",
    description: "Justify a decision or course of action",
    icon: Scale,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500",
    textColor: "text-purple-400",
    ringColor: "ring-purple-500/30",
    verbs: ["Critique", "Judge", "Assess", "Defend"],
  },
  {
    key: "CREATE",
    label: "Create",
    description: "Produce new or original work",
    icon: Sparkles,
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-500",
    textColor: "text-rose-400",
    ringColor: "ring-rose-500/30",
    verbs: ["Design", "Construct", "Develop", "Formulate"],
  },
] as const;

type BloomsKey = (typeof BLOOMS_LEVELS)[number]["key"];

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface BloomsDistributionPickerProps {
  value: BloomsDistribution;
  onChange: (distribution: BloomsDistribution) => void;
  className?: string;
  compact?: boolean;
}

// Preset distributions
const PRESETS = {
  balanced: {
    label: "Balanced",
    description: "Equal focus across all levels",
    distribution: { REMEMBER: 17, UNDERSTAND: 17, APPLY: 17, ANALYZE: 17, EVALUATE: 16, CREATE: 16 },
  },
  foundational: {
    label: "Foundational",
    description: "Focus on lower-order thinking",
    distribution: { REMEMBER: 30, UNDERSTAND: 30, APPLY: 25, ANALYZE: 10, EVALUATE: 3, CREATE: 2 },
  },
  advanced: {
    label: "Advanced",
    description: "Focus on higher-order thinking",
    distribution: { REMEMBER: 5, UNDERSTAND: 10, APPLY: 20, ANALYZE: 30, EVALUATE: 25, CREATE: 10 },
  },
  practical: {
    label: "Practical",
    description: "Application-focused assessment",
    distribution: { REMEMBER: 10, UNDERSTAND: 15, APPLY: 35, ANALYZE: 25, EVALUATE: 10, CREATE: 5 },
  },
};

export function BloomsDistributionPicker({
  value,
  onChange,
  className,
  compact = false,
}: BloomsDistributionPickerProps) {
  const [activeLevel, setActiveLevel] = useState<BloomsKey | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Calculate total to ensure it equals 100
  const total = useMemo(() => {
    return Object.values(value).reduce((sum, v) => sum + v, 0);
  }, [value]);

  // Normalize distribution to 100%
  const normalizeDistribution = useCallback((dist: BloomsDistribution): BloomsDistribution => {
    const sum = Object.values(dist).reduce((s, v) => s + v, 0);
    if (sum === 0) return dist;

    const normalized: BloomsDistribution = { ...dist };
    const keys = Object.keys(normalized) as BloomsKey[];

    // Scale all values
    let newSum = 0;
    keys.forEach((key) => {
      normalized[key] = Math.round((dist[key] / sum) * 100);
      newSum += normalized[key];
    });

    // Adjust for rounding errors
    if (newSum !== 100) {
      const diff = 100 - newSum;
      const maxKey = keys.reduce((a, b) => (normalized[a] > normalized[b] ? a : b));
      normalized[maxKey] += diff;
    }

    return normalized;
  }, []);

  // Handle slider change
  const handleSliderChange = useCallback(
    (key: BloomsKey, newValue: number) => {
      const oldValue = value[key];
      const diff = newValue - oldValue;

      if (diff === 0) return;

      const newDist = { ...value, [key]: newValue };

      // Distribute the difference among other levels
      const otherKeys = (Object.keys(value) as BloomsKey[]).filter((k) => k !== key);
      const totalOthers = otherKeys.reduce((sum, k) => sum + value[k], 0);

      if (totalOthers > 0) {
        let remaining = -diff;
        otherKeys.forEach((k, i) => {
          if (i === otherKeys.length - 1) {
            newDist[k] = Math.max(0, Math.min(100, value[k] + remaining));
          } else {
            const share = Math.round((value[k] / totalOthers) * -diff);
            const adjusted = Math.max(0, Math.min(100, value[k] + share));
            remaining -= adjusted - value[k];
            newDist[k] = adjusted;
          }
        });
      }

      onChange(normalizeDistribution(newDist));
    },
    [value, onChange, normalizeDistribution]
  );

  // Apply preset
  const applyPreset = useCallback(
    (presetKey: keyof typeof PRESETS) => {
      onChange(PRESETS[presetKey].distribution);
      setShowPresets(false);
    },
    [onChange]
  );

  // Reset to balanced
  const resetToBalanced = useCallback(() => {
    onChange(PRESETS.balanced.distribution);
  }, [onChange]);

  // Generate SVG donut chart segments
  const donutSegments = useMemo(() => {
    const segments: Array<{
      key: BloomsKey;
      startAngle: number;
      endAngle: number;
      color: string;
    }> = [];

    let currentAngle = -90; // Start from top

    BLOOMS_LEVELS.forEach((level) => {
      const percentage = value[level.key];
      const angle = (percentage / 100) * 360;
      segments.push({
        key: level.key,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: level.bgColor,
      });
      currentAngle += angle;
    });

    return segments;
  }, [value]);

  // SVG arc path generator
  const describeArc = (
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start1 = polarToCartesian(cx, cy, outerRadius, endAngle);
    const end1 = polarToCartesian(cx, cy, outerRadius, startAngle);
    const start2 = polarToCartesian(cx, cy, innerRadius, endAngle);
    const end2 = polarToCartesian(cx, cy, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      "M", start1.x, start1.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end1.x, end1.y,
      "L", end2.x, end2.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, start2.x, start2.y,
      "Z",
    ].join(" ");
  };

  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Bloom&apos;s Distribution</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToBalanced}
            className="h-7 px-2 text-xs text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {BLOOMS_LEVELS.map((level) => (
            <TooltipProvider key={level.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col items-center rounded-lg p-2 transition-all cursor-pointer",
                      "hover:bg-slate-800/50",
                      activeLevel === level.key && "ring-2",
                      level.ringColor
                    )}
                    onClick={() => setActiveLevel(activeLevel === level.key ? null : level.key)}
                  >
                    <div className={cn("h-2 w-full rounded-full mb-1", level.bgColor)} />
                    <span className="text-xs font-bold text-slate-200">{value[level.key]}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-800 border-slate-700">
                  <p className="font-medium">{level.label}</p>
                  <p className="text-xs text-slate-400">{level.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Bloom&apos;s Taxonomy Distribution
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Configure cognitive level distribution for your exam
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPresets(!showPresets)}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          >
            Presets
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToBalanced}
            className="text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Presets Panel */}
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 overflow-hidden"
          >
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key as keyof typeof PRESETS)}
                className={cn(
                  "p-3 rounded-xl border border-slate-700/50 bg-slate-800/30",
                  "hover:bg-slate-800/60 hover:border-slate-600 transition-all",
                  "text-left group"
                )}
              >
                <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                  {preset.label}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">{preset.description}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Chart + Sliders */}
      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
              {donutSegments.map((segment, index) => {
                const level = BLOOMS_LEVELS[index];
                const isActive = activeLevel === segment.key;
                const percentage = value[segment.key];

                if (percentage === 0) return null;

                return (
                  <motion.path
                    key={segment.key}
                    d={describeArc(120, 120, 60, isActive ? 95 : 90, segment.startAngle, segment.endAngle - 0.5)}
                    className={cn(
                      "cursor-pointer transition-all duration-300",
                      level.bgColor.replace("bg-", "fill-"),
                      isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                    )}
                    onClick={() => setActiveLevel(isActive ? null : segment.key)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: isActive ? 1 : 0.8 }}
                    transition={{ delay: index * 0.05 }}
                  />
                );
              })}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {activeLevel ? (
                  <motion.div
                    key={activeLevel}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {(() => {
                      const level = BLOOMS_LEVELS.find((l) => l.key === activeLevel)!;
                      const Icon = level.icon;
                      return (
                        <>
                          <Icon className={cn("h-6 w-6 mx-auto mb-1", level.textColor)} />
                          <span className={cn("text-2xl font-bold", level.textColor)}>
                            {value[activeLevel]}%
                          </span>
                          <p className="text-xs text-slate-400 mt-0.5">{level.label}</p>
                        </>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-slate-200">{total}%</span>
                    <p className="text-xs text-slate-400 mt-0.5">Total</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {BLOOMS_LEVELS.map((level) => {
            const Icon = level.icon;
            const isActive = activeLevel === level.key;

            return (
              <motion.div
                key={level.key}
                className={cn(
                  "p-4 rounded-xl border transition-all",
                  isActive
                    ? `border-${level.bgColor.replace("bg-", "")}/50 bg-slate-800/60`
                    : "border-slate-800 bg-slate-900/30 hover:bg-slate-800/40"
                )}
                onMouseEnter={() => setActiveLevel(level.key)}
                onMouseLeave={() => setActiveLevel(null)}
                layout
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", level.color)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <span className="font-medium text-slate-200">{level.label}</span>
                      <p className="text-xs text-slate-500">{level.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xl font-bold tabular-nums", level.textColor)}>
                      {value[level.key]}%
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-slate-500 hover:text-slate-300">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-slate-800 border-slate-700 max-w-[200px]">
                          <p className="text-xs text-slate-300">
                            <span className="font-medium">Action verbs:</span>{" "}
                            {level.verbs.join(", ")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <Slider
                  value={[value[level.key]]}
                  onValueChange={([v]) => handleSliderChange(level.key, v)}
                  max={100}
                  min={0}
                  step={1}
                  className={cn(
                    "[&_[role=slider]]:h-4 [&_[role=slider]]:w-4",
                    "[&_[role=slider]]:border-2 [&_[role=slider]]:border-white",
                    `[&_[role=slider]]:${level.bgColor}`,
                    `[&_.relative]:${level.bgColor}`,
                    "[&_.absolute]:bg-slate-700"
                  )}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800">
        {BLOOMS_LEVELS.map((level) => (
          <div
            key={level.key}
            className="flex items-center gap-2 text-xs text-slate-400"
          >
            <div className={cn("h-3 w-3 rounded-full", level.bgColor)} />
            <span>{level.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BloomsDistributionPicker;
