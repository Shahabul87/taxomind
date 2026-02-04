/**
 * Self-Assessment Question Template Library
 *
 * Pre-built question templates organized by subject area.
 * Each template includes: question format, Bloom's level, difficulty,
 * and sample questions that users can customize or expand with AI.
 */

// ============================================================================
// Types
// ============================================================================

type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'ORDERING';

type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface TemplateQuestion {
  question: string;
  questionType: QuestionType;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  hint?: string;
  explanation?: string;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  estimatedTime?: number; // seconds
  tags: string[];
}

interface QuestionTemplate {
  id: string;
  name: string;
  description: string;
  subjectArea: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  tags: string[];
  bloomsDistribution: Record<BloomsLevel, number>; // target distribution as %
  defaultQuestionCount: number;
  questions: TemplateQuestion[];
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templates: QuestionTemplate[];
}

// ============================================================================
// Helper: Generate option IDs
// ============================================================================

let optionCounter = 0;
function opt(text: string, isCorrect: boolean) {
  optionCounter++;
  return { id: `opt_${optionCounter}`, text, isCorrect };
}

// ============================================================================
// Template Definitions
// ============================================================================

const PROGRAMMING_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'prog-js-fundamentals',
    name: 'JavaScript Fundamentals',
    description: 'Core JavaScript concepts including variables, functions, closures, and the event loop',
    subjectArea: 'Programming',
    icon: 'Code2',
    color: 'text-yellow-600',
    tags: ['javascript', 'web-development', 'fundamentals'],
    bloomsDistribution: {
      REMEMBER: 20,
      UNDERSTAND: 25,
      APPLY: 25,
      ANALYZE: 15,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 20,
    questions: [
      {
        question: 'What is the output of typeof null in JavaScript?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('"null"', false),
          opt('"undefined"', false),
          opt('"object"', true),
          opt('"boolean"', false),
        ],
        correctAnswer: '"object"',
        explanation: 'This is a known JavaScript bug. typeof null returns "object" due to how types were originally implemented in JavaScript.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 30,
        tags: ['types', 'typeof'],
      },
      {
        question: 'Explain the difference between let, const, and var in JavaScript, including their scoping rules.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'var is function-scoped and hoisted, let and const are block-scoped. const cannot be reassigned after declaration. let can be reassigned. var declarations are hoisted to the top of their function scope.',
        hint: 'Consider: scoping, hoisting, and reassignment',
        explanation: 'var is function-scoped with hoisting. let and const are block-scoped (introduced in ES6). const prevents reassignment but does not make objects immutable.',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'EASY',
        points: 2,
        estimatedTime: 90,
        tags: ['variables', 'scoping', 'es6'],
      },
      {
        question: 'What will the following code output?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('0, 1, 2', false),
          opt('3, 3, 3', true),
          opt('undefined, undefined, undefined', false),
          opt('0, 0, 0', false),
        ],
        correctAnswer: '3, 3, 3',
        explanation: 'Because var is function-scoped, the closure captures the same variable i. By the time the callbacks execute, the loop has completed and i equals 3.',
        bloomsLevel: 'ANALYZE',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 60,
        tags: ['closures', 'event-loop', 'var'],
      },
      {
        question: 'Write a function that creates a counter using closures. The function should return an object with increment(), decrement(), and getCount() methods.',
        questionType: 'ESSAY',
        correctAnswer: 'function createCounter(initial = 0) {\n  let count = initial;\n  return {\n    increment() { count++; return count; },\n    decrement() { count--; return count; },\n    getCount() { return count; }\n  };\n}',
        hint: 'Use an IIFE or factory function pattern',
        explanation: 'Closures allow inner functions to access variables from their outer scope even after the outer function has returned.',
        bloomsLevel: 'CREATE',
        difficulty: 'MEDIUM',
        points: 3,
        estimatedTime: 180,
        tags: ['closures', 'factory-pattern'],
      },
      {
        question: 'The Promise.all() method rejects as soon as _____ of the input promises rejects.',
        questionType: 'FILL_IN_BLANK',
        correctAnswer: 'any one',
        hint: 'Think about the fail-fast behavior',
        explanation: 'Promise.all() follows a fail-fast pattern: if any single promise rejects, the entire Promise.all() rejects immediately.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 30,
        tags: ['promises', 'async'],
      },
    ],
  },
  {
    id: 'prog-python-data',
    name: 'Python Data Structures',
    description: 'Python lists, dictionaries, sets, tuples, and their operations',
    subjectArea: 'Programming',
    icon: 'Code2',
    color: 'text-blue-600',
    tags: ['python', 'data-structures', 'fundamentals'],
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 30,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'Which Python data structure is immutable?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('list', false),
          opt('dictionary', false),
          opt('set', false),
          opt('tuple', true),
        ],
        correctAnswer: 'tuple',
        explanation: 'Tuples are immutable sequences. Once created, their elements cannot be changed, added, or removed.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 20,
        tags: ['tuple', 'immutability'],
      },
      {
        question: 'Explain the time complexity difference between checking membership in a list vs a set in Python.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'List membership check (x in list) is O(n) because it requires linear search. Set membership check (x in set) is O(1) average case because sets use hash tables.',
        explanation: 'Sets are implemented as hash tables, providing constant-time lookup. Lists require iterating through elements sequentially.',
        bloomsLevel: 'ANALYZE',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 90,
        tags: ['time-complexity', 'set', 'list'],
      },
      {
        question: 'Write a list comprehension that generates all prime numbers less than 50.',
        questionType: 'ESSAY',
        correctAnswer: 'primes = [n for n in range(2, 50) if all(n % i != 0 for i in range(2, int(n**0.5) + 1))]',
        hint: 'A prime is a number greater than 1 with no divisors other than 1 and itself',
        explanation: 'Uses nested comprehension: outer iterates candidates, inner checks divisibility up to square root.',
        bloomsLevel: 'CREATE',
        difficulty: 'HARD',
        points: 3,
        estimatedTime: 180,
        tags: ['list-comprehension', 'algorithms'],
      },
    ],
  },
  {
    id: 'prog-react-hooks',
    name: 'React Hooks & Patterns',
    description: 'React hooks, component patterns, state management, and performance optimization',
    subjectArea: 'Programming',
    icon: 'Layers',
    color: 'text-cyan-600',
    tags: ['react', 'hooks', 'frontend', 'state-management'],
    bloomsDistribution: {
      REMEMBER: 10,
      UNDERSTAND: 20,
      APPLY: 30,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'Which hook should you use to perform side effects in a functional component?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('useState', false),
          opt('useEffect', true),
          opt('useRef', false),
          opt('useMemo', false),
        ],
        correctAnswer: 'useEffect',
        explanation: 'useEffect is designed for side effects like data fetching, subscriptions, and DOM manipulation.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 20,
        tags: ['useEffect', 'side-effects'],
      },
      {
        question: 'Explain why including all dependencies in the useEffect dependency array is important and what problems can occur if you omit them.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'Omitting dependencies leads to stale closures where the effect captures old values of state or props. This causes bugs where the effect operates on outdated data. The exhaustive-deps ESLint rule helps catch these issues.',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 120,
        tags: ['useEffect', 'dependencies', 'stale-closures'],
      },
      {
        question: 'Evaluate the following approach: using useRef to store mutable values that are needed in callbacks but should not trigger re-renders. Is this a good pattern? What are the trade-offs?',
        questionType: 'ESSAY',
        correctAnswer: 'Yes, useRef for mutable callback values is a valid pattern. Benefits: stable callback identity (no unnecessary re-renders), avoids infinite loops in effects, prevents stale closures. Trade-offs: ref.current updates are not visible to React during render, values may be out of sync during concurrent rendering, makes data flow less explicit.',
        bloomsLevel: 'EVALUATE',
        difficulty: 'HARD',
        points: 3,
        estimatedTime: 180,
        tags: ['useRef', 'optimization', 'callbacks'],
      },
    ],
  },
];

