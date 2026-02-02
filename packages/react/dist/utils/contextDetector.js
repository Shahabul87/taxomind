/**
 * @sam-ai/react - Context Detector Utilities
 * Auto-detection of page context from URL and DOM
 */
// ============================================================================
// DEFAULT ROUTE PATTERNS
// ============================================================================
const DEFAULT_ROUTE_PATTERNS = [
    // Teacher routes
    {
        pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)\/section\/([^/]+)/,
        type: 'section-detail',
        extract: (match) => ({
            entityId: match[3],
            parentEntityId: match[2],
        }),
    },
    {
        pattern: /^\/teacher\/courses\/([^/]+)\/chapters\/([^/]+)/,
        type: 'chapter-detail',
        extract: (match) => ({
            entityId: match[2],
            parentEntityId: match[1],
        }),
    },
    {
        pattern: /^\/teacher\/courses\/([^/]+)/,
        type: 'course-detail',
        extract: (match) => ({
            entityId: match[1],
        }),
    },
    {
        pattern: /^\/teacher\/courses/,
        type: 'courses-list',
    },
    {
        pattern: /^\/teacher\/create/,
        type: 'course-create',
    },
    {
        pattern: /^\/teacher\/analytics/,
        type: 'analytics',
    },
    // Student routes
    {
        pattern: /^\/courses\/([^/]+)\/chapters\/([^/]+)/,
        type: 'chapter-detail',
        extract: (match) => ({
            entityId: match[2],
            parentEntityId: match[1],
        }),
    },
    {
        pattern: /^\/courses\/([^/]+)/,
        type: 'course-detail',
        extract: (match) => ({
            entityId: match[1],
        }),
    },
    {
        pattern: /^\/courses/,
        type: 'courses-list',
    },
    // Common routes
    {
        pattern: /^\/dashboard/,
        type: 'dashboard',
    },
    {
        pattern: /^\/settings/,
        type: 'settings',
    },
];
// ============================================================================
// DEFAULT CAPABILITIES
// ============================================================================
const DEFAULT_CAPABILITIES = {
    dashboard: ['analyze-progress', 'suggest-next-steps', 'show-insights'],
    'courses-list': ['search-courses', 'suggest-courses', 'compare-courses'],
    'course-detail': ['analyze-course', 'suggest-improvements', 'generate-outline', 'ask-questions'],
    'course-create': ['suggest-title', 'generate-description', 'create-outline', 'fill-form'],
    'chapter-detail': ['analyze-chapter', 'suggest-content', 'generate-questions', 'explain-concepts'],
    'section-detail': ['analyze-section', 'suggest-content', 'generate-quiz', 'explain-topic'],
    settings: ['explain-settings', 'suggest-preferences'],
    analytics: ['explain-metrics', 'identify-trends', 'suggest-actions'],
    learning: ['explain-concept', 'provide-examples', 'quiz-me'],
    exam: ['prepare-exam', 'review-answers', 'explain-mistakes'],
    other: ['answer-questions', 'provide-help'],
};
// ============================================================================
// CONTEXT DETECTOR
// ============================================================================
/**
 * Create a context detector with custom options
 */
export function createContextDetector(options) {
    const routePatterns = options?.routePatterns ?? {};
    const capabilityMappings = options?.capabilityMappings ?? DEFAULT_CAPABILITIES;
    /**
     * Detect page context from a URL path
     */
    function detectFromPath(path) {
        // Check custom patterns first
        for (const [pattern, type] of Object.entries(routePatterns)) {
            const regex = new RegExp(pattern);
            if (regex.test(path)) {
                return {
                    type,
                    path,
                    capabilities: capabilityMappings[type] ?? [],
                    breadcrumb: generateBreadcrumb(path),
                };
            }
        }
        // Check default patterns
        for (const { pattern, type, extract } of DEFAULT_ROUTE_PATTERNS) {
            const match = path.match(pattern);
            if (match) {
                const extracted = extract?.(match) ?? {};
                return {
                    type,
                    path,
                    ...extracted,
                    capabilities: capabilityMappings[type] ?? [],
                    breadcrumb: generateBreadcrumb(path),
                };
            }
        }
        // Default
        return {
            type: 'other',
            path,
            capabilities: capabilityMappings['other'] ?? [],
            breadcrumb: generateBreadcrumb(path),
        };
    }
    /**
     * Detect context from DOM elements
     */
    function detectFromDOM() {
        if (typeof document === 'undefined')
            return {};
        const detection = {};
        // Try to detect entity ID from data attributes
        const entityElement = document.querySelector('[data-entity-id]');
        if (entityElement) {
            detection.entityId = entityElement.getAttribute('data-entity-id') ?? undefined;
        }
        // Try to detect page type from data attributes
        const pageTypeElement = document.querySelector('[data-page-type]');
        if (pageTypeElement) {
            detection.type = pageTypeElement.getAttribute('data-page-type');
        }
        // Try to detect from meta tags
        const metaEntityId = document.querySelector('meta[name="sam:entity-id"]');
        if (metaEntityId) {
            detection.entityId = metaEntityId.getAttribute('content') ?? undefined;
        }
        const metaPageType = document.querySelector('meta[name="sam:page-type"]');
        if (metaPageType) {
            detection.type = metaPageType.getAttribute('content');
        }
        return detection;
    }
    /**
     * Detect full context combining URL and DOM
     */
    function detect() {
        if (typeof window === 'undefined') {
            return {
                type: 'other',
                path: '/',
                capabilities: [],
                breadcrumb: [],
            };
        }
        const pathDetection = detectFromPath(window.location.pathname);
        if (options?.detectFromDOM) {
            const domDetection = detectFromDOM();
            return {
                ...pathDetection,
                ...domDetection,
            };
        }
        return pathDetection;
    }
    return {
        detectFromPath,
        detectFromDOM,
        detect,
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Generate breadcrumb from path
 */
function generateBreadcrumb(path) {
    const segments = path.split('/').filter(Boolean);
    const breadcrumb = [];
    for (const segment of segments) {
        // Skip IDs (UUIDs or numeric)
        if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
            continue;
        }
        // Capitalize and format
        const formatted = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
        breadcrumb.push(formatted);
    }
    return breadcrumb;
}
/**
 * Get capabilities for a page type
 */
export function getCapabilities(pageType) {
    return DEFAULT_CAPABILITIES[pageType] ?? DEFAULT_CAPABILITIES['other'] ?? [];
}
/**
 * Check if a capability is available for the current context
 */
export function hasCapability(context, capability) {
    return context.page.capabilities.includes(capability);
}
// Default detector instance
export const contextDetector = createContextDetector();
