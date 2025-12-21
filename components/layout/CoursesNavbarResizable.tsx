"use client";

import { useState, useEffect } from "react";
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
  Filter,
  Brain,
  Zap,
  Award,
  Clock,
  Star,
  Palette,
  Lightbulb,
  Target,
  Rocket,
  ArrowRight,
  Command
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { FilterResultsPreview } from "./FilterResultsPreview";
import { useToast } from "@/components/ui/use-toast";
import { UserMenu } from "@/app/(homepage)/_components/user-menu";

interface FilterOptions {
  categories?: Array<{ id: string; name: string; count: number }>;
  priceRanges?: Array<{ label: string; min: number; max: number }>;
  difficulties?: Array<{ value: string; label: string; count: number }>;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
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
  userId?: string;
  user?: UserData;
}

// AI-Powered Smart Suggestions
const AI_SUGGESTIONS = [
  {
    id: "career-boost",
    title: "Career Accelerator",
    icon: Rocket,
    gradient: "from-violet-500 via-purple-500 to-pink-500",
    description: "Courses to advance your career",
    filters: { difficulties: ["Advanced"], categories: ["professional"] }
  },
  {
    id: "beginner-path",
    title: "Start Your Journey",
    icon: GraduationCap,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    description: "Perfect for beginners",
    filters: { difficulties: ["Beginner"], priceRange: { min: 0, max: 50 } }
  },
  {
    id: "trending-now",
    title: "Trending Topics",
    icon: TrendingUp,
    gradient: "from-orange-500 via-red-500 to-pink-500",
    description: "Most popular this week",
    filters: { sort: "popular" }
  },
  {
    id: "quick-skills",
    title: "Quick Skills",
    icon: Zap,
    gradient: "from-yellow-500 via-amber-500 to-orange-500",
    description: "Learn in under 2 hours",
    filters: { duration: { min: 0, max: 120 } }
  }
];

