/**
 * Issue Generator (Step 7)
 *
 * Generates specific, actionable issues from all analysis results.
 * Each issue includes exact location and impact assessment.
 */

import { nanoid } from 'nanoid';
import type {
  CourseInput,
  StructureAnalysisResult,
  BloomsAnalysisResult,
  FlowAnalysisResult,
  ConsistencyAnalysisResult,
  ContentAnalysisResult,
  OutcomesAnalysisResult,
  AnalysisIssue,
  IssueSeverity,
} from '../types';

interface IssueGeneratorInput {
  course: CourseInput;
  structureResult: StructureAnalysisResult;
  bloomsResult: BloomsAnalysisResult;
  flowResult: FlowAnalysisResult;
  consistencyResult: ConsistencyAnalysisResult;
  contentResult: ContentAnalysisResult;
  outcomesResult: OutcomesAnalysisResult;
}

/**
 * Generate issues from structure analysis
 */
function generateStructureIssues(
  course: CourseInput,
  structureResult: StructureAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Empty chapters
  for (const emptyChapter of structureResult.emptyChapters) {
    const chapter = course.chapters.find((c) => c.id === emptyChapter.id);
    issues.push({
      id: nanoid(),
      type: 'STRUCTURE',
      severity: 'CRITICAL',
      status: 'OPEN',
      location: {
        chapterId: emptyChapter.id,
        chapterTitle: emptyChapter.title,
        chapterPosition: chapter?.position,
      },
      title: 'Empty chapter with no sections',
      description: `Chapter "${emptyChapter.title}" has no sections. Empty chapters provide no value to learners.`,
      evidence: ['Chapter has 0 sections'],
      impact: {
        area: 'Course Structure',
        description:
          'Empty chapters confuse learners and break the course flow.',
      },
      fix: {
        action: 'add',
        what: 'Add sections to this chapter',
        why: 'Every chapter should contain at least one section with content.',
        how: 'Create 2-4 sections covering subtopics of this chapter. Each section should have objectives, content, and optionally a quiz.',
        suggestedContent: `Consider breaking down "${emptyChapter.title}" into logical subtopics.`,
      },
    });
  }

  // Empty sections
  for (const emptySection of structureResult.emptySections) {
    const chapter = course.chapters.find(
      (c) => c.id === emptySection.chapterId
    );
    const section = chapter?.sections.find((s) => s.id === emptySection.id);

    issues.push({
      id: nanoid(),
      type: 'CONTENT',
      severity: 'HIGH',
      status: 'OPEN',
      location: {
        chapterId: emptySection.chapterId,
        chapterTitle: emptySection.chapterTitle,
        sectionId: emptySection.id,
        sectionTitle: emptySection.title,
        sectionPosition: section?.position,
      },
      title: 'Section lacks meaningful content',
      description: `Section "${emptySection.title}" in chapter "${emptySection.chapterTitle}" has no description, content, or video.`,
      evidence: [
        'No description (or less than 20 characters)',
        'No content (or less than 50 characters)',
        'No video',
      ],
      impact: {
        area: 'Learning Experience',
        description:
          'Empty sections waste learner time and reduce course credibility.',
      },
      fix: {
        action: 'add',
        what: 'Add content to this section',
        why: 'Every section should provide value through text content, video, or both.',
        how: 'Write 200-500 words of content explaining the topic, and/or add a video.',
      },
    });
  }

  // Unpublished chapters
  for (const unpubChapter of structureResult.unpublishedChapters) {
    const chapter = course.chapters.find((c) => c.id === unpubChapter.id);
    issues.push({
      id: nanoid(),
      type: 'STRUCTURE',
      severity: 'MEDIUM',
      status: 'OPEN',
      location: {
        chapterId: unpubChapter.id,
        chapterTitle: unpubChapter.title,
        chapterPosition: chapter?.position,
      },
      title: 'Unpublished chapter',
      description: `Chapter "${unpubChapter.title}" is not published and invisible to learners.`,
      evidence: ['isPublished = false'],
      impact: {
        area: 'Content Availability',
        description:
          'Unpublished chapters may contain valuable content that learners cannot access.',
      },
      fix: {
        action: 'modify',
        what: 'Publish this chapter',
        why: 'Learners cannot access unpublished content.',
        how: 'Review the chapter content and publish it, or remove it if not needed.',
      },
    });
  }

  // Low objective coverage
  if (structureResult.contentDepth.hasObjectives < 50) {
    issues.push({
      id: nanoid(),
      type: 'OBJECTIVE',
      severity: 'HIGH',
      status: 'OPEN',
      location: {},
      title: 'Low learning objectives coverage',
      description: `Only ${structureResult.contentDepth.hasObjectives}% of sections have learning objectives.`,
      evidence: [
        `${structureResult.contentDepth.hasObjectives}% sections with objectives`,
        `Target: At least 80% of sections should have objectives`,
      ],
      impact: {
        area: 'Learning Clarity',
        description:
          'Without clear objectives, learners don\'t know what they will achieve.',
      },
      fix: {
        action: 'add',
        what: 'Add learning objectives to sections',
        why: 'Learning objectives help learners understand expectations and measure progress.',
        how: 'For each section, write 2-4 specific, measurable objectives starting with action verbs (e.g., "Explain...", "Apply...", "Create...").',
      },
    });
  }

  // Low assessment coverage
  if (structureResult.contentDepth.hasAssessment < 30) {
    issues.push({
      id: nanoid(),
      type: 'ASSESSMENT',
      severity: 'MEDIUM',
      status: 'OPEN',
      location: {},
      title: 'Low assessment coverage',
      description: `Only ${structureResult.contentDepth.hasAssessment}% of sections have assessments.`,
      evidence: [
        `${structureResult.contentDepth.hasAssessment}% sections with assessments`,
        `Recommendation: At least 50% of sections should have assessments`,
      ],
      impact: {
        area: 'Knowledge Verification',
        description:
          'Without assessments, learners cannot verify their understanding.',
      },
      fix: {
        action: 'add',
        what: 'Add quizzes or assessments',
        why: 'Assessments reinforce learning and help identify knowledge gaps.',
        how: 'Add a 3-5 question quiz to each major section. Include a mix of question types.',
      },
    });
  }

  return issues;
}

