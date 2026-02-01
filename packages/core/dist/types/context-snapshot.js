/**
 * @sam-ai/core - Context Snapshot Types
 *
 * Comprehensive type system for page context snapshots gathered from clients.
 * These types define the complete data model for capturing ALL page context
 * (forms, content, navigation, interaction state) in a single snapshot.
 *
 * Portable — no Prisma or framework-specific imports.
 */
// ============================================================================
// MAIN SNAPSHOT TYPE
// ============================================================================
export const CONTEXT_SNAPSHOT_VERSION = '1.0.0';
// ============================================================================
// FACTORY / DEFAULTS
// ============================================================================
export function createDefaultPageState() {
    return {
        isEditing: false,
        isDraft: false,
        isPublished: false,
        hasUnsavedChanges: false,
        permissions: [],
    };
}
export function createDefaultContentSnapshot() {
    return {
        headings: [],
        tables: [],
        codeBlocks: [],
        images: [],
        textSummary: '',
        wordCount: 0,
        readingTimeMinutes: 0,
    };
}
export function createDefaultNavigationSnapshot() {
    return {
        links: [],
    };
}
export function createDefaultInteractionSnapshot() {
    return {
        scrollPosition: 0,
        viewportHeight: 0,
        timeOnPage: 0,
    };
}
export function createDefaultPageContextSnapshot(partial) {
    return {
        version: CONTEXT_SNAPSHOT_VERSION,
        timestamp: Date.now(),
        contentHash: '',
        page: {
            type: 'unknown',
            path: '',
            title: '',
            capabilities: [],
            breadcrumb: [],
            state: createDefaultPageState(),
            meta: {},
        },
        forms: [],
        content: createDefaultContentSnapshot(),
        navigation: createDefaultNavigationSnapshot(),
        interaction: createDefaultInteractionSnapshot(),
        custom: {},
        ...partial,
    };
}
//# sourceMappingURL=context-snapshot.js.map