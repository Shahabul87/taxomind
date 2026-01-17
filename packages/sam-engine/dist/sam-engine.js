/**
 * SAM Engine Core
 * Main orchestrator for the SAM AI Assistant
 *
 * @deprecated This package is DEPRECATED in favor of the new @sam-ai/* packages.
 *
 * Migration Guide:
 * - Goal Planning & Tool Execution: Use `@sam-ai/agentic`
 * - Orchestration & AI Adapters: Use `@sam-ai/core`
 * - Educational Engines: Use `@sam-ai/educational`
 * - Memory & Mastery: Use `@sam-ai/memory`
 * - Pedagogy (Bloom's, ZPD): Use `@sam-ai/pedagogy`
 * - React Hooks: Use `@sam-ai/react`
 * - API Routes: Use `@sam-ai/api`
 *
 * Integration in Taxomind:
 * - All stores are centralized in `lib/sam/taxomind-context.ts`
 * - Use `getTaxomindContext()` or `getStore()` for store access
 * - See `codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md` for details
 *
 * This package contains placeholder AI providers and will NOT be maintained.
 * The new @sam-ai/* packages provide full production implementations.
 *
 * @version 1.0.0 (DEPRECATED - DO NOT USE IN NEW CODE)
 */
import { BaseEngine } from './base-engine';
/**
 * @deprecated Use @sam-ai/agentic and @sam-ai/core instead.
 * This class will be removed in a future version.
 */
