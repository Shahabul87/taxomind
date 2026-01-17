/**
 * Learning Objective Analyzer
 * Comprehensive analysis of learning objectives with SMART criteria and deduplication
 */
import { BLOOMS_KEYWORD_MAP, bloomsToDOK, } from '../types/depth-analysis.types';
export class ObjectiveAnalyzer {
    STRONG_VERBS = {
        REMEMBER: ['define', 'identify', 'list', 'name', 'recall', 'recognize'],
        UNDERSTAND: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'describe'],
        APPLY: ['apply', 'demonstrate', 'solve', 'implement', 'execute', 'use'],
        ANALYZE: ['analyze', 'differentiate', 'examine', 'investigate', 'categorize', 'deconstruct'],
        EVALUATE: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'defend'],
        CREATE: ['create', 'design', 'develop', 'formulate', 'construct', 'compose'],
    };
    WEAK_VERBS = [
        'know', 'learn', 'understand', 'appreciate', 'be aware of',
        'become familiar with', 'gain knowledge', 'explore', 'discover',
    ];
    MEASURABLE_INDICATORS = [
        'correctly', 'accurately', 'within', 'at least', 'minimum of',
        'percentage', '%', 'score', 'demonstrate', 'produce', 'complete',
        'pass', 'achieve', 'meet', 'criteria', 'standard',
    ];
    TIME_INDICATORS = [
        'by the end', 'within', 'after', 'upon completion', 'following',
        'week', 'module', 'chapter', 'session', 'course',
    ];
    /**
     * Analyze a single learning objective
     */
    analyzeObjective(objective) {
        const normalizedObjective = objective.trim();
        const lowerObjective = normalizedObjective.toLowerCase();
        // Extract and analyze action verb
        const verbAnalysis = this.analyzeActionVerb(normalizedObjective);
        // Determine Bloom's level
        const bloomsLevel = verbAnalysis.bloomsLevel;
        // Determine DOK level
        const dokLevel = this.determineDOKLevel(lowerObjective, bloomsLevel);
        // Analyze SMART criteria
        const smartCriteria = this.analyzeSMARTCriteria(normalizedObjective);
        // Calculate clarity score
        const clarityScore = this.calculateClarityScore(normalizedObjective, smartCriteria);
        // Analyze measurability
        const measurability = this.analyzeMeasurability(normalizedObjective);
        // Generate suggestions
        const suggestions = this.generateSuggestions(normalizedObjective, verbAnalysis, smartCriteria, measurability);
        // Generate improved version
        const improvedVersion = this.generateImprovedVersion(normalizedObjective, verbAnalysis, smartCriteria);
        return {
            objective: normalizedObjective,
            bloomsLevel,
            dokLevel,
            actionVerb: verbAnalysis.verb,
            verbStrength: verbAnalysis.strength,
            smartCriteria,
            clarityScore,
            measurability,
            suggestions,
            improvedVersion,
        };
    }
    /**
     * Analyze multiple objectives and detect duplicates
     */
    analyzeAndDeduplicate(objectives) {
        if (objectives.length === 0) {
            return {
                totalObjectives: 0,
                uniqueClusters: 0,
                duplicateGroups: [],
                recommendations: ['Add learning objectives to your course'],
                optimizedObjectives: [],
            };
        }
        const clusters = this.clusterSimilarObjectives(objectives);
        const duplicateGroups = clusters.filter(c => c.objectives.length > 1 || c.recommendation !== 'keep');
        const recommendations = this.generateDeduplicationRecommendations(clusters);
        const optimizedObjectives = this.generateOptimizedObjectives(clusters);
        return {
            totalObjectives: objectives.length,
            uniqueClusters: clusters.length,
            duplicateGroups,
            recommendations,
            optimizedObjectives,
        };
    }
    /**
     * Analyze the action verb in an objective
     */
    analyzeActionVerb(objective) {
        const words = objective.toLowerCase().split(/\s+/);
        let foundVerb = '';
        let foundLevel = 'UNDERSTAND';
        let strength = 'moderate';
        // Check for weak verbs first
        for (const weakVerb of this.WEAK_VERBS) {
            if (objective.toLowerCase().includes(weakVerb)) {
                foundVerb = weakVerb;
                strength = 'weak';
                break;
            }
        }
        // Check for strong verbs by Bloom's level (in reverse order for higher levels first)
        if (!foundVerb) {
            const levels = ['CREATE', 'EVALUATE', 'ANALYZE', 'APPLY', 'UNDERSTAND', 'REMEMBER'];
            for (const level of levels) {
                for (const verb of this.STRONG_VERBS[level]) {
                    if (words.includes(verb) || objective.toLowerCase().startsWith(verb)) {
                        foundVerb = verb;
                        foundLevel = level;
                        strength = 'strong';
                        break;
                    }
                }
                if (strength === 'strong')
                    break;
            }
        }
        // Fall back to keyword analysis if no verb found
        if (!foundVerb) {
            for (const mapping of BLOOMS_KEYWORD_MAP) {
                for (const keyword of mapping.keywords) {
                    if (objective.toLowerCase().includes(keyword)) {
                        foundVerb = keyword;
                        foundLevel = mapping.level;
                        strength = 'moderate';
                        break;
                    }
                }
                if (foundVerb)
                    break;
            }
        }
        // Default if nothing found
        if (!foundVerb) {
            foundVerb = 'understand';
            foundLevel = 'UNDERSTAND';
            strength = 'weak';
        }
        // Get alternative verbs
        const alternatives = this.STRONG_VERBS[foundLevel].filter(v => v !== foundVerb).slice(0, 3);
        return {
            verb: foundVerb,
            bloomsLevel: foundLevel,
            strength,
            alternatives,
        };
    }
    /**
     * Determine Webb's DOK level
     */
    determineDOKLevel(objective, bloomsLevel) {
        // Start with Bloom's correlation
        let dokLevel = bloomsToDOK(bloomsLevel);
        // Adjust based on complexity indicators
        const complexityIndicators = {
            level4: ['design original', 'synthesize', 'create new', 'develop innovative', 'research and'],
            level3: ['analyze', 'evaluate', 'compare and contrast', 'justify', 'investigate'],
            level2: ['apply', 'solve', 'use', 'demonstrate', 'classify'],
            level1: ['recall', 'identify', 'define', 'list', 'name'],
        };
        for (const indicator of complexityIndicators.level4) {
            if (objective.includes(indicator)) {
                dokLevel = 4;
                break;
            }
        }
        if (dokLevel < 3) {
            for (const indicator of complexityIndicators.level3) {
                if (objective.includes(indicator)) {
                    dokLevel = 3;
                    break;
                }
            }
        }
        return dokLevel;
    }
    /**
     * Analyze SMART criteria compliance
     */
    analyzeSMARTCriteria(objective) {
        const specific = this.analyzeSpecific(objective);
        const measurable = this.analyzeMeasurable(objective);
        const achievable = this.analyzeAchievable(objective);
        const relevant = this.analyzeRelevant(objective);
        const timeBound = this.analyzeTimeBound(objective);
        const overallScore = Math.round((specific.score + measurable.score + achievable.score + relevant.score + timeBound.score) / 5);
        return {
            specific,
            measurable,
            achievable,
            relevant,
            timeBound,
            overallScore,
        };
    }
    analyzeSpecific(objective) {
        let score = 50; // Base score
        const suggestions = [];
        // Check for specific details
        const words = objective.split(/\s+/).length;
        if (words >= 8)
            score += 20;
        if (words >= 15)
            score += 10;
        // Check for concrete nouns/objects
        if (/\b(concepts?|skills?|techniques?|methods?|procedures?|principles?)\b/i.test(objective)) {
            score += 15;
        }
        // Penalize vague language
        if (/\b(things?|stuff|something|various|different)\b/i.test(objective)) {
            score -= 20;
            suggestions.push('Replace vague terms with specific concepts');
        }
        // Check for context
        if (/\b(in|for|when|during|within the context of)\b/i.test(objective)) {
            score += 10;
        }
        else {
            suggestions.push('Add context about when or where this skill applies');
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            feedback: score >= 70 ? 'Objective is specific and clear' : 'Objective needs more specificity',
            suggestions,
        };
    }
    analyzeMeasurable(objective) {
        let score = 30; // Base score
        const suggestions = [];
        const lower = objective.toLowerCase();
        // Check for measurable indicators
        for (const indicator of this.MEASURABLE_INDICATORS) {
            if (lower.includes(indicator)) {
                score += 15;
                break;
            }
        }
        // Check for action verbs that produce measurable outcomes
        if (/\b(demonstrate|produce|create|write|develop|solve|calculate|identify|list)\b/i.test(objective)) {
            score += 25;
        }
        // Check for quantifiable elements
        if (/\b\d+\b|percent|percentage|ratio|score/i.test(objective)) {
            score += 20;
        }
        else {
            suggestions.push('Add quantifiable criteria (e.g., "at least 80% accuracy")');
        }
        // Penalize non-measurable verbs
        if (/\b(understand|know|appreciate|be aware|learn about)\b/i.test(objective)) {
            score -= 25;
            suggestions.push('Replace "understand/know" with observable action verbs');
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            feedback: score >= 70 ? 'Outcome is measurable' : 'Add measurable criteria',
            suggestions,
        };
    }
    analyzeAchievable(objective) {
        let score = 60; // Base score - assume reasonable by default
        const suggestions = [];
        // Check for unrealistic scope
        if (/\b(master|perfect|complete mastery|expert|all aspects)\b/i.test(objective)) {
            score -= 30;
            suggestions.push('Use more realistic terms like "demonstrate proficiency" instead of "master"');
        }
        // Check for appropriate scope
        const verbCount = (objective.match(/\b(and|also|additionally|furthermore)\b/gi) || []).length;
        if (verbCount > 2) {
            score -= 20;
            suggestions.push('Consider breaking this into multiple focused objectives');
        }
        // Reasonable length suggests achievable scope
        const words = objective.split(/\s+/).length;
        if (words > 30) {
            score -= 15;
            suggestions.push('Simplify objective - too complex for a single learning outcome');
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            feedback: score >= 70 ? 'Objective appears achievable' : 'Consider scope and feasibility',
            suggestions,
        };
    }
    analyzeRelevant(objective) {
        let score = 50; // Base score
        const suggestions = [];
        // Check for connection to outcomes
        if (/\b(in order to|to|for|enabling|allowing|so that)\b/i.test(objective)) {
            score += 25;
        }
        else {
            suggestions.push('Add purpose or connection to broader goals');
        }
        // Check for real-world application
        if (/\b(real-world|practical|industry|professional|workplace|project)\b/i.test(objective)) {
            score += 20;
        }
        // Check for skill/competency language
        if (/\b(skill|competency|ability|capability|proficiency)\b/i.test(objective)) {
            score += 15;
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            feedback: score >= 70 ? 'Objective is relevant to learning goals' : 'Clarify relevance and purpose',
            suggestions,
        };
    }
    analyzeTimeBound(objective) {
        let score = 20; // Base score - often missing
        const suggestions = [];
        // Check for time indicators
        for (const indicator of this.TIME_INDICATORS) {
            if (objective.toLowerCase().includes(indicator)) {
                score += 50;
                break;
            }
        }
        // Check for milestone references
        if (/\b(module|chapter|section|lesson|unit)\b/i.test(objective)) {
            score += 20;
        }
        if (score < 50) {
            suggestions.push('Add timeframe (e.g., "By the end of this module...")');
        }
        score = Math.max(0, Math.min(100, score));
        return {
            score,
            feedback: score >= 70 ? 'Timeframe is specified' : 'Add a timeframe or milestone',
            suggestions,
        };
    }
    /**
     * Analyze measurability in detail
     */
    analyzeMeasurability(objective) {
        const lower = objective.toLowerCase();
        let score = 50;
        let hasQuantifiableOutcome = false;
        let assessmentMethod = 'Observation';
        const verificationCriteria = [];
        // Check for quantifiable elements
        if (/\b\d+\b|percent|%|score|rate/i.test(objective)) {
            hasQuantifiableOutcome = true;
            score += 30;
            verificationCriteria.push('Quantitative metrics specified');
        }
        // Determine assessment method based on action verb
        if (/\b(write|create|produce|develop|design)\b/i.test(lower)) {
            assessmentMethod = 'Portfolio/Project submission';
            score += 15;
            verificationCriteria.push('Artifact-based assessment');
        }
        else if (/\b(demonstrate|perform|execute|apply)\b/i.test(lower)) {
            assessmentMethod = 'Performance assessment';
            score += 15;
            verificationCriteria.push('Observable demonstration');
        }
        else if (/\b(analyze|evaluate|compare|critique)\b/i.test(lower)) {
            assessmentMethod = 'Written analysis/Essay';
            score += 15;
            verificationCriteria.push('Written response evaluation');
        }
        else if (/\b(identify|list|name|define)\b/i.test(lower)) {
            assessmentMethod = 'Quiz/Test';
            score += 10;
            verificationCriteria.push('Multiple choice or short answer');
        }
        // Add verification criteria based on measurable indicators
        if (/\b(correctly|accurately)\b/i.test(lower)) {
            verificationCriteria.push('Accuracy-based rubric');
        }
        if (/\b(independently|without assistance)\b/i.test(lower)) {
            verificationCriteria.push('Independent completion verification');
        }
        return {
            score: Math.min(100, score),
            hasQuantifiableOutcome,
            assessmentMethod,
            verificationCriteria,
        };
    }
    /**
     * Calculate clarity score
     */
    calculateClarityScore(objective, smartCriteria) {
        let score = smartCriteria.overallScore;
        // Adjust for readability
        const words = objective.split(/\s+/).length;
        const avgWordLength = objective.replace(/\s+/g, '').length / words;
        // Optimal: 10-25 words
        if (words >= 10 && words <= 25) {
            score += 10;
        }
        else if (words < 5 || words > 40) {
            score -= 10;
        }
        // Penalize overly complex language
        if (avgWordLength > 8) {
            score -= 10;
        }
        // Check for grammatical structure (starts with verb)
        const startsWithVerb = /^[A-Z]?[a-z]+\s/.test(objective) &&
            BLOOMS_KEYWORD_MAP.some(m => m.keywords.some(k => objective.toLowerCase().startsWith(k)));
        if (startsWithVerb) {
            score += 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Generate improvement suggestions
     */
    generateSuggestions(objective, verbAnalysis, smartCriteria, measurability) {
        const suggestions = [];
        // Verb strength suggestions
        if (verbAnalysis.strength === 'weak') {
            suggestions.push(`Replace "${verbAnalysis.verb}" with stronger verb: ${verbAnalysis.alternatives.join(', ')}`);
        }
        // Collect SMART suggestions
        for (const [criterion, analysis] of Object.entries(smartCriteria)) {
            if (criterion !== 'overallScore' && typeof analysis === 'object' && 'suggestions' in analysis) {
                const criterionAnalysis = analysis;
                if (criterionAnalysis.score < 70) {
                    suggestions.push(...criterionAnalysis.suggestions);
                }
            }
        }
        // Measurability suggestions
        if (!measurability.hasQuantifiableOutcome) {
            suggestions.push('Add specific success criteria or metrics');
        }
        // Limit suggestions
        return Array.from(new Set(suggestions)).slice(0, 5);
    }
    /**
     * Generate improved version of objective
     */
    generateImprovedVersion(objective, verbAnalysis, smartCriteria) {
        let improved = objective;
        // Replace weak verb with strong alternative
        if (verbAnalysis.strength === 'weak' && verbAnalysis.alternatives.length > 0) {
            const replacement = verbAnalysis.alternatives[0];
            const capitalizedReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
            // Try to replace at the beginning
            const verbRegex = new RegExp(`^${verbAnalysis.verb}`, 'i');
            if (verbRegex.test(improved)) {
                improved = improved.replace(verbRegex, capitalizedReplacement);
            }
        }
        // Add timeframe if missing
        if (smartCriteria.timeBound.score < 50 && !improved.toLowerCase().includes('by the end')) {
            improved = `By the end of this module, learners will ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
        }
        // Add measurability if missing
        if (smartCriteria.measurable.score < 50 && !improved.includes('correctly')) {
            improved = improved.replace(/\.$/, ' with at least 80% accuracy.');
            if (!improved.endsWith('.')) {
                improved += ' with at least 80% accuracy.';
            }
        }
        return improved;
    }
    /**
     * Cluster similar objectives for deduplication
     */
    clusterSimilarObjectives(objectives) {
        const clusters = [];
        const processed = new Set();
        for (let i = 0; i < objectives.length; i++) {
            if (processed.has(i))
                continue;
            const cluster = {
                clusterId: `cluster-${i}`,
                objectives: [objectives[i]],
                semanticSimilarity: 100,
                recommendation: 'keep',
                suggestedMerge: null,
                reason: 'Unique objective',
            };
            // Find similar objectives
            for (let j = i + 1; j < objectives.length; j++) {
                if (processed.has(j))
                    continue;
                const similarity = this.calculateSimilarity(objectives[i], objectives[j]);
                if (similarity > 70) {
                    cluster.objectives.push(objectives[j]);
                    cluster.semanticSimilarity = Math.min(cluster.semanticSimilarity, similarity);
                    processed.add(j);
                }
            }
            processed.add(i);
            // Determine recommendation
            if (cluster.objectives.length > 1) {
                if (cluster.semanticSimilarity > 90) {
                    cluster.recommendation = 'merge';
                    cluster.reason = 'Objectives are nearly identical';
                    cluster.suggestedMerge = this.generateMergedObjective(cluster.objectives);
                }
                else {
                    cluster.recommendation = 'differentiate';
                    cluster.reason = 'Objectives are similar but may have distinct aspects';
                    cluster.suggestedMerge = null;
                }
            }
            clusters.push(cluster);
        }
        return clusters;
    }
    /**
     * Calculate similarity between two objectives
     */
    calculateSimilarity(obj1, obj2) {
        const words1 = new Set(obj1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(obj2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        if (words1.size === 0 || words2.size === 0)
            return 0;
        let intersection = 0;
        const words1Array = Array.from(words1);
        for (const word of words1Array) {
            if (words2.has(word)) {
                intersection++;
            }
        }
        // Jaccard similarity
        const union = words1.size + words2.size - intersection;
        return Math.round((intersection / union) * 100);
    }
    /**
     * Generate merged objective from similar ones
     */
    generateMergedObjective(objectives) {
        // Find the longest/most detailed one as base
        const base = objectives.reduce((longest, current) => current.length > longest.length ? current : longest);
        return base;
    }
    /**
     * Generate recommendations for deduplication
     */
    generateDeduplicationRecommendations(clusters) {
        const recommendations = [];
        const mergeCount = clusters.filter(c => c.recommendation === 'merge').length;
        const differentiateCount = clusters.filter(c => c.recommendation === 'differentiate').length;
        if (mergeCount > 0) {
            recommendations.push(`${mergeCount} objective(s) can be consolidated to remove redundancy`);
        }
        if (differentiateCount > 0) {
            recommendations.push(`${differentiateCount} objective group(s) need clearer differentiation`);
        }
        const totalObjectives = clusters.reduce((sum, c) => sum + c.objectives.length, 0);
        const uniqueCount = clusters.length;
        if (totalObjectives > uniqueCount * 1.5) {
            recommendations.push('Consider reducing total objectives for clarity and focus');
        }
        if (uniqueCount < 3) {
            recommendations.push('Add more diverse learning objectives to cover different cognitive levels');
        }
        return recommendations;
    }
    /**
     * Generate optimized list of objectives
     */
    generateOptimizedObjectives(clusters) {
        const optimized = [];
        for (const cluster of clusters) {
            if (cluster.recommendation === 'merge' && cluster.suggestedMerge) {
                optimized.push(cluster.suggestedMerge);
            }
            else {
                // Keep all unique or to-be-differentiated objectives
                optimized.push(...cluster.objectives);
            }
        }
        return optimized;
    }
}
// Export singleton instance
export const objectiveAnalyzer = new ObjectiveAnalyzer();
