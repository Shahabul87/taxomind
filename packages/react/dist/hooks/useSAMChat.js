/**
 * @sam-ai/react - useSAMChat Hook
 * Hook for chat-specific functionality
 */
'use client';
import { useSAMContext } from '../context/SAMContext';
/**
 * Hook for SAM chat functionality
 *
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const { messages, sendMessage, isProcessing, suggestions } = useSAMChat();
 *
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       {isProcessing && <span>Thinking...</span>}
 *       <div>
 *         {suggestions.map(s => (
 *           <button key={s.id} onClick={() => sendMessage(s.text)}>
 *             {s.label}
 *           </button>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAMChat() {
    const { messages, isProcessing, isStreaming, sendMessage, clearMessages, lastResult, } = useSAMContext();
    const suggestions = lastResult?.response.suggestions ?? [];
    return {
        messages,
        isProcessing,
        isStreaming,
        sendMessage,
        clearMessages,
        suggestions,
    };
}
