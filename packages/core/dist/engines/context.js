/**
 * @sam-ai/core - Context Engine
 * Analyzes and enriches context for other engines
 */
import { BaseEngine } from './base';
// ============================================================================
// CONTEXT ENGINE
// ============================================================================
export class ContextEngine extends BaseEngine {
    constructor(config) {
        super({
            config,
            name: 'context',
            version: '1.0.0',
            dependencies: [], // No dependencies - runs first
            cacheEnabled: false, // Context should always be fresh
        });
    }
    async process(input) {
        const { context, query } = input;
        // Analyze page context
        const enrichedContext = this.analyzePageContext(context.page.type, context.page.entityId);
        // Analyze query if present
        let queryAnalysis = null;
        if (query) {
            queryAnalysis = await this.analyzeQuery(query);
        }
        return {
            enrichedContext,
            queryAnalysis,
        };
    }
    getCacheKey(input) {
        return `context:${input.context.page.path}:${input.query ?? 'none'}`;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    analyzePageContext(pageType, entityId) {
        const entityTypeMap = {
            // Dashboard routes
            dashboard: 'user',
            'user-dashboard': 'user',
            'admin-dashboard': 'user',
            'teacher-dashboard': 'user',
            'user-analytics': 'user',
            // Course management routes
            'courses-list': 'none',
            'course-detail': 'course',
            'course-create': 'course',
            'chapter-detail': 'chapter',
            'section-detail': 'section',
            analytics: 'none',
            // Learning routes
            learning: 'course',
            'course-learning': 'course',
            'chapter-learning': 'chapter',
            'section-learning': 'section',
            // Exam routes
            exam: 'section',
            'exam-results': 'section',
            // General routes
            settings: 'user',
            other: 'none',
        };
        const capabilitiesMap = {
            // Dashboard routes
            dashboard: ['view-overview', 'quick-actions', 'recommendations'],
            'user-dashboard': ['view-progress', 'continue-learning', 'recommendations', 'goal-tracking'],
            'admin-dashboard': ['platform-management', 'user-analytics', 'system-monitoring'],
            'teacher-dashboard': ['manage-courses', 'view-analytics', 'student-progress', 'create-content'],
            'user-analytics': ['view-analytics', 'learning-insights', 'progress-tracking', 'goal-progress'],
            // Course management routes
            'courses-list': ['list-courses', 'filter-courses', 'create-course', 'bulk-actions'],
            'course-detail': ['edit-course', 'add-chapters', 'publish-course', 'analyze-course'],
            'course-create': ['create-course', 'generate-blueprint', 'set-objectives'],
            'chapter-detail': ['edit-chapter', 'add-sections', 'reorder-sections', 'analyze-chapter'],
            'section-detail': ['edit-section', 'add-content', 'create-quiz', 'analyze-section'],
            analytics: ['view-analytics', 'export-data', 'compare-metrics'],
            // Learning routes
            learning: ['view-content', 'take-quiz', 'track-progress', 'ask-questions'],
            'course-learning': ['course-overview', 'view-progress', 'start-learning', 'ask-questions'],
            'chapter-learning': ['view-content', 'take-quiz', 'track-progress', 'ask-questions', 'concept-explanation'],
            'section-learning': ['view-section', 'complete-activities', 'ask-questions', 'get-hints'],
            // Exam routes
            exam: ['take-exam', 'get-hints', 'review-answers'],
            'exam-results': ['view-results', 'review-answers', 'improvement-suggestions', 'retry-exam'],
            // General routes
            settings: ['update-preferences', 'manage-account'],
            other: ['general-help'],
        };
        const suggestedActionsMap = {
            // Dashboard routes
            dashboard: ['View your courses', 'Check analytics', 'Create a new course'],
            'user-dashboard': ['Continue learning', 'View recommendations', 'Check progress', 'Set goals'],
            'admin-dashboard': ['Manage users', 'View platform analytics', 'System settings'],
            'teacher-dashboard': ['Create a course', 'View student progress', 'Check analytics'],
            'user-analytics': ['View learning insights', 'Track goal progress', 'Identify strengths'],
            // Course management routes
            'courses-list': ['Create a course', 'Analyze course performance', 'Filter by category'],
            'course-detail': ['Add chapters', 'Generate course content', 'Analyze structure'],
            'course-create': ['Generate blueprint', 'Set learning objectives', 'Define target audience'],
            'chapter-detail': ['Add sections', 'Create assessment', 'Reorder content'],
            'section-detail': ['Add video content', 'Create quiz', 'Analyze Bloom\'s level'],
            analytics: ['View detailed reports', 'Compare courses', 'Export data'],
            // Learning routes
            learning: ['Continue learning', 'Take a quiz', 'Ask a question'],
            'course-learning': ['Start first chapter', 'View syllabus', 'Ask about the course'],
            'chapter-learning': ['Continue to next section', 'Ask about concepts', 'Take practice quiz'],
            'section-learning': ['Complete activities', 'Ask for clarification', 'Get hints'],
            // Exam routes
            exam: ['Start exam', 'Review material first'],
            'exam-results': ['Review answers', 'Get improvement tips', 'Retry exam', 'Continue learning'],
            // General routes
            settings: ['Update preferences', 'Change notification settings'],
            other: ['How can I help you?'],
        };
        return {
            pageType,
            entityType: entityTypeMap[pageType],
            entityId: entityId ?? null,
            capabilities: capabilitiesMap[pageType] ?? [],
            userIntent: null,
            suggestedActions: suggestedActionsMap[pageType] ?? [],
        };
    }
    async analyzeQuery(query) {
        const lowerQuery = query.toLowerCase().trim();
        // Determine intent
        const intent = this.detectIntent(lowerQuery);
        // Extract keywords
        const keywords = this.extractKeywords(lowerQuery);
        // Extract entities (course names, chapter references, etc.)
        const entities = this.extractEntities(lowerQuery);
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(lowerQuery);
        // Determine complexity
        const complexity = this.determineComplexity(query);
        return {
            intent,
            entities,
            keywords,
            sentiment,
            complexity,
        };
    }
    detectIntent(query) {
        // Question patterns
        if (/^(what|how|why|when|where|who|which|can|could|would|should|is|are|do|does)\b/i.test(query)) {
            return 'question';
        }
        // Generation patterns - MUST come before command patterns!
        // These words indicate user wants AI to create content
        if (/\b(generate|create|write|draft|compose|produce|make me|build|develop)\b/i.test(query)) {
            return 'generation';
        }
        // Analysis patterns
        if (/\b(analyze|analysis|review|check|evaluate|assess|examine)\b/i.test(query)) {
            return 'analysis';
        }
        // Command patterns - non-generative actions
        if (/^(add|remove|delete|update|edit|change|set|move|copy|rename)\b/i.test(query)) {
            return 'command';
        }
        // Help patterns
        if (/\b(help|assist|support|guide|explain|show me)\b/i.test(query)) {
            return 'help';
        }
        // Navigation patterns
        if (/\b(go to|navigate|open|show|take me|find)\b/i.test(query)) {
            return 'navigation';
        }
        // Feedback patterns
        if (/\b(good|bad|great|terrible|love|hate|like|dislike|thanks|thank you)\b/i.test(query)) {
            return 'feedback';
        }
        return 'unknown';
    }
    extractKeywords(query) {
        // Remove common stop words
        const stopWords = new Set([
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
            'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
            'before', 'after', 'above', 'below', 'between', 'under', 'again',
            'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
            'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
            'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this',
            'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'i', 'me',
            'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she',
            'her', 'it', 'its', 'they', 'them', 'their', 'please', 'help', 'want',
        ]);
        const words = query
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((word) => word.length > 2 && !stopWords.has(word));
        return [...new Set(words)];
    }
    extractEntities(query) {
        const entities = [];
        // Look for quoted strings
        const quotedMatches = query.match(/"([^"]+)"/g);
        if (quotedMatches) {
            entities.push(...quotedMatches.map((m) => m.replace(/"/g, '')));
        }
        // Look for capitalized words (potential proper nouns)
        const capitalizedMatches = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g);
        if (capitalizedMatches) {
            entities.push(...capitalizedMatches);
        }
        return [...new Set(entities)];
    }
    analyzeSentiment(query) {
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'thanks', 'helpful', 'perfect'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong', 'error', 'problem', 'issue', 'broken', 'failed'];
        let score = 0;
        for (const word of positiveWords) {
            if (query.includes(word))
                score++;
        }
        for (const word of negativeWords) {
            if (query.includes(word))
                score--;
        }
        if (score > 0)
            return 'positive';
        if (score < 0)
            return 'negative';
        return 'neutral';
    }
    determineComplexity(query) {
        const wordCount = query.split(/\s+/).length;
        const hasMultipleClauses = /\b(and|or|but|because|if|when|while)\b/i.test(query);
        const hasNestedStructure = query.includes('(') || query.includes('[');
        if (wordCount > 30 || (hasMultipleClauses && wordCount > 15) || hasNestedStructure) {
            return 'complex';
        }
        if (wordCount > 10 || hasMultipleClauses) {
            return 'moderate';
        }
        return 'simple';
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createContextEngine(config) {
    return new ContextEngine(config);
}
//# sourceMappingURL=context.js.map