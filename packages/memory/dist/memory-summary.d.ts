/**
 * Memory Summary Builder
 *
 * Creates compact memory summaries for prompt injection.
 */
import type { MasterySummary } from './mastery-tracker';
import type { ReviewStats } from './spaced-repetition';
import type { MasteryTracker } from './mastery-tracker';
import type { SpacedRepetitionScheduler } from './spaced-repetition';
export interface MemorySummaryResult {
    masterySummary: MasterySummary;
    reviewStats: ReviewStats;
    memorySummary?: string;
    reviewSummary?: string;
}
export interface MemorySummaryOptions {
    studentId: string;
    masteryTracker: MasteryTracker;
    spacedRepScheduler: SpacedRepetitionScheduler;
    maxTopics?: number;
}
export declare function buildMemorySummary(options: MemorySummaryOptions): Promise<MemorySummaryResult>;
//# sourceMappingURL=memory-summary.d.ts.map