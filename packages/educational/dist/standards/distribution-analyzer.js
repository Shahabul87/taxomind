/**
 * Distribution Analyzer
 * Comprehensive analysis of Bloom's Taxonomy distributions
 * with research-backed validation and cognitive rigor assessment
 *
 * Based on:
 * - Hess Cognitive Rigor Matrix (2009)
 * - Anderson & Krathwohl's Revised Taxonomy (2001)
 * - Webb's Depth of Knowledge (2002)
 */
import { VALIDATED_DISTRIBUTIONS, getValidatedDistribution, getCitationString, } from './validated-distributions';
// ═══════════════════════════════════════════════════════════════
// COGNITIVE RIGOR MATRIX (Hess, 2009)
// ═══════════════════════════════════════════════════════════════
/**
 * Expected percentages for each cell in the Cognitive Rigor Matrix
 * Based on Hess, K. K. (2009). Cognitive Rigor: Blending the Strengths
 * of Bloom's Taxonomy and Webb's Depth of Knowledge
 */
const COGNITIVE_RIGOR_EXPECTATIONS = {
    REMEMBER: {
        1: { expected: 8, examples: ['Recall facts', 'Define terms', 'List items'] },
        2: { expected: 2, examples: ['Summarize from memory', 'Identify patterns'] },
        3: { expected: 0, examples: [] },
        4: { expected: 0, examples: [] },
    },
    UNDERSTAND: {
        1: { expected: 5, examples: ['Identify', 'Recognize', 'Match'] },
        2: { expected: 12, examples: ['Summarize', 'Interpret', 'Classify'] },
        3: { expected: 3, examples: ['Explain how concepts relate'] },
        4: { expected: 0, examples: [] },
    },
    APPLY: {
        1: { expected: 3, examples: ['Follow simple procedures'] },
        2: { expected: 15, examples: ['Apply formulas', 'Solve routine problems'] },
        3: { expected: 7, examples: ['Apply concepts to new situations'] },
        4: { expected: 0, examples: [] },
    },
    ANALYZE: {
        1: { expected: 0, examples: [] },
        2: { expected: 5, examples: ['Categorize', 'Compare/contrast'] },
        3: { expected: 12, examples: ['Analyze relationships', 'Draw conclusions'] },
        4: { expected: 3, examples: ['Analyze complex systems'] },
    },
    EVALUATE: {
        1: { expected: 0, examples: [] },
        2: { expected: 2, examples: ['Cite evidence'] },
        3: { expected: 10, examples: ['Critique', 'Justify decisions'] },
        4: { expected: 3, examples: ['Evaluate multiple perspectives'] },
    },
    CREATE: {
        1: { expected: 0, examples: [] },
        2: { expected: 2, examples: ['Brainstorm', 'Generate ideas'] },
        3: { expected: 3, examples: ['Design solutions'] },
        4: { expected: 5, examples: ['Create original work', 'Synthesize research'] },
    },
};
// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════
export class DistributionAnalyzer {
    VERSION = '1.0.0';
    /**
     * Perform comprehensive distribution analysis
     */
    analyze(actualDistribution, courseType, dokDistribution) {
        // Detect or use provided course type
        const detectedType = courseType
            ? this.normalizeType(courseType)
            : this.detectCourseType(actualDistribution);
        const typeConfidence = courseType ? 90 : this.calculateTypeConfidence(actualDistribution, detectedType);
        // Get research-backed target distribution
        const targetDist = getValidatedDistribution(detectedType);
        // Calculate alignment
        const alignmentScore = this.calculateAlignment(actualDistribution, targetDist.distribution);
        // Analyze cognitive rigor
        const cognitiveRigorMatrix = this.analyzeCognitiveRigor(actualDistribution, dokDistribution);
        const cognitiveRigorScore = this.calculateCognitiveRigorScore(cognitiveRigorMatrix);
        // Assess balance
        const balanceAssessment = this.assessBalance(actualDistribution, detectedType);
        // Analyze each level
        const levelAnalysis = this.analyzeLevels(actualDistribution, targetDist.distribution);
        // Analyze DOK
        const dokAnalysis = this.analyzeDOK(dokDistribution, targetDist.dokDistribution);
        // Calculate statistical confidence
        const statisticalConfidence = this.calculateStatisticalConfidence(targetDist);
        // Generate recommendations
        const recommendations = this.generateRecommendations(levelAnalysis, balanceAssessment, cognitiveRigorMatrix, detectedType);
        // Compile research basis
        const researchBasis = this.compileResearchBasis(targetDist);
        return {
            courseType: detectedType,
            detectedType,
            typeConfidence,
            actualDistribution,
            targetDistribution: targetDist.distribution,
            alignmentScore,
            cognitiveRigorScore,
            cognitiveRigorMatrix,
            balanceAssessment,
            levelAnalysis,
            dokAnalysis,
            statisticalConfidence,
            recommendations,
            researchBasis,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Get analyzer version
     */
    getVersion() {
        return this.VERSION;
    }
    // ═══════════════════════════════════════════════════════════════
    // PRIVATE ANALYSIS METHODS
    // ═══════════════════════════════════════════════════════════════
    normalizeType(type) {
        const normalized = type.toLowerCase();
        const validTypes = [
            'foundational', 'intermediate', 'advanced', 'professional',
            'creative', 'technical', 'theoretical', 'general', 'STEM'
        ];
        return validTypes.find(t => t.toLowerCase() === normalized) ?? 'intermediate';
    }
    detectCourseType(distribution) {
        const remember = distribution.REMEMBER ?? 0;
        const understand = distribution.UNDERSTAND ?? 0;
        const apply = distribution.APPLY ?? 0;
        const analyze = distribution.ANALYZE ?? 0;
        const evaluate = distribution.EVALUATE ?? 0;
        const create = distribution.CREATE ?? 0;
        const lowerOrder = remember + understand;
        const higherOrder = evaluate + create;
        // Detection logic based on distribution patterns
        if (lowerOrder >= 50)
            return 'foundational';
        if (create >= 25)
            return 'creative';
        if (apply >= 35)
            return 'technical';
        if (analyze >= 25 && higherOrder >= 30)
            return 'advanced';
        if (analyze >= 20 && remember >= 15)
            return 'theoretical';
        if (higherOrder >= 25)
            return 'professional';
        return 'intermediate';
    }
    calculateTypeConfidence(distribution, type) {
        const target = getValidatedDistribution(type);
        const alignment = this.calculateAlignment(distribution, target.distribution);
        // High alignment = high confidence in type detection
        if (alignment >= 85)
            return 90;
        if (alignment >= 70)
            return 75;
        if (alignment >= 55)
            return 60;
        return 50;
    }
    calculateAlignment(actual, target) {
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        let totalDeviation = 0;
        for (const level of levels) {
            totalDeviation += Math.abs((actual[level] ?? 0) - (target[level] ?? 0));
        }
        // Max deviation is 200 (completely opposite)
        return Math.round(Math.max(0, 100 - totalDeviation / 2));
    }
    analyzeCognitiveRigor(bloomsDist, dokDist) {
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const dokLevels = [1, 2, 3, 4];
        // If no DOK provided, infer from Bloom's
        const effectiveDOK = dokDist ?? this.inferDOKFromBlooms(bloomsDist);
        const cells = [];
        let totalCoverage = 0;
        const quadrantScores = { recall: 0, skills: 0, strategic: 0, extended: 0 };
        for (const bloomsLevel of levels) {
            const row = [];
            const bloomsPercent = bloomsDist[bloomsLevel] ?? 0;
            for (const dokLevel of dokLevels) {
                const expected = COGNITIVE_RIGOR_EXPECTATIONS[bloomsLevel][dokLevel];
                // Estimate cell percentage based on Bloom's and DOK distributions
                const dokPercent = this.getDOKPercent(effectiveDOK, dokLevel);
                const cellPercent = (bloomsPercent * dokPercent) / 100;
                const status = this.getCellStatus(cellPercent, expected.expected);
                row.push({
                    bloomsLevel,
                    dokLevel,
                    percentage: Math.round(cellPercent * 10) / 10,
                    expected: expected.expected,
                    status,
                    examples: expected.examples,
                });
                if (cellPercent > 0)
                    totalCoverage++;
                // Track quadrant scores
                if (dokLevel <= 2 && levels.indexOf(bloomsLevel) <= 2) {
                    quadrantScores.recall += cellPercent;
                }
                else if (dokLevel <= 2) {
                    quadrantScores.skills += cellPercent;
                }
                else if (levels.indexOf(bloomsLevel) <= 3) {
                    quadrantScores.strategic += cellPercent;
                }
                else {
                    quadrantScores.extended += cellPercent;
                }
            }
            cells.push(row);
        }
        const dominantQuadrant = this.getDominantQuadrant(quadrantScores);
        const coverage = Math.round((totalCoverage / 24) * 100);
        const balance = this.calculateMatrixBalance(quadrantScores);
        const recommendations = this.generateMatrixRecommendations(quadrantScores, dominantQuadrant);
        return {
            cells,
            dominantQuadrant,
            coverage,
            balance,
            recommendations,
        };
    }
    inferDOKFromBlooms(bloomsDist) {
        // Standard Bloom's to DOK mapping
        const level1 = (bloomsDist.REMEMBER ?? 0) * 0.8;
        const level2 = (bloomsDist.REMEMBER ?? 0) * 0.2 +
            (bloomsDist.UNDERSTAND ?? 0) * 0.7 +
            (bloomsDist.APPLY ?? 0) * 0.6;
        const level3 = (bloomsDist.UNDERSTAND ?? 0) * 0.3 +
            (bloomsDist.APPLY ?? 0) * 0.4 +
            (bloomsDist.ANALYZE ?? 0) * 0.8 +
            (bloomsDist.EVALUATE ?? 0) * 0.6;
        const level4 = (bloomsDist.ANALYZE ?? 0) * 0.2 +
            (bloomsDist.EVALUATE ?? 0) * 0.4 +
            (bloomsDist.CREATE ?? 0) * 1.0;
        const total = level1 + level2 + level3 + level4;
        const factor = total > 0 ? 100 / total : 1;
        return {
            level1: Math.round(level1 * factor),
            level2: Math.round(level2 * factor),
            level3: Math.round(level3 * factor),
            level4: Math.round(level4 * factor),
        };
    }
    getDOKPercent(dok, level) {
        switch (level) {
            case 1: return dok.level1;
            case 2: return dok.level2;
            case 3: return dok.level3;
            case 4: return dok.level4;
            default: return 0;
        }
    }
    getCellStatus(actual, expected) {
        if (expected === 0)
            return actual > 2 ? 'over' : 'optimal';
        const ratio = actual / expected;
        if (ratio < 0.5)
            return 'under';
        if (ratio > 1.5)
            return 'over';
        return 'optimal';
    }
    getDominantQuadrant(scores) {
        const entries = Object.entries(scores);
        return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    calculateMatrixBalance(scores) {
        const values = Object.values(scores);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
        // Lower variance = better balance (0-100 scale)
        return Math.round(Math.max(0, 100 - variance));
    }
    generateMatrixRecommendations(scores, dominant) {
        const recommendations = [];
        if (scores.extended < 10) {
            recommendations.push('Add extended thinking activities (research projects, original creations)');
        }
        if (scores.strategic < 20) {
            recommendations.push('Increase strategic thinking tasks (analysis, problem-solving)');
        }
        if (scores.recall > 40) {
            recommendations.push('Reduce recall-focused content; shift to application and analysis');
        }
        if (dominant === 'recall') {
            recommendations.push('Course is heavily recall-focused; add higher-order thinking activities');
        }
        return recommendations;
    }
    calculateCognitiveRigorScore(matrix) {
        // Weight: coverage (30%) + balance (30%) + strategic/extended presence (40%)
        const coverageScore = matrix.coverage;
        const balanceScore = matrix.balance;
        // Higher quadrant scores
        let higherScore = 0;
        if (matrix.dominantQuadrant === 'strategic')
            higherScore = 70;
        else if (matrix.dominantQuadrant === 'extended')
            higherScore = 90;
        else if (matrix.dominantQuadrant === 'skills')
            higherScore = 50;
        else
            higherScore = 30;
        return Math.round(coverageScore * 0.3 + balanceScore * 0.3 + higherScore * 0.4);
    }
    assessBalance(distribution, type) {
        const lower = (distribution.REMEMBER ?? 0) + (distribution.UNDERSTAND ?? 0);
        const middle = (distribution.APPLY ?? 0) + (distribution.ANALYZE ?? 0);
        const higher = (distribution.EVALUATE ?? 0) + (distribution.CREATE ?? 0);
        // Ideal ratios vary by course type
        const idealRatios = {
            foundational: { lower: 60, middle: 30, higher: 10 },
            intermediate: { lower: 30, middle: 50, higher: 20 },
            advanced: { lower: 15, middle: 50, higher: 35 },
            professional: { lower: 20, middle: 50, higher: 30 },
            creative: { lower: 15, middle: 30, higher: 55 },
            technical: { lower: 25, middle: 55, higher: 20 },
            theoretical: { lower: 40, middle: 40, higher: 20 },
            general: { lower: 30, middle: 45, higher: 25 },
            STEM: { lower: 20, middle: 55, higher: 25 },
        };
        const ideal = idealRatios[type] ?? idealRatios.general;
        const deviation = Math.abs(lower - ideal.lower) + Math.abs(middle - ideal.middle) + Math.abs(higher - ideal.higher);
        let balanceType;
        if (deviation <= 20)
            balanceType = 'well-balanced';
        else if (lower > ideal.lower + 15)
            balanceType = 'bottom-heavy';
        else if (higher > ideal.higher + 15)
            balanceType = 'top-heavy';
        else if (distribution.APPLY ?? 0 > 40)
            balanceType = 'application-focused';
        else if (distribution.ANALYZE ?? 0 > 30)
            balanceType = 'analysis-focused';
        else
            balanceType = 'well-balanced';
        const recommendation = this.getBalanceRecommendation(balanceType, type);
        return {
            type: balanceType,
            lowerOrder: lower,
            middleOrder: middle,
            higherOrder: higher,
            idealRatio: ideal,
            deviation,
            recommendation,
        };
    }
    getBalanceRecommendation(type, courseType) {
        const recommendations = {
            'well-balanced': `Content is well-balanced for a ${courseType} course.`,
            'bottom-heavy': 'Too much focus on recall/understanding. Add more application and analysis activities.',
            'top-heavy': 'May be too challenging without sufficient foundation. Add more scaffolding content.',
            'application-focused': 'Strong on application. Consider adding more evaluation and creative synthesis.',
            'analysis-focused': 'Good analytical depth. Ensure students have sufficient foundational knowledge.',
        };
        return recommendations[type];
    }
    analyzeLevels(actual, target) {
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
        const contexts = {
            REMEMBER: 'Foundation for all learning; too much limits growth',
            UNDERSTAND: 'Essential for concept mastery; builds on recall',
            APPLY: 'Bridges theory to practice; key for skill development',
            ANALYZE: 'Develops critical thinking; requires understanding first',
            EVALUATE: 'Highest critical thinking; requires analysis skills',
            CREATE: 'Synthesis and innovation; builds on all lower levels',
        };
        return levels.map(level => {
            const actualVal = actual[level] ?? 0;
            const targetVal = target[level] ?? 0;
            const deviation = actualVal - targetVal;
            let status;
            if (deviation < -15)
                status = 'significantly_under';
            else if (deviation < -5)
                status = 'under';
            else if (deviation > 15)
                status = 'significantly_over';
            else if (deviation > 5)
                status = 'over';
            else
                status = 'optimal';
            const actionRequired = Math.abs(deviation) > 10;
            const suggestedActions = this.getLevelActions(level, deviation);
            // Calculate percentile based on research distributions
            const percentile = this.calculatePercentile(level, actualVal);
            return {
                level,
                actual: actualVal,
                target: targetVal,
                deviation,
                status,
                percentile,
                researchContext: contexts[level],
                actionRequired,
                suggestedActions,
            };
        });
    }
    getLevelActions(level, deviation) {
        const actions = [];
        if (deviation < -10) {
            // Need to increase
            const addActions = {
                REMEMBER: ['Add knowledge check quizzes', 'Include terminology reviews'],
                UNDERSTAND: ['Add explanation activities', 'Include comparison exercises'],
                APPLY: ['Add practical exercises', 'Include real-world scenarios'],
                ANALYZE: ['Add case studies', 'Include data analysis tasks'],
                EVALUATE: ['Add critique assignments', 'Include peer review activities'],
                CREATE: ['Add project-based assessments', 'Include design challenges'],
            };
            actions.push(...addActions[level]);
        }
        else if (deviation > 10) {
            // Need to decrease or redirect
            actions.push(`Consider converting some ${level} activities to higher cognitive levels`);
            actions.push(`Balance ${level} content with other cognitive domains`);
        }
        return actions;
    }
    calculatePercentile(level, value) {
        // Percentile based on typical distributions across all course types
        const benchmarks = {
            REMEMBER: { p25: 5, p50: 10, p75: 20 },
            UNDERSTAND: { p25: 15, p50: 20, p75: 30 },
            APPLY: { p25: 20, p50: 25, p75: 35 },
            ANALYZE: { p25: 15, p50: 20, p75: 25 },
            EVALUATE: { p25: 8, p50: 15, p75: 20 },
            CREATE: { p25: 5, p50: 10, p75: 20 },
        };
        const b = benchmarks[level];
        if (value <= b.p25)
            return Math.round((value / b.p25) * 25);
        if (value <= b.p50)
            return 25 + Math.round(((value - b.p25) / (b.p50 - b.p25)) * 25);
        if (value <= b.p75)
            return 50 + Math.round(((value - b.p50) / (b.p75 - b.p50)) * 25);
        return 75 + Math.min(25, Math.round((value - b.p75) / 2));
    }
    analyzeDOK(actual, target) {
        const effectiveActual = actual ?? { level1: 25, level2: 40, level3: 25, level4: 10 };
        const effectiveTarget = target ?? { level1: 15, level2: 40, level3: 35, level4: 10 };
        const alignment = this.calculateDOKAlignment(effectiveActual, effectiveTarget);
        const levels = [1, 2, 3, 4];
        const dominantLevel = levels.reduce((max, level) => this.getDOKPercent(effectiveActual, level) > this.getDOKPercent(effectiveActual, max) ? level : max);
        const strategicPercent = effectiveActual.level3 + effectiveActual.level4;
        const recommendations = [];
        if (strategicPercent < 30) {
            recommendations.push('Increase strategic and extended thinking activities');
        }
        if (effectiveActual.level1 > 25) {
            recommendations.push('Reduce recall-level content');
        }
        return {
            distribution: effectiveActual,
            targetDistribution: effectiveTarget,
            alignmentScore: alignment,
            dominantLevel,
            strategicThinkingPercent: strategicPercent,
            recommendations,
        };
    }
    calculateDOKAlignment(actual, target) {
        const deviation = Math.abs(actual.level1 - target.level1) +
            Math.abs(actual.level2 - target.level2) +
            Math.abs(actual.level3 - target.level3) +
            Math.abs(actual.level4 - target.level4);
        return Math.round(Math.max(0, 100 - deviation / 2));
    }
    calculateStatisticalConfidence(distribution) {
        const hasSampleSize = distribution.sampleSize !== undefined;
        const hasEffectSize = distribution.effectSize !== undefined;
        const hasCI = distribution.confidenceInterval !== undefined;
        let confidenceLevel = 50;
        if (hasSampleSize && distribution.sampleSize >= 100)
            confidenceLevel += 20;
        if (hasEffectSize && distribution.effectSize >= 0.5)
            confidenceLevel += 15;
        if (hasCI)
            confidenceLevel += 10;
        if (distribution.source.peerReviewed)
            confidenceLevel += 5;
        const marginOfError = hasCI
            ? Math.round((distribution.confidenceInterval.upper - distribution.confidenceInterval.lower) / 2 * 100) / 100
            : 0.15;
        let interpretation;
        if (confidenceLevel >= 85) {
            interpretation = 'High confidence - based on well-established research with strong effect sizes';
        }
        else if (confidenceLevel >= 70) {
            interpretation = 'Moderate confidence - based on peer-reviewed research';
        }
        else {
            interpretation = 'Baseline confidence - based on educational best practices';
        }
        return {
            sampleBasis: hasSampleSize ? `n=${distribution.sampleSize}` : 'Not specified',
            confidenceLevel: Math.min(confidenceLevel, 95),
            marginOfError,
            effectSize: distribution.effectSize,
            interpretation,
        };
    }
    generateRecommendations(levels, balance, matrix, courseType) {
        const recommendations = [];
        // Level-specific recommendations
        for (const level of levels) {
            if (level.actionRequired) {
                const type = level.deviation > 0 ? 'decrease' : 'increase';
                recommendations.push({
                    priority: Math.abs(level.deviation) > 15 ? 'high' : 'medium',
                    level: level.level,
                    type,
                    currentValue: level.actual,
                    targetValue: level.target,
                    change: Math.abs(level.deviation),
                    description: `${type === 'increase' ? 'Increase' : 'Decrease'} ${level.level} content by ${Math.abs(Math.round(level.deviation))}%`,
                    actionSteps: level.suggestedActions,
                    researchSupport: level.researchContext,
                    estimatedImpact: Math.abs(level.deviation) > 15 ? 'high' : 'medium',
                });
            }
        }
        // Balance recommendations
        if (balance.type !== 'well-balanced') {
            recommendations.push({
                priority: 'medium',
                level: 'overall',
                type: 'rebalance',
                currentValue: balance.deviation,
                targetValue: 0,
                change: balance.deviation,
                description: balance.recommendation,
                actionSteps: [
                    `Target ratio: ${balance.idealRatio.lower}% lower, ${balance.idealRatio.middle}% middle, ${balance.idealRatio.higher}% higher`,
                    'Review content distribution across cognitive levels',
                    'Adjust activity types to achieve balance',
                ],
                researchSupport: `Based on research-validated distribution for ${courseType} courses`,
                estimatedImpact: 'medium',
            });
        }
        // Matrix recommendations
        for (const rec of matrix.recommendations) {
            recommendations.push({
                priority: 'low',
                level: 'overall',
                type: 'rebalance',
                currentValue: 0,
                targetValue: 0,
                change: 0,
                description: rec,
                actionSteps: [],
                researchSupport: 'Based on Hess Cognitive Rigor Matrix (2009)',
                estimatedImpact: 'medium',
            });
        }
        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        return recommendations;
    }
    compileResearchBasis(distribution) {
        const alternativeSources = VALIDATED_DISTRIBUTIONS
            .filter(d => d.id !== distribution.id)
            .slice(0, 3)
            .map(d => ({
            name: d.name,
            citation: getCitationString(d),
        }));
        return {
            primarySource: distribution,
            citation: getCitationString(distribution),
            applicability: distribution.applicability,
            limitations: [
                'Distributions are guidelines, not absolute requirements',
                'Context and learning objectives should guide final decisions',
                'Individual learner needs may require adjustments',
            ],
            alternativeSources,
        };
    }
}
// Export singleton instance
export const distributionAnalyzer = new DistributionAnalyzer();
