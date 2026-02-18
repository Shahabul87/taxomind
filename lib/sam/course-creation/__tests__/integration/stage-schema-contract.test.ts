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
        description: '<h2>Why This Matters</h2><p>Reliable versioning prevents outages and protects customers in production systems.</p><p>Teams need repeatable patterns for introducing change safely.</p>',
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
          description: '<h2>Why This Matters</h2><p>Reliable versioning prevents outages and protects customers in production systems.</p><p>Teams need repeatable patterns for introducing change safely.</p>',
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
