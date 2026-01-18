import { db } from '@/lib/db';
import { BloomsLevel, QuestionType, QuestionDifficulty, EvaluationType } from '@prisma/client';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { SubjectiveEvaluator, SubjectiveEvaluationResult, EvaluationContext } from './sam-subjective-evaluator';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ==========================================
// SAM Evaluation Engine Types
// ==========================================

export interface SAMEvaluationConfig {
  enableAutoGrading: boolean;
  enableAIAssistance: boolean;
  enablePartialCredit: boolean;
  strictnessLevel: 'lenient' | 'moderate' | 'strict';
  feedbackDepth: 'minimal' | 'standard' | 'comprehensive';
  bloomsAnalysis: boolean;
  misconceptionDetection: boolean;
  adaptiveHints: boolean;
}

export interface ObjectiveAnswer {
  questionId: string;
  questionType: QuestionType;
  studentAnswer: string;
  correctAnswer: string;
  options?: QuestionOption[];
  points: number;
  bloomsLevel: BloomsLevel;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ObjectiveEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
  partialCreditReason?: string;
  bloomsLevel: BloomsLevel;
}

export interface SAMGradingAssistance {
  suggestedScore: number;
  maxScore: number;
  confidence: number;
  reasoning: string;
  rubricAlignment: RubricScore[];
  keyStrengths: string[];
  keyWeaknesses: string[];
  suggestedFeedback: string;
  flaggedIssues: string[];
  comparisonToExpected: ComparisonAnalysis;
  teacherTips: string[];
}

export interface RubricScore {
  criterionName: string;
  score: number;
  maxScore: number;
  justification: string;
}

export interface ComparisonAnalysis {
  coveragePercentage: number;
  missingKeyPoints: string[];
  extraneousPoints: string[];
  accuracyScore: number;
}