/**
 * Generate issues from Bloom's analysis
 */
function generateBloomsIssues(
  bloomsResult: BloomsAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Course balance issues
  if (bloomsResult.courseBalance === 'bottom-heavy') {
    issues.push({
      id: nanoid(),
      type: 'DEPTH',
      severity: 'HIGH',
      status: 'OPEN',
      location: {},
      title: 'Course lacks higher-order thinking',
      description:
        'The course focuses too much on Remember/Understand levels and lacks Analysis, Evaluation, and Creation activities.',
      evidence: [
        `Remember: ${bloomsResult.courseDistribution.REMEMBER}%`,
        `Understand: ${bloomsResult.courseDistribution.UNDERSTAND}%`,
        `Apply: ${bloomsResult.courseDistribution.APPLY}%`,
        `Analyze: ${bloomsResult.courseDistribution.ANALYZE}%`,
        `Evaluate: ${bloomsResult.courseDistribution.EVALUATE}%`,
        `Create: ${bloomsResult.courseDistribution.CREATE}%`,
      ],
      impact: {
        area: 'Cognitive Development',
        description:
          'Learners may memorize facts but fail to develop critical thinking skills.',
      },
      fix: {
        action: 'add',
        what: 'Add higher-order thinking activities',
        why: 'A balanced course develops comprehensive cognitive skills.',
        how: 'Add case studies (Analyze), peer reviews (Evaluate), and projects (Create) throughout the course.',
        examples: [
          'Add a case study analysis activity',
          'Include a design/build project',
          'Add critical evaluation exercises',
        ],
      },
    });
  }

  // Chapter-level depth issues
  for (const chapter of bloomsResult.chapters) {
    if (chapter.balance === 'bottom-heavy') {
      const dist = chapter.distribution;
      const lowerOrder = dist.REMEMBER + dist.UNDERSTAND;

      if (lowerOrder > 70) {
        issues.push({
          id: nanoid(),
          type: 'DEPTH',
          severity: 'MEDIUM',
          status: 'OPEN',
          location: {
            chapterId: chapter.chapterId,
            chapterTitle: chapter.chapterTitle,
            chapterPosition: chapter.position,
          },
          title: `Chapter heavy on memorization (${lowerOrder}% lower-order)`,
          description: `Chapter "${chapter.chapterTitle}" focuses too heavily on Remember and Understand levels.`,
          evidence: [
            `Remember: ${dist.REMEMBER}%`,
            `Understand: ${dist.UNDERSTAND}%`,
            `Higher-order: ${100 - lowerOrder}%`,
          ],
          impact: {
            area: 'Chapter Depth',
            description:
              'This chapter may not adequately develop practical skills.',
          },
          fix: {
            action: 'modify',
            what: 'Add application and analysis content',
            why: 'Each chapter should include opportunities to apply knowledge.',
            how: 'Add practical exercises, examples, or mini-projects to this chapter.',
          },
        });
      }
    }
  }

  return issues;
}

