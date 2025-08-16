"use client";

import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink } from "lucide-react";
import { BlogSectionForm } from "./_blogs/blog-section";

interface BlogResourcesCardProps {
  chapter: {
    id: string;
    title: string;
    sections: {
      id: string;
      blogs: {
        id: string;
        title: string;
        description: string | null;
        url: string;
        category: string | null;
        position: number | null;
        isPublished: boolean;
        createdAt: Date;
        updatedAt: Date;
        sectionId: string | null;
        userId: string;
        author: string | null;
        publishedAt: Date | null;
        rating?: number | null;
      }[];
      videos: any[];
      articles: any[];
      notes: any[];
    }[];
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const BlogResourcesCard = ({
  chapter,
  courseId,
  chapterId,
  sectionId
}: BlogResourcesCardProps) => {
  const currentSection = chapter.sections.find(section => section.id === sectionId);
  const blogCount = currentSection?.blogs?.length || 0;

  return (
    <div className="w-full">
      <div className={cn(
        "rounded-xl overflow-hidden",
        "bg-white dark:bg-gray-900",
        "border border-gray-200 dark:border-gray-700",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        "h-fit"
      )}>
        
        {/* Clean Header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Blog Resources
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {blogCount} {blogCount === 1 ? 'article' : 'articles'} • External learning content
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <BlogSectionForm 
            chapter={chapter}
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
          />
        </div>
      </div>
    </div>
  );
}; 