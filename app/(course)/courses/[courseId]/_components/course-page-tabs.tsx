"use client";

import React, { useState, useCallback } from 'react';

import { Chapter, Section, Course, Category } from '@prisma/client';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Grid3X3,
  FileText,
  MessageSquare,
  BookOpen,
  User,
  FolderOpen,
  Award,
  Bell,
  HelpCircle
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EventTracker } from '@/lib/analytics/event-tracker';


// Lightweight skeletons for lazy content
const SkeletonPanel = () => (
  <div className="min-h-[240px] w-full rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-slate-900/60 animate-pulse" />
);
const SkeletonList = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-14 rounded-lg border border-slate-200/70 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40" />
    ))}
  </div>
);

// Dynamic imports for heavy client panes
const CourseCardsCarousel = dynamic(() => import('../course-card-carousel').then(m => m.CourseCardsCarousel), { loading: () => <SkeletonPanel />, ssr: false });
const CourseContent = dynamic(() => import('../course-content').then(m => m.CourseContent), { loading: () => <SkeletonList />, ssr: false });
const CourseReviews = dynamic(() => import('./course-reviews').then(m => m.CourseReviews), { loading: () => <SkeletonList />, ssr: false });
const OverviewTab = dynamic(() => import('./tabs/overview-tab').then(m => m.OverviewTab), { loading: () => <SkeletonPanel />, ssr: false });
const InstructorProfileTab = dynamic(() => import('./tabs/instructor-profile-tab').then(m => m.InstructorProfileTab), { loading: () => <SkeletonPanel />, ssr: false });
const ResourcesTab = dynamic(() => import('./tabs/resources-tab').then(m => m.ResourcesTab), { loading: () => <SkeletonPanel />, ssr: false });
const CertificateTab = dynamic(() => import('./tabs/certificate-tab').then(m => m.CertificateTab), { loading: () => <SkeletonPanel />, ssr: false });
const AnnouncementsTab = dynamic(() => import('./tabs/announcements-tab').then(m => m.AnnouncementsTab), { loading: () => <SkeletonPanel />, ssr: false });
const QATab = dynamic(() => import('./tabs/qa-tab').then(m => m.QATab), { loading: () => <SkeletonList />, ssr: false });
const ModerationTab = dynamic(() => import('./tabs/moderation-tab').then(m => m.ModerationTab), { loading: () => <SkeletonPanel />, ssr: false });

import type { CourseReview } from './course-reviews';
import { ShieldCheck } from 'lucide-react';
import { getCategoryPalette } from '@/lib/utils/color-utils';
const ShieldCheckIcon = () => <ShieldCheck className="w-4 h-4"/>;

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

