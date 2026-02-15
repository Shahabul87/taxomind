/**
 * Chapter Templates (Chapter DNA) Tests
 *
 * Validates template definitions, lookup functions, and prompt block composition
 * for the template-driven course generation system.
 *
 * Updated for level-specific section counts: beginner=8, intermediate=7, advanced=8.
 */

import {
  getTemplateForDifficulty,
  getTemplateSectionDef,
  composeTemplatePromptBlocks,
  TEACHING_LAWS,
  UNIVERSAL_CONSISTENCY_RULES,
  type ChapterTemplate,
  type TemplateSectionDef,
} from '@/lib/sam/course-creation/chapter-templates';
import { FEW_SHOT_EXAMPLES } from '@/lib/sam/course-creation/few-shot-examples';

// ============================================================================
// Template Lookup
// ============================================================================

describe('getTemplateForDifficulty', () => {
  it('returns beginner template for "beginner"', () => {
    const template = getTemplateForDifficulty('beginner');
    expect(template.difficulty).toBe('beginner');
    expect(template.displayName).toBe('Beginner Template');
    expect(template.totalSections).toBe(8);
    expect(template.sections).toHaveLength(8);
  });

  it('returns intermediate template for "intermediate"', () => {
    const template = getTemplateForDifficulty('intermediate');
    expect(template.difficulty).toBe('intermediate');
    expect(template.displayName).toBe('Intermediate Template');
    expect(template.totalSections).toBe(7);
    expect(template.sections).toHaveLength(7);
  });

  it('returns advanced template for "advanced"', () => {
    const template = getTemplateForDifficulty('advanced');
    expect(template.difficulty).toBe('advanced');
    expect(template.displayName).toBe('Advanced Template');
    expect(template.totalSections).toBe(8);
    expect(template.sections).toHaveLength(8);
  });

  it('falls back to advanced template for "expert"', () => {
    const template = getTemplateForDifficulty('expert');
    expect(template.difficulty).toBe('advanced');
  });

  it('falls back to intermediate template for unknown difficulty', () => {
    const template = getTemplateForDifficulty('unknown-level');
    expect(template.difficulty).toBe('intermediate');
  });

  it('handles case-insensitive input', () => {
    const lower = getTemplateForDifficulty('beginner');
    const upper = getTemplateForDifficulty('BEGINNER');
    expect(lower.difficulty).toBe(upper.difficulty);
  });
});

// ============================================================================
// Template Section Definitions
// ============================================================================

describe('getTemplateSectionDef', () => {
  it('returns correct section for beginner position 1 (HOOK)', () => {
    const def = getTemplateSectionDef('beginner', 1);
    expect(def).toBeDefined();
    expect(def!.position).toBe(1);
    expect(def!.role).toBe('HOOK');
    expect(def!.displayName).toBe('THE HOOK');
  });

  it('returns correct section for beginner position 8 (CHECKPOINT)', () => {
    const def = getTemplateSectionDef('beginner', 8);
    expect(def).toBeDefined();
    expect(def!.position).toBe(8);
    expect(def!.role).toBe('CHECKPOINT');
    expect(def!.displayName).toBe('THE CHECKPOINT');
  });

  it('returns correct section for intermediate position 7 (CHECKPOINT)', () => {
    const def = getTemplateSectionDef('intermediate', 7);
    expect(def).toBeDefined();
    expect(def!.position).toBe(7);
    expect(def!.role).toBe('CHECKPOINT');
    expect(def!.displayName).toBe('THE CHECKPOINT');
  });

  it('returns correct section for advanced position 1 (OPEN_QUESTION)', () => {
    const def = getTemplateSectionDef('advanced', 1);
    expect(def).toBeDefined();
    expect(def!.position).toBe(1);
    expect(def!.role).toBe('OPEN_QUESTION');
    expect(def!.displayName).toBe('THE OPEN QUESTION');
  });

  it('throws for invalid position 0', () => {
    expect(() => getTemplateSectionDef('beginner', 0)).toThrow();
  });

  it('throws for position exceeding template section count', () => {
    // beginner has 8, so position 9 should throw
    expect(() => getTemplateSectionDef('beginner', 9)).toThrow();
    // intermediate has 7, so position 8 should throw
    expect(() => getTemplateSectionDef('intermediate', 8)).toThrow();
    // advanced has 8, so position 9 should throw
    expect(() => getTemplateSectionDef('advanced', 9)).toThrow();
  });
});

// ============================================================================
// Template Structure Validation
// ============================================================================

