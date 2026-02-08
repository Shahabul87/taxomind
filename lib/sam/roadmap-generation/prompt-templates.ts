/**
 * AI Prompt Templates for Skill Roadmap Generation
 *
 * This module provides comprehensive guidelines for AI to generate
 * consistent, pedagogically-sound learning roadmaps.
 */

import { z } from 'zod';

// =============================================================================
// TYPES
// =============================================================================

export interface RoadmapGenerationInput {
  skillName: string;
  currentLevel: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  hoursPerWeek: number;
  targetCompletionDate?: string;
  learningStyle: LearningStyle;
  includeAssessments: boolean;
  prioritizeQuickWins: boolean;
}

export type ProficiencyLevel =
  | 'NOVICE'
  | 'BEGINNER'
  | 'COMPETENT'
  | 'PROFICIENT'
  | 'ADVANCED'
  | 'EXPERT'
  | 'STRATEGIST';

export type LearningStyle = 'STRUCTURED' | 'PROJECT_BASED' | 'MIXED';

export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

// =============================================================================
// PROFICIENCY LEVEL DEFINITIONS
// =============================================================================

/**
 * Detailed proficiency level definitions with learning indicators.
 * AI uses these to understand what each level means and what skills to include.
 */
export const PROFICIENCY_DEFINITIONS: Record<
  ProficiencyLevel,
  {
    level: number;
    description: string;
    canDo: string[];
    bloomsRange: BloomsLevel[];
    typicalHoursToReach: number;
  }
> = {
  NOVICE: {
    level: 1,
    description: 'No prior knowledge. Starting from scratch.',
    canDo: [
      'Recognize basic terminology',
      'Follow step-by-step tutorials',
      'Understand why the skill matters',
    ],
    bloomsRange: ['REMEMBER'],
    typicalHoursToReach: 0,
  },
  BEGINNER: {
    level: 2,
    description: 'Basic awareness. Can perform simple tasks with guidance.',
    canDo: [
      'Explain core concepts in own words',
      'Complete guided exercises',
      'Identify main components',
      'Use basic syntax/tools correctly',
    ],
    bloomsRange: ['REMEMBER', 'UNDERSTAND'],
    typicalHoursToReach: 20,
  },
  COMPETENT: {
    level: 3,
    description: 'Can work independently on standard tasks.',
    canDo: [
      'Solve common problems without help',
      'Apply concepts to new situations',
      'Build simple projects from scratch',
      'Debug basic issues',
    ],
    bloomsRange: ['UNDERSTAND', 'APPLY'],
    typicalHoursToReach: 80,
  },
  PROFICIENT: {
    level: 4,
    description: 'Handles complex tasks efficiently. Deep understanding.',
    canDo: [
      'Design solutions for complex problems',
      'Optimize existing implementations',
      'Mentor beginners effectively',
      'Understand edge cases and trade-offs',
    ],
    bloomsRange: ['APPLY', 'ANALYZE'],
    typicalHoursToReach: 200,
  },
  ADVANCED: {
    level: 5,
    description: 'Deep expertise. Handles edge cases and optimization.',
    canDo: [
      'Architect large-scale solutions',
      'Evaluate multiple approaches critically',
      'Contribute to best practices',
      'Handle performance optimization',
    ],
    bloomsRange: ['ANALYZE', 'EVALUATE'],
    typicalHoursToReach: 500,
  },
  EXPERT: {
    level: 6,
    description: 'Recognized authority. Creates new approaches.',
    canDo: [
      'Create new patterns and methodologies',
      'Lead technical strategy',
      'Write authoritative content',
      'Speak at conferences',
    ],
    bloomsRange: ['EVALUATE', 'CREATE'],
    typicalHoursToReach: 1000,
  },
  STRATEGIST: {
    level: 7,
    description: 'Industry leader. Shapes the field.',
    canDo: [
      'Define industry standards',
      'Create frameworks used by others',
      'Lead large-scale transformations',
      'Innovate in the field',
    ],
    bloomsRange: ['CREATE'],
    typicalHoursToReach: 2000,
  },
};

// =============================================================================
// BLOOM'S TAXONOMY GUIDELINES
// =============================================================================

