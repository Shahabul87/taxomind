/**
 * @sam-ai/agentic - Meta-Learning Analyzer
 *
 * Analyzes learning patterns, generates insights, and optimizes teaching strategies.
 * Provides meta-level analysis of the AI tutoring system&apos;s effectiveness.
 *
 * Features:
 * - Pattern recognition across learning events
 * - Strategy effectiveness analysis
 * - Insight generation for system optimization
 * - Trend analysis and forecasting
 */
// ============================================================================
// IN-MEMORY STORES
// ============================================================================
export class InMemoryLearningPatternStore {
    patterns = new Map();
    idCounter = 0;
    async get(id) {
        return this.patterns.get(id) ?? null;
    }
    async getByCategory(category) {
        return Array.from(this.patterns.values()).filter((p) => p.category === category);
    }
    async getHighConfidence(minConfidence = 0.7) {
        return Array.from(this.patterns.values()).filter((p) => p.confidenceScore >= minConfidence);
    }
    async create(pattern) {
        const id = `pattern_${++this.idCounter}_${Date.now()}`;
        const fullPattern = { id, ...pattern };
        this.patterns.set(id, fullPattern);
        return fullPattern;
    }
    async update(id, updates) {
        const existing = this.patterns.get(id);
        if (!existing)
            throw new Error(`Pattern not found: ${id}`);
        const updated = { ...existing, ...updates };
        this.patterns.set(id, updated);
        return updated;
    }
    async getRecent(limit = 10) {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.lastObserved.getTime() - a.lastObserved.getTime())
            .slice(0, limit);
    }
}
export class InMemoryMetaLearningInsightStore {
    insights = new Map();
    processed = new Set();
    idCounter = 0;
    async get(id) {
        return this.insights.get(id) ?? null;
    }
    async getByType(type) {
        return Array.from(this.insights.values()).filter((i) => i.type === type);
    }
    async getByPriority(priority) {
        return Array.from(this.insights.values()).filter((i) => i.priority === priority);
    }
    async getActive() {
        const now = new Date();
        return Array.from(this.insights.values()).filter((i) => !this.processed.has(i.id) && (!i.validUntil || i.validUntil > now));
    }
    async create(insight) {
        const id = `insight_${++this.idCounter}_${Date.now()}`;
        const fullInsight = { id, ...insight };
        this.insights.set(id, fullInsight);
        return fullInsight;
    }
    async markProcessed(id) {
        this.processed.add(id);
    }
}
export class InMemoryLearningStrategyStore {
    strategies = new Map();
    usageHistory = new Map();
    idCounter = 0;
    async get(id) {
        return this.strategies.get(id) ?? null;
    }
    async getAll() {
        return Array.from(this.strategies.values());
    }
    async getTopPerforming(limit = 5) {
        return Array.from(this.strategies.values())
            .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
            .slice(0, limit);
    }
    async create(strategy) {
        const id = `strategy_${++this.idCounter}_${Date.now()}`;
        const fullStrategy = { id, ...strategy };
        this.strategies.set(id, fullStrategy);
        this.usageHistory.set(id, []);
        return fullStrategy;
    }
    async update(id, updates) {
        const existing = this.strategies.get(id);
        if (!existing)
            throw new Error(`Strategy not found: ${id}`);
        const updated = { ...existing, ...updates };
        this.strategies.set(id, updated);
        return updated;
    }
    async recordUsage(id, outcome) {
        const history = this.usageHistory.get(id) ?? [];
        history.push(outcome);
        this.usageHistory.set(id, history);
        const strategy = this.strategies.get(id);
        if (strategy) {
            const avgOutcome = history.reduce((a, b) => a + b, 0) / history.length;
            this.strategies.set(id, {
                ...strategy,
                usageCount: history.length,
                avgOutcome,
                lastUsed: new Date(),
            });
        }
    }
}
export class InMemoryLearningEventStore {
    events = new Map();
    idCounter = 0;
    async get(id) {
        return this.events.get(id) ?? null;
    }
    async getByUser(userId, since) {
        return Array.from(this.events.values())
            .filter((e) => e.userId === userId && (!since || e.timestamp >= since))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getBySession(sessionId) {
        return Array.from(this.events.values())
            .filter((e) => e.sessionId === sessionId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    async create(event) {
        const id = `event_${++this.idCounter}_${Date.now()}`;
        const fullEvent = { id, ...event };
        this.events.set(id, fullEvent);
        return fullEvent;
    }
    async getStats(userId, period) {
        let events = Array.from(this.events.values());
        if (userId) {
            events = events.filter((e) => e.userId === userId);
        }
        if (period) {
            const since = this.getPeriodStart(period);
            events = events.filter((e) => e.timestamp >= since);
        }
        const eventsByType = {};
        let totalDuration = 0;
        let durationCount = 0;
        let successCount = 0;
        let outcomeCount = 0;
        let totalQuality = 0;
        let qualityCount = 0;
        for (const event of events) {
            eventsByType[event.eventType] = (eventsByType[event.eventType] ?? 0) + 1;
            if (event.duration) {
                totalDuration += event.duration;
                durationCount++;
            }
            if (event.outcome) {
                outcomeCount++;
                if (event.outcome === 'success')
                    successCount++;
            }
            if (event.responseQuality) {
                totalQuality += event.responseQuality;
                qualityCount++;
            }
        }
        return {
            totalEvents: events.length,
            eventsByType: eventsByType,
            avgDuration: durationCount > 0 ? totalDuration / durationCount : 0,
            successRate: outcomeCount > 0 ? successCount / outcomeCount : 0,
            avgQuality: qualityCount > 0 ? totalQuality / qualityCount : 0,
        };
    }
    getPeriodStart(period) {
        const now = new Date();
        switch (period) {
            case 'hour':
                return new Date(now.getTime() - 60 * 60 * 1000);
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case 'all_time':
                return new Date(0);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }
}
// ============================================================================
// META-LEARNING ANALYZER
// ============================================================================
export class MetaLearningAnalyzer {
    config;
    logger;
    patternStore;
    insightStore;
    strategyStore;
    eventStore;
    constructor(config = {}) {
        this.config = {
            minEventsForPattern: config.minEventsForPattern ?? 10,
            patternConfidenceThreshold: config.patternConfidenceThreshold ?? 0.6,
            minSampleSize: config.minSampleSize ?? 5,
        };
        this.logger = config.logger;
        this.patternStore = config.patternStore ?? new InMemoryLearningPatternStore();
        this.insightStore = config.insightStore ?? new InMemoryMetaLearningInsightStore();
        this.strategyStore = config.strategyStore ?? new InMemoryLearningStrategyStore();
        this.eventStore = config.eventStore ?? new InMemoryLearningEventStore();
    }
    /**
     * Record a learning event
     */
    async recordEvent(event) {
        const savedEvent = await this.eventStore.create(event);
        this.logger?.debug('Learning event recorded', {
            eventId: savedEvent.id,
            eventType: savedEvent.eventType,
            userId: savedEvent.userId,
        });
        return savedEvent;
    }
    /**
     * Analyze events and detect patterns
     */
    async detectPatterns(userId, since) {
        const events = userId
            ? await this.eventStore.getByUser(userId, since)
            : await this.getAllEvents(since);
        if (events.length < this.config.minEventsForPattern) {
            this.logger?.info('Not enough events for pattern detection', {
                eventCount: events.length,
                minRequired: this.config.minEventsForPattern,
            });
            return [];
        }
        const patterns = [];
        // Analyze teaching strategy patterns
        const strategyPatterns = await this.analyzeStrategyPatterns(events);
        patterns.push(...strategyPatterns);
        // Analyze success/failure patterns
        const outcomePatterns = await this.analyzeOutcomePatterns(events);
        patterns.push(...outcomePatterns);
        // Analyze engagement patterns
        const engagementPatterns = await this.analyzeEngagementPatterns(events);
        patterns.push(...engagementPatterns);
        this.logger?.info('Pattern detection complete', {
            totalEvents: events.length,
            patternsDetected: patterns.length,
        });
        return patterns;
    }
    /**
     * Generate insights from patterns and analytics
     */
    async generateInsights(userId) {
        const insights = [];
        // Get recent patterns
        const patterns = await this.patternStore.getHighConfidence(this.config.patternConfidenceThreshold);
        // Get strategy performance
        const strategies = await this.strategyStore.getAll();
        // Get event stats
        const stats = await this.eventStore.getStats(userId, 'week');
        // Generate optimization insights
        const optimizationInsights = this.generateOptimizationInsights(patterns, strategies);
        insights.push(...optimizationInsights);
        // Generate warning insights
        const warningInsights = this.generateWarningInsights(stats, patterns);
        insights.push(...warningInsights);
        // Generate trend insights
        const trendInsights = await this.generateTrendInsights(userId);
        insights.push(...trendInsights);
        // Save insights
        for (const insight of insights) {
            await this.insightStore.create(insight);
        }
        this.logger?.info('Insight generation complete', {
            insightsGenerated: insights.length,
        });
        return insights;
    }
    /**
     * Get comprehensive analytics
     */
    async getAnalytics(userId, period = 'week') {
        const now = new Date();
        const periodStart = this.getPeriodStart(period);
        // Get patterns
        const allPatterns = await this.patternStore.getRecent(100);
        const patterns = allPatterns.filter((p) => p.lastObserved >= periodStart);
        // Get strategies
        const strategies = await this.strategyStore.getAll();
        // topStrategies is used for analytics but not directly in the return - fetched for cache warming
        void this.strategyStore.getTopPerforming(5);
        // Get event stats
        const stats = await this.eventStore.getStats(userId, period);
        // Get insights
        const activeInsights = await this.insightStore.getActive();
        const criticalInsights = activeInsights.filter((i) => i.priority === 'critical');
        // Calculate pattern counts by category
        const patternsByCategory = {
            teaching_strategy: 0,
            student_behavior: 0,
            content_effectiveness: 0,
            engagement_pattern: 0,
            error_pattern: 0,
            success_pattern: 0,
            interaction_style: 0,
        };
        for (const pattern of patterns) {
            patternsByCategory[pattern.category]++;
        }
        // Calculate effectiveness
        const overallEffectiveness = this.calculateOverallEffectiveness(stats, strategies);
        // Generate rankings
        const strategyRankings = this.generateStrategyRankings(strategies);
        const underperforming = strategyRankings
            .filter((s) => s.score < 50)
            .slice(0, 3);
        // Generate trends
        const effectivenessTrend = await this.calculateTrend(userId, 'effectiveness', period);
        const engagementTrend = await this.calculateTrend(userId, 'engagement', period);
        const errorRateTrend = await this.calculateTrend(userId, 'error_rate', period);
        return {
            id: `analytics_${Date.now()}`,
            userId,
            period,
            periodStart,
            periodEnd: now,
            patternsIdentified: patterns.length,
            highConfidencePatterns: patterns.filter((p) => p.confidenceScore >= 0.8).length,
            newPatterns: patterns.filter((p) => p.firstObserved >= periodStart).length,
            patternsByCategory,
            strategiesEvaluated: strategies.length,
            topStrategies: strategyRankings.slice(0, 5),
            underperformingStrategies: underperforming,
            overallEffectiveness,
            improvementFromBaseline: this.calculateImprovementFromBaseline(stats),
            calibrationAccuracy: stats.avgQuality / 100,
            insightsGenerated: activeInsights.length,
            criticalInsights: criticalInsights.length,
            actionableRecommendations: activeInsights.reduce((sum, i) => sum + i.recommendations.length, 0),
            effectivenessTrend,
            engagementTrend,
            errorRateTrend,
            generatedAt: now,
        };
    }
    /**
     * Get active insights
     */
    async getActiveInsights(type, priority, limit = 20) {
        let insights = await this.insightStore.getActive();
        if (type) {
            insights = insights.filter((i) => i.type === type);
        }
        if (priority) {
            insights = insights.filter((i) => i.priority === priority);
        }
        // Sort by priority
        const priorityOrder = {
            critical: 0,
            high: 1,
            medium: 2,
            low: 3,
            info: 4,
        };
        return insights
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
            .slice(0, limit);
    }
    /**
     * Register a new strategy
     */
    async registerStrategy(strategy) {
        return await this.strategyStore.create(strategy);
    }
    /**
     * Record strategy usage and outcome
     */
    async recordStrategyUsage(strategyId, outcome) {
        await this.strategyStore.recordUsage(strategyId, outcome);
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    async getAllEvents(_since) {
        // In production, this would query all events from the store
        // For now, we simulate by returning empty array
        return [];
    }
    async analyzeStrategyPatterns(events) {
        const patterns = [];
        const strategyEvents = events.filter((e) => e.strategyId);
        // Group by strategy
        const byStrategy = new Map();
        for (const event of strategyEvents) {
            const existing = byStrategy.get(event.strategyId) ?? [];
            existing.push(event);
            byStrategy.set(event.strategyId, existing);
        }
        for (const [strategyId, stratEvents] of Array.from(byStrategy.entries())) {
            if (stratEvents.length < this.config.minSampleSize)
                continue;
            const successEvents = stratEvents.filter((e) => e.outcome === 'success');
            const successRate = successEvents.length / stratEvents.length;
            const avgQuality = stratEvents.reduce((sum, e) => sum + (e.responseQuality ?? 0), 0) /
                stratEvents.length;
            const confidenceScore = this.calculateConfidence(stratEvents.length, successRate);
            if (confidenceScore >= this.config.patternConfidenceThreshold) {
                const pattern = await this.patternStore.create({
                    category: 'teaching_strategy',
                    name: `Strategy ${strategyId} effectiveness`,
                    description: `Strategy ${strategyId} shows ${(successRate * 100).toFixed(0)}% success rate`,
                    confidence: this.getConfidenceLevel(confidenceScore),
                    confidenceScore,
                    occurrenceCount: stratEvents.length,
                    sampleSize: stratEvents.length,
                    significanceLevel: this.calculateSignificance(stratEvents.length),
                    contexts: this.extractContexts(stratEvents),
                    triggers: [],
                    outcomes: [
                        {
                            metric: 'success_rate',
                            avgChange: successRate,
                            stdDev: 0,
                            sampleCount: stratEvents.length,
                        },
                    ],
                    successRate,
                    avgImpact: (avgQuality / 100) - 0.5,
                    consistency: this.calculateConsistency(stratEvents),
                    firstObserved: stratEvents[stratEvents.length - 1].timestamp,
                    lastObserved: stratEvents[0].timestamp,
                    trend: 'stable',
                });
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    async analyzeOutcomePatterns(events) {
        const patterns = [];
        const outcomeEvents = events.filter((e) => e.outcome);
        // Group by topic
        const byTopic = new Map();
        for (const event of outcomeEvents) {
            if (!event.topic)
                continue;
            const existing = byTopic.get(event.topic) ?? [];
            existing.push(event);
            byTopic.set(event.topic, existing);
        }
        for (const [topic, topicEvents] of Array.from(byTopic.entries())) {
            if (topicEvents.length < this.config.minSampleSize)
                continue;
            const successEvents = topicEvents.filter((e) => e.outcome === 'success');
            const failureEvents = topicEvents.filter((e) => e.outcome === 'failure');
            const successRate = successEvents.length / topicEvents.length;
            const failureRate = failureEvents.length / topicEvents.length;
            // Create pattern for significant success/failure rates
            if (failureRate > 0.3) {
                const confidenceScore = this.calculateConfidence(topicEvents.length, failureRate);
                const pattern = await this.patternStore.create({
                    category: 'error_pattern',
                    name: `High failure rate for ${topic}`,
                    description: `${topic} shows ${(failureRate * 100).toFixed(0)}% failure rate`,
                    confidence: this.getConfidenceLevel(confidenceScore),
                    confidenceScore,
                    occurrenceCount: failureEvents.length,
                    sampleSize: topicEvents.length,
                    significanceLevel: this.calculateSignificance(topicEvents.length),
                    contexts: this.extractContexts(failureEvents),
                    triggers: [],
                    outcomes: [
                        {
                            metric: 'failure_rate',
                            avgChange: failureRate,
                            stdDev: 0,
                            sampleCount: topicEvents.length,
                        },
                    ],
                    successRate,
                    avgImpact: -failureRate,
                    consistency: this.calculateConsistency(topicEvents),
                    firstObserved: topicEvents[topicEvents.length - 1].timestamp,
                    lastObserved: topicEvents[0].timestamp,
                    trend: 'stable',
                });
                patterns.push(pattern);
            }
        }
        return patterns;
    }
    async analyzeEngagementPatterns(events) {
        const patterns = [];
        const engagementEvents = events.filter((e) => e.duration && e.studentSatisfaction);
        if (engagementEvents.length < this.config.minSampleSize) {
            return patterns;
        }
        // Analyze satisfaction by duration
        const shortEvents = engagementEvents.filter((e) => e.duration < 60000);
        const mediumEvents = engagementEvents.filter((e) => e.duration >= 60000 && e.duration < 300000);
        const longEvents = engagementEvents.filter((e) => e.duration >= 300000);
        const avgSatisfaction = (events) => {
            if (events.length === 0)
                return 0;
            return events.reduce((sum, e) => sum + e.studentSatisfaction, 0) / events.length;
        };
        const shortSat = avgSatisfaction(shortEvents);
        const mediumSat = avgSatisfaction(mediumEvents);
        const longSat = avgSatisfaction(longEvents);
        if (mediumSat > shortSat && mediumSat > longSat && mediumEvents.length >= this.config.minSampleSize) {
            const confidenceScore = this.calculateConfidence(mediumEvents.length, 0.8);
            const pattern = await this.patternStore.create({
                category: 'engagement_pattern',
                name: 'Optimal session duration',
                description: 'Medium-length sessions (1-5 min) show highest satisfaction',
                confidence: this.getConfidenceLevel(confidenceScore),
                confidenceScore,
                occurrenceCount: mediumEvents.length,
                sampleSize: engagementEvents.length,
                significanceLevel: this.calculateSignificance(mediumEvents.length),
                contexts: [
                    { dimension: 'duration', value: 'medium', frequency: mediumEvents.length, correlation: 0.7 },
                ],
                triggers: [],
                outcomes: [
                    {
                        metric: 'satisfaction',
                        avgChange: mediumSat / 5,
                        stdDev: 0,
                        sampleCount: mediumEvents.length,
                    },
                ],
                successRate: 0.7,
                avgImpact: 0.3,
                consistency: this.calculateConsistency(mediumEvents),
                firstObserved: mediumEvents[mediumEvents.length - 1].timestamp,
                lastObserved: mediumEvents[0].timestamp,
                trend: 'stable',
            });
            patterns.push(pattern);
        }
        return patterns;
    }
    generateOptimizationInsights(patterns, strategies) {
        const insights = [];
        // Find underperforming strategies
        const lowPerformers = strategies.filter((s) => s.effectivenessScore < 50);
        if (lowPerformers.length > 0) {
            insights.push({
                id: '',
                type: 'optimization',
                priority: lowPerformers.length > 2 ? 'high' : 'medium',
                title: 'Underperforming teaching strategies detected',
                description: `${lowPerformers.length} strategies have effectiveness below 50%`,
                evidence: lowPerformers.map((s) => `${s.name}: ${s.effectivenessScore}% effectiveness`),
                recommendations: lowPerformers.map((s, i) => ({
                    id: `rec_${i}`,
                    action: `Review and improve ${s.name}`,
                    rationale: `Current effectiveness is ${s.effectivenessScore}%`,
                    priority: i + 1,
                    effort: 'medium',
                    expectedOutcome: 'Improved learning outcomes',
                })),
                confidence: 0.85,
                expectedImpact: 15,
                affectedAreas: lowPerformers.map((s) => s.name),
                timeframe: 'short_term',
                generatedAt: new Date(),
            });
        }
        // Find high-success patterns that could be leveraged
        const highSuccessPatterns = patterns.filter((p) => p.successRate > 0.8);
        if (highSuccessPatterns.length > 0) {
            insights.push({
                id: '',
                type: 'recommendation',
                priority: 'medium',
                title: 'High-success patterns identified',
                description: `${highSuccessPatterns.length} patterns show 80%+ success rates`,
                evidence: highSuccessPatterns.map((p) => `${p.name}: ${(p.successRate * 100).toFixed(0)}% success`),
                recommendations: [
                    {
                        id: 'rec_leverage',
                        action: 'Increase usage of high-success patterns',
                        rationale: 'These patterns consistently produce good outcomes',
                        priority: 1,
                        effort: 'low',
                        expectedOutcome: 'Improved overall effectiveness',
                    },
                ],
                confidence: 0.9,
                expectedImpact: 10,
                affectedAreas: highSuccessPatterns.map((p) => p.category),
                timeframe: 'immediate',
                generatedAt: new Date(),
            });
        }
        return insights;
    }
    generateWarningInsights(stats, patterns) {
        const insights = [];
        // Warn about low success rate
        if (stats.successRate < 0.5 && stats.totalEvents >= this.config.minSampleSize) {
            insights.push({
                id: '',
                type: 'warning',
                priority: 'high',
                title: 'Low overall success rate',
                description: `Success rate is ${(stats.successRate * 100).toFixed(0)}%, below 50% threshold`,
                evidence: [`Based on ${stats.totalEvents} events`],
                recommendations: [
                    {
                        id: 'rec_review',
                        action: 'Review teaching strategies and content',
                        rationale: 'Low success rate indicates systemic issues',
                        priority: 1,
                        effort: 'high',
                        expectedOutcome: 'Identify and fix root causes',
                    },
                ],
                confidence: 0.95,
                expectedImpact: 25,
                affectedAreas: ['overall_effectiveness'],
                timeframe: 'immediate',
                generatedAt: new Date(),
            });
        }
        // Warn about error patterns
        const errorPatterns = patterns.filter((p) => p.category === 'error_pattern');
        if (errorPatterns.length > 2) {
            insights.push({
                id: '',
                type: 'warning',
                priority: 'medium',
                title: 'Multiple error patterns detected',
                description: `${errorPatterns.length} recurring error patterns identified`,
                evidence: errorPatterns.map((p) => p.description),
                recommendations: errorPatterns.slice(0, 3).map((p, i) => ({
                    id: `rec_error_${i}`,
                    action: `Address error pattern: ${p.name}`,
                    rationale: p.description,
                    priority: i + 1,
                    effort: 'medium',
                    expectedOutcome: 'Reduced error rate',
                })),
                confidence: 0.8,
                expectedImpact: 15,
                affectedAreas: errorPatterns.map((p) => p.name),
                timeframe: 'short_term',
                generatedAt: new Date(),
            });
        }
        return insights;
    }
    async generateTrendInsights(userId) {
        const insights = [];
        // Get weekly and monthly stats
        const weekStats = await this.eventStore.getStats(userId, 'week');
        const monthStats = await this.eventStore.getStats(userId, 'month');
        // Check for declining quality
        if (weekStats.avgQuality < monthStats.avgQuality * 0.8 &&
            weekStats.totalEvents >= this.config.minSampleSize) {
            insights.push({
                id: '',
                type: 'trend',
                priority: 'high',
                title: 'Declining quality trend detected',
                description: `Weekly quality (${weekStats.avgQuality.toFixed(1)}) is 20% below monthly average`,
                evidence: [
                    `Weekly average: ${weekStats.avgQuality.toFixed(1)}`,
                    `Monthly average: ${monthStats.avgQuality.toFixed(1)}`,
                ],
                recommendations: [
                    {
                        id: 'rec_quality',
                        action: 'Investigate recent changes that may have affected quality',
                        rationale: 'Sharp decline suggests a recent issue',
                        priority: 1,
                        effort: 'medium',
                        expectedOutcome: 'Restore quality to baseline',
                    },
                ],
                confidence: 0.85,
                expectedImpact: 20,
                affectedAreas: ['quality'],
                timeframe: 'immediate',
                generatedAt: new Date(),
            });
        }
        return insights;
    }
    calculateOverallEffectiveness(stats, strategies) {
        const avgStrategyScore = strategies.length > 0
            ? strategies.reduce((sum, s) => sum + s.effectivenessScore, 0) / strategies.length
            : 50;
        return Math.round((stats.successRate * 40) + (stats.avgQuality * 0.4) + (avgStrategyScore * 0.2));
    }
    calculateImprovementFromBaseline(stats) {
        const baseline = 60; // Assumed baseline
        return stats.avgQuality - baseline;
    }
    generateStrategyRankings(strategies) {
        return strategies
            .map((s) => ({
            strategyId: s.id,
            strategyName: s.name,
            score: s.effectivenessScore,
            usageCount: s.usageCount,
            trend: s.trend === 'increasing' ? 'up' :
                s.trend === 'decreasing' ? 'down' : 'stable',
        }))
            .sort((a, b) => b.score - a.score);
    }
    async calculateTrend(_userId, _metric, _period) {
        // Simplified trend calculation
        return {
            direction: 'stable',
            changeRate: 0,
            dataPoints: [],
            confidence: 0.5,
        };
    }
    getPeriodStart(period) {
        const now = new Date();
        switch (period) {
            case 'hour':
                return new Date(now.getTime() - 60 * 60 * 1000);
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case 'all_time':
                return new Date(0);
            default:
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
    }
    calculateConfidence(sampleSize, rate) {
        // Simplified confidence calculation
        const sampleFactor = Math.min(1, sampleSize / 100);
        const rateFactor = Math.abs(rate - 0.5) * 2;
        return (sampleFactor * 0.6) + (rateFactor * 0.4);
    }
    getConfidenceLevel(score) {
        if (score >= 0.8)
            return 'high';
        if (score >= 0.6)
            return 'medium';
        if (score >= 0.4)
            return 'low';
        return 'emerging';
    }
    calculateSignificance(sampleSize) {
        // Simplified significance - in production would use proper stats
        return Math.min(1, sampleSize / 30);
    }
    extractContexts(events) {
        const contexts = [];
        const topicCounts = new Map();
        for (const event of events) {
            if (event.topic) {
                topicCounts.set(event.topic, (topicCounts.get(event.topic) ?? 0) + 1);
            }
        }
        for (const [topic, count] of Array.from(topicCounts.entries())) {
            if (count >= 2) {
                contexts.push({
                    dimension: 'topic',
                    value: topic,
                    frequency: count,
                    correlation: count / events.length,
                });
            }
        }
        return contexts;
    }
    calculateConsistency(events) {
        if (events.length < 2)
            return 1;
        const outcomes = events.filter((e) => e.outcome).map((e) => e.outcome === 'success' ? 1 : 0);
        if (outcomes.length < 2)
            return 1;
        // Calculate variance
        const mean = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
        const variance = outcomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outcomes.length;
        // Convert to consistency (1 - normalized std dev)
        return Math.max(0, 1 - Math.sqrt(variance));
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a meta-learning analyzer
 */
export function createMetaLearningAnalyzer(config) {
    return new MetaLearningAnalyzer(config);
}
//# sourceMappingURL=meta-learning-analyzer.js.map