/**
 * @sam-ai/agentic - Mentor Tools
 * SAM AI Mentor tool implementations for content, scheduling, and notifications
 */

// Types
export * from './types';

// Content Tools
export {
  createContentTools,
  type ContentToolsDependencies,
} from './content-tools';

// Scheduling Tools
export {
  createSchedulingTools,
  type SchedulingToolsDependencies,
} from './scheduling-tools';

// Notification Tools
export {
  createNotificationTools,
  type NotificationToolsDependencies,
} from './notification-tools';

// ============================================================================
// COMBINED TOOL FACTORY
// ============================================================================

import type { ToolDefinition } from '../tool-registry/types';
import type { AIAdapter } from '@sam-ai/core';
import { createContentTools, type ContentToolsDependencies } from './content-tools';
import { createSchedulingTools, type SchedulingToolsDependencies } from './scheduling-tools';
import { createNotificationTools, type NotificationToolsDependencies } from './notification-tools';

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
export function createMentorTools(deps: MentorToolsDependencies): ToolDefinition[] {
  const contentTools = createContentTools({
    aiAdapter: deps.aiAdapter,
    logger: deps.logger,
    ...deps.content,
  });

  const schedulingTools = createSchedulingTools({
    logger: deps.logger,
    ...deps.scheduling,
  });

  const notificationTools = createNotificationTools({
    logger: deps.logger,
    ...deps.notification,
  });

  return [...contentTools, ...schedulingTools, ...notificationTools];
}

/**
 * Get mentor tool by ID
 */
export function getMentorToolById(
  tools: ToolDefinition[],
  toolId: string
): ToolDefinition | undefined {
  return tools.find((t) => t.id === toolId);
}

/**
 * Get mentor tools by category
 */
export function getMentorToolsByCategory(
  tools: ToolDefinition[],
  category: string
): ToolDefinition[] {
  return tools.filter((t) => t.category === category);
}

/**
 * Get mentor tools by tags
 */
export function getMentorToolsByTags(
  tools: ToolDefinition[],
  tags: string[]
): ToolDefinition[] {
  return tools.filter((t) => t.tags?.some((tag) => tags.includes(tag)));
}
