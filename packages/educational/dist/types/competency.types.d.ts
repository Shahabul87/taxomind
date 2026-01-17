/**
 * Competency Engine Types
 *
 * Types for skill trees, job mapping, competency frameworks,
 * career pathways, and portfolio building.
 */
import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
export interface CompetencyEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
    /** Enable AI-powered skill extraction */
    enableAISkillExtraction?: boolean;
    /** Default competency framework */
    defaultFramework?: CompetencyFramework;
    /** Include industry benchmarks */
    includeIndustryBenchmarks?: boolean;
}
export type CompetencyFramework = 'SFIA' | 'ONET' | 'ESCO' | 'NICE' | 'CUSTOM';
export type SkillCategory = 'TECHNICAL' | 'SOFT' | 'DOMAIN' | 'TOOL' | 'METHODOLOGY' | 'CERTIFICATION';
export type ProficiencyLevel = 'NOVICE' | 'BEGINNER' | 'COMPETENT' | 'PROFICIENT' | 'EXPERT' | 'MASTER';
export type SkillRelationType = 'PREREQUISITE' | 'COREQUISITE' | 'ENHANCES' | 'RELATED' | 'SPECIALIZATION' | 'GENERALIZATION';
export type CareerLevel = 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL' | 'EXECUTIVE';
export type PortfolioItemType = 'PROJECT' | 'CERTIFICATION' | 'COURSE_COMPLETION' | 'ASSESSMENT' | 'PUBLICATION' | 'CONTRIBUTION' | 'ACHIEVEMENT' | 'RECOMMENDATION';
/**
 * A skill in the competency system
 */
export interface CompetencySkill {
    id: string;
    name: string;
    description: string;
    category: SkillCategory;
    /** Parent skill (for hierarchical skills) */
    parentId?: string;
    /** Tags for searching/filtering */
    tags: string[];
    /** Framework mappings */
    frameworkMappings?: FrameworkMapping[];
    /** Typical time to learn (hours) */
    typicalLearningHours?: number;
    /** Demand level in job market */
    marketDemand?: MarketDemand;
    /** Related Bloom's levels */
    bloomsLevels?: BloomsLevel[];
    createdAt: Date;
    updatedAt: Date;
}
export interface FrameworkMapping {
    framework: CompetencyFramework;
    code: string;
    name: string;
    level?: number;
}
export interface MarketDemand {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    trend: 'DECLINING' | 'STABLE' | 'GROWING' | 'EMERGING';
    avgSalaryImpact?: number;
    jobPostingCount?: number;
    lastUpdated: Date;
}
/**
 * Relationship between skills
 */
export interface SkillRelation {
    sourceSkillId: string;
    targetSkillId: string;
    relationType: SkillRelationType;
    strength: number;
    description?: string;
}
/**
 * A skill tree representing a learning/career path
 */
export interface SkillTree {
    id: string;
    name: string;
    description: string;
    /** Root skill or domain */
    rootSkillId: string;
    /** All nodes in the tree */
    nodes: SkillTreeNode[];
    /** Edges connecting nodes */
    edges: SkillTreeEdge[];
    /** Target career roles */
    targetRoles?: string[];
    /** Estimated total learning hours */
    totalLearningHours: number;
    /** Difficulty progression */
    difficultyProgression: DifficultyProgression;
    createdAt: Date;
    updatedAt: Date;
}
export interface SkillTreeNode {
    id: string;
    skillId: string;
    skill: CompetencySkill;
    /** Position in tree (for visualization) */
    position: {
        x: number;
        y: number;
        tier: number;
    };
    /** Required proficiency to unlock next tier */
    requiredProficiency: ProficiencyLevel;
    /** Is this a milestone/checkpoint node */
    isMilestone: boolean;
    /** Unlocks (skills that become available) */
    unlocks: string[];
    /** Learning resources for this node */
    resources?: CompetencyLearningResource[];
}
export interface SkillTreeEdge {
    sourceNodeId: string;
    targetNodeId: string;
    relationType: SkillRelationType;
    /** Is this path optional */
    isOptional: boolean;
}
export interface DifficultyProgression {
    tiers: TierInfo[];
    estimatedTimePerTier: number[];
}
export interface TierInfo {
    tier: number;
    name: string;
    description: string;
    skillCount: number;
    avgProficiencyRequired: ProficiencyLevel;
}
export interface CompetencyLearningResource {
    id: string;
    title: string;
    type: 'COURSE' | 'ARTICLE' | 'VIDEO' | 'BOOK' | 'PROJECT' | 'EXERCISE';
    url?: string;
    estimatedHours: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}
/**
 * A user's proficiency in a skill
 */
