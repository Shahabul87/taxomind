/**
 * Educational Standards - Index
 * Export all standards and research citation modules
 *
 * Includes:
 * - Quality Matters (QM) Higher Education Rubric (7th Edition)
 * - OLC Quality Scorecard for Online Programs
 * - Research-Validated Bloom's Distributions
 */
// Validated Distributions with Research Citations
export { VALIDATED_DISTRIBUTIONS, getValidatedDistribution, getCitationString, getAllCitations, calculateDistributionAlignment, recommendDistribution, } from './validated-distributions';
// Quality Matters (QM) Evaluator
export { QMEvaluator, qmEvaluator, QM_STANDARDS, } from './qm-evaluator';
// OLC Quality Scorecard Evaluator
export { OLCEvaluator, olcEvaluator, OLC_INDICATORS, } from './olc-scorecard';
// Distribution Analyzer (Phase 3: Research-Validated Distributions)
export { DistributionAnalyzer, distributionAnalyzer, } from './distribution-analyzer';
