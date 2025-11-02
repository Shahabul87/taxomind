"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface FilterBarProps {
  isVisible: boolean;
  sortBy: string;
  onSortChange: (value: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
  selectedPriceRange: { min: number; max: number } | null;
  onPriceRangeChange: (range: { min: number; max: number } | null) => void;
  selectedDifficulties: string[];
  onDifficultyToggle: (difficulty: string) => void;
  onClearAll: () => void;
  activeFiltersCount: number;
  categories: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ label: string; min: number; max: number }>;
  difficulties: Array<{ value: string; label: string; count: number }>;
}

export function FilterBar({
  isVisible,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryToggle,
  selectedPriceRange,
  onPriceRangeChange,
  selectedDifficulties,
  onDifficultyToggle,
  onClearAll,
  activeFiltersCount,
  categories,
  priceRanges,
  difficulties,
}: FilterBarProps) {
  const getSelectedCategoryLabel = () => {
    if (selectedCategories.length === 0) return "All Categories";
    if (selectedCategories.length === 1) {
      const cat = categories.find(c => c.id === selectedCategories[0]);
      return cat?.name || "Category";
    }
    return `${selectedCategories.length} Categories`;
  };

  const getSelectedDifficultyLabel = () => {
    if (selectedDifficulties.length === 0) return "All Levels";
    if (selectedDifficulties.length === 1) {
      const diff = difficulties.find(d => d.value === selectedDifficulties[0]);
      return diff?.label || "Level";
    }
    return `${selectedDifficulties.length} Levels`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 shadow-md overflow-hidden"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sort By */}
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Select */}
              <Select
                value={selectedCategories[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    selectedCategories.forEach(id => onCategoryToggle(id));
                  } else {
                    onCategoryToggle(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue>{getSelectedCategoryLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Select */}
              <Select
                value={selectedPriceRange ? `${selectedPriceRange.min}-${selectedPriceRange.max}` : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    onPriceRangeChange(null);
                  } else {
                    const range = priceRanges.find(r => `${r.min}-${r.max}` === value);
                    if (range) {
                      onPriceRangeChange({ min: range.min, max: range.max });
                    }
                  }
                }}
              >
                <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue>
                    {selectedPriceRange
                      ? priceRanges.find(r => r.min === selectedPriceRange.min && r.max === selectedPriceRange.max)?.label
                      : "All Prices"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Difficulty Level Select */}
              <Select
                value={selectedDifficulties[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    selectedDifficulties.forEach(d => onDifficultyToggle(d));
                  } else {
                    onDifficultyToggle(value);
                  }
                }}
              >
                <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                  <SelectValue>{getSelectedDifficultyLabel()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear All Button */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="h-9 ml-auto text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
