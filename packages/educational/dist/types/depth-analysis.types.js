/**
 * Enhanced Course Depth Analysis Types
 * Comprehensive TypeScript interfaces for robust analysis engine
 */
export const WEBB_DOK_DESCRIPTORS = {
    1: {
        name: 'Recall',
        description: 'Recall of information such as facts, definitions, terms, or simple procedures',
        keywords: ['recall', 'identify', 'recognize', 'list', 'name', 'define', 'match', 'quote', 'memorize', 'label'],
        bloomsMapping: ['REMEMBER'],
    },
    2: {
        name: 'Skill/Concept',
        description: 'Use of information, conceptual knowledge, and procedures',
        keywords: ['summarize', 'interpret', 'classify', 'compare', 'organize', 'estimate', 'predict', 'modify', 'explain', 'describe'],
        bloomsMapping: ['UNDERSTAND', 'APPLY'],
    },
    3: {
        name: 'Strategic Thinking',
        description: 'Reasoning, planning, and using evidence to solve problems',
        keywords: ['analyze', 'investigate', 'formulate', 'hypothesize', 'differentiate', 'conclude', 'critique', 'assess', 'justify', 'develop'],
        bloomsMapping: ['ANALYZE', 'EVALUATE'],
    },
    4: {
        name: 'Extended Thinking',
        description: 'Complex reasoning, planning, developing, and thinking over extended time',
        keywords: ['design', 'create', 'synthesize', 'apply concepts', 'connect', 'critique across', 'prove', 'research', 'develop original'],
        bloomsMapping: ['CREATE'],
    },
};
export const COURSE_TYPE_PROFILES = {
    foundational: {
        type: 'foundational',
        description: 'Introductory courses for beginners with no prior knowledge',
        idealBloomsDistribution: {
            REMEMBER: 25,
            UNDERSTAND: 35,
            APPLY: 25,
            ANALYZE: 10,
            EVALUATE: 3,
            CREATE: 2,
        },
        idealDOKDistribution: { level1: 30, level2: 50, level3: 15, level4: 5 },
        primaryObjective: 'Build fundamental understanding',
        targetAudience: 'Complete beginners',
    },
    intermediate: {
        type: 'intermediate',
        description: 'Building on foundational knowledge with practical applications',
        idealBloomsDistribution: {
            REMEMBER: 10,
            UNDERSTAND: 20,
            APPLY: 35,
            ANALYZE: 20,
            EVALUATE: 10,
            CREATE: 5,
        },
        idealDOKDistribution: { level1: 15, level2: 40, level3: 35, level4: 10 },
        primaryObjective: 'Develop practical skills',
        targetAudience: 'Learners with basic knowledge',
    },
    advanced: {
        type: 'advanced',
        description: 'Deep exploration with critical analysis and evaluation',
        idealBloomsDistribution: {
            REMEMBER: 5,
            UNDERSTAND: 10,
            APPLY: 20,
            ANALYZE: 30,
            EVALUATE: 25,
            CREATE: 10,
        },
        idealDOKDistribution: { level1: 5, level2: 25, level3: 45, level4: 25 },
        primaryObjective: 'Master complex concepts',
        targetAudience: 'Experienced practitioners',
    },
    professional: {
        type: 'professional',
        description: 'Industry-focused with real-world problem solving',
        idealBloomsDistribution: {
            REMEMBER: 5,
            UNDERSTAND: 15,
            APPLY: 30,
            ANALYZE: 25,
            EVALUATE: 15,
            CREATE: 10,
        },
        idealDOKDistribution: { level1: 10, level2: 30, level3: 40, level4: 20 },
        primaryObjective: 'Prepare for professional practice',
        targetAudience: 'Working professionals',
    },
    creative: {
        type: 'creative',
        description: 'Focus on innovation, design, and original creation',
        idealBloomsDistribution: {
            REMEMBER: 5,
            UNDERSTAND: 10,
            APPLY: 15,
            ANALYZE: 15,
            EVALUATE: 20,
            CREATE: 35,
        },
        idealDOKDistribution: { level1: 5, level2: 20, level3: 30, level4: 45 },
        primaryObjective: 'Foster creativity and innovation',
        targetAudience: 'Creative professionals and enthusiasts',
    },
    technical: {
        type: 'technical',
        description: 'Hands-on technical skills with implementation focus',
        idealBloomsDistribution: {
            REMEMBER: 10,
            UNDERSTAND: 15,
            APPLY: 40,
            ANALYZE: 20,
            EVALUATE: 10,
            CREATE: 5,
        },
        idealDOKDistribution: { level1: 15, level2: 45, level3: 30, level4: 10 },
        primaryObjective: 'Build technical competency',
        targetAudience: 'Technical practitioners',
    },
    theoretical: {
        type: 'theoretical',
        description: 'Academic focus on concepts, theories, and research',
        idealBloomsDistribution: {
            REMEMBER: 15,
            UNDERSTAND: 25,
            APPLY: 10,
            ANALYZE: 30,
            EVALUATE: 15,
            CREATE: 5,
        },
        idealDOKDistribution: { level1: 20, level2: 30, level3: 40, level4: 10 },
        primaryObjective: 'Deep theoretical understanding',
        targetAudience: 'Researchers and academics',
    },
};
export const BLOOMS_KEYWORD_MAP = [
    {
        level: 'REMEMBER',
        keywords: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'state', 'describe', 'memorize', 'repeat', 'label', 'match', 'quote', 'select'],
        weight: 1,
    },
    {
        level: 'UNDERSTAND',
        keywords: ['explain', 'summarize', 'interpret', 'classify', 'compare', 'contrast', 'discuss', 'distinguish', 'predict', 'paraphrase', 'translate', 'illustrate', 'exemplify'],
        weight: 2,
    },
    {
        level: 'APPLY',
        keywords: ['apply', 'demonstrate', 'solve', 'use', 'implement', 'execute', 'carry out', 'practice', 'calculate', 'complete', 'show', 'modify', 'operate', 'experiment'],
        weight: 3,
    },
    {
        level: 'ANALYZE',
        keywords: ['analyze', 'examine', 'investigate', 'categorize', 'differentiate', 'distinguish', 'organize', 'deconstruct', 'attribute', 'outline', 'structure', 'integrate', 'compare', 'contrast'],
        weight: 4,
    },
    {
        level: 'EVALUATE',
        keywords: ['evaluate', 'judge', 'critique', 'justify', 'assess', 'defend', 'support', 'argue', 'prioritize', 'recommend', 'rate', 'select', 'validate', 'appraise'],
        weight: 5,
    },
    {
        level: 'CREATE',
        keywords: ['create', 'design', 'develop', 'formulate', 'construct', 'invent', 'compose', 'generate', 'produce', 'plan', 'devise', 'synthesize', 'build', 'author'],
        weight: 6,
    },
];
export function getBloomsWeight(level) {
    const mapping = BLOOMS_KEYWORD_MAP.find(m => m.level === level);
    return mapping?.weight ?? 1;
}
export function bloomsToDOK(bloomsLevel) {
    const mapping = {
        REMEMBER: 1,
        UNDERSTAND: 2,
        APPLY: 2,
        ANALYZE: 3,
        EVALUATE: 3,
        CREATE: 4,
    };
    return mapping[bloomsLevel];
}
export function dokToBlooms(dokLevel) {
    return WEBB_DOK_DESCRIPTORS[dokLevel].bloomsMapping;
}
