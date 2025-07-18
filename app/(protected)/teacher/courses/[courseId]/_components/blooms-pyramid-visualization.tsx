"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  Lightbulb, 
  Cog, 
  Search, 
  Scale, 
  Palette,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BloomsPyramidVisualizationProps {
  distribution: Record<string, number>;
  onLevelClick?: (level: string) => void;
}

const BLOOMS_LEVELS = [
  {
    key: 'create',
    name: 'Create',
    icon: Palette,
    color: 'from-purple-600 to-purple-700',
    description: 'Generate new ideas, products, or ways of viewing things',
    keywords: ['design', 'construct', 'plan', 'produce', 'invent', 'devise'],
    idealRange: { min: 15, max: 25 }
  },
  {
    key: 'evaluate',
    name: 'Evaluate',
    icon: Scale,
    color: 'from-blue-600 to-blue-700',
    description: 'Justify decisions or course of action',
    keywords: ['check', 'critique', 'judge', 'justify', 'test', 'detect'],
    idealRange: { min: 15, max: 25 }
  },
  {
    key: 'analyze',
    name: 'Analyze',
    icon: Search,
    color: 'from-cyan-600 to-cyan-700',
    description: 'Break information into parts to explore relationships',
    keywords: ['compare', 'organize', 'deconstruct', 'interrogate', 'find'],
    idealRange: { min: 20, max: 25 }
  },
  {
    key: 'apply',
    name: 'Apply',
    icon: Cog,
    color: 'from-green-600 to-green-700',
    description: 'Use information in new situations',
    keywords: ['implement', 'carry out', 'use', 'execute', 'solve'],
    idealRange: { min: 20, max: 25 }
  },
  {
    key: 'understand',
    name: 'Understand',
    icon: Lightbulb,
    color: 'from-yellow-600 to-yellow-700',
    description: 'Explain ideas or concepts',
    keywords: ['interpret', 'summarize', 'infer', 'paraphrase', 'classify'],
    idealRange: { min: 10, max: 15 }
  },
  {
    key: 'remember',
    name: 'Remember',
    icon: Brain,
    color: 'from-red-600 to-red-700',
    description: 'Recall facts and basic concepts',
    keywords: ['define', 'duplicate', 'list', 'memorize', 'repeat', 'state'],
    idealRange: { min: 5, max: 10 }
  }
];

export function BloomsPyramidVisualization({ 
  distribution, 
  onLevelClick 
}: BloomsPyramidVisualizationProps) {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Calculate pyramid dimensions
  const maxWidth = 100;
  const levelHeight = 60;
  const spacing = 4;

  const handleLevelClick = (level: string) => {
    setSelectedLevel(level);
    if (onLevelClick) {
      onLevelClick(level);
    }
  };

  // Check if level is within ideal range
  const isWithinIdealRange = (level: string, value: number) => {
    const levelData = BLOOMS_LEVELS.find(l => l.key === level);
    if (!levelData) return true;
    return value >= levelData.idealRange.min && value <= levelData.idealRange.max;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Bloom&apos;s Taxonomy Distribution
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-gray-500" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Click on any level to get suggestions for improvement. 
                Colors indicate if the percentage is within the ideal range.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Pyramid Visualization */}
      <div className="relative flex flex-col items-center space-y-1">
        {BLOOMS_LEVELS.map((level, index) => {
          const percentage = distribution[level.key] || 0;
          const width = maxWidth - (index * 15); // Decreasing width for pyramid shape
          const isIdeal = isWithinIdealRange(level.key, percentage);
          const isHovered = hoveredLevel === level.key;
          const isSelected = selectedLevel === level.key;
          const Icon = level.icon;

          return (
            <motion.div
              key={level.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
              style={{ width: `${width}%` }}
              onMouseEnter={() => setHoveredLevel(level.key)}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              <motion.button
                onClick={() => handleLevelClick(level.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full relative overflow-hidden rounded-lg transition-all duration-300",
                  "border cursor-pointer backdrop-blur-sm",
                  isSelected ? "border-purple-300 dark:border-purple-600 shadow-xl" : "border-white/30",
                  isHovered && "shadow-lg"
                )}
                style={{ height: `${levelHeight}px` }}
              >
                {/* Background gradient with glass effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r opacity-80 backdrop-blur-sm",
                  level.color,
                  !isIdeal && "opacity-50"
                )} />

                {/* Progress fill - ensure minimum visibility for small percentages */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 8)}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="absolute inset-0 bg-white/30 backdrop-blur-sm"
                  style={{ minWidth: percentage > 0 ? '15%' : '0%' }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between px-4 h-full">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-white" />
                    <div className="text-left">
                      <p className="font-semibold text-white">{level.name}</p>
                      <p className="text-xs text-white/80">
                        {level.idealRange.min}-{level.idealRange.max}% ideal
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{percentage}%</p>
                    {!isIdeal && (
                      <p className="text-xs text-white/80">
                        {percentage < level.idealRange.min ? 'Low' : 'High'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/20 backdrop-blur-sm"
                  />
                )}
              </motion.button>

              {/* Tooltip on hover */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full"
                >
                  <div className="backdrop-blur-md bg-gray-900/90 text-white p-3 rounded-lg shadow-xl max-w-xs border border-white/20">
                    <p className="font-semibold mb-1">{level.name}</p>
                    <p className="text-sm mb-2">{level.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {level.keywords.map((keyword, idx) => (
                        <span key={idx} className="text-xs bg-white/30 px-2 py-1 rounded backdrop-blur-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-green-600 to-green-700 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Within ideal range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded opacity-60" />
          <span className="text-gray-600 dark:text-gray-400">Outside ideal range</span>
        </div>
      </div>

      {/* Selected Level Details */}
      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 rounded-lg shadow-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {BLOOMS_LEVELS.find(l => l.key === selectedLevel)?.name} Level Details
            </h4>
            <button
              onClick={() => setSelectedLevel(null)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {BLOOMS_LEVELS.find(l => l.key === selectedLevel)?.description}
          </p>
        </motion.div>
      )}
    </div>
  );
}