export interface UserSkillProficiency {
    userId: string;
    skillId: string;
    skill?: CompetencySkill;
    /** Current proficiency level */
    proficiency: ProficiencyLevel;
    /** Numeric score (0-100) */
    score: number;
    /** Confidence in assessment */
    confidence: number;
    /** Evidence supporting this proficiency */
    evidence: ProficiencyEvidence[];
    /** Last assessment date */
    lastAssessedAt: Date;
    /** Target proficiency */
    targetProficiency?: ProficiencyLevel;
    /** Progress toward target */
    progressToTarget?: number;
}
export interface ProficiencyEvidence {
    type: 'ASSESSMENT' | 'PROJECT' | 'CERTIFICATION' | 'PEER_REVIEW' | 'SELF_REPORT' | 'COURSE';
    sourceId?: string;
    description: string;
    score?: number;
    date: Date;
    verifiedBy?: string;
}
/**
 * User's overall competency profile
 */
export interface CompetencyProfile {
    userId: string;
    /** All skill proficiencies */
    skills: UserSkillProficiency[];
    /** Skill distribution by category */
    categoryDistribution: Record<SkillCategory, number>;
    /** Overall competency score */
    overallScore: number;
    /** Strengths (top skills) */
    strengths: CompetencySkill[];
    /** Areas for improvement */
    improvementAreas: CompetencySkill[];
    /** Skill gaps for target roles */
    skillGaps: SkillGap[];
    /** Learning recommendations */
    recommendations: SkillRecommendation[];
    /** Last updated */
    updatedAt: Date;
}
export interface SkillGap {
    skill: CompetencySkill;
    currentLevel: ProficiencyLevel;
    requiredLevel: ProficiencyLevel;
    gap: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    targetRole?: string;
}
export interface SkillRecommendation {
    skill: CompetencySkill;
    reason: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    estimatedLearningHours: number;
    suggestedResources: CompetencyLearningResource[];
    relatedCareerPaths: string[];
}
/**
 * A job role with required competencies
 */
export interface JobRole {
    id: string;
    title: string;
    description: string;
    /** Career level */
    level: CareerLevel;
    /** Industry/domain */
    industry?: string;
    /** Required skills with proficiency levels */
    requiredSkills: RoleSkillRequirement[];
    /** Nice-to-have skills */
    preferredSkills: RoleSkillRequirement[];
    /** Typical salary range */
    salaryRange?: SalaryRange;
    /** Growth outlook */
    growthOutlook?: GrowthOutlook;
    /** Related roles */
    relatedRoles?: string[];
    /** Framework mappings */
    frameworkMappings?: FrameworkMapping[];
    createdAt: Date;
    updatedAt: Date;
}
export interface RoleSkillRequirement {
    skillId: string;
    skill?: CompetencySkill;
    minimumProficiency: ProficiencyLevel;
    weight: number;
    isRequired: boolean;
}
export interface SalaryRange {
    min: number;
    max: number;
    median: number;
    currency: string;
    location?: string;
    source?: string;
    lastUpdated: Date;
}
export interface GrowthOutlook {
    projectedGrowth: number;
    timeframeYears: number;
    demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    automationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    source?: string;
}
/**
 * Match between user and job role
 */
export interface JobRoleMatch {
    role: JobRole;
    /** Overall match score (0-100) */
    matchScore: number;
    /** Skills already met */
    metRequirements: RoleSkillRequirement[];
    /** Skills not yet met */
    unmetRequirements: RoleSkillRequirement[];
    /** Partially met skills */
    partiallyMet: PartialSkillMatch[];
    /** Estimated time to qualify */
    estimatedTimeToQualify: number;
    /** Recommended learning path */
    recommendedPath?: SkillTree;
}
export interface PartialSkillMatch {
    requirement: RoleSkillRequirement;
    currentProficiency: ProficiencyLevel;
    gap: number;
}
/**
 * A career progression path
 */
export interface CompetencyCareerPath {
    id: string;
    name: string;
    description: string;
    /** Industry/domain */
    industry?: string;
    /** Roles in progression order */
    stages: CareerStage[];
    /** Alternative branches */
    branches?: CareerBranch[];
    /** Total typical years */
    typicalYearsTotal: number;
    /** Required skill evolution */
    skillProgression: SkillProgressionMap;
}
export interface CareerStage {
    order: number;
    role: JobRole;
    typicalYearsInRole: number;
    typicalYearsToReach: number;
    keyMilestones: string[];
    transitionSkills: CompetencySkill[];
}
export interface CareerBranch {
    fromStageOrder: number;
    name: string;
    description: string;
    alternativeStages: CareerStage[];
    branchingCriteria: string[];
}
export interface SkillProgressionMap {
    /** Skills to acquire at each stage */
    byStage: Record<number, CompetencySkill[]>;
    /** Proficiency evolution for key skills */
    proficiencyEvolution: SkillEvolution[];
}
export interface SkillEvolution {
    skillId: string;
    skill?: CompetencySkill;
    progressionByStage: Record<number, ProficiencyLevel>;
}
/**
 * User's career path analysis
 */
