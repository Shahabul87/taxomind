/**
 * Framework Definitions
 * Enhanced Depth Analysis - January 2026
 *
 * Comprehensive definitions for multiple taxonomy frameworks:
 * - Bloom's Taxonomy (Revised) - Anderson & Krathwohl (2001)
 * - Webb's Depth of Knowledge - Webb (1997)
 * - SOLO Taxonomy - Biggs & Collis (1982)
 * - Fink's Significant Learning - Fink (2003)
 * - Marzano's New Taxonomy - Marzano & Kendall (2007)
 */

import type { CourseType } from '../types/depth-analysis.types';
import type {
  TaxonomyFramework,
  TaxonomyLevel,
  FrameworkMapping,
  FrameworkWeights,
  FrameworkType,
} from './types';

// ═══════════════════════════════════════════════════════════════
// BLOOM'S TAXONOMY (REVISED)
// ═══════════════════════════════════════════════════════════════

const BLOOMS_LEVELS: TaxonomyLevel[] = [
  {
    id: 'REMEMBER',
    name: 'Remember',
    weight: 1,
    description: 'Retrieving relevant knowledge from long-term memory',
    keywords: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'memorize', 'label', 'state'],
    verbs: ['define', 'duplicate', 'list', 'memorize', 'recall', 'repeat', 'reproduce', 'state'],
  },
  {
    id: 'UNDERSTAND',
    name: 'Understand',
    weight: 2,
    description: 'Constructing meaning from instructional messages',
    keywords: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'infer', 'paraphrase', 'discuss'],
    verbs: ['classify', 'describe', 'discuss', 'explain', 'identify', 'locate', 'recognize', 'report', 'select', 'translate'],
  },
  {
    id: 'APPLY',
    name: 'Apply',
    weight: 3,
    description: 'Carrying out or using a procedure in a given situation',
    keywords: ['apply', 'implement', 'execute', 'use', 'demonstrate', 'solve', 'compute', 'operate', 'perform'],
    verbs: ['execute', 'implement', 'solve', 'use', 'demonstrate', 'interpret', 'operate', 'schedule', 'sketch'],
  },
  {
    id: 'ANALYZE',
    name: 'Analyze',
    weight: 4,
    description: 'Breaking material into parts and determining relationships',
    keywords: ['analyze', 'differentiate', 'organize', 'attribute', 'examine', 'investigate', 'dissect', 'contrast'],
    verbs: ['differentiate', 'organize', 'relate', 'compare', 'contrast', 'distinguish', 'examine', 'experiment', 'question'],
  },
  {
    id: 'EVALUATE',
    name: 'Evaluate',
    weight: 5,
    description: 'Making judgments based on criteria and standards',
    keywords: ['evaluate', 'judge', 'critique', 'assess', 'argue', 'defend', 'justify', 'appraise', 'prioritize'],
    verbs: ['appraise', 'argue', 'defend', 'judge', 'select', 'support', 'value', 'critique', 'weigh'],
  },
  {
    id: 'CREATE',
    name: 'Create',
    weight: 6,
    description: 'Putting elements together to form a coherent whole',
    keywords: ['create', 'design', 'develop', 'produce', 'construct', 'generate', 'compose', 'synthesize', 'invent'],
    verbs: ['design', 'assemble', 'construct', 'conjecture', 'develop', 'formulate', 'author', 'investigate'],
  },
];

