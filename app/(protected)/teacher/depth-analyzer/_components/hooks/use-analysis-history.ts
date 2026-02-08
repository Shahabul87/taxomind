'use client';

import { useState, useCallback } from 'react';

export interface AnalysisHistoryItem {
  id: string;
  version: number;
  status: string;
  scores: {
    overall: number;
    depth: number;
    consistency: number;
    flow: number;
    quality: number;
  };
  bloomsBalance: string | null;
  issueCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  analysisMethod: string | null;
  analyzedAt: string;
}

interface UseAnalysisHistoryReturn {
  history: AnalysisHistoryItem[];
  isLoading: boolean;
  refetch: (courseId: string) => void;
}

export function useAnalysisHistory(): UseAnalysisHistoryReturn {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback((courseId: string) => {
    if (!courseId) return;

    setIsLoading(true);

    fetch(`/api/teacher/depth-analysis-v2?courseId=${courseId}&pageSize=10`, {
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data.analyses) {
          setHistory(data.data.analyses);
        }
      })
      .catch((err) => {
        console.warn('[AnalysisHistory] Failed to fetch:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { history, isLoading, refetch };
}
