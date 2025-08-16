"use client";

import { motion } from "framer-motion";
import { SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/app/(course)/courses/[courseId]/learn/_components/video-player";
import { Section, Chapter } from "./types";

interface VideoPlayerSectionProps {
  currentSection: Section;
  currentChapter: Chapter;
  prevSection: Section | null;
  nextSection: Section | null;
  nextChapterSection: { section: Section; chapter: Chapter } | null;
  courseId: string;
  chapterId: string;
  sectionId: string;
}

export const VideoPlayerSection = ({
  currentSection,
  currentChapter,
  prevSection,
  nextSection,
  nextChapterSection,
  courseId,
  chapterId,
  sectionId,
}: VideoPlayerSectionProps) => {
  if (!currentSection.videoUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700"
    >
      <VideoPlayer
        videoUrl={currentSection.videoUrl}
        courseId={courseId}
        chapterId={chapterId}
        sectionId={sectionId}
      />
      
      {/* Video Navigation */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          {/* Previous Video */}
          {prevSection?.videoUrl ? (
            <Link
              href={`/courses/${courseId}/learn/${chapterId}/sections/${prevSection.id}`}
              className="group flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <SkipBack className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
              <div className="text-left">
                <div className="text-xs text-slate-500 dark:text-slate-400">Previous Video</div>
                <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {prevSection.title}
                </div>
              </div>
            </Link>
          ) : (
            <div></div>
          )}

          {/* Current Video Info */}
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Video {currentChapter.sections.findIndex(s => s.id === sectionId) + 1} of {currentChapter.sections.length}
            </div>
          </div>

          {/* Next Video */}
          {(nextSection?.videoUrl || nextChapterSection?.section.videoUrl) && (
            <Link
              href={
                nextSection?.videoUrl
                  ? `/courses/${courseId}/learn/${chapterId}/sections/${nextSection.id}`
                  : `/courses/${courseId}/learn/${nextChapterSection!.chapter.id}/sections/${nextChapterSection!.section.id}`
              }
              className="group flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {nextSection ? "Next Video" : "Next Chapter"}
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {nextSection ? nextSection.title : nextChapterSection!.section.title}
                </div>
              </div>
              <SkipForward className="w-5 h-5 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 