export interface CareerPathAnalysis {
    userId: string;
    /** Current estimated position */
    currentPosition: {
        matchedRole?: JobRole;
        estimatedLevel: CareerLevel;
        confidence: number;
    };
    /** Recommended paths */
    recommendedPaths: CareerPathRecommendation[];
    /** Skills to prioritize */
    prioritySkills: SkillRecommendation[];
    /** Timeline projections */
    projections: CareerProjection[];
}
export interface CareerPathRecommendation {
    path: CompetencyCareerPath;
    fitScore: number;
    strengths: string[];
    challenges: string[];
    estimatedYearsToGoal: number;
}
export interface CareerProjection {
    yearsFromNow: number;
    projectedRole: JobRole;
    projectedSalary?: SalaryRange;
    requiredMilestones: string[];
    probability: number;
}
/**
 * A competency portfolio item
 */
export interface PortfolioItem {
    id: string;
    userId: string;
    type: PortfolioItemType;
    title: string;
    description: string;
    /** Skills demonstrated */
    demonstratedSkills: DemonstratedSkill[];
    /** Evidence/artifacts */
    artifacts: PortfolioArtifact[];
    /** Date of completion/achievement */
    date: Date;
    /** External verification */
    verification?: PortfolioVerification;
    /** Visibility */
    visibility: 'PRIVATE' | 'CONNECTIONS' | 'PUBLIC';
    /** Impact metrics */
    impact?: ImpactMetrics;
    createdAt: Date;
    updatedAt: Date;
}
export interface DemonstratedSkill {
    skillId: string;
    skill?: CompetencySkill;
    proficiencyDemonstrated: ProficiencyLevel;
    evidenceDescription: string;
}
export interface PortfolioArtifact {
    id: string;
    type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'LINK' | 'CODE' | 'PRESENTATION';
    title: string;
    url?: string;
    thumbnailUrl?: string;
    description?: string;
}
export interface PortfolioVerification {
    verified: boolean;
    verifiedBy?: string;
    verificationMethod: 'SYSTEM' | 'PEER' | 'INSTRUCTOR' | 'EMPLOYER' | 'CERTIFICATION_BODY';
    verifiedAt?: Date;
    credentialId?: string;
}
export interface ImpactMetrics {
    views?: number;
    endorsements?: number;
    shares?: number;
    employerInterest?: number;
}
/**
 * Complete user portfolio
 */
export interface CompetencyPortfolio {
    userId: string;
    items: PortfolioItem[];
    /** Summary statistics */
    summary: PortfolioSummary;
    /** Skill coverage from portfolio */
    skillCoverage: SkillCoverageAnalysis;
    /** Portfolio strength score */
    strengthScore: number;
    /** Recommendations for improvement */
    recommendations: PortfolioRecommendation[];
}
export interface PortfolioSummary {
    totalItems: number;
    itemsByType: Record<PortfolioItemType, number>;
    skillsDemonstrated: number;
    verifiedItems: number;
    totalEndorsements: number;
    lastUpdated: Date;
}
export interface SkillCoverageAnalysis {
    coveredSkills: CompetencySkill[];
    uncoveredSkills: CompetencySkill[];
    coveragePercentage: number;
    strongestEvidence: CompetencySkill[];
    weakestEvidence: CompetencySkill[];
}
export interface PortfolioRecommendation {
    type: 'ADD_PROJECT' | 'GET_CERTIFICATION' | 'ADD_EVIDENCE' | 'UPDATE_ITEM' | 'REMOVE_OUTDATED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    targetSkills?: CompetencySkill[];
    expectedImpact: string;
}
/**
 * Skill assessment configuration
 */