export const BLOOMS_FRAMEWORK: TaxonomyFramework = {
  type: 'blooms',
  name: "Bloom's Taxonomy (Revised)",
  citation: 'Anderson & Krathwohl (2001)',
  description: 'A classification system for educational objectives based on cognitive complexity',
  levels: BLOOMS_LEVELS,
  mappings: [], // Bloom's is often the reference framework
  idealDistributions: {
    foundational: { REMEMBER: 30, UNDERSTAND: 35, APPLY: 20, ANALYZE: 10, EVALUATE: 3, CREATE: 2 },
    intermediate: { REMEMBER: 15, UNDERSTAND: 25, APPLY: 30, ANALYZE: 20, EVALUATE: 7, CREATE: 3 },
    advanced: { REMEMBER: 5, UNDERSTAND: 15, APPLY: 25, ANALYZE: 30, EVALUATE: 15, CREATE: 10 },
    professional: { REMEMBER: 5, UNDERSTAND: 15, APPLY: 30, ANALYZE: 25, EVALUATE: 15, CREATE: 10 },
    creative: { REMEMBER: 5, UNDERSTAND: 10, APPLY: 20, ANALYZE: 25, EVALUATE: 15, CREATE: 25 },
    technical: { REMEMBER: 10, UNDERSTAND: 20, APPLY: 35, ANALYZE: 25, EVALUATE: 7, CREATE: 3 },
    theoretical: { REMEMBER: 10, UNDERSTAND: 25, APPLY: 15, ANALYZE: 30, EVALUATE: 15, CREATE: 5 },
  },
};

// ═══════════════════════════════════════════════════════════════
// WEBB'S DEPTH OF KNOWLEDGE (DOK)
// ═══════════════════════════════════════════════════════════════

const DOK_LEVELS: TaxonomyLevel[] = [
  {
    id: '1',
    name: 'Recall and Reproduction',
    weight: 1,
    description: 'Recall of information such as facts, definitions, terms, or simple procedures',
    keywords: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'memorize', 'label'],
    verbs: ['define', 'identify', 'label', 'list', 'match', 'memorize', 'name', 'recall', 'recite'],
  },
  {
    id: '2',
    name: 'Skills and Concepts',
    weight: 2,
    description: 'Use of information, conceptual knowledge, and procedures',
    keywords: ['summarize', 'interpret', 'classify', 'compare', 'organize', 'estimate', 'predict', 'explain'],
    verbs: ['classify', 'compare', 'explain', 'interpret', 'organize', 'predict', 'summarize'],
  },
  {
    id: '3',
    name: 'Strategic Thinking',
    weight: 3,
    description: 'Reasoning, planning, and using evidence to solve problems',
    keywords: ['analyze', 'investigate', 'formulate', 'differentiate', 'conclude', 'critique', 'assess', 'justify'],
    verbs: ['analyze', 'assess', 'conclude', 'critique', 'differentiate', 'formulate', 'hypothesize', 'investigate'],
  },
  {
    id: '4',
    name: 'Extended Thinking',
    weight: 4,
    description: 'Complex reasoning, planning, developing, and thinking over extended time',
    keywords: ['design', 'create', 'synthesize', 'connect', 'critique across', 'prove', 'research', 'develop'],
    verbs: ['apply concepts', 'connect', 'create', 'critique', 'design', 'prove', 'synthesize'],
  },
];

const DOK_TO_BLOOMS_MAPPINGS: FrameworkMapping[] = [
  { fromLevel: '1', toLevel: 'REMEMBER', confidence: 0.95, notes: 'Direct mapping for recall tasks' },
  { fromLevel: '2', toLevel: ['UNDERSTAND', 'APPLY'], confidence: 0.85, notes: 'Spans understanding and basic application' },
  { fromLevel: '3', toLevel: ['ANALYZE', 'EVALUATE'], confidence: 0.80, notes: 'Requires analysis and evaluation' },
  { fromLevel: '4', toLevel: 'CREATE', confidence: 0.85, notes: 'Extended thinking maps to creation' },
];

export const DOK_FRAMEWORK: TaxonomyFramework = {
  type: 'dok',
  name: "Webb's Depth of Knowledge",
  citation: 'Webb (1997)',
  description: 'Measures cognitive demand of standards, activities, and assessments',
  levels: DOK_LEVELS,
  mappings: DOK_TO_BLOOMS_MAPPINGS,
  idealDistributions: {
    foundational: { '1': 40, '2': 40, '3': 15, '4': 5 },
    intermediate: { '1': 20, '2': 40, '3': 30, '4': 10 },
    advanced: { '1': 10, '2': 25, '3': 40, '4': 25 },
    professional: { '1': 10, '2': 30, '3': 40, '4': 20 },
    creative: { '1': 5, '2': 20, '3': 35, '4': 40 },
    technical: { '1': 15, '2': 35, '3': 35, '4': 15 },
    theoretical: { '1': 10, '2': 30, '3': 40, '4': 20 },
  },
};