const SCIENCE_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'sci-biology-cells',
    name: 'Cell Biology Essentials',
    description: 'Cell structure, organelles, membrane transport, and cell division',
    subjectArea: 'Science',
    icon: 'Microscope',
    color: 'text-green-600',
    tags: ['biology', 'cells', 'organelles'],
    bloomsDistribution: {
      REMEMBER: 25,
      UNDERSTAND: 25,
      APPLY: 20,
      ANALYZE: 15,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 20,
    questions: [
      {
        question: 'Which organelle is responsible for producing ATP through cellular respiration?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('Golgi apparatus', false),
          opt('Mitochondria', true),
          opt('Endoplasmic reticulum', false),
          opt('Lysosome', false),
        ],
        correctAnswer: 'Mitochondria',
        explanation: 'Mitochondria are the "powerhouses" of the cell, producing ATP through oxidative phosphorylation.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 20,
        tags: ['organelles', 'ATP', 'respiration'],
      },
      {
        question: 'Compare and contrast passive transport and active transport across a cell membrane.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'Passive transport moves molecules down their concentration gradient without energy (e.g., diffusion, osmosis). Active transport moves molecules against their concentration gradient and requires ATP (e.g., sodium-potassium pump). Both are essential for maintaining cellular homeostasis.',
        bloomsLevel: 'ANALYZE',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 120,
        tags: ['membrane', 'transport', 'homeostasis'],
      },
      {
        question: 'Cells use _____ to break down waste materials and cellular debris.',
        questionType: 'FILL_IN_BLANK',
        correctAnswer: 'lysosomes',
        explanation: 'Lysosomes contain hydrolytic enzymes that digest macromolecules, old cell parts, and microorganisms.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 30,
        tags: ['organelles', 'lysosomes'],
      },
    ],
  },
  {
    id: 'sci-physics-mechanics',
    name: 'Classical Mechanics',
    description: 'Newton&apos;s laws, kinematics, energy, momentum, and rotational motion',
    subjectArea: 'Science',
    icon: 'Atom',
    color: 'text-orange-600',
    tags: ['physics', 'mechanics', 'forces'],
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 15,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'A 5 kg object is accelerated at 3 m/s^2. What is the net force acting on it?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('8 N', false),
          opt('15 N', true),
          opt('1.67 N', false),
          opt('2 N', false),
        ],
        correctAnswer: '15 N',
        explanation: 'Using Newton&apos;s Second Law: F = ma = 5 kg * 3 m/s^2 = 15 N',
        bloomsLevel: 'APPLY',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 45,
        tags: ['newton-laws', 'force', 'acceleration'],
      },
      {
        question: 'A ball is thrown upward with an initial velocity of 20 m/s. Calculate the maximum height reached (assume g = 10 m/s^2 and no air resistance).',
        questionType: 'SHORT_ANSWER',
        correctAnswer: '20 meters. Using v^2 = u^2 - 2gh, at max height v=0: 0 = 400 - 20h, h = 20m',
        hint: 'At maximum height, the velocity is zero',
        explanation: 'Using the kinematic equation v^2 = u^2 - 2gh where v=0 at peak: h = u^2/(2g) = 400/20 = 20m',
        bloomsLevel: 'APPLY',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 90,
        tags: ['kinematics', 'projectile'],
      },
    ],
  },
];