/**
 * Bloom's Taxonomy progression rules for AI.
 * Defines what each cognitive level means and appropriate activities.
 */
export const BLOOMS_TAXONOMY_GUIDE: Record<
  BloomsLevel,
  {
    order: number;
    description: string;
    verbs: string[];
    courseActivities: string[];
    projectTypes: string[];
    assessmentTypes: string[];
  }
> = {
  REMEMBER: {
    order: 1,
    description: 'Recall facts and basic concepts',
    verbs: ['define', 'list', 'name', 'identify', 'recall', 'recognize'],
    courseActivities: [
      'Flashcard drills',
      'Terminology quizzes',
      'Concept mapping',
      'Reading documentation',
    ],
    projectTypes: [
      'Create a glossary',
      'Build a cheat sheet',
      'Document key concepts',
    ],
    assessmentTypes: ['Multiple choice', 'Fill in blanks', 'Matching'],
  },
  UNDERSTAND: {
    order: 2,
    description: 'Explain ideas and concepts',
    verbs: [
      'explain',
      'describe',
      'summarize',
      'interpret',
      'classify',
      'compare',
    ],
    courseActivities: [
      'Watch explanation videos',
      'Read tutorials with examples',
      'Discuss concepts',
      'Complete guided walkthroughs',
    ],
    projectTypes: [
      'Write explanatory blog post',
      'Create comparison chart',
      'Build simple demo',
    ],
    assessmentTypes: ['Short answer', 'Explain in own words', 'Concept comparison'],
  },
  APPLY: {
    order: 3,
    description: 'Use information in new situations',
    verbs: ['implement', 'execute', 'use', 'solve', 'demonstrate', 'operate'],
    courseActivities: [
      'Hands-on coding exercises',
      'Implement from requirements',
      'Follow patterns in new context',
      'Debug simple issues',
    ],
    projectTypes: [
      'Build a working application',
      'Implement a feature',
      'Solve real-world problem',
    ],
    assessmentTypes: ['Coding challenges', 'Implementation tasks', 'Practical exercises'],
  },
  ANALYZE: {
    order: 4,
    description: 'Draw connections among ideas',
    verbs: [
      'analyze',
      'differentiate',
      'examine',
      'compare',
      'contrast',
      'investigate',
    ],
    courseActivities: [
      'Code review exercises',
      'Performance analysis',
      'Architecture comparison',
      'Debug complex issues',
    ],
    projectTypes: [
      'Analyze and optimize existing code',
      'Compare multiple solutions',
      'Conduct performance audit',
    ],
    assessmentTypes: ['Case study analysis', 'Code review', 'Problem diagnosis'],
  },
  EVALUATE: {
    order: 5,
    description: 'Justify decisions and choices',
    verbs: ['evaluate', 'judge', 'critique', 'justify', 'argue', 'defend'],
    courseActivities: [
      'Evaluate architectural decisions',
      'Review and critique code',
      'Assess trade-offs',
      'Make technology choices',
    ],
    projectTypes: [
      'Write architecture decision record',
      'Create evaluation framework',
      'Review and improve system',
    ],
    assessmentTypes: [
      'Decision justification',
      'Trade-off analysis',
      'Technical proposal',
    ],
  },
  CREATE: {
    order: 6,
    description: 'Produce new or original work',
    verbs: ['design', 'create', 'develop', 'formulate', 'author', 'invent'],
    courseActivities: [
      'Design systems from scratch',
      'Create new patterns',
      'Develop original solutions',
      'Lead technical innovation',
    ],
    projectTypes: [
      'Design and build novel system',
      'Create reusable library',
      'Develop new methodology',
    ],
    assessmentTypes: ['Portfolio project', 'Original creation', 'Innovation showcase'],
  },
};

// =============================================================================
// COURSE NAMING CONVENTIONS
// =============================================================================

/**
 * Course title templates for consistent naming.
 * Format: "[Topic]: [Specific Focus] - [Outcome]"
 */
