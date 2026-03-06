'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type {
  DepthAnalysisV2Result,
  AnalysisProgressState,
  AnalysisIssue,
  IssueStatus,
  StageWarning,
  ChapterScoreSnapshot,
  AgenticDecisionEvent,
  HealingEvent,
  BloomsDistribution,
  ChapterAnalysis,
} from '../types';

/** Maps agentic chapter analysis to the frontend ChapterAnalysis shape */
function mapChapterAnalysis(chapters: Record<string, unknown>[]): ChapterAnalysis[] {
  return chapters.map((ch, idx) => {
    const blooms = ch.bloomsDistribution as BloomsDistribution | undefined;
    const dominantLevel = blooms
      ? (Object.entries(blooms).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? 'UNDERSTAND')
      : 'UNDERSTAND';

    return {
      chapterId: (ch.chapterId as string) ?? '',
      chapterTitle: (ch.chapterTitle as string) ?? `Chapter ${idx + 1}`,
      position: (ch.chapterNumber as number) ?? idx + 1,
      scores: {
        depth: (ch.overallScore as number) ?? 0,
        consistency: 0,
        flow: 0,
        quality: (ch.overallScore as number) ?? 0,
      },
      issueCount: (ch.issueCount as number) ?? 0,
      primaryBloomsLevel: dominantLevel,
    };
  });
}

/** Maps the agentic API response to the DepthAnalysisV2Result shape used by UI components */
function mapAgenticResultToV2Shape(data: Record<string, unknown>): DepthAnalysisV2Result {
  const issues = (data.issues as Record<string, unknown>[] ?? []).map((issue): AnalysisIssue => ({
    id: issue.id as string,
    type: (issue.type as AnalysisIssue['type']) ?? 'CONTENT',
    severity: (issue.severity as AnalysisIssue['severity']) ?? 'MEDIUM',
    status: (issue.status as AnalysisIssue['status']) ?? 'OPEN',
    location: (issue.location as AnalysisIssue['location']) ?? {
      chapterId: issue.chapterId as string | undefined,
      chapterTitle: issue.chapterTitle as string | undefined,
      chapterPosition: issue.chapterPosition as number | undefined,
      sectionId: issue.sectionId as string | undefined,
      sectionTitle: issue.sectionTitle as string | undefined,
      sectionPosition: issue.sectionPosition as number | undefined,
      contentType: issue.contentType as string | undefined,
    },
    title: (issue.title as string) ?? '',
    description: (issue.description as string) ?? '',
    evidence: (issue.evidence as string[]) ?? [],
    impact: (issue.impact as AnalysisIssue['impact']) ?? { area: '', description: '' },
    fix: (issue.fix as AnalysisIssue['fix']) ?? { action: '', what: '', why: '', how: '' },
    userNotes: issue.userNotes as string | undefined,
    skippedReason: issue.skippedReason as string | undefined,
    resolvedAt: issue.resolvedAt as string | undefined,
    resolvedBy: issue.resolvedBy as string | undefined,
    createdAt: issue.createdAt as string | undefined,
    updatedAt: issue.updatedAt as string | undefined,
  }));

  const criticalCount = (data.issueCountCritical as number) ?? issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = (data.issueCountHigh as number) ?? issues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = (data.issueCountMedium as number) ?? issues.filter(i => i.severity === 'MEDIUM' || i.severity === 'MODERATE').length;
  const lowCount = (data.issueCountLow as number) ?? issues.filter(i => i.severity === 'LOW' || i.severity === 'MINOR' || i.severity === 'INFO').length;

  const blooms = data.bloomsDistribution as BloomsDistribution | undefined;
  const bloomsBalance = (data.bloomsBalance as DepthAnalysisV2Result['bloomsBalance']) ?? determineBloomsBalance(blooms);

  return {
    id: data.id as string,
    courseId: data.courseId as string,
    courseTitle: (data.courseTitle as string) ?? 'Untitled',
    version: (data.version as number) ?? 1,
    status: (data.status as string) ?? 'COMPLETED',
    analysisMethod: (data.analysisMethod as string) ?? 'ai',
    overallScore: (data.overallScore as number) ?? 0,
    depthScore: (data.depthScore as number) ?? 0,
    consistencyScore: (data.consistencyScore as number) ?? 0,
    flowScore: (data.flowScore as number) ?? 0,
    qualityScore: (data.qualityScore as number) ?? 0,
    bloomsDistribution: blooms ?? { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 },
    bloomsBalance,
    chapterAnalysis: mapChapterAnalysis(data.chapterAnalysis as Record<string, unknown>[] ?? []),
    issueCount: {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: (data.totalIssues as number) ?? issues.length,
    },
    issues,
    comparison: data.previousVersionId ? {
      previousVersionId: data.previousVersionId as string,
      previousVersion: ((data.version as number) ?? 1) - 1,
      scoreImprovement: (data.scoreImprovement as number) ?? 0,
      issuesResolved: (data.issuesResolved as number) ?? 0,
      newIssues: 0,
    } : undefined,
    analyzedAt: (data.analyzedAt as string) ?? new Date().toISOString(),
    updatedAt: (data.updatedAt as string) ?? new Date().toISOString(),
  };
}

