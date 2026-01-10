"use client";

import { BlogResourcesCard } from "../BlogResourcesCard";

interface Blog {
  id: string;
  title: string;
  description?: string | null;
  url?: string;
  author?: string | null;
  position?: number | null;
  thumbnail?: string | null;
  rating?: number | null;
  siteName?: string | null;
}

interface ChapterSection {
  id: string;
  blogs?: Blog[];
  videos?: { id: string; title: string }[];
  articles?: { id: string; title: string }[];
  notes?: { id: string; title: string }[];
}

interface BlogTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: {
    blogs: Blog[];
    chapter?: {
      id: string;
      title: string;
      sections: ChapterSection[];
    };
  };
}

export const BlogTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: BlogTabProps) => {
  return (
    <div className="animate-fadeIn">
      <BlogResourcesCard
        chapter={initialData.chapter}
        blogs={initialData.blogs || []}
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
      />
    </div>
  );
}; 