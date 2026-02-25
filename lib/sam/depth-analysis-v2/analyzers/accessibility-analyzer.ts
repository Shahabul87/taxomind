/**
 * Accessibility Analyzer (Step 11 — Rule-based, zero AI cost)
 *
 * Analyzes course content for WCAG compliance and readability issues:
 * - Missing alt text on images
 * - Missing captions on videos
 * - Readability scores per section
 * - Heading structure issues
 *
 * Reuses ReadabilityAnalyzer from lib/accessibility/wcag-utils.ts.
 */

import { nanoid } from 'nanoid';
import { ReadabilityAnalyzer } from '@/lib/accessibility/wcag-utils';
import type {
  CourseInput,
  AnalysisIssue,
  AccessibilityAnalysisResult,
  IssueSeverity,
} from '../types';

// Patterns for detecting images without alt text in HTML content
const IMG_WITHOUT_ALT = /<img(?![^>]*\balt\s*=\s*["'][^"']+["'])[^>]*>/gi;
const IMG_WITH_EMPTY_ALT = /<img[^>]*\balt\s*=\s*["']\s*["'][^>]*>/gi;

// Pattern for detecting video elements without track/captions
const VIDEO_WITHOUT_TRACK = /<video(?![^]*?<track\b)[^]*?<\/video>/gi;

// Pattern for detecting iframes (often embedded videos) without title
const IFRAME_WITHOUT_TITLE = /<iframe(?![^>]*\btitle\s*=\s*["'][^"']+["'])[^>]*>/gi;

/**
 * Check HTML content for accessibility issues
 */
function checkHTMLAccessibility(
  content: string,
  sectionId: string,
  sectionTitle: string,
  chapterId: string,
  chapterTitle: string
): AccessibilityAnalysisResult['wcagIssues'] {
  const issues: AccessibilityAnalysisResult['wcagIssues'] = [];

  if (!content) return issues;

  // Check for images without alt text
  const imgNoAlt = content.match(IMG_WITHOUT_ALT);
  const imgEmptyAlt = content.match(IMG_WITH_EMPTY_ALT);
  const missingAltCount = (imgNoAlt?.length ?? 0) + (imgEmptyAlt?.length ?? 0);

  if (missingAltCount > 0) {
    issues.push({
      sectionId,
      sectionTitle,
      chapterId,
      chapterTitle,
      issueType: 'MISSING_ALT_TEXT',
      description: `${missingAltCount} image(s) missing descriptive alt text`,
      severity: missingAltCount >= 3 ? 'HIGH' : 'MEDIUM',
    });
  }

  // Check for videos without captions
  const videosNoTrack = content.match(VIDEO_WITHOUT_TRACK);
  if (videosNoTrack && videosNoTrack.length > 0) {
    issues.push({
      sectionId,
      sectionTitle,
      chapterId,
      chapterTitle,
      issueType: 'MISSING_CAPTIONS',
      description: `${videosNoTrack.length} video(s) missing caption tracks`,
      severity: 'HIGH',
    });
  }

  // Check for iframes without title
  const iframesNoTitle = content.match(IFRAME_WITHOUT_TITLE);
  if (iframesNoTitle && iframesNoTitle.length > 0) {
    issues.push({
      sectionId,
      sectionTitle,
      chapterId,
      chapterTitle,
      issueType: 'MISSING_ALT_TEXT',
      description: `${iframesNoTitle.length} embedded content(s) missing title attribute`,
      severity: 'MEDIUM',
    });
  }

  // Check heading structure (h1-h6 should not skip levels)
  const headingMatches = [...content.matchAll(/<h([1-6])\b/gi)];
  if (headingMatches.length >= 2) {
    let prevLevel = 0;
    for (const match of headingMatches) {
      const level = parseInt(match[1], 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push({
          sectionId,
          sectionTitle,
          chapterId,
          chapterTitle,
          issueType: 'HEADING_STRUCTURE',
          description: `Heading level jumps from h${prevLevel} to h${level} (skips ${level - prevLevel - 1} level(s))`,
          severity: 'LOW',
        });
        break; // Only report once per section
      }
      prevLevel = level;
    }
  }

  return issues;
}

/**
 * Analyze accessibility of course content.
 * Returns per-section readability scores and WCAG issues.
 * Rule-based only — zero AI cost.
 */
export function analyzeAccessibility(course: CourseInput): AccessibilityAnalysisResult {
  const wcagIssues: AccessibilityAnalysisResult['wcagIssues'] = [];
  const sectionReadability: AccessibilityAnalysisResult['sectionReadability'] = [];
  let totalReadabilityScore = 0;
  let sectionCount = 0;

  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      const content = [
        section.description ?? '',
        section.content ?? '',
      ].join(' ').trim();

      if (content.length < 50) continue;

      // Readability analysis
      const readability = ReadabilityAnalyzer.analyze(content);
      sectionReadability.push({
        sectionId: section.id,
        sectionTitle: section.title,
        chapterId: chapter.id,
        fkGrade: readability.fleschKincaid,
        wordCount: readability.wordCount,
      });
      totalReadabilityScore += readability.fleschReadingEase;
      sectionCount++;

      // HTML accessibility checks
      const htmlIssues = checkHTMLAccessibility(
        section.content ?? '',
        section.id,
        section.title,
        chapter.id,
        chapter.title
      );
      wcagIssues.push(...htmlIssues);

      // Check for video URL without any accessibility mention in content
      if (section.videoUrl && !section.content?.includes('transcript') && !section.content?.includes('caption')) {
        wcagIssues.push({
          sectionId: section.id,
          sectionTitle: section.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          issueType: 'MISSING_CAPTIONS',
          description: 'Section has video but no mention of transcript or captions',
          severity: 'MEDIUM',
        });
      }
    }
  }

  const overallReadabilityScore = sectionCount > 0
    ? Math.round(totalReadabilityScore / sectionCount)
    : 0;

  return {
    overallReadabilityScore,
    wcagIssues,
    sectionReadability,
  };
}

