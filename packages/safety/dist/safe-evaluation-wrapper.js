/**
 * Safe Evaluation Wrapper
 *
 * Integrates safety validation into the evaluation pipeline.
 * Wraps AI-generated feedback with safety checks and auto-correction.
 */
import { createFairnessSafetyValidator, createStrictFairnessValidator, } from './fairness-validator';
// ============================================================================
// SAFE EVALUATION WRAPPER
// ============================================================================
/**
 * Safe Evaluation Wrapper
 * Ensures all AI-generated feedback passes safety checks
 */
export class SafeEvaluationWrapper {
    constructor(config = {}) {
        this.config = {
            autoRewrite: config.autoRewrite ?? true,
            strictMode: config.strictMode ?? false,
            targetGradeLevel: config.targetGradeLevel ?? 8,
            skipValidation: config.skipValidation ?? false,
            logResults: config.logResults ?? true,
        };
        this.validator =
            config.validator ??
                (config.strictMode
                    ? createStrictFairnessValidator({
                        targetGradeLevel: this.config.targetGradeLevel,
                    })
                    : createFairnessSafetyValidator({
                        targetGradeLevel: this.config.targetGradeLevel,
                    }));
    }
    /**
     * Wrap an AI evaluation result with safety validation
     */
    async wrapEvaluation(evaluation, evaluationId) {
        if (this.config.skipValidation) {
            return {
                ...evaluation,
                safetyValidation: {
                    passed: true,
                    score: 100,
                    issueCount: 0,
                    wasRewritten: false,
                },
            };
        }
        // Convert to EvaluationFeedback format
        const feedback = {
            id: evaluationId ?? `eval-${Date.now()}`,
            text: evaluation.feedback,
            score: evaluation.score,
            maxScore: evaluation.maxScore,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            targetGradeLevel: this.config.targetGradeLevel,
        };
        // Run safety validation
        const safetyResult = await this.validator.validateFeedback(feedback);
        if (this.config.logResults) {
            this.logSafetyResult(evaluationId, safetyResult);
        }
        // If passed, return as-is
        if (safetyResult.passed) {
            return {
                ...evaluation,
                safetyValidation: {
                    passed: true,
                    score: safetyResult.score,
                    issueCount: safetyResult.issues.length,
                    wasRewritten: false,
                },
            };
        }
        // If failed and auto-rewrite is enabled, attempt to fix
        if (this.config.autoRewrite) {
            const rewrittenFeedback = this.validator.rewriteFeedback(feedback);
            return {
                ...evaluation,
                feedback: rewrittenFeedback.text,
                strengths: this.ensurePositiveStrengths(evaluation.strengths),
                improvements: this.ensureConstructiveImprovements(evaluation.improvements),
                safetyValidation: {
                    passed: false,
                    score: safetyResult.score,
                    issueCount: safetyResult.issues.length,
                    wasRewritten: true,
                    originalFeedback: evaluation.feedback,
                    issues: safetyResult.issues.map((issue) => ({
                        type: issue.type,
                        severity: issue.severity,
                        description: issue.description,
                    })),
                },
            };
        }
        // Return with issues flagged
        return {
            ...evaluation,
            safetyValidation: {
                passed: false,
                score: safetyResult.score,
                issueCount: safetyResult.issues.length,
                wasRewritten: false,
                issues: safetyResult.issues.map((issue) => ({
                    type: issue.type,
                    severity: issue.severity,
                    description: issue.description,
                })),
            },
        };
    }
    /**
     * Quick check if feedback is safe (without full result)
     */
    async isSafe(feedback) {
        if (this.config.skipValidation) {
            return true;
        }
        const result = await this.validator.quickValidate({
            id: 'quick-check',
            text: feedback,
            score: 0,
            maxScore: 100,
        });
        return result.passed;
    }
    /**
     * Get improvement suggestions for feedback
     */
    getSuggestions(feedback) {
        return this.validator.suggestImprovements({
            id: 'suggestion-check',
            text: feedback,
            score: 0,
            maxScore: 100,
        });
    }
    /**
     * Ensure strengths are positively framed
     */
    ensurePositiveStrengths(strengths) {
        if (!strengths || strengths.length === 0) {
            return ['Shows effort in attempting the question'];
        }
        return strengths.map((s) => {
            // Ensure strength doesn't contain negative language
            if (s.toLowerCase().includes('but') ||
                s.toLowerCase().includes('however')) {
                return s.split(/\s+but\s+|\s+however\s+/i)[0].trim();
            }
            return s;
        });
    }
    /**
     * Ensure improvements are constructively framed
     */
    ensureConstructiveImprovements(improvements) {
        if (!improvements || improvements.length === 0) {
            return [];
        }
        const constructiveStarters = [
            'Consider',
            'Try',
            'You might',
            'One way to improve is',
            'A helpful approach would be',
        ];
        return improvements.map((imp) => {
            // Check if already constructively framed
            const lowerImp = imp.toLowerCase();
            if (lowerImp.startsWith('consider') ||
                lowerImp.startsWith('try') ||
                lowerImp.startsWith('you might') ||
                lowerImp.startsWith('one way') ||
                lowerImp.startsWith('a helpful')) {
                return imp;
            }
            // Reframe negative statements
            if (lowerImp.startsWith("don't") ||
                lowerImp.startsWith('never') ||
                lowerImp.startsWith('avoid') ||
                lowerImp.startsWith('stop')) {
                const starter = constructiveStarters[Math.floor(Math.random() * constructiveStarters.length)];
                return `${starter} ${imp.replace(/^(don't|never|avoid|stop)\s+/i, '')}`;
            }
            return imp;
        });
    }
    /**
     * Log safety validation result
     */
    logSafetyResult(evaluationId, result) {
        if (result.passed) {
            console.log(`[SafeEvaluation] ${evaluationId ?? 'unknown'}: PASSED (score: ${result.score})`);
        }
        else {
            console.warn(`[SafeEvaluation] ${evaluationId ?? 'unknown'}: FAILED (score: ${result.score}, issues: ${result.issues.length})`);
            for (const issue of result.issues) {
                console.warn(`  - [${issue.severity}] ${issue.type}: ${issue.description}`);
            }
        }
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a safe evaluation wrapper
 */
export function createSafeEvaluationWrapper(config) {
    return new SafeEvaluationWrapper(config);
}
/**
 * Create a strict safe evaluation wrapper
 */
export function createStrictSafeEvaluationWrapper(config) {
    return new SafeEvaluationWrapper({ ...config, strictMode: true });
}
// ============================================================================
// SINGLETON INSTANCE
// ============================================================================
let defaultWrapper;
/**
 * Get default safe evaluation wrapper
 */
export function getDefaultSafeEvaluationWrapper() {
    if (!defaultWrapper) {
        defaultWrapper = new SafeEvaluationWrapper();
    }
    return defaultWrapper;
}
/**
 * Reset default wrapper (for testing)
 */
export function resetDefaultSafeEvaluationWrapper() {
    defaultWrapper = undefined;
}
// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================
/**
 * Wrap an AI evaluation with safety validation (using default wrapper)
 */
export async function wrapEvaluationWithSafety(evaluation, evaluationId) {
    return getDefaultSafeEvaluationWrapper().wrapEvaluation(evaluation, evaluationId);
}
/**
 * Quick check if feedback text is safe
 */
export async function isFeedbackTextSafe(feedback) {
    return getDefaultSafeEvaluationWrapper().isSafe(feedback);
}
/**
 * Get suggestions for improving feedback
 */
export function getFeedbackSuggestions(feedback) {
    return getDefaultSafeEvaluationWrapper().getSuggestions(feedback);
}
//# sourceMappingURL=safe-evaluation-wrapper.js.map