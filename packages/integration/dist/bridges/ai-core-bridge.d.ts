import type { AIAdapter as CoreAIAdapter } from '@sam-ai/core';
import type { AIAdapter as IntegrationAIAdapter } from '../adapters/ai';
export declare function createCoreAIAdapterFromIntegration(adapter: IntegrationAIAdapter, options?: {
    model?: string;
}): CoreAIAdapter;
//# sourceMappingURL=ai-core-bridge.d.ts.map