/**
 * Convert accessibility analysis results into AnalysisIssue format.
 */
export function convertAccessibilityToIssues(
  accessibilityResult: AccessibilityAnalysisResult
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const wcagIssue of accessibilityResult.wcagIssues) {
    const severityMap: Record<string, IssueSeverity> = {
      MISSING_ALT_TEXT: 'MEDIUM',
      MISSING_CAPTIONS: 'HIGH',
      READABILITY: 'MEDIUM',
      COLOR_CONTRAST: 'MEDIUM',
      HEADING_STRUCTURE: 'LOW',
    };

    issues.push({
      id: nanoid(),
      type: 'ACCESSIBILITY',
      severity: wcagIssue.severity ?? severityMap[wcagIssue.issueType] ?? 'MEDIUM',
      status: 'OPEN',
      location: {
        chapterId: wcagIssue.chapterId,
        chapterTitle: wcagIssue.chapterTitle,
        sectionId: wcagIssue.sectionId,
        sectionTitle: wcagIssue.sectionTitle,
      },
      title: `${wcagIssue.issueType.replace(/_/g, ' ')}: ${wcagIssue.description}`,
      description: `Accessibility issue in "${wcagIssue.sectionTitle}": ${wcagIssue.description}`,
      evidence: [
        `Issue type: ${wcagIssue.issueType}`,
        `WCAG 2.1 Level A/AA compliance`,
      ],
      impact: {
        area: 'Accessibility',
        description: wcagIssue.issueType === 'MISSING_ALT_TEXT'
          ? 'Screen reader users cannot understand image content.'
          : wcagIssue.issueType === 'MISSING_CAPTIONS'
          ? 'Deaf or hard-of-hearing learners cannot access video content.'
          : wcagIssue.issueType === 'HEADING_STRUCTURE'
          ? 'Inconsistent heading structure makes navigation difficult for assistive technology users.'
          : 'Content may not be accessible to all learners.',
      },
      fix: {
        action: 'modify',
        what: wcagIssue.issueType === 'MISSING_ALT_TEXT'
          ? 'Add descriptive alt text to images'
          : wcagIssue.issueType === 'MISSING_CAPTIONS'
          ? 'Add captions or transcript for video content'
          : wcagIssue.issueType === 'HEADING_STRUCTURE'
          ? 'Fix heading hierarchy to not skip levels'
          : 'Fix accessibility issue',
        why: 'WCAG 2.1 compliance ensures content is accessible to learners with disabilities.',
        how: wcagIssue.issueType === 'MISSING_ALT_TEXT'
          ? 'Add alt attributes to all <img> elements describing the image content.'
          : wcagIssue.issueType === 'MISSING_CAPTIONS'
          ? 'Add <track> elements with captions or provide a text transcript.'
          : 'Ensure headings follow sequential order (h1 > h2 > h3, no skipping).',
      },
    });
  }

  return issues;
}
