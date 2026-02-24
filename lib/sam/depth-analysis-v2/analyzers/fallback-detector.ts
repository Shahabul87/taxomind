/**
 * Fallback Detector (Step 8.5 — between Issues and Fixes)
 *
 * Rule-based analyzer that detects template/fallback content in course sections.
 * Zero AI cost — uses pattern matching and heuristics.
 *
 * Detects:
 * - Known fallback text markers ("placeholder content", "coming soon", "[pending]")
 * - Generic title patterns ("Introduction", "Chapter 1", "Untitled")
 * - Low content + no objectives (likely fallback)
 * - Repetitive boilerplate across sections
 */

import type { CourseInput, AnalysisIssue } from '../types';

// Known fallback/template text markers (case-insensitive)
const FALLBACK_MARKERS = [
  'this section covers',
  'placeholder content',
  'coming soon',
  '[pending]',
  '[todo]',
  '[placeholder]',
  'content will be added',
  'to be determined',
  'section under development',
  'content coming soon',
  'this chapter introduces',
  'in this section, you will learn about',
];

// Generic title patterns
const GENERIC_TITLE_PATTERNS = [
  /^introduction$/i,
  /^chapter\s+\d+$/i,
  /^section\s+\d+$/i,
  /^untitled/i,
  /^new\s+(chapter|section)$/i,
  /^overview$/i,
  /^getting\s+started$/i,
  /^module\s+\d+$/i,
];

let fallbackIssueCounter = 0;

function generateFallbackIssueId(): string {
  return `fallback-${Date.now()}-${++fallbackIssueCounter}`;
}

/**
 * Count how many fallback markers are present in a text
 */
function countFallbackMarkers(text: string): { count: number; markers: string[] } {
  const lowerText = text.toLowerCase();
  const foundMarkers: string[] = [];

  for (const marker of FALLBACK_MARKERS) {
    if (lowerText.includes(marker)) {
      foundMarkers.push(marker);
    }
  }

  return { count: foundMarkers.length, markers: foundMarkers };
}

/**
 * Check if a title matches generic/fallback patterns
 */
function isGenericTitle(title: string): boolean {
  return GENERIC_TITLE_PATTERNS.some((pattern) => pattern.test(title.trim()));
}

/**
 * Detect fallback/template content across the course.
 * Returns FALLBACK issues for sections with >= 2 markers.
 */
export function detectFallbacks(course: CourseInput): AnalysisIssue[] {
  fallbackIssueCounter = 0;
  const issues: AnalysisIssue[] = [];

  for (const chapter of course.chapters) {
    // Check chapter-level generic title
    const chapterIsGeneric = isGenericTitle(chapter.title);

    for (const section of chapter.sections) {
      const text = [
        section.title,
        section.description ?? '',
        section.content ?? '',
        ...(section.objectives ?? []),
      ].join(' ');

      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      const { count: markerCount, markers } = countFallbackMarkers(text);
      const titleIsGeneric = isGenericTitle(section.title);
      const hasNoObjectives = !section.objectives || section.objectives.length === 0;
      const isLowContent = wordCount < 50;

      // Score fallback signals
      let signals = 0;
      const evidence: string[] = [];

      if (markerCount > 0) {
        signals += markerCount;
        evidence.push(`Fallback markers found: ${markers.join(', ')}`);
      }
      if (titleIsGeneric) {
        signals++;
        evidence.push(`Generic title: "${section.title}"`);
      }
      if (chapterIsGeneric) {
        signals++;
        evidence.push(`Parent chapter has generic title: "${chapter.title}"`);
      }
      if (isLowContent && hasNoObjectives) {
        signals++;
        evidence.push(`Low content (${wordCount} words) with no objectives`);
      }

      // Flag as fallback if >= 2 signals detected
      if (signals >= 2) {
        issues.push({
          id: generateFallbackIssueId(),
          type: 'FALLBACK',
          severity: signals >= 3 ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          location: {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterPosition: chapter.position,
            sectionId: section.id,
            sectionTitle: section.title,
            sectionPosition: section.position,
          },
          title: `Possible fallback/template content detected`,
          description: `Section "${section.title}" in chapter "${chapter.title}" appears to contain placeholder or template content (${signals} fallback signals detected).`,
          evidence,
          impact: {
            area: 'Content Quality',
            description: 'Fallback content provides no real educational value and may confuse learners.',
          },
          fix: {
            action: 'modify',
            what: 'Replace fallback content with real educational material',
            why: 'Template content indicates the section was not properly generated or reviewed.',
            how: 'Write original content specific to this topic, add learning objectives, and ensure the title is descriptive.',
          },
        });
      }
    }
  }

  return issues;
}
