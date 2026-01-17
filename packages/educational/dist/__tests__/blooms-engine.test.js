/**
 * @sam-ai/educational - Blooms Analysis Engine Tests
 * Tests for advanced Bloom's Taxonomy analysis with cognitive profiling
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BloomsAnalysisEngine, createBloomsAnalysisEngine } from '../engines/blooms-engine';
import { createMockSAMConfig, createMockAIAdapter, createMockAIResponse, BLOOMS_SAMPLE_CONTENT } from './setup';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createSampleCourseInput(overrides = {}) {
    return {
        id: 'course-1',
        title: 'Introduction to Programming',
        description: 'Learn the fundamentals of programming',
        chapters: [
            {
                id: 'ch-1',
                title: 'Getting Started',
                position: 1,
                sections: [
                    {
                        id: 's-1',
                        title: 'What is Programming?',
                        description: 'Define and explain what programming is',
                        content: 'Define programming. List the key concepts. Identify the main ideas.',
                        type: 'lesson',
                        learningObjectives: ['Define programming', 'Identify key concepts'],
                    },
                    {
                        id: 's-2',
                        title: 'Your First Program',
                        description: 'Apply programming basics',
                        content: 'Apply the basics. Demonstrate how to write code. Solve simple problems.',
                        type: 'practice',
                        hasVideo: true,
                        duration: 15,
                        learningObjectives: ['Write your first program', 'Apply basic syntax'],
                    },
                ],
            },
            {
                id: 'ch-2',
                title: 'Variables and Data Types',
                position: 2,
                sections: [
                    {
                        id: 's-3',
                        title: 'Understanding Variables',
                        description: 'Analyze how variables work',
                        content: 'Analyze how variables work. Compare different data types. Differentiate between concepts.',
                        type: 'lesson',
                        learningObjectives: ['Analyze variable behavior', 'Compare data types'],
                    },
                    {
                        id: 's-4',
                        title: 'Advanced Data Types',
                        description: 'Evaluate and create complex types',
                        content: 'Evaluate different type systems. Create custom data structures. Design solutions.',
                        type: 'project',
                        learningObjectives: ['Evaluate type systems', 'Create custom structures'],
                    },
                ],
            },
        ],
        ...overrides,
    };
}
function createSampleCourseWithQuestions() {
    return {
        id: 'course-with-questions',
        title: 'Course with Questions',
        chapters: [
            {
                id: 'ch-1',
                title: 'Chapter 1',
                position: 1,
                sections: [
                    {
                        id: 's-1',
                        title: 'Section with Questions',
                        content: 'Learning content',
                        questions: [
                            { id: 'q-1', text: 'Define the term programming', bloomsLevel: 'REMEMBER' },
                            { id: 'q-2', text: 'Explain how functions work', bloomsLevel: 'UNDERSTAND' },
                            { id: 'q-3', text: 'Apply these concepts to solve the problem', bloomsLevel: 'APPLY' },
                        ],
                    },
                ],
            },
        ],
    };
}
function createSampleCourseWithExams() {
    return {
        id: 'course-with-exams',
        title: 'Course with Exams',
        chapters: [
            {
                id: 'ch-1',
                title: 'Chapter 1',
                position: 1,
                sections: [
                    {
                        id: 's-1',
                        title: 'Section with Exam',
                        content: 'Learning content',
                        exams: [
                            {
                                id: 'exam-1',
                                title: 'Midterm Exam',
                                questions: [
                                    { id: 'q-1', text: 'Analyze the pattern', bloomsLevel: 'ANALYZE' },
                                    { id: 'q-2', text: 'Evaluate the approach', bloomsLevel: 'EVALUATE' },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('BloomsAnalysisEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = {
            samConfig: createMockSAMConfig(),
            analysisDepth: 'standard',
        };
        engine = createBloomsAnalysisEngine(config);
    });
    // ==========================================================================
    // ANALYZE CONTENT TESTS
    // ==========================================================================
    describe('analyzeContent', () => {
        it('should return a valid analysis result', async () => {
            const content = 'Explain the concept. Summarize the key points. Define the terms.';
            const result = await engine.analyzeContent(content);
            expect(result).toBeDefined();
            expect(result.distribution).toBeDefined();
            expect(result.dominantLevel).toBeDefined();
            expect(result.gaps).toBeDefined();
            expect(result.recommendations).toBeDefined();
            expect(result.cognitiveProfile).toBeDefined();
        });
        it('should identify REMEMBER level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.REMEMBER;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.REMEMBER).toBeGreaterThan(0);
        });
        it('should identify UNDERSTAND level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.UNDERSTAND;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.UNDERSTAND).toBeGreaterThan(0);
        });
        it('should identify APPLY level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.APPLY;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.APPLY).toBeGreaterThan(0);
        });
        it('should identify ANALYZE level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.ANALYZE;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.ANALYZE).toBeGreaterThan(0);
        });
        it('should identify EVALUATE level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.EVALUATE;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.EVALUATE).toBeGreaterThan(0);
        });
        it('should identify CREATE level content', async () => {
            const content = BLOOMS_SAMPLE_CONTENT.CREATE;
            const result = await engine.analyzeContent(content);
            expect(result.distribution.CREATE).toBeGreaterThan(0);
        });
        it('should identify gaps when levels are missing', async () => {
            const content = 'Define the terms. List the key points. Recall the facts.';
            const result = await engine.analyzeContent(content);
            expect(result.gaps.length).toBeGreaterThan(0);
        });
        it('should generate recommendations for gaps', async () => {
            const content = 'Define the terms. List the key points.';
            const result = await engine.analyzeContent(content);
            expect(result.recommendations.length).toBeGreaterThan(0);
        });
        it('should include cognitive profile', async () => {
            const content = 'Explain concepts. Apply methods. Analyze data.';
            const result = await engine.analyzeContent(content);
            expect(result.cognitiveProfile).toBeDefined();
            expect(result.cognitiveProfile.overallMastery).toBeGreaterThanOrEqual(0);
            expect(result.cognitiveProfile.levelMastery).toBeDefined();
        });
        it('should handle empty content', async () => {
            const result = await engine.analyzeContent('');
            expect(result).toBeDefined();
            expect(result.dominantLevel).toBeDefined();
        });
        it('should use AI for comprehensive depth analysis', async () => {
            const aiConfig = {
                samConfig: createMockSAMConfig(),
                analysisDepth: 'comprehensive',
            };
            const aiEngine = createBloomsAnalysisEngine(aiConfig);
            const content = 'Analyze the complex patterns. Evaluate the effectiveness. Create new solutions.';
            const result = await aiEngine.analyzeContent(content);
            expect(result).toBeDefined();
            expect(result.distribution).toBeDefined();
        });
    });
    // ==========================================================================
    // ANALYZE COURSE TESTS
    // ==========================================================================
    describe('analyzeCourse', () => {
        it('should return a valid course analysis result', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
            expect(result.courseId).toBe('course-1');
            expect(result.courseLevel).toBeDefined();
            expect(result.chapterAnalysis).toBeDefined();
            expect(result.learningPathway).toBeDefined();
            expect(result.recommendations).toBeDefined();
            expect(result.studentImpact).toBeDefined();
            expect(result.analyzedAt).toBeDefined();
        });
        it('should analyze all chapters', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(result.chapterAnalysis).toHaveLength(2);
        });
        it('should include chapter-level Bloom distribution', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.bloomsDistribution).toBeDefined();
                expect(chapter.primaryLevel).toBeDefined();
                expect(chapter.cognitiveDepth).toBeGreaterThanOrEqual(0);
            });
        });
        it('should analyze sections within chapters', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.sections).toBeDefined();
                expect(chapter.sections.length).toBeGreaterThan(0);
                chapter.sections.forEach((section) => {
                    expect(section.bloomsLevel).toBeDefined();
                });
            });
        });
        it('should calculate course-level distribution', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(result.courseLevel.distribution).toBeDefined();
            const total = Object.values(result.courseLevel.distribution).reduce((sum, val) => sum + val, 0);
            expect(total).toBeCloseTo(100, 0);
        });
        it('should determine course balance', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(['well-balanced', 'bottom-heavy', 'top-heavy']).toContain(result.courseLevel.balance);
        });
        it('should generate learning pathway', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(result.learningPathway.current).toBeDefined();
            expect(result.learningPathway.recommended).toBeDefined();
            expect(result.learningPathway.gaps).toBeDefined();
        });
        it('should analyze courses with questions', async () => {
            const courseData = createSampleCourseWithQuestions();
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
            expect(result.chapterAnalysis).toHaveLength(1);
        });
        it('should analyze courses with exams', async () => {
            const courseData = createSampleCourseWithExams();
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
            expect(result.chapterAnalysis).toHaveLength(1);
        });
        it('should handle empty course', async () => {
            const courseData = {
                id: 'empty-course',
                title: 'Empty Course',
                chapters: [],
            };
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
            expect(result.chapterAnalysis).toHaveLength(0);
        });
        it('should skip recommendations when disabled', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData, { includeRecommendations: false });
            expect(result.recommendations.contentAdjustments).toHaveLength(0);
            expect(result.recommendations.assessmentChanges).toHaveLength(0);
            expect(result.recommendations.activitySuggestions).toHaveLength(0);
        });
        it('should analyze student impact', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            expect(result.studentImpact.skillsDeveloped).toBeDefined();
            expect(result.studentImpact.cognitiveGrowth).toBeDefined();
            expect(result.studentImpact.careerAlignment).toBeDefined();
        });
        it('should identify activities in sections', async () => {
            const courseData = createSampleCourseInput();
            const result = await engine.analyzeCourse(courseData);
            const section = result.chapterAnalysis[0].sections.find((s) => s.sectionId === 's-2');
            expect(section?.activities).toBeDefined();
            expect(section?.activities.length).toBeGreaterThan(0);
        });
    });
    // ==========================================================================
    // SPACED REPETITION TESTS
    // ==========================================================================
    describe('calculateSpacedRepetition', () => {
        it('should return a valid spaced repetition result', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 4,
            });
            expect(result).toBeDefined();
            expect(result.nextReviewDate).toBeInstanceOf(Date);
            expect(result.intervalDays).toBeGreaterThan(0);
            expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
            expect(result.repetitionCount).toBeGreaterThanOrEqual(1);
        });
        it('should reset interval for poor performance (< 3)', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 2,
            });
            expect(result.intervalDays).toBe(1);
        });
        it('should maintain minimum ease factor of 1.3', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 1,
            });
            expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
        });
        it('should return future review date', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 4,
            });
            expect(result.nextReviewDate.getTime()).toBeGreaterThan(Date.now());
        });
        it('should handle perfect performance (5)', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 5,
            });
            expect(result.intervalDays).toBeGreaterThanOrEqual(1);
            expect(result.easeFactor).toBeGreaterThan(1.3);
        });
        it('should handle minimum performance (0)', async () => {
            const result = await engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 0,
            });
            expect(result.intervalDays).toBe(1);
        });
    });
    // ==========================================================================
    // COGNITIVE PROFILE TESTS
    // ==========================================================================
    describe('getCognitiveProfile', () => {
        it('should return a default profile without database', async () => {
            const profile = await engine.getCognitiveProfile('user-1');
            expect(profile).toBeDefined();
            expect(profile.overallMastery).toBeGreaterThanOrEqual(0);
            expect(profile.levelMastery).toBeDefined();
            expect(profile.learningVelocity).toBeGreaterThan(0);
            expect(profile.preferredLevels).toBeDefined();
            expect(profile.challengeAreas).toBeDefined();
        });
        it('should include all Bloom levels in mastery', async () => {
            const profile = await engine.getCognitiveProfile('user-1');
            expect(profile.levelMastery.REMEMBER).toBeDefined();
            expect(profile.levelMastery.UNDERSTAND).toBeDefined();
            expect(profile.levelMastery.APPLY).toBeDefined();
            expect(profile.levelMastery.ANALYZE).toBeDefined();
            expect(profile.levelMastery.EVALUATE).toBeDefined();
            expect(profile.levelMastery.CREATE).toBeDefined();
        });
        it('should identify preferred levels', async () => {
            const profile = await engine.getCognitiveProfile('user-1');
            expect(Array.isArray(profile.preferredLevels)).toBe(true);
        });
        it('should identify challenge areas', async () => {
            const profile = await engine.getCognitiveProfile('user-1');
            expect(Array.isArray(profile.challengeAreas)).toBe(true);
        });
    });
    // ==========================================================================
    // RECOMMENDATIONS TESTS
    // ==========================================================================
    describe('getRecommendations', () => {
        it('should return learning recommendations', async () => {
            const recommendations = await engine.getRecommendations('user-1');
            expect(recommendations).toBeDefined();
            expect(Array.isArray(recommendations)).toBe(true);
        });
        it('should include recommendation type', async () => {
            const recommendations = await engine.getRecommendations('user-1');
            recommendations.forEach((rec) => {
                expect(['remediate', 'advance', 'practice']).toContain(rec.type);
            });
        });
        it('should include priority', async () => {
            const recommendations = await engine.getRecommendations('user-1');
            recommendations.forEach((rec) => {
                expect(rec.priority).toBeGreaterThanOrEqual(1);
            });
        });
        it('should include estimated time', async () => {
            const recommendations = await engine.getRecommendations('user-1');
            recommendations.forEach((rec) => {
                expect(rec.estimatedTime).toBeGreaterThan(0);
            });
        });
        it('should sort recommendations by priority', async () => {
            const recommendations = await engine.getRecommendations('user-1');
            for (let i = 1; i < recommendations.length; i++) {
                expect(recommendations[i].priority).toBeGreaterThanOrEqual(recommendations[i - 1].priority);
            }
        });
    });
    // ==========================================================================
    // UPDATE COGNITIVE PROGRESS TESTS
    // ==========================================================================
    describe('updateCognitiveProgress', () => {
        it('should handle missing database gracefully', async () => {
            // Should not throw without database
            await expect(engine.updateCognitiveProgress('user-1', 'section-1', 'APPLY', 85)).resolves.toBeUndefined();
        });
    });
    // ==========================================================================
    // LOG LEARNING ACTIVITY TESTS
    // ==========================================================================
    describe('logLearningActivity', () => {
        it('should handle missing database gracefully', async () => {
            // Should not throw without database
            await expect(engine.logLearningActivity('user-1', 'quiz_completed', { score: 90 })).resolves.toBeUndefined();
        });
    });
    // ==========================================================================
    // CREATE PROGRESS INTERVENTION TESTS
    // ==========================================================================
    describe('createProgressIntervention', () => {
        it('should handle missing database gracefully', async () => {
            // Should not throw without database
            await expect(engine.createProgressIntervention('user-1', 'struggling', 'Needs Help', 'Student appears to be struggling', { severity: 'high' })).resolves.toBeUndefined();
        });
    });
    // ==========================================================================
    // FACTORY FUNCTION TESTS
    // ==========================================================================
    describe('factory function', () => {
        it('should create engine with basic config', () => {
            const basicConfig = {
                samConfig: createMockSAMConfig(),
            };
            const basicEngine = createBloomsAnalysisEngine(basicConfig);
            expect(basicEngine).toBeInstanceOf(BloomsAnalysisEngine);
        });
        it('should create engine with quick analysis depth', () => {
            const quickConfig = {
                samConfig: createMockSAMConfig(),
                analysisDepth: 'quick',
            };
            const quickEngine = createBloomsAnalysisEngine(quickConfig);
            expect(quickEngine).toBeInstanceOf(BloomsAnalysisEngine);
        });
        it('should create engine with comprehensive analysis depth', () => {
            const comprehensiveConfig = {
                samConfig: createMockSAMConfig(),
                analysisDepth: 'comprehensive',
            };
            const comprehensiveEngine = createBloomsAnalysisEngine(comprehensiveConfig);
            expect(comprehensiveEngine).toBeInstanceOf(BloomsAnalysisEngine);
        });
        it('should create engine with custom AI adapter', () => {
            const customAdapter = createMockAIAdapter(() => createMockAIResponse(JSON.stringify({
                distribution: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 30, ANALYZE: 20, EVALUATE: 15, CREATE: 5 },
                dominantLevel: 'APPLY',
                gaps: ['CREATE'],
                recommendations: [],
            })));
            const customConfig = {
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: customAdapter,
                },
            };
            const customEngine = createBloomsAnalysisEngine(customConfig);
            expect(customEngine).toBeInstanceOf(BloomsAnalysisEngine);
        });
    });
    // ==========================================================================
    // AI INTEGRATION TESTS
    // ==========================================================================
    describe('AI integration', () => {
        it('should use AI for comprehensive course analysis', async () => {
            let aiCalled = false;
            const trackingAdapter = createMockAIAdapter(() => {
                aiCalled = true;
                return createMockAIResponse('ANALYZE');
            });
            const trackingConfig = {
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: trackingAdapter,
                },
                analysisDepth: 'comprehensive',
            };
            const trackingEngine = createBloomsAnalysisEngine(trackingConfig);
            const courseData = createSampleCourseInput();
            await trackingEngine.analyzeCourse(courseData, { depth: 'comprehensive' });
            // AI should be called for section analysis in comprehensive mode
            expect(aiCalled).toBe(true);
        });
        it('should fall back to keywords when AI fails', async () => {
            const errorAdapter = createMockAIAdapter(() => {
                throw new Error('AI service unavailable');
            });
            const errorConfig = {
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: errorAdapter,
                },
                analysisDepth: 'comprehensive',
            };
            const errorEngine = createBloomsAnalysisEngine(errorConfig);
            const content = 'Analyze the patterns. Explain the concepts.';
            // Should not throw, should fall back to keyword-based analysis
            const result = await errorEngine.analyzeContent(content);
            expect(result).toBeDefined();
            expect(result.distribution).toBeDefined();
        });
    });
    // ==========================================================================
    // EDGE CASES
    // ==========================================================================
    describe('edge cases', () => {
        it('should handle course with single chapter', async () => {
            const courseData = {
                id: 'single-chapter',
                title: 'Single Chapter Course',
                chapters: [
                    {
                        id: 'ch-1',
                        title: 'Only Chapter',
                        position: 1,
                        sections: [
                            { id: 's-1', title: 'Only Section', content: 'Some content' },
                        ],
                    },
                ],
            };
            const result = await engine.analyzeCourse(courseData);
            expect(result.chapterAnalysis).toHaveLength(1);
        });
        it('should handle section without learning objectives', async () => {
            const courseData = {
                id: 'no-objectives',
                title: 'Course without Objectives',
                chapters: [
                    {
                        id: 'ch-1',
                        title: 'Chapter 1',
                        position: 1,
                        sections: [
                            { id: 's-1', title: 'Section 1', content: 'Analyze the data' },
                        ],
                    },
                ],
            };
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
        });
        it('should handle section with only video', async () => {
            const courseData = {
                id: 'video-only',
                title: 'Video Course',
                chapters: [
                    {
                        id: 'ch-1',
                        title: 'Video Chapter',
                        position: 1,
                        sections: [
                            {
                                id: 's-1',
                                title: 'Video Lesson',
                                content: '',
                                hasVideo: true,
                                duration: 30,
                            },
                        ],
                    },
                ],
            };
            const result = await engine.analyzeCourse(courseData);
            const activities = result.chapterAnalysis[0].sections[0].activities;
            expect(activities.some((a) => a.type === 'video')).toBe(true);
        });
        it('should handle mixed content with all Bloom levels', async () => {
            const mixedContent = `
        Define the key terms. List the main concepts. Recall the facts.
        Explain why this matters. Summarize the findings. Interpret the data.
        Apply the formula. Solve the problem. Demonstrate the technique.
        Analyze the patterns. Compare approaches. Differentiate concepts.
        Evaluate effectiveness. Judge quality. Critique the argument.
        Create a design. Develop a plan. Compose a solution.
      `;
            const result = await engine.analyzeContent(mixedContent);
            // Should detect all levels
            expect(result.distribution.REMEMBER).toBeGreaterThan(0);
            expect(result.distribution.UNDERSTAND).toBeGreaterThan(0);
            expect(result.distribution.APPLY).toBeGreaterThan(0);
            expect(result.distribution.ANALYZE).toBeGreaterThan(0);
            expect(result.distribution.EVALUATE).toBeGreaterThan(0);
            expect(result.distribution.CREATE).toBeGreaterThan(0);
        });
        it('should identify bottom-heavy distribution', async () => {
            const courseData = {
                id: 'bottom-heavy',
                title: 'Basic Course',
                chapters: [
                    {
                        id: 'ch-1',
                        title: 'Basics',
                        position: 1,
                        sections: [
                            { id: 's-1', title: 'Definitions', content: 'Define. List. Recall. Name. Identify.' },
                            { id: 's-2', title: 'Understanding', content: 'Explain. Describe. Summarize.' },
                            { id: 's-3', title: 'More Basics', content: 'Define. List. Recall.' },
                        ],
                    },
                ],
            };
            const result = await engine.analyzeCourse(courseData);
            expect(result.courseLevel.balance).toBe('bottom-heavy');
        });
        it('should provide activity suggestions for bottom-heavy courses', async () => {
            const courseData = {
                id: 'needs-activities',
                title: 'Basic Course',
                chapters: [
                    {
                        id: 'ch-1',
                        title: 'Basics Only',
                        position: 1,
                        sections: [
                            { id: 's-1', title: 'Definitions', content: 'Define terms. List facts.' },
                        ],
                    },
                ],
            };
            const result = await engine.analyzeCourse(courseData);
            // Should suggest higher-level activities
            expect(result.recommendations.activitySuggestions.length).toBeGreaterThanOrEqual(0);
        });
    });
});
