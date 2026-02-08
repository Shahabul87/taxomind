/**
 * Flow Analyzer (Step 3)
 *
 * Analyzes learning progression and cognitive flow through the course.
 * Identifies prerequisite issues, cognitive jumps, and flow problems.
 */

import type {
  CourseInput,
  BloomsAnalysisResult,
  FlowAnalysisResult,
  BloomsLevel,
  IssueSeverity,
} from '../types';

// Bloom's level order for comparison
const BLOOMS_ORDER: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

/**
 * Get numeric index for a Bloom's level
 */
function getLevelIndex(level: BloomsLevel): number {
  return BLOOMS_ORDER.indexOf(level);
}

/**
 * Determine severity based on cognitive gap size
 */
function getSeverityFromGap(gap: number): IssueSeverity {
  if (gap >= 3) return 'HIGH';
  if (gap >= 2) return 'MEDIUM';
  return 'LOW';
}

/**
 * Extract key concepts/topics from text
 */
function extractConcepts(text: string): string[] {
  // Simple concept extraction - look for capitalized multi-word phrases
  // and technical terms
  const concepts: Set<string> = new Set();

  // Match capitalized phrases (e.g., "Machine Learning", "API Design")
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  let match;
  while ((match = capitalizedPattern.exec(text)) !== null) {
    concepts.add(match[1].toLowerCase());
  }

  // Match technical terms (words with special patterns)
  const techPatterns = [
    /\b(API|REST|HTTP|JSON|SQL|CSS|HTML|DOM|UI|UX)\b/gi,
    /\b([a-z]+(?:ing|tion|ment|ness|ity))\b/gi, // Abstract nouns
    /\b([A-Za-z]+(?:Script|Base|Flow|Stack|Chain))\b/gi, // Compound tech terms
  ];

  for (const pattern of techPatterns) {
    while ((match = pattern.exec(text)) !== null) {
      concepts.add(match[1].toLowerCase());
    }
  }

  return Array.from(concepts).slice(0, 20); // Limit to 20 concepts
}

/**
 * Build a concept map showing where concepts are introduced and used
 */
function buildConceptMap(
  course: CourseInput
): FlowAnalysisResult['prerequisiteMap'] {
  const conceptLocations: Map<
    string,
    {
      firstSeen: { chapterId: string; sectionId?: string; position: number };
      usedIn: Array<{ chapterId: string; sectionId?: string; position: number }>;
    }
  > = new Map();

  // Track position for ordering
  let globalPosition = 0;

  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      globalPosition++;

      // Extract concepts from this section
      const text = [
        section.title,
        section.description || '',
        section.content || '',
        ...(section.objectives || []),
      ].join(' ');

      const concepts = extractConcepts(text);

      for (const concept of concepts) {
        if (!conceptLocations.has(concept)) {
          // First time seeing this concept
          conceptLocations.set(concept, {
            firstSeen: {
              chapterId: chapter.id,
              sectionId: section.id,
              position: globalPosition,
            },
            usedIn: [],
          });
        } else {
          // Concept used again
          const existing = conceptLocations.get(concept)!;
          existing.usedIn.push({
            chapterId: chapter.id,
            sectionId: section.id,
            position: globalPosition,
          });
        }
      }
    }
  }

  // Convert to result format
  const prerequisiteMap: FlowAnalysisResult['prerequisiteMap'] = [];
  let conceptId = 0;

  for (const [concept, locations] of conceptLocations.entries()) {
    // Only include concepts that are used multiple times (indicates prerequisites)
    if (locations.usedIn.length > 0) {
      // Check if concept is used before it's properly introduced
      // (e.g., used early with minimal content, then explained later in detail)
      const isMissing = false; // TODO: Could check if first mention has enough context

      prerequisiteMap.push({
        conceptId: `concept-${++conceptId}`,
        concept,
        introducedIn: {
          chapterId: locations.firstSeen.chapterId,
          sectionId: locations.firstSeen.sectionId,
        },
        usedIn: locations.usedIn.map((loc) => ({
          chapterId: loc.chapterId,
          sectionId: loc.sectionId,
        })),
        isMissing,
      });
    }
  }

  return prerequisiteMap.slice(0, 30); // Limit to 30 most significant concepts
}

/**
 * Detect cognitive jumps between consecutive sections
 */
