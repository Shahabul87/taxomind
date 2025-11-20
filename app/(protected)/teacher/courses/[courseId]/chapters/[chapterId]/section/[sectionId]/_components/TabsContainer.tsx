"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, BookOpen, Calculator, Code2, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

  // No normalization needed - types are now properly aligned with database schema

  return (
    <div className="w-full mt-4 sm:mt-6 md:mt-8 lg:mt-10">
      <div className="w-full">
        <Tabs defaultValue="videos" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-slate-100 dark:bg-slate-800 rounded-md sm:rounded-lg p-0.5 sm:p-1 gap-0.5 sm:gap-1">
            <TabsTrigger
              value="videos"
              className={cn(
                "flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 transition-all duration-200",
                "h-auto min-h-[44px] xs:h-9 sm:h-10 py-1.5 xs:py-0 px-1.5 xs:px-1 sm:px-2 md:px-3",
                "text-[10px] xs:text-xs sm:text-sm",
                "rounded-md sm:rounded-lg",
                // Inactive state
                "bg-transparent text-slate-700 dark:text-slate-300",
                "hover:bg-slate-200 dark:hover:bg-slate-700/50",
                // Active state - ensure high contrast
                "data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-600",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "data-[state=active]:shadow-md",
                "data-[state=active]:font-semibold"
              )}
            >
              <Video className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 flex-shrink-0 data-[state=active]:text-white" />
              <span className="whitespace-nowrap">Videos</span>
            </TabsTrigger>
            <TabsTrigger
              value="blogs"
              className={cn(
                "flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 transition-all duration-200",
                "h-auto min-h-[44px] xs:h-9 sm:h-10 py-1.5 xs:py-0 px-1.5 xs:px-1 sm:px-2 md:px-3",
                "text-[10px] xs:text-xs sm:text-sm",
                "rounded-md sm:rounded-lg",
                // Inactive state
                "bg-transparent text-slate-700 dark:text-slate-300",
                "hover:bg-slate-200 dark:hover:bg-slate-700/50",
                // Active state - ensure high contrast
                "data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-600",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "data-[state=active]:shadow-md",
                "data-[state=active]:font-semibold"
              )}
            >
              <BookOpen className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 flex-shrink-0 data-[state=active]:text-white" />
              <span className="whitespace-nowrap">Blogs</span>
            </TabsTrigger>
            <TabsTrigger
              value="math"
              className={cn(
                "flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 transition-all duration-200",
                "h-auto min-h-[44px] xs:h-9 sm:h-10 py-1.5 xs:py-0 px-1.5 xs:px-1 sm:px-2 md:px-3",
                "text-[10px] xs:text-xs sm:text-sm",
                "rounded-md sm:rounded-lg",
                // Inactive state
                "bg-transparent text-slate-700 dark:text-slate-300",
                "hover:bg-slate-200 dark:hover:bg-slate-700/50",
                // Active state - ensure high contrast
                "data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-600",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "data-[state=active]:shadow-md",
                "data-[state=active]:font-semibold"
              )}
            >
              <Calculator className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 flex-shrink-0 data-[state=active]:text-white" />
              <span className="whitespace-nowrap">Math</span>
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className={cn(
                "flex flex-col xs:flex-row items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 transition-all duration-200",
                "h-auto min-h-[44px] xs:h-9 sm:h-10 py-1.5 xs:py-0 px-1.5 xs:px-1 sm:px-2 md:px-3",
                "text-[10px] xs:text-xs sm:text-sm",
                "rounded-md sm:rounded-lg",
                // Inactive state
                "bg-transparent text-slate-700 dark:text-slate-300",
                "hover:bg-slate-200 dark:hover:bg-slate-700/50",
                // Active state - ensure high contrast
                "data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-600",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "data-[state=active]:shadow-md",
                "data-[state=active]:font-semibold"
              )}
            >
              <Code2 className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-4 sm:w-4 flex-shrink-0 data-[state=active]:text-white" />
              <span className="whitespace-nowrap">Code</span>
            </TabsTrigger>
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
