/**
 * @sam-ai/react - useSAMChat Hook
 * Hook for chat-specific functionality
 */
import type { UseSAMChatReturn } from '../types';
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
export declare function useSAMChat(): UseSAMChatReturn;
//# sourceMappingURL=useSAMChat.d.ts.map