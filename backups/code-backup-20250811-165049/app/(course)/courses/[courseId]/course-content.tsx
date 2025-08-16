"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronUp, PlayCircle, BookOpen, 
  Clock, Award, Lock, CheckCircle, Info, ExternalLink,
  BookOpenCheck, Sparkles, GraduationCap, Eye, Unlock
} from 'lucide-react';
import Link from 'next/link';
import { Chapter, Section } from '@prisma/client';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

// Utility function to clean HTML tags from text
const cleanHtmlTags = (html: string | null): string => {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  const entityMap: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  
  text = text.replace(/&[#\w]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });
  
  return text.trim();
};

interface CourseContentProps {
  chapters: (Chapter & {
    sections: Section[];
  })[] | undefined;
  courseId: string;
  isEnrolled?: boolean;
  userId?: string;
}

// Enhanced Section Component with proper locking and navigation
interface SectionItemProps {
  section: Section;
  courseId: string;
  chapterId: string;
  isEnrolled: boolean;
  sectionIndex: number;
}

const SectionItem = ({ section, courseId, chapterId, isEnrolled, sectionIndex }: SectionItemProps) => {
  const router = useRouter();
  const isAccessible = isEnrolled || section.isFree || section.isPreview;
  
  const handleSectionClick = () => {
    if (!isAccessible) {
      // Redirect to course enrollment page
      router.push(`/courses/${courseId}`);
      return;
    }
    
    if (isEnrolled) {
      // Navigate to the learn page
      router.push(`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`);
    } else {
      // For free/preview content, show a preview or redirect to enrollment
      router.push(`/courses/${courseId}`);
    }
  };

  const getSectionIcon = () => {
    if (section.type === 'Video') {
      return <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
  };

  const getSectionBadge = () => {
    if (section.isPreview) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Preview
        </span>
      );
    }
    
    if (section.isFree) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-500/20 flex items-center gap-1">
          <Unlock className="w-3 h-3" />
          Free
        </span>
      );
    }
    
    if (!isEnrolled) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-500/20 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Locked
        </span>
      );
    }
    
    return null;
  };

  return (
    <motion.div
      whileHover={isAccessible ? { x: 4 } : {}}
      className={cn(
        "flex justify-between items-center p-3 rounded-lg transition-all duration-200",
        isAccessible 
          ? "bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50/80 dark:hover:bg-gray-800 cursor-pointer" 
          : "bg-gray-50/30 dark:bg-gray-800/30 opacity-60"
      )}
      onClick={handleSectionClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium min-w-0">
          <span className="flex-shrink-0">{sectionIndex + 1}.</span>
        </div>
        
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
          {getSectionIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium tracking-tight transition-colors duration-200 lg:text-lg truncate",
            isAccessible 
              ? "text-slate-900 dark:text-slate-50 hover:text-indigo-700 dark:hover:text-indigo-300" 
              : "text-gray-500 dark:text-gray-400"
          )}>
            {section.title}
          </div>
          {section.type && (
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-tight">
              <span className="text-indigo-600/80 dark:text-indigo-400/80">{section.type}</span>
              <span className="mx-2 text-slate-400 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-500">
                {section.duration ? `${section.duration} min` : 'Duration varies'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {getSectionBadge()}
        
        {section.completionStatus === 'Completed' && isEnrolled && (
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        )}
        
        {!isAccessible && (
          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        )}
      </div>
    </motion.div>
  );
};

export const CourseContent: React.FC<CourseContentProps> = ({ 
  chapters, 
  courseId, 
  isEnrolled = false, 
  userId 
}) => {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [expandAll, setExpandAll] = useState<boolean>(false);

  const toggleChapter = (index: number) => {
    setExpandedChapter(index === expandedChapter ? null : index);
  };

  const toggleExpandAll = () => {
    setExpandAll(!expandAll);
    setExpandedChapter(expandAll ? null : -1);
  };

  const getDifficultyColor = (difficulty: string | null | undefined) => {
    if (!difficulty) return "text-gray-500";
    
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "text-green-600 dark:text-green-400";
      case "intermediate":
        return "text-blue-600 dark:text-blue-400";
      case "advanced":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-500";
    }
  };

  const totalSections = chapters?.reduce((acc, chapter) => acc + (chapter.sections?.length || 0), 0) || 0;
  const accessibleSections = chapters?.reduce((acc, chapter) => 
    acc + (chapter.sections?.filter(section => 
      isEnrolled || section.isFree || section.isPreview
    ).length || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Course Content
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            {isEnrolled 
              ? "Everything you need to master this course, organized in a clear learning path" 
              : "Preview the course content. Enroll to access all lessons and materials"
            }
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-6">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">{chapters?.length || 0} Chapters</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium">{totalSections} Lessons</span>
            </div>
            {!isEnrolled && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Unlock className="w-5 h-5" />
                <span className="font-medium">{accessibleSections} Free/Preview</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-5 h-5" />
              <span className="font-medium">12+ Hours</span>
            </div>
          </div>

          {/* Enrollment Status Banner */}
          {!isEnrolled && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-800 dark:text-blue-200">
                <Info className="w-5 h-5" />
                <span className="font-medium">
                  You&apos;re viewing as a guest. Enroll to access all course content and track your progress.
                </span>
              </div>
              <div className="mt-2 text-center">
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Enroll Now
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Expand All Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={toggleExpandAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {expandAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {chapters?.map((chapter, index) => {
          const accessibleSectionsInChapter = chapter.sections?.filter(section => 
            isEnrolled || section.isFree || section.isPreview
          ).length || 0;
          
          return (
            <motion.div 
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Chapter Header */}
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleChapter(index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Chapter {index + 1}
                      </span>
                      {chapter.status === "Published" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {chapter.title}
                    </h3>
                    
                    {chapter.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {cleanHtmlTags(chapter.description)}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {chapter.difficulty && (
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-gray-400" />
                          <span className={getDifficultyColor(chapter.difficulty)}>
                            {chapter.difficulty}
                          </span>
                        </div>
                      )}
                      
                      {chapter.estimatedTime && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{chapter.estimatedTime}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <BookOpen className="w-4 h-4" />
                        <span>{chapter.sections?.length || 0} lessons</span>
                      </div>

                      {!isEnrolled && accessibleSectionsInChapter > 0 && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Unlock className="w-4 h-4" />
                          <span>{accessibleSectionsInChapter} free/preview</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{ rotate: (expandedChapter === index || expandAll) ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>

              {/* Chapter Content */}
              <AnimatePresence>
                {(expandedChapter === index || expandAll) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="p-4 sm:p-6 space-y-4">
                        {/* Prerequisites */}
                        {chapter.prerequisites && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="font-medium text-blue-900 dark:text-blue-100">Prerequisites</span>
                            </div>
                            <p className="text-blue-800 dark:text-blue-200 text-sm">
                              {chapter.prerequisites}
                            </p>
                          </div>
                        )}
                        
                        {/* Sections */}
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

                        {/* Resources */}
                        {chapter.resources && (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium text-purple-900 dark:text-purple-100">Additional Resources</span>
                            </div>
                            <div className="space-y-2">
                              {JSON.parse(chapter.resources).map((resource: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-purple-800 dark:text-purple-200 text-sm">
                                  <Sparkles className="w-3 h-3 flex-shrink-0" />
                                  <span>{resource}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA for unenrolled users */}
      {!isEnrolled && (
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Learning?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Enroll now to access all {totalSections} lessons, track your progress, and earn a certificate upon completion.
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Enroll in Course
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  );
};
