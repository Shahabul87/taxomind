/**
 * @sam-ai/core - Context Types
 * Unified context types for SAM AI Tutor
 */
// ============================================================================
// CONTEXT FACTORIES
// ============================================================================
export function createDefaultUserContext(overrides) {
    return {
        id: '',
        role: 'student',
        preferences: {},
        capabilities: [],
        ...overrides,
    };
}
export function createDefaultPageContext(overrides) {
    return {
        type: 'other',
        path: '/',
        capabilities: [],
        breadcrumb: [],
        ...overrides,
    };
}
export function createDefaultConversationContext(overrides) {
    return {
        id: null,
        messages: [],
        isStreaming: false,
        lastMessageAt: null,
        totalMessages: 0,
        ...overrides,
    };
}
export function createDefaultGamificationContext(overrides) {
    return {
        points: 0,
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        badges: [],
        streak: {
            current: 0,
            longest: 0,
            lastActivityDate: null,
        },
        achievements: [],
        ...overrides,
    };
}
export function createDefaultUIContext(overrides) {
    return {
        isOpen: false,
        isMinimized: false,
        position: 'floating',
        theme: 'system',
        size: 'normal',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        ...overrides,
    };
}
export function createDefaultContext(overrides) {
    const now = new Date();
    return {
        user: createDefaultUserContext(overrides?.user),
        page: createDefaultPageContext(overrides?.page),
        form: overrides?.form ?? null,
        conversation: createDefaultConversationContext(overrides?.conversation),
        gamification: createDefaultGamificationContext(overrides?.gamification),
        ui: createDefaultUIContext(overrides?.ui),
        metadata: {
            sessionId: generateSessionId(),
            startedAt: now,
            lastActivityAt: now,
            version: '0.1.0',
            ...overrides?.metadata,
        },
    };
}
function generateSessionId() {
    return `sam_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
//# sourceMappingURL=context.js.map