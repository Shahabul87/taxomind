/**
 * Bloom's Aligner Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content alignment with Bloom's Taxonomy cognitive levels
 */
import { BLOOMS_LEVEL_ORDER, getBloomsLevelIndex, determineSubLevelFromIndicators, calculateBloomsNumericScore, createBloomsLabel, getBloomsSubLevelIndex, } from './types';
// ============================================================================
// BLOOM'S VERB TAXONOMY
// ============================================================================
/**
 * Cognitive verbs associated with each Bloom's level
 */
export const BLOOMS_VERBS = {
    REMEMBER: [
        'list',
        'define',
        'identify',
        'recall',
        'name',
        'state',
        'describe',
        'recognize',
        'label',
        'match',
        'reproduce',
        'memorize',
        'repeat',
        'outline',
        'select',
        'tell',
        'locate',
        'find',
        'know',
        'remember',
    ],
    UNDERSTAND: [
        'explain',
        'summarize',
        'interpret',
        'classify',
        'compare',
        'contrast',
        'discuss',
        'distinguish',
        'illustrate',
        'paraphrase',
        'predict',
        'relate',
        'translate',
        'understand',
        'clarify',
        'infer',
        'generalize',
        'express',
        'review',
        'restate',
    ],
    APPLY: [
        'apply',
        'demonstrate',
        'solve',
        'use',
        'calculate',
        'complete',
        'construct',
        'execute',
        'implement',
        'modify',
        'operate',
        'practice',
        'schedule',
        'show',
        'utilize',
        'experiment',
        'compute',
        'illustrate',
        'produce',
        'employ',
    ],
    ANALYZE: [
        'analyze',
        'break down',
        'categorize',
        'compare',
        'contrast',
        'differentiate',
        'discriminate',
        'examine',
        'investigate',
        'organize',
        'question',
        'separate',
        'test',
        'deconstruct',
        'dissect',
        'inspect',
        'probe',
        'survey',
        'detect',
        'deduce',
    ],
    EVALUATE: [
        'evaluate',
        'assess',
        'critique',
        'defend',
        'judge',
        'justify',
        'prioritize',
        'rate',
        'recommend',
        'support',
        'value',
        'appraise',
        'argue',
        'decide',
        'determine',
        'estimate',
        'measure',
        'rank',
        'score',
        'validate',
    ],
    CREATE: [
        'create',
        'design',
        'develop',
        'formulate',
        'generate',
        'invent',
        'plan',
        'produce',
        'compose',
        'construct',
        'devise',
        'hypothesize',
        'imagine',
        'originate',
        'propose',
        'synthesize',
        'assemble',
        'build',
        'combine',
        'innovate',
    ],
};
/**
 * Activity types associated with each Bloom's level
 */
export const BLOOMS_ACTIVITIES = {
    REMEMBER: [
        'flashcard',
        'quiz recall',
        'matching exercise',
        'fill in the blank',
        'multiple choice recognition',
        'listing',
        'labeling diagram',
        'timeline ordering',
    ],
    UNDERSTAND: [
        'summary writing',
        'concept mapping',
        'explaining in own words',
        'classification exercise',
        'comparison chart',
        'paraphrasing',
        'example finding',
        'analogy making',
    ],
    APPLY: [
        'problem solving',
        'simulation',
        'hands-on exercise',
        'practical demonstration',
        'case study application',
        'role play',
        'experiment',
        'coding exercise',
    ],
    ANALYZE: [
        'case study analysis',
        'data interpretation',
        'pattern recognition',
        'cause and effect analysis',
        'comparative analysis',
        'error analysis',
        'systems analysis',
        'root cause analysis',
    ],
    EVALUATE: [
        'peer review',
        'critique writing',
        'debate',
        'rubric assessment',
        'decision making exercise',
        'priority ranking',
        'pro/con analysis',
        'recommendation writing',
    ],
    CREATE: [
        'project creation',
        'original design',
        'creative writing',
        'research proposal',
        'prototype building',
        'solution development',
        'hypothesis formulation',
        'innovation challenge',
    ],
};
/**
 * Complexity indicators for sub-level determination
 * BASIC: 0-0.33, INTERMEDIATE: 0.34-0.66, ADVANCED: 0.67-1.0
 */