const MATH_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'math-algebra-basics',
    name: 'Algebra Foundations',
    description: 'Linear equations, inequalities, polynomials, and factoring',
    subjectArea: 'Mathematics',
    icon: 'Calculator',
    color: 'text-indigo-600',
    tags: ['algebra', 'equations', 'polynomials'],
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 35,
      ANALYZE: 15,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'Solve for x: 3x + 7 = 22',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('x = 3', false),
          opt('x = 5', true),
          opt('x = 7', false),
          opt('x = 10', false),
        ],
        correctAnswer: 'x = 5',
        explanation: '3x + 7 = 22 => 3x = 15 => x = 5',
        bloomsLevel: 'APPLY',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 30,
        tags: ['linear-equations', 'solving'],
      },
      {
        question: 'Factor completely: x^2 - 9',
        questionType: 'SHORT_ANSWER',
        correctAnswer: '(x + 3)(x - 3)',
        hint: 'This is a difference of two squares',
        explanation: 'Using the identity a^2 - b^2 = (a+b)(a-b), where a=x and b=3',
        bloomsLevel: 'APPLY',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 45,
        tags: ['factoring', 'polynomials'],
      },
      {
        question: 'A train travels at a constant speed. It covers 300 km in 4 hours. If it needs to cover 525 km, how many hours will the journey take?',
        questionType: 'SHORT_ANSWER',
        correctAnswer: '7 hours. Speed = 300/4 = 75 km/h. Time = 525/75 = 7 hours.',
        bloomsLevel: 'APPLY',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 90,
        tags: ['word-problems', 'rate'],
      },
    ],
  },
  {
    id: 'math-statistics',
    name: 'Statistics & Probability',
    description: 'Descriptive statistics, probability distributions, hypothesis testing',
    subjectArea: 'Mathematics',
    icon: 'BarChart3',
    color: 'text-purple-600',
    tags: ['statistics', 'probability', 'data-analysis'],
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 25,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 10,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'The mean of 5, 8, 12, 15, and 20 is:',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('10', false),
          opt('12', true),
          opt('14', false),
          opt('15', false),
        ],
        correctAnswer: '12',
        explanation: 'Mean = (5 + 8 + 12 + 15 + 20) / 5 = 60 / 5 = 12',
        bloomsLevel: 'APPLY',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 30,
        tags: ['mean', 'descriptive-statistics'],
      },
      {
        question: 'Explain the difference between Type I and Type II errors in hypothesis testing.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'Type I error (false positive) occurs when we reject a true null hypothesis. Type II error (false negative) occurs when we fail to reject a false null hypothesis. Type I probability is denoted alpha, Type II is denoted beta.',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 120,
        tags: ['hypothesis-testing', 'errors'],
      },
    ],
  },
];

