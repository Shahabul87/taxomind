"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  List, 
  Star,
  Grid3X3,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Chapter, Section } from '@prisma/client';
import { CourseCardsCarousel } from '../course-card-carousel';
import { CourseContent } from '../course-content';
import { CourseReviews } from './course-reviews';

type CourseReview = {
  id: string;
  rating: number;
  comment: string;
  courseId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

interface CoursePageTabsProps {
  chapters: (Chapter & {
    sections: Section[];
  })[];
  courseId: string;
  initialReviews: CourseReview[];
  isEnrolled?: boolean;
  userId?: string;
}

type TabType = 'breakdown' | 'content' | 'reviews';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export const CoursePageTabs: React.FC<CoursePageTabsProps> = ({
  chapters,
  courseId,
  initialReviews,
  isEnrolled = false,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('breakdown');

  const tabs: Tab[] = [
    {
      id: 'breakdown',
      label: 'Course Breakdown',
      icon: <Grid3X3 className="w-4 h-4" />,
      count: chapters.length
    },
    {
      id: 'content',
      label: 'Course Content',
      icon: <FileText className="w-4 h-4" />,
      count: chapters.reduce((acc, chapter) => acc + (chapter.sections?.length || 0), 0)
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <MessageSquare className="w-4 h-4" />,
      count: initialReviews.length
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'breakdown':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="w-full overflow-hidden">
              <div className="relative">
                <CourseCardsCarousel chapters={chapters} />
              </div>
            </div>
          </motion.div>
        );
      
      case 'content':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="px-2 md:px-8">
              <CourseContent 
                chapters={chapters} 
                courseId={courseId}
                isEnrolled={isEnrolled}
                userId={userId}
              />
            </div>
          </motion.div>
        );
      
      case 'reviews':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="mt-8">
              <CourseReviews courseId={courseId} initialReviews={initialReviews} />
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 py-4 px-1 text-sm font-medium whitespace-nowrap
                transition-all duration-200 ease-in-out
                ${activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`
                  inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full
                  ${activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {tab.count}
                </span>
              )}
              
              {/* Active tab indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
}; 