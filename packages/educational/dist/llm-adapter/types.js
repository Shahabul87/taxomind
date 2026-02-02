/**
 * Portable LLM Adapter Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types for a portable, provider-agnostic LLM adapter
 * that supports the depth analysis pipeline.
 */
// Model tier mappings
export const MODEL_TIER_MAPPING = {
    openai: {
        fast: 'gpt-4o-mini',
        balanced: 'gpt-4o',
        powerful: 'gpt-4-turbo',
    },
    anthropic: {
        fast: 'claude-3-5-haiku-latest',
        balanced: 'claude-sonnet-4-20250514',
        powerful: 'claude-opus-4-20250514',
    },
    deepseek: {
        fast: 'deepseek-chat',
        balanced: 'deepseek-chat',
        powerful: 'deepseek-reasoner',
    },
    custom: {
        fast: 'default',
        balanced: 'default',
        powerful: 'default',
    },
};
