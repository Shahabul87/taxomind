/**
 * @sam-ai/core - Configuration Types
 * Configuration and adapter interface types
 */
export function createSAMConfig(input) {
    return {
        ai: input.ai,
        storage: input.storage,
        cache: input.cache,
        analytics: input.analytics,
        database: input.database,
        logger: input.logger ?? console,
        features: {
            gamification: true,
            formSync: true,
            autoContext: true,
            emotionDetection: true,
            learningStyleDetection: true,
            streaming: true,
            analytics: true,
            ...input.features,
        },
        routes: input.routes ?? {
            coursesList: '/teacher/courses',
            courseDetail: '/teacher/courses/:courseId',
            courseCreate: '/teacher/create',
            chapterDetail: '/teacher/courses/:courseId/chapters/:chapterId',
            sectionDetail: '/teacher/courses/:courseId/chapters/:chapterId/section/:sectionId',
            analytics: '/teacher/analytics',
            settings: '/settings',
            learning: '/learn/:courseId',
        },
        capabilities: input.capabilities ?? getDefaultCapabilities(),
        model: {
            name: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokens: 4000,
            ...input.model,
        },
        rateLimit: input.rateLimit
            ? {
                maxRequests: 100,
                windowMs: 60000,
                ...input.rateLimit,
            }
            : undefined,
        engine: {
            timeout: 30000,
            retries: 2,
            concurrency: 3,
            cacheEnabled: true,
            cacheTTL: 300,
            ...input.engine,
        },
        maxConversationHistory: input.maxConversationHistory ?? 50,
        systemPrompt: input.systemPrompt,
        personality: input.personality,
    };
}
function getDefaultCapabilities() {
    return {
        'courses-list': [
            'view-courses',
            'create-course',
            'analyze-courses',
            'bulk-operations',
        ],
        'course-detail': [
            'edit-course',
            'generate-chapters',
            'analyze-structure',
            'publish-course',
        ],
        'course-create': [
            'create-course',
            'generate-blueprint',
            'ai-assistance',
        ],
        'chapter-detail': [
            'edit-chapter',
            'generate-sections',
            'create-assessment',
            'analyze-content',
        ],
        'section-detail': [
            'edit-section',
            'add-content',
            'create-quiz',
            'analyze-blooms',
        ],
        analytics: [
            'view-analytics',
            'export-data',
            'compare-courses',
        ],
        learning: [
            'take-quiz',
            'ask-question',
            'get-help',
            'track-progress',
        ],
    };
}
//# sourceMappingURL=config.js.map