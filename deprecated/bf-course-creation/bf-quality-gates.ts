/**
 * Breadth-First Pipeline Quality Gates
 *
 * Structured quality validation for each BF stage:
 * - Stage 1: Roadmap structure validation
 * - Stage 2: Per-chapter + cross-chapter validation
 * - Stage 3: Cross-section validation within a chapter
 *
 * Each gate returns a BFQualityGateResult with pass/fail, checks, and
 * refinement feedback that can be injected into retry prompts.
 */

import { jaccardSimilarity } from './helpers';
import {
  detectBloomVerb,
  checkBloomProgression,
  getAllowedBloomLevels,
  findDuplicateObjectives,
} from './bloom-helpers';
import { BLOOMS_LEVELS } from './types';
import type {
  CourseContext,
  CourseRoadmap,
  RoadmapChapter,
  GeneratedChapter,
  CompletedSection,
  SectionDetails,
  BloomsLevel,
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface BFQualityCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning';
  message: string;
}

export interface BFQualityGateResult {
  passed: boolean;
  checks: BFQualityCheck[];
  errorCount: number;
  warningCount: number;
  refinementFeedback: string | null;
  score: number; // 0-100
}

// ============================================================================
// Stage 1: Roadmap Structure Validation
// ============================================================================

/**
 * Validate the complete course roadmap structure.
 * Checks: chapter count, section counts, title uniqueness, generic title detection,
 * Bloom's progression, and total section count.
 */
