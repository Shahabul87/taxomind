/**
 * @sam-ai/react - useSAM Hook
 * Main hook for SAM AI Tutor functionality
 */
import type { UseSAMReturn } from '../types';
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
export declare function useSAM(): UseSAMReturn;
//# sourceMappingURL=useSAM.d.ts.map