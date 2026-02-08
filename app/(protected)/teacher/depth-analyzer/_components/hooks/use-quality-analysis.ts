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
} from '../types';

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

  // Use ref for issues accumulator to avoid stale closures
  const issuesFoundRef = useRef<AnalysisIssue[]>([]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(initProgressState());
  }, []);

  const loadExistingAnalysis = useCallback(async (courseId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const listResponse = await fetch(
        `/api/teacher/depth-analysis-v2?courseId=${courseId}&pageSize=1`,
        { cache: 'no-store' }
      );

      if (!listResponse.ok) {
        throw new Error('Failed to fetch analyses');
      }

      const listData = await listResponse.json();

      if (listData.success && listData.data.analyses.length > 0) {
        const latestAnalysis = listData.data.analyses[0];

        const detailResponse = await fetch(
          `/api/teacher/depth-analysis-v2/${latestAnalysis.id}`,
          { cache: 'no-store' }
        );

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          setResult(detailData.data);
          toast.success('Loaded existing analysis', {
            description: `Analysis from ${formatDistanceToNow(new Date(latestAnalysis.analyzedAt), { addSuffix: true })}`,
          });
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
    options: { forceReanalyze?: boolean; aiEnabled?: boolean } = {}
  ) => {
    const { forceReanalyze = false, aiEnabled = true } = options;

    issuesFoundRef.current = [];
    setResult(null);
    setProgress(initProgressState(true));
    setError(null);

    const processSSEEvent = async (eventType: string, data: Record<string, unknown>) => {
      switch (eventType) {
        case 'analysis_start':
          setProgress((prev) => ({
            ...prev,
            mode: (data.mode as 'ai' | 'rule-based') || 'ai',
            analysisMode: data.analysisMode as 'full-course' | 'chapter-wise' | undefined,
            estimatedTime: data.estimatedTime as string | undefined,
            totalChapters: data.chaptersCount as number | undefined,
          }));
          break;

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
            percentComplete: data.percent as number,
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
          setProgress((prev) => ({
            ...prev,
            isAnalyzing: false,
            isComplete: true,
            percentComplete: 100,
            currentStage: 'complete',
            analysisId: data.analysisId as string | undefined,
            overallScore: data.overallScore as number | undefined,
          }));

          const analysisResponse = await fetch(
            `/api/teacher/depth-analysis-v2/${data.analysisId}`,
            { cache: 'no-store' }
          );
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setResult(analysisData.data);
          }

          const issueCount = data.issueCount as { total?: number } | undefined;
          toast.success('AI Analysis complete!', {
            description: `Found ${issueCount?.total || 0} issues to review.`,
          });
          break;
        }

        case 'error': {
          const isStageError = Boolean(data.stage);
          const isSubscriptionError = data.code === 'SUBSCRIPTION_REQUIRED';

          if (isStageError && !isSubscriptionError) {
            // Stage-level error (e.g., overview or cross-chapter failed) — non-terminal.
            // The backend continues processing and will send a 'complete' event with results.
            const warning: StageWarning = {
              stage: data.stage as string,
              message: data.message as string,
            };
            console.warn(`[QualityAnalysis] Stage "${warning.stage}" had an error: ${warning.message}`);
            setProgress((prev) => ({
              ...prev,
              stageWarnings: [...prev.stageWarnings, warning],
            }));
          } else {
            // Terminal error — analysis cannot continue
            setProgress((prev) => ({
              ...prev,
              isAnalyzing: false,
              hasError: true,
              errorMessage: data.message as string | undefined,
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

    const handleJSONResponse = async (response: Response) => {
      const data = await response.json();

      if (data.data?.status === 'ALREADY_EXISTS') {
        toast.info('Analysis already exists', {
          description: 'Loading existing results. Use re-analyze to run fresh analysis.',
        });

        const existingResponse = await fetch(
          `/api/teacher/depth-analysis-v2/${data.data.analysisId}`,
          { cache: 'no-store' }
        );
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          setResult(existingData.data);
        }
      } else if (data.data?.analysisId) {
        const analysisResponse = await fetch(
          `/api/teacher/depth-analysis-v2/${data.data.analysisId}`,
          { cache: 'no-store' }
        );
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setResult(analysisData.data);
        }
        toast.success('Analysis complete!');
      }

      setProgress((prev) => ({ ...prev, isAnalyzing: false, isComplete: true, percentComplete: 100 }));
    };

    const runAnalysis = async () => {
      try {
        const response = await fetch('/api/teacher/depth-analysis-v2/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ courseId, forceReanalyze, aiEnabled }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Analysis failed');
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream')) {
          await handleSSEStream(response);
        } else {
          await handleJSONResponse(response);
        }
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
      const response = await fetch(
        `/api/teacher/depth-analysis-v2/${analysisId}/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, userNotes: notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update issue');
      }

      const data = await response.json();

      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          issues: prev.issues.map((issue) =>
            issue.id === issueId
              ? { ...issue, status: data.data.status, userNotes: data.data.userNotes }
              : issue
          ),
        };
      });

      toast.success('Issue updated');
    } catch {
      toast.error('Failed to update issue');
    }
  }, []);

  return {
    startAnalysis,
    loadExistingAnalysis,
    updateIssueStatus,
    progress,
    result,
    isLoading,
    error,
    clearResult,
  };
}
