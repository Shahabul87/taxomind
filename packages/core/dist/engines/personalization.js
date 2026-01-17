/**
 * @sam-ai/core - Personalization Engine
 * Handles learning style detection, emotional state, and adaptive personalization
 */
import { BaseEngine } from './base';
// ============================================================================
// PERSONALIZATION ENGINE
// ============================================================================
export class PersonalizationEngine extends BaseEngine {
    constructor(config) {
        super({
            config,
            name: 'personalization',
            version: '1.0.0',
            dependencies: ['context'],
            timeout: 30000,
            retries: 2,
            cacheEnabled: true,
            cacheTTL: 15 * 60 * 1000, // 15 minutes (shorter due to dynamic nature)
        });
    }
    async performInitialization() {
        this.logger.debug('[PersonalizationEngine] Initialized');
    }
    async process(input) {
        const { context, previousResults, options } = input;
        // Get context engine data
        const contextResult = previousResults?.['context'];
        // Analyze learning style
        const learningStyle = await this.analyzeLearningStyle(context, contextResult?.data);
        // Analyze emotional state
        const emotional = this.analyzeEmotionalState(context, contextResult?.data);
        // Analyze cognitive load
        const cognitiveLoad = this.analyzeCognitiveLoad(context);
        // Analyze motivation
        const motivation = this.analyzeMotivation(context, emotional);
        // Generate learning path if requested
        const generatePath = options?.generateLearningPath === true;
        const learningPath = generatePath
            ? await this.generateLearningPath(context, learningStyle, cognitiveLoad)
            : undefined;
        // Build overall profile
        const overallProfile = this.buildOverallProfile(learningStyle, emotional, cognitiveLoad, motivation);
        return {
            learningStyle,
            emotional,
            cognitiveLoad,
            motivation,
            learningPath,
            overallProfile,
        };
    }
    async analyzeLearningStyle(context, _contextData) {
        const userPreference = context.user.preferences.learningStyle;
        const interactions = context.conversation.messages;
        // Analyze interaction patterns for learning style indicators
        const indicators = this.detectLearningStyleIndicators(interactions);
        // Determine primary and secondary styles
        indicators.sort((a, b) => b.score - a.score);
        const primary = indicators[0]?.style || userPreference || 'mixed';
        const secondary = indicators[1]?.score > 20 ? indicators[1].style : null;
        // Calculate confidence based on evidence strength
        const confidence = Math.min(100, indicators[0]?.score * 2 || 50);
        // Generate recommendations based on style
        const recommendations = this.generateStyleRecommendations(primary, secondary);
        return {
            primary,
            secondary,
            confidence,
            indicators,
            recommendations,
        };
    }
    detectLearningStyleIndicators(messages) {
        const styles = [
            'visual',
            'auditory',
            'kinesthetic',
            'reading-writing',
            'mixed',
        ];
        const indicators = [];
        for (const style of styles) {
            const { score, evidence } = this.calculateStyleScore(style, messages);
            indicators.push({ style, score, evidence });
        }
        return indicators;
    }
    calculateStyleScore(style, messages) {
        const evidence = [];
        let score = 20; // Base score
        const messageText = messages.map((m) => m.content.toLowerCase()).join(' ');
        // Visual indicators
        if (style === 'visual') {
            if (messageText.includes('show') || messageText.includes('diagram')) {
                score += 15;
                evidence.push('Requests visual representations');
            }
            if (messageText.includes('picture') || messageText.includes('image')) {
                score += 10;
                evidence.push('Mentions visual content');
            }
            if (messageText.includes('chart') || messageText.includes('graph')) {
                score += 10;
                evidence.push('Interested in data visualization');
            }
        }
        // Auditory indicators
        if (style === 'auditory') {
            if (messageText.includes('explain') || messageText.includes('tell')) {
                score += 15;
                evidence.push('Prefers verbal explanations');
            }
            if (messageText.includes('discuss') || messageText.includes('talk')) {
                score += 10;
                evidence.push('Values discussion');
            }
        }
        // Kinesthetic indicators
        if (style === 'kinesthetic') {
            if (messageText.includes('practice') || messageText.includes('try')) {
                score += 15;
                evidence.push('Prefers hands-on learning');
            }
            if (messageText.includes('exercise') || messageText.includes('example')) {
                score += 10;
                evidence.push('Requests practical examples');
            }
        }
        // Reading-writing indicators
        if (style === 'reading-writing') {
            if (messageText.includes('read') || messageText.includes('write')) {
                score += 15;
                evidence.push('Prefers text-based learning');
            }
            if (messageText.includes('notes') || messageText.includes('summary')) {
                score += 10;
                evidence.push('Values written summaries');
            }
        }
        // Mixed gets a baseline boost
        if (style === 'mixed') {
            score += 10;
            evidence.push('Adaptable learning approach');
        }
        return { score: Math.min(100, score), evidence };
    }
    generateStyleRecommendations(primary, secondary) {
        const recommendations = [];
        const styleRecs = {
            visual: [
                'Use diagrams and flowcharts',
                'Incorporate color-coded notes',
                'Watch video demonstrations',
                'Create mind maps',
            ],
            auditory: [
                'Listen to explanations and lectures',
                'Discuss concepts with peers',
                'Use mnemonic devices',
                'Record and replay key points',
            ],
            kinesthetic: [
                'Practice with hands-on exercises',
                'Take frequent breaks for movement',
                'Use physical manipulatives when possible',
                'Apply concepts to real scenarios',
            ],
            'reading-writing': [
                'Take detailed notes',
                'Read and summarize content',
                'Write out explanations',
                'Create lists and outlines',
            ],
            mixed: [
                'Vary learning approaches',
                'Combine visual and practical elements',
                'Use multiple resource types',
                'Adapt based on content complexity',
            ],
        };
        recommendations.push(...(styleRecs[primary] || []));
        if (secondary && styleRecs[secondary]) {
            recommendations.push(`Supplement with ${secondary} approaches`);
        }
        return recommendations.slice(0, 5);
    }
    analyzeEmotionalState(context, _contextData) {
        const messages = context.conversation.messages;
        const recentMessages = messages.slice(-5);
        // Detect emotional state from recent interactions
        const stateAnalysis = this.detectEmotionalState(recentMessages);
        // Determine trajectory
        const trajectory = this.calculateEmotionalTrajectory(messages);
        // Get recommended tone based on state
        const recommendedTone = this.getRecommendedTone(stateAnalysis.state);
        // Generate interventions if needed
        const interventions = this.generateInterventions(stateAnalysis.state, trajectory);
        return {
            currentState: stateAnalysis.state,
            confidence: stateAnalysis.confidence,
            trajectory,
            triggers: stateAnalysis.triggers,
            recommendedTone,
            interventions,
        };
    }
    detectEmotionalState(messages) {
        const triggers = [];
        let state = 'neutral';
        let confidence = 50;
        const text = messages.map((m) => m.content.toLowerCase()).join(' ');
        // Frustration indicators
        if (text.includes("don't understand") ||
            text.includes('confused') ||
            text.includes('stuck')) {
            state = 'frustrated';
            confidence = 75;
            triggers.push('Difficulty understanding content');
        }
        // Confusion indicators
        if (text.includes('what does') || text.includes('why') || text.includes('how does')) {
            if (state === 'neutral') {
                state = 'confused';
                confidence = 60;
            }
            triggers.push('Seeking clarification');
        }
        // Motivated indicators
        if (text.includes('great') || text.includes('got it') || text.includes('understand now')) {
            state = 'motivated';
            confidence = 70;
            triggers.push('Positive progress');
        }
        // Curious indicators
        if (text.includes('interesting') || text.includes('tell me more') || text.includes('what about')) {
            state = 'curious';
            confidence = 65;
            triggers.push('Active exploration');
        }
        // Anxious indicators
        if (text.includes('worried') || text.includes('scared') || text.includes('test')) {
            state = 'anxious';
            confidence = 70;
            triggers.push('Performance concerns');
        }
        // Check for explicit emotions in message metadata
        for (const msg of messages) {
            if (msg.metadata?.emotion) {
                state = msg.metadata.emotion;
                confidence = 85;
                triggers.push('Explicitly expressed emotion');
                break;
            }
        }
        return { state, confidence, triggers };
    }
    calculateEmotionalTrajectory(messages) {
        if (messages.length < 3)
            return 'stable';
        const recent = messages.slice(-3);
        let positiveCount = 0;
        let negativeCount = 0;
        for (const msg of recent) {
            const text = msg.content.toLowerCase();
            if (text.includes('thanks') || text.includes('great') || text.includes('helpful')) {
                positiveCount++;
            }
            if (text.includes('still') || text.includes("don't") || text.includes('confused')) {
                negativeCount++;
            }
        }
        if (positiveCount > negativeCount)
            return 'improving';
        if (negativeCount > positiveCount)
            return 'declining';
        return 'stable';
    }
    getRecommendedTone(state) {
        const toneMap = {
            frustrated: 'encouraging',
            confused: 'casual',
            anxious: 'encouraging',
            motivated: 'casual',
            confident: 'direct',
            curious: 'casual',
            bored: 'encouraging',
            neutral: 'casual',
        };
        return toneMap[state] || 'casual';
    }
    generateInterventions(state, trajectory) {
        const interventions = [];
        if (state === 'frustrated' || trajectory === 'declining') {
            interventions.push('Offer encouragement and acknowledge difficulty');
            interventions.push('Break down complex concepts into smaller steps');
            interventions.push('Provide additional examples');
        }
        if (state === 'confused') {
            interventions.push('Ask clarifying questions');
            interventions.push('Use alternative explanations');
            interventions.push('Connect to prior knowledge');
        }
        if (state === 'anxious') {
            interventions.push('Reassure about progress');
            interventions.push('Highlight past successes');
            interventions.push('Reduce time pressure');
        }
        if (state === 'bored') {
            interventions.push('Increase challenge level');
            interventions.push('Introduce novel elements');
            interventions.push('Connect to personal interests');
        }
        if (state === 'curious' || state === 'motivated') {
            interventions.push('Provide enrichment opportunities');
            interventions.push('Suggest advanced topics');
        }
        return interventions;
    }
    analyzeCognitiveLoad(context) {
        const messages = context.conversation.messages;
        const sessionMessages = messages.length;
        // Calculate factors
        const contentComplexity = this.estimateContentComplexity(messages);
        const sessionDuration = sessionMessages * 2; // Rough estimate: 2 min per message
        const recentErrors = this.countRecentErrors(messages);
        const helpSeekingFrequency = this.calculateHelpSeekingFrequency(messages);
        // Determine cognitive load
        const loadScore = contentComplexity * 0.3 +
            Math.min(100, sessionDuration) * 0.2 +
            recentErrors * 10 * 0.25 +
            helpSeekingFrequency * 0.25;
        let currentLoad = 'optimal';
        let capacity = 60;
        if (loadScore < 30) {
            currentLoad = 'low';
            capacity = 90;
        }
        else if (loadScore > 70) {
            currentLoad = 'high';
            capacity = 30;
        }
        else if (loadScore > 85) {
            currentLoad = 'overloaded';
            capacity = 10;
        }
        // Generate adaptations
        const adaptations = this.generateCognitiveAdaptations(currentLoad, {
            contentComplexity,
            sessionDuration,
            recentErrors,
            helpSeekingFrequency,
        });
        return {
            currentLoad,
            capacity,
            factors: {
                contentComplexity,
                sessionDuration,
                recentErrors,
                helpSeekingFrequency,
            },
            adaptations,
        };
    }
    estimateContentComplexity(messages) {
        const text = messages.map((m) => m.content).join(' ');
        const avgWordLength = text.length / (text.split(/\s+/).length || 1);
        const technicalTerms = (text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) || []).length;
        return Math.min(100, avgWordLength * 8 + technicalTerms * 5);
    }
    countRecentErrors(messages) {
        const recent = messages.slice(-5);
        let errors = 0;
        for (const msg of recent) {
            const text = msg.content.toLowerCase();
            if (text.includes('wrong') ||
                text.includes('incorrect') ||
                text.includes('mistake') ||
                text.includes('error')) {
                errors++;
            }
        }
        return errors;
    }
    calculateHelpSeekingFrequency(messages) {
        const userMessages = messages.filter((m) => m.role === 'user');
        if (userMessages.length === 0)
            return 0;
        let helpRequests = 0;
        for (const msg of userMessages) {
            const text = msg.content.toLowerCase();
            if (text.includes('help') ||
                text.includes('explain') ||
                text.includes('?') ||
                text.includes('how')) {
                helpRequests++;
            }
        }
        return Math.min(100, (helpRequests / userMessages.length) * 100);
    }
    generateCognitiveAdaptations(load, factors) {
        const adaptations = [];
        if (load === 'high' || load === 'overloaded') {
            adaptations.push({
                type: 'simplify',
                priority: 'high',
                description: 'Reduce content complexity',
                implementation: 'Use simpler language and shorter explanations',
            });
            adaptations.push({
                type: 'chunk',
                priority: 'high',
                description: 'Break content into smaller pieces',
                implementation: 'Present one concept at a time',
            });
            if (factors.sessionDuration > 30) {
                adaptations.push({
                    type: 'slow-down',
                    priority: 'medium',
                    description: 'Suggest taking a break',
                    implementation: 'Recommend a short break before continuing',
                });
            }
        }
        if (load === 'low') {
            adaptations.push({
                type: 'enrich',
                priority: 'medium',
                description: 'Add more challenging content',
                implementation: 'Include advanced topics and deeper explanations',
            });
            adaptations.push({
                type: 'speed-up',
                priority: 'low',
                description: 'Increase pacing',
                implementation: 'Cover more material per interaction',
            });
        }
        if (factors.helpSeekingFrequency > 60) {
            adaptations.push({
                type: 'visualize',
                priority: 'medium',
                description: 'Add visual explanations',
                implementation: 'Include diagrams or step-by-step visuals',
            });
        }
        return adaptations;
    }
    analyzeMotivation(context, emotional) {
        const messages = context.conversation.messages;
        const gamification = context.gamification;
        // Base motivation from engagement
        let level = 50;
        const drivers = [];
        const barriers = [];
        // Adjust based on emotional state
        if (emotional.currentState === 'motivated' || emotional.currentState === 'curious') {
            level += 20;
            drivers.push('Positive emotional state');
        }
        else if (emotional.currentState === 'frustrated' || emotional.currentState === 'anxious') {
            level -= 15;
            barriers.push('Negative emotional state');
        }
        // Check gamification engagement
        if (gamification.streak.current > 0) {
            level += 10;
            drivers.push(`Active streak: ${gamification.streak.current} days`);
        }
        if (gamification.badges.length > 0) {
            level += 5;
            drivers.push('Badge achievements');
        }
        // Determine type
        const hasExternalMotivators = gamification.points > 0 || gamification.badges.length > 0;
        const hasInternalIndicators = emotional.currentState === 'curious' || messages.some((m) => m.content.includes('want to learn'));
        let type = 'mixed';
        if (hasInternalIndicators && !hasExternalMotivators) {
            type = 'intrinsic';
        }
        else if (hasExternalMotivators && !hasInternalIndicators) {
            type = 'extrinsic';
        }
        // Sustainability
        let sustainability = 'medium';
        if (type === 'intrinsic' && level > 60) {
            sustainability = 'high';
        }
        else if (level < 40) {
            sustainability = 'low';
        }
        // Boost strategies
        const boostStrategies = this.generateMotivationStrategies(level, type, barriers);
        return {
            level: Math.max(0, Math.min(100, level)),
            type,
            drivers,
            barriers,
            sustainability,
            boostStrategies,
        };
    }
    generateMotivationStrategies(level, type, barriers) {
        const strategies = [];
        if (level < 50) {
            strategies.push('Set small, achievable goals');
            strategies.push('Celebrate small wins');
        }
        if (type === 'extrinsic') {
            strategies.push('Focus on personal growth benefits');
            strategies.push('Connect learning to real-world applications');
        }
        if (barriers.includes('Negative emotional state')) {
            strategies.push('Address emotional barriers first');
            strategies.push('Provide additional support and encouragement');
        }
        strategies.push('Track and visualize progress');
        strategies.push('Provide variety in learning activities');
        return strategies.slice(0, 4);
    }
    async generateLearningPath(_context, learningStyle, cognitiveLoad) {
        const baseNodes = [
            {
                id: 'review-1',
                title: 'Quick Review',
                type: 'review',
                estimatedDuration: 5,
                difficulty: 'easy',
                prerequisites: [],
                isOptional: false,
                adaptedFor: learningStyle.primary,
            },
            {
                id: 'lesson-1',
                title: 'Core Concept',
                type: 'lesson',
                estimatedDuration: 15,
                difficulty: cognitiveLoad.currentLoad === 'high' ? 'easy' : 'medium',
                prerequisites: ['review-1'],
                isOptional: false,
                adaptedFor: learningStyle.primary,
            },
            {
                id: 'exercise-1',
                title: 'Practice Exercise',
                type: 'exercise',
                estimatedDuration: 10,
                difficulty: 'medium',
                prerequisites: ['lesson-1'],
                isOptional: false,
                adaptedFor: learningStyle.primary,
            },
        ];
        // Add break if cognitive load is high
        if (cognitiveLoad.currentLoad === 'high' || cognitiveLoad.currentLoad === 'overloaded') {
            baseNodes.push({
                id: 'break-1',
                title: 'Rest Break',
                type: 'break',
                estimatedDuration: 5,
                difficulty: 'easy',
                prerequisites: ['exercise-1'],
                isOptional: true,
                adaptedFor: learningStyle.primary,
            });
        }
        // Add assessment
        baseNodes.push({
            id: 'assessment-1',
            title: 'Quick Assessment',
            type: 'assessment',
            estimatedDuration: 10,
            difficulty: 'medium',
            prerequisites: ['exercise-1'],
            isOptional: false,
            adaptedFor: learningStyle.primary,
        });
        const totalDuration = baseNodes.reduce((sum, n) => sum + n.estimatedDuration, 0);
        return {
            nodes: baseNodes,
            totalDuration,
            alternativeRoutes: [['review-1', 'exercise-1', 'assessment-1']], // Skip lesson route
            adaptationLevel: cognitiveLoad.currentLoad === 'high' ? 'significant' :
                cognitiveLoad.currentLoad === 'low' ? 'minimal' : 'moderate',
            confidenceScore: learningStyle.confidence,
        };
    }
    buildOverallProfile(learningStyle, emotional, cognitiveLoad, motivation) {
        const strengths = [];
        const challenges = [];
        const recommendations = [];
        // Analyze strengths
        if (learningStyle.confidence > 70) {
            strengths.push(`Clear ${learningStyle.primary} learning preference`);
        }
        if (emotional.currentState === 'motivated' || emotional.currentState === 'curious') {
            strengths.push('Positive engagement level');
        }
        if (motivation.level > 60) {
            strengths.push('Good motivation');
        }
        if (cognitiveLoad.currentLoad === 'optimal') {
            strengths.push('Well-balanced cognitive load');
        }
        // Analyze challenges
        if (emotional.currentState === 'frustrated' || emotional.currentState === 'confused') {
            challenges.push('Currently experiencing difficulty');
        }
        if (cognitiveLoad.currentLoad === 'high' || cognitiveLoad.currentLoad === 'overloaded') {
            challenges.push('High cognitive load');
        }
        if (motivation.level < 40) {
            challenges.push('Low motivation');
        }
        // Build recommendations
        recommendations.push(...learningStyle.recommendations.slice(0, 2));
        recommendations.push(...emotional.interventions.slice(0, 2));
        recommendations.push(...motivation.boostStrategies.slice(0, 2));
        // Determine next best action
        let nextBestAction = 'Continue with current learning path';
        if (cognitiveLoad.currentLoad === 'overloaded') {
            nextBestAction = 'Take a short break before continuing';
        }
        else if (emotional.currentState === 'confused') {
            nextBestAction = 'Review previous concepts for better understanding';
        }
        else if (motivation.level < 30) {
            nextBestAction = 'Try a quick win exercise to boost confidence';
        }
        else if (cognitiveLoad.currentLoad === 'low') {
            nextBestAction = 'Move on to more challenging content';
        }
        return {
            strengths,
            challenges,
            recommendations: [...new Set(recommendations)].slice(0, 5),
            nextBestAction,
        };
    }
    getCacheKey(input) {
        const { context } = input;
        return `personalization:${context.user.id}:${context.page.entityId || 'general'}`;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createPersonalizationEngine(config) {
    return new PersonalizationEngine(config);
}
//# sourceMappingURL=personalization.js.map