export const SUB_LEVEL_COMPLEXITY_INDICATORS = {
    BASIC: [
        'single',
        'simple',
        'basic',
        'one',
        'individual',
        'isolated',
        'fundamental',
        'elementary',
        'straightforward',
        'direct',
        'single step',
        'single concept',
        'one example',
        'familiar',
        'routine',
        'standard',
        'given',
        'provided',
        'recall',
        'recognize',
    ],
    INTERMEDIATE: [
        'multiple',
        'several',
        'related',
        'connected',
        'combination',
        'compare',
        'some',
        'various',
        'moderate',
        'modified',
        'adapted',
        'similar context',
        'new example',
        'different situation',
        'pattern',
        'sequence',
        'relationship',
        'procedure',
        'method',
        'technique',
    ],
    ADVANCED: [
        'complex',
        'interconnected',
        'system',
        'integrated',
        'novel',
        'unprecedented',
        'unique',
        'original',
        'synthesize',
        'abstract',
        'theoretical',
        'hypothetical',
        'cross-domain',
        'multidisciplinary',
        'innovative',
        'creative',
        'comprehensive',
        'holistic',
        'emergent',
        'transformative',
    ],
};
/**
 * Abstraction indicators for sub-level determination
 */
export const SUB_LEVEL_ABSTRACTION_INDICATORS = {
    BASIC: [
        'concrete',
        'specific',
        'example',
        'instance',
        'case',
        'tangible',
        'physical',
        'visual',
        'hands-on',
        'practical',
        'observable',
        'measurable',
    ],
    INTERMEDIATE: [
        'pattern',
        'category',
        'type',
        'class',
        'group',
        'general',
        'principle',
        'concept',
        'rule',
        'guideline',
        'framework',
        'model',
    ],
    ADVANCED: [
        'abstract',
        'theoretical',
        'conceptual',
        'paradigm',
        'meta',
        'philosophical',
        'epistemological',
        'ontological',
        'axiomatic',
        'universal',
        'transcendent',
        'emergent',
    ],
};
/**
 * Transfer context indicators for sub-level determination
 */
export const SUB_LEVEL_TRANSFER_INDICATORS = {
    BASIC: [
        'same',
        'identical',
        'exact',
        'similar',
        'like before',
        'as shown',
        'as demonstrated',
        'following the example',
        'using the template',
        'same context',
        'familiar situation',
        'known scenario',
    ],
    INTERMEDIATE: [
        'similar context',
        'related situation',
        'modified',
        'adapted',
        'adjusted',
        'varied',
        'different example',
        'alternative approach',
        'comparable scenario',
        'parallel case',
        'analogous',
        'corresponding',
    ],
    ADVANCED: [
        'novel context',
        'new situation',
        'unfamiliar',
        'unprecedented',
        'unique scenario',
        'different domain',
        'cross-disciplinary',
        'transfer',
        'generalize',
        'extrapolate',
        'innovative application',
        'original context',
    ],
};
/**
 * Novelty indicators for sub-level determination
 */
export const SUB_LEVEL_NOVELTY_INDICATORS = {
    BASIC: [
        'familiar',
        'known',
        'recognized',
        'standard',
        'typical',
        'common',
        'usual',
        'expected',
        'routine',
        'practiced',
        'rehearsed',
        'memorized',
    ],
    INTERMEDIATE: [
        'modified',
        'variation',
        'adapted',
        'adjusted',
        'changed',
        'altered',
        'different',
        'new variation',
        'alternative',
        'updated',
        'revised',
        'improved',
    ],
    ADVANCED: [
        'novel',
        'unprecedented',
        'original',
        'innovative',
        'creative',
        'unique',
        'groundbreaking',
        'pioneering',
        'inventive',
        'unconventional',
        'revolutionary',
        'cutting-edge',
    ],
};
// ============================================================================
// SUB-LEVEL ANALYZER
// ============================================================================
/**
 * Sub-Level Analyzer for determining BASIC/INTERMEDIATE/ADVANCED within Bloom&apos;s levels
 */
