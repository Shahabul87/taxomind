/**
 * Scaffolding Evaluator
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Evaluates content for proper pedagogical scaffolding
 */
import { getBloomsLevelIndex, getDifficultyLevelIndex } from './types';
// ============================================================================
// SCAFFOLDING INDICATORS
// ============================================================================
/**
 * Indicators of different support structures
 */
export const SUPPORT_INDICATORS = {
    example: [
        'for example',
        'for instance',
        'such as',
        'like this',
        'consider this example',
        'here is an example',
        'let me illustrate',
        'to demonstrate',
        'e.g.',
        'sample',
        'demonstration',
    ],
    hint: [
        'hint:',
        'tip:',
        'remember that',
        'keep in mind',
        'note that',
        'think about',
        'consider',
        'clue:',
        'suggestion:',
        'try thinking',
    ],
    scaffold: [
        'first,',
        'then,',
        'next,',
        'finally,',
        'step 1',
        'step 2',
        'step 3',
        'let us start',
        "let's begin",
        'before we',
        'building on',
        'now that we',
    ],
    prompt: [
        'what do you think',
        'how would you',
        'why might',
        'can you explain',
        'try to',
        'your turn to',
        'now you try',
        'practice by',
        'attempt to',
    ],
    feedback: [
        'correct!',
        'well done',
        'great job',
        'not quite',
        'try again',
        'almost',
        'you got it',
        'that is right',
        'good thinking',
        'excellent',
    ],
    model: [
        'watch how',
        "i'll show you",
        "let me demonstrate",
        'observe as',
        "here's how",
        'follow along',
        'my approach',
        'the process is',
        'this is done by',
    ],
};
/**
 * Gradual release phase indicators
 */
export const GRADUAL_RELEASE_INDICATORS = {
    I_DO: [
        "i'll show",
        'let me demonstrate',
        'watch as',
        "here's how",
        'observe',
        'i will explain',
        "i'm going to",
        'demonstration',
        'modeling',
    ],
    WE_DO: [
        "let's try together",
        'work with me',
        'together we',
        'as a class',
        'guided practice',
        "let's do this",
        "we'll work through",
        'collaborate',
    ],
    YOU_DO_TOGETHER: [
        'with a partner',
        'in groups',
        'discuss with',
        'work together',
        'collaborative',
        'peer',
        'team exercise',
        'group activity',
    ],
    YOU_DO_ALONE: [
        'independently',
        'on your own',
        'by yourself',
        'individual',
        'solo',
        'try it yourself',
        'your turn',
        'now you',
        'practice independently',
    ],
};
/**
 * Complexity indicators (words/patterns that suggest higher complexity)
 */
export const COMPLEXITY_INDICATORS = {
    low: [
        'basic',
        'simple',
        'introduction',
        'fundamental',
        'begin',
        'first',
        'easy',
        'straightforward',
    ],
    medium: [
        'building on',
        'extending',
        'applying',
        'combining',
        'intermediate',
        'develop',
        'expand',
    ],
    high: [
        'advanced',
        'complex',
        'sophisticated',
        'challenging',
        'integration',
        'synthesis',
        'expert',
        'nuanced',
    ],
};
/**
 * Default configuration
 */
export const DEFAULT_SCAFFOLDING_CONFIG = {
    maxComplexityJump: 30,
    minPrerequisiteCoverage: 70,
    minSupportStructures: 2,
    passingScore: 70,
    requireGradualRelease: false,
};
/**
 * Scaffolding Evaluator
 * Analyzes content for proper pedagogical scaffolding
 */
