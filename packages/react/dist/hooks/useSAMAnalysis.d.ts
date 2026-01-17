/**
 * @sam-ai/react - useSAMAnalysis Hook
 * Hook for content analysis functionality
 */
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
export declare function useSAMAnalysis(): UseSAMAnalysisReturn;
//# sourceMappingURL=useSAMAnalysis.d.ts.map