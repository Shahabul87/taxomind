/**
 * Blueprint Module — Prompt Builder
 *
 * Builds prompts using Backwards Design (Understanding by Design).
 * Start from the final product (North Star), then work backward
 * to the learning journey.
 */

import type { CourseContext } from '@/lib/sam/course-creation/types';
import type { composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';
import type { BlueprintRequestData } from './types';
import { BLOOMS_ARTIFACT_GUIDANCE } from './bloom-distribution';

/**
 * Build prompts using Backwards Design (Understanding by Design).
 *
 * Key insight: Start from the final product (North Star), then work backward
 * to the learning journey. The model already knows how to design expert-level
 * courses — a natural, concise prompt produces better output than verbose
 * format rules and BAD/GOOD examples.
 *
 * We keep the prompt simple and let the parser handle structure enforcement.
 * For reasoning models, we use even less meta-instruction to reduce thinking time.
 *
 * When criticFeedback is provided (retry pass), it is appended to the prompt.
 */
export function buildBlueprintPrompts(
  ctx: CourseContext,
  data: BlueprintRequestData,
  composed: ReturnType<typeof composeCategoryPrompt> | null,
  bloomsAssignmentBlock: string,
  isReasoningModel: boolean,
  criticFeedback?: string,
): { systemPrompt: string; userPrompt: string } {
  // Minimal system prompt — establish the role + Backwards Design + domain expertise
  const systemPrompt = `You are a world-class course architect who designs rigorous, well-sequenced courses at MIT/Stanford quality. You use Backwards Design (Understanding by Design): start from the final product, then work backward to the learning journey. Return ONLY valid JSON — no markdown fences, no extra text.
${composed?.expertiseBlock ?? ''}`;

  // Domain pedagogy blocks (if available from loaded skill files)
  const bloomsGuidanceBlock = composed?.chapterGuidanceBlock ?? '';
  const sectionGuidanceBlock = composed?.sectionGuidanceBlock ?? '';

  // Backwards Design user prompt — North Star FIRST, then journey backward
  const userPrompt = `I am creating a course on "${ctx.courseTitle}" with ${ctx.totalChapters} chapters and ${ctx.sectionsPerChapter} sections in each chapter.

COURSE DETAILS:
- Title: "${ctx.courseTitle}"
- Overview: ${ctx.courseDescription}
- Category: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
- Audience: ${ctx.targetAudience}
- Difficulty: ${ctx.difficulty}
${data.duration ? `- Duration: ${data.duration}` : ''}

Learning Objectives:
${ctx.courseLearningObjectives.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## STEP 1 — DEFINE THE NORTH STAR (Backwards Design: start from the end)

Every great course builds toward ONE realistic, portfolio-worthy product or project. Define this FIRST:

1. **North Star Project**: Define a single realistic product/project that the ENTIRE course builds toward. This is what the student can show an employer or put in a portfolio at the end. It should be ambitious but achievable given the course scope.

2. **Per-Chapter Deliverable**: Each chapter should produce a tangible artifact that contributes to the North Star Project. The deliverable type should match the chapter&apos;s Bloom&apos;s level:
${Object.entries(BLOOMS_ARTIFACT_GUIDANCE).map(([level, artifacts]) => `   - ${level}: ${artifacts}`).join('\n')}

## STEP 2 — DESIGN THE LEARNING JOURNEY BACKWARD

Now work BACKWARD from the North Star:
- **Last chapter(s)**: Integrate all components into the final project — CREATE/EVALUATE level
- **Middle chapters**: Build the core components and skills needed for the project — APPLY/ANALYZE level
- **First chapter(s)**: Establish the foundations and mental models — REMEMBER/UNDERSTAND level

For each chapter, tell me what the deeper insight or thesis is. Create section titles and 3-5 key topics per section.

CRITICAL ALIGNMENT RULES:
- Every chapter title, section title, and key topic MUST be directly relevant to "${ctx.courseTitle}" — do NOT generate topics that belong to a different course
- Cover the most important and essential topics for this specific course at the ${ctx.difficulty} level — do NOT pad with filler or tangential content
- The blueprint should read as a coherent learning journey that a student would expect from a course titled "${ctx.courseTitle}"
- If a topic would surprise a student who enrolled based on the title and description, do NOT include it

BLOOM'S LEVEL FOR EACH CHAPTER (use exactly these):
${bloomsAssignmentBlock}
${bloomsGuidanceBlock ? `\n${bloomsGuidanceBlock}` : ''}${sectionGuidanceBlock ? `\n${sectionGuidanceBlock}` : ''}

QUALITY EXPECTATIONS:
- Chapter titles should list the 2-3 core technical keywords covered
- Section titles should name the exact concept with parenthetical context where helpful
- Key topics should be expert-level — things a domain expert would put on a university syllabus
- Include teaching depth notes in key topics like "(why it exists)", "(intuition first)"
- Include math notation in key topics where relevant
- Ensure prerequisites are taught BEFORE they are needed in later chapters

## STEP 3 — ANALYZE CONTEXT AND ENSURE COVERAGE

Before finalizing, verify:
1. **Objective Mapping**: Each learning objective listed above must be addressed by at least one chapter.
2. **Prerequisite Validation**: No chapter references concepts that haven&apos;t been introduced in prior chapters.
3. **Scope Check**: Every chapter and section directly serves the course title "${ctx.courseTitle}".

Return the result as this JSON structure:
{
  "northStarProject": "A 1-2 sentence description of the ONE realistic product/project the entire course builds toward",
  "chapters": [
    {
      "position": 1,
      "title": "Chapter title with core keywords",
      "goal": "The deeper insight or thesis this chapter reveals",
      "bloomsLevel": "UNDERSTAND",
      "deliverable": "What tangible artifact the student produces by the end of this chapter",
      "sections": [
        {"position": 1, "title": "Exact concept name with context", "keyTopics": ["Topic 1 (teaching note)", "Topic 2", "Topic 3"]},
        {"position": 2, "title": "Next concept", "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]}
      ]
    }
  ],
  "confidence": 85,
  "riskAreas": ["Areas where students typically struggle and why"]
}

Generate ALL ${ctx.totalChapters} chapters with ALL ${ctx.sectionsPerChapter} sections each. Every section must have 3-5 keyTopics.${criticFeedback ? `\n${criticFeedback}` : ''}`;

  // isReasoningModel is available for future prompt strategy differentiation
  void isReasoningModel;

  return { systemPrompt, userPrompt };
}
