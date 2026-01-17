/**
 * @sam-ai/educational - Peer Learning Engine
 *
 * Comprehensive peer-to-peer learning system providing:
 * - Intelligent peer matching based on skills and preferences
 * - Study groups and learning circles management
 * - Peer mentoring and tutoring relationships
 * - Discussion forums and Q&A
 * - Peer reviews and assessments
 * - Collaborative project management
 */
import type { SAMConfig } from '@sam-ai/core';
import type { PeerProfile, PeerExpertise, PeerProficiencyLevel, Endorsement, PeerLearningGoal, PeerGoalStatus, PeerBadge, BadgeCategory, BadgeTier, PeerMatch, StudyGroup, GroupType, GroupVisibility, GroupStatus, GroupMember, GroupResource, GroupSession, SessionStatus, DiscussionThread, ThreadType, ThreadStatus, DiscussionReply, Reaction, ReactionType, Mentorship, MentorshipStatus, MentoringSession, SessionFeedback, MentorshipFeedback, PeerReviewAssignment, ReviewSubmission, PeerReviewRubric, PeerReview, CollaborativeProject, ProjectStatus, ProjectTask, TaskStatus, TaskComment, ProjectCommunication, ProjectReview, PeerLearningEngineConfig, CreatePeerProfileInput, UpdatePeerProfileInput, FindPeerMatchesInput, CreateStudyGroupInput, JoinGroupInput, CreateGroupSessionInput, CreateDiscussionInput, CreateReplyInput, RequestMentorshipInput, CreatePeerReviewAssignmentInput, SubmitPeerReviewInput, CreateProjectInput, CreateProjectTaskInput, PeerMatchResult, GroupSearchResult, DiscussionSearchResult, MentorSearchResult, LeaderboardEntry, PeerLearningAnalytics } from '../types/peer-learning.types';
export declare class PeerLearningEngine {
    private samConfig;
    private config;
    private profiles;
    private groups;
    private discussions;
    private mentorships;
    private reviewAssignments;
    private rubrics;
    private projects;
    constructor(samConfig: SAMConfig, config?: PeerLearningEngineConfig);
    /**
     * Create a new peer profile
     */
    createPeerProfile(input: CreatePeerProfileInput): PeerProfile;
    /**
     * Get a peer profile by user ID
     */
    getPeerProfile(userId: string): PeerProfile | undefined;
    /**
     * Update a peer profile
     */
    updatePeerProfile(input: UpdatePeerProfileInput): PeerProfile;
    /**
     * Add expertise to a profile
     */
    addExpertise(userId: string, expertise: Omit<PeerExpertise, 'endorsements' | 'isVerified'>): PeerProfile;
    /**
     * Add a learning goal
     */
    addLearningGoal(userId: string, goal: Omit<PeerLearningGoal, 'id' | 'status'>): PeerLearningGoal;
    /**
     * Update learning goal status
     */
    updateLearningGoalStatus(userId: string, goalId: string, status: PeerGoalStatus): PeerLearningGoal;
    /**
     * Endorse a peer's expertise
     */
    endorseExpertise(endorserId: string, targetUserId: string, subject: string, message?: string): Endorsement;
    /**
     * Update user reputation
     */
    private updateReputation;
    /**
     * Award a badge to a user
     */
    awardBadge(userId: string, name: string, description: string, category: BadgeCategory, tier: BadgeTier, icon: string): PeerBadge;
    /**
     * Check and award badges based on stats
     */
    private checkBadgeEligibility;
    private hasBadge;
    /**
     * Find peer matches based on criteria
     */
    findPeerMatches(input: FindPeerMatchesInput): PeerMatchResult;
    private isMatchTypeCompatible;
    private calculateMatchScore;
    private calculateExpertiseAlignment;
    private getMatchReasons;
    private getCompatibilityFactors;
    /**
     * Create a new study group
     */
    createStudyGroup(input: CreateStudyGroupInput): StudyGroup;
    /**
     * Get a study group by ID
     */
    getStudyGroup(groupId: string): StudyGroup | undefined;
    /**
     * Search for study groups
     */
    searchStudyGroups(options: {
        query?: string;
        subject?: string;
        topics?: string[];
        type?: GroupType;
        status?: GroupStatus;
        visibility?: GroupVisibility;
        limit?: number;
        offset?: number;
    }): GroupSearchResult;
    /**
     * Request to join a study group
     */
    joinGroup(input: JoinGroupInput): GroupMember;
    /**
     * Leave a study group
     */
    leaveGroup(groupId: string, userId: string): void;
    /**
     * Create a group session
     */
    createGroupSession(input: CreateGroupSessionInput): GroupSession;
    /**
     * Update session status
     */
    updateSessionStatus(groupId: string, sessionId: string, status: SessionStatus): GroupSession;
    /**
     * Add a resource to a group
     */
    addGroupResource(groupId: string, resource: Omit<GroupResource, 'id' | 'uploadedAt' | 'downloads' | 'likes'>): GroupResource;
    private generateInviteCode;
    /**
     * Create a discussion thread
     */
    createDiscussion(input: CreateDiscussionInput): DiscussionThread;
    /**
     * Get a discussion thread
     */
    getDiscussion(threadId: string): DiscussionThread | undefined;
    /**
     * Reply to a discussion
     */
    createReply(input: CreateReplyInput): DiscussionReply;
    /**
     * Accept an answer
     */
    acceptAnswer(threadId: string, replyId: string, userId: string): DiscussionReply;
    /**
     * Add reaction to a reply
     */
    addReaction(threadId: string, replyId: string, userId: string, reactionType: ReactionType): Reaction;
    /**
     * Search discussions
     */
    searchDiscussions(options: {
        query?: string;
        type?: ThreadType;
        status?: ThreadStatus;
        tags?: string[];
        groupId?: string;
        courseId?: string;
        limit?: number;
        offset?: number;
    }): DiscussionSearchResult;
    /**
     * Request mentorship
     */
    requestMentorship(input: RequestMentorshipInput): Mentorship;
    /**
     * Get a mentorship by ID
     */
    getMentorship(mentorshipId: string): Mentorship | undefined;
    /**
     * Update mentorship status
     */
    updateMentorshipStatus(mentorshipId: string, status: MentorshipStatus, userId: string): Mentorship;
    /**
     * Schedule a mentoring session
     */
    scheduleMentoringSession(mentorshipId: string, session: Omit<MentoringSession, 'id' | 'mentorshipId' | 'createdAt'>): MentoringSession;
    /**
     * Complete a mentoring session
     */
    completeMentoringSession(mentorshipId: string, sessionId: string, actualDuration: number, notes?: string, feedback?: SessionFeedback): MentoringSession;
    /**
     * Add mentorship feedback
     */
    addMentorshipFeedback(mentorshipId: string, feedback: Omit<MentorshipFeedback, 'id' | 'createdAt'>): MentorshipFeedback;
    /**
     * Search for mentors
     */
    searchMentors(options: {
        subjects?: string[];
        proficiencyLevel?: PeerProficiencyLevel;
        minRating?: number;
        limit?: number;
        offset?: number;
    }): MentorSearchResult;
    /**
     * Create a peer review rubric
     */
    createReviewRubric(rubric: Omit<PeerReviewRubric, 'id'>): PeerReviewRubric;
    /**
     * Get a review rubric
     */
    getReviewRubric(rubricId: string): PeerReviewRubric | undefined;
    /**
     * Create a peer review assignment
     */
    createPeerReviewAssignment(input: CreatePeerReviewAssignmentInput, submission: ReviewSubmission): PeerReviewAssignment;
    /**
     * Get a peer review assignment
     */
    getPeerReviewAssignment(assignmentId: string): PeerReviewAssignment | undefined;
    /**
     * Submit a peer review
     */
    submitPeerReview(input: SubmitPeerReviewInput): PeerReview;
    /**
     * Get reviews for a submission
     */
    getReviewsForSubmission(submissionId: string): PeerReview[];
    /**
     * Create a collaborative project
     */
    createProject(input: CreateProjectInput): CollaborativeProject;
    /**
     * Get a project by ID
     */
    getProject(projectId: string): CollaborativeProject | undefined;
    /**
     * Update project status
     */
    updateProjectStatus(projectId: string, status: ProjectStatus): CollaborativeProject;
    /**
     * Create a project task
     */
    createProjectTask(input: CreateProjectTaskInput): ProjectTask;
    /**
     * Update task status
     */
    updateTaskStatus(projectId: string, taskId: string, status: TaskStatus, actualHours?: number): ProjectTask;
    /**
     * Add task comment
     */
    addTaskComment(projectId: string, taskId: string, authorId: string, content: string): TaskComment;
    /**
     * Add project communication
     */
    addProjectCommunication(projectId: string, communication: Omit<ProjectCommunication, 'id' | 'createdAt'>): ProjectCommunication;
    /**
     * Add project review
     */
    addProjectReview(projectId: string, review: Omit<ProjectReview, 'id' | 'createdAt'>): ProjectReview;
    /**
     * Get leaderboard
     */
    getLeaderboard(options: {
        category?: 'overall' | 'helpfulness' | 'sessions' | 'reviews';
        limit?: number;
    }): LeaderboardEntry[];
    /**
     * Get peer learning analytics
     */
    getAnalytics(startDate: Date, endDate: Date): PeerLearningAnalytics;
    /**
     * AI-enhanced peer matching suggestions
     */
    getAIMatchingSuggestions(userId: string, context?: string): Promise<PeerMatch[]>;
    /**
     * AI-generated study group recommendations
     */
    getGroupRecommendations(userId: string): Promise<StudyGroup[]>;
}
/**
 * Create a new PeerLearningEngine instance
 */
export declare function createPeerLearningEngine(samConfig: SAMConfig, config?: PeerLearningEngineConfig): PeerLearningEngine;
//# sourceMappingURL=peer-learning-engine.d.ts.map