// Visual Difficulty Levels
const DIFFICULTY_VISUALS = {
  Beginner: {
    icon: "🌱",
    color: "from-green-400 to-emerald-500",
    bgPattern: "bg-gradient-to-br from-green-100/20 to-emerald-100/20",
    description: "Start here"
  },
  Intermediate: {
    icon: "🚀",
    color: "from-blue-400 to-indigo-500",
    bgPattern: "bg-gradient-to-br from-blue-100/20 to-indigo-100/20",
    description: "Level up"
  },
  Advanced: {
    icon: "⚡",
    color: "from-purple-400 to-violet-500",
    bgPattern: "bg-gradient-to-br from-purple-100/20 to-violet-100/20",
    description: "Challenge yourself"
  },
  Expert: {
    icon: "💎",
    color: "from-red-400 to-rose-500",
    bgPattern: "bg-gradient-to-br from-red-100/20 to-rose-100/20",
    description: "Master level"
  }
};


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
  onSearchChange,
  userId,
  user
}: CoursesNavbarResizableProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("ai");
  const [priceSliderValue, setPriceSliderValue] = useState([0, 200]);
  const [filterProgress, setFilterProgress] = useState(0);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const controls = useAnimation();
  const { toast } = useToast();

  // Sync slider value with selected price range
  useEffect(() => {
    if (selectedPriceRange) {
      setPriceSliderValue([selectedPriceRange.min, selectedPriceRange.max]);
    }
  }, [selectedPriceRange]);

  // Calculate filter completion progress
  useEffect(() => {
    const totalPossibleFilters =
      (filterOptions?.categories?.length || 0) +
      (filterOptions?.difficulties?.length || 0) +
      1; // price range
    const appliedFilters =
      selectedCategories.length +
      selectedDifficulties.length +
      (selectedPriceRange ? 1 : 0);

    const progress = totalPossibleFilters > 0
      ? (appliedFilters / totalPossibleFilters) * 100
      : 0;

    setFilterProgress(progress);
  }, [selectedCategories, selectedDifficulties, selectedPriceRange, filterOptions]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const applySuggestion = (suggestion: any) => {
    // Clear all filters first
    onClearAll?.();
    setPriceSliderValue([0, 200]); // Reset price slider

    // Apply new filters based on suggestion
    if (suggestion.filters.difficulties) {
      suggestion.filters.difficulties.forEach((d: string) => {
        if (onDifficultyToggle) onDifficultyToggle(d);
      });
    }

    if (suggestion.filters.priceRange) {
      onPriceRangeChange?.(suggestion.filters.priceRange);
      setPriceSliderValue([suggestion.filters.priceRange.min, suggestion.filters.priceRange.max]);
    }
  };

  const handlePriceSliderChange = (value: number[]) => {
    console.log('[CoursesNavbar] Price slider changed:', value);
    setPriceSliderValue(value);
    if (onPriceRangeChange) {
      onPriceRangeChange({ min: value[0], max: value[1] });
      console.log('[CoursesNavbar] Price range updated:', { min: value[0], max: value[1] });
    } else {
      console.warn('[CoursesNavbar] onPriceRangeChange is not defined!');
    }
  };

  return (
    <Navbar className="px-4 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50">
      {/* Desktop Navigation */}
      <NavBody className="gap-4">
        {(visible) => (
          <>
            {/* Logo with Animation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/"
                className="relative z-20 flex-shrink-0 text-xl md:text-2xl font-bold"
              >
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 dark:hover:from-blue-300 dark:hover:via-indigo-300 dark:hover:to-purple-300 transition-all duration-300">
                  Taxomind
                </span>
                <motion.div
                  className="absolute -top-1 -right-6 text-xs"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  ✨
                </motion.div>
              </Link>
            </motion.div>

            {/* Center: Search Bar with Glow Effect */}
            <div className={cn(
              "relative z-20 flex-1 mx-auto transition-all duration-300",
              visible ? "max-w-md" : "max-w-2xl"
            )}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full blur-lg opacity-20 animate-pulse" />
                <SearchBar
                  onSearch={onSearchChange ? (query: string) => onSearchChange(query) : undefined}
                />
              </div>
            </div>

            {/* Right Side: Unique Filter Button */}
            <div className="relative z-20 flex items-center gap-3">
              {/* Magical Filter Dropdown */}
              <DropdownMenu open={isFilterDropdownOpen} onOpenChange={setIsFilterDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-11 px-5 bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-transparent text-slate-700 dark:text-slate-200 font-medium transition-all duration-500 rounded-2xl shadow-lg hover:shadow-2xl group overflow-hidden"
                  >
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Glowing Border Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 blur-md transition-all duration-500" />

                    <div className="relative flex items-center gap-2.5">
                      {/* Animated Filter Icon */}
                      <motion.div
                        animate={{
                          rotate: activeFiltersCount > 0 ? [0, 360] : 0,
                        }}
                        transition={{
                          duration: 1,
                          ease: "easeInOut"
                        }}
                        className="relative"
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-300",
                          activeFiltersCount > 0
                            ? "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <SlidersHorizontal className={cn(
                            "h-4 w-4 transition-colors",
                            activeFiltersCount > 0
                              ? "text-white"
                              : "text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          )} />
                        </div>

                        {/* Floating Particles */}
                        {activeFiltersCount > 0 && (
                          <>
                            <motion.div
                              className="absolute -top-1 -right-1"
                              animate={{
                                y: [-2, 2, -2],
                                x: [-1, 1, -1]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <Sparkles className="w-3 h-3 text-yellow-500" />
                            </motion.div>
                          </>
                        )}
                      </motion.div>

                      <span className="font-semibold transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {activeFiltersCount > 0 ? "Filters Active" : "Filter Magic"}
                      </span>

                      {/* Active Filters Badge */}
                      {activeFiltersCount > 0 && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg">
                            {activeFiltersCount}
                          </div>
                        </motion.div>
                      )}

                      <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-all duration-300 group-data-[state=open]:rotate-180 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                {/* Unique Filter Panel Content */}
                <DropdownMenuContent
                  align="end"
                  className="w-[90vw] lg:w-[850px] p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
                  sideOffset={12}
                >
                  <div className="relative max-h-[85vh] flex flex-col">
                    {/* Animated Header with Progress */}
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 20,
                              repeat: Infinity,
                              ease: "linear"
                            }}
                            className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl"
                          >
                            <Brain className="w-5 h-5 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              AI-Powered Filter Studio
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                                BETA
                              </Badge>
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                              Smart filters that understand your learning goals
                            </p>
                          </div>
                        </div>
                        {activeFiltersCount > 0 && onClearAll && (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onClearAll();
                                setPriceSliderValue([0, 200]); // Reset price slider to default
                              }}
                              className="group h-9 px-4 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-300"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reset All
                            </Button>
                          </motion.div>
                        )}
                      </div>

                      {/* Filter Progress Bar */}
                      {filterProgress > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Filter Precision</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{Math.round(filterProgress)}%</span>
                          </div>
                          <Progress value={filterProgress} className="h-2 bg-slate-200 dark:bg-slate-700">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                              style={{ width: `${filterProgress}%` }}
                            />
                          </Progress>
                        </div>
                      )}
                    </div>

                    {/* Scrollable Content with Sections */}
                    <div className="overflow-y-auto max-h-[calc(85vh-10rem)] px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6 space-y-4 xs:space-y-5 sm:space-y-6">

                      {/* AI Suggestions Section */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <button
                          onClick={() => toggleSection("ai")}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                              <Lightbulb className="w-3.5 h-3.5 text-white" />
                            </div>
                            AI Recommendations
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs animate-pulse">
                              NEW
                            </Badge>
                          </h4>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-500 transition-transform duration-300",
                              expandedSection === "ai" && "rotate-180"
                            )}
                          />
                        </button>

                        <AnimatePresence>
                          {expandedSection === "ai" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              {AI_SUGGESTIONS.map((suggestion, index) => (
                                <motion.button
                                  key={suggestion.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  onClick={() => applySuggestion(suggestion)}
                                  className="group relative p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-transparent shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
                                >
                                  {/* Gradient Background on Hover */}
                                  <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                                    suggestion.gradient
                                  )} />

                                  <div className="relative flex items-start gap-3">
                                    <div className={cn(
                                      "p-2.5 bg-gradient-to-br rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300",
                                      suggestion.gradient
                                    )}>
                                      <suggestion.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-bold text-sm text-slate-900 dark:text-white mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                                        {suggestion.title}
                                      </h5>
                                      <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {suggestion.description}
                                      </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                  </div>
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                      {/* Visual Categories with Tag Cloud */}
                      {filterOptions?.categories && filterOptions.categories.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="space-y-4"
                        >
                          <button
                            onClick={() => toggleSection("categories")}
                            className="w-full flex items-center justify-between text-left group"
                          >
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                                <Grid3X3 className="w-3.5 h-3.5 text-white" />
                              </div>
                              Categories Cloud
                              {selectedCategories.length > 0 && (
                                <div className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                  {selectedCategories.length}
                                </div>
                              )}
                            </h4>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-slate-500 transition-transform duration-300",
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
                                className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 rounded-2xl"
                              >
                                <div className="flex flex-wrap gap-2">
                                  {filterOptions.categories.map((category, index) => {
                                    const isSelected = selectedCategories.includes(category.id);
                                    const size = Math.min(100 + category.count * 2, 150);

                                    return (
                                      <motion.button
                                        key={category.id}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                          delay: index * 0.02,
                                          type: "spring",
                                          stiffness: 300
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCategoryToggle?.(category.id)}
                                        className={cn(
                                          "relative px-4 py-2 rounded-full font-medium transition-all duration-300",
                                          isSelected
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md"
                                        )}
                                        style={{
                                          fontSize: `${Math.min(12 + category.count / 10, 14)}px`
                                        }}
                                      >
                                        <span className="relative z-10">{category.name}</span>
                                        <Badge
                                          className={cn(
                                            "ml-2 text-[10px] px-1.5 py-0 h-4",
                                            isSelected
                                              ? "bg-white/20 text-white border-white/20"
                                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-0"
                                          )}
                                        >
                                          {category.count}
                                        </Badge>
                                        {isSelected && (
                                          <motion.div
                                            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 blur-lg opacity-50"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                          />
                                        )}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}

                      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                      {/* Visual Price Slider */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                      >
                        <button
                          onClick={() => toggleSection("price")}
                          className="w-full flex items-center justify-between text-left group"
                        >
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                              <DollarSign className="w-3.5 h-3.5 text-white" />
                            </div>
                            Price Range
                            {selectedPriceRange && (
                              <Badge className="bg-emerald-500 text-white border-0 text-xs">
                                ${selectedPriceRange.min} - ${selectedPriceRange.max}
                              </Badge>
                            )}
                          </h4>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 text-slate-500 transition-transform duration-300",
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
                              className="p-5 bg-gradient-to-br from-emerald-50 to-green-50/30 dark:from-emerald-900/20 dark:to-green-900/10 rounded-2xl"
                            >
                              <div className="space-y-4">
                                {/* Quick Price Options */}
                                <div className="flex gap-2">
                                  {[
                                    { label: "Free", value: [0, 0] },
                                    { label: "Under $50", value: [0, 50] },
                                    { label: "Under $100", value: [0, 100] },
                                    { label: "All Prices", value: [0, 500] }
                                  ].map((option) => (
                                    <motion.button
                                      key={option.label}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setPriceSliderValue(option.value);
                                        handlePriceSliderChange(option.value);
                                      }}
                                      className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                                        priceSliderValue[0] === option.value[0] && priceSliderValue[1] === option.value[1]
                                          ? "bg-emerald-500 text-white shadow-md"
                                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                                      )}
                                    >
                                      {option.label}
                                    </motion.button>
                                  ))}
                                </div>

                                {/* Visual Slider */}
                                <div className="space-y-3">
                                  <div className="relative px-3">
                                    <Slider
                                      value={priceSliderValue}
                                      onValueChange={handlePriceSliderChange}
                                      min={0}
                                      max={500}
                                      step={10}
                                      className="w-full"
                                    />
                                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                      <span>$0</span>
                                      <span>$500+</span>
                                    </div>
                                  </div>

                                  {/* Price Display */}
                                  <div className="mt-8 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        ${priceSliderValue[0]}
                                      </span>
                                      <span className="text-slate-400">-</span>
                                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                        ${priceSliderValue[1] === 500 ? "500+" : priceSliderValue[1]}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

                      {/* Visual Difficulty Cards */}
                      {filterOptions?.difficulties && filterOptions.difficulties.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="space-y-4"
                        >
                          <button
                            onClick={() => toggleSection("difficulty")}
                            className="w-full flex items-center justify-between text-left group"
                          >
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg">
                                <BarChart3 className="w-3.5 h-3.5 text-white" />
                              </div>
                              Difficulty Level
                              {selectedDifficulties.length > 0 && (
                                <div className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                                  {selectedDifficulties.length}
                                </div>
                              )}
                            </h4>
                            <ChevronDown
                              className={cn(
                                "w-4 h-4 text-slate-500 transition-transform duration-300",
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
                                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                              >
                                {filterOptions.difficulties.map((diff, index) => {
                                  const visual = DIFFICULTY_VISUALS[diff.value as keyof typeof DIFFICULTY_VISUALS];
                                  const isSelected = selectedDifficulties.includes(diff.value);

                                  return (
                                    <motion.button
                                      key={diff.value}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      whileHover={{ scale: 1.05, y: -5 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => onDifficultyToggle?.(diff.value)}
                                      className={cn(
                                        "relative p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                                        isSelected
                                          ? "border-transparent shadow-xl"
                                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg"
                                      )}
                                    >
                                      {/* Background Pattern */}
                                      <div className={cn(
                                        "absolute inset-0",
                                        isSelected ? `bg-gradient-to-br ${visual.color}` : visual.bgPattern
                                      )} />

                                      {/* Content */}
                                      <div className="relative text-center space-y-2">
                                        <motion.div
                                          animate={isSelected ? { rotate: [0, 360] } : {}}
                                          transition={{ duration: 1 }}
                                          className="text-3xl"
                                        >
                                          {visual.icon}
                                        </motion.div>
                                        <div>
                                          <div className={cn(
                                            "font-bold text-sm mb-0.5",
                                            isSelected ? "text-white" : "text-slate-900 dark:text-white"
                                          )}>
                                            {diff.label}
                                          </div>
                                          <div className={cn(
                                            "text-xs",
                                            isSelected ? "text-white/80" : "text-slate-600 dark:text-slate-400"
                                          )}>
                                            {visual.description}
                                          </div>
                                        </div>
                                        <Badge
                                          className={cn(
                                            "text-[10px] px-1.5 py-0",
                                            isSelected
                                              ? "bg-white/20 text-white border-white/20"
                                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-0"
                                          )}
                                        >
                                          {diff.count} courses
                                        </Badge>
                                      </div>

                                      {/* Selection Indicator */}
                                      {isSelected && (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="absolute top-2 right-2"
                                        >
                                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                                            <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                          </div>
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}

                      {/* Filter Results Preview */}
                      <FilterResultsPreview
                        isOpen={activeFiltersCount > 0}
                        selectedCategories={selectedCategories}
                        selectedPriceRange={selectedPriceRange}
                        selectedDifficulties={selectedDifficulties}
                        onViewAll={() => {
                          console.log('[CoursesNavbar] View All clicked from preview');
                          // Close dropdown and let filters apply
                          setIsFilterDropdownOpen(false);
                        }}
                      />
                    </div>

                    {/* Apply Filters Footer */}
                    <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Command className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">⌘K</kbd> for quick search
                          </span>
                        </div>
                        <Button
                          type="button"
                          className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={activeFiltersCount === 0}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[CoursesNavbar] Apply Filters clicked', {
                              activeFiltersCount,
                              selectedCategories,
                              selectedDifficulties,
                              selectedPriceRange
                            });

                            // Show success toast
                            toast({
                              title: "Filters Applied!",
                              description: `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied successfully`,
                              duration: 2000,
                            });

                            // Close the dropdown after applying filters
                            setIsFilterDropdownOpen(false);

                            // Scroll to results after closing
                            setTimeout(() => {
                              const resultsSection = document.querySelector('[data-results-section]');
                              if (resultsSection) {
                                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
                        >
                          {activeFiltersCount === 0 ? 'Select Filters Above' : `Apply ${activeFiltersCount} Filter${activeFiltersCount > 1 ? 's' : ''}`}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Authentication Section */}
              {userId && user ? (
                // Show User Menu for logged-in users
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <UserMenu user={user} />
                </motion.div>
              ) : (
                // Show Join Free button for guests
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    asChild
                    className="h-10 px-6 rounded-full font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                  >
                    <Link href="/auth/register">
                      <span className="relative z-10">Join Free</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
                    </Link>
                  </Button>
                </motion.div>
              )}
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

          {/* Mobile Filter Magic - Full Featured */}
          <div className="w-full pt-4">
            {/* Filter Magic Header */}
            <div className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg shadow-lg"
                  >
                    <Brain className="w-4 h-4 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      Filter Magic
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-[10px] px-1.5">
                        BETA
                      </Badge>
                    </h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400">
                      AI-powered course filtering
                    </p>
                  </div>
                </div>
                {activeFiltersCount > 0 && onClearAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClearAll();
                      setPriceSliderValue([0, 200]);
                    }}
                    className="h-7 px-2 text-xs bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded-lg"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Filter Progress */}
              {filterProgress > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-600 dark:text-slate-400">Precision</span>
                    <span className="font-bold text-slate-900 dark:text-white">{Math.round(filterProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${filterProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Filters */}
            <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
              {/* AI Suggestions */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("ai")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-purple-500" />
                    AI Recommendations
                  </h4>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedSection === "ai" && "rotate-180")} />
                </button>

                {expandedSection === "ai" && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {AI_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => applySuggestion(suggestion)}
                        className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all text-left"
                      >
                        <div className={cn("p-1.5 bg-gradient-to-br rounded-lg mb-1.5 inline-flex", suggestion.gradient)}>
                          <suggestion.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 dark:text-white mb-0.5">
                          {suggestion.title}
                        </div>
                        <div className="text-[9px] text-slate-600 dark:text-slate-400 line-clamp-1">
                          {suggestion.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Categories */}
              {filterOptions?.categories && filterOptions.categories.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection("categories")}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Grid3X3 className="w-3 h-3 text-blue-500" />
                      Categories
                      {selectedCategories.length > 0 && (
                        <Badge className="bg-blue-500 text-white border-0 text-[9px] h-4 px-1.5">
                          {selectedCategories.length}
                        </Badge>
                      )}
                    </h4>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedSection === "categories" && "rotate-180")} />
                  </button>

                  {expandedSection === "categories" && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {filterOptions.categories.map((category) => {
                        const isSelected = selectedCategories.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            onClick={() => onCategoryToggle?.(category.id)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                              isSelected
                                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {category.name}
                            {isSelected && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Price Range */}
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("price")}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    Price Range
                    {selectedPriceRange && (
                      <Badge className="bg-emerald-500 text-white border-0 text-[9px] h-4 px-1.5">
                        ${selectedPriceRange.min}-${selectedPriceRange.max}
                      </Badge>
                    )}
                  </h4>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedSection === "price" && "rotate-180")} />
                </button>

                {expandedSection === "price" && (
                  <div className="pt-2 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Free", value: [0, 0] },
                        { label: "<$50", value: [0, 50] },
                        { label: "<$100", value: [0, 100] },
                        { label: "All", value: [0, 500] }
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            setPriceSliderValue(option.value);
                            handlePriceSliderChange(option.value);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                            priceSliderValue[0] === option.value[0] && priceSliderValue[1] === option.value[1]
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="px-2">
                      <Slider
                        value={priceSliderValue}
                        onValueChange={handlePriceSliderChange}
                        min={0}
                        max={500}
                        step={10}
                        className="w-full"
                      />
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ${priceSliderValue[0]}
                        </span>
                        <span className="text-xs text-slate-400">-</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          ${priceSliderValue[1] === 500 ? "500+" : priceSliderValue[1]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Difficulty */}
              {filterOptions?.difficulties && filterOptions.difficulties.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection("difficulty")}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3 text-purple-500" />
                      Difficulty
                      {selectedDifficulties.length > 0 && (
                        <Badge className="bg-purple-500 text-white border-0 text-[9px] h-4 px-1.5">
                          {selectedDifficulties.length}
                        </Badge>
                      )}
                    </h4>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expandedSection === "difficulty" && "rotate-180")} />
                  </button>

                  {expandedSection === "difficulty" && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {filterOptions.difficulties.map((diff) => {
                        const visual = DIFFICULTY_VISUALS[diff.value as keyof typeof DIFFICULTY_VISUALS];
                        const isSelected = selectedDifficulties.includes(diff.value);
                        return (
                          <button
                            key={diff.value}
                            onClick={() => onDifficultyToggle?.(diff.value)}
                            className={cn(
                              "p-2.5 rounded-xl border-2 transition-all text-center",
                              isSelected
                                ? `border-transparent bg-gradient-to-br ${visual.color}`
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            )}
                          >
                            <div className="text-xl mb-1">{visual.icon}</div>
                            <div className={cn("text-[11px] font-bold", isSelected ? "text-white" : "text-slate-900 dark:text-white")}>
                              {diff.label}
                            </div>
                            <div className={cn("text-[9px]", isSelected ? "text-white/80" : "text-slate-600 dark:text-slate-400")}>
                              {visual.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions - Only show for non-logged-in users */}
          {!userId && (
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
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}