/**
 * @sam-ai/core - Assessment Engine
 * Generates adaptive assessments with Bloom's Taxonomy alignment
 */

import type {
  SAMConfig,
  EngineInput,
  BloomsLevel,
  BloomsDistribution,
  QuestionType,
  Question,
  QuestionOption,
} from '../types';
import { BaseEngine } from './base';
import type { BloomsEngineOutput } from './blooms';

// ============================================================================
// TYPES
// ============================================================================

export interface AssessmentConfig {
  questionCount: number;
  duration: number; // minutes
  bloomsDistribution: Partial<BloomsDistribution>;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes: QuestionType[];
  adaptiveMode: boolean;
}

export interface GeneratedQuestion extends Question {
  targetBloomsLevel: BloomsLevel;
  cognitiveSkills: string[];
  commonMisconceptions?: string[];
}

export interface AssessmentAnalysis {
  bloomsComparison: {
    target: BloomsDistribution;
    actual: BloomsDistribution;
    alignment: number; // 0-100
  };
  cognitiveProgression: {
    startLevel: BloomsLevel;
    endLevel: BloomsLevel;
    progressionScore: number;
  };
  skillsCoverage: {
    covered: string[];
    missing: string[];
    overRepresented: string[];
  };
  difficultyAnalysis: {
    averageDifficulty: number;
    distribution: { easy: number; medium: number; hard: number };
    isBalanced: boolean;
  };
}

export interface StudyGuide {
  focusAreas: Array<{
    topic: string;
    importance: 'critical' | 'important' | 'helpful';
    description: string;
    resources?: string[];
  }>;
  practiceQuestions: GeneratedQuestion[];
  keyConceptsSummary: string[];
  studyTips: string[];
}

export interface AssessmentEngineOutput {
  questions: GeneratedQuestion[];
  analysis: AssessmentAnalysis;
  studyGuide?: StudyGuide;
  metadata: {
    totalPoints: number;
    estimatedDuration: number;
    averageDifficulty: 'easy' | 'medium' | 'hard';
    bloomsAlignment: number;
  };
}

// ============================================================================
// ASSESSMENT ENGINE
// ============================================================================

export class AssessmentEngine extends BaseEngine<AssessmentEngineOutput> {
  private readonly defaultConfig: AssessmentConfig = {
    questionCount: 10,
    duration: 30,
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    difficultyDistribution: {
      easy: 30,
      medium: 50,
      hard: 20,
    },
    questionTypes: ['multiple-choice', 'true-false', 'short-answer'],
    adaptiveMode: false,
  };

  constructor(config: SAMConfig) {
    super({
      config,
      name: 'assessment',
      version: '1.0.0',
      dependencies: ['context', 'blooms'],
      timeout: 60000, // 60 seconds for complex generation
      retries: 2,
      cacheEnabled: true,
      cacheTTL: 60 * 60 * 1000, // 1 hour
    });
  }

  protected async performInitialization(): Promise<void> {
    this.logger.debug('[AssessmentEngine] Initialized');
  }

  protected async process(input: EngineInput): Promise<AssessmentEngineOutput> {
    const { context, query, previousResults, options } = input;

    // Get Blooms data for alignment
    const bloomsResult = previousResults?.['blooms'] as
      | { success: boolean; data: BloomsEngineOutput }
      | undefined;

    const assessmentConfig = this.buildAssessmentConfig(options, bloomsResult?.data);

    // Generate questions
    const questions = await this.generateQuestions(context, assessmentConfig, bloomsResult?.data);

    // Analyze the generated assessment
    const analysis = this.analyzeAssessment(questions, assessmentConfig);

    // Generate study guide if requested
    const includeStudyGuide = query?.toLowerCase().includes('study') || options?.includeStudyGuide;
    const studyGuide = includeStudyGuide
      ? await this.generateStudyGuide(context, questions, bloomsResult?.data)
      : undefined;

    // Calculate metadata
    const metadata = this.calculateMetadata(questions, analysis);

    return {
      questions,
      analysis,
      studyGuide,
      metadata,
    };
  }

