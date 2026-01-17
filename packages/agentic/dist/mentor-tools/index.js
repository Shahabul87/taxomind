/**
 * @sam-ai/agentic - Mentor Tools
 * SAM AI Mentor tool implementations for content, scheduling, and notifications
 */
// Types
export * from './types';
// Content Tools
export { createContentTools, } from './content-tools';
// Scheduling Tools
export { createSchedulingTools, } from './scheduling-tools';
// Notification Tools
export { createNotificationTools, } from './notification-tools';
import { createContentTools } from './content-tools';
import { createSchedulingTools } from './scheduling-tools';
import { createNotificationTools } from './notification-tools';
/**
 * Create all mentor tools with combined dependencies
 */
export function createMentorTools(deps) {
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
export function getMentorToolById(tools, toolId) {
    return tools.find((t) => t.id === toolId);
}
/**
 * Get mentor tools by category
 */
export function getMentorToolsByCategory(tools, category) {
    return tools.filter((t) => t.category === category);
}
/**
 * Get mentor tools by tags
 */
export function getMentorToolsByTags(tools, tags) {
    return tools.filter((t) => t.tags?.some((tag) => tags.includes(tag)));
}
//# sourceMappingURL=index.js.map