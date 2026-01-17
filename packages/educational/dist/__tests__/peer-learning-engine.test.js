/**
 * @sam-ai/educational - Peer Learning Engine Tests
 * Tests for peer matching, study groups, mentoring, reviews, and projects
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PeerLearningEngine, createPeerLearningEngine, } from '../engines/peer-learning-engine';
import { createMockSAMConfig, createMockAIAdapter, createMockAIResponse } from './setup';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createSampleProfileInput(overrides = {}) {
    return {
        userId: 'user-1',
        displayName: 'Test User',
        bio: 'A test user for peer learning',
        expertise: [
            {
                subject: 'Mathematics',
                topic: 'Algebra',
                proficiencyLevel: 'INTERMEDIATE',
            },
            {
                subject: 'Programming',
                topic: 'JavaScript',
                proficiencyLevel: 'ADVANCED',
            },
        ],
        learningGoals: [
            {
                subject: 'Physics',
                topic: 'Mechanics',
                targetLevel: 'INTERMEDIATE',
                priority: 'HIGH',
            },
        ],
        languages: ['en'],
        timezone: 'America/New_York',
        ...overrides,
    };
}
function createSampleStudyGroupInput(overrides = {}) {
    return {
        name: 'Math Study Group',
        description: 'A group for studying mathematics',
        subject: 'Mathematics',
        topics: ['Algebra', 'Calculus'],
        ownerId: 'user-1',
        type: 'STUDY_GROUP',
        visibility: 'PUBLIC',
        maxMembers: 10,
        ...overrides,
    };
}
function createSampleDiscussionInput(overrides = {}) {
    return {
        groupId: 'group-1',
        title: 'Help with Algebra',
        content: 'Can someone explain quadratic equations?',
        authorId: 'user-1',
        type: 'QUESTION',
        tags: ['algebra', 'quadratic'],
        ...overrides,
    };
}
function createSampleMentorshipInput(overrides = {}) {
    return {
        mentorId: 'mentor-1',
        menteeId: 'mentee-1',
        subjects: ['Programming'],
        message: 'I would like to learn programming from you.',
        ...overrides,
    };
}
function createSampleProjectInput(overrides = {}) {
    return {
        title: 'Collaborative Learning App',
        description: 'Build a learning application together',
        createdBy: 'user-1',
        members: [{ userId: 'user-1', displayName: 'User One', role: 'LEAD', responsibilities: ['Project management'] }],
        startDate: new Date(),
        ...overrides,
    };
}
function createEngineConfig(overrides = {}) {
    return {
        matchingAlgorithm: 'WEIGHTED',
        defaultGroupSize: 5,
        maxGroupSize: 20,
        reputationWeights: {
            helpfulness: 0.25,
            reliability: 0.2,
            expertise: 0.2,
            communication: 0.15,
            collaboration: 0.2,
        },
        reviewCalibrationEnabled: true,
        anonymousReviewsDefault: false,
        mentoringEnabled: true,
        projectsEnabled: true,
        gamificationEnabled: true,
        ...overrides,
    };
}
// Create AI mock for peer learning
function createPeerLearningAIMock() {
    return createMockAIAdapter((params) => {
        const prompt = params.messages[0]?.content || '';
        if (prompt.includes('match') || prompt.includes('peer')) {
            return createMockAIResponse(JSON.stringify({
                suggestions: [
                    { userId: 'user-2', reason: 'Similar learning goals', score: 0.85 },
                ],
            }));
        }
        if (prompt.includes('group') || prompt.includes('recommend')) {
            return createMockAIResponse(JSON.stringify({
                recommendations: [{ groupId: 'group-1', reason: 'Active community' }],
            }));
        }
        return createMockAIResponse(JSON.stringify({ success: true }));
    });
}
// ============================================================================
// TESTS
// ============================================================================
describe('PeerLearningEngine', () => {
    let engine;
    let samConfig;
    beforeEach(() => {
        samConfig = createMockSAMConfig({
            ai: createPeerLearningAIMock(),
        });
        engine = new PeerLearningEngine(samConfig, createEngineConfig());
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with valid SAMConfig', () => {
            expect(engine).toBeInstanceOf(PeerLearningEngine);
        });
        it('should create engine with default config', () => {
            const defaultEngine = new PeerLearningEngine(samConfig);
            expect(defaultEngine).toBeInstanceOf(PeerLearningEngine);
        });
        it('should create engine with custom config', () => {
            const customConfig = createEngineConfig({
                maxGroupSize: 50,
                gamificationEnabled: false,
            });
            const customEngine = new PeerLearningEngine(samConfig, customConfig);
            expect(customEngine).toBeInstanceOf(PeerLearningEngine);
        });
        it('should create engine using factory function', () => {
            const factoryEngine = createPeerLearningEngine(samConfig);
            expect(factoryEngine).toBeInstanceOf(PeerLearningEngine);
        });
        it('should create engine with factory function and custom config', () => {
            const customConfig = createEngineConfig({ mentoringEnabled: false });
            const factoryEngine = createPeerLearningEngine(samConfig, customConfig);
            expect(factoryEngine).toBeInstanceOf(PeerLearningEngine);
        });
    });
    // ============================================================================
    // PEER PROFILE TESTS
    // ============================================================================
    describe('createPeerProfile', () => {
        it('should create a peer profile with valid input', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile).toBeDefined();
            expect(profile.userId).toBe('user-1');
            expect(profile.displayName).toBe('Test User');
        });
        it('should include expertise areas', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.expertise).toHaveLength(2);
            expect(profile.expertise[0].subject).toBe('Mathematics');
            expect(profile.expertise[1].subject).toBe('Programming');
        });
        it('should include learning goals', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.learningGoals).toHaveLength(1);
            expect(profile.learningGoals[0].subject).toBe('Physics');
        });
        it('should initialize default stats', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.stats).toBeDefined();
            expect(profile.stats.totalSessions).toBe(0);
            expect(profile.stats.groupsJoined).toBe(0);
        });
        it('should initialize default reputation', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.reputation).toBeDefined();
            expect(profile.reputation.overall).toBe(0);
        });
        it('should initialize badges as empty array', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.badges).toEqual([]);
        });
        it('should set timestamps', () => {
            const input = createSampleProfileInput();
            const profile = engine.createPeerProfile(input);
            expect(profile.createdAt).toBeInstanceOf(Date);
            expect(profile.updatedAt).toBeInstanceOf(Date);
            expect(profile.lastActiveAt).toBeInstanceOf(Date);
        });
    });
    describe('getPeerProfile', () => {
        it('should retrieve an existing profile', () => {
            const input = createSampleProfileInput();
            engine.createPeerProfile(input);
            const profile = engine.getPeerProfile('user-1');
            expect(profile).toBeDefined();
            expect(profile?.userId).toBe('user-1');
        });
        it('should return undefined for non-existent profile', () => {
            const profile = engine.getPeerProfile('non-existent');
            expect(profile).toBeUndefined();
        });
    });
    describe('updatePeerProfile', () => {
        it('should update an existing profile', () => {
            engine.createPeerProfile(createSampleProfileInput());
            const updateInput = {
                userId: 'user-1',
                displayName: 'Updated Name',
                bio: 'Updated bio',
            };
            const updated = engine.updatePeerProfile(updateInput);
            expect(updated.displayName).toBe('Updated Name');
            expect(updated.bio).toBe('Updated bio');
        });
        it('should throw error for non-existent profile', () => {
            const updateInput = {
                userId: 'non-existent',
                displayName: 'New Name',
            };
            expect(() => engine.updatePeerProfile(updateInput)).toThrow();
        });
        it('should update mentoring availability', () => {
            engine.createPeerProfile(createSampleProfileInput());
            const updateInput = {
                userId: 'user-1',
                isAvailableForMentoring: true,
            };
            const updated = engine.updatePeerProfile(updateInput);
            expect(updated.isAvailableForMentoring).toBe(true);
        });
    });
    // ============================================================================
    // PEER MATCHING TESTS
    // ============================================================================
    describe('findPeerMatches', () => {
        beforeEach(() => {
            // Create multiple profiles for matching
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            engine.createPeerProfile(createSampleProfileInput({
                userId: 'user-2',
                displayName: 'User Two',
                expertise: [
                    {
                        subject: 'Physics',
                        proficiencyLevel: 'ADVANCED',
                    },
                ],
            }));
            engine.createPeerProfile(createSampleProfileInput({
                userId: 'user-3',
                displayName: 'User Three',
                languages: ['en', 'es'],
            }));
        });
        it('should find peer matches', () => {
            const criteria = {
                matchType: 'STUDY_PARTNER',
            };
            const input = {
                userId: 'user-1',
                criteria,
            };
            const result = engine.findPeerMatches(input);
            expect(result).toBeDefined();
            expect(result.matches).toBeDefined();
            expect(Array.isArray(result.matches)).toBe(true);
        });
        it('should not include self in matches', () => {
            const input = {
                userId: 'user-1',
                criteria: { matchType: 'STUDY_PARTNER' },
            };
            const result = engine.findPeerMatches(input);
            const selfMatch = result.matches.find((m) => m.peerId === 'user-1');
            expect(selfMatch).toBeUndefined();
        });
        it('should respect limit in criteria', () => {
            const input = {
                userId: 'user-1',
                criteria: { matchType: 'STUDY_PARTNER', limit: 1 },
            };
            const result = engine.findPeerMatches(input);
            expect(result.matches.length).toBeLessThanOrEqual(1);
        });
        it('should include match scores', () => {
            const input = {
                userId: 'user-1',
                criteria: { matchType: 'STUDY_PARTNER' },
            };
            const result = engine.findPeerMatches(input);
            if (result.matches.length > 0) {
                expect(result.matches[0].matchScore).toBeDefined();
                expect(result.matches[0].matchScore).toBeGreaterThanOrEqual(0);
                expect(result.matches[0].matchScore).toBeLessThanOrEqual(100);
            }
        });
        it('should filter by subjects', () => {
            const input = {
                userId: 'user-1',
                criteria: {
                    matchType: 'STUDY_PARTNER',
                    subjects: ['Physics'],
                },
            };
            const result = engine.findPeerMatches(input);
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // STUDY GROUP TESTS
    // ============================================================================
    describe('createStudyGroup', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput());
        });
        it('should create a study group', () => {
            const input = createSampleStudyGroupInput();
            const group = engine.createStudyGroup(input);
            expect(group).toBeDefined();
            expect(group.name).toBe('Math Study Group');
            expect(group.subject).toBe('Mathematics');
        });
        it('should set creator as admin', () => {
            const input = createSampleStudyGroupInput();
            const group = engine.createStudyGroup(input);
            const creatorMember = group.members.find((m) => m.userId === 'user-1');
            expect(creatorMember).toBeDefined();
            expect(creatorMember?.role).toBe('OWNER');
        });
        it('should initialize with FORMING status', () => {
            const input = createSampleStudyGroupInput();
            const group = engine.createStudyGroup(input);
            expect(group.status).toBe('FORMING');
        });
        it('should set default settings', () => {
            const input = createSampleStudyGroupInput();
            const group = engine.createStudyGroup(input);
            expect(group.settings).toBeDefined();
            expect(group.settings.allowMemberInvites).toBe(true);
        });
        it('should initialize stats', () => {
            const input = createSampleStudyGroupInput();
            const group = engine.createStudyGroup(input);
            expect(group.stats).toBeDefined();
            expect(group.stats.totalSessions).toBe(0);
        });
    });
    describe('joinGroup', () => {
        let groupId;
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-2' }));
            const group = engine.createStudyGroup(createSampleStudyGroupInput());
            groupId = group.id;
        });
        it('should allow a user to join a group', () => {
            const input = {
                groupId,
                userId: 'user-2',
            };
            const member = engine.joinGroup(input);
            expect(member).toBeDefined();
            expect(member.userId).toBe('user-2');
            expect(member.role).toBe('MEMBER');
        });
        it('should throw error when joining non-existent group', () => {
            const input = {
                groupId: 'non-existent',
                userId: 'user-2',
            };
            expect(() => engine.joinGroup(input)).toThrow();
        });
        it('should throw error when already a member', () => {
            const input = {
                groupId,
                userId: 'user-1', // Already a member (creator)
            };
            expect(() => engine.joinGroup(input)).toThrow();
        });
    });
    describe('leaveGroup', () => {
        let groupId;
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-2' }));
            const group = engine.createStudyGroup(createSampleStudyGroupInput());
            groupId = group.id;
            engine.joinGroup({ groupId, userId: 'user-2' });
        });
        it('should allow a member to leave a group', () => {
            engine.leaveGroup(groupId, 'user-2');
            // Verify by trying to join again (should work now)
            const member = engine.joinGroup({ groupId, userId: 'user-2' });
            expect(member.userId).toBe('user-2');
        });
        it('should throw error when leaving non-existent group', () => {
            expect(() => engine.leaveGroup('non-existent', 'user-2')).toThrow();
        });
    });
    // ============================================================================
    // DISCUSSION TESTS
    // ============================================================================
    describe('createDiscussion', () => {
        let groupId;
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput());
            const group = engine.createStudyGroup(createSampleStudyGroupInput());
            groupId = group.id;
        });
        it('should create a discussion thread', () => {
            const input = createSampleDiscussionInput({ groupId });
            const thread = engine.createDiscussion(input);
            expect(thread).toBeDefined();
            expect(thread.title).toBe('Help with Algebra');
            expect(thread.type).toBe('QUESTION');
        });
        it('should set initial status as OPEN', () => {
            const input = createSampleDiscussionInput({ groupId });
            const thread = engine.createDiscussion(input);
            expect(thread.status).toBe('OPEN');
        });
        it('should initialize with empty replies', () => {
            const input = createSampleDiscussionInput({ groupId });
            const thread = engine.createDiscussion(input);
            expect(thread.replies).toEqual([]);
        });
        it('should include author information', () => {
            const input = createSampleDiscussionInput({ groupId });
            const thread = engine.createDiscussion(input);
            expect(thread.author).toBeDefined();
            expect(thread.author.userId).toBe('user-1');
        });
        it('should include tags', () => {
            const input = createSampleDiscussionInput({ groupId });
            const thread = engine.createDiscussion(input);
            expect(thread.tags).toContain('algebra');
            expect(thread.tags).toContain('quadratic');
        });
    });
    // ============================================================================
    // MENTORSHIP TESTS
    // ============================================================================
    describe('requestMentorship', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'mentor-1' }));
            engine.updatePeerProfile({ userId: 'mentor-1', isAvailableForMentoring: true });
            engine.createPeerProfile(createSampleProfileInput({ userId: 'mentee-1' }));
        });
        it('should create a mentorship request', () => {
            const input = createSampleMentorshipInput();
            const mentorship = engine.requestMentorship(input);
            expect(mentorship).toBeDefined();
            expect(mentorship.mentorId).toBe('mentor-1');
            expect(mentorship.menteeId).toBe('mentee-1');
        });
        it('should set status as PENDING', () => {
            const input = createSampleMentorshipInput();
            const mentorship = engine.requestMentorship(input);
            expect(mentorship.status).toBe('PENDING');
        });
        it('should include subjects', () => {
            const input = createSampleMentorshipInput();
            const mentorship = engine.requestMentorship(input);
            expect(mentorship.subjects).toContain('Programming');
        });
    });
    describe('searchMentors', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'mentor-1' }));
            engine.updatePeerProfile({ userId: 'mentor-1', isAvailableForMentoring: true });
            engine.createPeerProfile(createSampleProfileInput({ userId: 'mentor-2' }));
            engine.updatePeerProfile({ userId: 'mentor-2', isAvailableForMentoring: true });
        });
        it('should search for mentors', () => {
            const result = engine.searchMentors({});
            expect(result).toBeDefined();
            expect(result.mentors).toBeDefined();
            expect(Array.isArray(result.mentors)).toBe(true);
        });
        it('should filter by subjects', () => {
            const result = engine.searchMentors({ subjects: ['Programming'] });
            expect(result.mentors).toBeDefined();
        });
        it('should respect limit parameter', () => {
            const result = engine.searchMentors({ limit: 1 });
            expect(result.mentors.length).toBeLessThanOrEqual(1);
        });
    });
    // ============================================================================
    // PROJECT TESTS
    // ============================================================================
    describe('createProject', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput());
        });
        it('should create a collaborative project', () => {
            const input = createSampleProjectInput();
            const project = engine.createProject(input);
            expect(project).toBeDefined();
            expect(project.title).toBe('Collaborative Learning App');
        });
        it('should set creator as team lead', () => {
            const input = createSampleProjectInput();
            const project = engine.createProject(input);
            const creator = project.team.members.find((m) => m.userId === 'user-1');
            expect(creator).toBeDefined();
            expect(creator?.role).toBe('LEAD');
        });
        it('should set status as PLANNING', () => {
            const input = createSampleProjectInput();
            const project = engine.createProject(input);
            expect(project.status).toBe('PLANNING');
        });
        it('should initialize with empty milestones', () => {
            const input = createSampleProjectInput();
            const project = engine.createProject(input);
            expect(project.milestones).toEqual([]);
        });
    });
    describe('createProjectTask', () => {
        let projectId;
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput());
            const project = engine.createProject(createSampleProjectInput());
            projectId = project.id;
        });
        it('should create a project task', () => {
            const input = {
                projectId,
                title: 'Setup Development Environment',
                description: 'Install required tools and dependencies',
                priority: 'HIGH',
                createdBy: 'user-1',
            };
            const task = engine.createProjectTask(input);
            expect(task).toBeDefined();
            expect(task.title).toBe('Setup Development Environment');
            expect(task.priority).toBe('HIGH');
        });
        it('should set initial status as TODO', () => {
            const input = {
                projectId,
                title: 'New Task',
                description: 'Task description',
                priority: 'MEDIUM',
                createdBy: 'user-1',
            };
            const task = engine.createProjectTask(input);
            expect(task.status).toBe('TODO');
        });
        it('should throw error for non-existent project', () => {
            const input = {
                projectId: 'non-existent',
                title: 'Task',
                description: 'Description',
                priority: 'LOW',
                createdBy: 'user-1',
            };
            expect(() => engine.createProjectTask(input)).toThrow();
        });
    });
    // ============================================================================
    // ANALYTICS TESTS
    // ============================================================================
    describe('getAnalytics', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput());
            engine.createStudyGroup(createSampleStudyGroupInput());
        });
        it('should return analytics data', () => {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
            const endDate = new Date();
            const analytics = engine.getAnalytics(startDate, endDate);
            expect(analytics).toBeDefined();
            expect(analytics.activeUsers).toBeDefined();
            expect(analytics.groupsCreated).toBeDefined();
        });
        it('should include session count', () => {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endDate = new Date();
            const analytics = engine.getAnalytics(startDate, endDate);
            expect(analytics.sessionsCompleted).toBeDefined();
        });
    });
    // ============================================================================
    // PEER REVIEW TESTS
    // ============================================================================
    describe('createReviewRubric', () => {
        it('should create a peer review rubric', () => {
            const rubric = engine.createReviewRubric({
                name: 'Essay Review Rubric',
                description: 'Rubric for reviewing essays',
                totalPoints: 8,
                passingScore: 5,
                allowComments: true,
                requireComments: false,
                criteria: [
                    {
                        id: 'criterion-1',
                        name: 'Content',
                        description: 'Quality of content',
                        maxPoints: 4,
                        weight: 0.4,
                        levels: [
                            { points: 1, label: 'Poor', description: 'Poor content' },
                            { points: 2, label: 'Fair', description: 'Fair content' },
                            { points: 3, label: 'Good', description: 'Good content' },
                            { points: 4, label: 'Excellent', description: 'Excellent content' },
                        ],
                    },
                    {
                        id: 'criterion-2',
                        name: 'Structure',
                        description: 'Organization and flow',
                        maxPoints: 4,
                        weight: 0.3,
                        levels: [
                            { points: 1, label: 'Poor', description: 'Poor structure' },
                            { points: 2, label: 'Fair', description: 'Fair structure' },
                            { points: 3, label: 'Good', description: 'Good structure' },
                            { points: 4, label: 'Excellent', description: 'Excellent structure' },
                        ],
                    },
                ],
            });
            expect(rubric).toBeDefined();
            expect(rubric.name).toBe('Essay Review Rubric');
            expect(rubric.criteria).toHaveLength(2);
        });
    });
    // ============================================================================
    // AI INTEGRATION TESTS
    // ============================================================================
    describe('AI integration', () => {
        beforeEach(() => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-2' }));
        });
        it('should get AI matching suggestions', async () => {
            const result = await engine.getAIMatchingSuggestions('user-1');
            expect(result).toBeDefined();
        });
        it('should get group recommendations', async () => {
            engine.createStudyGroup(createSampleStudyGroupInput());
            const result = await engine.getGroupRecommendations('user-1');
            expect(result).toBeDefined();
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle profile with minimal input', () => {
            const input = {
                userId: 'minimal-user',
                displayName: 'Minimal',
                languages: ['en'],
            };
            const profile = engine.createPeerProfile(input);
            expect(profile.userId).toBe('minimal-user');
            expect(profile.expertise).toEqual([]);
            expect(profile.learningGoals).toEqual([]);
        });
        it('should handle group with one member', () => {
            engine.createPeerProfile(createSampleProfileInput());
            const group = engine.createStudyGroup(createSampleStudyGroupInput());
            expect(group.members).toHaveLength(1);
        });
        it('should throw for non-existent user', () => {
            expect(() => engine.findPeerMatches({
                userId: 'non-existent-user',
                criteria: { matchType: 'STUDY_PARTNER' },
            })).toThrow('Profile not found for user: non-existent-user');
        });
        it('should handle multiple profiles creation', () => {
            for (let i = 0; i < 10; i++) {
                engine.createPeerProfile(createSampleProfileInput({
                    userId: `user-${i}`,
                    displayName: `User ${i}`,
                }));
            }
            const result = engine.findPeerMatches({
                userId: 'user-0',
                criteria: { matchType: 'STUDY_PARTNER', limit: 100 },
            });
            expect(result.matches.length).toBe(9); // Excludes self
        });
        it('should handle concurrent group joins', () => {
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-2' }));
            engine.createPeerProfile(createSampleProfileInput({ userId: 'user-3' }));
            const group = engine.createStudyGroup(createSampleStudyGroupInput());
            engine.joinGroup({ groupId: group.id, userId: 'user-2' });
            engine.joinGroup({ groupId: group.id, userId: 'user-3' });
            // Fetch updated group to check all members
            const updatedGroup = engine.getStudyGroup(group.id);
            expect(updatedGroup?.members).toHaveLength(3);
        });
    });
    // ============================================================================
    // CONFIGURATION TESTS
    // ============================================================================
    describe('configuration', () => {
        it('should use different matching algorithms', () => {
            const simpleEngine = new PeerLearningEngine(samConfig, createEngineConfig({ matchingAlgorithm: 'SIMPLE' }));
            simpleEngine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            simpleEngine.createPeerProfile(createSampleProfileInput({ userId: 'user-2' }));
            const result = simpleEngine.findPeerMatches({
                userId: 'user-1',
                criteria: { matchType: 'STUDY_PARTNER' },
            });
            expect(result).toBeDefined();
        });
        it('should respect maxGroupSize config', () => {
            const smallGroupEngine = new PeerLearningEngine(samConfig, createEngineConfig({ maxGroupSize: 3 }));
            smallGroupEngine.createPeerProfile(createSampleProfileInput({ userId: 'user-1' }));
            const group = smallGroupEngine.createStudyGroup(createSampleStudyGroupInput({ maxMembers: 3 }));
            expect(group.maxMembers).toBe(3);
        });
        it('should disable features via config', () => {
            const limitedEngine = new PeerLearningEngine(samConfig, createEngineConfig({
                mentoringEnabled: false,
                projectsEnabled: false,
            }));
            expect(limitedEngine).toBeInstanceOf(PeerLearningEngine);
        });
    });
});
