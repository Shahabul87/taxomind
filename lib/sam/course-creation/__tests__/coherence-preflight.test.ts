/**
 * Coherence Preflight — Unit Tests
 *
 * Tests the lightweight pre-generation coherence check that runs
 * BEFORE the expensive course creation pipeline starts.
 */

import { runCoherencePreflight, type PreflightConfig } from '../coherence-preflight';

// ============================================================================
// Helpers
// ============================================================================

function makeChapter(overrides: Partial<{
  title: string;
  goal: string;
  bloomsLevel: string;
  sections: Array<{ title: string; keyTopics: string[] }>;
}> = {}) {
  return {
    title: overrides.title ?? 'Introduction to React Hooks',
    goal: overrides.goal ?? 'Learn the basics of React hooks',
    bloomsLevel: overrides.bloomsLevel ?? 'UNDERSTAND',
    sections: overrides.sections ?? [
      { title: 'useState Basics', keyTopics: ['useState', 'state management'] },
      { title: 'useEffect Patterns', keyTopics: ['side effects', 'cleanup'] },
    ],
  };
}

function makeConfig(overrides: Partial<PreflightConfig> = {}): PreflightConfig {
  return {
    courseTitle: 'Mastering React Hooks',
    courseGoals: ['Understand React hooks', 'Build custom hooks'],
    teacherBlueprint: {
      chapters: [
        makeChapter({ bloomsLevel: 'REMEMBER', title: 'React Hooks Fundamentals' }),
        makeChapter({ bloomsLevel: 'UNDERSTAND', title: 'Understanding React State' }),
        makeChapter({ bloomsLevel: 'APPLY', title: 'Building Custom React Hooks' }),
        makeChapter({ bloomsLevel: 'ANALYZE', title: 'Analyzing Hook Performance' }),
      ],
    },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('runCoherencePreflight', () => {
  // --- No blueprint ---

  it('returns perfect score when no blueprint provided', () => {
    const result = runCoherencePreflight({
      courseTitle: 'Test',
      courseGoals: [],
      teacherBlueprint: undefined,
    });
    expect(result.score).toBe(100);
    expect(result.warnings).toHaveLength(0);
    expect(result.passed).toBe(true);
  });

  it('returns perfect score for empty chapters array', () => {
    const result = runCoherencePreflight({
      courseTitle: 'Test',
      courseGoals: [],
      teacherBlueprint: { chapters: [] },
    });
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });

  // --- Well-formed blueprint ---

  it('returns high score for well-structured blueprint', () => {
    const result = runCoherencePreflight(makeConfig());
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.passed).toBe(true);
  });

  // --- Bloom&apos;s regression ---

  it('detects single Bloom&apos;s level regression', () => {
    const config = makeConfig({
      teacherBlueprint: {
        chapters: [
          makeChapter({ bloomsLevel: 'APPLY', title: 'Applying React Hooks' }),
          makeChapter({ bloomsLevel: 'REMEMBER', title: 'Recalling React Basics' }),
          makeChapter({ bloomsLevel: 'ANALYZE', title: 'Analyzing React Patterns' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.some(w => w.includes('regression'))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it('detects multiple Bloom&apos;s regressions', () => {
    const config = makeConfig({
      teacherBlueprint: {
        chapters: [
          makeChapter({ bloomsLevel: 'ANALYZE', title: 'Analyzing React Hooks' }),
          makeChapter({ bloomsLevel: 'REMEMBER', title: 'Basic React Concepts' }),
          makeChapter({ bloomsLevel: 'EVALUATE', title: 'Evaluating Hook Patterns' }),
          makeChapter({ bloomsLevel: 'UNDERSTAND', title: 'Understanding React State' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.some(w => w.includes('2'))).toBe(true);
    // Two regressions = -20 points
    expect(result.score).toBeLessThanOrEqual(80);
  });

  it('allows same level across consecutive chapters (no regression)', () => {
    const config = makeConfig({
      teacherBlueprint: {
        chapters: [
          makeChapter({ bloomsLevel: 'APPLY', title: 'Applying React Hooks Part 1' }),
          makeChapter({ bloomsLevel: 'APPLY', title: 'Applying React Hooks Part 2' }),
          makeChapter({ bloomsLevel: 'ANALYZE', title: 'Analyzing React Performance' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.filter(w => w.includes('regression'))).toHaveLength(0);
  });

  // --- Scope coherence ---

  it('warns when majority of chapters are off-topic', () => {
    const config = makeConfig({
      courseTitle: 'Mastering React Hooks',
      teacherBlueprint: {
        chapters: [
          makeChapter({ title: 'Cooking Italian Pasta', goal: 'Learn pasta making' }),
          makeChapter({ title: 'Gardening Tips', goal: 'Grow vegetables' }),
          makeChapter({ title: 'Photography Basics', goal: 'Take better photos' }),
          makeChapter({ title: 'Understanding React State', goal: 'Learn React state management' }),
          makeChapter({ title: 'Yoga for Beginners', goal: 'Start yoga practice' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.some(w => w.includes('off-topic'))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it('does not warn when chapters are on-topic via goal field', () => {
    const config = makeConfig({
      courseTitle: 'Mastering React Hooks',
      teacherBlueprint: {
        chapters: [
          makeChapter({ title: 'Getting Started', goal: 'Set up a React project with hooks' }),
          makeChapter({ title: 'Core Concepts', goal: 'Understand React hook lifecycle' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.filter(w => w.includes('off-topic'))).toHaveLength(0);
  });

  // --- Section density ---

  it('warns about chapters with empty key topics', () => {
    const config = makeConfig({
      teacherBlueprint: {
        chapters: [
          makeChapter({
            title: 'React Hooks Intro',
            sections: [
              { title: 'Overview', keyTopics: [] },
              { title: 'Setup', keyTopics: ['npm', 'create-react-app'] },
            ],
          }),
          makeChapter(),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.some(w => w.includes('no key topics'))).toBe(true);
  });

  it('does not warn when all sections have key topics', () => {
    const config = makeConfig();
    const result = runCoherencePreflight(config);
    expect(result.warnings.filter(w => w.includes('key topics'))).toHaveLength(0);
  });

  // --- Goal alignment ---

  it('warns when course goals are not reflected in blueprint', () => {
    const config = makeConfig({
      courseGoals: ['Master quantum computing principles', 'Build quantum circuits'],
      teacherBlueprint: {
        chapters: [
          makeChapter({ title: 'React Hooks Intro', goal: 'Learn hooks' }),
          makeChapter({ title: 'Advanced React Patterns', goal: 'Build components' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.some(w => w.includes('goal(s) not reflected'))).toBe(true);
  });

  it('does not warn when goals match chapter content', () => {
    const config = makeConfig({
      courseGoals: ['Understand React hooks', 'Build custom hooks'],
      teacherBlueprint: {
        chapters: [
          makeChapter({ title: 'Understanding React Hooks', goal: 'Core hooks concepts' }),
          makeChapter({ title: 'Building Custom Hooks', goal: 'Create reusable hooks' }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.warnings.filter(w => w.includes('goal(s)'))).toHaveLength(0);
  });

  it('handles empty courseGoals gracefully', () => {
    const config = makeConfig({ courseGoals: [] });
    const result = runCoherencePreflight(config);
    expect(result.warnings.filter(w => w.includes('goal'))).toHaveLength(0);
  });

  // --- Score clamping ---

  it('clamps score to 0 minimum', () => {
    // Create a blueprint with extreme issues to push score below 0
    const config = makeConfig({
      courseGoals: Array.from({ length: 15 }, (_, i) =>
        `Unrelated quantum physics goal number ${i} about advanced particle theory`,
      ),
      teacherBlueprint: {
        chapters: Array.from({ length: 5 }, (_, i) => makeChapter({
          bloomsLevel: i % 2 === 0 ? 'CREATE' : 'REMEMBER',
          title: `Completely Off Topic Chapter ${i}`,
          goal: `Nothing at all ${i}`,
          sections: [
            { title: `Empty Section ${i}a`, keyTopics: [] },
            { title: `Empty Section ${i}b`, keyTopics: [] },
          ],
        })),
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.score).toBeGreaterThanOrEqual(0);
    // With 2+ Bloom's regressions (-20+), 5 empty section chapters (-25),
    // off-topic chapters (-15), and 15 unmatched goals (-120), score should be 0
    expect(result.score).toBe(0);
  });

  it('clamps score to 100 maximum', () => {
    const result = runCoherencePreflight(makeConfig());
    expect(result.score).toBeLessThanOrEqual(100);
  });

  // --- Pass threshold ---

  it('passes when score is above threshold', () => {
    const result = runCoherencePreflight(makeConfig());
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('fails when score drops below threshold', () => {
    // Create a blueprint with many issues
    const config = makeConfig({
      courseGoals: ['Master quantum mechanics', 'Build particle accelerators'],
      teacherBlueprint: {
        chapters: [
          makeChapter({ bloomsLevel: 'CREATE', title: 'Cooking 101', goal: 'Cook food', sections: [{ title: 'S1', keyTopics: [] }] }),
          makeChapter({ bloomsLevel: 'REMEMBER', title: 'Gardening', goal: 'Grow plants', sections: [{ title: 'S2', keyTopics: [] }] }),
          makeChapter({ bloomsLevel: 'EVALUATE', title: 'Photography', goal: 'Take photos', sections: [{ title: 'S3', keyTopics: [] }] }),
          makeChapter({ bloomsLevel: 'UNDERSTAND', title: 'Yoga', goal: 'Stretch', sections: [{ title: 'S4', keyTopics: [] }] }),
          makeChapter({ bloomsLevel: 'APPLY', title: 'Pottery', goal: 'Make pots', sections: [{ title: 'S5', keyTopics: [] }] }),
        ],
      },
    });
    const result = runCoherencePreflight(config);
    expect(result.passed).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