export function validateBFRoadmap(
  roadmap: CourseRoadmap,
  courseContext: CourseContext,
): BFQualityGateResult {
  const checks: BFQualityCheck[] = [];

  // 1. Chapter count check
  const expectedChapters = courseContext.totalChapters;
  if (roadmap.chapters.length !== expectedChapters) {
    checks.push({
      name: 'chapter_count',
      passed: false,
      severity: 'error',
      message: `Expected ${expectedChapters} chapters, got ${roadmap.chapters.length}`,
    });
  } else {
    checks.push({ name: 'chapter_count', passed: true, severity: 'warning', message: 'Chapter count matches' });
  }

  // 2. Section count per chapter
  const expectedSections = courseContext.sectionsPerChapter;
  for (const ch of roadmap.chapters) {
    if (ch.sections.length !== expectedSections) {
      checks.push({
        name: 'section_count',
        passed: false,
        severity: 'warning',
        message: `Ch${ch.position} has ${ch.sections.length} sections, expected ${expectedSections}`,
      });
    }
  }
  if (!checks.some(c => c.name === 'section_count' && !c.passed)) {
    checks.push({ name: 'section_count', passed: true, severity: 'warning', message: 'All chapters have correct section count' });
  }

  // 3. Chapter title uniqueness (Jaccard threshold 0.6)
  for (let i = 0; i < roadmap.chapters.length; i++) {
    for (let j = i + 1; j < roadmap.chapters.length; j++) {
      const sim = jaccardSimilarity(roadmap.chapters[i].title, roadmap.chapters[j].title);
      if (sim > 0.6) {
        checks.push({
          name: 'chapter_title_uniqueness',
          passed: false,
          severity: 'error',
          message: `Ch${i + 1} "${roadmap.chapters[i].title}" and Ch${j + 1} "${roadmap.chapters[j].title}" are too similar (${Math.round(sim * 100)}%)`,
        });
      }
    }
  }

  // 4. Section title uniqueness across entire course (Jaccard threshold 0.65)
  const allSections = roadmap.chapters.flatMap(ch =>
    ch.sections.map(s => ({ title: s.title, chapter: ch.position, position: s.position }))
  );
  for (let i = 0; i < allSections.length; i++) {
    for (let j = i + 1; j < allSections.length; j++) {
      const sim = jaccardSimilarity(allSections[i].title, allSections[j].title);
      if (sim > 0.65) {
        checks.push({
          name: 'section_title_uniqueness',
          passed: false,
          severity: 'warning',
          message: `Sec "${allSections[i].title}" (Ch${allSections[i].chapter}) and "${allSections[j].title}" (Ch${allSections[j].chapter}) are too similar (${Math.round(sim * 100)}%)`,
        });
      }
    }
  }

  // 5a. Hard generic title patterns — these are ERRORS (hallmarks of fallback garbage)
  const hardGenericPatterns = [
    /^Section \d+ of Chapter \d+$/i,                 // "Section 1 of Chapter 1"
    /^Chapter \d+:.*— Part \d+$/i,                   // "Chapter 1: Topic — Part 1"
    /^Chapter \d+:.*- Part \d+$/i,                    // "Chapter 1: Topic - Part 1"
    /— Part \d+$/i,                                   // Any title ending with "— Part N"
    /- Part \d+$/i,                                    // Any title ending with "- Part N"
    /^Part \d+$/i,                                     // Just "Part N"
    /^Chapter \d+$/i,                                  // Just "Chapter N"
    /^Section \d+$/i,                                  // Just "Section N"
  ];
  for (const ch of roadmap.chapters) {
    if (hardGenericPatterns.some(p => p.test(ch.title))) {
      checks.push({
        name: 'hard_generic_title',
        passed: false,
        severity: 'error',
        message: `Ch${ch.position} has a garbage fallback title: "${ch.title}" — must be replaced with a topic-specific title`,
      });
    }
    // Check if chapter title is just the course title with a number appended
    const courseBase = courseContext.courseTitle.toLowerCase().trim();
    const chTitleLower = ch.title.toLowerCase().trim();
    if (/^\d+$/.test(chTitleLower.replace(courseBase, '').replace(/[^a-z0-9]/g, ''))) {
      checks.push({
        name: 'hard_generic_title',
        passed: false,
        severity: 'error',
        message: `Ch${ch.position} title "${ch.title}" is just the course title with a number — must be specific`,
      });
    }
    for (const s of ch.sections) {
      if (hardGenericPatterns.some(p => p.test(s.title))) {
        checks.push({
          name: 'hard_generic_title',
          passed: false,
          severity: 'error',
          message: `Section "${s.title}" in Ch${ch.position} has a garbage fallback title — must be replaced`,
        });
      }
    }
  }

  // 5b. Soft generic title patterns — these are WARNINGS
  const softGenericPatterns = [
    /^(introduction|overview|basics|getting started|review|summary|miscellaneous)\b/i,
    /^section \d+/i,
    /^chapter \d+/i,
  ];
  for (const ch of roadmap.chapters) {
    if (softGenericPatterns.some(p => p.test(ch.title)) && !hardGenericPatterns.some(p => p.test(ch.title))) {
      checks.push({
        name: 'generic_title',
        passed: false,
        severity: 'warning',
        message: `Ch${ch.position} has a generic title: "${ch.title}"`,
      });
    }
    for (const s of ch.sections) {
      if (softGenericPatterns.some(p => p.test(s.title)) && !hardGenericPatterns.some(p => p.test(s.title))) {
        checks.push({
          name: 'generic_title',
          passed: false,
          severity: 'warning',
          message: `Section "${s.title}" in Ch${ch.position} has a generic title`,
        });
      }
    }
  }

  // 6. Bloom's progression (non-decreasing)
  const bloomsLevels = roadmap.chapters.map(ch => ch.bloomsLevel);
  const progression = checkBloomProgression(bloomsLevels);
  if (!progression.valid) {
    for (const reg of progression.regressions) {
      checks.push({
        name: 'blooms_progression',
        passed: false,
        severity: 'warning',
        message: `Bloom's regression at Ch${reg.position}: ${reg.from} -> ${reg.to}`,
      });
    }
  }

  // 7. Bloom's range for difficulty
  const allowedRange = getAllowedBloomLevels(courseContext.difficulty);
  for (const ch of roadmap.chapters) {
    const idx = BLOOMS_LEVELS.indexOf(ch.bloomsLevel);
    if (idx < allowedRange.minIndex || idx > allowedRange.maxIndex) {
      checks.push({
        name: 'blooms_range',
        passed: false,
        severity: 'warning',
        message: `Ch${ch.position} Bloom's level ${ch.bloomsLevel} outside expected range for ${courseContext.difficulty} (${allowedRange.min}-${allowedRange.max})`,
      });
    }
  }

  // 8. Total section count
  const totalSections = roadmap.chapters.reduce((s, ch) => s + ch.sections.length, 0);
  const expectedTotal = expectedChapters * expectedSections;
  if (totalSections !== expectedTotal) {
    checks.push({
      name: 'total_section_count',
      passed: false,
      severity: 'warning',
      message: `Total sections: ${totalSections}, expected ${expectedTotal}`,
    });
  }

  return buildGateResult(checks);
}

// ============================================================================
// Stage 2: Chapter Details Validation
// ============================================================================

/**
 * Validate a single chapter's details against the roadmap and prior chapters.
 * Checks: objective count, Bloom's verb alignment, cross-chapter deduplication,
 * description quality, key concepts, and Bloom's progression.
 */
