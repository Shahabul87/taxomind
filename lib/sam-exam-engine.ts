import { db } from '@/lib/db';
import { BloomsLevel, QuestionType, QuestionDifficulty, Prisma } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ExamGenerationConfig {
  totalQuestions: number;
  duration: number;
  bloomsDistribution: {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
  };
  difficultyDistribution: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  questionTypes: QuestionType[];
  adaptiveMode: boolean;
}

export interface EnhancedQuestion {
  id: string;
  text: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  options?: string[];
  correctAnswer: any;
  explanation: string;
  hints?: string[];
  timeEstimate: number;
  points: number;
  tags: string[];
  metadata: {
    createdAt: string;
    isAdaptive: boolean;
    learningObjective?: string;
    cognitiveProcess?: string;
  };
}

export interface ExamMetadata {
  totalQuestions: number;
  totalPoints: number;
  estimatedDuration: number;
  bloomsDistribution: Record<BloomsLevel, number>;
  difficultyDistribution: Record<QuestionDifficulty, number>;
  topicsCovered: string[];
  learningObjectives: string[];
}

export interface BloomsComparison {
  target: Record<BloomsLevel, number>;
  actual: Record<BloomsLevel, number>;
  deviation: Record<BloomsLevel, number>;
  alignmentScore: number;
}

export interface AdaptiveSettings {
  startingQuestionDifficulty: QuestionDifficulty;
  adjustmentRules: AdaptiveRule[];
  performanceThresholds: PerformanceThreshold[];
  minQuestions: number;
  maxQuestions: number;
}

export interface AdaptiveRule {
  condition: string;
  action: string;
  threshold: number;
}

export interface PerformanceThreshold {
  level: string;
  minScore: number;
  action: string;
}

export interface ExamGenerationResponse {
  exam: {
    id: string;
    questions: EnhancedQuestion[];
    metadata: ExamMetadata;
  };
  bloomsAnalysis: {
    targetVsActual: BloomsComparison;
    cognitiveProgression: string[];
    skillsCovered: Skill[];
  };
  adaptiveSettings?: AdaptiveSettings;
  studyGuide: {
    focusAreas: string[];
    recommendedResources: Resource[];
    practiceQuestions: EnhancedQuestion[];
  };
}

interface Skill {
  name: string;
  bloomsLevel: BloomsLevel;
  coverage: number;
}

interface Resource {
  type: string;
  title: string;
  url?: string;
  description: string;
  relevance: number;
}

export class AdvancedExamEngine {
  async generateExam(
    courseId: string | null,
    sectionIds: string[] | null,
    config: ExamGenerationConfig,
    studentProfile?: {
      userId: string;
      currentLevel: string;
      learningStyle: string;
    }
  ): Promise<ExamGenerationResponse> {
    // Get question bank questions if available
    const existingQuestions = await this.getQuestionBankQuestions(courseId, sectionIds);
    
    // Analyze student performance if profile provided
    const studentAnalysis = studentProfile 
      ? await this.analyzeStudentPerformance(studentProfile.userId, courseId)
      : null;

    // Generate questions based on config
    const questions = await this.generateQuestions(
      courseId,
      sectionIds,
      config,
      existingQuestions,
      studentAnalysis
    );

    // Create exam record
    const exam = await this.createExamRecord(courseId, sectionIds?.[0], config, questions);

    // Perform Bloom's analysis
    const bloomsAnalysis = this.analyzeBloomsAlignment(questions, config.bloomsDistribution);

    // Generate adaptive settings if enabled
    const adaptiveSettings = config.adaptiveMode 
      ? this.generateAdaptiveSettings(studentAnalysis, config)
      : undefined;

    // Create study guide
    const studyGuide = await this.generateStudyGuide(questions, studentAnalysis);

    return {
      exam: {
        id: exam.id,
        questions,
        metadata: this.generateMetadata(questions, config),
      },
      bloomsAnalysis,
      adaptiveSettings,
      studyGuide,
    };
  }

