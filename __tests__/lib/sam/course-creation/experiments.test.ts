/**
 * A/B Testing Framework Tests
 */

import {
  assignVariant,
  getActiveExperiment,
  EXPERIMENTS,
  type ExperimentDefinition,
} from '@/lib/sam/course-creation/experiments';

// ============================================================================
// assignVariant
// ============================================================================

describe('assignVariant', () => {
  const testExperiment: ExperimentDefinition = {
    id: 'test-exp',
    name: 'Test Experiment',
    description: 'Testing',
    active: true,
    variants: ['control', 'treatment-a'],
  };

  it('returns a valid variant', () => {
    const variant = assignVariant('user-123', testExperiment);
    expect(testExperiment.variants).toContain(variant);
  });

  it('is deterministic — same user always gets same variant', () => {
    const variant1 = assignVariant('user-456', testExperiment);
    const variant2 = assignVariant('user-456', testExperiment);
    const variant3 = assignVariant('user-456', testExperiment);

    expect(variant1).toBe(variant2);
    expect(variant2).toBe(variant3);
  });

  it('different users can get different variants', () => {
    // Over 100 users, we should see both variants represented
    const variantCounts = new Map<string, number>();

    for (let i = 0; i < 100; i++) {
      const variant = assignVariant(`user-distribution-${i}`, testExperiment);
      variantCounts.set(variant, (variantCounts.get(variant) ?? 0) + 1);
    }

    // Both variants should appear at least once out of 100 users
    expect(variantCounts.has('control')).toBe(true);
    expect(variantCounts.has('treatment-a')).toBe(true);
  });

  it('distribution is approximately 50/50 over 1000 users', () => {
    const counts: Record<string, number> = { control: 0, 'treatment-a': 0 };

    for (let i = 0; i < 1000; i++) {
      const variant = assignVariant(`dist-check-${i}`, testExperiment);
      counts[variant]++;
    }

    // Each should be between 35-65% (generous range to avoid flaky tests)
    expect(counts.control).toBeGreaterThan(350);
    expect(counts.control).toBeLessThan(650);
    expect(counts['treatment-a']).toBeGreaterThan(350);
    expect(counts['treatment-a']).toBeLessThan(650);
  });

  it('supports 3+ variants', () => {
    const threeVariant: ExperimentDefinition = {
      id: 'three-way',
      name: 'Three Way',
      description: 'Testing',
      active: true,
      variants: ['a', 'b', 'c'],
    };

    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      seen.add(assignVariant(`user-3way-${i}`, threeVariant));
    }

    // All three should appear over 100 users
    expect(seen.size).toBe(3);
  });

  it('supports weighted variants', () => {
    const weighted: ExperimentDefinition = {
      id: 'weighted',
      name: 'Weighted',
      description: 'Testing',
      active: true,
      variants: ['control', 'treatment'],
      weights: [0.8, 0.2],
    };

    let controlCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (assignVariant(`weighted-${i}`, weighted) === 'control') {
        controlCount++;
      }
    }

    // Control should be approximately 80% (between 65-95% to avoid flakes)
    expect(controlCount).toBeGreaterThan(650);
    expect(controlCount).toBeLessThan(950);
  });
});

// ============================================================================
// getActiveExperiment
// ============================================================================

describe('getActiveExperiment', () => {
  it('returns null when no experiments are active', () => {
    // By default, all experiments in the registry are inactive
    const allInactive = EXPERIMENTS.every(e => !e.active);
    if (allInactive) {
      const assignment = getActiveExperiment('user-123');
      expect(assignment).toBeNull();
    }
  });

  it('returns a valid assignment structure when an experiment is active', () => {
    // Temporarily activate the first experiment for testing
    const original = EXPERIMENTS[0].active;
    EXPERIMENTS[0].active = true;

    try {
      const assignment = getActiveExperiment('user-123');
      expect(assignment).not.toBeNull();
      expect(assignment!.experimentId).toBe(EXPERIMENTS[0].id);
      expect(EXPERIMENTS[0].variants).toContain(assignment!.variant);
      expect(assignment!.userId).toBe('user-123');
      expect(assignment!.assignedAt).toBeTruthy();
    } finally {
      EXPERIMENTS[0].active = original;
    }
  });

  it('assignment is deterministic for same user', () => {
    const original = EXPERIMENTS[0].active;
    EXPERIMENTS[0].active = true;

    try {
      const a1 = getActiveExperiment('deterministic-user');
      const a2 = getActiveExperiment('deterministic-user');
      expect(a1!.variant).toBe(a2!.variant);
    } finally {
      EXPERIMENTS[0].active = original;
    }
  });
});

// ============================================================================
// getCourseDesignExpertise (from prompts)
// ============================================================================

describe('getCourseDesignExpertise', () => {
  // Import dynamically to avoid pulling in the full prompts module in all tests
  let getCourseDesignExpertise: (variant?: string) => string;

  beforeAll(async () => {
    const mod = await import('@/lib/sam/course-creation/prompts');
    getCourseDesignExpertise = mod.getCourseDesignExpertise;
  });

  it('returns ARROW framework by default', () => {
    const expertise = getCourseDesignExpertise();
    expect(expertise).toContain('ARROW');
    expect(expertise).toContain('Application');
  });

  it('returns ARROW framework for control variant', () => {
    const expertise = getCourseDesignExpertise('control');
    expect(expertise).toContain('ARROW');
  });

  it('returns traditional framework for treatment-a variant', () => {
    const expertise = getCourseDesignExpertise('treatment-a');
    expect(expertise).toContain('STRUCTURED TAXONOMY');
    expect(expertise).not.toContain('ARROW');
  });

  it('returns ARROW for unknown variant', () => {
    const expertise = getCourseDesignExpertise('unknown-variant');
    expect(expertise).toContain('ARROW');
  });
});