function detectCognitiveJumps(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): FlowAnalysisResult['cognitiveJumps'] {
  const jumps: FlowAnalysisResult['cognitiveJumps'] = [];

  for (const chapterBlooms of bloomsResult.chapters) {
    const sections = chapterBlooms.sectionResults;

    for (let i = 1; i < sections.length; i++) {
      const prevSection = sections[i - 1];
      const currSection = sections[i];

      const prevIndex = getLevelIndex(prevSection.primaryLevel);
      const currIndex = getLevelIndex(currSection.primaryLevel);
      const gap = currIndex - prevIndex;

      // Flag significant jumps (skipping 2+ levels)
      if (Math.abs(gap) >= 2) {
        const direction = gap > 0 ? 'up' : 'down';
        jumps.push({
          location: {
            chapterId: currSection.chapterId,
            chapterTitle: currSection.chapterTitle,
            sectionId: currSection.sectionId,
            sectionTitle: currSection.sectionTitle,
          },
          fromLevel: prevSection.primaryLevel,
          toLevel: currSection.primaryLevel,
          gap: Math.abs(gap),
          description:
            direction === 'up'
              ? `Cognitive complexity jumps ${Math.abs(gap)} levels from ${prevSection.primaryLevel} to ${currSection.primaryLevel}. Consider adding bridging content.`
              : `Cognitive complexity drops ${Math.abs(gap)} levels from ${prevSection.primaryLevel} to ${currSection.primaryLevel}. This may confuse learners expecting progression.`,
        });
      }
    }
  }

  return jumps;
}

/**
 * Analyze progression issues between chapters
 */
function analyzeChapterProgression(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): FlowAnalysisResult['progressionIssues'] {
  const issues: FlowAnalysisResult['progressionIssues'] = [];
  const chapters = bloomsResult.chapters;

  for (let i = 1; i < chapters.length; i++) {
    const prevChapter = chapters[i - 1];
    const currChapter = chapters[i];

    const prevIndex = getLevelIndex(prevChapter.primaryLevel);
    const currIndex = getLevelIndex(currChapter.primaryLevel);
    const gap = currIndex - prevIndex;

    // Check for significant issues
    if (gap >= 3) {
      // Big jump forward
      issues.push({
        fromChapter: {
          id: prevChapter.chapterId,
          title: prevChapter.chapterTitle,
          position: prevChapter.position,
        },
        toChapter: {
          id: currChapter.chapterId,
          title: currChapter.chapterTitle,
          position: currChapter.position,
        },
        issue: `Large cognitive jump from ${prevChapter.primaryLevel} to ${currChapter.primaryLevel}`,
        severity: getSeverityFromGap(gap),
        suggestion:
          'Consider adding intermediate content or reordering chapters to create smoother progression.',
      });
    } else if (gap <= -2) {
      // Big drop backward
      issues.push({
        fromChapter: {
          id: prevChapter.chapterId,
          title: prevChapter.chapterTitle,
          position: prevChapter.position,
        },
        toChapter: {
          id: currChapter.chapterId,
          title: currChapter.chapterTitle,
          position: currChapter.position,
        },
        issue: `Cognitive complexity drops from ${prevChapter.primaryLevel} to ${currChapter.primaryLevel}`,
        severity: 'MEDIUM',
        suggestion:
          'Review chapter order. Lower complexity content typically works better earlier in the course.',
      });
    }

    // Check for repeated same level (plateau)
    if (
      gap === 0 &&
      i > 1 &&
      chapters[i - 2].primaryLevel === prevChapter.primaryLevel
    ) {
      issues.push({
        fromChapter: {
          id: prevChapter.chapterId,
          title: prevChapter.chapterTitle,
          position: prevChapter.position,
        },
        toChapter: {
          id: currChapter.chapterId,
          title: currChapter.chapterTitle,
          position: currChapter.position,
        },
        issue: `Three consecutive chapters at ${currChapter.primaryLevel} level - learning may plateau`,
        severity: 'LOW',
        suggestion:
          'Consider varying cognitive demands to maintain engagement and growth.',
      });
    }
  }

  return issues;
}

/**
 * Calculate overall flow score
 */
function calculateFlowScore(
  progressionIssues: FlowAnalysisResult['progressionIssues'],
  cognitiveJumps: FlowAnalysisResult['cognitiveJumps'],
  totalChapters: number
): number {
  let score = 100;

  // Deduct for progression issues
  for (const issue of progressionIssues) {
    switch (issue.severity) {
      case 'HIGH':
        score -= 15;
        break;
      case 'MEDIUM':
        score -= 10;
        break;
      case 'LOW':
        score -= 5;
        break;
    }
  }

  // Deduct for cognitive jumps (within sections)
  for (const jump of cognitiveJumps) {
    score -= jump.gap * 3; // 3 points per level skipped
  }

  // Bonus for having good chapter count (5-12 is optimal)
  if (totalChapters >= 5 && totalChapters <= 12) {
    score += 5;
  } else if (totalChapters < 3 || totalChapters > 20) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze learning flow through the course
 */
export async function analyzeFlow(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): Promise<FlowAnalysisResult> {
  // Detect progression issues between chapters
  const progressionIssues = analyzeChapterProgression(course, bloomsResult);

  // Detect cognitive jumps within chapters
  const cognitiveJumps = detectCognitiveJumps(course, bloomsResult);

  // Build prerequisite/concept map
  const prerequisiteMap = buildConceptMap(course);

  // Calculate overall flow score
  const overallFlowScore = calculateFlowScore(
    progressionIssues,
    cognitiveJumps,
    course.chapters.length
  );

  return {
    overallFlowScore,
    progressionIssues,
    cognitiveJumps,
    prerequisiteMap,
  };
}
