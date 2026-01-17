/**
 * @sam-ai/react - useSAMActions Hook
 * Hook for SAM action execution
 */
'use client';
import { useState, useCallback } from 'react';
import { useSAMContext } from '../context/SAMContext';
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
export function useSAMActions() {
    const { lastResult, executeAction: contextExecuteAction } = useSAMContext();
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastActionResult, setLastActionResult] = useState(null);
    const actions = lastResult?.response.actions ?? [];
    const executeAction = useCallback(async (action) => {
        setIsExecuting(true);
        try {
            await contextExecuteAction(action);
            setLastActionResult({ success: true, action });
        }
        catch (error) {
            setLastActionResult({ success: false, error, action });
            throw error;
        }
        finally {
            setIsExecuting(false);
        }
    }, [contextExecuteAction]);
    return {
        actions,
        executeAction,
        isExecuting,
        lastActionResult,
    };
}