// ═══════════════════════════════════════════════════════════════
// SOLO TAXONOMY
// ═══════════════════════════════════════════════════════════════

const SOLO_LEVELS: TaxonomyLevel[] = [
  {
    id: 'prestructural',
    name: 'Prestructural',
    weight: 1,
    description: 'Student misses the point or uses irrelevant information',
    keywords: ['miss', 'irrelevant', 'confused', 'unrelated'],
    verbs: ['miss', 'fail to understand'],
  },
  {
    id: 'unistructural',
    name: 'Unistructural',
    weight: 2,
    description: 'Student focuses on one relevant aspect',
    keywords: ['identify', 'name', 'follow simple procedure'],
    verbs: ['identify', 'name', 'follow', 'memorize', 'define'],
  },
  {
    id: 'multistructural',
    name: 'Multistructural',
    weight: 3,
    description: 'Student focuses on several relevant aspects but treats them independently',
    keywords: ['describe', 'list', 'enumerate', 'combine', 'classify'],
    verbs: ['describe', 'list', 'classify', 'combine', 'outline'],
  },
  {
    id: 'relational',
    name: 'Relational',
    weight: 4,
    description: 'Student integrates aspects into a coherent whole',
    keywords: ['compare', 'contrast', 'explain causes', 'analyze', 'relate', 'apply'],
    verbs: ['compare', 'contrast', 'explain', 'analyze', 'relate', 'apply'],
  },
  {
    id: 'extended_abstract',
    name: 'Extended Abstract',
    weight: 5,
    description: 'Student generalizes structure beyond what was given, creates new ideas',
    keywords: ['generalize', 'hypothesize', 'theorize', 'create', 'reflect', 'generate'],
    verbs: ['theorize', 'generalize', 'hypothesize', 'reflect', 'generate', 'create'],
  },
];

const SOLO_TO_BLOOMS_MAPPINGS: FrameworkMapping[] = [
  { fromLevel: 'prestructural', toLevel: 'REMEMBER', confidence: 0.60, notes: 'Below basic recall' },
  { fromLevel: 'unistructural', toLevel: 'REMEMBER', confidence: 0.85, notes: 'Single aspect recall' },
  { fromLevel: 'multistructural', toLevel: 'UNDERSTAND', confidence: 0.80, notes: 'Multiple aspects, understanding' },
  { fromLevel: 'relational', toLevel: ['APPLY', 'ANALYZE'], confidence: 0.85, notes: 'Integration requires analysis' },
  { fromLevel: 'extended_abstract', toLevel: ['EVALUATE', 'CREATE'], confidence: 0.85, notes: 'Generalization and creation' },
];

export const SOLO_FRAMEWORK: TaxonomyFramework = {
  type: 'solo',
  name: 'SOLO Taxonomy',
  citation: 'Biggs & Collis (1982)',
  description: 'Structure of Observed Learning Outcomes - measures quality of learning',
  levels: SOLO_LEVELS,
  mappings: SOLO_TO_BLOOMS_MAPPINGS,
  idealDistributions: {
    foundational: { prestructural: 0, unistructural: 30, multistructural: 40, relational: 25, extended_abstract: 5 },
    intermediate: { prestructural: 0, unistructural: 15, multistructural: 30, relational: 40, extended_abstract: 15 },
    advanced: { prestructural: 0, unistructural: 5, multistructural: 20, relational: 45, extended_abstract: 30 },
    professional: { prestructural: 0, unistructural: 5, multistructural: 25, relational: 45, extended_abstract: 25 },
    creative: { prestructural: 0, unistructural: 5, multistructural: 15, relational: 40, extended_abstract: 40 },
    technical: { prestructural: 0, unistructural: 10, multistructural: 30, relational: 45, extended_abstract: 15 },
    theoretical: { prestructural: 0, unistructural: 5, multistructural: 25, relational: 45, extended_abstract: 25 },
  },
};