export const COURSE_TITLE_TEMPLATES = {
  foundational: [
    '{skill} Fundamentals: Core Concepts and Terminology',
    'Introduction to {skill}: Building Your Foundation',
    '{skill} Essentials: What Every Developer Should Know',
    'Getting Started with {skill}: First Steps to Mastery',
  ],
  conceptual: [
    'Understanding {topic}: How {skill} Works Under the Hood',
    '{skill} Deep Dive: {topic} Explained',
    'Mastering {topic} in {skill}: From Theory to Practice',
    '{topic} Patterns in {skill}: Best Practices Guide',
  ],
  practical: [
    'Building with {skill}: {topic} in Action',
    'Hands-On {skill}: Creating {project_type}',
    '{skill} Workshop: Implementing {feature}',
    'Practical {skill}: Real-World {topic} Projects',
  ],
  advanced: [
    'Advanced {skill}: {topic} Optimization Techniques',
    '{skill} Architecture: Designing Scalable {topic}',
    'Performance Tuning {skill}: {topic} at Scale',
    'Enterprise {skill}: Production-Ready {topic}',
  ],
  expert: [
    '{skill} Internals: How {topic} Really Works',
    'Contributing to {skill}: {topic} Development',
    '{skill} Innovation: Creating New {topic} Patterns',
    'Leading {skill} Teams: {topic} Strategy and Vision',
  ],
};

// =============================================================================
// DIFFICULTY PROGRESSION RULES
// =============================================================================

/**
 * Rules for difficulty progression across phases.
 */
export const DIFFICULTY_PROGRESSION_RULES = {
  /**
   * Maximum difficulty jump between consecutive phases.
   * Prevents BEGINNER → ADVANCED jumps.
   */
  maxDifficultyJump: 1,

  /**
   * Difficulty mapping to proficiency levels.
   */
  difficultyToLevel: {
    BEGINNER: ['NOVICE', 'BEGINNER'],
    INTERMEDIATE: ['BEGINNER', 'COMPETENT', 'PROFICIENT'],
    ADVANCED: ['PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'],
  } as Record<string, ProficiencyLevel[]>,

  /**
   * Course difficulty progression within a phase.
   * First course can be same level, subsequent should build.
   */
  withinPhaseProgression: [0, 0, 1], // [first course offset, second, third]

  /**
   * How difficulty should progress based on phase number.
   */
  getPhaseBaseDifficulty(
    phaseNumber: number,
    totalPhases: number,
    startLevel: ProficiencyLevel,
    endLevel: ProficiencyLevel
  ): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
    const startIdx = PROFICIENCY_DEFINITIONS[startLevel].level;
    const endIdx = PROFICIENCY_DEFINITIONS[endLevel].level;
    const progress = phaseNumber / totalPhases;

    const currentIdx = startIdx + (endIdx - startIdx) * progress;

    if (currentIdx <= 2) return 'BEGINNER';
    if (currentIdx <= 4) return 'INTERMEDIATE';
    return 'ADVANCED';
  },
};

// =============================================================================
// TIME ESTIMATION FORMULAS
// =============================================================================

/**
 * Time estimation guidelines for AI.
 */
export const TIME_ESTIMATION = {
  /**
   * Base hours per course by difficulty.
   */
  courseHoursByDifficulty: {
    BEGINNER: { min: 4, max: 8, typical: 6 },
    INTERMEDIATE: { min: 8, max: 16, typical: 12 },
    ADVANCED: { min: 12, max: 24, typical: 18 },
  },

  /**
   * Project hours by difficulty.
   */
  projectHoursByDifficulty: {
    BEGINNER: { min: 2, max: 6, typical: 4 },
    INTERMEDIATE: { min: 6, max: 12, typical: 8 },
    ADVANCED: { min: 10, max: 20, typical: 15 },
  },

  /**
   * Calculate total hours between proficiency levels.
   */
  getHoursBetweenLevels(from: ProficiencyLevel, to: ProficiencyLevel): number {
    const fromHours = PROFICIENCY_DEFINITIONS[from].typicalHoursToReach;
    const toHours = PROFICIENCY_DEFINITIONS[to].typicalHoursToReach;
    return Math.max(toHours - fromHours, 20);
  },

  /**
   * Calculate weeks needed based on hours per week.
   */
  getWeeksNeeded(totalHours: number, hoursPerWeek: number): number {
    return Math.ceil(totalHours / hoursPerWeek);
  },
};

