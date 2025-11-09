"use client";

import { motion } from "framer-motion";
import { 
  Clock, 
  Eye, 
  Users,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section, Chapter, Course } from "./types";

interface SectionHeaderProps {
  course: Course;
  currentChapter: Chapter;
  currentSection: Section;
  completedCurrentSection: boolean;
  getEstimatedReadTime: number;
  getContentIcon: (type?: string | null) => JSX.Element;
  handleMarkComplete: () => void;
  courseId: string;
  chapterId: string;
}

export const SectionHeader = ({
  course,
  currentChapter,
  currentSection,
  completedCurrentSection,
  getEstimatedReadTime,
  getContentIcon,
  handleMarkComplete,
  courseId,
  chapterId,
}: SectionHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb & Section Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link href={`/courses/${courseId}`} className="hover:text-slate-900 dark:hover:text-slate-100">
            {course.title}
          </Link>
          <span>/</span>
          <Link href={`/courses/${courseId}/learn/${chapterId}`} className="hover:text-slate-900 dark:hover:text-slate-100">
            {currentChapter.title}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            {currentSection.title}
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {getContentIcon(currentSection.type)}
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-700 dark:from-slate-100 dark:via-blue-200 dark:to-purple-300 bg-clip-text text-transparent">
                {currentSection.title}
              </h1>
            </div>
            {currentSection.description && (
              <p className="text-slate-600 dark:text-slate-400 max-w-3xl">
                {currentSection.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {!completedCurrentSection ? (
              <Button
                onClick={handleMarkComplete}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            ) : (
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{getEstimatedReadTime} min read</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>Learning Section</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Interactive Content</span>
        </div>
        {currentSection.type && (
          <Badge variant="outline" className="capitalize">
            {currentSection.type}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}; 