/**
 * Generate issues from flow analysis
 */
function generateFlowIssues(flowResult: FlowAnalysisResult): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Progression issues
  for (const progression of flowResult.progressionIssues) {
    issues.push({
      id: nanoid(),
      type: 'FLOW',
      severity: progression.severity,
      status: 'OPEN',
      location: {
        chapterId: progression.toChapter.id,
        chapterTitle: progression.toChapter.title,
        chapterPosition: progression.toChapter.position,
      },
      title: progression.issue,
      description: `Learning flow issue between "${progression.fromChapter.title}" and "${progression.toChapter.title}".`,
      evidence: [
        `From: Chapter ${progression.fromChapter.position} (${progression.fromChapter.title})`,
        `To: Chapter ${progression.toChapter.position} (${progression.toChapter.title})`,
      ],
      impact: {
        area: 'Learning Flow',
        description:
          'Inconsistent progression can confuse learners and hinder understanding.',
      },
      fix: {
        action: 'reorder',
        what: progression.suggestion,
        why: 'Smooth cognitive progression improves learning outcomes.',
        how: 'Consider reordering chapters or adding transitional content.',
      },
    });
  }

  // Cognitive jumps
  for (const jump of flowResult.cognitiveJumps) {
    issues.push({
      id: nanoid(),
      type: 'FLOW',
      severity: jump.gap >= 3 ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      location: {
        chapterId: jump.location.chapterId,
        chapterTitle: jump.location.chapterTitle,
        sectionId: jump.location.sectionId,
        sectionTitle: jump.location.sectionTitle,
      },
      title: `Cognitive jump: ${jump.fromLevel} → ${jump.toLevel}`,
      description: jump.description,
      evidence: [
        `Previous level: ${jump.fromLevel}`,
        `Current level: ${jump.toLevel}`,
        `Gap: ${jump.gap} levels`,
      ],
      impact: {
        area: 'Cognitive Load',
        description:
          'Large cognitive jumps can overwhelm learners or cause disengagement.',
      },
      fix: {
        action: 'add',
        what: 'Add bridging content',
        why: 'Gradual progression helps learners build understanding step by step.',
        how: 'Insert intermediate content or rearrange sections to create smoother transitions.',
      },
    });
  }

  return issues;
}

/**
 * Generate issues from consistency analysis
 */
