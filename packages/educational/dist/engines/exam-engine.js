/**
 * @sam-ai/educational - ExamEngine
 * Portable exam generation engine using adapter pattern
 */
// ============================================================================
// EXAM ENGINE IMPLEMENTATION
// ============================================================================
export class AdvancedExamEngine {
    config;
    database;
    logger;
    constructor(engineConfig) {
        this.config = engineConfig.samConfig;
        this.database = engineConfig.database ?? engineConfig.samConfig.database;
        this.logger = this.config.logger ?? console;
    }
    /**
     * Generate a comprehensive exam with Bloom's taxonomy alignment
     */
    async generateExam(courseId, sectionIds, config, studentProfile) {
        this.logger?.info?.('[ExamEngine] Generating exam', { courseId, sectionIds, config });
        // Get existing questions from question bank if database available
        const existingQuestions = this.database
            ? await this.getQuestionBankQuestions(courseId, sectionIds)
            : [];
        // Analyze student performance if profile provided
        const studentAnalysis = studentProfile && this.database
            ? await this.analyzeStudentPerformance(studentProfile.userId, courseId)
            : null;
        // Generate questions based on config
        const questions = await this.generateQuestions(courseId, sectionIds, config, existingQuestions, studentAnalysis);
        // Calculate metadata
        const metadata = this.calculateMetadata(questions, config);
        // Calculate Bloom's alignment
        const bloomsAnalysis = this.calculateBloomsAlignment(config, questions);
        // Generate adaptive settings if enabled
        const adaptiveSettings = config.adaptiveMode
            ? this.generateAdaptiveSettings(config, studentProfile)
            : undefined;
        // Generate study guide
        const studyGuide = await this.generateStudyGuide(questions, studentProfile);
        const examId = this.generateId();
        return {
            exam: {
                id: examId,
                questions,
                metadata,
            },
            bloomsAnalysis,
            adaptiveSettings,
            studyGuide,
        };
    }
    /**
     * Get question bank questions using database adapter
     */
    async getQuestionBankQuestions(courseId, sectionIds) {
        if (!this.database)
            return [];
        try {
            // Build filter using Partial<SAMQuestion> structure
            const filter = {};
            if (courseId) {
                filter.courseId = courseId;
            }
            // For sectionIds, we'll filter by the first section if available
            // Full multi-section support would require multiple queries
            if (sectionIds && sectionIds.length > 0) {
                filter.sectionId = sectionIds[0];
            }
            const questions = await this.database.findQuestions(filter, { limit: 100 });
            return questions.map((q) => this.mapDatabaseQuestion(q));
        }
        catch (error) {
            this.logger?.warn?.('[ExamEngine] Error fetching question bank', error);
            return [];
        }
    }
    /**
     * Analyze student performance for adaptive exam generation
     */
    async analyzeStudentPerformance(userId, courseId) {
        if (!this.database || !courseId)
            return null;
        try {
            const progress = await this.database.findBloomsProgress(userId, courseId);
            if (!progress)
                return null;
            // Map individual score fields to BloomsLevel record
            const scores = {
                REMEMBER: progress.rememberScore ?? 0,
                UNDERSTAND: progress.understandScore ?? 0,
                APPLY: progress.applyScore ?? 0,
                ANALYZE: progress.analyzeScore ?? 0,
                EVALUATE: progress.evaluateScore ?? 0,
                CREATE: progress.createScore ?? 0,
            };
            const strengths = [];
            const weaknesses = [];
            for (const [level, score] of Object.entries(scores)) {
                if (score >= 70) {
                    strengths.push(level);
                }
                else if (score < 40) {
                    weaknesses.push(level);
                }
            }
            return {
                overallScore: progress.overallScore ?? (Object.values(scores).reduce((a, b) => a + b, 0) / 6),
                strengths,
                weaknesses,
                bloomsScores: scores,
            };
        }
        catch (error) {
            this.logger?.warn?.('[ExamEngine] Error analyzing student performance', error);
            return null;
        }
    }
    /**
     * Generate questions using AI
     */
    async generateQuestions(courseId, sectionIds, config, existingQuestions, studentAnalysis) {
        // Calculate how many questions we need to generate
        const existingCount = existingQuestions.length;
        const neededCount = Math.max(0, config.totalQuestions - existingCount);
        // Select existing questions that match the config
        const selectedExisting = this.selectMatchingQuestions(existingQuestions, config, Math.min(existingCount, config.totalQuestions));
        // Generate new questions if needed
        const generatedQuestions = [];
        if (neededCount > 0) {
            const newQuestions = await this.generateQuestionsWithAI(courseId, sectionIds, config, neededCount, studentAnalysis);
            generatedQuestions.push(...newQuestions);
        }
        // Combine and shuffle
        const allQuestions = [...selectedExisting, ...generatedQuestions];
        return this.shuffleArray(allQuestions).slice(0, config.totalQuestions);
    }
    /**
     * Generate questions using AI adapter
     */
    async generateQuestionsWithAI(_courseId, _sectionIds, config, count, studentAnalysis) {
        const prompt = this.buildQuestionGenerationPrompt(config, count, studentAnalysis);
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert educational assessment designer specializing in Bloom's Taxonomy-aligned question creation.
Generate exam questions that:
1. Align with specified Bloom's taxonomy levels
2. Match the requested difficulty distribution
3. Include clear, unambiguous wording
4. Provide comprehensive explanations
5. Are appropriate for adaptive testing if enabled

Return your response as a valid JSON array of questions.`,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                maxTokens: 4000,
            });
            return this.parseGeneratedQuestions(response.content);
        }
        catch (error) {
            this.logger?.error?.('[ExamEngine] AI question generation failed', error);
            return this.generateFallbackQuestions(config, count);
        }
    }
    /**
     * Build the question generation prompt
     */
    buildQuestionGenerationPrompt(config, count, studentAnalysis) {
        const adaptiveContext = studentAnalysis
            ? `\nStudent Analysis:
- Overall Score: ${studentAnalysis.overallScore.toFixed(1)}%
- Strengths: ${studentAnalysis.strengths.join(', ') || 'None identified'}
- Weaknesses: ${studentAnalysis.weaknesses.join(', ') || 'None identified'}
- Focus more questions on weakness areas for remediation.`
            : '';
        return `Generate ${count} exam questions with the following specifications:

Bloom's Taxonomy Distribution:
${Object.entries(config.bloomsDistribution)
            .map(([level, pct]) => `- ${level}: ${pct}%`)
            .join('\n')}

Difficulty Distribution:
${Object.entries(config.difficultyDistribution)
            .map(([level, pct]) => `- ${level}: ${pct}%`)
            .join('\n')}

Question Types Allowed: ${config.questionTypes.join(', ')}
Adaptive Mode: ${config.adaptiveMode ? 'Enabled - include hints and adaptive metadata' : 'Disabled'}
${adaptiveContext}

Return a JSON array where each question has:
{
  "id": "unique-id",
  "text": "question text",
  "questionType": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|ESSAY|FILL_IN_BLANK|MATCHING|ORDERING",
  "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
  "difficulty": "EASY|MEDIUM|HARD",
  "options": [{"id": "a", "text": "option", "isCorrect": true/false}] // for MCQ
  "correctAnswer": "correct answer or explanation",
  "explanation": "detailed explanation of the answer",
  "hints": ["hint1", "hint2"] // optional, for adaptive mode
  "timeEstimate": 60, // seconds
  "points": 10,
  "tags": ["topic1", "topic2"]
}`;
    }
    /**
     * Parse AI-generated questions
     */
    parseGeneratedQuestions(content) {
        try {
            // Extract JSON array from response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                this.logger?.warn?.('[ExamEngine] No JSON array found in AI response');
                return [];
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.map((q, index) => ({
                id: q.id || this.generateId(),
                text: q.text || '',
                questionType: q.questionType || 'MULTIPLE_CHOICE',
                bloomsLevel: q.bloomsLevel || 'UNDERSTAND',
                difficulty: q.difficulty || 'MEDIUM',
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || '',
                hints: q.hints,
                timeEstimate: q.timeEstimate || 60,
                points: q.points || 10,
                tags: q.tags || [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: !!q.hints,
                    learningObjective: q.learningObjective,
                    cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel),
                },
            }));
        }
        catch (error) {
            this.logger?.error?.('[ExamEngine] Failed to parse AI response', error);
            return [];
        }
    }
    /**
     * Generate fallback questions when AI fails
     */
    generateFallbackQuestions(config, count) {
        const questions = [];
        const levels = Object.keys(config.bloomsDistribution);
        const difficulties = Object.keys(config.difficultyDistribution);
        for (let i = 0; i < count; i++) {
            questions.push({
                id: this.generateId(),
                text: `Generated Question ${i + 1}`,
                questionType: config.questionTypes[i % config.questionTypes.length],
                bloomsLevel: levels[i % levels.length],
                difficulty: difficulties[i % difficulties.length],
                correctAnswer: 'To be determined',
                explanation: 'Explanation pending',
                timeEstimate: 60,
                points: 10,
                tags: [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    isAdaptive: config.adaptiveMode,
                },
            });
        }
        return questions;
    }
    /**
     * Select matching questions from existing pool
     */
    selectMatchingQuestions(questions, config, maxCount) {
        // Filter by question type
        const filtered = questions.filter((q) => config.questionTypes.includes(q.questionType));
        // Sort by Bloom's level alignment
        const sorted = filtered.sort((a, b) => {
            const aWeight = config.bloomsDistribution[a.bloomsLevel] || 0;
            const bWeight = config.bloomsDistribution[b.bloomsLevel] || 0;
            return bWeight - aWeight;
        });
        return sorted.slice(0, maxCount);
    }
    /**
     * Calculate exam metadata
     */
    calculateMetadata(questions, config) {
        const bloomsDist = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        const difficultyDist = {
            EASY: 0,
            MEDIUM: 0,
            HARD: 0,
        };
        let totalPoints = 0;
        let totalTime = 0;
        const topics = new Set();
        const objectives = new Set();
        for (const q of questions) {
            bloomsDist[q.bloomsLevel]++;
            difficultyDist[q.difficulty]++;
            totalPoints += q.points;
            totalTime += q.timeEstimate;
            q.tags.forEach((t) => topics.add(t));
            if (q.metadata.learningObjective) {
                objectives.add(q.metadata.learningObjective);
            }
        }
        return {
            totalQuestions: questions.length,
            totalPoints,
            estimatedDuration: Math.ceil(totalTime / 60), // Convert to minutes
            bloomsDistribution: bloomsDist,
            difficultyDistribution: difficultyDist,
            topicsCovered: Array.from(topics),
            learningObjectives: Array.from(objectives),
        };
    }
    /**
     * Calculate Bloom's alignment analysis
     */
    calculateBloomsAlignment(config, questions) {
        const actual = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const q of questions) {
            actual[q.bloomsLevel]++;
        }
        // Convert to percentages
        const total = questions.length || 1;
        const actualPct = {};
        const deviation = {};
        for (const level of Object.keys(actual)) {
            actualPct[level] = (actual[level] / total) * 100;
            deviation[level] = actualPct[level] - (config.bloomsDistribution[level] || 0);
        }
        // Calculate alignment score (100 = perfect alignment)
        const totalDeviation = Object.values(deviation).reduce((sum, d) => sum + Math.abs(d), 0);
        const alignmentScore = Math.max(0, 100 - totalDeviation / 2);
        // Generate cognitive progression
        const cognitiveProgression = this.generateCognitiveProgression(questions);
        // Calculate skills covered
        const skillsCovered = this.calculateSkillsCovered(questions);
        return {
            targetVsActual: {
                target: config.bloomsDistribution,
                actual: actualPct,
                deviation,
                alignmentScore,
            },
            cognitiveProgression,
            skillsCovered,
        };
    }
    /**
     * Generate adaptive settings
     */
    generateAdaptiveSettings(config, studentProfile) {
        const startingDifficulty = studentProfile
            ? studentProfile.currentLevel === 'advanced'
                ? 'HARD'
                : studentProfile.currentLevel === 'beginner'
                    ? 'EASY'
                    : 'MEDIUM'
            : 'MEDIUM';
        return {
            startingQuestionDifficulty: startingDifficulty,
            adjustmentRules: [
                { condition: 'correct_streak >= 3', action: 'increase_difficulty', threshold: 3 },
                { condition: 'incorrect_streak >= 2', action: 'decrease_difficulty', threshold: 2 },
                { condition: 'time_exceeded', action: 'offer_hint', threshold: 1.5 },
            ],
            performanceThresholds: [
                { level: 'mastery', minScore: 90, action: 'advance_to_next_level' },
                { level: 'proficient', minScore: 70, action: 'continue_current_level' },
                { level: 'developing', minScore: 50, action: 'provide_additional_practice' },
                { level: 'struggling', minScore: 0, action: 'remediate_and_scaffold' },
            ],
            minQuestions: Math.floor(config.totalQuestions * 0.5),
            maxQuestions: config.totalQuestions,
        };
    }
    /**
     * Generate study guide based on exam content
     */
    async generateStudyGuide(questions, studentProfile) {
        // Identify focus areas from questions
        const levelCounts = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const q of questions) {
            levelCounts[q.bloomsLevel]++;
        }
        // Focus on areas with most questions or student weaknesses
        const focusAreas = [];
        const sortedLevels = Object.entries(levelCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        for (const [level] of sortedLevels) {
            focusAreas.push(`${level} level questions - ${this.getCognitiveProcess(level)}`);
        }
        if (studentProfile?.weaknesses) {
            for (const weakness of studentProfile.weaknesses) {
                if (!focusAreas.some((f) => f.includes(weakness))) {
                    focusAreas.push(`${weakness} (identified weakness area)`);
                }
            }
        }
        // Generate recommended resources
        const recommendedResources = focusAreas.map((area, i) => ({
            type: i === 0 ? 'video' : i === 1 ? 'article' : 'practice',
            title: `Study Material: ${area}`,
            description: `Recommended resource for improving in ${area}`,
            relevance: 0.9 - i * 0.1,
        }));
        // Select practice questions (easier versions)
        const practiceQuestions = questions
            .filter((q) => q.difficulty !== 'HARD')
            .slice(0, 5);
        return {
            focusAreas,
            recommendedResources,
            practiceQuestions,
        };
    }
    /**
     * Get exam analysis
     */
    async getExamAnalysis(examId) {
        // This would typically fetch exam from database
        // For now, return a default analysis
        return {
            distribution: {
                REMEMBER: 15,
                UNDERSTAND: 20,
                APPLY: 25,
                ANALYZE: 20,
                EVALUATE: 15,
                CREATE: 5,
            },
            dominantLevel: 'APPLY',
            gaps: ['CREATE'],
            recommendations: [
                {
                    level: 'CREATE',
                    action: 'Add more synthesis and creation questions',
                    priority: 'high',
                },
            ],
            cognitiveProfile: {
                overallMastery: 65,
                levelMastery: {
                    REMEMBER: 80,
                    UNDERSTAND: 75,
                    APPLY: 70,
                    ANALYZE: 60,
                    EVALUATE: 50,
                    CREATE: 35,
                },
                learningVelocity: 0.7,
                preferredLevels: ['APPLY', 'UNDERSTAND'],
                challengeAreas: ['CREATE', 'EVALUATE'],
            },
        };
    }
    // ============================================================================
    // QUESTION BANK OPERATIONS
    // ============================================================================
    /**
     * Save questions to the question bank
     */
    async saveToQuestionBank(questions, courseId, subject, topic) {
        if (!this.database) {
            this.logger?.warn?.('[ExamEngine] No database adapter available for question bank');
            return { saved: 0, errors: ['No database adapter configured'] };
        }
        const errors = [];
        let savedCount = 0;
        for (const question of questions) {
            try {
                // Prepare question data for database
                // SAMQuestion expects options as string[], so we serialize our QuestionOption[]
                const optionsAsStrings = question.options?.map((o) => typeof o === 'string' ? o : JSON.stringify(o)) || [];
                // Map our question types to SAM core types
                const samQuestionType = this.mapQuestionTypeToSAM(question.questionType);
                const questionData = {
                    courseId: courseId || '', // Database adapter expects string
                    subject,
                    topic,
                    subtopic: question.subtopic || '',
                    question: question.question,
                    questionType: samQuestionType,
                    bloomsLevel: question.bloomsLevel,
                    difficulty: question.difficulty,
                    options: optionsAsStrings,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    hints: question.hints || [],
                    tags: question.tags,
                    points: 10, // Default points value
                    usageCount: 0,
                    avgTimeSpent: 0,
                    successRate: 0,
                    metadata: question.metadata || {},
                };
                await this.database.createQuestion(questionData);
                savedCount++;
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to save question "${question.question.slice(0, 50)}...": ${errorMsg}`);
                this.logger?.warn?.('[ExamEngine] Failed to save question to bank', error);
            }
        }
        this.logger?.info?.('[ExamEngine] Saved questions to bank', { saved: savedCount, errors: errors.length });
        return { saved: savedCount, errors };
    }
    /**
     * Retrieve questions from the question bank matching query criteria
     */
    async getFromQuestionBank(query) {
        if (!this.database) {
            this.logger?.warn?.('[ExamEngine] No database adapter available for question bank');
            return { questions: [], total: 0, hasMore: false };
        }
        try {
            // Build filter from query
            const filter = {};
            if (query.courseId)
                filter.courseId = query.courseId;
            if (query.subject)
                filter.subject = query.subject;
            if (query.topic)
                filter.topic = query.topic;
            if (query.bloomsLevel)
                filter.bloomsLevel = query.bloomsLevel;
            if (query.difficulty)
                filter.difficulty = query.difficulty;
            if (query.questionType)
                filter.questionType = query.questionType;
            const limit = query.limit ?? 50;
            const offset = query.offset ?? 0;
            // Query the database
            const dbQuestions = await this.database.findQuestions(filter, { limit: limit + 1, offset });
            // Check if there are more results
            const hasMore = dbQuestions.length > limit;
            const questions = dbQuestions.slice(0, limit);
            // Map to QuestionBankEntry format
            const mappedQuestions = questions.map((q) => this.mapToQuestionBankEntry(q));
            // Get total count (approximate)
            const total = hasMore ? offset + limit + 1 : offset + questions.length;
            return { questions: mappedQuestions, total, hasMore };
        }
        catch (error) {
            this.logger?.error?.('[ExamEngine] Failed to query question bank', error);
            return { questions: [], total: 0, hasMore: false };
        }
    }
    /**
     * Get statistics about the question bank
     */
    async getQuestionBankStats(query) {
        if (!this.database) {
            this.logger?.warn?.('[ExamEngine] No database adapter available for question bank stats');
            return this.getEmptyStats();
        }
        try {
            // Build filter from query
            const filter = {};
            if (query.courseId)
                filter.courseId = query.courseId;
            if (query.subject)
                filter.subject = query.subject;
            if (query.topic)
                filter.topic = query.topic;
            // Fetch all matching questions for stats calculation
            const questions = await this.database.findQuestions(filter, { limit: 10000 } // Get all for accurate stats
            );
            return this.calculateQuestionBankStats(questions);
        }
        catch (error) {
            this.logger?.error?.('[ExamEngine] Failed to get question bank stats', error);
            return this.getEmptyStats();
        }
    }
    /**
     * Update question usage statistics after exam completion
     */
    async updateQuestionUsage(questionIds, results) {
        if (!this.database) {
            this.logger?.warn?.('[ExamEngine] No database adapter available for usage update');
            return;
        }
        for (const result of results) {
            try {
                // This would typically update the question's usage stats
                // For now, we log the intent - actual implementation depends on DB adapter
                this.logger?.info?.('[ExamEngine] Would update question usage', {
                    questionId: result.questionId,
                    correct: result.correct,
                    timeSpent: result.timeSpent,
                });
            }
            catch (error) {
                this.logger?.warn?.('[ExamEngine] Failed to update question usage', error);
            }
        }
    }
    // ============================================================================
    // QUESTION BANK HELPER METHODS
    // ============================================================================
    mapToQuestionBankEntry(q) {
        return {
            id: q.id,
            courseId: q.courseId,
            subject: q.subject || '',
            topic: q.topic || '',
            subtopic: q.subtopic,
            question: q.question || q.text || '',
            questionType: q.questionType || 'MULTIPLE_CHOICE',
            bloomsLevel: q.bloomsLevel || 'UNDERSTAND',
            difficulty: q.difficulty || 'MEDIUM',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            hints: q.hints,
            tags: q.tags || [],
            usageCount: q.usageCount || 0,
            successRate: q.successRate || 0,
            avgTimeSpent: q.avgTimeSpent || 0,
            metadata: q.metadata,
        };
    }
    calculateQuestionBankStats(questions) {
        const stats = {
            totalQuestions: questions.length,
            bloomsDistribution: {
                REMEMBER: 0,
                UNDERSTAND: 0,
                APPLY: 0,
                ANALYZE: 0,
                EVALUATE: 0,
                CREATE: 0,
            },
            difficultyDistribution: {
                EASY: 0,
                MEDIUM: 0,
                HARD: 0,
            },
            typeDistribution: {
                MULTIPLE_CHOICE: 0,
                TRUE_FALSE: 0,
                SHORT_ANSWER: 0,
                ESSAY: 0,
                FILL_IN_BLANK: 0,
                MATCHING: 0,
                ORDERING: 0,
            },
            averageDifficulty: 0,
            totalUsage: 0,
        };
        if (questions.length === 0) {
            return stats;
        }
        let difficultySum = 0;
        for (const q of questions) {
            // Count Bloom's levels
            const bloomsLevel = q.bloomsLevel;
            if (bloomsLevel && bloomsLevel in stats.bloomsDistribution) {
                stats.bloomsDistribution[bloomsLevel]++;
            }
            // Count difficulties
            const difficulty = q.difficulty;
            if (difficulty && difficulty in stats.difficultyDistribution) {
                stats.difficultyDistribution[difficulty]++;
                difficultySum += difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : 3;
            }
            // Count question types
            const questionType = q.questionType;
            if (questionType && questionType in stats.typeDistribution) {
                stats.typeDistribution[questionType]++;
            }
            // Sum usage
            stats.totalUsage += q.usageCount || 0;
        }
        // Calculate average difficulty
        stats.averageDifficulty = difficultySum / questions.length;
        // Convert counts to percentages
        for (const level of Object.keys(stats.bloomsDistribution)) {
            stats.bloomsDistribution[level] =
                (stats.bloomsDistribution[level] / questions.length) * 100;
        }
        for (const diff of Object.keys(stats.difficultyDistribution)) {
            stats.difficultyDistribution[diff] =
                (stats.difficultyDistribution[diff] / questions.length) * 100;
        }
        for (const type of Object.keys(stats.typeDistribution)) {
            stats.typeDistribution[type] =
                (stats.typeDistribution[type] / questions.length) * 100;
        }
        return stats;
    }
    getEmptyStats() {
        return {
            totalQuestions: 0,
            bloomsDistribution: {
                REMEMBER: 0,
                UNDERSTAND: 0,
                APPLY: 0,
                ANALYZE: 0,
                EVALUATE: 0,
                CREATE: 0,
            },
            difficultyDistribution: {
                EASY: 0,
                MEDIUM: 0,
                HARD: 0,
            },
            typeDistribution: {
                MULTIPLE_CHOICE: 0,
                TRUE_FALSE: 0,
                SHORT_ANSWER: 0,
                ESSAY: 0,
                FILL_IN_BLANK: 0,
                MATCHING: 0,
                ORDERING: 0,
            },
            averageDifficulty: 0,
            totalUsage: 0,
        };
    }
    // ============================================================================
    // HELPER METHODS
    // ============================================================================
    mapQuestionTypeToSAM(questionType) {
        const mapping = {
            MULTIPLE_CHOICE: 'multiple_choice',
            TRUE_FALSE: 'true_false',
            SHORT_ANSWER: 'short_answer',
            ESSAY: 'essay',
            FILL_IN_BLANK: 'fill_blank',
            MATCHING: 'short_answer', // Map to short_answer as fallback
            ORDERING: 'short_answer', // Map to short_answer as fallback
        };
        return mapping[questionType] || 'multiple_choice';
    }
    mapDatabaseQuestion(q) {
        return {
            id: q.id,
            text: q.question || q.text || '',
            questionType: q.questionType || 'MULTIPLE_CHOICE',
            bloomsLevel: q.bloomsLevel || 'UNDERSTAND',
            difficulty: q.difficulty || 'MEDIUM',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            hints: q.hints,
            timeEstimate: q.timeEstimate || 60,
            points: q.points || 10,
            tags: q.tags || [],
            metadata: {
                createdAt: q.createdAt?.toISOString() || new Date().toISOString(),
                isAdaptive: !!q.hints,
                learningObjective: q.learningObjective,
                cognitiveProcess: this.getCognitiveProcess(q.bloomsLevel),
            },
        };
    }
    generateCognitiveProgression(questions) {
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const progression = [];
        for (const level of levels) {
            const count = questions.filter((q) => q.bloomsLevel === level).length;
            if (count > 0) {
                progression.push(`${level}: ${count} questions (${this.getCognitiveProcess(level)})`);
            }
        }
        return progression;
    }
    calculateSkillsCovered(questions) {
        const skillMap = new Map();
        for (const q of questions) {
            for (const tag of q.tags) {
                const existing = skillMap.get(tag);
                if (existing) {
                    existing.count++;
                }
                else {
                    skillMap.set(tag, { level: q.bloomsLevel, count: 1 });
                }
            }
        }
        return Array.from(skillMap.entries()).map(([name, data]) => ({
            name,
            bloomsLevel: data.level,
            coverage: (data.count / questions.length) * 100,
        }));
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
        return `exam-q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createExamEngine(config) {
    return new AdvancedExamEngine(config);
}
