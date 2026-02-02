/**
 * @sam-ai/educational - Unified Bloom's Taxonomy Engine
 *
 * Priority 1: Unified Bloom's Engine
 *
 * This engine merges the keyword-only core engine with the AI+DB educational engine,
 * providing a single unified interface with intelligent fallback.
 *
 * Key features:
 * - Fast keyword-only classification for quick analysis (<10ms)
 * - AI-powered semantic analysis for comprehensive understanding
 * - Confidence-based escalation: if keyword confidence < threshold, uses AI
 * - In-memory caching for AI results to reduce costs
 * - Course-level analysis with learning pathways
 * - Cognitive progress tracking with spaced repetition (SM-2)
 *
 * @packageDocumentation
 */
import { z } from 'zod';
import { BLOOMS_LEVELS, BLOOMS_LEVEL_ORDER } from '@sam-ai/core';
import { createSubLevelAnalyzer, } from '@sam-ai/pedagogy';
import { parseAndValidate, } from '../validation/utils';
import { createSemanticBloomsClassifier, AMBIGUOUS_VERBS, } from '../semantic-blooms-classifier';
import { createBloomsCalibrator, bloomsLevelToNumber, numberToBloomsLevel, } from '../calibration';
// ============================================================================
// BLOOM'S TAXONOMY KEYWORDS (from core engine)
// ============================================================================
const BLOOMS_KEYWORDS = {
    REMEMBER: [
        'define', 'list', 'recall', 'name', 'identify', 'describe', 'label',
        'recognize', 'match', 'select', 'state', 'memorize', 'repeat', 'record',
        'outline', 'duplicate', 'reproduce', 'recite', 'locate', 'tell',
    ],
    UNDERSTAND: [
        'explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast',
        'discuss', 'distinguish', 'paraphrase', 'predict', 'translate', 'extend',
        'infer', 'estimate', 'generalize', 'rewrite', 'exemplify', 'illustrate',
    ],
    APPLY: [
        'apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'operate',
        'practice', 'calculate', 'compute', 'construct', 'modify', 'produce',
        'show', 'complete', 'examine', 'illustrate', 'experiment', 'schedule',
    ],
    ANALYZE: [
        'analyze', 'differentiate', 'organize', 'attribute', 'compare', 'contrast',
        'distinguish', 'examine', 'experiment', 'question', 'test', 'investigate',
        'categorize', 'deconstruct', 'diagram', 'dissect', 'survey', 'correlate',
    ],
    EVALUATE: [
        'evaluate', 'judge', 'critique', 'justify', 'assess', 'argue', 'defend',
        'support', 'value', 'prioritize', 'rank', 'rate', 'recommend', 'conclude',
        'appraise', 'criticize', 'decide', 'discriminate', 'measure', 'validate',
    ],
    CREATE: [
        'create', 'design', 'develop', 'construct', 'produce', 'invent', 'compose',
        'formulate', 'generate', 'plan', 'assemble', 'devise', 'build', 'author',
        'combine', 'compile', 'integrate', 'modify', 'reorganize', 'synthesize',
    ],
};
// ============================================================================
// ZOD SCHEMAS FOR AI RESPONSE VALIDATION
// ============================================================================
/**
 * Schema for AI-generated Bloom's Taxonomy analysis response
 * Used by parseAndValidate to ensure type-safe parsing
 */
