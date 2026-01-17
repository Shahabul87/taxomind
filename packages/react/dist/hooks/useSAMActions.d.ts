/**
 * @sam-ai/react - useSAMActions Hook
 * Hook for SAM action execution
 */
import type { UseSAMActionsReturn } from '../types';
/**
 * Hook for SAM action execution
 *
 * @example
 * ```tsx
 * function ActionsComponent() {
 *   const { actions, executeAction, isExecuting } = useSAMActions();
 *
 *   return (
 *     <div>
 *       {actions.map(action => (
 *         <button
 *           key={action.id}
 *           onClick={() => executeAction(action)}
 *           disabled={isExecuting}
 *         >
 *           {action.label}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useSAMActions(): UseSAMActionsReturn;
//# sourceMappingURL=useSAMActions.d.ts.map