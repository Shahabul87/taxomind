"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
}

export function CoursesNavbarResizable({
  activeFiltersCount = 0,
  filterOptions,
  selectedCategories = [],
  onCategoryToggle,
  selectedPriceRange,
  onPriceRangeChange,
  selectedDifficulties = [],
  onDifficultyToggle,
  onClearAll
}: CoursesNavbarResizableProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <SearchBar />
            </div>

            {/* Right Side: Filters + Join Button */}
            <div className="relative z-20 flex items-center gap-3">
          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-4 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-700/50 font-medium transition-all duration-200"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 h-5 min-w-5 flex items-center justify-center px-1.5">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 lg:w-[600px] p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filter Courses</h3>
                  {activeFiltersCount > 0 && onClearAll && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClearAll}
                      className="h-7 text-xs text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Clear All ({activeFiltersCount})
                    </Button>
                  )}
                </div>

                {/* Two Column Layout for Large Screens */}
                <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Categories */}
                    {filterOptions?.categories && filterOptions.categories.length > 0 && (
                      <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20">
                        <h4 className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400 mb-3 uppercase tracking-wider">
                          Categories
                        </h4>
                        <div className="space-y-1.5">
                          {filterOptions.categories.map((category) => (
                            <label
                              key={category.id}
                              className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => onCategoryToggle?.(category.id)}
                                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4"
                              />
                              <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {category.name}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 border-blue-200 dark:border-blue-800">
                                {category.count}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vertical Separator */}
                  <div className="hidden lg:block absolute left-1/2 top-16 bottom-4 w-px bg-slate-200 dark:bg-slate-700"></div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Price Range */}
                    {filterOptions?.priceRanges && filterOptions.priceRanges.length > 0 && (
                      <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <h4 className="text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400 mb-3 uppercase tracking-wider">
                          Price Range
                        </h4>
                        <div className="space-y-1.5">
                          {filterOptions.priceRanges.map((range) => (
                            <label
                              key={range.label}
                              className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors"
                            >
                              <input
                                type="radio"
                                name="priceRange"
                                checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                                onChange={() => onPriceRangeChange?.({ min: range.min, max: range.max })}
                                className="text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-600 w-4 h-4"
                              />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {range.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Difficulty */}
                    {filterOptions?.difficulties && filterOptions.difficulties.length > 0 && (
                      <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-950/20">
                        <h4 className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400 mb-3 uppercase tracking-wider">
                          Difficulty Level
                        </h4>
                        <div className="space-y-1.5">
                          {filterOptions.difficulties.map((diff) => (
                            <label
                              key={diff.value}
                              className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDifficulties.includes(diff.value)}
                                onChange={() => onDifficultyToggle?.(diff.value)}
                                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 w-4 h-4"
                              />
                              <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                                {diff.label}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/50 border-purple-200 dark:border-purple-800">
                                {diff.count}
                              </Badge>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
          <SearchBar />

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
