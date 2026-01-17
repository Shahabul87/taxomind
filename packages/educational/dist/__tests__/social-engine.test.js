/**
 * @sam-ai/educational - Social Engine Tests
 * Tests for social learning analytics engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SocialEngine, createSocialEngine } from '../engines/social-engine';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createSocialEngineConfig(overrides = {}) {
    return {
        ...overrides,
    };
}
function createSampleGroup() {
    return {
        id: 'group-1',
        name: 'Test Study Group',
        members: [
            {
                userId: 'user-1',
                role: 'leader',
                joinedAt: new Date(),
                contributionScore: 0.8,
                engagementLevel: 0.9,
                helpfulnessRating: 0.85,
            },
            {
                userId: 'user-2',
                role: 'contributor',
                joinedAt: new Date(),
                contributionScore: 0.6,
                engagementLevel: 0.7,
                helpfulnessRating: 0.75,
            },
        ],
        purpose: 'Study programming together',
        activityLevel: 5,
        collaborationScore: 0.75,
        createdAt: new Date(),
    };
}
function createSampleCommunity() {
    return {
        id: 'community-1',
        name: 'Test Community',
        memberCount: 100,
        activeMembers: 75,
        topics: ['programming', 'web development'],
        activityMetrics: {
            postsPerDay: 10,
            commentsPerPost: 3,
            engagementRate: 0.65,
            growthRate: 0.05,
            averageResponseTime: 120,
        },
    };
}
function createSampleInteractions() {
    return [
        {
            id: 'int-1',
            userId: 'user-1',
            type: 'post',
            contentId: 'content-1',
            timestamp: new Date(),
            sentiment: 'positive',
            helpfulness: 0.8,
        },
        {
            id: 'int-2',
            userId: 'user-2',
            type: 'comment',
            contentId: 'content-2',
            timestamp: new Date(),
            targetUserId: 'user-1',
            sentiment: 'positive',
            helpfulness: 0.7,
        },
    ];
}
// ============================================================================
// TESTS
// ============================================================================
describe('SocialEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = createSocialEngineConfig();
        engine = new SocialEngine(config);
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid config', () => {
            expect(engine).toBeInstanceOf(SocialEngine);
        });
        it('should create engine without database adapter', () => {
            const noDatabaseEngine = new SocialEngine({});
            expect(noDatabaseEngine).toBeInstanceOf(SocialEngine);
        });
        it('should create engine using factory function', () => {
            const factoryEngine = createSocialEngine();
            expect(factoryEngine).toBeInstanceOf(SocialEngine);
        });
    });
    // ============================================================================
    // COLLABORATION EFFECTIVENESS TESTS
    // ============================================================================
    describe('measureCollaborationEffectiveness', () => {
        it('should measure collaboration effectiveness', async () => {
            const group = createSampleGroup();
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result).toBeDefined();
            expect(result.overall).toBeDefined();
            expect(typeof result.overall).toBe('number');
        });
        it('should return all effectiveness components', async () => {
            const group = createSampleGroup();
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result.knowledgeSharing).toBeDefined();
            expect(result.peerSupport).toBeDefined();
            expect(result.collaborativeLearning).toBeDefined();
            expect(result.communityBuilding).toBeDefined();
        });
        it('should return effectiveness factors', async () => {
            const group = createSampleGroup();
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result.factors).toBeDefined();
            expect(Array.isArray(result.factors)).toBe(true);
        });
        it('should handle group with single member', async () => {
            const group = createSampleGroup();
            group.members = [group.members[0]];
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // ENGAGEMENT ANALYSIS TESTS
    // ============================================================================
    describe('analyzeEngagement', () => {
        it('should analyze community engagement', async () => {
            const community = createSampleCommunity();
            const result = await engine.analyzeEngagement(community);
            expect(result).toBeDefined();
            expect(result.participationRate).toBeDefined();
        });
        it('should return all engagement metrics', async () => {
            const community = createSampleCommunity();
            const result = await engine.analyzeEngagement(community);
            expect(result.interactionFrequency).toBeDefined();
            expect(result.contentContribution).toBeDefined();
            expect(result.responseQuality).toBeDefined();
            expect(result.networkGrowth).toBeDefined();
        });
        it('should return engagement trends', async () => {
            const community = createSampleCommunity();
            const result = await engine.analyzeEngagement(community);
            expect(result.trends).toBeDefined();
            expect(Array.isArray(result.trends)).toBe(true);
        });
    });
    // ============================================================================
    // KNOWLEDGE SHARING TESTS
    // ============================================================================
    describe('evaluateKnowledgeSharing', () => {
        it('should evaluate knowledge sharing impact', async () => {
            const interactions = createSampleInteractions();
            const result = await engine.evaluateKnowledgeSharing(interactions);
            expect(result).toBeDefined();
            expect(result.reach).toBeDefined();
        });
        it('should return all sharing impact metrics', async () => {
            const interactions = createSampleInteractions();
            const result = await engine.evaluateKnowledgeSharing(interactions);
            expect(result.engagement).toBeDefined();
            expect(result.knowledgeTransfer).toBeDefined();
            expect(result.learningOutcomes).toBeDefined();
            expect(result.networkEffects).toBeDefined();
        });
        it('should handle empty interactions', async () => {
            const result = await engine.evaluateKnowledgeSharing([]);
            expect(result).toBeDefined();
            expect(result.reach).toBe(0);
        });
    });
    // ============================================================================
    // MENTOR MATCHING TESTS
    // ============================================================================
    describe('matchMentorMentee', () => {
        it('should throw error without database adapter', async () => {
            const users = [
                { id: 'user-1', name: 'Alice' },
                { id: 'user-2', name: 'Bob' },
            ];
            await expect(engine.matchMentorMentee(users)).rejects.toThrow('Database adapter is required');
        });
    });
    // ============================================================================
    // GROUP DYNAMICS TESTS
    // ============================================================================
    describe('assessGroupDynamics', () => {
        it('should assess group dynamics', async () => {
            const group = createSampleGroup();
            const result = await engine.assessGroupDynamics(group);
            expect(result).toBeDefined();
            expect(result.healthScore).toBeDefined();
        });
        it('should return all dynamics components', async () => {
            const group = createSampleGroup();
            const result = await engine.assessGroupDynamics(group);
            expect(result.cohesion).toBeDefined();
            expect(result.productivity).toBeDefined();
            expect(result.inclusivity).toBeDefined();
            expect(result.leadership).toBeDefined();
            expect(result.communication).toBeDefined();
        });
        it('should return recommendations', async () => {
            const group = createSampleGroup();
            const result = await engine.assessGroupDynamics(group);
            expect(result.recommendations).toBeDefined();
            expect(Array.isArray(result.recommendations)).toBe(true);
        });
        it('should identify conflicts', async () => {
            const group = createSampleGroup();
            const result = await engine.assessGroupDynamics(group);
            expect(result.conflicts).toBeDefined();
            expect(Array.isArray(result.conflicts)).toBe(true);
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle group with zero activity level', async () => {
            const group = createSampleGroup();
            group.activityLevel = 0;
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result).toBeDefined();
        });
        it('should handle community with no active members', async () => {
            const community = createSampleCommunity();
            community.activeMembers = 0;
            const result = await engine.analyzeEngagement(community);
            expect(result).toBeDefined();
        });
        it('should handle group with empty members array', async () => {
            const group = createSampleGroup();
            group.members = [];
            const result = await engine.measureCollaborationEffectiveness(group);
            expect(result).toBeDefined();
        });
    });
});
