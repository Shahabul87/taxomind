/**
 * Constructive Framing Checker
 *
 * Priority 10: Safety + Fairness Checks
 * Ensures feedback is constructively framed with growth mindset language
 */
// ============================================================================
// POSITIVE LANGUAGE PATTERNS
// ============================================================================
/**
 * Positive/encouraging language patterns
 */
const POSITIVE_PATTERNS = {
    strengths: [
        /\b(great|excellent|good|strong|impressive|outstanding)\s+(work|job|effort|understanding|analysis)\b/gi,
        /\b(well|clearly|effectively)\s+(demonstrated|explained|articulated|organized)\b/gi,
        /\b(shows|demonstrates|exhibits)\s+(understanding|mastery|skill|growth)\b/gi,
        /\byou\s+(did|have)\s+(well|great|excellently)\b/gi,
        /\bkeep\s+up\s+the\s+(good|great|excellent)\s+work\b/gi,
    ],
    encouragement: [
        /\byou\s+can\s+(do|achieve|improve|succeed)\b/gi,
        /\bwith\s+(practice|effort|time),?\s+you\b/gi,
        /\bbelieve\s+in\s+(your|yourself)\b/gi,
        /\b(keep|continue)\s+(trying|working|practicing)\b/gi,
        /\byou'?re\s+(on\s+the\s+right\s+track|making\s+progress|improving)\b/gi,
    ],
    progress: [
        /\b(improved|progress|growth|advancement)\s+(in|on|with)\b/gi,
        /\b(better|stronger)\s+than\s+(before|last\s+time|previously)\b/gi,
        /\bshowing\s+(improvement|progress|development)\b/gi,
        /\b(getting|becoming)\s+(better|stronger)\b/gi,
    ],
    specificPraise: [
        /\bI\s+(particularly\s+)?(liked|appreciated|noticed)\b/gi,
        /\b(your|the)\s+\w+\s+(was|were)\s+(particularly\s+)?(effective|strong|clear)\b/gi,
        /\b(highlight|standout|notable)\s+(point|aspect|strength)\b/gi,
    ],
    growthAcknowledgment: [
        /\blearning\s+(is\s+a\s+)?(process|journey)\b/gi,
        /\bmistakes\s+(are|help)\s+(learning|opportunities)\b/gi,
        /\bevery\s+(attempt|effort)\s+(counts|matters|helps)\b/gi,
        /\bgrowth\s+mindset\b/gi,
    ],
};
/**
 * Fixed mindset language patterns (negative)
 */
const FIXED_MINDSET_PATTERNS = [
    {
        pattern: /\byou'?re\s+(not\s+)?(a\s+)?(math|science|writing|reading)\s+person\b/gi,
        suggestion: 'Focus on specific skills that can be developed',
    },
    {
        pattern: /\bsome\s+(people|students)\s+(just\s+)?(can'?t|aren'?t\s+able)\b/gi,
        suggestion: 'All students can improve with appropriate support and practice',
    },
    {
        pattern: /\b(natural|born)\s+(talent|ability)\b/gi,
        suggestion: 'Emphasize effort and practice over innate ability',
    },
    {
        pattern: /\byou\s+(either\s+)?(have|got)\s+it\s+or\s+you\s+don'?t\b/gi,
        suggestion: 'Skills can be developed through dedicated practice',
    },
    {
        pattern: /\b(smart|intelligent)\s+(enough|or\s+not)\b/gi,
        suggestion: 'Intelligence grows through learning and effort',
    },
];
/**
 * Actionable feedback patterns
 */
const ACTIONABLE_PATTERNS = [
    /\b(try|consider|next\s+time)\b/gi,
    /\b(to\s+improve|for\s+improvement)\b/gi,
    /\b(suggest|recommend)\b/gi,
    /\b(one\s+way|another\s+approach)\b/gi,
    /\b(you\s+could|you\s+might)\b/gi,
    /\b(focus\s+on|work\s+on)\b/gi,
];
/**
 * Vague feedback patterns (negative)
 */
const VAGUE_PATTERNS = [
    {
        pattern: /^(good|nice|okay|fine)\.?$/gi,
        suggestion: 'Provide specific feedback about what was good',
    },
    {
        pattern: /\bneeds\s+(work|improvement)\.?$/gi,
        suggestion: 'Specify what needs improvement and how to improve it',
    },
    {
        pattern: /\bnot\s+quite\s+(right|there)\.?$/gi,
        suggestion: 'Explain what is missing and how to address it',
    },
    {
        pattern: /\b(wrong|incorrect)\.?$/gi,
        suggestion: 'Explain why it is incorrect and the correct approach',
    },
];
/**
 * Default configuration
 */
