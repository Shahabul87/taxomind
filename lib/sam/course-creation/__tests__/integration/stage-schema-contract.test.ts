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