  private buildAssessmentConfig(
    options?: Record<string, unknown>,
    bloomsData?: BloomsEngineOutput
  ): AssessmentConfig {
    const config = { ...this.defaultConfig };

    // Override with options
    if (options?.questionCount) {
      config.questionCount = options.questionCount as number;
    }
    if (options?.duration) {
      config.duration = options.duration as number;
    }
    if (options?.bloomsDistribution) {
      config.bloomsDistribution = options.bloomsDistribution as Partial<BloomsDistribution>;
    }
    if (options?.questionTypes) {
      config.questionTypes = options.questionTypes as QuestionType[];
    }

    // Adjust based on Blooms analysis to fill gaps
    if (bloomsData?.analysis.gaps.length) {
      for (const gap of bloomsData.analysis.gaps) {
        config.bloomsDistribution[gap] = (config.bloomsDistribution[gap] || 0) + 10;
      }
      // Normalize to 100%
      this.normalizeDistribution(config.bloomsDistribution);
    }

    return config;
  }

  private normalizeDistribution(distribution: Partial<BloomsDistribution>): void {
    const levels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const total = levels.reduce((sum, level) => sum + (distribution[level] || 0), 0);

    if (total > 0 && total !== 100) {
      const factor = 100 / total;
      for (const level of levels) {
        if (distribution[level]) {
          distribution[level] = Math.round(distribution[level]! * factor);
        }
      }
    }
  }

  private async generateQuestions(
    context: EngineInput['context'],
    config: AssessmentConfig,
    bloomsData?: BloomsEngineOutput
  ): Promise<GeneratedQuestion[]> {
    const systemPrompt = this.buildQuestionGenerationPrompt();
    const userPrompt = this.buildQuestionRequestPrompt(context, config, bloomsData);

    const response = await this.callAI({
      systemPrompt,
      userMessage: userPrompt,
      maxTokens: 4000,
    });

    return this.parseQuestionsResponse(response.content, config);
  }

  private buildQuestionGenerationPrompt(): string {
    return `You are an expert assessment designer specializing in Bloom's Taxonomy-aligned question generation.

Generate questions that:
1. Precisely target specific cognitive levels
2. Are clear and unambiguous
3. Have appropriate difficulty
4. Include plausible distractors for multiple choice
5. Cover key learning objectives

Return questions in JSON array format:
[
  {
    "id": "q1",
    "type": "multiple-choice|true-false|short-answer|essay|matching|fill-blank",
    "text": "Question text",
    "options": [{"id": "a", "text": "Option text", "isCorrect": boolean}],
    "correctAnswer": "string or array",
    "points": number,
    "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "difficulty": "easy|medium|hard",
    "explanation": "Why this is correct",
    "hints": ["hint1", "hint2"],
    "targetBloomsLevel": "same as bloomsLevel",
    "cognitiveSkills": ["skill1", "skill2"],
    "commonMisconceptions": ["misconception1"]
  }
]`;
  }

  private buildQuestionRequestPrompt(
    context: EngineInput['context'],
    config: AssessmentConfig,
    bloomsData?: BloomsEngineOutput
  ): string {
    let prompt = `Generate ${config.questionCount} assessment questions for:

Context: ${context.page.type}
Entity: ${context.page.entityId || 'General assessment'}
User Role: ${context.user.role}

Requirements:
- Duration: ${config.duration} minutes
- Question Types: ${config.questionTypes.join(', ')}

Bloom's Distribution (percentage):
`;

    const levels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    for (const level of levels) {
      const pct = config.bloomsDistribution[level] || 0;
      if (pct > 0) {
        prompt += `- ${level}: ${pct}%\n`;
      }
    }

    prompt += `
Difficulty Distribution:
- Easy: ${config.difficultyDistribution.easy}%
- Medium: ${config.difficultyDistribution.medium}%
- Hard: ${config.difficultyDistribution.hard}%
`;

    if (bloomsData) {
      prompt += `
Current Content Gaps: ${bloomsData.analysis.gaps.join(', ') || 'None'}
Focus on addressing these cognitive level gaps in your questions.
`;
    }

    return prompt;
  }