export class SAMEngine extends BaseEngine {
    name = 'SAMEngine';
    conversations = new Map();
    plugins = new Map();
    eventHandlers = new Map();
    featureFlags = {};
    aiProvider = null;
    constructor(config = {}) {
        super(config);
        this.featureFlags = this.extractFeatureFlags(config);
        // Deprecation warning
        console.warn('[SAMEngine] DEPRECATED: This package is deprecated. ' +
            'Please migrate to @sam-ai/agentic and @sam-ai/core. ' +
            'See lib/sam/taxomind-context.ts for the new integration pattern.');
    }
    /**
     * Initialize SAM Engine
     */
    async performInitialization() {
        // Initialize AI provider
        this.aiProvider = await this.initializeAIProvider();
        // Load conversations from storage if available
        if (this.storage) {
            await this.loadConversations();
        }
        // Emit initialization event
        await this.emit('engine.initialized', {
            name: this.name,
            features: this.featureFlags
        });
    }
    /**
     * Process a message with context
     */
    async process(context, message) {
        try {
            // Check rate limiting
            const rateLimitKey = `user:${context.user.id}`;
            const allowed = await this.checkRateLimit(rateLimitKey, this.config.rateLimitPerMinute || 60);
            if (!allowed) {
                return {
                    message: 'Rate limit exceeded. Please wait a moment before sending another message.',
                    error: 'RATE_LIMIT_EXCEEDED'
                };
            }
            // Get or create conversation
            const conversation = await this.getOrCreateConversation(context.user.id, context);
            // Add user message
            const userMessage = {
                role: 'user',
                content: this.sanitizeString(message, 2000),
                timestamp: new Date()
            };
            conversation.messages.push(userMessage);
            // Process through plugins
            let pluginResponses = [];
            for (const [name, plugin] of this.plugins) {
                if (plugin.process) {
                    try {
                        const response = await plugin.process(context, message);
                        if (response) {
                            pluginResponses.push({ plugin: name, response });
                        }
                    }
                    catch (error) {
                        this.logger.error(`Plugin ${name} failed`, error);
                    }
                }
            }
            // Generate AI response
            const response = await this.generateResponse(conversation, context, pluginResponses);
            // Add assistant message to conversation
            const assistantMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                metadata: {
                    suggestions: response.suggestions,
                    contextInsights: response.contextInsights
                }
            };
            conversation.messages.push(assistantMessage);
            // Save conversation
            await this.saveConversation(conversation);
            // Emit message event
            await this.emit('message.received', {
                userId: context.user.id,
                message: response.message,
                context
            });
            return response;
        }
        catch (error) {
            this.logger.error('Error processing message', error);
            await this.emit('error.occurred', {
                error: error.message,
                context
            });
            return {
                message: 'I encountered an error while processing your request. Please try again.',
                error: error.message
            };
        }
    }
    /**
     * Generate AI response
     */
    async generateResponse(conversation, context, pluginResponses) {
        if (!this.aiProvider) {
            return this.generateFallbackResponse(context);
        }
        const prompt = this.buildPrompt(conversation, context, pluginResponses);
        try {
            const aiResponse = await this.aiProvider.complete(prompt);
            return this.parseAIResponse(aiResponse, context);
        }
        catch (error) {
            this.logger.error('AI provider error', error);
            return this.generateFallbackResponse(context);
        }
    }
    /**
     * Build AI prompt
     */
    buildPrompt(conversation, context, pluginResponses) {
        const personality = `You are SAM (Smart Adaptive Mentor), an advanced AI educational assistant.
Your expertise includes learning science, instructional design, curriculum development, and educational technology.
You are encouraging, practical, contextually aware, and solution-focused.`;
        const contextInfo = this.formatContext(context);
        const conversationHistory = this.formatConversationHistory(conversation);
        const pluginInfo = this.formatPluginResponses(pluginResponses);
        return `${personality}

${contextInfo}

${conversationHistory}

${pluginInfo}

User Message: "${conversation.messages[conversation.messages.length - 1].content}"

Provide a helpful response in JSON format:
{
  "message": "Your response",
  "suggestions": ["suggestion1", "suggestion2"],
  "contextInsights": {
    "observation": "What you observe",
    "recommendation": "Your recommendation"
  }
}`;
    }
    /**
     * Format context for prompt
     */
    formatContext(context) {
        const parts = ['CONTEXT:'];
        if (context.user) {
            parts.push(`- User Type: ${context.user.isTeacher ? 'Teacher/Instructor' : 'Student/Learner'}`);
            parts.push(`- User ID: ${context.user.id}`);
        }
        if (context.courseId) {
            parts.push(`- Course ID: ${context.courseId}`);
        }
        if (context.pageType) {
            parts.push(`- Page Type: ${context.pageType}`);
        }
        if (context.entityType) {
            parts.push(`- Entity Type: ${context.entityType}`);
        }
        return parts.join('\n');
    }
    /**
     * Format conversation history
     */
    formatConversationHistory(conversation) {
        const recentMessages = conversation.messages.slice(-5, -1); // Last 5 messages except current
        if (recentMessages.length === 0) {
            return 'CONVERSATION: New conversation';
        }
        const history = recentMessages.map(msg => `${msg.role.toUpperCase()}: ${msg.content.slice(0, 200)}`).join('\n');
        return `RECENT CONVERSATION:\n${history}`;
    }
    /**
     * Format plugin responses
     */
    formatPluginResponses(responses) {
        if (responses.length === 0) {
            return '';
        }
        const formatted = responses.map(r => `${r.plugin}: ${JSON.stringify(r.response).slice(0, 200)}`).join('\n');
        return `PLUGIN INSIGHTS:\n${formatted}`;
    }
    /**
     * Parse AI response
     */
    parseAIResponse(response, context) {
        try {
            const parsed = JSON.parse(response);
            return {
                message: parsed.message || response,
                suggestions: parsed.suggestions || this.generateDefaultSuggestions(context),
                contextInsights: parsed.contextInsights
            };
        }
        catch {
            return {
                message: response,
                suggestions: this.generateDefaultSuggestions(context)
            };
        }
    }
    /**
     * Generate fallback response
     */
    generateFallbackResponse(context) {
        const isTeacher = context.user.isTeacher;
        let message = "I'm here to help! ";
        if (isTeacher) {
            message += "As an educator, I can assist with course creation, content development, student engagement strategies, and assessment design.";
        }
        else {
            message += "I can help you with learning strategies, understanding concepts, and making the most of your educational journey.";
        }
        return {
            message,
            suggestions: this.generateDefaultSuggestions(context)
        };
    }
    /**
     * Generate default suggestions
     */
    generateDefaultSuggestions(context) {
        const { pageType, user } = context;
        if (pageType === 'course-edit' && user.isTeacher) {
            return [
                'Help me improve this course structure',
                'Suggest engagement strategies',
                'Review learning objectives',
                'Generate assessment ideas'
            ];
        }
        if (pageType === 'learning' && !user.isTeacher) {
            return [
                'Explain this concept differently',
                'Give me practice problems',
                'Check my understanding',
                'Suggest study strategies'
            ];
        }
        return [
            'Help me get started',
            'Show me best practices',
            'Explain how this works',
            'What should I do next?'
        ];
    }
    /**
     * Get or create conversation
     */
    async getOrCreateConversation(userId, context) {
        const conversationId = `${userId}-${context.courseId || 'global'}`;
        let conversation = this.conversations.get(conversationId);
        if (!conversation) {
            conversation = {
                id: conversationId,
                userId,
                messages: [],
                context,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.conversations.set(conversationId, conversation);
        }
        conversation.updatedAt = new Date();
        return conversation;
    }
    /**
     * Save conversation to storage
     */
    async saveConversation(conversation) {
        if (!this.storage)
            return;
        try {
            await this.storage.set(`conversation:${conversation.id}`, conversation, 86400 // 24 hours
            );
        }
        catch (error) {
            this.logger.error('Failed to save conversation', error);
        }
    }
    /**
     * Load conversations from storage
     */
    async loadConversations() {
        // Implementation depends on storage capability to list keys
        // For now, conversations will be loaded on-demand
    }
    /**
     * Register a plugin
     */
    async registerPlugin(plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} already registered`);
        }
        if (plugin.initialize) {
            await plugin.initialize(this.config);
        }
        this.plugins.set(plugin.name, plugin);
        this.logger.info(`Plugin ${plugin.name} registered`);
    }
    /**
     * Unregister a plugin
     */
    async unregisterPlugin(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found`);
        }
        if (plugin.destroy) {
            await plugin.destroy();
        }
        this.plugins.delete(name);
        this.logger.info(`Plugin ${name} unregistered`);
    }
    /**
     * Event emitter
     */
    async emit(type, data) {
        const event = {
            type,
            timestamp: new Date(),
            data
        };
        const handlers = this.eventHandlers.get(type);
        if (!handlers)
            return;
        for (const handler of handlers) {
            try {
                await handler(event);
            }
            catch (error) {
                this.logger.error(`Event handler error for ${type}`, error);
            }
        }
    }
    /**
     * Event listener
     */
    on(type, handler) {
        if (!this.eventHandlers.has(type)) {
            this.eventHandlers.set(type, new Set());
        }
        this.eventHandlers.get(type).add(handler);
    }
    /**
     * Remove event listener
     */
    off(type, handler) {
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    /**
     * Get conversation history
     */
    async getConversationHistory(userId, courseId) {
        const conversationId = `${userId}-${courseId || 'global'}`;
        const conversation = this.conversations.get(conversationId);
        if (!conversation && this.storage) {
            const stored = await this.storage.get(`conversation:${conversationId}`);
            if (stored) {
                return stored.messages || [];
            }
        }
        return conversation?.messages || [];
    }
    /**
     * Clear conversation
     */
    async clearConversation(userId, courseId) {
        const conversationId = `${userId}-${courseId || 'global'}`;
        this.conversations.delete(conversationId);
        if (this.storage) {
            await this.storage.delete(`conversation:${conversationId}`);
        }
    }
    /**
     * Extract feature flags from config
     */
    extractFeatureFlags(config) {
        // Use config to extract any feature flags if provided
        const customFlags = config;
        return {
            enableMarketAnalysis: customFlags.enableMarketAnalysis !== false,
            enableBloomsTracking: customFlags.enableBloomsTracking !== false,
            enableAdaptiveLearning: customFlags.enableAdaptiveLearning !== false,
            enableCourseGuide: customFlags.enableCourseGuide !== false,
            enableTrendsAnalysis: customFlags.enableTrendsAnalysis === true,
            enableNewsIntegration: customFlags.enableNewsIntegration === true,
            enableResearchAccess: customFlags.enableResearchAccess === true,
            enableGamification: customFlags.enableGamification !== false,
            enableCollaboration: customFlags.enableCollaboration !== false,
            enablePredictiveAnalytics: customFlags.enablePredictiveAnalytics !== false
        };
    }
    /**
     * Initialize AI Provider
     */
    async initializeAIProvider() {
        const provider = this.config.provider || 'anthropic';
        const apiKey = this.config.apiKey;
        if (!apiKey) {
            this.logger.warn('No API key provided, AI features will be limited');
            return null;
        }
        switch (provider) {
            case 'anthropic':
                return new AnthropicProvider(apiKey, this.config);
            case 'openai':
                return new OpenAIProvider(apiKey, this.config);
            case 'custom':
                return new CustomProvider(this.config);
            default:
                this.logger.warn(`Unknown provider: ${provider}`);
                return null;
        }
    }
    /**
     * Destroy engine and cleanup
     */
    async destroy() {
        // Unregister all plugins
        for (const [pluginName, plugin] of this.plugins) {
            if (plugin.destroy) {
                this.logger.debug(`Destroying plugin: ${pluginName}`);
                await plugin.destroy();
            }
        }
        this.plugins.clear();
        // Clear conversations
        this.conversations.clear();
        // Clear event handlers
        this.eventHandlers.clear();
        // Emit destruction event
        await this.emit('engine.destroyed', { name: this.name });
        await super.destroy();
    }
}
/**
 * Anthropic Provider
 */