function determineBloomsBalance(dist: BloomsDistribution | undefined): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
  if (!dist) return 'well-balanced';
  const lower = (dist.REMEMBER ?? 0) + (dist.UNDERSTAND ?? 0) + (dist.APPLY ?? 0);
  const upper = (dist.ANALYZE ?? 0) + (dist.EVALUATE ?? 0) + (dist.CREATE ?? 0);
  const total = lower + upper;
  if (total === 0) return 'well-balanced';
  if (lower / total > 0.7) return 'bottom-heavy';
  if (upper / total > 0.6) return 'top-heavy';
  return 'well-balanced';
}

function initProgressState(analyzing = false): AnalysisProgressState {
  return {
    isAnalyzing: analyzing,
    isComplete: false,
    hasError: false,
    mode: 'ai',
    currentStage: null,
    percentComplete: 0,
    issuesFound: [],
    issueCount: 0,
    stageWarnings: [],
  };
}

interface UseQualityAnalysisReturn {
  startAnalysis: (courseId: string, options?: { forceReanalyze?: boolean; aiEnabled?: boolean }) => void;
  resumeAnalysis: (courseId: string, analysisId: string) => void;
  loadExistingAnalysis: (courseId: string) => Promise<void>;
  updateIssueStatus: (analysisId: string, issueId: string, status: IssueStatus, notes?: string) => Promise<void>;
  progress: AnalysisProgressState;
  result: DepthAnalysisV2Result | null;
  isLoading: boolean;
  error: string | null;
  clearResult: () => void;
}

