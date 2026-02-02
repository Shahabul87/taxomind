/**
 * Metacognition Engine
 *
 * Handles self-reflection, learning awareness, study habit analysis,
 * and learning strategy recommendations.
 *
 * Key features:
 * - Reflection prompt generation (AI + template-based)
 * - Study habit tracking and analysis
 * - Learning strategy recommendations
 * - Confidence calibration
 * - Cognitive load assessment
 * - Goal setting and monitoring
 * - Metacognitive skill assessment
 */
// ============================================================================
// REFLECTION PROMPT TEMPLATES
// ============================================================================
const REFLECTION_TEMPLATES = {
    PRE_LEARNING: {
        SHALLOW: [
            'What do you already know about this topic?',
            'What are you hoping to learn?',
        ],
        MODERATE: [
            'What prior knowledge can you connect to this new topic?',
            'What specific questions do you want answered?',
            'How will you know when you understand this material?',
        ],
        DEEP: [
            'How does this topic relate to what you have learned before?',
            'What assumptions are you bringing to this topic?',
            'What would mastery of this topic look like for you?',
            'What obstacles might you encounter, and how will you address them?',
        ],
    },
    DURING_LEARNING: {
        SHALLOW: [
            'Does this make sense so far?',
            'What questions do you have?',
        ],
        MODERATE: [
            'Can you explain what you just learned in your own words?',
            'What parts are confusing or unclear?',
            'How does this connect to what you learned earlier?',
        ],
        DEEP: [
            'What is the main idea, and why is it important?',
            'Can you create an example or analogy to illustrate this concept?',
            'How would you explain this to someone who knows nothing about it?',
            'What would happen if this principle were different or not true?',
        ],
    },
    POST_LEARNING: {
        SHALLOW: [
            'What did you learn today?',
            'What was the most interesting part?',
        ],
        MODERATE: [
            'What are the three most important things you learned?',
            'What strategies helped you learn effectively?',
            'What would you do differently next time?',
        ],
        DEEP: [
            'How has your understanding changed from before you started?',
            'What connections can you make to other topics or real life?',
            'What questions do you still have, and how will you find answers?',
            'How will you apply what you learned?',
        ],
    },
    EXAM_PREP: {
        SHALLOW: [
            'What topics do you need to review?',
            'How confident are you about the exam?',
        ],
        MODERATE: [
            'Which topics do you understand well, and which need more work?',
            'What study strategies will you use to prepare?',
            'How will you manage your time before the exam?',
        ],
        DEEP: [
            'What types of questions do you expect, and how will you approach them?',
            'Where are your knowledge gaps, and what is your plan to address them?',
            'How will you handle stress or anxiety during the exam?',
            'What would successful exam performance look like for you?',
        ],
    },
    POST_EXAM: {
        SHALLOW: [
            'How do you think you did?',
            'What was easier or harder than expected?',
        ],
        MODERATE: [
            'What preparation strategies worked well?',
            'What would you do differently to prepare for the next exam?',
            'Which topics need further review?',
        ],
        DEEP: [
            'How accurate was your confidence about different topics?',
            'What does your performance tell you about your understanding?',
            'How will you adjust your learning approach based on this experience?',
            'What emotions did you experience, and how did they affect your performance?',
        ],
    },
    WEEKLY_REVIEW: {
        SHALLOW: [
            'What did you accomplish this week?',
            'What is your plan for next week?',
        ],
        MODERATE: [
            'What went well in your learning this week?',
            'What challenges did you face, and how did you handle them?',
            'Are you on track with your goals?',
        ],
        DEEP: [
            'What patterns do you notice in your learning this week?',
            'How effectively did you use your study time?',
            'What adjustments will you make to your approach next week?',
            'What are you most proud of, and what do you want to improve?',
        ],
    },
    GOAL_CHECK: {
        SHALLOW: [
            'Are you making progress toward your goal?',
            'What have you done recently to work toward it?',
        ],
        MODERATE: [
            'What progress have you made since you set this goal?',
            'What obstacles are in your way?',
            'Is your goal still relevant and motivating?',
        ],
        DEEP: [
            'How has your understanding of this goal evolved?',
            'What strategies are helping you make progress, and which are not?',
            'Do you need to adjust your goal or approach?',
            'What will it take to achieve this goal, and are you willing to do it?',
        ],
    },
    STRUGGLE_POINT: {
        SHALLOW: [
            'What is confusing you right now?',
            'What have you tried so far?',
        ],
        MODERATE: [
            'What specifically is making this difficult?',
            'What do you understand, and where does your understanding break down?',
            'What resources or help might you need?',
        ],
        DEEP: [
            'Is this a problem of not understanding, or not knowing how to apply?',
            'What prior knowledge might you be missing?',
            'How have you overcome similar struggles in the past?',
            'What would you tell a friend who was struggling with this?',
        ],
    },
};
// ============================================================================
// STRATEGY DESCRIPTIONS
// ============================================================================
const STRATEGY_INFO = {
    SPACED_PRACTICE: {
        description: 'Distribute study sessions over time rather than cramming',
        howToUse: 'Review material at increasing intervals (1 day, 3 days, 1 week, etc.)',
        effectiveness: 'high',
        bestFor: ['REMEMBER', 'UNDERSTAND'],
    },
    INTERLEAVING: {
        description: 'Mix different topics or problem types during study',
        howToUse: 'Alternate between different subjects or types of problems in one session',
        effectiveness: 'high',
        bestFor: ['APPLY', 'ANALYZE'],
    },
    RETRIEVAL_PRACTICE: {
        description: 'Actively recall information without looking at notes',
        howToUse: 'Close your notes and try to recall key concepts, then check accuracy',
        effectiveness: 'high',
        bestFor: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    },
    ELABORATIVE_INTERROGATION: {
        description: 'Ask yourself why facts are true and how they relate',
        howToUse: 'For each fact, ask "Why is this true?" and "How does this connect?"',
        effectiveness: 'high',
        bestFor: ['UNDERSTAND', 'ANALYZE'],
    },
    SELF_EXPLANATION: {
        description: 'Explain concepts to yourself as you learn',
        howToUse: 'Pause and explain what you just read in your own words',
        effectiveness: 'high',
        bestFor: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    },
    SUMMARIZATION: {
        description: 'Create concise summaries of material',
        howToUse: 'After reading a section, write a brief summary of key points',
        effectiveness: 'moderate',
        bestFor: ['REMEMBER', 'UNDERSTAND'],
    },
    VISUALIZATION: {
        description: 'Create mental images of concepts',
        howToUse: 'Form vivid mental pictures of abstract concepts or processes',
        effectiveness: 'moderate',
        bestFor: ['REMEMBER', 'UNDERSTAND'],
    },
    DUAL_CODING: {
        description: 'Combine verbal and visual representations',
        howToUse: 'Create diagrams, charts, or drawings alongside written notes',
        effectiveness: 'high',
        bestFor: ['UNDERSTAND', 'ANALYZE'],
    },
    CONCRETE_EXAMPLES: {
        description: 'Generate specific examples of abstract concepts',
        howToUse: 'For each abstract idea, create 2-3 concrete, real-world examples',
        effectiveness: 'high',
        bestFor: ['UNDERSTAND', 'APPLY'],
    },
    PRACTICE_TESTING: {
        description: 'Test yourself on material using practice questions',
        howToUse: 'Use flashcards, practice problems, or self-quizzes regularly',
        effectiveness: 'high',
        bestFor: ['REMEMBER', 'APPLY', 'EVALUATE'],
    },
    HIGHLIGHTING: {
        description: 'Mark important information in text',
        howToUse: 'Highlight key terms and concepts (but do not over-highlight)',
        effectiveness: 'low',
        bestFor: ['REMEMBER'],
    },
    REREADING: {
        description: 'Read material multiple times',
        howToUse: 'Read through the material again after initial reading',
        effectiveness: 'low',
        bestFor: ['REMEMBER'],
    },
};
// ============================================================================
// METACOGNITION ENGINE CLASS
// ============================================================================
export class MetacognitionEngine {
    config;
    samConfig;
    logger;
    // In-memory caches (would use database in production)
    sessionCache = new Map();
    goalCache = new Map();
    reflectionCache = new Map();
    strategyProfileCache = new Map();
    skillAssessmentCache = new Map();
    confidenceCache = new Map();
    regulationCache = new Map();
    constructor(config) {
        this.config = config;
        this.samConfig = config.samConfig;
        this.logger = config.samConfig.logger;
    }
    // ============================================================================
    // REFLECTION GENERATION
    // ============================================================================
    /**
     * Generate reflection prompts for a learner
     */
    async generateReflection(input) {
        this.logger?.info?.('[MetacognitionEngine] Generating reflection prompts', {
            userId: input.userId,
            type: input.type,
            depth: input.depth,
        });
        const depth = input.depth ?? this.config.defaultReflectionDepth ?? 'MODERATE';
        const prompts = [];
        // Get template-based prompts
        const templateQuestions = REFLECTION_TEMPLATES[input.type][depth];
        // Determine target skill based on reflection type
        const targetSkill = this.getTargetSkillForReflectionType(input.type);
        for (let i = 0; i < templateQuestions.length; i++) {
            const prompt = {
                id: `reflection-${input.type}-${i}-${Date.now()}`,
                type: input.type,
                depth,
                question: templateQuestions[i],
                followUpQuestions: this.generateFollowUpQuestions(templateQuestions[i], depth),
                targetSkill,
                suggestedTimeMinutes: this.getSuggestedTime(depth),
                context: input.context,
                responseType: 'TEXT',
            };
            prompts.push(prompt);
        }
        // If AI reflection is enabled, generate additional personalized prompts
        if (this.config.enableAIReflection && this.samConfig.ai) {
            const aiPrompts = await this.generateAIReflectionPrompts(input, depth);
            prompts.push(...aiPrompts);
        }
        return {
            prompts,
            suggestedSequence: prompts.map(p => p.id),
            estimatedTimeMinutes: prompts.reduce((sum, p) => sum + p.suggestedTimeMinutes, 0),
        };
    }
    getTargetSkillForReflectionType(type) {
        const skillMap = {
            PRE_LEARNING: 'PLANNING',
            DURING_LEARNING: 'MONITORING',
            POST_LEARNING: 'EVALUATING',
            EXAM_PREP: 'PLANNING',
            POST_EXAM: 'EVALUATING',
            WEEKLY_REVIEW: 'EVALUATING',
            GOAL_CHECK: 'MONITORING',
            STRUGGLE_POINT: 'REGULATING',
        };
        return skillMap[type];
    }
    generateFollowUpQuestions(mainQuestion, depth) {
        if (depth === 'SHALLOW')
            return [];
        if (depth === 'MODERATE') {
            return ['Can you give a specific example?'];
        }
        return [
            'Can you give a specific example?',
            'How might this apply to other areas of your learning?',
            'What would change if you approached this differently?',
        ];
    }
    getSuggestedTime(depth) {
        const timeMap = {
            SHALLOW: 2,
            MODERATE: 5,
            DEEP: 10,
        };
        return timeMap[depth];
    }
    async generateAIReflectionPrompts(input, depth) {
        if (!this.samConfig.ai)
            return [];
        try {
            const contextInfo = input.context
                ? `The learner is studying: ${input.context.topicName ?? 'general content'}.`
                : '';
            const previousReflectionsInfo = input.previousReflections?.length
                ? `Previous reflections showed themes of: ${this.extractThemes(input.previousReflections).join(', ')}`
                : '';
            const prompt = `Generate 2 personalized ${depth.toLowerCase()} reflection questions for a learner.
Reflection type: ${input.type}
${contextInfo}
${previousReflectionsInfo}

Return JSON array with objects containing:
- question: string
- followUpQuestions: string[]

Focus on metacognitive awareness and actionable insights.`;
            const response = await this.samConfig.ai.chat({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                maxTokens: 500,
            });
            const parsed = this.parseAIResponse(response.content);
            if (!Array.isArray(parsed))
                return [];
            return parsed.map((item, idx) => ({
                id: `reflection-ai-${input.type}-${idx}-${Date.now()}`,
                type: input.type,
                depth,
                question: item.question ?? 'What have you learned about your own learning process?',
                followUpQuestions: item.followUpQuestions ?? [],
                targetSkill: this.getTargetSkillForReflectionType(input.type),
                suggestedTimeMinutes: this.getSuggestedTime(depth),
                context: input.context,
                responseType: 'TEXT',
            }));
        }
        catch {
            this.logger?.info?.('[MetacognitionEngine] AI reflection generation failed, using templates only');
            return [];
        }
    }
    extractThemes(responses) {
        // Simple theme extraction from responses
        const themes = [];
        for (const response of responses) {
            if (typeof response.response === 'string') {
                if (response.response.toLowerCase().includes('struggle'))
                    themes.push('challenges');
                if (response.response.toLowerCase().includes('understand'))
                    themes.push('comprehension');
                if (response.response.toLowerCase().includes('time'))
                    themes.push('time management');
                if (response.response.toLowerCase().includes('confused'))
                    themes.push('confusion');
            }
        }
        return [...new Set(themes)].slice(0, 3);
    }
    parseAIResponse(content) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    // ============================================================================
    // REFLECTION ANALYSIS
    // ============================================================================
    /**
     * Analyze a reflection response
     */
    async analyzeReflection(input) {
        this.logger?.info?.('[MetacognitionEngine] Analyzing reflection', {
            promptId: input.prompt.id,
            userId: input.response.userId,
        });
        const responseText = typeof input.response.response === 'string'
            ? input.response.response
            : JSON.stringify(input.response.response);
        // Analyze depth of reflection
        const reflectionDepth = this.assessReflectionDepth(responseText);
        // Identify skills demonstrated
        const skillsShown = this.identifySkillsFromResponse(responseText, input.prompt);
        // Extract insights
        const keyInsights = this.extractInsights(responseText);
        // Identify growth areas
        const growthAreas = this.identifyGrowthAreas(responseText, input.prompt);
        // Calculate quality score
        const qualityScore = this.calculateReflectionQuality(responseText, reflectionDepth, skillsShown.length, input.response.responseTimeSeconds);
        // Determine sentiment
        const sentiment = this.analyzeSentiment(responseText);
        // Generate action items
        const actionItems = this.generateActionItems(keyInsights, growthAreas, input.prompt.targetSkill);
        // Store reflection for future reference
        this.storeReflection(input.response);
        return {
            promptId: input.prompt.id,
            userId: input.response.userId,
            reflectionDepth,
            skillsShown,
            keyInsights,
            growthAreas,
            qualityScore,
            sentiment,
            actionItems,
        };
    }
    assessReflectionDepth(text) {
        const wordCount = text.split(/\s+/).length;
        const hasExamples = /for example|such as|like when|instance/i.test(text);
        const hasConnections = /connect|relate|similar to|because|therefore/i.test(text);
        const hasMetacognition = /I realized|I noticed|I think|I wonder|I learned/i.test(text);
        let depthScore = 0;
        if (wordCount > 50)
            depthScore += 1;
        if (wordCount > 100)
            depthScore += 1;
        if (hasExamples)
            depthScore += 1;
        if (hasConnections)
            depthScore += 1;
        if (hasMetacognition)
            depthScore += 1;
        if (depthScore >= 4)
            return 'DEEP';
        if (depthScore >= 2)
            return 'MODERATE';
        return 'SHALLOW';
    }
    identifySkillsFromResponse(text, prompt) {
        const skills = [prompt.targetSkill];
        if (/plan|goal|strategy|will do|going to/i.test(text)) {
            skills.push('PLANNING');
        }
        if (/check|track|monitor|notice/i.test(text)) {
            skills.push('MONITORING');
        }
        if (/evaluate|assess|judge|rate/i.test(text)) {
            skills.push('EVALUATING');
        }
        if (/adjust|change|modify|try differently/i.test(text)) {
            skills.push('REGULATING');
        }
        if (/why|how|what if/i.test(text)) {
            skills.push('SELF_QUESTIONING');
        }
        if (/connect|relate|remind|similar/i.test(text)) {
            skills.push('ELABORATION');
        }
        return [...new Set(skills)];
    }
    extractInsights(text) {
        const insights = [];
        // Look for sentences with insight indicators
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (/I (realized|learned|discovered|understand|noticed)/i.test(sentence)) {
                insights.push(sentence.trim());
            }
        }
        return insights.slice(0, 5);
    }
    identifyGrowthAreas(text, prompt) {
        const areas = [];
        if (/struggle|difficult|hard|confus/i.test(text)) {
            areas.push('Understanding challenging concepts');
        }
        if (/time|rush|late|behind/i.test(text)) {
            areas.push('Time management');
        }
        if (/forget|remember|recall/i.test(text)) {
            areas.push('Memory and retention');
        }
        if (/focus|distract|attention/i.test(text)) {
            areas.push('Focus and concentration');
        }
        if (/motivat|interest|boring/i.test(text)) {
            areas.push('Motivation and engagement');
        }
        return areas.length > 0 ? areas : ['Continue developing ' + prompt.targetSkill.toLowerCase()];
    }
    calculateReflectionQuality(text, depth, skillCount, timeSeconds) {
        let score = 0;
        // Word count factor (up to 30 points)
        const wordCount = text.split(/\s+/).length;
        score += Math.min(wordCount / 3, 30);
        // Depth factor (up to 30 points)
        const depthScores = {
            SHALLOW: 10,
            MODERATE: 20,
            DEEP: 30,
        };
        score += depthScores[depth];
        // Skills demonstrated (up to 20 points)
        score += Math.min(skillCount * 5, 20);
        // Time spent (up to 20 points) - assumes thoughtful reflection takes time
        const minutesSpent = timeSeconds / 60;
        score += Math.min(minutesSpent * 4, 20);
        return Math.round(Math.min(score, 100));
    }
    analyzeSentiment(text) {
        const positiveWords = /good|great|happy|succeed|accomplish|proud|confident|enjoy|interest/gi;
        const negativeWords = /bad|struggle|fail|frustrat|confus|worry|anxious|difficult|hard|stress/gi;
        const positiveCount = (text.match(positiveWords) || []).length;
        const negativeCount = (text.match(negativeWords) || []).length;
        if (positiveCount > 0 && negativeCount > 0)
            return 'MIXED';
        if (positiveCount > negativeCount)
            return 'POSITIVE';
        if (negativeCount > positiveCount)
            return 'NEGATIVE';
        return 'NEUTRAL';
    }
    generateActionItems(insights, growthAreas, targetSkill) {
        const items = [];
        // Generate action items from growth areas
        for (const area of growthAreas.slice(0, 3)) {
            items.push({
                description: `Work on improving: ${area}`,
                priority: 'medium',
                category: targetSkill,
            });
        }
        // Add general metacognitive action
        items.push({
            description: `Practice ${targetSkill.toLowerCase().replace('_', ' ')} skills daily`,
            priority: 'low',
            category: targetSkill,
        });
        return items;
    }
    storeReflection(response) {
        const existing = this.reflectionCache.get(response.userId) ?? [];
        existing.push(response);
        this.reflectionCache.set(response.userId, existing.slice(-100)); // Keep last 100
    }
    // ============================================================================
    // STUDY SESSION MANAGEMENT
    // ============================================================================
    /**
     * Record a study session
     */
    recordStudySession(input) {
        this.logger?.info?.('[MetacognitionEngine] Recording study session', {
            userId: input.userId,
            courseId: input.courseId,
        });
        const durationMinutes = Math.round((input.endedAt.getTime() - input.startedAt.getTime()) / (1000 * 60));
        const session = {
            id: `session-${input.userId}-${Date.now()}`,
            userId: input.userId,
            courseId: input.courseId,
            startedAt: input.startedAt,
            endedAt: input.endedAt,
            durationMinutes,
            breaks: input.breaks ?? [],
            topicsCovered: input.topicsCovered,
            strategiesUsed: input.strategiesUsed ?? [],
            environment: input.environment,
            outcome: input.outcome,
        };
        // Store session
        const userSessions = this.sessionCache.get(input.userId) ?? [];
        userSessions.push(session);
        this.sessionCache.set(input.userId, userSessions.slice(-500)); // Keep last 500 sessions
        // Update strategy profile
        this.updateStrategyProfile(input.userId, session);
        return session;
    }
    updateStrategyProfile(userId, session) {
        let profile = this.strategyProfileCache.get(userId);
        if (!profile) {
            profile = {
                userId,
                preferredStrategies: [],
                strategyHistory: [],
                effectivenessByContent: [],
                recommendedStrategies: [],
                diversityScore: 0,
                updatedAt: new Date(),
            };
        }
        // Add strategy usage
        for (const strategy of session.strategiesUsed) {
            profile.strategyHistory.push({
                strategy,
                courseId: session.courseId,
                usedAt: session.startedAt,
                durationMinutes: session.durationMinutes / session.strategiesUsed.length,
                selfRatedEffectiveness: session.outcome?.comprehensionLevel,
            });
        }
        // Keep last 200 entries
        profile.strategyHistory = profile.strategyHistory.slice(-200);
        // Update preferred strategies
        const strategyCounts = new Map();
        for (const usage of profile.strategyHistory) {
            strategyCounts.set(usage.strategy, (strategyCounts.get(usage.strategy) ?? 0) + 1);
        }
        profile.preferredStrategies = [...strategyCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([strategy]) => strategy);
        // Calculate diversity score
        const uniqueStrategies = new Set(profile.strategyHistory.map(h => h.strategy)).size;
        profile.diversityScore = Math.round((uniqueStrategies / Object.keys(STRATEGY_INFO).length) * 100);
        profile.updatedAt = new Date();
        this.strategyProfileCache.set(userId, profile);
    }
    // ============================================================================
    // STUDY HABIT ANALYSIS
    // ============================================================================
    /**
     * Analyze study habits for a user
     */
    analyzeStudyHabits(input) {
        this.logger?.info?.('[MetacognitionEngine] Analyzing study habits', {
            userId: input.userId,
            periodDays: input.periodDays,
        });
        const periodDays = input.periodDays ?? 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodDays);
        const sessions = (this.sessionCache.get(input.userId) ?? [])
            .filter(s => s.startedAt >= cutoffDate)
            .filter(s => !input.courseId || s.courseId === input.courseId);
        // Calculate metrics
        const totalStudyHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
        const averageSessionMinutes = sessions.length > 0
            ? sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / sessions.length
            : 0;
        const sessionsPerWeek = sessions.length / (periodDays / 7);
        // Analyze optimal study times
        const optimalStudyTimes = this.analyzeOptimalTimes(sessions);
        // Analyze effective environments
        const effectiveEnvironments = this.analyzeEffectiveEnvironments(sessions);
        // Analyze strategy effectiveness
        const strategyEffectiveness = this.analyzeStrategyEffectiveness(sessions);
        // Analyze focus patterns
        const focusPatterns = this.analyzeFocusPatterns(sessions);
        // Analyze break patterns
        const breakPatterns = this.analyzeBreakPatterns(sessions);
        // Calculate habit scores
        const habitScores = this.calculateHabitScores(sessions, periodDays);
        // Generate recommendations
        const recommendations = this.generateHabitRecommendations(habitScores, sessions);
        return {
            userId: input.userId,
            period: {
                start: cutoffDate,
                end: new Date(),
            },
            totalStudyHours: Math.round(totalStudyHours * 10) / 10,
            averageSessionMinutes: Math.round(averageSessionMinutes),
            sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
            optimalStudyTimes,
            effectiveEnvironments,
            strategyEffectiveness,
            focusPatterns,
            breakPatterns,
            habitScores,
            recommendations,
        };
    }
    analyzeOptimalTimes(sessions) {
        const slotScores = new Map();
        for (const session of sessions) {
            const day = session.startedAt.getDay();
            const hour = session.startedAt.getHours();
            const key = `${day}-${hour}`;
            const score = session.outcome?.comprehensionLevel ?? 3;
            const existing = slotScores.get(key) ?? { count: 0, totalScore: 0 };
            existing.count++;
            existing.totalScore += score;
            slotScores.set(key, existing);
        }
        const slots = [];
        for (const [key, data] of slotScores) {
            const [day, hour] = key.split('-').map(Number);
            slots.push({
                dayOfWeek: day,
                hourStart: hour,
                hourEnd: hour + 1,
                effectivenessScore: Math.round((data.totalScore / data.count) * 20),
            });
        }
        return slots
            .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
            .slice(0, 5);
    }
    analyzeEffectiveEnvironments(sessions) {
        const envScores = new Map();
        for (const session of sessions) {
            if (!session.environment)
                continue;
            const key = `${session.environment.location}-${session.environment.noiseLevel}`;
            const score = session.outcome?.comprehensionLevel ?? 3;
            const existing = envScores.get(key) ?? { env: session.environment, count: 0, totalScore: 0 };
            existing.count++;
            existing.totalScore += score;
            envScores.set(key, existing);
        }
        return [...envScores.values()]
            .filter(e => e.count >= 2)
            .sort((a, b) => (b.totalScore / b.count) - (a.totalScore / a.count))
            .slice(0, 3)
            .map(e => e.env);
    }
    analyzeStrategyEffectiveness(sessions) {
        const strategyStats = new Map();
        for (const session of sessions) {
            for (const strategy of session.strategiesUsed) {
                const score = session.outcome?.comprehensionLevel ?? 3;
                const existing = strategyStats.get(strategy) ?? { count: 0, totalScore: 0 };
                existing.count++;
                existing.totalScore += score;
                strategyStats.set(strategy, existing);
            }
        }
        return [...strategyStats.entries()].map(([strategy, stats]) => ({
            strategy,
            usageFrequency: stats.count,
            effectivenessScore: Math.round((stats.totalScore / stats.count) * 20),
            retentionImpact: Math.round((stats.totalScore / stats.count) * 15),
            recommendedFor: STRATEGY_INFO[strategy].bestFor,
        }));
    }
    analyzeFocusPatterns(sessions) {
        const focusLevels = sessions
            .filter(s => s.focusLevel !== undefined)
            .map(s => s.focusLevel);
        const durations = sessions.map(s => s.durationMinutes);
        return {
            averageFocusDuration: durations.length > 0
                ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
                : 0,
            focusDeclineRate: 0.1, // Would calculate from detailed session data
            peakFocusTime: this.getPeakFocusTime(sessions),
            distractionTriggers: this.identifyDistractions(sessions),
        };
    }
    getPeakFocusTime(sessions) {
        const hourScores = new Map();
        for (const session of sessions) {
            const hour = session.startedAt.getHours();
            const focus = session.focusLevel ?? 3;
            hourScores.set(hour, (hourScores.get(hour) ?? 0) + focus);
        }
        let peakHour = 9;
        let maxScore = 0;
        for (const [hour, score] of hourScores) {
            if (score > maxScore) {
                maxScore = score;
                peakHour = hour;
            }
        }
        return `${peakHour}:00`;
    }
    identifyDistractions(sessions) {
        const distractions = new Set();
        for (const session of sessions) {
            if (session.environment?.distractions) {
                for (const d of session.environment.distractions) {
                    distractions.add(d);
                }
            }
        }
        return [...distractions].slice(0, 5);
    }
    analyzeBreakPatterns(sessions) {
        const allBreaks = sessions.flatMap(s => s.breaks);
        return {
            averageBreakFrequency: sessions.length > 0
                ? allBreaks.length / sessions.length
                : 0,
            averageBreakDuration: allBreaks.length > 0
                ? allBreaks.reduce((sum, b) => sum + b.durationMinutes, 0) / allBreaks.length
                : 0,
            optimalBreakInterval: 45, // Pomodoro-based default
            breakEffectiveness: 0.7, // Would calculate from performance data
        };
    }
    calculateHabitScores(sessions, periodDays) {
        const scores = {
            TIME_ALLOCATION: 0,
            ENVIRONMENT: 0,
            FOCUS_MANAGEMENT: 0,
            BREAK_PATTERNS: 0,
            CONTENT_ENGAGEMENT: 0,
            REVIEW_FREQUENCY: 0,
        };
        if (sessions.length === 0)
            return scores;
        // Time allocation score
        const avgDuration = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / sessions.length;
        scores.TIME_ALLOCATION = Math.min(100, Math.round(avgDuration / 30 * 50 + 50));
        // Environment score
        const envSessions = sessions.filter(s => s.environment);
        scores.ENVIRONMENT = envSessions.length > 0
            ? Math.round((envSessions.length / sessions.length) * 100)
            : 0;
        // Focus management score
        const focusSessions = sessions.filter(s => s.focusLevel);
        if (focusSessions.length > 0) {
            const avgFocus = focusSessions.reduce((sum, s) => sum + (s.focusLevel ?? 0), 0) / focusSessions.length;
            scores.FOCUS_MANAGEMENT = Math.round(avgFocus * 20);
        }
        // Break patterns score
        const sessionsWithBreaks = sessions.filter(s => s.breaks.length > 0);
        scores.BREAK_PATTERNS = Math.round((sessionsWithBreaks.length / sessions.length) * 100);
        // Content engagement score
        const avgTopics = sessions.reduce((sum, s) => sum + s.topicsCovered.length, 0) / sessions.length;
        scores.CONTENT_ENGAGEMENT = Math.min(100, Math.round(avgTopics * 25));
        // Review frequency score
        const sessionsPerWeek = sessions.length / (periodDays / 7);
        scores.REVIEW_FREQUENCY = Math.min(100, Math.round(sessionsPerWeek * 15));
        return scores;
    }
    generateHabitRecommendations(scores, sessions) {
        const recommendations = [];
        // Find lowest scoring categories
        const sortedCategories = Object.entries(scores)
            .sort((a, b) => a[1] - b[1]);
        for (const [category, score] of sortedCategories.slice(0, 3)) {
            if (score < 70) {
                recommendations.push(this.getRecommendationForCategory(category, score, sessions));
            }
        }
        return recommendations;
    }
    getRecommendationForCategory(category, score, sessions) {
        const recommendationMap = {
            TIME_ALLOCATION: {
                category,
                currentState: `Your sessions average ${Math.round(sessions.reduce((s, sess) => s + sess.durationMinutes, 0) / Math.max(sessions.length, 1))} minutes`,
                recommendation: 'Aim for 30-45 minute focused study sessions',
                expectedImpact: 'high',
                actionSteps: [
                    'Set a timer for 30-45 minutes',
                    'Take a 5-10 minute break after each session',
                    'Plan your study sessions in advance',
                ],
            },
            ENVIRONMENT: {
                category,
                currentState: 'Environment data is not consistently tracked',
                recommendation: 'Track your study environment to find optimal conditions',
                expectedImpact: 'medium',
                actionSteps: [
                    'Note your location and noise level for each session',
                    'Identify which environments help you focus best',
                    'Minimize distractions in your study space',
                ],
            },
            FOCUS_MANAGEMENT: {
                category,
                currentState: `Average focus level: ${score}%`,
                recommendation: 'Use techniques to improve and maintain focus',
                expectedImpact: 'high',
                actionSteps: [
                    'Remove phone and other distractions during study',
                    'Use the Pomodoro technique (25 min work, 5 min break)',
                    'Take notes to stay actively engaged',
                ],
            },
            BREAK_PATTERNS: {
                category,
                currentState: 'Breaks are not taken regularly',
                recommendation: 'Take regular breaks to maintain productivity',
                expectedImpact: 'medium',
                actionSteps: [
                    'Take a 5-minute break every 25-30 minutes',
                    'Move around during breaks',
                    'Avoid screens during breaks when possible',
                ],
            },
            CONTENT_ENGAGEMENT: {
                category,
                currentState: 'Low engagement with study content',
                recommendation: 'Use active learning strategies',
                expectedImpact: 'high',
                actionSteps: [
                    'Test yourself on material rather than just rereading',
                    'Explain concepts in your own words',
                    'Create questions while studying',
                ],
            },
            REVIEW_FREQUENCY: {
                category,
                currentState: 'Infrequent study sessions',
                recommendation: 'Study more frequently in shorter sessions',
                expectedImpact: 'high',
                actionSteps: [
                    'Schedule at least 4-5 study sessions per week',
                    'Review material within 24 hours of learning',
                    'Use spaced repetition for better retention',
                ],
            },
        };
        return recommendationMap[category];
    }
    // ============================================================================
    // LEARNING STRATEGY RECOMMENDATIONS
    // ============================================================================
    /**
     * Recommend learning strategies for a user
     */
    recommendStrategies(input) {
        this.logger?.info?.('[MetacognitionEngine] Recommending strategies', {
            userId: input.userId,
            bloomsLevel: input.bloomsLevel,
        });
        const profile = this.strategyProfileCache.get(input.userId);
        const currentStrategies = profile?.preferredStrategies ?? [];
        // Get all high-effectiveness strategies
        const highEffectStrategies = Object.entries(STRATEGY_INFO)
            .filter(([_, info]) => info.effectiveness === 'high')
            .map(([strategy]) => strategy);
        // Find underutilized effective strategies
        const underutilizedStrategies = highEffectStrategies
            .filter(s => !currentStrategies.includes(s));
        // Find overused low-effectiveness strategies
        const overusedStrategies = currentStrategies
            .filter(s => STRATEGY_INFO[s].effectiveness === 'low');
        // Generate recommendations
        const recommendations = [];
        // Recommend strategies based on Bloom's level if provided
        if (input.bloomsLevel) {
            const relevantStrategies = Object.entries(STRATEGY_INFO)
                .filter(([_, info]) => info.bestFor.includes(input.bloomsLevel))
                .filter(([strategy]) => !currentStrategies.includes(strategy))
                .slice(0, 3);
            for (const [strategy, info] of relevantStrategies) {
                recommendations.push({
                    strategy,
                    reason: `Effective for ${input.bloomsLevel} level tasks`,
                    howToApply: info.howToUse,
                    expectedBenefit: info.description,
                    difficultyToAdopt: 'moderate',
                    evidenceBase: info.effectiveness === 'high' ? 'strong' : 'moderate',
                });
            }
        }
        // Add recommendations for underutilized high-effectiveness strategies
        for (const strategy of underutilizedStrategies.slice(0, 2)) {
            const info = STRATEGY_INFO[strategy];
            recommendations.push({
                strategy,
                reason: 'Highly effective but underutilized in your study routine',
                howToApply: info.howToUse,
                expectedBenefit: info.description,
                difficultyToAdopt: 'easy',
                evidenceBase: 'strong',
            });
        }
        return {
            recommendations,
            currentStrategies,
            underutilizedStrategies,
            overusedStrategies,
        };
    }
    // ============================================================================
    // CONFIDENCE CALIBRATION
    // ============================================================================
    /**
     * Assess knowledge confidence calibration
     */
    assessConfidence(input) {
        this.logger?.info?.('[MetacognitionEngine] Assessing confidence', {
            userId: input.userId,
            itemCount: input.items.length,
        });
        const items = input.items.map(item => ({
            concept: item.concept,
            confidence: item.confidence,
        }));
        // Calculate calibration (would compare with actual performance in real system)
        const avgConfidence = items.reduce((sum, i) => sum + i.confidence, 0) / items.length;
        // Determine confidence bias based on historical data
        const historicalAssessments = this.confidenceCache.get(input.userId) ?? [];
        let confidenceBias = 'WELL_CALIBRATED';
        if (historicalAssessments.length > 0) {
            // Compare with historical patterns
            const historicalAvg = historicalAssessments
                .flatMap(a => a.items)
                .reduce((sum, i) => sum + i.confidence, 0) /
                historicalAssessments.flatMap(a => a.items).length;
            if (avgConfidence > historicalAvg + 0.5) {
                confidenceBias = 'OVERCONFIDENT';
            }
            else if (avgConfidence < historicalAvg - 0.5) {
                confidenceBias = 'UNDERCONFIDENT';
            }
        }
        const assessment = {
            id: `conf-${input.userId}-${Date.now()}`,
            userId: input.userId,
            courseId: input.courseId,
            topicId: input.topicId,
            items,
            calibrationScore: Math.round(avgConfidence * 20),
            confidenceBias,
            assessedAt: new Date(),
        };
        // Store assessment
        const userAssessments = this.confidenceCache.get(input.userId) ?? [];
        userAssessments.push(assessment);
        this.confidenceCache.set(input.userId, userAssessments.slice(-50));
        return assessment;
    }
    // ============================================================================
    // COGNITIVE LOAD ASSESSMENT
    // ============================================================================
    /**
     * Assess current cognitive load
     */
    assessCognitiveLoad(input) {
        this.logger?.info?.('[MetacognitionEngine] Assessing cognitive load', {
            userId: input.userId,
        });
        const currentLoad = input.selfReportedLoad ?? this.estimateCognitiveLoad(input);
        const loadFactors = this.identifyLoadFactors(input, currentLoad);
        const recommendations = this.generateLoadRecommendations(loadFactors, currentLoad);
        return {
            userId: input.userId,
            sessionId: input.sessionId,
            currentLoad,
            loadFactors,
            recommendations,
            assessedAt: new Date(),
        };
    }
    estimateCognitiveLoad(input) {
        // Get recent session data
        const sessions = this.sessionCache.get(input.userId) ?? [];
        const recentSessions = sessions.slice(-5);
        if (recentSessions.length === 0)
            return 'OPTIMAL';
        // Estimate based on recent performance and focus
        const avgFocus = recentSessions
            .filter(s => s.focusLevel)
            .reduce((sum, s) => sum + (s.focusLevel ?? 3), 0) /
            Math.max(recentSessions.filter(s => s.focusLevel).length, 1);
        const recentPerformance = input.recentPerformance ?? 70;
        if (avgFocus < 2 || recentPerformance < 50)
            return 'OVERLOAD';
        if (avgFocus < 3 || recentPerformance < 65)
            return 'HIGH';
        if (avgFocus > 4 && recentPerformance > 85)
            return 'LOW';
        return 'OPTIMAL';
    }
    identifyLoadFactors(input, currentLoad) {
        const factors = [];
        // Intrinsic load factors (content complexity)
        factors.push({
            factor: 'Content complexity',
            type: 'INTRINSIC',
            impact: currentLoad === 'OVERLOAD' || currentLoad === 'HIGH' ? 'high' : 'medium',
            isManageable: true,
        });
        // Extraneous load factors (distractions, poor instruction)
        if (currentLoad === 'OVERLOAD' || currentLoad === 'HIGH') {
            factors.push({
                factor: 'Potential distractions or multitasking',
                type: 'EXTRANEOUS',
                impact: 'medium',
                isManageable: true,
            });
        }
        // Germane load factors (effort toward learning)
        factors.push({
            factor: 'Active processing and schema building',
            type: 'GERMANE',
            impact: 'medium',
            isManageable: true,
        });
        return factors;
    }
    generateLoadRecommendations(factors, currentLoad) {
        const recommendations = [];
        if (currentLoad === 'OVERLOAD') {
            recommendations.push({
                action: 'Take a break immediately',
                targetFactor: 'Overall cognitive load',
                expectedReduction: 'significant',
                immediacy: 'immediate',
            });
            recommendations.push({
                action: 'Break content into smaller chunks',
                targetFactor: 'Content complexity',
                expectedReduction: 'significant',
                immediacy: 'short_term',
            });
        }
        if (currentLoad === 'HIGH') {
            recommendations.push({
                action: 'Remove distractions and focus on one task',
                targetFactor: 'Extraneous load',
                expectedReduction: 'moderate',
                immediacy: 'immediate',
            });
            recommendations.push({
                action: 'Use visualization or diagrams to organize information',
                targetFactor: 'Content complexity',
                expectedReduction: 'moderate',
                immediacy: 'short_term',
            });
        }
        if (currentLoad === 'LOW') {
            recommendations.push({
                action: 'Increase challenge level or add related concepts',
                targetFactor: 'Germane load',
                expectedReduction: 'slight',
                immediacy: 'short_term',
            });
        }
        return recommendations;
    }
    // ============================================================================
    // GOAL MANAGEMENT
    // ============================================================================
    /**
     * Set a learning goal
     */
    setGoal(input) {
        this.logger?.info?.('[MetacognitionEngine] Setting goal', {
            userId: input.userId,
            type: input.type,
        });
        const goal = {
            id: `goal-${input.userId}-${Date.now()}`,
            userId: input.userId,
            courseId: input.courseId,
            description: input.description,
            type: input.type,
            targetMetric: input.targetMetric,
            deadline: input.deadline,
            milestones: (input.milestones ?? []).map((m, i) => ({
                id: `milestone-${i}-${Date.now()}`,
                description: m.description,
                targetDate: m.targetDate,
                completed: false,
            })),
            progress: 0,
            status: 'ACTIVE',
            reflections: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        // Store goal
        const userGoals = this.goalCache.get(input.userId) ?? [];
        userGoals.push(goal);
        this.goalCache.set(input.userId, userGoals);
        return goal;
    }
    /**
     * Update goal progress
     */
    updateGoalProgress(input) {
        this.logger?.info?.('[MetacognitionEngine] Updating goal progress', {
            goalId: input.goalId,
            userId: input.userId,
        });
        const userGoals = this.goalCache.get(input.userId) ?? [];
        const goal = userGoals.find(g => g.id === input.goalId);
        if (!goal) {
            return {
                goalId: input.goalId,
                currentProgress: 0,
                projectedCompletion: null,
                isOnTrack: false,
                riskFactors: ['Goal not found'],
                suggestions: ['Please verify the goal ID'],
                motivationalMessage: 'Keep setting goals to track your progress!',
            };
        }
        // Update progress
        if (input.progress !== undefined) {
            goal.progress = input.progress;
        }
        // Update milestone
        if (input.milestoneId) {
            const milestone = goal.milestones.find(m => m.id === input.milestoneId);
            if (milestone) {
                milestone.completed = true;
                milestone.completedAt = new Date();
            }
        }
        // Add reflection
        if (input.reflection) {
            goal.reflections.push({
                date: new Date(),
                reflection: input.reflection,
                progressAtTime: goal.progress,
            });
        }
        goal.updatedAt = new Date();
        // Monitor progress
        return this.monitorGoal(goal);
    }
    monitorGoal(goal) {
        const now = new Date();
        const daysSinceCreation = (now.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        // Calculate projected completion
        let projectedCompletion = null;
        if (goal.progress > 0 && goal.deadline) {
            const progressRate = goal.progress / daysSinceCreation;
            const daysToComplete = (100 - goal.progress) / progressRate;
            projectedCompletion = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);
        }
        // Check if on track
        let isOnTrack = true;
        const riskFactors = [];
        const suggestions = [];
        if (goal.deadline) {
            const totalDays = (goal.deadline.getTime() - goal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            const expectedProgress = (daysSinceCreation / totalDays) * 100;
            if (goal.progress < expectedProgress - 20) {
                isOnTrack = false;
                riskFactors.push('Progress is behind schedule');
                suggestions.push('Consider dedicating more time to this goal');
            }
        }
        // Check for stagnation
        if (goal.reflections.length > 0) {
            const lastReflection = goal.reflections[goal.reflections.length - 1];
            const daysSinceReflection = (now.getTime() - lastReflection.date.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceReflection > 7) {
                riskFactors.push('No activity in the past week');
                suggestions.push('Schedule a study session this week');
            }
        }
        // Generate motivational message
        const motivationalMessage = this.generateMotivationalMessage(goal.progress, isOnTrack);
        return {
            goalId: goal.id,
            currentProgress: goal.progress,
            projectedCompletion,
            isOnTrack,
            riskFactors,
            suggestions,
            motivationalMessage,
        };
    }
    generateMotivationalMessage(progress, isOnTrack) {
        if (progress === 0) {
            return 'Every journey starts with a single step. Begin today!';
        }
        if (progress < 25) {
            return 'Great start! Keep building momentum.';
        }
        if (progress < 50) {
            return isOnTrack
                ? 'You are making solid progress. Keep it up!'
                : 'You have come far. A little extra effort will get you back on track.';
        }
        if (progress < 75) {
            return 'Over halfway there! The finish line is in sight.';
        }
        if (progress < 100) {
            return 'Almost there! Push through to the end.';
        }
        return 'Congratulations on achieving your goal!';
    }
    // ============================================================================
    // METACOGNITIVE SKILL ASSESSMENT
    // ============================================================================
    /**
     * Get metacognitive skill assessment
     */
    getMetacognitiveAssessment(input) {
        this.logger?.info?.('[MetacognitionEngine] Getting metacognitive assessment', {
            userId: input.userId,
        });
        // Get cached assessment or calculate new one
        let assessment = this.skillAssessmentCache.get(input.userId);
        if (!assessment || this.isAssessmentStale(assessment)) {
            assessment = this.calculateMetacognitiveAssessment(input.userId);
            this.skillAssessmentCache.set(input.userId, assessment);
        }
        return assessment;
    }
    isAssessmentStale(assessment) {
        const hoursSinceAssessment = (Date.now() - assessment.assessedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceAssessment > 24;
    }
    calculateMetacognitiveAssessment(userId) {
        const reflections = this.reflectionCache.get(userId) ?? [];
        const sessions = this.sessionCache.get(userId) ?? [];
        const goals = this.goalCache.get(userId) ?? [];
        // Calculate skill scores
        const skills = [
            {
                skill: 'PLANNING',
                score: this.calculatePlanningScore(goals, sessions),
                trend: 'STABLE',
                evidenceSources: ['goal setting', 'session planning'],
            },
            {
                skill: 'MONITORING',
                score: this.calculateMonitoringScore(reflections, sessions),
                trend: 'STABLE',
                evidenceSources: ['self-check reflections', 'focus tracking'],
            },
            {
                skill: 'EVALUATING',
                score: this.calculateEvaluatingScore(reflections, sessions),
                trend: 'STABLE',
                evidenceSources: ['post-learning reflections', 'session outcomes'],
            },
            {
                skill: 'REGULATING',
                score: this.calculateRegulatingScore(sessions),
                trend: 'STABLE',
                evidenceSources: ['strategy changes', 'break patterns'],
            },
            {
                skill: 'SELF_QUESTIONING',
                score: this.calculateSelfQuestioningScore(reflections),
                trend: 'STABLE',
                evidenceSources: ['reflection depth', 'inquiry patterns'],
            },
            {
                skill: 'ELABORATION',
                score: this.calculateElaborationScore(reflections, sessions),
                trend: 'STABLE',
                evidenceSources: ['connection making', 'example generation'],
            },
            {
                skill: 'ORGANIZATION',
                score: this.calculateOrganizationScore(sessions),
                trend: 'STABLE',
                evidenceSources: ['note-taking', 'summarization'],
            },
            {
                skill: 'TIME_MANAGEMENT',
                score: this.calculateTimeManagementScore(sessions, goals),
                trend: 'STABLE',
                evidenceSources: ['session timing', 'goal deadlines'],
            },
        ];
        // Calculate overall score
        const overallScore = Math.round(skills.reduce((sum, s) => sum + s.score, 0) / skills.length);
        // Identify strengths and development areas
        const sortedSkills = [...skills].sort((a, b) => b.score - a.score);
        const strengths = sortedSkills.slice(0, 3).map(s => s.skill);
        const developmentAreas = sortedSkills.slice(-3).map(s => s.skill);
        // Generate exercises
        const exercises = this.generateMetacognitiveExercises(developmentAreas);
        return {
            userId,
            skills,
            overallScore,
            strengths,
            developmentAreas,
            exercises,
            assessedAt: new Date(),
        };
    }
    calculatePlanningScore(goals, sessions) {
        let score = 50; // Base score
        if (goals.length > 0)
            score += 20;
        if (goals.some(g => g.milestones.length > 0))
            score += 15;
        if (sessions.some(s => s.strategiesUsed.length > 0))
            score += 15;
        return Math.min(100, score);
    }
    calculateMonitoringScore(reflections, sessions) {
        let score = 50;
        if (reflections.length > 5)
            score += 20;
        if (sessions.some(s => s.focusLevel !== undefined))
            score += 15;
        if (sessions.some(s => s.outcome !== undefined))
            score += 15;
        return Math.min(100, score);
    }
    calculateEvaluatingScore(reflections, sessions) {
        let score = 50;
        const postLearningReflections = reflections.filter(r => typeof r.response === 'string' && r.response.length > 100);
        if (postLearningReflections.length > 3)
            score += 25;
        if (sessions.some(s => s.outcome?.satisfactionLevel !== undefined))
            score += 25;
        return Math.min(100, score);
    }
    calculateRegulatingScore(sessions) {
        let score = 50;
        const strategyVariety = new Set(sessions.flatMap(s => s.strategiesUsed)).size;
        score += Math.min(strategyVariety * 10, 30);
        if (sessions.some(s => s.breaks.length > 0))
            score += 20;
        return Math.min(100, score);
    }
    calculateSelfQuestioningScore(reflections) {
        let score = 50;
        const questionReflections = reflections.filter(r => typeof r.response === 'string' && r.response.includes('?'));
        score += Math.min(questionReflections.length * 5, 30);
        score += reflections.length > 10 ? 20 : 0;
        return Math.min(100, score);
    }
    calculateElaborationScore(reflections, sessions) {
        let score = 50;
        const elaborativeReflections = reflections.filter(r => typeof r.response === 'string' &&
            (r.response.includes('connect') || r.response.includes('relate') || r.response.includes('example')));
        score += Math.min(elaborativeReflections.length * 10, 30);
        if (sessions.some(s => s.strategiesUsed.includes('ELABORATIVE_INTERROGATION')))
            score += 20;
        return Math.min(100, score);
    }
    calculateOrganizationScore(sessions) {
        let score = 50;
        if (sessions.some(s => s.strategiesUsed.includes('SUMMARIZATION')))
            score += 25;
        if (sessions.some(s => s.strategiesUsed.includes('DUAL_CODING')))
            score += 25;
        return Math.min(100, score);
    }
    calculateTimeManagementScore(sessions, goals) {
        let score = 50;
        const avgDuration = sessions.length > 0
            ? sessions.reduce((s, sess) => s + sess.durationMinutes, 0) / sessions.length
            : 0;
        if (avgDuration >= 25 && avgDuration <= 60)
            score += 20;
        if (goals.some(g => g.deadline !== undefined))
            score += 15;
        if (sessions.some(s => s.breaks.length > 0))
            score += 15;
        return Math.min(100, score);
    }
    generateMetacognitiveExercises(developmentAreas) {
        const exerciseTemplates = {
            PLANNING: {
                id: 'ex-planning-1',
                title: 'Study Session Planning',
                description: 'Practice planning your study sessions in advance',
                targetSkill: 'PLANNING',
                duration: 10,
                difficulty: 'beginner',
                instructions: [
                    'Before studying, write down what you want to accomplish',
                    'List the specific topics or skills you will work on',
                    'Estimate how long each task will take',
                    'Identify what resources you will need',
                ],
            },
            MONITORING: {
                id: 'ex-monitoring-1',
                title: 'Comprehension Check-ins',
                description: 'Practice monitoring your understanding during learning',
                targetSkill: 'MONITORING',
                duration: 5,
                difficulty: 'beginner',
                instructions: [
                    'Every 10-15 minutes, pause and ask yourself: "Do I understand this?"',
                    'Try to summarize what you just learned in one sentence',
                    'Identify any confusing parts',
                    'Note questions that arise',
                ],
            },
            EVALUATING: {
                id: 'ex-evaluating-1',
                title: 'Session Reflection',
                description: 'Practice evaluating your learning sessions',
                targetSkill: 'EVALUATING',
                duration: 10,
                difficulty: 'beginner',
                instructions: [
                    'At the end of each session, rate your focus (1-5)',
                    'Identify what went well',
                    'Identify what could be improved',
                    'Note any insights for next time',
                ],
            },
            REGULATING: {
                id: 'ex-regulating-1',
                title: 'Strategy Adjustment',
                description: 'Practice adjusting your approach based on results',
                targetSkill: 'REGULATING',
                duration: 15,
                difficulty: 'intermediate',
                instructions: [
                    'Review your recent learning sessions',
                    'Identify patterns in what works and what does not',
                    'Choose one new strategy to try',
                    'Set a specific goal for testing this strategy',
                ],
            },
            SELF_QUESTIONING: {
                id: 'ex-self-questioning-1',
                title: 'Question Generation',
                description: 'Practice generating questions while learning',
                targetSkill: 'SELF_QUESTIONING',
                duration: 15,
                difficulty: 'beginner',
                instructions: [
                    'While reading, write down 3-5 questions per section',
                    'Include "why" and "how" questions',
                    'Try to answer your questions before moving on',
                    'Note which questions you could not answer',
                ],
            },
            ELABORATION: {
                id: 'ex-elaboration-1',
                title: 'Connection Making',
                description: 'Practice connecting new information to what you know',
                targetSkill: 'ELABORATION',
                duration: 10,
                difficulty: 'intermediate',
                instructions: [
                    'After learning something new, ask: "How does this connect to what I already know?"',
                    'Create an analogy or metaphor for the concept',
                    'Think of a real-world example',
                    'Explain how this relates to other topics in the course',
                ],
            },
            ORGANIZATION: {
                id: 'ex-organization-1',
                title: 'Concept Mapping',
                description: 'Practice organizing information visually',
                targetSkill: 'ORGANIZATION',
                duration: 20,
                difficulty: 'intermediate',
                instructions: [
                    'Choose a topic you are learning',
                    'Write the main concept in the center',
                    'Add related concepts around it',
                    'Draw connections between concepts',
                    'Label the connections with relationship descriptions',
                ],
            },
            TIME_MANAGEMENT: {
                id: 'ex-time-management-1',
                title: 'Pomodoro Practice',
                description: 'Practice structured time management',
                targetSkill: 'TIME_MANAGEMENT',
                duration: 30,
                difficulty: 'beginner',
                instructions: [
                    'Set a timer for 25 minutes',
                    'Focus on one task only during this time',
                    'When the timer rings, take a 5-minute break',
                    'After 4 cycles, take a 15-30 minute break',
                    'Track how many cycles you complete',
                ],
            },
        };
        return developmentAreas.map(skill => exerciseTemplates[skill]);
    }
    // ============================================================================
    // SELF-REGULATION PROFILE
    // ============================================================================
    /**
     * Get self-regulation profile
     */
    getSelfRegulationProfile(userId) {
        let profile = this.regulationCache.get(userId);
        if (!profile) {
            profile = this.createDefaultRegulationProfile(userId);
            this.regulationCache.set(userId, profile);
        }
        return profile;
    }
    createDefaultRegulationProfile(userId) {
        return {
            userId,
            emotionalRegulation: {
                frustrationTolerance: 60,
                anxietyManagement: 60,
                confidenceStability: 60,
                recoveryFromSetbacks: 60,
            },
            motivationRegulation: {
                intrinsicMotivation: 60,
                goalPersistence: 60,
                effortRegulation: 60,
                interestMaintenance: 60,
            },
            attentionRegulation: {
                focusDuration: 60,
                distractionResistance: 60,
                taskSwitchingEfficiency: 60,
                sustainedAttention: 60,
            },
            overallScore: 60,
            interventions: [],
            updatedAt: new Date(),
        };
    }
    /**
     * Record a regulation intervention
     */
    recordIntervention(userId, type, trigger, intervention) {
        const profile = this.getSelfRegulationProfile(userId);
        const newIntervention = {
            type,
            triggeredAt: new Date(),
            trigger,
            intervention,
        };
        profile.interventions.push(newIntervention);
        profile.interventions = profile.interventions.slice(-50); // Keep last 50
        profile.updatedAt = new Date();
        this.regulationCache.set(userId, profile);
        return newIntervention;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new MetacognitionEngine instance
 */
export function createMetacognitionEngine(config) {
    return new MetacognitionEngine(config);
}