export class SubLevelAnalyzer {
    /**
     * Analyze content for sub-level indicators
     */
    analyze(content) {
        const lowerContent = content.toLowerCase();
        const indicators = [];
        // Analyze complexity
        const complexityResult = this.analyzeIndicatorType(lowerContent, SUB_LEVEL_COMPLEXITY_INDICATORS, 'complexity');
        indicators.push(complexityResult);
        // Analyze abstraction
        const abstractionResult = this.analyzeIndicatorType(lowerContent, SUB_LEVEL_ABSTRACTION_INDICATORS, 'abstraction');
        indicators.push(abstractionResult);
        // Analyze transfer
        const transferResult = this.analyzeIndicatorType(lowerContent, SUB_LEVEL_TRANSFER_INDICATORS, 'transfer');
        indicators.push(transferResult);
        // Analyze novelty
        const noveltyResult = this.analyzeIndicatorType(lowerContent, SUB_LEVEL_NOVELTY_INDICATORS, 'novelty');
        indicators.push(noveltyResult);
        return indicators;
    }
    /**
     * Analyze a specific indicator type
     */
    analyzeIndicatorType(content, indicators, type) {
        let basicCount = 0;
        let intermediateCount = 0;
        let advancedCount = 0;
        const evidence = [];
        // Count BASIC indicators
        for (const indicator of indicators.BASIC) {
            const regex = new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                basicCount += matches.length;
                if (evidence.length < 3) {
                    evidence.push(`"${indicator}" (${matches.length}x)`);
                }
            }
        }
        // Count INTERMEDIATE indicators
        for (const indicator of indicators.INTERMEDIATE) {
            const regex = new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                intermediateCount += matches.length;
                if (evidence.length < 3) {
                    evidence.push(`"${indicator}" (${matches.length}x)`);
                }
            }
        }
        // Count ADVANCED indicators
        for (const indicator of indicators.ADVANCED) {
            const regex = new RegExp(`\\b${indicator.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            const matches = content.match(regex);
            if (matches) {
                advancedCount += matches.length;
                if (evidence.length < 3) {
                    evidence.push(`"${indicator}" (${matches.length}x)`);
                }
            }
        }
        // Calculate weighted score (0-1)
        // ADVANCED indicators are weighted 3x, INTERMEDIATE 2x, BASIC 1x
        const totalWeighted = basicCount + intermediateCount * 2 + advancedCount * 3;
        const maxPossible = basicCount + intermediateCount * 2 + advancedCount * 3 || 1;
        let score;
        if (totalWeighted === 0) {
            // Default to INTERMEDIATE if no indicators found
            score = 0.5;
        }
        else {
            // Calculate normalized score based on where the weight distribution falls
            const advancedWeight = (advancedCount * 3) / maxPossible;
            const intermediateWeight = (intermediateCount * 2) / maxPossible;
            const basicWeight = basicCount / maxPossible;
            // Score is weighted average: BASIC=0.17, INTERMEDIATE=0.5, ADVANCED=0.83
            score = basicWeight * 0.17 + intermediateWeight * 0.5 + advancedWeight * 0.83;
            // Clamp to 0-1 range
            score = Math.max(0, Math.min(1, score));
        }
        return {
            type,
            score,
            evidence: evidence.join(', ') || 'No specific indicators found',
        };
    }
    /**
     * Get enhanced Bloom&apos;s result with sub-level information
     */
    getEnhancedResult(level, confidence, content) {
        const indicators = this.analyze(content);
        const subLevel = determineSubLevelFromIndicators(indicators);
        const levelNumeric = getBloomsLevelIndex(level) + 1;
        const subLevelNumeric = getBloomsSubLevelIndex(subLevel);
        const numericScore = calculateBloomsNumericScore(level, subLevel);
        const label = createBloomsLabel(level, subLevel);
        return {
            level,
            levelNumeric,
            subLevel,
            subLevelNumeric,
            numericScore,
            confidence,
            indicators,
            label,
        };
    }
}
/**
 * Create a sub-level analyzer instance
 */
export function createSubLevelAnalyzer() {
    return new SubLevelAnalyzer();
}
/**
 * Default configuration
 */
export const DEFAULT_BLOOMS_ALIGNER_CONFIG = {
    significanceThreshold: 10,
    acceptableVariance: 1,
    verbWeight: 0.6,
    activityWeight: 0.4,
    passingScore: 70,
};
/**
 * Bloom's Aligner Evaluator
 * Analyzes content for Bloom's Taxonomy level alignment
 */
export class BloomsAligner {
    name = 'BloomsAligner';
    description = "Evaluates content alignment with Bloom's Taxonomy cognitive levels";
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_BLOOMS_ALIGNER_CONFIG, ...config };
    }
    /**
     * Evaluate content for Bloom's alignment
     */
    async evaluate(content) {
        const startTime = Date.now();
        // Get target level (default to UNDERSTAND if not specified)
        const targetLevel = content.targetBloomsLevel ?? 'UNDERSTAND';
        // Analyze verbs in content
        const verbAnalysis = this.analyzeVerbs(content.content);
        // Analyze activities in content
        const activityAnalysis = this.analyzeActivities(content.content);
        // Calculate distribution from both analyses
        const detectedDistribution = this.calculateDistribution(verbAnalysis, activityAnalysis);
        // Determine dominant level
        const dominantLevel = this.findDominantLevel(detectedDistribution);
        // Calculate alignment
        const levelDistance = getBloomsLevelIndex(dominantLevel) - getBloomsLevelIndex(targetLevel);
        const alignmentStatus = this.determineAlignmentStatus(levelDistance);
        // Calculate score
        const score = this.calculateScore(detectedDistribution, targetLevel, alignmentStatus);
        // Determine issues and recommendations
        const { issues, recommendations } = this.analyzeIssuesAndRecommendations(alignmentStatus, targetLevel, dominantLevel, detectedDistribution, verbAnalysis, activityAnalysis);
        // Determine if passed
        const passed = score >= this.config.passingScore &&
            (alignmentStatus === 'aligned' ||
                Math.abs(levelDistance) <= this.config.acceptableVariance);
        return {
            evaluatorName: 'BloomsAligner',
            passed,
            score,
            confidence: this.calculateConfidence(verbAnalysis, activityAnalysis),
            issues,
            recommendations,
            processingTimeMs: Date.now() - startTime,
            analysis: {
                targetLevel,
                dominantLevel,
                alignmentStatus,
                levelDistance,
                verbCount: verbAnalysis.totalVerbs,
                activityCount: activityAnalysis.activityTypes.length,
            },
            detectedDistribution,
            dominantLevel,
            targetLevel,
            alignmentStatus,
            levelDistance,
            verbAnalysis,
            activityAnalysis,
        };
    }
    /**
     * Analyze cognitive verbs in content
     */
    analyzeVerbs(content) {
        const lowerContent = content.toLowerCase();
        const verbsByLevel = {
            REMEMBER: [],
            UNDERSTAND: [],
            APPLY: [],
            ANALYZE: [],
            EVALUATE: [],
            CREATE: [],
        };
        let totalVerbs = 0;
        // Check each level's verbs
        for (const level of BLOOMS_LEVEL_ORDER) {
            for (const verb of BLOOMS_VERBS[level]) {
                // Use word boundary matching
                const regex = new RegExp(`\\b${verb}\\b`, 'gi');
                const matches = lowerContent.match(regex);
                if (matches) {
                    verbsByLevel[level].push(...Array(matches.length).fill(verb));
                    totalVerbs += matches.length;
                }
            }
        }
        // Find dominant category
        const dominantCategory = this.findDominantLevel(this.verbsToDistribution(verbsByLevel, totalVerbs));
        return {
            verbsByLevel,
            totalVerbs,
            dominantCategory,
        };
    }
    /**
     * Analyze learning activities in content
     */
    analyzeActivities(content) {
        const lowerContent = content.toLowerCase();
        const activityTypes = [];
        const activitiesByLevel = {
            REMEMBER: [],
            UNDERSTAND: [],
            APPLY: [],
            ANALYZE: [],
            EVALUATE: [],
            CREATE: [],
        };
        // Check each level's activities
        for (const level of BLOOMS_LEVEL_ORDER) {
            for (const activity of BLOOMS_ACTIVITIES[level]) {
                if (lowerContent.includes(activity.toLowerCase())) {
                    activityTypes.push(activity);
                    activitiesByLevel[level].push(activity);
                }
            }
        }
        // Check for higher-order thinking activities (ANALYZE, EVALUATE, CREATE)
        const hasHigherOrderActivities = activitiesByLevel.ANALYZE.length > 0 ||
            activitiesByLevel.EVALUATE.length > 0 ||
            activitiesByLevel.CREATE.length > 0;
        return {
            activityTypes,
            activitiesByLevel,
            hasHigherOrderActivities,
        };
    }
    /**
     * Calculate Bloom's distribution from verb and activity analysis
     */
    calculateDistribution(verbAnalysis, activityAnalysis) {
        const distribution = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        const totalVerbs = verbAnalysis.totalVerbs || 1;
        const totalActivities = activityAnalysis.activityTypes.length || 1;
        // Calculate weighted distribution
        for (const level of BLOOMS_LEVEL_ORDER) {
            const verbPercentage = (verbAnalysis.verbsByLevel[level].length / totalVerbs) * 100;
            const activityPercentage = (activityAnalysis.activitiesByLevel[level].length / totalActivities) *
                100;
            distribution[level] =
                this.config.verbWeight * verbPercentage +
                    this.config.activityWeight * activityPercentage;
        }
        // Normalize to sum to 100
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const level of BLOOMS_LEVEL_ORDER) {
                distribution[level] = (distribution[level] / total) * 100;
            }
        }
        else {
            // Default to UNDERSTAND if no verbs or activities detected
            distribution.UNDERSTAND = 100;
        }
        return distribution;
    }
    /**
     * Convert verbs by level to distribution
     */
    verbsToDistribution(verbsByLevel, totalVerbs) {
        const distribution = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        if (totalVerbs === 0) {
            distribution.UNDERSTAND = 100;
            return distribution;
        }
        for (const level of BLOOMS_LEVEL_ORDER) {
            distribution[level] = (verbsByLevel[level].length / totalVerbs) * 100;
        }
        return distribution;
    }
    /**
     * Find dominant Bloom's level from distribution
     */
    findDominantLevel(distribution) {
        let maxLevel = 'UNDERSTAND';
        let maxValue = 0;
        for (const level of BLOOMS_LEVEL_ORDER) {
            if (distribution[level] > maxValue) {
                maxValue = distribution[level];
                maxLevel = level;
            }
        }
        return maxLevel;
    }
    /**
     * Determine alignment status
     */
    determineAlignmentStatus(levelDistance) {
        if (Math.abs(levelDistance) <= this.config.acceptableVariance) {
            return 'aligned';
        }
        if (levelDistance < 0) {
            return 'below_target';
        }
        if (levelDistance > 0) {
            return 'above_target';
        }
        return 'mixed';
    }
    /**
     * Calculate alignment score
     */
    calculateScore(distribution, targetLevel, alignmentStatus) {
        // Base score from target level percentage
        let score = distribution[targetLevel];
        // Add adjacent levels with reduced weight
        const targetIndex = getBloomsLevelIndex(targetLevel);
        if (targetIndex > 0) {
            const lowerLevel = BLOOMS_LEVEL_ORDER[targetIndex - 1];
            score += distribution[lowerLevel] * 0.5;
        }
        if (targetIndex < BLOOMS_LEVEL_ORDER.length - 1) {
            const higherLevel = BLOOMS_LEVEL_ORDER[targetIndex + 1];
            score += distribution[higherLevel] * 0.5;
        }
        // Bonus for perfect alignment
        if (alignmentStatus === 'aligned') {
            score = Math.min(100, score * 1.1);
        }
        // Penalty for misalignment
        if (alignmentStatus === 'below_target') {
            score = score * 0.8;
        }
        if (alignmentStatus === 'above_target') {
            score = score * 0.9; // Less penalty for being above target
        }
        return Math.round(Math.min(100, Math.max(0, score)));
    }
    /**
     * Calculate confidence in the analysis
     */
    calculateConfidence(verbAnalysis, activityAnalysis) {
        // More verbs and activities = higher confidence
        const verbConfidence = Math.min(1, verbAnalysis.totalVerbs / 20);
        const activityConfidence = Math.min(1, activityAnalysis.activityTypes.length / 5);
        return (verbConfidence + activityConfidence) / 2;
    }
    /**
     * Analyze issues and generate recommendations
     */
    analyzeIssuesAndRecommendations(alignmentStatus, targetLevel, dominantLevel, distribution, verbAnalysis, activityAnalysis) {
        const issues = [];
        const recommendations = [];
        // Check for misalignment
        if (alignmentStatus === 'below_target') {
            issues.push({
                type: 'cognitive_level_mismatch',
                severity: 'high',
                description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
                learningImpact: 'Students may not develop the intended cognitive skills',
                suggestedFix: `Add more ${targetLevel} level activities and questions`,
            });
            recommendations.push(`Incorporate more ${targetLevel} level verbs: ${BLOOMS_VERBS[targetLevel].slice(0, 5).join(', ')}`, `Add ${targetLevel} level activities: ${BLOOMS_ACTIVITIES[targetLevel].slice(0, 3).join(', ')}`);
        }
        if (alignmentStatus === 'above_target') {
            issues.push({
                type: 'cognitive_level_mismatch',
                severity: 'medium',
                description: `Content is at ${dominantLevel} level but target is ${targetLevel}`,
                learningImpact: 'Content may be too challenging for learning stage',
                suggestedFix: `Consider adding more foundational ${targetLevel} level content`,
            });
            recommendations.push(`Balance higher-order activities with ${targetLevel} level exercises`, `Ensure prerequisite ${targetLevel} skills are addressed first`);
        }
        // Check for low verb diversity
        if (verbAnalysis.totalVerbs < 5) {
            issues.push({
                type: 'low_verb_diversity',
                severity: 'low',
                description: 'Content has limited cognitive action verbs',
                learningImpact: 'May lack clear learning directions',
                suggestedFix: 'Add more explicit cognitive action verbs',
            });
            recommendations.push(`Add more explicit cognitive verbs to guide learning activities`);
        }
        // Check for missing higher-order activities
        if (getBloomsLevelIndex(targetLevel) >= 3 &&
            !activityAnalysis.hasHigherOrderActivities) {
            issues.push({
                type: 'missing_higher_order_activities',
                severity: 'medium',
                description: 'Target requires higher-order thinking but activities are lower-level',
                learningImpact: 'Students may not develop critical thinking skills',
                suggestedFix: 'Add analysis, evaluation, or creation activities',
            });
            recommendations.push(`Include higher-order thinking activities such as case studies, debates, or projects`);
        }
        // Check for unbalanced distribution
        const significantLevels = BLOOMS_LEVEL_ORDER.filter((level) => distribution[level] >= this.config.significanceThreshold);
        if (significantLevels.length === 1 && significantLevels[0] !== targetLevel) {
            issues.push({
                type: 'narrow_cognitive_focus',
                severity: 'low',
                description: `Content heavily focused on ${significantLevels[0]} level only`,
                learningImpact: 'May limit cognitive development range',
                suggestedFix: `Diversify activities to include more ${targetLevel} level content`,
            });
        }
        return { issues, recommendations };
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a Bloom's Aligner evaluator with default config
 */
export function createBloomsAligner(config) {
    return new BloomsAligner(config);
}
/**
 * Create a strict Bloom's Aligner (no variance allowed)
 */
export function createStrictBloomsAligner() {
    return new BloomsAligner({
        acceptableVariance: 0,
        passingScore: 80,
    });
}
/**
 * Create a lenient Bloom's Aligner (more variance allowed)
 */
export function createLenientBloomsAligner() {
    return new BloomsAligner({
        acceptableVariance: 2,
        passingScore: 60,
    });
}
//# sourceMappingURL=blooms-aligner.js.map