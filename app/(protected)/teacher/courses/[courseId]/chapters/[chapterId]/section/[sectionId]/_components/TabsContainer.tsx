"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, BookOpen, Calculator, Code2, FileQuestion, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

// Import modular tab components
import { VideoTab, BlogTab, MathTab, CodeTab } from "./tabs";
// Import shared types from enterprise-section-types
import type {
  CodeExplanation,
  MathExplanation,
  SectionVideo,
  SectionBlog,
  SectionArticle,
  SectionNote
} from "./enterprise-section-types";

interface Section {
  id: string;
  title: string;
  position: number;
  isPublished: boolean;
  videos?: SectionVideo[];
  blogs?: SectionBlog[];
  articles?: SectionArticle[];
  notes?: SectionNote[];
  codeExplanations?: CodeExplanation[];
  mathExplanations?: MathExplanation[];
}

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

interface SectionInitialData {
  chapter: Chapter;
  codeExplanations: CodeExplanation[];
  mathExplanations: MathExplanation[];
  videos: SectionVideo[];
  blogs: SectionBlog[];
  articles: SectionArticle[];
  notes: SectionNote[];
  [key: string]: unknown;
}

interface TabsContainerProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: SectionInitialData;
}

// Tab count badge component
interface TabCountBadgeProps {
  count: number;
  isActive: boolean;
}

const TabCountBadge = ({ count, isActive }: TabCountBadgeProps) => {
  if (count === 0) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "ml-1 px-1.5 py-0 h-4 sm:h-5 min-w-[18px] sm:min-w-[20px] text-[9px] sm:text-[10px] font-semibold",
        "flex items-center justify-center",
        isActive
          ? "bg-white/25 text-white border-0"
          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-0"
      )}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
};

export const TabsContainer = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: TabsContainerProps) => {
  const [activeTab, setActiveTab] = useState("videos");
  const [isMounted, setIsMounted] = useState(false);

  // Create a unique key for localStorage based on the current section
  const storageKey = `activeTab_${courseId}_${chapterId}_${sectionId}`;

  // Calculate counts for each tab
  const tabCounts = useMemo(() => ({
    videos: initialData.videos?.length || 0,
    blogs: initialData.blogs?.length || 0,
    math: initialData.mathExplanations?.length || 0,
    code: initialData.codeExplanations?.length || 0,
  }), [initialData.videos, initialData.blogs, initialData.mathExplanations, initialData.codeExplanations]);

  // Calculate total content count
  const totalContent = useMemo(() =>
    Object.values(tabCounts).reduce((sum, count) => sum + count, 0),
    [tabCounts]
  );

  // Load saved tab from localStorage on mount
  useEffect(() => {
    setIsMounted(true);

    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab && ['videos', 'blogs', 'math', 'code'].includes(savedTab)) {
        setActiveTab(savedTab);
      }
    }
  }, [storageKey]);

  // Save tab to localStorage whenever it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, value);
    }
  };

  // Don't render until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="w-full mt-10">
        <div className="w-full bg-gray-100 dark:bg-gray-800 p-2 rounded-xl mb-6">
          <div className="h-12 bg-white dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Tab configuration for cleaner rendering
  const tabs = [
    { id: 'videos', label: 'Videos', icon: Video, count: tabCounts.videos },
    { id: 'blogs', label: 'Blogs', icon: BookOpen, count: tabCounts.blogs },
    { id: 'math', label: 'Math', icon: Calculator, count: tabCounts.math },
    { id: 'code', label: 'Code', icon: Code2, count: tabCounts.code },
  ];

  return (
    <div className="w-full mt-4 sm:mt-6 md:mt-8 lg:mt-10">
      <div className="w-full">
        <Tabs defaultValue="videos" value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Header with total count */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                Interactive Learning Materials
              </span>
              {totalContent > 0 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5">
                  {totalContent} {totalContent === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>
          </div>

          <TabsList className="w-full grid grid-cols-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 sm:p-1.5 gap-1 sm:gap-1.5 border border-slate-200/50 dark:border-slate-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "relative flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5",
                    "h-auto min-h-[48px] xs:min-h-[44px] sm:min-h-[46px] py-2 xs:py-0 px-2 xs:px-2 sm:px-3",
                    "text-[10px] xs:text-xs sm:text-sm font-medium",
                    "rounded-md sm:rounded-lg",
                    "transition-all duration-300 ease-out",
                    // Inactive state
                    "bg-transparent text-slate-600 dark:text-slate-400",
                    "hover:bg-white/60 dark:hover:bg-slate-700/60",
                    "hover:text-slate-900 dark:hover:text-slate-100",
                    // Active state with gradient
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500",
                    "data-[state=active]:text-white",
                    "data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25",
                    "data-[state=active]:font-semibold"
                  )}
                >
                  {/* Active indicator line */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md sm:rounded-lg"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5">
                    <Icon className={cn(
                      "h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 flex-shrink-0",
                      "transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    <TabCountBadge count={tab.count} isActive={isActive} />
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-4 sm:mt-6 md:mt-8">
            <TabsContent value="videos">
              <VideoTab
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                initialData={initialData}
              />
            </TabsContent>

            <TabsContent value="blogs">
              <BlogTab
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                initialData={initialData}
              />
            </TabsContent>

            <TabsContent value="math">
              <MathTab
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                initialData={initialData}
              />
            </TabsContent>

            <TabsContent value="code">
              <CodeTab
                courseId={courseId}
                chapterId={chapterId}
                sectionId={sectionId}
                initialData={initialData}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}; 
