/**
 * @sam-ai/memory - Spaced Repetition Tests
 * Tests for InMemoryReviewScheduleStore and SpacedRepetitionScheduler
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReviewScheduleStore, SpacedRepetitionScheduler, createInMemoryReviewScheduleStore, createSpacedRepetitionScheduler, getDefaultReviewScheduleStore, resetDefaultReviewScheduleStore, } from '../spaced-repetition';
import { createSampleReviewScheduleEntry, createSampleEvaluationOutcome, createDateOffset, } from './setup';
// ============================================================================
// IN-MEMORY REVIEW SCHEDULE STORE TESTS
// ============================================================================
describe('InMemoryReviewScheduleStore', () => {
    let store;
    beforeEach(() => {
        store = new InMemoryReviewScheduleStore();
    });
    // ============================================================================
    // SCHEDULE REVIEW TESTS
    // ============================================================================
    describe('scheduleReview', () => {
        it('should create a new review entry with generated id', async () => {
            const entry = createSampleReviewScheduleEntry();
            const { id: _id, ...entryWithoutId } = entry;
            const result = await store.scheduleReview(entryWithoutId);
            expect(result.id).toBeDefined();
            expect(result.topicId).toBe(entry.topicId);
            expect(result.studentId).toBe(entry.studentId);
        });
        it('should store multiple entries', async () => {
            const entry1 = createSampleReviewScheduleEntry({ topicId: 'topic-1' });
            const entry2 = createSampleReviewScheduleEntry({ topicId: 'topic-2' });
            await store.scheduleReview(entry1);
            await store.scheduleReview(entry2);
            const all = store.getAll();
            expect(all).toHaveLength(2);
        });
    });
    // ============================================================================
    // GET PENDING REVIEWS TESTS
    // ============================================================================
    describe('getPendingReviews', () => {
        it('should return empty array when no entries', async () => {
            const result = await store.getPendingReviews('student-1');
            expect(result).toEqual([]);
        });
        it('should return only pending entries for student', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                status: 'pending',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                status: 'completed',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-2',
                status: 'pending',
            }));
            const result = await store.getPendingReviews('student-1');
            expect(result).toHaveLength(1);
            expect(result[0].status).toBe('pending');
        });
        it('should sort by scheduled date ascending', async () => {
            const later = createDateOffset(5);
            const earlier = createDateOffset(2);
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-later',
                scheduledFor: later,
                status: 'pending',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-earlier',
                scheduledFor: earlier,
                status: 'pending',
            }));
            const result = await store.getPendingReviews('student-1');
            expect(result[0].topicId).toBe('topic-earlier');
            expect(result[1].topicId).toBe('topic-later');
        });
        it('should respect limit parameter', async () => {
            for (let i = 0; i < 10; i++) {
                await store.scheduleReview(createSampleReviewScheduleEntry({
                    studentId: 'student-1',
                    topicId: `topic-${i}`,
                    status: 'pending',
                }));
            }
            const result = await store.getPendingReviews('student-1', 5);
            expect(result).toHaveLength(5);
        });
    });
    // ============================================================================
    // GET OVERDUE REVIEWS TESTS
    // ============================================================================
    describe('getOverdueReviews', () => {
        it('should return only overdue pending entries', async () => {
            const past = createDateOffset(-5);
            const future = createDateOffset(5);
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-overdue',
                scheduledFor: past,
                status: 'pending',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-future',
                scheduledFor: future,
                status: 'pending',
            }));
            const result = await store.getOverdueReviews('student-1');
            expect(result).toHaveLength(1);
            expect(result[0].topicId).toBe('topic-overdue');
        });
        it('should not include completed entries', async () => {
            const past = createDateOffset(-5);
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                scheduledFor: past,
                status: 'completed',
            }));
            const result = await store.getOverdueReviews('student-1');
            expect(result).toHaveLength(0);
        });
    });
    // ============================================================================
    // UPDATE REVIEW TESTS
    // ============================================================================
    describe('updateReview', () => {
        it('should update entry properties', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                priority: 'low',
            }));
            const result = await store.updateReview(entry.id, { priority: 'urgent' });
            expect(result.priority).toBe('urgent');
        });
        it('should throw error for non-existent entry', async () => {
            await expect(store.updateReview('non-existent', { priority: 'high' })).rejects.toThrow('Review entry not found');
        });
    });
    // ============================================================================
    // COMPLETE REVIEW TESTS
    // ============================================================================
    describe('completeReview', () => {
        it('should mark entry as completed with score', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                status: 'pending',
            }));
            const result = await store.completeReview(entry.id, 85);
            expect(result.status).toBe('completed');
            expect(result.lastReviewScore).toBe(85);
            expect(result.lastReviewedAt).toBeDefined();
        });
        it('should use provided timestamp', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry());
            const customDate = new Date('2024-01-15');
            const result = await store.completeReview(entry.id, 75, customDate);
            expect(result.lastReviewedAt).toEqual(customDate);
        });
        it('should throw error for non-existent entry', async () => {
            await expect(store.completeReview('non-existent', 80)).rejects.toThrow('Review entry not found');
        });
    });
    // ============================================================================
    // GET REVIEW HISTORY TESTS
    // ============================================================================
    describe('getReviewHistory', () => {
        it('should return entries for student and topic', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-1',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-2',
            }));
            const result = await store.getReviewHistory('student-1', 'topic-1');
            expect(result).toHaveLength(1);
            expect(result[0].topicId).toBe('topic-1');
        });
        it('should sort by last reviewed date descending', async () => {
            const entry1 = await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-1',
            }));
            await store.completeReview(entry1.id, 80, new Date('2024-01-10'));
            const entry2 = await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-1',
            }));
            await store.completeReview(entry2.id, 90, new Date('2024-01-20'));
            const result = await store.getReviewHistory('student-1', 'topic-1');
            expect(result[0].lastReviewScore).toBe(90); // More recent first
        });
    });
    // ============================================================================
    // PRUNE COMPLETED TESTS
    // ============================================================================
    describe('pruneCompleted', () => {
        it('should delete old completed entries', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100);
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                status: 'pending',
            }));
            await store.completeReview(entry.id, 80, oldDate);
            const result = await store.pruneCompleted(30);
            expect(result).toBe(1);
            expect(store.getAll()).toHaveLength(0);
        });
        it('should not delete pending entries', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                status: 'pending',
            }));
            const result = await store.pruneCompleted(30);
            expect(result).toBe(0);
            expect(store.getAll()).toHaveLength(1);
        });
        it('should not delete recent completed entries', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                status: 'pending',
            }));
            await store.completeReview(entry.id, 80, new Date());
            const result = await store.pruneCompleted(30);
            expect(result).toBe(0);
        });
    });
    // ============================================================================
    // UTILITY METHODS TESTS
    // ============================================================================
    describe('utility methods', () => {
        it('should clear all entries', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry());
            await store.scheduleReview(createSampleReviewScheduleEntry());
            store.clear();
            expect(store.getAll()).toHaveLength(0);
        });
        it('should return all entries', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry());
            await store.scheduleReview(createSampleReviewScheduleEntry());
            expect(store.getAll()).toHaveLength(2);
        });
    });
});
// ============================================================================
// SPACED REPETITION SCHEDULER TESTS
// ============================================================================
describe('SpacedRepetitionScheduler', () => {
    let store;
    let scheduler;
    beforeEach(() => {
        store = new InMemoryReviewScheduleStore();
        scheduler = new SpacedRepetitionScheduler(store);
    });
    // ============================================================================
    // SCHEDULE FROM EVALUATION TESTS
    // ============================================================================
    describe('scheduleFromEvaluation', () => {
        it('should create new schedule for first evaluation', async () => {
            const outcome = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.isNew).toBe(true);
            expect(result.entry.studentId).toBe('student-1');
            expect(result.entry.topicId).toBe('topic-1');
            expect(result.quality).toBeGreaterThanOrEqual(3);
        });
        it('should update existing schedule', async () => {
            const outcome1 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 70,
            });
            await scheduler.scheduleFromEvaluation(outcome1);
            const outcome2 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 90,
            });
            const result = await scheduler.scheduleFromEvaluation(outcome2);
            expect(result.isNew).toBe(false);
        });
        it('should calculate quality 5 for excellent score', async () => {
            const outcome = createSampleEvaluationOutcome({ score: 95 });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.quality).toBe(5);
        });
        it('should calculate quality 4 for good score', async () => {
            const outcome = createSampleEvaluationOutcome({ score: 80 });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.quality).toBe(4);
        });
        it('should calculate quality 0 for very low score', async () => {
            const outcome = createSampleEvaluationOutcome({ score: 10 });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.quality).toBe(0);
        });
        it('should set urgent priority for low scores', async () => {
            const outcome = createSampleEvaluationOutcome({ score: 40 });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.entry.priority).toBe('urgent');
        });
        it('should provide explanation for scheduling', async () => {
            const outcome = createSampleEvaluationOutcome({ score: 85 });
            const result = await scheduler.scheduleFromEvaluation(outcome);
            expect(result.explanation).toBeDefined();
            expect(result.explanation.length).toBeGreaterThan(0);
        });
        it('should increment successful reviews on good score', async () => {
            const outcome1 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            });
            const result1 = await scheduler.scheduleFromEvaluation(outcome1);
            expect(result1.entry.successfulReviews).toBe(1);
            const outcome2 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            });
            const result2 = await scheduler.scheduleFromEvaluation(outcome2);
            expect(result2.entry.successfulReviews).toBe(2);
        });
        it('should not increment successful reviews on poor score', async () => {
            const outcome1 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 85,
            });
            await scheduler.scheduleFromEvaluation(outcome1);
            const outcome2 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 40,
            });
            const result2 = await scheduler.scheduleFromEvaluation(outcome2);
            expect(result2.entry.successfulReviews).toBe(1);
        });
    });
    // ============================================================================
    // GET PENDING REVIEWS TESTS
    // ============================================================================
    describe('getPendingReviews', () => {
        it('should return pending reviews', async () => {
            await scheduler.scheduleFromEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
            }));
            await scheduler.scheduleFromEvaluation(createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-2',
            }));
            const result = await scheduler.getPendingReviews('student-1');
            expect(result).toHaveLength(2);
        });
        it('should mark overdue reviews', async () => {
            // Create entry with past date
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                scheduledFor: createDateOffset(-5),
                status: 'pending',
            }));
            const result = await scheduler.getPendingReviews('student-1');
            expect(result[0].isOverdue).toBe(true);
        });
        it('should respect limit parameter', async () => {
            for (let i = 0; i < 10; i++) {
                await scheduler.scheduleFromEvaluation(createSampleEvaluationOutcome({
                    studentId: 'student-1',
                    topicId: `topic-${i}`,
                }));
            }
            const result = await scheduler.getPendingReviews('student-1', 5);
            expect(result).toHaveLength(5);
        });
    });
    // ============================================================================
    // GET OVERDUE REVIEWS TESTS
    // ============================================================================
    describe('getOverdueReviews', () => {
        it('should return overdue reviews', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                scheduledFor: createDateOffset(-5),
                status: 'pending',
            }));
            const result = await scheduler.getOverdueReviews('student-1');
            expect(result).toHaveLength(1);
        });
    });
    // ============================================================================
    // COMPLETE REVIEW TESTS
    // ============================================================================
    describe('completeReview', () => {
        it('should complete review and schedule next', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                topicId: 'topic-1',
                status: 'pending',
                successfulReviews: 1,
            }));
            const result = await scheduler.completeReview(entry.id, 85);
            expect(result.entry.status).toBe('pending'); // New entry is pending
            expect(result.daysUntilReview).toBeGreaterThan(0);
        });
        it('should reset interval on poor performance', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                intervalDays: 30,
                successfulReviews: 5,
                status: 'pending',
            }));
            const result = await scheduler.completeReview(entry.id, 30);
            expect(result.daysUntilReview).toBe(1); // Reset to initial interval
        });
        it('should increase interval on good performance', async () => {
            const entry = await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                intervalDays: 1,
                successfulReviews: 2,
                easinessFactor: 2.5,
                status: 'pending',
            }));
            const result = await scheduler.completeReview(entry.id, 95);
            expect(result.daysUntilReview).toBeGreaterThan(1);
        });
    });
    // ============================================================================
    // GET REVIEW STATS TESTS
    // ============================================================================
    describe('getReviewStats', () => {
        it('should return statistics for student', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                scheduledFor: createDateOffset(-1), // Overdue
                status: 'pending',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                scheduledFor: createDateOffset(1), // Due tomorrow
                status: 'pending',
            }));
            const result = await scheduler.getReviewStats('student-1');
            expect(result.totalPending).toBe(2);
            expect(result.overdueCount).toBe(1);
            expect(result.topicsByPriority).toBeDefined();
        });
        it('should calculate average easiness factor', async () => {
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                easinessFactor: 2.0,
                status: 'pending',
            }));
            await store.scheduleReview(createSampleReviewScheduleEntry({
                studentId: 'student-1',
                easinessFactor: 3.0,
                status: 'pending',
            }));
            const result = await scheduler.getReviewStats('student-1');
            expect(result.averageEasinessFactor).toBe(2.5);
        });
        it('should return default easiness for empty reviews', async () => {
            const result = await scheduler.getReviewStats('student-1');
            expect(result.averageEasinessFactor).toBe(2.5);
            expect(result.totalPending).toBe(0);
        });
    });
    // ============================================================================
    // SM-2 ALGORITHM TESTS
    // ============================================================================
    describe('SM-2 Algorithm', () => {
        it('should increase easiness factor on excellent performance', async () => {
            const outcome1 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 70,
            });
            const result1 = await scheduler.scheduleFromEvaluation(outcome1);
            const initialEF = result1.entry.easinessFactor;
            const outcome2 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 95,
            });
            const result2 = await scheduler.scheduleFromEvaluation(outcome2);
            expect(result2.entry.easinessFactor).toBeGreaterThan(initialEF);
        });
        it('should decrease easiness factor on poor performance', async () => {
            const outcome1 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 90,
            });
            const result1 = await scheduler.scheduleFromEvaluation(outcome1);
            const initialEF = result1.entry.easinessFactor;
            const outcome2 = createSampleEvaluationOutcome({
                studentId: 'student-1',
                topicId: 'topic-1',
                score: 30,
            });
            const result2 = await scheduler.scheduleFromEvaluation(outcome2);
            expect(result2.entry.easinessFactor).toBeLessThan(initialEF);
        });
        it('should not decrease easiness factor below minimum', async () => {
            const scheduler = new SpacedRepetitionScheduler(store, {
                minEasinessFactor: 1.3,
            });
            // Multiple poor performances
            for (let i = 0; i < 10; i++) {
                await scheduler.scheduleFromEvaluation(createSampleEvaluationOutcome({
                    studentId: 'student-1',
                    topicId: 'topic-1',
                    score: 20,
                }));
            }
            const stats = await scheduler.getReviewStats('student-1');
            expect(stats.averageEasinessFactor).toBeGreaterThanOrEqual(1.3);
        });
    });
    // ============================================================================
    // CUSTOM CONFIG TESTS
    // ============================================================================
    describe('Custom Configuration', () => {
        it('should respect custom initial interval', async () => {
            const customScheduler = new SpacedRepetitionScheduler(store, {
                initialIntervalDays: 3,
            });
            const outcome = createSampleEvaluationOutcome({ score: 50 }); // Quality < 3
            const result = await customScheduler.scheduleFromEvaluation(outcome);
            expect(result.daysUntilReview).toBe(3);
        });
        it('should respect custom score thresholds', async () => {
            const customScheduler = new SpacedRepetitionScheduler(store, {
                easyScoreThreshold: 95,
                goodScoreThreshold: 80,
            });
            const outcome = createSampleEvaluationOutcome({ score: 85 });
            const result = await customScheduler.scheduleFromEvaluation(outcome);
            expect(result.quality).toBe(4); // Good but not easy
        });
    });
});
// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================
describe('Factory Functions', () => {
    describe('createInMemoryReviewScheduleStore', () => {
        it('should create InMemoryReviewScheduleStore instance', () => {
            const store = createInMemoryReviewScheduleStore();
            expect(store).toBeInstanceOf(InMemoryReviewScheduleStore);
        });
    });
    describe('createSpacedRepetitionScheduler', () => {
        it('should create SpacedRepetitionScheduler instance', () => {
            const store = createInMemoryReviewScheduleStore();
            const scheduler = createSpacedRepetitionScheduler(store);
            expect(scheduler).toBeInstanceOf(SpacedRepetitionScheduler);
        });
        it('should accept custom config', () => {
            const store = createInMemoryReviewScheduleStore();
            const scheduler = createSpacedRepetitionScheduler(store, {
                initialIntervalDays: 3,
            });
            expect(scheduler).toBeInstanceOf(SpacedRepetitionScheduler);
        });
    });
    describe('getDefaultReviewScheduleStore', () => {
        beforeEach(() => {
            resetDefaultReviewScheduleStore();
        });
        it('should return same instance on multiple calls', () => {
            const store1 = getDefaultReviewScheduleStore();
            const store2 = getDefaultReviewScheduleStore();
            expect(store1).toBe(store2);
        });
        it('should create new instance after reset', () => {
            const store1 = getDefaultReviewScheduleStore();
            resetDefaultReviewScheduleStore();
            const store2 = getDefaultReviewScheduleStore();
            expect(store1).not.toBe(store2);
        });
    });
});
//# sourceMappingURL=spaced-repetition.test.js.map