describe('template structure', () => {
  const EXPECTED_BEGINNER_ROLES = [
    'HOOK', 'INTUITION', 'WALKTHROUGH', 'FORMALIZATION', 'PLAYGROUND',
    'PITFALLS', 'SUMMARY', 'CHECKPOINT',
  ];

  const EXPECTED_INTERMEDIATE_ROLES = [
    'PROVOCATION', 'INTUITION_ENGINE', 'DERIVATION', 'LABORATORY',
    'DEPTH_DIVE', 'SYNTHESIS', 'CHECKPOINT',
  ];

  const EXPECTED_ADVANCED_ROLES = [
    'OPEN_QUESTION', 'INTUITION', 'FIRST_PRINCIPLES', 'ANALYSIS',
    'DESIGN_STUDIO', 'FRONTIER', 'SYNTHESIS', 'CHECKPOINT',
  ];

  const templateSpecs = [
    { difficulty: 'beginner' as const, expectedSections: 8, expectedRoles: EXPECTED_BEGINNER_ROLES },
    { difficulty: 'intermediate' as const, expectedSections: 7, expectedRoles: EXPECTED_INTERMEDIATE_ROLES },
    { difficulty: 'advanced' as const, expectedSections: 8, expectedRoles: EXPECTED_ADVANCED_ROLES },
  ];

  for (const spec of templateSpecs) {
    describe(`${spec.difficulty} template`, () => {
      let template: ChapterTemplate;

      beforeEach(() => {
        template = getTemplateForDifficulty(spec.difficulty);
      });

      it(`has exactly ${spec.expectedSections} sections`, () => {
        expect(template.sections).toHaveLength(spec.expectedSections);
        expect(template.totalSections).toBe(spec.expectedSections);
      });

      it(`sections have correct positions 1-${spec.expectedSections}`, () => {
        template.sections.forEach((sec, i) => {
          expect(sec.position).toBe(i + 1);
        });
      });

      it(`sections have all ${spec.expectedSections} expected roles in order`, () => {
        const roles = template.sections.map(s => s.role);
        expect(roles).toEqual(spec.expectedRoles);
      });

      it('all sections have valid content types', () => {
        const validTypes = ['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'];
        template.sections.forEach(sec => {
          expect(validTypes).toContain(sec.contentType);
        });
      });

      it('CHECKPOINT section has contentType "quiz"', () => {
        const checkpoint = template.sections.find(s => s.role === 'CHECKPOINT');
        expect(checkpoint).toBeDefined();
        expect(checkpoint!.contentType).toBe('quiz');
      });

      it('all sections have valid word count ranges', () => {
        template.sections.forEach(sec => {
          expect(sec.wordCountRange.min).toBeGreaterThan(0);
          expect(sec.wordCountRange.max).toBeGreaterThan(sec.wordCountRange.min);
        });
      });

      it('all sections have non-empty Bloom&apos;s levels', () => {
        template.sections.forEach(sec => {
          expect(sec.bloomsLevels.length).toBeGreaterThan(0);
        });
      });

      it('all sections have non-empty format rules', () => {
        template.sections.forEach(sec => {
          expect(sec.formatRules.length).toBeGreaterThan(0);
        });
      });

      it('all sections have non-empty purpose', () => {
        template.sections.forEach(sec => {
          expect(sec.purpose.length).toBeGreaterThan(0);
        });
      });

      it('all sections have non-empty displayName starting with "THE "', () => {
        template.sections.forEach(sec => {
          expect(sec.displayName.length).toBeGreaterThan(0);
          expect(sec.displayName.startsWith('THE ')).toBe(true);
        });
      });

      it('all sections have consistencyRules array', () => {
        template.sections.forEach(sec => {
          expect(Array.isArray(sec.consistencyRules)).toBe(true);
          expect(sec.consistencyRules.length).toBeGreaterThan(0);
        });
      });

      it('has valid chapter word range', () => {
        expect(template.chapterWordRange.min).toBeGreaterThan(0);
        expect(template.chapterWordRange.max).toBeGreaterThan(template.chapterWordRange.min);
      });

      it('has teaching laws', () => {
        expect(template.teachingLaws.length).toBe(5);
      });

      it('has exercise types', () => {
        expect(template.exerciseTypes.length).toBeGreaterThanOrEqual(3);
      });

      it('has designPhilosophy', () => {
        expect(template.designPhilosophy.length).toBeGreaterThan(0);
      });

      it('has chapterChecklist', () => {
        expect(template.chapterChecklist.length).toBeGreaterThan(0);
      });

      it('has estimatedTimePerChapter', () => {
        expect(template.estimatedTimePerChapter.length).toBeGreaterThan(0);
      });

      it('has explainToAFriend', () => {
        expect(template.explainToAFriend.length).toBeGreaterThan(0);
      });
    });
  }

  it('beginner template has lower word counts than advanced', () => {
    const beginner = getTemplateForDifficulty('beginner');
    const advanced = getTemplateForDifficulty('advanced');

    expect(beginner.chapterWordRange.min).toBeLessThan(advanced.chapterWordRange.min);
    expect(beginner.chapterWordRange.max).toBeLessThan(advanced.chapterWordRange.max);
  });

  it('beginner first section word count is lower than advanced first section', () => {
    const beginnerFirst = getTemplateSectionDef('beginner', 1)!;
    const advancedFirst = getTemplateSectionDef('advanced', 1)!;

    expect(beginnerFirst.wordCountRange.min).toBeLessThanOrEqual(advancedFirst.wordCountRange.min);
  });

  it('beginner first section is HOOK', () => {
    const hook = getTemplateSectionDef('beginner', 1)!;
    expect(hook.role).toBe('HOOK');
    expect(hook.contentType).toBe('reading');
  });

  it('intermediate first section is PROVOCATION', () => {
    const prov = getTemplateSectionDef('intermediate', 1)!;
    expect(prov.role).toBe('PROVOCATION');
    expect(prov.contentType).toBe('reading');
  });

  it('advanced first section is OPEN_QUESTION', () => {
    const oq = getTemplateSectionDef('advanced', 1)!;
    expect(oq.role).toBe('OPEN_QUESTION');
    expect(oq.contentType).toBe('reading');
  });

  it('beginner has PLAYGROUND (assignment)', () => {
    const beginner = getTemplateForDifficulty('beginner');
    const playground = beginner.sections.find(s => s.role === 'PLAYGROUND');
    expect(playground).toBeDefined();
    expect(playground!.contentType).toBe('assignment');
  });

  it('intermediate has LABORATORY (assignment)', () => {
    const intermediate = getTemplateForDifficulty('intermediate');
    const lab = intermediate.sections.find(s => s.role === 'LABORATORY');
    expect(lab).toBeDefined();
    expect(lab!.contentType).toBe('assignment');
  });

  it('advanced has DESIGN_STUDIO (assignment)', () => {
    const advanced = getTemplateForDifficulty('advanced');
    const studio = advanced.sections.find(s => s.role === 'DESIGN_STUDIO');
    expect(studio).toBeDefined();
    expect(studio!.contentType).toBe('assignment');
  });
});

