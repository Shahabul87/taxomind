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
    <div className="space-y-4">
      <div className="relative bg-card/50 backdrop-blur-sm p-5 rounded-lg border border-border shadow-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
            <BookOpen className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Blog Resources
            </h2>
            <p className="text-xs text-muted-foreground">
              {blogCount} {blogCount === 1 ? 'article' : 'articles'} • External learning content
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
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