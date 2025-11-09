"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  SlidersHorizontal,
  X,
  Sparkles,
  TrendingUp,
  GraduationCap,
  DollarSign,
  BarChart3,
  Grid3X3,
  CheckCircle2,
  Filter
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Navbar,
  NavBody,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/resizable-navbar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FilterResultsPreview } from "./FilterResultsPreview";

interface FilterOptions {
  categories?: Array<{ id: string; name: string; count: number }>;
  priceRanges?: Array<{ label: string; min: number; max: number }>;
  difficulties?: Array<{ value: string; label: string; count: number }>;
}

interface CoursesNavbarResizableProps {
  activeFiltersCount?: number;
  filterOptions?: FilterOptions;
  selectedCategories?: string[];
  onCategoryToggle?: (categoryId: string) => void;
  selectedPriceRange?: { min: number; max: number } | null;
  onPriceRangeChange?: (range: { min: number; max: number } | null) => void;
  selectedDifficulties?: string[];
  onDifficultyToggle?: (difficulty: string) => void;
  onClearAll?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

// Smart Filter Presets
const FILTER_PRESETS = [
  {
    id: "popular",
    label: "Most Popular",
    icon: TrendingUp,
    gradient: "from-orange-500 to-red-500",
    description: "Top rated & high enrollments"
  },
  {
    id: "free",
    label: "Free Courses",
    icon: Sparkles,
    gradient: "from-emerald-500 to-teal-500",
    description: "100% free to learn"
  },
  {
    id: "beginner",
    label: "Beginner Friendly",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-500",
    description: "Perfect for newcomers"
  },
  {
    id: "quick",
    label: "Quick Wins",
    icon: CheckCircle2,
    gradient: "from-purple-500 to-pink-500",
    description: "Short & impactful"
  }
];

export function CoursesNavbarResizable({
  activeFiltersCount = 0,
  filterOptions,
  selectedCategories = [],
  onCategoryToggle,
  selectedPriceRange,
  onPriceRangeChange,
  selectedDifficulties = [],
  onDifficultyToggle,
  onClearAll,
  searchQuery = "",
  onSearchChange
}: CoursesNavbarResizableProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("presets");

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const applyPreset = (presetId: string) => {
    // Clear all existing filters first
    onClearAll?.();

    // Apply smart preset filters
    switch (presetId) {
      case "free":
        // Set price to free courses only
        onPriceRangeChange?.({ min: 0, max: 0 });
        break;
      case "beginner":
        // Select only Beginner difficulty
        if (onDifficultyToggle && !selectedDifficulties.includes("Beginner")) {
          onDifficultyToggle("Beginner");
        }
        break;
      case "popular":
        // This would ideally trigger a sort by enrollment/rating
        // For now, we can just clear filters to show all popular courses
        break;
      case "quick":
        // This would ideally filter by duration < 2 hours
        // You could extend filterOptions to include duration ranges
        break;
    }
  };

  return (
    <Navbar className="px-4">
      {/* Desktop Navigation */}
      <NavBody className="gap-4">
        {(visible) => (
          <>
            {/* Logo */}
            <Link
              href="/"
              className="relative z-20 flex-shrink-0 text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-300 dark:hover:to-indigo-300 transition-all duration-300"
            >
              Taxomind
            </Link>

            {/* Center: Search Bar - Reduced width when navbar is resized */}
            <div className={cn(
              "relative z-20 flex-1 mx-auto transition-all duration-300",
              visible ? "max-w-md" : "max-w-2xl"
            )}>
              <SearchBar
                onSearch={onSearchChange ? (query: string) => onSearchChange(query) : undefined}
              />
            </div>

            {/* Right Side: Filters + Join Button */}
            <div className="relative z-20 flex items-center gap-3">
              {/* Professional Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-10 px-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 font-medium transition-all duration-300 rounded-lg shadow-sm hover:shadow-md group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <SlidersHorizontal className="h-4 w-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        {activeFiltersCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full ring-2 ring-white dark:ring-slate-800"
                          />
                        )}
                      </div>
                      <span>Filters</span>
                      {activeFiltersCount > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-md shadow-md">
                            {activeFiltersCount}
                          </div>
                        </motion.div>
                      )}
                      <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200 group-data-[state=open]:rotate-180" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[90vw] lg:w-[750px] p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden"
                  sideOffset={8}
                >
                  <div className="relative max-h-[85vh] flex flex-col">
                    {/* Professional Header */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl shadow-lg ring-4 ring-blue-500/10 dark:ring-blue-400/10">
                            <Filter className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Filter Courses
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {activeFiltersCount > 0
                                ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active`
                                : 'Select filters to refine results'
                              }
                            </p>
                          </div>
                        </div>
                        {activeFiltersCount > 0 && onClearAll && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            className="h-8 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 rounded-lg transition-all duration-200 border border-transparent hover:border-red-600"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Clear All
                          </Button>
                        )}
                      </div>

                      {/* Active Filters Tags */}
                      {activeFiltersCount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/20 dark:border-slate-700/30"
                        >
                          {selectedCategories.map((catId) => {
                            const category = filterOptions?.categories?.find(c => c.id === catId);
                            return category ? (
                              <Badge
                                key={catId}
                                className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300/30 dark:border-blue-600/30 hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all duration-200 pl-2 pr-1 py-1 rounded-lg"
                              >
                                {category.name}
                                <button
                                  onClick={() => onCategoryToggle?.(catId)}
                                  className="ml-1.5 hover:bg-blue-600/20 rounded p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                          {selectedDifficulties.map((diff) => (
                            <Badge
                              key={diff}
                              className="bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300/30 dark:border-purple-600/30 hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all duration-200 pl-2 pr-1 py-1 rounded-lg"
                            >
                              {diff}
                              <button
                                onClick={() => onDifficultyToggle?.(diff)}
                                className="ml-1.5 hover:bg-purple-600/20 rounded p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          {selectedPriceRange && (
                            <Badge className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300/30 dark:border-emerald-600/30 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 transition-all duration-200 pl-2 pr-1 py-1 rounded-lg">
                              {selectedPriceRange.min === 0 && selectedPriceRange.max === 0 ? "Free" : `$${selectedPriceRange.min}-$${selectedPriceRange.max}`}
                              <button
                                onClick={() => onPriceRangeChange?.(null)}
                                className="ml-1.5 hover:bg-emerald-600/20 rounded p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto max-h-[calc(85vh-8rem)] px-6 py-5 space-y-5">
                      {/* Smart Presets Section */}
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleSection("presets")}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            Quick Presets
                          </h4>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                              expandedSection === "presets" && "rotate-180"
                            )}
                          />
                        </button>

                        <AnimatePresence>
                          {expandedSection === "presets" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="grid grid-cols-2 gap-3"
                            >
                              {FILTER_PRESETS.map((preset, index) => (
                                <motion.button
                                  key={preset.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => applyPreset(preset.id)}
                                  className="group relative p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                                >
                                  {/* Content */}
                                  <div className="flex items-start gap-3">
                                    <div className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                      <preset.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-sm text-slate-900 dark:text-white mb-0.5">
                                        {preset.label}
                                      </h5>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {preset.description}
                                      </p>
                                    </div>
                                  </div>
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

                      {/* Advanced Filters - Two Column Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Categories Filter */}
                        {filterOptions?.categories && filterOptions.categories.length > 0 && (
                          <div className="space-y-3">
                            <button
                              onClick={() => toggleSection("categories")}
                              className="w-full flex items-center justify-between text-left group"
                            >
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Grid3X3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Categories
                                {selectedCategories.length > 0 && (
                                  <Badge className="bg-blue-600 dark:bg-blue-500 text-white border-0 text-xs">
                                    {selectedCategories.length}
                                  </Badge>
                                )}
                              </h4>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                                  expandedSection === "categories" && "rotate-180"
                                )}
                              />
                            </button>

                            <AnimatePresence>
                              {expandedSection === "categories" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                                >
                                  {/* Horizontal Scrolling Container */}
                                  <div className="overflow-x-auto overflow-y-hidden pb-2">
                                    <div className="flex gap-2 min-w-max">
                                      {filterOptions.categories.map((category, index) => (
                                        <motion.button
                                          key={category.id}
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ delay: index * 0.03 }}
                                          onClick={() => onCategoryToggle?.(category.id)}
                                          className={cn(
                                            "relative flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 border whitespace-nowrap",
                                            selectedCategories.includes(category.id)
                                              ? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-md"
                                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                          )}
                                        >
                                          {selectedCategories.includes(category.id) && (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                          )}
                                          <span className="text-sm font-medium">
                                            {category.name}
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "text-[10px] border-0 px-1.5 py-0 h-4",
                                              selectedCategories.includes(category.id)
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                            )}
                                          >
                                            {category.count}
                                          </Badge>
                                        </motion.button>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Scroll Indicator */}
                                  {filterOptions.categories.length > 3 && (
                                    <div className="flex justify-center mt-2 gap-1">
                                      <div className="h-1 w-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                      <div className="h-1 w-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                      <div className="h-1 w-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Price Range Filter */}
                        {filterOptions?.priceRanges && filterOptions.priceRanges.length > 0 && (
                          <div className="space-y-3">
                            <button
                              onClick={() => toggleSection("price")}
                              className="w-full flex items-center justify-between text-left group"
                            >
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                Price Range
                                {selectedPriceRange && (
                                  <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white border-0 text-xs">
                                    Set
                                  </Badge>
                                )}
                              </h4>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                                  expandedSection === "price" && "rotate-180"
                                )}
                              />
                            </button>

                            <AnimatePresence>
                              {expandedSection === "price" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2"
                                >
                                  {filterOptions.priceRanges.map((range, index) => (
                                    <motion.label
                                      key={range.label}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.03 }}
                                      className={cn(
                                        "flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg transition-all duration-200 border",
                                        selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                          ? "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 shadow-md"
                                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                      )}
                                    >
                                      <div className={cn(
                                        "w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                        selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                          ? "border-white bg-white"
                                          : "border-slate-300 dark:border-slate-600"
                                      )}>
                                        {selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max && (
                                          <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
                                        )}
                                      </div>
                                      <input
                                        type="radio"
                                        name="priceRange"
                                        checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                                        onChange={() => onPriceRangeChange?.({ min: range.min, max: range.max })}
                                        className="sr-only"
                                      />
                                      <span className={cn(
                                        "flex-1 text-sm font-medium transition-colors",
                                        selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                          ? "text-white"
                                          : "text-slate-700 dark:text-slate-300"
                                      )}>
                                        {range.label}
                                      </span>
                                      {range.min === 0 && range.max === 0 && (
                                        <Sparkles className={cn(
                                          "w-3.5 h-3.5",
                                          selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                            ? "text-white"
                                            : "text-emerald-600 dark:text-emerald-400"
                                        )} />
                                      )}
                                    </motion.label>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        {/* Difficulty Filter */}
                        {filterOptions?.difficulties && filterOptions.difficulties.length > 0 && (
                          <div className="space-y-3 lg:col-span-2">
                            <button
                              onClick={() => toggleSection("difficulty")}
                              className="w-full flex items-center justify-between text-left group"
                            >
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                Difficulty Level
                                {selectedDifficulties.length > 0 && (
                                  <Badge className="bg-purple-600 dark:bg-purple-500 text-white border-0 text-xs">
                                    {selectedDifficulties.length}
                                  </Badge>
                                )}
                              </h4>
                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200",
                                  expandedSection === "difficulty" && "rotate-180"
                                )}
                              />
                            </button>

                            <AnimatePresence>
                              {expandedSection === "difficulty" && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                                >
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                    {filterOptions.difficulties.map((diff, index) => (
                                      <motion.button
                                        key={diff.value}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onDifficultyToggle?.(diff.value)}
                                        className={cn(
                                          "relative flex flex-col items-center gap-2.5 p-3 rounded-lg transition-all duration-200 border",
                                          selectedDifficulties.includes(diff.value)
                                            ? "bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500 shadow-md"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                                        )}
                                      >
                                        <div className={cn(
                                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                          selectedDifficulties.includes(diff.value)
                                            ? "bg-white/20"
                                            : "bg-slate-100 dark:bg-slate-700"
                                        )}>
                                          <BarChart3 className={cn(
                                            "w-5 h-5 transition-colors",
                                            selectedDifficulties.includes(diff.value)
                                              ? "text-white"
                                              : "text-purple-600 dark:text-purple-400"
                                          )} />
                                        </div>
                                        <div className="text-center w-full">
                                          <span className={cn(
                                            "text-xs font-semibold block mb-1",
                                            selectedDifficulties.includes(diff.value)
                                              ? "text-white"
                                              : "text-slate-900 dark:text-white"
                                          )}>
                                            {diff.label}
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "text-[10px] border-0 px-1.5 py-0 h-4",
                                              selectedDifficulties.includes(diff.value)
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                            )}
                                          >
                                            {diff.count}
                                          </Badge>
                                        </div>
                                        {selectedDifficulties.includes(diff.value) && (
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            className="absolute -top-1.5 -right-1.5"
                                          >
                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                            </div>
                                          </motion.div>
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Filter Results Preview */}
                    <FilterResultsPreview
                      isOpen={true}
                      selectedCategories={selectedCategories}
                      selectedPriceRange={selectedPriceRange}
                      selectedDifficulties={selectedDifficulties}
                      onViewAll={() => {
                        // Close dropdown and navigate to filtered results
                        const params = new URLSearchParams();
                        if (selectedCategories.length > 0) {
                          params.set("categories", selectedCategories.join(","));
                        }
                        if (selectedPriceRange) {
                          params.set("minPrice", selectedPriceRange.min.toString());
                          params.set("maxPrice", selectedPriceRange.max.toString());
                        }
                        if (selectedDifficulties.length > 0) {
                          params.set("difficulties", selectedDifficulties.join(","));
                        }
                        window.location.href = `/courses?${params.toString()}`;
                      }}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

          {/* Join Button */}
          <Button
            asChild
            className="h-9 px-6 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/auth/register">Join for Free</Link>
          </Button>
            </div>
          </>
        )}
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
          >
            Taxomind
          </Link>

          {/* Mobile Toggle */}
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        {/* Mobile Menu */}
        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {/* Mobile Search */}
          <SearchBar
            onSearch={onSearchChange ? (query: string) => onSearchChange(query) : undefined}
          />

          {/* Mobile Actions */}
          <div className="flex w-full flex-col gap-2 pt-2">
            <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full h-10 font-medium text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
              >
                Log In
              </Button>
            </Link>
            <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full h-10 rounded-full font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                Join for Free
              </Button>
            </Link>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
