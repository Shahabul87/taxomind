/**
 * @sam-ai/educational - BloomsAnalysisEngine
 * Advanced Bloom's Taxonomy analysis engine with cognitive profiling
 */
// ============================================================================
// BLOOM'S LEVEL METADATA
// ============================================================================
const BLOOMS_HIERARCHY = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
];
const BLOOMS_KEYWORDS = {
    REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state', 'describe', 'match', 'recognize'],
    UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'discuss', 'paraphrase', 'illustrate'],
    APPLY: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'operate', 'practice'],
    ANALYZE: ['analyze', 'differentiate', 'examine', 'organize', 'contrast', 'investigate', 'categorize'],
    EVALUATE: ['evaluate', 'judge', 'critique', 'justify', 'argue', 'assess', 'defend', 'rate'],
    CREATE: ['create', 'design', 'develop', 'construct', 'produce', 'formulate', 'invent', 'compose'],
};
const BLOOMS_DESCRIPTIONS = {
    REMEMBER: 'Recall facts and basic concepts',
    UNDERSTAND: 'Explain ideas and concepts',
    APPLY: 'Use information in new situations',
    ANALYZE: 'Draw connections among ideas',
    EVALUATE: 'Justify decisions or arguments',
    CREATE: 'Produce new or original work',
};
// ============================================================================
// BLOOMS ANALYSIS ENGINE IMPLEMENTATION
// ============================================================================
export class BloomsAnalysisEngine {
    config;
    database;
    logger;
    analysisDepth;
    constructor(engineConfig) {
        this.config = engineConfig.samConfig;
        this.database = engineConfig.database ?? engineConfig.samConfig.database;
        this.logger = this.config.logger ?? console;
        this.analysisDepth = engineConfig.analysisDepth ?? 'standard';
    }
    /**
     * Analyze content for Bloom's Taxonomy distribution
     */
    async analyzeContent(content) {
        this.logger?.info?.('[BloomsEngine] Analyzing content');
        // Quick keyword-based analysis
        const keywordDistribution = this.analyzeKeywords(content);
        // For comprehensive analysis, use AI
        if (this.analysisDepth === 'comprehensive') {
            return this.analyzeWithAI(content, keywordDistribution);
        }
        // Calculate derived metrics
        const distribution = this.normalizeDistribution(keywordDistribution);
        const dominantLevel = this.getDominantLevel(distribution);
        const gaps = this.identifyGaps(distribution);
        const recommendations = this.generateRecommendations(distribution, gaps);
        return {
            distribution,
            dominantLevel,
            gaps,
            recommendations,
            cognitiveProfile: this.createDefaultProfile(distribution),
        };
    }
    /**
     * Analyze an entire course for Bloom's Taxonomy distribution
     * This is the main course-level analysis method
     */
    async analyzeCourse(courseData, options = {}) {
        const { depth = 'detailed', includeRecommendations = true, } = options;
        this.logger?.info?.('[BloomsEngine] Analyzing course', { courseId: courseData.id });
        // Analyze each chapter
        const chapterAnalyses = await this.analyzeChapters(courseData.chapters, depth);
        // Calculate course-level distribution
        const courseDistribution = this.calculateCourseDistribution(chapterAnalyses);
        const cognitiveDepth = this.calculateCognitiveDepth(courseDistribution);
        const balance = this.determineBalance(courseDistribution);
        // Generate learning pathway analysis
        const learningPathway = this.analyzeLearningPathway(chapterAnalyses);
        // Generate recommendations if requested
        const recommendations = includeRecommendations
            ? await this.generateCourseRecommendations(courseData, chapterAnalyses, courseDistribution)
            : { contentAdjustments: [], assessmentChanges: [], activitySuggestions: [] };
        // Analyze student impact
        const studentImpact = this.analyzeStudentImpact(courseDistribution, chapterAnalyses);
        return {
            courseId: courseData.id,
            courseLevel: {
                distribution: courseDistribution,
                cognitiveDepth,
                balance,
            },
            chapterAnalysis: chapterAnalyses,
            learningPathway,
            recommendations,
            studentImpact,
            analyzedAt: new Date().toISOString(),
        };
    }
    // ============================================================================
    // COURSE ANALYSIS HELPERS
    // ============================================================================
    async analyzeChapters(chapters, depth) {
        const analyses = [];
        for (const chapter of chapters) {
            const sectionAnalyses = await this.analyzeSections(chapter.sections, depth);
            const chapterDistribution = this.calculateChapterDistribution(sectionAnalyses);
            const primaryLevel = this.getDominantLevel(chapterDistribution);
            const cognitiveDepth = this.calculateCognitiveDepth(chapterDistribution);
            analyses.push({
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                bloomsDistribution: chapterDistribution,
                primaryLevel,
                cognitiveDepth,
                sections: sectionAnalyses,
            });
        }
        return analyses;
    }
    async analyzeSections(sections, depth) {
        const analyses = [];
        for (const section of sections) {
            // Analyze content to determine Bloom's level
            const bloomsLevel = await this.analyzeSectionContent(section, depth);
            const activities = this.extractActivities(section, bloomsLevel);
            const learningObjectives = section.learningObjectives || [];
            analyses.push({
                sectionId: section.id,
                sectionTitle: section.title,
                bloomsLevel,
                activities,
                learningObjectives,
            });
        }
        return analyses;
    }
    async analyzeSectionContent(section, depth) {
        // Combine section content for analysis
        const contentParts = [
            section.title,
            section.description || '',
            section.content || '',
            ...(section.learningObjectives || []),
        ];
        const combinedContent = contentParts.join(' ');
        // First check questions/exams for Bloom's levels
        const questionLevels = [];
        if (section.questions) {
            for (const q of section.questions) {
                if (q.bloomsLevel) {
                    questionLevels.push(q.bloomsLevel);
                }
                else {
                    questionLevels.push(this.analyzeQuestionText(q.text));
                }
            }
        }
        if (section.exams) {
            for (const exam of section.exams) {
                for (const q of exam.questions) {
                    if (q.bloomsLevel) {
                        questionLevels.push(q.bloomsLevel);
                    }
                    else {
                        questionLevels.push(this.analyzeQuestionText(q.text));
                    }
                }
            }
        }
        // If we have question levels, use the most common one
        if (questionLevels.length > 0) {
            return this.getMostCommonLevel(questionLevels);
        }
        // For comprehensive depth, use AI analysis
        if (depth === 'comprehensive' && combinedContent.length > 50) {
            return this.analyzeSectionWithAI(section);
        }
        // Otherwise use keyword-based analysis
        const keywordDistribution = this.analyzeKeywords(combinedContent);
        return this.getDominantLevel(this.normalizeDistribution(keywordDistribution));
    }
    async analyzeSectionWithAI(section) {
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert educational psychologist specializing in Bloom's Taxonomy.
Analyze the educational content and classify it according to Bloom's cognitive levels:
1. REMEMBER: Recall facts and basic concepts
2. UNDERSTAND: Explain ideas or concepts
3. APPLY: Use information in new situations
4. ANALYZE: Draw connections among ideas
5. EVALUATE: Justify a stand or decision
6. CREATE: Produce new or original work

Return ONLY the level name (e.g., "UNDERSTAND") without explanation.`,
                    },
                    {
                        role: 'user',
                        content: `Analyze this section and determine its primary Bloom's Taxonomy level:

Title: ${section.title}
Type: ${section.type || 'General'}
Has Video: ${section.hasVideo ? 'Yes' : 'No'}
Duration: ${section.duration || 'Unknown'} minutes
Description: ${section.description || 'No description'}
Learning Objectives: ${section.learningObjectives?.join(', ') || 'None specified'}`,
                    },
                ],
                temperature: 0.3,
                maxTokens: 50,
            });
            return this.parseBloomsLevelFromResponse(response.content);
        }
        catch (error) {
            this.logger?.warn?.('[BloomsEngine] AI analysis failed for section', error);
            return 'UNDERSTAND';
        }
    }
    analyzeQuestionText(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('define') || lowerText.includes('list') || lowerText.includes('name') || lowerText.includes('recall')) {
            return 'REMEMBER';
        }
        else if (lowerText.includes('explain') || lowerText.includes('describe') || lowerText.includes('summarize') || lowerText.includes('interpret')) {
            return 'UNDERSTAND';
        }
        else if (lowerText.includes('apply') || lowerText.includes('solve') || lowerText.includes('use') || lowerText.includes('demonstrate')) {
            return 'APPLY';
        }
        else if (lowerText.includes('analyze') || lowerText.includes('compare') || lowerText.includes('contrast') || lowerText.includes('differentiate')) {
            return 'ANALYZE';
        }
        else if (lowerText.includes('evaluate') || lowerText.includes('judge') || lowerText.includes('critique') || lowerText.includes('justify')) {
            return 'EVALUATE';
        }
        else if (lowerText.includes('create') || lowerText.includes('design') || lowerText.includes('develop') || lowerText.includes('construct')) {
            return 'CREATE';
        }
        return 'UNDERSTAND';
    }
    getMostCommonLevel(levels) {
        const counts = {
            REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
        };
        for (const level of levels) {
            counts[level]++;
        }
        let maxLevel = 'UNDERSTAND';
        let maxCount = 0;
        for (const [level, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    extractActivities(section, bloomsLevel) {
        const activities = [];
        if (section.hasVideo) {
            activities.push({
                type: 'video',
                bloomsLevel: this.getVideoBloomsLevel(bloomsLevel),
                description: 'Video content for visual learning',
            });
        }
        if (section.questions && section.questions.length > 0) {
            activities.push({
                type: 'practice_questions',
                bloomsLevel,
                description: `${section.questions.length} practice questions`,
            });
        }
        if (section.exams && section.exams.length > 0) {
            activities.push({
                type: 'assessment',
                bloomsLevel,
                description: `${section.exams.length} assessments`,
            });
        }
        if (section.content) {
            activities.push({
                type: 'reading',
                bloomsLevel: Math.min(BLOOMS_HIERARCHY.indexOf(bloomsLevel), 1) >= 0
                    ? BLOOMS_HIERARCHY[Math.min(BLOOMS_HIERARCHY.indexOf(bloomsLevel), 1)]
                    : 'UNDERSTAND',
                description: 'Reading content',
            });
        }
        return activities;
    }
    getVideoBloomsLevel(sectionLevel) {
        // Videos typically demonstrate concepts, so they're usually at UNDERSTAND level
        const sectionIndex = BLOOMS_HIERARCHY.indexOf(sectionLevel);
        if (sectionIndex <= 1)
            return 'UNDERSTAND';
        return sectionLevel;
    }
    calculateChapterDistribution(sections) {
        const counts = {
            REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0,
        };
        for (const section of sections) {
            counts[section.bloomsLevel]++;
        }
        const total = sections.length || 1;
        return {
            REMEMBER: (counts.REMEMBER / total) * 100,
            UNDERSTAND: (counts.UNDERSTAND / total) * 100,
            APPLY: (counts.APPLY / total) * 100,
            ANALYZE: (counts.ANALYZE / total) * 100,
            EVALUATE: (counts.EVALUATE / total) * 100,
            CREATE: (counts.CREATE / total) * 100,
        };
    }
    calculateCourseDistribution(chapters) {
        if (chapters.length === 0) {
            return { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
        }
        const totals = { REMEMBER: 0, UNDERSTAND: 0, APPLY: 0, ANALYZE: 0, EVALUATE: 0, CREATE: 0 };
        for (const chapter of chapters) {
            for (const level of BLOOMS_HIERARCHY) {
                totals[level] += chapter.bloomsDistribution[level];
            }
        }
        const count = chapters.length;
        return {
            REMEMBER: totals.REMEMBER / count,
            UNDERSTAND: totals.UNDERSTAND / count,
            APPLY: totals.APPLY / count,
            ANALYZE: totals.ANALYZE / count,
            EVALUATE: totals.EVALUATE / count,
            CREATE: totals.CREATE / count,
        };
    }
    calculateCognitiveDepth(distribution) {
        // Weighted average based on hierarchy position (CREATE = 6, REMEMBER = 1)
        let weightedSum = 0;
        let totalWeight = 0;
        for (let i = 0; i < BLOOMS_HIERARCHY.length; i++) {
            const level = BLOOMS_HIERARCHY[i];
            const weight = i + 1;
            weightedSum += distribution[level] * weight;
            totalWeight += distribution[level];
        }
        if (totalWeight === 0)
            return 0;
        return (weightedSum / totalWeight) / 6 * 100; // Normalize to 0-100
    }
    determineBalance(distribution) {
        const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
        const middleLevels = distribution.APPLY + distribution.ANALYZE;
        const higherLevels = distribution.EVALUATE + distribution.CREATE;
        if (lowerLevels > 50 && higherLevels < 20) {
            return 'bottom-heavy';
        }
        else if (higherLevels > 40 && lowerLevels < 30) {
            return 'top-heavy';
        }
        return 'well-balanced';
    }
    analyzeLearningPathway(chapters) {
        // Build current cognitive path from chapter analysis
        const stages = BLOOMS_HIERARCHY.map((level, index) => {
            let totalSections = 0;
            let matchingSections = 0;
            const activities = [];
            for (const chapter of chapters) {
                for (const section of chapter.sections) {
                    totalSections++;
                    if (section.bloomsLevel === level) {
                        matchingSections++;
                        activities.push(`${chapter.chapterTitle}: ${section.sectionTitle}`);
                    }
                }
            }
            return {
                level,
                mastery: totalSections > 0 ? (matchingSections / totalSections) * 100 : 0,
                activities: activities.slice(0, 5), // Top 5 activities
                timeEstimate: matchingSections * 15, // 15 min per section
            };
        });
        // Find current stage (first with low mastery)
        let currentStage = 0;
        for (let i = 0; i < stages.length; i++) {
            if (stages[i].mastery > 20)
                currentStage = i;
        }
        const totalMastery = stages.reduce((sum, s) => sum + s.mastery, 0);
        const completionPercentage = totalMastery / (stages.length * 100) * 100;
        // Identify gaps
        const gaps = [];
        for (let i = 0; i < stages.length; i++) {
            if (stages[i].mastery < 15) {
                gaps.push({
                    level: stages[i].level,
                    severity: stages[i].mastery < 5 ? 'high' : stages[i].mastery < 10 ? 'medium' : 'low',
                    description: `Limited ${BLOOMS_DESCRIPTIONS[stages[i].level].toLowerCase()} activities`,
                    suggestions: [
                        `Add more ${stages[i].level.toLowerCase()} level content`,
                        `Include assessments targeting ${stages[i].level.toLowerCase()} skills`,
                    ],
                });
            }
        }
        return {
            current: { stages, currentStage, completionPercentage },
            recommended: this.generateRecommendedPath(stages, gaps),
            gaps,
        };
    }
    generateRecommendedPath(currentStages, gaps) {
        // Generate ideal distribution
        const idealDistribution = {
            REMEMBER: 15, UNDERSTAND: 20, APPLY: 25, ANALYZE: 20, EVALUATE: 15, CREATE: 5,
        };
        const recommendedStages = currentStages.map((stage) => ({
            ...stage,
            mastery: idealDistribution[stage.level],
            activities: stage.activities.length > 0
                ? stage.activities
                : [`Recommended: Add ${stage.level.toLowerCase()} activities`],
        }));
        return {
            stages: recommendedStages,
            currentStage: 0,
            completionPercentage: 100,
        };
    }
    async generateCourseRecommendations(courseData, chapters, distribution) {
        const contentAdjustments = [];
        const assessmentChanges = [];
        const activitySuggestions = [];
        // Identify underrepresented levels
        const underrepresented = BLOOMS_HIERARCHY.filter((level) => distribution[level] < 10);
        for (const level of underrepresented) {
            contentAdjustments.push({
                type: 'add',
                bloomsLevel: level,
                description: `Add content targeting ${BLOOMS_DESCRIPTIONS[level].toLowerCase()}`,
                impact: distribution[level] < 5 ? 'high' : 'medium',
            });
            assessmentChanges.push({
                type: 'add_questions',
                bloomsLevel: level,
                description: `Include questions at the ${level} level`,
                examples: this.getQuestionExamples(level),
            });
        }
        // Check for balance issues
        const balance = this.determineBalance(distribution);
        if (balance === 'bottom-heavy') {
            activitySuggestions.push({
                bloomsLevel: 'ANALYZE',
                activityType: 'case_study',
                description: 'Add case studies requiring analysis',
                implementation: 'Present real-world scenarios for students to analyze',
                expectedOutcome: 'Improved critical thinking and analysis skills',
            });
            activitySuggestions.push({
                bloomsLevel: 'CREATE',
                activityType: 'project',
                description: 'Add creative project assignments',
                implementation: 'Assign open-ended projects requiring original work',
                expectedOutcome: 'Development of creative problem-solving abilities',
            });
        }
        return { contentAdjustments, assessmentChanges, activitySuggestions };
    }
    getQuestionExamples(level) {
        const examples = {
            REMEMBER: ['What is the definition of...?', 'List the main components of...'],
            UNDERSTAND: ['Explain why...', 'Summarize the key points of...'],
            APPLY: ['How would you apply... to solve...?', 'Demonstrate how to use...'],
            ANALYZE: ['Compare and contrast...', 'What are the relationships between...?'],
            EVALUATE: ['Evaluate the effectiveness of...', 'Which approach is better and why?'],
            CREATE: ['Design a solution for...', 'Develop a new approach to...'],
        };
        return examples[level];
    }
    analyzeStudentImpact(distribution, chapters) {
        // Generate skills developed
        const skillsDeveloped = BLOOMS_HIERARCHY
            .filter((level) => distribution[level] > 10)
            .map((level) => ({
            name: `${level.charAt(0)}${level.slice(1).toLowerCase()} Skills`,
            bloomsLevel: level,
            proficiency: Math.min(100, distribution[level] * 1.5),
            description: BLOOMS_DESCRIPTIONS[level],
        }));
        // Calculate cognitive growth projection
        const cognitiveDepth = this.calculateCognitiveDepth(distribution);
        const cognitiveGrowth = {
            currentLevel: cognitiveDepth,
            projectedLevel: Math.min(100, cognitiveDepth + 20),
            timeframe: `${chapters.length * 2} weeks`,
            keyMilestones: [
                'Master foundational concepts',
                'Apply knowledge to practical scenarios',
                'Develop critical analysis skills',
            ],
        };
        // Career alignment
        const careerAlignment = this.determineCareerAlignment(distribution);
        return { skillsDeveloped, cognitiveGrowth, careerAlignment };
    }
    determineCareerAlignment(distribution) {
        const careers = [];
        if (distribution.ANALYZE > 20 || distribution.EVALUATE > 15) {
            careers.push({
                role: 'Analyst',
                alignment: (distribution.ANALYZE + distribution.EVALUATE) / 2,
                requiredSkills: ['Critical thinking', 'Data analysis', 'Problem-solving'],
                matchedSkills: ['Analysis', 'Evaluation'],
            });
        }
        if (distribution.CREATE > 10 || distribution.APPLY > 20) {
            careers.push({
                role: 'Developer/Designer',
                alignment: (distribution.CREATE + distribution.APPLY) / 2,
                requiredSkills: ['Creative thinking', 'Technical skills', 'Innovation'],
                matchedSkills: ['Creation', 'Application'],
            });
        }
        if (distribution.UNDERSTAND > 20 && distribution.APPLY > 15) {
            careers.push({
                role: 'Practitioner',
                alignment: (distribution.UNDERSTAND + distribution.APPLY) / 2,
                requiredSkills: ['Domain knowledge', 'Practical skills', 'Communication'],
                matchedSkills: ['Understanding', 'Application'],
            });
        }
        return careers;
    }
    parseBloomsLevelFromResponse(text) {
        const upperText = text.toUpperCase();
        for (const level of BLOOMS_HIERARCHY) {
            if (upperText.includes(level)) {
                return level;
            }
        }
        return 'UNDERSTAND';
    }
    /**
     * Update cognitive progress for a student
     */
    async updateCognitiveProgress(userId, sectionId, bloomsLevel, score) {
        if (!this.database) {
            this.logger?.debug?.('[BloomsEngine] No database, skipping progress update');
            return;
        }
        try {
            // Get existing progress
            const existing = await this.database.findBloomsProgress(userId, sectionId);
            if (existing) {
                // Update existing progress - extract individual scores
                const scores = {
                    REMEMBER: existing.rememberScore ?? 0,
                    UNDERSTAND: existing.understandScore ?? 0,
                    APPLY: existing.applyScore ?? 0,
                    ANALYZE: existing.analyzeScore ?? 0,
                    EVALUATE: existing.evaluateScore ?? 0,
                    CREATE: existing.createScore ?? 0,
                };
                const currentScore = scores[bloomsLevel] ?? 0;
                // Weighted average with recent score
                scores[bloomsLevel] = (currentScore * 0.7) + (score * 0.3);
                // Map Bloom's levels to individual score fields
                await this.database.upsertBloomsProgress(userId, sectionId, {
                    rememberScore: scores.REMEMBER,
                    understandScore: scores.UNDERSTAND,
                    applyScore: scores.APPLY,
                    analyzeScore: scores.ANALYZE,
                    evaluateScore: scores.EVALUATE,
                    createScore: scores.CREATE,
                });
            }
            else {
                // Create new progress record using upsert
                await this.database.upsertBloomsProgress(userId, sectionId, {
                    rememberScore: bloomsLevel === 'REMEMBER' ? score : 0,
                    understandScore: bloomsLevel === 'UNDERSTAND' ? score : 0,
                    applyScore: bloomsLevel === 'APPLY' ? score : 0,
                    analyzeScore: bloomsLevel === 'ANALYZE' ? score : 0,
                    evaluateScore: bloomsLevel === 'EVALUATE' ? score : 0,
                    createScore: bloomsLevel === 'CREATE' ? score : 0,
                });
            }
        }
        catch (error) {
            this.logger?.error?.('[BloomsEngine] Failed to update cognitive progress', error);
        }
    }
    /**
     * Calculate spaced repetition schedule
     */
    async calculateSpacedRepetition(input) {
        // SM-2 algorithm implementation
        const { userId, conceptId, performance } = input;
        // Get existing schedule from database if available
        let repetitionCount = 1;
        let easeFactor = 2.5;
        let previousInterval = 1;
        if (this.database) {
            try {
                const existingProgress = await this.database.findCognitiveProgress(userId, conceptId);
                if (existingProgress) {
                    // Extract previous values from progress
                    const data = existingProgress;
                    repetitionCount = data.repetitionCount ?? 1;
                    easeFactor = data.easeFactor ?? 2.5;
                    previousInterval = data.lastInterval ?? 1;
                }
            }
            catch (error) {
                this.logger?.warn?.('[BloomsEngine] Could not fetch existing schedule', error);
            }
        }
        // Calculate new ease factor
        const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02)));
        // Calculate next interval
        let intervalDays;
        if (performance < 3) {
            // Failed - reset
            repetitionCount = 1;
            intervalDays = 1;
        }
        else {
            if (repetitionCount === 1) {
                intervalDays = 1;
            }
            else if (repetitionCount === 2) {
                intervalDays = 6;
            }
            else {
                intervalDays = Math.round(previousInterval * newEaseFactor);
            }
            repetitionCount++;
        }
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);
        // Note: Spaced repetition state is returned but not persisted
        // The SAMCognitiveProgress interface doesn't support SM-2 specific fields
        // For full persistence, implement custom storage via logInteraction or extend the interface
        return {
            nextReviewDate,
            intervalDays,
            easeFactor: newEaseFactor,
            repetitionCount,
        };
    }
    /**
     * Get cognitive profile for a user
     */
    async getCognitiveProfile(userId, courseId) {
        if (!this.database) {
            return this.createDefaultProfile({
                REMEMBER: 50,
                UNDERSTAND: 50,
                APPLY: 50,
                ANALYZE: 50,
                EVALUATE: 50,
                CREATE: 50,
            });
        }
        try {
            const progress = courseId
                ? await this.database.findBloomsProgress(userId, courseId)
                : null;
            if (!progress) {
                return this.createDefaultProfile({
                    REMEMBER: 50,
                    UNDERSTAND: 50,
                    APPLY: 50,
                    ANALYZE: 50,
                    EVALUATE: 50,
                    CREATE: 50,
                });
            }
            // Extract individual score fields from progress
            const scores = {
                REMEMBER: progress.rememberScore ?? 0,
                UNDERSTAND: progress.understandScore ?? 0,
                APPLY: progress.applyScore ?? 0,
                ANALYZE: progress.analyzeScore ?? 0,
                EVALUATE: progress.evaluateScore ?? 0,
                CREATE: progress.createScore ?? 0,
            };
            return this.createCognitiveProfile(scores);
        }
        catch (error) {
            this.logger?.error?.('[BloomsEngine] Failed to get cognitive profile', error);
            return this.createDefaultProfile({
                REMEMBER: 50,
                UNDERSTAND: 50,
                APPLY: 50,
                ANALYZE: 50,
                EVALUATE: 50,
                CREATE: 50,
            });
        }
    }
    /**
     * Get learning recommendations for a user
     */
    async getRecommendations(userId, courseId) {
        const profile = await this.getCognitiveProfile(userId, courseId);
        const recommendations = [];
        // Recommend remediation for challenge areas
        for (const level of profile.challengeAreas) {
            recommendations.push({
                type: 'remediate',
                title: `Strengthen ${level} Skills`,
                description: `Focus on ${BLOOMS_DESCRIPTIONS[level].toLowerCase()} to build a stronger foundation.`,
                bloomsLevel: level,
                priority: 1,
                estimatedTime: 30,
            });
        }
        // Recommend advancement from preferred levels
        for (const level of profile.preferredLevels) {
            const nextLevel = this.getNextLevel(level);
            if (nextLevel && !profile.preferredLevels.includes(nextLevel)) {
                recommendations.push({
                    type: 'advance',
                    title: `Progress to ${nextLevel}`,
                    description: `Build on your ${level} strength to develop ${BLOOMS_DESCRIPTIONS[nextLevel].toLowerCase()}.`,
                    bloomsLevel: nextLevel,
                    priority: 2,
                    estimatedTime: 45,
                });
            }
        }
        // Add practice recommendations
        if (profile.overallMastery < 70) {
            recommendations.push({
                type: 'practice',
                title: 'Regular Practice Sessions',
                description: 'Consistent practice across all cognitive levels will improve overall mastery.',
                bloomsLevel: 'APPLY',
                priority: 3,
                estimatedTime: 20,
            });
        }
        return recommendations.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Log learning activity
     */
    async logLearningActivity(userId, activityType, data) {
        if (!this.database)
            return;
        try {
            await this.database.logInteraction({
                userId,
                pageType: 'LEARNING_ACTIVITY',
                pagePath: `/activity/${activityType}`,
                query: activityType,
                response: JSON.stringify(data),
                enginesUsed: ['blooms-analysis-engine'],
                responseTimeMs: 0,
            });
        }
        catch (error) {
            this.logger?.warn?.('[BloomsEngine] Failed to log activity', error);
        }
    }
    /**
     * Create progress intervention
     */
    async createProgressIntervention(userId, type, title, message, metadata) {
        if (!this.database)
            return;
        try {
            await this.database.logInteraction({
                userId,
                pageType: 'INTERVENTION',
                pagePath: `/intervention/${type}`,
                query: title,
                response: JSON.stringify({ message, ...metadata }),
                enginesUsed: ['blooms-analysis-engine'],
                responseTimeMs: 0,
            });
        }
        catch (error) {
            this.logger?.warn?.('[BloomsEngine] Failed to create intervention', error);
        }
    }
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Enhanced keyword analysis with:
     * - Bigram matching alongside unigrams
     * - Context-window scoring (5 surrounding words for confirmation signals)
     * - Verb-object pattern detection (e.g., "analyze the relationship" > bare "analyze")
     * - Position weighting (questions/objectives score 1.5x vs body text)
     */
    analyzeKeywords(content) {
        const lowerContent = content.toLowerCase();
        const counts = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        // Split content into sentences for position weighting
        const sentences = lowerContent.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        const words = lowerContent.split(/\s+/).filter((w) => w.length > 0);
        // Build bigrams for multi-word pattern matching
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            bigrams.push(`${words[i]} ${words[i + 1]}`);
        }
        // Confirmation signals that boost a keyword's score
        const confirmationSignals = {
            REMEMBER: ['definition', 'list', 'name', 'identify', 'recall', 'describe', 'state'],
            UNDERSTAND: ['explain', 'meaning', 'example', 'interpret', 'summarize', 'paraphrase'],
            APPLY: ['solve', 'use', 'demonstrate', 'implement', 'calculate', 'execute'],
            ANALYZE: ['compare', 'contrast', 'examine', 'differentiate', 'relationship', 'pattern'],
            EVALUATE: ['justify', 'critique', 'assess', 'judge', 'argue', 'defend', 'evidence'],
            CREATE: ['design', 'develop', 'propose', 'construct', 'formulate', 'generate'],
        };
        for (const [level, keywords] of Object.entries(BLOOMS_KEYWORDS)) {
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                let match;
                const contentToSearch = lowerContent;
                // Reset regex lastIndex
                regex.lastIndex = 0;
                while ((match = regex.exec(contentToSearch)) !== null) {
                    let weight = 1.0;
                    // Position weighting: check if keyword is in a question or objective
                    const matchPos = match.index;
                    const surroundingText = contentToSearch.slice(Math.max(0, matchPos - 100), Math.min(contentToSearch.length, matchPos + 100));
                    // Questions and learning objectives get 1.5x weight
                    if (surroundingText.includes('?') ||
                        /\b(objective|goal|outcome|student will|learner will|be able to)\b/.test(surroundingText)) {
                        weight = 1.5;
                    }
                    // Context window: check 5 words before and after for confirmation signals
                    const wordIndex = contentToSearch.slice(0, matchPos).split(/\s+/).length - 1;
                    const windowStart = Math.max(0, wordIndex - 5);
                    const windowEnd = Math.min(words.length, wordIndex + 6);
                    const contextWindow = words.slice(windowStart, windowEnd);
                    const signals = confirmationSignals[level] ?? [];
                    const hasConfirmation = contextWindow.some((w) => signals.some((s) => w.includes(s)));
                    if (hasConfirmation) {
                        weight *= 1.3;
                    }
                    // Verb-object pattern: "analyze the relationship" scores higher
                    const afterKeyword = contentToSearch.slice(matchPos + keyword.length, matchPos + keyword.length + 30);
                    if (/^\s+(the|a|an|this|that|these|those)\s+\w+/.test(afterKeyword)) {
                        weight *= 1.2;
                    }
                    counts[level] += weight;
                }
            }
            // Bigram matching for multi-word Bloom's indicators
            const bigramPatterns = {
                REMEMBER: ['recall that', 'list the', 'name the', 'identify the'],
                UNDERSTAND: ['explain how', 'describe the', 'summarize the', 'interpret the'],
                APPLY: ['apply the', 'use the', 'solve the', 'implement the'],
                ANALYZE: ['analyze the', 'compare the', 'examine the', 'break down'],
                EVALUATE: ['evaluate the', 'assess the', 'justify the', 'judge the'],
                CREATE: ['create a', 'design a', 'develop a', 'propose a'],
            };
            const patterns = bigramPatterns[level] ?? [];
            for (const pattern of patterns) {
                for (const bigram of bigrams) {
                    if (bigram === pattern || bigram.startsWith(pattern)) {
                        counts[level] += 1.5; // Bigrams are strong signals
                    }
                }
            }
        }
        // Suppress unused variable warnings
        void sentences;
        return counts;
    }
    normalizeDistribution(counts) {
        const total = Object.values(counts).reduce((sum, c) => sum + c, 0) || 1;
        return {
            REMEMBER: (counts.REMEMBER / total) * 100,
            UNDERSTAND: (counts.UNDERSTAND / total) * 100,
            APPLY: (counts.APPLY / total) * 100,
            ANALYZE: (counts.ANALYZE / total) * 100,
            EVALUATE: (counts.EVALUATE / total) * 100,
            CREATE: (counts.CREATE / total) * 100,
        };
    }
    getDominantLevel(distribution) {
        let maxLevel = 'UNDERSTAND';
        let maxValue = 0;
        for (const [level, value] of Object.entries(distribution)) {
            if (value > maxValue) {
                maxValue = value;
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    identifyGaps(distribution) {
        const threshold = 10; // Less than 10% is considered a gap
        return Object.entries(distribution)
            .filter(([, value]) => value < threshold)
            .map(([level]) => level);
    }
    generateRecommendations(distribution, gaps) {
        const recommendations = [];
        for (const gap of gaps) {
            recommendations.push({
                level: gap,
                action: `Add more ${BLOOMS_DESCRIPTIONS[gap].toLowerCase()} activities`,
                priority: 'high',
            });
        }
        // Check for imbalance towards lower levels
        const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
        const higherLevels = distribution.EVALUATE + distribution.CREATE;
        if (lowerLevels > 60 && higherLevels < 20) {
            recommendations.push({
                level: 'EVALUATE',
                action: 'Balance with more higher-order thinking activities',
                priority: 'medium',
            });
        }
        return recommendations;
    }
    async analyzeWithAI(content, keywordDistribution) {
        try {
            const response = await this.config.ai.chat({
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert in Bloom's Taxonomy analysis for educational content.
Analyze the given content and provide a detailed cognitive level breakdown.
Return your analysis as a JSON object.`,
                    },
                    {
                        role: 'user',
                        content: `Analyze this content for Bloom's Taxonomy distribution:

${content.slice(0, 3000)}${content.length > 3000 ? '...' : ''}

Keyword-based preliminary analysis:
${JSON.stringify(keywordDistribution)}

Provide a JSON response with:
{
  "distribution": {
    "REMEMBER": <0-100>,
    "UNDERSTAND": <0-100>,
    "APPLY": <0-100>,
    "ANALYZE": <0-100>,
    "EVALUATE": <0-100>,
    "CREATE": <0-100>
  },
  "dominantLevel": "<level>",
  "gaps": ["<level>", ...],
  "reasoning": "<explanation>",
  "recommendations": [
    {"level": "<level>", "action": "<text>", "priority": "low|medium|high"}
  ]
}`,
                    },
                ],
                temperature: 0.3,
                maxTokens: 1500,
            });
            const jsonMatch = response.content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON in response');
            }
            const parsed = JSON.parse(jsonMatch[0]);
            const distribution = this.normalizeDistribution(parsed.distribution);
            return {
                distribution,
                dominantLevel: parsed.dominantLevel || this.getDominantLevel(distribution),
                gaps: parsed.gaps || this.identifyGaps(distribution),
                recommendations: parsed.recommendations || [],
                cognitiveProfile: this.createDefaultProfile(distribution),
            };
        }
        catch (error) {
            this.logger?.warn?.('[BloomsEngine] AI analysis failed, using keyword-based', error);
            const distribution = this.normalizeDistribution(keywordDistribution);
            return {
                distribution,
                dominantLevel: this.getDominantLevel(distribution),
                gaps: this.identifyGaps(distribution),
                recommendations: this.generateRecommendations(distribution, this.identifyGaps(distribution)),
                cognitiveProfile: this.createDefaultProfile(distribution),
            };
        }
    }
    createDefaultProfile(distribution) {
        const mastery = {};
        let total = 0;
        for (const level of BLOOMS_HIERARCHY) {
            mastery[level] = distribution[level];
            total += distribution[level];
        }
        const overallMastery = total / 6;
        const sortedLevels = [...BLOOMS_HIERARCHY].sort((a, b) => mastery[b] - mastery[a]);
        return {
            overallMastery,
            levelMastery: mastery,
            learningVelocity: 0.7,
            preferredLevels: sortedLevels.slice(0, 2),
            challengeAreas: sortedLevels.slice(-2).filter((l) => mastery[l] < 30),
        };
    }
    createCognitiveProfile(scores) {
        const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
        const overallMastery = total / 6;
        const sortedLevels = [...BLOOMS_HIERARCHY].sort((a, b) => scores[b] - scores[a]);
        return {
            overallMastery,
            levelMastery: scores,
            learningVelocity: overallMastery > 70 ? 0.9 : overallMastery > 50 ? 0.7 : 0.5,
            preferredLevels: sortedLevels.filter((l) => scores[l] >= 70).slice(0, 2),
            challengeAreas: sortedLevels.filter((l) => scores[l] < 40),
        };
    }
    getNextLevel(level) {
        const index = BLOOMS_HIERARCHY.indexOf(level);
        if (index < BLOOMS_HIERARCHY.length - 1) {
            return BLOOMS_HIERARCHY[index + 1];
        }
        return null;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createBloomsAnalysisEngine(config) {
    return new BloomsAnalysisEngine(config);
}
