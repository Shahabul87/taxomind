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

import type { SAMConfig, BloomsLevel } from '@sam-ai/core';
import type {
  CompetencyEngineConfig,
  CompetencyFramework,
  SkillCategory,
  ProficiencyLevel,
  SkillRelationType,
  CareerLevel,
  PortfolioItemType,
  CompetencySkill,
  FrameworkMapping,
  MarketDemand,
  SkillRelation,
  SkillTree,
  SkillTreeNode,
  SkillTreeEdge,
  DifficultyProgression,
  TierInfo,
  CompetencyLearningResource,
  UserSkillProficiency,
  ProficiencyEvidence,
  CompetencyProfile,
  SkillGap,
  SkillRecommendation,
  JobRole,
  RoleSkillRequirement,
  SalaryRange,
  GrowthOutlook,
  JobRoleMatch,
  PartialSkillMatch,
  CompetencyCareerPath,
  CareerStage,
  CareerBranch,
  SkillProgressionMap,
  SkillEvolution,
  CareerPathAnalysis,
  CareerPathRecommendation,
  CareerProjection,
  PortfolioItem,
  DemonstratedSkill,
  PortfolioArtifact,
  PortfolioVerification,
  ImpactMetrics,
  CompetencyPortfolio,
  PortfolioSummary,
  SkillCoverageAnalysis,
  PortfolioRecommendation,
  SkillAssessment,
  CompetencyAssessmentType,
  AssessmentItem,
  CompetencyAssessmentRubric,
  CompetencyRubricCriterion,
  ProficiencyScoreMapping,
  AssessmentResult,
  ItemResult,
  CreateSkillTreeInput,
  GetUserCompetencyInput,
  MatchJobRolesInput,
  MatchJobRolesResult,
  AnalyzeCareerPathInput,
  AddPortfolioItemInput,
  AssessSkillInput,
  UpdateProficiencyInput,
  ExtractSkillsInput,
  ExtractSkillsResult,
  ExtractedSkillInfo,
  GenerateSkillTreeInput,
  GetSkillGapAnalysisInput,
  SkillGapAnalysisResult,
} from '../types/competency.types';

// ============================================================================
// PROFICIENCY LEVEL UTILITIES
// ============================================================================

const PROFICIENCY_VALUES: Record<ProficiencyLevel, number> = {
  NOVICE: 1,
  BEGINNER: 2,
  COMPETENT: 3,
  PROFICIENT: 4,
  EXPERT: 5,
  MASTER: 6,
};

const PROFICIENCY_DESCRIPTIONS: Record<ProficiencyLevel, string> = {
  NOVICE: 'Basic awareness, can follow instructions',
  BEGINNER: 'Limited experience, requires guidance',
  COMPETENT: 'Practical application, works independently',
  PROFICIENT: 'Applied theory, can teach others',
  EXPERT: 'Recognized authority, drives innovation',
  MASTER: 'Industry leader, defines best practices',
};

const PROFICIENCY_HOURS: Record<ProficiencyLevel, number> = {
  NOVICE: 0,
  BEGINNER: 50,
  COMPETENT: 200,
  PROFICIENT: 500,
  EXPERT: 2000,
  MASTER: 10000,
};

function getProficiencyFromScore(score: number): ProficiencyLevel {
  if (score >= 95) return 'MASTER';
  if (score >= 85) return 'EXPERT';
  if (score >= 70) return 'PROFICIENT';
  if (score >= 55) return 'COMPETENT';
  if (score >= 35) return 'BEGINNER';
  return 'NOVICE';
}

function getScoreFromProficiency(level: ProficiencyLevel): number {
  const scores: Record<ProficiencyLevel, number> = {
    NOVICE: 15,
    BEGINNER: 35,
    COMPETENT: 55,
    PROFICIENT: 70,
    EXPERT: 85,
    MASTER: 95,
  };
  return scores[level];
}

function compareProficiency(a: ProficiencyLevel, b: ProficiencyLevel): number {
  return PROFICIENCY_VALUES[a] - PROFICIENCY_VALUES[b];
}

// ============================================================================
// CAREER LEVEL UTILITIES
// ============================================================================

const CAREER_LEVEL_VALUES: Record<CareerLevel, number> = {
  ENTRY: 1,
  JUNIOR: 2,
  MID: 3,
  SENIOR: 4,
  LEAD: 5,
  PRINCIPAL: 6,
  EXECUTIVE: 7,
};

const CAREER_LEVEL_YEARS: Record<CareerLevel, { min: number; max: number }> = {
  ENTRY: { min: 0, max: 1 },
  JUNIOR: { min: 1, max: 3 },
  MID: { min: 3, max: 5 },
  SENIOR: { min: 5, max: 8 },
  LEAD: { min: 8, max: 12 },
  PRINCIPAL: { min: 12, max: 18 },
  EXECUTIVE: { min: 15, max: 30 },
};

// ============================================================================
// SKILL EXTRACTION PATTERNS
// ============================================================================

const SKILL_PATTERNS: Record<SkillCategory, RegExp[]> = {
  TECHNICAL: [
    /\b(programming|coding|software development|engineering)\b/i,
    /\b(javascript|typescript|python|java|c\+\+|rust|go|ruby)\b/i,
    /\b(react|angular|vue|next\.?js|node\.?js|express)\b/i,
    /\b(database|sql|nosql|mongodb|postgresql|mysql)\b/i,
    /\b(api|rest|graphql|microservices|cloud|aws|azure|gcp)\b/i,
    /\b(machine learning|ai|deep learning|neural network)\b/i,
    /\b(devops|ci\/cd|docker|kubernetes|terraform)\b/i,
  ],
  SOFT: [
    /\b(communication|collaboration|teamwork|leadership)\b/i,
    /\b(problem solving|critical thinking|analytical)\b/i,
    /\b(time management|organization|planning)\b/i,
    /\b(presentation|public speaking|negotiation)\b/i,
    /\b(adaptability|flexibility|resilience)\b/i,
  ],
  DOMAIN: [
    /\b(finance|fintech|banking|investment)\b/i,
    /\b(healthcare|medical|clinical|pharma)\b/i,
    /\b(e-?commerce|retail|marketing|sales)\b/i,
    /\b(education|edtech|learning|training)\b/i,
    /\b(legal|compliance|regulatory)\b/i,
  ],
  TOOL: [
    /\b(git|github|gitlab|bitbucket)\b/i,
    /\b(jira|confluence|asana|trello)\b/i,
    /\b(figma|sketch|adobe|photoshop)\b/i,
    /\b(slack|teams|zoom|communication tools)\b/i,
    /\b(vs ?code|intellij|eclipse|vim)\b/i,
  ],
  METHODOLOGY: [
    /\b(agile|scrum|kanban|lean)\b/i,
    /\b(tdd|bdd|test-driven|behavior-driven)\b/i,
    /\b(ci\/cd|continuous integration|continuous delivery)\b/i,
    /\b(design thinking|user-centered|ux research)\b/i,
    /\b(six sigma|kaizen|continuous improvement)\b/i,
  ],
  CERTIFICATION: [
    /\b(aws certified|azure certified|gcp certified)\b/i,
    /\b(pmp|scrum master|product owner)\b/i,
    /\b(cissp|cisa|security\+|comptia)\b/i,
    /\b(cfa|cpa|cma|financial certification)\b/i,
  ],
};