const BloomsDistributionSchema = z.object({
    REMEMBER: z.number().min(0).max(100).optional().default(0),
    UNDERSTAND: z.number().min(0).max(100).optional().default(0),
    APPLY: z.number().min(0).max(100).optional().default(0),
    ANALYZE: z.number().min(0).max(100).optional().default(0),
    EVALUATE: z.number().min(0).max(100).optional().default(0),
    CREATE: z.number().min(0).max(100).optional().default(0),
});
const BloomsAIResponseSchema = z.object({
    dominantLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    distribution: BloomsDistributionSchema.optional(),
    confidence: z.number().min(0).max(1).default(0.8),
    cognitiveDepth: z.number().min(0).max(100).default(50),
    balance: z.enum(['well-balanced', 'bottom-heavy', 'top-heavy']).default('well-balanced'),
    gaps: z.array(z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'])).default([]),
    recommendations: z.array(z.object({
        type: z.string().optional(),
        priority: z.enum(['high', 'medium', 'low']).default('medium'),
        message: z.string().optional(),
        action: z.string().optional(),
        targetLevel: z.enum(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']).optional(),
    })).default([]),
});
// ============================================================================
// UNIFIED BLOOM'S ENGINE
// ============================================================================
export class UnifiedBloomsEngine {
    config;
    database;
    defaultMode;
    confidenceThreshold;
    enableCache;
    cacheTTL;
    // LRU cache for AI analysis results (bounded to prevent OOM)
    cache = new Map();
    maxCacheEntries;
    cacheHits = 0;
    cacheMisses = 0;
    // Sub-level analyzer for granular Bloom's classification (Phase 1)
    subLevelAnalyzer;
    // Semantic classifier for verb disambiguation (Phase 2)
    semanticClassifier;
    enableSemanticDisambiguation;
    semanticClassifierReady = false;
    // Calibrator for confidence adjustment (Phase 5)
    calibrator;
    enableCalibration;
    constructor(config) {
        this.config = config.samConfig;
        this.database = config.database;
        this.defaultMode = config.defaultMode ?? 'standard';
        this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
        this.enableCache = config.enableCache ?? true;
        this.cacheTTL = (config.cacheTTL ?? 3600) * 1000; // Convert to ms
        this.maxCacheEntries = config.maxCacheEntries ?? 500;
        this.subLevelAnalyzer = createSubLevelAnalyzer();
        // Phase 2: Initialize semantic classifier
        this.enableSemanticDisambiguation = config.enableSemanticDisambiguation ?? false;
        this.semanticClassifier = createSemanticBloomsClassifier({
            embeddingProvider: config.embeddingProvider,
            cacheTTL: this.cacheTTL,
        });
        // Pre-load reference embeddings if enabled and provider available
        if (this.enableSemanticDisambiguation && config.embeddingProvider) {
            this.initializeSemanticClassifier();
        }
        // Phase 5: Initialize calibrator for confidence adjustment
        this.enableCalibration = config.enableCalibration ?? false;
        this.calibrator = createBloomsCalibrator({
            minSamplesForCalibration: config.calibrationMinSamples ?? 100,
            maxAdjustmentFactor: config.calibrationMaxAdjustment ?? 0.3,
        }, config.calibratorStore);
    }
    /**
     * Initialize the semantic classifier asynchronously
     * Loads reference embeddings for all Bloom's levels
     */
    async initializeSemanticClassifier() {
        try {
            await this.semanticClassifier.loadReferenceEmbeddings();
            this.semanticClassifierReady = true;
            this.config.logger?.debug?.('[UnifiedBloomsEngine] Semantic classifier initialized');
        }
        catch (error) {
            this.config.logger?.warn?.('[UnifiedBloomsEngine] Failed to initialize semantic classifier', error);
        }
    }
    // ============================================================================
    // PUBLIC API - QUICK CLASSIFY
    // ============================================================================
    /**
     * Fast keyword-only classification (<10ms)
     * Use when you need immediate results without AI costs
     *
     * @param content - Text content to classify
     * @returns The dominant Bloom's level
     */
    quickClassify(content) {
        const text = content.toLowerCase();
        const distribution = this.analyzeKeywordDistribution(text);
        return this.findDominantLevel(distribution);
    }
    // ============================================================================
    // PUBLIC API - ANALYZE CONTENT
    // ============================================================================
    /**
     * Analyze content with intelligent mode selection
     *
     * In 'quick' mode: keyword-only analysis
     * In 'standard' mode: keyword analysis, AI escalation if confidence < threshold
     * In 'comprehensive' mode: full AI semantic analysis
     *
     * Phase 2: Semantic disambiguation is automatically applied when:
     * - Embedding provider is configured and ready
     * - Ambiguous verbs are detected in the content
     * - Confidence from keyword analysis is below threshold
     *
     * @param content - Text content to analyze
     * @param options - Analysis options
     * @returns Unified analysis result
     */
    async analyze(content, options = {}) {
        const startTime = Date.now();
        const mode = options.mode ?? this.defaultMode;
        // Check cache first
        if (this.enableCache && !options.forceAI) {
            const cacheKey = this.generateCacheKey('content', content, mode);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    metadata: {
                        ...cached.metadata,
                        fromCache: true,
                    },
                };
            }
        }
        // Quick mode: keyword-only
        if (mode === 'quick' || options.forceKeyword) {
            const result = this.analyzeWithKeywords(content, options, startTime);
            return result;
        }
        // Standard mode: keyword first, escalate if needed
        if (mode === 'standard' && !options.forceAI) {
            let keywordResult = this.analyzeWithKeywords(content, options, startTime);
            const threshold = options.confidenceThreshold ?? this.confidenceThreshold;
            // Phase 2: Try semantic disambiguation if confidence is low and ambiguous verbs found
            const useSemanticDisambiguation = options.useSemanticDisambiguation !== false &&
                this.enableSemanticDisambiguation &&
                this.semanticClassifierReady;
            if (keywordResult.confidence < threshold &&
                keywordResult.ambiguousVerbsFound &&
                keywordResult.ambiguousVerbsFound.length > 0 &&
                useSemanticDisambiguation) {
                keywordResult = await this.applySemanticDisambiguation(content, keywordResult, startTime);
            }
            // If confidence is high enough, return result
            if (keywordResult.confidence >= threshold) {
                return keywordResult;
            }
            // Escalate to AI analysis
            return this.analyzeWithAI(content, keywordResult, options, startTime);
        }
        // Comprehensive mode: full AI analysis
        return this.analyzeWithAI(content, undefined, options, startTime);
    }
    /**
     * Apply semantic disambiguation to improve classification (Phase 2)
     * Uses embeddings to disambiguate verbs that can indicate multiple levels
     */
    async applySemanticDisambiguation(content, keywordResult, startTime) {
        const semanticStartTime = Date.now();
        try {
            const semanticResult = await this.semanticClassifier.classify(content);
            // Only update if semantic analysis was confident
            if (semanticResult.disambiguated && semanticResult.confidence > keywordResult.confidence) {
                return {
                    ...keywordResult,
                    dominantLevel: semanticResult.level,
                    confidence: semanticResult.confidence,
                    semanticDisambiguated: true,
                    semanticSimilarityScores: semanticResult.similarityScores,
                    metadata: {
                        ...keywordResult.metadata,
                        method: 'hybrid',
                        processingTimeMs: Date.now() - startTime,
                        semanticDisambiguationUsed: true,
                        semanticProcessingTimeMs: semanticResult.processingTimeMs,
                    },
                };
            }
            // Semantic analysis didn't improve confidence
            return {
                ...keywordResult,
                semanticSimilarityScores: semanticResult.similarityScores,
                metadata: {
                    ...keywordResult.metadata,
                    semanticDisambiguationUsed: true,
                    semanticProcessingTimeMs: Date.now() - semanticStartTime,
                },
            };
        }
        catch (error) {
            // Log error but continue with keyword result
            this.config.logger?.warn?.('[UnifiedBloomsEngine] Semantic disambiguation failed', error);
            return keywordResult;
        }
    }
    /**
     * Directly classify content using semantic analysis (Phase 2)
     * Bypasses keyword analysis and uses only embeddings
     *
     * @param content - Text content to classify
     * @returns Semantic classification result
     */
    async classifyWithSemantics(content) {
        if (!this.semanticClassifierReady) {
            return null;
        }
        try {
            return await this.semanticClassifier.classify(content);
        }
        catch (error) {
            this.config.logger?.warn?.('[UnifiedBloomsEngine] Semantic classification failed', error);
            return null;
        }
    }
    /**
     * Check if semantic classifier is ready for use (Phase 2)
     */
    isSemanticClassifierReady() {
        return this.semanticClassifierReady;
    }
    // ============================================================================
    // PUBLIC API - ANALYZE COURSE
    // ============================================================================
    /**
     * Analyze an entire course structure
     *
     * @param courseData - Course structure with chapters and sections
     * @param options - Analysis options
     * @returns Course-level analysis with recommendations
     */
    async analyzeCourse(courseData, options = {}) {
        const startTime = Date.now();
        const mode = options.mode ?? this.defaultMode;
        // Check cache
        if (this.enableCache && !options.forceReanalyze) {
            const cacheKey = this.generateCacheKey('course', courseData.id, mode);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    metadata: {
                        ...cached.metadata,
                        fromCache: true,
                    },
                };
            }
        }
        // Analyze each chapter
        const chapterAnalyses = [];
        const allDistributions = [];
        let totalConfidence = 0;
        for (const chapter of courseData.chapters) {
            const chapterText = this.extractChapterText(chapter);
            const chapterResult = await this.analyze(chapterText, {
                mode: options.depth === 'comprehensive' ? 'comprehensive' : 'standard',
                includeSections: true,
            });
            const sectionAnalyses = chapter.sections.map((section) => {
                // Build enriched text including learning objectives
                const sectionTextParts = [
                    section.title,
                    section.content ?? '',
                    section.description ?? '',
                ];
                // Add learning objectives - excellent source of Bloom's action verbs
                if (section.learningObjectives && section.learningObjectives.length > 0) {
                    sectionTextParts.push(...section.learningObjectives);
                }
                // Add question text for additional context
                if (section.questions && section.questions.length > 0) {
                    sectionTextParts.push(...section.questions.map((q) => q.text));
                }
                const sectionText = sectionTextParts.join(' ');
                // Determine level - consider existing question Bloom's levels if available
                let level = this.quickClassify(sectionText);
                let confidence = this.calculateKeywordConfidence(sectionText.toLowerCase(), level);
                // If section has questions with Bloom's levels, use weighted combination
                if (section.questions && section.questions.length > 0) {
                    const questionLevels = section.questions
                        .filter((q) => q.bloomsLevel)
                        .map((q) => q.bloomsLevel);
                    if (questionLevels.length > 0) {
                        // Calculate dominant level from questions
                        const questionDominant = this.getDominantLevel(questionLevels);
                        // Boost confidence if questions agree with keyword analysis
                        if (questionDominant === level) {
                            confidence = Math.min(1.0, confidence + 0.15);
                        }
                        else {
                            // Use question-based level if it differs (assessment data is authoritative)
                            level = questionDominant;
                            confidence = Math.min(1.0, confidence + 0.1);
                        }
                    }
                }
                const sectionAnalysis = {
                    id: section.id,
                    title: section.title,
                    level,
                    confidence,
                };
                // Add sub-level information if requested (Phase 1: Sub-Level Granularity)
                if (options.includeSubLevel) {
                    const enhancedResult = this.subLevelAnalyzer.getEnhancedResult(level, confidence, sectionText);
                    sectionAnalysis.subLevel = enhancedResult.subLevel;
                    sectionAnalysis.numericScore = enhancedResult.numericScore;
                    sectionAnalysis.subLevelLabel = enhancedResult.label;
                }
                return sectionAnalysis;
            });
            chapterAnalyses.push({
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                distribution: chapterResult.distribution,
                primaryLevel: chapterResult.dominantLevel,
                cognitiveDepth: chapterResult.cognitiveDepth,
                confidence: chapterResult.confidence,
                sections: sectionAnalyses,
            });
            allDistributions.push(chapterResult.distribution);
            totalConfidence += chapterResult.confidence;
        }
        // Calculate course-level metrics
        const courseDistribution = this.aggregateDistributions(allDistributions);
        const courseCognitiveDepth = this.calculateCognitiveDepth(courseDistribution);
        const courseBalance = this.determineBalance(courseDistribution);
        const avgConfidence = chapterAnalyses.length > 0
            ? totalConfidence / chapterAnalyses.length
            : 0.5;
        // Generate recommendations
        const recommendations = this.generateCourseRecommendations(courseDistribution, chapterAnalyses, courseBalance);
        // Generate learning pathway if requested
        let learningPathway;
        if (options.includeLearningPathway !== false) {
            learningPathway = this.generateLearningPathway(courseDistribution, chapterAnalyses);
        }
        const result = {
            courseId: courseData.id,
            courseLevel: {
                distribution: courseDistribution,
                cognitiveDepth: courseCognitiveDepth,
                balance: courseBalance,
                confidence: avgConfidence,
            },
            chapters: chapterAnalyses,
            recommendations,
            learningPathway,
            metadata: {
                method: mode === 'comprehensive' ? 'ai' : 'hybrid',
                processingTimeMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                fromCache: false,
            },
            analyzedAt: new Date().toISOString(),
        };
        // Cache result
        if (this.enableCache) {
            const cacheKey = this.generateCacheKey('course', courseData.id, mode);
            this.setCache(cacheKey, result);
        }
        return result;
    }
    async updateCognitiveProgress(inputOrUserId, sectionId, bloomsLevel, score) {
        // Handle legacy signature
        if (typeof inputOrUserId === 'string') {
            const userId = inputOrUserId;
            if (!sectionId || !bloomsLevel || score === undefined) {
                throw new Error('Missing required parameters for legacy signature');
            }
            // Use database adapter for progress tracking
            if (this.database) {
                try {
                    const existing = await this.database.findBloomsProgress(userId, sectionId);
                    const scores = {
                        REMEMBER: 0,
                        UNDERSTAND: 0,
                        APPLY: 0,
                        ANALYZE: 0,
                        EVALUATE: 0,
                        CREATE: 0,
                    };
                    if (existing) {
                        scores.REMEMBER = existing.rememberScore ?? 0;
                        scores.UNDERSTAND = existing.understandScore ?? 0;
                        scores.APPLY = existing.applyScore ?? 0;
                        scores.ANALYZE = existing.analyzeScore ?? 0;
                        scores.EVALUATE = existing.evaluateScore ?? 0;
                        scores.CREATE = existing.createScore ?? 0;
                    }
                    // Weighted average with new score
                    const currentScore = scores[bloomsLevel] ?? 0;
                    scores[bloomsLevel] = (currentScore * 0.7) + (score * 0.3);
                    await this.database.upsertBloomsProgress(userId, sectionId, {
                        rememberScore: scores.REMEMBER,
                        understandScore: scores.UNDERSTAND,
                        applyScore: scores.APPLY,
                        analyzeScore: scores.ANALYZE,
                        evaluateScore: scores.EVALUATE,
                        createScore: scores.CREATE,
                    });
                }
                catch (error) {
                    this.config.logger?.error?.('[UnifiedBloomsEngine] Failed to update cognitive progress', error);
                }
            }
            return;
        }
        // Handle new signature
        const input = inputOrUserId;
        if (!this.database) {
            throw new Error('Database adapter required for cognitive progress tracking');
        }
        // Get current profile
        const profile = await this.getCognitiveProfile(input.userId, input.courseId);
        // Update level mastery
        const currentMastery = profile.levelMastery[input.bloomsLevel] ?? 0;
        const newMastery = Math.min(100, currentMastery + (input.score * 10));
        profile.levelMastery[input.bloomsLevel] = newMastery;
        // Recalculate overall mastery
        const masteryValues = Object.values(profile.levelMastery);
        profile.overallMastery = masteryValues.length > 0
            ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length
            : 0;
        // Update preferred and challenge areas
        profile.preferredLevels = this.identifyPreferredLevels(profile.levelMastery);
        profile.challengeAreas = this.identifyChallengeAreas(profile.levelMastery);
        // Generate recommendations
        const recommendations = this.generateProgressRecommendations(profile, input.bloomsLevel, input.score);
        return {
            updated: true,
            profile,
            recommendations,
        };
    }
    /**
     * Get cognitive profile for a user
     *
     * Fetches student's Bloom's progress from the database and transforms it
     * into a cognitive profile for adaptive learning and personalization.
     *
     * @param userId - User ID to fetch profile for
     * @param courseId - Optional course ID to scope the profile
     * @returns Cognitive profile with level mastery and learning insights
     */
    async getCognitiveProfile(userId, courseId) {
        // Default profile structure
        const defaultProfile = {
            overallMastery: 0,
            levelMastery: {
                REMEMBER: 0,
                UNDERSTAND: 0,
                APPLY: 0,
                ANALYZE: 0,
                EVALUATE: 0,
                CREATE: 0,
            },
            learningVelocity: 1.0,
            preferredLevels: [],
            challengeAreas: [],
        };
        if (!this.database) {
            return defaultProfile;
        }
        // Fetch Bloom's progress from database
        // Note: courseId is required for the database query
        if (!courseId) {
            // Without a courseId, we return the default profile
            // Future enhancement: aggregate across all courses
            return defaultProfile;
        }
        try {
            const progress = await this.database.findBloomsProgress(userId, courseId);
            if (!progress) {
                return defaultProfile;
            }
            // Transform SAMBloomsProgress scores (0-100) to normalized mastery (0-1)
            const levelMastery = {
                REMEMBER: progress.rememberScore / 100,
                UNDERSTAND: progress.understandScore / 100,
                APPLY: progress.applyScore / 100,
                ANALYZE: progress.analyzeScore / 100,
                EVALUATE: progress.evaluateScore / 100,
                CREATE: progress.createScore / 100,
            };
            // Calculate overall mastery (weighted by cognitive complexity)
            // Higher-order skills carry more weight in overall mastery
            const weights = {
                REMEMBER: 0.10,
                UNDERSTAND: 0.15,
                APPLY: 0.20,
                ANALYZE: 0.20,
                EVALUATE: 0.17,
                CREATE: 0.18,
            };
            const overallMastery = Object.entries(levelMastery).reduce((sum, [level, score]) => sum + score * weights[level], 0);
            // Identify preferred levels (mastery >= 0.7)
            const preferredLevels = Object.entries(levelMastery)
                .filter(([, score]) => score >= 0.7)
                .sort((a, b) => b[1] - a[1])
                .map(([level]) => level);
            // Identify challenge areas (mastery < 0.4)
            const challengeAreas = Object.entries(levelMastery)
                .filter(([, score]) => score < 0.4)
                .sort((a, b) => a[1] - b[1])
                .map(([level]) => level);
            // Calculate learning velocity based on assessment count and recency
            // More assessments + recent activity = higher velocity
            let learningVelocity = 1.0;
            if (progress.assessmentCount > 0) {
                // Base velocity on assessment frequency
                const frequencyBonus = Math.min(progress.assessmentCount / 10, 0.5);
                learningVelocity = 1.0 + frequencyBonus;
                // Adjust for recency (decay if last assessment was long ago)
                if (progress.lastAssessedAt) {
                    const daysSinceLastAssessment = Math.floor((Date.now() - new Date(progress.lastAssessedAt).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceLastAssessment > 30) {
                        learningVelocity *= 0.8; // Decay for inactivity
                    }
                    else if (daysSinceLastAssessment <= 7) {
                        learningVelocity *= 1.1; // Boost for recent activity
                    }
                }
            }
            return {
                overallMastery: Math.round(overallMastery * 100) / 100, // Round to 2 decimals
                levelMastery,
                learningVelocity: Math.round(learningVelocity * 100) / 100,
                preferredLevels,
                challengeAreas,
            };
        }
        catch (error) {
            // Log error but return default profile to not break the flow
            console.error('[UnifiedBloomsEngine] Error fetching cognitive profile:', error);
            return defaultProfile;
        }
    }
    // ============================================================================
    // PUBLIC API - SPACED REPETITION (SM-2 ALGORITHM)
    // ============================================================================
    /**
     * Calculate next review date using SM-2 algorithm
     *
     * @param input - Spaced repetition input
     * @returns Calculated review schedule
     */
    calculateSpacedRepetition(input) {
        const performance = Math.max(0, Math.min(1, input.performance));
        const quality = Math.round(performance * 5); // Convert to 0-5 scale
        // SM-2 Algorithm
        let easeFactor = input.previousEaseFactor ?? 2.5;
        let interval = input.previousInterval ?? 1;
        let repetitions = 0;
        // Update ease factor based on performance
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor
        if (quality < 3) {
            // Failed review - reset
            interval = 1;
            repetitions = 0;
        }
        else {
            // Successful review
            repetitions++;
            if (repetitions === 1) {
                interval = 1;
            }
            else if (repetitions === 2) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * easeFactor);
            }
        }
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        return {
            nextReviewDate,
            intervalDays: interval,
            easeFactor,
            repetitionCount: repetitions,
        };
    }
    // ============================================================================
    // PUBLIC API - LEARNING ACTIVITY TRACKING
    // ============================================================================
    /**
     * Log a learning activity for a user
     *
     * @param userId - User ID
     * @param activityType - Type of activity (e.g., 'TAKE_EXAM', 'COMPLETE_SECTION')
     * @param data - Activity metadata
     */
    async logLearningActivity(userId, activityType, data) {
        if (!this.database) {
            this.config.logger?.debug?.('[UnifiedBloomsEngine] No database, skipping activity log');
            return;
        }
        try {
            await this.database.logInteraction({
                userId,
                pageType: 'LEARNING_ACTIVITY',
                pagePath: `/activity/${activityType}`,
                query: activityType,
                response: JSON.stringify(data),
                enginesUsed: ['unified-blooms-engine'],
                responseTimeMs: 0,
            });
        }
        catch (error) {
            this.config.logger?.warn?.('[UnifiedBloomsEngine] Failed to log activity', error);
        }
    }
    /**
     * Create a progress intervention for a user
     *
     * @param userId - User ID
     * @param type - Intervention type (e.g., 'SUPPORT_NEEDED', 'CELEBRATION')
     * @param title - Intervention title
     * @param message - Intervention message
     * @param metadata - Additional metadata
     */
    async createProgressIntervention(userId, type, title, message, metadata) {
        if (!this.database) {
            this.config.logger?.debug?.('[UnifiedBloomsEngine] No database, skipping intervention');
            return;
        }
        try {
            await this.database.logInteraction({
                userId,
                pageType: 'INTERVENTION',
                pagePath: `/intervention/${type}`,
                query: title,
                response: JSON.stringify({ message, ...metadata }),
                enginesUsed: ['unified-blooms-engine'],
                responseTimeMs: 0,
            });
        }
        catch (error) {
            this.config.logger?.warn?.('[UnifiedBloomsEngine] Failed to create intervention', error);
        }
    }
    // ============================================================================
    // PUBLIC API - CACHE MANAGEMENT
    // ============================================================================
    /**
     * Get cache statistics
     */
    getCacheStats() {
        let oldestEntry;
        let oldestTime = Infinity;
        this.cache.forEach((entry, key) => {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestEntry = key;
            }
        });
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            size: this.cache.size,
            oldestEntry,
        };
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
    // ============================================================================
    // PRIVATE - KEYWORD ANALYSIS
    // ============================================================================
    analyzeWithKeywords(content, options, startTime) {
        const text = content.toLowerCase();
        const distribution = this.analyzeKeywordDistribution(text);
        let dominantLevel = this.findDominantLevel(distribution);
        let confidence = this.calculateKeywordConfidence(text, dominantLevel);
        const cognitiveDepth = this.calculateCognitiveDepth(distribution);
        const balance = this.determineBalance(distribution);
        const gaps = this.identifyGaps(distribution);
        const recommendations = this.generateRecommendations(distribution, gaps, balance);
        let sectionAnalysis;
        if (options.includeSections) {
            // Section analysis would require structured input - skip for raw content
        }
        // Phase 2: Detect ambiguous verbs for semantic disambiguation
        const ambiguousVerbsFound = this.detectAmbiguousVerbs(text);
        const result = {
            dominantLevel,
            distribution,
            confidence,
            cognitiveDepth,
            balance,
            gaps,
            recommendations,
            sectionAnalysis,
            metadata: {
                method: 'keyword',
                processingTimeMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                fromCache: false,
                keywordConfidence: confidence,
            },
        };
        // Phase 2: Record ambiguous verbs found (even if not disambiguated)
        if (ambiguousVerbsFound.length > 0) {
            result.ambiguousVerbsFound = ambiguousVerbsFound;
        }
        // Add sub-level information if requested (Phase 1: Sub-Level Granularity)
        if (options.includeSubLevel) {
            const enhancedResult = this.subLevelAnalyzer.getEnhancedResult(dominantLevel, confidence, content);
            result.subLevel = enhancedResult.subLevel;
            result.numericScore = enhancedResult.numericScore;
            result.subLevelIndicators = enhancedResult.indicators;
            result.subLevelLabel = enhancedResult.label;
            result.enhancedResult = enhancedResult;
        }
        // Cache keyword results too (they're fast but useful for repeated calls)
        if (this.enableCache) {
            const cacheKey = this.generateCacheKey('content', content, 'quick');
            this.setCache(cacheKey, result);
        }
        return result;
    }
    /**
     * Detect ambiguous verbs in content (Phase 2)
     * These are verbs that can indicate multiple Bloom's levels
     */
    detectAmbiguousVerbs(text) {
        const words = text.split(/\s+/);
        const found = [];
        for (const word of words) {
            const cleaned = word.replace(/[^a-z]/g, '');
            if (cleaned in AMBIGUOUS_VERBS && !found.includes(cleaned)) {
                found.push(cleaned);
            }
        }
        return found;
    }
    analyzeKeywordDistribution(text) {
        const distribution = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        let totalMatches = 0;
        for (const level of BLOOMS_LEVELS) {
            const keywords = BLOOMS_KEYWORDS[level];
            let levelCount = 0;
            for (const keyword of keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = text.match(regex);
                if (matches) {
                    levelCount += matches.length;
                }
            }
            distribution[level] = levelCount;
            totalMatches += levelCount;
        }
        // Normalize to percentages
        if (totalMatches > 0) {
            for (const level of BLOOMS_LEVELS) {
                distribution[level] = Math.round((distribution[level] / totalMatches) * 100);
            }
        }
        else {
            // Default distribution if no keywords found
            distribution.UNDERSTAND = 40;
            distribution.APPLY = 30;
            distribution.ANALYZE = 20;
            distribution.REMEMBER = 10;
        }
        return distribution;
    }
    findDominantLevel(distribution) {
        let maxLevel = 'UNDERSTAND';
        let maxValue = 0;
        for (const level of BLOOMS_LEVELS) {
            if (distribution[level] > maxValue) {
                maxValue = distribution[level];
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    calculateKeywordConfidence(text, level) {
        const keywords = BLOOMS_KEYWORDS[level];
        let matches = 0;
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                matches++;
            }
        }
        // Confidence based on keyword matches and text length
        const keywordCoverage = Math.min(matches / 5, 1) * 0.6;
        const textLengthFactor = Math.min(text.length / 500, 1) * 0.2;
        const distributionFactor = 0.2; // Base confidence
        return Math.round((keywordCoverage + textLengthFactor + distributionFactor) * 100) / 100;
    }
    calculateCognitiveDepth(distribution) {
        let weightedSum = 0;
        let totalWeight = 0;
        for (const level of BLOOMS_LEVELS) {
            const weight = BLOOMS_LEVEL_ORDER[level];
            weightedSum += distribution[level] * weight;
            totalWeight += distribution[level];
        }
        if (totalWeight === 0)
            return 50;
        const avgLevel = weightedSum / totalWeight;
        return Math.round((avgLevel / 6) * 100);
    }
    determineBalance(distribution) {
        const lowerLevels = distribution.REMEMBER + distribution.UNDERSTAND;
        const upperLevels = distribution.EVALUATE + distribution.CREATE;
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        if (total === 0)
            return 'well-balanced';
        const lowerPct = lowerLevels / total;
        const upperPct = upperLevels / total;
        if (lowerPct > 0.6)
            return 'bottom-heavy';
        if (upperPct > 0.5)
            return 'top-heavy';
        return 'well-balanced';
    }
    identifyGaps(distribution) {
        const gaps = [];
        for (const level of BLOOMS_LEVELS) {
            if (distribution[level] < 5) {
                gaps.push(level);
            }
        }
        return gaps;
    }
    // ============================================================================
    // PRIVATE - AI ANALYSIS
    // ============================================================================
    async analyzeWithAI(content, keywordResult, options, startTime) {
        // Check if AI is available
        if (!this.config.ai?.chat) {
            // Fallback to keyword analysis if AI not available
            if (keywordResult) {
                return {
                    ...keywordResult,
                    metadata: {
                        ...keywordResult.metadata,
                        method: 'keyword',
                    },
                };
            }
            return this.analyzeWithKeywords(content, options, startTime);
        }
        try {
            const prompt = this.buildAIPrompt(content, keywordResult);
            const response = await this.config.ai.chat({
                messages: [{ role: 'user', content: prompt }],
                systemPrompt: this.getSystemPrompt(),
            });
            const aiAnalysis = this.parseAIResponse(response.content);
            const result = {
                dominantLevel: aiAnalysis.dominantLevel,
                distribution: aiAnalysis.distribution,
                confidence: aiAnalysis.confidence,
                cognitiveDepth: aiAnalysis.cognitiveDepth,
                balance: aiAnalysis.balance,
                gaps: aiAnalysis.gaps,
                recommendations: aiAnalysis.recommendations,
                metadata: {
                    method: keywordResult ? 'hybrid' : 'ai',
                    processingTimeMs: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    fromCache: false,
                    aiModel: this.config.ai.getModel?.() ?? this.config.model?.name ?? 'claude-sonnet',
                    keywordConfidence: keywordResult?.confidence,
                },
            };
            // Add sub-level information if requested (Phase 1: Sub-Level Granularity)
            if (options.includeSubLevel) {
                const enhancedResult = this.subLevelAnalyzer.getEnhancedResult(aiAnalysis.dominantLevel, aiAnalysis.confidence, content);
                result.subLevel = enhancedResult.subLevel;
                result.numericScore = enhancedResult.numericScore;
                result.subLevelIndicators = enhancedResult.indicators;
                result.subLevelLabel = enhancedResult.label;
                result.enhancedResult = enhancedResult;
            }
            // Cache AI result
            if (this.enableCache) {
                const cacheKey = this.generateCacheKey('content', content, 'comprehensive');
                this.setCache(cacheKey, result);
            }
            return result;
        }
        catch (error) {
            // Fallback to keyword analysis on AI error
            if (keywordResult) {
                return {
                    ...keywordResult,
                    metadata: {
                        ...keywordResult.metadata,
                        method: 'keyword',
                    },
                };
            }
            return this.analyzeWithKeywords(content, options, startTime);
        }
    }
    getSystemPrompt() {
        return `You are an expert in Bloom's Taxonomy educational assessment. Analyze content to determine its cognitive level distribution across the six levels: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, and CREATE.

Respond with a JSON object containing:
{
  "dominantLevel": "LEVEL_NAME",
  "distribution": {
    "REMEMBER": number (0-100),
    "UNDERSTAND": number (0-100),
    "APPLY": number (0-100),
    "ANALYZE": number (0-100),
    "EVALUATE": number (0-100),
    "CREATE": number (0-100)
  },
  "confidence": number (0-1),
  "cognitiveDepth": number (0-100),
  "balance": "well-balanced" | "bottom-heavy" | "top-heavy",
  "gaps": ["LEVEL_NAME", ...],
  "recommendations": [
    {
      "level": "LEVEL_NAME",
      "action": "description",
      "priority": "low" | "medium" | "high"
    }
  ]
}

Ensure distribution percentages sum to 100. Be precise in your analysis.`;
    }
    buildAIPrompt(content, keywordResult) {
        let prompt = `Analyze the following content for Bloom's Taxonomy levels:\n\n${content}\n\n`;
        if (keywordResult) {
            prompt += `Initial keyword analysis suggests:
- Dominant Level: ${keywordResult.dominantLevel}
- Confidence: ${keywordResult.confidence}
- Distribution: ${JSON.stringify(keywordResult.distribution)}

Please provide a more thorough semantic analysis to confirm or correct this assessment.`;
        }
        return prompt;
    }
    parseAIResponse(content) {
        // Use validation utilities for safe, schema-validated parsing
        // Note: parseAndValidate returns ValidationResult with schema's output type after Zod applies defaults
        const validationResult = parseAndValidate(content, BloomsAIResponseSchema, 'BloomsAIResponse');
        if (!validationResult.success || !validationResult.data) {
            // Log validation failure for debugging - don't silently default
            console.warn('[UnifiedBloomsEngine] AI response validation failed:', validationResult.error?.message, validationResult.error?.zodErrors?.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
            // Return default analysis with lowered confidence to indicate fallback
            return {
                dominantLevel: 'UNDERSTAND',
                distribution: {
                    REMEMBER: 15,
                    UNDERSTAND: 30,
                    APPLY: 25,
                    ANALYZE: 15,
                    EVALUATE: 10,
                    CREATE: 5,
                },
                confidence: 0.3, // Lower confidence indicates parsing fallback
                cognitiveDepth: 45,
                balance: 'well-balanced',
                gaps: [],
                recommendations: [],
                metadata: {
                    method: 'ai',
                    processingTimeMs: 0,
                    timestamp: new Date().toISOString(),
                    fromCache: false,
                    validationError: validationResult.error?.message,
                },
            };
        }
        // Successfully validated - transform to UnifiedBloomsResult
        // Cast to output type since Zod has applied defaults
        const validated = validationResult.data;
        // Determine dominant level from distribution if not explicitly provided
        let dominantLevel = validated.dominantLevel ?? 'UNDERSTAND';
        if (!validated.dominantLevel && validated.distribution) {
            dominantLevel = this.findDominantLevel(validated.distribution);
        }
        return {
            dominantLevel,
            distribution: this.normalizeDistribution(validated.distribution ?? {}),
            confidence: validated.confidence,
            cognitiveDepth: validated.cognitiveDepth,
            balance: validated.balance,
            gaps: validated.gaps,
            recommendations: this.parseRecommendations(validated.recommendations),
            metadata: {
                method: 'ai',
                processingTimeMs: 0,
                timestamp: new Date().toISOString(),
                fromCache: false,
            },
        };
    }
    validateBloomsLevel(level) {
        if (BLOOMS_LEVELS.includes(level)) {
            return level;
        }
        return 'UNDERSTAND';
    }
    validateBalance(balance) {
        if (['well-balanced', 'bottom-heavy', 'top-heavy'].includes(balance)) {
            return balance;
        }
        return 'well-balanced';
    }
    normalizeDistribution(dist) {
        const normalized = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        let total = 0;
        for (const level of BLOOMS_LEVELS) {
            normalized[level] = Math.max(0, dist[level] ?? 0);
            total += normalized[level];
        }
        // Normalize to 100
        if (total > 0 && total !== 100) {
            const factor = 100 / total;
            for (const level of BLOOMS_LEVELS) {
                normalized[level] = Math.round(normalized[level] * factor);
            }
        }
        return normalized;
    }
    parseRecommendations(recs) {
        return recs.slice(0, 5).map((rec) => ({
            level: this.validateBloomsLevel(rec.level ?? 'UNDERSTAND'),
            action: rec.action ?? 'Review content for improvements',
            priority: (['low', 'medium', 'high'].includes(rec.priority ?? '')
                ? rec.priority
                : 'medium'),
        }));
    }
    // ============================================================================
    // PRIVATE - RECOMMENDATIONS
    // ============================================================================
    generateRecommendations(distribution, gaps, balance) {
        const recommendations = [];
        // Balance-based recommendations
        if (balance === 'bottom-heavy') {
            recommendations.push({
                level: 'ANALYZE',
                action: 'Add more activities requiring analysis and higher-order thinking',
                priority: 'high',
                examples: ['Case studies', 'Compare and contrast exercises', 'Root cause analysis'],
                expectedImpact: 'Increase cognitive depth by 15-20 points',
            });
        }
        else if (balance === 'top-heavy') {
            recommendations.push({
                level: 'UNDERSTAND',
                action: 'Ensure foundational concepts are well-covered before advanced topics',
                priority: 'high',
                examples: ['Concept explanations', 'Examples and illustrations', 'Knowledge checks'],
                expectedImpact: 'Improve learning retention and reduce confusion',
            });
        }
        // Gap-based recommendations
        const gapRecommendations = {
            REMEMBER: {
                level: 'REMEMBER',
                action: 'Add definitions, key terms, and fact-based content',
                priority: 'medium',
                examples: ['Glossary terms', 'Key concept lists', 'Flashcard-style content'],
                expectedImpact: 'Build foundational knowledge base',
            },
            UNDERSTAND: {
                level: 'UNDERSTAND',
                action: 'Include explanations, summaries, and conceptual examples',
                priority: 'medium',
                examples: ['Concept explanations', 'Analogies', 'Visual diagrams'],
                expectedImpact: 'Improve comprehension of core concepts',
            },
            APPLY: {
                level: 'APPLY',
                action: 'Add practical exercises and real-world applications',
                priority: 'high',
                examples: ['Hands-on exercises', 'Practice problems', 'Simulations'],
                expectedImpact: 'Enable skill transfer to real situations',
            },
            ANALYZE: {
                level: 'ANALYZE',
                action: 'Include comparison activities and analytical exercises',
                priority: 'medium',
                examples: ['Case analyses', 'Data interpretation', 'Pattern recognition'],
                expectedImpact: 'Develop critical thinking skills',
            },
            EVALUATE: {
                level: 'EVALUATE',
                action: 'Add critical thinking questions and peer review activities',
                priority: 'medium',
                examples: ['Critique exercises', 'Decision-making scenarios', 'Debate topics'],
                expectedImpact: 'Build judgment and evaluation skills',
            },
            CREATE: {
                level: 'CREATE',
                action: 'Include projects, design challenges, or original work assignments',
                priority: 'low',
                examples: ['Project-based learning', 'Design challenges', 'Creative assignments'],
                expectedImpact: 'Foster innovation and synthesis skills',
            },
        };
        for (const gap of gaps.slice(0, 2)) {
            recommendations.push(gapRecommendations[gap]);
        }
        return recommendations.slice(0, 5);
    }
    generateCourseRecommendations(distribution, chapters, balance) {
        const recommendations = [];
        // Find chapters needing improvement
        for (const chapter of chapters) {
            if (chapter.cognitiveDepth < 40) {
                recommendations.push({
                    type: 'content',
                    priority: 'high',
                    targetLevel: 'ANALYZE',
                    description: `Chapter "${chapter.chapterTitle}" has low cognitive depth (${chapter.cognitiveDepth}%). Add higher-order thinking activities.`,
                    targetChapter: chapter.chapterId,
                    expectedImpact: 'Increase chapter cognitive depth by 20+ points',
                });
            }
            if (chapter.confidence < 0.5) {
                recommendations.push({
                    type: 'structure',
                    priority: 'medium',
                    targetLevel: chapter.primaryLevel,
                    description: `Chapter "${chapter.chapterTitle}" lacks clear learning objectives. Add explicit Bloom's-aligned objectives.`,
                    targetChapter: chapter.chapterId,
                    expectedImpact: 'Improve content clarity and learning outcomes',
                });
            }
        }
        // Overall balance recommendations
        if (balance === 'bottom-heavy') {
            recommendations.push({
                type: 'assessment',
                priority: 'high',
                targetLevel: 'EVALUATE',
                description: 'Course is heavily focused on lower cognitive levels. Add assessments requiring evaluation and creation.',
                examples: ['Project-based assessments', 'Peer reviews', 'Design challenges'],
                expectedImpact: 'Prepare students for real-world application of knowledge',
            });
        }
        // Gap-based recommendations
        const gaps = this.identifyGaps(distribution);
        for (const gap of gaps) {
            recommendations.push({
                type: 'activity',
                priority: 'medium',
                targetLevel: gap,
                description: `Add activities targeting the ${gap} level across the course.`,
                expectedImpact: `Improve course balance and student ${gap.toLowerCase()} skills`,
            });
        }
        return recommendations.slice(0, 6);
    }
    generateLearningPathway(distribution, chapters) {
        const stages = [];
        // Build progressive stages based on Bloom's hierarchy
        for (const level of BLOOMS_LEVELS) {
            const levelChapters = chapters.filter((c) => c.primaryLevel === level);
            const mastery = distribution[level];
            if (mastery > 0 || level === 'REMEMBER' || level === 'UNDERSTAND') {
                stages.push({
                    level,
                    mastery,
                    activities: this.getActivitiesForLevel(level),
                    timeEstimate: Math.max(1, Math.round(mastery / 10)),
                });
            }
        }
        const cognitiveProgression = stages.map((s) => s.level);
        const totalTime = stages.reduce((acc, s) => acc + s.timeEstimate, 0);
        return {
            stages,
            estimatedDuration: `${totalTime} hours`,
            cognitiveProgression,
            recommendations: [
                'Start with foundational concepts before advancing',
                'Complete each stage before moving to higher levels',
                'Review and practice regularly to reinforce learning',
            ],
        };
    }
    getActivitiesForLevel(level) {
        const activities = {
            REMEMBER: ['Read key concepts', 'Review definitions', 'Complete flashcards'],
            UNDERSTAND: ['Watch explanations', 'Study examples', 'Summarize content'],
            APPLY: ['Complete exercises', 'Work through problems', 'Practice skills'],
            ANALYZE: ['Analyze case studies', 'Compare solutions', 'Identify patterns'],
            EVALUATE: ['Critique approaches', 'Assess solutions', 'Review peer work'],
            CREATE: ['Design projects', 'Develop solutions', 'Create original work'],
        };
        return activities[level];
    }
    // ============================================================================
    // PRIVATE - COGNITIVE PROGRESS HELPERS
    // ============================================================================
    identifyPreferredLevels(mastery) {
        return BLOOMS_LEVELS.filter((level) => mastery[level] >= 70);
    }
    identifyChallengeAreas(mastery) {
        return BLOOMS_LEVELS.filter((level) => mastery[level] < 40);
    }
    generateProgressRecommendations(profile, recentLevel, score) {
        const recommendations = [];
        if (score < 0.5) {
            recommendations.push({
                type: 'review',
                title: `Review ${recentLevel} concepts`,
                description: 'Your recent performance suggests reviewing foundational material would be beneficial.',
                bloomsLevel: recentLevel,
                priority: 1,
            });
        }
        else if (score >= 0.8) {
            const levelIndex = BLOOMS_LEVELS.indexOf(recentLevel);
            if (levelIndex < BLOOMS_LEVELS.length - 1) {
                const nextLevel = BLOOMS_LEVELS[levelIndex + 1];
                recommendations.push({
                    type: 'advance',
                    title: `Ready for ${nextLevel}`,
                    description: 'Your strong performance indicates readiness for higher cognitive challenges.',
                    bloomsLevel: nextLevel,
                    priority: 1,
                });
            }
        }
        // Add recommendations for challenge areas
        for (const challengeLevel of profile.challengeAreas.slice(0, 2)) {
            recommendations.push({
                type: 'practice',
                title: `Strengthen ${challengeLevel} skills`,
                description: `This is an area where additional practice would improve your overall mastery.`,
                bloomsLevel: challengeLevel,
                priority: 2,
            });
        }
        return recommendations;
    }
    // ============================================================================
    // PRIVATE - HELPERS
    // ============================================================================
    /**
     * Extract text from chapter for Bloom's analysis
     * Enriched to include learning outcomes, objectives, and question text
     */
    extractChapterText(chapter) {
        const parts = [chapter.title];
        // Add chapter-level learning data
        if (chapter.learningOutcomes) {
            parts.push(chapter.learningOutcomes);
        }
        if (chapter.courseGoals) {
            parts.push(chapter.courseGoals);
        }
        for (const section of chapter.sections) {
            parts.push(section.title);
            if (section.content)
                parts.push(section.content);
            if (section.description)
                parts.push(section.description);
            // Add learning objectives - rich source of Bloom's indicators
            if (section.learningObjectives && section.learningObjectives.length > 0) {
                parts.push(...section.learningObjectives);
            }
            // Add question text - assessment questions often contain clear Bloom's verbs
            if (section.questions && section.questions.length > 0) {
                for (const q of section.questions) {
                    parts.push(q.text);
                }
            }
        }
        return parts.join(' ');
    }
    /**
     * Get the dominant Bloom's level from an array of levels
     * Used to determine section-level classification from assessment questions
     */
    getDominantLevel(levels) {
        if (levels.length === 0) {
            return 'UNDERSTAND'; // Default fallback
        }
        // Count occurrences of each level
        const counts = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const level of levels) {
            counts[level]++;
        }
        // Find the level with the highest count
        let maxCount = 0;
        let dominantLevel = 'UNDERSTAND';
        for (const level of BLOOMS_LEVELS) {
            if (counts[level] > maxCount) {
                maxCount = counts[level];
                dominantLevel = level;
            }
        }
        return dominantLevel;
    }
    aggregateDistributions(distributions) {
        const aggregate = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        if (distributions.length === 0)
            return aggregate;
        for (const dist of distributions) {
            for (const level of BLOOMS_LEVELS) {
                aggregate[level] += dist[level];
            }
        }
        for (const level of BLOOMS_LEVELS) {
            aggregate[level] = Math.round(aggregate[level] / distributions.length);
        }
        return aggregate;
    }
    // ============================================================================
    // PRIVATE - CACHING
    // ============================================================================
    generateCacheKey(type, identifier, mode) {
        const hash = this.hashString(`${type}:${identifier}:${mode}`);
        return `unified-blooms:${hash}`;
    }
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.cacheMisses++;
            return null;
        }
        // Check if expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.cacheMisses++;
            return null;
        }
        // LRU: Move to end of Map iteration order by re-inserting
        this.cache.delete(key);
        entry.timestamp = Date.now(); // Update last-access time
        this.cache.set(key, entry);
        this.cacheHits++;
        return entry.data;
    }
    setCache(key, data) {
        // Evict least-recently-used entries if cache exceeds max size
        if (this.cache.size >= this.maxCacheEntries) {
            this.evictLRUEntries(Math.max(1, Math.floor(this.maxCacheEntries * 0.1)));
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: this.cacheTTL,
            key,
        });
    }
    evictLRUEntries(count) {
        // Map iterates in insertion order; oldest (least recently used) entries are first
        let evicted = 0;
        for (const key of this.cache.keys()) {
            if (evicted >= count)
                break;
            this.cache.delete(key);
            evicted++;
        }
    }
    // ============================================================================
    // PUBLIC API - CALIBRATION (Phase 5)
    // ============================================================================
    /**
     * Record feedback for a Bloom's classification (Phase 5)
     * Used to improve classification accuracy over time
     *
     * @param content - The content that was classified
     * @param predictedLevel - The predicted Bloom's level
     * @param feedback - Feedback details (actual level, assessment outcome, etc.)
     * @returns Feedback ID if stored, null otherwise
     */
    async recordClassificationFeedback(content, predictedLevel, feedback) {
        const input = {
            content,
            predictedLevel: bloomsLevelToNumber(predictedLevel),
            predictedConfidence: feedback.predictedConfidence,
            predictedSubLevel: feedback.predictedSubLevel,
            actualLevel: feedback.actualLevel ? bloomsLevelToNumber(feedback.actualLevel) : undefined,
            actualSubLevel: feedback.actualSubLevel,
            assessmentOutcome: feedback.assessmentOutcome,
            feedbackType: feedback.feedbackType,
            userId: feedback.userId,
            courseId: feedback.courseId,
            sectionId: feedback.sectionId,
            analysisMethod: feedback.analysisMethod,
        };
        return this.calibrator.recordFeedback(input);
    }
    /**
     * Get calibration-adjusted result for a classification (Phase 5)
     *
     * @param predictedLevel - The predicted Bloom's level
     * @param confidence - The confidence score
     * @returns Calibrated result with adjusted confidence and potentially adjusted level
     */
    async getCalibratedResult(predictedLevel, confidence) {
        if (!this.enableCalibration) {
            return {
                calibratedLevel: predictedLevel,
                calibratedConfidence: confidence,
                calibrationApplied: false,
                levelAdjustment: 0,
            };
        }
        const result = await this.calibrator.calibrate(bloomsLevelToNumber(predictedLevel), confidence);
        return {
            calibratedLevel: numberToBloomsLevel(result.calibratedLevel),
            calibratedConfidence: result.calibratedConfidence,
            calibrationApplied: result.calibrationApplied,
            levelAdjustment: result.levelAdjustment,
        };
    }
    /**
     * Get calibration metrics (Phase 5)
     * Returns accuracy, calibration error, and adjustment factors
     */
    async getCalibrationMetrics() {
        return this.calibrator.getMetrics();
    }
    /**
     * Get calibration health status (Phase 5)
     * Indicates whether calibration is ready and its quality
     */
    async getCalibrationHealth() {
        return this.calibrator.getHealthStatus();
    }
    /**
     * Check if calibration is enabled and ready (Phase 5)
     */
    isCalibrationEnabled() {
        return this.enableCalibration;
    }
    /**
     * Clear calibration cache (Phase 5)
     */
    clearCalibrationCache() {
        this.calibrator.clearCache();
    }
}
// ============================================================================
// FACTORY
// ============================================================================
/**
 * Create a unified Bloom's engine instance
 *
 * @param config - Engine configuration
 * @returns UnifiedBloomsEngine instance
 */
export function createUnifiedBloomsEngine(config) {
    return new UnifiedBloomsEngine(config);
}
