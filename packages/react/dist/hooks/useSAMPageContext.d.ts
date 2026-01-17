/**
 * @sam-ai/react - useSAMPageContext Hook
 * Hook for page context management
 */
import type { UseSAMContextReturn } from '../types';
/**
 * Hook for SAM page context management
 *
 * @example
 * ```tsx
 * function PageComponent() {
 *   const { context, updatePage, detectPageContext } = useSAMPageContext();
 *
 *   useEffect(() => {
 *     // Auto-detect context on mount
 *     detectPageContext();
 *   }, []);
 *
 *   return (
 *     <div>
 *       <p>Current page: {context.page.type}</p>
 *       <button onClick={() => updatePage({ type: 'dashboard' })}>
 *         Set Dashboard
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useSAMPageContext(): UseSAMContextReturn;
/**
 * Hook to auto-detect and sync page context on route changes
 */
export declare function useSAMAutoContext(enabled?: boolean): void;
//# sourceMappingURL=useSAMPageContext.d.ts.map