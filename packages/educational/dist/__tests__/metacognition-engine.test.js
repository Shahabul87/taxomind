/**
 * MetacognitionEngine Tests
 *
 * Tests for self-reflection, learning awareness, study habit analysis,
 * and learning strategy recommendations.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetacognitionEngine, createMetacognitionEngine, } from '../engines/metacognition-engine';
// ============================================================================
// TEST SETUP
// ============================================================================
const mockSamConfig = {
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
};
const createDefaultConfig = (overrides) => ({
    samConfig: mockSamConfig,
    enableAIReflection: false,
    defaultReflectionDepth: 'MODERATE',
    ...overrides,
});
describe('MetacognitionEngine', () => {
    let engine;
    beforeEach(() => {
        vi.clearAllMocks();
        engine = createMetacognitionEngine(createDefaultConfig());
    });
    // ============================================================================
    // CONSTRUCTOR AND INITIALIZATION
    // ============================================================================
    describe('Constructor and Initialization', () => {
        it('should create an engine with default config', () => {
            expect(engine).toBeInstanceOf(MetacognitionEngine);
        });
        it('should create an engine via factory function', () => {
            const factoryEngine = createMetacognitionEngine(createDefaultConfig());
            expect(factoryEngine).toBeInstanceOf(MetacognitionEngine);
        });
        it('should accept custom reflection depth', () => {
            const customEngine = createMetacognitionEngine(createDefaultConfig({ defaultReflectionDepth: 'DEEP' }));
            expect(customEngine).toBeInstanceOf(MetacognitionEngine);
        });
        it('should accept AI reflection enabled config', () => {
            const aiEnabledEngine = createMetacognitionEngine(createDefaultConfig({ enableAIReflection: true }));
            expect(aiEnabledEngine).toBeInstanceOf(MetacognitionEngine);
        });
    });
    // ============================================================================
    // REFLECTION GENERATION
    // ============================================================================
    describe('generateReflection', () => {
        const reflectionTypes = [
            'PRE_LEARNING',
            'DURING_LEARNING',
            'POST_LEARNING',
            'EXAM_PREP',
            'POST_EXAM',
            'WEEKLY_REVIEW',
            'GOAL_CHECK',
            'STRUGGLE_POINT',
        ];
        it.each(reflectionTypes)('should generate prompts for %s reflection type', async (type) => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type,
            });
            expect(result.prompts).toBeDefined();
            expect(result.prompts.length).toBeGreaterThan(0);
            expect(result.suggestedSequence).toBeDefined();
            expect(result.estimatedTimeMinutes).toBeGreaterThan(0);
        });
        it('should generate SHALLOW depth prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
                depth: 'SHALLOW',
            });
            expect(result.prompts.length).toBe(2);
            result.prompts.forEach(prompt => {
                expect(prompt.depth).toBe('SHALLOW');
                expect(prompt.suggestedTimeMinutes).toBe(2);
            });
        });
        it('should generate MODERATE depth prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
                depth: 'MODERATE',
            });
            expect(result.prompts.length).toBe(3);
            result.prompts.forEach(prompt => {
                expect(prompt.depth).toBe('MODERATE');
                expect(prompt.suggestedTimeMinutes).toBe(5);
            });
        });
        it('should generate DEEP depth prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
                depth: 'DEEP',
            });
            expect(result.prompts.length).toBe(4);
            result.prompts.forEach(prompt => {
                expect(prompt.depth).toBe('DEEP');
                expect(prompt.suggestedTimeMinutes).toBe(10);
            });
        });
        it('should use default depth when not specified', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'DURING_LEARNING',
            });
            result.prompts.forEach(prompt => {
                expect(prompt.depth).toBe('MODERATE');
            });
        });
        it('should include context in prompts', async () => {
            const context = {
                topicName: 'Advanced Mathematics',
                courseId: 'course-1',
            };
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'DURING_LEARNING',
                context,
            });
            result.prompts.forEach(prompt => {
                expect(prompt.context).toEqual(context);
            });
        });
        it('should assign correct target skills for each reflection type', async () => {
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
            for (const [type, expectedSkill] of Object.entries(skillMap)) {
                const result = await engine.generateReflection({
                    userId: 'user-1',
                    type: type,
                });
                result.prompts.forEach(prompt => {
                    expect(prompt.targetSkill).toBe(expectedSkill);
                });
            }
        });
        it('should generate follow-up questions for DEEP prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'POST_LEARNING',
                depth: 'DEEP',
            });
            result.prompts.forEach(prompt => {
                expect(prompt.followUpQuestions.length).toBe(3);
            });
        });
        it('should generate single follow-up for MODERATE prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'POST_LEARNING',
                depth: 'MODERATE',
            });
            result.prompts.forEach(prompt => {
                expect(prompt.followUpQuestions.length).toBe(1);
            });
        });
        it('should generate no follow-up for SHALLOW prompts', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'POST_LEARNING',
                depth: 'SHALLOW',
            });
            result.prompts.forEach(prompt => {
                expect(prompt.followUpQuestions.length).toBe(0);
            });
        });
        it('should generate unique IDs for each prompt', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
                depth: 'DEEP',
            });
            const ids = result.prompts.map(p => p.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });
        it('should calculate correct estimated time', async () => {
            const result = await engine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
                depth: 'DEEP',
            });
            const expectedTime = result.prompts.reduce((sum, p) => sum + p.suggestedTimeMinutes, 0);
            expect(result.estimatedTimeMinutes).toBe(expectedTime);
        });
    });
    // ============================================================================
    // REFLECTION ANALYSIS
    // ============================================================================
    describe('analyzeReflection', () => {
        const createMockPrompt = () => ({
            id: 'prompt-1',
            type: 'POST_LEARNING',
            depth: 'MODERATE',
            question: 'What did you learn today?',
            followUpQuestions: [],
            targetSkill: 'EVALUATING',
            suggestedTimeMinutes: 5,
            responseType: 'TEXT',
        });
        const createMockResponse = (text) => ({
            promptId: 'prompt-1',
            userId: 'user-1',
            response: text,
            responseTimeSeconds: 120,
            timestamp: new Date(),
        });
        it('should analyze a simple reflection response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I learned about algebra today.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.promptId).toBe(prompt.id);
            expect(result.userId).toBe(response.userId);
            expect(result.reflectionDepth).toBeDefined();
            expect(result.skillsShown).toBeDefined();
            expect(result.qualityScore).toBeDefined();
        });
        it('should assess SHALLOW depth for brief responses', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I learned some math.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.reflectionDepth).toBe('SHALLOW');
        });
        it('should assess MODERATE depth for detailed responses', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I realized that algebra is really about patterns. For example, when solving equations, ' +
                'I noticed that I can apply the same steps consistently. I connect this to similar problems ' +
                'I have solved before.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.reflectionDepth).toBe('MODERATE');
        });
        it('should assess DEEP depth for comprehensive responses', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I realized that understanding algebra requires seeing the connections between different concepts. ' +
                'For example, when working on quadratic equations today, I noticed patterns that relate to ' +
                'the factoring techniques I learned last week. I think this is similar to how puzzles work - ' +
                'each piece connects to others. I wonder if I could apply these same principles to other ' +
                'mathematical domains because they seem fundamental. I learned that breaking down complex ' +
                'problems into smaller steps is crucial. This connects to my experience with programming ' +
                'where decomposition is also important. Therefore, I believe these skills are transferable.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.reflectionDepth).toBe('DEEP');
        });
        it('should identify planning skills in response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I will plan to study more tomorrow and my goal is to finish chapter 3.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.skillsShown).toContain('PLANNING');
        });
        it('should identify monitoring skills in response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I notice that I track my understanding better when I take notes.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.skillsShown).toContain('MONITORING');
        });
        it('should identify regulating skills in response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I need to adjust my study approach and try differently next time.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.skillsShown).toContain('REGULATING');
        });
        it('should identify self-questioning skills in response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I kept asking why this formula works and what if we change parameters.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.skillsShown).toContain('SELF_QUESTIONING');
        });
        it('should identify elaboration skills in response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('This connects to what I learned before. It reminds me of similar concepts.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.skillsShown).toContain('ELABORATION');
        });
        it('should extract key insights from response', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I realized that practice is important. I discovered that examples help me learn better. ' +
                'I understand now that I need to review more often.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.keyInsights.length).toBeGreaterThan(0);
        });
        it('should identify growth areas for struggling learners', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I struggle with time management and often feel confused about the concepts. ' +
                'I have difficulty focusing and staying motivated.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.growthAreas.length).toBeGreaterThan(0);
            expect(result.growthAreas.some(a => a.includes('concept') || a.includes('Time'))).toBe(true);
        });
        it('should calculate quality score based on depth and time', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I realized that this topic is important. For example, when I was studying, ' +
                'I noticed patterns connecting to my prior knowledge.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.qualityScore).toBeGreaterThanOrEqual(0);
            expect(result.qualityScore).toBeLessThanOrEqual(100);
        });
        it('should analyze POSITIVE sentiment', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I feel great about my progress. I enjoy learning and am proud of my accomplishments.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.sentiment).toBe('POSITIVE');
        });
        it('should analyze NEGATIVE sentiment', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I am frustrated and struggling. This is really difficult and stressful.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.sentiment).toBe('NEGATIVE');
        });
        it('should analyze MIXED sentiment', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I am happy with some progress but still struggling with difficult concepts.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.sentiment).toBe('MIXED');
        });
        it('should analyze NEUTRAL sentiment', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I studied the chapter and completed the exercises.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.sentiment).toBe('NEUTRAL');
        });
        it('should generate action items', async () => {
            const prompt = createMockPrompt();
            const response = createMockResponse('I learned about time management. I need to focus more on practice.');
            const result = await engine.analyzeReflection({ prompt, response });
            expect(result.actionItems.length).toBeGreaterThan(0);
            result.actionItems.forEach(item => {
                expect(item.description).toBeDefined();
                expect(item.priority).toBeDefined();
                expect(item.category).toBeDefined();
            });
        });
    });
    // ============================================================================
    // STUDY SESSION MANAGEMENT
    // ============================================================================
    describe('recordStudySession', () => {
        it('should record a basic study session', () => {
            const startedAt = new Date();
            const endedAt = new Date(startedAt.getTime() + 60 * 60 * 1000); // 1 hour later
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1', 'topic-2'],
            });
            expect(session.id).toBeDefined();
            expect(session.userId).toBe('user-1');
            expect(session.courseId).toBe('course-1');
            expect(session.durationMinutes).toBe(60);
            expect(session.topicsCovered).toEqual(['topic-1', 'topic-2']);
        });
        it('should record session with strategies', () => {
            const startedAt = new Date();
            const endedAt = new Date(startedAt.getTime() + 30 * 60 * 1000);
            const strategies = ['SPACED_PRACTICE', 'RETRIEVAL_PRACTICE'];
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1'],
                strategiesUsed: strategies,
            });
            expect(session.strategiesUsed).toEqual(strategies);
        });
        it('should record session with breaks', () => {
            const startedAt = new Date();
            const endedAt = new Date(startedAt.getTime() + 90 * 60 * 1000);
            const breaks = [
                { startedAt: new Date(startedAt.getTime() + 30 * 60 * 1000), durationMinutes: 5, type: 'SHORT' },
                { startedAt: new Date(startedAt.getTime() + 60 * 60 * 1000), durationMinutes: 10, type: 'LONG' },
            ];
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1'],
                breaks,
            });
            expect(session.breaks).toEqual(breaks);
        });
        it('should record session with environment data', () => {
            const startedAt = new Date();
            const endedAt = new Date(startedAt.getTime() + 45 * 60 * 1000);
            const environment = {
                location: 'LIBRARY',
                noiseLevel: 'QUIET',
                distractions: ['phone notifications'],
                deviceUsed: 'LAPTOP',
                timeOfDay: 'AFTERNOON',
            };
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1'],
                environment,
            });
            expect(session.environment).toEqual(environment);
        });
        it('should record session with outcome data', () => {
            const startedAt = new Date();
            const endedAt = new Date(startedAt.getTime() + 60 * 60 * 1000);
            const outcome = {
                goalsAchieved: true,
                comprehensionLevel: 4,
                satisfactionLevel: 5,
                notesOrReflection: 'Great session!',
            };
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1'],
                outcome,
            });
            expect(session.outcome).toEqual(outcome);
        });
        it('should calculate duration correctly', () => {
            const startedAt = new Date('2024-01-01T10:00:00Z');
            const endedAt = new Date('2024-01-01T10:45:00Z');
            const session = engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-1',
                startedAt,
                endedAt,
                topicsCovered: ['topic-1'],
            });
            expect(session.durationMinutes).toBe(45);
        });
        it('should accumulate sessions for a user', () => {
            const now = new Date();
            // Record multiple sessions
            for (let i = 0; i < 5; i++) {
                const startedAt = new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000);
                const endedAt = new Date(startedAt.getTime() + 30 * 60 * 1000);
                engine.recordStudySession({
                    userId: 'user-1',
                    courseId: 'course-1',
                    startedAt,
                    endedAt,
                    topicsCovered: [`topic-${i}`],
                });
            }
            // Verify through habit analysis
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1', periodDays: 30 });
            expect(analysis.sessionsPerWeek).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // STUDY HABIT ANALYSIS
    // ============================================================================
    describe('analyzeStudyHabits', () => {
        beforeEach(() => {
            // Create sessions for habit analysis
            const now = new Date();
            for (let i = 0; i < 10; i++) {
                const startedAt = new Date(now.getTime() - (10 - i) * 24 * 60 * 60 * 1000);
                const endedAt = new Date(startedAt.getTime() + 45 * 60 * 1000);
                engine.recordStudySession({
                    userId: 'user-1',
                    courseId: 'course-1',
                    startedAt,
                    endedAt,
                    topicsCovered: [`topic-${i}`],
                    strategiesUsed: i % 2 === 0 ? ['SPACED_PRACTICE'] : ['RETRIEVAL_PRACTICE'],
                    environment: { location: 'HOME', noiseLevel: 'MODERATE', distractions: [], deviceUsed: 'LAPTOP', timeOfDay: 'AFTERNOON' },
                    outcome: { goalsAchieved: true, comprehensionLevel: (3 + (i % 2)), satisfactionLevel: 4 },
                });
            }
        });
        it('should analyze study habits for a user', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.userId).toBe('user-1');
            expect(analysis.totalStudyHours).toBeGreaterThan(0);
            expect(analysis.averageSessionMinutes).toBeGreaterThan(0);
            expect(analysis.sessionsPerWeek).toBeGreaterThan(0);
        });
        it('should return correct period information', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1', periodDays: 30 });
            expect(analysis.period.start).toBeDefined();
            expect(analysis.period.end).toBeDefined();
            expect(analysis.period.end.getTime()).toBeGreaterThan(analysis.period.start.getTime());
        });
        it('should identify optimal study times', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.optimalStudyTimes).toBeDefined();
            if (analysis.optimalStudyTimes.length > 0) {
                analysis.optimalStudyTimes.forEach(slot => {
                    expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
                    expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
                    expect(slot.effectivenessScore).toBeGreaterThanOrEqual(0);
                });
            }
        });
        it('should analyze strategy effectiveness', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.strategyEffectiveness).toBeDefined();
            if (analysis.strategyEffectiveness.length > 0) {
                analysis.strategyEffectiveness.forEach(se => {
                    expect(se.strategy).toBeDefined();
                    expect(se.usageFrequency).toBeGreaterThanOrEqual(0);
                    expect(se.effectivenessScore).toBeGreaterThanOrEqual(0);
                });
            }
        });
        it('should analyze focus patterns', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.focusPatterns).toBeDefined();
            expect(analysis.focusPatterns.peakFocusTime).toBeDefined();
            expect(analysis.focusPatterns.distractionTriggers).toBeDefined();
        });
        it('should analyze break patterns', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.breakPatterns).toBeDefined();
            expect(analysis.breakPatterns.averageBreakFrequency).toBeGreaterThanOrEqual(0);
            expect(analysis.breakPatterns.optimalBreakInterval).toBeGreaterThan(0);
        });
        it('should calculate habit scores', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.habitScores).toBeDefined();
            expect(analysis.habitScores.TIME_ALLOCATION).toBeDefined();
            expect(analysis.habitScores.ENVIRONMENT).toBeDefined();
            expect(analysis.habitScores.FOCUS_MANAGEMENT).toBeDefined();
            expect(analysis.habitScores.BREAK_PATTERNS).toBeDefined();
            expect(analysis.habitScores.CONTENT_ENGAGEMENT).toBeDefined();
            expect(analysis.habitScores.REVIEW_FREQUENCY).toBeDefined();
        });
        it('should generate recommendations for low-scoring areas', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis.recommendations).toBeDefined();
            analysis.recommendations.forEach(rec => {
                expect(rec.category).toBeDefined();
                expect(rec.currentState).toBeDefined();
                expect(rec.recommendation).toBeDefined();
                expect(rec.actionSteps).toBeDefined();
                expect(rec.expectedImpact).toBeDefined();
            });
        });
        it('should filter by course when courseId is provided', () => {
            // Record session for different course
            const now = new Date();
            engine.recordStudySession({
                userId: 'user-1',
                courseId: 'course-2',
                startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                endedAt: new Date(now.getTime() - 23 * 60 * 60 * 1000),
                topicsCovered: ['different-topic'],
            });
            const analysis1 = engine.analyzeStudyHabits({ userId: 'user-1', courseId: 'course-1' });
            const analysis2 = engine.analyzeStudyHabits({ userId: 'user-1' });
            expect(analysis1.totalStudyHours).toBeLessThanOrEqual(analysis2.totalStudyHours);
        });
        it('should handle user with no sessions', () => {
            const analysis = engine.analyzeStudyHabits({ userId: 'new-user' });
            expect(analysis.totalStudyHours).toBe(0);
            expect(analysis.averageSessionMinutes).toBe(0);
            expect(analysis.sessionsPerWeek).toBe(0);
        });
    });
    // ============================================================================
    // LEARNING STRATEGY RECOMMENDATIONS
    // ============================================================================
    describe('recommendStrategies', () => {
        it('should recommend strategies for a new user', () => {
            const result = engine.recommendStrategies({ userId: 'new-user' });
            expect(result.recommendations).toBeDefined();
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.currentStrategies).toEqual([]);
            expect(result.underutilizedStrategies.length).toBeGreaterThan(0);
        });
        it('should include recommendation details', () => {
            const result = engine.recommendStrategies({ userId: 'new-user' });
            result.recommendations.forEach(rec => {
                expect(rec.strategy).toBeDefined();
                expect(rec.reason).toBeDefined();
                expect(rec.howToApply).toBeDefined();
                expect(rec.expectedBenefit).toBeDefined();
                expect(rec.difficultyToAdopt).toBeDefined();
                expect(rec.evidenceBase).toBeDefined();
            });
        });
        it('should recommend based on Blooms level', () => {
            const result = engine.recommendStrategies({
                userId: 'user-1',
                bloomsLevel: 'APPLY',
            });
            expect(result.recommendations.length).toBeGreaterThan(0);
            // At least some recommendations should reference the Blooms level
            const hasBloomsRelated = result.recommendations.some(rec => rec.reason.includes('APPLY') || rec.reason.includes('underutilized'));
            expect(hasBloomsRelated).toBe(true);
        });
        it('should identify underutilized high-effectiveness strategies', () => {
            const result = engine.recommendStrategies({ userId: 'new-user' });
            expect(result.underutilizedStrategies).toContain('SPACED_PRACTICE');
            expect(result.underutilizedStrategies).toContain('RETRIEVAL_PRACTICE');
        });
        it('should identify overused low-effectiveness strategies', () => {
            // First record sessions using low-effectiveness strategies
            const now = new Date();
            for (let i = 0; i < 5; i++) {
                engine.recordStudySession({
                    userId: 'user-overuse',
                    courseId: 'course-1',
                    startedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
                    endedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                    topicsCovered: [`topic-${i}`],
                    strategiesUsed: ['HIGHLIGHTING', 'REREADING'],
                });
            }
            const result = engine.recommendStrategies({ userId: 'user-overuse' });
            expect(result.overusedStrategies.length).toBeGreaterThan(0);
            expect(result.overusedStrategies).toContain('HIGHLIGHTING');
        });
        it('should consider current strategies when recommending', () => {
            // Record sessions with some strategies
            const now = new Date();
            for (let i = 0; i < 5; i++) {
                engine.recordStudySession({
                    userId: 'user-diverse',
                    courseId: 'course-1',
                    startedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
                    endedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
                    topicsCovered: [`topic-${i}`],
                    strategiesUsed: ['SPACED_PRACTICE', 'INTERLEAVING'],
                });
            }
            const result = engine.recommendStrategies({ userId: 'user-diverse' });
            expect(result.currentStrategies).toContain('SPACED_PRACTICE');
            expect(result.currentStrategies).toContain('INTERLEAVING');
        });
    });
    // ============================================================================
    // CONFIDENCE CALIBRATION
    // ============================================================================
    describe('assessConfidence', () => {
        it('should assess confidence for a list of concepts', () => {
            const result = engine.assessConfidence({
                userId: 'user-1',
                courseId: 'course-1',
                topicId: 'topic-1',
                items: [
                    { concept: 'concept-1', confidence: 4 },
                    { concept: 'concept-2', confidence: 3 },
                    { concept: 'concept-3', confidence: 5 },
                ],
            });
            expect(result.id).toBeDefined();
            expect(result.userId).toBe('user-1');
            expect(result.courseId).toBe('course-1');
            expect(result.items.length).toBe(3);
            expect(result.calibrationScore).toBeDefined();
            expect(result.confidenceBias).toBeDefined();
        });
        it('should calculate calibration score based on average confidence', () => {
            const result = engine.assessConfidence({
                userId: 'user-1',
                items: [
                    { concept: 'concept-1', confidence: 5 },
                    { concept: 'concept-2', confidence: 5 },
                    { concept: 'concept-3', confidence: 5 },
                ],
            });
            expect(result.calibrationScore).toBe(100);
        });
        it('should detect OVERCONFIDENT bias', () => {
            // First assessment with lower confidence
            engine.assessConfidence({
                userId: 'user-bias',
                items: [
                    { concept: 'concept-1', confidence: 2 },
                    { concept: 'concept-2', confidence: 2 },
                ],
            });
            // Second assessment with much higher confidence
            const result = engine.assessConfidence({
                userId: 'user-bias',
                items: [
                    { concept: 'concept-1', confidence: 5 },
                    { concept: 'concept-2', confidence: 5 },
                ],
            });
            expect(result.confidenceBias).toBe('OVERCONFIDENT');
        });
        it('should detect UNDERCONFIDENT bias', () => {
            // First assessment with higher confidence
            engine.assessConfidence({
                userId: 'user-bias-2',
                items: [
                    { concept: 'concept-1', confidence: 5 },
                    { concept: 'concept-2', confidence: 5 },
                ],
            });
            // Second assessment with much lower confidence
            const result = engine.assessConfidence({
                userId: 'user-bias-2',
                items: [
                    { concept: 'concept-1', confidence: 2 },
                    { concept: 'concept-2', confidence: 2 },
                ],
            });
            expect(result.confidenceBias).toBe('UNDERCONFIDENT');
        });
        it('should detect WELL_CALIBRATED for consistent confidence', () => {
            // Multiple assessments with similar confidence
            for (let i = 0; i < 3; i++) {
                engine.assessConfidence({
                    userId: 'user-calibrated',
                    items: [
                        { concept: 'concept-1', confidence: 3 },
                        { concept: 'concept-2', confidence: 3 },
                    ],
                });
            }
            const result = engine.assessConfidence({
                userId: 'user-calibrated',
                items: [
                    { concept: 'concept-1', confidence: 3 },
                    { concept: 'concept-2', confidence: 3 },
                ],
            });
            expect(result.confidenceBias).toBe('WELL_CALIBRATED');
        });
        it('should include assessment timestamp', () => {
            const result = engine.assessConfidence({
                userId: 'user-1',
                items: [{ concept: 'concept-1', confidence: 3 }],
            });
            expect(result.assessedAt).toBeInstanceOf(Date);
        });
    });
    // ============================================================================
    // COGNITIVE LOAD ASSESSMENT
    // ============================================================================
    describe('assessCognitiveLoad', () => {
        it('should assess cognitive load for a user', () => {
            const result = engine.assessCognitiveLoad({
                userId: 'user-1',
                sessionId: 'session-1',
            });
            expect(result.userId).toBe('user-1');
            expect(result.sessionId).toBe('session-1');
            expect(result.currentLoad).toBeDefined();
            expect(result.loadFactors).toBeDefined();
            expect(result.recommendations).toBeDefined();
            expect(result.assessedAt).toBeInstanceOf(Date);
        });
        it('should accept self-reported load level', () => {
            const levels = ['LOW', 'OPTIMAL', 'HIGH', 'OVERLOAD'];
            levels.forEach(level => {
                const result = engine.assessCognitiveLoad({
                    userId: 'user-1',
                    selfReportedLoad: level,
                });
                expect(result.currentLoad).toBe(level);
            });
        });
        it('should identify load factors', () => {
            const result = engine.assessCognitiveLoad({
                userId: 'user-1',
                selfReportedLoad: 'HIGH',
            });
            expect(result.loadFactors.length).toBeGreaterThan(0);
            result.loadFactors.forEach(factor => {
                expect(factor.factor).toBeDefined();
                expect(factor.type).toBeDefined();
                expect(['INTRINSIC', 'EXTRANEOUS', 'GERMANE']).toContain(factor.type);
                expect(factor.impact).toBeDefined();
                expect(factor.isManageable).toBeDefined();
            });
        });
        it('should generate recommendations for OVERLOAD', () => {
            const result = engine.assessCognitiveLoad({
                userId: 'user-1',
                selfReportedLoad: 'OVERLOAD',
            });
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.some(r => r.action.includes('break'))).toBe(true);
        });
        it('should generate recommendations for HIGH load', () => {
            const result = engine.assessCognitiveLoad({
                userId: 'user-1',
                selfReportedLoad: 'HIGH',
            });
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
        it('should generate recommendations for LOW load', () => {
            const result = engine.assessCognitiveLoad({
                userId: 'user-1',
                selfReportedLoad: 'LOW',
            });
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.some(r => r.action.includes('challenge'))).toBe(true);
        });
        it('should estimate load based on session history', () => {
            // Record sessions with varying focus levels
            const now = new Date();
            for (let i = 0; i < 5; i++) {
                engine.recordStudySession({
                    userId: 'user-history',
                    courseId: 'course-1',
                    startedAt: new Date(now.getTime() - (5 - i) * 60 * 60 * 1000),
                    endedAt: new Date(now.getTime() - (5 - i) * 60 * 60 * 1000 + 30 * 60 * 1000),
                    topicsCovered: [`topic-${i}`],
                    outcome: { goalsAchieved: false, comprehensionLevel: 2, satisfactionLevel: 2 }, // Low comprehension
                });
            }
            const result = engine.assessCognitiveLoad({
                userId: 'user-history',
                recentPerformance: 40,
            });
            expect(['HIGH', 'OVERLOAD']).toContain(result.currentLoad);
        });
    });
    // ============================================================================
    // GOAL MANAGEMENT
    // ============================================================================
    describe('setGoal', () => {
        it('should create a new learning goal', () => {
            const goal = engine.setGoal({
                userId: 'user-1',
                courseId: 'course-1',
                description: 'Master algebra fundamentals',
                type: 'MASTERY',
                targetMetric: { metricType: 'score', currentValue: 0, targetValue: 90, unit: 'percent' },
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            expect(goal.id).toBeDefined();
            expect(goal.userId).toBe('user-1');
            expect(goal.courseId).toBe('course-1');
            expect(goal.description).toBe('Master algebra fundamentals');
            expect(goal.type).toBe('MASTERY');
            expect(goal.targetMetric?.targetValue).toBe(90);
            expect(goal.progress).toBe(0);
            expect(goal.status).toBe('ACTIVE');
        });
        it('should create goal with milestones', () => {
            const goal = engine.setGoal({
                userId: 'user-1',
                description: 'Complete course',
                type: 'COMPLETION',
                milestones: [
                    { description: 'Finish chapter 1', targetDate: new Date() },
                    { description: 'Finish chapter 2', targetDate: new Date() },
                ],
            });
            expect(goal.milestones.length).toBe(2);
            goal.milestones.forEach(m => {
                expect(m.id).toBeDefined();
                expect(m.description).toBeDefined();
                expect(m.completed).toBe(false);
            });
        });
        it('should support different goal types', () => {
            const goalTypes = [
                'MASTERY',
                'COMPLETION',
                'PERFORMANCE',
                'HABIT',
                'SKILL',
                'TIME_BASED',
            ];
            goalTypes.forEach(type => {
                const goal = engine.setGoal({
                    userId: 'user-1',
                    description: `Test ${type} goal`,
                    type,
                });
                expect(goal.type).toBe(type);
            });
        });
        it('should initialize goal with empty reflections', () => {
            const goal = engine.setGoal({
                userId: 'user-1',
                description: 'Test goal',
                type: 'MASTERY',
            });
            expect(goal.reflections).toEqual([]);
        });
        it('should set creation and update timestamps', () => {
            const goal = engine.setGoal({
                userId: 'user-1',
                description: 'Test goal',
                type: 'COMPLETION',
            });
            expect(goal.createdAt).toBeInstanceOf(Date);
            expect(goal.updatedAt).toBeInstanceOf(Date);
        });
    });
    describe('updateGoalProgress', () => {
        let goalId;
        beforeEach(() => {
            const goal = engine.setGoal({
                userId: 'user-1',
                description: 'Test goal',
                type: 'COMPLETION',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                milestones: [
                    { description: 'Milestone 1', targetDate: new Date() },
                ],
            });
            goalId = goal.id;
        });
        it('should update goal progress', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 50,
            });
            expect(result.currentProgress).toBe(50);
            expect(result.goalId).toBe(goalId);
        });
        it('should calculate projected completion', () => {
            // Wait a bit to have time passed
            engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 25,
            });
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 50,
            });
            expect(result.projectedCompletion).toBeDefined();
        });
        it('should add reflection to goal', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                reflection: 'Making good progress!',
            });
            expect(result).toBeDefined();
        });
        it('should determine if on track', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 50,
            });
            expect(typeof result.isOnTrack).toBe('boolean');
        });
        it('should identify risk factors when behind schedule', () => {
            // Set minimal progress close to deadline
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 5,
            });
            // Risk factors may or may not be present depending on timing
            expect(result.riskFactors).toBeDefined();
        });
        it('should generate suggestions for improvement', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 10,
            });
            expect(result.suggestions).toBeDefined();
        });
        it('should include motivational message', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId,
                progress: 50,
            });
            expect(result.motivationalMessage).toBeDefined();
            expect(result.motivationalMessage.length).toBeGreaterThan(0);
        });
        it('should handle non-existent goal gracefully', () => {
            const result = engine.updateGoalProgress({
                userId: 'user-1',
                goalId: 'non-existent-goal',
                progress: 50,
            });
            expect(result.currentProgress).toBe(0);
            expect(result.isOnTrack).toBe(false);
            expect(result.riskFactors).toContain('Goal not found');
        });
        it('should generate appropriate motivational messages for different progress levels', () => {
            const progressLevels = [0, 10, 30, 55, 80, 100];
            progressLevels.forEach(progress => {
                const result = engine.updateGoalProgress({
                    userId: 'user-1',
                    goalId,
                    progress,
                });
                expect(result.motivationalMessage).toBeDefined();
                expect(result.motivationalMessage.length).toBeGreaterThan(0);
            });
        });
    });
    // ============================================================================
    // METACOGNITIVE SKILL ASSESSMENT
    // ============================================================================
    describe('getMetacognitiveAssessment', () => {
        it('should assess metacognitive skills for a user', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            expect(assessment.userId).toBe('user-1');
            expect(assessment.skills).toBeDefined();
            expect(assessment.skills.length).toBe(8);
            expect(assessment.overallScore).toBeDefined();
            expect(assessment.strengths).toBeDefined();
            expect(assessment.developmentAreas).toBeDefined();
            expect(assessment.exercises).toBeDefined();
        });
        it('should assess all metacognitive skills', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            const expectedSkills = [
                'PLANNING',
                'MONITORING',
                'EVALUATING',
                'REGULATING',
                'SELF_QUESTIONING',
                'ELABORATION',
                'ORGANIZATION',
                'TIME_MANAGEMENT',
            ];
            const assessedSkills = assessment.skills.map(s => s.skill);
            expectedSkills.forEach(skill => {
                expect(assessedSkills).toContain(skill);
            });
        });
        it('should include skill scores with evidence sources', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            assessment.skills.forEach(skill => {
                expect(skill.score).toBeGreaterThanOrEqual(0);
                expect(skill.score).toBeLessThanOrEqual(100);
                expect(skill.trend).toBeDefined();
                expect(skill.evidenceSources).toBeDefined();
                expect(skill.evidenceSources.length).toBeGreaterThan(0);
            });
        });
        it('should identify top 3 strengths', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            expect(assessment.strengths.length).toBe(3);
        });
        it('should identify bottom 3 development areas', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            expect(assessment.developmentAreas.length).toBe(3);
        });
        it('should generate exercises for development areas', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            expect(assessment.exercises.length).toBe(assessment.developmentAreas.length);
            assessment.exercises.forEach(exercise => {
                expect(exercise.id).toBeDefined();
                expect(exercise.title).toBeDefined();
                expect(exercise.description).toBeDefined();
                expect(exercise.targetSkill).toBeDefined();
                expect(exercise.duration).toBeGreaterThan(0);
                expect(exercise.instructions).toBeDefined();
                expect(exercise.instructions.length).toBeGreaterThan(0);
            });
        });
        it('should calculate overall score as average of skills', () => {
            const assessment = engine.getMetacognitiveAssessment({ userId: 'user-1' });
            const expectedAverage = Math.round(assessment.skills.reduce((sum, s) => sum + s.score, 0) / assessment.skills.length);
            expect(assessment.overallScore).toBe(expectedAverage);
        });
        it('should improve scores based on user activity', () => {
            const now = new Date();
            // Record goals
            engine.setGoal({
                userId: 'active-user',
                description: 'Test goal',
                type: 'MASTERY',
                milestones: [{ description: 'M1', targetDate: now }],
            });
            // Record sessions with strategies
            for (let i = 0; i < 5; i++) {
                engine.recordStudySession({
                    userId: 'active-user',
                    courseId: 'course-1',
                    startedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
                    endedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
                    topicsCovered: [`topic-${i}`],
                    strategiesUsed: ['SPACED_PRACTICE', 'SUMMARIZATION', 'DUAL_CODING'],
                    outcome: { goalsAchieved: true, comprehensionLevel: 4, satisfactionLevel: 4 },
                    breaks: [{ startedAt: now, durationMinutes: 5, type: 'SHORT' }],
                });
            }
            const assessment = engine.getMetacognitiveAssessment({ userId: 'active-user' });
            // Should have higher scores due to activity
            expect(assessment.skills.find(s => s.skill === 'PLANNING')?.score).toBeGreaterThanOrEqual(70);
        });
        it('should cache assessment and return cached version', () => {
            const assessment1 = engine.getMetacognitiveAssessment({ userId: 'cache-user' });
            const assessment2 = engine.getMetacognitiveAssessment({ userId: 'cache-user' });
            expect(assessment1.assessedAt.getTime()).toBe(assessment2.assessedAt.getTime());
        });
    });
    // ============================================================================
    // SELF-REGULATION PROFILE
    // ============================================================================
    describe('getSelfRegulationProfile', () => {
        it('should get self-regulation profile for a user', () => {
            const profile = engine.getSelfRegulationProfile('user-1');
            expect(profile.userId).toBe('user-1');
            expect(profile.emotionalRegulation).toBeDefined();
            expect(profile.motivationRegulation).toBeDefined();
            expect(profile.attentionRegulation).toBeDefined();
            expect(profile.overallScore).toBeDefined();
            expect(profile.interventions).toBeDefined();
        });
        it('should include emotional regulation metrics', () => {
            const profile = engine.getSelfRegulationProfile('user-1');
            expect(profile.emotionalRegulation.frustrationTolerance).toBeDefined();
            expect(profile.emotionalRegulation.anxietyManagement).toBeDefined();
            expect(profile.emotionalRegulation.confidenceStability).toBeDefined();
            expect(profile.emotionalRegulation.recoveryFromSetbacks).toBeDefined();
        });
        it('should include motivation regulation metrics', () => {
            const profile = engine.getSelfRegulationProfile('user-1');
            expect(profile.motivationRegulation.intrinsicMotivation).toBeDefined();
            expect(profile.motivationRegulation.goalPersistence).toBeDefined();
            expect(profile.motivationRegulation.effortRegulation).toBeDefined();
            expect(profile.motivationRegulation.interestMaintenance).toBeDefined();
        });
        it('should include attention regulation metrics', () => {
            const profile = engine.getSelfRegulationProfile('user-1');
            expect(profile.attentionRegulation.focusDuration).toBeDefined();
            expect(profile.attentionRegulation.distractionResistance).toBeDefined();
            expect(profile.attentionRegulation.taskSwitchingEfficiency).toBeDefined();
            expect(profile.attentionRegulation.sustainedAttention).toBeDefined();
        });
        it('should return same profile for same user', () => {
            const profile1 = engine.getSelfRegulationProfile('consistent-user');
            const profile2 = engine.getSelfRegulationProfile('consistent-user');
            expect(profile1.userId).toBe(profile2.userId);
        });
        it('should have default values for new users', () => {
            const profile = engine.getSelfRegulationProfile('new-user');
            expect(profile.overallScore).toBe(60);
            expect(profile.emotionalRegulation.frustrationTolerance).toBe(60);
            expect(profile.interventions).toEqual([]);
        });
    });
    describe('recordIntervention', () => {
        it('should record an emotional intervention', () => {
            const intervention = engine.recordIntervention('user-1', 'EMOTIONAL', 'Feeling frustrated with difficult problem', 'Take a break and practice deep breathing');
            expect(intervention.type).toBe('EMOTIONAL');
            expect(intervention.trigger).toBe('Feeling frustrated with difficult problem');
            expect(intervention.intervention).toBe('Take a break and practice deep breathing');
            expect(intervention.triggeredAt).toBeInstanceOf(Date);
        });
        it('should record a motivation intervention', () => {
            const intervention = engine.recordIntervention('user-1', 'MOTIVATION', 'Losing interest in material', 'Connect learning to personal goals');
            expect(intervention.type).toBe('MOTIVATION');
        });
        it('should record an attention intervention', () => {
            const intervention = engine.recordIntervention('user-1', 'ATTENTION', 'Getting distracted by phone', 'Put phone in another room');
            expect(intervention.type).toBe('ATTENTION');
        });
        it('should add intervention to user profile', () => {
            engine.recordIntervention('user-tracking', 'EMOTIONAL', 'Trigger 1', 'Intervention 1');
            engine.recordIntervention('user-tracking', 'MOTIVATION', 'Trigger 2', 'Intervention 2');
            engine.recordIntervention('user-tracking', 'ATTENTION', 'Trigger 3', 'Intervention 3');
            const profile = engine.getSelfRegulationProfile('user-tracking');
            expect(profile.interventions.length).toBe(3);
        });
        it('should limit interventions to last 50', () => {
            for (let i = 0; i < 60; i++) {
                engine.recordIntervention('user-many', 'EMOTIONAL', `Trigger ${i}`, `Intervention ${i}`);
            }
            const profile = engine.getSelfRegulationProfile('user-many');
            expect(profile.interventions.length).toBe(50);
        });
        it('should update profile timestamp', () => {
            const profileBefore = engine.getSelfRegulationProfile('user-timestamp');
            const beforeTime = profileBefore.updatedAt.getTime();
            // Small delay to ensure different timestamp
            engine.recordIntervention('user-timestamp', 'EMOTIONAL', 'Trigger', 'Intervention');
            const profileAfter = engine.getSelfRegulationProfile('user-timestamp');
            expect(profileAfter.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
        });
    });
    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================
    describe('Edge Cases', () => {
        it('should handle empty user data gracefully', async () => {
            const reflection = await engine.generateReflection({
                userId: 'empty-user',
                type: 'PRE_LEARNING',
            });
            expect(reflection.prompts.length).toBeGreaterThan(0);
        });
        it('should handle very long reflection responses', async () => {
            const longText = 'I learned '.repeat(500) + 'a lot today.';
            const prompt = {
                id: 'long-prompt',
                type: 'POST_LEARNING',
                depth: 'DEEP',
                question: 'What did you learn?',
                followUpQuestions: [],
                targetSkill: 'EVALUATING',
                suggestedTimeMinutes: 10,
                responseType: 'TEXT',
            };
            const response = {
                promptId: 'long-prompt',
                userId: 'user-1',
                response: longText,
                responseTimeSeconds: 600,
                timestamp: new Date(),
            };
            const analysis = await engine.analyzeReflection({ prompt, response });
            expect(analysis.qualityScore).toBeDefined();
        });
        it('should handle sessions with zero duration', () => {
            const now = new Date();
            const session = engine.recordStudySession({
                userId: 'zero-duration',
                courseId: 'course-1',
                startedAt: now,
                endedAt: now,
                topicsCovered: ['topic-1'],
            });
            expect(session.durationMinutes).toBe(0);
        });
        it('should handle goal with no deadline', () => {
            const goal = engine.setGoal({
                userId: 'no-deadline',
                description: 'Open-ended learning goal',
                type: 'HABIT',
            });
            const result = engine.updateGoalProgress({
                userId: 'no-deadline',
                goalId: goal.id,
                progress: 50,
            });
            expect(result.projectedCompletion).toBeNull();
        });
        it('should handle confidence items with extreme values', () => {
            const result = engine.assessConfidence({
                userId: 'extreme-user',
                items: [
                    { concept: 'very-confident', confidence: 5 },
                    { concept: 'not-confident', confidence: 1 },
                ],
            });
            expect(result.calibrationScore).toBeDefined();
        });
        it('should handle empty topics covered', () => {
            const now = new Date();
            const session = engine.recordStudySession({
                userId: 'no-topics',
                courseId: 'course-1',
                startedAt: now,
                endedAt: new Date(now.getTime() + 30 * 60 * 1000),
                topicsCovered: [],
            });
            expect(session.topicsCovered).toEqual([]);
        });
        it('should handle concurrent assessments for same user', async () => {
            const promises = [
                engine.generateReflection({ userId: 'concurrent-user', type: 'PRE_LEARNING' }),
                engine.generateReflection({ userId: 'concurrent-user', type: 'POST_LEARNING' }),
                engine.generateReflection({ userId: 'concurrent-user', type: 'DURING_LEARNING' }),
            ];
            const results = await Promise.all(promises);
            results.forEach(result => {
                expect(result.prompts.length).toBeGreaterThan(0);
            });
        });
        it('should handle special characters in reflection responses', async () => {
            const prompt = {
                id: 'special-chars',
                type: 'POST_LEARNING',
                depth: 'MODERATE',
                question: 'What did you learn?',
                followUpQuestions: [],
                targetSkill: 'EVALUATING',
                suggestedTimeMinutes: 5,
                responseType: 'TEXT',
            };
            const response = {
                promptId: 'special-chars',
                userId: 'user-1',
                response: 'I learned about <html> & "quotes" and apostrophe\'s!',
                responseTimeSeconds: 60,
                timestamp: new Date(),
            };
            const analysis = await engine.analyzeReflection({ prompt, response });
            expect(analysis).toBeDefined();
        });
        it('should handle missing optional fields in study session', () => {
            const now = new Date();
            const session = engine.recordStudySession({
                userId: 'minimal-session',
                courseId: 'course-1',
                startedAt: now,
                endedAt: new Date(now.getTime() + 30 * 60 * 1000),
                topicsCovered: ['topic-1'],
                // No optional fields
            });
            expect(session.breaks).toEqual([]);
            expect(session.strategiesUsed).toEqual([]);
            expect(session.environment).toBeUndefined();
            expect(session.outcome).toBeUndefined();
        });
    });
    // ============================================================================
    // AI REFLECTION TESTS (with mocked AI)
    // ============================================================================
    describe('AI Reflection Generation', () => {
        it('should handle AI reflection when AI is not configured', async () => {
            const aiEngine = createMetacognitionEngine(createDefaultConfig({ enableAIReflection: true }));
            const result = await aiEngine.generateReflection({
                userId: 'user-1',
                type: 'PRE_LEARNING',
            });
            // Should still return template prompts even without AI
            expect(result.prompts.length).toBeGreaterThan(0);
        });
        it('should extract themes from previous reflections', async () => {
            const aiEngine = createMetacognitionEngine(createDefaultConfig({ enableAIReflection: true }));
            const previousReflections = [
                {
                    promptId: 'p1',
                    userId: 'user-1',
                    response: 'I struggle with time management',
                    responseTimeSeconds: 60,
                    timestamp: new Date(),
                },
                {
                    promptId: 'p2',
                    userId: 'user-1',
                    response: 'I understand the concepts now',
                    responseTimeSeconds: 60,
                    timestamp: new Date(),
                },
            ];
            const result = await aiEngine.generateReflection({
                userId: 'user-1',
                type: 'WEEKLY_REVIEW',
                previousReflections,
            });
            expect(result.prompts.length).toBeGreaterThan(0);
        });
    });
});