type TabType = 'overview' | 'breakdown' | 'content' | 'instructor' | 'resources' | 'certificate' | 'announcements' | 'qa' | 'moderation' | 'reviews';

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
    const values: TabType[] = ['overview','breakdown','content','instructor','resources','certificate','announcements','qa','moderation','reviews'];
    return (values as string[]).includes(t) ? (t as TabType) : 'overview';
  })();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const updateQuery = useCallback((next: TabType) => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, searchParams, router]);

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
      moderation: 'Moderation',
      reviews: 'Reviews',
    },
    // Extend with other locales when needed
  };
  const dict = T.en; // fallback to English for now

  const plural = (count: number, singular: string, plural: string) => (count === 1 ? singular : plural);

  const sectionParam = searchParams?.get('section');
  const isInstructor = Boolean(userId && course.user?.id === userId);

  // Support hash deep-links like #reviews, #qa, #instructor
  React.useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const raw = window.location.hash || '';
      const hash = raw.startsWith('#') ? raw.slice(1) : raw;
      const allowed: Record<string, TabType> = {
        reviews: 'reviews',
        qa: 'qa',
        instructor: 'instructor',
      };
      const next = allowed[hash];
      if (next) {
        setActiveTab(next);
        updateQuery(next);
        requestAnimationFrame(() => {
          const panel = document.getElementById(`panel-${next}`) as HTMLElement | null;
          if (panel) {
            (panel as any).focus?.({ preventScroll: true });
            const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            panel.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
          }
        });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash, { passive: true } as any);
    return () => window.removeEventListener('hashchange', handleHash as any);
  }, [updateQuery]);

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
      label: dict.content,
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

  // Lightweight preloader on hover/cue
  const preloaders: Partial<Record<TabType, () => void>> = {
    overview: () => { import('./tabs/overview-tab'); },
    breakdown: () => { import('../course-card-carousel'); },
    content: () => { import('../course-content'); },
    instructor: () => { import('./tabs/instructor-profile-tab'); },
    resources: () => { import('./tabs/resources-tab'); },
    certificate: () => { import('./tabs/certificate-tab'); },
    announcements: () => { import('./tabs/announcements-tab'); },
    qa: () => { import('./tabs/qa-tab'); },
    moderation: () => { import('./tabs/moderation-tab'); },
    reviews: () => { import('./course-reviews'); },
  };

  const renderTabContent = (): JSX.Element | null => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-2 sm:p-3 md:dark:p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-1 sm:px-2 md:px-4 lg:px-8">
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/50 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
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
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/40 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <QATab courseId={courseId} sections={allSections} userId={userId} isInstructor={isInstructor} />
          </motion.div>
        );

      case 'moderation':
        if (!isInstructor) return null;
        return (
          <motion.div
            role="tabpanel"
            id="panel-moderation"
            aria-labelledby="tab-moderation"
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/40 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ModerationTab courseId={courseId} />
          </motion.div>
        );

      case 'reviews':
        return (
          <motion.div
            role="tabpanel"
            id="panel-reviews"
            aria-labelledby="tab-reviews"
            tabIndex={-1}
            className="scroll-mt-sticky cv-auto min-w-0 overflow-x-auto scrolling-touch overscroll-x-contain dark:bg-slate-900/40 dark:border dark:border-slate-800 rounded-lg sm:dark:rounded-2xl p-3 sm:p-4 md:dark:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CourseReviews courseId={courseId} initialReviews={initialReviews} isEnrolled={isEnrolled} userId={userId} />
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
    const dirAdjusted = isRTL ? -delta : delta;
    scrollRef.current.scrollBy({ left: dirAdjusted, behavior: 'smooth' });
  };

  // Derive dynamic accent from category
  const palette = getCategoryPalette(course?.category?.name);

  return (
    <div
      className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-[100vw] overflow-x-hidden"
      style={{
        ['--accent' as any]: palette.primary,
        ['--accent-2' as any]: palette.secondary,
      }}
    >
      {/* Sticky Tab Navigation - Elevated Design for Hero Overlap */}
      <div
        className="mb-6 sm:mb-8 sticky z-[40] course-tabs-sticky"
        // Respect safe-area on notched devices and allow global sticky offset overrides
        style={{ top: 'calc(var(--sticky-offset, 12px) + env(safe-area-inset-top, 0px))' }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-md md:shadow-2xl md:shadow-blue-900/20 dark:md:shadow-black/60 mx-auto backdrop-blur-md md:bg-white/98 dark:md:bg-slate-900/98 ring-1 ring-white/20 dark:ring-slate-700/30" style={{ maxWidth: '1280px' }}>
          <nav
            ref={scrollRef}
            className="flex gap-0.5 sm:gap-1 overflow-x-auto scroll-smooth no-scrollbar p-1 sm:p-1.5 -webkit-overflow-scrolling-touch snap-x snap-mandatory"
            role="tablist"
            aria-label={dict.tabs}
            aria-orientation="horizontal"
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
                  onMouseEnter={() => { try { preloaders[tab.id]?.(); } catch {} }}
                  onClick={() => {
                    setActiveTab(tab.id);
                    updateQuery(tab.id);
                    try {
                      EventTracker.getInstance().trackInteraction('course_tab_selected', {
                        tab: tab.id,
                        courseId,
                      });
                    } catch {}
                  }}
                  aria-label={`${typeof tab.label === 'string' ? tab.label : 'Tab'}${tab.count !== undefined ? ` (${tab.count})` : ''}`}
                  className={`
                    relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap rounded-md sm:rounded-lg snap-start
                    transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 touch-manipulation
                    ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0">{tab.icon}</span>
                  <span className="hidden xs:inline sm:inline">{typeof tab.label === 'string' ? tab.label : 'Tab'}</span>
                  {tab.count !== undefined && (
                    <span className={`
                      inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content - Responsive Container */}
      <div className="min-h-[400px] sm:min-h-[500px] mx-auto" style={{ maxWidth: '1280px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};
