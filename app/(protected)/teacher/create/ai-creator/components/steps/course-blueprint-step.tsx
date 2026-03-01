"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
  Map as MapIcon,
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
  History,
  ArrowRight,
  Shield,
  ClipboardCheck,
  Coins,
  Zap,
  Brain,
} from 'lucide-react';
import type {
  StepComponentProps,
  TeacherBlueprint,
  BlueprintChapter,
  BlueprintSection,
  BlueprintVersion,
  BlueprintCriticResult,
} from '../../types/sam-creator.types';
import { validateAlignment } from '../../utils/blueprint-alignment';
import type { AlignmentScore, ChapterAlignment } from '../../utils/blueprint-alignment';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { CostEstimate } from '@/lib/sam/course-creation/cost-estimator';
import { formatEstimatedTime } from '@/lib/sam/course-creation/cost-estimator';

const MAX_VERSIONS = 10;

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
  const [progressMessage, setProgressMessage] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([1]));
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const hasTriggeredRef = useRef(false);

  const blueprint = formData.teacherBlueprint;

  // -------------------------------------------------------------------------
  // Cost Estimation (moved from advanced-settings-step)
  // -------------------------------------------------------------------------
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState(false);
  const costDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const estimateAbortRef = useRef<AbortController | null>(null);
  const estimateRequestSeq = useRef(0);
  const costParamsRef = useRef('');

  const fetchCostEstimate = useCallback(async (params: {
    totalChapters: number;
    sectionsPerChapter: number;
    difficulty: string;
    bloomsFocusCount: number;
    learningObjectivesPerChapter: number;
    learningObjectivesPerSection: number;
  }) => {
    const requestId = ++estimateRequestSeq.current;
    estimateAbortRef.current?.abort();
    const controller = new AbortController();
    estimateAbortRef.current = controller;

    setCostLoading(true);
    setCostError(false);
    try {
      const res = await fetch('/api/sam/course-creation/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as { success: boolean; estimate?: CostEstimate };
      if (requestId !== estimateRequestSeq.current) return;
      if (data.success && data.estimate) {
        setCostEstimate(data.estimate);
      } else {
        setCostError(true);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (requestId !== estimateRequestSeq.current) return;
      setCostError(true);
    } finally {
      if (requestId !== estimateRequestSeq.current) return;
      setCostLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      estimateAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const params = {
      totalChapters: formData.chapterCount,
      sectionsPerChapter: formData.sectionsPerChapter,
      difficulty: formData.difficulty.toLowerCase(),
      bloomsFocusCount: formData.bloomsFocus.length,
      learningObjectivesPerChapter: formData.learningObjectivesPerChapter,
      learningObjectivesPerSection: formData.learningObjectivesPerSection,
    };
    const key = JSON.stringify(params);
    if (key === costParamsRef.current) return;

    if (costDebounceRef.current) clearTimeout(costDebounceRef.current);
    costDebounceRef.current = setTimeout(() => {
      costParamsRef.current = key;
      fetchCostEstimate(params);
    }, 500);

    return () => {
      if (costDebounceRef.current) clearTimeout(costDebounceRef.current);
    };
  }, [
    formData.chapterCount,
    formData.difficulty,
    formData.bloomsFocus.length,
    formData.learningObjectivesPerChapter,
    formData.learningObjectivesPerSection,
    formData.sectionsPerChapter,
    fetchCostEstimate,
  ]);

  // Compute alignment score (client-side, no API call)
  const alignment: AlignmentScore = useMemo(() => {
    if (!blueprint) return { overall: 100, perChapter: [], totalWarnings: 0 };
    return validateAlignment(blueprint.chapters);
  }, [blueprint]);

  // Build per-chapter alignment lookup
  const alignmentByChapter = useMemo(() => {
    const map = new Map<number, ChapterAlignment>();
    for (const ch of alignment.perChapter) {
      map.set(ch.position, ch);
    }
    return map;
  }, [alignment]);

  // -------------------------------------------------------------------------
  // Blueprint generation
  // -------------------------------------------------------------------------

  /** Snapshot the current blueprint as a version before overwriting */
  const snapshotVersion = useCallback((currentBlueprint: TeacherBlueprint, source: BlueprintVersion['source']) => {
    const { versions: _existingVersions, currentVersion: _cv, ...blueprintData } = currentBlueprint;
    const nextVersion = (currentBlueprint.currentVersion ?? 0) + 1;
    const existingVersions = currentBlueprint.versions ?? [];
    const newVersion: BlueprintVersion = {
      version: nextVersion,
      blueprint: blueprintData,
      createdAt: new Date().toISOString(),
      source,
    };
    // Keep only the last MAX_VERSIONS versions (FIFO)
    const updatedVersions = [...existingVersions, newVersion].slice(-MAX_VERSIONS);
    return { updatedVersions, nextVersion };
  }, []);

  /** Restore a previous blueprint version */
  const restoreVersion = useCallback((version: BlueprintVersion) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const { updatedVersions, nextVersion } = snapshotVersion(prev.teacherBlueprint, 'rollback');
      return {
        ...prev,
        teacherBlueprint: {
          ...version.blueprint,
          currentVersion: nextVersion,
          versions: updatedVersions,
        },
      };
    });
    toast.success(`Restored version ${version.version}`);
  }, [setFormData, snapshotVersion]);

  const generateBlueprint = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setProgressMessage('Starting blueprint generation...');

    // Snapshot the current blueprint into versions BEFORE clearing it.
    // This prevents the old blueprint from lingering in formData during
    // generation (which would be auto-saved to localStorage if generation
    // fails, causing stale data to reappear on reload).
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const { updatedVersions, nextVersion } = snapshotVersion(prev.teacherBlueprint, 'ai');
      return {
        ...prev,
        teacherBlueprint: undefined,
        // Stash versions so we can attach them to the new blueprint on success
        _pendingBlueprintVersions: updatedVersions,
        _pendingBlueprintNextVersion: nextVersion,
      } as typeof prev;
    });

    try {
      // Use SSE (Server-Sent Events) to keep the connection alive during long AI calls.
      // Railway/Cloudflare proxy kills idle connections after ~100s, causing 524 errors.
      // Heartbeats from the server prevent this.
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

      const contentType = response.headers.get('content-type') ?? '';
      const isSSE = contentType.includes('text/event-stream');

      if (!response.ok) {
        // Non-SSE error responses (auth, validation) return JSON.
        // Guard against accidentally calling .json() on an SSE stream.
        if (!isSSE) {
          const errData = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      // If the server returned JSON instead of SSE (e.g. old deployment),
      // fall back to the legacy JSON parsing path.
      if (!isSSE) {
        const data = await response.json();
        if (!data.success || !data.blueprint) {
          throw new Error(data.error || 'No blueprint returned');
        }
        setFormData(prev => {
          const stashedPrev = prev as Record<string, unknown>;
          const versions = (stashedPrev._pendingBlueprintVersions as BlueprintVersion[] | undefined) ?? [];
          const nextVersion = (stashedPrev._pendingBlueprintNextVersion as number | undefined) ?? 1;
          const newBlueprint: TeacherBlueprint = {
            chapters: data.blueprint.chapters,
            northStarProject: data.blueprint.northStarProject,
            generatedAt: new Date().toISOString(),
            confidence: data.blueprint.confidence,
            isEdited: false,
            riskAreas: data.blueprint.riskAreas ?? [],
            criticResult: data.critic ? {
              verdict: data.critic.verdict,
              score: data.critic.score,
              confidence: data.critic.confidence,
              reasoning: data.critic.reasoning,
              dimensions: data.critic.dimensions,
              improvements: data.critic.improvements ?? [],
            } : undefined,
            currentVersion: nextVersion,
            versions: versions.length > 0 ? versions : undefined,
          };
          const { _pendingBlueprintVersions: _v, _pendingBlueprintNextVersion: _n, ...cleanPrev } = stashedPrev;
          return { ...cleanPrev, teacherBlueprint: newBlueprint } as typeof prev;
        });
        setExpandedChapters(new Set([1]));
        toast.success('Blueprint generated', {
          description: `${data.blueprint.chapters.length} chapters`,
        });
        return; // Skip SSE parsing below
      }

      // Parse SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let completedData: { blueprint?: Record<string, unknown>; critic?: Record<string, unknown> } | null = null;
      let sseError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete last line

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (currentEvent === 'progress' && payload.message) {
                setProgressMessage(payload.message);
              } else if (currentEvent === 'complete') {
                completedData = payload;
              } else if (currentEvent === 'error') {
                sseError = payload.error || 'Blueprint generation failed';
              }
            } catch {
              // Ignore malformed SSE data lines
            }
            currentEvent = '';
          }
          // SSE comments (heartbeats) start with ':' — silently ignore
        }
      }

      if (sseError) {
        throw new Error(sseError);
      }

      if (!completedData?.blueprint) {
        throw new Error('No blueprint returned');
      }

      const data = completedData;

      setFormData(prev => {
        // Recover stashed versions from pre-generation snapshot
        const stashedPrev = prev as Record<string, unknown>;
        const versions = (stashedPrev._pendingBlueprintVersions as BlueprintVersion[] | undefined) ?? [];
        const nextVersion = (stashedPrev._pendingBlueprintNextVersion as number | undefined) ?? 1;

        // Parse critic result from API response
        const critic = data.critic as Record<string, unknown> | undefined;
        const criticResult: BlueprintCriticResult | undefined = critic ? {
          verdict: critic.verdict as string,
          score: critic.score as number,
          confidence: critic.confidence as number,
          reasoning: critic.reasoning as string,
          dimensions: critic.dimensions as Record<string, number>,
          improvements: (critic.improvements as string[]) ?? [],
        } : undefined;

        const bp = data.blueprint as Record<string, unknown>;
        const newBlueprint: TeacherBlueprint = {
          chapters: bp.chapters as TeacherBlueprint['chapters'],
          northStarProject: bp.northStarProject as string | undefined,
          generatedAt: new Date().toISOString(),
          confidence: bp.confidence as number,
          isEdited: false,
          riskAreas: (bp.riskAreas as string[]) ?? [],
          criticResult,
          currentVersion: nextVersion,
          versions: versions.length > 0 ? versions : undefined,
        };

        // Clean up stashed fields
        const { _pendingBlueprintVersions: _v, _pendingBlueprintNextVersion: _n, ...cleanPrev } = stashedPrev;
        return { ...cleanPrev, teacherBlueprint: newBlueprint } as typeof prev;
      });

      setExpandedChapters(new Set([1]));
      const bp = completedData.blueprint as Record<string, unknown>;
      const chapters = bp.chapters as Array<{ sections: unknown[] }>;
      toast.success('Blueprint generated', {
        description: `${chapters.length} chapters with ${chapters.reduce((sum, ch) => sum + ch.sections.length, 0)} sections`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate blueprint';
      logger.error('[BLUEPRINT_STEP] Generation error:', err);
      setError(msg);
      toast.error('Blueprint generation failed', { description: msg });

      // Clean up stashed version fields (blueprint was already cleared pre-generation)
      setFormData(prev => {
        const stashedPrev = prev as Record<string, unknown>;
        if (!stashedPrev._pendingBlueprintVersions) return prev;
        const { _pendingBlueprintVersions: _v, _pendingBlueprintNextVersion: _n, ...cleanPrev } = stashedPrev;
        return cleanPrev as typeof prev;
      });
    } finally {
      setIsGenerating(false);
      setProgressMessage('');
    }
  }, [formData, setFormData, snapshotVersion]);

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

  const updateNorthStarProject = useCallback((northStarProject: string) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      return {
        ...prev,
        teacherBlueprint: { ...prev.teacherBlueprint, northStarProject, isEdited: true },
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

  const updateSectionContentType = useCallback((chapterPos: number, sectionPos: number, contentType: string | undefined) => {
    setFormData(prev => {
      if (!prev.teacherBlueprint) return prev;
      const chapters = prev.teacherBlueprint.chapters.map(ch => {
        if (ch.position !== chapterPos) return ch;
        return {
          ...ch,
          sections: ch.sections.map(sec => {
            if (sec.position !== sectionPos) return sec;
            const updated = { ...sec };
            if (contentType) {
              updated.contentType = contentType as BlueprintSection['contentType'];
            } else {
              delete updated.contentType;
            }
            return updated;
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
            <MapIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Generating Course Blueprint
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progressMessage || 'AI is designing your course structure...'}
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
        <MapIcon className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600" />
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
  const estGenerationMinutes = Math.ceil(blueprint.chapters.length * (totalSections / blueprint.chapters.length) * 0.4);
  const totalLearningMinutes = blueprint.chapters.reduce((sum, ch) => sum + (ch.estimatedMinutes ?? 0), 0);
  const totalLearningHours = totalLearningMinutes > 0 ? Math.round(totalLearningMinutes / 60 * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
            <MapIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
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
          Est. ~{estGenerationMinutes} min generation
        </div>
        {totalLearningMinutes > 0 && (
          <>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{totalLearningHours}h</span> learning time
            </div>
          </>
        )}
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <div className={cn(
          "flex items-center gap-1.5 text-xs",
          alignment.overall >= 80 ? "text-emerald-600 dark:text-emerald-400" :
          alignment.overall >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
        )}>
          <Shield className="h-3.5 w-3.5" />
          <span className="font-medium">{alignment.overall}%</span> alignment
          {alignment.totalWarnings > 0 && (
            <span className="text-amber-500">({alignment.totalWarnings})</span>
          )}
        </div>
      </div>

      {/* Cost Estimation */}
      <Collapsible>
        <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900/50 overflow-hidden">
          <CollapsibleTrigger asChild>
            <button type="button" className="w-full flex items-center justify-between gap-2 p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-xs">
              <div className="flex items-center gap-2">
                <Coins className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Generation Estimate</span>
                {costEstimate && !costLoading && (
                  <span className="text-slate-500 dark:text-slate-400">
                    ~{formatEstimatedTime(costEstimate.estimatedTimeSeconds)} &middot; ${costEstimate.estimatedCostUSD.toFixed(2)} &middot; {costEstimate.totalAICalls} AI calls
                  </span>
                )}
                {costLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              {costLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
              ) : costError ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Cost estimate unavailable
                </p>
              ) : costEstimate ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {formatEstimatedTime(costEstimate.estimatedTimeSeconds)}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Gen. Time</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {costEstimate.totalAICalls}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">AI Calls</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Coins className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        ${costEstimate.estimatedCostUSD.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Est. Cost</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                      <Brain className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {costEstimate.provider}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Provider</div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                    Includes ~{costEstimate.breakdown.retryOverheadPercent}% retry overhead. Actual cost depends on AI response length and retries.
                  </p>
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* North Star Project */}
      <Card className="border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              North Star Project
            </span>
            <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">
              The ONE product/project students build throughout the course
            </span>
          </div>
          <InlineEdit
            value={blueprint.northStarProject || 'Add a North Star project...'}
            onSave={updateNorthStarProject}
            className="text-sm text-emerald-800 dark:text-emerald-200 w-full"
            placeholder="e.g., Build a production-ready REST API with authentication and deployment"
          />
        </CardContent>
      </Card>

      {/* Chapters */}
      <div className="space-y-3">
        {blueprint.chapters.map((chapter) => (
          <ChapterCard
            key={chapter.position}
            chapter={chapter}
            chapterAlignment={alignmentByChapter.get(chapter.position)}
            isExpanded={expandedChapters.has(chapter.position)}
            onToggle={() => toggleChapter(chapter.position)}
            onUpdateChapter={updateChapter}
            onUpdateSectionTitle={updateSectionTitle}
            onUpdateSectionContentType={updateSectionContentType}
            onRemoveTopic={removeTopic}
            onAddTopic={addTopic}
            newTopicInputs={newTopicInputs}
            setNewTopicInputs={setNewTopicInputs}
          />
        ))}
      </div>

      {/* Version History */}
      {blueprint.versions && blueprint.versions.length > 0 && (
        <Collapsible open={showVersionHistory} onOpenChange={setShowVersionHistory}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              <span>Version history ({blueprint.versions.length} previous)</span>
              {showVersionHistory ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {blueprint.versions.slice().reverse().map((v) => (
                <div
                  key={v.version}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      v{v.version}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {v.source} &middot; {new Date(v.createdAt).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {v.blueprint.chapters.length} ch
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreVersion(v)}
                    className="h-6 text-xs gap-1"
                  >
                    <History className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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

      {/* Critic Quality Review */}
      {blueprint.criticResult && (
        <Collapsible>
          <div className="p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            <CollapsibleTrigger asChild>
              <button type="button" className="w-full flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'text-[10px] border-0',
                      blueprint.criticResult.verdict === 'approve'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : blueprint.criticResult.verdict === 'revise'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                    )}
                  >
                    {blueprint.criticResult.verdict.toUpperCase()}
                  </Badge>
                  <span className="text-slate-600 dark:text-slate-400">
                    Quality Review: <span className="font-medium">{blueprint.criticResult.score}/100</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    ({blueprint.criticResult.confidence}% confidence)
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {blueprint.criticResult.reasoning}
                </p>
                {/* Dimension scores */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(blueprint.criticResult.dimensions).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      objectiveCoverage: 'Objective Coverage',
                      topicSequencing: 'Topic Sequencing',
                      bloomsProgression: 'Bloom&apos;s Progression',
                      scopeCoherence: 'Scope Coherence',
                      northStarAlignment: 'North Star Alignment',
                      specificity: 'Specificity',
                    };
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500',
                            )}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {labels[key] ?? key} <span className="font-medium">{value}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Improvements */}
                {blueprint.criticResult.improvements.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Suggested Improvements:</span>
                    {blueprint.criticResult.improvements.map((imp, i) => (
                      <p key={i} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                        {imp}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
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
        Click any title, goal, deliverable, or section name to edit. Use the Bloom&apos;s dropdown to change cognitive levels.
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
  chapterAlignment?: ChapterAlignment;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateChapter: (chapterPos: number, updates: Partial<BlueprintChapter>) => void;
  onUpdateSectionTitle: (chapterPos: number, sectionPos: number, title: string) => void;
  onUpdateSectionContentType: (chapterPos: number, sectionPos: number, contentType: string | undefined) => void;
  onRemoveTopic: (chapterPos: number, sectionPos: number, topicIndex: number) => void;
  onAddTopic: (chapterPos: number, sectionPos: number, topic: string) => void;
  newTopicInputs: Record<string, string>;
  setNewTopicInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

function ChapterCard({
  chapter,
  chapterAlignment,
  isExpanded,
  onToggle,
  onUpdateChapter,
  onUpdateSectionTitle,
  onUpdateSectionContentType,
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
              <div className="flex items-center gap-2 flex-wrap">
                {chapter.goal && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {chapter.goal}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {chapter.estimatedMinutes && chapter.estimatedMinutes > 0 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {chapter.estimatedMinutes} min
                </span>
              )}
              {chapter.prerequisiteChapters && chapter.prerequisiteChapters.length > 0 && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 border-slate-300 dark:border-slate-600">
                  <ArrowRight className="h-2.5 w-2.5" />
                  Ch {chapter.prerequisiteChapters.join(', ')}
                </Badge>
              )}
              <Badge className={cn('text-[10px] border-0', bloomsColor)}>
                {chapter.bloomsLevel}
              </Badge>
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-3">
            {/* Alignment warnings */}
            {chapterAlignment && chapterAlignment.warnings.length > 0 && (
              <div className="space-y-1">
                {chapterAlignment.warnings.map((warning, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-[11px] flex items-center gap-1.5 px-2 py-1 rounded",
                      warning.severity === 'error' ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" :
                      warning.severity === 'warning' ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" :
                      "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50"
                    )}
                  >
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    {warning.message}
                  </div>
                ))}
              </div>
            )}

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
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">Output</span>
                <InlineEdit
                  value={chapter.deliverable || 'Add a chapter deliverable...'}
                  onSave={(deliverable) => onUpdateChapter(chapter.position, { deliverable })}
                  className="text-xs text-slate-600 dark:text-slate-300 flex-1"
                  placeholder="What students produce (e.g., concept map, working app, analysis report)"
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
                    {section.estimatedMinutes && section.estimatedMinutes > 0 && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
                        {section.estimatedMinutes} min
                      </span>
                    )}
                    <Select
                      value={section.contentType ?? '__auto__'}
                      onValueChange={(val) =>
                        onUpdateSectionContentType(
                          chapter.position,
                          section.position,
                          val === '__auto__' ? undefined : val,
                        )
                      }
                    >
                      <SelectTrigger className="h-6 w-[100px] text-[10px] border-dashed flex-shrink-0">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__auto__" className="text-xs">Auto (AI picks)</SelectItem>
                        <SelectItem value="video" className="text-xs">Video</SelectItem>
                        <SelectItem value="reading" className="text-xs">Reading</SelectItem>
                        <SelectItem value="assignment" className="text-xs">Assignment</SelectItem>
                        <SelectItem value="quiz" className="text-xs">Quiz</SelectItem>
                        <SelectItem value="project" className="text-xs">Project</SelectItem>
                        <SelectItem value="discussion" className="text-xs">Discussion</SelectItem>
                      </SelectContent>
                    </Select>
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

                  {/* Formative Assessment Badge */}
                  {section.formativeAssessment && (
                    <div className="pl-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-700/50">
                        <ClipboardCheck className="h-3 w-3" />
                        <span className="font-medium">{section.formativeAssessment.type}</span>
                        <span className="text-violet-500 dark:text-violet-400">|</span>
                        <span className="truncate max-w-[250px]">{section.formativeAssessment.prompt}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
