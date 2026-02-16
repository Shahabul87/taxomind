/**
 * Golden Test Fixtures for Prompt Regression Testing
 *
 * These fixtures provide typed, deterministic inputs for buildStage1Prompt(),
 * buildStage2Prompt(), and buildStage3Prompt(). They represent realistic
 * course creation scenarios at different positions and difficulty levels.
 *
 * Each fixture includes the exact arguments needed by the prompt builders,
 * ensuring that prompt construction can be tested as pure functions without
 * any AI calls.
 */

import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  BloomsLevel,
  ConceptTracker,
  ConceptEntry,
  EnrichedChapterContext,
  CompletedChapter,
  CompletedSection,
} from '../types';

// ============================================================================
// Helper: Build ConceptTracker from array of entries
// ============================================================================

function buildConceptTracker(entries: Array<[string, ConceptEntry]>): ConceptTracker {
  return {
    concepts: new Map(entries),
    vocabulary: entries.map(([name]) => name),
    skillsBuilt: [],
  };
}

// ============================================================================
// Fixture 1: First chapter of a beginner course (no prior context)
// ============================================================================

const beginnerCourseContext: CourseContext = {
  courseTitle: 'Introduction to Web Development with HTML and CSS',
  courseDescription: 'A comprehensive beginner course covering the fundamentals of building web pages using HTML5 and CSS3. Students will learn to create responsive, accessible websites from scratch.',
  courseCategory: 'Web Development',
  courseSubcategory: 'Frontend',
  targetAudience: 'Complete beginners with no prior programming experience',
  difficulty: 'beginner',
  courseLearningObjectives: [
    'Build a complete multi-page website using semantic HTML5 elements',
    'Style web pages using CSS3 properties, selectors, and the box model',
    'Create responsive layouts using CSS Flexbox and Grid',
    'Apply web accessibility best practices to HTML documents',
  ],
  totalChapters: 8,
  sectionsPerChapter: 6,
  bloomsFocus: [],
  learningObjectivesPerChapter: 4,
  learningObjectivesPerSection: 3,
  includeAssessments: true,
  preferredContentTypes: ['video', 'reading', 'assignment'],
};

