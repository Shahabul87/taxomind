/**
 * Prisma Student Profile Store
 *
 * Database-backed implementation for student learning profiles.
 */
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function calculateMasteryLevel(score) {
    if (score >= 90)
        return 'expert';
    if (score >= 80)
        return 'proficient';
    if (score >= 70)
        return 'intermediate';
    if (score >= 50)
        return 'beginner';
    return 'novice';
}
function calculateTrend(currentScore, previousScore) {
    const difference = currentScore - previousScore;
    if (difference > 5)
        return 'improving';
    if (difference < -5)
        return 'declining';
    return 'stable';
}
function calculateConfidence(assessmentCount) {
    return Math.min(0.95, 0.5 + assessmentCount * 0.05);
}
// ============================================================================
// IMPLEMENTATION
// ============================================================================
export class PrismaStudentProfileStore {
    prisma;
    profileTableName;
    masteryTableName;
    pathwayTableName;
    constructor(config) {
        this.prisma = config.prisma;
        this.profileTableName = config.profileTableName ?? 'studentProfile';
        this.masteryTableName = config.masteryTableName ?? 'topicMastery';
        this.pathwayTableName = config.pathwayTableName ?? 'learningPathway';
    }
    async get(studentId) {
        const result = await this.prisma[this.profileTableName].findUnique({
            where: { id: studentId },
            include: { masteryRecords: true, pathways: true },
        });
        return result ? this.mapToProfile(result) : null;
    }
    async save(profile) {
        await this.prisma[this.profileTableName].upsert({
            where: { id: profile.id },
            create: {
                id: profile.id,
                userId: profile.userId,
                cognitivePreferences: profile.cognitivePreferences,
                performanceMetrics: profile.performanceMetrics,
                overallBloomsDistribution: profile.overallBloomsDistribution,
                knowledgeGaps: profile.knowledgeGaps,
                strengths: profile.strengths,
                createdAt: profile.createdAt,
                lastActiveAt: profile.lastActiveAt,
                updatedAt: new Date(),
            },
            update: {
                cognitivePreferences: profile.cognitivePreferences,
                performanceMetrics: profile.performanceMetrics,
                overallBloomsDistribution: profile.overallBloomsDistribution,
                knowledgeGaps: profile.knowledgeGaps,
                strengths: profile.strengths,
                lastActiveAt: profile.lastActiveAt,
                updatedAt: new Date(),
            },
        });
    }
    async updateMastery(studentId, update) {
        const scorePercent = (update.score / update.maxScore) * 100;
        const existing = await this.prisma[this.masteryTableName].findUnique({
            where: { studentId_topicId: { studentId, topicId: update.topicId } },
        });
        if (existing) {
            const newAssessmentCount = existing.assessmentCount + 1;
            const newAverageScore = (existing.averageScore * existing.assessmentCount + scorePercent) / newAssessmentCount;
            const result = await this.prisma[this.masteryTableName].update({
                where: { studentId_topicId: { studentId, topicId: update.topicId } },
                data: {
                    level: calculateMasteryLevel(newAverageScore),
                    score: newAverageScore,
                    bloomsLevel: update.bloomsLevel,
                    assessmentCount: newAssessmentCount,
                    averageScore: newAverageScore,
                    lastAssessedAt: update.timestamp,
                    trend: calculateTrend(scorePercent, existing.score),
                    confidence: calculateConfidence(newAssessmentCount),
                },
            });
            return this.mapToMastery(result);
        }
        else {
            const result = await this.prisma[this.masteryTableName].create({
                data: {
                    studentId,
                    topicId: update.topicId,
                    level: calculateMasteryLevel(scorePercent),
                    score: scorePercent,
                    bloomsLevel: update.bloomsLevel,
                    assessmentCount: 1,
                    averageScore: scorePercent,
                    lastAssessedAt: update.timestamp,
                    trend: 'stable',
                    confidence: calculateConfidence(1),
                },
            });
            return this.mapToMastery(result);
        }
    }
    async getMastery(studentId, topicId) {
        const result = await this.prisma[this.masteryTableName].findUnique({
            where: { studentId_topicId: { studentId, topicId } },
        });
        return result ? this.mapToMastery(result) : null;
    }
    async updatePathway(studentId, pathwayId, adjustment) {
        const pathway = await this.prisma[this.pathwayTableName].findUnique({
            where: { id: pathwayId },
        });
        if (!pathway || pathway.studentId !== studentId) {
            throw new Error(`Pathway not found: ${pathwayId}`);
        }
        let steps = pathway.steps;
        switch (adjustment.type) {
            case 'add_remediation':
                if (adjustment.stepsToAdd) {
                    steps = [
                        ...steps.slice(0, pathway.currentStepIndex),
                        ...adjustment.stepsToAdd,
                        ...steps.slice(pathway.currentStepIndex),
                    ];
                }
                break;
            case 'add_challenge':
                if (adjustment.stepsToAdd) {
                    steps = [
                        ...steps.slice(0, pathway.currentStepIndex + 1),
                        ...adjustment.stepsToAdd,
                        ...steps.slice(pathway.currentStepIndex + 1),
                    ];
                }
                break;
            default:
                break;
        }
        const result = await this.prisma[this.pathwayTableName].update({
            where: { id: pathwayId },
            data: {
                steps,
                currentStepIndex: adjustment.newCurrentStepIndex ?? pathway.currentStepIndex,
                updatedAt: new Date(),
            },
        });
        return this.mapToPathway(result);
    }
    async getActivePathways(studentId) {
        const results = await this.prisma[this.pathwayTableName].findMany({
            where: { studentId, status: 'active' },
        });
        return results.map((r) => this.mapToPathway(r));
    }
    async updateMetrics(studentId, metrics) {
        const profile = await this.prisma[this.profileTableName].findUnique({
            where: { id: studentId },
        });
        if (!profile) {
            throw new Error(`Student profile not found: ${studentId}`);
        }
        const updatedMetrics = { ...profile.performanceMetrics, ...metrics };
        await this.prisma[this.profileTableName].update({
            where: { id: studentId },
            data: { performanceMetrics: updatedMetrics, updatedAt: new Date() },
        });
        return updatedMetrics;
    }
    async getKnowledgeGaps(studentId) {
        const results = await this.prisma[this.masteryTableName].findMany({
            where: { studentId, level: { in: ['novice', 'beginner'] } },
            select: { topicId: true },
        });
        return results.map((r) => r.topicId);
    }
    async delete(studentId) {
        await this.prisma[this.profileTableName].delete({ where: { id: studentId } });
    }
    mapToProfile(result) {
        const masteryByTopic = {};
        for (const m of result.masteryRecords ?? []) {
            masteryByTopic[m.topicId] = this.mapToMastery(m);
        }
        return {
            id: result.id,
            userId: result.userId,
            masteryByTopic,
            activePathways: (result.pathways ?? []).map((p) => this.mapToPathway(p)),
            cognitivePreferences: result.cognitivePreferences,
            performanceMetrics: result.performanceMetrics,
            overallBloomsDistribution: result.overallBloomsDistribution,
            knowledgeGaps: result.knowledgeGaps ?? [],
            strengths: result.strengths ?? [],
            createdAt: result.createdAt,
            lastActiveAt: result.lastActiveAt,
            updatedAt: result.updatedAt,
        };
    }
    mapToMastery(result) {
        return {
            topicId: result.topicId,
            level: result.level,
            score: result.score,
            bloomsLevel: result.bloomsLevel,
            assessmentCount: result.assessmentCount,
            averageScore: result.averageScore,
            lastAssessedAt: result.lastAssessedAt,
            trend: result.trend,
            confidence: result.confidence,
        };
    }
    mapToPathway(result) {
        return {
            id: result.id,
            studentId: result.studentId,
            courseId: result.courseId,
            steps: result.steps,
            currentStepIndex: result.currentStepIndex,
            progress: result.progress,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            status: result.status,
        };
    }
}
export function createPrismaStudentProfileStore(config) {
    return new PrismaStudentProfileStore(config);
}
//# sourceMappingURL=student-profile-store.js.map