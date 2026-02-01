/**
 * @sam-ai/core - Context Gathering Engine
 *
 * Portable engine that processes raw page context snapshots from any client,
 * produces enriched context for downstream engines, and generates memory
 * directives for auto-syncing to SAM memory.
 *
 * No Prisma or Taxomind imports — fully portable.
 */
import { BaseEngine } from './base';
// ============================================================================
// PAGE INTENT MAPPING
// ============================================================================
const PAGE_TYPE_INTENTS = {
    'course-detail': 'Viewing course overview to understand structure and enroll',
    'chapter-detail': 'Studying chapter content and reviewing material',
    'section-detail': 'Actively learning section content in depth',
    'courses-list': 'Browsing available courses and comparing options',
    'teacher-courses': 'Managing courses as an instructor',
    'teacher-course-edit': 'Editing course content and settings',
    'teacher-chapter-edit': 'Editing chapter structure or content',
    'teacher-section-edit': 'Creating or editing section learning material',
    'exam-detail': 'Taking or reviewing an examination',
    'exam-edit': 'Creating or editing exam questions',
    'assignment-detail': 'Working on or reviewing an assignment',
    'dashboard': 'Reviewing overall learning progress',
    'study-plan': 'Reviewing study plan and scheduled tasks',
    'settings': 'Managing account or application settings',
    'profile': 'Viewing or editing user profile',
};
const PAGE_TYPE_ACTIONS = {
    'course-detail': ['explain-course', 'suggest-study-plan', 'preview-chapters', 'analyze-difficulty'],
    'chapter-detail': ['explain-chapter', 'quiz-on-chapter', 'summarize-content', 'suggest-exercises'],
    'section-detail': ['explain-section', 'analyze-bloom-level', 'generate-practice', 'simplify-content', 'suggest-next-steps'],
    'courses-list': ['recommend-course', 'compare-courses', 'filter-by-level'],
    'teacher-courses': ['suggest-improvements', 'analyze-engagement'],
    'teacher-course-edit': ['fill-form', 'suggest-description', 'review-objectives', 'optimize-structure'],
    'teacher-chapter-edit': ['fill-form', 'suggest-title', 'review-order'],
    'teacher-section-edit': ['fill-form', 'suggest-content', 'analyze-bloom-level', 'check-alignment'],
    'exam-detail': ['explain-question', 'provide-hint', 'check-answer'],
    'exam-edit': ['generate-questions', 'analyze-bloom-coverage', 'suggest-distractors'],
    'assignment-detail': ['explain-assignment', 'provide-guidance', 'check-progress'],
    'dashboard': ['summarize-progress', 'suggest-next-study', 'identify-gaps'],
    'study-plan': ['explain-plan', 'adjust-schedule', 'mark-complete'],
    'settings': ['explain-setting', 'suggest-configuration'],
    'profile': ['update-preferences', 'review-achievements'],
};
// ============================================================================
// ENGINE
// ============================================================================
export class ContextGatheringEngine extends BaseEngine {
    constructor(config) {
        super({
            config,
            name: 'context-gathering',
            version: '1.0.0',
            dependencies: [],
            cacheEnabled: false,
        });
    }
    async process(input) {
        const { snapshot, enrichmentData } = input;
        // 1. Merge client snapshot with server enrichment
        const enrichedSnapshot = this.enrichSnapshot(snapshot, enrichmentData);
        // 2. Build structured summaries
        const pageSummary = this.buildPageSummary(enrichedSnapshot.page, enrichmentData?.entityContext);
        const formSummary = this.buildFormSummary(enrichedSnapshot.forms);
        const contentSummary = this.buildContentSummary(enrichedSnapshot.content);
        const navigationSummary = this.buildNavigationSummary(enrichedSnapshot.navigation);
        // 3. Infer page intent
        const pageIntent = this.inferPageIntent(enrichedSnapshot, enrichmentData);
        // 4. Determine available actions
        const availableActions = this.determineAvailableActions(enrichedSnapshot);
        // 5. Calculate confidence
        const contextConfidence = this.calculateConfidence(enrichedSnapshot, enrichmentData);
        // 6. Produce memory directives
        const memoryDirectives = this.produceMemoryDirectives(enrichedSnapshot, enrichmentData);
        return {
            snapshot: enrichedSnapshot,
            pageSummary,
            formSummary,
            contentSummary,
            navigationSummary,
            pageIntent,
            availableActions,
            contextConfidence,
            memoryDirectives,
        };
    }
    getCacheKey() {
        return 'context-gathering:no-cache';
    }
    // ==========================================================================
    // ENRICHMENT
    // ==========================================================================
    enrichSnapshot(snapshot, enrichmentData) {
        if (!enrichmentData)
            return snapshot;
        const enrichedPage = { ...snapshot.page };
        if (enrichmentData.entityContext) {
            const entity = enrichmentData.entityContext;
            if (entity.entityId && !enrichedPage.entityId) {
                enrichedPage.entityId = entity.entityId;
            }
            if (entity.title && !enrichedPage.title) {
                enrichedPage.title = entity.title;
            }
        }
        return {
            ...snapshot,
            page: enrichedPage,
        };
    }
    // ==========================================================================
    // SUMMARY BUILDERS
    // ==========================================================================
    buildPageSummary(page, entityContext) {
        const parts = [];
        parts.push(`Page: ${page.title || page.path}`);
        parts.push(`Type: ${page.type}`);
        if (page.entityId) {
            parts.push(`Entity ID: ${page.entityId}`);
        }
        if (entityContext) {
            parts.push(`Entity: ${entityContext.title} (${entityContext.entityType})`);
            if (entityContext.description) {
                parts.push(`Description: ${entityContext.description.slice(0, 200)}`);
            }
        }
        if (page.breadcrumb.length > 0) {
            parts.push(`Breadcrumb: ${page.breadcrumb.join(' > ')}`);
        }
        if (page.capabilities.length > 0) {
            parts.push(`Capabilities: ${page.capabilities.join(', ')}`);
        }
        const stateFlags = [];
        if (page.state.isEditing)
            stateFlags.push('editing');
        if (page.state.isDraft)
            stateFlags.push('draft');
        if (page.state.isPublished)
            stateFlags.push('published');
        if (page.state.hasUnsavedChanges)
            stateFlags.push('unsaved changes');
        if (page.state.step != null && page.state.totalSteps != null) {
            stateFlags.push(`step ${page.state.step}/${page.state.totalSteps}`);
        }
        if (stateFlags.length > 0) {
            parts.push(`State: ${stateFlags.join(', ')}`);
        }
        return parts.join('\n');
    }
    buildFormSummary(forms) {
        if (forms.length === 0)
            return 'No forms on this page.';
        const parts = [`${forms.length} form(s) on page:`];
        for (const form of forms) {
            parts.push(`\nForm: ${form.formName || form.formId} (purpose: ${form.purpose})`);
            parts.push(`  Status: ${form.state.completionPercent}% complete, ${form.state.errorCount} error(s), ${form.state.isDirty ? 'modified' : 'clean'}`);
            const requiredFields = form.fields.filter((f) => f.required);
            const filledRequired = requiredFields.filter((f) => f.value != null && f.value !== '');
            if (requiredFields.length > 0) {
                parts.push(`  Required fields: ${filledRequired.length}/${requiredFields.length} filled`);
            }
            for (const field of form.fields) {
                const valueStr = field.value != null && field.value !== ''
                    ? `"${String(field.value).slice(0, 50)}"`
                    : '(empty)';
                const flags = [];
                if (field.required)
                    flags.push('required');
                if (field.disabled)
                    flags.push('disabled');
                if (field.validationState === 'invalid')
                    flags.push('invalid');
                const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
                parts.push(`  - ${field.label || field.name} (${field.type}): ${valueStr}${flagStr}`);
                if (field.errors.length > 0) {
                    parts.push(`    Errors: ${field.errors.join('; ')}`);
                }
                if (field.options && field.options.length > 0 && field.options.length <= 10) {
                    const optStr = field.options.map((o) => o.label).join(', ');
                    parts.push(`    Options: ${optStr}`);
                }
            }
            if (form.fieldGroups.length > 0) {
                parts.push(`  Groups: ${form.fieldGroups.map((g) => g.label || g.name).join(', ')}`);
            }
        }
        return parts.join('\n');
    }
    buildContentSummary(content) {
        if (content.wordCount === 0 && content.headings.length === 0) {
            return 'No visible content detected.';
        }
        const parts = [];
        if (content.headings.length > 0) {
            parts.push('Headings:');
            for (const h of content.headings.slice(0, 10)) {
                parts.push(`  ${'#'.repeat(h.level)} ${h.text}`);
            }
            if (content.headings.length > 10) {
                parts.push(`  ...and ${content.headings.length - 10} more`);
            }
        }
        if (content.wordCount > 0) {
            parts.push(`Content: ${content.wordCount} words (~${content.readingTimeMinutes} min read)`);
        }
        if (content.tables.length > 0) {
            parts.push(`Tables: ${content.tables.length}`);
            for (const t of content.tables.slice(0, 3)) {
                const caption = t.caption ? ` "${t.caption}"` : '';
                parts.push(`  - ${t.rowCount} rows, columns: ${t.headers.join(', ')}${caption}`);
            }
        }
        if (content.codeBlocks.length > 0) {
            parts.push(`Code blocks: ${content.codeBlocks.length}`);
            for (const cb of content.codeBlocks.slice(0, 3)) {
                const lang = cb.language ? ` (${cb.language})` : '';
                parts.push(`  - ${cb.preview.slice(0, 60)}...${lang}`);
            }
        }
        if (content.images.length > 0) {
            parts.push(`Images: ${content.images.length}`);
        }
        if (content.textSummary) {
            parts.push(`\nText preview: ${content.textSummary.slice(0, 500)}`);
        }
        return parts.join('\n');
    }
    buildNavigationSummary(navigation) {
        const parts = [];
        if (navigation.tabs && navigation.tabs.length > 0) {
            const activeTab = navigation.tabs.find((t) => t.isActive);
            parts.push(`Tabs: ${navigation.tabs.map((t) => t.label).join(', ')}${activeTab ? ` (active: ${activeTab.label})` : ''}`);
        }
        if (navigation.pagination) {
            const p = navigation.pagination;
            parts.push(`Pagination: page ${p.current}/${p.total}`);
        }
        if (navigation.sidebar && navigation.sidebar.length > 0) {
            const activeSidebar = navigation.sidebar.find((s) => s.isActive);
            parts.push(`Sidebar: ${navigation.sidebar.length} items${activeSidebar ? `, active: ${activeSidebar.label}` : ''}`);
        }
        const actionLinks = navigation.links.filter((l) => l.category === 'action');
        if (actionLinks.length > 0) {
            parts.push(`Action links: ${actionLinks.map((l) => l.text).join(', ')}`);
        }
        if (parts.length === 0) {
            return 'No notable navigation elements.';
        }
        return parts.join('\n');
    }
    // ==========================================================================
    // INTENT INFERENCE
    // ==========================================================================
    inferPageIntent(snapshot, enrichmentData) {
        const { page, forms, content } = snapshot;
        // Check known page type intents
        const knownIntent = PAGE_TYPE_INTENTS[page.type];
        // Refine with form presence
        if (forms.length > 0 && page.state.isEditing) {
            const primaryForm = forms[0];
            if (primaryForm.purpose === 'create') {
                return `Creating new ${page.type.replace('teacher-', '').replace('-edit', '')} content via form`;
            }
            if (primaryForm.purpose === 'edit') {
                return `Editing existing ${page.type.replace('teacher-', '').replace('-edit', '')} content`;
            }
        }
        // Refine with entity context
        if (enrichmentData?.entityContext) {
            const entity = enrichmentData.entityContext;
            if (knownIntent) {
                return `${knownIntent} — "${entity.title}"`;
            }
            return `Working with ${entity.entityType} "${entity.title}"`;
        }
        if (knownIntent)
            return knownIntent;
        // Fallback: infer from content
        if (content.wordCount > 500) {
            return 'Reading detailed content on this page';
        }
        if (forms.length > 0) {
            return 'Filling out a form on this page';
        }
        return `Viewing ${page.type || 'unknown'} page`;
    }
    // ==========================================================================
    // AVAILABLE ACTIONS
    // ==========================================================================
    determineAvailableActions(snapshot) {
        const { page, forms } = snapshot;
        const actions = [];
        // Add page-type specific actions
        const typeActions = PAGE_TYPE_ACTIONS[page.type];
        if (typeActions) {
            actions.push(...typeActions);
        }
        // Add form actions
        if (forms.length > 0) {
            actions.push('fill-form', 'validate-form', 'explain-form-fields');
            for (const form of forms) {
                if (form.state.errorCount > 0) {
                    actions.push('fix-form-errors');
                }
                if (form.state.completionPercent < 100) {
                    actions.push('suggest-missing-fields');
                }
            }
        }
        // Add content actions
        if (snapshot.content.wordCount > 100) {
            actions.push('summarize-content', 'analyze-content');
        }
        if (snapshot.content.codeBlocks.length > 0) {
            actions.push('explain-code', 'review-code');
        }
        // Deduplicate
        return [...new Set(actions)];
    }
    // ==========================================================================
    // CONFIDENCE
    // ==========================================================================
    calculateConfidence(snapshot, enrichmentData) {
        let score = 0;
        const weights = {
            pageType: 0.2,
            title: 0.1,
            entityId: 0.15,
            entityContext: 0.2,
            forms: 0.1,
            content: 0.1,
            breadcrumb: 0.05,
            capabilities: 0.05,
            userProfile: 0.05,
        };
        if (snapshot.page.type && snapshot.page.type !== 'unknown')
            score += weights.pageType;
        if (snapshot.page.title)
            score += weights.title;
        if (snapshot.page.entityId)
            score += weights.entityId;
        if (enrichmentData?.entityContext)
            score += weights.entityContext;
        if (snapshot.forms.length > 0)
            score += weights.forms;
        if (snapshot.content.wordCount > 0)
            score += weights.content;
        if (snapshot.page.breadcrumb.length > 0)
            score += weights.breadcrumb;
        if (snapshot.page.capabilities.length > 0)
            score += weights.capabilities;
        if (enrichmentData?.userProfile)
            score += weights.userProfile;
        return Math.min(1, Math.round(score * 100) / 100);
    }
    // ==========================================================================
    // MEMORY DIRECTIVES
    // ==========================================================================
    produceMemoryDirectives(snapshot, enrichmentData) {
        const contentForIngestion = [];
        const entitiesForGraph = [];
        const sessionContextUpdates = {};
        // Content ingestion: only if meaningful text exists
        const shouldIngestContent = snapshot.content.wordCount > 50;
        if (shouldIngestContent && snapshot.content.textSummary) {
            contentForIngestion.push(snapshot.content.textSummary);
        }
        // Session context: always update with current page info
        sessionContextUpdates.currentPage = {
            type: snapshot.page.type,
            path: snapshot.page.path,
            title: snapshot.page.title,
            entityId: snapshot.page.entityId,
        };
        if (snapshot.forms.length > 0) {
            sessionContextUpdates.currentForm = {
                formId: snapshot.forms[0].formId,
                purpose: snapshot.forms[0].purpose,
                completionPercent: snapshot.forms[0].state.completionPercent,
                fieldCount: snapshot.forms[0].fields.length,
            };
        }
        // Knowledge graph: entities from enrichment
        const shouldUpdateKnowledgeGraph = !!enrichmentData?.entityContext;
        if (enrichmentData?.entityContext) {
            const entity = enrichmentData.entityContext;
            entitiesForGraph.push({
                name: entity.title,
                type: entity.entityType,
                relationships: enrichmentData.relatedEntities
                    ? enrichmentData.relatedEntities.map((r) => `${r.relationship}:${r.title}`)
                    : [],
            });
        }
        return {
            shouldIngestContent,
            shouldUpdateSessionContext: true,
            shouldUpdateKnowledgeGraph,
            contentForIngestion,
            entitiesForGraph,
            sessionContextUpdates,
        };
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createContextGatheringEngine(config) {
    return new ContextGatheringEngine(config);
}
//# sourceMappingURL=context-gathering.js.map