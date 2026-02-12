/**
 * Programming & Software Development Category Prompt Enhancer
 *
 * Covers: Programming, Web Development, Mobile Development, Computer Science,
 * Game Development, DevOps, Cloud Computing, Cybersecurity, Blockchain
 *
 * Research basis:
 * - Harvard CS50 structure (David Malan): Scratch → C → Python → SQL → Web
 * - fast.ai top-down methodology (Jeremy Howard): Build first, theory later
 * - "Ten Quick Tips for Teaching Programming" (PLOS Comp Bio)
 * - Parsons Problems, worked examples, live coding pedagogy
 * - Project-based learning for coding education
 */

import type { CategoryPromptEnhancer } from './types';

export const programmingEnhancer: CategoryPromptEnhancer = {
  categoryId: 'programming',
  displayName: 'Programming & Software Development',
  matchesCategories: [
    'Programming',
    'Computer Science',
    'Web Development',
    'Mobile Development',
    'Game Development',
    'DevOps',
    'Cloud Computing',
    'Cybersecurity',
    'Blockchain',
    'Software Engineering',
    'Software Development',
    'Frontend Development',
    'Backend Development',
    'Full Stack',
    'App Development',
  ],

  domainExpertise: `You are also an expert software engineer and computer science educator with deep industry experience. You apply the ARROW framework to programming education:
- How professional developers actually learn and work (code → debug → iterate) — mirrors ARROW&apos;s Build & Iterate phase
- The difference between KNOWING syntax and THINKING like a programmer — ARROW&apos;s Design Thinking phase
- That reading code is a skill distinct from writing code — ARROW&apos;s Reverse Engineer phase
- That debugging and error-handling are core skills, not afterthoughts — ARROW&apos;s Failure Analysis phase
- The importance of building real, working projects — not toy examples — ARROW&apos;s Application First principle
- Industry tools and practices: version control, testing, code review, CI/CD
- That programming fluency comes from DOING, not just reading about concepts — ARROW&apos;s Build & Iterate phase
- That constraint challenges ("do it without framework X") build deeper problem-solving — ARROW Phase 7`,

  teachingMethodology: `## PROGRAMMING TEACHING METHODOLOGY

### Core Principles (Research-Based)
1. **Code-First, Theory-Second** (fast.ai approach): Show working code BEFORE explaining theory. Students should see a working program before learning why it works.
2. **Worked Examples → Faded Examples → Independent Practice**: Start by showing complete solutions, then show partial solutions students complete, then have students write from scratch.
3. **Parsons Problems**: Before asking students to write code, have them REORDER shuffled lines of correct code. This builds pattern recognition without syntax burden.
4. **Live Coding Methodology** (CS50): Demonstrate coding in real-time, including making mistakes and debugging. This models the actual programming thought process.
5. **Read-Before-Write**: Students should read and trace existing code before writing their own. Understanding comes before creation.
6. **Error-Driven Learning**: Deliberately introduce common bugs and have students find and fix them. Debugging IS programming.

### Chapter Arc for Programming Courses
- **Early chapters**: Heavy scaffolding. Complete code examples. Step-by-step walkthroughs. Concept → Syntax → Example → Practice.
- **Middle chapters**: Faded scaffolding. Starter code with gaps. Students modify and extend existing code. Introduce design decisions.
- **Late chapters**: Minimal scaffolding. Open-ended projects. Students design and implement from requirements. Code review and refactoring.

### The "Build Something Real" Rule
Every 2-3 chapters should culminate in a project that produces something REAL and USEFUL — not a contrived exercise. The project should be something students would want to show others.`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall syntax, recognize code patterns, identify language constructs',
      exampleObjectives: [
        'Identify the correct syntax for declaring variables, loops, and functions in the target language',
        'List the primitive data types and their use cases',
        'Recall the purpose of common standard library functions',
      ],
      exampleActivities: [
        'Syntax flashcards and matching exercises',
        'Code reading: identify which lines perform which operations',
        'Fill-in-the-blank code completion',
      ],
    },
    UNDERSTAND: {
      means: 'Explain what code does, trace execution flow, predict output',
      exampleObjectives: [
        'Explain the difference between pass-by-value and pass-by-reference with examples',
        'Trace the execution of a recursive function and predict its output',
        'Summarize how HTTP request-response cycles work in web applications',
      ],
      exampleActivities: [
        'Code tracing: given code, predict the output step by step',
        'Explain in plain English what a function does without running it',
        'Draw a diagram showing data flow through a program',
      ],
    },
    APPLY: {
      means: 'Write working code to solve defined problems, implement known patterns',
      exampleObjectives: [
        'Implement a RESTful API endpoint that handles CRUD operations following the MVC pattern',
        'Apply the observer pattern to decouple event handling in an application',
        'Use array methods (map, filter, reduce) to transform a dataset according to specifications',
      ],
      exampleActivities: [
        'Implement a feature from specifications (guided)',
        'Complete a partially written function (faded scaffolding)',
        'Solve coding challenges on a defined topic',
      ],
    },
    ANALYZE: {
      means: 'Debug code, compare implementations, identify performance bottlenecks',
      exampleObjectives: [
        'Analyze two implementations of the same algorithm and determine which has better time complexity',
        'Debug a failing test suite by examining error messages and tracing code execution',
        'Examine a codebase and identify violations of SOLID principles',
      ],
      exampleActivities: [
        'Given buggy code, find and fix all errors',
        'Compare two approaches to the same problem and argue which is better',
        'Profile a slow application and identify the bottleneck',
      ],
    },
    EVALUATE: {
      means: 'Review code quality, assess architectural decisions, justify technology choices',
      exampleObjectives: [
        'Evaluate a pull request for code quality, security vulnerabilities, and adherence to team standards',
        'Assess whether a given system architecture meets scalability requirements and justify improvements',
        'Critique a database schema design and recommend normalizations',
      ],
      exampleActivities: [
        'Code review: evaluate submitted code against a rubric',
        'Architecture decision record: justify a technology choice with trade-offs',
        'Security audit: evaluate an application for common vulnerabilities',
      ],
    },
    CREATE: {
      means: 'Design and build complete systems, architect solutions, create original applications',
      exampleObjectives: [
        'Design and implement a complete authentication system supporting OAuth 2.0 and JWT token management',
        'Build a full-stack application from requirements through deployment with proper testing',
        'Create a reusable component library with documentation and automated tests',
      ],
      exampleActivities: [
        'Capstone project: design, implement, test, and deploy a complete application',
        'Open-source contribution: propose and implement a feature for an existing project',
        'System design exercise: architect a solution to handle specific requirements',
      ],
    },
  },

  contentTypeGuidance: `## CONTENT TYPE SELECTION FOR PROGRAMMING COURSES

Programming courses should be **heavily hands-on** (60%+ assignments/projects):

| Content Type | Usage | Best For |
|-------------|-------|----------|
| **video** | 20-25% | Live coding demos, tool walkthroughs, concept visualization. Keep under 15 min. |
| **reading** | 15-20% | API documentation, conceptual frameworks, reference material. Include code snippets. |
| **assignment** | 35-40% | Coding exercises, Parsons problems, debugging challenges, implementation tasks. CORE of the course. |
| **quiz** | 5-10% | Syntax checks, concept verification, code output prediction. |
| **project** | 15-20% | Multi-chapter integration, portfolio-worthy builds, real-world applications. |
| **discussion** | 0-5% | Code review, architecture debates, technology trade-offs. |

### Rules:
- NEVER have 3+ consecutive reading sections — break them up with assignments
- Every chapter should have at least one ASSIGNMENT section
- Projects should appear every 2-3 chapters as integration checkpoints
- Video sections should demonstrate something being BUILT, not just explained`,

  qualityCriteria: `## PROGRAMMING COURSE QUALITY CRITERIA

A chapter is HIGH QUALITY when it:
1. **Has runnable code examples** — every concept is illustrated with actual code, not just prose
2. **Builds something tangible** — students produce working output they can see/use
3. **Follows industry conventions** — proper naming, error handling, testing, not academic-only patterns
4. **Introduces tools alongside concepts** — IDE features, debugger, package manager, version control
5. **Includes common pitfalls** — addresses the mistakes beginners ACTUALLY make
6. **Connects to real codebases** — references how concepts appear in production systems
7. **Uses progressive disclosure** — shows the simple version first, then reveals the full complexity

A section is HIGH QUALITY when it:
1. **Has a clear "what you will build" statement** — students know the tangible outcome
2. **Provides starter code when appropriate** — scaffolds the experience for beginners
3. **Includes expected output** — students can verify their code works
4. **Addresses error scenarios** — what happens when things go wrong
5. **Links to official documentation** — teaches students to be self-sufficient`,

  chapterSequencingAdvice: `## PROGRAMMING COURSE CHAPTER SEQUENCING

### Typical Progression (adapt to specific language/framework):
1. **Environment & First Program**: Setup, hello world, running code, understanding output
2. **Variables & Data Types**: Storing and manipulating data, type systems
3. **Control Flow**: Conditionals, loops, decision-making in code
4. **Functions & Modularity**: Breaking problems into reusable pieces
5. **Data Structures**: Collections of data, choosing the right structure
6. **Error Handling**: Dealing with failures gracefully
7. **File I/O & External Data**: Reading/writing data, APIs, databases
8. **Object-Oriented or Functional Patterns**: Organizing larger programs
9. **Testing & Debugging**: Ensuring code quality, systematic debugging
10. **Integration Project**: Combining all skills into a real application

### Sequencing Rules:
- **No forward references**: Never use a concept before teaching it
- **Syntax before semantics**: Students must know HOW to write code before understanding WHY
- **Small programs before large**: Individual functions → classes → modules → systems
- **Console before UI**: Text output before graphical interfaces
- **Local before distributed**: Single machine before networks/cloud`,

  activityExamples: {
    video: 'Live coding session: build a feature from scratch, including debugging when things go wrong. Show the thought process, not just the final code.',
    reading: 'Technical deep-dive with annotated code examples, diagrams showing data flow, and comparison tables for related concepts. Include "try it yourself" prompts.',
    assignment: 'Implement a specific feature: given requirements and starter code, write the implementation. Includes test cases that verify correctness. Progressive difficulty: basic → intermediate → challenge.',
    quiz: 'Code output prediction: given 5 code snippets, predict the output. Debugging: spot the bug in 3 code blocks. Concept check: which approach is correct for this scenario?',
    project: 'Build a complete mini-application from scratch. Includes: requirements document, suggested architecture, starter template, rubric with criteria for functionality, code quality, and documentation.',
    discussion: 'Code review exercise: review a peer\'s solution for readability, efficiency, and correctness. Provide constructive feedback with specific suggestions.',
  },
};
