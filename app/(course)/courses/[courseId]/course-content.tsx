"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Lock,
  PlayCircle,
  Unlock,
  Eye
} from 'lucide-react';
import { Chapter, Section } from '@prisma/client';
import { cn } from '@/lib/utils';

interface CourseContentProps {
  chapters: (Chapter & {
    sections: Section[];
  })[] | undefined;
  courseId: string;
  isEnrolled?: boolean;
  userId?: string;
}

interface SectionItemProps {
  section: Section;
  courseId: string;
  chapterId: string;
  isEnrolled: boolean;
  sectionIndex: number;
}

const SectionItem = ({ section, courseId, chapterId, isEnrolled, sectionIndex }: SectionItemProps): JSX.Element => {
  const router = useRouter();
  const isAccessible = isEnrolled || section.isFree || section.isPreview;

  const handleSectionClick = (): void => {
    if (!isAccessible) {
      return;
    }
    router.push(`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`);
  };

  const getSectionIcon = (): JSX.Element => {
    if (section.type === 'Video') {
      return <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    return <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
  };

  const getSectionBadge = (): JSX.Element | null => {
    if (section.isPreview) {
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Preview
        </span>
      );
    }

    if (section.isFree) {
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1">
          <Unlock className="w-3 h-3" />
          Free
        </span>
      );
    }

    if (!isEnrolled) {
      return (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center p-5 rounded-lg transition-all duration-200",
        isAccessible
          ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-60"
      )}
      onClick={handleSectionClick}
      role="button"
      tabIndex={0}
      aria-label={`${isAccessible ? 'Open' : 'Locked'} section: ${section.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSectionClick();
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium w-6">
          {sectionIndex + 1}.
        </span>

        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
          {getSectionIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium transition-colors duration-200 truncate",
            isAccessible
              ? "text-slate-900 dark:text-slate-50"
              : "text-slate-500 dark:text-slate-400"
          )}>
            {section.title}
          </div>
          {section.duration && (
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{section.duration} min</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getSectionBadge()}

        {section.completionStatus === 'Completed' && isEnrolled && (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        )}
      </div>
    </div>
  );
};

export const CourseContent = ({
  chapters,
  courseId,
  isEnrolled = false
}: CourseContentProps): JSX.Element => {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));

  const toggleChapter = (index: number): void => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleExpandAll = (): void => {
    if (expandedChapters.size === chapters?.length) {
      setExpandedChapters(new Set());
    } else {
      setExpandedChapters(new Set(chapters?.map((_, i) => i) || []));
    }
  };

  const totalSections = chapters?.reduce((acc, chapter) => acc + (chapter.sections?.length || 0), 0) || 0;
  const accessibleSections = chapters?.reduce((acc, chapter) =>
    acc + (chapter.sections?.filter(section =>
      isEnrolled || section.isFree || section.isPreview
    ).length || 0), 0) || 0;

  const totalMinutes = useMemo(() => {
    return chapters?.reduce((acc, chapter) =>
      acc + ((chapter.sections || []).reduce((a, s) => a + (s.duration || 0), 0)), 0) || 0;
  }, [chapters]);

  const formattedDuration = useMemo(() => {
    if (!totalMinutes || totalMinutes <= 0) return 'Duration varies';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
  }, [totalMinutes]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Course Content
        </h2>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{chapters?.length || 0} chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            <span>{totalSections} lessons</span>
          </div>
          {!isEnrolled && accessibleSections > 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Unlock className="w-4 h-4" />
              <span>{accessibleSections} free</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formattedDuration}</span>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={toggleExpandAll}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {expandedChapters.size === chapters?.length ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {chapters?.map((chapter, index) => {
          const accessibleSectionsInChapter = chapter.sections?.filter(section =>
            isEnrolled || section.isFree || section.isPreview
          ).length || 0;
          const completedCount = chapter.sections?.filter((s) => s.completionStatus === 'Completed').length || 0;
          const totalInChapter = chapter.sections?.length || 0;
          const progressPct = totalInChapter > 0 ? Math.round((completedCount / totalInChapter) * 100) : 0;
          const isOpen = expandedChapters.has(index);

          return (
            <div
              key={chapter.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_8px_24px_rgba(0,0,0,0.4)] transition-shadow duration-300"
            >
              {/* Chapter Header */}
              <div
                className="p-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleChapter(index)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChapter(index);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {chapter.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>{chapter.sections?.length || 0} lessons</span>
                      {!isEnrolled && accessibleSectionsInChapter > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          {accessibleSectionsInChapter} free
                        </span>
                      )}
                    </div>

                    {isEnrolled && totalInChapter > 0 && progressPct > 0 && (
                      <div className="mt-3 max-w-xs">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span>Progress</span>
                          <span>{completedCount}/{totalInChapter} • {progressPct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>
              </div>

              {/* Chapter Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6">
                      <div className="space-y-2">
                        {chapter.sections?.map((section, sectionIndex) => (
                          <SectionItem
                            key={section.id}
                            section={section}
                            courseId={courseId}
                            chapterId={chapter.id}
                            isEnrolled={isEnrolled}
                            sectionIndex={sectionIndex}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
