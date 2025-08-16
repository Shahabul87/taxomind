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
    <div className="lg:pr-10 lg:transform lg:translate-y-5">
      <div className={cn(
        "rounded-2xl overflow-hidden",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "border border-blue-100 dark:border-blue-900/50",
        "bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-gray-800/90 dark:to-blue-900/20",
        "backdrop-blur-sm"
      )}>
        {/* Card Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 p-4">
          <div className="flex items-center">
            <div className={cn(
              "mr-4 p-3 rounded-lg",
              "bg-white/20 dark:bg-white/10",
              "shadow-inner"
            )}>
              <Video className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Video Resources
              </h2>
              <p className="text-blue-50 text-sm">
                Visual learning materials to help you master concepts
              </p>
            </div>
          </div>
        </div>
        
        {/* Card Content */}
        <div className="p-5">
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