// =============================================================================
// PREREQUISITE RULES
// =============================================================================

/**
 * Rules for defining prerequisites between phases and courses.
 */
export const PREREQUISITE_RULES = {
  /**
   * Phase N always requires Phase N-1 (unless N=1).
   */
  sequentialPhases: true,

  /**
   * Within a phase, courses should specify which concepts they depend on.
   */
  coursePrerequisites: true,

  /**
   * Template for AI to specify prerequisites.
   */
  prerequisiteFormat: {
    phase: 'Requires completion of Phase {n-1}',
    course: 'Requires understanding of: {concept_list}',
    skill: 'Builds on: {skill_list}',
  },
};

// =============================================================================
// LEARNING STYLE ADAPTATIONS
// =============================================================================

/**
 * How to adapt roadmap based on learning style.
 */
export const LEARNING_STYLE_ADAPTATIONS: Record<
  LearningStyle,
  {
    description: string;
    courseRatio: { theory: number; practice: number };
    projectEmphasis: 'low' | 'medium' | 'high';
    assessmentStyle: string;
    phaseStructure: string;
  }
> = {
  STRUCTURED: {
    description: 'Prefers systematic, step-by-step learning',
    courseRatio: { theory: 60, practice: 40 },
    projectEmphasis: 'medium',
    assessmentStyle: 'Formal quizzes and tests after each topic',
    phaseStructure:
      'Start with theory courses, then apply in controlled exercises, finally practice in projects',
  },
  PROJECT_BASED: {
    description: 'Learns best by doing, diving into projects early',
    courseRatio: { theory: 30, practice: 70 },
    projectEmphasis: 'high',
    assessmentStyle: 'Project deliverables and code reviews',
    phaseStructure:
      'Start with minimal theory, introduce concept via project, learn details as needed',
  },
  MIXED: {
    description: 'Balanced approach with both theory and practice',
    courseRatio: { theory: 45, practice: 55 },
    projectEmphasis: 'medium',
    assessmentStyle: 'Mix of quizzes, exercises, and project deliverables',
    phaseStructure:
      'Alternate between conceptual learning and hands-on application',
  },
};

// =============================================================================
// MAIN PROMPT BUILDER
// =============================================================================

/**
 * Builds the comprehensive AI prompt for roadmap generation.
 */
