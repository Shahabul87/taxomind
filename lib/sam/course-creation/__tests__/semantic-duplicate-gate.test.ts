/**
 * SemanticDuplicateGate -- Lexical Path Unit Tests
 *
 * Tests the lexical (Jaccard) similarity path of SemanticDuplicateGate.
 * The embedding provider is mocked to throw, forcing every assess() call
 * through the lexical fallback.
 *
 * Key implementation details under test:
 * - normalizeTokens: lowercase, strip non-alphanumeric, filter tokens with length <= 2
 * - lexicalSimilarity: Jaccard = |intersection| / |union| of token sets
 * - LEXICAL_DUPLICATE_THRESHOLD: 0.72
 * - buildSemanticText: joins title, topicFocus, concepts with ' | ', filters empty parts
 * - Constructor filters completedChapters where ch.position < currentChapter
 */

jest.mock('server-only', () => ({}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/sam/providers', () => ({
  getOpenAIEmbeddingProvider: jest.fn(() => {
    throw new Error('No provider');
  }),
}));

import {
  SemanticDuplicateGate,
} from '../semantic-duplicate-gate';

// ============================================================================
// Helpers
// ============================================================================

interface MockSection {
  position: number;
  title: string;
  topicFocus: string;
  conceptsIntroduced?: string[];
}

/**
 * Build a minimal CompletedChapter with only the fields SemanticDuplicateGate reads:
 * position, sections[].position, sections[].title, sections[].topicFocus,
 * sections[].conceptsIntroduced.
 */
function makeCompletedChapter(
  position: number,
  sections: MockSection[],
): any {
  return {
    position,
    id: `ch-${position}`,
    title: `Chapter ${position}`,
    description: `Description for chapter ${position}`,
    bloomsLevel: 'Remember',
    learningObjectives: [],
    keyTopics: [],
    prerequisites: '',
    estimatedTime: '30 min',
    topicsToExpand: [],
    sections: sections.map(s => ({
      ...s,
      id: `sec-${position}-${s.position}`,
      contentType: 'text',
      estimatedDuration: '10 min',
      parentChapterContext: {
        title: `Chapter ${position}`,
        bloomsLevel: 'Remember',
        relevantObjectives: [],
      },
      conceptsIntroduced: s.conceptsIntroduced ?? [],
    })),
  };
}

function makeCandidate(
  title: string,
  topicFocus: string,
  concepts?: string[],
): { title: string; topicFocus: string; concepts?: string[] } {
  return { title, topicFocus, concepts };
}

// ============================================================================
// Tests
// ============================================================================

