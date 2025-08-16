"use client";

import { motion } from 'framer-motion';
import { PlayCircle, BookOpen, Lock, CheckCircle, Eye, Unlock } from 'lucide-react';
import Link from 'next/link';
import { Section } from '@prisma/client';
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

interface ChapterSectionProps {
  section: Section;
  courseId?: string;
  chapterId?: string;
  isEnrolled?: boolean;
}

export const ChapterSection = ({ 
  section, 
  courseId, 
  chapterId, 
  isEnrolled = false 
}: ChapterSectionProps) => {
  const router = useRouter();
  const isAccessible = isEnrolled || section.isFree || section.isPreview;
  
  const handleSectionClick = () => {
    if (!isAccessible || !courseId || !chapterId) {
      // Redirect to course enrollment page if not accessible or missing props
      if (courseId) {
        router.push(`/courses/${courseId}`);
      }
      return;
    }
    
    if (isEnrolled) {
      // Navigate to the learn page for enrolled users
      router.push(`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`);
    } else {
      // For free/preview content, show a preview or redirect to enrollment
      router.push(`/courses/${courseId}`);
    }
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
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
          {section.type === 'Video' ? (
            <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        
        <div>
          <div className={cn(
            "font-medium tracking-tight transition-colors duration-200 lg:text-lg",
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

      <div className="flex items-center gap-3">
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