export interface CognitiveProgressUpdate {
  userId: string;
  courseId: string;
  bloomsLevelUpdates: BloomsLevelUpdate[];
  overallMastery: number;
  recommendedNextSteps: LearningRecommendation[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface BloomsLevelUpdate {
  level: BloomsLevel;
  previousScore: number;
  newScore: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

export interface LearningRecommendation {
  type: 'review' | 'practice' | 'advance' | 'remediate';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  bloomsLevel: BloomsLevel;
  relatedConcepts: string[];
  estimatedTime: number; // minutes
}

export interface ExamEvaluationSummary {
  examId: string;
  attemptId: string;
  studentId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  passingScore: number;
  timeSpent: number | null;
  bloomsBreakdown: BloomsBreakdown;
  questionResults: QuestionResult[];
  overallFeedback: string;
  cognitiveProfile: CognitiveProfile;
  learningPath: LearningRecommendation[];
}

export interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

export interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime: number;
}

export interface CognitiveProfile {
  overallMastery: number;
  strengths: BloomsLevel[];
  weaknesses: BloomsLevel[];
  recommendedFocus: BloomsLevel[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
  evaluationType: EvaluationType;
  aiEvaluation?: SubjectiveEvaluationResult;
  teacherOverride?: TeacherOverride;
}

export interface TeacherOverride {
  teacherId: string;
  originalScore: number;
  newScore: number;
  reason: string;
  timestamp: Date;
}

// ==========================================
// SAM Evaluation Engine Class
// ==========================================

export class SAMEvaluationEngine {
  private subjectiveEvaluator: SubjectiveEvaluator;
  private model = 'claude-sonnet-4-5-20250929';
  private defaultConfig: SAMEvaluationConfig = {
    enableAutoGrading: true,
    enableAIAssistance: true,
    enablePartialCredit: true,
    strictnessLevel: 'moderate',
    feedbackDepth: 'standard',
    bloomsAnalysis: true,
    misconceptionDetection: true,
    adaptiveHints: true,
  };

  constructor() {
    this.subjectiveEvaluator = new SubjectiveEvaluator();
  }

  // ==========================================
  // Auto-Grading for Objective Questions
  // ==========================================

  /**
   * Evaluate objective question answers (MCQ, True/False, Matching, Ordering)
   */
  async evaluateObjectiveAnswers(
    answers: ObjectiveAnswer[],
    config: Partial<SAMEvaluationConfig> = {}
  ): Promise<ObjectiveEvaluationResult[]> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const results: ObjectiveEvaluationResult[] = [];

    for (const answer of answers) {
      const result = await this.evaluateSingleObjective(answer, mergedConfig);
      results.push(result);
    }

    return results;
  }

  private async evaluateSingleObjective(
    answer: ObjectiveAnswer,
    config: SAMEvaluationConfig
  ): Promise<ObjectiveEvaluationResult> {
    const { questionType, studentAnswer, correctAnswer, points, bloomsLevel } = answer;

    let isCorrect = false;
    let pointsEarned = 0;
    let feedback = '';
    let partialCreditReason: string | undefined;

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
        isCorrect = this.normalizeAnswer(studentAnswer) === this.normalizeAnswer(correctAnswer);
        pointsEarned = isCorrect ? points : 0;
        feedback = isCorrect
          ? this.generateCorrectFeedback(bloomsLevel)
          : this.generateIncorrectFeedback(bloomsLevel, correctAnswer, config.feedbackDepth);
        break;

      case 'MATCHING':
        const matchResult = this.evaluateMatchingAnswer(studentAnswer, correctAnswer, points, config);
        isCorrect = matchResult.isFullyCorrect;
        pointsEarned = matchResult.pointsEarned;
        partialCreditReason = matchResult.partialCreditReason;
        feedback = matchResult.feedback;
        break;

      case 'ORDERING':
        const orderResult = this.evaluateOrderingAnswer(studentAnswer, correctAnswer, points, config);
        isCorrect = orderResult.isFullyCorrect;
        pointsEarned = orderResult.pointsEarned;
        partialCreditReason = orderResult.partialCreditReason;
        feedback = orderResult.feedback;
        break;

      case 'FILL_IN_BLANK':
        const fillResult = this.evaluateFillInBlank(studentAnswer, correctAnswer, points, config);
        isCorrect = fillResult.isCorrect;
        pointsEarned = fillResult.pointsEarned;
        partialCreditReason = fillResult.partialCreditReason;
        feedback = fillResult.feedback;
        break;

      default:
        // For unknown types, do exact match
        isCorrect = this.normalizeAnswer(studentAnswer) === this.normalizeAnswer(correctAnswer);
        pointsEarned = isCorrect ? points : 0;
        feedback = isCorrect ? 'Correct!' : 'Incorrect.';
    }

    return {
      questionId: answer.questionId,
      isCorrect,
      pointsEarned,
      maxPoints: points,
      feedback,
      partialCreditReason,
      bloomsLevel,
    };
  }

  private normalizeAnswer(answer: string): string {
    return answer.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private evaluateMatchingAnswer(
    studentAnswer: string,
    correctAnswer: string,
    maxPoints: number,
    config: SAMEvaluationConfig
  ): { isFullyCorrect: boolean; pointsEarned: number; partialCreditReason?: string; feedback: string } {
    try {
      const studentPairs = JSON.parse(studentAnswer) as Record<string, string>;
      const correctPairs = JSON.parse(correctAnswer) as Record<string, string>;

      const totalPairs = Object.keys(correctPairs).length;
      let correctCount = 0;

      for (const [key, value] of Object.entries(studentPairs)) {
        if (correctPairs[key] && this.normalizeAnswer(correctPairs[key]) === this.normalizeAnswer(value)) {
          correctCount++;
        }
      }

      const isFullyCorrect = correctCount === totalPairs;
      let pointsEarned = 0;

      if (isFullyCorrect) {
        pointsEarned = maxPoints;
      } else if (config.enablePartialCredit) {
        pointsEarned = Math.round((correctCount / totalPairs) * maxPoints * 10) / 10;
      }

      return {
        isFullyCorrect,
        pointsEarned,
        partialCreditReason: !isFullyCorrect && pointsEarned > 0
          ? `${correctCount} out of ${totalPairs} matches correct`
          : undefined,
        feedback: isFullyCorrect
          ? 'All matches are correct!'
          : `${correctCount} out of ${totalPairs} matches are correct.`,
      };
    } catch {
      return {
        isFullyCorrect: false,
        pointsEarned: 0,
        feedback: 'Unable to evaluate matching answer.',
      };
    }
  }

  private evaluateOrderingAnswer(
    studentAnswer: string,
    correctAnswer: string,
    maxPoints: number,
    config: SAMEvaluationConfig
  ): { isFullyCorrect: boolean; pointsEarned: number; partialCreditReason?: string; feedback: string } {
    try {
      const studentOrder = JSON.parse(studentAnswer) as string[];
      const correctOrder = JSON.parse(correctAnswer) as string[];

      if (studentOrder.length !== correctOrder.length) {
        return {
          isFullyCorrect: false,
          pointsEarned: 0,
          feedback: 'Incorrect number of items in the order.',
        };
      }

      let correctPositions = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (studentOrder[i] === correctOrder[i]) {
          correctPositions++;
        }
      }

      const isFullyCorrect = correctPositions === correctOrder.length;
      let pointsEarned = 0;

      if (isFullyCorrect) {
        pointsEarned = maxPoints;
      } else if (config.enablePartialCredit) {
        pointsEarned = Math.round((correctPositions / correctOrder.length) * maxPoints * 10) / 10;
      }

      return {
        isFullyCorrect,
        pointsEarned,
        partialCreditReason: !isFullyCorrect && pointsEarned > 0
          ? `${correctPositions} out of ${correctOrder.length} items in correct position`
          : undefined,
        feedback: isFullyCorrect
          ? 'All items are in the correct order!'
          : `${correctPositions} out of ${correctOrder.length} items are in the correct position.`,
      };
    } catch {
      return {
        isFullyCorrect: false,
        pointsEarned: 0,
        feedback: 'Unable to evaluate ordering answer.',
      };
    }
  }

  private evaluateFillInBlank(
    studentAnswer: string,
    correctAnswer: string,
    maxPoints: number,
    config: SAMEvaluationConfig
  ): { isCorrect: boolean; pointsEarned: number; partialCreditReason?: string; feedback: string } {
    const normalizedStudent = this.normalizeAnswer(studentAnswer);
    const normalizedCorrect = this.normalizeAnswer(correctAnswer);

    // Check for exact match
    if (normalizedStudent === normalizedCorrect) {
      return {
        isCorrect: true,
        pointsEarned: maxPoints,
        feedback: 'Correct!',
      };
    }

    // Check for acceptable variations (handle multiple correct answers)
    try {
      const acceptableAnswers = JSON.parse(correctAnswer) as string[];
      if (Array.isArray(acceptableAnswers)) {
        const isCorrect = acceptableAnswers.some(
          ans => this.normalizeAnswer(ans) === normalizedStudent
        );
        if (isCorrect) {
          return {
            isCorrect: true,
            pointsEarned: maxPoints,
            feedback: 'Correct!',
          };
        }
      }
    } catch {
      // Not a JSON array, continue with normal evaluation
    }

    // Check for near-match (partial credit for minor typos)
    if (config.enablePartialCredit && config.strictnessLevel !== 'strict') {
      const similarity = this.calculateStringSimilarity(normalizedStudent, normalizedCorrect);
      if (similarity >= 0.85) {
        return {
          isCorrect: false,
          pointsEarned: Math.round(maxPoints * 0.5),
          partialCreditReason: 'Close answer with minor spelling differences',
          feedback: `Close! The expected answer was "${correctAnswer}".`,
        };
      }
    }

    return {
      isCorrect: false,
      pointsEarned: 0,
      feedback: `Incorrect. The correct answer is "${correctAnswer}".`,
    };
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (!str1.length || !str2.length) return 0;

    // Levenshtein distance
    const matrix: number[][] = [];
    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[str1.length][str2.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }

  private generateCorrectFeedback(bloomsLevel: BloomsLevel): string {
    const feedbackByLevel: Record<BloomsLevel, string[]> = {
      REMEMBER: [
        'Excellent recall!',
        'You remembered that correctly!',
        'Great job remembering this fact!',
      ],
      UNDERSTAND: [
        'Great understanding!',
        'You clearly understand this concept!',
        'Well demonstrated comprehension!',
      ],
      APPLY: [
        'Excellent application of knowledge!',
        'You applied the concept correctly!',
        'Great practical application!',
      ],
      ANALYZE: [
        'Excellent analysis!',
        'Your analytical skills are showing!',
        'Great job breaking down the problem!',
      ],
      EVALUATE: [
        'Outstanding evaluation!',
        'Excellent critical thinking!',
        'Your judgment is well-founded!',
      ],
      CREATE: [
        'Brilliant creative thinking!',
        'Excellent synthesis of ideas!',
        'Your innovative approach is impressive!',
      ],
    };

    const options = feedbackByLevel[bloomsLevel] || ['Correct!'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateIncorrectFeedback(
    bloomsLevel: BloomsLevel,
    correctAnswer: string,
    depth: 'minimal' | 'standard' | 'comprehensive'
  ): string {
    if (depth === 'minimal') {
      return `Incorrect. The correct answer is: ${correctAnswer}`;
    }

    const hints: Record<BloomsLevel, string> = {
      REMEMBER: 'Try reviewing the key facts and definitions.',
      UNDERSTAND: 'Consider what the underlying concept means.',
      APPLY: 'Think about how this concept applies in practice.',
      ANALYZE: 'Try breaking down the problem into smaller parts.',
      EVALUATE: 'Consider the criteria for making this judgment.',
      CREATE: 'Think about how different elements can be combined.',
    };

    const hint = hints[bloomsLevel] || '';

    if (depth === 'standard') {
      return `Incorrect. The correct answer is: ${correctAnswer}. ${hint}`;
    }

    // Comprehensive feedback
    return `Incorrect. The correct answer is: ${correctAnswer}.\n\n${hint}\n\nReview the related material and try again. Understanding this concept is important for building on more advanced topics.`;
  }

  // ==========================================
  // Subjective Answer Evaluation (AI-Powered)
  // ==========================================

  /**
   * Evaluate subjective answers (Essay, Short Answer) using AI
   */
  async evaluateSubjectiveAnswer(
    studentAnswer: string,
    context: EvaluationContext,
    config: Partial<SAMEvaluationConfig> = {}
  ): Promise<SubjectiveEvaluationResult> {
    return this.subjectiveEvaluator.evaluateAnswer(studentAnswer, context);
  }

  // ==========================================
  // Teacher Grading Assistance
  // ==========================================

  /**
   * Provide AI-powered grading assistance for teachers
   */
  async getGradingAssistance(
    questionText: string,
    expectedAnswer: string,
    studentAnswer: string,
    rubric: { criteria: string[]; maxScore: number },
    bloomsLevel: BloomsLevel
  ): Promise<SAMGradingAssistance> {
    const systemPrompt = `You are SAM, an expert educational AI assistant helping teachers grade student answers.

Your role is to:
1. Analyze the student's answer against the expected answer
2. Evaluate according to the provided rubric criteria
3. Suggest a fair score with clear reasoning
4. Identify strengths and weaknesses
5. Provide constructive feedback suggestions
6. Flag any issues that need teacher attention

Be objective, fair, and focused on learning outcomes.
Consider the Bloom's Taxonomy level: ${bloomsLevel}`;

    const userPrompt = `
Question: ${questionText}

Expected Answer:
${expectedAnswer}

Student Answer:
${studentAnswer}

Rubric Criteria:
${rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Maximum Score: ${rubric.maxScore}
Bloom's Level: ${bloomsLevel}

Please provide:
1. A suggested score (out of ${rubric.maxScore})
2. Your confidence level (0-100%)
3. Detailed reasoning for your suggested score
4. Score for each rubric criterion with justification
5. Key strengths in the answer (list)
6. Key weaknesses in the answer (list)
7. Suggested feedback for the student
8. Any issues that should be flagged for teacher review
9. Coverage analysis (what percentage of expected content is covered)
10. Tips for the teacher when finalizing the grade

Format your response as JSON with this structure:
{
  "suggestedScore": number,
  "confidence": number,
  "reasoning": "string",
  "rubricScores": [{"criterionName": "string", "score": number, "maxScore": number, "justification": "string"}],
  "keyStrengths": ["string"],
  "keyWeaknesses": ["string"],
  "suggestedFeedback": "string",
  "flaggedIssues": ["string"],
  "coverageAnalysis": {
    "coveragePercentage": number,
    "missingKeyPoints": ["string"],
    "extraneousPoints": ["string"],
    "accuracyScore": number
  },
  "teacherTips": ["string"]
}`;

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const aiResponse = response.content[0];
      const responseText = aiResponse.type === 'text' ? aiResponse.text : '';

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        suggestedScore: parsed.suggestedScore,
        maxScore: rubric.maxScore,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        rubricAlignment: parsed.rubricScores || [],
        keyStrengths: parsed.keyStrengths || [],
        keyWeaknesses: parsed.keyWeaknesses || [],
        suggestedFeedback: parsed.suggestedFeedback,
        flaggedIssues: parsed.flaggedIssues || [],
        comparisonToExpected: {
          coveragePercentage: parsed.coverageAnalysis?.coveragePercentage || 0,
          missingKeyPoints: parsed.coverageAnalysis?.missingKeyPoints || [],
          extraneousPoints: parsed.coverageAnalysis?.extraneousPoints || [],
          accuracyScore: parsed.coverageAnalysis?.accuracyScore || 0,
        },
        teacherTips: parsed.teacherTips || [],
      };
    } catch (error) {
      logger.error('Error getting grading assistance:', { error });

      // Return a basic response if AI fails
      return {
        suggestedScore: 0,
        maxScore: rubric.maxScore,
        confidence: 0,
        reasoning: 'Unable to analyze the answer. Please review manually.',
        rubricAlignment: [],
        keyStrengths: [],
        keyWeaknesses: [],
        suggestedFeedback: 'Review needed.',
        flaggedIssues: ['AI evaluation failed - manual review required'],
        comparisonToExpected: {
          coveragePercentage: 0,
          missingKeyPoints: [],
          extraneousPoints: [],
          accuracyScore: 0,
        },
        teacherTips: ['Please review this answer manually as AI analysis was unavailable.'],
      };
    }
  }

  // ==========================================
  // Comprehensive Exam Evaluation
  // ==========================================

  /**
   * Evaluate an entire exam attempt and generate comprehensive results
   */
  async evaluateExamAttempt(
    attemptId: string,
    config: Partial<SAMEvaluationConfig> = {}
  ): Promise<ExamEvaluationSummary> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Fetch the exam attempt with all related data
    const attempt = await db.userExamAttempt.findUnique({
      where: { id: attemptId },
      include: {
        Exam: {
          include: {
            enhancedQuestions: true,
            section: {
              include: {
                chapter: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
          },
        },
        enhancedAnswers: {
          include: {
            question: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error(`Exam attempt not found: ${attemptId}`);
    }

    const exam = attempt.Exam;
    const questionResults: QuestionResult[] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Initialize Bloom's breakdown
    const bloomsBreakdown: BloomsBreakdown = {
      REMEMBER: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      UNDERSTAND: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      APPLY: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      ANALYZE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      EVALUATE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
      CREATE: { questionsCount: 0, correctCount: 0, scorePercentage: 0, averageTime: 0 },
    };

    // Process each answer
    for (const answer of attempt.enhancedAnswers) {
      const question = answer.question;
      const bloomsLevel = question.bloomsLevel;
      maxScore += question.points;
      bloomsBreakdown[bloomsLevel].questionsCount++;

      let result: QuestionResult;

      // Determine if objective or subjective
      const isObjective = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MATCHING', 'ORDERING'].includes(question.questionType);

      if (isObjective) {
        // Auto-grade objective questions
        // Parse options from Json field
        const parsedOptions = Array.isArray(question.options)
          ? (question.options as Array<{ id: string; optionText: string; isCorrect: boolean }>).map(o => ({
              id: o.id,
              text: o.optionText,
              isCorrect: o.isCorrect,
            }))
          : undefined;

        const objResult = await this.evaluateSingleObjective(
          {
            questionId: question.id,
            questionType: question.questionType,
            studentAnswer: answer.answer || '',
            correctAnswer: question.correctAnswer || '',
            options: parsedOptions,
            points: question.points,
            bloomsLevel: question.bloomsLevel,
          },
          mergedConfig
        );

        totalScore += objResult.pointsEarned;
        if (objResult.isCorrect) {
          bloomsBreakdown[bloomsLevel].correctCount++;
        }

        result = {
          questionId: question.id,
          questionText: question.question,
          questionType: question.questionType,
          bloomsLevel: question.bloomsLevel,
          studentAnswer: answer.answer || '',
          correctAnswer: question.correctAnswer || '',
          isCorrect: objResult.isCorrect,
          pointsEarned: objResult.pointsEarned,
          maxPoints: question.points,
          feedback: objResult.feedback,
          evaluationType: 'AUTO_GRADED',
        };
      } else {
        // AI-evaluate subjective questions
        const context: EvaluationContext = {
          questionText: question.question,
          questionType: question.questionType === 'SHORT_ANSWER' ? 'SHORT_ANSWER' : 'ESSAY',
          expectedAnswer: question.correctAnswer || undefined,
          bloomsLevel: question.bloomsLevel,
          maxPoints: question.points,
          learningObjective: question.learningObjectiveId || undefined,
        };

        const aiResult = await this.subjectiveEvaluator.evaluateAnswer(
          answer.answer || '',
          context
        );

        totalScore += aiResult.score;
        if (aiResult.percentage >= 70) {
          bloomsBreakdown[bloomsLevel].correctCount++;
        }

        result = {
          questionId: question.id,
          questionText: question.question,
          questionType: question.questionType,
          bloomsLevel: question.bloomsLevel,
          studentAnswer: answer.answer || '',
          correctAnswer: question.correctAnswer || '',
          isCorrect: aiResult.percentage >= 70,
          pointsEarned: aiResult.score,
          maxPoints: question.points,
          feedback: aiResult.feedback,
          evaluationType: 'AI_EVALUATED',
          aiEvaluation: aiResult,
        };
      }

      questionResults.push(result);

      // Update answer record
      await db.enhancedAnswer.update({
        where: { id: answer.id },
        data: {
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned,
          evaluationType: result.evaluationType as 'AUTO_GRADED' | 'AI_EVALUATED' | 'TEACHER_GRADED' | 'HYBRID',
        },
      });
    }

    // Calculate percentages for Bloom's breakdown
    for (const level of Object.keys(bloomsBreakdown) as BloomsLevel[]) {
      const levelData = bloomsBreakdown[level];
      levelData.scorePercentage = levelData.questionsCount > 0
        ? Math.round((levelData.correctCount / levelData.questionsCount) * 100)
        : 0;
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassed = percentage >= exam.passingScore;

    // Generate cognitive profile
    const cognitiveProfile = this.generateCognitiveProfile(bloomsBreakdown);

    // Generate learning path recommendations
    const learningPath = await this.generateLearningPath(
      cognitiveProfile,
      questionResults,
      attempt.userId
    );

    // Generate overall feedback
    const overallFeedback = await this.generateOverallFeedback(
      percentage,
      isPassed,
      cognitiveProfile,
      questionResults
    );

    // Calculate time spent
    const timeSpent = attempt.submittedAt && attempt.startedAt
      ? Math.round((new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) / 60000)
      : null;

    // Update exam attempt
    await db.userExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'GRADED',
        scorePercentage: percentage,
        isPassed,
        correctAnswers: questionResults.filter(r => r.isCorrect).length,
      },
    });

    // Update cognitive progress
    await this.updateCognitiveProgress(
      attempt.userId,
      exam.section?.chapter?.courseId || '',
      bloomsBreakdown,
      questionResults
    );

    return {
      examId: exam.id,
      attemptId,
      studentId: attempt.userId,
      totalScore,
      maxScore,
      percentage,
      isPassed,
      passingScore: exam.passingScore,
      timeSpent,
      bloomsBreakdown,
      questionResults,
      overallFeedback,
      cognitiveProfile,
      learningPath,
    };
  }

  private generateCognitiveProfile(bloomsBreakdown: BloomsBreakdown): CognitiveProfile {
    const levels = Object.entries(bloomsBreakdown) as [BloomsLevel, LevelPerformance][];

    const sortedLevels = levels
      .filter(([, data]) => data.questionsCount > 0)
      .sort((a, b) => b[1].scorePercentage - a[1].scorePercentage);

    const strengths = sortedLevels
      .filter(([, data]) => data.scorePercentage >= 70)
      .map(([level]) => level);

    const weaknesses = sortedLevels
      .filter(([, data]) => data.scorePercentage < 50)
      .map(([level]) => level);

    const recommendedFocus = sortedLevels
      .filter(([, data]) => data.scorePercentage >= 40 && data.scorePercentage < 70)
      .map(([level]) => level);

    const totalQuestions = levels.reduce((sum, [, data]) => sum + data.questionsCount, 0);
    const totalCorrect = levels.reduce((sum, [, data]) => sum + data.correctCount, 0);
    const overallMastery = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    return {
      overallMastery,
      strengths,
      weaknesses,
      recommendedFocus: recommendedFocus.length > 0 ? recommendedFocus : weaknesses.slice(0, 2),
    };
  }

  private async generateLearningPath(
    profile: CognitiveProfile,
    questionResults: QuestionResult[],
    userId: string
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    // Prioritize weaknesses
    for (const weakness of profile.weaknesses.slice(0, 2)) {
      const incorrectQuestions = questionResults.filter(
        q => q.bloomsLevel === weakness && !q.isCorrect
      );

      recommendations.push({
        type: 'remediate',
        title: `Strengthen ${this.bloomsLevelLabel(weakness)} Skills`,
        description: `Focus on ${this.bloomsLevelDescription(weakness)} to improve understanding.`,
        priority: 'HIGH',
        bloomsLevel: weakness,
        relatedConcepts: incorrectQuestions.map(q => this.extractConcept(q.questionText)).slice(0, 3),
        estimatedTime: 30,
      });
    }

    // Add practice for focus areas
    for (const focus of profile.recommendedFocus.slice(0, 2)) {
      recommendations.push({
        type: 'practice',
        title: `Practice ${this.bloomsLevelLabel(focus)}`,
        description: `Additional practice to solidify your ${this.bloomsLevelDescription(focus)} abilities.`,
        priority: 'MEDIUM',
        bloomsLevel: focus,
        relatedConcepts: [],
        estimatedTime: 20,
      });
    }

    // Suggest advancement for strengths
    if (profile.strengths.length > 0) {
      const topStrength = profile.strengths[0];
      const nextLevel = this.getNextBloomsLevel(topStrength);

      if (nextLevel) {
        recommendations.push({
          type: 'advance',
          title: `Advance to ${this.bloomsLevelLabel(nextLevel)}`,
          description: `You're ready to challenge yourself with more complex ${this.bloomsLevelDescription(nextLevel)} tasks.`,
          priority: 'LOW',
          bloomsLevel: nextLevel,
          relatedConcepts: [],
          estimatedTime: 25,
        });
      }
    }

    return recommendations;
  }

  private bloomsLevelLabel(level: BloomsLevel): string {
    const labels: Record<BloomsLevel, string> = {
      REMEMBER: 'Remember',
      UNDERSTAND: 'Understand',
      APPLY: 'Apply',
      ANALYZE: 'Analyze',
      EVALUATE: 'Evaluate',
      CREATE: 'Create',
    };
    return labels[level];
  }

  private bloomsLevelDescription(level: BloomsLevel): string {
    const descriptions: Record<BloomsLevel, string> = {
      REMEMBER: 'recalling and recognizing facts',
      UNDERSTAND: 'explaining and interpreting concepts',
      APPLY: 'using knowledge in new situations',
      ANALYZE: 'breaking down and examining information',
      EVALUATE: 'making judgments and defending decisions',
      CREATE: 'producing original work and solutions',
    };
    return descriptions[level];
  }

  private getNextBloomsLevel(level: BloomsLevel): BloomsLevel | null {
    const order: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const index = order.indexOf(level);
    return index < order.length - 1 ? order[index + 1] : null;
  }

  private extractConcept(questionText: string): string {
    // Simple concept extraction - first 50 chars or first sentence
    const firstSentence = questionText.split('.')[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  private async generateOverallFeedback(
    percentage: number,
    isPassed: boolean,
    profile: CognitiveProfile,
    questionResults: QuestionResult[]
  ): Promise<string> {
    const totalQuestions = questionResults.length;
    const correctQuestions = questionResults.filter(q => q.isCorrect).length;

    let feedback = '';

    if (percentage >= 90) {
      feedback = `Outstanding performance! You scored ${percentage}% (${correctQuestions}/${totalQuestions} questions correct). `;
    } else if (percentage >= 70) {
      feedback = `Good work! You scored ${percentage}% (${correctQuestions}/${totalQuestions} questions correct). `;
    } else if (percentage >= 50) {
      feedback = `You scored ${percentage}% (${correctQuestions}/${totalQuestions} questions correct). There's room for improvement. `;
    } else {
      feedback = `You scored ${percentage}% (${correctQuestions}/${totalQuestions} questions correct). Let's focus on building your understanding. `;
    }

    if (profile.strengths.length > 0) {
      feedback += `Your strengths are in ${profile.strengths.map(s => this.bloomsLevelLabel(s)).join(', ')}. `;
    }

    if (profile.weaknesses.length > 0) {
      feedback += `Consider focusing more on ${profile.weaknesses.map(w => this.bloomsLevelLabel(w)).join(', ')} skills. `;
    }

    feedback += isPassed ? 'Congratulations on passing!' : 'Keep practicing and you\'ll improve!';

    return feedback;
  }

  private async updateCognitiveProgress(
    userId: string,
    conceptId: string,
    bloomsBreakdown: BloomsBreakdown,
    _questionResults: QuestionResult[]
  ): Promise<void> {
    if (!conceptId) return; // Skip if no concept ID

    try {
      // Find or create cognitive progress record
      let progress = await db.cognitiveSkillProgress.findFirst({
        where: {
          userId,
          conceptId,
        },
      });

      // Calculate new mastery values based on bloom's breakdown
      const calculateMastery = (level: BloomsLevel) => {
        const data = bloomsBreakdown[level];
        if (data.questionsCount === 0) return progress?.[`${level.toLowerCase()}Mastery` as keyof typeof progress] as number || 0;
        const newPercentage = Math.round((data.correctCount / data.questionsCount) * 100);
        const currentMastery = progress?.[`${level.toLowerCase()}Mastery` as keyof typeof progress] as number || 0;
        // Weighted average: 70% current + 30% new
        return Math.round(currentMastery * 0.7 + newPercentage * 0.3);
      };

      const totalAttempts = (progress?.totalAttempts || 0) + 1;
      const overallMastery = (
        calculateMastery('REMEMBER') +
        calculateMastery('UNDERSTAND') +
        calculateMastery('APPLY') +
        calculateMastery('ANALYZE') +
        calculateMastery('EVALUATE') +
        calculateMastery('CREATE')
      ) / 6;

      const updateData = {
        rememberMastery: calculateMastery('REMEMBER'),
        understandMastery: calculateMastery('UNDERSTAND'),
        applyMastery: calculateMastery('APPLY'),
        analyzeMastery: calculateMastery('ANALYZE'),
        evaluateMastery: calculateMastery('EVALUATE'),
        createMastery: calculateMastery('CREATE'),
        overallMastery: Math.round(overallMastery),
        totalAttempts,
        lastAttemptDate: new Date(),
      };

      if (progress) {
        await db.cognitiveSkillProgress.update({
          where: { id: progress.id },
          data: updateData,
        });
      } else {
        await db.cognitiveSkillProgress.create({
          data: {
            userId,
            conceptId,
            ...updateData,
          },
        });
      }
    } catch (error) {
      logger.error('Error updating cognitive progress:', { error, userId, conceptId });
    }
  }

  private initializeProgressData(): Record<string, any> {
    return {
      remember: { attempts: 0, correct: 0, mastery: 0 },
      understand: { attempts: 0, correct: 0, mastery: 0 },
      apply: { attempts: 0, correct: 0, mastery: 0 },
      analyze: { attempts: 0, correct: 0, mastery: 0 },
      evaluate: { attempts: 0, correct: 0, mastery: 0 },
      create: { attempts: 0, correct: 0, mastery: 0 },
      overallMastery: 0,
    };
  }

  // ==========================================
  // SAM Chat Integration for Evaluation Help
  // ==========================================

  /**
   * Generate SAM response for student questions about their exam results
   */
  async explainResultToStudent(
    question: string,
    questionResult: QuestionResult,
    studentName: string
  ): Promise<string> {
    const systemPrompt = `You are SAM, a friendly and supportive AI tutor helping ${studentName} understand their exam performance.

Your role is to:
1. Explain why their answer was marked as correct/incorrect
2. Help them understand the concept better
3. Be encouraging and supportive
4. Provide clear, simple explanations
5. Suggest how they can improve

Be warm, patient, and educational. Avoid being judgmental.`;

    const context = `
Question: ${questionResult.questionText}
Bloom's Level: ${questionResult.bloomsLevel}
Student's Answer: ${questionResult.studentAnswer}
Correct Answer: ${questionResult.correctAnswer}
Points Earned: ${questionResult.pointsEarned}/${questionResult.maxPoints}
Feedback Given: ${questionResult.feedback}
${questionResult.aiEvaluation ? `AI Analysis: ${JSON.stringify(questionResult.aiEvaluation)}` : ''}
`;

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Context about this question:\n${context}\n\nStudent's question: ${question}` },
        ],
      });

      const aiResponse = response.content[0];
      return aiResponse.type === 'text' ? aiResponse.text : 'I\'m here to help! Could you rephrase your question?';
    } catch (error) {
      logger.error('Error generating student explanation:', { error });
      return 'I apologize, but I\'m having trouble right now. Please try again in a moment.';
    }
  }

  /**
   * Generate SAM response for teacher questions about grading
   */
  async assistTeacherGrading(
    question: string,
    gradingContext: {
      questionText: string;
      expectedAnswer: string;
      studentAnswer: string;
      currentScore: number;
      maxScore: number;
      aiEvaluation?: SubjectiveEvaluationResult;
    }
  ): Promise<string> {
    const systemPrompt = `You are SAM, an expert AI assistant helping teachers with grading.

Your role is to:
1. Help teachers make fair grading decisions
2. Provide objective analysis of student answers
3. Suggest appropriate scores based on rubrics
4. Identify patterns in student mistakes
5. Recommend constructive feedback

Be professional, objective, and helpful.`;

    const context = `
Question: ${gradingContext.questionText}
Expected Answer: ${gradingContext.expectedAnswer}
Student Answer: ${gradingContext.studentAnswer}
Current Score: ${gradingContext.currentScore}/${gradingContext.maxScore}
${gradingContext.aiEvaluation ? `AI Evaluation: ${JSON.stringify(gradingContext.aiEvaluation)}` : ''}
`;

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [
          { role: 'user', content: `Grading Context:\n${context}\n\nTeacher's Question: ${question}` },
        ],
      });

      const aiResponse = response.content[0];
      return aiResponse.type === 'text' ? aiResponse.text : 'I can help with that. Could you provide more details?';
    } catch (error) {
      logger.error('Error assisting teacher:', { error });
      return 'I apologize, but I\'m having trouble right now. Please try again.';
    }
  }
}

// Export singleton instance
export const samEvaluationEngine = new SAMEvaluationEngine();
