/**
 * Profile: Skill Roadmap Generation
 *
 * Wrapper around existing buildComprehensiveRoadmapPrompt() from
 * lib/sam/roadmap-generation/prompt-templates.ts.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';
import {
  buildComprehensiveRoadmapPrompt,
  AIRoadmapResponseSchema,
  type RoadmapGenerationInput,
  type AIRoadmapResponse,
} from '@/lib/sam/roadmap-generation/prompt-templates';

// ============================================================================
// Profile definition
// ============================================================================

const skillRoadmapProfile: PromptProfile<RoadmapGenerationInput, AIRoadmapResponse> = {
  taskType: 'skill-roadmap-generation',
  description: 'Generates a comprehensive skill development roadmap with phases, courses, and projects',

  aiParameters: {
    capability: 'skill-roadmap',
    maxTokens: 8000,
    temperature: 0.7,
  },

  // The existing prompt builder produces a combined system+user prompt.
  // We use a minimal system prompt here; all content comes from buildUserPrompt.
  systemPrompt:
    'You are an expert instructional designer and learning architect. Return ONLY valid JSON, no markdown formatting.',

  knowledgeModules: [],

  buildUserPrompt: (input: RoadmapGenerationInput): string => {
    return buildComprehensiveRoadmapPrompt(input);
  },

  outputSchema: AIRoadmapResponseSchema as z.ZodType<AIRoadmapResponse>,

  postValidate: (output) => {
    const issues: string[] = [];

    // Check Bloom&apos;s progression
    const bloomsOrder: Record<string, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };

    for (let i = 1; i < output.phases.length; i++) {
      const prev = output.phases[i - 1].bloomsLevel;
      const curr = output.phases[i].bloomsLevel;
      const jump = (bloomsOrder[curr] ?? 0) - (bloomsOrder[prev] ?? 0);

      if (jump < 0) {
        issues.push(
          `Phase ${i + 1} regresses in Bloom&apos;s levels (${prev} -> ${curr})`,
        );
      }
    }

    // Check difficulty progression
    const diffOrder: Record<string, number> = {
      BEGINNER: 1,
      INTERMEDIATE: 2,
      ADVANCED: 3,
    };

    for (let i = 1; i < output.phases.length; i++) {
      const prev = output.phases[i - 1].difficulty;
      const curr = output.phases[i].difficulty;
      if ((diffOrder[curr] ?? 0) < (diffOrder[prev] ?? 0)) {
        issues.push(
          `Phase ${i + 1} decreases difficulty (${prev} -> ${curr})`,
        );
      }
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(skillRoadmapProfile);

export { skillRoadmapProfile };
