/**
 * @sam-ai/educational - EvaluationEngine
 * Portable evaluation engine for grading and assessment using adapter pattern
 */
import { validateEvaluationResponse, validateGradingAssistanceResponse, validateAdaptiveQuestionResponse, validateAssessmentQuestionsResponse, } from '../validation';
// ============================================================================
// DEFAULT SETTINGS
// ============================================================================
const DEFAULT_SETTINGS = {
    enableAutoGrading: true,
    enableAIAssistance: true,
    enablePartialCredit: true,
    strictnessLevel: 'moderate',
    feedbackDepth: 'standard',
    bloomsAnalysis: true,
    misconceptionDetection: true,
    adaptiveHints: true,
};
// ============================================================================
// EVALUATION ENGINE IMPLEMENTATION
// ============================================================================
export class SAMEvaluationEngine {
    config;
    database;
    logger;
    settings;
    constructor(engineConfig) {
        this.config = engineConfig.samConfig;
        this.database = engineConfig.database ?? engineConfig.samConfig.database;
        this.logger = this.config.logger ?? console;
        this.settings = { ...DEFAULT_SETTINGS, ...engineConfig.settings };
    }
    /**
     * Evaluate a subjective answer (essay, short answer, etc.)
     */
    async evaluateAnswer(studentAnswer, context) {
        this.logger?.info?.('[EvaluationEngine] Evaluating subjective answer', {
            questionType: context.questionType,
            bloomsLevel: context.bloomsLevel,
        });
        if (!this.settings.enableAIAssistance) {
            return this.createPendingEvaluation(context);
        }
        const prompt = this.buildEvaluationPrompt(studentAnswer, context);
        try {
            const response = await this.config.ai.chat({
                messages: [
                    { role: 'system', content: this.getEvaluationSystemPrompt() },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3, // Lower temperature for consistent grading
                maxTokens: 2000,
            });
            return this.parseEvaluationResponse(response.content, context);
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] AI evaluation failed', error);
            return this.createPendingEvaluation(context);
        }
    }
    /**
     * Evaluate an objective answer (MCQ, True/False, etc.)
     */
    evaluateObjectiveAnswer(answer) {
        this.logger?.debug?.('[EvaluationEngine] Evaluating objective answer', {
            questionType: answer.questionType,
        });
        const result = this.gradeObjectiveAnswer(answer);
        return {
            questionId: answer.questionId,
            score: result.score,
            maxScore: answer.points,
            isCorrect: result.isCorrect,
            feedback: result.feedback,
            bloomsLevel: answer.bloomsLevel,
            evaluationType: 'AUTO_GRADED',
        };
    }
    /**
     * Get grading assistance for teachers
     */
    async getGradingAssistance(questionText, expectedAnswer, studentAnswer, rubric, bloomsLevel) {
        this.logger?.info?.('[EvaluationEngine] Providing grading assistance');
        const prompt = this.buildGradingAssistancePrompt(questionText, expectedAnswer, studentAnswer, rubric, bloomsLevel);
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert educational assessment specialist helping teachers grade student work.
Provide detailed grading assistance including:
1. Suggested score with confidence level
2. Rubric alignment analysis
3. Key strengths and weaknesses
4. Suggested feedback for the student
5. Teaching tips for addressing gaps

Be objective, fair, and constructive in your analysis.
Return your analysis as a JSON object.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                maxTokens: 2000,
            });
            return this.parseGradingAssistance(response.content, rubric.maxScore);
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Grading assistance failed', error);
            return this.createDefaultGradingAssistance(rubric.maxScore);
        }
    }
    /**
     * Explain evaluation result to student
     */
    async explainResultToStudent(question, result, studentName) {
        this.logger?.info?.('[EvaluationEngine] Generating student explanation');
        const prompt = `Explain the following assessment result to a student named ${studentName} in a supportive, educational manner:

Question: ${question}

Result:
- Score: ${result.score}/${result.maxScore} (${((result.score / result.maxScore) * 100).toFixed(1)}%)
- Bloom's Level: ${result.bloomsLevel}
- Feedback: ${result.feedback}
${result.strengths ? `- Strengths: ${result.strengths.join(', ')}` : ''}
${result.improvements ? `- Areas for Improvement: ${result.improvements.join(', ')}` : ''}

Provide:
1. A warm, encouraging opening
2. Clear explanation of what they did well
3. Constructive guidance on areas to improve
4. Specific next steps they can take
5. A motivating closing`;
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are a supportive AI tutor explaining assessment results to students.
Be encouraging, constructive, and specific. Use the student's name to personalize the response.
Focus on growth mindset and provide actionable next steps.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                maxTokens: 800,
            });
            return response.content;
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Student explanation failed', error);
            return this.createDefaultStudentExplanation(result, studentName);
        }
    }
    /**
     * Assist teacher with grading via chat
     */
    async assistTeacherGrading(question, gradingContext) {
        this.logger?.info?.('[EvaluationEngine] Assisting teacher grading');
        const prompt = `Teacher Question: ${question}

Grading Context:
- Question: ${gradingContext.questionText}
- Expected Answer: ${gradingContext.expectedAnswer}
- Student Answer: ${gradingContext.studentAnswer}
- Current Score: ${gradingContext.currentScore}/${gradingContext.maxScore}
${gradingContext.aiEvaluation ? `- AI Evaluation: ${JSON.stringify(gradingContext.aiEvaluation)}` : ''}

Provide helpful guidance to the teacher based on their question.`;
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert assessment specialist assisting teachers with grading.
Provide clear, professional guidance based on the teacher's specific question.
Reference the grading context and provide actionable advice.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.5,
                maxTokens: 1000,
            });
            return response.content;
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Teacher assistance failed', error);
            return 'I apologize, but I encountered an issue providing grading assistance. Please try again or contact support.';
        }
    }
    /**
     * Store evaluation result using database adapter
     */
    async storeEvaluationResult(answerId, questionId, evaluation) {
        if (!this.database) {
            this.logger?.debug?.('[EvaluationEngine] No database adapter, skipping storage');
            return;
        }
        try {
            // Use the interaction log as a generic storage mechanism
            await this.database.logInteraction({
                userId: 'system',
                pageType: 'ASSESSMENT',
                pagePath: `/assessment/${questionId}`,
                query: JSON.stringify({ answerId, questionId }),
                response: JSON.stringify({
                    score: evaluation.score,
                    maxScore: evaluation.maxScore,
                    feedback: evaluation.feedback,
                    demonstratedLevel: evaluation.demonstratedBloomsLevel,
                    accuracy: evaluation.accuracy,
                    completeness: evaluation.completeness,
                }),
                enginesUsed: ['evaluation-engine'],
                responseTimeMs: 0,
            });
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Failed to store evaluation', error);
        }
    }
    // ============================================================================
    // ASSESSMENT GENERATION
    // ============================================================================
    /**
     * Generate a complete assessment based on configuration
     */
    async generateAssessment(config) {
        this.logger?.info?.('[EvaluationEngine] Generating assessment', {
            type: config.assessmentType,
            subject: config.subject,
            topic: config.topic,
            questionCount: config.questionCount,
        });
        const prompt = this.buildAssessmentPrompt(config);
        try {
            const response = await this.config.ai.chat({
                messages: [
                    { role: 'system', content: this.getAssessmentSystemPrompt() },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                maxTokens: 4000,
            });
            const questions = this.parseGeneratedQuestions(response.content, config);
            const assessment = this.buildAssessment(questions, config);
            this.logger?.info?.('[EvaluationEngine] Assessment generated', {
                questionCount: questions.length,
                assessmentId: assessment.id,
            });
            return assessment;
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Assessment generation failed', error);
            throw new Error('Failed to generate assessment');
        }
    }
    /**
     * Generate next adaptive question based on student performance
     */
    async generateAdaptiveQuestion(request) {
        this.logger?.info?.('[EvaluationEngine] Generating adaptive question', {
            subject: request.subject,
            topic: request.topic,
            currentDifficulty: request.currentDifficulty,
        });
        // Analyze student performance
        const performanceAnalysis = this.analyzePerformance(request);
        // Determine next difficulty
        const adjustedDifficulty = this.determineNextDifficulty(request.currentDifficulty, performanceAnalysis, request.adaptiveSettings);
        // Generate question at the adjusted difficulty
        const prompt = this.buildAdaptiveQuestionPrompt(request, adjustedDifficulty, performanceAnalysis);
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert adaptive assessment designer.
Generate a single question that:
1. Matches the specified difficulty level
2. Targets identified gaps in student knowledge
3. Builds on previous correct answers
4. Avoids repeating similar question patterns

Return the question as a JSON object.`,
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                maxTokens: 1000,
            });
            const question = this.parseAdaptiveQuestion(response.content, request, adjustedDifficulty);
            const adaptationReason = this.getAdaptationReason(performanceAnalysis, adjustedDifficulty);
            const nextRecommendation = this.getNextRecommendation(performanceAnalysis);
            return {
                question,
                adjustedDifficulty,
                performanceAnalysis,
                adaptationReason,
                nextRecommendation,
            };
        }
        catch (error) {
            this.logger?.error?.('[EvaluationEngine] Adaptive question generation failed', error);
            return this.createFallbackAdaptiveResult(request, adjustedDifficulty, performanceAnalysis);
        }
    }
    // ============================================================================
    // ASSESSMENT GENERATION HELPERS
    // ============================================================================
    getAssessmentSystemPrompt() {
        return `You are an expert educational assessment designer specializing in Bloom's Taxonomy-aligned assessments.

Create assessments that:
1. Align questions with specified Bloom's taxonomy levels
2. Match the requested difficulty distribution
3. Include clear, unambiguous question wording
4. Provide comprehensive answer keys and explanations
5. Cover all specified learning objectives

Return questions as a valid JSON array.`;
    }
    buildAssessmentPrompt(config) {
        return `Generate a ${config.assessmentType} assessment with the following specifications:

Subject: ${config.subject}
Topic: ${config.topic}
Difficulty: ${config.difficulty}
Number of Questions: ${config.questionCount}
Time Limit: ${config.duration} minutes

Learning Objectives:
${config.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Bloom's Taxonomy Levels to Include: ${config.bloomsLevels.join(', ')}
Question Types Allowed: ${config.questionTypes.join(', ')}

Return a JSON array of questions, each with:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "${config.questionTypes[0]}|...",
  "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
  "difficulty": "${config.difficulty}",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}], // for MCQ
  "correctAnswer": "correct answer or model response",
  "explanation": "detailed explanation",
  "hints": ["hint1", "hint2"],
  "timeEstimate": 60, // seconds
  "points": 10,
  "tags": ["tag1", "tag2"],
  "learningObjective": "which learning objective this addresses"
}`;
    }
    parseGeneratedQuestions(content, config) {
        // Use schema validation for robust parsing
        const validationResult = validateAssessmentQuestionsResponse(content);
        if (validationResult.success && validationResult.data) {
            return validationResult.data.map((q, index) => ({
                id: q.id || this.generateId(),
                text: q.text || `Question ${index + 1}`,
                questionType: q.questionType || config.questionTypes[0],
                bloomsLevel: q.bloomsLevel || config.bloomsLevels[0],
                difficulty: q.difficulty || config.difficulty,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                hints: q.hints,
                timeEstimate: q.timeEstimate,
                points: q.points,
                tags: q.tags,
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: false,
                    learningObjective: q.learningObjective,
                    cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel),
                },
            }));
        }
        // Log validation error and return fallback questions
        this.logger?.warn?.('[EvaluationEngine] Assessment questions validation failed', {
            error: validationResult.error?.message,
            zodErrors: validationResult.error?.zodErrors,
        });
        return this.createFallbackQuestions(config);
    }
    buildAssessment(questions, config) {
        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
        const estimatedDuration = Math.ceil(questions.reduce((sum, q) => sum + q.timeEstimate, 0) / 60);
        const bloomsDistribution = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const q of questions) {
            bloomsDistribution[q.bloomsLevel]++;
        }
        return {
            id: this.generateId(),
            assessmentType: config.assessmentType,
            subject: config.subject,
            topic: config.topic,
            difficulty: config.difficulty,
            duration: config.duration,
            questions,
            metadata: {
                totalQuestions: questions.length,
                totalPoints,
                estimatedDuration,
                bloomsDistribution,
                learningObjectives: config.learningObjectives,
            },
            instructions: this.generateInstructions(config, questions.length, totalPoints),
            scoringGuide: {
                totalPoints,
                passingScore: Math.round(totalPoints * 0.6),
                gradingScale: {
                    A: 90,
                    B: 80,
                    C: 70,
                    D: 60,
                    F: 0,
                },
                partialCredit: this.settings.enablePartialCredit,
            },
            createdAt: new Date().toISOString(),
        };
    }
    generateInstructions(config, questionCount, totalPoints) {
        return `Welcome to this ${config.assessmentType} on ${config.topic}.

