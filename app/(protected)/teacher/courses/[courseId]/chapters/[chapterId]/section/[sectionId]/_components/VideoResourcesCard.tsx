"use client";

import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoSectionForm } from "./_videos/video-section";

interface VideoResourcesCardProps {
  chapter: {
    id: string;
    title: string;
    sections: {
      id: string;
      videos: {
        id: string;
        title: string;
        description: string | null;
        url: string | null;
        rating: number | null;
      }[];
    }[];
  };
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const VideoResourcesCard = ({
  chapter,
  courseId,
  chapterId,
  sectionId
}: VideoResourcesCardProps) => {
  return (
    <div className="space-y-4">
      <div className="relative bg-card/50 backdrop-blur-sm p-5 rounded-lg border border-border shadow-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
            <Video className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-foreground">
              Video Resources
            </h2>
            <p className="text-xs text-muted-foreground">
              Visual learning materials to help you master concepts
            </p>
          </div>
        </div>

        {/* Card Content */}
        <div className="mt-3">
          <VideoSectionForm
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