const BUSINESS_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'biz-project-mgmt',
    name: 'Project Management Essentials',
    description: 'Agile, Scrum, risk management, and stakeholder communication',
    subjectArea: 'Business',
    icon: 'Briefcase',
    color: 'text-slate-600',
    tags: ['project-management', 'agile', 'scrum'],
    bloomsDistribution: {
      REMEMBER: 20,
      UNDERSTAND: 25,
      APPLY: 20,
      ANALYZE: 15,
      EVALUATE: 15,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'In Scrum, the recommended Sprint length is:',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('1 day', false),
          opt('1-4 weeks', true),
          opt('2-3 months', false),
          opt('6 months', false),
        ],
        correctAnswer: '1-4 weeks',
        explanation: 'Scrum Sprints are typically 1-4 weeks long, with 2 weeks being the most common.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 20,
        tags: ['scrum', 'sprint'],
      },
      {
        question: 'Your team consistently misses sprint deadlines. Evaluate whether the problem is more likely due to poor estimation, scope creep, or insufficient capacity, and explain how you would diagnose the root cause.',
        questionType: 'ESSAY',
        correctAnswer: 'Diagnosis should include: reviewing velocity trends, comparing planned vs actual story points, checking for mid-sprint scope additions, evaluating team availability. Could use sprint burndown charts and retrospective findings.',
        bloomsLevel: 'EVALUATE',
        difficulty: 'HARD',
        points: 3,
        estimatedTime: 240,
        tags: ['estimation', 'velocity', 'diagnosis'],
      },
    ],
  },
];