// ============================================================================
// Teaching Laws
// ============================================================================

describe('TEACHING_LAWS', () => {
  it('contains exactly 5 laws', () => {
    expect(TEACHING_LAWS).toHaveLength(5);
  });

  it('each law is a non-empty string', () => {
    TEACHING_LAWS.forEach(law => {
      expect(typeof law).toBe('string');
      expect(law.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Universal Consistency Rules
// ============================================================================

describe('UNIVERSAL_CONSISTENCY_RULES', () => {
  it('contains exactly 11 rules', () => {
    expect(UNIVERSAL_CONSISTENCY_RULES).toHaveLength(11);
  });

  it('each rule is a non-empty string', () => {
    UNIVERSAL_CONSISTENCY_RULES.forEach(rule => {
      expect(typeof rule).toBe('string');
      expect(rule.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Prompt Block Composition
// ============================================================================

describe('composeTemplatePromptBlocks', () => {
  it('returns non-empty prompt blocks for all beginner positions', () => {
    const template = getTemplateForDifficulty('beginner');
    for (let pos = 1; pos <= 8; pos++) {
      const blocks = composeTemplatePromptBlocks(template, pos);
      expect(blocks.stage1Block.length).toBeGreaterThan(0);
      expect(blocks.stage2Block.length).toBeGreaterThan(0);
      expect(blocks.stage3Block.length).toBeGreaterThan(0);
      expect(blocks.totalSections).toBe(8);
    }
  });

  it('returns non-empty prompt blocks for all intermediate positions', () => {
    const template = getTemplateForDifficulty('intermediate');
    for (let pos = 1; pos <= 7; pos++) {
      const blocks = composeTemplatePromptBlocks(template, pos);
      expect(blocks.stage1Block.length).toBeGreaterThan(0);
      expect(blocks.stage2Block.length).toBeGreaterThan(0);
      expect(blocks.stage3Block.length).toBeGreaterThan(0);
      expect(blocks.totalSections).toBe(7);
    }
  });

  it('returns non-empty prompt blocks for all advanced positions', () => {
    const template = getTemplateForDifficulty('advanced');
    for (let pos = 1; pos <= 8; pos++) {
      const blocks = composeTemplatePromptBlocks(template, pos);
      expect(blocks.stage1Block.length).toBeGreaterThan(0);
      expect(blocks.stage2Block.length).toBeGreaterThan(0);
      expect(blocks.stage3Block.length).toBeGreaterThan(0);
      expect(blocks.totalSections).toBe(8);
    }
  });

  it('stage1Block mentions Chapter DNA', () => {
    const template = getTemplateForDifficulty('intermediate');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage1Block).toContain('Chapter DNA');
  });

  it('stage1Block contains designPhilosophy', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage1Block).toContain(template.designPhilosophy);
  });

  it('stage1Block contains Universal Consistency Rules', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage1Block).toContain('Universal Consistency Rules');
  });

  it('stage1Block contains chapterChecklist', () => {
    const template = getTemplateForDifficulty('intermediate');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage1Block).toContain('Chapter Checklist');
  });

  it('stage1Block contains explainToAFriend', () => {
    const template = getTemplateForDifficulty('advanced');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage1Block).toContain(template.explainToAFriend);
  });

  it('stage2Block contains section role name', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage2Block).toContain('THE HOOK');
  });

  it('stage2Block contains intermediate PROVOCATION role', () => {
    const template = getTemplateForDifficulty('intermediate');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage2Block).toContain('THE PROVOCATION');
  });

  it('stage3Block contains format rules', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 5); // PLAYGROUND
    expect(blocks.stage3Block).toContain('PLAYGROUND');
  });

  it('stage3Block contains consistency rules', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1); // HOOK
    expect(blocks.stage3Block).toContain('Consistency Rules');
  });

  it('stage3Block contains word count guidance', () => {
    const template = getTemplateForDifficulty('beginner');
    const hookDef = template.sections[0];
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage3Block).toContain(String(hookDef.wordCountRange.min));
    expect(blocks.stage3Block).toContain(String(hookDef.wordCountRange.max));
  });

  it('stage3Block contains explainToAFriend', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage3Block).toContain(template.explainToAFriend);
  });

  it('prompt blocks differ by difficulty', () => {
    const beginner = composeTemplatePromptBlocks(getTemplateForDifficulty('beginner'), 1);
    const advanced = composeTemplatePromptBlocks(getTemplateForDifficulty('advanced'), 1);
    expect(beginner.stage3Block).not.toBe(advanced.stage3Block);
  });

  it('prompt blocks differ by section position', () => {
    const template = getTemplateForDifficulty('beginner');
    const hookBlocks = composeTemplatePromptBlocks(template, 1);
    const playgroundBlocks = composeTemplatePromptBlocks(template, 5);
    expect(hookBlocks.stage2Block).not.toBe(playgroundBlocks.stage2Block);
    expect(hookBlocks.stage3Block).not.toBe(playgroundBlocks.stage3Block);
  });

  it('returns empty blocks for invalid position', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 0);
    expect(blocks).toHaveProperty('stage1Block');
    expect(blocks).toHaveProperty('stage2Block');
    expect(blocks).toHaveProperty('stage3Block');
    expect(blocks).toHaveProperty('totalSections');
    expect(blocks.totalSections).toBe(8);
  });

  it('totalSections differs by difficulty', () => {
    const beginner = composeTemplatePromptBlocks(getTemplateForDifficulty('beginner'), 1);
    const intermediate = composeTemplatePromptBlocks(getTemplateForDifficulty('intermediate'), 1);
    const advanced = composeTemplatePromptBlocks(getTemplateForDifficulty('advanced'), 1);
    expect(beginner.totalSections).toBe(8);
    expect(intermediate.totalSections).toBe(7);
    expect(advanced.totalSections).toBe(8);
  });
});