export function useQualityAnalysis(): UseQualityAnalysisReturn {
  const [progress, setProgress] = useState<AnalysisProgressState>(initProgressState());
  const [result, setResult] = useState<DepthAnalysisV2Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs for accumulators to avoid stale closures
  const issuesFoundRef = useRef<AnalysisIssue[]>([]);
  const chapterScoresRef = useRef<ChapterScoreSnapshot[]>([]);
  const decisionsRef = useRef<AgenticDecisionEvent[]>([]);
  const healingEventsRef = useRef<HealingEvent[]>([]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(initProgressState());
  }, []);

  const loadExistingAnalysis = useCallback(async (courseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try new agentic API first, fall back to legacy
      const listResponse = await fetch(
        `/api/sam/depth-analysis/history?courseId=${courseId}&limit=1`,
        { cache: 'no-store' }
      );

      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.success && listData.data.analyses.length > 0) {
          const latestAnalysis = listData.data.analyses[0];
          const detailResponse = await fetch(
            `/api/sam/depth-analysis/${latestAnalysis.id}`,
            { cache: 'no-store' }
          );
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            setResult(mapAgenticResultToV2Shape(detailData.data));
            toast.success('Loaded existing analysis', {
              description: `Analysis from ${formatDistanceToNow(new Date(latestAnalysis.analyzedAt), { addSuffix: true })}`,
            });
            return;
          }
        }
      }

      // Fallback to legacy V2 API for historical data
      const legacyResponse = await fetch(
        `/api/teacher/depth-analysis-v2?courseId=${courseId}&pageSize=1`,
        { cache: 'no-store' }
      );
      if (legacyResponse.ok) {
        const legacyData = await legacyResponse.json();
        if (legacyData.success && legacyData.data.analyses.length > 0) {
          const latestAnalysis = legacyData.data.analyses[0];
          const detailResponse = await fetch(
            `/api/teacher/depth-analysis-v2/${latestAnalysis.id}`,
            { cache: 'no-store' }
          );
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            setResult(detailData.data);
            toast.success('Loaded existing analysis (legacy)', {
              description: `Analysis from ${formatDistanceToNow(new Date(latestAnalysis.analyzedAt), { addSuffix: true })}`,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[QualityAnalysis] Failed to load existing analysis:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startAnalysis = useCallback((
    courseId: string,
    options: { forceReanalyze?: boolean; aiEnabled?: boolean; resumeFromAnalysis?: string } = {}
  ) => {
    const { forceReanalyze = false, resumeFromAnalysis } = options;

    issuesFoundRef.current = [];
    chapterScoresRef.current = [];
    decisionsRef.current = [];
    healingEventsRef.current = [];
    setResult(null);
    setProgress(initProgressState(true));
    setError(null);

    const processSSEEvent = async (eventType: string, data: Record<string, unknown>) => {
      switch (eventType) {
        // V3 agentic events
        case 'analysis_start':
          setProgress((prev) => ({
            ...prev,
            mode: 'ai',
            totalChapters: data.totalChapters as number | undefined,
            frameworks: data.frameworks as string[] | undefined,
          }));
          break;

        case 'strategy_planned':
          setProgress((prev) => ({
            ...prev,
            currentStage: 'overview',
            currentItem: `Strategy: ${data.mode} mode, ${data.totalChapters} chapters`,
          }));
          break;

        case 'chapter_analyzing':
          setProgress((prev) => ({
            ...prev,
            currentStage: 'chapters',
            currentChapter: data.chapterNumber as number | undefined,
            totalChapters: (data.totalChapters as number | undefined) ?? prev.totalChapters,
            currentItem: data.chapterTitle as string | undefined,
          }));
          break;

        case 'chapter_complete': {
          const snapshot: ChapterScoreSnapshot = {
            chapterNumber: data.chapterNumber as number,
            chapterTitle: data.chapterTitle as string,
            overallScore: data.overallScore as number,
            issueCount: data.issueCount as number,
            criticalCount: data.criticalCount as number,
            bloomsDistribution: data.bloomsDistribution as ChapterScoreSnapshot['bloomsDistribution'],
          };
          chapterScoresRef.current = [...chapterScoresRef.current, snapshot];
          setProgress((prev) => ({
            ...prev,
            completedChapterScores: chapterScoresRef.current,
          }));
          break;
        }

        case 'decision_made': {
          const decision: AgenticDecisionEvent = {
            action: data.action as string,
            chapterNumber: data.chapterNumber as number,
            reason: data.reason as string | undefined,
          };
          decisionsRef.current = [...decisionsRef.current, decision];
          setProgress((prev) => ({
            ...prev,
            agenticDecisions: decisionsRef.current,
          }));
          break;
        }

        case 'healing_start':
          setProgress((prev) => ({
            ...prev,
            currentItem: `Healing chapter ${data.chapterNumber}: ${data.reason ?? 'quality improvement'}`,
          }));
          break;

        case 'healing_complete': {
          const healEvent: HealingEvent = {
            chapterNumber: data.chapterNumber as number,
            healedSections: (data.healedSections as string[]) ?? [],
            issuesAdded: (data.issuesAdded as number) ?? 0,
            scoreChange: (data.scoreChange as number) ?? 0,
          };
          healingEventsRef.current = [...healingEventsRef.current, healEvent];
          setProgress((prev) => ({
            ...prev,
            healingEvents: healingEventsRef.current,
          }));
          break;
        }

        case 'cross_chapter_start':
          setProgress((prev) => ({
            ...prev,
            currentStage: 'cross-chapter',
            currentItem: `Cross-chapter analysis (${data.chaptersAnalyzed} chapters)`,
          }));
          break;

        case 'post_processing':
          setProgress((prev) => ({
            ...prev,
            currentStage: 'finalizing',
            currentItem: `Post-processing: ${data.stage}`,
          }));
          break;

        case 'resume_hydrate':
          setProgress((prev) => ({
            ...prev,
            currentItem: `Resuming from chapter ${data.startingFrom}`,
          }));
          break;

        case 'budget_warning':
          setProgress((prev) => ({
            ...prev,
            stageWarnings: [...prev.stageWarnings, {
              stage: 'budget',
              message: data.message as string,
            }],
          }));
          break;

        // Shared events (work with both V2 and V3 backends)
        case 'stage_start':
          setProgress((prev) => ({
            ...prev,
            currentStage: data.stage as AnalysisProgressState['currentStage'],
            currentItem: data.message as string | undefined,
          }));
          break;

        case 'analyzing_item':
          setProgress((prev) => ({
            ...prev,
            currentItem: data.item as string | undefined,
            currentChapter: data.chapterIndex as number | undefined,
            totalChapters: (data.totalChapters as number | undefined) ?? prev.totalChapters,
          }));
          break;

        case 'thinking':
          setProgress((prev) => ({
            ...prev,
            thinking: data.thinking as string | undefined,
          }));
          break;

        case 'issue_found':
          if (data.issue) {
            issuesFoundRef.current = [...issuesFoundRef.current, data.issue as AnalysisIssue];
            const currentIssues = issuesFoundRef.current;
            setProgress((prev) => ({
              ...prev,
              issuesFound: currentIssues,
              issueCount: currentIssues.length,
            }));
          }
          break;

        case 'progress':
          setProgress((prev) => ({
            ...prev,
            percentComplete: (data.percent as number) ?? prev.percentComplete,
            currentStage: data.stage === 'complete' ? 'complete' : prev.currentStage,
          }));
          break;

        case 'stage_complete':
          setProgress((prev) => ({
            ...prev,
            currentStage: data.stage === 'finalizing' ? 'complete' : prev.currentStage,
          }));
          break;

        case 'complete': {
          // V3 'complete' event includes alreadyExists for content-unchanged case
          if (data.alreadyExists) {
            setProgress((prev) => ({
              ...prev,
              isAnalyzing: false,
              isComplete: true,
              percentComplete: 100,
              currentStage: 'complete',
              analysisId: data.analysisId as string | undefined,
            }));
            toast.info('Course content unchanged since last analysis', {
              description: 'Loading existing results.',
            });
            const existingResponse = await fetch(
              `/api/sam/depth-analysis/${data.analysisId}`,
              { cache: 'no-store' }
            );
            if (existingResponse.ok) {
              const existingData = await existingResponse.json();
              setResult(mapAgenticResultToV2Shape(existingData.data));
            }
            break;
          }

          setProgress((prev) => ({
            ...prev,
            isAnalyzing: false,
            isComplete: true,
            percentComplete: 100,
            currentStage: 'complete',
            analysisId: data.analysisId as string | undefined,
            overallScore: data.overallScore as number | undefined,
            bloomsDistribution: data.bloomsDistribution as AnalysisProgressState['bloomsDistribution'],
          }));

          // Fetch full results from the new API
          const analysisResponse = await fetch(
            `/api/sam/depth-analysis/${data.analysisId}`,
            { cache: 'no-store' }
          );
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setResult(mapAgenticResultToV2Shape(analysisData.data));
          }

          const totalIssues = (data.totalIssues as number) ?? 0;
          const criticalIssues = (data.criticalIssues as number) ?? 0;
          toast.success('Agentic analysis complete!', {
            description: `Found ${totalIssues} issues (${criticalIssues} critical).`,
          });
          break;
        }

        case 'error': {
          const canResume = Boolean(data.canResume);
          const isStageError = Boolean(data.chapterNumber) && !data.canResume;

          if (isStageError) {
            const warning: StageWarning = {
              stage: `chapter-${data.chapterNumber}`,
              message: data.message as string,
            };
            console.warn(`[QualityAnalysis] Chapter ${data.chapterNumber} error: ${warning.message}`);
            setProgress((prev) => ({
              ...prev,
              stageWarnings: [...prev.stageWarnings, warning],
            }));
          } else {
            setProgress((prev) => ({
              ...prev,
              isAnalyzing: false,
              hasError: true,
              errorMessage: data.message as string | undefined,
              canResume,
              analysisId: data.analysisId as string | undefined,
            }));
            throw new Error(data.message as string);
          }
          break;
        }
      }
    };

    const handleSSEStream = async (response: Response) => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let buffer = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Skip heartbeat comments
          if (line.startsWith(':')) continue;

          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ') && currentEvent) {
            let eventData: Record<string, unknown>;
            try {
              eventData = JSON.parse(line.slice(6));
            } catch {
              console.warn('Failed to parse SSE JSON:', line.slice(6));
              continue;
            }
            await processSSEEvent(currentEvent, eventData);
            currentEvent = '';
          }
        }
      }
    };

    const runAnalysis = async () => {
      try {
        // Use new agentic API
        const response = await fetch('/api/sam/depth-analysis/orchestrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            mode: 'standard',
            frameworks: ['blooms', 'dok'],
            forceReanalyze,
            ...(resumeFromAnalysis ? { resumeFromAnalysis } : {}),
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Analysis failed' }));
          throw new Error(data.error || 'Analysis failed');
        }

        await handleSSEStream(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        setProgress((prev) => ({ ...prev, isAnalyzing: false, hasError: true, errorMessage: message }));
        toast.error('Analysis failed', { description: message });
      }
    };

    runAnalysis();
  }, []);

  const updateIssueStatus = useCallback(async (
    analysisId: string,
    issueId: string,
    status: IssueStatus,
    notes?: string
  ) => {
    try {
      // Try new agentic API first
      const response = await fetch(
        `/api/sam/depth-analysis/${analysisId}/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, teacherResponse: notes }),
        }
      );

      if (!response.ok) {
        // Fallback to legacy V2 API
        const legacyResponse = await fetch(
          `/api/teacher/depth-analysis-v2/${analysisId}/issues/${issueId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, userNotes: notes }),
          }
        );
        if (!legacyResponse.ok) throw new Error('Failed to update issue');
        const legacyData = await legacyResponse.json();
        setResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            issues: prev.issues.map((issue) =>
              issue.id === issueId
                ? { ...issue, status: legacyData.data.status, userNotes: legacyData.data.userNotes }
                : issue
            ),
          };
        });
        toast.success('Issue updated');
        return;
      }

      const data = await response.json();

      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          issues: prev.issues.map((issue) =>
            issue.id === issueId
              ? { ...issue, status: data.data.status, userNotes: data.data.teacherResponse }
              : issue
          ),
        };
      });

      toast.success('Issue updated');
    } catch {
      toast.error('Failed to update issue');
    }
  }, []);

  const resumeAnalysis = useCallback((courseId: string, analysisId: string) => {
    startAnalysis(courseId, { resumeFromAnalysis: analysisId });
  }, [startAnalysis]);

  return {
    startAnalysis,
    resumeAnalysis,
    loadExistingAnalysis,
    updateIssueStatus,
    progress,
    result,
    isLoading,
    error,
    clearResult,
  };
}
