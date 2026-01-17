/**
 * CompetencyEngine Tests
 *
 * Comprehensive tests for the CompetencyEngine covering:
 * - Skill management
 * - Skill tree creation
 * - User competency tracking
 * - Job role matching
 * - Career path analysis
 * - Portfolio management
 * - Skill assessments
 * - AI skill extraction
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CompetencyEngine, createCompetencyEngine, } from '../engines/competency-engine';
import { createMockSAMConfig } from './setup';
// ============================================================================
// TEST HELPERS
// ============================================================================
function createEngineConfig(overrides = {}) {
    return {
        samConfig: createMockSAMConfig(),
        enableAISkillExtraction: false,
        ...overrides,
    };
}
function createSampleSkillInput(overrides = {}) {
    return {
        name: 'Test Skill',
        description: 'A test skill for unit testing',
        category: 'TECHNICAL',
        tags: ['test', 'unit-testing'],
        typicalLearningHours: 40,
        ...overrides,
    };
}
function createSampleSkillTreeInput(overrides = {}) {
    return {
        name: 'Test Skill Tree',
        description: 'A skill tree for testing',
        rootSkillId: 'skill-js',
        targetRoles: ['Frontend Developer'],
        skills: [
            { skillId: 'skill-js', tier: 1, isMilestone: true },
            { skillId: 'skill-ts', tier: 2, prerequisites: ['skill-js'] },
            { skillId: 'skill-react', tier: 3, prerequisites: ['skill-js'] },
        ],
        ...overrides,
    };
}
function createSamplePortfolioInput(overrides = {}) {
    return {
        userId: 'user-1',
        type: 'PROJECT',
        title: 'Test Project',
        description: 'A sample project for testing',
        date: new Date(),
        demonstratedSkills: [
            {
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
                evidence: 'Built a JavaScript application',
            },
        ],
        artifacts: [
            {
                type: 'LINK',
                title: 'GitHub Repository',
                url: 'https://github.com/test/project',
                description: 'Project source code',
            },
        ],
        visibility: 'PUBLIC',
        ...overrides,
    };
}
function createSampleAssessmentItems() {
    return [
        {
            id: 'item-1',
            type: 'MULTIPLE_CHOICE',
            question: 'What is the output of console.log(typeof null)?',
            options: ['null', 'undefined', 'object', 'number'],
            correctAnswer: 'object',
            points: 10,
            difficulty: 'MEDIUM',
            bloomsLevel: 'REMEMBER',
        },
        {
            id: 'item-2',
            type: 'MULTIPLE_CHOICE',
            question: 'Which method adds an element to the end of an array?',
            options: ['shift()', 'unshift()', 'push()', 'pop()'],
            correctAnswer: 'push()',
            points: 10,
            difficulty: 'EASY',
            bloomsLevel: 'REMEMBER',
        },
        {
            id: 'item-3',
            type: 'SHORT_ANSWER',
            question: 'What keyword is used to declare a constant in JavaScript?',
            correctAnswer: 'const',
            points: 10,
            difficulty: 'EASY',
            bloomsLevel: 'REMEMBER',
        },
    ];
}
// ============================================================================
// TESTS
// ============================================================================
describe('CompetencyEngine', () => {
    let engine;
    beforeEach(() => {
        engine = createCompetencyEngine(createEngineConfig());
    });
    // ==========================================================================
    // CONSTRUCTOR AND INITIALIZATION TESTS
    // ==========================================================================
    describe('constructor', () => {
        it('should create an engine instance', () => {
            expect(engine).toBeInstanceOf(CompetencyEngine);
        });
        it('should initialize with default skills', () => {
            const skills = engine.getAllSkills();
            expect(skills.length).toBeGreaterThan(0);
        });
        it('should initialize with default job roles', () => {
            const roles = engine.getAllJobRoles();
            expect(roles.length).toBeGreaterThan(0);
        });
        it('should include JavaScript skill by default', () => {
            const jsSkill = engine.getSkill('skill-js');
            expect(jsSkill).toBeDefined();
            expect(jsSkill?.name).toBe('JavaScript');
        });
        it('should include frontend developer role by default', () => {
            const role = engine.getJobRole('role-frontend-dev');
            expect(role).toBeDefined();
            expect(role?.title).toBe('Frontend Developer');
        });
    });
    describe('createCompetencyEngine factory', () => {
        it('should create engine using factory function', () => {
            const factoryEngine = createCompetencyEngine(createEngineConfig());
            expect(factoryEngine).toBeInstanceOf(CompetencyEngine);
        });
    });
    // ==========================================================================
    // SKILL MANAGEMENT TESTS
    // ==========================================================================
    describe('createSkill', () => {
        it('should create a new skill', () => {
            const skill = engine.createSkill(createSampleSkillInput());
            expect(skill).toBeDefined();
            expect(skill.id).toBeDefined();
            expect(skill.name).toBe('Test Skill');
            expect(skill.category).toBe('TECHNICAL');
        });
        it('should assign unique IDs to skills', () => {
            const skill1 = engine.createSkill(createSampleSkillInput({ name: 'Skill 1' }));
            const skill2 = engine.createSkill(createSampleSkillInput({ name: 'Skill 2' }));
            expect(skill1.id).not.toBe(skill2.id);
        });
        it('should store skills in the engine', () => {
            const created = engine.createSkill(createSampleSkillInput());
            const retrieved = engine.getSkill(created.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
        });
        it('should include tags on created skill', () => {
            const skill = engine.createSkill(createSampleSkillInput({ tags: ['custom', 'tags'] }));
            expect(skill.tags).toContain('custom');
            expect(skill.tags).toContain('tags');
        });
        it('should set createdAt and updatedAt dates', () => {
            const skill = engine.createSkill(createSampleSkillInput());
            expect(skill.createdAt).toBeInstanceOf(Date);
            expect(skill.updatedAt).toBeInstanceOf(Date);
        });
    });
    describe('getSkill', () => {
        it('should return skill by ID', () => {
            const skill = engine.getSkill('skill-js');
            expect(skill).toBeDefined();
            expect(skill?.name).toBe('JavaScript');
        });
        it('should return undefined for non-existent skill', () => {
            const skill = engine.getSkill('non-existent-skill');
            expect(skill).toBeUndefined();
        });
    });
    describe('searchSkills', () => {
        it('should find skills by name', () => {
            const results = engine.searchSkills('JavaScript');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe('JavaScript');
        });
        it('should find skills by tag', () => {
            const results = engine.searchSkills('programming');
            expect(results.length).toBeGreaterThan(0);
        });
        it('should filter by category', () => {
            const results = engine.searchSkills('', { category: 'TECHNICAL' });
            expect(results.length).toBeGreaterThan(0);
            results.forEach((skill) => {
                expect(skill.category).toBe('TECHNICAL');
            });
        });
        it('should filter by tags', () => {
            const results = engine.searchSkills('', { tags: ['frontend'] });
            expect(results.length).toBeGreaterThan(0);
        });
        it('should respect limit option', () => {
            const results = engine.searchSkills('', { limit: 2 });
            expect(results.length).toBeLessThanOrEqual(2);
        });
        it('should return empty array for no matches', () => {
            const results = engine.searchSkills('nonexistentskillxyz123');
            expect(results).toEqual([]);
        });
    });
    describe('getRelatedSkills', () => {
        it('should find related skills', () => {
            const related = engine.getRelatedSkills('skill-js');
            expect(related.length).toBeGreaterThan(0);
        });
        it('should filter by relation type', () => {
            const prereqs = engine.getRelatedSkills('skill-ts', 'PREREQUISITE');
            // TypeScript has JavaScript as prerequisite
            expect(prereqs.some((s) => s.id === 'skill-js')).toBe(true);
        });
        it('should return empty array for skill with no relations', () => {
            const newSkill = engine.createSkill(createSampleSkillInput());
            const related = engine.getRelatedSkills(newSkill.id);
            expect(related).toEqual([]);
        });
    });
    describe('addSkillRelation', () => {
        it('should add a skill relation', () => {
            const skill1 = engine.createSkill(createSampleSkillInput({ name: 'Skill A' }));
            const skill2 = engine.createSkill(createSampleSkillInput({ name: 'Skill B' }));
            engine.addSkillRelation({
                sourceSkillId: skill1.id,
                targetSkillId: skill2.id,
                relationType: 'PREREQUISITE',
                strength: 0.9,
            });
            const related = engine.getRelatedSkills(skill1.id);
            expect(related.some((s) => s.id === skill2.id)).toBe(true);
        });
        it('should replace existing relation between same skills', () => {
            const skill1 = engine.createSkill(createSampleSkillInput({ name: 'Skill C' }));
            const skill2 = engine.createSkill(createSampleSkillInput({ name: 'Skill D' }));
            engine.addSkillRelation({
                sourceSkillId: skill1.id,
                targetSkillId: skill2.id,
                relationType: 'PREREQUISITE',
                strength: 0.5,
            });
            engine.addSkillRelation({
                sourceSkillId: skill1.id,
                targetSkillId: skill2.id,
                relationType: 'ENHANCES',
                strength: 0.8,
            });
            const related = engine.getRelatedSkills(skill1.id, 'ENHANCES');
            expect(related.some((s) => s.id === skill2.id)).toBe(true);
        });
    });
    // ==========================================================================
    // SKILL TREE TESTS
    // ==========================================================================
    describe('createSkillTree', () => {
        it('should create a skill tree', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            expect(tree).toBeDefined();
            expect(tree.id).toBeDefined();
            expect(tree.name).toBe('Test Skill Tree');
        });
        it('should create nodes for each skill', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            expect(tree.nodes.length).toBe(3);
        });
        it('should create edges for prerequisites', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            expect(tree.edges.length).toBeGreaterThan(0);
        });
        it('should calculate total learning hours', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            expect(tree.totalLearningHours).toBeGreaterThan(0);
        });
        it('should include difficulty progression', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            expect(tree.difficultyProgression).toBeDefined();
            expect(tree.difficultyProgression.tiers.length).toBeGreaterThan(0);
        });
        it('should mark milestone nodes', () => {
            const tree = engine.createSkillTree(createSampleSkillTreeInput());
            const milestoneNode = tree.nodes.find((n) => n.isMilestone);
            expect(milestoneNode).toBeDefined();
        });
    });
    describe('getSkillTree', () => {
        it('should retrieve a skill tree by ID', () => {
            const created = engine.createSkillTree(createSampleSkillTreeInput());
            const retrieved = engine.getSkillTree(created.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
        });
        it('should return undefined for non-existent tree', () => {
            const tree = engine.getSkillTree('non-existent-tree');
            expect(tree).toBeUndefined();
        });
    });
    describe('generateSkillTree', () => {
        it('should generate a skill tree for a target role', async () => {
            const tree = await engine.generateSkillTree({
                targetRole: 'Frontend Developer',
            });
            expect(tree).toBeDefined();
            expect(tree.name).toContain('Frontend Developer');
        });
        it('should include relevant skills in generated tree', async () => {
            const tree = await engine.generateSkillTree({
                targetRole: 'JavaScript',
            });
            // Tree should be created even if no matching skills found
            expect(tree).toBeDefined();
            expect(tree.nodes).toBeDefined();
        });
    });
    // ==========================================================================
    // USER COMPETENCY TESTS
    // ==========================================================================
    describe('getUserCompetency', () => {
        it('should return empty profile for new user', () => {
            const profile = engine.getUserCompetency({ userId: 'new-user' });
            expect(profile).toBeDefined();
            expect(profile.userId).toBe('new-user');
            expect(profile.skills).toEqual([]);
        });
        it('should include category distribution', () => {
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            expect(profile.categoryDistribution).toBeDefined();
            expect(profile.categoryDistribution.TECHNICAL).toBeDefined();
        });
        it('should calculate overall score', () => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
            });
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            expect(profile.overallScore).toBeGreaterThan(0);
        });
        it('should identify strengths', () => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'EXPERT',
            });
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            expect(profile.strengths.length).toBeGreaterThan(0);
        });
        it('should calculate skill gaps for target roles', () => {
            const profile = engine.getUserCompetency({
                userId: 'user-1',
                targetRoleIds: ['role-frontend-dev'],
                includeRecommendations: true,
            });
            expect(profile.skillGaps).toBeDefined();
        });
        it('should include recommendations when requested', () => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'BEGINNER',
            });
            const profile = engine.getUserCompetency({
                userId: 'user-1',
                targetRoleIds: ['role-frontend-dev'],
                includeRecommendations: true,
            });
            expect(profile.recommendations).toBeDefined();
        });
    });
    describe('updateProficiency', () => {
        it('should update user skill proficiency', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
            });
            expect(proficiency).toBeDefined();
            expect(proficiency.proficiency).toBe('COMPETENT');
        });
        it('should calculate score from proficiency level', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'PROFICIENT',
            });
            expect(proficiency.score).toBe(70);
        });
        it('should use provided score when given', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
                score: 65,
            });
            expect(proficiency.score).toBe(65);
        });
        it('should add evidence when provided', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
                evidence: {
                    type: 'PROJECT',
                    description: 'Built a web application',
                    sourceId: 'project-1',
                },
            });
            expect(proficiency.evidence.length).toBeGreaterThan(0);
            expect(proficiency.evidence[0].type).toBe('PROJECT');
        });
        it('should calculate confidence based on evidence', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
                evidence: {
                    type: 'CERTIFICATION',
                    description: 'JavaScript certification',
                },
            });
            expect(proficiency.confidence).toBeGreaterThan(0);
        });
        it('should set lastAssessedAt date', () => {
            const proficiency = engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
            });
            expect(proficiency.lastAssessedAt).toBeInstanceOf(Date);
        });
    });
    describe('getSkillGapAnalysis', () => {
        beforeEach(() => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'BEGINNER',
            });
        });
        it('should identify skill gaps for target role', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.gaps.length).toBeGreaterThan(0);
        });
        it('should calculate total gap score', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.totalGapScore).toBeGreaterThanOrEqual(0);
        });
        it('should provide prioritized learning path', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.prioritizedLearningPath).toBeDefined();
        });
        it('should estimate time to close gaps', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.estimatedTimeToClose).toBeGreaterThanOrEqual(0);
        });
        it('should identify quick wins', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.quickWins).toBeDefined();
        });
        it('should identify long-term investments', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetRoleId: 'role-frontend-dev',
            });
            expect(analysis.longTermInvestments).toBeDefined();
        });
        it('should analyze gaps for specific skills', () => {
            const analysis = engine.getSkillGapAnalysis({
                userId: 'user-1',
                targetSkillIds: ['skill-react', 'skill-ts'],
            });
            expect(analysis.gaps.length).toBeGreaterThan(0);
        });
    });
    // ==========================================================================
    // JOB ROLE MATCHING TESTS
    // ==========================================================================
    describe('matchJobRoles', () => {
        beforeEach(() => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
            });
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-react',
                proficiency: 'COMPETENT',
            });
        });
        it('should match user to job roles', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            expect(result.matches.length).toBeGreaterThan(0);
        });
        it('should calculate match score', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            expect(result.matches[0].matchScore).toBeGreaterThan(0);
            expect(result.matches[0].matchScore).toBeLessThanOrEqual(100);
        });
        it('should sort matches by score', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            for (let i = 1; i < result.matches.length; i++) {
                expect(result.matches[i - 1].matchScore).toBeGreaterThanOrEqual(result.matches[i].matchScore);
            }
        });
        it('should filter by minimum match score', () => {
            const result = engine.matchJobRoles({
                userId: 'user-1',
                minMatchScore: 50,
            });
            result.matches.forEach((match) => {
                expect(match.matchScore).toBeGreaterThanOrEqual(50);
            });
        });
        it('should filter by career levels', () => {
            const result = engine.matchJobRoles({
                userId: 'user-1',
                levels: ['MID', 'SENIOR'],
            });
            result.matches.forEach((match) => {
                expect(['MID', 'SENIOR']).toContain(match.role.level);
            });
        });
        it('should respect limit option', () => {
            const result = engine.matchJobRoles({
                userId: 'user-1',
                limit: 1,
            });
            expect(result.matches.length).toBeLessThanOrEqual(1);
        });
        it('should identify met requirements', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            expect(result.matches[0].metRequirements).toBeDefined();
        });
        it('should identify unmet requirements', () => {
            const result = engine.matchJobRoles({ userId: 'new-user' });
            if (result.matches.length > 0) {
                expect(result.matches[0].unmetRequirements).toBeDefined();
            }
        });
        it('should estimate time to qualify', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            expect(result.matches[0].estimatedTimeToQualify).toBeGreaterThanOrEqual(0);
        });
        it('should return top skill gaps', () => {
            const result = engine.matchJobRoles({ userId: 'user-1' });
            expect(result.topSkillGaps).toBeDefined();
        });
    });
    // ==========================================================================
    // CAREER PATH ANALYSIS TESTS
    // ==========================================================================
    describe('analyzeCareerPath', () => {
        beforeEach(() => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'PROFICIENT',
            });
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-react',
                proficiency: 'COMPETENT',
            });
        });
        it('should analyze career path for user', () => {
            const analysis = engine.analyzeCareerPath({ userId: 'user-1' });
            expect(analysis).toBeDefined();
            expect(analysis.userId).toBe('user-1');
        });
        it('should determine current position', () => {
            const analysis = engine.analyzeCareerPath({ userId: 'user-1' });
            expect(analysis.currentPosition).toBeDefined();
            expect(analysis.currentPosition.estimatedLevel).toBeDefined();
        });
        it('should provide priority skills', () => {
            const analysis = engine.analyzeCareerPath({ userId: 'user-1' });
            expect(analysis.prioritySkills).toBeDefined();
        });
        it('should generate projections', () => {
            // Add a career path first
            engine.addCareerPath({
                name: 'Frontend Track',
                description: 'Frontend developer career path',
                typicalYearsTotal: 10,
                stages: [
                    {
                        order: 1,
                        role: engine.getJobRole('role-frontend-dev'),
                        typicalYearsInRole: 2,
                        typicalYearsToReach: 0,
                        keyMilestones: ['Build first app'],
                        transitionSkills: [engine.getSkill('skill-js')],
                    },
                ],
                skillProgression: {
                    byStage: {},
                    proficiencyEvolution: [],
                },
            });
            const analysis = engine.analyzeCareerPath({
                userId: 'user-1',
                maxYearsHorizon: 3,
            });
            expect(analysis.projections).toBeDefined();
        });
    });
    // ==========================================================================
    // PORTFOLIO MANAGEMENT TESTS
    // ==========================================================================
    describe('addPortfolioItem', () => {
        it('should add a portfolio item', () => {
            const item = engine.addPortfolioItem(createSamplePortfolioInput());
            expect(item).toBeDefined();
            expect(item.id).toBeDefined();
            expect(item.title).toBe('Test Project');
        });
        it('should store demonstrated skills', () => {
            const item = engine.addPortfolioItem(createSamplePortfolioInput());
            expect(item.demonstratedSkills.length).toBeGreaterThan(0);
            expect(item.demonstratedSkills[0].skillId).toBe('skill-js');
        });
        it('should store artifacts', () => {
            const item = engine.addPortfolioItem(createSamplePortfolioInput());
            expect(item.artifacts.length).toBeGreaterThan(0);
            expect(item.artifacts[0].type).toBe('LINK');
        });
        it('should set visibility', () => {
            const item = engine.addPortfolioItem(createSamplePortfolioInput());
            expect(item.visibility).toBe('PUBLIC');
        });
        it('should update user proficiency based on portfolio evidence', () => {
            engine.addPortfolioItem(createSamplePortfolioInput({
                demonstratedSkills: [
                    {
                        skillId: 'skill-react',
                        proficiency: 'PROFICIENT',
                        evidence: 'Built a React application',
                    },
                ],
            }));
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            const reactProf = profile.skills.find((s) => s.skillId === 'skill-react');
            expect(reactProf).toBeDefined();
            expect(reactProf?.proficiency).toBe('PROFICIENT');
        });
    });
    describe('getUserPortfolio', () => {
        beforeEach(() => {
            engine.addPortfolioItem(createSamplePortfolioInput());
            engine.addPortfolioItem(createSamplePortfolioInput({
                title: 'Second Project',
                type: 'CERTIFICATION',
            }));
        });
        it('should retrieve user portfolio', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio).toBeDefined();
            expect(portfolio.userId).toBe('user-1');
        });
        it('should include all portfolio items', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio.items.length).toBe(2);
        });
        it('should provide summary statistics', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio.summary).toBeDefined();
            expect(portfolio.summary.totalItems).toBe(2);
            expect(portfolio.summary.itemsByType.PROJECT).toBe(1);
            expect(portfolio.summary.itemsByType.CERTIFICATION).toBe(1);
        });
        it('should analyze skill coverage', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio.skillCoverage).toBeDefined();
            expect(portfolio.skillCoverage.coveredSkills.length).toBeGreaterThan(0);
        });
        it('should calculate strength score', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio.strengthScore).toBeGreaterThanOrEqual(0);
            expect(portfolio.strengthScore).toBeLessThanOrEqual(100);
        });
        it('should provide recommendations', () => {
            const portfolio = engine.getUserPortfolio('user-1');
            expect(portfolio.recommendations).toBeDefined();
        });
        it('should return empty portfolio for new user', () => {
            const portfolio = engine.getUserPortfolio('new-user');
            expect(portfolio.items).toEqual([]);
            expect(portfolio.summary.totalItems).toBe(0);
        });
    });
    // ==========================================================================
    // SKILL ASSESSMENT TESTS
    // ==========================================================================
    describe('createAssessment', () => {
        it('should create a skill assessment', () => {
            const assessment = engine.createAssessment({
                skillId: 'skill-js',
                title: 'JavaScript Fundamentals',
                description: 'Test your JavaScript knowledge',
                type: 'QUIZ',
                items: createSampleAssessmentItems(),
                timeLimitMinutes: 30,
                passingScore: 70,
            });
            expect(assessment).toBeDefined();
            expect(assessment.id).toBeDefined();
            expect(assessment.title).toBe('JavaScript Fundamentals');
        });
        it('should include assessment items', () => {
            const assessment = engine.createAssessment({
                skillId: 'skill-js',
                title: 'JS Test',
                description: 'Test',
                type: 'QUIZ',
                items: createSampleAssessmentItems(),
                passingScore: 70,
            });
            expect(assessment.items.length).toBe(3);
        });
        it('should set proficiency mapping', () => {
            const assessment = engine.createAssessment({
                skillId: 'skill-js',
                title: 'JS Test',
                description: 'Test',
                type: 'QUIZ',
                items: createSampleAssessmentItems(),
                passingScore: 70,
            });
            expect(assessment.proficiencyMapping.length).toBeGreaterThan(0);
        });
    });
    describe('submitAssessment', () => {
        let assessmentId;
        beforeEach(() => {
            const assessment = engine.createAssessment({
                skillId: 'skill-js',
                title: 'JavaScript Quiz',
                description: 'Test your skills',
                type: 'QUIZ',
                items: createSampleAssessmentItems(),
                passingScore: 60,
            });
            assessmentId = assessment.id;
        });
        it('should submit assessment and get result', () => {
            const answers = new Map();
            answers.set('item-1', 'object');
            answers.set('item-2', 'push()');
            answers.set('item-3', 'const');
            const result = engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            expect(result).toBeDefined();
            expect(result.assessmentId).toBe(assessmentId);
        });
        it('should calculate score correctly', () => {
            const answers = new Map();
            answers.set('item-1', 'object'); // Correct
            answers.set('item-2', 'push()'); // Correct
            answers.set('item-3', 'const'); // Correct
            const result = engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            expect(result.score).toBe(30);
            expect(result.maxScore).toBe(30);
            expect(result.percentage).toBe(100);
        });
        it('should determine proficiency achieved', () => {
            const answers = new Map();
            answers.set('item-1', 'object');
            answers.set('item-2', 'push()');
            answers.set('item-3', 'const');
            const result = engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            expect(result.proficiencyAchieved).toBeDefined();
        });
        it('should provide item-by-item results', () => {
            const answers = new Map();
            answers.set('item-1', 'object');
            answers.set('item-2', 'wrong');
            answers.set('item-3', 'const');
            const result = engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            expect(result.itemResults.length).toBe(3);
            expect(result.itemResults[0].isCorrect).toBe(true);
            expect(result.itemResults[1].isCorrect).toBe(false);
        });
        it('should provide feedback', () => {
            const answers = new Map();
            answers.set('item-1', 'object');
            answers.set('item-2', 'push()');
            answers.set('item-3', 'const');
            const result = engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            expect(result.feedback).toBeDefined();
            expect(result.feedback.length).toBeGreaterThan(0);
        });
        it('should update user proficiency on passing', () => {
            const answers = new Map();
            answers.set('item-1', 'object');
            answers.set('item-2', 'push()');
            answers.set('item-3', 'const');
            engine.submitAssessment({
                assessmentId,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 15,
            });
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            const jsProf = profile.skills.find((s) => s.skillId === 'skill-js');
            expect(jsProf).toBeDefined();
        });
        it('should throw error for non-existent assessment', () => {
            const answers = new Map();
            expect(() => engine.submitAssessment({
                assessmentId: 'non-existent',
                userId: 'user-1',
                answers,
                timeTakenMinutes: 10,
            })).toThrow('Assessment non-existent not found');
        });
    });
    // ==========================================================================
    // SKILL EXTRACTION TESTS
    // ==========================================================================
    describe('extractSkills', () => {
        it('should extract skills from job posting content', async () => {
            const result = await engine.extractSkills({
                content: 'Looking for a JavaScript developer with React experience and knowledge of TypeScript',
                contentType: 'JOB_POSTING',
            });
            expect(result.skills.length).toBeGreaterThan(0);
        });
        it('should identify technical skills', async () => {
            const result = await engine.extractSkills({
                content: 'Experience with Python, machine learning, and SQL databases',
                contentType: 'RESUME',
            });
            expect(result.skills.some((s) => s.category === 'TECHNICAL')).toBe(true);
        });
        it('should identify soft skills', async () => {
            const result = await engine.extractSkills({
                content: 'Strong communication skills and leadership experience',
                contentType: 'RESUME',
            });
            expect(result.skills.some((s) => s.category === 'SOFT')).toBe(true);
        });
        it('should identify tool skills', async () => {
            const result = await engine.extractSkills({
                content: 'Proficient in Git, Jira, and VS Code',
                contentType: 'RESUME',
            });
            expect(result.skills.some((s) => s.category === 'TOOL')).toBe(true);
        });
        it('should provide confidence scores', async () => {
            const result = await engine.extractSkills({
                content: 'JavaScript programming experience',
                contentType: 'JOB_POSTING',
            });
            if (result.skills.length > 0) {
                expect(result.skills[0].confidence).toBeGreaterThan(0);
                expect(result.skills[0].confidence).toBeLessThanOrEqual(1);
            }
        });
        it('should match to existing skills when possible', async () => {
            const result = await engine.extractSkills({
                content: 'JavaScript developer needed',
                contentType: 'JOB_POSTING',
            });
            const jsSkill = result.skills.find((s) => s.name.toLowerCase().includes('javascript'));
            if (jsSkill) {
                expect(jsSkill.matchedSkillId).toBeDefined();
            }
        });
        it('should extract context around skill mentions', async () => {
            const result = await engine.extractSkills({
                content: 'We need an expert JavaScript developer',
                contentType: 'JOB_POSTING',
            });
            if (result.skills.length > 0) {
                expect(result.skills[0].context).toBeDefined();
            }
        });
        it('should suggest proficiency from context', async () => {
            const result = await engine.extractSkills({
                content: 'Expert JavaScript developer with 10+ years experience',
                contentType: 'JOB_POSTING',
            });
            const jsSkill = result.skills.find((s) => s.name.toLowerCase().includes('javascript'));
            if (jsSkill) {
                expect(jsSkill.suggestedProficiency).toBe('EXPERT');
            }
        });
        it('should return overall confidence', async () => {
            const result = await engine.extractSkills({
                content: 'JavaScript and React developer',
                contentType: 'JOB_POSTING',
            });
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });
    // ==========================================================================
    // UTILITY METHOD TESTS
    // ==========================================================================
    describe('getAllSkills', () => {
        it('should return all skills', () => {
            const skills = engine.getAllSkills();
            expect(skills.length).toBeGreaterThan(0);
        });
    });
    describe('getAllJobRoles', () => {
        it('should return all job roles', () => {
            const roles = engine.getAllJobRoles();
            expect(roles.length).toBeGreaterThan(0);
        });
    });
    describe('getJobRole', () => {
        it('should return job role by ID', () => {
            const role = engine.getJobRole('role-frontend-dev');
            expect(role).toBeDefined();
            expect(role?.title).toBe('Frontend Developer');
        });
        it('should return undefined for non-existent role', () => {
            const role = engine.getJobRole('non-existent');
            expect(role).toBeUndefined();
        });
    });
    describe('addJobRole', () => {
        it('should add a new job role', () => {
            const role = engine.addJobRole({
                title: 'DevOps Engineer',
                description: 'Manages infrastructure and deployments',
                level: 'MID',
                requiredSkills: [
                    { skillId: 'skill-git', minimumProficiency: 'COMPETENT', weight: 0.8, isRequired: true },
                ],
                preferredSkills: [],
            });
            expect(role).toBeDefined();
            expect(role.id).toBeDefined();
            expect(role.title).toBe('DevOps Engineer');
        });
    });
    describe('addCareerPath', () => {
        it('should add a career path', () => {
            const path = engine.addCareerPath({
                name: 'Backend Track',
                description: 'Backend developer career progression',
                typicalYearsTotal: 15,
                stages: [],
                skillProgression: {
                    byStage: {},
                    proficiencyEvolution: [],
                },
            });
            expect(path).toBeDefined();
            expect(path.id).toBeDefined();
            expect(path.name).toBe('Backend Track');
        });
    });
    describe('getCareerPath', () => {
        it('should retrieve career path by ID', () => {
            const created = engine.addCareerPath({
                name: 'Test Path',
                description: 'Test',
                typicalYearsTotal: 5,
                stages: [],
                skillProgression: { byStage: {}, proficiencyEvolution: [] },
            });
            const retrieved = engine.getCareerPath(created.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(created.id);
        });
        it('should return undefined for non-existent path', () => {
            const path = engine.getCareerPath('non-existent');
            expect(path).toBeUndefined();
        });
    });
    describe('getAllCareerPaths', () => {
        it('should return all career paths', () => {
            engine.addCareerPath({
                name: 'Path 1',
                description: 'Test',
                typicalYearsTotal: 5,
                stages: [],
                skillProgression: { byStage: {}, proficiencyEvolution: [] },
            });
            const paths = engine.getAllCareerPaths();
            expect(paths.length).toBeGreaterThan(0);
        });
    });
    describe('getProficiencyDescription', () => {
        it('should return description for proficiency level', () => {
            const description = engine.getProficiencyDescription('COMPETENT');
            expect(description).toBe('Practical application, works independently');
        });
        it('should return description for all levels', () => {
            const levels = [
                'NOVICE',
                'BEGINNER',
                'COMPETENT',
                'PROFICIENT',
                'EXPERT',
                'MASTER',
            ];
            levels.forEach((level) => {
                const desc = engine.getProficiencyDescription(level);
                expect(desc).toBeDefined();
                expect(desc.length).toBeGreaterThan(0);
            });
        });
    });
    describe('getHoursToReachProficiency', () => {
        it('should calculate hours between proficiency levels', () => {
            const hours = engine.getHoursToReachProficiency('BEGINNER', 'COMPETENT');
            expect(hours).toBeGreaterThan(0);
        });
        it('should return 0 for same level', () => {
            const hours = engine.getHoursToReachProficiency('COMPETENT', 'COMPETENT');
            expect(hours).toBe(0);
        });
        it('should return 0 when current is higher than target', () => {
            const hours = engine.getHoursToReachProficiency('EXPERT', 'BEGINNER');
            expect(hours).toBe(0);
        });
        it('should adjust based on skill learning hours', () => {
            const skill = engine.createSkill(createSampleSkillInput({ typicalLearningHours: 80 }));
            const hoursWithSkill = engine.getHoursToReachProficiency('BEGINNER', 'COMPETENT', skill);
            const hoursWithoutSkill = engine.getHoursToReachProficiency('BEGINNER', 'COMPETENT');
            expect(hoursWithSkill).toBeGreaterThan(hoursWithoutSkill);
        });
    });
    // ==========================================================================
    // EDGE CASE TESTS
    // ==========================================================================
    describe('edge cases', () => {
        it('should handle user with no skills', () => {
            const profile = engine.getUserCompetency({ userId: 'empty-user' });
            expect(profile.skills).toEqual([]);
            expect(profile.overallScore).toBe(0);
        });
        it('should handle empty search query', () => {
            const results = engine.searchSkills('');
            expect(results).toBeDefined();
        });
        it('should handle skill tree with no skills', () => {
            const tree = engine.createSkillTree({
                name: 'Empty Tree',
                description: 'No skills',
                rootSkillId: 'skill-js',
                skills: [],
            });
            expect(tree.nodes).toEqual([]);
            expect(tree.edges).toEqual([]);
        });
        it('should handle portfolio with no artifacts', () => {
            const item = engine.addPortfolioItem({
                userId: 'user-1',
                type: 'ACHIEVEMENT',
                title: 'Award',
                description: 'Received an award',
                date: new Date(),
                demonstratedSkills: [],
            });
            expect(item.artifacts).toEqual([]);
        });
        it('should handle assessment with unanswered questions', () => {
            const assessment = engine.createAssessment({
                skillId: 'skill-js',
                title: 'Test',
                description: 'Test',
                type: 'QUIZ',
                items: createSampleAssessmentItems(),
                passingScore: 60,
            });
            const answers = new Map();
            // Only answer one question
            answers.set('item-1', 'object');
            const result = engine.submitAssessment({
                assessmentId: assessment.id,
                userId: 'user-1',
                answers,
                timeTakenMinutes: 5,
            });
            expect(result.score).toBeLessThan(result.maxScore);
        });
        it('should handle content with no extractable skills', async () => {
            const result = await engine.extractSkills({
                content: 'This is just random text with no skills mentioned.',
                contentType: 'ARTICLE',
            });
            expect(result.skills).toEqual([]);
            expect(result.confidence).toBe(0);
        });
        it('should handle multiple proficiency updates for same skill', () => {
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'BEGINNER',
            });
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'COMPETENT',
            });
            engine.updateProficiency({
                userId: 'user-1',
                skillId: 'skill-js',
                proficiency: 'PROFICIENT',
            });
            const profile = engine.getUserCompetency({ userId: 'user-1' });
            const jsProf = profile.skills.find((s) => s.skillId === 'skill-js');
            expect(jsProf?.proficiency).toBe('PROFICIENT');
        });
    });
});