  private async getQuestionBankQuestions(
    courseId: string | null,
    sectionIds: string[] | null
  ): Promise<any[]> {
    const where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (sectionIds && sectionIds.length > 0) {
      // Get topics from sections
      const sections = await db.section.findMany({
        where: { id: { in: sectionIds } },
        select: { title: true },
      });
      
      where.topic = {
        in: sections.map(s => s.title),
      };
    }

    return db.questionBank.findMany({
      where,
      orderBy: [
        { usageCount: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  private async analyzeStudentPerformance(
    userId: string,
    courseId: string | null
  ): Promise<any> {
    const progress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId } as any,
      },
    });

    const cognitiveProfile = await db.studentCognitiveProfile.findUnique({
      where: { userId },
    });

    return {
      bloomsScores: progress?.bloomsScores || {},
      strengthAreas: progress?.strengthAreas || [],
      weaknessAreas: progress?.weaknessAreas || [],
      optimalLearningStyle: cognitiveProfile?.optimalLearningStyle || 'mixed',
      overallLevel: cognitiveProfile?.overallCognitiveLevel || 50,
    };
  }

  private async generateQuestions(
    courseId: string | null,
    sectionIds: string[] | null,
    config: ExamGenerationConfig,
    existingQuestions: any[],
    studentAnalysis: any
  ): Promise<EnhancedQuestion[]> {
    const questions: EnhancedQuestion[] = [];
    const questionsNeeded = config.totalQuestions;
    
    // First, try to use questions from question bank
    const bankQuestions = this.selectFromQuestionBank(
      existingQuestions,
      config,
      studentAnalysis
    );
    
    questions.push(...bankQuestions);
    
    // Generate remaining questions with AI
    const remainingCount = questionsNeeded - questions.length;
    if (remainingCount > 0) {
      const aiQuestions = await this.generateAIQuestions(
        courseId,
        sectionIds,
        remainingCount,
        config,
        studentAnalysis,
        questions
      );
      questions.push(...aiQuestions);
    }

    // Ensure proper distribution
    return this.balanceQuestionDistribution(questions, config);
  }

  private selectFromQuestionBank(
    bankQuestions: any[],
    config: ExamGenerationConfig,
    studentAnalysis: any
  ): EnhancedQuestion[] {
    const selected: EnhancedQuestion[] = [];
    const targetCount = Math.min(
      Math.floor(config.totalQuestions * 0.6), // Use up to 60% from bank
      bankQuestions.length
    );

    // Sort questions by relevance and usage
    const sortedQuestions = bankQuestions.sort((a, b) => {
      // Prioritize less used questions
      const usageDiff = a.usageCount - b.usageCount;
      if (usageDiff !== 0) return usageDiff;
      
      // Then by student's weak areas
      if (studentAnalysis?.weaknessAreas?.includes(a.bloomsLevel)) return -1;
      if (studentAnalysis?.weaknessAreas?.includes(b.bloomsLevel)) return 1;
      
      return 0;
    });

    // Select questions matching distribution
    for (const question of sortedQuestions) {
      if (selected.length >= targetCount) break;
      
      const bloomsCount = selected.filter(q => q.bloomsLevel === question.bloomsLevel).length;
      const targetBloomsCount = Math.ceil(
        (config.bloomsDistribution[(question.bloomsLevel as BloomsLevel)] / 100) * config.totalQuestions
      );
      
      if (bloomsCount < targetBloomsCount) {
        selected.push(this.convertBankQuestion(question));
      }
    }

    return selected;
  }

  private convertBankQuestion(bankQuestion: any): EnhancedQuestion {
    return {
      id: bankQuestion.id,
      text: bankQuestion.question,
      questionType: bankQuestion.questionType,
      bloomsLevel: bankQuestion.bloomsLevel,
      difficulty: bankQuestion.difficulty,
      options: bankQuestion.options as string[] || [],
      correctAnswer: bankQuestion.correctAnswer,
      explanation: bankQuestion.explanation,
      hints: bankQuestion.hints as string[] || [],
      timeEstimate: bankQuestion.avgTimeSpent || 120,
      points: this.calculatePoints(bankQuestion.difficulty, bankQuestion.bloomsLevel),
      tags: bankQuestion.tags,
      metadata: {
        createdAt: bankQuestion.createdAt.toISOString(),
        isAdaptive: false,
        learningObjective: bankQuestion.metadata?.learningObjective,
        cognitiveProcess: this.mapBloomsToCognitiveProcess(bankQuestion.bloomsLevel),
      },
    };
  }

  private calculatePoints(difficulty: QuestionDifficulty, bloomsLevel: BloomsLevel): number {
    const difficultyPoints = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    };
    
    const bloomsMultiplier = {
      REMEMBER: 1,
      UNDERSTAND: 1.2,
      APPLY: 1.5,
      ANALYZE: 1.8,
      EVALUATE: 2,
      CREATE: 2.5,
    };
    
    return Math.round(difficultyPoints[difficulty as keyof typeof difficultyPoints] * bloomsMultiplier[bloomsLevel]);
  }