// ============================================================================
// COMPETENCY ENGINE CLASS
// ============================================================================

export class CompetencyEngine {
  private config: CompetencyEngineConfig;
  private samConfig: SAMConfig;
  private skills: Map<string, CompetencySkill> = new Map();
  private skillRelations: SkillRelation[] = [];
  private skillTrees: Map<string, SkillTree> = new Map();
  private userProficiencies: Map<string, Map<string, UserSkillProficiency>> = new Map();
  private jobRoles: Map<string, JobRole> = new Map();
  private careerPaths: Map<string, CompetencyCareerPath> = new Map();
  private portfolios: Map<string, PortfolioItem[]> = new Map();
  private assessments: Map<string, SkillAssessment> = new Map();

  constructor(config: CompetencyEngineConfig) {
    this.config = config;
    this.samConfig = config.samConfig;
    this.initializeDefaultSkills();
    this.initializeDefaultRoles();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeDefaultSkills(): void {
    // Initialize some common skills
    const defaultSkills: Partial<CompetencySkill>[] = [
      { id: 'skill-js', name: 'JavaScript', category: 'TECHNICAL', tags: ['programming', 'web', 'frontend'] },
      { id: 'skill-ts', name: 'TypeScript', category: 'TECHNICAL', tags: ['programming', 'web', 'typed'] },
      { id: 'skill-react', name: 'React', category: 'TECHNICAL', tags: ['framework', 'frontend', 'ui'] },
      { id: 'skill-node', name: 'Node.js', category: 'TECHNICAL', tags: ['backend', 'runtime', 'javascript'] },
      { id: 'skill-python', name: 'Python', category: 'TECHNICAL', tags: ['programming', 'backend', 'ml'] },
      { id: 'skill-sql', name: 'SQL', category: 'TECHNICAL', tags: ['database', 'query', 'data'] },
      { id: 'skill-git', name: 'Git', category: 'TOOL', tags: ['version-control', 'collaboration'] },
      { id: 'skill-agile', name: 'Agile Methodologies', category: 'METHODOLOGY', tags: ['process', 'scrum'] },
      { id: 'skill-communication', name: 'Communication', category: 'SOFT', tags: ['interpersonal', 'verbal'] },
      { id: 'skill-problem-solving', name: 'Problem Solving', category: 'SOFT', tags: ['analytical', 'critical'] },
    ];

    for (const skillData of defaultSkills) {
      const skill: CompetencySkill = {
        id: skillData.id!,
        name: skillData.name!,
        description: `Proficiency in ${skillData.name}`,
        category: skillData.category!,
        tags: skillData.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.skills.set(skill.id, skill);
    }

    // Add skill relations
    this.skillRelations.push(
      { sourceSkillId: 'skill-js', targetSkillId: 'skill-ts', relationType: 'PREREQUISITE', strength: 0.9 },
      { sourceSkillId: 'skill-js', targetSkillId: 'skill-react', relationType: 'PREREQUISITE', strength: 0.95 },
      { sourceSkillId: 'skill-js', targetSkillId: 'skill-node', relationType: 'PREREQUISITE', strength: 0.85 },
      { sourceSkillId: 'skill-ts', targetSkillId: 'skill-react', relationType: 'ENHANCES', strength: 0.8 },
    );
  }

  private initializeDefaultRoles(): void {
    const defaultRoles: Partial<JobRole>[] = [
      {
        id: 'role-frontend-dev',
        title: 'Frontend Developer',
        description: 'Develops user interfaces and web applications',
        level: 'MID',
        requiredSkills: [
          { skillId: 'skill-js', minimumProficiency: 'COMPETENT', weight: 1.0, isRequired: true },
          { skillId: 'skill-react', minimumProficiency: 'COMPETENT', weight: 0.9, isRequired: true },
          { skillId: 'skill-ts', minimumProficiency: 'BEGINNER', weight: 0.7, isRequired: false },
        ],
        preferredSkills: [
          { skillId: 'skill-git', minimumProficiency: 'COMPETENT', weight: 0.5, isRequired: false },
        ],
      },
      {
        id: 'role-fullstack-dev',
        title: 'Full Stack Developer',
        description: 'Develops both frontend and backend applications',
        level: 'SENIOR',
        requiredSkills: [
          { skillId: 'skill-js', minimumProficiency: 'PROFICIENT', weight: 1.0, isRequired: true },
          { skillId: 'skill-react', minimumProficiency: 'COMPETENT', weight: 0.9, isRequired: true },
          { skillId: 'skill-node', minimumProficiency: 'COMPETENT', weight: 0.9, isRequired: true },
          { skillId: 'skill-sql', minimumProficiency: 'COMPETENT', weight: 0.8, isRequired: true },
        ],
        preferredSkills: [
          { skillId: 'skill-ts', minimumProficiency: 'COMPETENT', weight: 0.7, isRequired: false },
          { skillId: 'skill-git', minimumProficiency: 'PROFICIENT', weight: 0.5, isRequired: false },
        ],
      },
    ];

    for (const roleData of defaultRoles) {
      const role: JobRole = {
        id: roleData.id!,
        title: roleData.title!,
        description: roleData.description!,
        level: roleData.level!,
        requiredSkills: roleData.requiredSkills || [],
        preferredSkills: roleData.preferredSkills || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.jobRoles.set(role.id, role);
    }
  }

  // ==========================================================================
  // SKILL MANAGEMENT
  // ==========================================================================

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
  }): CompetencySkill {
    const id = `skill-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const skill: CompetencySkill = {
      id,
      name: input.name,
      description: input.description,
      category: input.category,
      parentId: input.parentId,
      tags: input.tags || [],
      frameworkMappings: input.frameworkMappings,
      typicalLearningHours: input.typicalLearningHours,
      bloomsLevels: input.bloomsLevels,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.skills.set(id, skill);
    return skill;
  }

  /**
   * Get a skill by ID
   */
  getSkill(skillId: string): CompetencySkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Search skills by query
   */
  searchSkills(query: string, options?: {
    category?: SkillCategory;
    tags?: string[];
    limit?: number;
  }): CompetencySkill[] {
    const normalizedQuery = query.toLowerCase();
    let results = Array.from(this.skills.values()).filter(skill => {
      const nameMatch = skill.name.toLowerCase().includes(normalizedQuery);
      const descMatch = skill.description.toLowerCase().includes(normalizedQuery);
      const tagMatch = skill.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));
      return nameMatch || descMatch || tagMatch;
    });

    if (options?.category) {
      results = results.filter(s => s.category === options.category);
    }

    if (options?.tags && options.tags.length > 0) {
      results = results.filter(s =>
        options.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get related skills
   */
  getRelatedSkills(skillId: string, relationType?: SkillRelationType): CompetencySkill[] {
    const relations = this.skillRelations.filter(r =>
      (r.sourceSkillId === skillId || r.targetSkillId === skillId) &&
      (!relationType || r.relationType === relationType)
    );

    const relatedIds = new Set<string>();
    for (const relation of relations) {
      if (relation.sourceSkillId === skillId) {
        relatedIds.add(relation.targetSkillId);
      } else {
        relatedIds.add(relation.sourceSkillId);
      }
    }

    return Array.from(relatedIds)
      .map(id => this.skills.get(id))
      .filter((s): s is CompetencySkill => s !== undefined);
  }

  /**
   * Add a skill relation
   */
  addSkillRelation(relation: SkillRelation): void {
    // Remove any existing relation between these skills
    this.skillRelations = this.skillRelations.filter(r =>
      !(r.sourceSkillId === relation.sourceSkillId && r.targetSkillId === relation.targetSkillId)
    );
    this.skillRelations.push(relation);
  }

  // ==========================================================================
  // SKILL TREE MANAGEMENT
  // ==========================================================================

  /**
   * Create a skill tree
   */
  createSkillTree(input: CreateSkillTreeInput): SkillTree {
    const id = `tree-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Build nodes from input skills
    const nodes: SkillTreeNode[] = [];
    const edges: SkillTreeEdge[] = [];
    const tierGroups = new Map<number, typeof input.skills>();

    // Group skills by tier
    for (const skillInput of input.skills) {
      const existing = tierGroups.get(skillInput.tier) || [];
      existing.push(skillInput);
      tierGroups.set(skillInput.tier, existing);
    }

    // Create nodes
    let totalHours = 0;
    for (const skillInput of input.skills) {
      const skill = this.skills.get(skillInput.skillId);
      if (!skill) continue;

      const tierSkills = tierGroups.get(skillInput.tier) || [];
      const indexInTier = tierSkills.findIndex(s => s.skillId === skillInput.skillId);

      const node: SkillTreeNode = {
        id: `node-${skillInput.skillId}`,
        skillId: skillInput.skillId,
        skill,
        position: {
          x: indexInTier * 200,
          y: skillInput.tier * 150,
          tier: skillInput.tier,
        },
        requiredProficiency: 'COMPETENT',
        isMilestone: skillInput.isMilestone || false,
        unlocks: [],
      };

      nodes.push(node);
      totalHours += skill.typicalLearningHours || 40;

      // Create edges from prerequisites
      if (skillInput.prerequisites) {
        for (const prereqId of skillInput.prerequisites) {
          edges.push({
            sourceNodeId: `node-${prereqId}`,
            targetNodeId: node.id,
            relationType: 'PREREQUISITE',
            isOptional: false,
          });

          // Update unlocks for source node
          const sourceNode = nodes.find(n => n.skillId === prereqId);
          if (sourceNode) {
            sourceNode.unlocks.push(skillInput.skillId);
          }
        }
      }
    }

    // Build difficulty progression
    const tiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
    const tierInfos: TierInfo[] = tiers.map(tier => ({
      tier,
      name: `Tier ${tier}`,
      description: `Skills at level ${tier}`,
      skillCount: tierGroups.get(tier)?.length || 0,
      avgProficiencyRequired: tier <= 2 ? 'BEGINNER' : tier <= 4 ? 'COMPETENT' : 'PROFICIENT',
    }));

    const difficultyProgression: DifficultyProgression = {
      tiers: tierInfos,
      estimatedTimePerTier: tiers.map(tier => {
        const tierSkills = tierGroups.get(tier) || [];
        return tierSkills.reduce((sum, s) => {
          const skill = this.skills.get(s.skillId);
          return sum + (skill?.typicalLearningHours || 40);
        }, 0);
      }),
    };

    const skillTree: SkillTree = {
      id,
      name: input.name,
      description: input.description,
      rootSkillId: input.rootSkillId,
      nodes,
      edges,
      targetRoles: input.targetRoles,
      totalLearningHours: totalHours,
      difficultyProgression,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.skillTrees.set(id, skillTree);
    return skillTree;
  }

  /**
   * Get a skill tree by ID
   */
  getSkillTree(treeId: string): SkillTree | undefined {
    return this.skillTrees.get(treeId);
  }

  /**
   * Generate a skill tree based on target role
   */
  async generateSkillTree(input: GenerateSkillTreeInput): Promise<SkillTree> {
    // Find or create relevant skills based on target role
    const roleSkills = this.searchSkills(input.targetRole, { limit: 10 });

    // Build a learning path
    const skillInputs: CreateSkillTreeInput['skills'] = [];
    let tier = 1;

    // Add foundational skills first
    const foundationalSkills = roleSkills.filter(s =>
      s.category === 'SOFT' || this.skillRelations.some(r =>
        r.targetSkillId === s.id && r.relationType === 'PREREQUISITE'
      )
    );

    for (const skill of foundationalSkills) {
      skillInputs.push({
        skillId: skill.id,
        tier,
        isMilestone: false,
      });
    }
    tier++;

    // Add technical skills
    const technicalSkills = roleSkills.filter(s =>
      s.category === 'TECHNICAL' && !foundationalSkills.includes(s)
    );

    for (const skill of technicalSkills) {
      const prereqs = this.skillRelations
        .filter(r => r.targetSkillId === skill.id && r.relationType === 'PREREQUISITE')
        .map(r => r.sourceSkillId);

      skillInputs.push({
        skillId: skill.id,
        tier,
        prerequisites: prereqs.length > 0 ? prereqs : undefined,
        isMilestone: skill.category === 'CERTIFICATION',
      });
    }

    // Create the root skill if needed
    let rootSkillId = roleSkills[0]?.id;
    if (!rootSkillId) {
      const rootSkill = this.createSkill({
        name: input.targetRole,
        description: `Skills for ${input.targetRole}`,
        category: 'DOMAIN',
        tags: ['career', 'role'],
      });
      rootSkillId = rootSkill.id;
    }

    return this.createSkillTree({
      name: `${input.targetRole} Skill Tree`,
      description: `Learning path for ${input.targetRole}`,
      rootSkillId,
      targetRoles: [input.targetRole],
      skills: skillInputs,
    });
  }

  // ==========================================================================
  // USER COMPETENCY MANAGEMENT
  // ==========================================================================

  /**
   * Get user competency profile
   */
  getUserCompetency(input: GetUserCompetencyInput): CompetencyProfile {
    const userSkills = this.userProficiencies.get(input.userId) || new Map();
    const proficiencies = Array.from(userSkills.values());

    // Calculate category distribution
    const categoryDistribution: Record<SkillCategory, number> = {
      TECHNICAL: 0,
      SOFT: 0,
      DOMAIN: 0,
      TOOL: 0,
      METHODOLOGY: 0,
      CERTIFICATION: 0,
    };

    for (const prof of proficiencies) {
      const skill = this.skills.get(prof.skillId);
      if (skill) {
        categoryDistribution[skill.category] += prof.score;
      }
    }

    // Normalize distribution
    const totalScore = Object.values(categoryDistribution).reduce((a, b) => a + b, 0);
    if (totalScore > 0) {
      for (const category of Object.keys(categoryDistribution) as SkillCategory[]) {
        categoryDistribution[category] = Math.round((categoryDistribution[category] / totalScore) * 100);
      }
    }

    // Calculate overall score
    const overallScore = proficiencies.length > 0
      ? Math.round(proficiencies.reduce((sum, p) => sum + p.score, 0) / proficiencies.length)
      : 0;

    // Find strengths (top 5 skills)
    const sortedByScore = [...proficiencies].sort((a, b) => b.score - a.score);
    const strengths = sortedByScore
      .slice(0, 5)
      .map(p => this.skills.get(p.skillId))
      .filter((s): s is CompetencySkill => s !== undefined);

    // Find improvement areas (bottom 5 skills or skills with gaps)
    const improvementAreas = sortedByScore
      .slice(-5)
      .map(p => this.skills.get(p.skillId))
      .filter((s): s is CompetencySkill => s !== undefined);

    // Calculate skill gaps for target roles
    const skillGaps: SkillGap[] = [];
    if (input.targetRoleIds) {
      for (const roleId of input.targetRoleIds) {
        const role = this.jobRoles.get(roleId);
        if (role) {
          for (const req of role.requiredSkills) {
            const userProf = userSkills.get(req.skillId);
            const currentLevel: ProficiencyLevel = userProf?.proficiency || 'NOVICE';
            if (compareProficiency(currentLevel, req.minimumProficiency) < 0) {
              const skill = this.skills.get(req.skillId);
              if (skill) {
                const gap = PROFICIENCY_VALUES[req.minimumProficiency] - PROFICIENCY_VALUES[currentLevel];
                skillGaps.push({
                  skill,
                  currentLevel,
                  requiredLevel: req.minimumProficiency,
                  gap,
                  priority: gap >= 3 ? 'CRITICAL' : gap >= 2 ? 'HIGH' : 'MEDIUM',
                  targetRole: role.title,
                });
              }
            }
          }
        }
      }
    }

    // Generate recommendations
    const recommendations: SkillRecommendation[] = [];
    if (input.includeRecommendations) {
      // Recommend skills based on gaps and career paths
      for (const gap of skillGaps.slice(0, 5)) {
        recommendations.push({
          skill: gap.skill,
          reason: `Required for ${gap.targetRole}`,
          priority: gap.priority === 'CRITICAL' ? 'HIGH' : gap.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          estimatedLearningHours: gap.skill.typicalLearningHours || 40,
          suggestedResources: [],
          relatedCareerPaths: [gap.targetRole || ''],
        });
      }
    }

    return {
      userId: input.userId,
      skills: proficiencies,
      categoryDistribution,
      overallScore,
      strengths,
      improvementAreas,
      skillGaps,
      recommendations,
      updatedAt: new Date(),
    };
  }

  /**
   * Update user skill proficiency
   */
  updateProficiency(input: UpdateProficiencyInput): UserSkillProficiency {
    let userSkills = this.userProficiencies.get(input.userId);
    if (!userSkills) {
      userSkills = new Map();
      this.userProficiencies.set(input.userId, userSkills);
    }

    const existing = userSkills.get(input.skillId);
    const skill = this.skills.get(input.skillId);

    const evidence: ProficiencyEvidence[] = existing?.evidence || [];
    if (input.evidence) {
      evidence.push({
        type: input.evidence.type,
        description: input.evidence.description,
        sourceId: input.evidence.sourceId,
        date: new Date(),
      });
    }

    const score = input.score ?? getScoreFromProficiency(input.proficiency);

    const proficiency: UserSkillProficiency = {
      userId: input.userId,
      skillId: input.skillId,
      skill,
      proficiency: input.proficiency,
      score,
      confidence: this.calculateConfidence(evidence),
      evidence,
      lastAssessedAt: new Date(),
      targetProficiency: existing?.targetProficiency,
      progressToTarget: existing?.targetProficiency
        ? (PROFICIENCY_VALUES[input.proficiency] / PROFICIENCY_VALUES[existing.targetProficiency]) * 100
        : undefined,
    };

    userSkills.set(input.skillId, proficiency);
    return proficiency;
  }

  private calculateConfidence(evidence: ProficiencyEvidence[]): number {
    if (evidence.length === 0) return 0.3;

    let confidence = 0;
    const weights: Record<ProficiencyEvidence['type'], number> = {
      ASSESSMENT: 0.3,
      PROJECT: 0.25,
      CERTIFICATION: 0.35,
      PEER_REVIEW: 0.2,
      SELF_REPORT: 0.1,
      COURSE: 0.15,
    };

    for (const e of evidence) {
      confidence += weights[e.type];
    }

    return Math.min(confidence, 1);
  }

  /**
   * Get skill gap analysis
   */
  getSkillGapAnalysis(input: GetSkillGapAnalysisInput): SkillGapAnalysisResult {
    const userSkills = this.userProficiencies.get(input.userId) || new Map();
    const gaps: SkillGap[] = [];
    const targetSkills: CompetencySkill[] = [];

    // Get target skills from role or explicit list
    if (input.targetRoleId) {
      const role = this.jobRoles.get(input.targetRoleId);
      if (role) {
        for (const req of [...role.requiredSkills, ...role.preferredSkills]) {
          const skill = this.skills.get(req.skillId);
          if (skill) targetSkills.push(skill);
        }
      }
    }

    if (input.targetSkillIds) {
      for (const skillId of input.targetSkillIds) {
        const skill = this.skills.get(skillId);
        if (skill && !targetSkills.includes(skill)) {
          targetSkills.push(skill);
        }
      }
    }

    // Calculate gaps
    for (const skill of targetSkills) {
      const userProf = userSkills.get(skill.id);
      const currentLevel: ProficiencyLevel = userProf?.proficiency || 'NOVICE';
      const requiredLevel: ProficiencyLevel = 'COMPETENT'; // Default requirement

      if (compareProficiency(currentLevel, requiredLevel) < 0) {
        const gap = PROFICIENCY_VALUES[requiredLevel] - PROFICIENCY_VALUES[currentLevel];
        gaps.push({
          skill,
          currentLevel,
          requiredLevel,
          gap,
          priority: gap >= 3 ? 'CRITICAL' : gap >= 2 ? 'HIGH' : gap >= 1 ? 'MEDIUM' : 'LOW',
        });
      }
    }

    // Sort by priority and gap size
    gaps.sort((a, b) => b.gap - a.gap);

    // Calculate total gap score
    const totalGapScore = gaps.reduce((sum, g) => sum + g.gap, 0);

    // Identify quick wins (small gaps, high impact)
    const quickWins = gaps
      .filter(g => g.gap <= 1)
      .map(g => g.skill)
      .slice(0, 3);

    // Identify long-term investments (large gaps, strategic importance)
    const longTermInvestments = gaps
      .filter(g => g.gap >= 2)
      .map(g => g.skill)
      .slice(0, 3);

    // Build prioritized learning path
    const prioritizedLearningPath = gaps
      .sort((a, b) => {
        // Prioritize by combination of gap size and typical learning time
        const aScore = a.gap * (a.skill.typicalLearningHours || 40);
        const bScore = b.gap * (b.skill.typicalLearningHours || 40);
        return aScore - bScore; // Lower score = higher priority (quick wins first)
      })
      .map(g => g.skill);

    // Estimate time to close all gaps
    const estimatedTimeToClose = gaps.reduce((sum, g) => {
      const hoursPerLevel = g.skill.typicalLearningHours || 40;
      return sum + (hoursPerLevel * g.gap);
    }, 0);

    return {
      gaps,
      totalGapScore,
      prioritizedLearningPath,
      estimatedTimeToClose,
      quickWins,
      longTermInvestments,
    };
  }

  // ==========================================================================
  // JOB ROLE MATCHING
  // ==========================================================================

  /**
   * Match user to job roles
   */
  matchJobRoles(input: MatchJobRolesInput): MatchJobRolesResult {
    const userSkills = this.userProficiencies.get(input.userId) || new Map();
    const matches: JobRoleMatch[] = [];

    for (const [roleId, role] of this.jobRoles) {
      // Filter by criteria
      if (input.industry && role.industry !== input.industry) continue;
      if (input.levels && !input.levels.includes(role.level)) continue;

      // Calculate match score
      const match = this.calculateRoleMatch(userSkills, role);

      if (!input.minMatchScore || match.matchScore >= input.minMatchScore) {
        matches.push(match);
      }
    }

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Apply limit
    const limitedMatches = input.limit ? matches.slice(0, input.limit) : matches;

    // Aggregate top skill gaps across all matches
    const allGaps = new Map<string, SkillGap>();
    for (const match of limitedMatches) {
      for (const req of match.unmetRequirements) {
        const skill = this.skills.get(req.skillId);
        if (skill && !allGaps.has(skill.id)) {
          const userProf = userSkills.get(skill.id);
          const currentLevel: ProficiencyLevel = userProf?.proficiency || 'NOVICE';
          allGaps.set(skill.id, {
            skill,
            currentLevel,
            requiredLevel: req.minimumProficiency,
            gap: PROFICIENCY_VALUES[req.minimumProficiency] - PROFICIENCY_VALUES[currentLevel],
            priority: 'HIGH',
          });
        }
      }
    }

    const topSkillGaps = Array.from(allGaps.values())
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 5);

    return {
      matches: limitedMatches,
      totalMatched: matches.length,
      topSkillGaps,
    };
  }

  private calculateRoleMatch(
    userSkills: Map<string, UserSkillProficiency>,
    role: JobRole
  ): JobRoleMatch {
    const metRequirements: RoleSkillRequirement[] = [];
    const unmetRequirements: RoleSkillRequirement[] = [];
    const partiallyMet: PartialSkillMatch[] = [];

    let totalWeight = 0;
    let matchedWeight = 0;

    // Check required skills
    for (const req of role.requiredSkills) {
      totalWeight += req.weight;
      const userProf = userSkills.get(req.skillId);

      if (!userProf) {
        unmetRequirements.push(req);
      } else if (compareProficiency(userProf.proficiency, req.minimumProficiency) >= 0) {
        metRequirements.push(req);
        matchedWeight += req.weight;
      } else {
        partiallyMet.push({
          requirement: req,
          currentProficiency: userProf.proficiency,
          gap: PROFICIENCY_VALUES[req.minimumProficiency] - PROFICIENCY_VALUES[userProf.proficiency],
        });
        // Partial credit
        matchedWeight += req.weight * (PROFICIENCY_VALUES[userProf.proficiency] / PROFICIENCY_VALUES[req.minimumProficiency]);
      }
    }

    // Check preferred skills (with reduced weight)
    for (const req of role.preferredSkills) {
      const adjustedWeight = req.weight * 0.5;
      totalWeight += adjustedWeight;
      const userProf = userSkills.get(req.skillId);

      if (userProf && compareProficiency(userProf.proficiency, req.minimumProficiency) >= 0) {
        matchedWeight += adjustedWeight;
      }
    }

    const matchScore = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    // Estimate time to qualify
    const estimatedTimeToQualify = unmetRequirements.reduce((sum, req) => {
      const skill = this.skills.get(req.skillId);
      return sum + (skill?.typicalLearningHours || 40);
    }, 0) + partiallyMet.reduce((sum, pm) => {
      const skill = this.skills.get(pm.requirement.skillId);
      return sum + ((skill?.typicalLearningHours || 40) * pm.gap / 6);
    }, 0);

    return {
      role,
      matchScore,
      metRequirements,
      unmetRequirements,
      partiallyMet,
      estimatedTimeToQualify,
    };
  }

  // ==========================================================================
  // CAREER PATH ANALYSIS
  // ==========================================================================

  /**
   * Analyze career paths for a user
   */
  analyzeCareerPath(input: AnalyzeCareerPathInput): CareerPathAnalysis {
    const userSkills = this.userProficiencies.get(input.userId) || new Map();

    // Determine current position
    const roleMatches = this.matchJobRoles({
      userId: input.userId,
      limit: 5,
    });

    const bestMatch = roleMatches.matches[0];
    const currentPosition = {
      matchedRole: bestMatch?.role,
      estimatedLevel: bestMatch?.role.level || 'ENTRY' as CareerLevel,
      confidence: bestMatch ? bestMatch.matchScore / 100 : 0.3,
    };

    // Find recommended paths
    const recommendedPaths: CareerPathRecommendation[] = [];
    for (const [pathId, path] of this.careerPaths) {
      if (input.targetIndustry && path.industry !== input.targetIndustry) continue;

      const fitScore = this.calculatePathFit(userSkills, path);
      if (fitScore > 30) {
        recommendedPaths.push({
          path,
          fitScore,
          strengths: this.identifyStrengthsForPath(userSkills, path),
          challenges: this.identifyChallengesForPath(userSkills, path),
          estimatedYearsToGoal: this.estimateYearsToGoal(userSkills, path),
        });
      }
    }

    // Sort by fit score
    recommendedPaths.sort((a, b) => b.fitScore - a.fitScore);

    // Identify priority skills across recommended paths
    const skillFrequency = new Map<string, number>();
    for (const rec of recommendedPaths) {
      for (const stage of rec.path.stages) {
        for (const skill of stage.transitionSkills) {
          skillFrequency.set(skill.id, (skillFrequency.get(skill.id) || 0) + 1);
        }
      }
    }

    const prioritySkills: SkillRecommendation[] = Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skillId]) => {
        const skill = this.skills.get(skillId)!;
        return {
          skill,
          reason: 'Common across recommended career paths',
          priority: 'HIGH' as const,
          estimatedLearningHours: skill.typicalLearningHours || 40,
          suggestedResources: [],
          relatedCareerPaths: recommendedPaths.map(r => r.path.name),
        };
      });

    // Generate projections
    const projections: CareerProjection[] = [];
    const horizonYears = input.maxYearsHorizon || 5;
    for (let year = 1; year <= horizonYears; year++) {
      const projection = this.projectCareerAt(userSkills, recommendedPaths[0]?.path, year);
      if (projection) {
        projections.push(projection);
      }
    }

    return {
      userId: input.userId,
      currentPosition,
      recommendedPaths: recommendedPaths.slice(0, 3),
      prioritySkills,
      projections,
    };
  }

  private calculatePathFit(
    userSkills: Map<string, UserSkillProficiency>,
    path: CompetencyCareerPath
  ): number {
    if (path.stages.length === 0) return 0;

    const firstStage = path.stages[0];
    const requiredSkills = firstStage.transitionSkills;

    let matchedCount = 0;
    for (const skill of requiredSkills) {
      const userProf = userSkills.get(skill.id);
      if (userProf && compareProficiency(userProf.proficiency, 'BEGINNER') >= 0) {
        matchedCount++;
      }
    }

    return requiredSkills.length > 0
      ? Math.round((matchedCount / requiredSkills.length) * 100)
      : 50;
  }

  private identifyStrengthsForPath(
    userSkills: Map<string, UserSkillProficiency>,
    path: CompetencyCareerPath
  ): string[] {
    const strengths: string[] = [];
    for (const stage of path.stages) {
      for (const skill of stage.transitionSkills) {
        const userProf = userSkills.get(skill.id);
        if (userProf && compareProficiency(userProf.proficiency, 'COMPETENT') >= 0) {
          strengths.push(`Strong ${skill.name} skills`);
        }
      }
    }
    return strengths.slice(0, 3);
  }

  private identifyChallengesForPath(
    userSkills: Map<string, UserSkillProficiency>,
    path: CompetencyCareerPath
  ): string[] {
    const challenges: string[] = [];
    for (const stage of path.stages) {
      for (const skill of stage.transitionSkills) {
        const userProf = userSkills.get(skill.id);
        if (!userProf || compareProficiency(userProf.proficiency, 'BEGINNER') < 0) {
          challenges.push(`Need to develop ${skill.name}`);
        }
      }
    }
    return challenges.slice(0, 3);
  }

  private estimateYearsToGoal(
    userSkills: Map<string, UserSkillProficiency>,
    path: CompetencyCareerPath
  ): number {
    // Simplified estimation based on skill gaps
    let totalHoursNeeded = 0;
    for (const stage of path.stages) {
      for (const skill of stage.transitionSkills) {
        const userProf = userSkills.get(skill.id);
        const currentLevel = userProf?.proficiency || 'NOVICE';
        const targetLevel: ProficiencyLevel = 'COMPETENT';
        const gap = Math.max(0, PROFICIENCY_VALUES[targetLevel] - PROFICIENCY_VALUES[currentLevel]);
        totalHoursNeeded += gap * (skill.typicalLearningHours || 40);
      }
    }

    // Assume 10 hours/week of learning
    const weeksNeeded = totalHoursNeeded / 10;
    return Math.ceil(weeksNeeded / 52);
  }

  private projectCareerAt(
    userSkills: Map<string, UserSkillProficiency>,
    path: CompetencyCareerPath | undefined,
    yearsFromNow: number
  ): CareerProjection | null {
    if (!path || path.stages.length === 0) return null;

    // Find the stage they might reach
    let cumulativeYears = 0;
    let projectedStage = path.stages[0];

    for (const stage of path.stages) {
      cumulativeYears += stage.typicalYearsInRole;
      if (cumulativeYears >= yearsFromNow) {
        projectedStage = stage;
        break;
      }
    }

    return {
      yearsFromNow,
      projectedRole: projectedStage.role,
      projectedSalary: projectedStage.role.salaryRange,
      requiredMilestones: projectedStage.keyMilestones,
      probability: Math.max(0.3, 1 - (yearsFromNow * 0.1)),
    };
  }

  // ==========================================================================
  // PORTFOLIO MANAGEMENT
  // ==========================================================================

  /**
   * Add portfolio item
   */
  addPortfolioItem(input: AddPortfolioItemInput): PortfolioItem {
    const id = `portfolio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const demonstratedSkills: DemonstratedSkill[] = input.demonstratedSkills.map(ds => ({
      skillId: ds.skillId,
      skill: this.skills.get(ds.skillId),
      proficiencyDemonstrated: ds.proficiency,
      evidenceDescription: ds.evidence,
    }));

    const artifacts: PortfolioArtifact[] = (input.artifacts || []).map(a => ({
      id: `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: a.type,
      title: a.title,
      url: a.url,
      description: a.description,
    }));

    const item: PortfolioItem = {
      id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      demonstratedSkills,
      artifacts,
      date: input.date,
      visibility: input.visibility || 'PRIVATE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let userPortfolio = this.portfolios.get(input.userId);
    if (!userPortfolio) {
      userPortfolio = [];
      this.portfolios.set(input.userId, userPortfolio);
    }
    userPortfolio.push(item);

    // Update user proficiencies based on portfolio evidence
    for (const ds of demonstratedSkills) {
      const existing = this.userProficiencies.get(input.userId)?.get(ds.skillId);
      if (!existing || compareProficiency(existing.proficiency, ds.proficiencyDemonstrated) < 0) {
        this.updateProficiency({
          userId: input.userId,
          skillId: ds.skillId,
          proficiency: ds.proficiencyDemonstrated,
          evidence: {
            type: 'PROJECT',
            description: ds.evidenceDescription,
            sourceId: id,
          },
        });
      }
    }

    return item;
  }

  /**
   * Get user portfolio
   */
  getUserPortfolio(userId: string): CompetencyPortfolio {
    const items = this.portfolios.get(userId) || [];

    // Build summary
    const itemsByType: Record<PortfolioItemType, number> = {
      PROJECT: 0,
      CERTIFICATION: 0,
      COURSE_COMPLETION: 0,
      ASSESSMENT: 0,
      PUBLICATION: 0,
      CONTRIBUTION: 0,
      ACHIEVEMENT: 0,
      RECOMMENDATION: 0,
    };

    const demonstratedSkillIds = new Set<string>();
    let verifiedCount = 0;
    let totalEndorsements = 0;

    for (const item of items) {
      itemsByType[item.type]++;
      if (item.verification?.verified) verifiedCount++;
      totalEndorsements += item.impact?.endorsements || 0;

      for (const ds of item.demonstratedSkills) {
        demonstratedSkillIds.add(ds.skillId);
      }
    }

    const summary: PortfolioSummary = {
      totalItems: items.length,
      itemsByType,
      skillsDemonstrated: demonstratedSkillIds.size,
      verifiedItems: verifiedCount,
      totalEndorsements,
      lastUpdated: items.length > 0
        ? new Date(Math.max(...items.map(i => i.updatedAt.getTime())))
        : new Date(),
    };

    // Analyze skill coverage
    const userSkills = this.userProficiencies.get(userId) || new Map();
    const allUserSkillIds = new Set(userSkills.keys());

    const coveredSkills = Array.from(demonstratedSkillIds)
      .map(id => this.skills.get(id))
      .filter((s): s is CompetencySkill => s !== undefined);

    const uncoveredSkills = Array.from(allUserSkillIds)
      .filter(id => !demonstratedSkillIds.has(id))
      .map(id => this.skills.get(id))
      .filter((s): s is CompetencySkill => s !== undefined);

    const skillCoverage: SkillCoverageAnalysis = {
      coveredSkills,
      uncoveredSkills,
      coveragePercentage: allUserSkillIds.size > 0
        ? Math.round((demonstratedSkillIds.size / allUserSkillIds.size) * 100)
        : 0,
      strongestEvidence: coveredSkills.slice(0, 3),
      weakestEvidence: uncoveredSkills.slice(0, 3),
    };

    // Calculate strength score
    const strengthScore = Math.min(100, Math.round(
      (items.length * 5) +
      (verifiedCount * 10) +
      (skillCoverage.coveragePercentage * 0.5)
    ));

    // Generate recommendations
    const recommendations: PortfolioRecommendation[] = [];

    if (uncoveredSkills.length > 0) {
      recommendations.push({
        type: 'ADD_PROJECT',
        priority: 'HIGH',
        description: `Add projects demonstrating ${uncoveredSkills[0].name}`,
        targetSkills: uncoveredSkills.slice(0, 3),
        expectedImpact: 'Improve skill coverage by 15-20%',
      });
    }

    if (itemsByType.CERTIFICATION === 0) {
      recommendations.push({
        type: 'GET_CERTIFICATION',
        priority: 'MEDIUM',
        description: 'Add certifications to boost credibility',
        expectedImpact: 'Increase verified credentials',
      });
    }

    if (items.some(i => !i.artifacts || i.artifacts.length === 0)) {
      recommendations.push({
        type: 'ADD_EVIDENCE',
        priority: 'MEDIUM',
        description: 'Add artifacts to existing portfolio items',
        expectedImpact: 'Strengthen evidence of skills',
      });
    }

    return {
      userId,
      items,
      summary,
      skillCoverage,
      strengthScore,
      recommendations,
    };
  }

  // ==========================================================================
  // SKILL ASSESSMENT
  // ==========================================================================

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
  }): SkillAssessment {
    const id = `assessment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const skill = this.skills.get(input.skillId);

    const proficiencyMapping: ProficiencyScoreMapping[] = [
      { proficiency: 'NOVICE', minScore: 0, maxScore: 29 },
      { proficiency: 'BEGINNER', minScore: 30, maxScore: 49 },
      { proficiency: 'COMPETENT', minScore: 50, maxScore: 69 },
      { proficiency: 'PROFICIENT', minScore: 70, maxScore: 84 },
      { proficiency: 'EXPERT', minScore: 85, maxScore: 94 },
      { proficiency: 'MASTER', minScore: 95, maxScore: 100 },
    ];

    const assessment: SkillAssessment = {
      id,
      skillId: input.skillId,
      skill,
      title: input.title,
      description: input.description,
      type: input.type,
      items: input.items,
      timeLimitMinutes: input.timeLimitMinutes,
      passingScore: input.passingScore,
      proficiencyMapping,
    };

    this.assessments.set(id, assessment);
    return assessment;
  }

  /**
   * Submit assessment and calculate result
   */
  submitAssessment(input: {
    assessmentId: string;
    userId: string;
    answers: Map<string, string | string[]>;
    timeTakenMinutes: number;
  }): AssessmentResult {
    const assessment = this.assessments.get(input.assessmentId);
    if (!assessment) {
      throw new Error(`Assessment ${input.assessmentId} not found`);
    }

    const itemResults: ItemResult[] = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const item of assessment.items) {
      maxScore += item.points;
      const userAnswer = input.answers.get(item.id);

      let itemScore = 0;
      let isCorrect: boolean | undefined;

      if (item.correctAnswer) {
        const correctAnswers = Array.isArray(item.correctAnswer)
          ? item.correctAnswer
          : [item.correctAnswer];
        const userAnswers = Array.isArray(userAnswer)
          ? userAnswer
          : userAnswer ? [userAnswer] : [];

        isCorrect = correctAnswers.every(ca =>
          userAnswers.some(ua => ua.toLowerCase() === ca.toLowerCase())
        );

        if (isCorrect) {
          itemScore = item.points;
        }
      } else if (item.rubric) {
        // For rubric-based items, use a simple scoring for now
        itemScore = item.points * 0.7; // Assume decent performance
      }

      totalScore += itemScore;
      itemResults.push({
        itemId: item.id,
        score: itemScore,
        maxScore: item.points,
        isCorrect,
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Determine proficiency achieved
    const proficiencyAchieved = assessment.proficiencyMapping.find(pm =>
      percentage >= pm.minScore && percentage <= pm.maxScore
    )?.proficiency || 'NOVICE';

    // Generate feedback
    const passed = percentage >= assessment.passingScore;
    const feedback = passed
      ? `Congratulations! You achieved ${proficiencyAchieved} level proficiency.`
      : `Score of ${percentage}% is below the passing threshold of ${assessment.passingScore}%. Keep practicing!`;

    // Identify improvement areas
    const improvementAreas = itemResults
      .filter(ir => !ir.isCorrect || ir.score < ir.maxScore * 0.7)
      .map(ir => {
        const item = assessment.items.find(i => i.id === ir.itemId);
        return item ? `Review: ${item.question.substring(0, 50)}...` : 'Review missed questions';
      })
      .slice(0, 3);

    const result: AssessmentResult = {
      assessmentId: input.assessmentId,
      userId: input.userId,
      score: totalScore,
      maxScore,
      percentage,
      proficiencyAchieved,
      itemResults,
      timeTakenMinutes: input.timeTakenMinutes,
      feedback,
      improvementAreas,
      completedAt: new Date(),
    };

    // Update user proficiency based on assessment
    if (passed) {
      this.updateProficiency({
        userId: input.userId,
        skillId: assessment.skillId,
        proficiency: proficiencyAchieved,
        score: percentage,
        evidence: {
          type: 'ASSESSMENT',
          description: `Completed ${assessment.title} with ${percentage}% score`,
          sourceId: input.assessmentId,
        },
      });
    }

    return result;
  }

  // ==========================================================================
  // AI-POWERED SKILL EXTRACTION
  // ==========================================================================

  /**
   * Extract skills from content using AI
   */
  async extractSkills(input: ExtractSkillsInput): Promise<ExtractSkillsResult> {
    const extractedSkills: ExtractedSkillInfo[] = [];

    // Use pattern matching first
    for (const [category, patterns] of Object.entries(SKILL_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = input.content.match(pattern);
        if (matches) {
          for (const match of matches) {
            // Check if we already have this skill
            const existingSkill = this.searchSkills(match, { limit: 1 })[0];

            extractedSkills.push({
              name: match,
              category: category as SkillCategory,
              confidence: existingSkill ? 0.9 : 0.7,
              matchedSkillId: existingSkill?.id,
              context: this.extractContext(input.content, match),
              suggestedProficiency: this.inferProficiency(input.content, match, input.context?.level),
            });
          }
        }
      }
    }

    // If AI extraction is enabled, use AI for deeper analysis
    if (this.config.enableAISkillExtraction && this.samConfig.ai?.isConfigured()) {
      const aiExtractedSkills = await this.extractSkillsWithAI(input);
      // Merge with pattern-matched skills, avoiding duplicates
      for (const aiSkill of aiExtractedSkills) {
        if (!extractedSkills.some(s => s.name.toLowerCase() === aiSkill.name.toLowerCase())) {
          extractedSkills.push(aiSkill);
        }
      }
    }

    // Deduplicate
    const uniqueSkills = new Map<string, ExtractedSkillInfo>();
    for (const skill of extractedSkills) {
      const key = skill.name.toLowerCase();
      if (!uniqueSkills.has(key) || (uniqueSkills.get(key)!.confidence < skill.confidence)) {
        uniqueSkills.set(key, skill);
      }
    }

    const finalSkills = Array.from(uniqueSkills.values())
      .sort((a, b) => b.confidence - a.confidence);

    // Determine suggested category based on most common
    const categoryCounts = new Map<SkillCategory, number>();
    for (const skill of finalSkills) {
      categoryCounts.set(skill.category, (categoryCounts.get(skill.category) || 0) + 1);
    }
    const suggestedCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      skills: finalSkills,
      suggestedCategory,
      confidence: finalSkills.length > 0
        ? finalSkills.reduce((sum, s) => sum + s.confidence, 0) / finalSkills.length
        : 0,
    };
  }

  private extractContext(content: string, skillMatch: string): string {
    const index = content.toLowerCase().indexOf(skillMatch.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + skillMatch.length + 50);
    return content.substring(start, end).trim();
  }

  private inferProficiency(
    content: string,
    skillName: string,
    level?: CareerLevel
  ): ProficiencyLevel | undefined {
    const lowerContent = content.toLowerCase();
    const lowerSkill = skillName.toLowerCase();

    // Look for proficiency indicators near the skill mention
    const expertIndicators = ['expert', 'master', 'advanced', 'lead', '5+ years', '10+ years'];
    const proficientIndicators = ['proficient', 'strong', 'solid', '3+ years', 'senior'];
    const competentIndicators = ['experienced', 'familiar', '2+ years', 'intermediate'];

    // Check for indicators within 100 characters of skill mention
    const skillIndex = lowerContent.indexOf(lowerSkill);
    if (skillIndex !== -1) {
      const context = lowerContent.substring(
        Math.max(0, skillIndex - 100),
        Math.min(lowerContent.length, skillIndex + skillName.length + 100)
      );

      if (expertIndicators.some(ind => context.includes(ind))) return 'EXPERT';
      if (proficientIndicators.some(ind => context.includes(ind))) return 'PROFICIENT';
      if (competentIndicators.some(ind => context.includes(ind))) return 'COMPETENT';
    }

    // Use career level as fallback
    if (level) {
      const levelToProficiency: Record<CareerLevel, ProficiencyLevel> = {
        ENTRY: 'BEGINNER',
        JUNIOR: 'BEGINNER',
        MID: 'COMPETENT',
        SENIOR: 'PROFICIENT',
        LEAD: 'PROFICIENT',
        PRINCIPAL: 'EXPERT',
        EXECUTIVE: 'EXPERT',
      };
      return levelToProficiency[level];
    }

    return undefined;
  }

  private async extractSkillsWithAI(input: ExtractSkillsInput): Promise<ExtractedSkillInfo[]> {
    // This would use the AI provider to extract skills
    // For now, return empty array - actual implementation would call Claude/OpenAI
    try {
      // Placeholder for AI extraction
      // In production, this would call:
      // const response = await this.samConfig.anthropic.messages.create({...});
      return [];
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get all skills
   */
  getAllSkills(): CompetencySkill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get all job roles
   */
  getAllJobRoles(): JobRole[] {
    return Array.from(this.jobRoles.values());
  }

  /**
   * Get job role by ID
   */
  getJobRole(roleId: string): JobRole | undefined {
    return this.jobRoles.get(roleId);
  }

  /**
   * Add a job role
   */
  addJobRole(role: Omit<JobRole, 'id' | 'createdAt' | 'updatedAt'>): JobRole {
    const id = `role-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newRole: JobRole = {
      ...role,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobRoles.set(id, newRole);
    return newRole;
  }

  /**
   * Add a career path
   */
  addCareerPath(path: Omit<CompetencyCareerPath, 'id'>): CompetencyCareerPath {
    const id = `path-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newPath: CompetencyCareerPath = {
      ...path,
      id,
    };
    this.careerPaths.set(id, newPath);
    return newPath;
  }

  /**
   * Get career path by ID
   */
  getCareerPath(pathId: string): CompetencyCareerPath | undefined {
    return this.careerPaths.get(pathId);
  }

  /**
   * Get all career paths
   */
  getAllCareerPaths(): CompetencyCareerPath[] {
    return Array.from(this.careerPaths.values());
  }

  /**
   * Get proficiency level description
   */
  getProficiencyDescription(level: ProficiencyLevel): string {
    return PROFICIENCY_DESCRIPTIONS[level];
  }

  /**
   * Get estimated hours to reach proficiency level
   */
  getHoursToReachProficiency(
    currentLevel: ProficiencyLevel,
    targetLevel: ProficiencyLevel,
    skill?: CompetencySkill
  ): number {
    const currentHours = PROFICIENCY_HOURS[currentLevel];
    const targetHours = PROFICIENCY_HOURS[targetLevel];
    const baseHours = Math.max(0, targetHours - currentHours);

    // Adjust based on skill's typical learning hours if available
    if (skill?.typicalLearningHours) {
      const multiplier = skill.typicalLearningHours / 40; // 40 is default
      return Math.round(baseHours * multiplier);
    }

    return baseHours;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new CompetencyEngine instance
 */
export function createCompetencyEngine(config: CompetencyEngineConfig): CompetencyEngine {
  return new CompetencyEngine(config);
}
