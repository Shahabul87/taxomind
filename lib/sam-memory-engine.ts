import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { 
  createSAMConversation, 
  addSAMMessage, 
  getSAMConversations,
  getSAMLearningProfile,
  updateSAMLearningProfile
} from './sam-database';
import { SAMMessageType } from '@prisma/client';

// Memory and context types
export interface ConversationContext {
  userId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  sessionId: string;
  currentConversationId?: string;
}

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'interaction' | 'preference' | 'milestone' | 'pattern';
  content: string;
  metadata: Record<string, any>;
  relevanceScore: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  startTime: Date;
  lastActivity: Date;
  messageCount: number;
  topics: string[];
  userGoals: string[];
  keyInsights: string[];
  assistanceProvided: string[];
}

export interface PersonalizedContext {
  userPreferences: {
    learningStyle: string;
    preferredTone: string;
    contentFormat: string[];
    difficulty: string;
  };
  recentTopics: string[];
  ongoingProjects: Array<{
    type: 'course' | 'chapter' | 'section';
    id: string;
    title: string;
    progress: number;
  }>;
  commonChallenges: string[];
  successPatterns: string[];
  currentGoals: string[];
}

// Main memory engine class
export class SAMMemoryEngine {
  private context: ConversationContext;
  private memoryCache: Map<string, MemoryEntry[]> = new Map();
  private conversationCache: Map<string, ConversationSummary> = new Map();

  constructor(context: ConversationContext) {
    this.context = context;
  }