export const DEFAULT_CONSTRUCTIVE_CONFIG = {
    minPositiveElements: 1,
    requireActionableSuggestions: true,
    minConstructivenessScore: 60,
    minGrowthMindsetScore: 50,
};
// ============================================================================
// CHECKER IMPLEMENTATION
// ============================================================================
/**
 * Constructive Framing Checker
 * Ensures feedback uses growth mindset language and constructive framing
 */
export class ConstructiveFramingChecker {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONSTRUCTIVE_CONFIG, ...config };
        this.logger = config.logger;
    }
    /**
     * Check feedback for constructive framing
     */
    check(feedback) {
        const text = this.combineText(feedback);
        const issues = [];
        // Find positive elements
        const positiveElements = this.findPositiveElements(text);
        // Check for fixed mindset language
        const fixedMindsetIssues = this.checkFixedMindsetLanguage(text);
        issues.push(...fixedMindsetIssues);
        // Check for vague feedback
        const vagueIssues = this.checkVagueFeedback(text);
        issues.push(...vagueIssues);
        // Check for missing positives
        if (positiveElements.length < this.config.minPositiveElements) {
            issues.push({
                type: 'missing_positives',
                description: `Feedback should include at least ${this.config.minPositiveElements} positive element(s)`,
                text: '',
                suggestion: 'Start with something the student did well before addressing areas for improvement',
            });
        }
        // Check for actionable suggestions
        if (this.config.requireActionableSuggestions) {
            const hasActionable = this.hasActionableSuggestions(text);
            if (!hasActionable &&
                feedback.improvements &&
                feedback.improvements.length > 0) {
                issues.push({
                    type: 'no_next_steps',
                    description: 'Improvements identified but no actionable suggestions provided',
                    text: feedback.improvements.join('; '),
                    suggestion: 'Include specific, actionable steps the student can take to improve',
                });
            }
        }
        // Check balance of criticism
        const balanceIssue = this.checkCriticismBalance(feedback, positiveElements);
        if (balanceIssue) {
            issues.push(balanceIssue);
        }
        // Check for encouragement when score is low
        if (feedback.score / feedback.maxScore < 0.6) {
            const hasEncouragement = this.hasEncouragement(text);
            if (!hasEncouragement) {
                issues.push({
                    type: 'missing_encouragement',
                    description: 'Low-scoring work should include encouraging language',
                    text: '',
                    suggestion: 'Add supportive language that acknowledges effort and potential for growth',
                });
            }
        }
        // Calculate scores
        const constructivenessScore = this.calculateConstructivenessScore(positiveElements, issues);
        const growthMindsetScore = this.calculateGrowthMindsetScore(text);
        // Determine pass/fail
        const passed = issues.filter((i) => i.type === 'fixed_mindset_language' ||
            i.type === 'unbalanced_criticism' ||
            i.type === 'missing_positives').length === 0 &&
            constructivenessScore >= this.config.minConstructivenessScore;
        this.logger?.debug('Constructive framing check complete', {
            positiveElements: positiveElements.length,
            issueCount: issues.length,
            constructivenessScore,
            growthMindsetScore,
            passed,
        });
        return {
            passed,
            score: constructivenessScore,
            issues,
            positiveElements,
            growthMindsetScore,
        };
    }
    /**
     * Combine all text from feedback
     */
    combineText(feedback) {
        const parts = [feedback.text];
        if (feedback.strengths) {
            parts.push(...feedback.strengths);
        }
        if (feedback.improvements) {
            parts.push(...feedback.improvements);
        }
        if (feedback.comments) {
            parts.push(feedback.comments);
        }
        return parts.join(' ');
    }
    /**
     * Find positive elements in text
     */
    findPositiveElements(text) {
        const elements = [];
        for (const [type, patterns] of Object.entries(POSITIVE_PATTERNS)) {
            for (const pattern of patterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    elements.push({
                        type: type,
                        text: match[0],
                        position: match.index,
                    });
                }
            }
        }
        // Remove duplicates
        return this.deduplicateElements(elements);
    }
    /**
     * Check for fixed mindset language
     */
    checkFixedMindsetLanguage(text) {
        const issues = [];
        for (const patternDef of FIXED_MINDSET_PATTERNS) {
            patternDef.pattern.lastIndex = 0;
            let match;
            while ((match = patternDef.pattern.exec(text)) !== null) {
                issues.push({
                    type: 'fixed_mindset_language',
                    description: 'Uses fixed mindset language that may limit student belief in growth',
                    text: match[0],
                    suggestion: patternDef.suggestion,
                });
            }
        }
        return issues;
    }
    /**
     * Check for vague feedback
     */
    checkVagueFeedback(text) {
        const issues = [];
        for (const patternDef of VAGUE_PATTERNS) {
            patternDef.pattern.lastIndex = 0;
            let match;
            while ((match = patternDef.pattern.exec(text)) !== null) {
                issues.push({
                    type: 'vague_feedback',
                    description: 'Feedback is too vague to be actionable',
                    text: match[0],
                    suggestion: patternDef.suggestion,
                });
            }
        }
        return issues;
    }
    /**
     * Check if text has actionable suggestions
     */
    hasActionableSuggestions(text) {
        for (const pattern of ACTIONABLE_PATTERNS) {
            pattern.lastIndex = 0;
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if text has encouragement
     */
    hasEncouragement(text) {
        for (const pattern of POSITIVE_PATTERNS.encouragement) {
            pattern.lastIndex = 0;
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check balance of criticism vs positives
     */
    checkCriticismBalance(feedback, positiveElements) {
        const improvementCount = feedback.improvements?.length ?? 0;
        const strengthCount = (feedback.strengths?.length ?? 0) + positiveElements.length;
        // If improvements significantly outweigh positives
        if (improvementCount > 3 && strengthCount === 0) {
            return {
                type: 'unbalanced_criticism',
                description: 'Feedback focuses heavily on criticisms without acknowledging strengths',
                text: `${improvementCount} improvements vs ${strengthCount} positives`,
                suggestion: 'Balance criticism with recognition of what the student did well',
            };
        }
        if (improvementCount > strengthCount * 3 && strengthCount > 0) {
            return {
                type: 'unbalanced_criticism',
                description: 'Ratio of criticism to positive feedback is unbalanced',
                text: `${improvementCount} improvements vs ${strengthCount} positives`,
                suggestion: 'Consider the feedback sandwich approach: positive-constructive-positive',
            };
        }
        return null;
    }
    /**
     * Calculate constructiveness score
     */
    calculateConstructivenessScore(positiveElements, issues) {
        let score = 50; // Base score
        // Add points for positive elements
        score += Math.min(positiveElements.length * 10, 30);
        // Subtract for issues
        const issuePenalties = {
            missing_positives: 15,
            criticism_without_guidance: 10,
            fixed_mindset_language: 20,
            no_next_steps: 10,
            vague_feedback: 10,
            unbalanced_criticism: 15,
            missing_encouragement: 5,
        };
        for (const issue of issues) {
            score -= issuePenalties[issue.type] ?? 5;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Calculate growth mindset score
     */
    calculateGrowthMindsetScore(text) {
        let score = 50; // Base score
        // Add for growth mindset indicators
        for (const pattern of [
            ...POSITIVE_PATTERNS.encouragement,
            ...POSITIVE_PATTERNS.growthAcknowledgment,
        ]) {
            pattern.lastIndex = 0;
            const matches = text.match(pattern);
            if (matches) {
                score += matches.length * 5;
            }
        }
        // Subtract for fixed mindset indicators
        for (const patternDef of FIXED_MINDSET_PATTERNS) {
            patternDef.pattern.lastIndex = 0;
            const matches = text.match(patternDef.pattern);
            if (matches) {
                score -= matches.length * 15;
            }
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Remove duplicate elements
     */
    deduplicateElements(elements) {
        const seen = new Set();
        return elements.filter((el) => {
            const key = `${el.type}:${el.text.toLowerCase()}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    /**
     * Get improvement suggestions
     */
    getSuggestions(result) {
        const suggestions = [];
        for (const issue of result.issues) {
            suggestions.push(`[${issue.type}] ${issue.suggestion}`);
        }
        if (result.growthMindsetScore < 50) {
            suggestions.push('Add more growth mindset language like "with practice you can improve" or "mistakes help us learn"');
        }
        if (result.positiveElements.length === 0) {
            suggestions.push('Include at least one specific positive element before addressing areas for improvement');
        }
        return suggestions;
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create constructive framing checker
 */
export function createConstructiveFramingChecker(config) {
    return new ConstructiveFramingChecker(config);
}
/**
 * Create strict constructive framing checker
 */
export function createStrictConstructiveChecker(config) {
    return new ConstructiveFramingChecker({
        ...config,
        minPositiveElements: 2,
        minConstructivenessScore: 70,
    });
}
/**
 * Create lenient constructive framing checker
 */
export function createLenientConstructiveChecker(config) {
    return new ConstructiveFramingChecker({
        ...config,
        minPositiveElements: 0,
        requireActionableSuggestions: false,
    });
}
//# sourceMappingURL=constructive-framing-checker.js.map