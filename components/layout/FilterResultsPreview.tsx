"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  ArrowRight,
  Loader2,
  BookOpen,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseResult {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  price: number;
  category: { name: string };
  difficulty?: string;
  duration?: number;
  rating?: number;
  enrolledCount?: number;
}

interface FilterResultsPreviewProps {
  isOpen: boolean;
  selectedCategories?: string[];
  selectedPriceRange?: { min: number; max: number } | null;
  selectedDifficulties?: string[];
  onViewAll?: () => void;
}

export function FilterResultsPreview({
  isOpen,
  selectedCategories = [],
  selectedPriceRange,
  selectedDifficulties = [],
  onViewAll
}: FilterResultsPreviewProps) {
  const [results, setResults] = useState<CourseResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedPriceRange !== null ||
    selectedDifficulties.length > 0;

  // Fetch filtered results
  useEffect(() => {
    if (!isOpen || !hasActiveFilters) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        if (selectedCategories.length > 0) {
          params.append("categories", selectedCategories.join(","));
        }
        if (selectedPriceRange) {
          params.append("minPrice", selectedPriceRange.min.toString());
          params.append("maxPrice", selectedPriceRange.max.toString());
        }
        if (selectedDifficulties.length > 0) {
          params.append("difficulties", selectedDifficulties.join(","));
        }
        params.append("limit", "8"); // Fetch 8 for 2-column grid

        const response = await fetch(`/api/courses/search?${params.toString()}`);
        const data = await response.json();

        if (data.success && data.data.courses) {
          setResults(data.data.courses);
          setTotalCount(data.data.total || data.data.courses.length);
        }
      } catch (error) {
        console.error("Filter results error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300); // Debounce
    return () => clearTimeout(timer);
  }, [isOpen, selectedCategories, selectedPriceRange, selectedDifficulties, hasActiveFilters]);

  if (!isOpen || !hasActiveFilters) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {isLoading ? "Loading..." : `Found ${totalCount} Courses`}
            </h4>
            {results.length > 0 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-[10px] px-2 py-0.5">
                Preview
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            <ScrollArea className="max-h-[400px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 px-2">
                {results.map((course, index) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 p-2.5 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all duration-200 group cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                    >
                      {/* Left: Course Image */}
                      <div className="relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                        {course.imageUrl && (
                          <Image
                            src={course.imageUrl.replace(/^http:\/\//i, 'https://')}
                            alt={course.title}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        )}
                        {index === 0 && (
                          <div className="absolute -top-1 -left-1">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] shadow-lg">
                              <Sparkles className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h5 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {course.title}
                          </h5>
                          {course.price === 0 ? (
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
                              FREE
                            </Badge>
                          ) : (
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap flex-shrink-0">
                              ${course.price}
                            </span>
                          )}
                        </div>

                        {course.subtitle && (
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1 mb-1">
                            {course.subtitle}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                          {course.rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span className="font-medium">{course.rating.toFixed(1)}</span>
                            </div>
                          )}
                          {course.enrolledCount && (
                            <div className="flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5" />
                              <span>{course.enrolledCount >= 1000 ? `${(course.enrolledCount / 1000).toFixed(1)}K` : course.enrolledCount}</span>
                            </div>
                          )}
                          {course.duration && (
                            <div className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{course.duration}h</span>
                            </div>
                          )}
                        </div>

                        {/* Category & Difficulty */}
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[9px] bg-slate-100 dark:bg-slate-700 border-0 px-1.5 py-0 h-4">
                            {course.category.name}
                          </Badge>
                          {course.difficulty && (
                            <Badge variant="outline" className="text-[9px] border-slate-300 dark:border-slate-600 px-1.5 py-0 h-4">
                              {course.difficulty}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <div className="flex items-center">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </ScrollArea>

            {/* View All Button */}
            {totalCount > 8 && (
              <div className="px-2 py-2">
                <Button
                  onClick={onViewAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  View All {totalCount} Results
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              No courses found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try adjusting your filters
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
