/**
 * Mathematics & Statistics Category Prompt Enhancer
 *
 * Covers: Mathematics, Statistics, Calculus, Linear Algebra, Probability,
 * Discrete Mathematics, Physics (math-heavy)
 *
 * Research basis:
 * - MIT OCW 18.01 (Single Variable Calculus) & 18.06 (Linear Algebra, Gilbert Strang)
 * - 3Blue1Brown visualization-first approach (Grant Sanderson)
 * - Moore method for proof-based mathematics
 * - Polya's problem-solving heuristics (How to Solve It)
 * - Progressive difficulty with mathematical maturity scaffolding
 * - NCTM Effective Mathematics Teaching Practices
 */

import type { CategoryPromptEnhancer } from './types';

export const mathematicsEnhancer: CategoryPromptEnhancer = {
  categoryId: 'mathematics',
  displayName: 'Mathematics & Statistics',
  matchesCategories: [
    'Mathematics',
    'Statistics',
    'Calculus',
    'Linear Algebra',
    'Probability',
    'Discrete Mathematics',
    'Number Theory',
    'Abstract Algebra',
    'Real Analysis',
    'Physics',
    'Quantitative Methods',
    'Mathematical Modeling',
    'Operations Research',
    'Actuarial Science',
    'Biostatistics',
  ],

  domainExpertise: `You are also an expert mathematician and mathematics educator who applies the ARROW framework to mathematics education:
- ALWAYS starts with APPLICATION: shows WHERE the math concept appears in real systems before introducing notation (ARROW Phase 1)
- Builds INTUITION before formalism: geometric visualizations, analogies, and prediction questions BEFORE equations (ARROW Phase 3)
- Deeply understands the difference between COMPUTATIONAL fluency (solving problems) and CONCEPTUAL understanding (knowing why methods work)
- Can build geometric and visual intuition for abstract concepts (3Blue1Brown approach) — this IS ARROW&apos;s Intuition Building phase
- Uses FAILURE ANALYSIS in math: "Why does this approach give the wrong answer?" "Where does this approximation break down?" (ARROW Phase 5)
- Employs CONSTRAINT CHALLENGES: "Solve this without calculus" or "Prove this using only elementary methods" (ARROW Phase 7)
- Knows that students need MULTIPLE representations: algebraic, geometric, numerical, verbal
- Can connect abstract math to concrete applications — NEVER teaches math in isolation
- Designs problem sets that scaffold from routine exercises to challenging proofs
- Knows that mathematical confidence is as important as mathematical skill — frustration must be managed
- Math follows: plain English meaning → visual intuition → equation → numerical example → "what happens if we change X?"`,

  teachingMethodology: `## MATHEMATICS TEACHING METHODOLOGY

### Core Principles
1. **Intuition Before Formalism**: Show WHAT a concept means visually and concretely BEFORE writing formal definitions. "A derivative is the slope of a tangent line" before "f'(x) = lim_{h→0} [f(x+h) - f(x)]/h".
2. **Multiple Representations**: Every concept must be shown in at least THREE ways: visual/geometric, algebraic/symbolic, and numerical/computational. Students learn through whichever clicks first.
3. **Worked Examples with Fading**: Start with complete worked solutions, then partially worked solutions, then independent problem solving (Cognitive Load Theory).
4. **The "Why" Before the "How"**: Before teaching a technique, motivate it with a PROBLEM that cannot be solved with previous tools. "We can differentiate polynomials, but what about sin(x)? We need the chain rule."
5. **Spiral with Increasing Rigor**: Introduce concepts informally first, return to them with more mathematical precision later. Calculus students can USE the chain rule before they PROVE it.
6. **Error Analysis as Learning**: Show common mistakes and WHY they are wrong. "Why can't we just add the exponents here? Let's see what happens..."

### Polya's Problem-Solving Framework (Embedded in Every Chapter)
1. **Understand the Problem**: What is given? What is asked? Draw a diagram.
2. **Devise a Plan**: Is there a similar problem? Can we break it into parts?
3. **Carry Out the Plan**: Execute systematically, check each step.
4. **Look Back**: Verify the answer. Can it be solved differently? What does it generalize to?

### Problem Set Design
Every chapter's problems should include:
- **Computational exercises** (30%): Practice the technique with varying numbers
- **Conceptual questions** (25%): "True/false with justification", "Explain why", "Give a counterexample"
- **Application problems** (25%): Real-world scenarios using the math concept
- **Proof/reasoning** (20%): For advanced courses, guided proofs that build proof-writing skills`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall definitions, formulas, theorems, and mathematical notation',
      exampleObjectives: [
        'State the definition of a derivative and its standard notation (Leibniz and Lagrange)',
        'List the properties of matrix multiplication (associativity, non-commutativity, distributivity)',
        'Recall the fundamental theorem of calculus and its two parts',
      ],
      exampleActivities: [
        'Formula flashcards: match formulas to their names and use cases',
        'Definition completion: fill in the blanks of formal definitions',
        'Theorem identification: given a statement, name the theorem',
      ],
    },
    UNDERSTAND: {
      means: 'Explain concepts geometrically, interpret formulas, translate between representations',
      exampleObjectives: [
        'Explain the geometric meaning of a definite integral as the area under a curve with signed regions',
        'Interpret a system of linear equations geometrically as intersecting planes in 3D space',
        'Translate a word problem into a mathematical model using appropriate variables and constraints',
      ],
      exampleActivities: [
        'Visualization: sketch the graph of a function and annotate key features (zeros, extrema, inflection points)',
        'Translation: convert between algebraic, graphical, and tabular representations',
        'Explanation: explain to a classmate why division by zero is undefined, using a concrete example',
      ],
    },
    APPLY: {
      means: 'Solve problems using learned techniques, compute correctly, apply formulas to new contexts',
      exampleObjectives: [
        'Apply integration techniques (substitution, by parts, partial fractions) to evaluate given integrals',
        'Solve systems of linear equations using Gaussian elimination and matrix operations',
        'Use probability distributions to calculate probabilities for real-world scenarios',
      ],
      exampleActivities: [
        'Problem set: solve 8-12 exercises of progressive difficulty using the chapter\'s technique',
        'Application problem: model a real-world scenario mathematically and solve it',
        'Computation: use software (Python/MATLAB) to verify hand calculations and explore larger cases',
      ],
    },
    ANALYZE: {
      means: 'Prove theorems, identify mathematical structure, compare methods',
      exampleObjectives: [
        'Analyze the convergence of an infinite series using comparison, ratio, and root tests, and determine which test is most efficient',
        'Examine the eigenvalues of a matrix and determine what they reveal about the associated linear transformation',
        'Prove that a given function is continuous on a specified interval using the epsilon-delta definition',
      ],
      exampleActivities: [
        'Proof construction: prove a given theorem following a structured outline with hints',
        'Method comparison: solve the same problem three different ways and compare efficiency',
        'Error detection: find and correct the error in a given "proof" (common mistake analysis)',
      ],
    },
    EVALUATE: {
      means: 'Assess solution quality, judge proof validity, critique mathematical models',
      exampleObjectives: [
        'Evaluate whether a given proof is logically valid and identify any gaps or errors in reasoning',
        'Assess the appropriateness of a statistical model for a given dataset and justify the choice',
        'Critique a mathematical model and recommend improvements to increase accuracy or applicability',
      ],
      exampleActivities: [
        'Proof review: evaluate a student\'s proof for correctness, clarity, and completeness',
        'Model assessment: given a mathematical model and real data, determine how well the model fits and where it fails',
        'Peer review: provide constructive feedback on a classmate\'s problem solution',
      ],
    },
    CREATE: {
      means: 'Construct original proofs, formulate mathematical models, design solution strategies',
      exampleObjectives: [
        'Construct an original proof for a given mathematical statement using techniques learned in the course',
        'Design a mathematical model for a real-world phenomenon and validate it against data',
        'Formulate a novel problem that tests a specific mathematical concept and provide a complete solution',
      ],
      exampleActivities: [
        'Research project: investigate an extension of a course topic and write a mathematical exposition',
        'Model building: formulate a mathematical model for a real-world problem and analyze its predictions',
        'Problem creation: create a challenging problem for classmates and write a detailed solution',
      ],
    },
  },

  contentTypeGuidance: `## CONTENT TYPE SELECTION FOR MATHEMATICS COURSES

Mathematics courses need a strong READING + PRACTICE balance:

| Content Type | Usage | Best For |
|-------------|-------|----------|
| **video** | 20-25% | Geometric visualizations, step-by-step solution walkthroughs, concept motivation. ESSENTIAL for building intuition. |
| **reading** | 25-30% | Definitions, theorems, proofs, worked examples, formula derivations. Include diagrams and multiple representations. |
| **assignment** | 30-35% | Problem sets with progressive difficulty. CORE of math learning. Include computational, conceptual, and proof exercises. |
| **quiz** | 5-10% | Quick concept checks, formula recall, true/false with justification. After each major concept. |
| **project** | 5-10% | Mathematical modeling projects, computational exploration with software, research summaries. |
| **discussion** | 0-5% | Proof strategy sharing, application brainstorming, math history discussion. |

### Rules:
- Every theorem/formula MUST be followed by worked examples (at least 2) before exercises
- Problem sets MUST have progressive difficulty (routine → challenging → proof/extension)
- Visual/geometric interpretation MUST accompany every algebraic concept
- Include "common mistakes" callouts in reading sections`,

  qualityCriteria: `## MATHEMATICS COURSE QUALITY CRITERIA

A chapter is HIGH QUALITY when it:
1. **Motivates with a problem** — "Why do we need this concept?" before "Here is the definition"
2. **Provides geometric intuition** — visual representation alongside algebraic formulation
3. **Includes multiple worked examples** — at least 2-3 complete solutions showing the technique
4. **Has progressive problem sets** — from routine computation to challenging reasoning
5. **Shows connections** — links to prior chapters and real-world applications
6. **Addresses common errors** — explicitly shows what students typically get wrong
7. **Includes both computation and conceptual questions** — not just "solve" but "explain why"

A section is HIGH QUALITY when it:
1. **Has clear definitions** — precise, with accompanying examples and non-examples
2. **Provides multiple representations** — algebraic AND geometric AND numerical
3. **Includes step-by-step solutions** — not just "the answer is X" but every intermediate step
4. **Builds on prerequisites** — explicitly states what the student must know and where it was taught
5. **Ends with practice** — every section should conclude with exercises the student can do immediately`,

  chapterSequencingAdvice: `## MATHEMATICS COURSE CHAPTER SEQUENCING

### General Mathematics Sequencing Principles:
1. **Prerequisites are sacred**: NEVER introduce a concept that uses undefined tools
2. **Definitions before theorems**: Define objects before proving properties about them
3. **Special cases before general**: Teach 2D before 3D before nD. Teach with integers before rationals before reals.
4. **Computation before theory**: Students should be able to DO the math before they PROVE why it works
5. **Examples before abstraction**: Concrete instances before general principles

### Calculus (Single Variable) Typical Progression:
1. Functions, Limits, and Continuity
2. The Derivative: Definition and Rules
3. Applications of Derivatives (optimization, related rates)
4. The Integral: Definition and Fundamental Theorem
5. Integration Techniques
6. Applications of Integration (area, volume, arc length)
7. Sequences and Series

### Linear Algebra Typical Progression:
1. Vectors and Systems of Linear Equations
2. Matrix Operations and Properties
3. Determinants
4. Vector Spaces and Subspaces
5. Eigenvalues and Eigenvectors
6. Orthogonality and Least Squares
7. Applications (PCA, graph theory, differential equations)

### Statistics Typical Progression:
1. Descriptive Statistics and Data Visualization
2. Probability Fundamentals
3. Random Variables and Distributions
4. Sampling and Central Limit Theorem
5. Estimation and Confidence Intervals
6. Hypothesis Testing
7. Regression and Correlation
8. Applications and Advanced Topics`,

  activityExamples: {
    video: 'Visual proof: animate how the area under a curve is approximated by rectangles, showing Riemann sums converging to the integral as n increases. Step through a matrix multiplication geometrically as a composition of transformations.',
    reading: 'Theorem presentation: (1) motivating problem, (2) informal statement, (3) visual interpretation, (4) formal statement, (5) proof with annotations, (6) two worked examples, (7) common pitfalls.',
    assignment: 'Progressive problem set: 4 computational exercises (apply the formula), 3 conceptual questions (explain, true/false, counterexample), 2 application problems (word problems from science/engineering), 1 proof exercise (guided with hints).',
    quiz: 'Quick concept check: "True or false: if f is differentiable at x=a, then f is continuous at x=a. Justify your answer." Formula application: "Evaluate the integral using the appropriate technique."',
    project: 'Mathematical modeling: choose a real-world phenomenon (population growth, disease spread, financial model), formulate a mathematical model, solve/simulate it, compare predictions to actual data, write a report.',
    discussion: 'Strategy sharing: "How would you approach this integral? Share your technique and compare with classmates. Which method is most efficient and why?"',
  },
};
