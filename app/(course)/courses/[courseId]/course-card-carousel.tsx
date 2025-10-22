"use client";

import React, { useState, useEffect } from 'react';
import parse from 'html-react-parser';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, ChevronRight, Clock, Info, Layers, X, Play, HelpCircle, ListChecks } from 'lucide-react';
import { Chapter, Section } from '@prisma/client';
import { Carousel } from '@/components/cardscarousel/cards-carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Utility function to clean and format HTML content
const cleanHtmlContent = (htmlString: string | null): string => {
  if (!htmlString) return '';
  
  return htmlString
    .replace(/<br\s*\/?>/gi, '\n')           // Convert <br> tags to line breaks
    .replace(/<\/p>/gi, '\n\n')              // Convert </p> to double line breaks
    .replace(/<p[^>]*>/gi, '')               // Remove <p> opening tags
    .replace(/<[^>]*>/g, '')                 // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ')                 // Replace &nbsp; with regular spaces
    .replace(/&amp;/g, '&')                  // Replace &amp; with &
    .replace(/&lt;/g, '<')                   // Replace &lt; with <
    .replace(/&gt;/g, '>')                   // Replace &gt; with >
    .replace(/&quot;/g, '"')                 // Replace &quot; with "
    .replace(/&#39;/g, "'")                  // Replace &#39; with '
    .replace(/\n\s*\n\s*\n/g, '\n\n')        // Replace multiple line breaks with double
    .trim();                                 // Remove leading/trailing whitespace
};

// Enhanced HTML parser for rich content
const parseHtmlContent = (htmlString: string | null): React.ReactNode => {
  if (!htmlString) return null;
  
  // Clean up common HTML entities and formatting
  const cleanedHtml = htmlString
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return parse(cleanedHtml);
};

interface CourseContentProps {
  courseId?: string;
  chapters: (Chapter & {
    sections: Section[];
    learningOutcomes: string | null;
  })[] | undefined;
}

// Update the gradient colors array for better light mode contrast
const chapterGradients = [
  "from-purple-500/10 to-purple-900/10 dark:from-purple-500/20 dark:to-purple-900/20 border-purple-500/20 dark:border-purple-500/30",
  "from-blue-500/10 to-blue-900/10 dark:from-blue-500/20 dark:to-blue-900/20 border-blue-500/20 dark:border-blue-500/30",
  "from-cyan-500/10 to-cyan-900/10 dark:from-cyan-500/20 dark:to-cyan-900/20 border-cyan-500/20 dark:border-cyan-500/30",
  "from-emerald-500/10 to-emerald-900/10 dark:from-emerald-500/20 dark:to-emerald-900/20 border-emerald-500/20 dark:border-emerald-500/30",
  "from-rose-500/10 to-rose-900/10 dark:from-rose-500/20 dark:to-rose-900/20 border-rose-500/20 dark:border-rose-500/30",
  "from-amber-500/10 to-amber-900/10 dark:from-amber-500/20 dark:to-amber-900/20 border-amber-500/20 dark:border-amber-500/30",
];

const accentColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
];

