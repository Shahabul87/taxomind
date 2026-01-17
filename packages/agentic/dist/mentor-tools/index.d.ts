/**
 * @sam-ai/agentic - Mentor Tools
 * SAM AI Mentor tool implementations for content, scheduling, and notifications
 */
export * from './types';
export { createContentTools, type ContentToolsDependencies, } from './content-tools';
export { createSchedulingTools, type SchedulingToolsDependencies, } from './scheduling-tools';
export { createNotificationTools, type NotificationToolsDependencies, } from './notification-tools';
import type { ToolDefinition } from '../tool-registry/types';
import type { AIAdapter } from '@sam-ai/core';
import { type ContentToolsDependencies } from './content-tools';
import { type SchedulingToolsDependencies } from './scheduling-tools';
import { type NotificationToolsDependencies } from './notification-tools';
/**
 * Combined dependencies for all mentor tools
 */
export interface MentorToolsDependencies {
    aiAdapter: AIAdapter;
    logger?: {
        debug: (message: string, ...args: unknown[]) => void;
        info: (message: string, ...args: unknown[]) => void;
        warn: (message: string, ...args: unknown[]) => void;
        error: (message: string, ...args: unknown[]) => void;
    };
    content?: Omit<ContentToolsDependencies, 'aiAdapter' | 'logger'>;
    scheduling?: Omit<SchedulingToolsDependencies, 'logger'>;
    notification?: Omit<NotificationToolsDependencies, 'logger'>;
}
/**
 * Create all mentor tools with combined dependencies
 */
export declare function createMentorTools(deps: MentorToolsDependencies): ToolDefinition[];
/**
 * Get mentor tool by ID
 */
export declare function getMentorToolById(tools: ToolDefinition[], toolId: string): ToolDefinition | undefined;
/**
 * Get mentor tools by category
 */
export declare function getMentorToolsByCategory(tools: ToolDefinition[], category: string): ToolDefinition[];
/**
 * Get mentor tools by tags
 */
export declare function getMentorToolsByTags(tools: ToolDefinition[], tags: string[]): ToolDefinition[];
//# sourceMappingURL=index.d.ts.map