export function buildComprehensiveRoadmapPrompt(
  input: RoadmapGenerationInput
): string {
  const {
    skillName,
    currentLevel,
    targetLevel,
    hoursPerWeek,
    learningStyle,
    includeAssessments,
    prioritizeQuickWins,
  } = input;

  const currentDef = PROFICIENCY_DEFINITIONS[currentLevel];
  const targetDef = PROFICIENCY_DEFINITIONS[targetLevel];
  const styleAdaptation = LEARNING_STYLE_ADAPTATIONS[learningStyle];
  const totalHours = TIME_ESTIMATION.getHoursBetweenLevels(
    currentLevel,
    targetLevel
  );
  const totalWeeks = TIME_ESTIMATION.getWeeksNeeded(totalHours, hoursPerWeek);

  // Determine appropriate number of phases
  const levelJump = targetDef.level - currentDef.level;
  const numPhases = Math.min(Math.max(levelJump + 2, 4), 7);

  // Determine Bloom's levels to cover
  const bloomsToInclude = getBloomsRangeForJourney(currentLevel, targetLevel);

  return `You are an expert instructional designer and learning architect. Your task is to create a comprehensive, pedagogically-sound skill development roadmap.

═══════════════════════════════════════════════════════════════════════════════
LEARNER PROFILE
═══════════════════════════════════════════════════════════════════════════════

SKILL TO LEARN: ${skillName}
CURRENT LEVEL: ${currentLevel} (Level ${currentDef.level}/7)
  └─ What they can do now: ${currentDef.canDo.slice(0, 2).join(', ')}

TARGET LEVEL: ${targetLevel} (Level ${targetDef.level}/7)
  └─ What they should be able to do: ${targetDef.canDo.slice(0, 2).join(', ')}

TIME COMMITMENT: ${hoursPerWeek} hours/week
ESTIMATED TOTAL: ~${totalHours} hours over ~${totalWeeks} weeks
LEARNING STYLE: ${learningStyle}
  └─ ${styleAdaptation.description}
  └─ Theory/Practice Ratio: ${styleAdaptation.courseRatio.theory}% / ${styleAdaptation.courseRatio.practice}%

═══════════════════════════════════════════════════════════════════════════════
PEDAGOGICAL FRAMEWORK (YOU MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

1. BLOOM'S TAXONOMY PROGRESSION
   You MUST progress through cognitive levels in order. Use these levels:
   ${bloomsToInclude
     .map((b) => {
       const guide = BLOOMS_TAXONOMY_GUIDE[b];
       return `
   ${b} (Level ${guide.order}):
     - Description: ${guide.description}
     - Use verbs like: ${guide.verbs.slice(0, 4).join(', ')}
     - Course activities: ${guide.courseActivities.slice(0, 2).join(', ')}
     - Project types: ${guide.projectTypes[0]}`;
     })
     .join('\n')}

2. DIFFICULTY PROGRESSION RULES
   - Phase 1 MUST start at ${getDifficultyForLevel(currentLevel)} difficulty
   - Each phase can only increase difficulty by ONE level (BEGINNER→INTERMEDIATE→ADVANCED)
   - Final phase should reach ${getDifficultyForLevel(targetLevel)} difficulty
   - Within each phase: First course = phase difficulty, subsequent courses can be same or +1

3. PREREQUISITE CHAIN
   - Each phase MUST list what the learner should know before starting
   - Courses within a phase should reference concepts from earlier courses
   - Skills should build cumulatively (no orphan skills that don't get used)

4. TIME ALLOCATION GUIDELINES
   - BEGINNER courses: 4-8 hours (typical: 6h)
   - INTERMEDIATE courses: 8-16 hours (typical: 12h)
   - ADVANCED courses: 12-24 hours (typical: 18h)
   - Projects should be 30-50% of phase time
   - Total phase hours should be realistic for ${hoursPerWeek}h/week over 2-4 weeks

═══════════════════════════════════════════════════════════════════════════════
COURSE NAMING CONVENTIONS (MANDATORY FORMAT)
═══════════════════════════════════════════════════════════════════════════════

Course titles MUST follow this format:
"[Skill/Topic]: [Specific Focus] - [Learning Outcome]"

Examples by phase position:
- Phase 1: "${skillName} Fundamentals: Core Concepts and Terminology"
- Phase 2: "Understanding ${skillName}: [Specific Topic] Explained"
- Phase 3: "Building with ${skillName}: [Project Type] in Action"
- Phase 4+: "Advanced ${skillName}: [Topic] Optimization Techniques"

Course descriptions MUST include:
1. What the learner will learn (2-3 specific outcomes)
2. Key topics covered (3-5 bullet points)
3. Practical application mentioned
Length: 60-100 words

═══════════════════════════════════════════════════════════════════════════════
LEARNING STYLE ADAPTATION: ${learningStyle}
═══════════════════════════════════════════════════════════════════════════════

${styleAdaptation.phaseStructure}

Project Emphasis: ${styleAdaptation.projectEmphasis.toUpperCase()}
${
  styleAdaptation.projectEmphasis === 'high'
    ? '- Include 2 substantial projects per phase\n- Projects should drive the learning'
    : styleAdaptation.projectEmphasis === 'low'
      ? '- Include 1 reinforcement project per phase\n- Focus on concept mastery first'
      : '- Include 1-2 balanced projects per phase\n- Projects complement course learning'
}

Assessment Style: ${styleAdaptation.assessmentStyle}

${
  prioritizeQuickWins
    ? `
QUICK WINS PRIORITY: ENABLED
- Phase 1 should include at least one immediately applicable skill
- Early courses should show practical value within 2-4 hours
- Include "milestone achievements" that boost confidence`
    : ''
}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Generate exactly ${numPhases} phases. Return ONLY valid JSON (no markdown, no code blocks):

{
  "title": "Descriptive roadmap title mentioning ${skillName}",
  "description": "One compelling sentence about the learning journey",
  "totalEstimatedHours": ${totalHours},
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase title following naming convention",
      "description": "2-3 sentences: What this phase covers and why it matters",
      "bloomsLevel": "${bloomsToInclude[0]}",
      "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
      "estimatedHours": <number>,
      "durationWeeks": <number based on ${hoursPerWeek}h/week>,
      "prerequisites": "What learner should know before this phase",
      "learningObjectives": [
        "By the end of this phase, learner will be able to...",
        "...(2-4 specific, measurable objectives using Bloom's verbs)"
      ],
      "skills": [
        {
          "skillName": "Specific sub-skill name",
          "targetLevel": "BEGINNER|COMPETENT|PROFICIENT|ADVANCED",
          "estimatedHours": <number>,
          "prerequisiteSkills": ["list of skills this builds on, or empty"]
        }
      ],
      "courses": [
        {
          "courseNumber": 1,
          "title": "Course title following naming convention",
          "description": "60-100 words: What student learns, key topics, practical application",
          "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
          "estimatedHours": <number within guidelines>,
          "learningOutcomes": ["3-4 specific outcomes using Bloom's verbs"],
          "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
          "prerequisiteConcepts": ["Concepts from earlier courses needed"],
          "reason": "Why this course is essential at this point in the journey"
        }
      ],
      "projects": [
        {
          "title": "Hands-on project title",
          "description": "What they'll build and what skills it reinforces",
          "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED",
          "estimatedHours": <number>,
          "deliverables": ["Specific deliverable 1", "Specific deliverable 2"],
          "skillsApplied": ["Skills from this phase that project uses"]
        }
      ],
      "assessmentCriteria": "${includeAssessments ? 'Specific criteria to prove mastery of this phase' : 'Self-assessment through project completion'}"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
VALIDATION RULES (AI MUST SELF-CHECK)
═══════════════════════════════════════════════════════════════════════════════

Before returning, verify:
✓ Phase 1 bloom's level is ${bloomsToInclude[0]} (lowest appropriate for journey)
✓ Final phase bloom's level is ${bloomsToInclude[bloomsToInclude.length - 1]} (highest for target)
✓ No phase skips more than 1 Bloom's level
✓ Total hours across all phases ≈ ${totalHours} (±15%)
✓ Each phase has 2-3 courses and 1-2 projects
✓ Course titles follow the naming convention with colons
✓ Descriptions are 60-100 words with specific outcomes
✓ Difficulty never decreases from phase to phase
✓ All prerequisite references are valid (no referencing future content)
✓ Hours per course match difficulty guidelines

Return ONLY the JSON object. No explanations, no markdown formatting.`;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the appropriate Bloom's levels for a learning journey.
 */
function getBloomsRangeForJourney(
  from: ProficiencyLevel,
  to: ProficiencyLevel
): BloomsLevel[] {
  const fromDef = PROFICIENCY_DEFINITIONS[from];
  const toDef = PROFICIENCY_DEFINITIONS[to];

  // Get all bloom's levels between from and to
  const allLevels: BloomsLevel[] = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ];

  const startLevel = fromDef.bloomsRange[0];
  const endLevel = toDef.bloomsRange[toDef.bloomsRange.length - 1];

  const startIdx = allLevels.indexOf(startLevel);
  const endIdx = allLevels.indexOf(endLevel);

  return allLevels.slice(startIdx, endIdx + 1);
}