// ============================================================================
// Exercise Types
// ============================================================================

describe('exercise types per difficulty', () => {
  it('beginner has scaffolded exercises (Guided, Semi-guided, Independent)', () => {
    const template = getTemplateForDifficulty('beginner');
    const types = template.exerciseTypes.map(e => e.toLowerCase());
    expect(types).toContain('guided');
    expect(types).toContain('semi-guided');
    expect(types).toContain('independent');
  });

  it('intermediate has lab exercises (Compute, Predict-verify, Diagnose, Compare, Design)', () => {
    const template = getTemplateForDifficulty('intermediate');
    const types = template.exerciseTypes.map(e => e.toLowerCase());
    expect(types).toContain('compute');
    expect(types).toContain('predict-verify');
    expect(types).toContain('design');
  });

  it('advanced has synthesis exercises (Analysis, Evaluation, Creation, Critique)', () => {
    const template = getTemplateForDifficulty('advanced');
    const types = template.exerciseTypes.map(e => e.toLowerCase());
    expect(types).toContain('analysis');
    expect(types).toContain('evaluation');
    expect(types).toContain('creation');
    expect(types).toContain('critique');
  });
});

// ============================================================================
// Few-Shot Examples
// ============================================================================

describe('few-shot example snippets', () => {
  it('FEW_SHOT_EXAMPLES has entries for all 3 difficulty levels', () => {
    expect(FEW_SHOT_EXAMPLES).toHaveProperty('beginner');
    expect(FEW_SHOT_EXAMPLES).toHaveProperty('intermediate');
    expect(FEW_SHOT_EXAMPLES).toHaveProperty('advanced');
  });

  it('beginner has 6 example snippets (non-formulaic roles)', () => {
    const roles = Object.keys(FEW_SHOT_EXAMPLES.beginner);
    expect(roles).toHaveLength(6);
    expect(roles).toContain('HOOK');
    expect(roles).toContain('INTUITION');
    expect(roles).toContain('WALKTHROUGH');
    expect(roles).toContain('FORMALIZATION');
    expect(roles).toContain('PLAYGROUND');
    expect(roles).toContain('PITFALLS');
  });

  it('intermediate has 5 example snippets', () => {
    const roles = Object.keys(FEW_SHOT_EXAMPLES.intermediate);
    expect(roles).toHaveLength(5);
    expect(roles).toContain('PROVOCATION');
    expect(roles).toContain('INTUITION_ENGINE');
    expect(roles).toContain('DERIVATION');
    expect(roles).toContain('LABORATORY');
    expect(roles).toContain('DEPTH_DIVE');
  });

  it('advanced has 6 example snippets', () => {
    const roles = Object.keys(FEW_SHOT_EXAMPLES.advanced);
    expect(roles).toHaveLength(6);
    expect(roles).toContain('OPEN_QUESTION');
    expect(roles).toContain('INTUITION');
    expect(roles).toContain('FIRST_PRINCIPLES');
    expect(roles).toContain('ANALYSIS');
    expect(roles).toContain('DESIGN_STUDIO');
    expect(roles).toContain('FRONTIER');
  });

  it('formulaic sections (SUMMARY, CHECKPOINT, SYNTHESIS) have no examples', () => {
    expect(FEW_SHOT_EXAMPLES.beginner.SUMMARY).toBeUndefined();
    expect(FEW_SHOT_EXAMPLES.beginner.CHECKPOINT).toBeUndefined();
    expect(FEW_SHOT_EXAMPLES.intermediate.SYNTHESIS).toBeUndefined();
    expect(FEW_SHOT_EXAMPLES.intermediate.CHECKPOINT).toBeUndefined();
    expect(FEW_SHOT_EXAMPLES.advanced.SYNTHESIS).toBeUndefined();
    expect(FEW_SHOT_EXAMPLES.advanced.CHECKPOINT).toBeUndefined();
  });

  it('each snippet is a non-empty string containing HTML', () => {
    for (const difficulty of ['beginner', 'intermediate', 'advanced'] as const) {
      const examples = FEW_SHOT_EXAMPLES[difficulty];
      for (const [role, snippet] of Object.entries(examples)) {
        expect(snippet).toBeDefined();
        expect(typeof snippet).toBe('string');
        expect(snippet!.length).toBeGreaterThan(50);
        expect(snippet).toContain('<');
        // Verify it's valid-looking HTML
        expect(snippet).toMatch(/<h[23]>/);
      }
    }
  });
});

