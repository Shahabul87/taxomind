"use client";

import React, { useState } from 'react';

import { Chapter, Section, Course, Category } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  Grid3X3,
  FileText,
  MessageSquare,
  BookOpen,
  User,
  FolderOpen,
  Award,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  BarChart
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventTracker } from '@/lib/analytics/event-tracker';


import { CourseCardsCarousel } from '../course-card-carousel';
import { CourseContent } from '../course-content';

import { CourseReviews } from './course-reviews';
import type { CourseReview } from './course-reviews';
import { OverviewTab } from './tabs/overview-tab';
import { InstructorProfileTab } from './tabs/instructor-profile-tab';
import { ResourcesTab } from './tabs/resources-tab';
import { CertificateTab } from './tabs/certificate-tab';
import { AnnouncementsTab } from './tabs/announcements-tab';
import { QATab } from './tabs/qa-tab';

interface CoursePageTabsProps {
  course: Course & {
    chapters?: Chapter[];
    category?: Category | null;
    user?: {
      id: string;
      name: string | null;
      image: string | null;
      bio?: string | null;
    } | null;
    _count?: {
      Enrollment: number;
    };
  };
  chapters: (Chapter & {
    sections: Section[];
  })[];
  courseId: string;
  initialReviews: CourseReview[];
  isEnrolled?: boolean;
  userId?: string;
}

