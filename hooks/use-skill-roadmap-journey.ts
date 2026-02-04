'use client';

/**
 * React hooks for the Skill Roadmap Journey feature.
 * Handles roadmap listing, detail fetching, SSE generation, and milestone updates.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completionPercentage: number;
  skillName: string;
  currentLevel: string;
  targetLevel: string;
  milestoneCount: number;
  completedMilestones: number;
  totalEstimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

interface MilestoneResource {
  courses: Array<{
    title: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
    reason: string;
    matchedCourseId: string | null;
  }>;
  projects: Array<{
    title: string;
    description: string;
    difficulty: string;
    estimatedHours: number;
  }>;
  assessmentCriteria: string;
  bloomsLevel: string;
  durationWeeks: number;
}

interface MilestoneSkill {
  skillName: string;
  targetLevel: string;
  estimatedHours: number;
  progress: number;
}

interface RoadmapMilestone {
  id: string;
  roadmapId: string;
  order: number;
  title: string;
  description: string | null;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  skills: MilestoneSkill[];
  estimatedHours: number;
  actualHours: number | null;
  targetDate: string | null;
  completedAt: string | null;
  matchedCourseIds: string[];
  resources: MilestoneResource | null;
  assessmentRequired: boolean;
}

interface MatchedCourse {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPublished: boolean;
}

interface RoadmapDetail {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: string;
  targetOutcome: {
    type: string;
    targetName: string;
    currentLevel: string;
    targetLevel: string;
    skillDefId: string;
  } | null;
  totalEstimatedHours: number;
  completionPercentage: number;
  startedAt: string | null;
  targetCompletionDate: string | null;
  completedAt: string | null;
  milestones: RoadmapMilestone[];
  matchedCourses: Record<string, MatchedCourse>;
  stats: {
    completedMilestones: number;
    totalMilestones: number;
    totalHoursCompleted: number;
    totalHoursEstimated: number;
  };
}

interface GenerationProgress {
  stage: string;
  percent: number;
  message: string;
  provider?: string;
}

interface GenerationInput {
  skillName: string;
  currentLevel: string;
  targetLevel: string;
  hoursPerWeek: number;
  targetCompletionDate?: string;
  learningStyle: string;
  includeAssessments: boolean;
  prioritizeQuickWins: boolean;
}

// ============================================================================
// useRoadmapList - Fetch user's roadmaps
// ============================================================================

export function useRoadmapList() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sam/skill-roadmap');
      const json = await res.json();
      if (json.success) {
        setRoadmaps(json.data);
      } else {
        setError(json.error ?? 'Failed to fetch roadmaps');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  return { roadmaps, isLoading, error, refetch: fetchRoadmaps };
}

// ============================================================================
// useRoadmapDetail - Fetch a single roadmap with milestones
// ============================================================================

export function useRoadmapDetail(roadmapId: string | null) {
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sam/skill-roadmap?id=${id}`);
      const json = await res.json();
      if (json.success) {
        setRoadmap(json.data);
      } else {
        setError(json.error ?? 'Failed to fetch roadmap');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roadmapId) {
      fetchRoadmap(roadmapId);
    }
  }, [roadmapId, fetchRoadmap]);

  return {
    roadmap,
    isLoading,
    error,
    refetch: () => roadmapId && fetchRoadmap(roadmapId),
  };
}

// ============================================================================
// useRoadmapGeneration - SSE-based roadmap creation
// ============================================================================

/** Max time (ms) to wait for the generation stream before client-side abort. */
const CLIENT_GENERATION_TIMEOUT_MS = 120_000;

export function useRoadmapGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedRoadmapId, setGeneratedRoadmapId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const generate = useCallback(async (input: GenerationInput) => {
    setIsGenerating(true);
    setProgress({ stage: 'starting', percent: 0, message: 'Starting...' });
    setGeneratedRoadmapId(null);
    setError(null);

    abortRef.current = new AbortController();
    readerRef.current = null;

    // Flag set directly by the timeout callback so we can detect
    // client-side cancellation even when reader.cancel() exits the
    // while-loop normally (done=true) without throwing.
    let cancelledByTimeout = false;

    // Client-side safety timeout — cancels the stream reader directly.
    // reader.cancel() resolves the pending read() with { done: true },
    // so we also set the flag here for the finally block to detect.
    const safetyTimeout = setTimeout(() => {
      cancelledByTimeout = true;
      readerRef.current?.cancel();
      abortRef.current?.abort();
    }, CLIENT_GENERATION_TIMEOUT_MS);

    try {
      const res = await fetch('/api/sam/skill-roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(errorBody.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              switch (eventType) {
                case 'progress':
                  setProgress(data);
                  break;
                case 'roadmap':
                  setGeneratedRoadmapId(data.id);
                  break;
                case 'error':
                  setError(data.message);
                  break;
                case 'done':
                  break;
              }
            } catch {
              // Skip malformed SSE data
            }
            eventType = '';
          }
        }
      }
    } catch (err) {
      // AbortError can come from the timeout abort OR a manual cancel
      if (!cancelledByTimeout) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      }
    } finally {
      clearTimeout(safetyTimeout);
      readerRef.current = null;
      if (cancelledByTimeout) {
        setError('Generation timed out. The AI service may be busy \u2014 please try again.');
      }
      setIsGenerating(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    readerRef.current?.cancel();
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setGeneratedRoadmapId(null);
    setError(null);
  }, []);

  return { isGenerating, progress, generatedRoadmapId, error, generate, cancel, reset };
}

// ============================================================================
// useMilestoneUpdate - Update milestone status
// ============================================================================

export function useMilestoneUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMilestone = useCallback(async (
    roadmapId: string,
    milestoneId: string,
    status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED',
    actualHours?: number
  ) => {
    setIsUpdating(true);
    try {
      const res = await fetch(
        `/api/sam/skill-roadmap/${roadmapId}/milestone/${milestoneId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, actualHours }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? 'Failed to update milestone');
      }
      return json.data;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return { updateMilestone, isUpdating };
}

// ============================================================================
// Exported types
// ============================================================================

export type {
  RoadmapSummary,
  RoadmapDetail,
  RoadmapMilestone,
  MilestoneResource,
  MilestoneSkill,
  MatchedCourse,
  GenerationProgress,
  GenerationInput,
};
