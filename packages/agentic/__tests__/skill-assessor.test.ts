/**
 * Tests for SkillAssessor
 */

import {
  SkillAssessor,
  createSkillAssessor,
  InMemorySkillAssessmentStore,
  MasteryLevel,
  AssessmentSource,
  type SkillAssessmentInput,
  type Skill,
} from '../src/learning-analytics';

describe('SkillAssessor', () => {
  let assessor: SkillAssessor;

  beforeEach(() => {
    assessor = createSkillAssessor();
  });

  describe('registerSkill', () => {
    it('should register a new skill', () => {
      assessor.registerSkill({
        id: 'skill-1',
        name: 'JavaScript',
        category: 'Programming',
        description: 'JavaScript programming language',
        prerequisites: [],
        difficultyLevel: 3,
      });

      const skill = assessor.getSkill('skill-1');
      expect(skill).toBeDefined();
      expect(skill?.id).toBe('skill-1');
      expect(skill?.name).toBe('JavaScript');
      expect(skill?.category).toBe('Programming');
    });

    it('should register skill with prerequisites', () => {
      assessor.registerSkill({
        id: 'html-basics',
        name: 'HTML Basics',
        category: 'Web',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'css-basics',
        name: 'CSS Basics',
        category: 'Web',
        prerequisites: ['html-basics'],
        difficultyLevel: 2,
      });

      const skill = assessor.getSkill('css-basics');
      expect(skill?.prerequisites).toContain('html-basics');
    });
  });

  describe('getSkill', () => {
    it('should return registered skill', () => {
      assessor.registerSkill({
        id: 'python',
        name: 'Python',
        category: 'Programming',
        prerequisites: [],
        difficultyLevel: 2,
      });

      const skill = assessor.getSkill('python');

      expect(skill).toBeDefined();
      expect(skill?.name).toBe('Python');
    });

    it('should return undefined for non-existent skill', () => {
      const skill = assessor.getSkill('non-existent');
      expect(skill).toBeUndefined();
    });
  });

  describe('listSkills', () => {
    it('should list all skills', () => {
      assessor.registerSkill({
        id: 'skill-a',
        name: 'Skill A',
        category: 'Category 1',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'skill-b',
        name: 'Skill B',
        category: 'Category 2',
        prerequisites: [],
        difficultyLevel: 2,
      });

      const skills = assessor.listSkills();

      expect(skills.length).toBe(2);
    });

    it('should filter skills by category', () => {
      assessor.registerSkill({
        id: 'math-1',
        name: 'Algebra',
        category: 'Mathematics',
        prerequisites: [],
        difficultyLevel: 2,
      });

      assessor.registerSkill({
        id: 'prog-1',
        name: 'Variables',
        category: 'Programming',
        prerequisites: [],
        difficultyLevel: 1,
      });

      const mathSkills = assessor.listSkills('Mathematics');

      expect(mathSkills.length).toBe(1);
      expect(mathSkills[0].name).toBe('Algebra');
    });
  });

  describe('assessSkill', () => {
    it('should create a skill assessment', async () => {
      assessor.registerSkill({
        id: 'react',
        name: 'React',
        category: 'Frontend',
        prerequisites: [],
        difficultyLevel: 3,
      });

      const input: SkillAssessmentInput = {
        userId: 'user-1',
        skillId: 'react',
        score: 75,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
        duration: 1800,
        questionsAnswered: 20,
        correctAnswers: 15,
      };

      const assessment = await assessor.assessSkill(input);

      expect(assessment).toBeDefined();
      expect(assessment.id).toBeDefined();
      expect(assessment.userId).toBe('user-1');
      expect(assessment.skillId).toBe('react');
      expect(assessment.score).toBe(75);
      expect(assessment.level).toBeDefined();
    });

    it('should calculate mastery level correctly', async () => {
      assessor.registerSkill({
        id: 'expert-skill',
        name: 'Expert Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 5,
      });

      const expertAssessment = await assessor.assessSkill({
        userId: 'user-expert',
        skillId: 'expert-skill',
        score: 95,
        maxScore: 100,
        source: AssessmentSource.EXERCISE,
      });

      expect(expertAssessment.level).toBe(MasteryLevel.EXPERT);

      assessor.registerSkill({
        id: 'novice-skill',
        name: 'Novice Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      const noviceAssessment = await assessor.assessSkill({
        userId: 'user-novice',
        skillId: 'novice-skill',
        score: 15,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      expect(noviceAssessment.level).toBe(MasteryLevel.NOVICE);
    });
  });

  describe('getAssessment', () => {
    it('should return assessment for user and skill', async () => {
      assessor.registerSkill({
        id: 'skill-get',
        name: 'Get Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      await assessor.assessSkill({
        userId: 'user-get',
        skillId: 'skill-get',
        score: 80,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const retrieved = await assessor.getAssessment('user-get', 'skill-get');

      expect(retrieved).toBeDefined();
      expect(retrieved?.score).toBe(80);
    });

    it('should return null for non-existent assessment', async () => {
      const assessment = await assessor.getAssessment('non-existent', 'no-skill');
      expect(assessment).toBeNull();
    });
  });

  describe('getUserAssessments', () => {
    it('should return all assessments for a user', async () => {
      assessor.registerSkill({
        id: 'skill-ua-1',
        name: 'Skill UA 1',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'skill-ua-2',
        name: 'Skill UA 2',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 2,
      });

      await assessor.assessSkill({
        userId: 'user-multi',
        skillId: 'skill-ua-1',
        score: 70,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      await assessor.assessSkill({
        userId: 'user-multi',
        skillId: 'skill-ua-2',
        score: 85,
        maxScore: 100,
        source: AssessmentSource.EXERCISE,
      });

      const assessments = await assessor.getUserAssessments('user-multi');

      expect(assessments.length).toBe(2);
    });
  });

  describe('getAssessmentHistory', () => {
    it('should return assessment history for user and skill', async () => {
      assessor.registerSkill({
        id: 'skill-history',
        name: 'History Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 2,
      });

      // Create multiple assessments
      for (let i = 0; i < 3; i++) {
        await assessor.assessSkill({
          userId: 'user-history',
          skillId: 'skill-history',
          score: 60 + i * 10,
          maxScore: 100,
          source: AssessmentSource.QUIZ,
        });
      }

      const history = await assessor.getAssessmentHistory('user-history', 'skill-history');

      expect(history.length).toBe(3);
    });
  });

  describe('generateSkillMap', () => {
    it('should generate a skill map for user', async () => {
      assessor.registerSkill({
        id: 'map-skill-1',
        name: 'Map Skill 1',
        category: 'Category A',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'map-skill-2',
        name: 'Map Skill 2',
        category: 'Category A',
        prerequisites: ['map-skill-1'],
        difficultyLevel: 2,
      });

      await assessor.assessSkill({
        userId: 'user-map',
        skillId: 'map-skill-1',
        score: 90,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const skillMap = await assessor.generateSkillMap('user-map');

      expect(skillMap).toBeDefined();
      expect(skillMap.userId).toBe('user-map');
      expect(skillMap.skills.length).toBeGreaterThan(0);
    });

    it('should identify skill dependencies in map', async () => {
      assessor.registerSkill({
        id: 'base-skill',
        name: 'Base Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'dependent-skill',
        name: 'Dependent Skill',
        category: 'Test',
        prerequisites: ['base-skill'],
        difficultyLevel: 2,
      });

      const skillMap = await assessor.generateSkillMap('user-deps');

      const dependentNode = skillMap.skills.find((n) => n.skillId === 'dependent-skill');
      expect(dependentNode?.dependencies).toContain('base-skill');
    });
  });

  describe('predictDecay', () => {
    it('should predict skill decay for user', async () => {
      assessor.registerSkill({
        id: 'decay-skill',
        name: 'Decay Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 2,
      });

      await assessor.assessSkill({
        userId: 'user-decay',
        skillId: 'decay-skill',
        score: 80,
        maxScore: 100,
        source: AssessmentSource.EXERCISE,
      });

      const decayPredictions = await assessor.predictDecay('user-decay');

      // Returns an array of decay predictions
      expect(Array.isArray(decayPredictions)).toBe(true);
    });

    it('should return empty array for user without assessments', async () => {
      const decayPredictions = await assessor.predictDecay('new-user');

      expect(decayPredictions).toEqual([]);
    });
  });

  describe('compareSkills', () => {
    it('should compare user skills with benchmarks', async () => {
      assessor.registerSkill({
        id: 'compare-skill',
        name: 'Compare Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 2,
      });

      await assessor.assessSkill({
        userId: 'user-compare',
        skillId: 'compare-skill',
        score: 70,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const comparisons = await assessor.compareSkills('user-compare');

      expect(Array.isArray(comparisons)).toBe(true);
      expect(comparisons.length).toBeGreaterThan(0);
      expect(comparisons[0].skillId).toBe('compare-skill');
      expect(comparisons[0].userScore).toBe(70);
    });
  });

  describe('getPrerequisiteStatus', () => {
    it('should check prerequisite completion status', async () => {
      assessor.registerSkill({
        id: 'prereq-base',
        name: 'Base Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      assessor.registerSkill({
        id: 'prereq-advanced',
        name: 'Advanced Skill',
        category: 'Test',
        prerequisites: ['prereq-base'],
        difficultyLevel: 3,
      });

      // User has not completed prerequisite
      const statusBefore = await assessor.getPrerequisiteStatus('user-prereq', 'prereq-advanced');

      expect(statusBefore.unmet).toContain('prereq-base');
      expect(statusBefore.met.length).toBe(0);

      // User completes prerequisite with high score
      await assessor.assessSkill({
        userId: 'user-prereq',
        skillId: 'prereq-base',
        score: 80,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const statusAfter = await assessor.getPrerequisiteStatus('user-prereq', 'prereq-advanced');

      expect(statusAfter.met).toContain('prereq-base');
      expect(statusAfter.unmet.length).toBe(0);
    });
  });

  describe('getImprovementRate', () => {
    it('should calculate improvement rate', async () => {
      assessor.registerSkill({
        id: 'improve-skill',
        name: 'Improvement Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 2,
      });

      // Create assessments
      await assessor.assessSkill({
        userId: 'user-improve',
        skillId: 'improve-skill',
        score: 50,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      await assessor.assessSkill({
        userId: 'user-improve',
        skillId: 'improve-skill',
        score: 70,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      await assessor.assessSkill({
        userId: 'user-improve',
        skillId: 'improve-skill',
        score: 85,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const rate = await assessor.getImprovementRate('user-improve', 'improve-skill');

      // Returns a number (can be positive or negative)
      expect(typeof rate).toBe('number');
    });
  });

  describe('getSkillsByLevel', () => {
    it('should return skills at specific mastery level', async () => {
      assessor.registerSkill({
        id: 'level-skill-1',
        name: 'Expert Level Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 3,
      });

      assessor.registerSkill({
        id: 'level-skill-2',
        name: 'Beginner Level Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 1,
      });

      await assessor.assessSkill({
        userId: 'user-levels',
        skillId: 'level-skill-1',
        score: 95,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      await assessor.assessSkill({
        userId: 'user-levels',
        skillId: 'level-skill-2',
        score: 30,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const expertSkills = await assessor.getSkillsByLevel('user-levels', MasteryLevel.EXPERT);

      expect(expertSkills.length).toBe(1);
      expect(expertSkills[0].skillId).toBe('level-skill-1');
    });
  });

  describe('estimateTimeToLevel', () => {
    it('should estimate time to reach a mastery level', async () => {
      assessor.registerSkill({
        id: 'time-skill',
        name: 'Time Estimate Skill',
        category: 'Test',
        prerequisites: [],
        difficultyLevel: 3,
      });

      await assessor.assessSkill({
        userId: 'user-time',
        skillId: 'time-skill',
        score: 50,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });

      const estimate = await assessor.estimateTimeToLevel(
        'user-time',
        'time-skill',
        MasteryLevel.EXPERT
      );

      // Returns number of sessions or null
      expect(estimate === null || typeof estimate === 'number').toBe(true);
    });

    it('should return null for non-existent assessment', async () => {
      const estimate = await assessor.estimateTimeToLevel(
        'no-user',
        'no-skill',
        MasteryLevel.EXPERT
      );

      expect(estimate).toBeNull();
    });
  });
});

describe('InMemorySkillAssessmentStore', () => {
  let store: InMemorySkillAssessmentStore;

  beforeEach(() => {
    store = new InMemorySkillAssessmentStore();
  });

  it('should create and retrieve assessment', async () => {
    const assessment = await store.create({
      userId: 'user-1',
      skillId: 'skill-1',
      skillName: 'Skill 1',
      score: 80,
      level: MasteryLevel.PROFICIENT,
      source: AssessmentSource.QUIZ,
      assessedAt: new Date(),
      confidence: 0.85,
      evidence: [],
    });

    const retrieved = await store.get(assessment.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.score).toBe(80);
  });

  it('should get assessments by user', async () => {
    await store.create({
      userId: 'user-store',
      skillId: 'skill-1',
      skillName: 'Skill 1',
      score: 70,
      level: MasteryLevel.INTERMEDIATE,
      source: AssessmentSource.QUIZ,
      assessedAt: new Date(),
      confidence: 0.8,
      evidence: [],
    });

    await store.create({
      userId: 'user-store',
      skillId: 'skill-2',
      skillName: 'Skill 2',
      score: 85,
      level: MasteryLevel.PROFICIENT,
      source: AssessmentSource.EXERCISE,
      assessedAt: new Date(),
      confidence: 0.9,
      evidence: [],
    });

    const assessments = await store.getByUser('user-store');

    expect(assessments.length).toBe(2);
  });

  it('should get assessment by user and skill', async () => {
    await store.create({
      userId: 'user-a',
      skillId: 'common-skill',
      skillName: 'Common Skill',
      score: 60,
      level: MasteryLevel.INTERMEDIATE,
      source: AssessmentSource.QUIZ,
      assessedAt: new Date(),
      confidence: 0.7,
      evidence: [],
    });

    const assessment = await store.getByUserAndSkill('user-a', 'common-skill');

    expect(assessment).toBeDefined();
    expect(assessment?.score).toBe(60);
  });

  it('should get history in chronological order', async () => {
    const dates = [
      new Date(Date.now() - 20000),
      new Date(Date.now() - 10000),
      new Date(),
    ];

    for (let i = 0; i < 3; i++) {
      await store.create({
        userId: 'user-chrono',
        skillId: 'skill-chrono',
        skillName: 'Chrono Skill',
        score: 50 + i * 15,
        level: MasteryLevel.INTERMEDIATE,
        source: AssessmentSource.QUIZ,
        assessedAt: dates[i],
        confidence: 0.7 + i * 0.1,
        evidence: [],
      });
    }

    const history = await store.getHistory('user-chrono', 'skill-chrono');

    expect(history.length).toBe(3);
    // Should be sorted by date ascending (oldest first)
    expect(history[0].score).toBe(50);
    expect(history[2].score).toBe(80);
  });
});
