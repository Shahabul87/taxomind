/**
 * Seed Skill Build Track Data
 * Populates skill definitions and sample profiles for testing
 *
 * Run with: npx tsx scripts/seed-skill-definitions.ts
 */

import { PrismaClient, SkillBuildCategory, SkillBuildProficiencyLevel, SkillBuildTrend } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

interface SkillDefinitionInput {
  id: string;
  name: string;
  description: string;
  category: SkillBuildCategory;
  tags: string[];
  difficultyFactor: number;
  retentionDifficulty: number;
  applicationComplexity: string;
  demandLevel: string;
  demandTrend: string;
  avgSalaryImpact: number;
  topIndustries: string[];
  topRoles: string[];
  prerequisites: string[];
  relatedSkills: string[];
  bloomsLevels: string[];
}

const SKILL_DEFINITIONS: SkillDefinitionInput[] = [
  // ============================================================================
  // TECHNICAL SKILLS
  // ============================================================================
  {
    id: 'skill-react',
    name: 'React.js',
    description: 'A JavaScript library for building user interfaces with component-based architecture',
    category: 'TECHNICAL',
    tags: ['frontend', 'javascript', 'ui', 'web'],
    difficultyFactor: 1.2,
    retentionDifficulty: 1.0,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 15000,
    topIndustries: ['Technology', 'Finance', 'E-commerce', 'Healthcare'],
    topRoles: ['Frontend Developer', 'Full Stack Developer', 'UI Engineer'],
    prerequisites: ['skill-javascript', 'skill-html-css'],
    relatedSkills: ['skill-typescript', 'skill-nextjs', 'skill-redux'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE', 'CREATE'],
  },
  {
    id: 'skill-typescript',
    name: 'TypeScript',
    description: 'A strongly typed programming language that builds on JavaScript',
    category: 'TECHNICAL',
    tags: ['programming', 'javascript', 'types', 'web'],
    difficultyFactor: 1.3,
    retentionDifficulty: 1.1,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 12000,
    topIndustries: ['Technology', 'Finance', 'Enterprise'],
    topRoles: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prerequisites: ['skill-javascript'],
    relatedSkills: ['skill-react', 'skill-nodejs', 'skill-nextjs'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  {
    id: 'skill-javascript',
    name: 'JavaScript',
    description: 'A versatile programming language for web development',
    category: 'TECHNICAL',
    tags: ['programming', 'web', 'frontend', 'backend'],
    difficultyFactor: 1.0,
    retentionDifficulty: 0.9,
    applicationComplexity: 'LOW',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 10000,
    topIndustries: ['Technology', 'Media', 'E-commerce'],
    topRoles: ['Web Developer', 'Full Stack Developer', 'Frontend Developer'],
    prerequisites: ['skill-html-css'],
    relatedSkills: ['skill-typescript', 'skill-react', 'skill-nodejs'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'CREATE'],
  },
  {
    id: 'skill-html-css',
    name: 'HTML & CSS',
    description: 'Core web technologies for structuring and styling web pages',
    category: 'TECHNICAL',
    tags: ['web', 'frontend', 'markup', 'styling'],
    difficultyFactor: 0.8,
    retentionDifficulty: 0.7,
    applicationComplexity: 'LOW',
    demandLevel: 'HIGH',
    demandTrend: 'STABLE',
    avgSalaryImpact: 5000,
    topIndustries: ['Technology', 'Media', 'Marketing'],
    topRoles: ['Web Developer', 'Frontend Developer', 'UI Designer'],
    prerequisites: [],
    relatedSkills: ['skill-javascript', 'skill-tailwind'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },
  {
    id: 'skill-nodejs',
    name: 'Node.js',
    description: 'JavaScript runtime for building server-side applications',
    category: 'TECHNICAL',
    tags: ['backend', 'javascript', 'server', 'api'],
    difficultyFactor: 1.3,
    retentionDifficulty: 1.2,
    applicationComplexity: 'HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 14000,
    topIndustries: ['Technology', 'Finance', 'E-commerce'],
    topRoles: ['Backend Developer', 'Full Stack Developer', 'API Developer'],
    prerequisites: ['skill-javascript'],
    relatedSkills: ['skill-typescript', 'skill-express', 'skill-postgresql'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE', 'CREATE'],
  },
  {
    id: 'skill-python',
    name: 'Python',
    description: 'A versatile programming language for web, data science, and automation',
    category: 'TECHNICAL',
    tags: ['programming', 'data-science', 'automation', 'backend'],
    difficultyFactor: 0.9,
    retentionDifficulty: 0.8,
    applicationComplexity: 'LOW',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 15000,
    topIndustries: ['Technology', 'Finance', 'Healthcare', 'Research'],
    topRoles: ['Data Scientist', 'Backend Developer', 'ML Engineer'],
    prerequisites: [],
    relatedSkills: ['skill-data-analysis', 'skill-machine-learning'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'CREATE'],
  },
  {
    id: 'skill-postgresql',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database management system',
    category: 'TECHNICAL',
    tags: ['database', 'sql', 'backend', 'data'],
    difficultyFactor: 1.4,
    retentionDifficulty: 1.3,
    applicationComplexity: 'HIGH',
    demandLevel: 'HIGH',
    demandTrend: 'GROWING',
    avgSalaryImpact: 12000,
    topIndustries: ['Technology', 'Finance', 'Healthcare'],
    topRoles: ['Database Administrator', 'Backend Developer', 'Data Engineer'],
    prerequisites: ['skill-sql-basics'],
    relatedSkills: ['skill-nodejs', 'skill-prisma'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  {
    id: 'skill-sql-basics',
    name: 'SQL Fundamentals',
    description: 'Core database query language for data manipulation and retrieval',
    category: 'TECHNICAL',
    tags: ['database', 'sql', 'data', 'query'],
    difficultyFactor: 1.0,
    retentionDifficulty: 1.0,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'HIGH',
    demandTrend: 'STABLE',
    avgSalaryImpact: 8000,
    topIndustries: ['Technology', 'Finance', 'Any'],
    topRoles: ['Data Analyst', 'Developer', 'Business Analyst'],
    prerequisites: [],
    relatedSkills: ['skill-postgresql', 'skill-data-analysis'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },

  // ============================================================================
  // SOFT SKILLS
  // ============================================================================
  {
    id: 'skill-communication',
    name: 'Communication',
    description: 'Ability to convey ideas clearly and effectively in written and verbal form',
    category: 'SOFT',
    tags: ['interpersonal', 'writing', 'speaking', 'presentation'],
    difficultyFactor: 1.5,
    retentionDifficulty: 0.8,
    applicationComplexity: 'HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 10000,
    topIndustries: ['All Industries'],
    topRoles: ['All Roles'],
    prerequisites: [],
    relatedSkills: ['skill-presentation', 'skill-writing', 'skill-teamwork'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'EVALUATE'],
  },
  {
    id: 'skill-problem-solving',
    name: 'Problem Solving',
    description: 'Ability to analyze complex problems and develop effective solutions',
    category: 'SOFT',
    tags: ['analytical', 'critical-thinking', 'logic'],
    difficultyFactor: 1.6,
    retentionDifficulty: 0.9,
    applicationComplexity: 'VERY_HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 15000,
    topIndustries: ['Technology', 'Consulting', 'Engineering'],
    topRoles: ['Software Engineer', 'Consultant', 'Manager'],
    prerequisites: ['skill-critical-thinking'],
    relatedSkills: ['skill-critical-thinking', 'skill-decision-making'],
    bloomsLevels: ['ANALYZE', 'EVALUATE', 'CREATE'],
  },
  {
    id: 'skill-critical-thinking',
    name: 'Critical Thinking',
    description: 'Ability to objectively analyze and evaluate information to form judgments',
    category: 'SOFT',
    tags: ['analytical', 'logic', 'evaluation'],
    difficultyFactor: 1.5,
    retentionDifficulty: 0.8,
    applicationComplexity: 'HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 12000,
    topIndustries: ['All Industries'],
    topRoles: ['All Roles'],
    prerequisites: [],
    relatedSkills: ['skill-problem-solving', 'skill-decision-making'],
    bloomsLevels: ['ANALYZE', 'EVALUATE'],
  },
  {
    id: 'skill-teamwork',
    name: 'Teamwork & Collaboration',
    description: 'Ability to work effectively with others toward common goals',
    category: 'SOFT',
    tags: ['interpersonal', 'collaboration', 'team'],
    difficultyFactor: 1.2,
    retentionDifficulty: 0.7,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 8000,
    topIndustries: ['All Industries'],
    topRoles: ['All Roles'],
    prerequisites: ['skill-communication'],
    relatedSkills: ['skill-communication', 'skill-leadership'],
    bloomsLevels: ['UNDERSTAND', 'APPLY'],
  },
  {
    id: 'skill-time-management',
    name: 'Time Management',
    description: 'Ability to plan and control how time is spent to maximize productivity',
    category: 'SOFT',
    tags: ['productivity', 'planning', 'organization'],
    difficultyFactor: 1.3,
    retentionDifficulty: 1.0,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'HIGH',
    demandTrend: 'STABLE',
    avgSalaryImpact: 6000,
    topIndustries: ['All Industries'],
    topRoles: ['All Roles'],
    prerequisites: [],
    relatedSkills: ['skill-project-management'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'EVALUATE'],
  },

  // ============================================================================
  // DOMAIN SKILLS
  // ============================================================================
  {
    id: 'skill-system-design',
    name: 'System Design',
    description: 'Designing scalable, reliable, and maintainable software systems',
    category: 'DOMAIN',
    tags: ['architecture', 'scalability', 'design'],
    difficultyFactor: 2.0,
    retentionDifficulty: 1.5,
    applicationComplexity: 'VERY_HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 25000,
    topIndustries: ['Technology', 'Finance'],
    topRoles: ['Senior Software Engineer', 'Architect', 'Staff Engineer'],
    prerequisites: ['skill-nodejs', 'skill-postgresql'],
    relatedSkills: ['skill-microservices', 'skill-cloud-architecture'],
    bloomsLevels: ['ANALYZE', 'EVALUATE', 'CREATE'],
  },
  {
    id: 'skill-data-analysis',
    name: 'Data Analysis',
    description: 'Extracting insights from data through statistical analysis and visualization',
    category: 'DOMAIN',
    tags: ['data', 'analytics', 'statistics', 'visualization'],
    difficultyFactor: 1.4,
    retentionDifficulty: 1.2,
    applicationComplexity: 'HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'GROWING',
    avgSalaryImpact: 18000,
    topIndustries: ['Technology', 'Finance', 'Healthcare', 'Marketing'],
    topRoles: ['Data Analyst', 'Business Analyst', 'Data Scientist'],
    prerequisites: ['skill-sql-basics', 'skill-python'],
    relatedSkills: ['skill-machine-learning', 'skill-python'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  {
    id: 'skill-machine-learning',
    name: 'Machine Learning',
    description: 'Building and deploying predictive models and AI systems',
    category: 'DOMAIN',
    tags: ['ai', 'ml', 'data-science', 'algorithms'],
    difficultyFactor: 2.2,
    retentionDifficulty: 1.8,
    applicationComplexity: 'VERY_HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'EMERGING',
    avgSalaryImpact: 35000,
    topIndustries: ['Technology', 'Finance', 'Healthcare'],
    topRoles: ['ML Engineer', 'Data Scientist', 'AI Researcher'],
    prerequisites: ['skill-python', 'skill-data-analysis'],
    relatedSkills: ['skill-data-analysis', 'skill-python'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE', 'CREATE'],
  },

  // ============================================================================
  // TOOL SKILLS
  // ============================================================================
  {
    id: 'skill-git',
    name: 'Git & Version Control',
    description: 'Distributed version control system for tracking code changes',
    category: 'TOOL',
    tags: ['version-control', 'collaboration', 'devops'],
    difficultyFactor: 1.0,
    retentionDifficulty: 0.8,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 5000,
    topIndustries: ['Technology'],
    topRoles: ['All Developer Roles'],
    prerequisites: [],
    relatedSkills: ['skill-github'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },
  {
    id: 'skill-docker',
    name: 'Docker',
    description: 'Container platform for building, shipping, and running applications',
    category: 'TOOL',
    tags: ['containers', 'devops', 'deployment'],
    difficultyFactor: 1.4,
    retentionDifficulty: 1.2,
    applicationComplexity: 'HIGH',
    demandLevel: 'HIGH',
    demandTrend: 'GROWING',
    avgSalaryImpact: 12000,
    topIndustries: ['Technology', 'Finance'],
    topRoles: ['DevOps Engineer', 'Backend Developer', 'Platform Engineer'],
    prerequisites: ['skill-linux-basics'],
    relatedSkills: ['skill-kubernetes', 'skill-ci-cd'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
  },
  {
    id: 'skill-vscode',
    name: 'VS Code',
    description: 'Popular code editor with extensive extension ecosystem',
    category: 'TOOL',
    tags: ['ide', 'editor', 'productivity'],
    difficultyFactor: 0.6,
    retentionDifficulty: 0.5,
    applicationComplexity: 'LOW',
    demandLevel: 'HIGH',
    demandTrend: 'STABLE',
    avgSalaryImpact: 2000,
    topIndustries: ['Technology'],
    topRoles: ['All Developer Roles'],
    prerequisites: [],
    relatedSkills: ['skill-git'],
    bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
  },
  {
    id: 'skill-figma',
    name: 'Figma',
    description: 'Collaborative interface design and prototyping tool',
    category: 'TOOL',
    tags: ['design', 'ui', 'prototyping', 'collaboration'],
    difficultyFactor: 1.1,
    retentionDifficulty: 0.9,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'HIGH',
    demandTrend: 'GROWING',
    avgSalaryImpact: 8000,
    topIndustries: ['Technology', 'Design', 'Marketing'],
    topRoles: ['UI Designer', 'Product Designer', 'Frontend Developer'],
    prerequisites: [],
    relatedSkills: ['skill-ui-design'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'CREATE'],
  },

  // ============================================================================
  // METHODOLOGY SKILLS
  // ============================================================================
  {
    id: 'skill-agile',
    name: 'Agile Methodology',
    description: 'Iterative approach to project management and software development',
    category: 'METHODOLOGY',
    tags: ['project-management', 'scrum', 'kanban'],
    difficultyFactor: 1.2,
    retentionDifficulty: 0.9,
    applicationComplexity: 'MEDIUM',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 8000,
    topIndustries: ['Technology', 'Any'],
    topRoles: ['Scrum Master', 'Product Manager', 'Developer'],
    prerequisites: [],
    relatedSkills: ['skill-project-management'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'EVALUATE'],
  },
  {
    id: 'skill-tdd',
    name: 'Test-Driven Development',
    description: 'Software development approach writing tests before code',
    category: 'METHODOLOGY',
    tags: ['testing', 'development', 'quality'],
    difficultyFactor: 1.5,
    retentionDifficulty: 1.2,
    applicationComplexity: 'HIGH',
    demandLevel: 'HIGH',
    demandTrend: 'GROWING',
    avgSalaryImpact: 10000,
    topIndustries: ['Technology', 'Finance'],
    topRoles: ['Software Engineer', 'QA Engineer'],
    prerequisites: ['skill-javascript'],
    relatedSkills: ['skill-jest', 'skill-testing'],
    bloomsLevels: ['UNDERSTAND', 'APPLY', 'CREATE'],
  },

  // ============================================================================
  // LEADERSHIP SKILLS
  // ============================================================================
  {
    id: 'skill-leadership',
    name: 'Leadership',
    description: 'Ability to guide, inspire, and influence others toward goals',
    category: 'LEADERSHIP',
    tags: ['management', 'influence', 'vision'],
    difficultyFactor: 1.8,
    retentionDifficulty: 1.0,
    applicationComplexity: 'VERY_HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 25000,
    topIndustries: ['All Industries'],
    topRoles: ['Manager', 'Director', 'Team Lead'],
    prerequisites: ['skill-communication', 'skill-teamwork'],
    relatedSkills: ['skill-communication', 'skill-decision-making'],
    bloomsLevels: ['APPLY', 'EVALUATE', 'CREATE'],
  },
  {
    id: 'skill-mentoring',
    name: 'Mentoring',
    description: 'Guiding and supporting the development of others',
    category: 'LEADERSHIP',
    tags: ['coaching', 'teaching', 'development'],
    difficultyFactor: 1.4,
    retentionDifficulty: 0.8,
    applicationComplexity: 'HIGH',
    demandLevel: 'HIGH',
    demandTrend: 'GROWING',
    avgSalaryImpact: 12000,
    topIndustries: ['All Industries'],
    topRoles: ['Senior Developer', 'Tech Lead', 'Manager'],
    prerequisites: ['skill-communication'],
    relatedSkills: ['skill-leadership', 'skill-communication'],
    bloomsLevels: ['APPLY', 'EVALUATE'],
  },
  {
    id: 'skill-decision-making',
    name: 'Decision Making',
    description: 'Making effective choices under uncertainty and pressure',
    category: 'LEADERSHIP',
    tags: ['analytical', 'judgment', 'strategy'],
    difficultyFactor: 1.6,
    retentionDifficulty: 1.0,
    applicationComplexity: 'VERY_HIGH',
    demandLevel: 'CRITICAL',
    demandTrend: 'STABLE',
    avgSalaryImpact: 15000,
    topIndustries: ['All Industries'],
    topRoles: ['Manager', 'Director', 'Executive'],
    prerequisites: ['skill-critical-thinking'],
    relatedSkills: ['skill-critical-thinking', 'skill-problem-solving'],
    bloomsLevels: ['ANALYZE', 'EVALUATE'],
  },
];

// ============================================================================
// SAMPLE SKILL PROFILES (for testing)
// ============================================================================

interface SkillProfileInput {
  skillId: string;
  masteryScore: number;
  retentionScore: number;
  applicationScore: number;
  confidenceScore: number;
  calibrationScore: number;
  compositeScore: number;
  proficiencyLevel: SkillBuildProficiencyLevel;
  velocityTrend: SkillBuildTrend;
  learningSpeed: number;
  decayRiskLevel: string;
  daysSinceLastPractice: number;
  daysUntilLevelDrop: number;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
}

const SAMPLE_PROFILES: SkillProfileInput[] = [
  {
    skillId: 'skill-react',
    masteryScore: 78,
    retentionScore: 82,
    applicationScore: 75,
    confidenceScore: 80,
    calibrationScore: 72,
    compositeScore: 77.5,
    proficiencyLevel: 'ADVANCED',
    velocityTrend: 'ACCELERATING',
    learningSpeed: 2.5,
    decayRiskLevel: 'LOW',
    daysSinceLastPractice: 2,
    daysUntilLevelDrop: 28,
    totalSessions: 45,
    totalMinutes: 1350,
    currentStreak: 15,
  },
  {
    skillId: 'skill-typescript',
    masteryScore: 85,
    retentionScore: 78,
    applicationScore: 82,
    confidenceScore: 88,
    calibrationScore: 80,
    compositeScore: 82.6,
    proficiencyLevel: 'EXPERT',
    velocityTrend: 'STEADY',
    learningSpeed: 1.8,
    decayRiskLevel: 'LOW',
    daysSinceLastPractice: 1,
    daysUntilLevelDrop: 45,
    totalSessions: 62,
    totalMinutes: 2480,
    currentStreak: 22,
  },
  {
    skillId: 'skill-communication',
    masteryScore: 65,
    retentionScore: 58,
    applicationScore: 70,
    confidenceScore: 72,
    calibrationScore: 68,
    compositeScore: 65.2,
    proficiencyLevel: 'PROFICIENT',
    velocityTrend: 'SLOWING',
    learningSpeed: 0.8,
    decayRiskLevel: 'HIGH',
    daysSinceLastPractice: 8,
    daysUntilLevelDrop: 5,
    totalSessions: 18,
    totalMinutes: 540,
    currentStreak: 3,
  },
  {
    skillId: 'skill-system-design',
    masteryScore: 52,
    retentionScore: 48,
    applicationScore: 45,
    confidenceScore: 55,
    calibrationScore: 50,
    compositeScore: 49.8,
    proficiencyLevel: 'COMPETENT',
    velocityTrend: 'DECLINING',
    learningSpeed: 0.3,
    decayRiskLevel: 'CRITICAL',
    daysSinceLastPractice: 14,
    daysUntilLevelDrop: 0,
    totalSessions: 12,
    totalMinutes: 720,
    currentStreak: 0,
  },
  {
    skillId: 'skill-docker',
    masteryScore: 42,
    retentionScore: 38,
    applicationScore: 35,
    confidenceScore: 45,
    calibrationScore: 40,
    compositeScore: 39.8,
    proficiencyLevel: 'COMPETENT',
    velocityTrend: 'STEADY',
    learningSpeed: 1.2,
    decayRiskLevel: 'MEDIUM',
    daysSinceLastPractice: 5,
    daysUntilLevelDrop: 12,
    totalSessions: 8,
    totalMinutes: 240,
    currentStreak: 7,
  },
  {
    skillId: 'skill-agile',
    masteryScore: 72,
    retentionScore: 68,
    applicationScore: 75,
    confidenceScore: 78,
    calibrationScore: 70,
    compositeScore: 72.0,
    proficiencyLevel: 'ADVANCED',
    velocityTrend: 'ACCELERATING',
    learningSpeed: 2.0,
    decayRiskLevel: 'LOW',
    daysSinceLastPractice: 3,
    daysUntilLevelDrop: 21,
    totalSessions: 25,
    totalMinutes: 750,
    currentStreak: 12,
  },
  {
    skillId: 'skill-python',
    masteryScore: 55,
    retentionScore: 52,
    applicationScore: 48,
    confidenceScore: 60,
    calibrationScore: 55,
    compositeScore: 53.5,
    proficiencyLevel: 'COMPETENT',
    velocityTrend: 'ACCELERATING',
    learningSpeed: 2.8,
    decayRiskLevel: 'MEDIUM',
    daysSinceLastPractice: 4,
    daysUntilLevelDrop: 14,
    totalSessions: 15,
    totalMinutes: 600,
    currentStreak: 10,
  },
  {
    skillId: 'skill-git',
    masteryScore: 88,
    retentionScore: 90,
    applicationScore: 92,
    confidenceScore: 95,
    calibrationScore: 88,
    compositeScore: 90.2,
    proficiencyLevel: 'EXPERT',
    velocityTrend: 'STEADY',
    learningSpeed: 0.5,
    decayRiskLevel: 'LOW',
    daysSinceLastPractice: 0,
    daysUntilLevelDrop: 90,
    totalSessions: 100,
    totalMinutes: 2000,
    currentStreak: 30,
  },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedSkillDefinitions() {
  console.log('🌱 Seeding skill definitions...');

  for (const skill of SKILL_DEFINITIONS) {
    await prisma.skillBuildDefinition.upsert({
      where: { id: skill.id },
      update: {
        name: skill.name,
        description: skill.description,
        category: skill.category,
        tags: skill.tags,
        difficultyFactor: skill.difficultyFactor,
        retentionDifficulty: skill.retentionDifficulty,
        applicationComplexity: skill.applicationComplexity,
        demandLevel: skill.demandLevel,
        demandTrend: skill.demandTrend,
        avgSalaryImpact: skill.avgSalaryImpact,
        topIndustries: skill.topIndustries,
        topRoles: skill.topRoles,
        prerequisites: skill.prerequisites,
        relatedSkills: skill.relatedSkills,
        bloomsLevels: skill.bloomsLevels,
      },
      create: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        tags: skill.tags,
        difficultyFactor: skill.difficultyFactor,
        retentionDifficulty: skill.retentionDifficulty,
        applicationComplexity: skill.applicationComplexity,
        demandLevel: skill.demandLevel,
        demandTrend: skill.demandTrend,
        avgSalaryImpact: skill.avgSalaryImpact,
        topIndustries: skill.topIndustries,
        topRoles: skill.topRoles,
        prerequisites: skill.prerequisites,
        relatedSkills: skill.relatedSkills,
        bloomsLevels: skill.bloomsLevels,
      },
    });
    console.log(`  ✓ ${skill.name} (${skill.category})`);
  }

  console.log(`\n✅ Created ${SKILL_DEFINITIONS.length} skill definitions\n`);
}

async function seedSkillProfiles(userId: string) {
  console.log(`🌱 Seeding skill profiles for user: ${userId}...`);

  for (const profile of SAMPLE_PROFILES) {
    const now = new Date();
    const lastPracticedAt = new Date(now.getTime() - profile.daysSinceLastPractice * 24 * 60 * 60 * 1000);
    const recommendedReviewDate = new Date(now.getTime() + profile.daysUntilLevelDrop * 24 * 60 * 60 * 1000);

    await prisma.skillBuildProfile.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId: profile.skillId,
        },
      },
      update: {
        masteryScore: profile.masteryScore,
        retentionScore: profile.retentionScore,
        applicationScore: profile.applicationScore,
        confidenceScore: profile.confidenceScore,
        calibrationScore: profile.calibrationScore,
        compositeScore: profile.compositeScore,
        proficiencyLevel: profile.proficiencyLevel,
        velocityTrend: profile.velocityTrend,
        learningSpeed: profile.learningSpeed,
        decayRiskLevel: profile.decayRiskLevel,
        daysSinceLastPractice: profile.daysSinceLastPractice,
        daysUntilLevelDrop: profile.daysUntilLevelDrop,
        recommendedReviewDate,
        totalSessions: profile.totalSessions,
        totalMinutes: profile.totalMinutes,
        currentStreak: profile.currentStreak,
        longestStreak: Math.max(profile.currentStreak, 30),
        averageScore: profile.compositeScore,
        bestScore: profile.masteryScore + 10,
        lastPracticedAt,
      },
      create: {
        userId,
        skillId: profile.skillId,
        masteryScore: profile.masteryScore,
        retentionScore: profile.retentionScore,
        applicationScore: profile.applicationScore,
        confidenceScore: profile.confidenceScore,
        calibrationScore: profile.calibrationScore,
        compositeScore: profile.compositeScore,
        proficiencyLevel: profile.proficiencyLevel,
        velocityTrend: profile.velocityTrend,
        learningSpeed: profile.learningSpeed,
        decayRiskLevel: profile.decayRiskLevel,
        daysSinceLastPractice: profile.daysSinceLastPractice,
        daysUntilLevelDrop: profile.daysUntilLevelDrop,
        recommendedReviewDate,
        totalSessions: profile.totalSessions,
        totalMinutes: profile.totalMinutes,
        currentStreak: profile.currentStreak,
        longestStreak: Math.max(profile.currentStreak, 30),
        averageScore: profile.compositeScore,
        bestScore: profile.masteryScore + 10,
        lastPracticedAt,
      },
    });

    // Get skill name for logging
    const skill = SKILL_DEFINITIONS.find(s => s.id === profile.skillId);
    console.log(`  ✓ ${skill?.name || profile.skillId} - ${profile.proficiencyLevel} (${profile.compositeScore}%)`);
  }

  console.log(`\n✅ Created ${SAMPLE_PROFILES.length} skill profiles\n`);
}

async function main() {
  console.log('\n🚀 Starting Skill Build Track Seed\n');
  console.log('='.repeat(50));

  try {
    // Seed skill definitions
    await seedSkillDefinitions();

    // Find user004 (Bob Learner) specifically, or fallback to first USER
    let user = await prisma.user.findUnique({
      where: { id: 'user004' },
      select: { id: true, email: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { role: 'USER' },
        select: { id: true, email: true },
      });
    }

    if (user) {
      console.log(`Found user: ${user.email}`);
      await seedSkillProfiles(user.id);
    } else {
      console.log('⚠️  No USER found. Creating skill definitions only.');
      console.log('   Run this script again after creating a user to add sample profiles.');
    }

    console.log('='.repeat(50));
    console.log('\n✨ Seed completed successfully!\n');

    // Print summary
    const definitionCount = await prisma.skillBuildDefinition.count();
    const profileCount = await prisma.skillBuildProfile.count();

    console.log('📊 Summary:');
    console.log(`   - Skill Definitions: ${definitionCount}`);
    console.log(`   - Skill Profiles: ${profileCount}`);
    console.log('');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
