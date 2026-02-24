import {
  AIChapterResponseSchema,
  AISectionResponseSchema,
  AIDetailsResponseSchema,
} from '../../response-schemas';
import {
  parseChapterResponse,
  parseSectionResponse,
  parseDetailsResponse,
  FallbackTracker,
  SchemaValidationMetrics,
  schemaValidationMetrics,
} from '../../response-parsers';
import type { CourseContext, GeneratedChapter, GeneratedSection } from '../../types';

const courseContext: CourseContext = {
  courseTitle: 'Enterprise API Design',
  courseDescription: 'Build professional API design skills.',
  courseCategory: 'Programming',
  courseSubcategory: 'Backend',
  targetAudience: 'Engineers',
  difficulty: 'intermediate',
  courseLearningObjectives: ['Design reliable APIs'],
  totalChapters: 4,
  sectionsPerChapter: 3,
  bloomsFocus: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
  learningObjectivesPerChapter: 3,
  learningObjectivesPerSection: 2,
  preferredContentTypes: ['reading'],
  courseIntent: 'Professional API engineering',
  includeAssessments: true,
  duration: '6 weeks',
};

const chapter: GeneratedChapter = {
  position: 1,
  title: 'API Architecture Foundations',
  description: 'Architecture principles for production APIs.',
  bloomsLevel: 'UNDERSTAND',
  learningObjectives: [
    'Explain API lifecycle stages in enterprise systems',
    'Describe reliability tradeoffs in API boundaries',
    'Classify interface contracts for service integration',
  ],
  keyTopics: ['API lifecycle', 'Reliability', 'Interface contracts'],
  prerequisites: 'Basic HTTP',
  estimatedTime: '2 hours',
  topicsToExpand: ['API lifecycle', 'Reliability', 'Interface contracts'],
  conceptsIntroduced: ['contract-first', 'idempotency', 'bounded context'],
};

const section: GeneratedSection = {
  position: 1,
  title: 'Contract-First API Thinking',
  contentType: 'reading',
  estimatedDuration: '25 minutes',
  topicFocus: 'API contracts',
  parentChapterContext: {
    title: chapter.title,
    bloomsLevel: chapter.bloomsLevel,
    relevantObjectives: [chapter.learningObjectives[0]],
  },
  conceptsIntroduced: ['OpenAPI contract'],
  conceptsReferenced: ['HTTP'],
};

const validStage3Description = [
  '<h2>Why It Was Developed</h2>',
  '<p>Teams introduced API versioning because production systems repeatedly broke when fields changed without planning. Before this pattern, one release could invalidate mobile apps, partner integrations, and automation scripts in the same week, creating a painful bottleneck for everyone. The motivating problem was not only technical breakage, but coordination failure between product timelines and client upgrade windows. Versioning gives organizations a structured way to evolve contracts while keeping service reliability high, reducing emergency rollback pressure, and protecting customers from surprise outages during normal delivery cycles.</p>',
  '<h2>Core Intuition</h2>',
  '<p>Use a mental model of a shared bridge between teams: providers maintain the bridge while consumers cross it on different schedules. Imagine each client as a vehicle with different speed and maintenance constraints. The intuition is that resilient APIs optimize for compatibility over convenience, so one team can move forward without forcing every other team to stop and rework immediately. This analogy helps learners think of versioning as risk distribution, where clear deprecation paths, explicit compatibility rules, and communication checkpoints keep traffic flowing while the bridge is improved safely.</p>',
  '<h2>Equation Intuition</h2>',
  '<p>No equation is required for this section because the central idea is policy design and operational behavior, not numeric optimization. The structure still follows a reasoning formula: compatibility plus observability plus migration readiness produces lower outage risk. Each part represents a practical control. Compatibility means preserving expected fields and semantics, observability means measuring client usage before change, and migration readiness means offering a tested path to upgrade. The shape of this reasoning matters because removing any one part creates blind spots that increase incident probability during rollout.</p>',
  '<h2>Step-by-Step Visualization</h2>',
  '<p>First, inventory active clients and visualize who depends on each endpoint. Second, mark high-risk fields and identify changes that could break parsing, validation, or workflow order. Third, introduce a non-breaking version with explicit release notes and examples. Next, monitor adoption and error rates with dashboards and log filters tied to version headers. Then, schedule migration checkpoints with teams and confirm progress. Finally, deprecate the old behavior only after evidence shows safe adoption. This step-by-step walkthrough lets learners picture change management as a controlled sequence rather than a one-time switch.</p>',
  '<h2>Concrete Example</h2>',
  '<p>Consider a payments API where 12 enterprise clients consume an invoice endpoint. A new requirement adds tax jurisdiction details and changes one nested object. The team releases v2 with additive fields, keeps v1 stable, and publishes a migration guide with side-by-side payloads. In week one, 4 clients migrate; in week three, 9 clients migrate; by week six, all 12 migrate with no production outage. The worked scenario shows how compatibility testing, staged communication, and telemetry checkpoints create measurable confidence before retirement of legacy behavior.</p>',
  '<h2>Common Confusion + Fix</h2>',
  '<p>A common misconception is that versioning means creating a brand-new API for every change, which often increases maintenance cost without improving safety. Another frequent trap is deprecating old versions immediately after release. The fix is to classify change types, keep backward compatibility for minor updates, and enforce explicit migration windows for breaking changes. Learners should remember that resilience comes from policy discipline and evidence-based rollout decisions, not from the number of versions created. Correcting this confusion helps teams avoid unnecessary fragmentation while still evolving contracts responsibly.</p>',
].join('');