function generateConsistencyIssues(
  consistencyResult: ConsistencyAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Chapter-goal alignment issues
  for (const chapter of consistencyResult.chapterGoalAlignment) {
    if (chapter.alignmentScore < 30) {
      issues.push({
        id: nanoid(),
        type: 'CONSISTENCY',
        severity: 'MEDIUM',
        status: 'OPEN',
        location: {
          chapterId: chapter.chapterId,
          chapterTitle: chapter.chapterTitle,
        },
        title: 'Chapter poorly aligned with course goals',
        description: `Chapter "${chapter.chapterTitle}" has only ${chapter.alignmentScore}% alignment with course goals.`,
        evidence: [
          `Alignment score: ${chapter.alignmentScore}%`,
          ...chapter.suggestions,
        ],
        impact: {
          area: 'Course Coherence',
          description:
            'Misaligned chapters may confuse learners about course purpose.',
        },
        fix: {
          action: 'modify',
          what: 'Align chapter content with course goals',
          why: 'Every chapter should contribute to the overall course objectives.',
          how: 'Review course goals and revise chapter content to directly support them.',
        },
      });
    }
  }

  // Section consistency issues
  for (const section of consistencyResult.sectionConsistency) {
    if (section.consistencyScore < 50 && section.issues.length > 0) {
      issues.push({
        id: nanoid(),
        type: 'CONSISTENCY',
        severity: 'MEDIUM',
        status: 'OPEN',
        location: {
          chapterId: section.chapterId,
          chapterTitle: section.chapterTitle,
        },
        title: 'Inconsistent sections within chapter',
        description: `Chapter "${section.chapterTitle}" has inconsistent sections (score: ${section.consistencyScore}%).`,
        evidence: section.issues,
        impact: {
          area: 'Learning Experience',
          description:
            'Inconsistent section quality creates an uneven learning experience.',
        },
        fix: {
          action: 'modify',
          what: 'Standardize section format and depth',
          why: 'Consistent sections help learners know what to expect.',
          how: 'Ensure all sections have similar structure: objectives, content, examples, and practice.',
        },
      });
    }
  }

  // Cross-chapter issues
  for (const issue of consistencyResult.crossChapterConsistency.issues) {
    issues.push({
      id: nanoid(),
      type: 'CONSISTENCY',
      severity: 'LOW',
      status: 'OPEN',
      location: {},
      title: 'Cross-chapter inconsistency',
      description: issue,
      evidence: [
        `Style consistency: ${consistencyResult.crossChapterConsistency.styleConsistencyScore}%`,
        `Depth consistency: ${consistencyResult.crossChapterConsistency.depthConsistencyScore}%`,
        `Length consistency: ${consistencyResult.crossChapterConsistency.lengthConsistencyScore}%`,
      ],
      impact: {
        area: 'Course Quality',
        description:
          'Inconsistent chapters can affect overall course perception.',
      },
      fix: {
        action: 'modify',
        what: 'Standardize across chapters',
        why: 'A consistent course feels more professional and is easier to navigate.',
        how: 'Review all chapters and apply consistent formatting, depth, and structure.',
      },
    });
  }

  return issues;
}

/**
 * Generate issues from content analysis
 */
function generateContentIssues(
  contentResult: ContentAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Duplicate content
  for (const duplicate of contentResult.duplicates) {
    if (duplicate.similarityScore >= 50) {
      issues.push({
        id: nanoid(),
        type: 'DUPLICATE',
        severity: duplicate.similarityScore >= 70 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        location: {
          chapterId: duplicate.sourceA.chapterId,
          chapterTitle: duplicate.sourceA.chapterTitle,
          sectionId: duplicate.sourceA.sectionId,
          sectionTitle: duplicate.sourceA.sectionTitle,
        },
        title: `Duplicate content detected (${duplicate.similarityScore}% similar)`,
        description: `Similar content found in two locations: "${duplicate.sourceA.sectionTitle || duplicate.sourceA.chapterTitle}" and "${duplicate.sourceB.sectionTitle || duplicate.sourceB.chapterTitle}".`,
        evidence: [
          `Similarity: ${duplicate.similarityScore}%`,
          `Overlapping concepts: ${duplicate.overlappingConcepts.join(', ')}`,
          `Location A: ${duplicate.sourceA.chapterTitle} > ${duplicate.sourceA.sectionTitle || 'chapter level'}`,
          `Location B: ${duplicate.sourceB.chapterTitle} > ${duplicate.sourceB.sectionTitle || 'chapter level'}`,
        ],
        impact: {
          area: 'Content Efficiency',
          description:
            'Duplicate content wastes learner time and can cause confusion.',
        },
        fix: {
          action:
            duplicate.recommendation === 'MERGE'
              ? 'merge'
              : duplicate.recommendation === 'KEEP_BOTH'
                ? 'modify'
                : 'remove',
          what: duplicate.recommendationReason,
          why: 'Eliminating redundancy improves course efficiency.',
          how:
            duplicate.recommendation === 'MERGE'
              ? 'Combine the best parts of both sections into one.'
              : duplicate.recommendation === 'KEEP_BOTH'
                ? 'Review both sections and differentiate their focus if needed.'
                : `Remove or significantly revise the ${duplicate.recommendation === 'KEEP_A' ? 'second' : 'first'} occurrence.`,
        },
        relatedIssueIds: [],
      });
    }
  }

  // Thin sections
  for (const thin of contentResult.thinSections) {
    issues.push({
      id: nanoid(),
      type: 'CONTENT',
      severity: thin.currentWordCount < 50 ? 'HIGH' : 'MEDIUM',
      status: 'OPEN',
      location: {
        chapterId: thin.chapterId,
        chapterTitle: thin.chapterTitle,
        sectionId: thin.sectionId,
        sectionTitle: thin.sectionTitle,
      },
      title: `Thin section (${thin.currentWordCount} words)`,
      description: `Section "${thin.sectionTitle}" has only ${thin.currentWordCount} words. Recommended: ${thin.recommendedWordCount} words.`,
      evidence: [
        `Current: ${thin.currentWordCount} words`,
        `Recommended: ${thin.recommendedWordCount} words`,
        `Missing: ${thin.missingElements.join(', ')}`,
      ],
      impact: {
        area: 'Content Depth',
        description:
          'Thin sections may not adequately explain the topic.',
      },
      fix: {
        action: 'add',
        what: thin.suggestion,
        why: 'Comprehensive content helps learners understand thoroughly.',
        how: `Expand this section by adding: ${thin.missingElements.slice(0, 3).join(', ')}.`,
      },
    });
  }

  // Content gaps
  for (const gap of contentResult.contentGaps) {
    issues.push({
      id: nanoid(),
      type: 'CONTENT',
      severity: 'MEDIUM',
      status: 'OPEN',
      location: {},
      title: `Content gap: "${gap.topic}"`,
      description: gap.description,
      evidence: [`Expected in: ${gap.expectedIn}`],
      impact: {
        area: 'Goal Achievement',
        description:
          'Missing content may prevent learners from achieving course goals.',
      },
      fix: {
        action: 'add',
        what: `Add content covering "${gap.topic}"`,
        why: 'This topic is mentioned in course goals but not adequately covered.',
        how: gap.suggestedContent,
      },
    });
  }

  return issues;
}