export class ScaffoldingEvaluator {
    name = 'ScaffoldingEvaluator';
    description = 'Evaluates content for proper pedagogical scaffolding and progressive complexity';
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_SCAFFOLDING_CONFIG, ...config };
    }
    /**
     * Evaluate content for scaffolding quality
     */
    async evaluate(content, studentProfile) {
        const startTime = Date.now();
        // Analyze complexity progression
        const complexityProgression = this.analyzeComplexityProgression(content, studentProfile);
        // Analyze prerequisite coverage
        const prerequisiteCoverage = this.analyzePrerequisiteCoverage(content, studentProfile);
        // Analyze support structures
        const supportStructures = this.analyzeSupportStructures(content.content);
        // Analyze gradual release
        const gradualRelease = this.analyzeGradualRelease(content.content);
        // Determine if properly scaffolded
        const properlyScaffolded = this.determineProperScaffolding(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease);
        // Calculate score
        const score = this.calculateScore(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease);
        // Analyze issues and recommendations
        const { issues, recommendations } = this.analyzeIssuesAndRecommendations(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease);
        const passed = score >= this.config.passingScore && properlyScaffolded;
        return {
            evaluatorName: 'ScaffoldingEvaluator',
            passed,
            score,
            confidence: this.calculateConfidence(content, supportStructures),
            issues,
            recommendations,
            processingTimeMs: Date.now() - startTime,
            analysis: {
                complexityRange: `${complexityProgression.startingComplexity}-${complexityProgression.endingComplexity}`,
                supportCount: supportStructures.length,
                prerequisiteCoveragePercentage: prerequisiteCoverage.coveragePercentage,
                gradualReleasePhases: gradualRelease.phasesPresent,
            },
            properlyScaffolded,
            complexityProgression,
            prerequisiteCoverage,
            supportStructures,
            gradualRelease,
        };
    }
    /**
     * Analyze complexity progression through content
     */
    analyzeComplexityProgression(content, studentProfile) {
        const lowerContent = content.content.toLowerCase();
        // Estimate starting and ending complexity
        const startingComplexity = this.estimateComplexity(lowerContent.slice(0, Math.floor(lowerContent.length / 3)));
        const endingComplexity = this.estimateComplexity(lowerContent.slice(-Math.floor(lowerContent.length / 3)));
        // Detect complexity jumps
        const complexityJumps = this.detectComplexityJumps(content);
        // Determine curve type
        const curveType = this.determineCurveType(startingComplexity, endingComplexity, complexityJumps);
        // Check if appropriate for student level
        let appropriate = true;
        if (studentProfile) {
            const studentLevel = getDifficultyLevelIndex(studentProfile.currentDifficultyLevel);
            const contentStartLevel = Math.floor(startingComplexity / 25);
            appropriate = Math.abs(contentStartLevel - studentLevel) <= 1;
        }
        // Also check if progression is reasonable
        const hasProblematicJumps = complexityJumps.some((j) => j.problematic);
        appropriate = appropriate && !hasProblematicJumps;
        return {
            appropriate,
            startingComplexity,
            endingComplexity,
            curveType,
            complexityJumps,
        };
    }
    /**
     * Estimate complexity of text segment
     */
    estimateComplexity(text) {
        let score = 50; // Base score
        // Check for complexity indicators
        for (const indicator of COMPLEXITY_INDICATORS.low) {
            if (text.includes(indicator))
                score -= 10;
        }
        for (const indicator of COMPLEXITY_INDICATORS.medium) {
            if (text.includes(indicator))
                score += 5;
        }
        for (const indicator of COMPLEXITY_INDICATORS.high) {
            if (text.includes(indicator))
                score += 15;
        }
        // Estimate based on sentence length and vocabulary
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
        const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) /
            (sentences.length || 1);
        if (avgSentenceLength > 20)
            score += 10;
        if (avgSentenceLength > 30)
            score += 10;
        if (avgSentenceLength < 10)
            score -= 10;
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Detect sudden complexity jumps in content
     */
    detectComplexityJumps(content) {
        const jumps = [];
        const text = content.content;
        // Split into sections (by paragraph or heading-like patterns)
        const sections = text.split(/\n\n+|(?=#+\s)/).filter((s) => s.trim());
        let previousComplexity = 0;
        for (let i = 0; i < sections.length; i++) {
            const currentComplexity = this.estimateComplexity(sections[i].toLowerCase());
            if (i > 0) {
                const magnitude = currentComplexity - previousComplexity;
                if (Math.abs(magnitude) > this.config.maxComplexityJump) {
                    jumps.push({
                        location: `Section ${i + 1}`,
                        magnitude,
                        problematic: magnitude > this.config.maxComplexityJump,
                    });
                }
            }
            previousComplexity = currentComplexity;
        }
        // Also check prior content sequence
        if (content.priorContent && content.priorContent.length > 0) {
            const lastPrior = content.priorContent[content.priorContent.length - 1];
            const priorComplexity = getDifficultyLevelIndex(lastPrior.difficulty) * 25 +
                getBloomsLevelIndex(lastPrior.bloomsLevel) * 10;
            const currentStartComplexity = this.estimateComplexity(text.slice(0, Math.floor(text.length / 3)).toLowerCase());
            const sequenceJump = currentStartComplexity - priorComplexity;
            if (Math.abs(sequenceJump) > this.config.maxComplexityJump) {
                jumps.unshift({
                    location: 'Transition from prior content',
                    magnitude: sequenceJump,
                    problematic: sequenceJump > this.config.maxComplexityJump,
                });
            }
        }
        return jumps;
    }
    /**
     * Determine complexity curve type
     */
    determineCurveType(start, end, jumps) {
        const diff = end - start;
        if (jumps.filter((j) => j.problematic).length > 1) {
            return 'irregular';
        }
        if (Math.abs(diff) < 10) {
            return 'flat';
        }
        if (jumps.length > 2) {
            return 'stepped';
        }
        if (diff > 30) {
            return 'exponential';
        }
        return 'linear';
    }
    /**
     * Analyze prerequisite coverage
     */
    analyzePrerequisiteCoverage(content, studentProfile) {
        const required = content.prerequisites ?? [];
        const addressed = [];
        const assumed = [];
        const missing = [];
        const lowerContent = content.content.toLowerCase();
        for (const prereq of required) {
            const lowerPrereq = prereq.toLowerCase();
            // Check if prerequisite is explained or referenced
            if (lowerContent.includes(lowerPrereq) ||
                lowerContent.includes(`understanding of ${lowerPrereq}`) ||
                lowerContent.includes(`knowledge of ${lowerPrereq}`)) {
                addressed.push(prereq);
            }
            else if (lowerContent.includes(`assuming you know ${lowerPrereq}`) ||
                lowerContent.includes(`prerequisite: ${lowerPrereq}`)) {
                assumed.push(prereq);
            }
            else {
                // Check if student already has the prerequisite
                if (studentProfile &&
                    studentProfile.completedTopics.some((t) => t.toLowerCase().includes(lowerPrereq))) {
                    assumed.push(prereq);
                }
                else {
                    missing.push(prereq);
                }
            }
        }
        // Also check for implicit prerequisites from prior content
        if (content.priorContent) {
            for (const prior of content.priorContent) {
                for (const concept of prior.conceptsIntroduced) {
                    if (!addressed.includes(concept) &&
                        !assumed.includes(concept) &&
                        lowerContent.includes(concept.toLowerCase())) {
                        addressed.push(concept);
                    }
                }
            }
        }
        const coveragePercentage = required.length > 0
            ? ((addressed.length + assumed.length) / required.length) * 100
            : 100;
        return {
            required,
            addressed,
            assumed,
            missing,
            coveragePercentage,
        };
    }
    /**
     * Analyze support structures in content
     */
    analyzeSupportStructures(content) {
        const structures = [];
        const lowerContent = content.toLowerCase();
        for (const [type, indicators] of Object.entries(SUPPORT_INDICATORS)) {
            for (const indicator of indicators) {
                if (lowerContent.includes(indicator)) {
                    // Find approximate location
                    const index = lowerContent.indexOf(indicator);
                    const lineNumber = lowerContent
                        .slice(0, index)
                        .split('\n').length;
                    structures.push({
                        type: type,
                        description: `${type} support found: "${indicator}"`,
                        location: `Line ${lineNumber}`,
                        effectiveness: this.estimateSupportEffectiveness(type, content, index),
                    });
                }
            }
        }
        return structures;
    }
    /**
     * Estimate effectiveness of a support structure
     */
    estimateSupportEffectiveness(type, content, index) {
        // Get surrounding context
        const contextStart = Math.max(0, index - 100);
        const contextEnd = Math.min(content.length, index + 200);
        const context = content.slice(contextStart, contextEnd).toLowerCase();
        let effectiveness = 70; // Base effectiveness
        // Adjust based on context
        if (type === 'example' && context.includes('step')) {
            effectiveness += 10;
        }
        if (type === 'hint' && context.includes('try')) {
            effectiveness += 10;
        }
        if (type === 'feedback' && (context.includes('because') || context.includes('why'))) {
            effectiveness += 15; // Explanatory feedback is more effective
        }
        if (type === 'model' && context.includes('observe')) {
            effectiveness += 10;
        }
        return Math.min(100, effectiveness);
    }
    /**
     * Analyze gradual release of responsibility
     */
    analyzeGradualRelease(content) {
        const lowerContent = content.toLowerCase();
        const phasesPresent = [];
        // Check for each phase
        for (const [phase, indicators] of Object.entries(GRADUAL_RELEASE_INDICATORS)) {
            for (const indicator of indicators) {
                if (lowerContent.includes(indicator)) {
                    if (!phasesPresent.includes(phase)) {
                        phasesPresent.push(phase);
                    }
                    break;
                }
            }
        }
        // Determine completeness
        const complete = phasesPresent.length >= 3;
        // Determine balance
        const teacherPhases = phasesPresent.filter((p) => p === 'I_DO' || p === 'WE_DO').length;
        const studentPhases = phasesPresent.filter((p) => p === 'YOU_DO_TOGETHER' || p === 'YOU_DO_ALONE').length;
        let balance = 'balanced';
        if (teacherPhases > studentPhases + 1) {
            balance = 'teacher-heavy';
        }
        else if (studentPhases > teacherPhases + 1) {
            balance = 'student-heavy';
        }
        return {
            phasesPresent,
            complete,
            balance,
        };
    }
    /**
     * Determine if content is properly scaffolded
     */
    determineProperScaffolding(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
        // Check complexity progression
        if (!complexityProgression.appropriate) {
            return false;
        }
        // Check prerequisite coverage
        if (prerequisiteCoverage.coveragePercentage < this.config.minPrerequisiteCoverage) {
            return false;
        }
        // Check support structures
        if (supportStructures.length < this.config.minSupportStructures) {
            return false;
        }
        // Check gradual release if required
        if (this.config.requireGradualRelease && !gradualRelease.complete) {
            return false;
        }
        return true;
    }
    /**
     * Calculate scaffolding score
     */
    calculateScore(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
        let score = 0;
        // Complexity progression (30%)
        if (complexityProgression.appropriate) {
            score += 25;
            if (complexityProgression.curveType === 'linear') {
                score += 5;
            }
            else if (complexityProgression.curveType === 'stepped') {
                score += 5;
            }
        }
        else {
            score += 10; // Partial credit
        }
        // Prerequisite coverage (25%)
        score += (prerequisiteCoverage.coveragePercentage / 100) * 25;
        // Support structures (25%)
        const supportScore = Math.min(25, supportStructures.length * 5 +
            supportStructures.reduce((sum, s) => sum + s.effectiveness / 100, 0) * 5);
        score += supportScore;
        // Gradual release (20%)
        if (gradualRelease.complete) {
            score += 20;
        }
        else {
            score += gradualRelease.phasesPresent.length * 5;
        }
        return Math.round(Math.min(100, score));
    }
    /**
     * Calculate confidence in the analysis
     */
    calculateConfidence(content, supportStructures) {
        let confidence = 0.5;
        // More content = higher confidence
        if (content.content.length > 500)
            confidence += 0.1;
        if (content.content.length > 1000)
            confidence += 0.1;
        // Prerequisites specified = higher confidence
        if (content.prerequisites && content.prerequisites.length > 0) {
            confidence += 0.1;
        }
        // More support structures found = higher confidence
        if (supportStructures.length >= 3)
            confidence += 0.1;
        if (supportStructures.length >= 5)
            confidence += 0.1;
        return Math.min(1, confidence);
    }
    /**
     * Analyze issues and generate recommendations
     */
    analyzeIssuesAndRecommendations(complexityProgression, prerequisiteCoverage, supportStructures, gradualRelease) {
        const issues = [];
        const recommendations = [];
        // Check complexity progression
        if (!complexityProgression.appropriate) {
            issues.push({
                type: 'complexity_progression',
                severity: complexityProgression.complexityJumps.filter((j) => j.problematic)
                    .length > 2
                    ? 'high'
                    : 'medium',
                description: 'Complexity progression is not appropriate',
                learningImpact: 'Students may struggle with sudden difficulty increases',
                suggestedFix: 'Add transitional content to smooth complexity jumps',
            });
            recommendations.push('Add bridging content between complex topics', 'Introduce concepts more gradually');
        }
        // Check problematic jumps
        for (const jump of complexityProgression.complexityJumps.filter((j) => j.problematic)) {
            issues.push({
                type: 'complexity_jump',
                severity: jump.magnitude > 50 ? 'high' : 'medium',
                description: `Sudden complexity jump at ${jump.location} (magnitude: ${jump.magnitude})`,
                learningImpact: 'Students may become confused or frustrated',
                suggestedFix: 'Add intermediate explanations or examples',
            });
        }
        // Check prerequisite coverage
        if (prerequisiteCoverage.missing.length > 0) {
            issues.push({
                type: 'missing_prerequisites',
                severity: prerequisiteCoverage.missing.length > 2 ? 'high' : 'medium',
                description: `Missing prerequisites: ${prerequisiteCoverage.missing.join(', ')}`,
                learningImpact: 'Students may lack foundational knowledge',
                suggestedFix: 'Add brief explanations or links to prerequisite content',
            });
            recommendations.push(`Address missing prerequisites: ${prerequisiteCoverage.missing.join(', ')}`);
        }
        // Check support structures
        if (supportStructures.length < this.config.minSupportStructures) {
            issues.push({
                type: 'insufficient_support',
                severity: supportStructures.length === 0 ? 'high' : 'medium',
                description: `Only ${supportStructures.length} support structures found`,
                learningImpact: 'Students may not have enough guidance',
                suggestedFix: 'Add examples, hints, or scaffolded activities',
            });
            recommendations.push('Add more examples to illustrate concepts', 'Include hints or prompts to guide learners');
        }
        // Check gradual release
        if (this.config.requireGradualRelease &&
            !gradualRelease.complete) {
            issues.push({
                type: 'incomplete_gradual_release',
                severity: 'medium',
                description: 'Content does not include all gradual release phases',
                learningImpact: 'Students may not transition smoothly to independent practice',
                suggestedFix: 'Add modeling, guided practice, and independent activities',
            });
            const missingPhases = [];
            if (!gradualRelease.phasesPresent.includes('I_DO')) {
                missingPhases.push('teacher modeling');
            }
            if (!gradualRelease.phasesPresent.includes('WE_DO')) {
                missingPhases.push('guided practice');
            }
            if (!gradualRelease.phasesPresent.includes('YOU_DO_ALONE')) {
                missingPhases.push('independent practice');
            }
            if (missingPhases.length > 0) {
                recommendations.push(`Add ${missingPhases.join(', ')} activities`);
            }
        }
        // Check balance
        if (gradualRelease.balance !== 'balanced') {
            issues.push({
                type: 'unbalanced_release',
                severity: 'low',
                description: `Gradual release is ${gradualRelease.balance}`,
                learningImpact: gradualRelease.balance === 'teacher-heavy'
                    ? 'Students may not get enough practice'
                    : 'Students may not have enough scaffolding',
                suggestedFix: gradualRelease.balance === 'teacher-heavy'
                    ? 'Add more student practice opportunities'
                    : 'Add more modeling and guided practice',
            });
        }
        return { issues, recommendations };
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a Scaffolding Evaluator with default config
 */
export function createScaffoldingEvaluator(config) {
    return new ScaffoldingEvaluator(config);
}
/**
 * Create a strict Scaffolding Evaluator
 */
export function createStrictScaffoldingEvaluator() {
    return new ScaffoldingEvaluator({
        maxComplexityJump: 20,
        minPrerequisiteCoverage: 80,
        minSupportStructures: 4,
        passingScore: 80,
        requireGradualRelease: true,
    });
}
/**
 * Create a lenient Scaffolding Evaluator
 */
export function createLenientScaffoldingEvaluator() {
    return new ScaffoldingEvaluator({
        maxComplexityJump: 40,
        minPrerequisiteCoverage: 50,
        minSupportStructures: 1,
        passingScore: 60,
        requireGradualRelease: false,
    });
}
//# sourceMappingURL=scaffolding-evaluator.js.map