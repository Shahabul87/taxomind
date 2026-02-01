/**
 * @sam-ai/react - useContextGathering
 *
 * Comprehensive client-side DOM collector that produces a PageContextSnapshot.
 * Replaces and unifies useSAMPageContext page detection, useSAMFormAutoDetect,
 * and useSAMPageLinks into a single, complete snapshot of page state.
 *
 * Features:
 * - Full form scanning with field metadata, labels, validation, options
 * - Content extraction (headings, tables, code blocks, images, text)
 * - Navigation analysis (links, tabs, sidebar, pagination)
 * - Page state detection (editing, draft, publishing, wizard steps)
 * - Interaction tracking (scroll, focus, selection, time on page)
 * - MutationObserver for SPA navigation + DOM changes
 * - Extensible via custom ContextProviders
 * - Debounced with content hash change detection
 */
import type { UseContextGatheringOptions, UseContextGatheringReturn } from '@sam-ai/core';
export declare function useContextGathering(options?: UseContextGatheringOptions): UseContextGatheringReturn;
//# sourceMappingURL=useContextGathering.d.ts.map