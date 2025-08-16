"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronDown, 
  Play, 
  CheckCircle2, 
  Lock, 
  Clock,
  Video,
  BookOpen,
  FileText,
  Code,
  Star,
  Eye,
  Users
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Utility function to strip HTML tags and decode HTML entities
const stripHtmlTags = (html: string): string => {
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

interface Course {
  id: string;
  chapters: Array<{
    id: string;
    title: string;
    description?: string | null;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      position: number;
      type?: string | null;
      duration?: number | null;
      userProgress: Array<{
        isCompleted: boolean;
      }>;
      videos: Array<{ id: string; title: string; duration?: number | null }>;
      blogs: Array<{ id: string; title: string }>;
      articles: Array<{ id: string; title: string }>;
      notes: Array<{ id: string; title: string }>;
      codeExplanations: Array<{ id: string; heading: string }>;
    }>;
  }>;
}

interface CourseContentNavigationProps {
  course: Course;
}

export const CourseContentNavigation = ({ course }: CourseContentNavigationProps) => {
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const getContentIcon = (section: Course['chapters'][0]['sections'][0]) => {
    if (section.videos.length > 0) return Video;
    if (section.blogs.length > 0) return BookOpen;
    if (section.articles.length > 0) return FileText;
    if (section.codeExplanations.length > 0) return Code;
    return BookOpen;
  };

  const getContentIconColor = (section: Course['chapters'][0]['sections'][0]) => {
    if (section.videos.length > 0) return "text-red-500 bg-red-100 dark:bg-red-900/30";
    if (section.blogs.length > 0) return "text-green-500 bg-green-100 dark:bg-green-900/30";
    if (section.articles.length > 0) return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
    if (section.codeExplanations.length > 0) return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
    return "text-slate-500 bg-slate-100 dark:bg-slate-900/30";
  };

  const filteredChapters = course.chapters.filter(chapter => {
    if (filter === 'all') return true;
    
    const completedSections = chapter.sections.filter(
      section => section.userProgress.some(p => p.isCompleted)
    ).length;
    
    if (filter === 'completed') {
      return completedSections === chapter.sections.length && chapter.sections.length > 0;
    }
    
    if (filter === 'incomplete') {
      return completedSections < chapter.sections.length;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 w-fit">
        {[
          { id: 'all', label: 'All Chapters' },
          { id: 'completed', label: 'Completed' },
          { id: 'incomplete', label: 'In Progress' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              filter === tab.id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course Content */}
      <div className="space-y-4">
        {filteredChapters.map((chapter, chapterIndex) => {
          const completedSections = chapter.sections.filter(
            section => section.userProgress.some(p => p.isCompleted)
          ).length;
          const progressPercentage = chapter.sections.length > 0 
            ? (completedSections / chapter.sections.length) * 100 
            : 0;
          const isExpanded = expandedChapters.includes(chapter.id);

          return (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: chapterIndex * 0.1 }}
            >
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                {/* Chapter Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-semibold text-sm">
                          {chapter.position}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {chapter.title}
                        </h3>
                        {progressPercentage === 100 && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      
                      {chapter.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 ml-11">
                          {stripHtmlTags(chapter.description)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 ml-11">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span>{chapter.sections.length} sections</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span>{completedSections} completed</span>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {Math.round(progressPercentage)}%
                        </span>
                      </div>
                    </div>
                    
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </motion.div>
                  </div>
                </div>

                {/* Chapter Sections */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="p-4 space-y-2">
                        {chapter.sections.map((section, sectionIndex) => {
                          const isCompleted = section.userProgress.some(p => p.isCompleted);
                          const ContentIcon = getContentIcon(section);
                          const iconColorClass = getContentIconColor(section);
                          
                          const totalContentItems = 
                            section.videos.length + 
                            section.blogs.length + 
                            section.articles.length + 
                            section.notes.length + 
                            section.codeExplanations.length;

                          return (
                            <motion.div
                              key={section.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: sectionIndex * 0.05 }}
                            >
                              <Link 
                                href={`/courses/${course.id}/learn/${chapter.id}/sections/${section.id}`}
                                className="block"
                              >
                                <div className={cn(
                                  "p-4 rounded-lg border transition-all duration-200 group hover:shadow-md",
                                  isCompleted 
                                    ? "bg-emerald-50/80 border-emerald-200/50 dark:bg-emerald-900/20 dark:border-emerald-800/30" 
                                    : "bg-slate-50/80 border-slate-200/50 dark:bg-slate-700/30 dark:border-slate-600/30 hover:bg-slate-100/80 dark:hover:bg-slate-700/50"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", iconColorClass)}>
                                      <ContentIcon className="w-4 h-4" />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                          {section.title}
                                        </h4>
                                        {isCompleted && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                        {section.type && (
                                          <Badge variant="outline" className="text-xs">
                                            {section.type}
                                          </Badge>
                                        )}
                                        {section.duration && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{section.duration} min</span>
                                          </div>
                                        )}
                                        {totalContentItems > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            <span>{totalContentItems} items</span>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-center w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full text-slate-600 dark:text-slate-400 font-semibold text-xs">
                                          {section.position}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredChapters.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No chapters found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {filter === 'completed' 
              ? "You haven't completed any chapters yet."
              : filter === 'incomplete'
              ? "All chapters are completed!"
              : "This course doesn't have any chapters yet."
            }
          </p>
        </div>
      )}
    </div>
  );
}; 