// ═══════════════════════════════════════════════════════════════
// FINK'S SIGNIFICANT LEARNING TAXONOMY
// ═══════════════════════════════════════════════════════════════

const FINK_LEVELS: TaxonomyLevel[] = [
  {
    id: 'foundational_knowledge',
    name: 'Foundational Knowledge',
    weight: 1,
    description: 'Understanding and remembering information and ideas',
    keywords: ['understand', 'remember', 'know', 'information', 'ideas', 'concepts'],
    verbs: ['understand', 'remember', 'identify', 'recognize', 'describe'],
  },
  {
    id: 'application',
    name: 'Application',
    weight: 2,
    description: 'Skills, critical/creative/practical thinking, managing projects',
    keywords: ['apply', 'use', 'skills', 'thinking', 'practical', 'manage', 'project'],
    verbs: ['apply', 'use', 'perform', 'manage', 'think critically', 'solve'],
  },
  {
    id: 'integration',
    name: 'Integration',
    weight: 3,
    description: 'Connecting ideas, people, realms of life',
    keywords: ['connect', 'relate', 'integrate', 'interdisciplinary', 'link', 'combine'],
    verbs: ['connect', 'relate', 'integrate', 'combine', 'synthesize', 'link'],
  },
  {
    id: 'human_dimension',
    name: 'Human Dimension',
    weight: 4,
    description: 'Learning about oneself and others',
    keywords: ['self', 'others', 'interact', 'personal', 'social', 'collaborate'],
    verbs: ['interact', 'collaborate', 'reflect on self', 'understand others'],
  },
  {
    id: 'caring',
    name: 'Caring',
    weight: 5,
    description: 'Developing new feelings, interests, and values',
    keywords: ['care', 'value', 'interest', 'feeling', 'motivation', 'ethics'],
    verbs: ['care about', 'value', 'become interested', 'be motivated'],
  },
  {
    id: 'learning_how_to_learn',
    name: 'Learning How to Learn',
    weight: 6,
    description: 'Becoming a better student, learning about learning',
    keywords: ['metacognition', 'self-directed', 'inquiry', 'autonomous', 'reflect'],
    verbs: ['self-direct', 'inquire', 'reflect on learning', 'become autonomous'],
  },
];

const FINK_TO_BLOOMS_MAPPINGS: FrameworkMapping[] = [
  { fromLevel: 'foundational_knowledge', toLevel: ['REMEMBER', 'UNDERSTAND'], confidence: 0.90, notes: 'Knowledge base' },
  { fromLevel: 'application', toLevel: ['APPLY', 'ANALYZE'], confidence: 0.85, notes: 'Application of knowledge' },
  { fromLevel: 'integration', toLevel: ['ANALYZE', 'CREATE'], confidence: 0.80, notes: 'Connecting concepts' },
  { fromLevel: 'human_dimension', toLevel: 'EVALUATE', confidence: 0.70, notes: 'Personal/social reflection' },
  { fromLevel: 'caring', toLevel: 'EVALUATE', confidence: 0.65, notes: 'Values and ethics' },
  { fromLevel: 'learning_how_to_learn', toLevel: ['EVALUATE', 'CREATE'], confidence: 0.75, notes: 'Metacognition' },
];

export const FINK_FRAMEWORK: TaxonomyFramework = {
  type: 'fink',
  name: "Fink's Significant Learning Taxonomy",
  citation: 'Fink (2003)',
  description: 'Non-hierarchical taxonomy focusing on significant learning experiences',
  levels: FINK_LEVELS,
  mappings: FINK_TO_BLOOMS_MAPPINGS,
  idealDistributions: {
    foundational: { foundational_knowledge: 35, application: 25, integration: 15, human_dimension: 10, caring: 10, learning_how_to_learn: 5 },
    intermediate: { foundational_knowledge: 25, application: 30, integration: 20, human_dimension: 10, caring: 5, learning_how_to_learn: 10 },
    advanced: { foundational_knowledge: 15, application: 25, integration: 25, human_dimension: 15, caring: 5, learning_how_to_learn: 15 },
    professional: { foundational_knowledge: 15, application: 30, integration: 20, human_dimension: 15, caring: 10, learning_how_to_learn: 10 },
    creative: { foundational_knowledge: 10, application: 20, integration: 30, human_dimension: 15, caring: 10, learning_how_to_learn: 15 },
    technical: { foundational_knowledge: 20, application: 35, integration: 20, human_dimension: 10, caring: 5, learning_how_to_learn: 10 },
    theoretical: { foundational_knowledge: 25, application: 20, integration: 25, human_dimension: 10, caring: 5, learning_how_to_learn: 15 },
  },
};

