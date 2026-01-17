/**
 * @sam-ai/educational - Practice Problems Engine
 * Generates adaptive practice problems with hints, spaced repetition, and evaluation
 */
/**
 * PracticeProblemsEngine - Generates and manages adaptive practice problems
 *
 * Features:
 * - AI-powered problem generation aligned with Bloom's Taxonomy
 * - Adaptive difficulty based on user performance
 * - Progressive hints system
 * - Spaced repetition scheduling
 * - Detailed evaluation and feedback
 * - Session statistics and analytics
 */
export class PracticeProblemsEngine {
    config;
    database;
    aiAdapter;
    constructor(config = {}) {
        this.config = config;
        this.database = config.database;
        this.aiAdapter = config.aiAdapter;
    }
    /**
     * Generate practice problems for a topic
     */
    async generateProblems(input) {
        const { topic, bloomsLevel = 'APPLY', difficulty = 'intermediate', problemTypes = ['multiple_choice', 'short_answer'], count = 5, userSkillLevel = 50, learningObjectives = [], timeLimit, } = input;
        // If AI adapter is available, use AI generation
        if (this.aiAdapter) {
            return this.generateWithAI(input);
        }
        // Fallback to template-based generation
        const problems = [];
        const typesToGenerate = this.distributeTypes(problemTypes, count);
        for (let i = 0; i < count; i++) {
            const problemType = typesToGenerate[i % typesToGenerate.length];
            const adjustedDifficulty = this.adjustDifficulty(difficulty, userSkillLevel);
            const problem = this.generateTemplateProblem({
                topic,
                type: problemType,
                difficulty: adjustedDifficulty,
                bloomsLevel,
                index: i,
                learningObjectives,
                timeLimit: timeLimit ? Math.floor(timeLimit / count) : undefined,
            });
            problems.push(problem);
        }
        // Save problems if database is available
        if (this.database) {
            await this.database.saveProblems(problems);
        }
        return {
            problems,
            totalCount: problems.length,
            estimatedTime: problems.reduce((sum, p) => sum + (p.timeLimit || 5), 0),
            difficultyDistribution: this.countByDifficulty(problems),
            bloomsDistribution: this.countByBlooms(problems),
            coveredObjectives: learningObjectives,
            metadata: {
                generatedAt: new Date(),
                topic,
            },
        };
    }
    /**
     * Generate problems using AI
     */
    async generateWithAI(input) {
        const { topic, bloomsLevel = 'APPLY', difficulty = 'intermediate', problemTypes = ['multiple_choice', 'short_answer'], count = 5, learningObjectives = [], timeLimit, } = input;
        const prompt = this.buildGenerationPrompt(input);
        try {
            const response = await this.aiAdapter.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert educational content creator specializing in practice problems. Generate problems that are pedagogically sound, properly aligned with Bloom's Taxonomy, and include helpful hints and detailed solutions. Always respond with valid JSON.`,
                    },
                    { role: 'user', content: prompt },
                ],
            });
            const problems = this.parseGeneratedProblems(response.content, {
                topic,
                bloomsLevel,
                difficulty,
                problemTypes,
                count,
                learningObjectives,
                timeLimit,
            });
            // Save problems if database is available
            if (this.database) {
                await this.database.saveProblems(problems);
            }
            return {
                problems,
                totalCount: problems.length,
                estimatedTime: problems.reduce((sum, p) => sum + (p.timeLimit || 5), 0),
                difficultyDistribution: this.countByDifficulty(problems),
                bloomsDistribution: this.countByBlooms(problems),
                coveredObjectives: learningObjectives,
                metadata: {
                    generatedAt: new Date(),
                    topic,
                    model: 'ai-generated',
                },
            };
        }
        catch (error) {
            console.error('AI generation failed, falling back to templates:', error);
            return this.generateProblems({ ...input });
        }
    }
    /**
     * Evaluate a problem attempt
     */
    async evaluateAttempt(problem, userAnswer, options = {}) {
        const { partialCredit = true } = options;
        // For multiple choice, check against correct option
        if (problem.type === 'multiple_choice' && problem.options) {
            const correctOption = problem.options.find((o) => o.isCorrect);
            const isCorrect = correctOption?.id === userAnswer || correctOption?.text === userAnswer;
            return {
                isCorrect,
                partialCredit: isCorrect ? 1 : 0,
                pointsEarned: isCorrect ? problem.points : 0,
                feedback: isCorrect
                    ? 'Correct! ' + (correctOption?.explanation || problem.solutionExplanation)
                    : `Incorrect. ${correctOption?.explanation || problem.solutionExplanation}`,
                errors: isCorrect ? [] : ['Selected wrong answer'],
                suggestions: isCorrect
                    ? ['Try a more challenging problem']
                    : ['Review the concept and try again', 'Use hints if available'],
                conceptsToReview: isCorrect ? [] : problem.relatedConcepts,
                nextDifficulty: isCorrect ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
                nextBloomsLevel: isCorrect ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel,
            };
        }
        // For other types, use AI evaluation if available
        if (this.aiAdapter) {
            return this.evaluateWithAI(problem, userAnswer, partialCredit);
        }
        // Simple text matching fallback
        const normalizedAnswer = userAnswer.trim().toLowerCase();
        const normalizedCorrect = (problem.correctAnswer || '').trim().toLowerCase();
        const isCorrect = normalizedAnswer === normalizedCorrect;
        let partialScore = 0;
        if (!isCorrect && partialCredit) {
            // Calculate partial credit based on similarity
            partialScore = this.calculateSimilarity(normalizedAnswer, normalizedCorrect);
        }
        return {
            isCorrect,
            partialCredit: isCorrect ? 1 : partialScore,
            pointsEarned: isCorrect ? problem.points : Math.round(problem.points * partialScore),
            feedback: isCorrect
                ? 'Correct! ' + problem.solutionExplanation
                : `Not quite. ${problem.solutionExplanation}`,
            errors: isCorrect ? [] : ['Answer does not match expected solution'],
            suggestions: isCorrect
                ? ['Great job! Move on to more challenging problems']
                : ['Review the solution steps', 'Try using the hints'],
            conceptsToReview: isCorrect ? [] : problem.relatedConcepts,
            nextDifficulty: isCorrect ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
            nextBloomsLevel: isCorrect ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel,
        };
    }
    /**
     * Evaluate using AI
     */
    async evaluateWithAI(problem, userAnswer, partialCredit) {
        const prompt = `
Evaluate this student answer for the following practice problem:

**Problem:**
${problem.statement}

**Correct Answer:**
${problem.correctAnswer || problem.solutionExplanation}

**Student Answer:**
${userAnswer}

**Evaluation Criteria:**
- Correctness: Is the answer factually correct?
- Completeness: Does it address all parts of the question?
- Partial Credit: ${partialCredit ? 'Award partial credit for partially correct answers' : 'No partial credit'}

Respond in JSON format:
{
  "isCorrect": boolean,
  "partialCredit": number (0-1),
  "feedback": "detailed feedback string",
  "errors": ["list", "of", "errors"],
  "suggestions": ["improvement", "suggestions"],
  "conceptsToReview": ["concepts", "to", "review"]
}
`;
        try {
            const response = await this.aiAdapter.chat({
                messages: [
                    { role: 'system', content: 'You are an expert grader. Evaluate student answers fairly and provide helpful feedback. Respond only with valid JSON.' },
                    { role: 'user', content: prompt },
                ],
            });
            const result = JSON.parse(this.extractJson(response.content));
            return {
                isCorrect: result.isCorrect,
                partialCredit: result.partialCredit,
                pointsEarned: Math.round(problem.points * result.partialCredit),
                feedback: result.feedback,
                errors: result.errors || [],
                suggestions: result.suggestions || [],
                conceptsToReview: result.conceptsToReview || problem.relatedConcepts,
                nextDifficulty: result.isCorrect ? this.increaseDifficulty(problem.difficulty) : problem.difficulty,
                nextBloomsLevel: result.isCorrect ? this.increaseBloomsLevel(problem.bloomsLevel) : problem.bloomsLevel,
            };
        }
        catch {
            // Fallback to simple evaluation
            return this.evaluateAttempt(problem, userAnswer, { partialCredit: false });
        }
    }
    /**
     * Get the next hint for a problem
     */
    getNextHint(problem, hintsUsed) {
        const unusedHints = problem.hints
            .filter((h) => !hintsUsed.includes(h.id))
            .sort((a, b) => a.order - b.order);
        return unusedHints.length > 0 ? unusedHints[0] : null;
    }
    /**
     * Get adaptive difficulty recommendation
     */
    async getAdaptiveDifficulty(userId, topic) {
        if (!this.database) {
            return {
                recommended: 'intermediate',
                bloomsLevel: 'APPLY',
                confidence: 0.5,
                reasoning: 'No historical data available, starting with intermediate difficulty',
                trend: 'stable',
            };
        }
        const stats = await this.database.getSessionStats(userId);
        // Calculate success rates by difficulty
        const difficultySuccess = stats.byDifficulty;
        const currentSuccessRate = stats.totalAttempts > 0 ? stats.correctAnswers / stats.totalAttempts : 0.5;
        let recommended = 'intermediate';
        let bloomsLevel = 'APPLY';
        let trend = 'stable';
        // Determine recommended difficulty based on performance
        if (currentSuccessRate >= 0.8) {
            recommended = this.increaseDifficulty('intermediate');
            bloomsLevel = this.increaseBloomsLevel('APPLY');
            trend = 'improving';
        }
        else if (currentSuccessRate < 0.5) {
            recommended = 'beginner';
            bloomsLevel = 'UNDERSTAND';
            trend = 'declining';
        }
        // Check specific difficulty performance
        const advancedSuccess = difficultySuccess.advanced;
        if (advancedSuccess && advancedSuccess.attempts > 3 && advancedSuccess.correct / advancedSuccess.attempts >= 0.7) {
            recommended = 'expert';
            bloomsLevel = 'EVALUATE';
        }
        return {
            recommended,
            bloomsLevel,
            confidence: Math.min(0.9, 0.5 + stats.totalAttempts * 0.05),
            reasoning: this.generateDifficultyReasoning(stats, recommended),
            trend,
        };
    }
    /**
     * Update spaced repetition schedule based on attempt
     */
    async updateSpacedRepetition(userId, problemId, performance // 0-5 scale (0 = complete failure, 5 = perfect recall)
    ) {
        if (!this.database) {
            // Return default schedule without persistence
            return this.calculateNextReview({
                problemId,
                nextReviewDate: new Date(),
                intervalDays: 1,
                easeFactor: 2.5,
                reviewCount: 1,
                lastPerformance: performance,
            }, performance);
        }
        const schedules = await this.database.getRepetitionSchedule(userId);
        const existing = schedules.find((s) => s.problemId === problemId);
        const currentSchedule = existing || {
            problemId,
            nextReviewDate: new Date(),
            intervalDays: 1,
            easeFactor: 2.5,
            reviewCount: 0,
            lastPerformance: 0,
        };
        const newSchedule = this.calculateNextReview(currentSchedule, performance);
        await this.database.updateRepetitionSchedule(userId, problemId, newSchedule);
        return newSchedule;
    }
    /**
     * Calculate next review using SM-2 algorithm
     */
    calculateNextReview(current, performance) {
        // SM-2 Algorithm implementation
        const newEaseFactor = Math.max(1.3, current.easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02)));
        let newInterval;
        if (performance < 3) {
            // Failed - reset to 1 day
            newInterval = 1;
        }
        else if (current.reviewCount === 0) {
            newInterval = 1;
        }
        else if (current.reviewCount === 1) {
            newInterval = 6;
        }
        else {
            newInterval = Math.round(current.intervalDays * newEaseFactor);
        }
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);
        return {
            problemId: current.problemId,
            nextReviewDate: nextDate,
            intervalDays: newInterval,
            easeFactor: newEaseFactor,
            reviewCount: current.reviewCount + 1,
            lastPerformance: performance,
        };
    }
    /**
     * Get problems due for review
     */
    async getProblemsForReview(userId, limit = 10) {
        if (!this.database) {
            return [];
        }
        const schedules = await this.database.getRepetitionSchedule(userId);
        const now = new Date();
        const dueSchedules = schedules
            .filter((s) => s.nextReviewDate <= now)
            .sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime())
            .slice(0, limit);
        const problems = [];
        for (const schedule of dueSchedules) {
            const topicProblems = await this.database.getProblems('review', { limit: 1 });
            if (topicProblems.length > 0) {
                problems.push(topicProblems[0]);
            }
        }
        return problems;
    }
    /**
     * Get session statistics
     */
    async getSessionStats(userId, sessionId) {
        if (!this.database) {
            return this.getDefaultStats();
        }
        return this.database.getSessionStats(userId, sessionId);
    }
    // Helper methods
    buildGenerationPrompt(input) {
        return `
Generate ${input.count || 5} practice problems for the following specifications:

**Topic:** ${input.topic}
**Bloom's Taxonomy Level:** ${input.bloomsLevel || 'apply'}
**Difficulty:** ${input.difficulty || 'intermediate'}
**Problem Types:** ${(input.problemTypes || ['multiple_choice']).join(', ')}
**Learning Objectives:** ${input.learningObjectives?.join(', ') || 'General understanding'}

For each problem, provide:
1. A clear problem statement
2. For multiple choice: 4 options with one correct answer
3. 3 progressive hints (conceptual → procedural → partial solution)
4. A detailed solution explanation
5. Related concepts
6. Prerequisites

Respond with a JSON array of problems following this structure:
{
  "problems": [
    {
      "title": "Problem Title",
      "statement": "The problem statement",
      "type": "multiple_choice",
      "difficulty": "intermediate",
      "bloomsLevel": "apply",
      "points": 10,
      "options": [
        {"id": "a", "text": "Option A", "isCorrect": false, "explanation": "Why wrong"},
        {"id": "b", "text": "Option B", "isCorrect": true, "explanation": "Why correct"}
      ],
      "hints": [
        {"type": "conceptual", "content": "Think about...", "order": 1},
        {"type": "procedural", "content": "First step is...", "order": 2},
        {"type": "partial_solution", "content": "The answer starts with...", "order": 3}
      ],
      "solutionExplanation": "Detailed explanation",
      "relatedConcepts": ["concept1", "concept2"],
      "prerequisites": ["prereq1"]
    }
  ]
}
`;
    }
    parseGeneratedProblems(content, input) {
        try {
            const jsonContent = this.extractJson(content);
            const parsed = JSON.parse(jsonContent);
            const rawProblems = parsed.problems || parsed;
            return rawProblems.map((p, index) => ({
                id: `prob_${Date.now()}_${index}`,
                type: p.type || 'multiple_choice',
                title: p.title || `Problem ${index + 1}`,
                statement: p.statement || '',
                difficulty: p.difficulty || input.difficulty || 'intermediate',
                bloomsLevel: p.bloomsLevel || input.bloomsLevel || 'APPLY',
                points: p.points || 10,
                timeLimit: p.timeLimit || Math.floor((input.timeLimit || 25) / (input.count || 5)),
                options: p.options,
                correctAnswer: p.correctAnswer,
                hints: (p.hints || []).map((h, i) => ({
                    id: `hint_${index}_${i}`,
                    type: h.type || 'conceptual',
                    content: h.content || '',
                    order: h.order || i + 1,
                    penaltyPoints: 2,
                })),
                solution: p.solution,
                solutionExplanation: p.solutionExplanation || 'Solution explanation not available',
                relatedConcepts: p.relatedConcepts || [],
                prerequisites: p.prerequisites || [],
                tags: [input.topic, input.difficulty || 'intermediate'],
                learningObjectives: input.learningObjectives || [],
                createdAt: new Date(),
                metadata: { source: 'ai-generated' },
            }));
        }
        catch (error) {
            console.error('Failed to parse AI-generated problems:', error);
            return [];
        }
    }
    generateTemplateProblem(params) {
        const { topic, type, difficulty, bloomsLevel, index, learningObjectives, timeLimit } = params;
        const templates = this.getTemplatesForType(type, topic, difficulty);
        const template = templates[index % templates.length];
        return {
            id: `prob_${Date.now()}_${index}`,
            type,
            title: template.title,
            statement: template.statement,
            difficulty,
            bloomsLevel,
            points: this.getPointsForDifficulty(difficulty),
            timeLimit: timeLimit || 5,
            options: type === 'multiple_choice' ? template.options : undefined,
            correctAnswer: template.correctAnswer,
            hints: [
                { id: `hint_${index}_0`, type: 'conceptual', content: template.hints[0], order: 1, penaltyPoints: 2 },
                { id: `hint_${index}_1`, type: 'procedural', content: template.hints[1], order: 2, penaltyPoints: 3 },
                { id: `hint_${index}_2`, type: 'partial_solution', content: template.hints[2], order: 3, penaltyPoints: 5 },
            ],
            solutionExplanation: template.solution,
            relatedConcepts: [topic],
            prerequisites: [],
            tags: [topic, difficulty, bloomsLevel],
            learningObjectives,
            createdAt: new Date(),
        };
    }
    getTemplatesForType(type, topic, difficulty) {
        // Generic templates that can be customized
        const baseTemplates = [
            {
                title: `Understanding ${topic}`,
                statement: `Explain the key concepts of ${topic} and how they relate to practical applications.`,
                correctAnswer: `A comprehensive explanation covering the fundamentals of ${topic}.`,
                hints: [
                    `Think about the core definition of ${topic}.`,
                    `Consider how ${topic} is used in real-world scenarios.`,
                    `The explanation should cover: definition, key components, and applications.`,
                ],
                solution: `${topic} encompasses several key concepts that are fundamental to understanding the subject matter. The main components include the theoretical foundation, practical applications, and interconnections with related topics.`,
            },
            {
                title: `Applying ${topic}`,
                statement: `Given a scenario involving ${topic}, describe how you would apply your knowledge to solve the problem.`,
                correctAnswer: `A step-by-step approach to applying ${topic} principles.`,
                hints: [
                    `Start by identifying the relevant aspects of ${topic}.`,
                    `Break down the problem into smaller components.`,
                    `Apply the principles systematically to each component.`,
                ],
                solution: `To apply ${topic} effectively, first analyze the requirements, then select appropriate techniques, and finally implement the solution while considering best practices.`,
            },
        ];
        if (type === 'multiple_choice') {
            return [
                {
                    ...baseTemplates[0],
                    statement: `Which of the following best describes a key aspect of ${topic}?`,
                    options: [
                        { id: 'a', text: `A fundamental principle of ${topic}`, isCorrect: true, explanation: 'This correctly describes a core concept.' },
                        { id: 'b', text: `An unrelated concept`, isCorrect: false, explanation: 'This is not directly related to the topic.' },
                        { id: 'c', text: `A common misconception about ${topic}`, isCorrect: false, explanation: 'This represents a misunderstanding.' },
                        { id: 'd', text: `A tangentially related idea`, isCorrect: false, explanation: 'While related, this is not the best answer.' },
                    ],
                },
            ];
        }
        return baseTemplates;
    }
    distributeTypes(types, count) {
        const distributed = [];
        for (let i = 0; i < count; i++) {
            distributed.push(types[i % types.length]);
        }
        return distributed;
    }
    adjustDifficulty(base, skillLevel) {
        if (skillLevel < 30)
            return 'beginner';
        if (skillLevel < 50)
            return base === 'expert' ? 'advanced' : base;
        if (skillLevel > 80)
            return base === 'beginner' ? 'intermediate' : base;
        return base;
    }
    increaseDifficulty(current) {
        const order = ['beginner', 'intermediate', 'advanced', 'expert'];
        const idx = order.indexOf(current);
        return order[Math.min(idx + 1, order.length - 1)];
    }
    increaseBloomsLevel(current) {
        const order = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const idx = order.indexOf(current);
        return order[Math.min(idx + 1, order.length - 1)];
    }
    getPointsForDifficulty(difficulty) {
        switch (difficulty) {
            case 'beginner': return 5;
            case 'intermediate': return 10;
            case 'advanced': return 15;
            case 'expert': return 20;
            default: return 10;
        }
    }
    calculateSimilarity(a, b) {
        if (!a || !b)
            return 0;
        const aWords = new Set(a.split(/\s+/));
        const bWords = new Set(b.split(/\s+/));
        let matches = 0;
        aWords.forEach((word) => {
            if (bWords.has(word))
                matches++;
        });
        return matches / Math.max(aWords.size, bWords.size);
    }
    countByDifficulty(problems) {
        const counts = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
        problems.forEach((p) => counts[p.difficulty]++);
        return counts;
    }
    countByBlooms(problems) {
        const counts = {
            REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
        };
        problems.forEach((p) => counts[p.bloomsLevel]++);
        return counts;
    }
    generateDifficultyReasoning(stats, recommended) {
        const successRate = stats.totalAttempts > 0 ? stats.correctAnswers / stats.totalAttempts : 0;
        return `Based on ${stats.totalAttempts} attempts with ${Math.round(successRate * 100)}% success rate, ${recommended} difficulty is recommended.`;
    }
    extractJson(content) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
            content.match(/```\s*([\s\S]*?)\s*```/) ||
            content.match(/\{[\s\S]*\}/);
        return jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    }
    getDefaultStats() {
        return {
            totalAttempts: 0,
            correctAnswers: 0,
            averageScore: 0,
            totalPoints: 0,
            totalTime: 0,
            hintsUsed: 0,
            byDifficulty: { beginner: { attempts: 0, correct: 0 }, intermediate: { attempts: 0, correct: 0 }, advanced: { attempts: 0, correct: 0 }, expert: { attempts: 0, correct: 0 } },
            byBloomsLevel: { REMEMBER: { attempts: 0, correct: 0 }, UNDERSTAND: { attempts: 0, correct: 0 }, APPLY: { attempts: 0, correct: 0 }, ANALYZE: { attempts: 0, correct: 0 }, EVALUATE: { attempts: 0, correct: 0 }, CREATE: { attempts: 0, correct: 0 } },
            byProblemType: { multiple_choice: { attempts: 0, correct: 0 }, short_answer: { attempts: 0, correct: 0 }, coding: { attempts: 0, correct: 0 }, essay: { attempts: 0, correct: 0 }, fill_blank: { attempts: 0, correct: 0 }, matching: { attempts: 0, correct: 0 }, ordering: { attempts: 0, correct: 0 }, diagram: { attempts: 0, correct: 0 }, calculation: { attempts: 0, correct: 0 }, case_study: { attempts: 0, correct: 0 } },
            masteredConcepts: [],
            conceptsNeedingReview: [],
            currentStreak: 0,
            bestStreak: 0,
        };
    }
}
/**
 * Factory function to create a PracticeProblemsEngine instance
 */
export function createPracticeProblemsEngine(config) {
    return new PracticeProblemsEngine(config);
}