describe('Stage schema contracts', () => {
  it('accepts deterministic Stage 1/2/3 payloads via strict schemas', () => {
    const stage1Payload = {
      thinking: 'Chapter focus and progression rationale.',
      chapter: {
        title: 'Designing Resilient API Boundaries',
        description: 'This chapter covers practical API boundary design for resilient systems in production environments.',
        bloomsLevel: 'UNDERSTAND',
        learningObjectives: [
          'Explain resilience patterns in API boundaries',
          'Describe contract versioning constraints in distributed systems',
          'Summarize observability signals for API health',
        ],
        keyTopics: ['Boundary design', 'Versioning', 'Observability'],
        prerequisites: 'HTTP basics',
        estimatedTime: '2 hours',
        topicsToExpand: ['Boundary design', 'Versioning', 'Observability'],
        conceptsIntroduced: ['version compatibility', 'circuit breaker'],
      },
    };
    const stage2Payload = {
      thinking: 'Section sequencing rationale.',
      section: {
        title: 'Versioning Without Breaking Clients',
        contentType: 'reading',
        estimatedDuration: '20 minutes',
        topicFocus: 'Backward compatibility',
        parentChapterContext: {
          relevantObjectives: ['Describe contract versioning constraints in distributed systems'],
        },
        conceptsIntroduced: ['semantic versioning'],
        conceptsReferenced: ['API contract'],
      },
    };
    const stage3Payload = {
      thinking: 'Detailed lesson plan.',
      details: {
        description: validStage3Description,
        learningObjectives: [
          'Apply versioning criteria to enterprise API changes',
          'Evaluate migration paths for existing API clients',
        ],
        keyConceptsCovered: ['semantic versioning', 'compatibility testing', 'deprecation policy'],
        practicalActivity: 'Draft a migration policy for a breaking API field change and validate it against two client scenarios.',
        creatorGuidelines: 'Start with a real outage story, compare two versioning strategies, then walk through a migration checklist on-screen.',
        resources: ['https://spec.openapis.org/oas/latest.html'],
      },
    };

    expect(AIChapterResponseSchema.safeParse(stage1Payload).success).toBe(true);
    expect(AISectionResponseSchema.safeParse(stage2Payload).success).toBe(true);
    expect(AIDetailsResponseSchema.safeParse(stage3Payload).success).toBe(true);
  });

  it('parses deterministic Stage 1/2/3 responses and preserves creatorGuidelines', () => {
    const stage1 = parseChapterResponse(
      JSON.stringify({
        thinking: 'Stage1',
        chapter: {
          title: 'Designing Resilient API Boundaries',
          description: 'This chapter builds enterprise API architecture decisions through practical boundary design and reliability tradeoffs across distributed services.',
          bloomsLevel: 'UNDERSTAND',
          learningObjectives: [
            'Explain resilience patterns in API boundaries',
            'Describe contract versioning constraints in distributed systems',
            'Summarize observability signals for API health',
          ],
          keyTopics: ['Boundary design', 'Versioning', 'Observability'],
          prerequisites: 'HTTP basics',
          estimatedTime: '2 hours',
          topicsToExpand: ['Boundary design', 'Versioning', 'Observability'],
          conceptsIntroduced: ['version compatibility', 'circuit breaker', 'schema drift'],
        },
      }),
      1,
      courseContext,
      [],
      null,
    );

    const stage2 = parseSectionResponse(
      JSON.stringify({
        thinking: 'Stage2',
        section: {
          title: 'Versioning Without Breaking Clients',
          contentType: 'reading',
          estimatedDuration: '20 minutes',
          topicFocus: 'Backward compatibility',
          parentChapterContext: {
            relevantObjectives: [stage1.chapter.learningObjectives[1]],
          },
          conceptsIntroduced: ['semantic versioning'],
          conceptsReferenced: ['API contract'],
        },
      }),
      1,
      stage1.chapter,
      [],
      undefined,
    );

    const stage3 = parseDetailsResponse(
      JSON.stringify({
        thinking: 'Stage3',
        details: {
          description: validStage3Description,
          learningObjectives: [
            'Apply versioning criteria to enterprise API changes',
            'Evaluate migration paths for existing API clients',
          ],
          keyConceptsCovered: ['semantic versioning', 'compatibility testing', 'deprecation policy'],
          practicalActivity: 'Draft a migration policy for a breaking API field change and validate it against two client scenarios.',
          creatorGuidelines: 'Open with incident context, compare strategies, then demonstrate a migration checklist and common pitfalls in production.',
          resources: ['https://spec.openapis.org/oas/latest.html'],
        },
      }),
      stage1.chapter,
      stage2.section,
      courseContext,
      undefined,
    );

    expect(stage1.chapter.learningObjectives).toHaveLength(courseContext.learningObjectivesPerChapter);
    expect(stage2.section.position).toBe(1);
    expect(stage3.details.learningObjectives).toHaveLength(courseContext.learningObjectivesPerSection);
    expect(stage3.details.creatorGuidelines.toLowerCase()).toContain('migration');
  });

  it('fails Stage 3 contract when creatorGuidelines are missing and records fallback', () => {
    const tracker = new FallbackTracker();
    const result = parseDetailsResponse(
      JSON.stringify({
        details: {
          description: '<p>Too short details</p>',
          learningObjectives: ['Understand versioning'],
          keyConceptsCovered: ['versioning'],
          practicalActivity: 'Do the task.',
        },
      }),
      chapter,
      section,
      courseContext,
      undefined,
      tracker,
    );

    expect(result.qualityScore.overall).toBe(50);
    expect(result.details.creatorGuidelines.length).toBeGreaterThan(20);
    expect(tracker.count).toBe(1);
  });
});