export function validateBFChapterDetails(
  chapter: GeneratedChapter,
  previousChapters: GeneratedChapter[],
  roadmapChapter: RoadmapChapter,
  courseContext: CourseContext,
): BFQualityGateResult {
  const checks: BFQualityCheck[] = [];
  const expectedObjectives = courseContext.learningObjectivesPerChapter;

  // 1. Objective count (3-5 expected)
  if (chapter.learningObjectives.length < Math.max(3, expectedObjectives - 1)) {
    checks.push({
      name: 'objective_count',
      passed: false,
      severity: 'error',
      message: `Chapter has ${chapter.learningObjectives.length} objectives, expected at least ${Math.max(3, expectedObjectives - 1)}`,
    });
  } else if (chapter.learningObjectives.length > expectedObjectives + 2) {
    checks.push({
      name: 'objective_count',
      passed: false,
      severity: 'warning',
      message: `Chapter has ${chapter.learningObjectives.length} objectives, expected at most ${expectedObjectives + 2}`,
    });
  }

  // 2. Bloom's verb alignment — objectives MUST start with level-appropriate verbs
  const expectedLevel = roadmapChapter.bloomsLevel;
  const expectedIdx = BLOOMS_LEVELS.indexOf(expectedLevel);
  let verbAligned = 0;
  for (const obj of chapter.learningObjectives) {
    const detection = detectBloomVerb(obj);
    if (detection) {
      const detectedIdx = BLOOMS_LEVELS.indexOf(detection.level);
      // Allow same level or one level adjacent
      if (Math.abs(detectedIdx - expectedIdx) <= 1) {
        verbAligned++;
      }
    }
  }
  if (chapter.learningObjectives.length > 0 && verbAligned < Math.ceil(chapter.learningObjectives.length * 0.5)) {
    checks.push({
      name: 'blooms_verb_alignment',
      passed: false,
      severity: 'error',
      message: `Only ${verbAligned}/${chapter.learningObjectives.length} objectives use ${expectedLevel}-level Bloom's verbs`,
    });
  }

  // 3. Cross-chapter objective deduplication
  const allPriorObjectives = previousChapters.flatMap(ch => ch.learningObjectives);
  const duplicates = findDuplicateObjectives([...allPriorObjectives, ...chapter.learningObjectives], 0.65);
  const crossChapterDups = duplicates.filter(d =>
    d.indexA < allPriorObjectives.length && d.indexB >= allPriorObjectives.length
  );
  if (crossChapterDups.length > 0) {
    for (const dup of crossChapterDups.slice(0, 3)) {
      checks.push({
        name: 'cross_chapter_dedup',
        passed: false,
        severity: 'warning',
        message: `Objective "${dup.textB.slice(0, 60)}..." duplicates prior chapter objective (${Math.round(dup.similarity * 100)}% overlap)`,
      });
    }
  }

  // 4. Description quality (100-2000 chars)
  const descLen = chapter.description.length;
  if (descLen < 100) {
    checks.push({
      name: 'description_quality',
      passed: false,
      severity: 'error',
      message: `Description too short: ${descLen} chars (min 100)`,
    });
  } else if (descLen > 2000) {
    checks.push({
      name: 'description_quality',
      passed: false,
      severity: 'warning',
      message: `Description too long: ${descLen} chars (max 2000)`,
    });
  }

  // 5. Key concepts (>=2 required)
  if (chapter.keyTopics.length < 2) {
    checks.push({
      name: 'key_concepts',
      passed: false,
      severity: 'error',
      message: `Only ${chapter.keyTopics.length} key topics, need at least 2`,
    });
  }

  // 6. Concepts introduced (3-7 expected)
  const conceptCount = chapter.conceptsIntroduced?.length ?? 0;
  if (conceptCount < 3) {
    checks.push({
      name: 'concepts_introduced',
      passed: false,
      severity: 'warning',
      message: `Only ${conceptCount} new concepts introduced, expected 3-7`,
    });
  }

  // 7. Bloom's progression check (with prior chapters)
  if (previousChapters.length > 0) {
    const allLevels = [...previousChapters.map(ch => ch.bloomsLevel), chapter.bloomsLevel];
    const prog = checkBloomProgression(allLevels);
    if (!prog.valid) {
      const lastReg = prog.regressions[prog.regressions.length - 1];
      if (lastReg && lastReg.position === allLevels.length) {
        checks.push({
          name: 'blooms_progression',
          passed: false,
          severity: 'warning',
          message: `Bloom's regression: chapter uses ${lastReg.to} but previous chapter was ${lastReg.from}`,
        });
      }
    }
  }

  return buildGateResult(checks);
}

// ============================================================================
// Stage 3: Section Details Validation
// ============================================================================

/**
 * Validate section details within a chapter for cross-section quality.
 * Checks: section objective count, Bloom's alignment, cross-section deduplication,
 * concept uniqueness, description quality, and intra-chapter Bloom's progression.
 */
