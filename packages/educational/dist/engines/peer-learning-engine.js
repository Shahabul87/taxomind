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
// ============================================================================
// Helper Functions
// ============================================================================
function generateId() {
    return `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function createDefaultStats() {
    return {
        totalSessions: 0,
        totalStudyHours: 0,
        groupsJoined: 0,
        groupsCreated: 0,
        questionsAsked: 0,
        questionsAnswered: 0,
        helpfulAnswers: 0,
        projectsCompleted: 0,
        peersHelped: 0,
        reviewsGiven: 0,
        reviewsReceived: 0,
        averageRating: 0,
        totalRatings: 0,
    };
}
function createDefaultReputation() {
    return {
        overall: 0,
        helpfulness: 0,
        reliability: 0,
        expertise: 0,
        communication: 0,
        collaboration: 0,
        history: [],
    };
}
function createDefaultAvailability() {
    const emptySchedule = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
    };
    return {
        schedule: emptySchedule,
        preferredSessionDuration: 60,
        maxSessionsPerWeek: 5,
        blackoutDates: [],
        isCurrentlyAvailable: true,
    };
}
function createDefaultPreferences() {
    return {
        preferredGroupSize: 'ANY',
        communicationStyle: 'FLEXIBLE',
        learningStyle: 'MIXED',
        sessionFormat: ['VIDEO_CALL', 'TEXT_CHAT'],
        preferSameTimezone: false,
        preferSameLanguage: true,
        interests: [],
    };
}
function createDefaultGroupSettings() {
    return {
        allowJoinRequests: true,
        requireApproval: false,
        allowMemberInvites: true,
        allowResourceSharing: true,
        allowDiscussions: true,
        notificationPreferences: {
            newMember: true,
            sessionReminder: true,
            newResource: true,
            newDiscussion: true,
            goalUpdate: true,
        },
        contentModeration: {
            autoModeration: false,
            requireApprovalForPosts: false,
            wordFilter: false,
            reportThreshold: 3,
        },
    };
}
function calculateCompatibilityScore(profile1, profile2, criteria) {
    let score = 0;
    let totalWeight = 0;
    // Timezone compatibility
    if (criteria.timezone || profile1.preferences.preferSameTimezone) {
        const weight = 0.15;
        totalWeight += weight;
        if (profile1.timezone === profile2.timezone) {
            score += weight;
        }
    }
    // Language compatibility
    if (criteria.languages?.length || profile1.preferences.preferSameLanguage) {
        const weight = 0.2;
        totalWeight += weight;
        const commonLanguages = profile1.languages.filter((l) => profile2.languages.includes(l));
        if (commonLanguages.length > 0) {
            score += weight * Math.min(1, commonLanguages.length / 2);
        }
    }
    // Session format compatibility
    const weight3 = 0.15;
    totalWeight += weight3;
    const commonFormats = profile1.preferences.sessionFormat.filter((f) => profile2.preferences.sessionFormat.includes(f));
    score += weight3 * Math.min(1, commonFormats.length / 2);
    // Group size preference
    const weight4 = 0.1;
    totalWeight += weight4;
    if (profile1.preferences.preferredGroupSize ===
        profile2.preferences.preferredGroupSize ||
        profile1.preferences.preferredGroupSize === 'ANY' ||
        profile2.preferences.preferredGroupSize === 'ANY') {
        score += weight4;
    }
    // Learning style compatibility
    const weight5 = 0.15;
    totalWeight += weight5;
    if (profile1.preferences.learningStyle === profile2.preferences.learningStyle ||
        profile1.preferences.learningStyle === 'MIXED' ||
        profile2.preferences.learningStyle === 'MIXED') {
        score += weight5;
    }
    // Reputation score
    const weight6 = 0.25;
    totalWeight += weight6;
    const repScore = profile2.reputation.overall / 100;
    score += weight6 * Math.min(1, repScore);
    return totalWeight > 0 ? score / totalWeight : 0.5;
}
function findComplementarySkills(profile1, profile2) {
    const complementary = [];
    for (const exp1 of profile1.expertise) {
        const matching = profile2.expertise.find((e) => e.subject === exp1.subject);
        if (matching) {
            const level1 = proficiencyToNumber(exp1.proficiencyLevel);
            const level2 = proficiencyToNumber(matching.proficiencyLevel);
            if (level1 > level2) {
                complementary.push({
                    skill: exp1.subject,
                    myLevel: exp1.proficiencyLevel,
                    theirLevel: matching.proficiencyLevel,
                    direction: 'CAN_TEACH',
                });
            }
            else if (level2 > level1) {
                complementary.push({
                    skill: exp1.subject,
                    myLevel: exp1.proficiencyLevel,
                    theirLevel: matching.proficiencyLevel,
                    direction: 'CAN_LEARN',
                });
            }
            else {
                complementary.push({
                    skill: exp1.subject,
                    myLevel: exp1.proficiencyLevel,
                    theirLevel: matching.proficiencyLevel,
                    direction: 'MUTUAL',
                });
            }
        }
    }
    return complementary;
}
function proficiencyToNumber(level) {
    const mapping = {
        BEGINNER: 1,
        INTERMEDIATE: 2,
        ADVANCED: 3,
        EXPERT: 4,
        MASTER: 5,
    };
    return mapping[level];
}
function calculateAvailabilityOverlap(avail1, avail2) {
    const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
    ];
    let totalOverlapMinutes = 0;
    let totalPossibleMinutes = 0;
    for (const day of days) {
        const slots1 = avail1.schedule[day];
        const slots2 = avail2.schedule[day];
        for (const slot1 of slots1) {
            totalPossibleMinutes += getSlotDuration(slot1);
            for (const slot2 of slots2) {
                totalOverlapMinutes += getSlotOverlap(slot1, slot2);
            }
        }
    }
    return totalPossibleMinutes > 0
        ? (totalOverlapMinutes / totalPossibleMinutes) * 100
        : 0;
}
function getSlotDuration(slot) {
    const [startHour, startMin] = slot.startTime.split(':').map(Number);
    const [endHour, endMin] = slot.endTime.split(':').map(Number);
    return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}
function getSlotOverlap(slot1, slot2) {
    const [s1h, s1m] = slot1.startTime.split(':').map(Number);
    const [e1h, e1m] = slot1.endTime.split(':').map(Number);
    const [s2h, s2m] = slot2.startTime.split(':').map(Number);
    const [e2h, e2m] = slot2.endTime.split(':').map(Number);
    const start1 = s1h * 60 + s1m;
    const end1 = e1h * 60 + e1m;
    const start2 = s2h * 60 + s2m;
    const end2 = e2h * 60 + e2m;
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    return Math.max(0, overlapEnd - overlapStart);
}
// ============================================================================
// Peer Learning Engine
// ============================================================================
export class PeerLearningEngine {
    samConfig;
    config;
    // In-memory storage (would be database in production)
    profiles = new Map();
    groups = new Map();
    discussions = new Map();
    mentorships = new Map();
    reviewAssignments = new Map();
    rubrics = new Map();
    projects = new Map();
    constructor(samConfig, config) {
        this.samConfig = samConfig;
        this.config = {
            matchingAlgorithm: config?.matchingAlgorithm || 'WEIGHTED',
            defaultGroupSize: config?.defaultGroupSize || 5,
            maxGroupSize: config?.maxGroupSize || 20,
            reputationWeights: config?.reputationWeights || {
                helpfulness: 0.25,
                reliability: 0.2,
                expertise: 0.2,
                communication: 0.15,
                collaboration: 0.2,
            },
            reviewCalibrationEnabled: config?.reviewCalibrationEnabled ?? true,
            anonymousReviewsDefault: config?.anonymousReviewsDefault ?? false,
            mentoringEnabled: config?.mentoringEnabled ?? true,
            projectsEnabled: config?.projectsEnabled ?? true,
            gamificationEnabled: config?.gamificationEnabled ?? true,
        };
    }
    // ==========================================================================
    // Peer Profile Management
    // ==========================================================================
    /**
     * Create a new peer profile
     */
    createPeerProfile(input) {
        const now = new Date();
        const expertise = (input.expertise || []).map((e) => ({
            ...e,
            endorsements: [],
            isVerified: false,
        }));
        const learningGoals = (input.learningGoals || []).map((g) => ({
            ...g,
            id: generateId(),
            status: 'NOT_STARTED',
        }));
        const profile = {
            userId: input.userId,
            displayName: input.displayName,
            avatarUrl: input.avatarUrl,
            bio: input.bio,
            expertise,
            learningGoals,
            availability: input.availability
                ? { ...createDefaultAvailability(), ...input.availability }
                : createDefaultAvailability(),
            preferences: input.preferences
                ? { ...createDefaultPreferences(), ...input.preferences }
                : createDefaultPreferences(),
            stats: createDefaultStats(),
            badges: [],
            reputation: createDefaultReputation(),
            timezone: input.timezone,
            languages: input.languages || ['en'],
            isAvailableForMentoring: false,
            isSeekingMentor: false,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };
        this.profiles.set(input.userId, profile);
        return profile;
    }
    /**
     * Get a peer profile by user ID
     */
    getPeerProfile(userId) {
        return this.profiles.get(userId);
    }
    /**
     * Update a peer profile
     */
    updatePeerProfile(input) {
        const profile = this.profiles.get(input.userId);
        if (!profile) {
            throw new Error(`Profile not found for user: ${input.userId}`);
        }
        const updated = {
            ...profile,
            displayName: input.displayName ?? profile.displayName,
            avatarUrl: input.avatarUrl ?? profile.avatarUrl,
            bio: input.bio ?? profile.bio,
            timezone: input.timezone ?? profile.timezone,
            languages: input.languages ?? profile.languages,
            isAvailableForMentoring: input.isAvailableForMentoring ?? profile.isAvailableForMentoring,
            isSeekingMentor: input.isSeekingMentor ?? profile.isSeekingMentor,
            lastActiveAt: new Date(),
            updatedAt: new Date(),
        };
        this.profiles.set(input.userId, updated);
        return updated;
    }
    /**
     * Add expertise to a profile
     */
    addExpertise(userId, expertise) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found for user: ${userId}`);
        }
        const newExpertise = {
            ...expertise,
            endorsements: [],
            isVerified: false,
        };
        const updated = {
            ...profile,
            expertise: [...profile.expertise, newExpertise],
            updatedAt: new Date(),
        };
        this.profiles.set(userId, updated);
        return updated;
    }
    /**
     * Add a learning goal
     */
    addLearningGoal(userId, goal) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found for user: ${userId}`);
        }
        const newGoal = {
            ...goal,
            id: generateId(),
            status: 'NOT_STARTED',
        };
        const updated = {
            ...profile,
            learningGoals: [...profile.learningGoals, newGoal],
            updatedAt: new Date(),
        };
        this.profiles.set(userId, updated);
        return newGoal;
    }
    /**
     * Update learning goal status
     */
    updateLearningGoalStatus(userId, goalId, status) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found for user: ${userId}`);
        }
        const goalIndex = profile.learningGoals.findIndex((g) => g.id === goalId);
        if (goalIndex === -1) {
            throw new Error(`Goal not found: ${goalId}`);
        }
        const updatedGoal = {
            ...profile.learningGoals[goalIndex],
            status,
        };
        const updatedGoals = [...profile.learningGoals];
        updatedGoals[goalIndex] = updatedGoal;
        const updated = {
            ...profile,
            learningGoals: updatedGoals,
            updatedAt: new Date(),
        };
        this.profiles.set(userId, updated);
        return updatedGoal;
    }
    /**
     * Endorse a peer's expertise
     */
    endorseExpertise(endorserId, targetUserId, subject, message) {
        const endorserProfile = this.profiles.get(endorserId);
        const targetProfile = this.profiles.get(targetUserId);
        if (!endorserProfile) {
            throw new Error(`Endorser profile not found: ${endorserId}`);
        }
        if (!targetProfile) {
            throw new Error(`Target profile not found: ${targetUserId}`);
        }
        const expertiseIndex = targetProfile.expertise.findIndex((e) => e.subject === subject);
        if (expertiseIndex === -1) {
            throw new Error(`Expertise not found: ${subject}`);
        }
        const endorsement = {
            id: generateId(),
            endorserId,
            endorserName: endorserProfile.displayName,
            subject,
            message,
            createdAt: new Date(),
        };
        const updatedExpertise = [...targetProfile.expertise];
        updatedExpertise[expertiseIndex] = {
            ...updatedExpertise[expertiseIndex],
            endorsements: [
                ...updatedExpertise[expertiseIndex].endorsements,
                endorsement,
            ],
        };
        const updated = {
            ...targetProfile,
            expertise: updatedExpertise,
            updatedAt: new Date(),
        };
        this.profiles.set(targetUserId, updated);
        // Update reputation
        this.updateReputation(targetUserId, 5, 'ENDORSEMENT_RECEIVED', 'expertise');
        return endorsement;
    }
    /**
     * Update user reputation
     */
    updateReputation(userId, change, category, field) {
        const profile = this.profiles.get(userId);
        if (!profile)
            return;
        const reputationChange = {
            id: generateId(),
            change,
            reason: category,
            category,
            timestamp: new Date(),
        };
        const weights = this.config.reputationWeights;
        const newFieldValue = Math.max(0, Math.min(100, profile.reputation[field] + change));
        const newOverall = newFieldValue * (weights[field] || 0.2) +
            profile.reputation.helpfulness *
                (field === 'helpfulness' ? 0 : weights.helpfulness) +
            profile.reputation.reliability *
                (field === 'reliability' ? 0 : weights.reliability) +
            profile.reputation.expertise *
                (field === 'expertise' ? 0 : weights.expertise) +
            profile.reputation.communication *
                (field === 'communication' ? 0 : weights.communication) +
            profile.reputation.collaboration *
                (field === 'collaboration' ? 0 : weights.collaboration);
        const updated = {
            ...profile,
            reputation: {
                ...profile.reputation,
                [field]: newFieldValue,
                overall: Math.round(newOverall),
                history: [...profile.reputation.history.slice(-99), reputationChange],
            },
            updatedAt: new Date(),
        };
        this.profiles.set(userId, updated);
        // Check for badge eligibility
        if (this.config.gamificationEnabled) {
            this.checkBadgeEligibility(userId);
        }
    }
    /**
     * Award a badge to a user
     */
    awardBadge(userId, name, description, category, tier, icon) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found for user: ${userId}`);
        }
        // Check if already has this badge
        const existingBadge = profile.badges.find((b) => b.name === name && b.tier === tier);
        if (existingBadge) {
            return existingBadge;
        }
        const badge = {
            id: generateId(),
            name,
            description,
            icon,
            category,
            tier,
            earnedAt: new Date(),
        };
        const updated = {
            ...profile,
            badges: [...profile.badges, badge],
            updatedAt: new Date(),
        };
        this.profiles.set(userId, updated);
        this.updateReputation(userId, 10, 'BADGE_EARNED', 'helpfulness');
        return badge;
    }
    /**
     * Check and award badges based on stats
     */
    checkBadgeEligibility(userId) {
        const profile = this.profiles.get(userId);
        if (!profile)
            return;
        const stats = profile.stats;
        // Helper badge tiers
        if (stats.peersHelped >= 100 && !this.hasBadge(userId, 'Master Helper')) {
            this.awardBadge(userId, 'Master Helper', 'Helped 100+ peers', 'HELPER', 'DIAMOND', 'diamond-helper');
        }
        else if (stats.peersHelped >= 50 && !this.hasBadge(userId, 'Expert Helper')) {
            this.awardBadge(userId, 'Expert Helper', 'Helped 50+ peers', 'HELPER', 'GOLD', 'gold-helper');
        }
        else if (stats.peersHelped >= 10 && !this.hasBadge(userId, 'Active Helper')) {
            this.awardBadge(userId, 'Active Helper', 'Helped 10+ peers', 'HELPER', 'BRONZE', 'bronze-helper');
        }
        // Collaborator badges
        if (stats.groupsJoined >= 20 && !this.hasBadge(userId, 'Super Collaborator')) {
            this.awardBadge(userId, 'Super Collaborator', 'Joined 20+ study groups', 'COLLABORATOR', 'GOLD', 'gold-collab');
        }
        // Session badges
        if (stats.totalSessions >= 100 && !this.hasBadge(userId, 'Session Master')) {
            this.awardBadge(userId, 'Session Master', 'Completed 100+ sessions', 'LEARNER', 'PLATINUM', 'platinum-session');
        }
    }
    hasBadge(userId, badgeName) {
        const profile = this.profiles.get(userId);
        return profile?.badges.some((b) => b.name === badgeName) ?? false;
    }
    // ==========================================================================
    // Peer Matching
    // ==========================================================================
    /**
     * Find peer matches based on criteria
     */
    findPeerMatches(input) {
        const startTime = Date.now();
        const { userId, criteria } = input;
        const userProfile = this.profiles.get(userId);
        if (!userProfile) {
            throw new Error(`Profile not found for user: ${userId}`);
        }
        const candidates = [];
        const excludeIds = new Set([userId, ...(criteria.excludeUserIds || [])]);
        for (const [candidateId, candidateProfile] of this.profiles) {
            if (excludeIds.has(candidateId))
                continue;
            // Filter by minimum reputation
            if (criteria.minReputationScore &&
                candidateProfile.reputation.overall < criteria.minReputationScore) {
                continue;
            }
            // Filter by timezone
            if (criteria.timezone && candidateProfile.timezone !== criteria.timezone) {
                continue;
            }
            // Filter by languages
            if (criteria.languages?.length &&
                !criteria.languages.some((l) => candidateProfile.languages.includes(l))) {
                continue;
            }
            // Check match type compatibility
            if (!this.isMatchTypeCompatible(criteria.matchType, candidateProfile)) {
                continue;
            }
            // Check subject/topic relevance
            if (criteria.subjects?.length || criteria.topics?.length) {
                const hasRelevantExpertise = candidateProfile.expertise.some((e) => criteria.subjects?.includes(e.subject) ||
                    (criteria.topics?.length &&
                        criteria.topics.some((t) => e.topic === t)));
                const hasRelevantGoals = candidateProfile.learningGoals.some((g) => criteria.subjects?.includes(g.subject) ||
                    (criteria.topics?.length &&
                        criteria.topics.some((t) => g.topic === t)));
                if (!hasRelevantExpertise && !hasRelevantGoals) {
                    continue;
                }
            }
            // Calculate match score
            const matchScore = this.calculateMatchScore(userProfile, candidateProfile, criteria);
            const matchReasons = this.getMatchReasons(userProfile, candidateProfile, criteria);
            const complementarySkills = findComplementarySkills(userProfile, candidateProfile);
            const availabilityOverlap = calculateAvailabilityOverlap(userProfile.availability, candidateProfile.availability);
            const compatibilityFactors = this.getCompatibilityFactors(userProfile, candidateProfile);
            const commonSubjects = userProfile.expertise
                .filter((e) => candidateProfile.expertise.some((ce) => ce.subject === e.subject))
                .map((e) => e.subject);
            candidates.push({
                peerId: candidateId,
                peerProfile: candidateProfile,
                matchScore,
                matchReasons,
                commonSubjects,
                complementarySkills,
                availabilityOverlap,
                compatibilityFactors,
            });
        }
        // Sort by match score
        candidates.sort((a, b) => b.matchScore - a.matchScore);
        // Apply limit
        const limit = criteria.limit || 10;
        const matches = candidates.slice(0, limit);
        return {
            matches,
            totalCandidates: candidates.length,
            matchingTime: Date.now() - startTime,
            criteria,
        };
    }
    isMatchTypeCompatible(matchType, profile) {
        switch (matchType) {
            case 'MENTOR':
                return profile.isAvailableForMentoring;
            case 'MENTEE':
                return profile.isSeekingMentor;
            case 'TUTOR':
                return profile.isAvailableForMentoring;
            case 'TUTEE':
                return profile.isSeekingMentor;
            default:
                return true;
        }
    }
    calculateMatchScore(userProfile, candidateProfile, criteria) {
        let score = 0;
        // Expertise alignment (40%)
        const expertiseScore = this.calculateExpertiseAlignment(userProfile, candidateProfile, criteria);
        score += expertiseScore * 0.4;
        // Compatibility (30%)
        const compatibilityScore = calculateCompatibilityScore(userProfile, candidateProfile, criteria);
        score += compatibilityScore * 0.3;
        // Availability overlap (20%)
        const availabilityScore = calculateAvailabilityOverlap(userProfile.availability, candidateProfile.availability) / 100;
        score += availabilityScore * 0.2;
        // Reputation (10%)
        const reputationScore = candidateProfile.reputation.overall / 100;
        score += Math.min(1, reputationScore) * 0.1;
        return Math.round(score * 100);
    }
    calculateExpertiseAlignment(userProfile, candidateProfile, criteria) {
        if (!criteria.subjects?.length && !criteria.topics?.length) {
            return 0.5; // Neutral if no specific requirements
        }
        let matches = 0;
        let total = 0;
        for (const subject of criteria.subjects || []) {
            total++;
            const candidateExp = candidateProfile.expertise.find((e) => e.subject === subject);
            if (candidateExp) {
                matches++;
                // Bonus for higher proficiency
                if (criteria.matchType === 'MENTOR' ||
                    criteria.matchType === 'TUTOR') {
                    matches +=
                        (proficiencyToNumber(candidateExp.proficiencyLevel) - 1) / 4;
                }
            }
        }
        return total > 0 ? Math.min(1, matches / total) : 0.5;
    }
    getMatchReasons(userProfile, candidateProfile, criteria) {
        const reasons = [];
        // Check for common subjects
        const commonSubjects = userProfile.expertise.filter((e) => candidateProfile.expertise.some((ce) => ce.subject === e.subject));
        if (commonSubjects.length > 0) {
            reasons.push({
                factor: 'common_subjects',
                description: `Shares expertise in ${commonSubjects.map((s) => s.subject).join(', ')}`,
                weight: 0.3,
                score: 0.8,
            });
        }
        // Check timezone match
        if (userProfile.timezone === candidateProfile.timezone) {
            reasons.push({
                factor: 'same_timezone',
                description: 'Same timezone for convenient scheduling',
                weight: 0.15,
                score: 1.0,
            });
        }
        // Check language match
        const commonLanguages = userProfile.languages.filter((l) => candidateProfile.languages.includes(l));
        if (commonLanguages.length > 0) {
            reasons.push({
                factor: 'common_languages',
                description: `Common languages: ${commonLanguages.join(', ')}`,
                weight: 0.2,
                score: 0.9,
            });
        }
        // High reputation
        if (candidateProfile.reputation.overall >= 80) {
            reasons.push({
                factor: 'high_reputation',
                description: 'Highly rated by other peers',
                weight: 0.15,
                score: candidateProfile.reputation.overall / 100,
            });
        }
        // Complementary skills
        const complementary = findComplementarySkills(userProfile, candidateProfile);
        if (complementary.some((c) => c.direction === 'CAN_LEARN')) {
            reasons.push({
                factor: 'can_learn',
                description: 'Has expertise you can learn from',
                weight: 0.2,
                score: 0.85,
            });
        }
        return reasons;
    }
    getCompatibilityFactors(profile1, profile2) {
        const factors = [];
        // Learning style
        const learningStyleMatch = profile1.preferences.learningStyle === profile2.preferences.learningStyle
            ? 1
            : profile1.preferences.learningStyle === 'MIXED' ||
                profile2.preferences.learningStyle === 'MIXED'
                ? 0.7
                : 0.4;
        factors.push({
            name: 'Learning Style',
            compatibility: learningStyleMatch,
            importance: 0.15,
        });
        // Communication style
        const commStyleMatch = profile1.preferences.communicationStyle ===
            profile2.preferences.communicationStyle
            ? 1
            : 0.6;
        factors.push({
            name: 'Communication Style',
            compatibility: commStyleMatch,
            importance: 0.15,
        });
        // Session format
        const commonFormats = profile1.preferences.sessionFormat.filter((f) => profile2.preferences.sessionFormat.includes(f));
        const formatMatch = commonFormats.length > 0
            ? commonFormats.length /
                Math.max(profile1.preferences.sessionFormat.length, profile2.preferences.sessionFormat.length)
            : 0;
        factors.push({
            name: 'Session Format',
            compatibility: formatMatch,
            importance: 0.2,
        });
        // Group size preference
        const groupMatch = profile1.preferences.preferredGroupSize ===
            profile2.preferences.preferredGroupSize ||
            profile1.preferences.preferredGroupSize === 'ANY' ||
            profile2.preferences.preferredGroupSize === 'ANY'
            ? 1
            : 0.5;
        factors.push({
            name: 'Group Size Preference',
            compatibility: groupMatch,
            importance: 0.1,
        });
        return factors;
    }
    // ==========================================================================
    // Study Group Management
    // ==========================================================================
    /**
     * Create a new study group
     */
    createStudyGroup(input) {
        const now = new Date();
        const owner = this.profiles.get(input.ownerId);
        if (!owner) {
            throw new Error(`Owner profile not found: ${input.ownerId}`);
        }
        const ownerMember = {
            userId: input.ownerId,
            displayName: owner.displayName,
            avatarUrl: owner.avatarUrl,
            role: 'OWNER',
            joinedAt: now,
            lastActiveAt: now,
            contributions: 0,
            attendance: {
                totalSessions: 0,
                attendedSessions: 0,
                attendanceRate: 100,
                streakDays: 0,
            },
        };
        const goals = (input.goals || []).map((g) => ({
            ...g,
            id: generateId(),
            progress: 0,
            milestones: [],
            status: 'NOT_STARTED',
        }));
        const schedule = input.schedule
            ? {
                frequency: input.schedule.frequency || 'WEEKLY',
                dayOfWeek: input.schedule.dayOfWeek,
                timeOfDay: input.schedule.timeOfDay || '10:00',
                duration: input.schedule.duration || 60,
                timezone: input.schedule.timezone || 'UTC',
                recurrenceRule: input.schedule.recurrenceRule,
            }
            : undefined;
        const group = {
            id: generateId(),
            name: input.name,
            description: input.description,
            subject: input.subject,
            topics: input.topics || [],
            coverImageUrl: input.coverImageUrl,
            type: input.type || 'STUDY_GROUP',
            visibility: input.visibility || 'PUBLIC',
            status: 'FORMING',
            members: [ownerMember],
            maxMembers: input.maxMembers || this.config.defaultGroupSize,
            minMembers: input.minMembers,
            owner: ownerMember,
            moderators: [],
            schedule,
            goals,
            rules: input.rules,
            tags: input.tags || [],
            resources: [],
            sessions: [],
            discussions: [],
            stats: {
                totalSessions: 0,
                totalStudyHours: 0,
                averageAttendance: 100,
                goalsCompleted: 0,
                resourcesShared: 0,
                discussionPosts: 0,
                activeStreak: 0,
                memberGrowth: 0,
            },
            settings: input.settings
                ? { ...createDefaultGroupSettings(), ...input.settings }
                : createDefaultGroupSettings(),
            inviteCode: this.generateInviteCode(),
            createdAt: now,
            updatedAt: now,
        };
        this.groups.set(group.id, group);
        // Update owner stats
        const updatedOwner = {
            ...owner,
            stats: {
                ...owner.stats,
                groupsCreated: owner.stats.groupsCreated + 1,
                groupsJoined: owner.stats.groupsJoined + 1,
            },
            updatedAt: now,
        };
        this.profiles.set(input.ownerId, updatedOwner);
        return group;
    }
    /**
     * Get a study group by ID
     */
    getStudyGroup(groupId) {
        return this.groups.get(groupId);
    }
    /**
     * Search for study groups
     */
    searchStudyGroups(options) {
        let groups = Array.from(this.groups.values());
        // Filter by visibility (only public unless user is a member)
        if (options.visibility) {
            groups = groups.filter((g) => g.visibility === options.visibility);
        }
        else {
            groups = groups.filter((g) => g.visibility === 'PUBLIC' || g.visibility === 'INVITE_ONLY');
        }
        // Filter by subject
        if (options.subject) {
            groups = groups.filter((g) => g.subject.toLowerCase().includes(options.subject.toLowerCase()));
        }
        // Filter by topics
        if (options.topics?.length) {
            groups = groups.filter((g) => options.topics.some((t) => g.topics.includes(t)));
        }
        // Filter by type
        if (options.type) {
            groups = groups.filter((g) => g.type === options.type);
        }
        // Filter by status
        if (options.status) {
            groups = groups.filter((g) => g.status === options.status);
        }
        // Filter by query (name/description)
        if (options.query) {
            const queryLower = options.query.toLowerCase();
            groups = groups.filter((g) => g.name.toLowerCase().includes(queryLower) ||
                g.description.toLowerCase().includes(queryLower));
        }
        const totalCount = groups.length;
        const offset = options.offset || 0;
        const limit = options.limit || 20;
        const paginatedGroups = groups.slice(offset, offset + limit);
        return {
            groups: paginatedGroups,
            totalCount,
            hasMore: offset + limit < totalCount,
        };
    }
    /**
     * Request to join a study group
     */
    joinGroup(input) {
        const group = this.groups.get(input.groupId);
        if (!group) {
            throw new Error(`Group not found: ${input.groupId}`);
        }
        const profile = this.profiles.get(input.userId);
        if (!profile) {
            throw new Error(`Profile not found: ${input.userId}`);
        }
        // Check if already a member
        if (group.members.some((m) => m.userId === input.userId)) {
            throw new Error('Already a member of this group');
        }
        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            throw new Error('Group is full');
        }
        // Check visibility/join rules
        if (group.visibility === 'SECRET') {
            throw new Error('Cannot join secret groups directly');
        }
        const now = new Date();
        const newMember = {
            userId: input.userId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            role: 'MEMBER',
            joinedAt: now,
            lastActiveAt: now,
            contributions: 0,
            attendance: {
                totalSessions: 0,
                attendedSessions: 0,
                attendanceRate: 100,
                streakDays: 0,
            },
        };
        const updated = {
            ...group,
            members: [...group.members, newMember],
            status: group.members.length + 1 >= (group.minMembers || 2) ? 'ACTIVE' : group.status,
            updatedAt: now,
        };
        this.groups.set(input.groupId, updated);
        // Update member stats
        const updatedProfile = {
            ...profile,
            stats: {
                ...profile.stats,
                groupsJoined: profile.stats.groupsJoined + 1,
            },
            updatedAt: now,
        };
        this.profiles.set(input.userId, updatedProfile);
        return newMember;
    }
    /**
     * Leave a study group
     */
    leaveGroup(groupId, userId) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group not found: ${groupId}`);
        }
        const memberIndex = group.members.findIndex((m) => m.userId === userId);
        if (memberIndex === -1) {
            throw new Error('Not a member of this group');
        }
        const member = group.members[memberIndex];
        // Owner cannot leave without transferring ownership
        if (member.role === 'OWNER') {
            throw new Error('Owner cannot leave. Transfer ownership first.');
        }
        const updatedMembers = group.members.filter((m) => m.userId !== userId);
        const updatedModerators = group.moderators.filter((m) => m.userId !== userId);
        const updated = {
            ...group,
            members: updatedMembers,
            moderators: updatedModerators,
            updatedAt: new Date(),
        };
        this.groups.set(groupId, updated);
    }
    /**
     * Create a group session
     */
    createGroupSession(input) {
        const group = this.groups.get(input.groupId);
        if (!group) {
            throw new Error(`Group not found: ${input.groupId}`);
        }
        const agenda = (input.agenda || []).map((a) => ({
            ...a,
            id: generateId(),
            isCompleted: false,
        }));
        const facilitator = input.facilitatorId
            ? group.members.find((m) => m.userId === input.facilitatorId)
            : undefined;
        const session = {
            id: generateId(),
            title: input.title,
            description: input.description,
            scheduledAt: input.scheduledAt,
            duration: input.duration,
            status: 'SCHEDULED',
            type: input.type || 'STUDY_SESSION',
            facilitator,
            attendees: group.members.map((m) => ({
                userId: m.userId,
                displayName: m.displayName,
                status: 'INVITED',
            })),
            agenda,
            createdBy: input.createdBy,
            createdAt: new Date(),
        };
        const updated = {
            ...group,
            sessions: [...group.sessions, session],
            updatedAt: new Date(),
        };
        this.groups.set(input.groupId, updated);
        return session;
    }
    /**
     * Update session status
     */
    updateSessionStatus(groupId, sessionId, status) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group not found: ${groupId}`);
        }
        const sessionIndex = group.sessions.findIndex((s) => s.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const updatedSession = {
            ...group.sessions[sessionIndex],
            status,
        };
        const updatedSessions = [...group.sessions];
        updatedSessions[sessionIndex] = updatedSession;
        const updated = {
            ...group,
            sessions: updatedSessions,
            stats: status === 'COMPLETED'
                ? {
                    ...group.stats,
                    totalSessions: group.stats.totalSessions + 1,
                    totalStudyHours: group.stats.totalStudyHours +
                        (updatedSession.actualDuration || updatedSession.duration) / 60,
                }
                : group.stats,
            updatedAt: new Date(),
        };
        this.groups.set(groupId, updated);
        // Update member session stats if completed
        if (status === 'COMPLETED') {
            for (const attendee of updatedSession.attendees) {
                if (attendee.status === 'ATTENDED') {
                    const profile = this.profiles.get(attendee.userId);
                    if (profile) {
                        const updatedProfile = {
                            ...profile,
                            stats: {
                                ...profile.stats,
                                totalSessions: profile.stats.totalSessions + 1,
                                totalStudyHours: profile.stats.totalStudyHours +
                                    (updatedSession.actualDuration || updatedSession.duration) /
                                        60,
                            },
                            updatedAt: new Date(),
                        };
                        this.profiles.set(attendee.userId, updatedProfile);
                    }
                }
            }
        }
        return updatedSession;
    }
    /**
     * Add a resource to a group
     */
    addGroupResource(groupId, resource) {
        const group = this.groups.get(groupId);
        if (!group) {
            throw new Error(`Group not found: ${groupId}`);
        }
        const newResource = {
            ...resource,
            id: generateId(),
            uploadedAt: new Date(),
            downloads: 0,
            likes: 0,
        };
        const updated = {
            ...group,
            resources: [...group.resources, newResource],
            stats: {
                ...group.stats,
                resourcesShared: group.stats.resourcesShared + 1,
            },
            updatedAt: new Date(),
        };
        this.groups.set(groupId, updated);
        return newResource;
    }
    generateInviteCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    // ==========================================================================
    // Discussion Forum
    // ==========================================================================
    /**
     * Create a discussion thread
     */
    createDiscussion(input) {
        const profile = this.profiles.get(input.authorId);
        if (!profile) {
            throw new Error(`Profile not found: ${input.authorId}`);
        }
        const author = {
            userId: input.authorId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            reputation: profile.reputation.overall,
        };
        const now = new Date();
        const thread = {
            id: generateId(),
            title: input.title,
            content: input.content,
            author,
            type: input.type || 'DISCUSSION',
            status: input.type === 'QUESTION' ? 'OPEN' : 'OPEN',
            tags: input.tags || [],
            replies: [],
            views: 0,
            likes: 0,
            isPinned: false,
            isLocked: false,
            groupId: input.groupId,
            courseId: input.courseId,
            createdAt: now,
            updatedAt: now,
        };
        this.discussions.set(thread.id, thread);
        // Update group if applicable
        if (input.groupId) {
            const group = this.groups.get(input.groupId);
            if (group) {
                const updated = {
                    ...group,
                    discussions: [...group.discussions, thread],
                    stats: {
                        ...group.stats,
                        discussionPosts: group.stats.discussionPosts + 1,
                    },
                    updatedAt: now,
                };
                this.groups.set(input.groupId, updated);
            }
        }
        // Update author stats
        if (input.type === 'QUESTION') {
            const updatedProfile = {
                ...profile,
                stats: {
                    ...profile.stats,
                    questionsAsked: profile.stats.questionsAsked + 1,
                },
                updatedAt: now,
            };
            this.profiles.set(input.authorId, updatedProfile);
        }
        return thread;
    }
    /**
     * Get a discussion thread
     */
    getDiscussion(threadId) {
        const thread = this.discussions.get(threadId);
        if (thread) {
            // Increment view count
            const updated = {
                ...thread,
                views: thread.views + 1,
            };
            this.discussions.set(threadId, updated);
            return updated;
        }
        return undefined;
    }
    /**
     * Reply to a discussion
     */
    createReply(input) {
        const thread = this.discussions.get(input.threadId);
        if (!thread) {
            throw new Error(`Thread not found: ${input.threadId}`);
        }
        if (thread.isLocked) {
            throw new Error('Thread is locked');
        }
        const profile = this.profiles.get(input.authorId);
        if (!profile) {
            throw new Error(`Profile not found: ${input.authorId}`);
        }
        const author = {
            userId: input.authorId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            reputation: profile.reputation.overall,
        };
        const now = new Date();
        const reply = {
            id: generateId(),
            content: input.content,
            author,
            parentId: input.parentId,
            likes: 0,
            isAcceptedAnswer: false,
            isEdited: false,
            reactions: [],
            createdAt: now,
            updatedAt: now,
        };
        const updated = {
            ...thread,
            replies: [...thread.replies, reply],
            updatedAt: now,
        };
        this.discussions.set(input.threadId, updated);
        // Update author stats
        if (thread.type === 'QUESTION') {
            const updatedProfile = {
                ...profile,
                stats: {
                    ...profile.stats,
                    questionsAnswered: profile.stats.questionsAnswered + 1,
                },
                updatedAt: now,
            };
            this.profiles.set(input.authorId, updatedProfile);
        }
        return reply;
    }
    /**
     * Accept an answer
     */
    acceptAnswer(threadId, replyId, userId) {
        const thread = this.discussions.get(threadId);
        if (!thread) {
            throw new Error(`Thread not found: ${threadId}`);
        }
        // Only thread author can accept answer
        if (thread.author.userId !== userId) {
            throw new Error('Only thread author can accept an answer');
        }
        const replyIndex = thread.replies.findIndex((r) => r.id === replyId);
        if (replyIndex === -1) {
            throw new Error(`Reply not found: ${replyId}`);
        }
        // Unaccept previous answer if any
        const updatedReplies = thread.replies.map((r) => ({
            ...r,
            isAcceptedAnswer: r.id === replyId,
        }));
        const acceptedReply = updatedReplies[replyIndex];
        const updated = {
            ...thread,
            replies: updatedReplies,
            acceptedAnswerId: replyId,
            status: 'ANSWERED',
            updatedAt: new Date(),
        };
        this.discussions.set(threadId, updated);
        // Update answerer reputation
        this.updateReputation(acceptedReply.author.userId, 15, 'ANSWER_ACCEPTED', 'helpfulness');
        // Update answerer stats
        const answererProfile = this.profiles.get(acceptedReply.author.userId);
        if (answererProfile) {
            const updatedProfile = {
                ...answererProfile,
                stats: {
                    ...answererProfile.stats,
                    helpfulAnswers: answererProfile.stats.helpfulAnswers + 1,
                    peersHelped: answererProfile.stats.peersHelped + 1,
                },
                updatedAt: new Date(),
            };
            this.profiles.set(acceptedReply.author.userId, updatedProfile);
        }
        return acceptedReply;
    }
    /**
     * Add reaction to a reply
     */
    addReaction(threadId, replyId, userId, reactionType) {
        const thread = this.discussions.get(threadId);
        if (!thread) {
            throw new Error(`Thread not found: ${threadId}`);
        }
        const replyIndex = thread.replies.findIndex((r) => r.id === replyId);
        if (replyIndex === -1) {
            throw new Error(`Reply not found: ${replyId}`);
        }
        const reply = thread.replies[replyIndex];
        let updatedReactions = [...reply.reactions];
        const existingReactionIndex = updatedReactions.findIndex((r) => r.type === reactionType);
        if (existingReactionIndex >= 0) {
            const existingReaction = updatedReactions[existingReactionIndex];
            if (existingReaction.userIds.includes(userId)) {
                // Remove reaction
                updatedReactions[existingReactionIndex] = {
                    ...existingReaction,
                    count: existingReaction.count - 1,
                    userIds: existingReaction.userIds.filter((id) => id !== userId),
                };
                if (updatedReactions[existingReactionIndex].count === 0) {
                    updatedReactions = updatedReactions.filter((_, i) => i !== existingReactionIndex);
                }
            }
            else {
                // Add to existing reaction
                updatedReactions[existingReactionIndex] = {
                    ...existingReaction,
                    count: existingReaction.count + 1,
                    userIds: [...existingReaction.userIds, userId],
                };
            }
        }
        else {
            // New reaction
            updatedReactions.push({
                type: reactionType,
                count: 1,
                userIds: [userId],
            });
        }
        const updatedReplies = [...thread.replies];
        updatedReplies[replyIndex] = {
            ...reply,
            reactions: updatedReactions,
        };
        const updated = {
            ...thread,
            replies: updatedReplies,
            updatedAt: new Date(),
        };
        this.discussions.set(threadId, updated);
        return updatedReactions.find((r) => r.type === reactionType) || {
            type: reactionType,
            count: 0,
            userIds: [],
        };
    }
    /**
     * Search discussions
     */
    searchDiscussions(options) {
        let threads = Array.from(this.discussions.values());
        if (options.type) {
            threads = threads.filter((t) => t.type === options.type);
        }
        if (options.status) {
            threads = threads.filter((t) => t.status === options.status);
        }
        if (options.tags?.length) {
            threads = threads.filter((t) => options.tags.some((tag) => t.tags.includes(tag)));
        }
        if (options.groupId) {
            threads = threads.filter((t) => t.groupId === options.groupId);
        }
        if (options.courseId) {
            threads = threads.filter((t) => t.courseId === options.courseId);
        }
        if (options.query) {
            const queryLower = options.query.toLowerCase();
            threads = threads.filter((t) => t.title.toLowerCase().includes(queryLower) ||
                t.content.toLowerCase().includes(queryLower));
        }
        // Sort by most recent
        threads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const totalCount = threads.length;
        const offset = options.offset || 0;
        const limit = options.limit || 20;
        const paginatedThreads = threads.slice(offset, offset + limit);
        return {
            threads: paginatedThreads,
            totalCount,
            hasMore: offset + limit < totalCount,
        };
    }
    // ==========================================================================
    // Mentorship
    // ==========================================================================
    /**
     * Request mentorship
     */
    requestMentorship(input) {
        if (!this.config.mentoringEnabled) {
            throw new Error('Mentoring is not enabled');
        }
        const mentorProfile = this.profiles.get(input.mentorId);
        const menteeProfile = this.profiles.get(input.menteeId);
        if (!mentorProfile) {
            throw new Error(`Mentor profile not found: ${input.mentorId}`);
        }
        if (!menteeProfile) {
            throw new Error(`Mentee profile not found: ${input.menteeId}`);
        }
        if (!mentorProfile.isAvailableForMentoring) {
            throw new Error('Mentor is not available for mentoring');
        }
        const now = new Date();
        const mentor = {
            userId: input.mentorId,
            displayName: mentorProfile.displayName,
            avatarUrl: mentorProfile.avatarUrl,
            bio: mentorProfile.bio || '',
            expertise: mentorProfile.expertise,
            mentoringStyle: 'COLLABORATIVE',
            totalMentees: 0,
            activeMentees: 0,
            successfulMentorships: 0,
            rating: mentorProfile.reputation.overall / 20,
            testimonials: [],
            availability: mentorProfile.availability,
            maxMentees: 5,
        };
        const mentee = {
            userId: input.menteeId,
            displayName: menteeProfile.displayName,
            avatarUrl: menteeProfile.avatarUrl,
            bio: menteeProfile.bio || '',
            learningGoals: menteeProfile.learningGoals,
            currentLevel: 'BEGINNER',
            previousMentorships: 0,
            commitment: 'MEDIUM',
        };
        const goals = (input.goals || []).map((g) => ({
            ...g,
            id: generateId(),
            progress: 0,
            milestones: [],
            status: 'NOT_STARTED',
        }));
        const mentorship = {
            id: generateId(),
            mentorId: input.mentorId,
            menteeId: input.menteeId,
            mentor,
            mentee,
            status: 'PENDING',
            type: input.type || 'FORMAL',
            subjects: input.subjects,
            goals,
            sessions: [],
            feedback: [],
            startDate: now,
            createdAt: now,
            updatedAt: now,
        };
        this.mentorships.set(mentorship.id, mentorship);
        return mentorship;
    }
    /**
     * Get a mentorship by ID
     */
    getMentorship(mentorshipId) {
        return this.mentorships.get(mentorshipId);
    }
    /**
     * Update mentorship status
     */
    updateMentorshipStatus(mentorshipId, status, userId) {
        const mentorship = this.mentorships.get(mentorshipId);
        if (!mentorship) {
            throw new Error(`Mentorship not found: ${mentorshipId}`);
        }
        // Only mentor can accept/reject
        if ((status === 'ACTIVE' || status === 'TERMINATED') &&
            userId !== mentorship.mentorId) {
            throw new Error('Only mentor can accept or reject mentorship');
        }
        const updated = {
            ...mentorship,
            status,
            actualEndDate: status === 'COMPLETED' || status === 'TERMINATED'
                ? new Date()
                : undefined,
            updatedAt: new Date(),
        };
        this.mentorships.set(mentorshipId, updated);
        return updated;
    }
    /**
     * Schedule a mentoring session
     */
    scheduleMentoringSession(mentorshipId, session) {
        const mentorship = this.mentorships.get(mentorshipId);
        if (!mentorship) {
            throw new Error(`Mentorship not found: ${mentorshipId}`);
        }
        const newSession = {
            ...session,
            id: generateId(),
            mentorshipId,
            createdAt: new Date(),
        };
        const updated = {
            ...mentorship,
            sessions: [...mentorship.sessions, newSession],
            updatedAt: new Date(),
        };
        this.mentorships.set(mentorshipId, updated);
        return newSession;
    }
    /**
     * Complete a mentoring session
     */
    completeMentoringSession(mentorshipId, sessionId, actualDuration, notes, feedback) {
        const mentorship = this.mentorships.get(mentorshipId);
        if (!mentorship) {
            throw new Error(`Mentorship not found: ${mentorshipId}`);
        }
        const sessionIndex = mentorship.sessions.findIndex((s) => s.id === sessionId);
        if (sessionIndex === -1) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const updatedSession = {
            ...mentorship.sessions[sessionIndex],
            status: 'COMPLETED',
            actualDuration,
            notes,
            feedback,
        };
        const updatedSessions = [...mentorship.sessions];
        updatedSessions[sessionIndex] = updatedSession;
        const updated = {
            ...mentorship,
            sessions: updatedSessions,
            updatedAt: new Date(),
        };
        this.mentorships.set(mentorshipId, updated);
        // Update session stats for both mentor and mentee
        for (const userId of [mentorship.mentorId, mentorship.menteeId]) {
            const profile = this.profiles.get(userId);
            if (profile) {
                const updatedProfile = {
                    ...profile,
                    stats: {
                        ...profile.stats,
                        totalSessions: profile.stats.totalSessions + 1,
                        totalStudyHours: profile.stats.totalStudyHours + actualDuration / 60,
                    },
                    updatedAt: new Date(),
                };
                this.profiles.set(userId, updatedProfile);
            }
        }
        // Update reputation based on feedback
        if (feedback) {
            const reputationChange = Math.round((feedback.rating - 3) * 5);
            this.updateReputation(mentorship.mentorId, reputationChange, 'SESSION_COMPLETED', 'helpfulness');
        }
        return updatedSession;
    }
    /**
     * Add mentorship feedback
     */
    addMentorshipFeedback(mentorshipId, feedback) {
        const mentorship = this.mentorships.get(mentorshipId);
        if (!mentorship) {
            throw new Error(`Mentorship not found: ${mentorshipId}`);
        }
        const newFeedback = {
            ...feedback,
            id: generateId(),
            createdAt: new Date(),
        };
        const updated = {
            ...mentorship,
            feedback: [...mentorship.feedback, newFeedback],
            updatedAt: new Date(),
        };
        this.mentorships.set(mentorshipId, updated);
        // Update reputation based on feedback
        const reputationChange = Math.round((feedback.rating - 3) * 5);
        const category = feedback.rating >= 4 ? 'POSITIVE_FEEDBACK' : 'NEGATIVE_FEEDBACK';
        this.updateReputation(feedback.toUserId, reputationChange, category, feedback.type === 'MENTEE_TO_MENTOR' ? 'helpfulness' : 'communication');
        return newFeedback;
    }
    /**
     * Search for mentors
     */
    searchMentors(options) {
        let profiles = Array.from(this.profiles.values()).filter((p) => p.isAvailableForMentoring);
        if (options.subjects?.length) {
            profiles = profiles.filter((p) => p.expertise.some((e) => options.subjects.includes(e.subject)));
        }
        if (options.proficiencyLevel) {
            const minLevel = proficiencyToNumber(options.proficiencyLevel);
            profiles = profiles.filter((p) => p.expertise.some((e) => proficiencyToNumber(e.proficiencyLevel) >= minLevel));
        }
        if (options.minRating) {
            profiles = profiles.filter((p) => p.reputation.overall / 20 >= options.minRating);
        }
        // Convert to mentor profiles
        const mentors = profiles.map((p) => ({
            userId: p.userId,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            bio: p.bio || '',
            expertise: p.expertise,
            mentoringStyle: 'COLLABORATIVE',
            totalMentees: 0,
            activeMentees: 0,
            successfulMentorships: 0,
            rating: p.reputation.overall / 20,
            testimonials: [],
            availability: p.availability,
            maxMentees: 5,
        }));
        // Sort by rating
        mentors.sort((a, b) => b.rating - a.rating);
        const totalCount = mentors.length;
        const offset = options.offset || 0;
        const limit = options.limit || 20;
        const paginatedMentors = mentors.slice(offset, offset + limit);
        return {
            mentors: paginatedMentors,
            totalCount,
            hasMore: offset + limit < totalCount,
        };
    }
    // ==========================================================================
    // Peer Review
    // ==========================================================================
    /**
     * Create a peer review rubric
     */
    createReviewRubric(rubric) {
        const newRubric = {
            ...rubric,
            id: generateId(),
        };
        this.rubrics.set(newRubric.id, newRubric);
        return newRubric;
    }
    /**
     * Get a review rubric
     */
    getReviewRubric(rubricId) {
        return this.rubrics.get(rubricId);
    }
    /**
     * Create a peer review assignment
     */
    createPeerReviewAssignment(input, submission) {
        const rubric = this.rubrics.get(input.rubricId);
        if (!rubric) {
            throw new Error(`Rubric not found: ${input.rubricId}`);
        }
        const reviewer = this.profiles.get(input.reviewerId);
        if (!reviewer) {
            throw new Error(`Reviewer profile not found: ${input.reviewerId}`);
        }
        const assignment = {
            id: generateId(),
            title: input.title,
            description: input.description,
            type: input.type || 'SINGLE_BLIND',
            submissionId: input.submissionId,
            submission: input.type === 'DOUBLE_BLIND'
                ? { ...submission, authorName: undefined }
                : submission,
            reviewerId: input.reviewerId,
            reviewer,
            rubric,
            status: 'ASSIGNED',
            dueDate: input.dueDate,
            assignedAt: new Date(),
        };
        this.reviewAssignments.set(assignment.id, assignment);
        return assignment;
    }
    /**
     * Get a peer review assignment
     */
    getPeerReviewAssignment(assignmentId) {
        return this.reviewAssignments.get(assignmentId);
    }
    /**
     * Submit a peer review
     */
    submitPeerReview(input) {
        const assignment = this.reviewAssignments.get(input.assignmentId);
        if (!assignment) {
            throw new Error(`Assignment not found: ${input.assignmentId}`);
        }
        if (assignment.reviewerId !== input.reviewerId) {
            throw new Error('Not authorized to submit this review');
        }
        if (assignment.status === 'SUBMITTED') {
            throw new Error('Review already submitted');
        }
        // Calculate total score
        const totalScore = input.scores.reduce((sum, s) => {
            const criterion = assignment.rubric.criteria.find((c) => c.id === s.criterionId);
            if (criterion) {
                return sum + (s.score * criterion.weight);
            }
            return sum;
        }, 0);
        const review = {
            id: generateId(),
            assignmentId: input.assignmentId,
            reviewerId: input.reviewerId,
            scores: input.scores,
            totalScore,
            overallFeedback: input.overallFeedback,
            strengths: input.strengths,
            areasForImprovement: input.areasForImprovement,
            suggestions: input.suggestions,
            isAnonymous: this.config.anonymousReviewsDefault,
            confidence: input.confidence || 'MEDIUM',
            timeSpent: input.timeSpent || 0,
            submittedAt: new Date(),
        };
        const updatedAssignment = {
            ...assignment,
            review,
            status: 'SUBMITTED',
            completedAt: new Date(),
        };
        this.reviewAssignments.set(input.assignmentId, updatedAssignment);
        // Update reviewer stats
        const reviewer = this.profiles.get(input.reviewerId);
        if (reviewer) {
            const updatedProfile = {
                ...reviewer,
                stats: {
                    ...reviewer.stats,
                    reviewsGiven: reviewer.stats.reviewsGiven + 1,
                },
                updatedAt: new Date(),
            };
            this.profiles.set(input.reviewerId, updatedProfile);
        }
        // Update reputation for completing review
        this.updateReputation(input.reviewerId, 5, 'SESSION_COMPLETED', 'reliability');
        return review;
    }
    /**
     * Get reviews for a submission
     */
    getReviewsForSubmission(submissionId) {
        const reviews = [];
        for (const assignment of this.reviewAssignments.values()) {
            if (assignment.submissionId === submissionId &&
                assignment.review &&
                assignment.status === 'SUBMITTED') {
                reviews.push(assignment.review);
            }
        }
        return reviews;
    }
    // ==========================================================================
    // Collaborative Projects
    // ==========================================================================
    /**
     * Create a collaborative project
     */
    createProject(input) {
        if (!this.config.projectsEnabled) {
            throw new Error('Projects are not enabled');
        }
        const now = new Date();
        const members = input.members.map((m) => ({
            ...m,
            contribution: 0,
            joinedAt: now,
            status: 'ACTIVE',
        }));
        const team = {
            id: generateId(),
            members,
            roles: [],
            skillMatrix: {
                skills: [],
                memberSkills: [],
            },
        };
        const milestones = (input.milestones || []).map((m) => ({
            ...m,
            id: generateId(),
            status: 'PENDING',
        }));
        const project = {
            id: generateId(),
            title: input.title,
            description: input.description,
            type: input.type || 'RESEARCH',
            status: 'PLANNING',
            visibility: input.visibility || 'PRIVATE',
            team,
            milestones,
            tasks: [],
            resources: [],
            communications: [],
            reviews: [],
            startDate: input.startDate,
            targetEndDate: input.targetEndDate,
            tags: input.tags || [],
            courseId: input.courseId,
            groupId: input.groupId,
            createdAt: now,
            updatedAt: now,
        };
        this.projects.set(project.id, project);
        return project;
    }
    /**
     * Get a project by ID
     */
    getProject(projectId) {
        return this.projects.get(projectId);
    }
    /**
     * Update project status
     */
    updateProjectStatus(projectId, status) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        const updated = {
            ...project,
            status,
            actualEndDate: status === 'COMPLETED' ? new Date() : undefined,
            updatedAt: new Date(),
        };
        this.projects.set(projectId, updated);
        // Update member stats if completed
        if (status === 'COMPLETED') {
            for (const member of project.team.members) {
                const profile = this.profiles.get(member.userId);
                if (profile) {
                    const updatedProfile = {
                        ...profile,
                        stats: {
                            ...profile.stats,
                            projectsCompleted: profile.stats.projectsCompleted + 1,
                        },
                        updatedAt: new Date(),
                    };
                    this.profiles.set(member.userId, updatedProfile);
                }
                this.updateReputation(member.userId, 20, 'PROJECT_COMPLETED', 'collaboration');
            }
        }
        return updated;
    }
    /**
     * Create a project task
     */
    createProjectTask(input) {
        const project = this.projects.get(input.projectId);
        if (!project) {
            throw new Error(`Project not found: ${input.projectId}`);
        }
        const task = {
            id: generateId(),
            title: input.title,
            description: input.description,
            assignees: input.assignees || [],
            status: 'TODO',
            priority: input.priority || 'MEDIUM',
            milestoneId: input.milestoneId,
            dependencies: input.dependencies || [],
            estimatedHours: input.estimatedHours,
            dueDate: input.dueDate,
            comments: [],
            createdBy: input.createdBy,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const updated = {
            ...project,
            tasks: [...project.tasks, task],
            updatedAt: new Date(),
        };
        this.projects.set(input.projectId, updated);
        return task;
    }
    /**
     * Update task status
     */
    updateTaskStatus(projectId, taskId, status, actualHours) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        const updatedTask = {
            ...project.tasks[taskIndex],
            status,
            actualHours: actualHours ?? project.tasks[taskIndex].actualHours,
            completedAt: status === 'DONE' ? new Date() : undefined,
            updatedAt: new Date(),
        };
        const updatedTasks = [...project.tasks];
        updatedTasks[taskIndex] = updatedTask;
        const updated = {
            ...project,
            tasks: updatedTasks,
            updatedAt: new Date(),
        };
        this.projects.set(projectId, updated);
        return updatedTask;
    }
    /**
     * Add task comment
     */
    addTaskComment(projectId, taskId, authorId, content) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        const author = this.profiles.get(authorId);
        if (!author) {
            throw new Error(`Profile not found: ${authorId}`);
        }
        const comment = {
            id: generateId(),
            authorId,
            authorName: author.displayName,
            content,
            createdAt: new Date(),
        };
        const updatedTask = {
            ...project.tasks[taskIndex],
            comments: [...project.tasks[taskIndex].comments, comment],
            updatedAt: new Date(),
        };
        const updatedTasks = [...project.tasks];
        updatedTasks[taskIndex] = updatedTask;
        const updated = {
            ...project,
            tasks: updatedTasks,
            updatedAt: new Date(),
        };
        this.projects.set(projectId, updated);
        return comment;
    }
    /**
     * Add project communication
     */
    addProjectCommunication(projectId, communication) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        const newCommunication = {
            ...communication,
            id: generateId(),
            createdAt: new Date(),
        };
        const updated = {
            ...project,
            communications: [...project.communications, newCommunication],
            updatedAt: new Date(),
        };
        this.projects.set(projectId, updated);
        return newCommunication;
    }
    /**
     * Add project review
     */
    addProjectReview(projectId, review) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        const newReview = {
            ...review,
            id: generateId(),
            createdAt: new Date(),
        };
        const updated = {
            ...project,
            reviews: [...project.reviews, newReview],
            updatedAt: new Date(),
        };
        this.projects.set(projectId, updated);
        return newReview;
    }
    // ==========================================================================
    // Analytics & Leaderboard
    // ==========================================================================
    /**
     * Get leaderboard
     */
    getLeaderboard(options) {
        const category = options.category || 'overall';
        const limit = options.limit || 10;
        const profiles = Array.from(this.profiles.values());
        // Calculate scores based on category
        const scored = profiles.map((p) => {
            let score;
            switch (category) {
                case 'helpfulness':
                    score = p.reputation.helpfulness + p.stats.peersHelped * 2;
                    break;
                case 'sessions':
                    score = p.stats.totalSessions * 10 + p.stats.totalStudyHours;
                    break;
                case 'reviews':
                    score = p.stats.reviewsGiven * 5 + p.stats.helpfulAnswers * 3;
                    break;
                default:
                    score = p.reputation.overall;
            }
            return { profile: p, score };
        });
        // Sort by score
        scored.sort((a, b) => b.score - a.score);
        // Create leaderboard entries
        const entries = scored.slice(0, limit).map((s, i) => ({
            rank: i + 1,
            userId: s.profile.userId,
            displayName: s.profile.displayName,
            avatarUrl: s.profile.avatarUrl,
            score: Math.round(s.score),
            change: 0, // Would need historical data for this
            badges: s.profile.badges.slice(0, 3),
        }));
        return entries;
    }
    /**
     * Get peer learning analytics
     */
    getAnalytics(startDate, endDate) {
        const profiles = Array.from(this.profiles.values());
        const groups = Array.from(this.groups.values());
        const discussions = Array.from(this.discussions.values());
        const mentorships = Array.from(this.mentorships.values());
        const projects = Array.from(this.projects.values());
        // Filter by date range
        const activeProfiles = profiles.filter((p) => p.lastActiveAt >= startDate && p.lastActiveAt <= endDate);
        const newProfiles = profiles.filter((p) => p.createdAt >= startDate && p.createdAt <= endDate);
        const createdGroups = groups.filter((g) => g.createdAt >= startDate && g.createdAt <= endDate);
        const completedSessions = groups.flatMap((g) => g.sessions.filter((s) => s.status === 'COMPLETED' &&
            s.scheduledAt >= startDate &&
            s.scheduledAt <= endDate));
        const newDiscussions = discussions.filter((d) => d.createdAt >= startDate && d.createdAt <= endDate);
        const startedMentorships = mentorships.filter((m) => m.createdAt >= startDate && m.createdAt <= endDate);
        const completedProjects = projects.filter((p) => p.status === 'COMPLETED' &&
            p.actualEndDate &&
            p.actualEndDate >= startDate &&
            p.actualEndDate <= endDate);
        // Calculate subject activity
        const subjectActivity = new Map();
        for (const group of groups) {
            const existing = subjectActivity.get(group.subject) || {
                subject: group.subject,
                activeUsers: 0,
                sessions: 0,
                studyHours: 0,
            };
            existing.activeUsers += group.members.length;
            existing.sessions += group.sessions.length;
            existing.studyHours += group.stats.totalStudyHours;
            subjectActivity.set(group.subject, existing);
        }
        const topSubjects = Array.from(subjectActivity.values())
            .sort((a, b) => b.studyHours - a.studyHours)
            .slice(0, 10);
        // Calculate engagement trend (simplified - daily counts)
        const trendData = [];
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);
            const dayActiveUsers = profiles.filter((p) => p.lastActiveAt >= dayStart && p.lastActiveAt <= dayEnd).length;
            trendData.push({
                date: new Date(currentDate),
                value: dayActiveUsers,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        // Calculate total study hours
        const totalStudyHours = completedSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration) / 60, 0);
        // Calculate reviews completed
        const reviewsCompleted = Array.from(this.reviewAssignments.values()).filter((a) => a.status === 'SUBMITTED' &&
            a.completedAt &&
            a.completedAt >= startDate &&
            a.completedAt <= endDate).length;
        return {
            period: { start: startDate, end: endDate },
            activeUsers: activeProfiles.length,
            newProfiles: newProfiles.length,
            matchesMade: 0, // Would need to track matches
            groupsCreated: createdGroups.length,
            sessionsCompleted: completedSessions.length,
            totalStudyHours: Math.round(totalStudyHours * 10) / 10,
            discussionPosts: newDiscussions.length,
            reviewsCompleted,
            mentorshipsStarted: startedMentorships.length,
            projectsCompleted: completedProjects.length,
            averageSatisfaction: 4.2, // Would need actual feedback data
            topSubjects,
            engagementTrend: trendData,
        };
    }
    // ==========================================================================
    // AI-Enhanced Features
    // ==========================================================================
    /**
     * AI-enhanced peer matching suggestions
     */
    async getAIMatchingSuggestions(userId, context) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found: ${userId}`);
        }
        // Get initial matches
        const matches = this.findPeerMatches({
            userId,
            criteria: {
                matchType: 'STUDY_PARTNER',
                limit: 20,
            },
        });
        // If AI is available, enhance the results
        if (this.samConfig.ai?.isConfigured()) {
            try {
                const prompt = `Given this learner profile and potential peer matches, provide enhanced matching insights:

User Profile:
- Expertise: ${profile.expertise.map((e) => `${e.subject} (${e.proficiencyLevel})`).join(', ')}
- Learning Goals: ${profile.learningGoals.map((g) => g.subject).join(', ')}
- Learning Style: ${profile.preferences.learningStyle}
${context ? `- Context: ${context}` : ''}

Top Matches (summary):
${matches.matches
                    .slice(0, 5)
                    .map((m) => `- ${m.peerProfile.displayName}: Score ${m.matchScore}, Common subjects: ${m.commonSubjects.join(', ')}`)
                    .join('\n')}

Suggest which matches would be most beneficial and why, focusing on complementary skills and learning opportunities.`;
                const response = await this.samConfig.ai.chat({
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    maxTokens: 500,
                });
                // The AI response would be used to re-rank or annotate matches
                // For now, we return the original matches
                console.log('AI matching insights:', response.content);
            }
            catch (error) {
                console.error('AI matching enhancement failed:', error);
            }
        }
        return matches.matches;
    }
    /**
     * AI-generated study group recommendations
     */
    async getGroupRecommendations(userId) {
        const profile = this.profiles.get(userId);
        if (!profile) {
            throw new Error(`Profile not found: ${userId}`);
        }
        // Get groups matching user interests
        const subjects = profile.learningGoals.map((g) => g.subject);
        const expertiseSubjects = profile.expertise.map((e) => e.subject);
        const allSubjects = [...new Set([...subjects, ...expertiseSubjects])];
        let recommendedGroups = [];
        for (const subject of allSubjects) {
            const result = this.searchStudyGroups({
                subject,
                status: 'ACTIVE',
                visibility: 'PUBLIC',
                limit: 5,
            });
            recommendedGroups.push(...result.groups);
        }
        // Filter out groups user is already in
        recommendedGroups = recommendedGroups.filter((g) => !g.members.some((m) => m.userId === userId));
        // Remove duplicates
        const uniqueGroups = Array.from(new Map(recommendedGroups.map((g) => [g.id, g])).values());
        return uniqueGroups.slice(0, 10);
    }
}
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new PeerLearningEngine instance
 */
export function createPeerLearningEngine(samConfig, config) {
    return new PeerLearningEngine(samConfig, config);
}
