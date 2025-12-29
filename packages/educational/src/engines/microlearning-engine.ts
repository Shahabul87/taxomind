/**
 * @sam-ai/educational - MicrolearningEngine
 *
 * Engine for bite-sized learning modules, content chunking, spaced delivery,
 * and mobile-optimized learning experiences.
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type {
  MicrolearningEngineConfig,
  MicroModule,
  MicroModuleType,
  MicroModuleContent,
  ContentBlock,
  MicroModuleStatus,
  ChunkingInput,
  ChunkingResult,
  ContentChunk,
  DeliverySchedule,
  DeliveryScheduleType,
  ScheduledModule,
  DeliveryPreferences,
  MicrolearningSession,
  SessionModule,
  SessionPerformance,
  MobileOptimizationInput,
  MobileOptimizedContent,
  MobileCard,
  SpacedRepetitionConfig,
  SpacedRepetitionUpdate,
  MicrolearningSRResult,
  MicrolearningAnalytics,
  OverallStats,
  StreakStats,
  LearningPatterns,
  ModuleBreakdown,
  MicrolearningRecommendation,
  GenerateModulesInput,
  GenerateModulesResult,
  ScheduleSuggestion,
  CreateSessionInput,
  UpdateProgressInput,
  GetAnalyticsInput,
  DeviceType,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOOMS_HIERARCHY: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

const DEFAULT_TARGET_DURATION = 5; // minutes
const DEFAULT_MAX_DURATION = 10; // minutes
const WORDS_PER_MINUTE = 200; // average reading speed
const MOBILE_MAX_WORDS = 150; // optimal for mobile

const DEFAULT_SPACED_REPETITION_CONFIG: SpacedRepetitionConfig = {
  initialInterval: 1,
  minEaseFactor: 1.3,
  maxInterval: 365,
  learningSteps: [1, 10], // minutes
  graduatingInterval: 1,
  easyBonus: 1.3,
  intervalModifier: 1.0,
};

const MODULE_TYPE_DURATION: Record<MicroModuleType, number> = {
  CONCEPT: 5,
  PRACTICE: 3,
  QUIZ: 4,
  FLASHCARD: 2,
  VIDEO_SNIPPET: 3,
  INTERACTIVE: 5,
  SUMMARY: 2,
  REFLECTION: 3,
};

// ============================================================================
// MICROLEARNING ENGINE IMPLEMENTATION
// ============================================================================

export class MicrolearningEngine {
  private config: SAMConfig;
  private database?: SAMDatabaseAdapter;
  private logger: SAMConfig['logger'];
  private targetDuration: number;
  private maxDuration: number;
  private enableAIChunking: boolean;
  private defaultScheduleType: DeliveryScheduleType;
  private spacedRepetitionConfig: SpacedRepetitionConfig;

  // Caches
  private moduleCache: Map<string, MicroModule> = new Map();
  private scheduleCache: Map<string, DeliverySchedule> = new Map();
  private sessionCache: Map<string, MicrolearningSession> = new Map();
  private progressCache: Map<string, Map<string, ScheduledModule>> = new Map();

  constructor(engineConfig: MicrolearningEngineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
    this.targetDuration = engineConfig.targetDurationMinutes ?? DEFAULT_TARGET_DURATION;
    this.maxDuration = engineConfig.maxDurationMinutes ?? DEFAULT_MAX_DURATION;
    this.enableAIChunking = engineConfig.enableAIChunking ?? true;
    this.defaultScheduleType = engineConfig.defaultScheduleType ?? 'SPACED_REPETITION';
    this.spacedRepetitionConfig = { ...DEFAULT_SPACED_REPETITION_CONFIG };
  }

  // ============================================================================
  // CONTENT CHUNKING
  // ============================================================================

  /**
   * Chunk content into micro-learning modules
   */
  async chunkContent(input: ChunkingInput): Promise<ChunkingResult> {
    this.logger?.info?.('[MicrolearningEngine] Chunking content', {
      contentType: input.contentType,
      targetDuration: input.targetDuration,
    });

    const startTime = Date.now();

    if (this.enableAIChunking && this.config.ai) {
      return this.chunkWithAI(input, startTime);
    }

    return this.chunkWithRules(input, startTime);
  }

  private async chunkWithAI(
    input: ChunkingInput,
    startTime: number
  ): Promise<ChunkingResult> {
    try {
      const targetWords = input.targetDuration * WORDS_PER_MINUTE;
      const maxWords = input.maxDuration * WORDS_PER_MINUTE;

      const response = await this.config.ai.chat({
        messages: [
          {
            role: 'system',
            content: `You are an expert in instructional design and microlearning.
Chunk educational content into bite-sized learning modules.

Each chunk should:
- Be self-contained but connected to the whole
- Cover one main concept
- Take approximately ${input.targetDuration} minutes to read/learn (${targetWords} words max)
- Include a clear title and main concept
- Identify the Bloom's taxonomy level

Module Types:
- CONCEPT: Explanation of a concept
- PRACTICE: Hands-on exercise
- QUIZ: Assessment questions
- SUMMARY: Key points recap
- REFLECTION: Self-reflection prompt

Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Chunk this ${input.contentType} content into microlearning modules:

${input.content.slice(0, 6000)}${input.content.length > 6000 ? '...' : ''}

Target: ${targetWords} words per chunk (max ${maxWords})
${input.preserveParagraphs ? 'Preserve paragraph boundaries' : ''}
${input.includeContext ? 'Include context from surrounding chunks' : ''}

Return JSON:
{
  "chunks": [
    {
      "title": "chunk title",
      "content": "chunk content",
      "mainConcept": "primary concept",
      "relatedConcepts": ["related1", "related2"],
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "suggestedType": "CONCEPT|PRACTICE|QUIZ|SUMMARY|REFLECTION",
      "previousContext": "brief context from previous (if applicable)",
      "nextPreview": "preview of next chunk (if applicable)"
    }
  ]
}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 4000,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        chunks: Array<{
          title: string;
          content: string;
          mainConcept: string;
          relatedConcepts: string[];
          bloomsLevel: BloomsLevel;
          suggestedType: MicroModuleType;
          previousContext?: string;
          nextPreview?: string;
        }>;
      };

      const chunks: ContentChunk[] = parsed.chunks.map((chunk, index) => ({
        id: `chunk-${Date.now()}-${index}`,
        position: index,
        title: chunk.title,
        content: chunk.content,
        durationMinutes: this.estimateDuration(chunk.content),
        wordCount: chunk.content.split(/\s+/).length,
        mainConcept: chunk.mainConcept,
        relatedConcepts: chunk.relatedConcepts,
        bloomsLevel: chunk.bloomsLevel,
        suggestedType: chunk.suggestedType,
        previousContext: chunk.previousContext,
        nextPreview: chunk.nextPreview,
      }));

      const totalDuration = chunks.reduce((sum, c) => sum + c.durationMinutes, 0);

      return {
        chunks,
        totalChunks: chunks.length,
        totalDurationMinutes: totalDuration,
        averageDurationMinutes: chunks.length > 0 ? totalDuration / chunks.length : 0,
        coverage: this.calculateCoverage(input.content, chunks),
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger?.warn?.('[MicrolearningEngine] AI chunking failed, using rules', error);
      return this.chunkWithRules(input, startTime);
    }
  }

  private chunkWithRules(input: ChunkingInput, startTime: number): ChunkingResult {
    const targetWords = input.targetDuration * WORDS_PER_MINUTE;
    const maxWords = input.maxDuration * WORDS_PER_MINUTE;

    // Split by paragraphs or sections
    const sections = input.preserveParagraphs
      ? input.content.split(/\n\n+/)
      : input.content.split(/\n#{1,3}\s+|\n\n+/);

    const chunks: ContentChunk[] = [];
    let currentChunk = '';
    let currentWordCount = 0;
    let position = 0;

    for (const section of sections) {
      const sectionWords = section.split(/\s+/).length;

      if (currentWordCount + sectionWords > maxWords && currentChunk) {
        // Save current chunk
        chunks.push(this.createChunkFromText(currentChunk, position++, input));
        currentChunk = section;
        currentWordCount = sectionWords;
      } else if (currentWordCount + sectionWords >= targetWords * 0.8) {
        // Chunk is about right size
        currentChunk += '\n\n' + section;
        chunks.push(this.createChunkFromText(currentChunk, position++, input));
        currentChunk = '';
        currentWordCount = 0;
      } else {
        // Continue building chunk
        currentChunk += (currentChunk ? '\n\n' : '') + section;
        currentWordCount += sectionWords;
      }
    }

    // Add remaining content
    if (currentChunk.trim()) {
      chunks.push(this.createChunkFromText(currentChunk, position, input));
    }

    // Add context if requested
    if (input.includeContext) {
      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) {
          chunks[i].previousContext = chunks[i - 1].title;
        }
        if (i < chunks.length - 1) {
          chunks[i].nextPreview = chunks[i + 1].title;
        }
      }
    }

    const totalDuration = chunks.reduce((sum, c) => sum + c.durationMinutes, 0);

    return {
      chunks,
      totalChunks: chunks.length,
      totalDurationMinutes: totalDuration,
      averageDurationMinutes: chunks.length > 0 ? totalDuration / chunks.length : 0,
      coverage: this.calculateCoverage(input.content, chunks),
      processingTimeMs: Date.now() - startTime,
    };
  }

  private createChunkFromText(
    text: string,
    position: number,
    input: ChunkingInput
  ): ContentChunk {
    const wordCount = text.split(/\s+/).length;
    const title = this.extractTitle(text, position);
    const mainConcept = this.extractMainConcept(text);

    return {
      id: `chunk-${Date.now()}-${position}`,
      position,
      title,
      content: text.trim(),
      durationMinutes: this.estimateDuration(text),
      wordCount,
      mainConcept,
      relatedConcepts: this.extractRelatedConcepts(text),
      bloomsLevel: this.detectBloomsLevel(text),
      suggestedType: this.suggestModuleType(text),
    };
  }

  private extractTitle(text: string, position: number): string {
    // Try to find a heading
    const headingMatch = text.match(/^#+\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();

    // Use first sentence
    const firstSentence = text.match(/^[^.!?]+[.!?]/);
    if (firstSentence && firstSentence[0].length < 100) {
      return firstSentence[0].trim();
    }

    return `Module ${position + 1}`;
  }

  private extractMainConcept(text: string): string {
    // Extract key terms (capitalized phrases, quoted terms, bold/italic)
    const keyTerms = text.match(/\*\*([^*]+)\*\*|"([^"]+)"|'([^']+)'|\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);

    if (keyTerms && keyTerms.length > 0) {
      return keyTerms[0].replace(/[*"']/g, '').trim();
    }

    // Fall back to first noun phrase
    const words = text.split(/\s+/).slice(0, 20);
    const nouns = words.filter(w => w.length > 4 && /^[A-Z]/.test(w));

    return nouns[0] ?? 'General Concept';
  }

  private extractRelatedConcepts(text: string): string[] {
    const concepts: string[] = [];

    // Find capitalized terms
    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedTerms) {
      concepts.push(...capitalizedTerms.slice(0, 5));
    }

    return [...new Set(concepts)];
  }

  private detectBloomsLevel(text: string): BloomsLevel {
    const lowerText = text.toLowerCase();

    const bloomsKeywords: Record<BloomsLevel, string[]> = {
      REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state'],
      UNDERSTAND: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
      APPLY: ['apply', 'use', 'implement', 'solve', 'demonstrate'],
      ANALYZE: ['analyze', 'compare', 'contrast', 'differentiate', 'examine'],
      EVALUATE: ['evaluate', 'judge', 'critique', 'justify', 'assess'],
      CREATE: ['create', 'design', 'develop', 'construct', 'produce'],
    };

    for (const level of [...BLOOMS_HIERARCHY].reverse()) {
      for (const keyword of bloomsKeywords[level]) {
        if (lowerText.includes(keyword)) {
          return level;
        }
      }
    }

    return 'UNDERSTAND';
  }

  private suggestModuleType(text: string): MicroModuleType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('exercise') || lowerText.includes('practice') || lowerText.includes('try')) {
      return 'PRACTICE';
    }
    if (lowerText.includes('quiz') || lowerText.includes('question') || lowerText.includes('test')) {
      return 'QUIZ';
    }
    if (lowerText.includes('summary') || lowerText.includes('recap') || lowerText.includes('key points')) {
      return 'SUMMARY';
    }
    if (lowerText.includes('reflect') || lowerText.includes('think about') || lowerText.includes('consider')) {
      return 'REFLECTION';
    }

    return 'CONCEPT';
  }

  private estimateDuration(text: string): number {
    const wordCount = text.split(/\s+/).length;
    const minutes = wordCount / WORDS_PER_MINUTE;
    return Math.max(1, Math.min(this.maxDuration, Math.round(minutes)));
  }

  private calculateCoverage(
    originalContent: string,
    chunks: ContentChunk[]
  ): ChunkingResult['coverage'] {
    const originalWords = originalContent.split(/\s+/).length;
    const chunkWords = chunks.reduce((sum, c) => sum + c.wordCount, 0);

    return {
      contentCoverage: Math.min(100, (chunkWords / originalWords) * 100),
      conceptsExtracted: chunks.length,
      objectivesCovered: chunks.map(c => c.mainConcept),
      condensedSections: [],
    };
  }

  // ============================================================================
  // MODULE GENERATION
  // ============================================================================

  /**
   * Generate micro-learning modules from content
   */
  async generateModules(input: GenerateModulesInput): Promise<GenerateModulesResult> {
    this.logger?.info?.('[MicrolearningEngine] Generating modules', {
      contentType: input.contentType,
    });

    // First chunk the content
    const chunks = await this.chunkContent({
      content: input.content,
      contentType: input.contentType,
      targetDuration: this.targetDuration,
      maxDuration: this.maxDuration,
      preserveParagraphs: true,
      includeContext: true,
      sourceContext: input.sourceContext,
    });

    // Convert chunks to modules
    const modules: MicroModule[] = [];

    for (const chunk of chunks.chunks) {
      const microMod = this.createModuleFromChunk(chunk, input);
      modules.push(microMod);
      this.moduleCache.set(microMod.id, microMod);
    }

    // Add practice modules if requested
    if (input.includePractice) {
      const practiceModules = await this.generatePracticeModules(modules);
      modules.push(...practiceModules);
    }

    // Add summary modules if requested
    if (input.includeSummaries && modules.length > 3) {
      const summaryModule = this.createSummaryModule(modules, input);
      modules.push(summaryModule);
    }

    // Calculate distributions
    const bloomsDistribution = this.calculateBloomsDistribution(modules);
    const typeDistribution = this.calculateTypeDistribution(modules);

    // Generate schedule suggestion
    const suggestedSchedule = this.generateScheduleSuggestion(modules);

    return {
      modules,
      totalModules: modules.length,
      totalDurationMinutes: modules.reduce((sum, m) => sum + m.durationMinutes, 0),
      bloomsDistribution,
      typeDistribution,
      suggestedSchedule,
    };
  }

  private createModuleFromChunk(
    chunk: ContentChunk,
    input: GenerateModulesInput
  ): MicroModule {
    const id = `module-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const content: MicroModuleContent = {
      primary: {
        format: 'MARKDOWN',
        content: chunk.content,
        estimatedTimeSeconds: chunk.durationMinutes * 60,
        wordCount: chunk.wordCount,
        characterCount: chunk.content.length,
      },
      keyTakeaways: this.extractKeyTakeaways(chunk.content),
      summary: this.generateQuickSummary(chunk.content),
    };

    return {
      id,
      title: chunk.title,
      description: chunk.mainConcept,
      type: chunk.suggestedType,
      durationMinutes: chunk.durationMinutes,
      bloomsLevel: chunk.bloomsLevel,
      content,
      learningObjectives: [chunk.mainConcept],
      keywords: chunk.relatedConcepts,
      prerequisites: [],
      sourceContext: input.sourceContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private extractKeyTakeaways(content: string): string[] {
    const takeaways: string[] = [];

    // Look for bullet points
    const bullets = content.match(/^[-*]\s+(.+)$/gm);
    if (bullets) {
      takeaways.push(...bullets.slice(0, 3).map(b => b.replace(/^[-*]\s+/, '')));
    }

    // Look for numbered items
    const numbered = content.match(/^\d+\.\s+(.+)$/gm);
    if (numbered) {
      takeaways.push(...numbered.slice(0, 3).map(n => n.replace(/^\d+\.\s+/, '')));
    }

    // If no lists, extract key sentences
    if (takeaways.length === 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      takeaways.push(...sentences.slice(0, 3).map(s => s.trim()));
    }

    return takeaways.slice(0, 3);
  }

  private generateQuickSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstTwo = sentences.slice(0, 2).join('. ');
    return firstTwo.length > 200 ? firstTwo.slice(0, 197) + '...' : firstTwo + '.';
  }

  private async generatePracticeModules(modules: MicroModule[]): Promise<MicroModule[]> {
    const practiceModules: MicroModule[] = [];

    // Generate one practice module for every 3-4 concept modules
    const conceptModules = modules.filter(m => m.type === 'CONCEPT');

    for (let i = 0; i < conceptModules.length; i += 3) {
      const relatedModules = conceptModules.slice(i, Math.min(i + 3, conceptModules.length));

      const practiceModule: MicroModule = {
        id: `practice-${Date.now()}-${i}`,
        title: `Practice: ${relatedModules.map(m => m.title).join(' & ')}`,
        description: 'Apply what you learned',
        type: 'PRACTICE',
        durationMinutes: 3,
        bloomsLevel: 'APPLY',
        content: {
          primary: {
            format: 'MARKDOWN',
            content: this.generatePracticeContent(relatedModules),
            estimatedTimeSeconds: 180,
          },
          keyTakeaways: ['Practice applying concepts', 'Test your understanding'],
          interactions: this.generatePracticeInteractions(relatedModules),
        },
        learningObjectives: relatedModules.map(m => m.description),
        keywords: relatedModules.flatMap(m => m.keywords),
        prerequisites: relatedModules.map(m => m.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      practiceModules.push(practiceModule);
      this.moduleCache.set(practiceModule.id, practiceModule);
    }

    return practiceModules;
  }

  private generatePracticeContent(modules: MicroModule[]): string {
    const concepts = modules.map(m => m.description).join(', ');
    return `## Practice Exercise\n\nApply your knowledge of: ${concepts}\n\nComplete the following quick exercises to reinforce your learning.`;
  }

  private generatePracticeInteractions(modules: MicroModule[]): MicroModuleContent['interactions'] {
    return modules.map((m, i) => ({
      type: 'QUIZ_QUESTION' as const,
      id: `q-${i}`,
      prompt: `What is the key concept of "${m.title}"?`,
      options: [
        m.description,
        'Not applicable',
        'None of the above',
      ],
      correctAnswer: m.description,
      explanation: `The key concept is: ${m.description}`,
    }));
  }

  private createSummaryModule(
    modules: MicroModule[],
    input: GenerateModulesInput
  ): MicroModule {
    const allConcepts = modules.map(m => m.description);
    const allKeyTakeaways = modules.flatMap(m => m.content.keyTakeaways);

    return {
      id: `summary-${Date.now()}`,
      title: 'Summary: Key Concepts',
      description: 'Review of all concepts covered',
      type: 'SUMMARY',
      durationMinutes: 2,
      bloomsLevel: 'REMEMBER',
      content: {
        primary: {
          format: 'MARKDOWN',
          content: `## Summary\n\n### Key Concepts\n${allConcepts.map(c => `- ${c}`).join('\n')}\n\n### Key Takeaways\n${allKeyTakeaways.slice(0, 5).map(t => `- ${t}`).join('\n')}`,
          estimatedTimeSeconds: 120,
        },
        keyTakeaways: allKeyTakeaways.slice(0, 5),
      },
      learningObjectives: ['Review all concepts', 'Consolidate learning'],
      keywords: modules.flatMap(m => m.keywords).slice(0, 10),
      prerequisites: modules.map(m => m.id),
      sourceContext: input.sourceContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private calculateBloomsDistribution(modules: MicroModule[]): Record<BloomsLevel, number> {
    const distribution: Record<BloomsLevel, number> = {
      REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
    };

    for (const microMod of modules) {
      distribution[microMod.bloomsLevel]++;
    }

    return distribution;
  }

  private calculateTypeDistribution(modules: MicroModule[]): Record<MicroModuleType, number> {
    const distribution: Record<MicroModuleType, number> = {
      CONCEPT: 0, PRACTICE: 0, QUIZ: 0, FLASHCARD: 0,
      VIDEO_SNIPPET: 0, INTERACTIVE: 0, SUMMARY: 0, REFLECTION: 0,
    };

    for (const microMod of modules) {
      distribution[microMod.type]++;
    }

    return distribution;
  }

  private generateScheduleSuggestion(modules: MicroModule[]): ScheduleSuggestion {
    const totalDuration = modules.reduce((sum, m) => sum + m.durationMinutes, 0);
    const modulesPerDay = 3; // Optimal for retention
    const totalDays = Math.ceil(modules.length / modulesPerDay);

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + totalDays);

    return {
      type: this.defaultScheduleType,
      totalDays,
      modulesPerDay,
      estimatedCompletionDate: completionDate,
      rationale: `${modulesPerDay} modules/day is optimal for retention. Total: ${totalDuration} minutes over ${totalDays} days.`,
    };
  }

  // ============================================================================
  // DELIVERY SCHEDULING
  // ============================================================================

  /**
   * Create a delivery schedule for modules
   */
  createSchedule(
    userId: string,
    modules: MicroModule[],
    preferences: Partial<DeliveryPreferences>,
    courseId?: string
  ): DeliverySchedule {
    this.logger?.info?.('[MicrolearningEngine] Creating schedule', {
      userId,
      moduleCount: modules.length,
    });

    const fullPreferences: DeliveryPreferences = {
      preferredHours: preferences.preferredHours ?? [9, 12, 18],
      preferredDays: preferences.preferredDays ?? [1, 2, 3, 4, 5],
      maxModulesPerDay: preferences.maxModulesPerDay ?? 3,
      minGapMinutes: preferences.minGapMinutes ?? 60,
      preferredDevice: preferences.preferredDevice ?? 'MOBILE',
      enableNotifications: preferences.enableNotifications ?? true,
      notificationChannels: preferences.notificationChannels ?? ['PUSH'],
      timezone: preferences.timezone ?? 'UTC',
    };

    const scheduledModules = this.scheduleModules(modules, fullPreferences);

    const schedule: DeliverySchedule = {
      id: `schedule-${userId}-${Date.now()}`,
      userId,
      courseId,
      type: this.defaultScheduleType,
      modules: scheduledModules,
      preferences: fullPreferences,
      currentPosition: 0,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduleCache.set(schedule.id, schedule);
    return schedule;
  }

  private scheduleModules(
    modules: MicroModule[],
    preferences: DeliveryPreferences
  ): ScheduledModule[] {
    const scheduled: ScheduledModule[] = [];
    const now = new Date();
    let currentDate = new Date(now);
    let modulesScheduledToday = 0;

    for (const microMod of modules) {
      // Find next available slot
      while (
        !preferences.preferredDays.includes(currentDate.getDay()) ||
        modulesScheduledToday >= preferences.maxModulesPerDay
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(preferences.preferredHours[0], 0, 0, 0);
        modulesScheduledToday = 0;
      }

      // Set time based on slot index
      const hourIndex = modulesScheduledToday % preferences.preferredHours.length;
      currentDate.setHours(preferences.preferredHours[hourIndex], 0, 0, 0);

      scheduled.push({
        moduleId: microMod.id,
        scheduledAt: new Date(currentDate),
        status: 'NOT_STARTED',
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
      });

      modulesScheduledToday++;

      // Add gap for next module
      currentDate.setMinutes(currentDate.getMinutes() + preferences.minGapMinutes);
    }

    return scheduled;
  }

  // ============================================================================
  // LEARNING SESSIONS
  // ============================================================================

  /**
   * Create a learning session
   */
  async createSession(input: CreateSessionInput): Promise<MicrolearningSession> {
    this.logger?.info?.('[MicrolearningEngine] Creating session', {
      userId: input.userId,
    });

    // Get modules for session
    let availableModules = Array.from(this.moduleCache.values());

    // Filter by course if specified
    if (input.courseId) {
      availableModules = availableModules.filter(
        m => m.sourceContext?.courseId === input.courseId
      );
    }

    // Filter by type if specified
    if (input.moduleTypes && input.moduleTypes.length > 0) {
      availableModules = availableModules.filter(
        m => input.moduleTypes!.includes(m.type)
      );
    }

    // Filter by concepts if specified
    if (input.focusConcepts && input.focusConcepts.length > 0) {
      availableModules = availableModules.filter(
        m => input.focusConcepts!.some(c =>
          m.keywords.includes(c) || m.description.includes(c)
        )
      );
    }

    // Select modules for session based on duration
    const maxDuration = input.maxDuration ?? 15;
    const sessionModules: SessionModule[] = [];
    let totalDuration = 0;

    for (const microMod of availableModules) {
      if (totalDuration + microMod.durationMinutes <= maxDuration) {
        sessionModules.push({
          module: microMod,
          position: sessionModules.length,
          status: 'NOT_STARTED',
        });
        totalDuration += microMod.durationMinutes;
      }
    }

    // Add review modules if requested
    if (input.includeReview) {
      const reviewModules = await this.getModulesNeedingReview(input.userId);
      for (const reviewMod of reviewModules.slice(0, 2)) {
        if (totalDuration + reviewMod.durationMinutes <= maxDuration) {
          sessionModules.push({
            module: reviewMod,
            position: sessionModules.length,
            status: 'NOT_STARTED',
          });
          totalDuration += reviewMod.durationMinutes;
        }
      }
    }

    const session: MicrolearningSession = {
      id: `session-${input.userId}-${Date.now()}`,
      userId: input.userId,
      modules: sessionModules,
      durationLimit: maxDuration,
      deviceType: input.deviceType ?? 'MOBILE',
      status: 'ACTIVE',
      startedAt: new Date(),
      performance: {
        modulesCompleted: 0,
        totalModules: sessionModules.length,
        averageScore: 0,
        totalTimeSeconds: 0,
        engagementScore: 0,
        conceptsMastered: [],
        conceptsNeedingReview: [],
      },
    };

    this.sessionCache.set(session.id, session);
    return session;
  }

  private async getModulesNeedingReview(userId: string): Promise<MicroModule[]> {
    const userProgress = this.progressCache.get(userId);
    if (!userProgress) return [];

    const needsReview: MicroModule[] = [];

    for (const [moduleId, progress] of userProgress) {
      if (
        progress.status === 'NEEDS_REVIEW' ||
        (progress.scheduledAt && progress.scheduledAt <= new Date() && progress.status !== 'COMPLETED')
      ) {
        const cachedMod = this.moduleCache.get(moduleId);
        if (cachedMod) {
          needsReview.push(cachedMod);
        }
      }
    }

    return needsReview;
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  /**
   * Update progress for a module
   */
  async updateProgress(input: UpdateProgressInput): Promise<MicrolearningSRResult | null> {
    this.logger?.info?.('[MicrolearningEngine] Updating progress', {
      userId: input.userId,
      moduleId: input.moduleId,
    });

    // Get or create user progress map
    let userProgress = this.progressCache.get(input.userId);
    if (!userProgress) {
      userProgress = new Map();
      this.progressCache.set(input.userId, userProgress);
    }

    // Get existing progress or create new
    let progress = userProgress.get(input.moduleId);
    if (!progress) {
      progress = {
        moduleId: input.moduleId,
        scheduledAt: new Date(),
        status: input.status,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
      };
    }

    progress.status = input.status;

    if (input.status === 'COMPLETED') {
      progress.completedAt = new Date();
      progress.performance = {
        score: input.score ?? 0,
        timeSpentSeconds: input.timeSpentSeconds ?? 0,
        attempts: (progress.performance?.attempts ?? 0) + 1,
        interactionsCompleted: 0,
      };

      // Calculate spaced repetition if self-assessment provided
      if (input.selfAssessment) {
        const srResult = this.calculateSpacedRepetition({
          moduleId: input.moduleId,
          userId: input.userId,
          quality: input.selfAssessment,
          responseTimeSeconds: input.timeSpentSeconds ?? 0,
        }, progress);

        progress.interval = srResult.intervalDays;
        progress.easeFactor = srResult.easeFactor;
        progress.repetitions = srResult.repetitions;

        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + srResult.intervalDays);
        progress.scheduledAt = nextReview;

        userProgress.set(input.moduleId, progress);
        return srResult;
      }
    }

    userProgress.set(input.moduleId, progress);
    return null;
  }

  private calculateSpacedRepetition(
    input: SpacedRepetitionUpdate,
    progress: ScheduledModule
  ): MicrolearningSRResult {
    const config = this.spacedRepetitionConfig;

    let easeFactor = progress.easeFactor ?? 2.5;
    let interval = progress.interval ?? 1;
    let repetitions = progress.repetitions ?? 0;

    // SM-2 algorithm
    if (input.quality < 3) {
      // Failed - reset
      repetitions = 0;
      interval = config.learningSteps[0] / (24 * 60); // Convert minutes to days
    } else {
      // Successful recall
      if (repetitions === 0) {
        interval = config.learningSteps[0] / (24 * 60);
      } else if (repetitions === 1) {
        interval = config.graduatingInterval;
      } else {
        interval = Math.min(
          config.maxInterval,
          Math.round(interval * easeFactor * config.intervalModifier)
        );
      }
      repetitions++;
    }

    // Update ease factor
    easeFactor = Math.max(
      config.minEaseFactor,
      easeFactor + (0.1 - (5 - input.quality) * (0.08 + (5 - input.quality) * 0.02))
    );

    // Apply easy bonus
    if (input.quality === 5) {
      interval = Math.round(interval * config.easyBonus);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Predict retention based on interval
    const predictedRetention = Math.exp(-interval / (easeFactor * 10)) * 100;

    return {
      moduleId: input.moduleId,
      nextReviewDate,
      intervalDays: interval,
      easeFactor,
      repetitions,
      predictedRetention: Math.round(predictedRetention),
      isGraduated: repetitions >= 2,
    };
  }

  // ============================================================================
  // MOBILE OPTIMIZATION
  // ============================================================================

  /**
   * Optimize content for mobile devices
   */
  optimizeForMobile(input: MobileOptimizationInput): MobileOptimizedContent {
    this.logger?.info?.('[MicrolearningEngine] Optimizing for mobile', {
      moduleId: input.content.id,
      deviceType: input.deviceType,
    });

    const contentMod = input.content;
    const screenWidth = input.screenWidth ?? 375; // iPhone default

    // Create mobile-optimized content block
    const mobileContent = this.createMobileContent(
      contentMod.content.primary,
      input.networkCondition ?? 'FAST',
      input.readingSpeed ?? 'NORMAL'
    );

    // Create swipeable cards
    const cards = this.createMobileCards(contentMod, screenWidth);

    // Create progressive loading chunks
    const loadingChunks = this.createLoadingChunks(mobileContent.content);

    // Optimize media
    const optimizedMedia = this.optimizeMedia(
      contentMod.content.media ?? [],
      input.networkCondition ?? 'FAST'
    );

    // Calculate data size
    const dataSizeKB = this.calculateDataSize(mobileContent, optimizedMedia);

    return {
      moduleId: contentMod.id,
      deviceType: input.deviceType,
      content: mobileContent,
      media: optimizedMedia,
      offlineContent: input.networkCondition === 'OFFLINE' ? mobileContent : undefined,
      dataSizeKB,
      cards,
      loadingChunks,
    };
  }

  private createMobileContent(
    content: ContentBlock,
    networkCondition: string,
    readingSpeed: string
  ): ContentBlock {
    let text = content.content;

    // Simplify for mobile
    if (content.wordCount && content.wordCount > MOBILE_MAX_WORDS) {
      // Truncate while preserving meaning
      const sentences = text.split(/[.!?]+/);
      let words = 0;
      const mobileText: string[] = [];

      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        if (words + sentenceWords <= MOBILE_MAX_WORDS) {
          mobileText.push(sentence.trim());
          words += sentenceWords;
        } else {
          break;
        }
      }

      text = mobileText.join('. ') + '.';
    }

    // Adjust for reading speed
    const speedMultiplier = readingSpeed === 'SLOW' ? 1.5 : readingSpeed === 'FAST' ? 0.75 : 1;
    const estimatedTime = Math.round(
      (text.split(/\s+/).length / WORDS_PER_MINUTE) * 60 * speedMultiplier
    );

    return {
      format: 'MARKDOWN',
      content: text,
      estimatedTimeSeconds: estimatedTime,
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
    };
  }

  private createMobileCards(module: MicroModule, screenWidth: number): MobileCard[] {
    const cards: MobileCard[] = [];
    const content = module.content.primary.content;

    // Title card
    cards.push({
      id: `card-0`,
      position: 0,
      type: 'CONTENT',
      content: `# ${module.title}\n\n${module.description}`,
    });

    // Content cards (split by paragraphs)
    const paragraphs = content.split(/\n\n+/);
    paragraphs.forEach((para, i) => {
      if (para.trim()) {
        cards.push({
          id: `card-${i + 1}`,
          position: i + 1,
          type: 'CONTENT',
          content: para.trim(),
        });
      }
    });

    // Key takeaways card
    if (module.content.keyTakeaways.length > 0) {
      cards.push({
        id: `card-takeaways`,
        position: cards.length,
        type: 'SUMMARY',
        content: `## Key Takeaways\n\n${module.content.keyTakeaways.map(t => `• ${t}`).join('\n')}`,
      });
    }

    // Question card if interactions exist
    if (module.content.interactions && module.content.interactions.length > 0) {
      const interaction = module.content.interactions[0];
      cards.push({
        id: `card-quiz`,
        position: cards.length,
        type: 'QUESTION',
        content: interaction.prompt,
        action: {
          label: 'Check Answer',
          type: 'QUIZ',
        },
      });
    }

    // Action card
    cards.push({
      id: `card-action`,
      position: cards.length,
      type: 'ACTION',
      content: 'Ready for the next module?',
      action: {
        label: 'Continue',
        type: 'NEXT',
      },
    });

    return cards;
  }

  private createLoadingChunks(content: string): MobileOptimizedContent['loadingChunks'] {
    const chunks: MobileOptimizedContent['loadingChunks'] = [];
    const paragraphs = content.split(/\n\n+/);

    paragraphs.forEach((para, i) => {
      chunks.push({
        position: i,
        content: para,
        priority: i < 2 ? 1 : i < 5 ? 2 : 3,
        sizeBytes: new Blob([para]).size,
      });
    });

    return chunks;
  }

  private optimizeMedia(
    media: MicroModuleContent['media'],
    networkCondition: string
  ): MicroModuleContent['media'] {
    if (!media) return [];

    return media.map(m => ({
      ...m,
      // Use thumbnail for slow connections
      url: networkCondition === 'SLOW' && m.thumbnailUrl ? m.thumbnailUrl : m.url,
    }));
  }

  private calculateDataSize(
    content: ContentBlock,
    media?: MicroModuleContent['media']
  ): number {
    let size = new Blob([content.content]).size / 1024; // KB

    if (media) {
      // Estimate media size (rough)
      size += media.length * 50; // Assume 50KB per media item
    }

    return Math.round(size);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get analytics for a user
   */
  async getAnalytics(input: GetAnalyticsInput): Promise<MicrolearningAnalytics> {
    this.logger?.info?.('[MicrolearningEngine] Getting analytics', {
      userId: input.userId,
    });

    const userProgress = this.progressCache.get(input.userId);
    const completedModules = userProgress
      ? Array.from(userProgress.values()).filter(p => p.status === 'COMPLETED')
      : [];

    const overall = this.calculateOverallStats(completedModules);
    const streak = this.calculateStreakStats(completedModules);
    const patterns = this.analyzeLearningPatterns(completedModules);
    const moduleBreakdown = this.calculateModuleBreakdown(completedModules);

    const recommendations = input.includeRecommendations
      ? this.generateRecommendations(overall, streak, patterns)
      : [];

    return {
      userId: input.userId,
      courseId: input.courseId,
      overall,
      streak,
      patterns,
      moduleBreakdown,
      recommendations,
    };
  }

  private calculateOverallStats(progress: ScheduledModule[]): OverallStats {
    if (progress.length === 0) {
      return {
        totalModulesCompleted: 0,
        totalTimeSpentMinutes: 0,
        averageSessionDuration: 0,
        averageScore: 0,
        conceptsMastered: 0,
        retentionRate: 0,
        completionRate: 0,
      };
    }

    const totalTime = progress.reduce(
      (sum, p) => sum + (p.performance?.timeSpentSeconds ?? 0),
      0
    ) / 60;

    const scores = progress
      .map(p => p.performance?.score ?? 0)
      .filter(s => s > 0);

    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;

    return {
      totalModulesCompleted: progress.length,
      totalTimeSpentMinutes: Math.round(totalTime),
      averageSessionDuration: Math.round(totalTime / Math.max(1, progress.length)),
      averageScore: Math.round(avgScore),
      conceptsMastered: progress.filter(p => (p.performance?.score ?? 0) >= 80).length,
      retentionRate: Math.round(avgScore * 0.9), // Simplified retention estimate
      completionRate: 100, // These are all completed
    };
  }

  private calculateStreakStats(progress: ScheduledModule[]): StreakStats {
    if (progress.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date(),
        streakFreezes: 0,
      };
    }

    // Sort by completion date
    const sorted = progress
      .filter(p => p.completedAt)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime());

    const lastActivity = sorted[0]?.completedAt ?? new Date();

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const p of sorted) {
      if (!p.completedAt) continue;

      const date = new Date(p.completedAt);
      date.setHours(0, 0, 0, 0);

      if (!prevDate) {
        tempStreak = 1;
      } else {
        const dayDiff = Math.round(
          (prevDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Check if current streak is active
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const daysSinceLastActivity = Math.round(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    currentStreak = daysSinceLastActivity <= 1 ? tempStreak : 0;

    return {
      currentStreak,
      longestStreak,
      lastActivityDate: lastActivity,
      streakFreezes: 0,
    };
  }

  private analyzeLearningPatterns(progress: ScheduledModule[]): LearningPatterns {
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<number, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const p of progress) {
      if (p.completedAt) {
        const hour = p.completedAt.getHours();
        const day = p.completedAt.getDay();

        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
        dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      }

      const cachedMod = this.moduleCache.get(p.moduleId);
      if (cachedMod) {
        typeCounts[cachedMod.type] = (typeCounts[cachedMod.type] ?? 0) + 1;
      }
    }

    // Find peak hours and days
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => parseInt(h));

    const peakDays = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => parseInt(d));

    const preferredTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t as MicroModuleType);

    return {
      peakHours: peakHours.length > 0 ? peakHours : [9, 12, 18],
      peakDays: peakDays.length > 0 ? peakDays : [1, 2, 3, 4, 5],
      avgModulesPerDay: progress.length / Math.max(1, this.getUniqueDays(progress)),
      preferredSessionLength: 15,
      preferredTypes: preferredTypes.length > 0 ? preferredTypes : ['CONCEPT'],
      strongBloomsLevels: ['UNDERSTAND', 'APPLY'],
      weakBloomsLevels: ['ANALYZE', 'EVALUATE'],
    };
  }

  private getUniqueDays(progress: ScheduledModule[]): number {
    const days = new Set<string>();

    for (const p of progress) {
      if (p.completedAt) {
        const date = p.completedAt.toISOString().split('T')[0];
        days.add(date);
      }
    }

    return days.size;
  }

  private calculateModuleBreakdown(progress: ScheduledModule[]): ModuleBreakdown[] {
    const breakdown: Record<string, ModuleBreakdown> = {};

    for (const p of progress) {
      const cachedMod = this.moduleCache.get(p.moduleId);
      if (!cachedMod) continue;

      if (!breakdown[cachedMod.type]) {
        breakdown[cachedMod.type] = {
          type: cachedMod.type,
          count: 0,
          completionRate: 100,
          averageScore: 0,
          averageTimeMinutes: 0,
        };
      }

      breakdown[cachedMod.type].count++;
      if (p.performance) {
        breakdown[cachedMod.type].averageScore += p.performance.score;
        breakdown[cachedMod.type].averageTimeMinutes += p.performance.timeSpentSeconds / 60;
      }
    }

    // Calculate averages
    for (const type of Object.keys(breakdown)) {
      const count = breakdown[type].count;
      if (count > 0) {
        breakdown[type].averageScore = Math.round(breakdown[type].averageScore / count);
        breakdown[type].averageTimeMinutes = Math.round(breakdown[type].averageTimeMinutes / count);
      }
    }

    return Object.values(breakdown);
  }

  private generateRecommendations(
    overall: OverallStats,
    streak: StreakStats,
    patterns: LearningPatterns
  ): MicrolearningRecommendation[] {
    const recommendations: MicrolearningRecommendation[] = [];

    // Streak recommendation
    if (streak.currentStreak === 0) {
      recommendations.push({
        type: 'STREAK',
        priority: 'high',
        title: 'Resume Your Learning Streak',
        description: `Your last activity was ${Math.round((Date.now() - streak.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))} days ago. Complete a module today to start a new streak!`,
        action: {
          type: 'START_SESSION',
          label: 'Start Learning',
        },
      });
    } else if (streak.currentStreak >= 3) {
      recommendations.push({
        type: 'STREAK',
        priority: 'low',
        title: `${streak.currentStreak} Day Streak!`,
        description: `Keep going! You're on a ${streak.currentStreak}-day streak.`,
      });
    }

    // Score recommendation
    if (overall.averageScore < 70) {
      recommendations.push({
        type: 'REVIEW',
        priority: 'high',
        title: 'Review Previous Modules',
        description: 'Your average score is below 70%. Consider reviewing past modules to strengthen understanding.',
        action: {
          type: 'START_REVIEW',
          label: 'Start Review',
        },
      });
    }

    // Pace recommendation
    if (patterns.avgModulesPerDay < 1) {
      recommendations.push({
        type: 'PACE',
        priority: 'medium',
        title: 'Increase Your Learning Pace',
        description: 'Completing at least 2-3 modules daily leads to better retention.',
      });
    }

    // Content recommendation
    if (patterns.preferredTypes.length === 1) {
      recommendations.push({
        type: 'CONTENT',
        priority: 'low',
        title: 'Try Different Module Types',
        description: 'Varying your learning activities can improve engagement and retention.',
      });
    }

    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get a module by ID
   */
  getModule(moduleId: string): MicroModule | undefined {
    return this.moduleCache.get(moduleId);
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(scheduleId: string): DeliverySchedule | undefined {
    return this.scheduleCache.get(scheduleId);
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): MicrolearningSession | undefined {
    return this.sessionCache.get(sessionId);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.moduleCache.clear();
    this.scheduleCache.clear();
    this.sessionCache.clear();
    this.progressCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createMicrolearningEngine(
  config: MicrolearningEngineConfig
): MicrolearningEngine {
  return new MicrolearningEngine(config);
}
