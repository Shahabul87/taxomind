"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertCircle,
  Brain,
  Rocket,
  Zap,
  Sparkles,
  Globe,
  LayoutGrid,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCategory {
  name: string;
  count: number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface AINewsSidebarProps {
  categories: NewsCategory[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  totalArticles: number;
  trendingTopics: string[];
  categoryCounts?: Record<string, number>;
}

export function AINewsSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  totalArticles,
  trendingTopics,
  categoryCounts = {}
}: AINewsSidebarProps) {

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      'Breaking': AlertCircle,
      'Research': Brain,
      'Industry': Rocket,
      'Technology': Zap,
      'Education': Sparkles,
      'Policy': Globe,
    };
    return icons[name] || LayoutGrid;
  };

  const getCategoryColor = (name: string) => {
    const colors: Record<string, { text: string; bg: string; border: string; activeBg: string }> = {
      'Breaking': {
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        border: 'border-rose-200 dark:border-rose-500/30',
        activeBg: 'bg-rose-100 dark:bg-rose-500/20'
      },
      'Research': {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        border: 'border-blue-200 dark:border-blue-500/30',
        activeBg: 'bg-blue-100 dark:bg-blue-500/20'
      },
      'Industry': {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        border: 'border-emerald-200 dark:border-emerald-500/30',
        activeBg: 'bg-emerald-100 dark:bg-emerald-500/20'
      },
      'Technology': {
        text: 'text-violet-600 dark:text-violet-400',
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        border: 'border-violet-200 dark:border-violet-500/30',
        activeBg: 'bg-violet-100 dark:bg-violet-500/20'
      },
      'Education': {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        border: 'border-amber-200 dark:border-amber-500/30',
        activeBg: 'bg-amber-100 dark:bg-amber-500/20'
      },
      'Policy': {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-500/10',
        border: 'border-orange-200 dark:border-orange-500/30',
        activeBg: 'bg-orange-100 dark:bg-orange-500/20'
      }
    };
    return colors[name] || {
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-700/50',
      border: 'border-slate-200 dark:border-slate-700',
      activeBg: 'bg-slate-100 dark:bg-slate-700'
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <aside className="space-y-6">
      {/* Categories Section */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            News Categories
          </h3>
        </div>

        <motion.div
          className="p-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* All News Option */}
          <motion.button
            variants={itemVariants}
            onClick={() => onCategoryChange('all')}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 mb-2",
              selectedCategory === 'all'
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg",
                selectedCategory === 'all'
                  ? "bg-white/20 dark:bg-slate-900/20"
                  : "bg-slate-200 dark:bg-slate-600"
              )}>
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">All News</span>
            </div>
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold",
              selectedCategory === 'all'
                ? "bg-white/20 dark:bg-slate-900/20"
                : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
            )}>
              {totalArticles}
            </span>
          </motion.button>

          {/* Category Options */}
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const colors = getCategoryColor(category.name);
            const isActive = selectedCategory === category.name;
            // Use actual count from categoryCounts, fallback to 0
            const actualCount = categoryCounts[category.name] ?? 0;

            return (
              <motion.button
                key={category.name}
                variants={itemVariants}
                onClick={() => onCategoryChange(category.name)}
                className={cn(
                  "w-full text-left p-3 rounded-xl transition-all duration-200 mb-1.5 last:mb-0 border",
                  isActive
                    ? cn(colors.activeBg, colors.border, colors.text)
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                      isActive ? colors.bg : "bg-slate-100 dark:bg-slate-700/50"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        isActive ? colors.text : "text-slate-500 dark:text-slate-400"
                      )} />
                    </div>
                    <span className={cn(
                      "font-semibold text-sm",
                      isActive ? colors.text : "text-slate-700 dark:text-slate-300"
                    )}>
                      {category.name}
                    </span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold",
                    isActive
                      ? cn(colors.bg, colors.text)
                      : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                  )}>
                    {actualCount}
                  </span>
                </div>
                <p className={cn(
                  "text-xs pl-12",
                  isActive ? "text-slate-600 dark:text-slate-400" : "text-slate-500 dark:text-slate-500"
                )}>
                  {category.description}
                </p>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Trending Topics Section */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Trending Topics
            </h3>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {topic}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-2xl p-5 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            Stay Updated
          </h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Get personalized AI news delivered to your inbox every morning.
        </p>
        <button className="w-full py-2.5 px-4 bg-white dark:bg-slate-100 text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white transition-colors">
          Subscribe to Newsletter
        </button>
      </div>
    </aside>
  );
}