export interface SkillAssessment {
    id: string;
    skillId: string;
    skill?: CompetencySkill;
    title: string;
    description: string;
    /** Assessment type */
    type: CompetencyAssessmentType;
    /** Questions/tasks */
    items: AssessmentItem[];
    /** Time limit in minutes */
    timeLimitMinutes?: number;
    /** Passing threshold */
    passingScore: number;
    /** Proficiency level mappings */
    proficiencyMapping: ProficiencyScoreMapping[];
}
export type CompetencyAssessmentType = 'QUIZ' | 'PRACTICAL' | 'CODE_CHALLENGE' | 'CASE_STUDY' | 'PEER_REVIEW' | 'SELF_ASSESSMENT';
export interface AssessmentItem {
    id: string;
    type: 'MULTIPLE_CHOICE' | 'CODE' | 'SHORT_ANSWER' | 'PRACTICAL_TASK' | 'SCENARIO';
    question: string;
    options?: string[];
    correctAnswer?: string | string[];
    rubric?: CompetencyAssessmentRubric;
    points: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    bloomsLevel?: BloomsLevel;
}
export interface CompetencyAssessmentRubric {
    criteria: CompetencyRubricCriterion[];
    maxScore: number;
}
export interface CompetencyRubricCriterion {
    name: string;
    description: string;
    levels: {
        score: number;
        description: string;
    }[];
}
export interface ProficiencyScoreMapping {
    proficiency: ProficiencyLevel;
    minScore: number;
    maxScore: number;
}
/**
 * Assessment result
 */
export interface AssessmentResult {
    assessmentId: string;
    userId: string;
    score: number;
    maxScore: number;
    percentage: number;
    proficiencyAchieved: ProficiencyLevel;
    /** Item-by-item results */
    itemResults: ItemResult[];
    /** Time taken */
    timeTakenMinutes: number;
    /** Feedback */
    feedback: string;
    /** Improvement suggestions */
    improvementAreas: string[];
    completedAt: Date;
}
export interface ItemResult {
    itemId: string;
    score: number;
    maxScore: number;
    isCorrect?: boolean;
    feedback?: string;
}
export interface CreateSkillTreeInput {
    name: string;
    description: string;
    rootSkillId: string;
    targetRoles?: string[];
    skills: {
        skillId: string;
        tier: number;
        prerequisites?: string[];
        isMilestone?: boolean;
    }[];
}
export interface GetUserCompetencyInput {
    userId: string;
    includeRecommendations?: boolean;
    targetRoleIds?: string[];
}
export interface MatchJobRolesInput {
    userId: string;
    /** Filter by industry */
    industry?: string;
    /** Filter by level */
    levels?: CareerLevel[];
    /** Minimum match score */
    minMatchScore?: number;
    /** Maximum results */
    limit?: number;
}
export interface MatchJobRolesResult {
    matches: JobRoleMatch[];
    totalMatched: number;
    topSkillGaps: SkillGap[];
}
export interface AnalyzeCareerPathInput {
    userId: string;
    targetRoleId?: string;
    targetIndustry?: string;
    maxYearsHorizon?: number;
}
export interface AddPortfolioItemInput {
    userId: string;
    type: PortfolioItemType;
    title: string;
    description: string;
    date: Date;
    demonstratedSkills: {
        skillId: string;
        proficiency: ProficiencyLevel;
        evidence: string;
    }[];
    artifacts?: {
        type: PortfolioArtifact['type'];
        title: string;
        url?: string;
        description?: string;
    }[];
    visibility?: PortfolioItem['visibility'];
}
export interface AssessSkillInput {
    userId: string;
    skillId: string;
    assessmentType?: CompetencyAssessmentType;
}
export interface UpdateProficiencyInput {
    userId: string;
    skillId: string;
    proficiency: ProficiencyLevel;
    score?: number;
    evidence?: {
        type: ProficiencyEvidence['type'];
        description: string;
        sourceId?: string;
    };
}
export interface ExtractSkillsInput {
    content: string;
    contentType: 'JOB_POSTING' | 'RESUME' | 'COURSE' | 'PROJECT' | 'ARTICLE';
    context?: {
        industry?: string;
        level?: CareerLevel;
    };
}
export interface ExtractSkillsResult {
    skills: ExtractedSkillInfo[];
    suggestedCategory?: SkillCategory;
    confidence: number;
}
export interface ExtractedSkillInfo {
    name: string;
    category: SkillCategory;
    suggestedProficiency?: ProficiencyLevel;
    matchedSkillId?: string;
    confidence: number;
    context: string;
}
export interface GenerateSkillTreeInput {
    targetRole: string;
    currentSkills?: string[];
    timeframeMonths?: number;
    preferredLearningStyle?: 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';
}
export interface GetSkillGapAnalysisInput {
    userId: string;
    targetRoleId?: string;
    targetSkillIds?: string[];
}
export interface SkillGapAnalysisResult {
    gaps: SkillGap[];
    totalGapScore: number;
    prioritizedLearningPath: CompetencySkill[];
    estimatedTimeToClose: number;
    quickWins: CompetencySkill[];
    longTermInvestments: CompetencySkill[];
}
//# sourceMappingURL=competency.types.d.ts.map