describe('SemanticDuplicateGate (lexical path)', () => {
  // --------------------------------------------------------------------------
  // 1. Returns null when no existing sections
  // --------------------------------------------------------------------------
  it('returns null when completedChapters is empty', async () => {
    const gate = new SemanticDuplicateGate([], 5);
    const result = await gate.assess(makeCandidate('Intro to React', 'React basics'));

    expect(result).toBeNull();
  });

  it('returns null when chapters have no sections', async () => {
    const chapter = makeCompletedChapter(1, []);
    const gate = new SemanticDuplicateGate([chapter], 5);
    const result = await gate.assess(makeCandidate('Intro to React', 'React basics'));

    expect(result).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 2. Filters chapters at or after currentChapter
  // --------------------------------------------------------------------------
  it('returns null when all chapters are at or after currentChapter', async () => {
    const ch3 = makeCompletedChapter(3, [
      { position: 1, title: 'React Hooks Deep Dive', topicFocus: 'React hooks patterns' },
    ]);
    const ch5 = makeCompletedChapter(5, [
      { position: 1, title: 'React Hooks Deep Dive', topicFocus: 'React hooks patterns' },
    ]);

    // currentChapter = 3, so only chapters with position < 3 pass the filter
    const gate = new SemanticDuplicateGate([ch3, ch5], 3);
    const result = await gate.assess(makeCandidate('React Hooks Deep Dive', 'React hooks patterns'));

    expect(result).toBeNull();
  });

  it('includes chapters with position strictly less than currentChapter', async () => {
    const ch1 = makeCompletedChapter(1, [
      { position: 1, title: 'React Hooks Deep Dive', topicFocus: 'React hooks patterns' },
    ]);
    const ch3 = makeCompletedChapter(3, [
      { position: 1, title: 'Something Else Entirely', topicFocus: 'Unrelated topic' },
    ]);

    // currentChapter = 3, so ch1 (position 1) is included, ch3 (position 3) is filtered out
    const gate = new SemanticDuplicateGate([ch1, ch3], 3);
    const result = await gate.assess(makeCandidate('React Hooks Deep Dive', 'React hooks patterns'));

    expect(result).not.toBeNull();
    expect(result!.isDuplicate).toBe(true);
    expect(result!.match.chapter).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 3. Jaccard above 0.72 flags duplicate
  // --------------------------------------------------------------------------
  it('flags duplicate when Jaccard similarity exceeds threshold', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Introduction to React Components',
        topicFocus: 'Building reusable React components with props',
        conceptsIntroduced: ['components', 'props', 'jsx'],
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);

    // Candidate is nearly identical -- shares most tokens
    const result = await gate.assess(
      makeCandidate(
        'Introduction to React Components',
        'Building reusable React components with props',
        ['components', 'props', 'jsx'],
      ),
    );

    expect(result).not.toBeNull();
    expect(result!.isDuplicate).toBe(true);
    expect(result!.similarity).toBeGreaterThanOrEqual(0.72);
    expect(result!.threshold).toBe(0.72);
    expect(result!.mode).toBe('lexical');
  });

  it('returns similarity of 1.0 for identical content', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'State Management with Redux',
        topicFocus: 'Centralized state management patterns',
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);
    const result = await gate.assess(
      makeCandidate('State Management with Redux', 'Centralized state management patterns'),
    );

    expect(result).not.toBeNull();
    expect(result!.similarity).toBe(1);
    expect(result!.isDuplicate).toBe(true);
    expect(result!.mode).toBe('lexical');
  });

  // --------------------------------------------------------------------------
  // 4. Below threshold returns null
  // --------------------------------------------------------------------------
  it('returns null when sections are dissimilar', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Introduction to Databases',
        topicFocus: 'Relational database design fundamentals',
        conceptsIntroduced: ['tables', 'normalization', 'SQL'],
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);

    // Completely different topic
    const result = await gate.assess(
      makeCandidate(
        'Advanced CSS Grid Layouts',
        'Responsive design with CSS grid and flexbox',
        ['grid', 'flexbox', 'responsive'],
      ),
    );

    expect(result).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 5. normalizeTokens lowercases and strips non-alphanumeric
  // --------------------------------------------------------------------------
  it('treats text with different casing and punctuation as equivalent', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'React.js Components!',
        topicFocus: 'Building REUSABLE Components (React)',
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);

    // Same words but different casing and punctuation
    const result = await gate.assess(
      makeCandidate('react js components', 'building reusable components react'),
    );

    expect(result).not.toBeNull();
    expect(result!.isDuplicate).toBe(true);
    expect(result!.similarity).toBe(1);
    expect(result!.mode).toBe('lexical');
  });

  // --------------------------------------------------------------------------
  // 6. Short tokens (length <= 2) are filtered
  // --------------------------------------------------------------------------
  it('filters out tokens with length <= 2 so they do not affect similarity', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Understanding the JavaScript Event Loop',
        topicFocus: 'How the event loop works in JavaScript',
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);

    // Add many short noise words -- "to", "is", "a", "of", "an", "in" are all <= 2 chars
    // and get filtered. The meaningful tokens remain the same.
    // Existing semantic text tokens (after normalize):
    //   "understanding", "the", "javascript", "event", "loop", "how", "the", "event", "loop", "works", "javascript"
    //   After filter (> 2): "understanding", "the", "javascript", "event", "loop", "how", "event", "loop", "works", "javascript"
    //   Unique set: { understanding, the, javascript, event, loop, how, works }
    // Candidate tokens:
    //   "understanding", "the", "javascript", "event", "loop", "how", "the", "event", "loop", "works", "in", "javascript"
    //   After filter (> 2): same set minus "in" (length 2)
    //   Unique set: { understanding, the, javascript, event, loop, how, works }
    // Jaccard = 7/7 = 1.0

    const result = await gate.assess(
      makeCandidate(
        'Understanding the JavaScript Event Loop',
        'How the event loop works in JavaScript',
      ),
    );

    expect(result).not.toBeNull();
    expect(result!.similarity).toBe(1);

    // Now test that short tokens truly have no impact by verifying a candidate
    // that differs only in short stop words still matches identically
    const gate2 = new SemanticDuplicateGate(
      [
        makeCompletedChapter(1, [
          {
            position: 1,
            title: 'React State Management',
            topicFocus: 'Managing state in React apps',
          },
        ]),
      ],
      5,
    );

    // "in" is filtered (length 2). Both texts tokenize to the same meaningful set.
    const r1 = await gate2.assess(
      makeCandidate('React State Management', 'Managing state in React apps'),
    );
    const r2 = await gate2.assess(
      makeCandidate('React State Management', 'Managing state React apps'),
    );

    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.similarity).toBe(r2!.similarity);
  });

  // --------------------------------------------------------------------------
  // 7. Candidate with empty title and topicFocus returns null
  // --------------------------------------------------------------------------
  it('returns null when candidate has empty title and topicFocus', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Introduction to React',
        topicFocus: 'React fundamentals',
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);
    const result = await gate.assess(makeCandidate('', ''));

    expect(result).toBeNull();
  });

  it('returns null when candidate text is only whitespace', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Introduction to React',
        topicFocus: 'React fundamentals',
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);
    const result = await gate.assess(makeCandidate('   ', '   '));

    expect(result).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 8. Correct match data returned
  // --------------------------------------------------------------------------
  it('returns the correct match metadata in the assessment', async () => {
    const ch2 = makeCompletedChapter(2, [
      {
        position: 3,
        title: 'Advanced TypeScript Generics',
        topicFocus: 'Generic type constraints and utility types',
        conceptsIntroduced: ['generics', 'constraints', 'utility types'],
      },
    ]);

    const gate = new SemanticDuplicateGate([ch2], 5);

    const result = await gate.assess(
      makeCandidate(
        'Advanced TypeScript Generics',
        'Generic type constraints and utility types',
        ['generics', 'constraints', 'utility types'],
      ),
    );

    expect(result).not.toBeNull();
    const assessment = result!;

    expect(assessment.isDuplicate).toBe(true);
    expect(assessment.mode).toBe('lexical');
    expect(assessment.threshold).toBe(0.72);
    expect(assessment.match).toEqual({
      chapter: 2,
      section: 3,
      title: 'Advanced TypeScript Generics',
      topicFocus: 'Generic type constraints and utility types',
    });
  });

  // --------------------------------------------------------------------------
  // 9. Multiple existing sections -- best (highest similarity) match returned
  // --------------------------------------------------------------------------
  it('returns the highest-similarity match across multiple sections', async () => {
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'Introduction to CSS Flexbox',
        topicFocus: 'Flexbox layout basics',
        conceptsIntroduced: ['flexbox', 'layout'],
      },
      {
        position: 2,
        title: 'CSS Grid Fundamentals',
        topicFocus: 'CSS Grid layout system',
        conceptsIntroduced: ['grid', 'layout'],
      },
    ]);

    const ch2 = makeCompletedChapter(2, [
      {
        position: 1,
        title: 'Advanced CSS Grid Patterns',
        topicFocus: 'Complex grid layouts and responsive design',
        conceptsIntroduced: ['grid', 'responsive', 'patterns'],
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1, ch2], 5);

    // Candidate strongly overlaps with ch2's section about advanced CSS Grid
    const result = await gate.assess(
      makeCandidate(
        'Advanced CSS Grid Patterns',
        'Complex grid layouts and responsive design patterns',
        ['grid', 'responsive'],
      ),
    );

    expect(result).not.toBeNull();
    expect(result!.isDuplicate).toBe(true);
    expect(result!.match.chapter).toBe(2);
    expect(result!.match.section).toBe(1);
    expect(result!.match.title).toBe('Advanced CSS Grid Patterns');
  });

  it('picks the better match even when both exceed threshold', async () => {
    // Two sections that both overlap with the candidate, but one more than the other
    const ch1 = makeCompletedChapter(1, [
      {
        position: 1,
        title: 'React Hooks useState useEffect',
        topicFocus: 'React hooks for state and side effects',
        conceptsIntroduced: ['useState', 'useEffect', 'hooks'],
      },
      {
        position: 2,
        title: 'React Hooks useState useEffect useCallback useMemo',
        topicFocus: 'React hooks for state side effects performance optimization',
        conceptsIntroduced: ['useState', 'useEffect', 'useCallback', 'useMemo', 'hooks'],
      },
    ]);

    const gate = new SemanticDuplicateGate([ch1], 5);

    // Candidate matches section 2 more closely (includes performance-related tokens)
    const result = await gate.assess(
      makeCandidate(
        'React Hooks useState useEffect useCallback useMemo',
        'React hooks for state side effects performance optimization',
        ['useState', 'useEffect', 'useCallback', 'useMemo', 'hooks'],
      ),
    );

    expect(result).not.toBeNull();
    expect(result!.isDuplicate).toBe(true);
    // Section 2 should be the best match (higher or equal similarity)
    expect(result!.match.section).toBe(2);
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles concepts contributing to semantic text', async () => {
      // Concepts are appended to the semantic text, so matching concepts increase
      // Jaccard overlap while missing concepts lower it.
      //
      // Existing section semantic text (with concepts):
      //   "Testing Patterns | Unit testing approaches | mocking, stubs, assertions, coverage"
      //   Tokens (>2): { testing, patterns, unit, approaches, mocking, stubs, assertions, coverage } = 8
      //
      // Candidate WITH concepts:
      //   "Testing Patterns | Unit testing approaches | mocking, stubs, assertions, coverage"
      //   Tokens: same 8 -> Jaccard = 8/8 = 1.0 (duplicate)
      //
      // Candidate WITHOUT concepts:
      //   "Testing Patterns | Unit testing approaches"
      //   Tokens: { testing, patterns, unit, approaches } = 4
      //   Jaccard = 4 / (8 + 4 - 4) = 4/8 = 0.5 (below 0.72 threshold -> null)

      const ch1 = makeCompletedChapter(1, [
        {
          position: 1,
          title: 'Testing Patterns',
          topicFocus: 'Unit testing approaches',
          conceptsIntroduced: ['mocking', 'stubs', 'assertions', 'coverage'],
        },
      ]);

      const gate = new SemanticDuplicateGate([ch1], 5);

      // Candidate shares concepts, boosting token overlap to 1.0
      const withConcepts = await gate.assess(
        makeCandidate('Testing Patterns', 'Unit testing approaches', [
          'mocking',
          'stubs',
          'assertions',
          'coverage',
        ]),
      );

      // Candidate without concepts -- Jaccard drops to 0.5, below threshold
      const withoutConcepts = await gate.assess(
        makeCandidate('Testing Patterns', 'Unit testing approaches'),
      );

      expect(withConcepts).not.toBeNull();
      expect(withConcepts!.isDuplicate).toBe(true);
      expect(withConcepts!.similarity).toBe(1);

      // Without concepts the overlap is too low to trigger duplicate detection
      expect(withoutConcepts).toBeNull();
    });

    it('assess can be called multiple times on the same gate instance', async () => {
      const ch1 = makeCompletedChapter(1, [
        {
          position: 1,
          title: 'Node.js Streams',
          topicFocus: 'Working with readable and writable streams',
        },
      ]);

      const gate = new SemanticDuplicateGate([ch1], 5);

      const r1 = await gate.assess(
        makeCandidate('Node.js Streams', 'Working with readable and writable streams'),
      );
      const r2 = await gate.assess(
        makeCandidate('Completely Different Topic', 'Something about databases and SQL'),
      );
      const r3 = await gate.assess(
        makeCandidate('Node.js Streams', 'Working with readable and writable streams'),
      );

      expect(r1).not.toBeNull();
      expect(r1!.isDuplicate).toBe(true);

      expect(r2).toBeNull();

      expect(r3).not.toBeNull();
      expect(r3!.similarity).toBe(r1!.similarity);
    });

    it('rounds similarity to 2 decimal places', async () => {
      // Craft two texts that produce a Jaccard value requiring rounding.
      // Existing: "alpha bravo charlie delta echo foxtrot golf hotel"
      //   tokens (>2): { alpha, bravo, charlie, delta, echo, foxtrot, golf, hotel } = 8
      // Candidate: "alpha bravo charlie delta echo foxtrot golf india"
      //   tokens (>2): { alpha, bravo, charlie, delta, echo, foxtrot, golf, india } = 8
      // intersection = 7, union = 9, Jaccard = 7/9 = 0.7777... -> rounded to 0.78
      const ch1 = makeCompletedChapter(1, [
        {
          position: 1,
          title: 'alpha bravo charlie delta',
          topicFocus: 'echo foxtrot golf hotel',
        },
      ]);

      const gate = new SemanticDuplicateGate([ch1], 5);
      const result = await gate.assess(
        makeCandidate('alpha bravo charlie delta', 'echo foxtrot golf india'),
      );

      expect(result).not.toBeNull();
      expect(result!.similarity).toBe(0.78);
      // Verify it has at most 2 decimal places
      const decimalStr = result!.similarity.toString();
      const decimalPart = decimalStr.split('.')[1] ?? '';
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    });
  });
});
