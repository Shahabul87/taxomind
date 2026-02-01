/**
 * Dashboard-level feature flags for gradual rollout of new features.
 *
 * Each flag controls a discrete set of components. Disabled features
 * are never rendered and their bundles are not imported (code-split).
 *
 * Configuration sources (in order of priority):
 *  1. Environment variables (NEXT_PUBLIC_DASH_FF_*)
 *  2. Defaults defined below
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const DashboardFeatureFlagsSchema = z.object({
  CAREER_TAB_ENABLED: z.boolean().default(false),
  SOCIAL_TAB_ENABLED: z.boolean().default(false),
  INSIGHTS_TAB_ENABLED: z.boolean().default(false),
  COGNITIVE_ANALYSIS_HUB: z.boolean().default(false),
  METACOGNITION_PANEL: z.boolean().default(false),
  PRACTICE_JOURNEY_OVERVIEW: z.boolean().default(false),
  SPACED_REPETITION_CALENDAR: z.boolean().default(false),
  STUDENT_DASHBOARD: z.boolean().default(false),
  PERSONALIZATION_PANEL: z.boolean().default(false),
  COURSE_MARKETPLACE: z.boolean().default(false),
});

export type DashboardFeatureFlags = z.infer<typeof DashboardFeatureFlagsSchema>;
export type DashboardFeatureFlag = keyof DashboardFeatureFlags;

// ---------------------------------------------------------------------------
// Env → boolean helper
// ---------------------------------------------------------------------------

function envBool(key: string): boolean | undefined {
  const val = typeof window !== 'undefined'
    ? (process.env[key] as string | undefined)
    : process.env[key];

  if (val === undefined || val === '') return undefined;
  return val === 'true' || val === '1';
}

// ---------------------------------------------------------------------------
// Resolved flags singleton
// ---------------------------------------------------------------------------

let resolvedFlags: DashboardFeatureFlags | null = null;

/**
 * Return the resolved set of dashboard feature flags.
 *
 * Safe to call on both server and client (reads `NEXT_PUBLIC_*` env vars).
 */
export function getDashboardFeatureFlags(): DashboardFeatureFlags {
  if (resolvedFlags) return resolvedFlags;

  const raw: Partial<DashboardFeatureFlags> = {};

  const envMap: Record<DashboardFeatureFlag, string> = {
    CAREER_TAB_ENABLED: 'NEXT_PUBLIC_DASH_FF_CAREER_TAB',
    SOCIAL_TAB_ENABLED: 'NEXT_PUBLIC_DASH_FF_SOCIAL_TAB',
    INSIGHTS_TAB_ENABLED: 'NEXT_PUBLIC_DASH_FF_INSIGHTS_TAB',
    COGNITIVE_ANALYSIS_HUB: 'NEXT_PUBLIC_DASH_FF_COGNITIVE_ANALYSIS',
    METACOGNITION_PANEL: 'NEXT_PUBLIC_DASH_FF_METACOGNITION',
    PRACTICE_JOURNEY_OVERVIEW: 'NEXT_PUBLIC_DASH_FF_PRACTICE_JOURNEY',
    SPACED_REPETITION_CALENDAR: 'NEXT_PUBLIC_DASH_FF_SPACED_REP',
    STUDENT_DASHBOARD: 'NEXT_PUBLIC_DASH_FF_STUDENT_DASHBOARD',
    PERSONALIZATION_PANEL: 'NEXT_PUBLIC_DASH_FF_PERSONALIZATION',
    COURSE_MARKETPLACE: 'NEXT_PUBLIC_DASH_FF_COURSE_MARKETPLACE',
  };

  for (const [flag, envKey] of Object.entries(envMap)) {
    const val = envBool(envKey);
    if (val !== undefined) {
      raw[flag as DashboardFeatureFlag] = val;
    }
  }

  resolvedFlags = DashboardFeatureFlagsSchema.parse(raw);
  return resolvedFlags;
}

/**
 * Check whether a single dashboard feature flag is enabled.
 */
export function isDashboardFeatureEnabled(flag: DashboardFeatureFlag): boolean {
  return getDashboardFeatureFlags()[flag];
}
