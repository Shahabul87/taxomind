/**
 * @sam-ai/react - SAM Context
 * React context for SAM AI Tutor state management
 *
 * UPDATED: Removed core Blooms engine registration.
 * Unified Blooms analysis is now handled server-side via API routes
 * that use @sam-ai/educational's createUnifiedBloomsEngine.
 */
import { type ReactNode } from 'react';
import { type SAMAgentOrchestrator, type SAMStateMachine } from '@sam-ai/core';
import type { SAMProviderConfig, UseSAMReturn } from '../types';
interface SAMContextValue extends UseSAMReturn {
    orchestrator: SAMAgentOrchestrator | null;
    stateMachine: SAMStateMachine | null;
}
declare const SAMContext: import("react").Context<SAMContextValue | null>;
interface SAMProviderProps extends SAMProviderConfig {
    children: ReactNode;
}
export declare function SAMProvider({ children, config, transport, api, initialContext, autoDetectContext, debug, onStateChange, onError, }: SAMProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useSAMContext(): SAMContextValue;
export { SAMContext };
//# sourceMappingURL=SAMContext.d.ts.map