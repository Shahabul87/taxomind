"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Layers, FileText, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Section {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  position: number;
  sections: Section[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  whatYouWillLearn: string[];
  chapters: Chapter[];
}

type AnalysisLevel = "course" | "chapter" | "section";

interface SelectionState {
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
}

interface CascadingSelectorProps {
  courses: Course[];
  analysisLevel: AnalysisLevel;
  selection: SelectionState;
  onSelectionChange: (selection: SelectionState) => void;
}

export function CascadingSelector({
  courses,
  analysisLevel,
  selection,
  onSelectionChange,
}: CascadingSelectorProps) {
  // Get available chapters based on selected course
  const availableChapters = useMemo(() => {
    if (!selection.courseId) return [];
    const course = courses.find((c) => c.id === selection.courseId);
    return course?.chapters || [];
  }, [courses, selection.courseId]);

  // Get available sections based on selected chapter
  const availableSections = useMemo(() => {
    if (!selection.chapterId) return [];
    const chapter = availableChapters.find((ch) => ch.id === selection.chapterId);
    return chapter?.sections || [];
  }, [availableChapters, selection.chapterId]);

  const handleCourseChange = (courseId: string) => {
    onSelectionChange({
      courseId,
      chapterId: null,
      sectionId: null,
    });
  };

  const handleChapterChange = (chapterId: string) => {
    onSelectionChange({
      ...selection,
      chapterId,
      sectionId: null,
    });
  };

  const handleSectionChange = (sectionId: string) => {
    onSelectionChange({
      ...selection,
      sectionId,
    });
  };

  // Animation variants
  const selectorVariants: Variants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: 16,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="space-y-4">
      {/* Course Selector - Always visible */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <BookOpen className="h-4 w-4 text-purple-500" />
          Select Course
          {analysisLevel === "course" && (
            <Badge variant="outline" className="ml-auto text-xs">
              Required
            </Badge>
          )}
        </label>
        <Select
          value={selection.courseId || undefined}
          onValueChange={handleCourseChange}
        >
          <SelectTrigger
            className={cn(
              "h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
              "hover:border-purple-300 dark:hover:border-purple-700 transition-colors",
              "focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            )}
          >
            <SelectValue placeholder="Choose a course to analyze..." />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {courses.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                No courses found. Create a course first.
              </div>
            ) : (
              courses.map((course) => (
                <SelectItem
                  key={course.id}
                  value={course.id}
                  className="py-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        course.isPublished ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{course.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {course.chapters.length} chapters &bull;{" "}
                        {course.chapters.reduce(
                          (sum, ch) => sum + ch.sections.length,
                          0
                        )}{" "}
                        sections
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs flex-shrink-0",
                        course.isPublished
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Chapter Selector - Visible for chapter and section level */}
      <AnimatePresence>
        {(analysisLevel === "chapter" || analysisLevel === "section") && (
          <motion.div
            variants={selectorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Select Chapter
              {analysisLevel === "chapter" && (
                <Badge variant="outline" className="ml-auto text-xs">
                  Required
                </Badge>
              )}
            </label>
            <Select
              value={selection.chapterId || undefined}
              onValueChange={handleChapterChange}
              disabled={!selection.courseId}
            >
              <SelectTrigger
                className={cn(
                  "h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                  "hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors",
                  "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <SelectValue
                  placeholder={
                    selection.courseId
                      ? "Choose a chapter..."
                      : "Select a course first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {availableChapters.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    {selection.courseId
                      ? "No chapters in this course"
                      : "Select a course first"}
                  </div>
                ) : (
                  availableChapters.map((chapter, index) => (
                    <SelectItem
                      key={chapter.id}
                      value={chapter.id}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{chapter.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {chapter.sections.length} sections
                          </p>
                        </div>
                        {chapter.isPublished ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Selector - Visible only for section level */}
      <AnimatePresence>
        {analysisLevel === "section" && (
          <motion.div
            variants={selectorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Select Section
              <Badge variant="outline" className="ml-auto text-xs">
                Required
              </Badge>
            </label>
            <Select
              value={selection.sectionId || undefined}
              onValueChange={handleSectionChange}
              disabled={!selection.chapterId}
            >
              <SelectTrigger
                className={cn(
                  "h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                  "hover:border-blue-300 dark:hover:border-blue-700 transition-colors",
                  "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <SelectValue
                  placeholder={
                    selection.chapterId
                      ? "Choose a section..."
                      : "Select a chapter first"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {availableSections.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    {selection.chapterId
                      ? "No sections in this chapter"
                      : "Select a chapter first"}
                  </div>
                ) : (
                  availableSections.map((section, index) => (
                    <SelectItem
                      key={section.id}
                      value={section.id}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{section.title}</p>
                        </div>
                        {section.isPublished ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
