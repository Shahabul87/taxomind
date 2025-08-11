"use client";

import { aiCache, AIRequestContext } from './ai-cache-system';

/**
 * Optimized AI API client with intelligent caching and request optimization
 */

export interface QuestionGenerationRequest {
  topic: string;
  count: number;
  bloomsLevel: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  courseContext?: string;
}

export interface ContentGenerationRequest {
  type: 'chapter' | 'section' | 'outline' | 'summary';
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  tone: 'formal' | 'conversational' | 'technical' | 'engaging';
  length: 'short' | 'medium' | 'long';
  includeExamples?: boolean;
}

export interface AnalysisRequest {
  type: 'student-performance' | 'content-difficulty' | 'engagement-analysis';
  data: any;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

export interface ChatRequest {
  message: string;
  context: string[];
  conversationId?: string;
  systemPrompt?: string;
}

export interface PresetGenerationRequest {
  subject: string;
  level: string;
  duration: string;
  goals: string[];
  audience: string;
}

// Estimate token count for requests (rough estimation)
function estimateTokens(request: any): number {
  const text = JSON.stringify(request);
  return Math.ceil(text.length / 4); // Rough estimate: 4 characters per token
}

// Request batching for multiple similar requests
class RequestBatcher {
  private batches = new Map<string, { requests: any[]; timeout: NodeJS.Timeout }>();
  private batchSize = 10;
  private batchTimeout = 1000; // 1 second

  public addToBatch<T>(
    batchKey: string,
    request: any,
    context: AIRequestContext,
    fetchFn: (requests: any[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, {
          requests: [],
          timeout: setTimeout(() => this.processBatch(batchKey, fetchFn), this.batchTimeout)
        });
      }

      const batch = this.batches.get(batchKey)!;
      batch.requests.push({ request, resolve, reject, context });

      // Process batch immediately if it's full
      if (batch.requests.length >= this.batchSize) {
        clearTimeout(batch.timeout);
        this.processBatch(batchKey, fetchFn);
      }
    });
  }

  private async processBatch<T>(
    batchKey: string,
    fetchFn: (requests: any[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);

    try {
      const requests = batch.requests.map((item: any) => item.request);
      const results = await fetchFn(requests);

      batch.requests.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error: any) {
      batch.requests.forEach(item => {
        item.reject(error);
      });
    }
  }
}

const requestBatcher = new RequestBatcher();

