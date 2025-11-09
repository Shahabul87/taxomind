"use client";

import { Search, Clock, Star, Users, BookOpen, ArrowRight, Loader2, X } from "lucide-react";
import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

interface SearchResult {
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
  instructor?: { name: string };
}

export function SearchBar({
  placeholder = "What do you want to learn?",
  className,
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        // Fetch 8 results for 2-column grid (4 rows × 2 columns)
        const response = await fetch(`/api/courses/search?search=${encodeURIComponent(query)}&limit=8`);
        const data = await response.json();

        if (data.success && data.data.courses) {
          // Results are already sorted by relevance from the API
          // The most matched courses will appear first (top-left to bottom-right)
          setResults(data.data.courses);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setIsOpen(false);

      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/courses?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleResultClick = (courseId: string) => {
    setIsOpen(false);
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            className="w-full h-11 pl-12 pr-12 text-base rounded-full bg-white/90 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
            aria-label="Search courses"
          />
          <button
            type="submit"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            aria-label="Submit search"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Results Dropdown - Centered Below Search Bar */}
      <AnimatePresence>
        {isOpen && (query.length >= 2 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-3 left-0 right-0 mx-auto w-[95vw] max-w-3xl z-50"
          >
            <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-2xl overflow-hidden">
              <ScrollArea className="max-h-[600px]">
                <div className="p-2">
                  {/* Recent Searches */}
                  {query.length < 2 && recentSearches.length > 0 && (
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Recent Searches
                        </h4>
                        <button
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem("recentSearches");
                          }}
                          className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setQuery(search);
                              onSearch?.(search);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {query.length >= 2 && (
                    <>
                      {results.length > 0 ? (
                        <div className="space-y-2">
                          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                Found {results.length} Results
                              </h4>
                              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 text-[10px] px-2 py-0.5">
                                Best Matches
                              </Badge>
                            </div>
                          </div>

                          {/* Two Column Grid Layout */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 px-2">
                            {results.map((course, index) => (
                              <Link
                                key={course.id}
                                href={`/courses/${course.id}`}
                                onClick={() => handleResultClick(course.id)}
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
                                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-[10px] shadow-lg">
                                          🏆
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

                          {/* View All Results */}
                          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                              onClick={() => {
                                handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              View All Results
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : !isLoading && (
                        <div className="px-3 py-8 text-center">
                          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            No courses found
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Try searching with different keywords
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
