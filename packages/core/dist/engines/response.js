/**
 * @sam-ai/core - Response Engine
 * Generates final responses by aggregating all engine results
 */
import { BaseEngine } from './base';
// ============================================================================
// RESPONSE ENGINE
// ============================================================================
export class ResponseEngine extends BaseEngine {
    constructor(config) {
        super({
            config,
            name: 'response',
            version: '1.0.0',
            dependencies: ['context'], // At minimum, depends on context
            cacheEnabled: false, // Responses should be fresh
        });
    }
    async process(input) {
        const { context, query, previousResults } = input;
        // Get results from other engines
        const contextResult = this.getEngineResult(previousResults, 'context');
        const bloomsResult = this.getEngineResult(previousResults, 'blooms');
        // Determine if we need to call AI or can generate locally
        const needsAI = this.shouldUseAI(query, contextResult);
        let message;
        let aiConfidence = 0;
        if (needsAI && query) {
            const aiResponse = await this.generateAIResponse(query, context, contextResult, bloomsResult);
            message = aiResponse.content;
            aiConfidence = 0.9; // High confidence for AI responses
        }
        else {
            message = this.generateLocalResponse(context, contextResult, bloomsResult);
            aiConfidence = 0.7; // Moderate confidence for local responses
        }
        // Build suggestions
        const suggestions = this.buildSuggestions(contextResult, bloomsResult, query);
        // Build actions
        const actions = this.buildActions(context.page.type, contextResult);
        // Build insights
        const insights = this.buildInsights(previousResults ?? {});
        // Extract Bloom's analysis if available
        const blooms = bloomsResult?.analysis;
        // Calculate overall confidence
        const confidence = this.calculateConfidence(aiConfidence, previousResults ?? {});
        // Processing notes for debugging
        const processingNotes = this.generateProcessingNotes(previousResults ?? {});
        return {
            message,
            suggestions,
            actions,
            insights,
            blooms,
            confidence,
            processingNotes,
        };
    }
    getCacheKey(input) {
        return `response:${input.context.page.path}:${input.query ?? 'none'}`;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    getEngineResult(previousResults, engineName) {
        const result = previousResults?.[engineName];
        if (result?.success && result.data) {
            return result.data;
        }
        return undefined;
    }
    shouldUseAI(query, contextResult) {
        if (!query)
            return false;
        const intent = contextResult?.queryAnalysis?.intent;
        // Use AI for these intents that need intelligent responses
        const aiRequiredIntents = ['question', 'generation', 'analysis', 'command', 'help'];
        if (intent && aiRequiredIntents.includes(intent)) {
            return true;
        }
        // Use AI for complex queries
        if (contextResult?.queryAnalysis?.complexity === 'complex')
            return true;
        // Use AI for moderate complexity queries
        if (contextResult?.queryAnalysis?.complexity === 'moderate')
            return true;
        // Use AI for longer queries
        if (query.split(/\s+/).length > 5)
            return true;
        // Default to using AI for any meaningful query
        return query.trim().length > 10;
    }
    async generateAIResponse(query, context, contextResult, bloomsResult) {
        const systemPrompt = this.buildSystemPrompt(context, contextResult, bloomsResult);
        // Observable: Log what the LLM receives so we can diagnose context issues
        this.logger.info('[ResponseEngine] System prompt built:', {
            totalLength: systemPrompt.length,
            hasEntityContext: systemPrompt.includes('Database-Verified Information'),
            pageType: context.page.type,
        });
        try {
            const response = await this.callAI({
                systemPrompt,
                userMessage: query,
                temperature: 0.7,
                maxTokens: 1000,
            });
            return { content: response.content };
        }
        catch (error) {
            this.logger.error(`[ResponseEngine] AI call failed: ${error.message}`);
            return { content: this.generateFallbackResponse(query, contextResult) };
        }
    }
    buildSystemPrompt(context, contextResult, bloomsResult) {
        const personality = this.config.personality;
        const name = personality?.name ?? 'SAM';
        const tone = personality?.tone ?? 'friendly and professional';
        // Extract context from page metadata
        const metadata = context.page.metadata || {};
        const entitySummary = metadata.entitySummary;
        const formSummary = metadata.formSummary;
        const courseTitle = metadata.courseTitle;
        const memorySummary = metadata.memorySummary;
        const reviewSummary = metadata.reviewSummary;
        // ---- Section 1: Identity ----
        let prompt = `You are ${name}, an intelligent AI tutor assistant for an educational platform. Be ${tone}.\n`;
        // ---- Section 2: PAGE CONTEXT (highest priority — entity data at top) ----
        prompt += `\n## PAGE CONTEXT \u2014 VERIFIED DATA\n`;
        prompt += `You are currently on: ${context.page.type} page\n`;
        prompt += `Path: ${context.page.path}\n`;
        prompt += `User role: ${context.user.role}\n`;
        // Entity information — placed FIRST for maximum LLM attention
        const hasEntityData = entitySummary
            && entitySummary !== 'No specific entity context available.'
            && entitySummary.length > 0;
        if (hasEntityData) {
            prompt += `\n### Database-Verified Information\n${entitySummary}\n`;
        }
        else if (courseTitle) {
            prompt += `\nCourse: ${courseTitle}\n`;
        }
        // Form fields — part of page context
        if (context.form && Object.keys(context.form.fields).length > 0) {
            prompt += `\n### Form Fields (Current Page)\n`;
            for (const [fieldName, field] of Object.entries(context.form.fields)) {
                const currentValue = field.value
                    ? `"${String(field.value).substring(0, 200)}${String(field.value).length > 200 ? '...' : ''}"`
                    : '(empty)';
                const label = field.label || fieldName;
                prompt += `- ${label}: ${currentValue}\n`;
            }
        }
        else if (formSummary && formSummary !== 'No form data available on this page.') {
            prompt += `\n### Form Fields\n${formSummary}\n`;
        }
        // Critical instruction: prevent "I don't have access" responses
        if (hasEntityData) {
            prompt += `\nIMPORTANT: The information above comes directly from the database. When the user asks about their courses, chapters, or content, USE THIS DATA. Do NOT say "I don't have access to that information" \u2014 you DO have access, the data is above.\n`;
        }
        // ---- Section 3: Learning State (optional, only if data exists) ----
        const hasLearningState = memorySummary || reviewSummary || bloomsResult?.analysis;
        if (hasLearningState) {
            prompt += `\n## Learning State\n`;
            if (memorySummary) {
                prompt += `${memorySummary}\n`;
            }
            if (reviewSummary) {
                prompt += `\n### Review Schedule\n${reviewSummary}\n`;
            }
            if (bloomsResult?.analysis) {
                prompt += `\n### Bloom's Taxonomy\n`;
                prompt += `- Dominant Level: ${bloomsResult.analysis.dominantLevel}\n`;
                prompt += `- Cognitive Depth: ${bloomsResult.analysis.cognitiveDepth}%\n`;
                if (bloomsResult.analysis.balance !== 'well-balanced') {
                    prompt += `- Balance: ${bloomsResult.analysis.balance}\n`;
                }
                if (bloomsResult.recommendations?.length > 0) {
                    prompt += `- Suggestion: ${bloomsResult.recommendations[0]}\n`;
                }
            }
        }
        // Capabilities (brief)
        if (contextResult?.enrichedContext?.capabilities?.length) {
            prompt += `\nCapabilities: ${contextResult.enrichedContext.capabilities.join(', ')}\n`;
        }
        // ---- Section 4: Guidelines ----
        prompt += `\n## Response Guidelines\n`;
        prompt += `1. **USE THE ENTITY DATA ABOVE** \u2014 reference actual course/chapter/section details\n`;
        prompt += `2. For GENERATION requests: create content SPECIFIC to the current context\n`;
        prompt += `3. Be specific and actionable, use markdown formatting\n`;
        if (context.form && Object.keys(context.form.fields).length > 0) {
            prompt += `4. If generating form content, provide the content directly without preamble\n`;
        }
        return prompt;
    }
    generateLocalResponse(context, contextResult, bloomsResult) {
        const pageType = context.page.type;
        const name = this.config.personality?.name ?? 'SAM';
        const greeting = this.config.personality?.greeting ?? `Hi! I'm ${name}, your AI tutor.`;
        // Build contextual message
        let message = greeting + ' ';
        switch (pageType) {
            case 'dashboard':
                message += "Welcome back! I can help you manage your courses, view analytics, or create new content. What would you like to do?";
                break;
            case 'courses-list':
                message += "I can help you analyze your courses, create new ones, or find insights about your teaching. What interests you?";
                break;
            case 'course-detail':
                if (bloomsResult?.analysis) {
                    const { dominantLevel, cognitiveDepth, balance } = bloomsResult.analysis;
                    message += `This course primarily targets the ${dominantLevel} level with ${cognitiveDepth}% cognitive depth. `;
                    if (balance !== 'well-balanced') {
                        message += `The content is ${balance}. `;
                    }
                    if (bloomsResult.recommendations.length > 0) {
                        message += `Suggestion: ${bloomsResult.recommendations[0]}`;
                    }
                }
                else {
                    message += "I can help you improve this course structure, generate content, or analyze its effectiveness.";
                }
                break;
            case 'course-create':
                message += "Let's create an amazing course together! I can help you design the structure, set learning objectives, and generate content.";
                break;
            case 'chapter-detail':
                message += "I can help you develop this chapter with sections, assessments, or improved content.";
                break;
            case 'section-detail':
                message += "I can help enhance this section with better content, quizzes, or analyze its cognitive level.";
                break;
            case 'analytics':
                message += "I can help you understand your analytics and provide actionable insights for improvement.";
                break;
            case 'learning':
                message += "I'm here to help you learn! Ask me any questions about the material, or I can quiz you on the content.";
                break;
            case 'exam':
                message += "I can help you prepare for this assessment. Would you like hints or explanations?";
                break;
            default:
                message += "How can I assist you today?";
        }
        // Add suggested actions
        if (contextResult?.enrichedContext.suggestedActions.length) {
            const topActions = contextResult.enrichedContext.suggestedActions.slice(0, 3);
            message += `\n\nQuick actions: ${topActions.join(', ')}`;
        }
        return message;
    }
    generateFallbackResponse(_query, contextResult) {
        const intent = contextResult?.queryAnalysis?.intent ?? 'unknown';
        switch (intent) {
            case 'question':
                return "I understand you have a question. Let me help you with that. Could you provide more details about what you'd like to know?";
            case 'command':
                return "I'll help you with that action. Let me process your request.";
            case 'analysis':
                return "I can analyze that for you. Let me examine the content and provide insights.";
            case 'generation':
                return "I'd be happy to help generate content for you. What specific type of content would you like me to create?";
            case 'help':
                return "I'm here to help! You can ask me to analyze content, generate materials, or guide you through features.";
            default:
                return "I'm here to assist you. How can I help with your course or learning needs?";
        }
    }
    buildSuggestions(contextResult, bloomsResult, query) {
        const suggestions = [];
        let id = 0;
        // Add context-based suggestions
        if (contextResult?.enrichedContext.suggestedActions) {
            for (const action of contextResult.enrichedContext.suggestedActions.slice(0, 2)) {
                suggestions.push({
                    id: `sug_${id++}`,
                    label: action,
                    text: action,
                    type: 'quick-reply',
                });
            }
        }
        // Add Bloom's-based suggestions
        if (bloomsResult?.recommendations) {
            for (const rec of bloomsResult.recommendations.slice(0, 2)) {
                suggestions.push({
                    id: `sug_${id++}`,
                    label: rec.substring(0, 40) + (rec.length > 40 ? '...' : ''),
                    text: rec,
                    type: 'action',
                    priority: 1,
                });
            }
        }
        // Add follow-up suggestions if there was a query
        if (query) {
            suggestions.push({
                id: `sug_${id++}`,
                label: 'Tell me more',
                text: 'Can you elaborate on that?',
                type: 'quick-reply',
            });
        }
        return suggestions.slice(0, 5);
    }
    buildActions(pageType, _contextResult) {
        const actions = [];
        let id = 0;
        // Page-specific actions
        const pageActions = {
            'course-detail': [
                { id: `act_${id++}`, type: 'generate', label: 'Generate Chapters', payload: { type: 'chapters' } },
                { id: `act_${id++}`, type: 'analyze', label: 'Analyze Structure', payload: { type: 'blooms' } },
            ],
            'course-create': [
                { id: `act_${id++}`, type: 'generate', label: 'Generate Blueprint', payload: { type: 'blueprint' } },
            ],
            'chapter-detail': [
                { id: `act_${id++}`, type: 'generate', label: 'Generate Sections', payload: { type: 'sections' } },
                { id: `act_${id++}`, type: 'generate', label: 'Create Assessment', payload: { type: 'quiz' } },
            ],
            'section-detail': [
                { id: `act_${id++}`, type: 'analyze', label: "Analyze Bloom's Level", payload: { type: 'blooms' } },
                { id: `act_${id++}`, type: 'generate', label: 'Enhance Content', payload: { type: 'content' } },
            ],
        };
        if (pageActions[pageType]) {
            actions.push(...pageActions[pageType]);
        }
        return actions;
    }
    buildInsights(previousResults) {
        const insights = {};
        for (const [name, result] of Object.entries(previousResults)) {
            if (result.success && result.data) {
                // Extract key insights from each engine
                switch (name) {
                    case 'context':
                        const contextData = result.data;
                        insights.context = {
                            pageType: contextData.enrichedContext.pageType,
                            queryIntent: contextData.queryAnalysis?.intent,
                        };
                        break;
                    case 'blooms':
                        const bloomsData = result.data;
                        insights.blooms = {
                            dominantLevel: bloomsData.analysis.dominantLevel,
                            cognitiveDepth: bloomsData.analysis.cognitiveDepth,
                            balance: bloomsData.analysis.balance,
                            gaps: bloomsData.analysis.gaps,
                        };
                        break;
                    default:
                        insights[name] = result.data;
                }
            }
        }
        return insights;
    }
    calculateConfidence(aiConfidence, previousResults) {
        let totalConfidence = aiConfidence;
        let count = 1;
        for (const result of Object.values(previousResults)) {
            if (result.success) {
                totalConfidence += 1;
                count++;
            }
            else {
                totalConfidence += 0.5; // Partial confidence for failed engines
                count++;
            }
        }
        return Math.round((totalConfidence / count) * 100) / 100;
    }
    generateProcessingNotes(previousResults) {
        const notes = [];
        for (const [name, result] of Object.entries(previousResults)) {
            if (result.success) {
                notes.push(`${name}: completed in ${result.metadata.executionTime}ms${result.metadata.cached ? ' (cached)' : ''}`);
            }
            else {
                notes.push(`${name}: failed - ${result.error?.message ?? 'unknown error'}`);
            }
        }
        return notes;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createResponseEngine(config) {
    return new ResponseEngine(config);
}
//# sourceMappingURL=response.js.map