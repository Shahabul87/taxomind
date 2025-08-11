import { logger } from '@/lib/logger';

/**
 * SAM Memory System - Persistent Context Management
 * Maintains contextual information throughout the entire course creation journey
 */

interface CourseCreationContext {
  // Course Creation Wizard Data
  wizardData?: {
    courseTitle: string;
    courseShortOverview: string;
    courseCategory: string;
    courseSubcategory?: string;
    targetAudience: string;
    difficulty: string;
    courseIntent?: string;
    courseGoals: string[];
    bloomsFocus: string[];
    preferredContentTypes: string[];
    chapterCount: number;
    sectionsPerChapter: number;
    includeAssessments: boolean;
    completedAt?: string;
  };

  // SAM Interactions from Wizard
  wizardInteractions?: Array<{
    type: 'suggestion' | 'generation' | 'feedback';
    content: string;
    step: number;
    timestamp: string;
  }>;

  // Generated Course Structure
  generatedStructure?: {
    courseDescription?: string;
    enhancedObjectives?: string[];
    chapters?: Array<{
      title: string;
      description: string;
      bloomsLevel: string;
      position: number;
      sections: Array<{
        title: string;
        description: string;
        contentType: string;
        estimatedDuration: string;
        position: number;
      }>;
    }>;
    generatedAt?: string;
    generationMethod?: 'manual' | 'sam-complete' | 'blueprint' | 'unified-creation';
  };

  // Course Management Context
  courseData?: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    price: number | null;
    isPublished: boolean;
    categoryId: string | null;
    whatYouWillLearn: string[];
    chapters: Array<{
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      sections: Array<{
        id: string;
        title: string;
        description: string | null;
        position: number;
        isPublished: boolean;
      }>;
    }>;
    attachments: Array<{
      id: string;
      name: string;
      url: string;
      createdAt: Date;
    }>;
    category?: {
      id: string;
      name: string;
    };
  };

  // Completion and Progress
  completionStatus?: {
    titleDesc: boolean;
    learningObj: boolean;
    chapters: boolean;
    price: boolean;
    category: boolean;
    image: boolean;
    attachments: boolean;
  };

  // User Preferences and Behavior
  userPreferences?: {
    preferredGenerationMethod: 'manual' | 'ai-assisted' | 'full-automation';
    communicationStyle: 'detailed' | 'concise' | 'step-by-step';
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    lastActiveSection?: string;
    favoriteSamFeatures?: string[];
  };

  // SAM Conversation History
  conversationHistory?: Array<{
    id: string;
    type: 'user' | 'sam';
    content: string;
    context: string; // 'wizard' | 'course-management' | 'chapter-editing' etc.
    page: string;
    timestamp: string;
    suggestions?: string[];
    actionsTaken?: string[];
  }>;

  // Session Information
  sessionInfo?: {
    sessionId: string;
    startedAt: string;
    lastUpdated: string;
    currentPage: string;
    totalInteractions: number;
    successfulGenerations: number;
  };
}

export class SamMemorySystem {
  private static instance: SamMemorySystem;
  private context: CourseCreationContext = {};
  private storageKey = 'sam-course-context';

  private constructor() {
    this.loadContext();
  }

  public static getInstance(): SamMemorySystem {
    if (!SamMemorySystem.instance) {
      SamMemorySystem.instance = new SamMemorySystem();
    }
    return SamMemorySystem.instance;
  }

  // Context Management
  public updateContext(updates: Partial<CourseCreationContext>): void {
    this.context = {
      ...this.context,
      ...updates,
      sessionInfo: {
        ...this.context.sessionInfo,
        lastUpdated: new Date().toISOString(),
        totalInteractions: (this.context.sessionInfo?.totalInteractions || 0) + 1
      }
    };
    this.saveContext();
  }

  public getContext(): CourseCreationContext {
    return { ...this.context };
  }

  public getContextForPage(page: string): any {
    const fullContext = this.getContext();
    
    return {
      // Always include core course data
      courseId: fullContext.courseData?.id,
      courseTitle: fullContext.wizardData?.courseTitle || fullContext.courseData?.title,
      
      // Wizard context if available
      wizardContext: fullContext.wizardData ? {
        originalIntent: fullContext.wizardData.courseIntent,
        targetAudience: fullContext.wizardData.targetAudience,
        difficulty: fullContext.wizardData.difficulty,
        bloomsFocus: fullContext.wizardData.bloomsFocus,
        preferredContentTypes: fullContext.wizardData.preferredContentTypes,
        generationPreferences: {
          chapterCount: fullContext.wizardData.chapterCount,
          sectionsPerChapter: fullContext.wizardData.sectionsPerChapter,
          includeAssessments: fullContext.wizardData.includeAssessments
        }
      } : null,

      // Current course state
      currentState: fullContext.courseData,
      completionStatus: fullContext.completionStatus,
      
      // SAM interaction history for this context
      previousInteractions: this.getRelevantInteractions(page),
      
      // Generated content that SAM should remember
      generatedContent: fullContext.generatedStructure,
      
      // User preferences
      userProfile: fullContext.userPreferences,
      
      // Page-specific context
      pageContext: page,
      sessionId: fullContext.sessionInfo?.sessionId
    };
  }