  private parseQuestionsResponse(
    response: string,
    config: AssessmentConfig
  ): GeneratedQuestion[] {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((q: Partial<GeneratedQuestion>, index: number) =>
          this.normalizeQuestion(q, index)
        );
      }
    } catch (error) {
      this.logger.warn('[AssessmentEngine] Failed to parse questions, generating defaults');
    }

    // Generate default questions if parsing fails
    return this.generateDefaultQuestions(config);
  }

  private normalizeQuestion(
    q: Partial<GeneratedQuestion>,
    index: number
  ): GeneratedQuestion {
    return {
      id: q.id || `q${index + 1}`,
      type: q.type || 'multiple-choice',
      text: q.text || 'Question text not available',
      options: q.options || this.generateDefaultOptions(),
      correctAnswer: q.correctAnswer,
      points: q.points || 1,
      bloomsLevel: q.bloomsLevel || 'UNDERSTAND',
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation,
      hints: q.hints || [],
      targetBloomsLevel: q.targetBloomsLevel || q.bloomsLevel || 'UNDERSTAND',
      cognitiveSkills: q.cognitiveSkills || [],
      commonMisconceptions: q.commonMisconceptions,
    };
  }

  private generateDefaultOptions(): QuestionOption[] {
    return [
      { id: 'a', text: 'Option A', isCorrect: true },
      { id: 'b', text: 'Option B', isCorrect: false },
      { id: 'c', text: 'Option C', isCorrect: false },
      { id: 'd', text: 'Option D', isCorrect: false },
    ];
  }

  private generateDefaultQuestions(config: AssessmentConfig): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const levels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];

    for (let i = 0; i < config.questionCount; i++) {
      const level = levels[i % levels.length];
      questions.push({
        id: `q${i + 1}`,
        type: config.questionTypes[i % config.questionTypes.length],
        text: `Sample question ${i + 1} targeting ${level} level`,
        options: this.generateDefaultOptions(),
        correctAnswer: 'a',
        points: 1,
        bloomsLevel: level,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        explanation: `This question tests ${level} cognitive skills`,
        hints: [],
        targetBloomsLevel: level,
        cognitiveSkills: [level.toLowerCase()],
      });
    }

    return questions;
  }

  private analyzeAssessment(
    questions: GeneratedQuestion[],
    config: AssessmentConfig
  ): AssessmentAnalysis {
    // Calculate actual Bloom's distribution
    const actualDistribution: BloomsDistribution = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    const skills: string[] = [];

    for (const q of questions) {
      actualDistribution[q.bloomsLevel]++;
      difficultyCount[q.difficulty]++;
      skills.push(...q.cognitiveSkills);
    }

    // Convert to percentages
    const total = questions.length || 1;
    for (const level of Object.keys(actualDistribution) as BloomsLevel[]) {
      actualDistribution[level] = Math.round((actualDistribution[level] / total) * 100);
    }

    // Calculate alignment score
    const targetDist = config.bloomsDistribution;
    let alignmentSum = 0;
    let alignmentCount = 0;

    for (const level of Object.keys(actualDistribution) as BloomsLevel[]) {
      const target = targetDist[level] || 0;
      const actual = actualDistribution[level];
      const diff = Math.abs(target - actual);
      alignmentSum += 100 - diff;
      alignmentCount++;
    }

    const alignment = alignmentCount > 0 ? Math.round(alignmentSum / alignmentCount) : 0;

    // Find start and end levels
    const levels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const startLevel = questions[0]?.bloomsLevel || 'REMEMBER';
    const endLevel = questions[questions.length - 1]?.bloomsLevel || 'CREATE';

    const startIdx = levels.indexOf(startLevel);
    const endIdx = levels.indexOf(endLevel);
    const progressionScore = Math.max(0, ((endIdx - startIdx) / 5) * 100);

    // Skills analysis
    const uniqueSkills = [...new Set(skills)];
    const expectedSkills = ['recall', 'comprehension', 'application', 'analysis', 'evaluation', 'creation'];
    const covered = uniqueSkills.filter((s) => expectedSkills.some((e) => s.includes(e)));
    const missing = expectedSkills.filter((e) => !uniqueSkills.some((s) => s.includes(e)));

    // Difficulty analysis
    const avgDifficulty =
      (difficultyCount.easy * 1 + difficultyCount.medium * 2 + difficultyCount.hard * 3) /
      (total || 1);

    const targetEasy = config.difficultyDistribution.easy / 100;
    const targetMedium = config.difficultyDistribution.medium / 100;
    const targetHard = config.difficultyDistribution.hard / 100;

    const actualEasy = difficultyCount.easy / total;
    const actualMedium = difficultyCount.medium / total;
    const actualHard = difficultyCount.hard / total;

    const isBalanced =
      Math.abs(targetEasy - actualEasy) < 0.15 &&
      Math.abs(targetMedium - actualMedium) < 0.15 &&
      Math.abs(targetHard - actualHard) < 0.15;

    return {
      bloomsComparison: {
        target: { ...targetDist } as BloomsDistribution,
        actual: actualDistribution,
        alignment,
      },
      cognitiveProgression: {
        startLevel,
        endLevel,
        progressionScore: Math.round(progressionScore),
      },
      skillsCoverage: {
        covered,
        missing,
        overRepresented: [],
      },
      difficultyAnalysis: {
        averageDifficulty: Math.round(avgDifficulty * 100) / 100,
        distribution: {
          easy: Math.round(actualEasy * 100),
          medium: Math.round(actualMedium * 100),
          hard: Math.round(actualHard * 100),
        },
        isBalanced,
      },
    };
  }

  private async generateStudyGuide(
    _context: EngineInput['context'],
    questions: GeneratedQuestion[],
    bloomsData?: BloomsEngineOutput
  ): Promise<StudyGuide> {
    // Extract key topics from questions
    const topics = this.extractTopicsFromQuestions(questions);
    const gaps = bloomsData?.analysis.gaps || [];

    const focusAreas = topics.map((topic, i) => ({
      topic,
      importance: (i < 2 ? 'critical' : i < 4 ? 'important' : 'helpful') as
        | 'critical'
        | 'important'
        | 'helpful',
      description: `Focus on ${topic} concepts`,
      resources: [],
    }));

    // Add gap-related focus areas
    for (const gap of gaps) {
      focusAreas.push({
        topic: `${gap} Level Skills`,
        importance: 'critical',
        description: `Practice ${gap.toLowerCase()} level cognitive activities`,
        resources: [],
      });
    }

    const practiceQuestions = questions.slice(0, 3).map((q) => ({
      ...q,
      hints: (q.hints ?? []).concat(['Practice similar problems', 'Review the explanation carefully']),
    }));

    return {
      focusAreas,
      practiceQuestions,
      keyConceptsSummary: topics.map((t) => `Understanding ${t} is essential`),
      studyTips: [
        'Review incorrect answers and their explanations',
        'Practice questions at each Bloom\'s level',
        'Focus on understanding rather than memorization',
        'Take breaks and review material regularly',
      ],
    };
  }

  private extractTopicsFromQuestions(questions: GeneratedQuestion[]): string[] {
    const topics: string[] = [];

    for (const q of questions) {
      // Extract potential topics from question text
      const words = q.text.split(/\s+/).filter((w) => w.length > 4);
      for (const word of words.slice(0, 2)) {
        if (!topics.includes(word) && topics.length < 5) {
          topics.push(word);
        }
      }
    }

    return topics.length > 0 ? topics : ['Core Concepts', 'Key Principles', 'Fundamentals'];
  }

  private calculateMetadata(
    questions: GeneratedQuestion[],
    analysis: AssessmentAnalysis
  ): AssessmentEngineOutput['metadata'] {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedDuration = Math.ceil(questions.length * 2.5); // ~2.5 min per question

    let averageDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
    if (analysis.difficultyAnalysis.averageDifficulty < 1.5) {
      averageDifficulty = 'easy';
    } else if (analysis.difficultyAnalysis.averageDifficulty > 2.5) {
      averageDifficulty = 'hard';
    }

    return {
      totalPoints,
      estimatedDuration,
      averageDifficulty,
      bloomsAlignment: analysis.bloomsComparison.alignment,
    };
  }

  protected getCacheKey(input: EngineInput): string {
    const { context, options } = input;
    const configHash = JSON.stringify(options || {}).substring(0, 30);
    return `assessment:${context.page.entityId || 'general'}:${configHash}`;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createAssessmentEngine(config: SAMConfig): AssessmentEngine {
  return new AssessmentEngine(config);
}