// ═══════════════════════════════════════════════════════════════
// MARZANO'S NEW TAXONOMY
// ═══════════════════════════════════════════════════════════════

const MARZANO_LEVELS: TaxonomyLevel[] = [
  {
    id: 'retrieval',
    name: 'Retrieval',
    weight: 1,
    description: 'Recalling and recognizing information',
    keywords: ['recall', 'recognize', 'execute', 'retrieve', 'remember'],
    verbs: ['recall', 'recognize', 'execute', 'identify', 'name', 'list'],
  },
  {
    id: 'comprehension',
    name: 'Comprehension',
    weight: 2,
    description: 'Integrating and symbolizing knowledge',
    keywords: ['integrate', 'symbolize', 'translate', 'represent', 'summarize'],
    verbs: ['integrate', 'symbolize', 'translate', 'represent', 'summarize', 'describe'],
  },
  {
    id: 'analysis',
    name: 'Analysis',
    weight: 3,
    description: 'Matching, classifying, analyzing errors, generalizing, specifying',
    keywords: ['match', 'classify', 'error analysis', 'generalize', 'specify', 'analyze'],
    verbs: ['match', 'classify', 'analyze', 'generalize', 'specify', 'categorize'],
  },
  {
    id: 'knowledge_utilization',
    name: 'Knowledge Utilization',
    weight: 4,
    description: 'Decision making, problem solving, experimenting, investigating',
    keywords: ['decide', 'problem solve', 'experiment', 'investigate', 'apply'],
    verbs: ['decide', 'solve problems', 'experiment', 'investigate', 'apply', 'research'],
  },
  {
    id: 'metacognition',
    name: 'Metacognition',
    weight: 5,
    description: 'Specifying goals, process monitoring, clarity and accuracy',
    keywords: ['goals', 'monitor', 'clarity', 'accuracy', 'reflect', 'regulate'],
    verbs: ['set goals', 'monitor', 'regulate', 'reflect', 'evaluate process'],
  },
  {
    id: 'self_system',
    name: 'Self-System Thinking',
    weight: 6,
    description: 'Examining importance, efficacy, emotional response, motivation',
    keywords: ['importance', 'efficacy', 'emotional', 'motivation', 'beliefs', 'values'],
    verbs: ['examine importance', 'assess efficacy', 'respond emotionally', 'be motivated'],
  },
];

const MARZANO_TO_BLOOMS_MAPPINGS: FrameworkMapping[] = [
  { fromLevel: 'retrieval', toLevel: 'REMEMBER', confidence: 0.95, notes: 'Direct recall mapping' },
  { fromLevel: 'comprehension', toLevel: 'UNDERSTAND', confidence: 0.90, notes: 'Understanding and integration' },
  { fromLevel: 'analysis', toLevel: 'ANALYZE', confidence: 0.85, notes: 'Analysis processes' },
  { fromLevel: 'knowledge_utilization', toLevel: ['APPLY', 'EVALUATE'], confidence: 0.80, notes: 'Application and decision making' },
  { fromLevel: 'metacognition', toLevel: 'EVALUATE', confidence: 0.75, notes: 'Self-regulation and evaluation' },
  { fromLevel: 'self_system', toLevel: ['EVALUATE', 'CREATE'], confidence: 0.70, notes: 'Values and self-direction' },
];