Instructions:
1. You have ${config.duration} minutes to complete this assessment.
2. There are ${questionCount} questions worth a total of ${totalPoints} points.
3. Read each question carefully before answering.
4. You may navigate between questions freely.
5. Submit your assessment when you are ready.

Good luck!`;
    }
    analyzePerformance(request) {
        const responses = request.studentResponses;
        if (responses.length === 0) {
            return {
                accuracy: 0.5,
                averageTimeSpent: 60,
                trend: 'stable',
                confidence: 0.5,
                timeEfficiency: 1.0,
            };
        }
        const correct = responses.filter((r) => r.isCorrect).length;
        const accuracy = correct / responses.length;
        const avgTime = responses.reduce((sum, r) => sum + r.timeSpent, 0) / responses.length;
        const avgConfidence = responses
            .filter((r) => r.confidence !== undefined)
            .reduce((sum, r) => sum + (r.confidence ?? 0.5), 0) / Math.max(1, responses.filter((r) => r.confidence !== undefined).length);
        // Calculate trend from last 3 responses
        const recent = responses.slice(-3);
        let trend = 'stable';
        if (recent.length >= 3) {
            const recentCorrect = recent.filter((r) => r.isCorrect).length;
            const olderCorrect = responses.slice(0, -3).filter((r) => r.isCorrect).length;
            const olderTotal = responses.length - 3;
            if (olderTotal > 0) {
                const recentRate = recentCorrect / 3;
                const olderRate = olderCorrect / olderTotal;
                if (recentRate > olderRate + 0.1)
                    trend = 'improving';
                else if (recentRate < olderRate - 0.1)
                    trend = 'declining';
            }
        }
        // Time efficiency (1.0 = on time, <1 = fast, >1 = slow)
        const expectedTime = 60; // Assume 60 seconds average per question
        const timeEfficiency = avgTime / expectedTime;
        return {
            accuracy,
            averageTimeSpent: avgTime,
            trend,
            confidence: avgConfidence,
            timeEfficiency,
        };
    }
    determineNextDifficulty(current, analysis, settings) {
        const targetAccuracy = settings?.targetAccuracy ?? 0.7;
        const adjustmentRate = settings?.difficultyAdjustmentRate ?? 0.15;
        // If performing well above target, increase difficulty
        if (analysis.accuracy > targetAccuracy + adjustmentRate) {
            return current === 'EASY' ? 'MEDIUM' : current === 'MEDIUM' ? 'HARD' : 'HARD';
        }
        // If performing below target, decrease difficulty
        if (analysis.accuracy < targetAccuracy - adjustmentRate) {
            return current === 'HARD' ? 'MEDIUM' : current === 'MEDIUM' ? 'EASY' : 'EASY';
        }
        // Stay at current level
        return current;
    }
    buildAdaptiveQuestionPrompt(request, difficulty, analysis) {
        const previousTopics = request.previousQuestions.map((q) => q.tags.join(', ')).join('; ');
        const incorrectPatterns = request.studentResponses
            .filter((r) => !r.isCorrect)
            .map((r) => {
            const q = request.previousQuestions.find((pq) => pq.id === r.questionId);
            return q?.tags.join(', ') || '';
        })
            .filter((t) => t)
            .join('; ');
        return `Generate an adaptive question for:

Subject: ${request.subject}
Topic: ${request.topic}
Target Difficulty: ${difficulty}

Student Performance:
- Accuracy: ${(analysis.accuracy * 100).toFixed(1)}%
- Trend: ${analysis.trend}
- Previous Topics Covered: ${previousTopics || 'None'}
- Areas Needing Work: ${incorrectPatterns || 'None identified'}

Generate a question that:
1. Is at ${difficulty} difficulty level
2. ${analysis.accuracy < 0.5 ? 'Reinforces fundamental concepts' : 'Challenges the student appropriately'}
3. Avoids repeating exact topics from previous questions
4. ${analysis.trend === 'declining' ? 'Provides scaffolding to rebuild confidence' : 'Maintains engagement'}

Return as JSON:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "MULTIPLE_CHOICE",
  "bloomsLevel": "UNDERSTAND|APPLY|ANALYZE",
  "difficulty": "${difficulty}",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}],
  "correctAnswer": "correct answer",
  "explanation": "detailed explanation",
  "hints": ["hint1"],
  "timeEstimate": 60,
  "points": 10,
  "tags": ["topic"]
}`;
    }
    parseAdaptiveQuestion(content, request, difficulty) {
        // Use schema validation for robust parsing
        const validationResult = validateAdaptiveQuestionResponse(content);
        if (validationResult.success && validationResult.data) {
            const validated = validationResult.data;
            return {
                id: validated.id || this.generateId(),
                text: validated.text,
                questionType: validated.questionType || 'MULTIPLE_CHOICE',
                bloomsLevel: validated.bloomsLevel || 'UNDERSTAND',
                difficulty,
                options: validated.options,
                correctAnswer: validated.correctAnswer,
                explanation: validated.explanation,
                hints: validated.hints,
                timeEstimate: validated.timeEstimate,
                points: validated.points,
                tags: validated.tags.length > 0 ? validated.tags : [request.topic],
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: true,
                    cognitiveProcess: this.getCognitiveProcess(validated.bloomsLevel),
                },
            };
        }
        // Log validation error and throw
        this.logger?.error?.('[EvaluationEngine] Adaptive question validation failed', {
            error: validationResult.error?.message,
            zodErrors: validationResult.error?.zodErrors,
        });
        throw new Error(`Failed to parse adaptive question: ${validationResult.error?.message ?? 'Unknown error'}`);
    }
    getAdaptationReason(analysis, newDifficulty) {
        if (analysis.accuracy >= 0.8 && newDifficulty === 'HARD') {
            return 'Excellent performance! Increasing difficulty to challenge you further.';
        }
        if (analysis.accuracy < 0.5 && newDifficulty === 'EASY') {
            return 'Let&apos;s build your confidence with some foundational questions.';
        }
        if (analysis.trend === 'improving') {
            return 'Great progress! Keep up the momentum.';
        }
        if (analysis.trend === 'declining') {
            return 'Taking a step back to reinforce core concepts.';
        }
        return 'Continuing at the current level to solidify understanding.';
    }
    getNextRecommendation(analysis) {
        if (analysis.accuracy >= 0.8) {
            return 'Consider advancing to more complex topics.';
        }
        if (analysis.accuracy < 0.5) {
            return 'Review fundamental concepts before continuing.';
        }
        return 'Continue practicing to build mastery.';
    }
    createFallbackQuestions(config) {
        const questions = [];
        for (let i = 0; i < config.questionCount; i++) {
            questions.push({
                id: this.generateId(),
                text: `Question ${i + 1} about ${config.topic}`,
                questionType: config.questionTypes[i % config.questionTypes.length],
                bloomsLevel: config.bloomsLevels[i % config.bloomsLevels.length],
                difficulty: config.difficulty,
                correctAnswer: 'To be determined',
                explanation: 'Explanation pending',
                timeEstimate: 60,
                points: 10,
                tags: [config.subject, config.topic],
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: false,
                },
            });
        }
        return questions;
    }
    createFallbackAdaptiveResult(request, difficulty, analysis) {
        return {
            question: {
                id: this.generateId(),
                text: `Review question about ${request.topic}`,
                questionType: 'MULTIPLE_CHOICE',
                bloomsLevel: 'UNDERSTAND',
                difficulty,
                correctAnswer: 'To be determined',
                explanation: 'Explanation pending',
                timeEstimate: 60,
                points: 10,
                tags: [request.subject, request.topic],
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: true,
                },
            },
            adjustedDifficulty: difficulty,
            performanceAnalysis: analysis,
            adaptationReason: 'Generated fallback question.',
            nextRecommendation: 'Continue practicing.',
        };
    }
    getCognitiveProcess(level) {
        const processes = {
            REMEMBER: 'Recall facts and basic concepts',
            UNDERSTAND: 'Explain ideas and concepts',
            APPLY: 'Use information in new situations',
            ANALYZE: 'Draw connections among ideas',
            EVALUATE: 'Justify decisions or arguments',
            CREATE: 'Produce new or original work',
        };
        return processes[level] || 'Unknown process';
    }
    generateId() {
        return `eval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    getEvaluationSystemPrompt() {
        const strictness = this.settings.strictnessLevel;
        const feedbackDepth = this.settings.feedbackDepth;
        return `You are an expert educational evaluator specialized in Bloom's Taxonomy-aligned assessment.

Evaluation Parameters:
- Strictness Level: ${strictness}
- Feedback Depth: ${feedbackDepth}
- Partial Credit: ${this.settings.enablePartialCredit ? 'Enabled' : 'Disabled'}
- Misconception Detection: ${this.settings.misconceptionDetection ? 'Enabled' : 'Disabled'}

Evaluate student answers based on:
1. Accuracy - correctness of information
2. Completeness - coverage of expected points
3. Relevance - staying on topic
4. Depth - level of analysis/understanding shown

For ${strictness} strictness:
${strictness === 'lenient' ? '- Be generous with partial credit\n- Focus on what student got right' : ''}
${strictness === 'moderate' ? '- Balance rigor with encouragement\n- Provide fair partial credit' : ''}
${strictness === 'strict' ? '- Hold to high standards\n- Require clear demonstration of understanding' : ''}

Return your evaluation as a JSON object with the specified structure.`;
    }
    buildEvaluationPrompt(studentAnswer, context) {
        const rubricSection = context.rubric
            ? `\nRubric Criteria:\n${context.rubric.criteria
                .map((c, i) => `${i + 1}. ${c.name}: ${c.description} (${c.maxPoints} points)`)
                .join('\n')}`
            : '';
        const variationsSection = context.acceptableVariations?.length
            ? `\nAcceptable Variations:\n${context.acceptableVariations.map((v) => `- ${v}`).join('\n')}`
            : '';
        return `Evaluate the following student answer:

Question: ${context.questionText}
Question Type: ${context.questionType}
Bloom's Level: ${context.bloomsLevel}
Max Points: ${context.maxPoints}
${context.learningObjective ? `Learning Objective: ${context.learningObjective}` : ''}

Expected Answer:
${context.expectedAnswer}
${variationsSection}
${rubricSection}

Student Answer:
${studentAnswer}

Provide a JSON evaluation with:
{
  "score": <number>,
  "maxScore": ${context.maxPoints},
  "accuracy": <0-100>,
  "completeness": <0-100>,
  "relevance": <0-100>,
  "depth": <0-100>,
  "feedback": "<constructive feedback string>",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "nextSteps": ["step1", "step2"],
  "demonstratedBloomsLevel": "<REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE>",
  "misconceptions": ["misconception1"] // if detected
}`;
    }
    parseEvaluationResponse(content, context) {
        // Use schema validation for robust parsing
        const validationResult = validateEvaluationResponse(content);
        if (validationResult.success && validationResult.data) {
            const validated = validationResult.data;
            return {
                score: Math.min(validated.score, context.maxPoints),
                maxScore: context.maxPoints,
                accuracy: validated.accuracy,
                completeness: validated.completeness,
                relevance: validated.relevance,
                depth: validated.depth,
                feedback: validated.feedback,
                strengths: validated.strengths,
                improvements: validated.improvements,
                nextSteps: validated.nextSteps,
                demonstratedBloomsLevel: validated.demonstratedBloomsLevel ?? context.bloomsLevel,
                misconceptions: validated.misconceptions,
            };
        }
        // Log validation error and return pending evaluation
        this.logger?.warn?.('[EvaluationEngine] Validation failed', {
            error: validationResult.error?.message,
            zodErrors: validationResult.error?.zodErrors,
        });
        return this.createPendingEvaluation(context);
    }
    buildGradingAssistancePrompt(questionText, expectedAnswer, studentAnswer, rubric, bloomsLevel) {
        return `Provide grading assistance for the following:

Question: ${questionText}
Bloom's Level: ${bloomsLevel}
Max Score: ${rubric.maxScore}

Rubric Criteria:
${rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Expected Answer:
${expectedAnswer}

Student Answer:
${studentAnswer}

Provide a JSON response with:
{
  "suggestedScore": <number>,
  "maxScore": ${rubric.maxScore},
  "confidence": <0-1>,
  "reasoning": "<detailed reasoning>",
  "rubricAlignment": [
    {"criterionName": "<name>", "score": <number>, "maxScore": <number>, "justification": "<text>"}
  ],
  "keyStrengths": ["strength1", "strength2"],
  "keyWeaknesses": ["weakness1", "weakness2"],
  "suggestedFeedback": "<feedback for student>",
  "flaggedIssues": ["issue1"],
  "comparisonToExpected": {
    "coveragePercentage": <0-100>,
    "missingKeyPoints": ["point1"],
    "extraneousPoints": ["point1"],
    "accuracyScore": <0-100>
  },
  "teacherTips": ["tip1", "tip2"]
}`;
    }
    parseGradingAssistance(content, maxScore) {
        // Use schema validation for robust parsing
        const validationResult = validateGradingAssistanceResponse(content);
        if (validationResult.success && validationResult.data) {
            const validated = validationResult.data;
            return {
                suggestedScore: Math.min(validated.suggestedScore, maxScore),
                maxScore,
                confidence: validated.confidence,
                reasoning: validated.reasoning,
                rubricAlignment: validated.rubricAlignment,
                keyStrengths: validated.keyStrengths,
                keyWeaknesses: validated.keyWeaknesses,
                suggestedFeedback: validated.suggestedFeedback,
                flaggedIssues: validated.flaggedIssues,
                comparisonToExpected: validated.comparisonToExpected,
                teacherTips: validated.teacherTips,
            };
        }
        // Log validation error and return default assistance
        this.logger?.warn?.('[EvaluationEngine] Grading assistance validation failed', {
            error: validationResult.error?.message,
            zodErrors: validationResult.error?.zodErrors,
        });
        return this.createDefaultGradingAssistance(maxScore);
    }
    gradeObjectiveAnswer(answer) {
        const studentAnswer = answer.studentAnswer?.toLowerCase?.() || '';
        const correctAnswer = answer.correctAnswer?.toLowerCase?.() || '';
        switch (answer.questionType) {
            case 'MULTIPLE_CHOICE': {
                const correctOption = answer.options?.find((o) => o.isCorrect);
                const isCorrect = studentAnswer === correctOption?.text?.toLowerCase() ||
                    studentAnswer === correctAnswer;
                return {
                    score: isCorrect ? answer.points : 0,
                    isCorrect,
                    feedback: isCorrect
                        ? 'Correct!'
                        : `Incorrect. The correct answer is: ${correctOption?.text || correctAnswer}`,
                };
            }
            case 'TRUE_FALSE': {
                const isCorrect = studentAnswer === correctAnswer;
                return {
                    score: isCorrect ? answer.points : 0,
                    isCorrect,
                    feedback: isCorrect
                        ? 'Correct!'
                        : `Incorrect. The correct answer is: ${correctAnswer}`,
                };
            }
            case 'MATCHING':
            case 'ORDERING': {
                try {
                    const studentParsed = JSON.parse(answer.studentAnswer);
                    const correctParsed = JSON.parse(answer.correctAnswer);
                    const matches = this.countMatches(studentParsed, correctParsed);
                    const total = Array.isArray(correctParsed)
                        ? correctParsed.length
                        : Object.keys(correctParsed).length;
                    const score = (matches / total) * answer.points;
                    const isCorrect = matches === total;
                    return {
                        score: this.settings.enablePartialCredit ? score : (isCorrect ? answer.points : 0),
                        isCorrect,
                        feedback: isCorrect
                            ? 'All matches correct!'
                            : `You got ${matches} out of ${total} correct.`,
                    };
                }
                catch {
                    return {
                        score: 0,
                        isCorrect: false,
                        feedback: 'Unable to parse your answer.',
                    };
                }
            }
            default:
                return {
                    score: 0,
                    isCorrect: false,
                    feedback: 'Unsupported question type for automatic grading.',
                };
        }
    }
    countMatches(student, correct) {
        if (Array.isArray(student) && Array.isArray(correct)) {
            return student.filter((item, index) => item === correct[index]).length;
        }
        if (typeof student === 'object' && typeof correct === 'object' && student && correct) {
            const studentObj = student;
            const correctObj = correct;
            return Object.entries(correctObj).filter(([key, value]) => studentObj[key] === value).length;
        }
        return 0;
    }
    createPendingEvaluation(context) {
        return {
            score: 0,
            maxScore: context.maxPoints,
            accuracy: 0,
            completeness: 0,
            relevance: 0,
            depth: 0,
            feedback: 'Evaluation pending teacher review.',
            strengths: [],
            improvements: [],
            nextSteps: ['Wait for teacher feedback'],
            demonstratedBloomsLevel: context.bloomsLevel,
        };
    }
    createDefaultGradingAssistance(maxScore) {
        return {
            suggestedScore: 0,
            maxScore,
            confidence: 0,
            reasoning: 'Unable to generate grading assistance. Please evaluate manually.',
            rubricAlignment: [],
            keyStrengths: [],
            keyWeaknesses: [],
            suggestedFeedback: '',
            flaggedIssues: ['AI assistance unavailable'],
            comparisonToExpected: {
                coveragePercentage: 0,
                missingKeyPoints: [],
                extraneousPoints: [],
                accuracyScore: 0,
            },
            teacherTips: ['Please evaluate this answer manually.'],
        };
    }
    createDefaultStudentExplanation(result, studentName) {
        const percentage = (result.score / result.maxScore) * 100;
        const performance = percentage >= 70 ? 'well' : percentage >= 50 ? 'satisfactorily' : 'with some challenges';
        return `Hi ${studentName},

Thank you for completing this assessment. You scored ${result.score} out of ${result.maxScore} points (${percentage.toFixed(1)}%), which shows you performed ${performance}.

${result.feedback}

Keep up the effort and continue learning!`;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createEvaluationEngine(config) {
    return new SAMEvaluationEngine(config);
}
// Also export as named class for backwards compatibility
export { SAMEvaluationEngine as EvaluationEngine };
