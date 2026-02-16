/**
 * Barrel re-export for backward compatibility.
 *
 * The hook has been decomposed into:
 *   ./use-sam-sequential-creation/types.ts          — interfaces, constants
 *   ./use-sam-sequential-creation/sse-event-handler.ts — parseSSEChunk, handleSSEEvent
 *   ./use-sam-sequential-creation/sse-stream-reader.ts — readSSEStream
 *   ./use-sam-sequential-creation/eta-calculator.ts  — calculateETA
 *   ./use-sam-sequential-creation/index.ts           — main React hook
 *
 * All existing imports from '@/hooks/use-sam-sequential-creation' continue to work.
 */

export { useSequentialCreation } from './use-sam-sequential-creation/index';
export { default } from './use-sam-sequential-creation/index';
export type { DbProgress, UseSequentialCreationReturn } from './use-sam-sequential-creation/types';
