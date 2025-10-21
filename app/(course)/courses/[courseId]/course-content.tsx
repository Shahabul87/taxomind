"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  GraduationCap,
  Info,
  Lock,
  PlayCircle,
  Sparkles,
  Unlock,
  Link as LinkIcon
} from 'lucide-react';
import { Chapter, Section } from '@prisma/client';
import { cn } from '@/lib/utils';
import { EventTracker } from '@/lib/analytics/event-tracker';

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
  
  text = text.replace(/&[#\w]+;/g, (entity: string): string => {
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

const SectionItem = ({ section, courseId, chapterId, isEnrolled, sectionIndex }: SectionItemProps): JSX.Element => {
  const router = useRouter();
  const isAccessible = isEnrolled || section.isFree || section.isPreview;
  
  const handleSectionClick = (): void => {
    if (!isAccessible) {
      // Scroll to enroll card on same page
      try {
        const el = document.getElementById('enroll-card');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        EventTracker.getInstance().trackInteraction('course_section_locked_click', {
          courseId,
          chapterId,
          sectionId: section.id,
        });
      } catch {}
      // Note: setActivity not available in this scope
      return;
    }

    // For both enrolled users and free/preview content, navigate to the section
    try {
      EventTracker.getInstance().trackInteraction('course_section_opened', {
        courseId,
        chapterId,
        sectionId: section.id,
      });
    } catch {}
    // Note: setActivity not available in this scope
    router.push(`/courses/${courseId}/learn/${chapterId}/sections/${section.id}`);
  };

  const getSectionIcon = (): JSX.Element => {
    if (section.type === 'Video') {
      return <PlayCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
  };

  const getSectionBadge = (): JSX.Element | null => {
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
      role="button"
      tabIndex={0}
      data-section-id={section.id}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSectionClick();
        }
      }}
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

export const CourseContent = ({ 
  chapters, 
  courseId, 
  isEnrolled = false, 
  userId 
}: CourseContentProps): JSX.Element => {
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'type' | 'duration-asc' | 'duration-desc'>('default');
  const [showActivity, setShowActivity] = useState<boolean>(false);
  const [activity, setActivity] = useState({
    searches: 0,
    chapterToggles: 0,
    expandAll: 0,
    sectionOpens: 0,
    lockedClicks: 0,
    copyLinks: 0,
  });
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const toggleChapter = (index: number): void => {
    const nextState = index === expandedChapter ? null : index;
    setExpandedChapter(nextState);
    updateQuery({ chapter: nextState === null ? null : String(nextState), section: null });
    setActivity((a) => ({ ...a, chapterToggles: a.chapterToggles + 1 }));
    try {
      EventTracker.getInstance().trackInteraction('course_chapter_toggle', {
        courseId,
        chapterIndex: index,
        expanded: nextState !== null,
      });
    } catch {}
  };

  const toggleExpandAll = (): void => {
    const next = !expandAll;
    setExpandAll(next);
    setExpandedChapter(next ? -1 : null);
    setActivity((a) => ({ ...a, expandAll: a.expandAll + 1 }));
    try {
      EventTracker.getInstance().trackInteraction('course_content_expand_all', {
        courseId,
        expandAll: next,
      });
    } catch {}
  };

  const getDifficultyColor = (difficulty: string | null | undefined): string => {
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

  const totalMinutes = useMemo(() => {
    return chapters?.reduce((acc, chapter) => acc + ((chapter.sections || []).reduce((a, s) => a + (s.duration || 0), 0)), 0) || 0;
  }, [chapters]);

  const formattedDuration = useMemo(() => {
    if (!totalMinutes || totalMinutes <= 0) return '—';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
  }, [totalMinutes]);

  const accessibleMinutesTotal = useMemo(() => {
    return chapters?.reduce((acc, chapter) => acc + ((chapter.sections || [])
      .filter((s) => s.isFree || s.isPreview)
      .reduce((a, s) => a + (s.duration || 0), 0)), 0) || 0;
  }, [chapters]);

  const formattedAccessibleDuration = useMemo(() => {
    if (!accessibleMinutesTotal || accessibleMinutesTotal <= 0) return '—';
    const h = Math.floor(accessibleMinutesTotal / 60);
    const m = accessibleMinutesTotal % 60;
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
  }, [accessibleMinutesTotal]);

  const freeSectionsCount = useMemo(() => {
    return chapters?.reduce((acc, chapter) => acc + ((chapter.sections || []).filter((s) => s.isFree || s.isPreview).length), 0) || 0;
  }, [chapters]);

  const searchActive = search.trim().length > 0;
  const filteredChapters = useMemo(() => {
    if (!chapters) return [] as (Chapter & { sections: Section[] })[];
    if (!searchActive) return chapters as (Chapter & { sections: Section[] })[];
    const q = search.toLowerCase();
    return (chapters as (Chapter & { sections: Section[] })[])
      .map((ch) => {
        const titleMatch = (ch.title || '').toLowerCase().includes(q);
        const matchedSections = (ch.sections || []).filter((s) => (s.title || '').toLowerCase().includes(q));
        if (titleMatch || matchedSections.length > 0) {
          return { ...ch, sections: matchedSections.length > 0 ? matchedSections : ch.sections } as Chapter & { sections: Section[] };
        }
        return null;
      })
      .filter(Boolean) as (Chapter & { sections: Section[] })[];
  }, [chapters, searchActive, search]);

  // Resume pill when arriving via deep link (?section=...)
  const resumeSectionId = searchParams?.get('section') || '';
  const resumeContext = useMemo(() => {
    if (!resumeSectionId || !chapters) return null as null | { chapterId: string; chapterTitle: string; sectionId: string; sectionTitle: string };
    for (const ch of chapters as (Chapter & { sections: Section[] })[]) {
      const s = (ch.sections || []).find((sec) => sec.id === resumeSectionId);
      if (s) return { chapterId: ch.id, chapterTitle: ch.title || 'Chapter', sectionId: s.id, sectionTitle: s.title || 'Section' };
    }
    return null;
  }, [resumeSectionId, chapters]);

  // Track search interactions (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchActive && search.trim().length >= 2) {
        try {
          const matchCount = (filteredChapters || []).reduce((acc, ch) => acc + (ch.sections?.length || 0), 0);
          EventTracker.getInstance().trackInteraction('course_content_search', {
            courseId,
            queryLength: search.trim().length,
            matches: matchCount,
          });
        } catch {}
        setActivity((a) => ({ ...a, searches: a.searches + 1 }));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search, searchActive, filteredChapters, courseId]);

  // Initialize deep linking via query params (?chapter=<index or id>&section=<id>)
  useEffect(() => {
    if (!chapters) return;
    const chParam = searchParams?.get('chapter') || '';
    const secParam = searchParams?.get('section') || '';

    let chapterIndex: number | null = null;
    if (chParam) {
      const idx = Number(chParam);
      if (!Number.isNaN(idx)) {
        chapterIndex = Math.max(0, Math.min(chapters.length - 1, idx));
      } else {
        const byId = chapters.findIndex((c) => c.id === chParam);
        if (byId >= 0) chapterIndex = byId;
      }
    }

    if (secParam && !chapterIndex && chapterIndex !== 0) {
      // find chapter containing section
      const found = chapters.findIndex((c) => (c.sections || []).some((s) => s.id === secParam));
      if (found >= 0) chapterIndex = found;
    }

    if (chapterIndex !== null && chapterIndex >= 0) {
      setExpandedChapter(chapterIndex);
      // Scroll to section if provided
      if (secParam) {
        setTimeout(() => {
          const el = document.querySelector(`[data-section-id="${secParam}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters]);

  const updateQuery = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams?.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v === null) current.delete(k); else current.set(k, v);
    });
    router.replace(`${pathname}?${current.toString()}`, { scroll: false });
  };

  // Persist view preferences
  useEffect(() => {
    try {
      const S = localStorage.getItem(`courseContent:search:${courseId}`);
      const F = localStorage.getItem(`courseContent:freeOnly:${courseId}`);
      const O = localStorage.getItem(`courseContent:sort:${courseId}`);
      if (S) setSearch(S);
      if (F) setFreeOnly(F === '1');
      if (O === 'type' || O === 'duration-asc' || O === 'duration-desc' || O === 'default') setSortBy(O);
      const L = localStorage.getItem(`courseContent:lastChapter:${courseId}`);
      if (L !== null && L !== undefined && L !== '') {
        const idx = Number(L);
        if (!Number.isNaN(idx)) setExpandedChapter(idx);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    try { localStorage.setItem(`courseContent:search:${courseId}`, search); } catch {}
  }, [courseId, search]);
  useEffect(() => {
    try { localStorage.setItem(`courseContent:freeOnly:${courseId}`, freeOnly ? '1' : '0'); } catch {}
  }, [courseId, freeOnly]);
  useEffect(() => {
    try { localStorage.setItem(`courseContent:sort:${courseId}`, sortBy); } catch {}
  }, [courseId, sortBy]);
  useEffect(() => {
    if (expandedChapter !== null && expandedChapter >= 0) {
      try { localStorage.setItem(`courseContent:lastChapter:${courseId}`, String(expandedChapter)); } catch {}
    }
  }, [courseId, expandedChapter]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Course Content
          </h1>
          {!isEnrolled && accessibleSections > 0 && (
            <div className="mt-1 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-800/40">
                <Unlock className="w-3.5 h-3.5" />
                {accessibleSections} Free/Preview lessons
              </span>
            </div>
          )}
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
              <span className="font-medium">
                {formattedDuration === '—' ? 'Duration varies' : formattedDuration}
                {freeOnly && formattedAccessibleDuration !== '—' ? ` • Free: ${formattedAccessibleDuration}` : ''}
              </span>
              <span className="relative group">
                <Info className="w-4 h-4 text-gray-400" aria-label="Duration info" />
                <span role="tooltip" className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1 rounded bg-slate-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre z-10">
                  Total duration sums all section durations; Free sums only free/preview sections. Values are approximate.
                </span>
              </span>
            </div>
          </div>

          {/* Resume */}
          {resumeContext && (
            <div className="mt-6 flex justify-center">
              <div className="w-full max-w-2xl flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-300/70 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                <div className="text-sm truncate">
                  Resuming: <span className="font-semibold">{resumeContext.sectionTitle}</span> <span className="opacity-70">(in {resumeContext.chapterTitle})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector(`[data-section-id="${resumeContext.sectionId}"]`) as HTMLElement | null;
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/30"
                >
                  Jump to section
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mt-6 flex justify-center">
            <label htmlFor="content-search" className="sr-only">Search course content</label>
            <div className="w-full max-w-xl flex items-center gap-2">
              <input
                id="content-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chapters or lessons"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              {searchActive && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              aria-pressed={freeOnly}
              onClick={() => setFreeOnly(v => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${freeOnly ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/40' : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'}`}
            >
              <Unlock className="w-4 h-4" />
              Free/Preview only
            </button>
            <div className="inline-flex items-center gap-2">
              <label htmlFor="sort-by" className="text-sm text-gray-600 dark:text-gray-300">Sort by</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200"
              >
                <option value="default">Default order</option>
                <option value="type">Type</option>
                <option value="duration-asc">Duration (shortest)</option>
                <option value="duration-desc">Duration (longest)</option>
              </select>
            </div>
            {(freeOnly || sortBy !== 'default' || searchActive) && (
              <button
                type="button"
                onClick={() => { setFreeOnly(false); setSortBy('default'); setSearch(''); }}
                className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Reset
              </button>
            )}
          </div>

          {/* Free-only summary */}
          {freeOnly && (
            <div className="mt-3 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-300/70 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm">
                <Unlock className="w-4 h-4" />
                <span className="font-semibold">Free/Preview:</span>
                <span>{freeSectionsCount} {freeSectionsCount === 1 ? 'lesson' : 'lessons'}</span>
                {formattedAccessibleDuration !== '—' && (
                  <>
                    <span className="opacity-50">•</span>
                    <span>{formattedAccessibleDuration}</span>
                  </>
                )}
              </div>
            </div>
          )}

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
        
        {/* Expand/Collapse + Copy Link */}
        <div className="flex justify-center mt-8 gap-3">
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
          {expandedChapter !== null && expandedChapter >= 0 && (
            <button
              onClick={() => {
                const chapter = (chapters || [])[expandedChapter!];
                const params = new URLSearchParams(searchParams?.toString());
                params.set('tab', 'content');
                params.set('chapter', chapter?.id || String(expandedChapter));
                const url = `${window.location.origin}${pathname}?${params.toString()}`;
                navigator.clipboard?.writeText(url).catch(() => {});
                try {
                  EventTracker.getInstance().trackInteraction('course_chapter_link_copied', {
                    courseId,
                    chapterIndex: expandedChapter,
                    chapterId: chapter?.id,
                  });
                } catch {}
                setActivity((a) => ({ ...a, copyLinks: a.copyLinks + 1 }));
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Copy chapter link
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              try {
                const header = ['Chapter #','Chapter Title','Section #','Section Title','Type','Duration (min)','Free','Preview'];
                const rows: string[] = [];
                rows.push(header.join(','));
                (chapters || []).forEach((ch, ci) => {
                  const chapterIndex = ci + 1;
                  (ch.sections || []).forEach((s, si) => {
                    const sectionIndex = si + 1;
                    const cols = [
                      String(chapterIndex),
                      '"' + (ch.title || '').replace(/"/g, '""') + '"',
                      String(sectionIndex),
                      '"' + (s.title || '').replace(/"/g, '""') + '"',
                      (s.type || ''),
                      String(s.duration || 0),
                      String(s.isFree ? 1 : 0),
                      String(s.isPreview ? 1 : 0),
                    ];
                    rows.push(cols.join(','));
                  });
                });
                const csvString = rows.join('\n');
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `course_syllabus_${courseId}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                EventTracker.getInstance().trackInteraction('course_syllabus_export', {
                  courseId,
                  chapters: (chapters || []).length,
                });
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Export CSV
          </button>
          <a
            href={`/api/courses/${courseId}/syllabus?format=csv`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Server CSV
          </a>
          <button
            type="button"
            onClick={() => {
              try {
                const payload = (chapters || []).map((ch, ci) => ({
                  chapterIndex: ci + 1,
                  id: ch.id,
                  title: ch.title,
                  description: ch.description,
                  summary: cleanHtmlTags(ch.description || ''),
                  status: (ch as any).status,
                  difficulty: (ch as any).difficulty,
                  estimatedTime: (ch as any).estimatedTime,
                  tags: (ch as any).tags || [],
                  sections: (ch.sections || []).map((s, si) => ({
                    sectionIndex: si + 1,
                    id: s.id,
                    title: s.title,
                    type: (s as any).type,
                    duration: s.duration,
                    isFree: s.isFree,
                    isPreview: s.isPreview,
                    completionStatus: (s as any).completionStatus,
                  }))
                }));
                const blob = new Blob([JSON.stringify({ courseId, syllabus: payload }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `course_syllabus_${courseId}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                EventTracker.getInstance().trackInteraction('course_syllabus_export_json', { courseId });
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Export JSON
          </button>
          <a
            href={`/api/courses/${courseId}/syllabus?format=json`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Server JSON
          </a>
          <button
            type="button"
            onClick={() => {
              try {
                const win = window.open('', '_blank');
                if (!win) return;
                const style = `
                  <style>
                    body { font-family: ui-sans-serif, system-ui, -apple-system; padding: 24px; }
                    header { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px; }
                    header .brand { font-weight: 800; letter-spacing: .2px; color: #4f46e5; }
                    h1 { font-size: 22px; margin: 0; }
                    .muted { color: #64748b; margin: 6px 0 16px; }
                    h2 { font-size: 18px; margin: 16px 0 8px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; }
                    th { background: #f8fafc; text-align: left; }
                    .small { font-size: 12px; color: #64748b; }
                    .page-break { page-break-before: always; }
                  </style>
                `;
                const rows = (chapters || []).map((ch, ci) => {
                  const header = `<h2>${ci + 1}. ${ch.title || ''}</h2>`;
                  const tableHead = '<tr><th>#</th><th>Title</th><th>Type</th><th>Duration (min)</th><th>Free</th><th>Preview</th></tr>';
                  const tableRows = (ch.sections || []).map((s, si) => `
                    <tr>
                      <td>${si + 1}</td>
                      <td>${(s.title || '').replace(/</g,'&lt;')}</td>
                      <td>${(s as any).type || ''}</td>
                      <td>${s.duration || 0}</td>
                      <td>${s.isFree ? 'Yes' : ''}</td>
                      <td>${s.isPreview ? 'Yes' : ''}</td>
                    </tr>
                  `).join('');
                  return `${header}<table><thead>${tableHead}</thead><tbody>${tableRows}</tbody></table>${ci < (chapters || []).length - 1 ? '<div class="page-break"></div>' : ''}`;
                }).join('');
                win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>${style}<title>Course Syllabus</title></head><body><header><div class="brand">Taxomind</div><h1>Course Syllabus</h1></header><div class="muted">Course ID: ${courseId}</div>${rows}<div class="small">Generated ${new Date().toLocaleString()}</div><script>window.onload = () => setTimeout(() => window.print(), 100);</script></body></html>`);
                win.document.close();
                EventTracker.getInstance().trackInteraction('course_syllabus_export_pdf', { courseId });
              } catch {}
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Save as PDF
          </button>
          <button
            type="button"
            onClick={() => setShowActivity(s => !s)}
            aria-pressed={showActivity}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {showActivity ? 'Hide' : 'Show'} activity
          </button>
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-4">
        {filteredChapters?.map((chapter, index) => {
          const accessibleSectionsInChapter = chapter.sections?.filter(section => 
            isEnrolled || section.isFree || section.isPreview
          ).length || 0;
          const completedCount = chapter.sections?.filter((s) => s.completionStatus === 'Completed').length || 0;
          const totalInChapter = chapter.sections?.length || 0;
          const progressPct = totalInChapter > 0 ? Math.round((completedCount / totalInChapter) * 100) : 0;
          const isOpen = searchActive || expandAll || expandedChapter === index;
          const chapterMinutesTotal = (chapter.sections || []).reduce((a, s) => a + (s.duration || 0), 0);
          const chapterMinutesAccessible = (chapter.sections || [])
            .filter((s) => s.isFree || s.isPreview)
            .reduce((a, s) => a + (s.duration || 0), 0);
          const fmt = (mins: number) => {
            if (!mins || mins <= 0) return '—';
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
          };
          
          return (
            <motion.div 
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Chapter Header */}
              <div
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                onClick={() => toggleChapter(index)}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-controls={`chapter-panel-${index}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleChapter(index);
                  }
                }}
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
                    
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <span className="truncate">{chapter.title}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${accessibleSectionsInChapter > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800/40' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700/50'}`}>
                        Free: {accessibleSectionsInChapter}/{totalInChapter}
                      </span>
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
                      {!chapter.estimatedTime && chapterMinutesTotal > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{fmt(chapterMinutesTotal)}</span>
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
                      {freeOnly && chapterMinutesAccessible > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Clock className="w-4 h-4" />
                          <span>Free: {fmt(chapterMinutesAccessible)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEnrolled && totalInChapter > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{completedCount}/{totalInChapter} • {progressPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </motion.div>
                </div>
              </div>

              {/* Chapter Content */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                    id={`chapter-panel-${index}`}
                  >
                    <div className="border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40">
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
                          {chapter.sections && chapter.sections.length > 0 && (
                            (() => {
                              let secs = [...chapter.sections];
                              if (freeOnly) {
                                secs = secs.filter((s) => s.isFree || s.isPreview);
                              }
                              if (sortBy === 'type') {
                                const order = (t?: string | null) => (t === 'Video' ? 0 : 1);
                                secs.sort((a, b) => order(a.type) - order(b.type));
                              } else if (sortBy === 'duration-asc') {
                                secs.sort((a, b) => (a.duration || Infinity) - (b.duration || Infinity));
                              } else if (sortBy === 'duration-desc') {
                                secs.sort((a, b) => (b.duration || -1) - (a.duration || -1));
                              }
                              const initial = Math.min(secs.length, visibleCounts[chapter.id] || 20);
                              const items = secs.slice(0, initial);
                              return (
                                <>
                                  {items.map((section, sectionIndex) => (
                                    <SectionItem
                                      key={section.id}
                                      section={section}
                                      courseId={courseId}
                                      chapterId={chapter.id}
                                      isEnrolled={isEnrolled}
                                      sectionIndex={sectionIndex}
                                    />
                                  ))}
                                  {chapter.sections.length > initial && (
                                    <div className="pt-2">
                                      <button
                                        type="button"
                                        onClick={() => setVisibleCounts((prev) => ({ ...prev, [chapter.id]: (prev[chapter.id] || 20) + 20 }))}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        Load 20 more
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()
                          )}
                        </div>

                        {/* Resources */}
                        {chapter.resources && (
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="font-medium text-purple-900 dark:text-purple-100">Additional Resources</span>
                            </div>
                            <div className="space-y-2">
                              {JSON.parse(chapter.resources).map((resource: string, resourceIndex: number) => (
                                <div key={`resource-${chapter.id}-${resourceIndex}`} className="flex items-center gap-2 text-purple-800 dark:text-purple-200 text-sm">
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

      {/* Session activity (optional) */}
      {showActivity && (
        <div className="mt-10 p-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Session Activity</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Searches</span><span className="font-semibold">{activity.searches}</span></div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Chapter toggles</span><span className="font-semibold">{activity.chapterToggles}</span></div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Expand/collapse all</span><span className="font-semibold">{activity.expandAll}</span></div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Section opens</span><span className="font-semibold">{activity.sectionOpens}</span></div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Locked clicks</span><span className="font-semibold">{activity.lockedClicks}</span></div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 rounded-lg px-3 py-2"><span>Copy links</span><span className="font-semibold">{activity.copyLinks}</span></div>
          </div>
        </div>
      )}

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

      {/* Resume FAB */}
      {resumeContext && (
        <button
          type="button"
          onClick={() => {
            const el = document.querySelector(`[data-section-id="${resumeContext.sectionId}"]`) as HTMLElement | null;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { EventTracker.getInstance().trackInteraction('content_resume_fab_click', { courseId, sectionId: resumeContext.sectionId }); } catch {}
          }}
          className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg border border-amber-400"
          aria-label="Resume section"
        >
          Resume
        </button>
      )}
    </div>
  );
};