/**
 * Generate issues from outcomes analysis
 */
function generateOutcomesIssues(
  outcomesResult: OutcomesAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  // Knowledge gaps
  for (const gap of outcomesResult.knowledgeGaps) {
    issues.push({
      id: nanoid(),
      type: 'OBJECTIVE',
      severity: 'MEDIUM',
      status: 'OPEN',
      location: {},
      title: gap.gap,
      description: gap.impact,
      evidence: [],
      impact: {
        area: 'Learning Outcomes',
        description: gap.impact,
      },
      fix: {
        action: 'add',
        what: gap.suggestion,
        why: 'Addressing this gap improves learning outcomes.',
        how: gap.suggestion,
      },
    });
  }

  // Low skill coverage
  if (outcomesResult.skillsGained.length < 3) {
    issues.push({
      id: nanoid(),
      type: 'OBJECTIVE',
      severity: 'MEDIUM',
      status: 'OPEN',
      location: {},
      title: 'Limited skill development',
      description: `The course develops only ${outcomesResult.skillsGained.length} identifiable skills.`,
      evidence: outcomesResult.skillsGained.map(
        (s) => `${s.skill}: ${s.proficiencyLevel}`
      ),
      impact: {
        area: 'Career Readiness',
        description:
          'Limited skills may not adequately prepare learners for practical application.',
      },
      fix: {
        action: 'add',
        what: 'Add skill-building activities',
        why: 'Practical skills increase course value and learner employability.',
        how: 'Include hands-on exercises, projects, and real-world scenarios.',
      },
    });
  }

  return issues;
}

/**
 * Generate issues from Bloom's alignment verification (Phase 3A)
 */
function generateBloomsAlignmentIssues(
  bloomsResult: BloomsAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  if (!bloomsResult.bloomsAlignment) return issues;

  for (const alignment of bloomsResult.bloomsAlignment) {
    if (!alignment.isAligned && alignment.gap >= 2) {
      issues.push({
        id: nanoid(),
        type: 'DEPTH',
        severity: alignment.gap >= 3 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        location: {
          chapterId: alignment.chapterId,
          sectionId: alignment.sectionId,
          sectionTitle: alignment.sectionTitle,
        },
        title: `Bloom&apos;s mismatch: assigned ${alignment.assignedLevel} but content is ${alignment.actualLevel}`,
        description: `Section "${alignment.sectionTitle}" is marked as ${alignment.assignedLevel} but content analysis suggests ${alignment.actualLevel} (gap: ${alignment.gap} levels).`,
        evidence: [
          `Assigned level: ${alignment.assignedLevel}`,
          `Detected level: ${alignment.actualLevel}`,
          `Gap: ${alignment.gap} levels`,
        ],
        impact: {
          area: 'Cognitive Alignment',
          description: 'Misaligned objectives create confusion about expected depth.',
        },
        fix: {
          action: 'modify',
          what: `Align content with ${alignment.assignedLevel} level or update the objective level`,
          why: 'Objectives should match the cognitive demands of the content.',
          how: alignment.gap > 0
            ? `Add higher-order activities (${alignment.assignedLevel}-level) or change the objective to ${alignment.actualLevel}.`
            : `Simplify content to match ${alignment.assignedLevel} or update objective to ${alignment.actualLevel}.`,
        },
      });
    }
  }

  return issues;
}