describe('exampleSnippet wiring in templates', () => {
  it('beginner HOOK section has exampleSnippet defined', () => {
    const template = getTemplateForDifficulty('beginner');
    const hook = template.sections.find(s => s.role === 'HOOK');
    expect(hook).toBeDefined();
    expect(hook!.exampleSnippet).toBeDefined();
    expect(hook!.exampleSnippet).toContain('Library');
  });

  it('beginner CHECKPOINT section has no exampleSnippet', () => {
    const template = getTemplateForDifficulty('beginner');
    const checkpoint = template.sections.find(s => s.role === 'CHECKPOINT');
    expect(checkpoint).toBeDefined();
    expect(checkpoint!.exampleSnippet).toBeUndefined();
  });

  it('intermediate PROVOCATION has exampleSnippet defined', () => {
    const template = getTemplateForDifficulty('intermediate');
    const prov = template.sections.find(s => s.role === 'PROVOCATION');
    expect(prov).toBeDefined();
    expect(prov!.exampleSnippet).toBeDefined();
    expect(prov!.exampleSnippet).toContain('feedback');
  });

  it('advanced OPEN_QUESTION has exampleSnippet defined', () => {
    const template = getTemplateForDifficulty('advanced');
    const oq = template.sections.find(s => s.role === 'OPEN_QUESTION');
    expect(oq).toBeDefined();
    expect(oq!.exampleSnippet).toBeDefined();
    expect(oq!.exampleSnippet).toContain('fisherman');
  });

  it('all sections with examples match FEW_SHOT_EXAMPLES source', () => {
    const checks: Array<{ difficulty: 'beginner' | 'intermediate' | 'advanced'; role: string }> = [
      { difficulty: 'beginner', role: 'HOOK' },
      { difficulty: 'beginner', role: 'INTUITION' },
      { difficulty: 'intermediate', role: 'DERIVATION' },
      { difficulty: 'advanced', role: 'FIRST_PRINCIPLES' },
    ];
    for (const { difficulty, role } of checks) {
      const template = getTemplateForDifficulty(difficulty);
      const section = template.sections.find(s => s.role === role);
      expect(section?.exampleSnippet).toBe(
        FEW_SHOT_EXAMPLES[difficulty][role as keyof (typeof FEW_SHOT_EXAMPLES)[typeof difficulty]]
      );
    }
  });
});