export class OptimizedAIAPI {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string = '/api/ai', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    context: AIRequestContext,
    options: {
      enableCaching?: boolean;
      enableBatching?: boolean;
      batchKey?: string;
    } = {}
  ): Promise<T> {
    const {
      enableCaching = true,
      enableBatching = false,
      batchKey
    } = options;

    const requestData = {
      endpoint,
      data,
      timestamp: Date.now()
    };

    // Add token estimation to context
    const enrichedContext = {
      ...context,
      estimatedTokens: estimateTokens(data)
    };

    const fetchFn = async (): Promise<T> => {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`AI API request failed: ${response.statusText}`);
      }

      return response.json();
    };

    const batchedFetchFn = async (requests: any[]): Promise<T[]> => {
      const response = await fetch(`${this.baseURL}${endpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({ requests })
      });

      if (!response.ok) {
        throw new Error(`AI API batch request failed: ${response.statusText}`);
      }

      return response.json();
    };

    // Use batching if enabled and batch key provided
    if (enableBatching && batchKey) {
      return requestBatcher.addToBatch(batchKey, requestData, enrichedContext, batchedFetchFn);
    }

    // Use caching if enabled
    if (enableCaching) {
      return aiCache.get(requestData, enrichedContext, fetchFn);
    }

    // Direct request without caching
    return fetchFn();
  }

  public async generateQuestions(
    request: QuestionGenerationRequest,
    context: Partial<AIRequestContext> = {}
  ): Promise<any[]> {
    const fullContext: AIRequestContext = {
      type: 'question-generation',
      priority: 'medium',
      ...context
    };

    return this.makeRequest(
      '/generate-questions',
      request,
      fullContext,
      {
        enableCaching: true,
        enableBatching: true,
        batchKey: `questions_${request.bloomsLevel.join(',')}_${request.difficulty}`
      }
    );
  }

  public async generateContent(
    request: ContentGenerationRequest,
    context: Partial<AIRequestContext> = {}
  ): Promise<any> {
    const fullContext: AIRequestContext = {
      type: 'content-creation',
      priority: 'medium',
      ...context
    };

    return this.makeRequest(
      '/generate-content',
      request,
      fullContext,
      {
        enableCaching: true,
        enableBatching: false // Content generation is usually unique
      }
    );
  }

  public async analyzeData(
    request: AnalysisRequest,
    context: Partial<AIRequestContext> = {}
  ): Promise<any> {
    const fullContext: AIRequestContext = {
      type: 'analysis',
      priority: 'high',
      ...context
    };

    return this.makeRequest(
      '/analyze',
      request,
      fullContext,
      {
        enableCaching: true,
        enableBatching: false
      }
    );
  }

  public async chat(
    request: ChatRequest,
    context: Partial<AIRequestContext> = {}
  ): Promise<any> {
    const fullContext: AIRequestContext = {
      type: 'chat',
      priority: 'high',
      ...context
    };

    // Chat responses are typically not cached as they're conversational
    return this.makeRequest(
      '/chat',
      request,
      fullContext,
      {
        enableCaching: false,
        enableBatching: false
      }
    );
  }

  public async generatePreset(
    request: PresetGenerationRequest,
    context: Partial<AIRequestContext> = {}
  ): Promise<any> {
    const fullContext: AIRequestContext = {
      type: 'preset-generation',
      priority: 'low',
      ...context
    };

    return this.makeRequest(
      '/generate-preset',
      request,
      fullContext,
      {
        enableCaching: true,
        enableBatching: false
      }
    );
  }

  // Bulk operations for efficiency
  public async generateMultipleQuestionSets(
    requests: QuestionGenerationRequest[],
    context: Partial<AIRequestContext> = {}
  ): Promise<any[][]> {
    const promises = requests.map(request => 
      this.generateQuestions(request, context)
    );

    return Promise.all(promises);
  }

  // Smart preloading based on course structure
  public async preloadCourseContent(
    courseId: string,
    courseStructure: {
      chapters: Array<{
        title: string;
        sections: Array<{ title: string; type: string }>;
      }>;
    },
    context: Partial<AIRequestContext> = {}
  ): Promise<void> {
    const preloadRequests = [];

    // Preload common question types for each chapter
    for (const chapter of courseStructure.chapters) {
      preloadRequests.push({
        request: {
          topic: chapter.title,
          count: 5,
          bloomsLevel: ['remember', 'understand'],
          difficulty: 'medium' as const,
          questionType: 'multiple-choice' as const
        },
        context: {
          type: 'question-generation' as const,
          priority: 'low' as const,
          courseId,
          ...context
        },
        fetchFn: () => this.generateQuestions(preloadRequests[0].request, context)
      });

      // Preload content outlines
      preloadRequests.push({
        request: {
          type: 'outline' as const,
          topic: chapter.title,
          level: 'intermediate' as const,
          tone: 'engaging' as const,
          length: 'medium' as const
        },
        context: {
          type: 'content-creation' as const,
          priority: 'low' as const,
          courseId,
          ...context
        },
        fetchFn: () => this.generateContent(preloadRequests[1].request, context)
      });
    }

    aiCache.preload(preloadRequests);
  }

  // Cache management methods
  public invalidateCourseCache(courseId: string): void {
    aiCache.invalidateByCourse(courseId);
  }

  public invalidateUserCache(userId: string): void {
    aiCache.invalidateByUser(userId);
  }

  public getCacheStats() {
    return aiCache.getStats();
  }

  public warmupCache(courseId: string): void {
    aiCache.warmup(courseId);
  }
}

// Global optimized AI API instance
export const optimizedAI = new OptimizedAIAPI();

// React hook for using optimized AI API
export function useOptimizedAI() {
  return {
    generateQuestions: optimizedAI.generateQuestions.bind(optimizedAI),
    generateContent: optimizedAI.generateContent.bind(optimizedAI),
    analyzeData: optimizedAI.analyzeData.bind(optimizedAI),
    chat: optimizedAI.chat.bind(optimizedAI),
    generatePreset: optimizedAI.generatePreset.bind(optimizedAI),
    generateMultipleQuestionSets: optimizedAI.generateMultipleQuestionSets.bind(optimizedAI),
    preloadCourseContent: optimizedAI.preloadCourseContent.bind(optimizedAI),
    invalidateCourseCache: optimizedAI.invalidateCourseCache.bind(optimizedAI),
    invalidateUserCache: optimizedAI.invalidateUserCache.bind(optimizedAI),
    getCacheStats: optimizedAI.getCacheStats.bind(optimizedAI),
    warmupCache: optimizedAI.warmupCache.bind(optimizedAI)
  };
}