class AnthropicProvider {
    apiKeyValue;
    configValue;
    constructor(apiKey, config) {
        this.apiKeyValue = apiKey;
        this.configValue = config;
    }
    async complete(prompt) {
        // Implementation would use Anthropic SDK with this.apiKeyValue and this.configValue
        // This is a placeholder - log prompt length for debugging
        console.debug(`[AnthropicProvider] Processing prompt (${prompt.length} chars) with model: ${this.configValue.model || 'default'}`);
        return JSON.stringify({
            message: "This is a placeholder response. Implement Anthropic SDK integration.",
            suggestions: ["Install @anthropic-ai/sdk", "Configure API key"],
            contextInsights: null,
            apiKeyConfigured: !!this.apiKeyValue
        });
    }
}
/**
 * OpenAI Provider
 */
class OpenAIProvider {
    apiKeyValue;
    configValue;
    constructor(apiKey, config) {
        this.apiKeyValue = apiKey;
        this.configValue = config;
    }
    async complete(prompt) {
        // Implementation would use OpenAI SDK with this.apiKeyValue and this.configValue
        // This is a placeholder - log prompt length for debugging
        console.debug(`[OpenAIProvider] Processing prompt (${prompt.length} chars) with model: ${this.configValue.model || 'default'}`);
        return JSON.stringify({
            message: "This is a placeholder response. Implement OpenAI SDK integration.",
            suggestions: ["Install openai package", "Configure API key"],
            contextInsights: null,
            apiKeyConfigured: !!this.apiKeyValue
        });
    }
}
/**
 * Custom Provider
 */
class CustomProvider {
    configValue;
    constructor(config) {
        this.configValue = config;
    }
    async complete(prompt) {
        // Implementation would call custom endpoint using this.configValue.baseUrl
        // This is a placeholder - log prompt length for debugging
        console.debug(`[CustomProvider] Processing prompt (${prompt.length} chars) to: ${this.configValue.baseUrl || 'not configured'}`);
        return JSON.stringify({
            message: "This is a placeholder response. Implement custom provider.",
            suggestions: ["Configure base URL", "Set up authentication"],
            contextInsights: null,
            baseUrl: this.configValue.baseUrl
        });
    }
}
//# sourceMappingURL=sam-engine.js.map