describe('stage3Block gold standard example injection', () => {
  it('stage3Block contains GOLD STANDARD EXAMPLE for HOOK (beginner)', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage3Block).toContain('GOLD STANDARD EXAMPLE');
    expect(blocks.stage3Block).toContain('generate ORIGINAL content');
    expect(blocks.stage3Block).toContain('Library');
  });

  it('stage3Block does NOT contain GOLD STANDARD EXAMPLE for CHECKPOINT (beginner)', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 8); // CHECKPOINT
    expect(blocks.stage3Block).not.toContain('GOLD STANDARD EXAMPLE');
  });

  it('stage3Block contains GOLD STANDARD EXAMPLE for PROVOCATION (intermediate)', () => {
    const template = getTemplateForDifficulty('intermediate');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage3Block).toContain('GOLD STANDARD EXAMPLE');
    expect(blocks.stage3Block).toContain('THE PROVOCATION');
  });

  it('stage3Block does NOT contain GOLD STANDARD EXAMPLE for SYNTHESIS (intermediate)', () => {
    const template = getTemplateForDifficulty('intermediate');
    const blocks = composeTemplatePromptBlocks(template, 6); // SYNTHESIS
    expect(blocks.stage3Block).not.toContain('GOLD STANDARD EXAMPLE');
  });

  it('stage3Block contains GOLD STANDARD EXAMPLE for OPEN_QUESTION (advanced)', () => {
    const template = getTemplateForDifficulty('advanced');
    const blocks = composeTemplatePromptBlocks(template, 1);
    expect(blocks.stage3Block).toContain('GOLD STANDARD EXAMPLE');
    expect(blocks.stage3Block).toContain('Rational Individuals');
  });

  it('stage3Block does NOT contain GOLD STANDARD EXAMPLE for CHECKPOINT (advanced)', () => {
    const template = getTemplateForDifficulty('advanced');
    const blocks = composeTemplatePromptBlocks(template, 8); // CHECKPOINT
    expect(blocks.stage3Block).not.toContain('GOLD STANDARD EXAMPLE');
  });

  it('example block appears between consistency rules and explain-to-a-friend', () => {
    const template = getTemplateForDifficulty('beginner');
    const blocks = composeTemplatePromptBlocks(template, 1); // HOOK
    const goldIdx = blocks.stage3Block.indexOf('GOLD STANDARD EXAMPLE');
    const explainIdx = blocks.stage3Block.indexOf('Explain-to-a-Friend');
    expect(goldIdx).toBeGreaterThan(0);
    expect(explainIdx).toBeGreaterThan(goldIdx);
  });
});
