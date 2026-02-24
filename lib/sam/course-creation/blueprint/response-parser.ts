/**
 * Blueprint Module — Response Parser
 *
 * Parses AI response text into a structured BlueprintResponse,
 * enforcing the pre-computed Bloom's distribution.
 */

import type { BlueprintChapter, BlueprintSection, BlueprintResponse, BlueprintRequestData } from './types';
import { buildFallbackChapter } from './scoring';
import { BlueprintAIResponseSchema } from './schema';
import { logger } from '@/lib/logger';

/**
 * Parse raw AI response text into a BlueprintResponse.
 * Enforces the pre-computed Bloom's distribution on each chapter.
 */
export function parseBlueprintResponse(
  text: string,
  data: BlueprintRequestData,
  bloomsDistribution?: string[],
): BlueprintResponse | null {
  try {
    // Strip <think>...</think> blocks (reasoning models)
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');

    cleaned = cleaned
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    // Attempt Zod validation for structural guarantees
    const zodResult = BlueprintAIResponseSchema.safeParse(parsed);
    if (zodResult.success) {
      // Use validated data — all fields are guaranteed to match the schema
      const validated = zodResult.data;
      const chapters: BlueprintChapter[] = validated.chapters.map((ch, i) => {
        // Enforce Bloom's distribution if provided
        const assignedLevel = bloomsDistribution?.[i];
        const bloomsLevel = assignedLevel ?? ch.bloomsLevel;

        const sections: BlueprintSection[] = ch.sections.slice(0, data.sectionsPerChapter).map((sec, j) => ({
          position: j + 1,
          title: sec.title,
          keyTopics: sec.keyTopics.slice(0, 7),
          ...(sec.estimatedMinutes && { estimatedMinutes: sec.estimatedMinutes }),
          ...(sec.formativeAssessment && { formativeAssessment: sec.formativeAssessment }),
        }));

        // Pad sections if fewer than expected
        while (sections.length < data.sectionsPerChapter) {
          sections.push({ position: sections.length + 1, title: `Section ${i + 1}.${sections.length + 1}`, keyTopics: [] });
        }

        return {
          position: i + 1,
          title: ch.title,
          goal: ch.goal,
          bloomsLevel,
          ...(ch.deliverable && { deliverable: ch.deliverable }),
          ...(ch.prerequisiteChapters && ch.prerequisiteChapters.length > 0 && { prerequisiteChapters: ch.prerequisiteChapters }),
          ...(ch.estimatedMinutes && { estimatedMinutes: ch.estimatedMinutes }),
          sections,
        };
      });

      // Pad chapters if fewer than expected
      while (chapters.length < data.chapterCount) {
        chapters.push(buildFallbackChapter(chapters.length + 1, data));
      }

      return {
        chapters: chapters.slice(0, data.chapterCount),
        northStarProject: validated.northStarProject,
        confidence: validated.confidence,
        riskAreas: validated.riskAreas.slice(0, 10),
      };
    }

    // Zod validation failed — log warning and fall through to manual extraction
    logger.debug('[BlueprintParser] Zod validation failed, using manual extraction', {
      issues: zodResult.error.issues.length,
    });

    if (!Array.isArray(parsed.chapters)) return null;

    const validBloomsLevels = new Set(['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']);

    const chapters: BlueprintChapter[] = [];
    for (let i = 0; i < data.chapterCount; i++) {
      const raw = (parsed.chapters as Array<Record<string, unknown>>)[i];
      if (!raw) {
        chapters.push(buildFallbackChapter(i + 1, data));
        continue;
      }

      // Enforce the pre-computed Bloom's distribution if available
      // This ensures progressive escalation even if the AI model ignored the instruction
      const assignedLevel = bloomsDistribution?.[i];
      const aiLevel = typeof raw.bloomsLevel === 'string' && validBloomsLevels.has(raw.bloomsLevel)
        ? raw.bloomsLevel
        : null;
      const bloomsLevel = assignedLevel ?? aiLevel ?? 'UNDERSTAND';

      const sections: BlueprintSection[] = [];
      const rawSections = Array.isArray(raw.sections) ? raw.sections as Array<Record<string, unknown>> : [];

      for (let j = 0; j < data.sectionsPerChapter; j++) {
        const rawSec = rawSections[j];
        if (!rawSec) {
          sections.push({ position: j + 1, title: `Section ${i + 1}.${j + 1}`, keyTopics: [] });
          continue;
        }
        sections.push({
          position: j + 1,
          title: typeof rawSec.title === 'string' ? rawSec.title : `Section ${i + 1}.${j + 1}`,
          keyTopics: Array.isArray(rawSec.keyTopics)
            ? (rawSec.keyTopics as string[]).filter(t => typeof t === 'string').slice(0, 7)
            : [],
        });
      }

      // Parse prerequisiteChapters from AI response (optional — heuristic fallback will fill gaps)
      const prerequisiteChapters = Array.isArray(raw.prerequisiteChapters)
        ? (raw.prerequisiteChapters as number[]).filter(p => typeof p === 'number' && p >= 1 && p <= data.chapterCount)
        : undefined;

      chapters.push({
        position: i + 1,
        title: typeof raw.title === 'string' ? raw.title : `Chapter ${i + 1}`,
        goal: typeof raw.goal === 'string' ? raw.goal : '',
        bloomsLevel,
        deliverable: typeof raw.deliverable === 'string' ? raw.deliverable : undefined,
        prerequisiteChapters: prerequisiteChapters && prerequisiteChapters.length > 0 ? prerequisiteChapters : undefined,
        sections,
      });
    }

    const northStarProject = typeof parsed.northStarProject === 'string'
      ? parsed.northStarProject
      : undefined;

    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.confidence)))
      : 70;

    const riskAreas = Array.isArray(parsed.riskAreas)
      ? (parsed.riskAreas as string[]).filter(r => typeof r === 'string').slice(0, 10)
      : [];

    return { chapters, northStarProject, confidence, riskAreas };
  } catch {
    return null;
  }
}
