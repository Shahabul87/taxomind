/**
 * @sam-ai/educational - Memory Engine
 * Conversation context management, memory enrichment, and personalized context generation
 */
/**
 * MemoryEngine - Manages conversation context, memory enrichment, and personalized learning
 *
 * Features:
 * - Conversation initialization and resumption
 * - Message storage with memory enrichment
 * - Personalized context generation
 * - Contextual prompt generation for AI
 * - Conversation summaries
 * - Memory caching and relevance scoring
 * - User pattern analysis
 */
export class MemoryEngine {
    config;
    context;
    database;
    memoryCache = new Map();
    constructor(context, config) {
        this.config = config;
        this.context = context;
        this.database = config.database;
    }
    /**
     * Initialize or resume a conversation
     */
    async initializeConversation(options) {
        if (!this.database) {
            throw new Error('Database adapter is required for memory operations');
        }
        let conversationId;
        if (options?.resumeLastConversation) {
            // Try to find recent active conversation
            const recentConversations = await this.database.getConversations(this.context.userId, {
                courseId: this.context.courseId,
                chapterId: this.context.chapterId,
                limit: 1,
            });
            if (recentConversations.length > 0) {
                const lastConversation = recentConversations[0];
                const lastMessage = lastConversation.messages && lastConversation.messages.length > 0
                    ? lastConversation.messages[lastConversation.messages.length - 1]
                    : undefined;
                const lastActivityAt = lastMessage
                    ? lastMessage.createdAt
                    : lastConversation.startedAt ?? lastConversation.createdAt;
                const timeSinceLastMessage = Date.now() - new Date(lastActivityAt).getTime();
                const hoursSinceLastMessage = timeSinceLastMessage / (1000 * 60 * 60);
                // Resume if less than 24 hours old
                if (hoursSinceLastMessage < 24) {
                    conversationId = lastConversation.id;
                    this.context.currentConversationId = conversationId;
                    return conversationId;
                }
            }
        }
        // Create new conversation
        conversationId = await this.database.createConversation(this.context.userId, {
            courseId: this.context.courseId,
            chapterId: this.context.chapterId,
            sectionId: this.context.sectionId,
            title: this.generateConversationTitle(options?.contextHint),
        });
        this.context.currentConversationId = conversationId;
        // Add initial context message
        await this.addContextualWelcomeMessage(conversationId);
        return conversationId;
    }
    /**
     * Add a message with memory enrichment
     */
    async addMessageWithMemory(role, content, metadata) {
        if (!this.database) {
            throw new Error('Database adapter is required for memory operations');
        }
        if (!this.context.currentConversationId) {
            await this.initializeConversation();
        }
        // Enrich message with memory context
        const enrichedMetadata = await this.enrichMessageWithMemory(content, metadata);
        // Add message
        await this.database.addMessage(this.context.currentConversationId, {
            role,
            content,
            metadata: enrichedMetadata,
        });
        // Update memory based on message
        await this.updateMemoryFromMessage(role, content, enrichedMetadata);
        // Generate message ID
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return messageId;
    }
    /**
     * Get conversation history with context
     */
    async getConversationHistory(options) {
        if (!this.database) {
            return { messages: [] };
        }
        if (!this.context.currentConversationId) {
            return { messages: [] };
        }
        // Get conversation messages
        const conversation = await this.database.getConversation(this.context.currentConversationId);
        if (!conversation) {
            return { messages: [] };
        }
        const messages = conversation.messages.reverse().map((msg) => ({
            id: msg.id,
            role: msg.messageType,
            content: msg.content,
            timestamp: msg.createdAt,
            metadata: msg.metadata,
        }));
        let context;
        let relevantMemories;
        if (options?.includeContext) {
            context = await this.getPersonalizedContext();
            relevantMemories = await this.getRelevantMemories(conversation.messages
                .slice(-5)
                .map((m) => m.content)
                .join(' '), options.relevanceThreshold || 0.5);
        }
        return {
            messages,
            context,
            relevantMemories,
        };
    }
    /**
     * Get personalized context for user
     */
    async getPersonalizedContext() {
        if (!this.database) {
            return this.getDefaultContext();
        }
        try {
            // Get learning profile
            const learningProfile = await this.database.getLearningProfile(this.context.userId, this.context.courseId);
            // Get recent conversations for topics
            const recentConversations = await this.database.getConversations(this.context.userId, {
                courseId: this.context.courseId,
                limit: 10,
            });
            // Extract topics from recent conversations
            const recentTopics = this.extractTopicsFromConversations(recentConversations);
            // Get ongoing projects
            const ongoingProjects = await this.getOngoingProjects();
            // Analyze patterns from interactions
            const patterns = await this.analyzeUserPatterns();
            return {
                userPreferences: {
                    learningStyle: learningProfile?.learningStyle || 'adaptive',
                    preferredTone: learningProfile?.preferredTone || 'encouraging',
                    contentFormat: learningProfile?.preferences?.formats || [
                        'text',
                        'visual',
                    ],
                    difficulty: learningProfile?.preferences?.difficulty || 'medium',
                },
                recentTopics,
                ongoingProjects,
                commonChallenges: patterns.challenges,
                successPatterns: patterns.successes,
                currentGoals: patterns.goals,
            };
        }
        catch {
            return this.getDefaultContext();
        }
    }
    /**
     * Generate contextual prompt for AI
     */
    async generateContextualPrompt(userMessage) {
        try {
            const context = await this.getPersonalizedContext();
            const relevantMemories = await this.getRelevantMemories(userMessage);
            const conversationHistory = await this.getConversationHistory({
                messageLimit: 10,
            });
            const contextPrompt = `
# SAM AI Assistant Context

## User Profile
- Learning Style: ${context.userPreferences.learningStyle}
- Preferred Tone: ${context.userPreferences.preferredTone}
- Content Format: ${context.userPreferences.contentFormat.join(', ')}
- Difficulty Level: ${context.userPreferences.difficulty}

## Current Context
- Course: ${this.context.courseId || 'General'}
- Chapter: ${this.context.chapterId || 'N/A'}
- Section: ${this.context.sectionId || 'N/A'}

## Recent Topics
${context.recentTopics
                .slice(0, 5)
                .map((topic) => `- ${topic}`)
                .join('\n')}

## Ongoing Projects
${context.ongoingProjects
                .slice(0, 3)
                .map((project) => `- ${project.type}: ${project.title} (${project.progress}% complete)`)
                .join('\n')}

## Common Challenges
${context.commonChallenges
                .slice(0, 3)
                .map((challenge) => `- ${challenge}`)
                .join('\n')}

## Success Patterns
${context.successPatterns
                .slice(0, 3)
                .map((pattern) => `- ${pattern}`)
                .join('\n')}

## Relevant Past Interactions
${relevantMemories
                .slice(0, 3)
                .map((memory) => `- ${memory.timestamp.toDateString()}: ${memory.content}`)
                .join('\n')}

## Recent Conversation History
${conversationHistory.messages
                .slice(-5)
                .map((msg) => `${msg.role}: ${msg.content}`)
                .join('\n')}

## Current User Message
${userMessage}

Based on this context, provide a helpful, personalized response that:
1. Acknowledges the user's learning style and preferences
2. References relevant past interactions when appropriate
3. Considers ongoing projects and current context
4. Uses the preferred tone and content format
5. Provides actionable advice tailored to their experience level
`;
            return contextPrompt;
        }
        catch {
            return userMessage;
        }
    }
    /**
     * Get conversation summaries
     */
    async getConversationSummaries(limit = 20) {
        if (!this.database) {
            return [];
        }
        try {
            const conversations = await this.database.getConversations(this.context.userId, {
                courseId: this.context.courseId,
                limit,
            });
            return conversations.map((conv) => {
                const lastMsg = conv.messages?.[conv.messages.length - 1];
                return {
                    id: conv.id,
                    title: conv.title || 'SAM Session',
                    startTime: conv.startedAt || conv.createdAt,
                    lastActivity: lastMsg
                        ? lastMsg.createdAt
                        : conv.startedAt || conv.createdAt,
                    messageCount: conv.messages?.length || 0,
                    topics: this.extractTopicsFromMessages(conv.messages || []),
                    userGoals: this.extractGoalsFromMessages(conv.messages || []),
                    keyInsights: this.extractInsightsFromMessages(conv.messages || []),
                    assistanceProvided: this.extractAssistanceFromMessages(conv.messages || []),
                };
            });
        }
        catch {
            return [];
        }
    }
    // Private helper methods
    getDefaultContext() {
        return {
            userPreferences: {
                learningStyle: 'adaptive',
                preferredTone: 'encouraging',
                contentFormat: ['text'],
                difficulty: 'medium',
            },
            recentTopics: [],
            ongoingProjects: [],
            commonChallenges: [],
            successPatterns: [],
            currentGoals: [],
        };
    }
    generateConversationTitle(contextHint) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
        if (contextHint) {
            return `${contextHint} - ${timeString}`;
        }
        if (this.context.sectionId) {
            return `Section Work - ${timeString}`;
        }
        if (this.context.chapterId) {
            return `Chapter Development - ${timeString}`;
        }
        if (this.context.courseId) {
            return `Course Creation - ${timeString}`;
        }
        return `SAM Session - ${timeString}`;
    }
    async addContextualWelcomeMessage(conversationId) {
        if (!this.database)
            return;
        const context = await this.getPersonalizedContext();
        let welcomeMessage = "Hello! I'm SAM, your AI learning assistant. ";
        if (context.ongoingProjects.length > 0) {
            const currentProject = context.ongoingProjects[0];
            welcomeMessage += `I see you're working on "${currentProject.title}". `;
        }
        if (context.recentTopics.length > 0) {
            welcomeMessage += `Based on our recent discussions about ${context.recentTopics.slice(0, 2).join(' and ')}, `;
        }
        welcomeMessage +=
            "I'm here to help you create amazing content and achieve your learning goals. What can I assist you with today?";
        await this.database.addMessage(conversationId, {
            role: 'SAM',
            content: welcomeMessage,
            metadata: { type: 'welcome', contextual: true },
        });
    }
    async enrichMessageWithMemory(content, metadata) {
        const relevantMemories = await this.getRelevantMemories(content, 0.3);
        return {
            ...metadata,
            memoryContext: {
                relevantMemories: relevantMemories.slice(0, 3),
                timestamp: new Date().toISOString(),
                sessionId: this.context.sessionId,
            },
        };
    }
    async updateMemoryFromMessage(role, content, metadata) {
        if (!this.database)
            return;
        // Extract learning insights from the message
        if (role === 'USER') {
            // Analyze user message for preferences and patterns
            await this.updateUserPreferencesFromMessage(content);
        }
        else if (role === 'SAM' || role === 'ASSISTANT') {
            // Track assistance provided
            await this.trackAssistanceProvided(content, metadata);
        }
    }
    async getRelevantMemories(query, threshold = 0.5) {
        if (!this.database)
            return [];
        const userId = this.context.userId;
        const cacheKey = `${userId}-memories`;
        if (!this.memoryCache.has(cacheKey)) {
            // Load recent interactions as memories
            const interactions = await this.database.getInteractions(userId, {
                limit: 100,
            });
            const memories = interactions.map((interaction) => ({
                id: interaction.id,
                timestamp: interaction.createdAt,
                type: 'interaction',
                content: JSON.stringify(interaction.context),
                metadata: {},
                relevanceScore: 0,
            }));
            this.memoryCache.set(cacheKey, memories);
        }
        const memories = this.memoryCache.get(cacheKey) || [];
        // Simple keyword-based relevance scoring
        const queryWords = query.toLowerCase().split(' ');
        return memories
            .map((memory) => ({
            ...memory,
            relevanceScore: this.calculateRelevanceScore(memory.content, queryWords),
        }))
            .filter((memory) => memory.relevanceScore >= threshold)
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    calculateRelevanceScore(content, queryWords) {
        const contentLower = content.toLowerCase();
        let score = 0;
        queryWords.forEach((word) => {
            if (word.length > 2 && contentLower.includes(word)) {
                score += 1;
            }
        });
        return queryWords.length > 0 ? score / queryWords.length : 0;
    }
    extractTopicsFromConversations(conversations) {
        const topics = [];
        conversations.forEach((conv) => {
            if (conv.title && conv.title !== 'Untitled Conversation') {
                topics.push(conv.title);
            }
            // Extract topics from message content
            conv.messages?.forEach((msg) => {
                if (msg.role === 'USER') {
                    const content = msg.content.toLowerCase();
                    if (content.includes('course'))
                        topics.push('Course Creation');
                    if (content.includes('chapter'))
                        topics.push('Chapter Development');
                    if (content.includes('content'))
                        topics.push('Content Writing');
                    if (content.includes('exam') || content.includes('quiz'))
                        topics.push('Assessment');
                }
            });
        });
        return [...new Set(topics)];
    }
    extractTopicsFromMessages(messages) {
        return messages
            .filter((msg) => msg.role === 'USER')
            .map((msg) => this.extractMainTopic(msg.content))
            .filter(Boolean);
    }
    extractGoalsFromMessages(messages) {
        return messages
            .filter((msg) => msg.content.toLowerCase().includes('goal') ||
            msg.content.toLowerCase().includes('want to') ||
            msg.content.toLowerCase().includes('trying to'))
            .map((msg) => this.extractGoal(msg.content))
            .filter(Boolean);
    }
    extractInsightsFromMessages(messages) {
        return messages
            .filter((msg) => msg.role === 'ASSISTANT')
            .map((msg) => this.extractInsight(msg.content))
            .filter(Boolean);
    }
    extractAssistanceFromMessages(messages) {
        return messages
            .filter((msg) => msg.role === 'ASSISTANT')
            .map((msg) => this.extractAssistanceType(msg.content))
            .filter(Boolean);
    }
    extractMainTopic(content) {
        if (content.includes('course'))
            return 'Course Creation';
        if (content.includes('chapter'))
            return 'Chapter Development';
        if (content.includes('section'))
            return 'Section Writing';
        if (content.includes('exam') || content.includes('quiz'))
            return 'Assessment';
        if (content.includes('content'))
            return 'Content Writing';
        return 'General Discussion';
    }
    extractGoal(content) {
        const goalMatch = content.match(/(?:want to|trying to|goal.*?is to)\s+(.+?)(?:\.|$)/i);
        return goalMatch ? goalMatch[1].trim() : '';
    }
    extractInsight(content) {
        if (content.includes('recommendation') || content.includes('suggest')) {
            return content.substring(0, 100) + '...';
        }
        return '';
    }
    extractAssistanceType(content) {
        if (content.includes('content generated'))
            return 'Content Generation';
        if (content.includes('improved'))
            return 'Content Improvement';
        if (content.includes('suggestion'))
            return 'Suggestions';
        if (content.includes('explanation'))
            return 'Explanations';
        return 'General Assistance';
    }
    async getOngoingProjects() {
        if (!this.database)
            return [];
        try {
            // Get user's courses in progress
            const courses = await this.database.getCourses(this.context.userId);
            return courses
                .filter((course) => !course.isPublished)
                .slice(0, 5)
                .map((course) => {
                const totalChapters = course.chapters.length;
                const publishedChapters = course.chapters.filter((ch) => ch.isPublished).length;
                const progress = totalChapters > 0
                    ? (publishedChapters / totalChapters) * 100
                    : 0;
                return {
                    type: 'course',
                    id: course.id,
                    title: course.title || 'Untitled Course',
                    progress: Math.round(progress),
                };
            });
        }
        catch {
            return [];
        }
    }
    async analyzeUserPatterns() {
        if (!this.database) {
            return { challenges: [], successes: [], goals: [] };
        }
        try {
            // Analyze recent interactions for patterns
            const interactions = await this.database.getInteractions(this.context.userId, { limit: 50 });
            const challenges = [];
            const successes = [];
            const goals = [];
            interactions.forEach((interaction) => {
                const context = interaction.context;
                if (context?.type === 'help_requested') {
                    challenges.push('Seeking assistance with content creation');
                }
                if (context?.type === 'content_generated') {
                    successes.push('Successfully using AI content generation');
                }
                if (String(context?.type || '').toUpperCase() === 'SUGGESTION_APPLIED') {
                    successes.push('Actively improving content with suggestions');
                }
            });
            return {
                challenges: [...new Set(challenges)],
                successes: [...new Set(successes)],
                goals: [...new Set(goals)],
            };
        }
        catch {
            return { challenges: [], successes: [], goals: [] };
        }
    }
    async updateUserPreferencesFromMessage(content) {
        if (!this.database)
            return;
        // Analyze message for learning preferences
        const preferences = {};
        if (content.includes('simple') || content.includes('basic')) {
            preferences.difficulty = 'easy';
        }
        else if (content.includes('advanced') || content.includes('complex')) {
            preferences.difficulty = 'hard';
        }
        if (content.includes('visual') || content.includes('image')) {
            preferences.contentFormat = ['visual', 'text'];
        }
        if (Object.keys(preferences).length > 0) {
            await this.database.updateLearningProfile(this.context.userId, {
                adaptiveSettings: preferences,
            });
        }
    }
    async trackAssistanceProvided(content, metadata) {
        if (!this.database)
            return;
        // Track what type of assistance was provided for future reference
        const assistanceType = this.extractAssistanceType(content);
        if (assistanceType !== 'General Assistance') {
            await this.database.createInteraction({
                userId: this.context.userId,
                interactionType: 'LEARNING_ASSISTANCE',
                context: { assistanceType, content: content.substring(0, 200) },
                courseId: this.context.courseId,
                chapterId: this.context.chapterId,
                sectionId: this.context.sectionId,
            });
        }
    }
}
/**
 * Factory function to create a MemoryEngine instance
 */
export function createMemoryEngine(context, config) {
    return new MemoryEngine(context, config);
}
