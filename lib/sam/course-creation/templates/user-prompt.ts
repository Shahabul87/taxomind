/**
 * Course Blueprint User Prompt Builder
 *
 * Builds a minimal, structured user prompt containing only the course
 * specifics the AI needs to generate a blueprint. All pedagogical
 * intelligence lives in the system prompt (template).
 */

import type { BlueprintRequestData } from '../blueprint/types';

/**
 * Build the user prompt for blueprint generation.
 * Contains: course details, objectives, structure requirements, and JSON schema.
 */
export function buildCourseUserPrompt(data: BlueprintRequestData): string {
  const objectives = data.courseGoals
    .map((goal, i) => `${i + 1}. ${goal}`)
    .join('\n');

  return `Generate a course blueprint for the following course:

## Course Details
- **Title:** ${data.courseTitle}
- **Description:** ${data.courseShortOverview}
- **Category:** ${data.category}${data.subcategory ? ` > ${data.subcategory}` : ''}
- **Target Audience:** ${data.targetAudience}
- **Difficulty:** ${data.difficulty}
- **Duration:** ${data.duration ?? 'Standard'}

## Learning Objectives
${objectives}

## Structure Requirements
- **Chapters:** ${data.chapterCount}
- **Sections per chapter:** ${data.sectionsPerChapter}
- Each section must have 3-5 specific key topics
- Each chapter must have a clear goal and a tangible deliverable

## Required JSON Output Schema

Return a JSON object matching this exact schema:

{
  "chapters": [
    {
      "position": 1,
      "title": "Chapter title (specific, not generic)",
      "goal": "What the learner achieves (aligned with Bloom's level)",
      "bloomsLevel": "ASSIGNED_LEVEL",
      "deliverable": "Tangible artifact the learner produces",
      "sections": [
        {
          "position": 1,
          "title": "Section title (specific)",
          "keyTopics": ["Topic 1", "Topic 2", "Topic 3"]
        }
      ]
    }
  ],
  "northStarProject": "A capstone project that integrates all chapters",
  "confidence": 85,
  "riskAreas": ["Any areas that may need teacher review"]
}

IMPORTANT:
- Chapter titles must be specific to the course topic, never generic ("Introduction", "Basics")
- Section keyTopics must contain 3-5 concrete, specific items
- The northStarProject must be a single capstone that ties all chapters together
- Every chapter's goal verb must match its assigned Bloom's level`;
}
