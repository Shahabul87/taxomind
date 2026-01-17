/**
 * @sam-ai/react - Context Detector Utilities
 * Auto-detection of page context from URL and DOM
 */
import type { SAMPageType, SAMContext } from '@sam-ai/core';
import type { PageContextDetection, ContextDetectorOptions } from '../types';
/**
 * Create a context detector with custom options
 */
export declare function createContextDetector(options?: ContextDetectorOptions): {
    detectFromPath: (path: string) => PageContextDetection;
    detectFromDOM: () => Partial<PageContextDetection>;
    detect: () => PageContextDetection;
};
/**
 * Get capabilities for a page type
 */
export declare function getCapabilities(pageType: SAMPageType): string[];
/**
 * Check if a capability is available for the current context
 */
export declare function hasCapability(context: SAMContext, capability: string): boolean;
export declare const contextDetector: {
    detectFromPath: (path: string) => PageContextDetection;
    detectFromDOM: () => Partial<PageContextDetection>;
    detect: () => PageContextDetection;
};
//# sourceMappingURL=contextDetector.d.ts.map