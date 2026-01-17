/**
 * Competency Engine
 *
 * Handles skill trees, job mapping, competency frameworks,
 * career pathways, and portfolio building.
 *
 * Key features:
 * - Skill management and relationships
 * - Skill tree creation and visualization
 * - User competency tracking
 * - Job role matching
 * - Career path analysis
 * - Portfolio management
 * - Skill assessment
 * - AI-powered skill extraction
 */
import type { BloomsLevel } from '@sam-ai/core';
import type { CompetencyEngineConfig, SkillCategory, ProficiencyLevel, SkillRelationType, CompetencySkill, FrameworkMapping, SkillRelation, SkillTree, UserSkillProficiency, CompetencyProfile, JobRole, CompetencyCareerPath, CareerPathAnalysis, PortfolioItem, CompetencyPortfolio, SkillAssessment, CompetencyAssessmentType, AssessmentItem, AssessmentResult, CreateSkillTreeInput, GetUserCompetencyInput, MatchJobRolesInput, MatchJobRolesResult, AnalyzeCareerPathInput, AddPortfolioItemInput, UpdateProficiencyInput, ExtractSkillsInput, ExtractSkillsResult, GenerateSkillTreeInput, GetSkillGapAnalysisInput, SkillGapAnalysisResult } from '../types/competency.types';
export declare class CompetencyEngine {
    private config;
    private samConfig;
    private skills;
    private skillRelations;
    private skillTrees;
    private userProficiencies;
    private jobRoles;
    private careerPaths;
    private portfolios;
    private assessments;
    constructor(config: CompetencyEngineConfig);
    private initializeDefaultSkills;
    private initializeDefaultRoles;
    /**
     * Create a new skill
     */
    createSkill(input: {
        name: string;
        description: string;
        category: SkillCategory;
        parentId?: string;
        tags?: string[];
        frameworkMappings?: FrameworkMapping[];
        typicalLearningHours?: number;
        bloomsLevels?: BloomsLevel[];
    }): CompetencySkill;
    /**
     * Get a skill by ID
     */
    getSkill(skillId: string): CompetencySkill | undefined;
    /**
     * Search skills by query
     */
    searchSkills(query: string, options?: {
        category?: SkillCategory;
        tags?: string[];
        limit?: number;
    }): CompetencySkill[];
    /**
     * Get related skills
     */
    getRelatedSkills(skillId: string, relationType?: SkillRelationType): CompetencySkill[];
    /**
     * Add a skill relation
     */
    addSkillRelation(relation: SkillRelation): void;
    /**
     * Create a skill tree
     */
    createSkillTree(input: CreateSkillTreeInput): SkillTree;
    /**
     * Get a skill tree by ID
     */
    getSkillTree(treeId: string): SkillTree | undefined;
    /**
     * Generate a skill tree based on target role
     */
    generateSkillTree(input: GenerateSkillTreeInput): Promise<SkillTree>;
    /**
     * Get user competency profile
     */
    getUserCompetency(input: GetUserCompetencyInput): CompetencyProfile;
    /**
     * Update user skill proficiency
     */
    updateProficiency(input: UpdateProficiencyInput): UserSkillProficiency;
    private calculateConfidence;
    /**
     * Get skill gap analysis
     */
    getSkillGapAnalysis(input: GetSkillGapAnalysisInput): SkillGapAnalysisResult;
    /**
     * Match user to job roles
     */
    matchJobRoles(input: MatchJobRolesInput): MatchJobRolesResult;
    private calculateRoleMatch;
    /**
     * Analyze career paths for a user
     */
    analyzeCareerPath(input: AnalyzeCareerPathInput): CareerPathAnalysis;
    private calculatePathFit;
    private identifyStrengthsForPath;
    private identifyChallengesForPath;
    private estimateYearsToGoal;
    private projectCareerAt;
    /**
     * Add portfolio item
     */
    addPortfolioItem(input: AddPortfolioItemInput): PortfolioItem;
    /**
     * Get user portfolio
     */
    getUserPortfolio(userId: string): CompetencyPortfolio;
    /**
     * Create a skill assessment
     */
    createAssessment(input: {
        skillId: string;
        title: string;
        description: string;
        type: CompetencyAssessmentType;
        items: AssessmentItem[];
        timeLimitMinutes?: number;
        passingScore: number;
    }): SkillAssessment;
    /**
     * Submit assessment and calculate result
     */
    submitAssessment(input: {
        assessmentId: string;
        userId: string;
        answers: Map<string, string | string[]>;
        timeTakenMinutes: number;
    }): AssessmentResult;
    /**
     * Extract skills from content using AI
     */
    extractSkills(input: ExtractSkillsInput): Promise<ExtractSkillsResult>;
    private extractContext;
    private inferProficiency;
    private extractSkillsWithAI;
    /**
     * Get all skills
     */
    getAllSkills(): CompetencySkill[];
    /**
     * Get all job roles
     */
    getAllJobRoles(): JobRole[];
    /**
     * Get job role by ID
     */
    getJobRole(roleId: string): JobRole | undefined;
    /**
     * Add a job role
     */
    addJobRole(role: Omit<JobRole, 'id' | 'createdAt' | 'updatedAt'>): JobRole;
    /**
     * Add a career path
     */
    addCareerPath(path: Omit<CompetencyCareerPath, 'id'>): CompetencyCareerPath;
    /**
     * Get career path by ID
     */
    getCareerPath(pathId: string): CompetencyCareerPath | undefined;
    /**
     * Get all career paths
     */
    getAllCareerPaths(): CompetencyCareerPath[];
    /**
     * Get proficiency level description
     */
    getProficiencyDescription(level: ProficiencyLevel): string;
    /**
     * Get estimated hours to reach proficiency level
     */
    getHoursToReachProficiency(currentLevel: ProficiencyLevel, targetLevel: ProficiencyLevel, skill?: CompetencySkill): number;
}
/**
 * Create a new CompetencyEngine instance
 */
export declare function createCompetencyEngine(config: CompetencyEngineConfig): CompetencyEngine;
//# sourceMappingURL=competency-engine.d.ts.map