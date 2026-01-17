/**
 * @sam-ai/educational - Enhanced Depth Analysis Engine Tests
 * Tests for comprehensive course depth analysis with Webb's DOK integration
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedDepthAnalysisEngine, } from '../engines/enhanced-depth-engine';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createSampleSection(overrides = {}) {
    return {
        id: 'section-1',
        title: 'Introduction',
        description: 'Learn the fundamentals',
        position: 1,
        videoUrl: 'https://example.com/video.mp4',
        duration: 15,
        ...overrides,
    };
}
function createSampleChapter(overrides = {}) {
    return {
        id: 'chapter-1',
        title: 'Getting Started',
        description: 'Introduction to the course',
        learningOutcomes: 'Understand basic concepts',
        position: 1,
        sections: [
            createSampleSection({ id: 's-1', title: 'What is Programming?', description: 'Define and explain programming' }),
            createSampleSection({ id: 's-2', title: 'Your First Program', description: 'Apply programming basics', videoUrl: 'https://example.com/video2.mp4' }),
        ],
        ...overrides,
    };
}
function createSampleCourseData(overrides = {}) {
    return {
        id: 'course-1',
        title: 'Introduction to Programming',
        description: 'Learn the fundamentals of programming',
        whatYouWillLearn: [
            'Define programming concepts',
            'Apply coding techniques',
            'Analyze code patterns',
            'Create working applications',
        ],
        categoryId: 'programming',
        price: 99,
        category: { name: 'Programming' },
        chapters: [
            createSampleChapter({ id: 'ch-1', position: 1 }),
            createSampleChapter({
                id: 'ch-2',
                title: 'Variables and Data Types',
                description: 'Analyze and understand data types',
                position: 2,
                sections: [
                    createSampleSection({
                        id: 's-3',
                        title: 'Understanding Variables',
                        description: 'Analyze how variables work',
                    }),
                    createSampleSection({
                        id: 's-4',
                        title: 'Data Types Deep Dive',
                        description: 'Evaluate different data type systems',
                        exams: [
                            {
                                id: 'exam-1',
                                title: 'Data Types Quiz',
                                ExamQuestion: [
                                    {
                                        id: 'q-1',
                                        text: 'Define what a variable is',
                                        type: 'multiple_choice',
                                        bloomsLevel: 'REMEMBER',
                                        options: [
                                            { id: 'o-1', text: 'A storage location', isCorrect: true },
                                            { id: 'o-2', text: 'A function', isCorrect: false },
                                        ],
                                    },
                                    {
                                        id: 'q-2',
                                        text: 'Analyze this code pattern',
                                        type: 'multiple_choice',
                                        bloomsLevel: 'ANALYZE',
                                        options: [
                                            { id: 'o-3', text: 'Option A', isCorrect: true },
                                            { id: 'o-4', text: 'Option B', isCorrect: false },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }),
                ],
            }),
        ],
        attachments: [{ id: 'att-1', name: 'Resource.pdf' }],
        ...overrides,
    };
}
function createMockStorage() {
    return {
        getCachedAnalysis: vi.fn().mockResolvedValue(null),
        saveAnalysis: vi.fn().mockResolvedValue(undefined),
        listHistoricalSnapshots: vi.fn().mockResolvedValue([]),
        hasRecentSnapshot: vi.fn().mockResolvedValue(false),
        createHistoricalSnapshot: vi.fn().mockResolvedValue(undefined),
    };
}
function createMockLogger() {
    return {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('EnhancedDepthAnalysisEngine', () => {
    let engine;
    let mockStorage;
    let mockLogger;
    beforeEach(() => {
        mockStorage = createMockStorage();
        mockLogger = createMockLogger();
        engine = new EnhancedDepthAnalysisEngine({
            storage: mockStorage,
            logger: mockLogger,
        });
    });
    // ==========================================================================
    // ANALYZE TESTS
    // ==========================================================================
    describe('analyze', () => {
        it('should return a valid analysis result', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
            expect(result.courseLevel).toBeDefined();
            expect(result.chapterAnalysis).toBeDefined();
            expect(result.objectivesAnalysis).toBeDefined();
            expect(result.assessmentQuality).toBeDefined();
            expect(result.learningPathway).toBeDefined();
            expect(result.recommendations).toBeDefined();
            expect(result.studentImpact).toBeDefined();
            expect(result.metadata).toBeDefined();
        });
        it('should include course-level Bloom distribution', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.courseLevel.bloomsDistribution).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.REMEMBER).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.UNDERSTAND).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.APPLY).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.ANALYZE).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.EVALUATE).toBeDefined();
            expect(result.courseLevel.bloomsDistribution.CREATE).toBeDefined();
        });
        it('should include Webb DOK distribution', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.courseLevel.dokDistribution).toBeDefined();
            expect(result.courseLevel.dokDistribution.level1).toBeDefined(); // Recall
            expect(result.courseLevel.dokDistribution.level2).toBeDefined(); // Skill/Concept
            expect(result.courseLevel.dokDistribution.level3).toBeDefined(); // Strategic Thinking
            expect(result.courseLevel.dokDistribution.level4).toBeDefined(); // Extended Thinking
        });
        it('should calculate cognitive depth', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.courseLevel.cognitiveDepth).toBeGreaterThanOrEqual(0);
            expect(result.courseLevel.cognitiveDepth).toBeLessThanOrEqual(100);
        });
        it('should determine balance', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(['well-balanced', 'bottom-heavy', 'top-heavy']).toContain(result.courseLevel.balance);
        });
        it('should detect course type', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.courseLevel.courseType).toBeDefined();
        });
        it('should analyze all chapters', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.chapterAnalysis).toHaveLength(2);
        });
        it('should include chapter-level analysis', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.chapterId).toBeDefined();
                expect(chapter.chapterTitle).toBeDefined();
                expect(chapter.bloomsDistribution).toBeDefined();
                expect(chapter.dokDistribution).toBeDefined();
                expect(chapter.primaryBloomsLevel).toBeDefined();
                expect(chapter.cognitiveDepth).toBeGreaterThanOrEqual(0);
                expect(chapter.sections).toBeDefined();
            });
        });
        it('should analyze objectives', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.objectivesAnalysis.length).toBe(courseData.whatYouWillLearn.length);
        });
        it('should analyze assessment quality', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.assessmentQuality).toBeDefined();
            expect(result.assessmentQuality.overallScore).toBeGreaterThanOrEqual(0);
            expect(result.assessmentQuality.overallScore).toBeLessThanOrEqual(100);
        });
        it('should generate learning pathway', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.current).toBeDefined();
            expect(result.learningPathway.recommended).toBeDefined();
            expect(result.learningPathway.gaps).toBeDefined();
        });
        it('should generate recommendations', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.recommendations.immediate).toBeDefined();
            expect(result.recommendations.shortTerm).toBeDefined();
            expect(result.recommendations.longTerm).toBeDefined();
        });
        it('should analyze student impact', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.studentImpact.skillsDeveloped).toBeDefined();
            expect(result.studentImpact.cognitiveGrowth).toBeDefined();
            expect(result.studentImpact.careerAlignment).toBeDefined();
        });
        it('should include metadata', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.metadata.courseId).toBe(courseData.id);
            expect(result.metadata.totalChapters).toBe(courseData.chapters.length);
            expect(result.metadata.totalObjectives).toBe(courseData.whatYouWillLearn.length);
            expect(result.metadata.engineVersion).toBeDefined();
            expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
        it('should save analysis to storage', async () => {
            const courseData = createSampleCourseData();
            await engine.analyze(courseData);
            expect(mockStorage.saveAnalysis).toHaveBeenCalled();
        });
        it('should log analysis progress', async () => {
            const courseData = createSampleCourseData();
            await engine.analyze(courseData);
            expect(mockLogger.info).toHaveBeenCalled();
        });
        it('should use cached analysis when available', async () => {
            const cachedResult = {
                courseId: 'course-1',
                contentHash: 'abc123',
                analyzedAt: new Date(),
                bloomsDistribution: { REMEMBER: 20, UNDERSTAND: 20, APPLY: 20, ANALYZE: 20, EVALUATE: 10, CREATE: 10 },
                cognitiveDepth: 50,
                learningPathway: { current: { stages: [], currentStage: 0, completionPercentage: 0 }, recommended: { stages: [], currentStage: 0, completionPercentage: 0 }, gaps: [] },
                skillsMatrix: [],
                gapAnalysis: [],
                recommendations: { immediate: [], shortTerm: [], longTerm: [], priorityMatrix: {} },
            };
            mockStorage.getCachedAnalysis.mockResolvedValue(cachedResult);
            const courseData = createSampleCourseData();
            await engine.analyze(courseData);
            // Should attempt to get cached analysis first
            expect(mockStorage.getCachedAnalysis).toHaveBeenCalled();
        });
        it('should force reanalyze when option is set', async () => {
            const courseData = createSampleCourseData();
            await engine.analyze(courseData, { forceReanalyze: true });
            // Should not check cache when forceReanalyze is true
            // Storage will still be called for saving
            expect(mockStorage.saveAnalysis).toHaveBeenCalled();
        });
        it('should include historical snapshot when enabled', async () => {
            const courseData = createSampleCourseData();
            await engine.analyze(courseData, { includeHistoricalSnapshot: true });
            expect(mockStorage.createHistoricalSnapshot).toHaveBeenCalled();
        });
        it('should skip historical snapshot when disabled', async () => {
            const courseData = createSampleCourseData();
            await engine.analyze(courseData, { includeHistoricalSnapshot: false });
            expect(mockStorage.createHistoricalSnapshot).not.toHaveBeenCalled();
        });
        it('should handle different analysis depths', async () => {
            const courseData = createSampleCourseData();
            const basicResult = await engine.analyze(courseData, { analysisDepth: 'basic' });
            expect(basicResult.metadata.analysisDepth).toBe('basic');
            const detailedResult = await engine.analyze(courseData, { analysisDepth: 'detailed', forceReanalyze: true });
            expect(detailedResult.metadata.analysisDepth).toBe('detailed');
            const comprehensiveResult = await engine.analyze(courseData, { analysisDepth: 'comprehensive', forceReanalyze: true });
            expect(comprehensiveResult.metadata.analysisDepth).toBe('comprehensive');
        });
    });
    // ==========================================================================
    // HISTORICAL TRENDS TESTS
    // ==========================================================================
    describe('getHistoricalTrends', () => {
        it('should return empty arrays when no storage', async () => {
            const engineNoStorage = new EnhancedDepthAnalysisEngine({});
            const result = await engineNoStorage.getHistoricalTrends('course-1');
            expect(result.snapshots).toHaveLength(0);
            expect(result.trends).toHaveLength(0);
        });
        it('should return snapshots from storage', async () => {
            const mockSnapshots = [
                {
                    id: 'snap-1',
                    snapshotAt: new Date(),
                    cognitiveDepth: 55,
                    balanceScore: 70,
                    completenessScore: 80,
                    totalChapters: 5,
                    totalObjectives: 10,
                },
                {
                    id: 'snap-2',
                    snapshotAt: new Date(Date.now() - 86400000),
                    cognitiveDepth: 50,
                    balanceScore: 65,
                    completenessScore: 75,
                    totalChapters: 4,
                    totalObjectives: 8,
                },
            ];
            mockStorage.listHistoricalSnapshots.mockResolvedValue(mockSnapshots);
            const result = await engine.getHistoricalTrends('course-1');
            expect(result.snapshots).toHaveLength(2);
        });
        it('should calculate trends when multiple snapshots exist', async () => {
            const mockSnapshots = [
                {
                    id: 'snap-1',
                    snapshotAt: new Date(),
                    cognitiveDepth: 55,
                    balanceScore: 70,
                    completenessScore: 80,
                    totalChapters: 5,
                    totalObjectives: 10,
                },
                {
                    id: 'snap-2',
                    snapshotAt: new Date(Date.now() - 86400000),
                    cognitiveDepth: 50,
                    balanceScore: 65,
                    completenessScore: 75,
                    totalChapters: 4,
                    totalObjectives: 8,
                },
            ];
            mockStorage.listHistoricalSnapshots.mockResolvedValue(mockSnapshots);
            const result = await engine.getHistoricalTrends('course-1');
            expect(result.trends.length).toBeGreaterThan(0);
            result.trends.forEach((trend) => {
                expect(['cognitiveDepth', 'balanceScore', 'completenessScore']).toContain(trend.metric);
                expect(['improving', 'declining', 'stable']).toContain(trend.direction);
            });
        });
        it('should identify improving trends', async () => {
            const mockSnapshots = [
                {
                    id: 'snap-1',
                    snapshotAt: new Date(),
                    cognitiveDepth: 60,
                    balanceScore: 75,
                    completenessScore: 85,
                    totalChapters: 5,
                    totalObjectives: 10,
                },
                {
                    id: 'snap-2',
                    snapshotAt: new Date(Date.now() - 86400000),
                    cognitiveDepth: 50,
                    balanceScore: 65,
                    completenessScore: 75,
                    totalChapters: 4,
                    totalObjectives: 8,
                },
            ];
            mockStorage.listHistoricalSnapshots.mockResolvedValue(mockSnapshots);
            const result = await engine.getHistoricalTrends('course-1');
            const improvingTrends = result.trends.filter((t) => t.direction === 'improving');
            expect(improvingTrends.length).toBeGreaterThan(0);
        });
        it('should identify declining trends', async () => {
            const mockSnapshots = [
                {
                    id: 'snap-1',
                    snapshotAt: new Date(),
                    cognitiveDepth: 45,
                    balanceScore: 55,
                    completenessScore: 65,
                    totalChapters: 3,
                    totalObjectives: 6,
                },
                {
                    id: 'snap-2',
                    snapshotAt: new Date(Date.now() - 86400000),
                    cognitiveDepth: 55,
                    balanceScore: 70,
                    completenessScore: 80,
                    totalChapters: 5,
                    totalObjectives: 10,
                },
            ];
            mockStorage.listHistoricalSnapshots.mockResolvedValue(mockSnapshots);
            const result = await engine.getHistoricalTrends('course-1');
            const decliningTrends = result.trends.filter((t) => t.direction === 'declining');
            expect(decliningTrends.length).toBeGreaterThan(0);
        });
        it('should respect limit parameter', async () => {
            const result = await engine.getHistoricalTrends('course-1', 5);
            expect(mockStorage.listHistoricalSnapshots).toHaveBeenCalledWith('course-1', 5);
        });
    });
    // ==========================================================================
    // EMPTY COURSE TESTS
    // ==========================================================================
    describe('empty course handling', () => {
        it('should handle course with no chapters', async () => {
            const courseData = createSampleCourseData({
                chapters: [],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
            expect(result.chapterAnalysis).toHaveLength(0);
        });
        it('should handle course with no objectives', async () => {
            const courseData = createSampleCourseData({
                whatYouWillLearn: [],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
            expect(result.objectivesAnalysis).toHaveLength(0);
        });
        it('should handle course with no attachments', async () => {
            const courseData = createSampleCourseData({
                attachments: [],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
        });
    });
    // ==========================================================================
    // SECTION ANALYSIS TESTS
    // ==========================================================================
    describe('section analysis', () => {
        it('should detect video activities', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            const sectionsWithVideo = result.chapterAnalysis.flatMap((ch) => ch.sections.filter((s) => s.activities.some((a) => a.type === 'Video Lesson')));
            expect(sectionsWithVideo.length).toBeGreaterThan(0);
        });
        it('should detect assessment activities', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            const sectionsWithExams = result.chapterAnalysis.flatMap((ch) => ch.sections.filter((s) => s.activities.some((a) => a.type === 'Assessment')));
            expect(sectionsWithExams.length).toBeGreaterThan(0);
        });
        it('should calculate engagement scores', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                chapter.sections.forEach((section) => {
                    expect(section.engagementScore).toBeGreaterThanOrEqual(0);
                    expect(section.engagementScore).toBeLessThanOrEqual(100);
                });
            });
        });
    });
    // ==========================================================================
    // CHAPTER ANALYSIS TESTS
    // ==========================================================================
    describe('chapter analysis', () => {
        it('should identify chapter strengths', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.strengths).toBeDefined();
                expect(Array.isArray(chapter.strengths)).toBe(true);
            });
        });
        it('should identify chapter weaknesses', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.weaknesses).toBeDefined();
                expect(Array.isArray(chapter.weaknesses)).toBe(true);
            });
        });
        it('should generate chapter recommendations', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.recommendations).toBeDefined();
                expect(Array.isArray(chapter.recommendations)).toBe(true);
            });
        });
        it('should calculate chapter complexity', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            result.chapterAnalysis.forEach((chapter) => {
                expect(chapter.complexity).toBeDefined();
                expect(['basic', 'intermediate', 'advanced']).toContain(chapter.complexity.vocabularyLevel);
            });
        });
    });
    // ==========================================================================
    // LEARNING PATHWAY TESTS
    // ==========================================================================
    describe('learning pathway', () => {
        it('should include current stages', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.current.stages).toBeDefined();
            expect(result.learningPathway.current.stages.length).toBe(6); // 6 Bloom's levels
        });
        it('should include recommended stages', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.recommended.stages).toBeDefined();
            expect(result.learningPathway.recommended.stages.length).toBe(6);
        });
        it('should identify learning gaps', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.gaps).toBeDefined();
            expect(Array.isArray(result.learningPathway.gaps)).toBe(true);
        });
        it('should include milestones', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.milestones).toBeDefined();
            expect(result.learningPathway.milestones.length).toBe(6);
        });
        it('should calculate completion percentage', async () => {
            const courseData = createSampleCourseData();
            const result = await engine.analyze(courseData);
            expect(result.learningPathway.current.completionPercentage).toBeGreaterThanOrEqual(0);
            expect(result.learningPathway.current.completionPercentage).toBeLessThanOrEqual(100);
        });
    });
    // ==========================================================================
    // FACTORY FUNCTION TESTS
    // ==========================================================================
    describe('factory', () => {
        it('should create engine without options', () => {
            const basicEngine = new EnhancedDepthAnalysisEngine();
            expect(basicEngine).toBeInstanceOf(EnhancedDepthAnalysisEngine);
        });
        it('should create engine with custom storage', () => {
            const customStorage = createMockStorage();
            const customEngine = new EnhancedDepthAnalysisEngine({
                storage: customStorage,
            });
            expect(customEngine).toBeInstanceOf(EnhancedDepthAnalysisEngine);
        });
        it('should create engine with custom logger', () => {
            const customLogger = createMockLogger();
            const customEngine = new EnhancedDepthAnalysisEngine({
                logger: customLogger,
            });
            expect(customEngine).toBeInstanceOf(EnhancedDepthAnalysisEngine);
        });
        it('should create engine with custom content hasher', () => {
            const customHasher = vi.fn().mockReturnValue('custom-hash');
            const customEngine = new EnhancedDepthAnalysisEngine({
                contentHasher: customHasher,
            });
            expect(customEngine).toBeInstanceOf(EnhancedDepthAnalysisEngine);
        });
    });
    // ==========================================================================
    // EDGE CASES
    // ==========================================================================
    describe('edge cases', () => {
        it('should handle null descriptions', async () => {
            const courseData = createSampleCourseData({
                description: null,
                chapters: [
                    createSampleChapter({
                        description: null,
                        sections: [createSampleSection({ description: null })],
                    }),
                ],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
        });
        it('should handle missing category', async () => {
            const courseData = createSampleCourseData({
                category: null,
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
        });
        it('should handle sections without videos', async () => {
            const courseData = createSampleCourseData({
                chapters: [
                    createSampleChapter({
                        sections: [createSampleSection({ videoUrl: null })],
                    }),
                ],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
        });
        it('should handle sections without assessments', async () => {
            const courseData = createSampleCourseData({
                chapters: [
                    createSampleChapter({
                        sections: [
                            createSampleSection({
                                exams: undefined,
                                Question: undefined,
                            }),
                        ],
                    }),
                ],
            });
            const result = await engine.analyze(courseData);
            expect(result).toBeDefined();
        });
        it('should handle very long objectives', async () => {
            const longObjective = 'Learn to '.repeat(100);
            const courseData = createSampleCourseData({
                whatYouWillLearn: [longObjective],
            });
            const result = await engine.analyze(courseData);
            expect(result.objectivesAnalysis).toHaveLength(1);
        });
    });
});