export function validateBFSectionDetails(
  sections: CompletedSection[],
  chapter: GeneratedChapter,
  courseContext: CourseContext,
): BFQualityGateResult {
  const checks: BFQualityCheck[] = [];

  // Collect all objectives across sections for dedup checking
  const allObjectives: Array<{ sectionPos: number; objective: string }> = [];
  const allConcepts: Array<{ sectionPos: number; concept: string }> = [];

  for (const section of sections) {
    if (!section.details) continue;
    const details = section.details;

    // 1. Section objective count (2-4 expected)
    if (details.learningObjectives.length < 2) {
      checks.push({
        name: 'section_objective_count',
        passed: false,
        severity: 'warning',
        message: `Section ${section.position} "${section.title}" has ${details.learningObjectives.length} objectives, expected at least 2`,
      });
    } else if (details.learningObjectives.length > 6) {
      checks.push({
        name: 'section_objective_count',
        passed: false,
        severity: 'warning',
        message: `Section ${section.position} "${section.title}" has ${details.learningObjectives.length} objectives, expected at most 6`,
      });
    }

    // 2. Bloom's alignment for section objectives
    const chapterBloomIdx = BLOOMS_LEVELS.indexOf(chapter.bloomsLevel);
    let sectionVerbAligned = 0;
    for (const obj of details.learningObjectives) {
      const detection = detectBloomVerb(obj);
      if (detection) {
        const detectedIdx = BLOOMS_LEVELS.indexOf(detection.level);
        if (Math.abs(detectedIdx - chapterBloomIdx) <= 1) {
          sectionVerbAligned++;
        }
      }
    }
    if (details.learningObjectives.length > 0 && sectionVerbAligned < Math.ceil(details.learningObjectives.length * 0.4)) {
      checks.push({
        name: 'section_blooms_alignment',
        passed: false,
        severity: 'warning',
        message: `Section ${section.position}: only ${sectionVerbAligned}/${details.learningObjectives.length} objectives align with ${chapter.bloomsLevel}-level verbs`,
      });
    }

    // Collect for cross-section checks
    for (const obj of details.learningObjectives) {
      allObjectives.push({ sectionPos: section.position, objective: obj });
    }
    for (const concept of details.keyConceptsCovered ?? []) {
      allConcepts.push({ sectionPos: section.position, concept });
    }

    // 3. Description quality (50-1500 chars for section details description)
    const descLen = details.description.length;
    if (descLen < 50) {
      checks.push({
        name: 'section_description_quality',
        passed: false,
        severity: 'error',
        message: `Section ${section.position} description too short: ${descLen} chars`,
      });
    }
  }

  // 4. Cross-section objective deduplication
  const objectiveTexts = allObjectives.map(o => o.objective);
  const dupObjectives = findDuplicateObjectives(objectiveTexts, 0.65);
  for (const dup of dupObjectives.slice(0, 3)) {
    const secA = allObjectives[dup.indexA].sectionPos;
    const secB = allObjectives[dup.indexB].sectionPos;
    if (secA !== secB) {
      checks.push({
        name: 'cross_section_objective_dedup',
        passed: false,
        severity: 'warning',
        message: `Sections ${secA} and ${secB} have near-duplicate objectives (${Math.round(dup.similarity * 100)}% overlap): "${dup.textA.slice(0, 50)}..."`,
      });
    }
  }

  // 5. Cross-section concept uniqueness
  const conceptMap = new Map<string, number[]>();
  for (const { sectionPos, concept } of allConcepts) {
    const key = concept.toLowerCase();
    const existing = conceptMap.get(key) ?? [];
    existing.push(sectionPos);
    conceptMap.set(key, existing);
  }
  for (const [concept, sectionPositions] of conceptMap) {
    const uniqueSections = [...new Set(sectionPositions)];
    if (uniqueSections.length > 2) {
      checks.push({
        name: 'cross_section_concept_uniqueness',
        passed: false,
        severity: 'warning',
        message: `Concept "${concept}" appears in ${uniqueSections.length} sections — consider distributing more uniquely`,
      });
    }
  }

  return buildGateResult(checks);
}

// ============================================================================
// Helpers
// ============================================================================

function buildGateResult(checks: BFQualityCheck[]): BFQualityGateResult {
  const errors = checks.filter(c => !c.passed && c.severity === 'error');
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning');
  const errorCount = errors.length;
  const warningCount = warnings.length;

  // Score: start at 100, subtract per issue
  const rawScore = 100 - (errorCount * 12) - (warningCount * 4);
  const score = Math.max(0, Math.min(100, rawScore));
  const passed = errorCount === 0 && score >= 60;

  // Build refinement feedback from failed checks
  let refinementFeedback: string | null = null;
  const failedChecks = checks.filter(c => !c.passed);
  if (failedChecks.length > 0) {
    const feedbackLines = failedChecks.slice(0, 5).map((c, i) =>
      `${i + 1}. [${c.severity.toUpperCase()}] ${c.message}`
    );
    refinementFeedback = `## QUALITY GATE ISSUES\n${feedbackLines.join('\n')}\n\nFix these issues in your response.`;
  }

  return {
    passed,
    checks,
    errorCount,
    warningCount,
    refinementFeedback,
    score,
  };
}
