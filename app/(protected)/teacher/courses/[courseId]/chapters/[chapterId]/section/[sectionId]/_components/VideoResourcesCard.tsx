"use client";

import { Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoSectionForm } from "./_videos/video-section";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  videos: {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    rating: number | null;
    thumbnail?: string | null;
    platform?: string | null;
  }[];
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const VideoResourcesCard = ({
  chapter,
  videos,
  courseId,
  chapterId,
  sectionId
}: VideoResourcesCardProps) => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative bg-white dark:bg-slate-900 p-3 sm:p-4 md:p-5 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-4 mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
              Video Resources
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Visual learning materials to help you master concepts
            </p>
          </div>
          <Button
            onClick={() => setIsCreating(!isCreating)}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-shrink-0 w-full xs:w-auto",
              "h-9 sm:h-10 px-3 sm:px-4",
              "bg-blue-50 dark:bg-blue-500/10",
              "text-blue-700 dark:text-blue-300",
              "hover:bg-blue-100 dark:hover:bg-blue-500/20",
              "hover:text-blue-800 dark:hover:text-blue-200",
              "transition-all duration-200",
              "text-xs sm:text-sm",
              "justify-center xs:justify-start"
            )}
          >
            {isCreating ? (
              "Cancel"
            ) : (
              <>
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Add video
              </>
            )}
          </Button>
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 mb-3 sm:mb-4" />

        {/* Card Content */}
        <div>
          <VideoSectionForm
            chapter={chapter}
            videos={videos}
            courseId={courseId}
            chapterId={chapterId}
            sectionId={sectionId}
            isCreating={isCreating}
            setIsCreating={setIsCreating}
          />
        </div>
      </div>
    </div>
  );
}; 