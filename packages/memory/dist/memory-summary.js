/**
 * Memory Summary Builder
 *
 * Creates compact memory summaries for prompt injection.
 */
export async function buildMemorySummary(options) {
    const { studentId, masteryTracker, spacedRepScheduler, maxTopics = 3 } = options;
    const [masterySummary, reviewStats] = await Promise.all([
        masteryTracker.getMasterySummary(studentId),
        spacedRepScheduler.getReviewStats(studentId),
    ]);
    const memoryLines = [];
    if (masterySummary.totalTopics > 0) {
        memoryLines.push(`Average mastery: ${Math.round(masterySummary.averageMastery)}% across ${masterySummary.totalTopics} topics (${masterySummary.recentTrend}).`);
    }
    if (masterySummary.strengths.length > 0) {
        memoryLines.push(`Strengths: ${masterySummary.strengths.slice(0, maxTopics).join(', ')}.`);
    }
    if (masterySummary.topicsNeedingAttention.length > 0) {
        memoryLines.push(`Needs attention: ${masterySummary.topicsNeedingAttention.slice(0, maxTopics).join(', ')}.`);
    }
    const reviewLines = [];
    if (reviewStats.totalPending > 0) {
        reviewLines.push(`Pending reviews: ${reviewStats.totalPending} (overdue: ${reviewStats.overdueCount}).`);
        reviewLines.push(`Due today: ${reviewStats.dueTodayCount}, due this week: ${reviewStats.dueThisWeekCount}.`);
    }
    const memorySummary = memoryLines.length > 0 ? memoryLines.join('\n') : undefined;
    const reviewSummary = reviewLines.length > 0 ? reviewLines.join('\n') : undefined;
    return {
        masterySummary,
        reviewStats,
        memorySummary,
        reviewSummary,
    };
}
//# sourceMappingURL=memory-summary.js.map