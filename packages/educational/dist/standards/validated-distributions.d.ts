/**
 * Research-Validated Bloom's Taxonomy Distributions
 * All distributions backed by peer-reviewed research
 *
 * This module provides evidence-based target distributions for different
 * course types, replacing arbitrary heuristics with research-cited values.
 */
import { BloomsDistribution, WebbDOKDistribution, CourseType } from '../types/depth-analysis.types';
export interface ResearchCitation {
    authors: string[];
    year: number;
    title: string;
    journal: string;
    doi?: string;
    url?: string;
    peerReviewed: boolean;
}
export interface ValidatedDistribution {
    id: string;
    name: string;
    courseType: CourseType | 'general' | 'STEM';
    distribution: BloomsDistribution;
    dokDistribution: WebbDOKDistribution;
    source: ResearchCitation;
    sampleSize?: number;
    effectSize?: number;
    confidenceInterval?: {
        lower: number;
        upper: number;
    };
    applicability: string;
}
export declare const VALIDATED_DISTRIBUTIONS: ValidatedDistribution[];
/**
 * Get appropriate distribution for course type
 */
export declare function getValidatedDistribution(courseType: CourseType | string): ValidatedDistribution;
/**
 * Get citation string in APA format
 */
export declare function getCitationString(distribution: ValidatedDistribution): string;
/**
 * Get all citations used in the system
 */
export declare function getAllCitations(): ResearchCitation[];
/**
 * Calculate alignment score between actual and target distribution
 */
export declare function calculateDistributionAlignment(actual: BloomsDistribution, target: BloomsDistribution): {
    alignmentScore: number;
    deviations: Record<string, number>;
    recommendations: string[];
};
/**
 * Get distribution recommendation based on course metadata
 */
export declare function recommendDistribution(metadata: {
    title: string;
    description?: string;
    targetAudience?: string;
    keywords?: string[];
}): {
    recommended: ValidatedDistribution;
    confidence: number;
    reasoning: string;
};
//# sourceMappingURL=validated-distributions.d.ts.map