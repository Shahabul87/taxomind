/**
 * Research Engine Types
 */
import type { SAMConfig } from '@sam-ai/core';
export interface ResearchEngineConfig {
    samConfig: SAMConfig;
    database?: ResearchDatabaseAdapter;
}
export interface ResearchPaper {
    paperId: string;
    title: string;
    abstract: string;
    authors: ResearchAuthor[];
    publication: ResearchPublication;
    publishDate: Date;
    category: ResearchCategory;
    subCategories: string[];
    keywords: string[];
    citations: number;
    hIndex: number;
    impactFactor: number;
    methodology: string[];
    findings: ResearchFinding[];
    contributions: string[];
    limitations: string[];
    futureWork: string[];
    relatedPapers: string[];
    datasets?: ResearchDataset[];
    code?: ResearchCodeRepository[];
    educationalValue: ResearchEducationalMetrics;
    practicalApplications: ResearchApplication[];
    peerReviews?: ResearchReview[];
}
export interface ResearchAuthor {
    name: string;
    affiliation: string;
    email?: string;
    orcid?: string;
    hIndex?: number;
    expertise: string[];
}
export interface ResearchPublication {
    venue: string;
    type: 'journal' | 'conference' | 'preprint' | 'workshop' | 'thesis';
    impactFactor?: number;
    tier: 'A*' | 'A' | 'B' | 'C' | 'other';
    doi?: string;
    arxivId?: string;
    pages?: string;
    volume?: string;
    issue?: string;
}
export interface ResearchFinding {
    type: 'primary' | 'secondary' | 'supplementary';
    description: string;
    evidence: string;
    significance: 'low' | 'medium' | 'high' | 'breakthrough';
    confidence: number;
}
export interface ResearchDataset {
    name: string;
    url: string;
    size: string;
    format: string;
    license: string;
    description: string;
}
export interface ResearchCodeRepository {
    platform: 'github' | 'gitlab' | 'bitbucket' | 'other';
    url: string;
    language: string[];
    stars?: number;
    license: string;
    lastUpdated: Date;
}
export interface ResearchEducationalMetrics {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    prerequisites: string[];
    learningOutcomes: string[];
    estimatedStudyTime: number;
    suitableFor: string[];
    teachingValue: number;
}
export interface ResearchApplication {
    domain: string;
    description: string;
    impact: string;
    readinessLevel: 'theoretical' | 'experimental' | 'prototype' | 'production';
    companies?: string[];
}
export interface ResearchReview {
    reviewer: string;
    rating: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
}
export type ResearchCategory = 'machine-learning' | 'deep-learning' | 'nlp' | 'computer-vision' | 'reinforcement-learning' | 'robotics' | 'quantum-computing' | 'ethics-fairness' | 'theory' | 'systems' | 'hci' | 'bioinformatics';
export interface ResearchTrend {
    trendId: string;
    name: string;
    description: string;
    paperCount: number;
    growthRate: number;
    keyResearchers: ResearchAuthor[];
    breakthroughPapers: string[];
    emergingTopics: string[];
    fundingTrends: ResearchFundingInfo[];
}
export interface ResearchFundingInfo {
    source: string;
    amount: number;
    currency: string;
    duration: string;
    focus: string[];
}
export interface ResearchLiteratureReview {
    topic: string;
    scope: string;
    methodology: string;
    papers: ResearchPaper[];
    synthesis: {
        commonThemes: string[];
        gaps: string[];
        controversies: string[];
        futureDirections: string[];
    };
    timeline: ResearchTimeline[];
    keyContributors: ResearchAuthor[];
    recommendations: string[];
}
export interface ResearchTimeline {
    year: number;
    milestone: string;
    papers: string[];
    impact: string;
}
export interface ResearchMetrics {
    field: string;
    timeframe: 'month' | 'quarter' | 'year' | 'all-time';
    totalPapers: number;
    averageCitations: number;
    topPapers: ResearchPaper[];
    emergingAuthors: ResearchAuthor[];
    collaborationNetwork: ResearchCollaborationInfo[];
    fundingTotal: number;
    industryAdoption: number;
}
export interface ResearchCollaborationInfo {
    institutions: string[];
    paperCount: number;
    impactScore: number;
    internationalCollaboration: boolean;
}
export interface ResearchReadingList {
    listId: string;
    userId: string;
    name: string;
    description: string;
    papers: string[];
    visibility: 'private' | 'public' | 'shared';
    tags: string[];
    createdAt: Date;
    lastUpdated: Date;
    followers?: string[];
}
export interface ResearchQuery {
    query: string;
    filters?: {
        categories?: ResearchCategory[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        minCitations?: number;
        venues?: string[];
        authors?: string[];
        hasCode?: boolean;
        hasDataset?: boolean;
        difficulty?: string;
    };
    sort?: 'relevance' | 'citations' | 'date' | 'impact';
    limit?: number;
}
export interface ResearchDatabaseAdapter {
    createInteraction(data: {
        userId: string;
        interactionType: string;
        context?: Record<string, unknown>;
    }): Promise<void>;
}
export interface ResearchEngine {
    searchPapers(query: ResearchQuery): Promise<ResearchPaper[]>;
    getResearchTrends(): Promise<ResearchTrend[]>;
    getPaperDetails(paperId: string): Promise<ResearchPaper | null>;
    getCitationNetwork(paperId: string, depth?: number): Promise<Map<string, Set<string>>>;
    generateLiteratureReview(topic: string, scope: string, paperIds?: string[]): Promise<ResearchLiteratureReview>;
    getEducationalPapers(difficulty?: string, prerequisites?: string[]): Promise<ResearchPaper[]>;
    createReadingList(userId: string, name: string, description: string, paperIds: string[], visibility?: 'private' | 'public' | 'shared'): Promise<ResearchReadingList>;
    getReadingLists(userId: string): Promise<ResearchReadingList[]>;
    recommendPapers(paperId: string, count?: number): Promise<ResearchPaper[]>;
    getMetrics(field: string, timeframe: 'month' | 'quarter' | 'year' | 'all-time'): Promise<ResearchMetrics>;
    recordInteraction(userId: string, paperId: string, action: 'view' | 'download' | 'cite' | 'save'): Promise<void>;
}
//# sourceMappingURL=research.types.d.ts.map