  // Initialize or resume conversation
  async initializeConversation(options?: {
    resumeLastConversation?: boolean;
    contextHint?: string;
  }): Promise<string> {
    try {
      let conversationId: string;

      if (options?.resumeLastConversation) {
        // Try to find recent active conversation
        const recentConversations = await getSAMConversations(this.context.userId, {
          courseId: this.context.courseId,
          chapterId: this.context.chapterId,
          limit: 1,
        });

        if (recentConversations.length > 0) {
          const lastConversation = recentConversations[0];
          const timeSinceLastMessage = new Date().getTime() - lastConversation.updatedAt.getTime();
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
      const conversation = await createSAMConversation(this.context.userId, {
        courseId: this.context.courseId,
        chapterId: this.context.chapterId,
        sectionId: this.context.sectionId,
        title: this.generateConversationTitle(options?.contextHint),
      });

      conversationId = conversation.id;
      this.context.currentConversationId = conversationId;

      // Add initial context message
      await this.addContextualWelcomeMessage(conversationId);

      return conversationId;
    } catch (error) {
      logger.error('Error initializing conversation:', error);
      throw error;
    }
  }

  // Add message with memory enrichment
  async addMessageWithMemory(
    role: SAMMessageType,
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      if (!this.context.currentConversationId) {
        await this.initializeConversation();
      }

      // Enrich message with memory context
      const enrichedMetadata = await this.enrichMessageWithMemory(content, metadata);

      const message = await addSAMMessage(this.context.currentConversationId!, {
        role,
        content,
        metadata: enrichedMetadata,
      });

      // Update memory based on message
      await this.updateMemoryFromMessage(role, content, enrichedMetadata);

      return message.id;
    } catch (error) {
      logger.error('Error adding message with memory:', error);
      throw error;
    }
  }

  // Get conversation history with context
  async getConversationHistory(options?: {
    includeContext?: boolean;
    messageLimit?: number;
    relevanceThreshold?: number;
  }): Promise<{
    messages: Array<{
      id: string;
      role: SAMMessageType;
      content: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }>;
    context?: PersonalizedContext;
    relevantMemories?: MemoryEntry[];
  }> {
    try {
      if (!this.context.currentConversationId) {
        return { messages: [] };
      }

      // Get conversation messages
      const conversation = await db.sAMConversation.findUnique({
        where: { id: this.context.currentConversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: options?.messageLimit || 50,
          },
        },
      });

      if (!conversation) {
        return { messages: [] };
      }

      const messages = conversation.messages.reverse().map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
        metadata: msg.metadata as Record<string, any>,
      }));

      let context: PersonalizedContext | undefined;
      let relevantMemories: MemoryEntry[] | undefined;

      if (options?.includeContext) {
        context = await this.getPersonalizedContext();
        relevantMemories = await this.getRelevantMemories(
          conversation.messages.slice(-5).map(m => m.content).join(' '),
          options.relevanceThreshold || 0.5
        );
      }

      return {
        messages,
        context,
        relevantMemories,
      };
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      return { messages: [] };
    }
  }

  // Get personalized context for user
  async getPersonalizedContext(): Promise<PersonalizedContext> {
    try {
      // Get learning profile
      const learningProfile = await getSAMLearningProfile(
        this.context.userId,
        this.context.courseId
      );

      // Get recent conversations for topics
      const recentConversations = await getSAMConversations(this.context.userId, {
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
          preferredTone: learningProfile?.adaptiveSettings?.tone || 'encouraging',
          contentFormat: learningProfile?.interactionPreferences?.formats || ['text', 'visual'],
          difficulty: learningProfile?.preferredDifficulty || 'medium',
        },
        recentTopics,
        ongoingProjects,
        commonChallenges: patterns.challenges,
        successPatterns: patterns.successes,
        currentGoals: patterns.goals,
      };
    } catch (error) {
      logger.error('Error getting personalized context:', error);
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
  }

  // Generate contextual prompt for AI
  async generateContextualPrompt(userMessage: string): Promise<string> {
    try {
      const context = await this.getPersonalizedContext();
      const relevantMemories = await this.getRelevantMemories(userMessage);
      const conversationHistory = await this.getConversationHistory({ messageLimit: 10 });

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
${context.recentTopics.slice(0, 5).map(topic => `- ${topic}`).join('\n')}

## Ongoing Projects
${context.ongoingProjects.slice(0, 3).map(project => 
  `- ${project.type}: ${project.title} (${project.progress}% complete)`
).join('\n')}

## Common Challenges
${context.commonChallenges.slice(0, 3).map(challenge => `- ${challenge}`).join('\n')}

## Success Patterns
${context.successPatterns.slice(0, 3).map(pattern => `- ${pattern}`).join('\n')}

## Relevant Past Interactions
${relevantMemories.slice(0, 3).map(memory => 
  `- ${memory.timestamp.toDateString()}: ${memory.content}`
).join('\n')}

## Recent Conversation History
${conversationHistory.messages.slice(-5).map(msg => 
  `${msg.role}: ${msg.content}`
).join('\n')}

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
    } catch (error) {
      logger.error('Error generating contextual prompt:', error);
      return userMessage;
    }
  }

  // Get conversation summaries
  async getConversationSummaries(limit: number = 20): Promise<ConversationSummary[]> {
    try {
      const conversations = await getSAMConversations(this.context.userId, {
        courseId: this.context.courseId,
        limit,
      });

      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        startTime: conv.createdAt,
        lastActivity: conv.updatedAt,
        messageCount: conv._count?.messages || 0,
        topics: this.extractTopicsFromMessages(conv.messages || []),
        userGoals: this.extractGoalsFromMessages(conv.messages || []),
        keyInsights: this.extractInsightsFromMessages(conv.messages || []),
        assistanceProvided: this.extractAssistanceFromMessages(conv.messages || []),
      }));
    } catch (error) {
      logger.error('Error getting conversation summaries:', error);
      return [];
    }
  }

  // Private helper methods
  private generateConversationTitle(contextHint?: string): string {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
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

  private async addContextualWelcomeMessage(conversationId: string): Promise<void> {
    const context = await this.getPersonalizedContext();
    
    let welcomeMessage = "Hello! I'm SAM, your AI learning assistant. ";
    
    if (context.ongoingProjects.length > 0) {
      const currentProject = context.ongoingProjects[0];
      welcomeMessage += `I see you're working on "${currentProject.title}". `;
    }
    
    if (context.recentTopics.length > 0) {
      welcomeMessage += `Based on our recent discussions about ${context.recentTopics.slice(0, 2).join(' and ')}, `;
    }
    
    welcomeMessage += "I'm here to help you create amazing content and achieve your learning goals. What can I assist you with today?";

    await addSAMMessage(conversationId, {
      role: 'ASSISTANT',
      content: welcomeMessage,
      metadata: { type: 'welcome', contextual: true },
    });
  }

  private async enrichMessageWithMemory(
    content: string,
    metadata?: Record<string, any>
  ): Promise<Record<string, any>> {
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

  private async updateMemoryFromMessage(
    role: SAMMessageType,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Extract learning insights from the message
    if (role === 'USER') {
      // Analyze user message for preferences and patterns
      await this.updateUserPreferencesFromMessage(content);
    } else if (role === 'ASSISTANT') {
      // Track assistance provided
      await this.trackAssistanceProvided(content, metadata);
    }
  }

  private async getRelevantMemories(
    query: string,
    threshold: number = 0.5
  ): Promise<MemoryEntry[]> {
    // Simplified relevance scoring - in production, use embeddings/semantic search
    const userId = this.context.userId;
    const cacheKey = `${userId}-memories`;
    
    if (!this.memoryCache.has(cacheKey)) {
      // Load recent interactions as memories
      const interactions = await db.sAMInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const memories: MemoryEntry[] = interactions.map(interaction => ({
        id: interaction.id,
        timestamp: interaction.createdAt,
        type: 'interaction',
        content: JSON.stringify(interaction.context),
        metadata: interaction.result as Record<string, any> || {},
        relevanceScore: 0,
      }));

      this.memoryCache.set(cacheKey, memories);
    }

    const memories = this.memoryCache.get(cacheKey) || [];
    
    // Simple keyword-based relevance scoring
    const queryWords = query.toLowerCase().split(' ');
    
    return memories
      .map(memory => ({
        ...memory,
        relevanceScore: this.calculateRelevanceScore(memory.content, queryWords),
      }))
      .filter(memory => memory.relevanceScore >= threshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevanceScore(content: string, queryWords: string[]): number {
    const contentLower = content.toLowerCase();
    let score = 0;
    
    queryWords.forEach(word => {
      if (word.length > 2 && contentLower.includes(word)) {
        score += 1;
      }
    });
    
    return score / queryWords.length;
  }

  private extractTopicsFromConversations(conversations: any[]): string[] {
    const topics: string[] = [];
    
    conversations.forEach(conv => {
      if (conv.title && conv.title !== 'Untitled Conversation') {
        topics.push(conv.title);
      }
      
      // Extract topics from message content (simplified)
      conv.messages?.forEach((msg: any) => {
        if (msg.role === 'USER') {
          const content = msg.content.toLowerCase();
          if (content.includes('course')) topics.push('Course Creation');
          if (content.includes('chapter')) topics.push('Chapter Development');
          if (content.includes('content')) topics.push('Content Writing');
          if (content.includes('exam') || content.includes('quiz')) topics.push('Assessment');
        }
      });
    });
    
    return [...new Set(topics)];
  }

  private extractTopicsFromMessages(messages: any[]): string[] {
    // Extract topics from message content
    return messages
      .filter(msg => msg.role === 'USER')
      .map(msg => this.extractMainTopic(msg.content))
      .filter(Boolean);
  }

  private extractGoalsFromMessages(messages: any[]): string[] {
    // Look for goal-related keywords
    return messages
      .filter(msg => msg.content.toLowerCase().includes('goal') || 
                     msg.content.toLowerCase().includes('want to') ||
                     msg.content.toLowerCase().includes('trying to'))
      .map(msg => this.extractGoal(msg.content))
      .filter(Boolean);
  }

  private extractInsightsFromMessages(messages: any[]): string[] {
    // Extract insights from assistant messages
    return messages
      .filter(msg => msg.role === 'ASSISTANT')
      .map(msg => this.extractInsight(msg.content))
      .filter(Boolean);
  }

  private extractAssistanceFromMessages(messages: any[]): string[] {
    // Extract types of assistance provided
    return messages
      .filter(msg => msg.role === 'ASSISTANT')
      .map(msg => this.extractAssistanceType(msg.content))
      .filter(Boolean);
  }

  private extractMainTopic(content: string): string {
    // Simplified topic extraction
    if (content.includes('course')) return 'Course Creation';
    if (content.includes('chapter')) return 'Chapter Development';
    if (content.includes('section')) return 'Section Writing';
    if (content.includes('exam') || content.includes('quiz')) return 'Assessment';
    if (content.includes('content')) return 'Content Writing';
    return 'General Discussion';
  }

  private extractGoal(content: string): string {
    // Extract goal from content
    const goalMatch = content.match(/(?:want to|trying to|goal.*?is to)\s+(.+?)(?:\.|$)/i);
    return goalMatch ? goalMatch[1].trim() : '';
  }

  private extractInsight(content: string): string {
    // Extract key insights from assistant responses
    if (content.includes('recommendation') || content.includes('suggest')) {
      return content.substring(0, 100) + '...';
    }
    return '';
  }

  private extractAssistanceType(content: string): string {
    if (content.includes('content generated')) return 'Content Generation';
    if (content.includes('improved')) return 'Content Improvement';
    if (content.includes('suggestion')) return 'Suggestions';
    if (content.includes('explanation')) return 'Explanations';
    return 'General Assistance';
  }

  private async getOngoingProjects(): Promise<PersonalizedContext['ongoingProjects']> {
    try {
      // Get user's courses in progress
      const courses = await db.course.findMany({
        where: {
          userId: this.context.userId,
          isPublished: false,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          chapters: {
            select: { id: true, isPublished: true },
          },
        },
        take: 5,
      });

      return courses.map(course => {
        const totalChapters = course.chapters.length;
        const publishedChapters = course.chapters.filter(ch => ch.isPublished).length;
        const progress = totalChapters > 0 ? (publishedChapters / totalChapters) * 100 : 0;

        return {
          type: 'course' as const,
          id: course.id,
          title: course.title || 'Untitled Course',
          progress: Math.round(progress),
        };
      });
    } catch (error) {
      logger.error('Error getting ongoing projects:', error);
      return [];
    }
  }

  private async analyzeUserPatterns(): Promise<{
    challenges: string[];
    successes: string[];
    goals: string[];
  }> {
    try {
      // Analyze recent interactions for patterns
      const interactions = await db.sAMInteraction.findMany({
        where: { userId: this.context.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const challenges: string[] = [];
      const successes: string[] = [];
      const goals: string[] = [];

      interactions.forEach(interaction => {
        const context = interaction.context as any;
        
        if (context?.type === 'help_requested') {
          challenges.push('Seeking assistance with content creation');
        }
        
        if (context?.type === 'content_generated') {
          successes.push('Successfully using AI content generation');
        }
        
        if (interaction.interactionType === 'SUGGESTION_APPLIED') {
          successes.push('Actively improving content with suggestions');
        }
      });

      return {
        challenges: [...new Set(challenges)],
        successes: [...new Set(successes)],
        goals: [...new Set(goals)],
      };
    } catch (error) {
      logger.error('Error analyzing user patterns:', error);
      return { challenges: [], successes: [], goals: [] };
    }
  }

  private async updateUserPreferencesFromMessage(content: string): Promise<void> {
    // Analyze message for learning preferences
    const preferences: any = {};
    
    if (content.includes('simple') || content.includes('basic')) {
      preferences.difficulty = 'easy';
    } else if (content.includes('advanced') || content.includes('complex')) {
      preferences.difficulty = 'hard';
    }
    
    if (content.includes('visual') || content.includes('image')) {
      preferences.contentFormat = ['visual', 'text'];
    }
    
    if (Object.keys(preferences).length > 0) {
      await updateSAMLearningProfile(this.context.userId, {
        adaptiveSettings: preferences,
        courseId: this.context.courseId,
      });
    }
  }

  private async trackAssistanceProvided(content: string, metadata?: Record<string, any>): Promise<void> {
    // Track what type of assistance was provided for future reference
    const assistanceType = this.extractAssistanceType(content);
    
    if (assistanceType !== 'General Assistance') {
      // Could store this for analytics and future personalization
      await db.sAMInteraction.create({
        data: {
          userId: this.context.userId,
          interactionType: 'LEARNING_ASSISTANCE',
          context: { assistanceType, content: content.substring(0, 200) },
          result: metadata,
          courseId: this.context.courseId,
          chapterId: this.context.chapterId,
          sectionId: this.context.sectionId,
        },
      });
    }
  }
}