"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Map,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  RefreshCw,
  AlertTriangle,
  Loader2,
  BookOpen,
  Clock,
  Layers,
  Pencil,
  Check,
} from 'lucide-react';
import type {
  StepComponentProps,
  TeacherBlueprint,
  BlueprintChapter,
} from '../../types/sam-creator.types';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// =============================================================================
// BLOOMS LEVELS
// =============================================================================

const BLOOMS_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

const BLOOMS_COLORS: Record<string, string> = {
  REMEMBER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  UNDERSTAND: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  APPLY: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  ANALYZE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  EVALUATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  CREATE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
};

// =============================================================================
// INLINE EDITABLE TEXT
// =============================================================================

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

function InlineEdit({ value, onSave, className, inputClassName, placeholder }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
            if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
          }}
          onBlur={handleSave}
          className={cn('h-7 text-xs', inputClassName)}
          placeholder={placeholder}
        />
        <Button type="button" variant="ghost" size="sm" onClick={handleSave} className="h-6 w-6 p-0 flex-shrink-0">
          <Check className="h-3 w-3 text-emerald-600" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); setEditValue(value); }}
      className={cn(
        'group/edit inline-flex items-center gap-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1 -mx-1 transition-colors cursor-text min-w-0',
        className,
      )}
      title="Click to edit"
    >
      <span className="truncate">{value}</span>
      <Pencil className="h-2.5 w-2.5 text-slate-400 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CourseBlueprintStep({ formData, setFormData }: StepComponentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const hasTriggeredRef = useRef(false);

  const blueprint = formData.teacherBlueprint;

  // -------------------------------------------------------------------------
  // Blueprint generation
  // -------------------------------------------------------------------------

  const generateBlueprint = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/sam/course-creation/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: formData.courseTitle,
          courseShortOverview: formData.courseShortOverview,
          category: formData.courseCategory,
          subcategory: formData.courseSubcategory,
          targetAudience: formData.targetAudience === 'Custom (describe below)'
            ? formData.customAudience
            : formData.targetAudience,
          difficulty: formData.difficulty,
          duration: formData.duration,
          courseGoals: formData.courseGoals,
          bloomsFocus: formData.bloomsFocus,
          chapterCount: formData.chapterCount,
          sectionsPerChapter: formData.sectionsPerChapter,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.blueprint) {
        throw new Error(data.error || 'No blueprint returned');
      }

      const newBlueprint: TeacherBlueprint = {
        chapters: data.blueprint.chapters,
        generatedAt: new Date().toISOString(),
        confidence: data.blueprint.confidence,
        isEdited: false,
        riskAreas: data.blueprint.riskAreas ?? [],
      };

      setFormData(prev => ({ ...prev, teacherBlueprint: newBlueprint }));
      setExpandedChapters(new Set([1]));
      toast.success('Blueprint generated', {
        description: `${newBlueprint.chapters.length} chapters with ${newBlueprint.chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate blueprint';
      logger.error('[BLUEPRINT_STEP] Generation error:', err);
      setError(msg);
      toast.error('Blueprint generation failed', { description: msg });
    } finally {
      setIsGenerating(false);
    }
  }, [formData, setFormData]);

  // Auto-generate blueprint on first mount if none exists.
  // Uses a ref to access the latest generateBlueprint without adding it to deps,
  // avoiding re-triggers when formData changes.
  const generateBlueprintRef = useRef(generateBlueprint);
  generateBlueprintRef.current = generateBlueprint;

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    if (blueprint) return;
    hasTriggeredRef.current = true;
    generateBlueprintRef.current();
  }, [blueprint]);

  // -------------------------------------------------------------------------
  // Chapter-level editing
  // -------------------------------------------------------------------------

  const updateChapter = useCallback((chapterPos: number, updates: Partial<BlueprintChapter>) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const chapters = prev.teacherBlueprint.chapters.map(ch => {
        if (ch.position !== chapterPos) return ch;
        return { ...ch, ...updates };
      });
      return {
        ...prev,
        teacherBlueprint: { ...prev.teacherBlueprint, chapters, isEdited: true },
      };
    });
  }, [setFormData]);

  const updateSectionTitle = useCallback((chapterPos: number, sectionPos: number, title: string) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const chapters = prev.teacherBlueprint.chapters.map(ch => {
        if (ch.position !== chapterPos) return ch;
        return {
          ...ch,
          sections: ch.sections.map(sec => {
            if (sec.position !== sectionPos) return sec;
            return { ...sec, title };
          }),
        };
      });
      return {
        ...prev,
        teacherBlueprint: { ...prev.teacherBlueprint, chapters, isEdited: true },
      };
    });
  }, [setFormData]);

  // -------------------------------------------------------------------------
  // Topic editing
  // -------------------------------------------------------------------------

  const removeTopic = useCallback((chapterPos: number, sectionPos: number, topicIndex: number) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const chapters = prev.teacherBlueprint.chapters.map(ch => {
        if (ch.position !== chapterPos) return ch;
        return {
          ...ch,
          sections: ch.sections.map(sec => {
            if (sec.position !== sectionPos) return sec;
            return {
              ...sec,
              keyTopics: sec.keyTopics.filter((_, i) => i !== topicIndex),
            };
          }),
        };
      });
      return {
        ...prev,
        teacherBlueprint: { ...prev.teacherBlueprint, chapters, isEdited: true },
      };
    });
  }, [setFormData]);

  const addTopic = useCallback((chapterPos: number, sectionPos: number, topic: string) => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const chapters = prev.teacherBlueprint.chapters.map(ch => {
        if (ch.position !== chapterPos) return ch;
        return {
          ...ch,
          sections: ch.sections.map(sec => {
            if (sec.position !== sectionPos) return sec;
            if (sec.keyTopics.includes(trimmed)) return sec;
            return {
              ...sec,
              keyTopics: [...sec.keyTopics, trimmed],
            };
          }),
        };
      });
      return {
        ...prev,
        teacherBlueprint: { ...prev.teacherBlueprint, chapters, isEdited: true },
      };
    });

    const key = `${chapterPos}-${sectionPos}`;
    setNewTopicInputs(prev => ({ ...prev, [key]: '' }));
  }, [setFormData]);

  const toggleChapter = useCallback((position: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }
      return next;
    });
  }, []);

  const handleRegenerate = useCallback(() => {
    if (blueprint?.isEdited) {
      setShowRegenerateConfirm(true);
    } else {
      generateBlueprint();
    }
  }, [blueprint?.isEdited, generateBlueprint]);

  // -------------------------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------------------------

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <Map className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Generating Course Blueprint
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              AI is designing your course structure...
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: formData.chapterCount }, (_, i) => (
            <Card key={i} className="border-slate-200/50 dark:border-slate-700/50">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------------------------

  if (error && !blueprint) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/50">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Blueprint Generation Failed
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
        <Button onClick={generateBlueprint} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // NO BLUEPRINT (edge case)
  // -------------------------------------------------------------------------

  if (!blueprint) {
    return (
      <div className="space-y-6 text-center py-12">
        <Map className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400">No blueprint available</p>
        <Button onClick={generateBlueprint} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Blueprint
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // BLUEPRINT DISPLAY
  // -------------------------------------------------------------------------

  const totalSections = blueprint.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const totalKeyTopics = blueprint.chapters.reduce(
    (sum, ch) => sum + ch.sections.reduce((sSum, sec) => sSum + sec.keyTopics.length, 0), 0,
  );
  const estMinutes = Math.ceil(blueprint.chapters.length * (totalSections / blueprint.chapters.length) * 0.4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <Map className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Course Blueprint
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and edit your course structure
              {blueprint.isEdited && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (edited)
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span className="font-medium">{blueprint.chapters.length}</span> chapters
        </div>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Layers className="h-3.5 w-3.5" />
          <span className="font-medium">{totalSections}</span> sections
        </div>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium">{totalKeyTopics}</span> key topics
        </div>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          Est. ~{estMinutes} min generation
        </div>
      </div>

      {/* Chapters */}
      <div className="space-y-3">
        {blueprint.chapters.map((chapter) => (
          <ChapterCard
            key={chapter.position}
            chapter={chapter}
            isExpanded={expandedChapters.has(chapter.position)}
            onToggle={() => toggleChapter(chapter.position)}
            onUpdateChapter={updateChapter}
            onUpdateSectionTitle={updateSectionTitle}
            onRemoveTopic={removeTopic}
            onAddTopic={addTopic}
            newTopicInputs={newTopicInputs}
            setNewTopicInputs={setNewTopicInputs}
          />
        ))}
      </div>

      {/* Risk Areas */}
      {blueprint.riskAreas.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Risk Areas
            </span>
          </div>
          <ul className="space-y-1.5">
            {blueprint.riskAreas.map((risk, i) => (
              <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>AI Confidence:</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                blueprint.confidence >= 80 ? "bg-emerald-500" :
                blueprint.confidence >= 60 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${blueprint.confidence}%` }}
            />
          </div>
          <span className="font-medium">{blueprint.confidence}/100</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Click any title, goal, or section name to edit. Use the Bloom&apos;s dropdown to change cognitive levels.
      </p>

      {/* Regenerate Confirmation */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate blueprint?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve edited this blueprint. Regenerating will replace all your edits with a new AI-generated blueprint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowRegenerateConfirm(false);
                generateBlueprint();
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// =============================================================================
// CHAPTER CARD
// =============================================================================

interface ChapterCardProps {
  chapter: BlueprintChapter;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateChapter: (chapterPos: number, updates: Partial<BlueprintChapter>) => void;
  onUpdateSectionTitle: (chapterPos: number, sectionPos: number, title: string) => void;
  onRemoveTopic: (chapterPos: number, sectionPos: number, topicIndex: number) => void;
  onAddTopic: (chapterPos: number, sectionPos: number, topic: string) => void;
  newTopicInputs: Record<string, string>;
  setNewTopicInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function ChapterCard({
  chapter,
  isExpanded,
  onToggle,
  onUpdateChapter,
  onUpdateSectionTitle,
  onRemoveTopic,
  onAddTopic,
  newTopicInputs,
  setNewTopicInputs,
}: ChapterCardProps) {
  const bloomsColor = BLOOMS_COLORS[chapter.bloomsLevel] ?? BLOOMS_COLORS.UNDERSTAND;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="border-slate-200/70 dark:border-slate-700/70 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            type="button"
          >
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Ch {chapter.position}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {chapter.title}
                </h4>
              </div>
              {chapter.goal && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {chapter.goal}
                </p>
              )}
            </div>
            <Badge className={cn('text-[10px] border-0 flex-shrink-0', bloomsColor)}>
              {chapter.bloomsLevel}
            </Badge>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            {/* Editable chapter fields */}
            <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">Title</span>
                <InlineEdit
                  value={chapter.title}
                  onSave={(title) => onUpdateChapter(chapter.position, { title })}
                  className="text-sm font-semibold text-slate-900 dark:text-white flex-1"
                  inputClassName="font-semibold"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">Goal</span>
                <InlineEdit
                  value={chapter.goal || 'Add a chapter goal...'}
                  onSave={(goal) => onUpdateChapter(chapter.position, { goal })}
                  className="text-xs text-slate-600 dark:text-slate-300 flex-1"
                  placeholder="Chapter goal"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">Bloom&apos;s</span>
                <Select
                  value={chapter.bloomsLevel}
                  onValueChange={(level) => onUpdateChapter(chapter.position, { bloomsLevel: level })}
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOMS_LEVELS.map((level) => (
                      <SelectItem key={level} value={level} className="text-xs">
                        <span className="flex items-center gap-2">
                          <span className={cn('w-2 h-2 rounded-full', BLOOMS_COLORS[level]?.split(' ')[0])} />
                          {level}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sections */}
            {chapter.sections.map((section) => {
              const inputKey = `${chapter.position}-${section.position}`;
              const inputValue = newTopicInputs[inputKey] ?? '';

              return (
                <div key={section.position} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-8 flex-shrink-0">
                      {chapter.position}.{section.position}
                    </span>
                    <InlineEdit
                      value={section.title}
                      onSave={(title) => onUpdateSectionTitle(chapter.position, section.position, title)}
                      className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1"
                    />
                  </div>

                  {/* Key Topics */}
                  <div className="pl-10 flex flex-wrap gap-1.5">
                    {section.keyTopics.map((topic, topicIdx) => (
                      <span
                        key={topicIdx}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => onRemoveTopic(chapter.position, section.position, topicIdx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 p-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800"
                          aria-label={`Remove topic: ${topic}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}

                    {/* Add Topic Input */}
                    <div className="inline-flex items-center gap-1">
                      <Input
                        value={inputValue}
                        onChange={(e) =>
                          setNewTopicInputs(prev => ({ ...prev, [inputKey]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onAddTopic(chapter.position, section.position, inputValue);
                          }
                        }}
                        placeholder="Add topic..."
                        className="h-7 w-32 text-xs rounded-full border-dashed"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddTopic(chapter.position, section.position, inputValue)}
                        disabled={!inputValue.trim()}
                        className="h-7 w-7 p-0 rounded-full"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