export const MARZANO_FRAMEWORK: TaxonomyFramework = {
  type: 'marzano',
  name: "Marzano's New Taxonomy",
  citation: 'Marzano & Kendall (2007)',
  description: 'Comprehensive taxonomy including metacognition and self-system thinking',
  levels: MARZANO_LEVELS,
  mappings: MARZANO_TO_BLOOMS_MAPPINGS,
  idealDistributions: {
    foundational: { retrieval: 30, comprehension: 30, analysis: 20, knowledge_utilization: 10, metacognition: 5, self_system: 5 },
    intermediate: { retrieval: 15, comprehension: 25, analysis: 25, knowledge_utilization: 20, metacognition: 10, self_system: 5 },
    advanced: { retrieval: 5, comprehension: 15, analysis: 25, knowledge_utilization: 30, metacognition: 15, self_system: 10 },
    professional: { retrieval: 5, comprehension: 15, analysis: 25, knowledge_utilization: 30, metacognition: 15, self_system: 10 },
    creative: { retrieval: 5, comprehension: 10, analysis: 20, knowledge_utilization: 30, metacognition: 15, self_system: 20 },
    technical: { retrieval: 10, comprehension: 20, analysis: 30, knowledge_utilization: 25, metacognition: 10, self_system: 5 },
    theoretical: { retrieval: 10, comprehension: 20, analysis: 30, knowledge_utilization: 20, metacognition: 15, self_system: 5 },
  },
};

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK REGISTRY
// ═══════════════════════════════════════════════════════════════

export const FRAMEWORKS: Record<FrameworkType, TaxonomyFramework> = {
  blooms: BLOOMS_FRAMEWORK,
  dok: DOK_FRAMEWORK,
  solo: SOLO_FRAMEWORK,
  fink: FINK_FRAMEWORK,
  marzano: MARZANO_FRAMEWORK,
};

// ═══════════════════════════════════════════════════════════════
// COURSE-TYPE FRAMEWORK WEIGHTS
// ═══════════════════════════════════════════════════════════════

export const COURSE_TYPE_FRAMEWORK_WEIGHTS: Record<CourseType, FrameworkWeights> = {
  foundational: { blooms: 0.5, dok: 0.3, solo: 0.2 },
  intermediate: { blooms: 0.4, dok: 0.4, solo: 0.2 },
  advanced: { blooms: 0.3, dok: 0.4, solo: 0.3 },
  professional: { blooms: 0.3, dok: 0.3, fink: 0.4 },
  creative: { blooms: 0.4, dok: 0.2, solo: 0.4 },
  technical: { blooms: 0.3, dok: 0.5, marzano: 0.2 },
  theoretical: { blooms: 0.4, dok: 0.3, solo: 0.3 },
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get a framework by type
 */
export function getFramework(type: FrameworkType): TaxonomyFramework {
  return FRAMEWORKS[type];
}

/**
 * Get all available frameworks
 */
export function getAllFrameworks(): TaxonomyFramework[] {
  return Object.values(FRAMEWORKS);
}

/**
 * Get framework weights for a course type
 */
export function getFrameworkWeights(courseType: CourseType): FrameworkWeights {
  return COURSE_TYPE_FRAMEWORK_WEIGHTS[courseType];
}

/**
 * Get ideal distribution for a framework and course type
 */
export function getIdealDistribution(
  framework: FrameworkType,
  courseType: CourseType
): Record<string, number> | undefined {
  return FRAMEWORKS[framework].idealDistributions?.[courseType];
}

/**
 * Get framework level by ID
 */
export function getFrameworkLevel(
  framework: FrameworkType,
  levelId: string
): TaxonomyLevel | undefined {
  return FRAMEWORKS[framework].levels.find((l) => l.id === levelId);
}

/**
 * Get mappings from one framework to another
 */
export function getFrameworkMappings(
  fromFramework: FrameworkType,
  toFramework: FrameworkType
): FrameworkMapping[] {
  const framework = FRAMEWORKS[fromFramework];
  if (toFramework === 'blooms') {
    return framework.mappings;
  }
  // For non-Bloom's targets, we'd need to compose mappings
  return [];
}
