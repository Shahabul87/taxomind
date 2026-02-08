'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CourseWithAnalysis {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  updatedAt: Date;
  chapters: Array<{
    id: string;
    title: string;
    sections: Array<{ id: string; title: string }>;
  }>;
  latestAnalysis: {
    id: string;
    overallScore: number;
    analyzedAt: Date;
    version: number;
  } | null;
}

interface CourseSelectorProps {
  courses: CourseWithAnalysis[];
  onSelect: (courseId: string) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30';
  if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

function getGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

export function CourseSelector({ courses, onSelect }: CourseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = useMemo(() => {
    if (!searchTerm) return courses;
    const lower = searchTerm.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower)
    );
  }, [courses, searchTerm]);

  if (courses.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No courses found</p>
          <p className="text-sm text-slate-500 mt-1">Create a course to start analyzing</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course, index) => {
          const sectionCount = course.chapters.reduce(
            (acc, ch) => acc + ch.sections.length,
            0
          );
          const analysis = course.latestAnalysis;

          return (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(course.id)}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-all text-left group bg-white dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                {analysis && (
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm',
                      getScoreBgColor(analysis.overallScore),
                      getScoreColor(analysis.overallScore)
                    )}
                  >
                    {getGrade(analysis.overallScore)}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Layers className="h-3 w-3" />
                  {course.chapters.length} chapters
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {sectionCount} sections
                </Badge>
              </div>

              {/* Analysis Status */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {analysis ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      <span>
                        Score: <span className={cn('font-semibold', getScoreColor(analysis.overallScore))}>
                          {analysis.overallScore}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(analysis.analyzedAt), { addSuffix: true })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <AlertCircle className="h-3 w-3" />
                    Not analyzed yet
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {filteredCourses.length === 0 && searchTerm && (
        <div className="text-center py-8 text-slate-500">
          No courses match &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
}