  private mapBloomsToCognitiveProcess(level: BloomsLevel): string {
    const mapping = {
      REMEMBER: 'Recall and Recognition',
      UNDERSTAND: 'Interpretation and Explanation',
      APPLY: 'Implementation and Execution',
      ANALYZE: 'Differentiation and Organization',
      EVALUATE: 'Checking and Critiquing',
      CREATE: 'Generating and Planning',
    };
    
    return mapping[level];
  }

  private async generateAIQuestions(
    courseId: string | null,
    sectionIds: string[] | null,
    count: number,
    config: ExamGenerationConfig,
    studentAnalysis: any,
    existingQuestions: EnhancedQuestion[]
  ): Promise<EnhancedQuestion[]> {
    const courseContext = await this.getCourseContext(courseId, sectionIds);
    
    const systemPrompt = `You are SAM, an expert educational assessment designer specializing in creating questions aligned with Bloom's Taxonomy. Generate exam questions that accurately assess different cognitive levels.

**Course Context:**
${courseContext}

**Exam Configuration:**
- Total Questions Needed: ${count}
- Question Types: ${config.questionTypes.join(', ')}
- Bloom's Distribution: ${JSON.stringify(config.bloomsDistribution)}
- QuestionDifficulty Distribution: ${JSON.stringify(config.difficultyDistribution)}
- Adaptive Mode: ${config.adaptiveMode}

**Student Profile:**
${studentAnalysis ? `
- Overall Level: ${studentAnalysis.overallLevel}%
- Strength Areas: ${studentAnalysis.strengthAreas.join(', ')}
- Weakness Areas: ${studentAnalysis.weaknessAreas.join(', ')}
- Learning Style: ${studentAnalysis.optimalLearningStyle}
` : 'No specific student profile'}

**Existing Questions Topics (to avoid duplication):**
${existingQuestions.slice(0, 5).map(q => q.text.substring(0, 50) + '...').join('\n')}

**Requirements:**
1. Each question must clearly target a specific Bloom's level
2. Include clear, unambiguous language
3. Provide plausible distractors for multiple choice
4. Include detailed explanations for each answer
5. Add helpful hints for struggling students
6. Ensure questions are fair and unbiased
7. Cover different aspects of the course content

Generate ${count} questions following the distribution requirements.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Generate ${count} exam questions with the specified requirements.` }
      ],
    });

    const aiResponse = response.content[0];
    const questionsText = aiResponse.type === 'text' ? aiResponse.text : '';

    return this.parseAIQuestions(questionsText, config);
  }

  private async getCourseContext(
    courseId: string | null,
    sectionIds: string[] | null
  ): Promise<string> {
    if (!courseId && !sectionIds) {
      return 'General knowledge assessment';
    }

    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            include: {
              sections: {
                where: sectionIds ? { id: { in: sectionIds } } : undefined,
                select: {
                  title: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (course) {
        return `
course: ${course.title}
Description: ${course.description || 'No description'}
Chapters: ${course.chapters.map(ch => ch.title).join(', ')}
Topics: ${course.chapters.flatMap(ch => ch.sections.map(s => s.title)).join(', ')}
`;
      }
    }

    return 'Course content for assessment';
  }

  private parseAIQuestions(text: string, config: ExamGenerationConfig): EnhancedQuestion[] {
    const questions: EnhancedQuestion[] = [];
    
    // Parse questions from AI response
    const questionBlocks = text.split(/Question \d+:/i).filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const question = this.parseQuestionBlock(block, config);
      if (question) {
        questions.push(question);
      }
    });

    return questions;
  }

  private parseQuestionBlock(block: string, config: ExamGenerationConfig): EnhancedQuestion | null {
    try {
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      const question: EnhancedQuestion = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: '',
        questionType: 'MULTIPLE_CHOICE',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'MEDIUM',
        options: [],
        correctAnswer: '',
        explanation: '',
        hints: [],
        timeEstimate: 120,
        points: 2,
        tags: [],
        metadata: {
          createdAt: new Date().toISOString(),
          isAdaptive: config.adaptiveMode,
          cognitiveProcess: '',
        },
      };

      // Parse question components
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('Text:') || (!question.text && i === 0)) {
          question.text = line.replace('Text:', '').trim();
        } else if (line.startsWith('Type:')) {
          question.questionType = this.parseQuestionType(line);
        } else if (line.startsWith('Bloom')) {
          question.bloomsLevel = this.parseBloomsLevel(line);
        } else if (line.startsWith('QuestionDifficulty:')) {
          question.difficulty = this.parseQuestionDifficulty(line);
        } else if (line.match(/^[A-D]\)/)) {
          question.options?.push(line.substring(2).trim());
        } else if (line.startsWith('Answer:') || line.startsWith('Correct:')) {
          question.correctAnswer = line.replace(/^(Answer:|Correct:)/, '').trim();
        } else if (line.startsWith('Explanation:')) {
          question.explanation = line.replace('Explanation:', '').trim();
        } else if (line.startsWith('Hint:')) {
          question.hints?.push(line.replace('Hint:', '').trim());
        }
      }

      // Set cognitive process
      question.metadata.cognitiveProcess = this.mapBloomsToCognitiveProcess(question.bloomsLevel);
      
      // Calculate points
      question.points = this.calculatePoints(question.difficulty, question.bloomsLevel);

      return question.text ? question : null;
    } catch (error: any) {
      logger.error('Error parsing question block:', error);
      return null;
    }
  }

  private parseQuestionType(line: string): QuestionType {
    const type = line.toLowerCase();
    if (type.includes('choice')) return 'MULTIPLE_CHOICE';
    if (type.includes('true') || type.includes('false')) return 'TRUE_FALSE';
    if (type.includes('fill')) return 'FILL_IN_BLANK';
    if (type.includes('short')) return 'SHORT_ANSWER';
    if (type.includes('essay')) return 'ESSAY';
    return 'MULTIPLE_CHOICE';
  }

  private parseBloomsLevel(line: string): BloomsLevel {
    const upper = line.toUpperCase();
    if (upper.includes('REMEMBER')) return 'REMEMBER';
    if (upper.includes('UNDERSTAND')) return 'UNDERSTAND';
    if (upper.includes('APPLY')) return 'APPLY';
    if (upper.includes('ANALYZE')) return 'ANALYZE';
    if (upper.includes('EVALUATE')) return 'EVALUATE';
    if (upper.includes('CREATE')) return 'CREATE';
    return 'UNDERSTAND';
  }

  private parseQuestionDifficulty(line: string): QuestionDifficulty {
    const upper = line.toUpperCase();
    if (upper.includes('EASY')) return 'EASY';
    if (upper.includes('HARD')) return 'HARD';
    return 'MEDIUM';
  }

  private balanceQuestionDistribution(
    questions: EnhancedQuestion[],
    config: ExamGenerationConfig
  ): EnhancedQuestion[] {
    // Ensure proper Bloom's distribution
    const bloomsCounts: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    questions.forEach(q => {
      bloomsCounts[q.bloomsLevel]++;
    });

    // Calculate target counts
    const targetCounts: Record<BloomsLevel, number> = {} as any;
    Object.entries(config.bloomsDistribution).forEach(([level, percentage]) => {
      targetCounts[level as BloomsLevel] = Math.round((percentage / 100) * config.totalQuestions);
    });

    // Balance if needed
    const balanced: EnhancedQuestion[] = [];
    
    // First pass: add questions up to target
    Object.entries(targetCounts).forEach(([level, target]) => {
      const levelQuestions = questions.filter(q => q.bloomsLevel === level as BloomsLevel);
      balanced.push(...levelQuestions.slice(0, target));
    });

    // Second pass: fill remaining slots
    if (balanced.length < config.totalQuestions) {
      const remaining = questions.filter(q => !balanced.includes(q));
      balanced.push(...remaining.slice(0, config.totalQuestions - balanced.length));
    }

    return balanced.slice(0, config.totalQuestions);
  }

  private async createExamRecord(
    courseId: string | null,
    sectionId: string | undefined,
    config: ExamGenerationConfig,
    questions: EnhancedQuestion[]
  ): Promise<any> {
    // For now, return a mock exam record
    // In production, this would create actual exam records
    return {
      id: `exam_${Date.now()}`,
      title: 'Generated Exam',
      questions: questions.length,
      duration: config.duration,
      adaptiveMode: config.adaptiveMode,
    };
  }

  private analyzeBloomsAlignment(
    questions: EnhancedQuestion[],
    targetDistribution: Record<BloomsLevel, number>
  ): {
    targetVsActual: BloomsComparison;
    cognitiveProgression: string[];
    skillsCovered: Skill[];
  } {
    // Calculate actual distribution
    const actualDistribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    questions.forEach(q => {
      actualDistribution[q.bloomsLevel]++;
    });

    // Convert to percentages
    const total = questions.length;
    Object.keys(actualDistribution).forEach(key => {
      actualDistribution[key as BloomsLevel] = (actualDistribution[key as BloomsLevel] / total) * 100;
    });

    // Calculate deviation
    const deviation: Record<BloomsLevel, number> = {} as any;
    let totalDeviation = 0;
    
    Object.keys(targetDistribution).forEach(key => {
      const diff = actualDistribution[key as BloomsLevel] - targetDistribution[key as BloomsLevel];
      deviation[key as BloomsLevel] = diff;
      totalDeviation += Math.abs(diff);
    });

    const alignmentScore = Math.max(0, 100 - totalDeviation);

    // Analyze cognitive progression
    const cognitiveProgression = this.analyzeCognitiveProgression(questions);

    // Identify skills covered
    const skillsCovered = this.identifySkillsCovered(questions);

    return {
      targetVsActual: {
        target: targetDistribution,
        actual: actualDistribution,
        deviation,
        alignmentScore,
      },
      cognitiveProgression,
      skillsCovered,
    };
  }

  private analyzeCognitiveProgression(questions: EnhancedQuestion[]): string[] {
    const progression: string[] = [];
    
    // Group questions by Bloom's level
    const grouped: Record<BloomsLevel, EnhancedQuestion[]> = {
      REMEMBER: [],
      UNDERSTAND: [],
      APPLY: [],
      ANALYZE: [],
      EVALUATE: [],
      CREATE: [],
    };

    questions.forEach(q => {
      grouped[q.bloomsLevel].push(q);
    });

    // Build progression path
    Object.entries(grouped).forEach(([level, qs]) => {
      if (qs.length > 0) {
        progression.push(
          `${level}: ${qs.length} questions focusing on ${this.mapBloomsToCognitiveProcess(level as BloomsLevel)}`
        );
      }
    });

    return progression;
  }

  private identifySkillsCovered(questions: EnhancedQuestion[]): Skill[] {
    const skills: Map<string, Skill> = new Map();

    questions.forEach(q => {
      const skillName = this.getSkillForBloomsLevel(q.bloomsLevel);
      
      if (skills.has(skillName)) {
        const skill = skills.get(skillName)!;
        skill.coverage++;
      } else {
        skills.set(skillName, {
          name: skillName,
          bloomsLevel: q.bloomsLevel,
          coverage: 1,
        });
      }
    });

    return Array.from(skills.values()).map(skill => ({
      ...skill,
      coverage: (skill.coverage / questions.length) * 100,
    }));
  }

  private getSkillForBloomsLevel(level: BloomsLevel): string {
    const skillMap = {
      REMEMBER: 'Information Recall',
      UNDERSTAND: 'Comprehension',
      APPLY: 'Problem Solving',
      ANALYZE: 'Critical Analysis',
      EVALUATE: 'Judgment & Decision Making',
      CREATE: 'Innovation & Synthesis',
    };

    return skillMap[level];
  }

  private generateAdaptiveSettings(
    studentAnalysis: any,
    config: ExamGenerationConfig
  ): AdaptiveSettings {
    const startingQuestionDifficulty = this.determineStartingQuestionDifficulty(studentAnalysis);

    const adjustmentRules: AdaptiveRule[] = [
      {
        condition: 'consecutive_correct',
        action: 'increase_difficulty',
        threshold: 3,
      },
      {
        condition: 'consecutive_incorrect',
        action: 'decrease_difficulty',
        threshold: 2,
      },
      {
        condition: 'low_confidence',
        action: 'provide_hint',
        threshold: 0.6,
      },
      {
        condition: 'time_exceeded',
        action: 'simplify_next',
        threshold: 1.5,
      },
    ];

    const performanceThresholds: PerformanceThreshold[] = [
      {
        level: 'mastery',
        minScore: 90,
        action: 'advance_to_higher_bloom',
      },
      {
        level: 'proficient',
        minScore: 75,
        action: 'maintain_level',
      },
      {
        level: 'developing',
        minScore: 60,
        action: 'provide_support',
      },
      {
        level: 'struggling',
        minScore: 0,
        action: 'reduce_complexity',
      },
    ];

    return {
      startingQuestionDifficulty,
      adjustmentRules,
      performanceThresholds,
      minQuestions: Math.floor(config.totalQuestions * 0.7),
      maxQuestions: Math.ceil(config.totalQuestions * 1.3),
    };
  }

  private determineStartingQuestionDifficulty(studentAnalysis: any): QuestionDifficulty {
    if (!studentAnalysis) return 'MEDIUM';
    
    const overallLevel = studentAnalysis.overallLevel || 50;
    
    if (overallLevel < 40) return 'EASY';
    if (overallLevel > 70) return 'HARD';
    return 'MEDIUM';
  }

  private async generateStudyGuide(
    questions: EnhancedQuestion[],
    studentAnalysis: any
  ): Promise<{
    focusAreas: string[];
    recommendedResources: Resource[];
    practiceQuestions: EnhancedQuestion[];
  }> {
    // Identify focus areas based on question distribution
    const focusAreas = this.identifyFocusAreas(questions, studentAnalysis);

    // Generate resource recommendations
    const recommendedResources = this.generateResourceRecommendations(focusAreas, questions);

    // Create practice questions for weak areas
    const practiceQuestions = await this.generatePracticeQuestions(
      studentAnalysis?.weaknessAreas || [],
      questions
    );

    return {
      focusAreas,
      recommendedResources,
      practiceQuestions,
    };
  }

  private identifyFocusAreas(questions: EnhancedQuestion[], studentAnalysis: any): string[] {
    const areas: string[] = [];

    // Analyze question distribution
    const topicFrequency: Map<string, number> = new Map();
    
    questions.forEach(q => {
      q.tags.forEach(tag => {
        topicFrequency.set(tag, (topicFrequency.get(tag) || 0) + 1);
      });
    });

    // Top topics
    const sortedTopics = Array.from(topicFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    areas.push(...sortedTopics);

    // Add student's weak areas
    if (studentAnalysis?.weaknessAreas) {
      areas.push(...studentAnalysis.weaknessAreas.map((area: string) => 
        `Improve ${area.toLowerCase()} skills`
      ));
    }

    return [...new Set(areas)];
  }

  private generateResourceRecommendations(
    focusAreas: string[],
    questions: EnhancedQuestion[]
  ): Resource[] {
    const resources: Resource[] = [];

    // Generate resources for each focus area
    focusAreas.forEach(area => {
      resources.push({
        type: 'Study Guide',
        title: `Mastering ${area}`,
        description: `Comprehensive guide covering key concepts in ${area}`,
        relevance: 0.9,
      });

      resources.push({
        type: 'Practice Set',
        title: `${area} Practice Problems`,
        description: `Curated practice problems to strengthen ${area} skills`,
        relevance: 0.85,
      });
    });

    // Add general resources
    resources.push({
      type: 'Video Tutorial',
      title: 'Exam Preparation Strategies',
      description: 'Effective techniques for exam preparation and time management',
      relevance: 0.8,
    });

    return resources;
  }

  private async generatePracticeQuestions(
    weakAreas: string[],
    examQuestions: EnhancedQuestion[]
  ): Promise<EnhancedQuestion[]> {
    // Generate 3-5 practice questions for weak areas
    const practiceQuestions: EnhancedQuestion[] = [];

    weakAreas.forEach((area, index) => {
      const bloomsLevel = area as BloomsLevel;
      
      practiceQuestions.push({
        id: `practice_${index}`,
        text: `Practice question for ${area}: Apply your understanding of ${area.toLowerCase()} concepts.`,
        questionType: 'MULTIPLE_CHOICE',
        bloomsLevel: bloomsLevel || 'UNDERSTAND',
        difficulty: 'EASY',
        options: [
          'Option A',
          'Option B',
          'Option C',
          'Option D',
        ],
        correctAnswer: 'A',
        explanation: `This question helps you practice ${area.toLowerCase()} skills.`,
        hints: [`Think about the key concepts in ${area}`],
        timeEstimate: 90,
        points: 1,
        tags: [area],
        metadata: {
          createdAt: new Date().toISOString(),
          isAdaptive: false,
          learningObjective: `Practice ${area} skills`,
        },
      });
    });

    return practiceQuestions;
  }

  async saveToQuestionBank(
    questions: EnhancedQuestion[],
    courseId: string | null,
    subject: string,
    topic: string
  ): Promise<void> {
    for (const question of questions) {
      await db.questionBank.create({
        data: {
          courseId,
          subject,
          topic,
          subtopic: question.tags[0] || null,
          question: question.text,
          questionType: question.questionType,
          bloomsLevel: question.bloomsLevel,
          difficulty: question.difficulty,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          hints: question.hints || [],
          tags: question.tags,
          metadata: question.metadata,
        },
      });
    }
  }

  async createExamBloomsProfile(
    examId: string,
    questions: EnhancedQuestion[],
    targetDistribution: Record<BloomsLevel, number>
  ): Promise<void> {
    const actualDistribution = this.calculateActualDistribution(questions);
    const difficultyMatrix = this.calculateQuestionDifficultyMatrix(questions);
    const skillsAssessed = this.identifySkillsCovered(questions);
    const coverageMap = this.generateCoverageMap(questions);

    await db.examBloomsProfile.create({
      data: {
        examId,
        targetDistribution,
        actualDistribution,
        difficultyMatrix,
        skillsAssessed: skillsAssessed as unknown as Prisma.InputJsonValue,
        coverageMap: coverageMap as unknown as Prisma.InputJsonValue,
      },
    });
  }

  // Generate metadata for the created exam
  private generateMetadata(
    questions: EnhancedQuestion[],
    config: ExamGenerationConfig
  ): ExamMetadata {
    const totalQuestions = questions.length;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const estimatedDuration = questions.reduce((sum, q) => sum + (q.timeEstimate || 0), 0);

    const bloomsDistribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    const difficultyDistribution: Record<QuestionDifficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    const topics = new Set<string>();

    questions.forEach((q) => {
      bloomsDistribution[q.bloomsLevel]++;
      difficultyDistribution[q.difficulty]++;
      q.tags.forEach((t) => topics.add(t));
    });

    // Convert counts to percentages for Bloom's
    const bloomsPercent: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
    (Object.keys(bloomsDistribution) as BloomsLevel[]).forEach((lvl) => {
      bloomsPercent[lvl] = totalQuestions > 0 ? (bloomsDistribution[lvl] / totalQuestions) * 100 : 0;
    });

    return {
      totalQuestions,
      totalPoints,
      estimatedDuration,
      bloomsDistribution: bloomsPercent,
      difficultyDistribution,
      topicsCovered: Array.from(topics),
      learningObjectives: [],
    };
  }

  private calculateActualDistribution(questions: EnhancedQuestion[]): Record<BloomsLevel, number> {
    const distribution: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    questions.forEach(q => {
      distribution[q.bloomsLevel]++;
    });

    const total = questions.length;
    Object.keys(distribution).forEach(key => {
      distribution[key as BloomsLevel] = (distribution[key as BloomsLevel] / total) * 100;
    });

    return distribution;
  }

  private calculateQuestionDifficultyMatrix(questions: EnhancedQuestion[]): any {
    const matrix: any = {};
    
    const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    bloomsLevels.forEach(level => {
      const levelQuestions = questions.filter(q => q.bloomsLevel === level);
      matrix[level] = {
        EASY: levelQuestions.filter(q => q.difficulty === 'EASY').length,
        MEDIUM: levelQuestions.filter(q => q.difficulty === 'MEDIUM').length,
        HARD: levelQuestions.filter(q => q.difficulty === 'HARD').length,
      };
    });

    return matrix;
  }

  private generateCoverageMap(questions: EnhancedQuestion[]): any {
    const coverageMap: any = {
      topics: {},
      bloomsLevels: {},
      questionTypes: {},
    };

    questions.forEach(q => {
      // Topic coverage
      q.tags.forEach(tag => {
        coverageMap.topics[tag] = (coverageMap.topics[tag] || 0) + 1;
      });

      // Bloom's coverage
      coverageMap.bloomsLevels[q.bloomsLevel] = (coverageMap.bloomsLevels[q.bloomsLevel] || 0) + 1;

      // Question type coverage
      coverageMap.questionTypes[q.questionType] = (coverageMap.questionTypes[q.questionType] || 0) + 1;
    });

    return coverageMap;
  }
}