export const FIXTURE_BEGINNER_FIRST_CHAPTER = {
  label: 'First chapter of beginner course (no prior context)',
  stage1: {
    courseContext: beginnerCourseContext,
    currentChapterNumber: 1,
    previousChapters: [] as GeneratedChapter[],
    conceptTracker: undefined,
    categoryPrompt: undefined,
    completedChapters: undefined,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
} as const;

// ============================================================================
// Fixture 2: Middle chapter of intermediate course (with concept flow)
// ============================================================================

const intermediateCourseContext: CourseContext = {
  courseTitle: 'Data Structures and Algorithms in Python',
  courseDescription: 'Master essential data structures and algorithmic techniques using Python. Covers arrays, linked lists, trees, graphs, sorting, searching, and dynamic programming with real-world applications.',
  courseCategory: 'Computer Science',
  courseSubcategory: 'Algorithms',
  targetAudience: 'Software developers with 1-2 years of Python experience',
  difficulty: 'intermediate',
  courseLearningObjectives: [
    'Implement fundamental data structures from scratch in Python',
    'Analyze time and space complexity using Big-O notation',
    'Apply appropriate algorithmic strategies to solve real-world problems',
    'Design efficient solutions using dynamic programming and graph algorithms',
  ],
  totalChapters: 10,
  sectionsPerChapter: 7,
  bloomsFocus: [],
  learningObjectivesPerChapter: 4,
  learningObjectivesPerSection: 3,
  includeAssessments: true,
};

const intermediatePreviousChapters: GeneratedChapter[] = [
  {
    position: 1,
    title: 'Arrays and Time Complexity Fundamentals',
    description: 'Explore how arrays work under the hood and learn to measure algorithmic efficiency using Big-O notation.',
    bloomsLevel: 'REMEMBER',
    learningObjectives: [
      'Identify the core properties of arrays and their memory layout',
      'Recall Big-O notation for common operations on arrays',
      'List the trade-offs between arrays and other linear structures',
      'Describe how dynamic arrays resize internally',
    ],
    keyTopics: ['Array memory layout', 'Big-O notation', 'Dynamic arrays', 'Common array operations'],
    prerequisites: 'Basic Python proficiency (variables, loops, functions)',
    estimatedTime: '2 hours 30 minutes',
    topicsToExpand: ['Array memory layout', 'Big-O notation', 'Dynamic arrays', 'Common array operations'],
    conceptsIntroduced: ['array', 'Big-O notation', 'time complexity', 'dynamic array', 'amortized cost'],
  },
  {
    position: 2,
    title: 'Linked Lists: Pointers and Node-Based Thinking',
    description: 'Build linked lists from scratch and master pointer manipulation patterns that underpin many advanced structures.',
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: [
      'Explain how singly and doubly linked lists differ in structure and use',
      'Summarize the trade-offs between arrays and linked lists',
      'Interpret pointer diagrams to trace insertion and deletion operations',
      'Compare the performance of linked list operations with array equivalents',
    ],
    keyTopics: ['Singly linked lists', 'Doubly linked lists', 'Pointer manipulation', 'Sentinel nodes'],
    prerequisites: 'Array fundamentals and Big-O notation from Chapter 1',
    estimatedTime: '2 hours 45 minutes',
    topicsToExpand: ['Singly linked lists', 'Doubly linked lists', 'Pointer manipulation', 'Sentinel nodes'],
    conceptsIntroduced: ['linked list', 'node', 'pointer', 'singly linked', 'doubly linked', 'sentinel node'],
  },
  {
    position: 3,
    title: 'Stacks and Queues: LIFO and FIFO in Practice',
    description: 'Implement stacks and queues using both arrays and linked lists, then apply them to real parsing and scheduling problems.',
    bloomsLevel: 'APPLY',
    learningObjectives: [
      'Implement stack and queue data structures using arrays and linked lists',
      'Apply stacks to solve expression parsing and backtracking problems',
      'Demonstrate queue usage in BFS traversal and task scheduling',
      'Use deques and priority queues for advanced scheduling scenarios',
    ],
    keyTopics: ['Stack implementation', 'Queue implementation', 'Expression parsing', 'BFS with queues'],
    prerequisites: 'Linked list operations and Big-O analysis from Chapters 1-2',
    estimatedTime: '3 hours',
    topicsToExpand: ['Stack implementation', 'Queue implementation', 'Expression parsing', 'BFS with queues'],
    conceptsIntroduced: ['stack', 'queue', 'LIFO', 'FIFO', 'deque', 'priority queue'],
  },
  {
    position: 4,
    title: 'Hash Tables: Fast Lookup and Collision Resolution',
    description: 'Design hash tables with different collision strategies and analyze their real-world performance characteristics.',
    bloomsLevel: 'APPLY',
    learningObjectives: [
      'Implement a hash table with chaining and open addressing strategies',
      'Apply hash tables to solve frequency counting and caching problems',
      'Calculate load factor and predict when to resize a hash table',
      'Solve real coding interview problems using hash-based approaches',
    ],
    keyTopics: ['Hash functions', 'Chaining', 'Open addressing', 'Load factor and resizing'],
    prerequisites: 'Array and linked list fundamentals from Chapters 1-3',
    estimatedTime: '3 hours',
    topicsToExpand: ['Hash functions', 'Chaining', 'Open addressing', 'Load factor and resizing'],
    conceptsIntroduced: ['hash table', 'hash function', 'collision', 'chaining', 'open addressing', 'load factor'],
  },
];

const intermediateConceptTracker = buildConceptTracker([
  ['array', { concept: 'array', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
  ['Big-O notation', { concept: 'Big-O notation', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
  ['time complexity', { concept: 'time complexity', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
  ['dynamic array', { concept: 'dynamic array', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
  ['amortized cost', { concept: 'amortized cost', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
  ['linked list', { concept: 'linked list', introducedInChapter: 2, bloomsLevel: 'UNDERSTAND' }],
  ['node', { concept: 'node', introducedInChapter: 2, bloomsLevel: 'UNDERSTAND' }],
  ['pointer', { concept: 'pointer', introducedInChapter: 2, bloomsLevel: 'UNDERSTAND' }],
  ['stack', { concept: 'stack', introducedInChapter: 3, bloomsLevel: 'APPLY' }],
  ['queue', { concept: 'queue', introducedInChapter: 3, bloomsLevel: 'APPLY' }],
  ['hash table', { concept: 'hash table', introducedInChapter: 4, bloomsLevel: 'APPLY' }],
  ['hash function', { concept: 'hash function', introducedInChapter: 4, bloomsLevel: 'APPLY' }],
  ['collision', { concept: 'collision', introducedInChapter: 4, bloomsLevel: 'APPLY' }],
]);

export const FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER = {
  label: 'Middle chapter of intermediate course (with concept flow)',
  stage1: {
    courseContext: intermediateCourseContext,
    currentChapterNumber: 5,
    previousChapters: intermediatePreviousChapters,
    conceptTracker: intermediateConceptTracker,
    categoryPrompt: undefined,
    completedChapters: undefined,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
  stage2: {
    courseContext: intermediateCourseContext,
    chapter: {
      ...intermediatePreviousChapters[3],
      position: 5,
      title: 'Binary Trees: Structure, Traversal, and Search',
      bloomsLevel: 'ANALYZE' as BloomsLevel,
      keyTopics: ['Binary tree structure', 'Tree traversal algorithms', 'Binary search trees', 'Tree balancing concepts'],
      learningObjectives: [
        'Analyze the structure of binary trees and their recursive properties',
        'Differentiate between pre-order, in-order, and post-order traversal strategies',
        'Examine how binary search trees maintain sorted order during insertions',
        'Investigate the impact of tree balance on search performance',
      ],
      conceptsIntroduced: ['binary tree', 'tree traversal', 'BST', 'tree depth', 'balanced tree'],
    },
    currentSectionNumber: 3,
    previousSections: [
      {
        position: 1,
        title: 'Real-World Trees: From File Systems to Decision Engines',
        contentType: 'video' as const,
        estimatedDuration: '20 minutes',
        topicFocus: 'Binary tree structure',
        parentChapterContext: {
          title: 'Binary Trees: Structure, Traversal, and Search',
          bloomsLevel: 'ANALYZE' as BloomsLevel,
          relevantObjectives: ['Analyze the structure of binary trees and their recursive properties'],
        },
        conceptsIntroduced: ['binary tree', 'tree depth'],
        conceptsReferenced: ['node', 'pointer'],
      },
      {
        position: 2,
        title: 'Traversing Trees: DFS Strategies Compared',
        contentType: 'reading' as const,
        estimatedDuration: '25 minutes',
        topicFocus: 'Tree traversal algorithms',
        parentChapterContext: {
          title: 'Binary Trees: Structure, Traversal, and Search',
          bloomsLevel: 'ANALYZE' as BloomsLevel,
          relevantObjectives: ['Differentiate between pre-order, in-order, and post-order traversal strategies'],
        },
        conceptsIntroduced: ['tree traversal'],
        conceptsReferenced: ['stack', 'queue', 'binary tree'],
      },
    ] as GeneratedSection[],
    allExistingSectionTitles: [
      'Real-World Trees: From File Systems to Decision Engines',
      'Traversing Trees: DFS Strategies Compared',
    ],
    enrichedContext: {
      allChapters: intermediatePreviousChapters,
      conceptTracker: intermediateConceptTracker,
      bloomsProgression: [
        { chapter: 1, level: 'REMEMBER' as BloomsLevel, topics: ['arrays', 'Big-O'] },
        { chapter: 2, level: 'UNDERSTAND' as BloomsLevel, topics: ['linked lists'] },
        { chapter: 3, level: 'APPLY' as BloomsLevel, topics: ['stacks', 'queues'] },
        { chapter: 4, level: 'APPLY' as BloomsLevel, topics: ['hash tables'] },
      ],
    } as EnrichedChapterContext,
    categoryPrompt: undefined,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
} as const;

// ============================================================================
// Fixture 3: Late chapter of expert course (rich context, should be within budget)
// ============================================================================

const expertCourseContext: CourseContext = {
  courseTitle: 'Advanced Machine Learning: From Theory to Production',
  courseDescription: 'A rigorous expert-level course on modern machine learning, covering statistical learning theory, deep learning architectures, and production ML systems. Designed for practitioners ready to push beyond standard approaches.',
  courseCategory: 'Data Science',
  courseSubcategory: 'Machine Learning',
  targetAudience: 'ML engineers with 3+ years of experience and strong mathematical foundations',
  difficulty: 'expert',
  courseLearningObjectives: [
    'Evaluate the theoretical foundations of modern deep learning architectures',
    'Design production-grade ML pipelines with monitoring and drift detection',
    'Create novel model architectures for domain-specific applications',
    'Critique and improve existing ML systems using rigorous experimental design',
  ],
  totalChapters: 12,
  sectionsPerChapter: 8,
  bloomsFocus: ['ANALYZE', 'EVALUATE', 'CREATE'],
  learningObjectivesPerChapter: 4,
  learningObjectivesPerSection: 3,
  includeAssessments: true,
};

const expertPreviousChapters: GeneratedChapter[] = Array.from({ length: 9 }, (_, i) => ({
  position: i + 1,
  title: `Expert Chapter ${i + 1}`,
  description: `Advanced ML topic ${i + 1} covering cutting-edge techniques.`,
  bloomsLevel: (['ANALYZE', 'ANALYZE', 'ANALYZE', 'EVALUATE', 'EVALUATE', 'EVALUATE', 'CREATE', 'CREATE', 'CREATE'] as BloomsLevel[])[i],
  learningObjectives: [`Objective ${i + 1}a`, `Objective ${i + 1}b`, `Objective ${i + 1}c`, `Objective ${i + 1}d`],
  keyTopics: [`Topic ${i + 1}a`, `Topic ${i + 1}b`, `Topic ${i + 1}c`],
  prerequisites: i === 0 ? 'Strong math and ML fundamentals' : `Chapters 1-${i}`,
  estimatedTime: '4 hours',
  topicsToExpand: [`Topic ${i + 1}a`, `Topic ${i + 1}b`, `Topic ${i + 1}c`],
  conceptsIntroduced: [`concept_${i + 1}_a`, `concept_${i + 1}_b`, `concept_${i + 1}_c`],
}));

const expertConceptEntries: Array<[string, ConceptEntry]> = [];
for (let i = 0; i < 9; i++) {
  const level = (['ANALYZE', 'ANALYZE', 'ANALYZE', 'EVALUATE', 'EVALUATE', 'EVALUATE', 'CREATE', 'CREATE', 'CREATE'] as BloomsLevel[])[i];
  for (const suffix of ['a', 'b', 'c']) {
    expertConceptEntries.push([
      `concept_${i + 1}_${suffix}`,
      { concept: `concept_${i + 1}_${suffix}`, introducedInChapter: i + 1, bloomsLevel: level },
    ]);
  }
}

export const FIXTURE_EXPERT_LATE_CHAPTER = {
  label: 'Late chapter of expert course (rich context, should be within budget)',
  stage1: {
    courseContext: expertCourseContext,
    currentChapterNumber: 10,
    previousChapters: expertPreviousChapters,
    conceptTracker: buildConceptTracker(expertConceptEntries),
    categoryPrompt: undefined,
    completedChapters: undefined,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
} as const;

// ============================================================================
// Fixture 4: Resumed chapter with bridge content
// ============================================================================

export const FIXTURE_RESUMED_WITH_BRIDGE = {
  label: 'Resumed chapter with bridge content',
  stage3: {
    courseContext: intermediateCourseContext,
    chapter: {
      position: 4,
      title: 'Hash Tables: Fast Lookup and Collision Resolution',
      description: 'Design hash tables with different collision strategies.',
      bloomsLevel: 'APPLY' as BloomsLevel,
      learningObjectives: [
        'Implement a hash table with chaining and open addressing strategies',
        'Apply hash tables to solve frequency counting problems',
        'Calculate load factor and predict when to resize',
        'Solve coding problems using hash-based approaches',
      ],
      keyTopics: ['Hash functions', 'Chaining', 'Open addressing', 'Load factor'],
      prerequisites: 'Array and linked list fundamentals from Chapters 1-3',
      estimatedTime: '3 hours',
      topicsToExpand: ['Hash functions', 'Chaining', 'Open addressing', 'Load factor'],
      conceptsIntroduced: ['hash table', 'hash function', 'collision'],
    },
    section: {
      position: 1,
      title: 'Why Hash Tables Power the Modern Web',
      contentType: 'video' as const,
      estimatedDuration: '20 minutes',
      topicFocus: 'Hash functions',
      parentChapterContext: {
        title: 'Hash Tables: Fast Lookup and Collision Resolution',
        bloomsLevel: 'APPLY' as BloomsLevel,
        relevantObjectives: ['Implement a hash table with chaining and open addressing strategies'],
      },
      conceptsIntroduced: ['hash function'],
      conceptsReferenced: ['array', 'time complexity'],
    } as GeneratedSection,
    chapterSections: [
      {
        position: 1,
        title: 'Why Hash Tables Power the Modern Web',
        contentType: 'video' as const,
        estimatedDuration: '20 minutes',
        topicFocus: 'Hash functions',
        parentChapterContext: {
          title: 'Hash Tables: Fast Lookup and Collision Resolution',
          bloomsLevel: 'APPLY' as BloomsLevel,
          relevantObjectives: ['Implement a hash table with chaining and open addressing strategies'],
        },
      },
      {
        position: 2,
        title: 'Collision Resolution: Chaining vs Open Addressing',
        contentType: 'reading' as const,
        estimatedDuration: '25 minutes',
        topicFocus: 'Chaining',
        parentChapterContext: {
          title: 'Hash Tables: Fast Lookup and Collision Resolution',
          bloomsLevel: 'APPLY' as BloomsLevel,
          relevantObjectives: ['Apply hash tables to solve frequency counting problems'],
        },
      },
    ] as GeneratedSection[],
    enrichedContext: undefined,
    categoryPrompt: undefined,
    variant: undefined,
    templatePrompt: undefined,
    completedSections: undefined,
    recalledMemory: undefined,
    bridgeContent: 'Students previously learned about stack LIFO and queue FIFO patterns. Hash tables introduce a fundamentally different access pattern: direct lookup by key. Bridge the concept by comparing: stacks use position (top), queues use order (front), but hash tables use a computed index from the key itself. This is the leap from sequential to associative data access.',
  },
} as const;

// ============================================================================
// Fixture 5: Chapter after replan (adaptive guidance)
// ============================================================================

export const FIXTURE_AFTER_REPLAN = {
  label: 'Chapter after replan (adaptive guidance)',
  stage1: {
    courseContext: {
      ...intermediateCourseContext,
      totalChapters: 10,
    },
    currentChapterNumber: 7,
    previousChapters: [
      ...intermediatePreviousChapters,
      {
        position: 5,
        title: 'Binary Trees: Structure, Traversal, and Search',
        description: 'Understanding tree data structures and their traversal algorithms.',
        bloomsLevel: 'ANALYZE' as BloomsLevel,
        learningObjectives: [
          'Analyze binary tree structures',
          'Differentiate tree traversal strategies',
          'Examine BST operations',
          'Investigate tree balance impact',
        ],
        keyTopics: ['Binary trees', 'Traversal algorithms', 'BST operations'],
        prerequisites: 'Chapters 1-4',
        estimatedTime: '3 hours',
        topicsToExpand: ['Binary trees', 'Traversal algorithms', 'BST operations'],
        conceptsIntroduced: ['binary tree', 'BST', 'tree traversal'],
      },
      {
        position: 6,
        title: 'Heaps and Priority Queues: Efficient Ordering',
        description: 'Build heaps from scratch and apply them to scheduling and graph problems.',
        bloomsLevel: 'ANALYZE' as BloomsLevel,
        learningObjectives: [
          'Analyze the heap property and its maintenance during operations',
          'Differentiate between min-heaps and max-heaps for different use cases',
          'Examine heapsort and compare with other sorting algorithms',
          'Investigate priority queue applications in graph algorithms',
        ],
        keyTopics: ['Heap property', 'Heapsort', 'Priority queue applications'],
        prerequisites: 'Binary trees and arrays from Chapters 1-5',
        estimatedTime: '3 hours',
        topicsToExpand: ['Heap property', 'Heapsort', 'Priority queue applications'],
        conceptsIntroduced: ['heap', 'heapsort', 'min-heap', 'max-heap'],
      },
    ],
    conceptTracker: buildConceptTracker([
      ...intermediateConceptTracker.concepts.entries(),
      ['binary tree', { concept: 'binary tree', introducedInChapter: 5, bloomsLevel: 'ANALYZE' }],
      ['BST', { concept: 'BST', introducedInChapter: 5, bloomsLevel: 'ANALYZE' }],
      ['tree traversal', { concept: 'tree traversal', introducedInChapter: 5, bloomsLevel: 'ANALYZE' }],
      ['heap', { concept: 'heap', introducedInChapter: 6, bloomsLevel: 'ANALYZE' }],
      ['heapsort', { concept: 'heapsort', introducedInChapter: 6, bloomsLevel: 'ANALYZE' }],
    ]),
    categoryPrompt: undefined,
    completedChapters: undefined,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
} as const;

// ============================================================================
// Fixture 6: Category-specific course (programming domain)
// ============================================================================

const programmingCourseContext: CourseContext = {
  courseTitle: 'Building Production APIs with Node.js and Express',
  courseDescription: 'Learn to design, build, and deploy production-ready REST APIs using Node.js and Express. Covers authentication, database integration, testing, error handling, and deployment to cloud platforms.',
  courseCategory: 'Programming',
  courseSubcategory: 'Backend Development',
  targetAudience: 'Frontend developers transitioning to full-stack or junior backend developers',
  difficulty: 'intermediate',
  courseLearningObjectives: [
    'Design RESTful API architectures following industry best practices',
    'Implement secure authentication using JWT and OAuth2',
    'Build database-backed APIs with proper ORM usage and migrations',
    'Deploy and monitor production APIs with CI/CD pipelines',
  ],
  totalChapters: 8,
  sectionsPerChapter: 7,
  bloomsFocus: [],
  learningObjectivesPerChapter: 4,
  learningObjectivesPerSection: 3,
  includeAssessments: true,
  preferredContentTypes: ['reading', 'assignment', 'project'],
};

const programmingPreviousChapters: GeneratedChapter[] = [
  {
    position: 1,
    title: 'The Anatomy of a Production API: From Request to Response',
    description: 'Explore how production APIs handle millions of requests daily through the HTTP request lifecycle.',
    bloomsLevel: 'REMEMBER',
    learningObjectives: [
      'Identify the components of an HTTP request and response cycle',
      'Recall REST constraints and their purpose in API design',
      'List the common HTTP methods and status codes used in APIs',
      'Describe the role of middleware in Express request processing',
    ],
    keyTopics: ['HTTP lifecycle', 'REST principles', 'Express middleware', 'API architecture'],
    prerequisites: 'Basic JavaScript and Node.js knowledge',
    estimatedTime: '2 hours 30 minutes',
    topicsToExpand: ['HTTP lifecycle', 'REST principles', 'Express middleware', 'API architecture'],
    conceptsIntroduced: ['REST', 'middleware', 'HTTP methods', 'status codes', 'request lifecycle'],
  },
];

const programmingCompletedChapters: CompletedChapter[] = [
  {
    ...programmingPreviousChapters[0],
    id: 'ch-1-completed',
    sections: [
      {
        position: 1,
        title: 'How Netflix Serves 250 Million Users: Inside a Production API',
        contentType: 'video',
        estimatedDuration: '20 minutes',
        topicFocus: 'HTTP lifecycle',
        parentChapterContext: {
          title: 'The Anatomy of a Production API: From Request to Response',
          bloomsLevel: 'REMEMBER',
          relevantObjectives: ['Identify the components of an HTTP request and response cycle'],
        },
        id: 'sec-1-1',
        conceptsIntroduced: ['REST', 'HTTP methods'],
        conceptsReferenced: [],
        details: {
          description: '<h2>Why This Matters</h2><p>Every time you scroll Netflix...</p>',
          learningObjectives: ['Identify the 7 layers of the HTTP request lifecycle'],
          keyConceptsCovered: ['HTTP request', 'HTTP response', 'REST'],
          practicalActivity: 'Trace a real API call using browser DevTools.',
        },
      } as CompletedSection,
    ],
  },
];

export const FIXTURE_PROGRAMMING_DOMAIN = {
  label: 'Category-specific course (programming domain)',
  stage1: {
    courseContext: programmingCourseContext,
    currentChapterNumber: 2,
    previousChapters: programmingPreviousChapters,
    conceptTracker: buildConceptTracker([
      ['REST', { concept: 'REST', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
      ['middleware', { concept: 'middleware', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
      ['HTTP methods', { concept: 'HTTP methods', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
      ['status codes', { concept: 'status codes', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
      ['request lifecycle', { concept: 'request lifecycle', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
    ]),
    categoryPrompt: undefined,
    completedChapters: programmingCompletedChapters,
    variant: undefined,
    templatePrompt: undefined,
    recalledMemory: undefined,
  },
} as const;

// ============================================================================
// All Fixtures (for iteration in tests)
// ============================================================================

export const ALL_STAGE1_FIXTURES = [
  FIXTURE_BEGINNER_FIRST_CHAPTER,
  FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER,
  FIXTURE_EXPERT_LATE_CHAPTER,
  FIXTURE_AFTER_REPLAN,
  FIXTURE_PROGRAMMING_DOMAIN,
] as const;

export const ALL_STAGE2_FIXTURES = [
  FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER,
] as const;

export const ALL_STAGE3_FIXTURES = [
  FIXTURE_RESUMED_WITH_BRIDGE,
] as const;
