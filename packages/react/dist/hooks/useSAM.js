/**
 * @sam-ai/react - useSAM Hook
 * Main hook for SAM AI Tutor functionality
 */
'use client';
import { useSAMContext } from '../context/SAMContext';
/**
 * Main hook for SAM AI Tutor functionality
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     isOpen,
 *     messages,
 *     sendMessage,
 *     open,
 *     close,
 *   } = useSAM();
 *
 *   return (
 *     <div>
 *       <button onClick={open}>Open SAM</button>
 *       {isOpen && (
 *         <div>
 *           {messages.map(msg => (
 *             <div key={msg.id}>{msg.content}</div>
 *           ))}
 *           <input onSubmit={(e) => sendMessage(e.target.value)} />
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAM() {
    const context = useSAMContext();
    // Return only the public API (exclude orchestrator and stateMachine)
    const { 
    // State
    context: samContext, state, isOpen, isProcessing, isStreaming, messages, error, lastResult, suggestions, actions, 
    // Actions
    open, close, toggle, sendMessage, clearMessages, clearError, updateContext, updatePage, updateForm, analyze, getBloomsAnalysis, executeAction, } = context;
    return {
        // State
        context: samContext,
        state,
        isOpen,
        isProcessing,
        isStreaming,
        messages,
        error,
        lastResult,
        suggestions,
        actions,
        // Actions
        open,
        close,
        toggle,
        sendMessage,
        clearMessages,
        clearError,
        updateContext,
        updatePage,
        updateForm,
        analyze,
        getBloomsAnalysis,
        executeAction,
    };
}
