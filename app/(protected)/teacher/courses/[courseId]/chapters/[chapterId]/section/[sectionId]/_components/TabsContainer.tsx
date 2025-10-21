"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, BookOpen, Calculator, Code2, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

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
    <div className="w-full mt-10">
      <div className="w-full">
        <Tabs defaultValue="videos" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <TabsTrigger
              value="videos"
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                "data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "hover:bg-gray-200 dark:hover:bg-gray-700/50"
              )}
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger
              value="blogs"
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                "data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "hover:bg-gray-200 dark:hover:bg-gray-700/50"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Blogs</span>
            </TabsTrigger>
            <TabsTrigger
              value="math"
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                "data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "hover:bg-gray-200 dark:hover:bg-gray-700/50"
              )}
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Math</span>
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className={cn(
                "flex items-center gap-2 transition-all duration-200",
                "data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-700",
                "data-[state=active]:text-white dark:data-[state=active]:text-white",
                "hover:bg-gray-200 dark:hover:bg-gray-700/50"
              )}
            >
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Code</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
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