/**
 * Get appropriate difficulty for a proficiency level.
 */
function getDifficultyForLevel(
  level: ProficiencyLevel
): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' {
  const levelNum = PROFICIENCY_DEFINITIONS[level].level;
  if (levelNum <= 2) return 'BEGINNER';
  if (levelNum <= 4) return 'INTERMEDIATE';
  return 'ADVANCED';
}

// =============================================================================
// RESPONSE VALIDATION SCHEMA
// =============================================================================

/**
 * Zod schema for validating AI response structure.
 */
export const AIRoadmapResponseSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(20).max(200),
  totalEstimatedHours: z.number().min(10).max(2000),
  phases: z
    .array(
      z.object({
        phaseNumber: z.number().min(1).max(10),
        title: z.string().min(10).max(100),
        description: z.string().min(50).max(500),
        bloomsLevel: z.enum([
          'REMEMBER',
          'UNDERSTAND',
          'APPLY',
          'ANALYZE',
          'EVALUATE',
          'CREATE',
        ]),
        difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
        estimatedHours: z.number().min(4).max(200),
        durationWeeks: z.number().min(1).max(20),
        prerequisites: z.string(),
        learningObjectives: z.array(z.string()).min(2).max(6),
        skills: z
          .array(
            z.object({
              skillName: z.string().min(3).max(100),
              targetLevel: z.enum([
                'BEGINNER',
                'COMPETENT',
                'PROFICIENT',
                'ADVANCED',
              ]),
              estimatedHours: z.number().min(1).max(100),
              prerequisiteSkills: z.array(z.string()),
            })
          )
          .min(1)
          .max(5),
        courses: z
          .array(
            z.object({
              courseNumber: z.number().min(1).max(5),
              title: z.string().min(15).max(100),
              description: z.string().min(60).max(500),
              difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
              estimatedHours: z.number().min(2).max(30),
              learningOutcomes: z.array(z.string()).min(2).max(6),
              keyTopics: z.array(z.string()).min(2).max(8),
              prerequisiteConcepts: z.array(z.string()),
              reason: z.string().min(20).max(200),
            })
          )
          .min(2)
          .max(4),
        projects: z
          .array(
            z.object({
              title: z.string().min(10).max(100),
              description: z.string().min(30).max(300),
              difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
              estimatedHours: z.number().min(2).max(30),
              deliverables: z.array(z.string()).min(1).max(5),
              skillsApplied: z.array(z.string()).min(1).max(5),
            })
          )
          .min(1)
          .max(3),
        assessmentCriteria: z.string().min(20).max(300),
      })
    )
    .min(3)
    .max(8),
});

