/**
 * @sam-ai/core - Agent Orchestrator
 * Dependency-aware engine orchestration
 */
import { OrchestrationError } from './errors';
// ============================================================================
// ORCHESTRATOR
// ============================================================================
export class SAMAgentOrchestrator {
    engines = new Map();
    executionTiers = [];
    logger;
    constructor(config) {
        this.logger = config.logger ?? console;
    }
    // ============================================================================
    // ENGINE REGISTRATION
    // ============================================================================
    /**
     * Register an engine with the orchestrator
     */
    registerEngine(engine, enabled = true) {
        if (this.engines.has(engine.name)) {
            this.logger.warn(`[Orchestrator] Engine "${engine.name}" already registered, replacing`);
        }
        this.engines.set(engine.name, { engine, enabled });
        this.logger.debug(`[Orchestrator] Registered engine: ${engine.name} v${engine.version}`);
        // Recalculate execution order
        this.recalculateExecutionTiers();
    }
    /**
     * Unregister an engine
     */
    unregisterEngine(name) {
        const removed = this.engines.delete(name);
        if (removed) {
            this.recalculateExecutionTiers();
            this.logger.debug(`[Orchestrator] Unregistered engine: ${name}`);
        }
        return removed;
    }
    /**
     * Enable/disable an engine
     */
    setEngineEnabled(name, enabled) {
        const registration = this.engines.get(name);
        if (registration) {
            registration.enabled = enabled;
            this.logger.debug(`[Orchestrator] Engine "${name}" ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    /**
     * Get registered engine names
     */
    getRegisteredEngines() {
        return Array.from(this.engines.keys());
    }
    /**
     * Get enabled engine names
     */
    getEnabledEngines() {
        return Array.from(this.engines.entries())
            .filter(([, reg]) => reg.enabled)
            .map(([name]) => name);
    }
    // ============================================================================
    // ORCHESTRATION
    // ============================================================================
    /**
     * Run all enabled engines in dependency order
     */
    async orchestrate(context, query, options) {
        const startTime = Date.now();
        const results = {};
        const enginesFailed = [];
        const enginesCached = [];
        this.logger.debug(`[Orchestrator] Starting orchestration with query: "${query?.substring(0, 50)}..."`);
        // Determine which engines to run
        const enginesToRun = this.getEnginesToRun(options?.engines);
        // Initialize all engines
        await this.initializeEngines(enginesToRun);
        // Execute engines in tiers
        for (const tier of this.executionTiers) {
            const tierEngines = tier.engines.filter((name) => enginesToRun.includes(name));
            if (tierEngines.length === 0)
                continue;
            if (tier.parallel) {
                // Execute tier in parallel
                const tierResults = await Promise.all(tierEngines.map((name) => this.executeEngine(name, context, query, results)));
                // Collect results
                for (const result of tierResults) {
                    if (result) {
                        results[result.engineName] = result;
                        if (!result.success)
                            enginesFailed.push(result.engineName);
                        if (result.metadata.cached)
                            enginesCached.push(result.engineName);
                    }
                }
            }
            else {
                // Execute tier sequentially
                for (const name of tierEngines) {
                    const result = await this.executeEngine(name, context, query, results);
                    if (result) {
                        results[result.engineName] = result;
                        if (!result.success)
                            enginesFailed.push(result.engineName);
                        if (result.metadata.cached)
                            enginesCached.push(result.engineName);
                    }
                }
            }
        }
        // Aggregate results
        const response = this.aggregateResults(results, context, query);
        const metadata = {
            totalExecutionTime: Date.now() - startTime,
            enginesExecuted: Object.keys(results),
            enginesFailed,
            enginesCached,
            parallelTiers: this.executionTiers.map((t) => t.engines),
        };
        this.logger.debug(`[Orchestrator] Completed in ${metadata.totalExecutionTime}ms. ` +
            `Executed: ${metadata.enginesExecuted.length}, Failed: ${enginesFailed.length}, Cached: ${enginesCached.length}`);
        return {
            success: enginesFailed.length === 0,
            results,
            response,
            metadata,
        };
    }
    /**
     * Run a single engine by name
     */
    async runEngine(name, context, query, previousResults) {
        return this.executeEngine(name, context, query, previousResults ?? {});
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    /**
     * Execute a single engine
     */
    async executeEngine(name, context, query, previousResults) {
        const registration = this.engines.get(name);
        if (!registration || !registration.enabled) {
            return null;
        }
        try {
            const result = await registration.engine.execute({
                context,
                query,
                previousResults,
            });
            return result;
        }
        catch (error) {
            this.logger.error(`[Orchestrator] Engine "${name}" threw: ${error.message}`);
            return {
                engineName: name,
                success: false,
                data: null,
                metadata: {
                    executionTime: 0,
                    cached: false,
                    version: registration.engine.version,
                },
                error: {
                    code: 'ENGINE_ERROR',
                    message: error.message,
                    recoverable: true,
                },
            };
        }
    }
    /**
     * Initialize engines
     */
    async initializeEngines(names) {
        const initPromises = names
            .map((name) => this.engines.get(name)?.engine)
            .filter((engine) => engine !== undefined)
            .filter((engine) => !engine.isInitialized())
            .map((engine) => engine.initialize());
        await Promise.all(initPromises);
    }
    /**
     * Get list of engines to run based on options
     */
    getEnginesToRun(requestedEngines) {
        const enabledEngines = this.getEnabledEngines();
        if (!requestedEngines || requestedEngines.length === 0) {
            return enabledEngines;
        }
        // Filter to only requested engines that are enabled
        return requestedEngines.filter((name) => enabledEngines.includes(name));
    }
    /**
     * Calculate execution tiers based on dependencies (topological sort)
     */
    recalculateExecutionTiers() {
        const engines = Array.from(this.engines.entries())
            .filter(([, reg]) => reg.enabled)
            .map(([name, reg]) => ({
            name,
            dependencies: reg.engine.dependencies,
        }));
        const tiers = [];
        const scheduled = new Set();
        const remaining = new Set(engines.map((e) => e.name));
        while (remaining.size > 0) {
            const tier = [];
            for (const engine of engines) {
                if (scheduled.has(engine.name))
                    continue;
                if (!remaining.has(engine.name))
                    continue;
                // Check if all dependencies are scheduled
                const depsScheduled = engine.dependencies.every((dep) => scheduled.has(dep) || !remaining.has(dep));
                if (depsScheduled) {
                    tier.push(engine.name);
                }
            }
            if (tier.length === 0 && remaining.size > 0) {
                // Circular dependency detected
                throw new OrchestrationError(`Circular dependency detected among engines: ${Array.from(remaining).join(', ')}`);
            }
            for (const name of tier) {
                scheduled.add(name);
                remaining.delete(name);
            }
            if (tier.length > 0) {
                tiers.push({
                    engines: tier,
                    parallel: tier.length > 1, // Parallelize if multiple engines in tier
                });
            }
        }
        this.executionTiers = tiers;
        this.logger.debug(`[Orchestrator] Execution tiers: ${tiers.map((t) => `[${t.engines.join(', ')}]`).join(' -> ')}`);
    }
    /**
     * Aggregate results from all engines into a unified response
     */
    aggregateResults(results, context, query) {
        // Check if we have a response engine result
        const responseEngine = results['response'];
        if (responseEngine?.success && responseEngine.data) {
            const data = responseEngine.data;
            return {
                message: data.message || this.generateDefaultMessage(context, query),
                suggestions: data.suggestions || [],
                actions: data.actions || this.getPageActions(context.page.type),
                insights: data.insights || this.extractInsights(results),
                blooms: data.blooms,
            };
        }
        // Fallback aggregation
        return {
            message: this.generateDefaultMessage(context, query),
            suggestions: this.extractSuggestions(results),
            actions: this.getPageActions(context.page.type),
            insights: this.extractInsights(results),
            blooms: this.extractBloomsAnalysis(results),
        };
    }
    /**
     * Generate a default message based on context
     */
    generateDefaultMessage(context, query) {
        if (query) {
            return `I've analyzed your request and prepared insights based on the current context.`;
        }
        const pageMessages = {
            // Dashboard routes
            dashboard: "Welcome! I'm here to help you manage your courses and track your progress.",
            'user-dashboard': "Welcome back! I can help you continue learning or explore new courses.",
            'admin-dashboard': "I can assist with platform management, user analytics, or system settings.",
            'teacher-dashboard': "I'm here to help you manage courses, view analytics, or create new content.",
            'user-analytics': "I can help you understand your learning progress and identify areas for improvement.",
            // Course management routes
            'courses-list': 'I can help you analyze your courses, create new ones, or find insights.',
            'course-detail': 'I can help you improve this course structure, generate content, or analyze its effectiveness.',
            'course-create': "Let's create an amazing course together. I'll guide you through the process.",
            'chapter-detail': 'I can help you develop this chapter, create assessments, or improve the content.',
            'section-detail': 'I can help you enhance this section with better content or assessments.',
            analytics: 'I can help you understand your analytics and provide actionable insights.',
            // Learning routes
            learning: "I'm here to help you learn! Ask me anything about the course material.",
            'course-learning': "Ready to start learning? I can guide you through this course and answer questions.",
            'chapter-learning': "I'm here to help you understand this chapter. Ask me about any concepts!",
            'section-learning': "Let me help you complete this section. Feel free to ask for clarification.",
            // Exam routes
            exam: 'I can help you prepare for this assessment or explain any concepts.',
            'exam-results': "Let's review your results together. I can help you understand your performance and improve.",
            // General routes
            settings: 'I can help you configure your preferences and settings.',
            other: 'How can I assist you today?',
        };
        return pageMessages[context.page.type] || pageMessages.other;
    }
    /**
     * Extract suggestions from engine results
     */
    extractSuggestions(results) {
        const suggestions = [];
        let id = 0;
        for (const result of Object.values(results)) {
            if (!result.success || !result.data)
                continue;
            const data = result.data;
            if (Array.isArray(data.suggestions)) {
                for (const suggestion of data.suggestions) {
                    if (typeof suggestion === 'string') {
                        suggestions.push({
                            id: `sug_${id++}`,
                            label: suggestion.substring(0, 50),
                            text: suggestion,
                            type: 'quick-reply',
                        });
                    }
                    else if (typeof suggestion === 'object' && suggestion !== null) {
                        suggestions.push({
                            ...suggestion,
                            id: `sug_${id++}`,
                        });
                    }
                }
            }
            if (Array.isArray(data.recommendations)) {
                for (const rec of data.recommendations) {
                    if (typeof rec === 'string') {
                        suggestions.push({
                            id: `sug_${id++}`,
                            label: rec.substring(0, 50),
                            text: rec,
                            type: 'action',
                        });
                    }
                }
            }
        }
        // Deduplicate and limit
        const unique = suggestions.filter((s, i, arr) => arr.findIndex((x) => x.text === s.text) === i);
        return unique.slice(0, 5);
    }
    /**
     * Get page-specific actions
     */
    getPageActions(pageType) {
        const actionMap = {
            // Dashboard routes
            dashboard: [
                { id: 'act_1', type: 'navigate', label: 'View Courses', payload: { path: '/teacher/courses' } },
                { id: 'act_2', type: 'analyze', label: 'Get Insights', payload: { type: 'overview' } },
            ],
            'user-dashboard': [
                { id: 'act_1', type: 'navigate', label: 'Continue Learning', payload: { path: '/courses' } },
                { id: 'act_2', type: 'custom', label: 'Get Recommendations', payload: { type: 'recommendations' } },
            ],
            'admin-dashboard': [
                { id: 'act_1', type: 'analyze', label: 'Platform Analytics', payload: { type: 'platform' } },
                { id: 'act_2', type: 'navigate', label: 'Manage Users', payload: { path: '/admin/users' } },
            ],
            'teacher-dashboard': [
                { id: 'act_1', type: 'navigate', label: 'View Courses', payload: { path: '/teacher/courses' } },
                { id: 'act_2', type: 'navigate', label: 'Create Course', payload: { path: '/teacher/create' } },
            ],
            'user-analytics': [
                { id: 'act_1', type: 'analyze', label: 'Learning Insights', payload: { type: 'learning' } },
                { id: 'act_2', type: 'custom', label: 'Set Goals', payload: { type: 'goals' } },
            ],
            // Course management routes
            'courses-list': [
                { id: 'act_1', type: 'navigate', label: 'Create Course', payload: { path: '/teacher/create' } },
                { id: 'act_2', type: 'analyze', label: 'Analyze Courses', payload: { type: 'courses-overview' } },
            ],
            'course-detail': [
                { id: 'act_1', type: 'generate', label: 'Generate Chapters', payload: { type: 'chapters' } },
                { id: 'act_2', type: 'analyze', label: 'Analyze Structure', payload: { type: 'blooms' } },
            ],
            'course-create': [
                { id: 'act_1', type: 'generate', label: 'Generate Blueprint', payload: { type: 'blueprint' } },
                { id: 'act_2', type: 'analyze', label: 'Validate Structure', payload: { type: 'validation' } },
            ],
            'chapter-detail': [
                { id: 'act_1', type: 'generate', label: 'Generate Sections', payload: { type: 'sections' } },
                { id: 'act_2', type: 'generate', label: 'Create Assessment', payload: { type: 'assessment' } },
            ],
            'section-detail': [
                { id: 'act_1', type: 'generate', label: 'Enhance Content', payload: { type: 'content' } },
                { id: 'act_2', type: 'analyze', label: 'Analyze Blooms', payload: { type: 'blooms' } },
            ],
            analytics: [
                { id: 'act_1', type: 'analyze', label: 'Deep Analysis', payload: { type: 'comprehensive' } },
                { id: 'act_2', type: 'generate', label: 'Generate Report', payload: { type: 'report' } },
            ],
            // Learning routes
            learning: [
                { id: 'act_1', type: 'custom', label: 'Explain This', payload: { type: 'explain' } },
                { id: 'act_2', type: 'custom', label: 'Quiz Me', payload: { type: 'quiz' } },
            ],
            'course-learning': [
                { id: 'act_1', type: 'custom', label: 'Start Learning', payload: { type: 'start' } },
                { id: 'act_2', type: 'custom', label: 'Ask About Course', payload: { type: 'explain' } },
            ],
            'chapter-learning': [
                { id: 'act_1', type: 'custom', label: 'Explain This', payload: { type: 'explain' } },
                { id: 'act_2', type: 'custom', label: 'Quiz Me', payload: { type: 'quiz' } },
            ],
            'section-learning': [
                { id: 'act_1', type: 'custom', label: 'Get Help', payload: { type: 'help' } },
                { id: 'act_2', type: 'custom', label: 'Check Understanding', payload: { type: 'quiz' } },
            ],
            // Exam routes
            exam: [
                { id: 'act_1', type: 'custom', label: 'Get Hint', payload: { type: 'hint' } },
                { id: 'act_2', type: 'custom', label: 'Explain Answer', payload: { type: 'explain' } },
            ],
            'exam-results': [
                { id: 'act_1', type: 'custom', label: 'Review Mistakes', payload: { type: 'review' } },
                { id: 'act_2', type: 'custom', label: 'Improvement Tips', payload: { type: 'improve' } },
            ],
            // General routes
            settings: [],
            other: [],
        };
        return actionMap[pageType] || [];
    }
    /**
     * Extract insights from engine results
     */
    extractInsights(results) {
        const insights = {};
        for (const [name, result] of Object.entries(results)) {
            if (result.success && result.data) {
                insights[name] = result.data;
            }
        }
        return insights;
    }
    /**
     * Extract Bloom's analysis from results
     */
    extractBloomsAnalysis(results) {
        const bloomsResult = results['blooms'];
        if (bloomsResult?.success && bloomsResult.data) {
            const data = bloomsResult.data;
            if (data.distribution && data.dominantLevel) {
                return data;
            }
        }
        return undefined;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createOrchestrator(config) {
    return new SAMAgentOrchestrator(config);
}
//# sourceMappingURL=orchestrator.js.map