/**
 * Generate prerequisite violation issues (Phase 3B)
 */
function generatePrerequisiteIssues(
  flowResult: FlowAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const prereq of flowResult.prerequisiteMap) {
    if (prereq.isMissing) {
      issues.push({
        id: nanoid(),
        type: 'PREREQUISITE',
        severity: 'HIGH',
        status: 'OPEN',
        location: {
          chapterId: prereq.introducedIn.chapterId,
          sectionId: prereq.introducedIn.sectionId,
        },
        title: `Concept "${prereq.concept}" used before being taught`,
        description: `The concept "${prereq.concept}" appears to be referenced before it is properly introduced.`,
        evidence: [
          `First introduced in chapter: ${prereq.introducedIn.chapterId}`,
          `Used in ${prereq.usedIn.length} location(s) before introduction`,
        ],
        impact: {
          area: 'Learning Prerequisites',
          description: 'Learners encounter concepts they haven&apos;t been taught yet.',
        },
        fix: {
          action: 'reorder',
          what: `Move introduction of "${prereq.concept}" before its first usage`,
          why: 'Concepts must be taught before they are referenced.',
          how: 'Either reorder sections/chapters or add a brief introduction where the concept is first used.',
        },
      });
    }
  }

  return issues;
}

/**
 * Generate content diversity issues (Phase 3C)
 */
function generateDiversityIssues(
  consistencyResult: ConsistencyAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];
  if (!consistencyResult.contentDiversityPerChapter) return issues;

  for (const chapter of consistencyResult.contentDiversityPerChapter) {
    if (chapter.score < 40) {
      issues.push({
        id: nanoid(),
        type: 'CONSISTENCY',
        severity: 'MEDIUM',
        status: 'OPEN',
        location: {
          chapterId: chapter.chapterId,
          chapterTitle: chapter.chapterTitle,
        },
        title: `Low content diversity (${chapter.score}%)`,
        description: `Chapter "${chapter.chapterTitle}" only has ${chapter.typesFound.length} content type(s): ${chapter.typesFound.join(', ') || 'none'}. Consider adding more varied content.`,
        evidence: [
          `Content types found: ${chapter.typesFound.join(', ') || 'none'}`,
          `Missing: ${['reading', 'video', 'quiz', 'project', 'discussion'].filter((t) => !chapter.typesFound.includes(t)).join(', ')}`,
          `Diversity score: ${chapter.score}%`,
        ],
        impact: {
          area: 'Learning Engagement',
          description: 'Low content diversity reduces learner engagement and accessibility.',
        },
        fix: {
          action: 'add',
          what: 'Add diverse content types',
          why: 'Multiple modalities improve retention and accommodate different learning styles.',
          how: 'Add video demonstrations, quizzes, projects, or discussion prompts to this chapter.',
        },
      });
    }
  }

  return issues;
}

/**
 * Sort issues by severity and type
 */
function sortIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const severityOrder: Record<IssueSeverity, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return issues.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Secondary sort by type
    return a.type.localeCompare(b.type);
  });
}

/**
 * Generate all issues from analysis results
 */
export async function generateIssues(
  input: IssueGeneratorInput
): Promise<AnalysisIssue[]> {
  const allIssues: AnalysisIssue[] = [];

  // Generate issues from each analysis step
  allIssues.push(...generateStructureIssues(input.course, input.structureResult));
  allIssues.push(...generateBloomsIssues(input.bloomsResult));
  allIssues.push(...generateBloomsAlignmentIssues(input.bloomsResult));
  allIssues.push(...generateFlowIssues(input.flowResult));
  allIssues.push(...generatePrerequisiteIssues(input.flowResult));
  allIssues.push(...generateConsistencyIssues(input.consistencyResult));
  allIssues.push(...generateDiversityIssues(input.consistencyResult));
  allIssues.push(...generateContentIssues(input.contentResult));
  allIssues.push(...generateOutcomesIssues(input.outcomesResult));

  // Sort by severity and return
  return sortIssues(allIssues);
}