export const CourseCardsCarousel = ({ courseId, chapters }: CourseContentProps): JSX.Element | null => {
  const [selectedChapter, setSelectedChapter] = useState<(Chapter & { sections: Section[] }) | null>(null);
  const [summary, setSummary] = useState<{ progressPercent?: number | null; nextSection?: { chapterId: string; sectionId: string } | null } | null>(null);
  const [chapterProgress, setChapterProgress] = useState<Record<string, number>>({});
  const [chapterPending, setChapterPending] = useState<Record<string, { byType: Record<string, number>; total: number }>>({});
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!courseId) return;
    fetch(`/api/courses/${courseId}/certificate`).then(async (r) => r.ok ? r.json() : null).then((d) => {
      if (!cancelled && d) setSummary({ progressPercent: d.progressPercent, nextSection: d.nextSection ? { chapterId: d.nextSection.chapterId, sectionId: d.nextSection.sectionId } : null });
    }).catch(() => {});
    fetch(`/api/courses/${courseId}/chapters/progress`).then(async (r) => r.ok ? r.json() : null).then((d) => {
      if (!cancelled && d?.chapters) {
        const map: Record<string, number> = {};
        d.chapters.forEach((c: any) => { map[c.chapterId] = c.percent; });
        setChapterProgress(map);
      }
    }).catch(() => {});
    fetch(`/api/courses/${courseId}/chapters/pending`).then(async (r) => r.ok ? r.json() : null).then((d) => {
      if (!cancelled && d?.chapters) {
        const map: Record<string, { byType: Record<string, number>; total: number }> = {};
        d.chapters.forEach((c: any) => { map[c.chapterId] = { byType: c.byType || {}, total: c.total || 0 }; });
        setChapterPending(map);
      }
    }).catch(() => {});
    // Respect reduced motion preference
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => setReducedMotion(!!mql.matches);
      update();
      mql.addEventListener('change', update);
      return () => { cancelled = true; mql.removeEventListener('change', update); };
    } catch {
      return () => { cancelled = true; };
    }
  }, [courseId]);

  if (!chapters) return null;

  const cards = chapters.map((chapter, index) => (
    <motion.div
      key={chapter.id}
      onClick={() => setSelectedChapter(chapter)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedChapter(chapter);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open chapter: ${cleanHtmlContent(chapter.title)}`}
      className="w-[240px] sm:w-[260px] md:w-[280px] lg:w-[300px] h-[420px] sm:h-[460px] md:h-[500px] cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-0 rounded-xl"
      whileHover={reducedMotion ? undefined : { y: -6, rotateX: 2, rotateY: -1, scale: 1.01 }}
      style={{ transformPerspective: 1000 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Card className="relative h-full w-full rounded-xl border border-slate-200/80 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/50 backdrop-blur supports-[backdrop-filter]:backdrop-blur text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700">
        {/* Per-card accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${accentColors[index % accentColors.length]}`} aria-hidden="true" />
        <CardContent className="p-5 sm:p-6 h-full flex flex-col">
          <ChapterPreview
            title={chapter.title}
            description={chapter.description}
            sectionCount={chapter.sections.length}
            colorIndex={index % chapterGradients.length}
            chapterNumber={index + 1}
            durationMinutes={(chapter.sections || []).reduce((a, s) => a + (s.duration || 0), 0)}
            progressPercent={chapterProgress[chapter.id] ?? 0}
            pendingByType={chapterPending[chapter.id]?.byType}
            onViewDetails={() => setSelectedChapter(chapter)}
          />
        </CardContent>
        {/* Progress */}
        <div className="px-5 pb-5">
          <div className="h-1.5 bg-muted/60 dark:bg-slate-800 rounded-full overflow-hidden">
            {typeof chapterProgress[chapter.id] === 'number' ? (
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.max(0, Math.min(100, chapterProgress[chapter.id] ?? 0))}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.max(0, Math.min(100, Math.round(chapterProgress[chapter.id] ?? 0)))}
              />
            ) : (
              <div
                className="h-full w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 bg-size-200 animate-shimmer"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {typeof chapterProgress[chapter.id] === 'number'
              ? `${Math.max(0, Math.min(100, Math.round(chapterProgress[chapter.id] ?? 0)))}% complete`
              : 'Loading progress…'}
          </div>
        </div>
      </Card>
    </motion.div>
  ));

  const totalSections = chapters?.reduce((acc, ch) => acc + (ch.sections?.length || 0), 0) || 0;
  const totalMinutes = chapters?.reduce((acc, ch) => acc + (ch.sections || []).reduce((a, s) => a + (s.duration || 0), 0), 0) || 0;
  const formattedDuration = totalMinutes > 0 ? (() => { const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`; })() : '—';

  return (
    <div className="relative cv-auto">
      {/* Header summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">{chapters?.length || 0} chapters</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">{totalSections} lessons</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">{formattedDuration}</span>
          {typeof summary?.progressPercent === 'number' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">Progress: {Math.max(0, Math.min(100, Math.round(summary.progressPercent!)))}%</span>
          )}
        </div>
        {summary?.nextSection && courseId && (
          <a
            href={`/courses/${courseId}?tab=content&chapter=${summary.nextSection.chapterId}&section=${summary.nextSection.sectionId}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm"
          >
            Resume
          </a>
        )}
      </div>
      <div className="w-full">
        <div className="max-w-[1400px] mx-auto">
          <Carousel items={cards} ariaLabel="Course chapters" />
        </div>
      </div>

      <AnimatePresence>
        {selectedChapter && (
          <ChapterModal
            chapter={selectedChapter}
            onClose={() => setSelectedChapter(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface ChapterModalProps {
  chapter: Chapter & { sections: Section[] };
  onClose: () => void;
}

const ChapterModal = ({ chapter, onClose }: ChapterModalProps): JSX.Element => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const primaryRef = React.useRef<HTMLAnchorElement | null>(null);
  React.useEffect(() => { modalRef.current?.focus(); }, []);
  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); (last as HTMLElement).focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); (first as HTMLElement).focus(); }
    }
  };
  const firstSectionId = chapter.sections?.[0]?.id;
  const courseIdFromLocation = (() => {
    try {
      const parts = window.location.pathname.split('/');
      const idx = parts.indexOf('courses');
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    } catch {}
    return '';
  })();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl my-8 focus:outline-none"
        role="dialog" aria-modal="true" aria-labelledby="chapter-modal-title"
        ref={modalRef} tabIndex={-1} onKeyDown={trapFocus}
      >
        {/* Container */}
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden">
          {/* Top border */}
          <div className="absolute top-0 left-0 right-0 h-px bg-slate-200 dark:bg-slate-800" />

          {/* Modal Header */}
          <div className="relative p-8 sm:p-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            </div>

            <div className="relative flex items-start justify-between gap-6">
              <div className="flex items-start gap-5 flex-1 min-w-0">
                {/* Animated icon container */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 150, damping: 12 }}
                  className="flex-shrink-0 relative group/icon"
                >
                  <div className="absolute -inset-1 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-3xl blur-lg opacity-40 group-hover/icon:opacity-60 transition duration-300" />
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-3xl bg-gradient-to-br from-purple-500 via-blue-600 to-cyan-600 flex items-center justify-center shadow-xl transform group-hover/icon:scale-110 transition-transform duration-300">
                    <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>

                <div className="flex-1 min-w-0 pt-1">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                        Chapter Overview
                      </span>
                    </div>
                    <h3 id="chapter-modal-title" className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-4">
                      {cleanHtmlContent(chapter.title)}
                    </h3>
                  </motion.div>

                  {/* Enhanced chapter stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <div className="group/stat">
                      <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200/60 dark:border-blue-500/30">
                        <div className="p-1.5 rounded-xl bg-blue-500 shadow-md">
                          <Layers className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Sections</span>
                          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{chapter.sections.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="group/stat">
                      <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200/60 dark:border-emerald-500/30">
                        <div className="p-1.5 rounded-xl bg-emerald-500 shadow-md">
                          <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Duration</span>
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{chapter.estimatedTime || 'Multi-lesson'}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Enhanced close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 200 }}
                onClick={onClose}
                className="flex-shrink-0"
                ref={closeRef}
                aria-label="Close modal"
              >
                <div className="relative p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </div>
              </motion.button>
            </div>
          </div>

          {/* Modal Content - Enhanced scrollbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-8 sm:p-10 max-h-[calc(80vh-240px)] overflow-y-auto
                     scrollbar-thin scrollbar-thumb-rounded-full
                     scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
                     hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500
                     scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
          >
            <DummyContent description={chapter.description} sections={chapter.sections} chapter={chapter} />
          </motion.div>

          {/* Modal Footer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-8 sm:p-10 pt-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Ready to dive in?</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Explore all sections and master this chapter</p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Close
                </button>
                <div className="flex-1 sm:flex-none">
                  <a
                    href={courseIdFromLocation ? `/courses/${courseIdFromLocation}?tab=content&chapter=${chapter.id}${firstSectionId ? `&section=${firstSectionId}` : ''}` : '#'}
                    className="relative w-full px-8 py-3.5 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    ref={primaryRef}
                  >
                    <span>Start Learning</span>
                    <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface ChapterPreviewProps {
  title: string;
  description: string | null;
  sectionCount: number;
  colorIndex: number;
  chapterNumber: number;
  durationMinutes?: number;
  progressPercent?: number;
  pendingByType?: Record<string, number>;
  onViewDetails: () => void;
}

// Enterprise-style, minimal Chapter preview used in the card
const ChapterPreview = ({ title, description, sectionCount, chapterNumber, durationMinutes, progressPercent = 0, pendingByType, onViewDetails }: ChapterPreviewProps): JSX.Element => {
  const cleanDescription = description ? cleanHtmlContent(description) : 'No description available.';
  const titleText = cleanHtmlContent(title);
  const isLongTitle = titleText.length > 90;
  const descClampClass = isLongTitle ? 'line-clamp-1' : 'line-clamp-2';

  return (
    <div className="h-full flex flex-col">
      {/* Top row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md bg-muted px-2 font-medium">#{chapterNumber}</span>
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {sectionCount} sections
          </span>
          {typeof durationMinutes === 'number' && durationMinutes > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {(() => { const h = Math.floor(durationMinutes / 60); const m = durationMinutes % 60; return h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`; })()}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-[15px] sm:text-base font-semibold text-foreground leading-snug break-words"
        title={cleanHtmlContent(title)}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`mt-2 text-sm text-muted-foreground ${descClampClass} flex-1`}
      >
        {cleanDescription}
      </motion.p>

      {/* Meta / Pending */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          {pendingByType && Object.entries(pendingByType).filter(([, v]) => v > 0).slice(0, 3).map(([k, v]) => {
            const normalized = (k || '').toString();
            const noun = normalized === 'Video' ? (v === 1 ? 'video lesson' : 'video lessons')
              : normalized === 'Quiz' ? (v === 1 ? 'quiz' : 'quizzes')
              : normalized === 'Assignment' ? (v === 1 ? 'assignment' : 'assignments')
              : (v === 1 ? 'item' : 'items');
            const title = `${v} ${noun} pending`;
            return (
              <TooltipProvider key={k}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 border-amber-200/70 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300" title={title}>
                      {normalized === 'Video' ? <Play className="w-3 h-3" /> : normalized === 'Quiz' ? <HelpCircle className="w-3 h-3" /> : normalized === 'Assignment' ? <ListChecks className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      {v} {normalized.toLowerCase()}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{title}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {pendingByType && Object.entries(pendingByType).filter(([, v]) => v > 0).length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-muted">+{Object.entries(pendingByType).filter(([, v]) => v > 0).length - 3} more</span>
          )}
        </div>
        <div className="ml-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 rounded"
            aria-label={`View details for ${cleanHtmlContent(title)}`}
          >
            View details
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Existing DummyContent component remains the same
interface DummyContentProps {
  description: string | null;
  sections: Section[];
  chapter: Chapter & {
    sections: Section[];
    learningOutcomes: string | null;
  };
}

const DummyContent = ({ description, sections, chapter }: DummyContentProps): JSX.Element => {
  return (
    <div className="space-y-8">
      {/* Chapter Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chapter Overview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">What you&apos;ll learn in this chapter</p>
          </div>
        </div>

        <div className="relative group">
          <div className="relative bg-white dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            {description ? (
              <div className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-em:text-gray-600 dark:prose-em:text-gray-400
                prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                prose-li:marker:text-blue-500">
                {parseHtmlContent(description)}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 italic">No description available for this chapter.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Learning Outcomes Section */}
      {chapter.learningOutcomes && (() => {
        // Intelligent parsing of learning outcomes
        const parseLearningOutcomes = (text: string): string[] => {
          // Remove HTML tags first
          const cleanText = text.replace(/<[^>]*>/g, '');

          // Try multiple parsing strategies
          let outcomes: string[] = [];

          // Strategy 1: Check for newline-separated items (most common)
          if (cleanText.includes('\n')) {
            outcomes = cleanText
              .split('\n')
              .map(line => line.trim())
              .filter(line => line.length > 10); // Filter out empty or very short lines
          }

          // Strategy 2: Check for numbered list patterns (1., 2., etc.)
          if (outcomes.length === 0 || outcomes.length === 1) {
            const numberedMatches = cleanText.match(/\d+\.\s+[^\n]+/g);
            if (numberedMatches && numberedMatches.length > 1) {
              outcomes = numberedMatches.map(match => match.replace(/^\d+\.\s+/, '').trim());
            }
          }

          // Strategy 3: Check for bullet point patterns (-, *, •)
          if (outcomes.length === 0 || outcomes.length === 1) {
            const bulletMatches = cleanText.match(/[•\-*]\s+[^\n]+/g);
            if (bulletMatches && bulletMatches.length > 1) {
              outcomes = bulletMatches.map(match => match.replace(/^[•\-*]\s+/, '').trim());
            }
          }

          // Strategy 4: Look for common learning objective patterns
          // "Students will be able to...", "Learners will...", "You will..."
          if (outcomes.length === 0 || outcomes.length === 1) {
            const patterns = [
              /(?:Students?|Learners?|You) will (?:be able to|learn to|understand|know|demonstrate)[^.!?]*[.!?]/gi,
              /(?:Understand|Learn|Demonstrate|Explain|Analyze|Apply|Create|Evaluate)[^.!?]*[.!?]/gi
            ];

            for (const pattern of patterns) {
              const matches = cleanText.match(pattern);
              if (matches && matches.length > 1) {
                outcomes = matches.map(match => match.trim());
                break;
              }
            }
          }

          // Strategy 5: Fallback - split by sentence endings with length check
          if (outcomes.length === 0 || outcomes.length === 1) {
            outcomes = cleanText
              .split(/[.!?]+\s+/)
              .map(sentence => sentence.trim())
              .filter(sentence => sentence.length > 20); // Only keep substantial sentences
          }

          // Final cleanup: remove duplicates and empty entries
          return Array.from(new Set(outcomes))
            .filter(outcome => outcome && outcome.length > 10)
            .map(outcome => {
              // Ensure proper ending punctuation
              const trimmed = outcome.trim();
              if (!/[.!?]$/.test(trimmed)) {
                return trimmed + '.';
              }
              return trimmed;
            });
        };

        const outcomes = parseLearningOutcomes(chapter.learningOutcomes);

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Learning Objectives</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {outcomes.length} objective{outcomes.length !== 1 ? 's' : ''} • By the end of this chapter, you will be able to
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="relative bg-white dark:bg-gray-800/50 border border-purple-100 dark:border-gray-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  {outcomes.map((outcome: string, outcomeIndex: number) => (
                    <motion.div
                      key={`outcome-${chapter.id}-${outcomeIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: outcomeIndex * 0.1 }}
                      className="flex items-start gap-4 group/outcome"
                    >
                      {/* Animated checkmark */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="relative">
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover/outcome:opacity-40 transition duration-300" />
                          <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>

                      {/* Outcome text */}
                      <div className="flex-1 pt-0.5">
                        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                          {outcome}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sections List */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Chapter Sections</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{sections.length} lessons to complete</p>
          </div>
        </div>

        <div className="relative group">
          <div className="relative bg-white dark:bg-gray-800/50 border border-emerald-100 dark:border-gray-700/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <div className="grid gap-3">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group/section"
                >
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
                    {/* Section number */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                    </div>

                    {/* Section title */}
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white leading-tight group-hover/section:text-emerald-600 dark:group-hover/section:text-emerald-400 transition-colors">
                        {cleanHtmlContent(section.title)}
                      </h4>
                    </div>

                    {/* Section type indicator */}
                    {section.type && (
                      <div className="flex-shrink-0">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {section.type}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Course Prerequisites or Additional Info */}
      {chapter.prerequisites && (
        <div className="mt-6">
          <div className="flex items-start gap-3 p-5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Info className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Prerequisites</h4>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                {chapter.prerequisites}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
