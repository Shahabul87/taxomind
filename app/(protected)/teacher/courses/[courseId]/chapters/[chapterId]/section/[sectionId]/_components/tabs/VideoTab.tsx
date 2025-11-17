"use client";

import { VideoResourcesCard } from "../VideoResourcesCard";

interface VideoTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: any;
}

export const VideoTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: VideoTabProps) => {
  return (
    <div className="animate-fadeIn">
      <VideoResourcesCard
        chapter={initialData.chapter || {id: "", title: "", sections: []}}
        videos={initialData.videos || []}
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
      />
    </div>
  );
}; 