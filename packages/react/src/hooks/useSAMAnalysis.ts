/**
 * @sam-ai/react - useSAMAnalysis Hook
 * Hook for content analysis functionality
 */

'use client';

import { useState, useCallback } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { OrchestrationResult, BloomsAnalysis } from '@sam-ai/core';
import type { UseSAMAnalysisReturn } from '../types';

/**
 * Hook for SAM analysis functionality
 *
 * @example
 * ```tsx
 * function AnalysisComponent() {
 *   const { analyze, isAnalyzing, bloomsAnalysis } = useSAMAnalysis();
 *
 *   return (
 *     <div>
 *       <button onClick={() => analyze('Analyze this content')} disabled={isAnalyzing}>
 *         {isAnalyzing ? 'Analyzing...' : 'Analyze'}
 *       </button>
 *       {bloomsAnalysis && (
 *         <div>
 *           <p>Dominant Level: {bloomsAnalysis.dominantLevel}</p>
 *           <p>Cognitive Depth: {bloomsAnalysis.cognitiveDepth}%</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAMAnalysis(): UseSAMAnalysisReturn {
  const { analyze: contextAnalyze, lastResult, getBloomsAnalysis } = useSAMContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<OrchestrationResult | null>(null);

  const analyze = useCallback(
    async (query?: string): Promise<OrchestrationResult | null> => {
      setIsAnalyzing(true);
      try {
        const result = await contextAnalyze(query);
        setLastAnalysis(result);
        return result;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [contextAnalyze]
  );

  const bloomsAnalysis: BloomsAnalysis | null = getBloomsAnalysis();

  return {
    analyze,
    isAnalyzing,
    lastAnalysis: lastAnalysis ?? lastResult,
    bloomsAnalysis,
  };
}
