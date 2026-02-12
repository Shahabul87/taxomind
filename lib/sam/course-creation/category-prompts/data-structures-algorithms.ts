/**
 * Data Structures & Algorithms Category Prompt Enhancer
 *
 * Covers: Algorithms, Data Structures, Competitive Programming,
 * System Design, Computational Thinking
 *
 * Research basis:
 * - MIT 6.006 Introduction to Algorithms (Erik Demaine, Srini Devadas)
 * - Coursera Algorithms Specialization (Tim Roughgarden, Stanford)
 * - CLRS (Cormen, Leiserson, Rivest, Stein) textbook structure
 * - Visualization-driven algorithm teaching (VisuAlgo, Algorithm Visualizer)
 * - Competitive programming pedagogy (Codeforces, LeetCode progression)
 */

import type { CategoryPromptEnhancer } from './types';

export const dataStructuresAlgorithmsEnhancer: CategoryPromptEnhancer = {
  categoryId: 'data-structures-algorithms',
  displayName: 'Data Structures & Algorithms',
  matchesCategories: [
    'Data Structures',
    'Algorithms',
    'Data Structures and Algorithms',
    'DSA',
    'Competitive Programming',
    'System Design',
    'Computational Thinking',
    'Algorithm Design',
    'Problem Solving',
  ],

  domainExpertise: `You are also an expert algorithms researcher and computer science educator who:
- Has deep knowledge of algorithm design paradigms (divide & conquer, dynamic programming, greedy, backtracking)
- Understands computational complexity theory at an intuitive level
- Can explain abstract concepts using visual diagrams and step-by-step traces
- Knows how data structures and algorithms appear in real software (databases, compilers, networks, OS)
- Understands the progression from concrete examples → pattern recognition → abstract analysis → proof
- Has experience with both academic algorithm analysis and practical coding interview preparation
- Can connect theoretical Big-O analysis to actual running time on real hardware`,

  teachingMethodology: `## DSA TEACHING METHODOLOGY

### Core Principles
1. **Visualize Everything**: Every data structure and algorithm should be shown as a DIAGRAM first, traced STEP by STEP, then coded. Never go straight to code without visual understanding.
2. **Concrete Before Abstract**: Show the algorithm working on a specific example (e.g., sorting [5, 2, 8, 1, 9]) before discussing the general case. Use small inputs (n=5-8) for initial demonstrations.
3. **Problem-First Approach**: Introduce each data structure or algorithm by presenting a PROBLEM that the previous approach cannot solve efficiently. "We need faster lookup → hash tables." "We need ordered data → BSTs."
4. **Complexity as a Story**: Big-O analysis should be taught as "how does the running time GROW?" not as mathematical formalism. Use timing experiments alongside theoretical analysis.
5. **Implementation Solidifies Understanding**: Students MUST implement every data structure and algorithm themselves. Reading pseudocode is not sufficient — the bugs they encounter during implementation ARE the learning.
6. **Pattern Recognition**: DSA courses should explicitly teach PROBLEM-SOLVING PATTERNS (sliding window, two pointers, BFS/DFS template, DP state definition) — not just individual algorithms.

### The "Why This Structure?" Framework
For every data structure introduced, answer:
1. What PROBLEM does it solve better than previous structures?
2. What are its KEY OPERATIONS and their time complexities?
3. What are its TRADE-OFFS (time vs. space, insert vs. lookup)?
4. WHERE does it appear in real systems?
5. WHEN should you choose this over alternatives?

### Problem Difficulty Progression
- **Easy**: Direct application of one concept (use the right function/method)
- **Medium**: Combine two concepts or optimize a brute-force approach
- **Hard**: Require insight, combine patterns, or use advanced techniques
Each chapter should have problems at all three levels.`,

  bloomsInDomain: {
    REMEMBER: {
      means: 'Recall time complexities, identify data structures, name algorithm categories',
      exampleObjectives: [
        'List the time complexities of common operations (insert, delete, search) for arrays, linked lists, hash tables, and BSTs',
        'Identify which sorting algorithm is being described given its properties',
        'Recall the definition and properties of a binary search tree, heap, and graph',
      ],
      exampleActivities: [
        'Complexity matching: match operations to their Big-O complexities',
        'Structure identification: given a visual diagram, name the data structure',
        'Algorithm recognition: given pseudocode steps, identify the algorithm',
      ],
    },
    UNDERSTAND: {
      means: 'Trace algorithm execution, explain why complexities arise, compare approaches',
      exampleObjectives: [
        'Trace the execution of merge sort on a given array, showing each recursive split and merge step',
        'Explain why hash table lookup is O(1) average but O(n) worst case, and what causes degradation',
        'Compare BFS and DFS traversals and explain when each is more appropriate',
      ],
      exampleActivities: [
        'Algorithm tracing: step through an algorithm by hand on a given input, showing state at each step',
        'Complexity explanation: explain in plain language WHY an algorithm has its time complexity',
        'Trade-off analysis: given two data structures, explain the trade-offs for a specific use case',
      ],
    },
    APPLY: {
      means: 'Implement data structures, write algorithms, solve coding problems',
      exampleObjectives: [
        'Implement a hash table from scratch with collision resolution using chaining',
        'Apply dynamic programming to solve the longest common subsequence problem with proper state definition',
        'Use Dijkstra\'s algorithm to find shortest paths in a weighted graph',
      ],
      exampleActivities: [
        'Implement a data structure from scratch with all required operations and test cases',
        'Solve 3 coding problems that require applying the chapter\'s algorithm pattern',
        'Convert pseudocode to working code and verify with provided test cases',
      ],
    },
    ANALYZE: {
      means: 'Analyze algorithm correctness, prove complexities, identify optimization opportunities',
      exampleObjectives: [
        'Analyze the time and space complexity of a given recursive algorithm using recurrence relations',
        'Examine a brute-force solution and identify the specific inefficiency that can be optimized',
        'Determine whether a greedy approach produces an optimal solution for a given problem and justify the answer',
      ],
      exampleActivities: [
        'Complexity analysis: derive the Big-O of unfamiliar code by counting operations',
        'Optimization challenge: given an O(n^2) solution, find the O(n log n) or O(n) approach',
        'Correctness proof: argue why an algorithm always produces the correct answer (loop invariant)',
      ],
    },
    EVALUATE: {
      means: 'Choose optimal algorithms, assess solution quality, justify design decisions',
      exampleObjectives: [
        'Evaluate three different approaches to a problem and recommend the optimal one based on input constraints',
        'Assess whether a given solution handles all edge cases and identify any missing scenarios',
        'Judge whether a proposed data structure choice is appropriate for a system with specific read/write patterns',
      ],
      exampleActivities: [
        'Code review: evaluate a solution for correctness, efficiency, and edge case handling',
        'System design: choose the right data structures for a real-world system (e.g., LRU cache, autocomplete)',
        'Benchmarking: measure actual running times and compare to theoretical predictions',
      ],
    },
    CREATE: {
      means: 'Design novel algorithms, create hybrid data structures, solve unseen problems',
      exampleObjectives: [
        'Design an efficient algorithm for a novel problem by combining known paradigms (divide & conquer + memoization)',
        'Create a custom data structure that supports specific operations within required time bounds',
        'Build a complete problem-solving solution that handles edge cases, scales to large inputs, and is well-documented',
      ],
      exampleActivities: [
        'Algorithm design: given a novel problem, design an efficient algorithm from scratch',
        'Data structure invention: combine existing structures to support a custom set of operations',
        'Competition problem: solve an unseen problem within a time limit using any technique',
      ],
    },
  },

  contentTypeGuidance: `## CONTENT TYPE SELECTION FOR DSA COURSES

DSA courses must balance VISUALIZATION, THEORY, and CODING PRACTICE:

| Content Type | Usage | Best For |
|-------------|-------|----------|
| **video** | 20-25% | Algorithm visualizations, step-by-step traces, complexity analysis walkthroughs. Use animations showing how data structures change. |
| **reading** | 20-25% | Formal definitions, pseudocode, complexity proofs, comparison tables. Include diagrams for every data structure. |
| **assignment** | 35-40% | Implement data structures, solve coding problems, trace algorithms by hand. CORE of the course. |
| **quiz** | 5-10% | Complexity recall, algorithm identification, output prediction from pseudocode. |
| **project** | 10-15% | Build a real application using the chapter's data structures (e.g., build a spell-checker using tries). |
| **discussion** | 0-5% | Algorithm comparison debates, real-world application brainstorming. |

### Rules:
- Every data structure chapter MUST include an "implement from scratch" assignment
- Every algorithm chapter MUST include at least 3 coding problems at varying difficulty
- Visual traces MUST accompany every algorithm before code is shown
- Include complexity comparison tables whenever introducing a new structure`,

  qualityCriteria: `## DSA COURSE QUALITY CRITERIA

A chapter is HIGH QUALITY when it:
1. **Opens with a motivating problem** — "Why do we need this?" before "How does it work?"
2. **Includes visual step-by-step traces** — diagrams showing the algorithm/structure at each step
3. **Provides complexity analysis** — both theoretical (Big-O) and practical (actual benchmarks)
4. **Has a comparison table** — how this structure/algorithm compares to alternatives
5. **Connects to real systems** — where this appears in databases, OS, compilers, web frameworks
6. **Includes edge cases** — empty input, single element, already sorted, duplicates
7. **Offers multiple difficulty levels** — easy, medium, and hard problems for each concept

A section is HIGH QUALITY when it:
1. **Traces before coding** — students understand the algorithm before implementing it
2. **Provides clear pseudocode** — language-agnostic description before actual code
3. **Includes test cases** — students verify their implementation against known inputs/outputs
4. **Shows the invariant** — what property is maintained at each step of the algorithm
5. **Addresses common mistakes** — off-by-one errors, wrong base case, missing edge cases`,

  chapterSequencingAdvice: `## DSA COURSE CHAPTER SEQUENCING

### Typical Progression (MIT 6.006 inspired):
1. **Algorithmic Thinking**: What is an algorithm? Problem → model → algorithm → analysis. First examples.
2. **Arrays & Strings**: Sequential data, basic operations, searching, two-pointer technique
3. **Sorting**: Comparison sorts (bubble, insertion, merge, quick), non-comparison sorts (counting, radix)
4. **Linked Lists & Stacks/Queues**: Pointer-based structures, LIFO/FIFO, implementation and applications
5. **Hash Tables**: Hashing, collision resolution, load factor, applications (frequency counting, caching)
6. **Trees & BSTs**: Binary trees, traversals, BST operations, balanced trees (AVL, Red-Black)
7. **Heaps & Priority Queues**: Heap property, heapify, applications (scheduling, median finding)
8. **Graphs — Traversal**: BFS, DFS, connected components, topological sort
9. **Graphs — Shortest Paths**: Dijkstra, Bellman-Ford, DAG shortest paths
10. **Dynamic Programming**: Overlapping subproblems, optimal substructure, memoization vs. tabulation
11. **Greedy Algorithms**: Greedy choice property, interval scheduling, Huffman coding
12. **Advanced Topics / Integration**: Tries, union-find, divide & conquer, NP-completeness overview

### Sequencing Rules:
- **Linear before non-linear**: Arrays/lists before trees/graphs
- **Concrete before abstract**: Specific algorithms before design paradigms (DP, greedy)
- **Structure before algorithm**: Teach the data structure, THEN algorithms that use it
- **BFS/DFS before shortest paths**: Graph traversal before weighted graph algorithms
- **Sorting early**: Sorting teaches algorithm analysis, divide & conquer, and comparison — a foundational chapter`,

  activityExamples: {
    video: 'Animated visualization: show how a balanced BST self-rebalances during insertions. Step-by-step trace of Dijkstra\'s algorithm on a weighted graph, highlighting the priority queue operations.',
    reading: 'Data structure deep-dive: definition, invariants, operations with complexity table, pseudocode for each operation, implementation notes, comparison with alternatives, real-world usage.',
    assignment: 'Implement a hash table from scratch with: (1) hash function, (2) collision resolution (chaining), (3) resize/rehash, (4) get/set/delete operations. Test with provided test suite. Then solve 3 problems using hash tables.',
    quiz: 'Given a trace of an algorithm, identify which algorithm it is. Given operations and their complexities, identify the data structure. Predict the output of code using a specific data structure.',
    project: 'Build a real application: e.g., implement an autocomplete system using tries, or a route planner using graph shortest paths. Includes requirements, starter code, and performance benchmarks to meet.',
    discussion: 'Trade-off debate: "For a system that needs fast insertion AND fast lookup, would you choose a hash table or a balanced BST? Consider: ordered iteration, worst case, memory usage, cache performance."',
  },
};
