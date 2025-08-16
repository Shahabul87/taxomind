"use client";

import { BlogResourcesCard } from "../BlogResourcesCard";

interface BlogTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: any;
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
        chapter={initialData.chapter || {id: "", title: "", sections: []}}
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
      />
    </div>
  );
}; 