export type AIRoadmapResponse = z.infer<typeof AIRoadmapResponseSchema>;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates the AI response and returns structured errors if invalid.
 */
export function validateAIResponse(data: unknown): {
  valid: boolean;
  data?: AIRoadmapResponse;
  errors?: string[];
} {
  try {
    const parsed = AIRoadmapResponseSchema.parse(data);

    // Additional semantic validations
    const errors: string[] = [];

    // Check Bloom's progression
    const bloomsOrder: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };

    for (let i = 1; i < parsed.phases.length; i++) {
      const prevLevel = parsed.phases[i - 1].bloomsLevel;
      const currLevel = parsed.phases[i].bloomsLevel;
      const jump = bloomsOrder[currLevel] - bloomsOrder[prevLevel];

      if (jump > 2) {
        errors.push(
          `Phase ${i + 1} skips Bloom's levels (${prevLevel} → ${currLevel})`
        );
      }
      if (jump < 0) {
        errors.push(
          `Phase ${i + 1} goes backwards in Bloom's levels (${prevLevel} → ${currLevel})`
        );
      }
    }

    // Check difficulty progression
    const difficultyOrder = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

    for (let i = 1; i < parsed.phases.length; i++) {
      const prevDiff = parsed.phases[i - 1].difficulty;
      const currDiff = parsed.phases[i].difficulty;

      if (difficultyOrder[currDiff] < difficultyOrder[prevDiff]) {
        errors.push(
          `Phase ${i + 1} decreases difficulty (${prevDiff} → ${currDiff})`
        );
      }
    }

    // Check total hours reasonableness
    const totalFromPhases = parsed.phases.reduce(
      (sum, p) => sum + p.estimatedHours,
      0
    );
    const variance = Math.abs(totalFromPhases - parsed.totalEstimatedHours);
    if (variance > parsed.totalEstimatedHours * 0.2) {
      errors.push(
        `Total hours mismatch: stated ${parsed.totalEstimatedHours}h but phases sum to ${totalFromPhases}h`
      );
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: parsed };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return {
        valid: false,
        errors: e.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: [e instanceof Error ? e.message : 'Unknown validation error'],
    };
  }
}