  // Wizard Integration
  public saveWizardData(wizardData: CourseCreationContext['wizardData']): void {
    this.updateContext({
      wizardData: {
        ...wizardData,
        completedAt: new Date().toISOString()
      }
    });
  }

  public addWizardInteraction(interaction: {
    type: 'suggestion' | 'generation' | 'feedback';
    content: string;
    step: number;
  }): void {
    const interactions = this.context.wizardInteractions || [];
    interactions.push({
      ...interaction,
      timestamp: new Date().toISOString()
    });
    
    this.updateContext({
      wizardInteractions: interactions
    });
  }

  // Course Management Integration
  public updateCourseData(courseData: CourseCreationContext['courseData']): void {
    this.updateContext({ courseData });
  }

  public updateCompletionStatus(completionStatus: CourseCreationContext['completionStatus']): void {
    this.updateContext({ completionStatus });
  }

  // Generated Content Management
  public saveGeneratedStructure(structure: CourseCreationContext['generatedStructure']): void {
    this.updateContext({
      generatedStructure: {
        ...structure,
        generatedAt: new Date().toISOString()
      }
    });
  }

  // Conversation Management
  public addConversation(message: {
    type: 'user' | 'sam';
    content: string;
    context: string;
    page: string;
    suggestions?: string[];
    actionsTaken?: string[];
  }): void {
    const history = this.context.conversationHistory || [];
    history.push({
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    
    // Keep last 50 conversations
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.updateContext({
      conversationHistory: history
    });
  }

  public getRelevantInteractions(page: string, limit: number = 10): any[] {
    const history = this.context.conversationHistory || [];
    
    // Get interactions from current page and related contexts
    const relevant = history
      .filter(conv => 
        conv.page === page || 
        conv.context === 'wizard' || 
        conv.context === 'course-management'
      )
      .slice(-limit);
    
    return relevant;
  }

  // User Preferences
  public updateUserPreferences(preferences: Partial<CourseCreationContext['userPreferences']>): void {
    this.updateContext({
      userPreferences: {
        ...this.context.userPreferences,
        ...preferences
      }
    });
  }

  // Session Management
  public startSession(page: string): void {
    const sessionId = Date.now().toString();
    this.updateContext({
      sessionInfo: {
        sessionId,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        currentPage: page,
        totalInteractions: 0,
        successfulGenerations: this.context.sessionInfo?.successfulGenerations || 0
      }
    });
  }

  public updateCurrentPage(page: string): void {
    if (this.context.sessionInfo) {
      this.updateContext({
        sessionInfo: {
          ...this.context.sessionInfo,
          currentPage: page,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  }

  public incrementSuccessfulGenerations(): void {
    if (this.context.sessionInfo) {
      this.updateContext({
        sessionInfo: {
          ...this.context.sessionInfo,
          successfulGenerations: (this.context.sessionInfo.successfulGenerations || 0) + 1
        }
      });
    }
  }

  // Persistence
  private saveContext(): void {
    try {
      // Only save if we're in the browser (client-side)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.context));
      }
    } catch (error: any) {
      logger.warn('Failed to save SAM context to localStorage:', error);
    }
  }

  private loadContext(): void {
    try {
      // Check if we're in the browser (client-side)
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          this.context = JSON.parse(saved);
        }
      } else {
        // Server-side rendering - initialize with empty context
        this.context = {};
      }
    } catch (error: any) {
      logger.warn('Failed to load SAM context from localStorage:', error);
      this.context = {};
    }
  }

  public clearContext(): void {
    this.context = {};
    // Only clear if we're in the browser (client-side)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  // Analysis and Insights
  public generateContextSummary(): string {
    const ctx = this.context;
    const lines = [];
    
    if (ctx.wizardData) {
      lines.push(`Course Creation: "${ctx.wizardData.courseTitle}" for ${ctx.wizardData.targetAudience}`);
      lines.push(`QuestionDifficulty: ${ctx.wizardData.difficulty}, Focus: ${ctx.wizardData.bloomsFocus?.join(', ')}`);
    }
    
    if (ctx.courseData) {
      lines.push(`Current Status: ${ctx.courseData.chapters.length} chapters, ${ctx.courseData.isPublished ? 'Published' : 'Draft'}`);
    }
    
    if (ctx.completionStatus) {
      const completed = Object.values(ctx.completionStatus).filter(Boolean).length;
      const total = Object.keys(ctx.completionStatus).length;
      lines.push(`Completion: ${completed}/${total} sections completed`);
    }
    
    if (ctx.conversationHistory) {
      lines.push(`SAM Interactions: ${ctx.conversationHistory.length} conversations`);
    }
    
    return lines.join('\n');
  }
}

// Singleton instance
export const samMemory = SamMemorySystem.getInstance();

// Hooks for React components
export function useSamMemory() {
  return {
    updateContext: (updates: Partial<CourseCreationContext>) => samMemory.updateContext(updates),
    getContext: () => samMemory.getContext(),
    getContextForPage: (page: string) => samMemory.getContextForPage(page),
    addConversation: (message: any) => samMemory.addConversation(message),
    updateUserPreferences: (prefs: any) => samMemory.updateUserPreferences(prefs),
    clearContext: () => samMemory.clearContext()
  };
}