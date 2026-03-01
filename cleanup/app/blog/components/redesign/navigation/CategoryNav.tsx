"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash, TrendingUp, Clock, Star, Coffee, Code,
  Palette, Database, Cloud, Lock, Cpu, Globe,
  ChevronLeft, ChevronRight, Grid3X3
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  count: number;
  icon?: React.ReactNode;
  color?: string;
  trending?: boolean;
}

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  variant?: 'pills' | 'cards' | 'matrix';
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  'All': <Grid3X3 className="w-4 h-4" />,
  'Web Development': <Globe className="w-4 h-4" />,
  'AI & ML': <Cpu className="w-4 h-4" />,
  'Design': <Palette className="w-4 h-4" />,
  'Database': <Database className="w-4 h-4" />,
  'Cloud Computing': <Cloud className="w-4 h-4" />,
  'Security': <Lock className="w-4 h-4" />,
  'Programming': <Code className="w-4 h-4" />,
  'Lifestyle': <Coffee className="w-4 h-4" />,
};

// Color mapping for categories
const categoryColors: Record<string, string> = {
  'All': 'from-gray-500 to-gray-600',
  'Web Development': 'from-blue-500 to-cyan-600',
  'AI & ML': 'from-purple-500 to-pink-600',
  'Design': 'from-orange-500 to-red-600',
  'Database': 'from-green-500 to-emerald-600',
  'Cloud Computing': 'from-sky-500 to-blue-600',
  'Security': 'from-red-500 to-rose-600',
  'Programming': 'from-indigo-500 to-purple-600',
  'Lifestyle': 'from-yellow-500 to-orange-600',
};

export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
  variant = 'pills'
}: CategoryNavProps) {
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check scroll position for showing arrows
  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setShowLeftScroll(container.scrollLeft > 0);
      setShowRightScroll(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    };

    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (variant === 'matrix') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.map((category) => {
          const icon = categoryIcons[category.name] || <Hash className="w-4 h-4" />;
          const gradient = categoryColors[category.name] || 'from-gray-500 to-gray-600';
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`relative p-4 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br ' + gradient + ' text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 hover:shadow-md border border-gray-200 dark:border-gray-700'
              }`}
            >
              {category.trending && (
                <div className="absolute -top-1 -right-1">
                  <div className="p-1 bg-red-500 rounded-full animate-pulse">
                    <TrendingUp className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {icon}
                </div>
                <span className="text-xs font-medium text-center line-clamp-1">
                  {category.name}
                </span>
                <span className={`text-xs ${
                  isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {category.count}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="relative">
        {/* Scroll Buttons */}
        <AnimatePresence>
          {showLeftScroll && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          {showRightScroll && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => {
            const icon = categoryIcons[category.name] || <Hash className="w-5 h-5" />;
            const gradient = categoryColors[category.name] || 'from-gray-500 to-gray-600';
            const isActive = activeCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(category.id)}
                className={`flex-shrink-0 relative p-4 rounded-2xl min-w-[150px] transition-all ${
                  isActive
                    ? 'bg-gradient-to-br ' + gradient + ' text-white shadow-xl'
                    : 'bg-white dark:bg-gray-800 hover:shadow-lg border border-gray-200 dark:border-gray-700'
                }`}
              >
                {category.trending && (
                  <div className="absolute -top-2 -right-2">
                    <div className="px-2 py-1 bg-red-500 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-white" />
                      <span className="text-xs text-white font-semibold">Hot</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                    <p className={`text-xs mt-1 ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {category.count} articles
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Pills variant (default)
  return (
    <div className="relative">
      {/* Scroll Buttons */}
      <AnimatePresence>
        {showLeftScroll && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}
        {showRightScroll && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pills Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category, index) => {
          const isActive = activeCategory === category.id;
          const icon = categoryIcons[category.name];

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-gray-700'
              }`}
            >
              {icon && <span className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>{icon}</span>}
              <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
              {category.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {category.count}
                </span>
              )}
              {category.trending && (
                <TrendingUp className="w-3 h-3 text-red-500" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}