const CYBERSECURITY_TEMPLATES: QuestionTemplate[] = [
  {
    id: 'sec-web-security',
    name: 'Web Application Security',
    description: 'OWASP Top 10, XSS, SQL injection, authentication, and authorization',
    subjectArea: 'Cybersecurity',
    icon: 'Shield',
    color: 'text-red-600',
    tags: ['security', 'owasp', 'web-security'],
    bloomsDistribution: {
      REMEMBER: 15,
      UNDERSTAND: 20,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 15,
      CREATE: 5,
    },
    defaultQuestionCount: 15,
    questions: [
      {
        question: 'Which OWASP Top 10 vulnerability involves inserting malicious SQL statements into input fields?',
        questionType: 'MULTIPLE_CHOICE',
        options: [
          opt('Cross-Site Scripting (XSS)', false),
          opt('SQL Injection', true),
          opt('Broken Authentication', false),
          opt('Security Misconfiguration', false),
        ],
        correctAnswer: 'SQL Injection',
        explanation: 'SQL Injection occurs when untrusted data is sent to an interpreter as part of a command or query, allowing attackers to execute arbitrary SQL.',
        bloomsLevel: 'REMEMBER',
        difficulty: 'EASY',
        points: 1,
        estimatedTime: 20,
        tags: ['sql-injection', 'owasp'],
      },
      {
        question: 'Explain how parameterized queries prevent SQL injection attacks.',
        questionType: 'SHORT_ANSWER',
        correctAnswer: 'Parameterized queries separate SQL code from user data. The database engine treats parameters as literal values, not executable code. This prevents attackers from injecting SQL commands through input fields.',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 90,
        tags: ['sql-injection', 'prevention', 'parameterized-queries'],
      },
      {
        question: 'A stored XSS vulnerability is more dangerous than a reflected XSS because the payload is _____.',
        questionType: 'FILL_IN_BLANK',
        correctAnswer: 'persisted on the server',
        explanation: 'Stored XSS is persisted in the database and served to all users who view the affected page, making it a broader attack vector than reflected XSS.',
        bloomsLevel: 'ANALYZE',
        difficulty: 'MEDIUM',
        points: 2,
        estimatedTime: 45,
        tags: ['xss', 'stored-xss'],
      },
    ],
  },
];

// ============================================================================
// Template Categories
// ============================================================================

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'programming',
    name: 'Programming',
    description: 'Software development, languages, and frameworks',
    icon: 'Code2',
    color: 'text-yellow-600',
    templates: PROGRAMMING_TEMPLATES,
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Biology, physics, chemistry, and earth science',
    icon: 'FlaskConical',
    color: 'text-green-600',
    templates: SCIENCE_TEMPLATES,
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    description: 'Algebra, calculus, statistics, and discrete math',
    icon: 'Calculator',
    color: 'text-indigo-600',
    templates: MATH_TEMPLATES,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Management, finance, strategy, and operations',
    icon: 'Briefcase',
    color: 'text-slate-600',
    templates: BUSINESS_TEMPLATES,
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Web security, network security, and cryptography',
    icon: 'Shield',
    color: 'text-red-600',
    templates: CYBERSECURITY_TEMPLATES,
  },
];

// ============================================================================
// Accessor Functions
// ============================================================================

/** Get all template categories */
export function getTemplateCategories(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES;
}

/** Get a specific template by ID */
export function getTemplateById(templateId: string): QuestionTemplate | undefined {
  for (const category of TEMPLATE_CATEGORIES) {
    const found = category.templates.find((t) => t.id === templateId);
    if (found) return found;
  }
  return undefined;
}

/** Get all templates for a specific subject area */
export function getTemplatesBySubject(subject: string): QuestionTemplate[] {
  const category = TEMPLATE_CATEGORIES.find(
    (c) => c.id === subject.toLowerCase() || c.name.toLowerCase() === subject.toLowerCase()
  );
  return category?.templates ?? [];
}

/** Search templates by tag */
export function searchTemplatesByTag(tag: string): QuestionTemplate[] {
  const lowerTag = tag.toLowerCase();
  const results: QuestionTemplate[] = [];
  for (const category of TEMPLATE_CATEGORIES) {
    for (const template of category.templates) {
      if (template.tags.some((t) => t.toLowerCase().includes(lowerTag))) {
        results.push(template);
      }
    }
  }
  return results;
}

/** Get flattened list of all templates */
export function getAllTemplates(): QuestionTemplate[] {
  return TEMPLATE_CATEGORIES.flatMap((c) => c.templates);
}

// ============================================================================
// Exports
// ============================================================================

export type {
  BloomsLevel,
  QuestionType,
  QuestionDifficulty,
  TemplateQuestion,
  QuestionTemplate,
  TemplateCategory,
};