// =============================================================================
// Validation Mode Tests
// =============================================================================

describe('Validation mode behavior', () => {
  beforeEach(() => {
    schemaValidationMetrics.reset();
  });

  // Stage 1 chapter with a minor schema issue: bloomsLevel is invalid
  // but all critical fields (title, objectives) are present and pass validateCriticalFields
  const chapterPayloadWithMinorIssue = JSON.stringify({
    thinking: 'Stage1 reasoning',
    chapter: {
      title: 'Designing Resilient API Boundaries',
      description: 'This chapter covers practical API boundary design for resilient systems in production environments.',
      bloomsLevel: 'INVALID_LEVEL', // <-- invalid enum value
      learningObjectives: [
        'Explain resilience patterns in API boundaries',
        'Describe contract versioning constraints in distributed systems',
        'Summarize observability signals for API health',
      ],
      keyTopics: ['Boundary design', 'Versioning', 'Observability'],
      prerequisites: 'HTTP basics',
      estimatedTime: '2 hours',
      topicsToExpand: ['Boundary design', 'Versioning', 'Observability'],
    },
  });

  describe('warn mode keeps AI content with quality penalty', () => {
    it('Stage 1 (chapter): preserves AI content and penalizes quality score', () => {
      const result = parseChapterResponse(
        chapterPayloadWithMinorIssue,
        1,
        courseContext,
        [],
        null,
        undefined,
        'warn',
      );

      // AI content is preserved (not fallback)
      expect(result.chapter.title).toContain('Resilient API Boundaries');
      expect(result.chapter.learningObjectives).toHaveLength(courseContext.learningObjectivesPerChapter);
      // Quality score is penalized (schemaIssues present)
      expect(result.qualityScore.schemaIssues).toBeDefined();
      expect(result.qualityScore.schemaIssues!.length).toBeGreaterThan(0);
      // Not a fallback score (40/50) — should be higher than fallback
      expect(result.qualityScore.overall).toBeGreaterThan(40);
    });

    it('Stage 2 (section): preserves AI content and penalizes quality score', () => {
      // Section with extra unknown field (strict Zod would reject, but our schemas are not .strict())
      // Instead, use a missing minimum-length title (3 chars required)
      // Actually the schema uses .min(3) on title, so a 2-char title would fail.
      // But validateCriticalFields also checks title < 2 chars. Let's use a field
      // that only Zod validates: topicFocus is optional so missing is fine.
      // Let's produce something that fails Zod but passes critical fields.
      // AISectionResponseSchema requires section.title.min(3). A 2-char title
      // would fail critical field check too. Best approach: use an array where
      // a string of min(0) is expected but schema requires min(5) for objectives?
      // Actually section schema has no min-length strings that overlap with critical.
      // Let's just verify the default warn mode works for Stage 2 with a valid payload.
      // We can test with an invalid parentChapterContext type.
      const sectionPayloadWithIssue = JSON.stringify({
        thinking: 'Stage2',
        section: {
          title: 'Versioning Without Breaking Clients',
          contentType: 'reading',
          estimatedDuration: '20 minutes',
          topicFocus: 'Backward compatibility',
          parentChapterContext: 'invalid_not_an_object', // <-- should be object
          conceptsIntroduced: ['semantic versioning'],
        },
      });

      const result = parseSectionResponse(
        sectionPayloadWithIssue,
        1,
        chapter,
        [],
        undefined,
        undefined,
        'warn',
      );

      // AI content preserved
      expect(result.section.title).toContain('Versioning');
      // Quality penalized
      expect(result.qualityScore.schemaIssues).toBeDefined();
      expect(result.qualityScore.schemaIssues!.length).toBeGreaterThan(0);
    });
  });

  describe('strict mode triggers fallback', () => {
    it('Stage 1 (chapter): returns fallback content on schema failure', () => {
      const tracker = new FallbackTracker();
      const result = parseChapterResponse(
        chapterPayloadWithMinorIssue,
        1,
        courseContext,
        [],
        null,
        tracker,
        'strict',
      );

      // Fallback content is used
      expect(result.qualityScore.overall).toBe(40);
      expect(result.thinking).toContain('fallback');
      expect(tracker.count).toBe(1);
      // No schemaIssues on fallback quality score
      expect(result.qualityScore.schemaIssues).toBeUndefined();
    });

    it('Stage 3 (details): returns fallback on schema failure (default behavior)', () => {
      const tracker = new FallbackTracker();
      // Details with description too short for Zod (< 100 chars) but long enough
      // for critical validation (>= 30 chars), and practicalActivity too short (< 10 chars)
      const detailsPayloadWithSchemaIssue = JSON.stringify({
        details: {
          description: 'This section explains API versioning patterns for enterprise use.',
          learningObjectives: [
            'Apply versioning criteria to enterprise API changes',
            'Evaluate migration paths for existing API clients',
          ],
          keyConceptsCovered: ['versioning'],
          practicalActivity: 'Draft a versioning policy for a breaking API change.',
          creatorGuidelines: 'Open with incident context, compare strategies, then demonstrate a migration checklist and common pitfalls in production environments.',
        },
      });

      const result = parseDetailsResponse(
        detailsPayloadWithSchemaIssue,
        chapter,
        section,
        courseContext,
        undefined,
        tracker,
        'strict',
      );

      // Strict mode for Stage 3 returns fallback
      expect(result.qualityScore.overall).toBe(40);
      expect(tracker.count).toBe(1);
    });
  });

  describe('silent mode suppresses logging and preserves content', () => {
    it('Stage 1 (chapter): keeps AI content without throwing', () => {
      const result = parseChapterResponse(
        chapterPayloadWithMinorIssue,
        1,
        courseContext,
        [],
        null,
        undefined,
        'silent',
      );

      // AI content preserved (not fallback)
      expect(result.chapter.title).toContain('Resilient API Boundaries');
      expect(result.qualityScore.schemaIssues).toBeDefined();
      expect(result.qualityScore.overall).toBeGreaterThan(40);
    });
  });

  describe('SchemaValidationMetrics tracking', () => {
    it('records pass/warn/fail counts correctly', () => {
      // Pass: valid Stage 1 payload
      parseChapterResponse(
        JSON.stringify({
          thinking: 'valid',
          chapter: {
            title: 'Designing Resilient API Boundaries',
            description: 'This chapter covers practical API boundary design for resilient systems in production environments.',
            bloomsLevel: 'UNDERSTAND',
            learningObjectives: [
              'Explain resilience patterns',
              'Describe contract constraints',
              'Summarize observability signals',
            ],
            keyTopics: ['Boundary design', 'Versioning', 'Observability'],
          },
        }),
        1,
        courseContext,
        [],
        null,
        undefined,
        'strict',
      );

      // Warn: invalid Stage 1 payload in warn mode
      parseChapterResponse(
        chapterPayloadWithMinorIssue,
        2,
        courseContext,
        [],
        null,
        undefined,
        'warn',
      );

      // Fail: invalid Stage 1 payload in strict mode (triggers fallback)
      parseChapterResponse(
        chapterPayloadWithMinorIssue,
        3,
        courseContext,
        [],
        null,
        undefined,
        'strict',
      );

      const snapshot = schemaValidationMetrics.getSnapshot();
      expect(snapshot.total).toBe(3);
      expect(snapshot.byOutcome.pass).toBe(1);
      expect(snapshot.byOutcome.warn).toBe(1);
      expect(snapshot.byOutcome.fail).toBe(1);
    });

    it('reset() clears all records', () => {
      parseChapterResponse(
        chapterPayloadWithMinorIssue,
        1,
        courseContext,
        [],
        null,
        undefined,
        'warn',
      );

      expect(schemaValidationMetrics.getSnapshot().total).toBeGreaterThan(0);
      schemaValidationMetrics.reset();
      expect(schemaValidationMetrics.getSnapshot().total).toBe(0);
    });
  });
});
