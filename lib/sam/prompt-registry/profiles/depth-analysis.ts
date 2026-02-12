/**
 * Profile: Depth Analysis (Course Overview)
 *
 * Wrapper around existing depth-analysis-v2 prompt builders.
 * This profile covers the course-overview stage; other stages can be added later.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';
import {
  getCourseOverviewSystemPrompt,
  buildCourseOverviewPrompt,
  type CourseOverviewContext,
} from '@/lib/sam/depth-analysis-v2/prompts';

// ============================================================================
// Output schema
// ============================================================================

const DepthAnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  depthScore: z.number().min(0).max(100),
  flowScore: z.number().min(0).max(100),
  consistencyScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  issues: z.array(
    z.object({
      type: z.string(),
      severity: z.string(),
      location: z.string(),
      description: z.string(),
      impact: z.string(),
      fix: z.string(),
    }),
  ),
  bloomsDistribution: z.record(z.string(), z.number()).optional(),
  recommendations: z.array(z.string()).optional(),
});

export type DepthAnalysisOutput = z.infer<typeof DepthAnalysisOutputSchema>;

// ============================================================================
// Profile definition
// ============================================================================

const depthAnalysisProfile: PromptProfile<CourseOverviewContext, DepthAnalysisOutput> = {
  taskType: 'depth-analysis',
  description: 'AI-powered course depth analysis using expert reviewer framework',

  aiParameters: {
    capability: 'analysis',
    maxTokens: 6000,
    temperature: 0.3,
  },

  systemPrompt: getCourseOverviewSystemPrompt(),

  knowledgeModules: [],

  buildUserPrompt: (input: CourseOverviewContext): string => {
    return buildCourseOverviewPrompt(input);
  },

  outputSchema: DepthAnalysisOutputSchema,

  postValidate: (output) => {
    const issues: string[] = [];

    if (output.overallScore > 90 && output.issues.length > 5) {
      issues.push(
        'Score above 90 with more than 5 issues seems inconsistent',
      );
    }

    const criticalCount = output.issues.filter(
      (i) => i.severity === 'CRITICAL',
    ).length;
    if (criticalCount > 0 && output.overallScore > 70) {
      issues.push(
        `${criticalCount} CRITICAL issues but score is ${output.overallScore} (expected < 70)`,
      );
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(depthAnalysisProfile);

export { depthAnalysisProfile };
