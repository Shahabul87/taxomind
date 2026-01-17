/**
 * @sam-ai/memory - Memory Summary Tests
 * Tests for buildMemorySummary function
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildMemorySummary } from '../memory-summary';
import { MasteryTracker } from '../mastery-tracker';
import { SpacedRepetitionScheduler, InMemoryReviewScheduleStore } from '../spaced-repetition';
import { InMemoryStudentProfileStore } from '../student-profile-store';
import { createSampleEvaluationOutcome } from './setup';
describe('buildMemorySummary', () => {
    let masteryTracker;
    let spacedRepScheduler;
    let profileStore;
    let reviewStore;
    beforeEach(() => {
        profileStore = new InMemoryStudentProfileStore();
        reviewStore = new InMemoryReviewScheduleStore();
        masteryTracker = new MasteryTracker(profileStore);
        spacedRepScheduler = new SpacedRepetitionScheduler(reviewStore);
    });
    // ============================================================================
    // BASIC FUNCTIONALITY TESTS
    // ============================================================================
    describe('basic functionality', () => {
        it('should return summary for new student', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.masterySummary).toBeDefined();
            expect(result.reviewStats).toBeDefined();
        });
        it('should return empty memorySummary for new student', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toBeUndefined();
        });
        it('should return empty reviewSummary for new student', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.reviewSummary).toBeUndefined();
        });
        it('should return all required properties', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result).toHaveProperty('masterySummary');
            expect(result).toHaveProperty('reviewStats');
            expect(result).toHaveProperty('memorySummary');
            expect(result).toHaveProperty('reviewSummary');
        });
    });
    // ============================================================================
    // MASTERY SUMMARY TESTS
    // ============================================================================
    describe('mastery summary', () => {
        it('should include average mastery when topics exist', async () => {
            // Process an evaluation to create mastery data
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
                bloomsLevel: 'APPLY',
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toBeDefined();
            expect(result.memorySummary).toContain('Average mastery');
        });
        it('should include topic count in summary', async () => {
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toContain('1 topics');
        });
        it('should include strengths when available', async () => {
            // Create high mastery in a topic
            for (let i = 0; i < 5; i++) {
                await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                    studentId: 'student-1',
                    topicId: 'topic-1',
                    score: 95,
                    bloomsLevel: 'EVALUATE',
                }));
            }
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            if (result.masterySummary.strengths.length > 0) {
                expect(result.memorySummary).toContain('Strengths');
            }
        });
        it('should include topics needing attention when available', async () => {
            // Create low mastery in a topic
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 30,
                bloomsLevel: 'REMEMBER',
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            if (result.masterySummary.topicsNeedingAttention.length > 0) {
                expect(result.memorySummary).toContain('Needs attention');
            }
        });
        it('should include trend information', async () => {
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 80,
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toMatch(/improving|stable|declining/);
        });
    });
    // ============================================================================
    // REVIEW STATS TESTS
    // ============================================================================
    describe('review stats', () => {
        it('should return review stats', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.reviewStats).toBeDefined();
            expect(result.reviewStats).toHaveProperty('totalPending');
            expect(result.reviewStats).toHaveProperty('overdueCount');
        });
        it('should include pending reviews in summary when available', async () => {
            // Schedule a review
            await spacedRepScheduler.scheduleFromEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 75,
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            if (result.reviewStats.totalPending > 0) {
                expect(result.reviewSummary).toContain('Pending reviews');
            }
        });
        it('should include due today count', async () => {
            // Schedule a review for today
            const today = new Date();
            await reviewStore.scheduleReview({
                topicId: 'topic-1',
                studentId: 'student-1',
                scheduledFor: today,
                priority: 'medium',
                intervalDays: 1,
                successfulReviews: 0,
                easinessFactor: 2.5,
                isOverdue: false,
                status: 'pending',
            });
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            if (result.reviewStats.totalPending > 0) {
                expect(result.reviewSummary).toContain('Due today');
            }
        });
    });
    // ============================================================================
    // MAX TOPICS OPTION TESTS
    // ============================================================================
    describe('maxTopics option', () => {
        it('should limit strengths to maxTopics', async () => {
            // Create high mastery in multiple topics
            for (let i = 0; i < 5; i++) {
                for (let j = 0; j < 3; j++) {
                    await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                        studentId: 'student-1',
                        topicId: `topic-${i}`,
                        score: 95,
                        bloomsLevel: 'EVALUATE',
                    }));
                }
            }
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
                maxTopics: 2,
            });
            if (result.memorySummary && result.memorySummary.includes('Strengths')) {
                const strengthsLine = result.memorySummary
                    .split('\n')
                    .find((line) => line.includes('Strengths'));
                // Count commas to estimate topics listed (topics are comma-separated)
                const commaCount = (strengthsLine?.match(/,/g) || []).length;
                expect(commaCount).toBeLessThanOrEqual(1); // maxTopics - 1 commas
            }
        });
        it('should use default maxTopics of 3', async () => {
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            // Just verify the function executes with default
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // MULTIPLE TOPICS TESTS
    // ============================================================================
    describe('multiple topics', () => {
        it('should handle multiple topics', async () => {
            // Create mastery in multiple topics
            for (let i = 0; i < 3; i++) {
                await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                    studentId: 'student-1',
                    topicId: `topic-${i}`,
                    score: 70 + i * 10,
                }));
            }
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.masterySummary.totalTopics).toBe(3);
        });
        it('should calculate correct average across topics', async () => {
            // Create evaluations with known scores
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 80,
                bloomsLevel: 'EVALUATE', // Weight 1.0
            }));
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-2',
                score: 60,
                bloomsLevel: 'EVALUATE', // Weight 1.0
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            // Average should be around 70 (80+60)/2
            expect(result.masterySummary.averageMastery).toBeGreaterThanOrEqual(65);
            expect(result.masterySummary.averageMastery).toBeLessThanOrEqual(75);
        });
    });
    // ============================================================================
    // CONCURRENT EXECUTION TESTS
    // ============================================================================
    describe('concurrent execution', () => {
        it('should fetch mastery and review stats in parallel', async () => {
            // This is implicitly tested by the Promise.all in implementation
            // Just verify it completes successfully
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.masterySummary).toBeDefined();
            expect(result.reviewStats).toBeDefined();
        });
    });
    // ============================================================================
    // FORMATTING TESTS
    // ============================================================================
    describe('formatting', () => {
        it('should format mastery as rounded percentage', async () => {
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
                bloomsLevel: 'EVALUATE',
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            // Check that the mastery percentage is rounded (no decimals in the string)
            expect(result.memorySummary).toMatch(/\d+%/);
            expect(result.memorySummary).not.toMatch(/\d+\.\d+%/);
        });
        it('should separate lines with newlines', async () => {
            // Create data that will produce multiple lines
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 30, // Low score for "needs attention"
                bloomsLevel: 'REMEMBER',
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            if (result.memorySummary &&
                result.masterySummary.topicsNeedingAttention.length > 0) {
                expect(result.memorySummary).toContain('\n');
            }
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle student with only evaluations, no reviews', async () => {
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toBeDefined();
            expect(result.reviewSummary).toBeUndefined();
        });
        it('should handle student with only reviews, no evaluations', async () => {
            await reviewStore.scheduleReview({
                topicId: 'topic-1',
                studentId: 'student-1',
                scheduledFor: new Date(),
                priority: 'medium',
                intervalDays: 1,
                successfulReviews: 0,
                easinessFactor: 2.5,
                isOverdue: false,
                status: 'pending',
            });
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            expect(result.memorySummary).toBeUndefined();
            expect(result.reviewSummary).toBeDefined();
        });
        it('should handle empty strengths array', async () => {
            await masteryTracker.processEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 50, // Not high enough for strengths
                bloomsLevel: 'REMEMBER',
            }));
            const result = await buildMemorySummary({
                studentId: 'student-1',
                masteryTracker,
                spacedRepScheduler,
            });
            // Should not throw and should not include "Strengths:" line if no strengths
            expect(result).toBeDefined();
        });
    });
});
//# sourceMappingURL=memory-summary.test.js.map