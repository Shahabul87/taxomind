"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { Section, Chapter } from "./types";

interface NavigationFooterProps {
  prevSection: Section | null;
  nextSection: Section | null;
  nextChapterSection: { section: Section; chapter: Chapter } | null;
  completedCurrentSection: boolean;
  courseId: string;
  chapterId: string;
}

export const NavigationFooter = ({
  prevSection,
  nextSection,
  nextChapterSection,
  completedCurrentSection,
  courseId,
  chapterId,
}: NavigationFooterProps) => {
  return (
    <>
      {/* Navigation Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6"
      >
        {/* Previous Section */}
        {prevSection ? (
          <Link
            href={`/courses/${courseId}/learn/${chapterId}/sections/${prevSection.id}`}
            className="group flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform group-hover:-translate-x-1" />
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Previous</div>
              <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {prevSection.title}
              </div>
            </div>
          </Link>
        ) : (
          <div></div>
        )}

        {/* Next Section */}
        {(nextSection || nextChapterSection) && (
          <Link
            href={
              nextSection
                ? `/courses/${courseId}/learn/${chapterId}/sections/${nextSection.id}`
                : `/courses/${courseId}/learn/${nextChapterSection!.chapter.id}/sections/${nextChapterSection!.section.id}`
            }
            className="group flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 p-4 rounded-xl transition-all"
          >
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {nextSection ? "Next" : "Next Chapter"}
              </div>
              <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {nextSection ? nextSection.title : nextChapterSection!.section.title}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </motion.div>

      {/* Completion Celebration */}
      {completedCurrentSection && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center"
        >
          <Trophy className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            Section Completed!
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Great job! You&#39;ve completed this section. Ready for the next challenge?
          </p>
        </motion.div>
      )}
    </>
  );
}; 