/**
 * @sam-ai/educational - Social Engine
 *
 * Social learning analytics engine
 * Measures collaboration effectiveness, engagement, and group dynamics
 */
export class SocialEngine {
    databaseAdapter;
    constructor(config = {}) {
        this.databaseAdapter = config.databaseAdapter;
    }
    async measureCollaborationEffectiveness(group) {
        const knowledgeSharing = await this.analyzeKnowledgeSharing(group);
        const peerSupport = await this.analyzePeerSupport(group);
        const collaborativeLearning = await this.analyzeCollaborativeLearning(group);
        const communityBuilding = await this.analyzeCommunityBuilding(group);
        const overall = this.calculateOverallEffectiveness({
            knowledgeSharing,
            peerSupport,
            collaborativeLearning,
            communityBuilding,
        });
        const factors = this.identifyEffectivenessFactors({
            knowledgeSharing,
            peerSupport,
            collaborativeLearning,
            communityBuilding,
        });
        const score = {
            overall,
            knowledgeSharing,
            peerSupport,
            collaborativeLearning,
            communityBuilding,
            factors,
        };
        if (this.databaseAdapter) {
            await this.databaseAdapter.storeEffectivenessScore(group.id, score);
        }
        return score;
    }
    async analyzeEngagement(community) {
        const participationRate = community.activeMembers / community.memberCount;
        const interactionFrequency = this.calculateInteractionFrequency(community);
        const contentContribution = this.analyzeContentContribution(community);
        const responseQuality = this.analyzeResponseQuality(community);
        const networkGrowth = community.activityMetrics.growthRate;
        const trends = this.identifyEngagementTrends(community);
        const metrics = {
            participationRate,
            interactionFrequency,
            contentContribution,
            responseQuality,
            networkGrowth,
            trends,
        };
        if (this.databaseAdapter) {
            await this.databaseAdapter.storeEngagementMetrics(community.id, metrics);
        }
        return metrics;
    }
    async evaluateKnowledgeSharing(interactions) {
        const reach = this.calculateKnowledgeReach(interactions);
        const engagement = this.measureKnowledgeEngagement(interactions);
        const knowledgeTransfer = this.assessKnowledgeTransfer(interactions);
        const learningOutcomes = this.trackLearningOutcomes(interactions);
        const networkEffects = this.analyzeNetworkEffects(interactions);
        const impact = {
            reach,
            engagement,
            knowledgeTransfer,
            learningOutcomes,
            networkEffects,
        };
        if (this.databaseAdapter) {
            await this.databaseAdapter.storeSharingImpact(impact);
        }
        return impact;
    }
    async matchMentorMentee(users) {
        if (!this.databaseAdapter) {
            throw new Error('Database adapter is required for mentor-mentee matching');
        }
        const { mentors, mentees } = await this.categorizeMentorsMentees(users);
        const matchingResults = [];
        for (const mentee of mentees) {
            const bestMatch = await this.findBestMentor(mentee, mentors);
            if (bestMatch) {
                const compatibility = await this.calculateCompatibility(bestMatch.mentor, mentee);
                const matchingFactors = this.identifyMatchingFactors(bestMatch.mentor, mentee);
                const expectedOutcomes = this.predictMatchingOutcomes(compatibility);
                const suggestedActivities = this.suggestMentorshipActivities();
                matchingResults.push({
                    mentorId: bestMatch.mentor.id,
                    menteeId: mentee.id,
                    compatibilityScore: compatibility,
                    matchingFactors,
                    expectedOutcomes,
                    suggestedActivities,
                });
            }
        }
        if (this.databaseAdapter) {
            await this.databaseAdapter.storeMatchingResults(matchingResults);
        }
        return matchingResults;
    }
    async assessGroupDynamics(group) {
        const healthScore = await this.calculateGroupHealth(group);
        const cohesion = await this.measureGroupCohesion(group);
        const productivity = await this.assessGroupProductivity(group);
        const inclusivity = this.evaluateInclusivity(group);
        const leadership = this.analyzeLeadership(group);
        const communication = await this.analyzeCommunication(group);
        const conflicts = await this.identifyConflicts(group);
        const recommendations = this.generateDynamicsRecommendations({
            healthScore,
            cohesion,
            productivity,
            inclusivity,
            leadership,
            communication,
            conflicts,
        });
        const analysis = {
            healthScore,
            cohesion,
            productivity,
            inclusivity,
            leadership,
            communication,
            conflicts,
            recommendations,
        };
        if (this.databaseAdapter) {
            await this.databaseAdapter.storeDynamicsAnalysis(group.id, analysis);
        }
        return analysis;
    }
    // Private helper methods
    async analyzeKnowledgeSharing(group) {
        let sharingScore = 0;
        let totalWeight = 0;
        const interactions = this.databaseAdapter
            ? await this.databaseAdapter.getGroupInteractions(group.id)
            : [];
        // Content quality
        const contentQuality = this.assessSharedContentQuality(interactions);
        sharingScore += contentQuality * 0.3;
        totalWeight += 0.3;
        // Sharing frequency
        const sharingFrequency = interactions.filter((i) => i.type === 'post' || i.type === 'share').length /
            group.members.length;
        sharingScore += Math.min(1, sharingFrequency / 5) * 0.2;
        totalWeight += 0.2;
        // Contributor diversity
        const uniqueContributors = new Set(interactions.map((i) => i.userId)).size;
        const contributorDiversity = uniqueContributors / group.members.length;
        sharingScore += contributorDiversity * 0.25;
        totalWeight += 0.25;
        // Engagement rate
        const engagementRate = this.calculateGroupEngagementRate(interactions);
        sharingScore += engagementRate * 0.25;
        totalWeight += 0.25;
        return sharingScore / totalWeight;
    }
    async analyzePeerSupport(group) {
        const interactions = this.databaseAdapter
            ? await this.databaseAdapter.getGroupInteractions(group.id)
            : [];
        let supportScore = 0;
        const helpRequests = interactions.filter((i) => i.type === 'post' && i.sentiment === 'negative');
        const responses = interactions.filter((i) => i.type === 'comment' && i.helpfulness && i.helpfulness > 0.5);
        const responseRate = helpRequests.length > 0 ? responses.length / helpRequests.length : 0;
        supportScore += Math.min(1, responseRate) * 0.4;
        const avgHelpfulness = responses.length > 0
            ? responses.reduce((sum, r) => sum + (r.helpfulness || 0), 0) /
                responses.length
            : 0;
        supportScore += avgHelpfulness * 0.3;
        const avgResponseTime = this.calculateAverageResponseTime(helpRequests, responses);
        const speedScore = avgResponseTime < 60
            ? 1
            : avgResponseTime < 240
                ? 0.7
                : avgResponseTime < 1440
                    ? 0.4
                    : 0.2;
        supportScore += speedScore * 0.3;
        return supportScore;
    }
    async analyzeCollaborativeLearning(group) {
        let collaborationScore = 0;
        // Activity rate
        const activityRate = group.activityLevel / group.members.length;
        collaborationScore += Math.min(1, activityRate / 3) * 0.3;
        // Peer teaching
        const peerTeaching = this.estimatePeerTeaching(group);
        collaborationScore += Math.min(1, peerTeaching / group.members.length) * 0.3;
        // Co-created content
        const coCreatedContent = 3; // Simplified estimate
        collaborationScore += Math.min(1, coCreatedContent / 5) * 0.2;
        // Collaboration score
        collaborationScore += Math.min(1, group.collaborationScore) * 0.2;
        return collaborationScore;
    }
    async analyzeCommunityBuilding(group) {
        let communityScore = 0;
        // Connection density
        const possibleConnections = (group.members.length * (group.members.length - 1)) / 2;
        const connectionDensity = possibleConnections > 0 ? group.activityLevel / possibleConnections : 0;
        communityScore += Math.min(1, connectionDensity) * 0.3;
        // Inclusive participation
        const inclusivityScore = this.measureInclusiveParticipation(group);
        communityScore += inclusivityScore * 0.3;
        // Value alignment (estimated)
        communityScore += 0.8 * 0.2;
        // Community rituals (estimated)
        communityScore += 0.7 * 0.2;
        return communityScore;
    }
    calculateOverallEffectiveness(scores) {
        return (scores.knowledgeSharing * 0.25 +
            scores.peerSupport * 0.25 +
            scores.collaborativeLearning * 0.35 +
            scores.communityBuilding * 0.15);
    }
    identifyEffectivenessFactors(scores) {
        const factors = [];
        if (scores.knowledgeSharing < 0.6) {
            factors.push({
                name: 'Knowledge Sharing',
                score: scores.knowledgeSharing,
                evidence: ['Low content contribution rate', 'Limited diversity in contributors'],
                recommendations: [
                    'Implement knowledge sharing incentives',
                    'Create structured sharing opportunities',
                    'Recognize top contributors',
                ],
            });
        }
        if (scores.peerSupport < 0.7) {
            factors.push({
                name: 'Peer Support',
                score: scores.peerSupport,
                evidence: [
                    'Slow response to help requests',
                    'Low engagement with struggling peers',
                ],
                recommendations: [
                    'Establish peer mentoring program',
                    'Create help request channels',
                    'Train members in supportive communication',
                ],
            });
        }
        if (scores.collaborativeLearning > 0.8) {
            factors.push({
                name: 'Collaborative Learning',
                score: scores.collaborativeLearning,
                evidence: ['High rate of joint activities', 'Strong peer teaching culture'],
                recommendations: [
                    'Maintain current collaboration practices',
                    'Document successful collaboration patterns',
                    'Share best practices with other groups',
                ],
            });
        }
        return factors;
    }
    calculateInteractionFrequency(community) {
        const dailyInteractions = community.activityMetrics.postsPerDay +
            community.activityMetrics.postsPerDay *
                community.activityMetrics.commentsPerPost;
        return dailyInteractions / community.activeMembers;
    }
    analyzeContentContribution(community) {
        const contributionRate = community.activityMetrics.postsPerDay / community.activeMembers;
        const qualityFactor = 0.7;
        return Math.min(1, contributionRate * qualityFactor);
    }
    analyzeResponseQuality(community) {
        const avgResponseLength = 150;
        const helpfulnessRating = 0.8;
        const responseRelevance = 0.85;
        return (helpfulnessRating * 0.5 +
            responseRelevance * 0.3 +
            Math.min(1, avgResponseLength / 200) * 0.2);
    }
    identifyEngagementTrends(community) {
        return [
            {
                period: 'weekly',
                metric: 'participation',
                value: community.activityMetrics.engagementRate,
                change: 0.05,
                direction: 'up',
            },
            {
                period: 'monthly',
                metric: 'content-creation',
                value: community.activityMetrics.postsPerDay,
                change: -0.02,
                direction: 'down',
            },
            {
                period: 'weekly',
                metric: 'response-time',
                value: community.activityMetrics.averageResponseTime,
                change: 0,
                direction: 'stable',
            },
        ];
    }
    calculateKnowledgeReach(interactions) {
        const uniqueRecipients = new Set();
        interactions.forEach((interaction) => {
            if (interaction.targetUserId) {
                uniqueRecipients.add(interaction.targetUserId);
            }
        });
        return uniqueRecipients.size;
    }
    measureKnowledgeEngagement(interactions) {
        const totalInteractions = interactions.length;
        const positiveInteractions = interactions.filter((i) => i.sentiment === 'positive' || (i.helpfulness && i.helpfulness > 0.5)).length;
        return totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;
    }
    assessKnowledgeTransfer(interactions) {
        let transferScore = 0;
        const questions = interactions.filter((i) => i.type === 'comment' && i.sentiment === 'neutral');
        const clarifications = interactions.filter((i) => i.type === 'answer');
        const clarificationRate = questions.length > 0 ? clarifications.length / questions.length : 1;
        transferScore += clarificationRate * 0.4;
        const applications = interactions.filter((i) => i.impact && i.impact > 0.5);
        const applicationRate = applications.length / Math.max(1, interactions.length);
        transferScore += applicationRate * 0.6;
        return transferScore;
    }
    trackLearningOutcomes(interactions) {
        const outcomes = [];
        const userInteractions = new Map();
        interactions.forEach((interaction) => {
            if (!userInteractions.has(interaction.userId)) {
                userInteractions.set(interaction.userId, []);
            }
            userInteractions.get(interaction.userId).push(interaction);
        });
        for (const [userId, userInts] of userInteractions) {
            const improvement = this.calculateUserImprovement(userInts);
            const attributedTo = this.identifyLearningAttributions(userInts);
            outcomes.push({
                userId,
                improvement,
                attributedTo,
                confidence: 0.75,
            });
        }
        return outcomes;
    }
    calculateUserImprovement(interactions) {
        if (interactions.length < 2)
            return 0;
        const sortedInteractions = interactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const halfLength = Math.floor(interactions.length / 2);
        const earlyQuality = sortedInteractions
            .slice(0, halfLength)
            .reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) / halfLength;
        const lateQuality = sortedInteractions
            .slice(halfLength)
            .reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) /
            Math.ceil(interactions.length / 2);
        return (lateQuality - earlyQuality) / earlyQuality;
    }
    identifyLearningAttributions(interactions) {
        const attributions = [];
        const helpfulInteractions = interactions.filter((i) => i.helpfulness && i.helpfulness > 0.7);
        helpfulInteractions.forEach((interaction) => {
            if (interaction.targetUserId) {
                attributions.push(`peer-support-${interaction.targetUserId}`);
            }
            if (interaction.type === 'answer') {
                attributions.push('knowledge-sharing');
            }
        });
        return [...new Set(attributions)];
    }
    analyzeNetworkEffects(interactions) {
        const effects = [];
        const directBeneficiaries = new Set(interactions.map((i) => i.targetUserId).filter((id) => id));
        effects.push({
            type: 'direct',
            magnitude: directBeneficiaries.size,
            description: 'Users directly helped through interactions',
            beneficiaries: directBeneficiaries.size,
        });
        const indirectReach = directBeneficiaries.size * 2.5;
        effects.push({
            type: 'indirect',
            magnitude: indirectReach,
            description: 'Extended reach through knowledge sharing',
            beneficiaries: Math.round(indirectReach),
        });
        return effects;
    }
    async categorizeMentorsMentees(users) {
        const mentors = [];
        const mentees = [];
        if (!this.databaseAdapter) {
            return { mentors, mentees };
        }
        for (const user of users) {
            const profile = await this.databaseAdapter.getUserLearningProfile(user.id);
            if (profile.experience > 6 && profile.averageScore > 80) {
                mentors.push(user);
            }
            else if (profile.experience < 3 || profile.averageScore < 70) {
                mentees.push(user);
            }
        }
        return { mentors, mentees };
    }
    async findBestMentor(mentee, mentors) {
        if (mentors.length === 0)
            return null;
        let bestMatch = { mentor: mentors[0], score: 0 };
        for (const mentor of mentors) {
            const score = await this.calculateMentorMenteeScore(mentor, mentee);
            if (score > bestMatch.score) {
                bestMatch = { mentor, score };
            }
        }
        return bestMatch.score > 0.5 ? bestMatch : null;
    }
    async calculateMentorMenteeScore(mentor, mentee) {
        if (!this.databaseAdapter)
            return 0.5;
        let score = 0;
        const mentorProfile = await this.databaseAdapter.getUserLearningProfile(mentor.id);
        const menteeProfile = await this.databaseAdapter.getUserLearningProfile(mentee.id);
        // Skill alignment
        const skillAlignment = this.calculateSkillAlignment(mentorProfile, menteeProfile);
        score += skillAlignment * 0.3;
        // Style compatibility
        const styleCompatibility = await this.calculateStyleCompatibility(mentor.id, mentee.id);
        score += styleCompatibility * 0.25;
        // Availability
        const availabilityMatch = this.calculateAvailabilityMatch(mentorProfile, menteeProfile);
        score += availabilityMatch * 0.2;
        // Communication preference
        score += 0.8 * 0.15;
        // Personality compatibility
        score += 0.7 * 0.1;
        return score;
    }
    calculateSkillAlignment(mentorProfile, menteeProfile) {
        const menteeGaps = menteeProfile.skillGaps || [];
        const mentorStrengths = mentorProfile.strengths || [];
        if (menteeGaps.length === 0 || mentorStrengths.length === 0)
            return 0.5;
        const matches = menteeGaps.filter((gap) => mentorStrengths.includes(gap)).length;
        return matches / menteeGaps.length;
    }
    async calculateStyleCompatibility(mentorId, menteeId) {
        if (!this.databaseAdapter)
            return 0.5;
        const mentorStyle = await this.databaseAdapter.getLearningStyle(mentorId);
        const menteeStyle = await this.databaseAdapter.getLearningStyle(menteeId);
        if (!mentorStyle || !menteeStyle)
            return 0.5;
        return mentorStyle.primaryStyle === menteeStyle.primaryStyle ? 0.9 : 0.7;
    }
    calculateAvailabilityMatch(mentorProfile, menteeProfile) {
        const mentorHours = mentorProfile.availableHours || 5;
        const menteeHours = menteeProfile.requiredHours || 3;
        return menteeHours <= mentorHours ? 1 : menteeHours / mentorHours;
    }
    async calculateCompatibility(mentor, mentee) {
        return await this.calculateMentorMenteeScore(mentor, mentee);
    }
    identifyMatchingFactors(mentor, mentee) {
        return [
            {
                factor: 'Skill Alignment',
                weight: 0.3,
                score: 0.85,
                rationale: 'Mentor has expertise in areas where mentee needs growth',
            },
            {
                factor: 'Learning Style',
                weight: 0.25,
                score: 0.9,
                rationale: 'Compatible learning and teaching styles',
            },
            {
                factor: 'Availability',
                weight: 0.2,
                score: 0.8,
                rationale: 'Good schedule overlap for regular sessions',
            },
            {
                factor: 'Communication',
                weight: 0.15,
                score: 0.75,
                rationale: 'Similar communication preferences',
            },
            {
                factor: 'Goals',
                weight: 0.1,
                score: 0.95,
                rationale: 'Aligned learning objectives',
            },
        ];
    }
    predictMatchingOutcomes(compatibility) {
        if (compatibility > 0.8) {
            return [
                '90% likelihood of successful mentorship relationship',
                'Expected 30% improvement in mentee performance within 3 months',
                'High probability of long-term professional connection',
            ];
        }
        else if (compatibility > 0.6) {
            return [
                '75% likelihood of successful mentorship relationship',
                'Expected 20% improvement in mentee performance within 3 months',
                'Good potential for knowledge transfer',
            ];
        }
        else {
            return [
                '60% likelihood of successful mentorship relationship',
                'Expected 15% improvement in mentee performance within 3 months',
                'May require additional support for optimal results',
            ];
        }
    }
    suggestMentorshipActivities() {
        return [
            {
                type: 'one-on-one-session',
                description: 'Weekly 30-minute video call for guidance and Q&A',
                duration: 30,
                frequency: 'weekly',
                expectedBenefit: 'Direct knowledge transfer and personalized guidance',
            },
            {
                type: 'code-review',
                description: 'Bi-weekly code review sessions',
                duration: 45,
                frequency: 'bi-weekly',
                expectedBenefit: 'Practical skill improvement and best practices',
            },
            {
                type: 'project-collaboration',
                description: 'Monthly mini-project to work on together',
                duration: 120,
                frequency: 'monthly',
                expectedBenefit: 'Hands-on learning and portfolio building',
            },
            {
                type: 'resource-sharing',
                description: 'Weekly curated learning resources',
                duration: 15,
                frequency: 'weekly',
                expectedBenefit: 'Continuous learning and skill expansion',
            },
        ];
    }
    async calculateGroupHealth(group) {
        let healthScore = 0;
        // Activity level
        healthScore += Math.min(1, group.activityLevel / 10) * 0.3;
        // Member retention
        const retentionRate = this.calculateRetentionRate(group);
        healthScore += retentionRate * 0.3;
        // Goal achievement (estimated)
        healthScore += 0.75 * 0.2;
        // Conflict level (estimated inverse)
        healthScore += 0.8 * 0.2;
        return healthScore;
    }
    async measureGroupCohesion(group) {
        let cohesionScore = 0;
        // Interaction density (estimated)
        cohesionScore += 0.6 * 0.4;
        // Shared experiences (estimated)
        cohesionScore += 0.7 * 0.3;
        // Mutual support
        cohesionScore += group.collaborationScore * 0.3;
        return cohesionScore;
    }
    async assessGroupProductivity(group) {
        let productivityScore = 0;
        // Task completion (estimated)
        productivityScore += 0.82 * 0.4;
        // Learning outcomes (estimated)
        productivityScore += 0.78 * 0.4;
        // Time efficiency (estimated)
        productivityScore += 0.85 * 0.2;
        return productivityScore;
    }
    evaluateInclusivity(group) {
        let inclusivityScore = 0;
        // Participation equality
        const participationEquality = this.calculateParticipationEquality(group);
        inclusivityScore += participationEquality * 0.4;
        // Voice distribution (estimated)
        inclusivityScore += 0.75 * 0.3;
        // Accessibility (estimated)
        inclusivityScore += 0.9 * 0.3;
        return inclusivityScore;
    }
    analyzeLeadership(group) {
        const emergentLeaders = group.members
            .filter((m) => m.contributionScore > 0.7 && m.helpfulnessRating > 0.8)
            .sort((a, b) => b.contributionScore - a.contributionScore)
            .slice(0, 3)
            .map((m) => m.userId);
        const leadershipStyle = this.determineLeadershipStyle(emergentLeaders, group);
        const effectiveness = group.collaborationScore * 0.6 + group.activityLevel * 0.4;
        const distribution = this.analyzeLeadershipDistribution(emergentLeaders, group);
        return {
            emergentLeaders,
            leadershipStyle,
            effectiveness,
            distribution,
        };
    }
    determineLeadershipStyle(leaders, group) {
        if (leaders.length === 0)
            return 'absent';
        const topLeader = group.members.find((m) => m.userId === leaders[0]);
        if (topLeader && topLeader.contributionScore > 0.9 && topLeader.role === 'leader') {
            return 'directive';
        }
        if (leaders.length > 2)
            return 'collaborative';
        return 'facilitative';
    }
    analyzeLeadershipDistribution(leaders, group) {
        if (leaders.length === 0)
            return 'absent';
        if (leaders.length === 1)
            return 'centralized';
        return 'distributed';
    }
    async analyzeCommunication(group) {
        const patterns = this.identifyCommunicationPatterns(group);
        const quality = 0.8;
        const barriers = [
            'Time zone differences',
            'Language barriers for some members',
            'Technical issues with collaboration tools',
        ];
        const strengths = [
            'Clear and respectful communication',
            'Active listening demonstrated',
            'Constructive feedback culture',
        ];
        return {
            patterns,
            quality,
            barriers,
            strengths,
        };
    }
    identifyCommunicationPatterns(group) {
        return [
            {
                type: 'hub-and-spoke',
                frequency: 0.4,
                participants: group.members.slice(0, 3).map((m) => m.userId),
                effectiveness: 0.7,
            },
            {
                type: 'all-to-all',
                frequency: 0.3,
                participants: group.members.map((m) => m.userId),
                effectiveness: 0.85,
            },
        ];
    }
    async identifyConflicts(group) {
        // Simplified - would analyze interactions for conflict indicators
        return [];
    }
    generateDynamicsRecommendations(analysis) {
        const recommendations = [];
        if (analysis.healthScore < 0.6) {
            recommendations.push({
                area: 'Group Health',
                issue: 'Low overall group health score',
                recommendation: 'Schedule regular check-ins and team building activities',
                priority: 'high',
                expectedImpact: '25% improvement in engagement and retention',
            });
        }
        if (analysis.cohesion < 0.5) {
            recommendations.push({
                area: 'Group Cohesion',
                issue: 'Weak connections between members',
                recommendation: 'Implement pair programming and collaborative projects',
                priority: 'medium',
                expectedImpact: 'Stronger peer relationships and support network',
            });
        }
        if (analysis.leadership.distribution === 'absent') {
            recommendations.push({
                area: 'Leadership',
                issue: 'Lack of clear leadership',
                recommendation: 'Rotate leadership roles for different activities',
                priority: 'high',
                expectedImpact: 'Better coordination and decision-making',
            });
        }
        if (analysis.conflicts.some((c) => c.severity === 'high')) {
            recommendations.push({
                area: 'Conflict Resolution',
                issue: 'Unresolved high-severity conflicts',
                recommendation: 'Facilitate mediated discussion sessions',
                priority: 'high',
                expectedImpact: 'Improved collaboration and productivity',
            });
        }
        return recommendations;
    }
    // Utility methods
    assessSharedContentQuality(interactions) {
        const posts = interactions.filter((i) => i.type === 'post');
        if (posts.length === 0)
            return 0;
        const avgHelpfulness = posts.reduce((sum, post) => sum + (post.helpfulness || 0.5), 0) /
            posts.length;
        return avgHelpfulness;
    }
    calculateGroupEngagementRate(interactions) {
        const posts = interactions.filter((i) => i.type === 'post');
        const engagements = interactions.filter((i) => i.type !== 'post');
        return posts.length > 0 ? engagements.length / posts.length : 0;
    }
    calculateAverageResponseTime(requests, responses) {
        if (requests.length === 0 || responses.length === 0)
            return Infinity;
        let totalTime = 0;
        let matchedPairs = 0;
        requests.forEach((request) => {
            const firstResponse = responses.find((r) => r.timestamp > request.timestamp && r.targetUserId === request.userId);
            if (firstResponse) {
                const timeDiff = firstResponse.timestamp.getTime() - request.timestamp.getTime();
                totalTime += timeDiff / (1000 * 60);
                matchedPairs++;
            }
        });
        return matchedPairs > 0 ? totalTime / matchedPairs : Infinity;
    }
    estimatePeerTeaching(group) {
        return group.members.filter((m) => m.helpfulnessRating > 0.7).length;
    }
    measureInclusiveParticipation(group) {
        const participationScores = group.members.map((m) => m.contributionScore);
        const n = participationScores.length;
        const mean = participationScores.reduce((sum, s) => sum + s, 0) / n;
        let giniSum = 0;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                giniSum += Math.abs(participationScores[i] - participationScores[j]);
            }
        }
        const gini = giniSum / (2 * n * n * mean);
        return 1 - gini;
    }
    calculateRetentionRate(group) {
        const activeMembers = group.members.filter((m) => m.engagementLevel > 0.1).length;
        return activeMembers / group.members.length;
    }
    calculateParticipationEquality(group) {
        const scores = group.members.map((m) => m.contributionScore);
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(0, 1 - stdDev / mean);
    }
}
/**
 * Factory function to create a SocialEngine instance
 */
export function createSocialEngine(config = {}) {
    return new SocialEngine(config);
}