type TabType = 'overview' | 'breakdown' | 'content' | 'instructor' | 'resources' | 'certificate' | 'announcements' | 'qa' | 'reviews';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export const CoursePageTabs: React.FC<CoursePageTabsProps> = ({
  course,
  chapters,
  courseId,
  initialReviews,
  isEnrolled = false,
  userId
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = (() => {
    const t = (searchParams?.get('tab') || '').toLowerCase();
    const values: TabType[] = ['overview','breakdown','content','instructor','resources','certificate','announcements','qa','reviews'];
    return (values as string[]).includes(t) ? (t as TabType) : 'overview';
  })();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const updateQuery = (next: TabType) => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Basic i18n for tab labels + RTL detection
  const locale = typeof navigator !== 'undefined' ? (navigator.language || 'en') : 'en';
  const isRTL = typeof document !== 'undefined'
    ? (document.dir === 'rtl')
    : /^(ar|he|fa|ur)(-|$)/i.test(locale);

  const T: Record<string, Record<TabType | 'tabs', string>> = {
    en: {
      tabs: 'Course tabs',
      overview: 'Overview',
      breakdown: 'Breakdown',
      content: 'Content',
      instructor: 'Instructor',
      resources: 'Resources',
      certificate: 'Certificate',
      announcements: 'Announcements',
      qa: 'Q&A',
      reviews: 'Reviews',
    },
    // Extend with other locales when needed
  };
  const dict = T.en; // fallback to English for now

  const plural = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural);

  const sectionParam = searchParams?.get('section');
  const tabs: Tab[] = [
    {
      id: 'overview',
      label: dict.overview,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'breakdown',
      label: dict.breakdown,
      icon: <Grid3X3 className="w-4 h-4" />,
      count: chapters.length
    },
    {
      id: 'content',
      label: (
        <span className="inline-flex items-center gap-2">
          {dict.content}
          {sectionParam && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full border border-amber-300/70 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20">
              Resume
            </span>
          )}
        </span>
      ) as any,
      icon: <FileText className="w-4 h-4" />,
      count: chapters.reduce((acc, chapter) => acc + (chapter.sections?.length || 0), 0)
    },
    {
      id: 'instructor',
      label: dict.instructor,
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'resources',
      label: dict.resources,
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      id: 'certificate',
      label: dict.certificate,
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'announcements',
      label: dict.announcements,
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: 'qa',
      label: dict.qa,
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: 'reviews',
      label: dict.reviews,
      icon: <MessageSquare className="w-4 h-4" />,
      count: initialReviews.length
    }
  ];

  const renderTabContent = (): JSX.Element | null => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <OverviewTab course={course} />
          </motion.div>
        );

      case 'breakdown':
        return (
          <motion.div
            role="tabpanel"
            id="panel-breakdown"
            aria-labelledby="tab-breakdown"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CourseCardsCarousel chapters={chapters} courseId={courseId} />
          </motion.div>
        );

      case 'content':
        return (
          <motion.div
            role="tabpanel"
            id="panel-content"
            aria-labelledby="tab-content"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-2 md:dark:p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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

      case 'instructor':
        return (
          <motion.div
            role="tabpanel"
            id="panel-instructor"
            aria-labelledby="tab-instructor"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <InstructorProfileTab course={course} />
          </motion.div>
        );

      case 'resources':
        return (
          <motion.div
            role="tabpanel"
            id="panel-resources"
            aria-labelledby="tab-resources"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ResourcesTab courseId={courseId} />
          </motion.div>
        );

      case 'certificate':
        return (
          <motion.div
            role="tabpanel"
            id="panel-certificate"
            aria-labelledby="tab-certificate"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CertificateTab courseId={courseId} isEnrolled={isEnrolled} />
          </motion.div>
        );

      case 'announcements':
        return (
          <motion.div
            role="tabpanel"
            id="panel-announcements"
            aria-labelledby="tab-announcements"
            className="dark:bg-slate-900/50 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AnnouncementsTab courseId={courseId} />
          </motion.div>
        );

      case 'qa':
        // Extract all sections from chapters for Q&A filtering
        const allSections = chapters.flatMap((chapter) =>
          chapter.sections.map((section) => ({
            id: section.id,
            title: section.title,
          }))
        );
        return (
          <motion.div
            role="tabpanel"
            id="panel-qa"
            aria-labelledby="tab-qa"
            className="dark:bg-slate-900/40 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <QATab courseId={courseId} sections={allSections} />
          </motion.div>
        );

      case 'reviews':
        return (
          <motion.div
            role="tabpanel"
            id="panel-reviews"
            aria-labelledby="tab-reviews"
            className="dark:bg-slate-900/40 dark:border dark:border-slate-800 dark:rounded-2xl dark:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CourseReviews courseId={courseId} initialReviews={initialReviews} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Refs for roving focus and scroll controls
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const order = tabs.map(t => t.id);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = order[(idx + 1) % order.length];
      setActiveTab(next); updateQuery(next);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = order[(idx - 1 + order.length) % order.length];
      setActiveTab(prev); updateQuery(prev);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      const first = order[0]; setActiveTab(first); updateQuery(first); tabRefs.current[first]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = order[order.length - 1]; setActiveTab(last); updateQuery(last); tabRefs.current[last]?.focus();
    }
  };

  const scrollByAmount = (delta: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Sticky Tab Navigation */}
      <div className="mb-8 sticky top-20 md:top-24 z-[40] course-tabs-sticky">
        <div className="relative">
          <div className="bg-white/80 dark:bg-slate-900/75 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md rounded-2xl p-2 border border-slate-200/70 dark:border-slate-700/60">
            <nav
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scroll-smooth"
              role="tablist"
              aria-label={dict.tabs}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                    id={`tab-${tab.id}`}
                    data-tab={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onKeyDown={(e) => onKeyDown(e, index)}
                    onClick={() => {
                      setActiveTab(tab.id);
                      updateQuery(tab.id);
                      // Track analytics
                      try {
                        EventTracker.getInstance().trackInteraction('course_tab_selected', {
                          tab: tab.id,
                          courseId,
                        });
                      } catch {}
                    }}
                    aria-label={`${tab.label}${tab.count !== undefined ? ` (${tab.count})` : ''}`}
                    className={`
                      group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-xl
                      transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 focus-visible:ring-offset-0
                      ${isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-md'
                        : 'text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`
                        inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full
                        ${isActive
                          ? 'bg-blue-100 text-blue-700 dark:bg-white/15 dark:text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-slate-200'}
                      `}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <span className="pointer-events-none absolute -bottom-1 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-400 dark:to-indigo-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          

          {/* Scroll controls and shadows */}
          <button
            type="button"
            aria-label="Scroll tabs left"
            onClick={() => scrollByAmount(-200)}
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 items-center justify-center h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow hover:bg-white dark:hover:bg-slate-900"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>
          <button
            type="button"
            aria-label="Scroll tabs right"
            onClick={() => scrollByAmount(200)}
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 items-center justify-center h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 shadow hover:bg-white dark:hover:bg-slate-900"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </button>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 rounded-2xl bg-gradient-to-r from-gray-100/90 dark:from-slate-900/70 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-2xl bg-gradient-to-l from-gray-100/90 dark:from-slate-900/70 to-transparent" />
        </div>
        {/* Tab summary row (below sticky nav) */}
        <div className="px-3 pt-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-slate-600 dark:text-slate-300" dir={isRTL ? 'rtl' : 'ltr'}>
            {(() => {
              const chaptersCount = chapters.length;
              const lessonsCount = chapters.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0);
              const reviewsCount = initialReviews.length;
              const lastUpdated = new Date(course.updatedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short' });
              const language = 'English';
              const level = 'All Levels';
              return (
                <>
                  <span className="inline-flex items-center gap-1"><Grid3X3 className="w-4 h-4" />{chaptersCount} {plural(chaptersCount, 'Chapter', 'Chapters')}</span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1"><FileText className="w-4 h-4" />{lessonsCount} {plural(lessonsCount, 'Lesson', 'Lessons')}</span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" />{reviewsCount} {plural(reviewsCount, 'Review', 'Reviews')}</span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" />Last updated {lastUpdated}</span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1"><Globe className="w-4 h-4" />{language}</span>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1"><BarChart className="w-4 h-4" />{level}</span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  );
}; 
