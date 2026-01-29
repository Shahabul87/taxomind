/**
 * SAM Enum Normalizer
 *
 * Handles the mismatch between frontend conventions (lowercase) and
 * Prisma/database conventions (UPPERCASE) for enum values.
 *
 * PROBLEM:
 * - Frontend/API uses: 'active', 'completed', 'medium'
 * - Prisma schema uses: 'ACTIVE', 'COMPLETED', 'MEDIUM'
 * - Every store must manually convert: input.status.toUpperCase()
 *
 * SOLUTION:
 * - Centralized normalization utilities
 * - Type-safe enum conversions
 * - Consistent handling across all stores
 */

// ============================================================================
// SAM ENUM DEFINITIONS
// ============================================================================

/**
 * SAM Goal Status enum values
 */
export const SAMGoalStatusValues = {
  frontend: ['draft', 'active', 'paused', 'completed', 'abandoned'] as const,
  prisma: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED'] as const,
};

export type SAMGoalStatusFrontend = (typeof SAMGoalStatusValues.frontend)[number];
export type SAMGoalStatusPrisma = (typeof SAMGoalStatusValues.prisma)[number];

/**
 * SAM Goal Priority enum values
 */
export const SAMGoalPriorityValues = {
  frontend: ['low', 'medium', 'high', 'critical'] as const,
  prisma: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const,
};

export type SAMGoalPriorityFrontend = (typeof SAMGoalPriorityValues.frontend)[number];
export type SAMGoalPriorityPrisma = (typeof SAMGoalPriorityValues.prisma)[number];

/**
 * SAM Mastery Level enum values
 */
export const SAMMasteryLevelValues = {
  frontend: ['novice', 'beginner', 'intermediate', 'advanced', 'expert'] as const,
  prisma: ['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const,
};

export type SAMMasteryLevelFrontend = (typeof SAMMasteryLevelValues.frontend)[number];
export type SAMMasteryLevelPrisma = (typeof SAMMasteryLevelValues.prisma)[number];

/**
 * SAM Step Status enum values
 */
export const SAMStepStatusValues = {
  frontend: ['pending', 'in_progress', 'completed', 'failed', 'skipped'] as const,
  prisma: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED'] as const,
};

export type SAMStepStatusFrontend = (typeof SAMStepStatusValues.frontend)[number];
export type SAMStepStatusPrisma = (typeof SAMStepStatusValues.prisma)[number];

/**
 * SAM Plan Status enum values
 */
export const SAMPlanStatusValues = {
  frontend: ['draft', 'active', 'paused', 'completed', 'failed', 'cancelled'] as const,
  prisma: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'] as const,
};

export type SAMPlanStatusFrontend = (typeof SAMPlanStatusValues.frontend)[number];
export type SAMPlanStatusPrisma = (typeof SAMPlanStatusValues.prisma)[number];

/**
 * SAM Difficulty enum values
 */
export const SAMDifficultyValues = {
  frontend: ['easy', 'medium', 'hard', 'expert'] as const,
  prisma: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const,
};

export type SAMDifficultyFrontend = (typeof SAMDifficultyValues.frontend)[number];
export type SAMDifficultyPrisma = (typeof SAMDifficultyValues.prisma)[number];

/**
 * SAM SubGoal Type enum values
 */
export const SAMSubGoalTypeValues = {
  frontend: ['learn', 'practice', 'assess', 'review', 'research', 'create'] as const,
  prisma: ['LEARN', 'PRACTICE', 'ASSESS', 'REVIEW', 'RESEARCH', 'CREATE'] as const,
};

export type SAMSubGoalTypeFrontend = (typeof SAMSubGoalTypeValues.frontend)[number];
export type SAMSubGoalTypePrisma = (typeof SAMSubGoalTypeValues.prisma)[number];

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Convert a frontend enum value to Prisma format (uppercase)
 *
 * @example
 * toPrismaEnum('active') // => 'ACTIVE'
 * toPrismaEnum('medium') // => 'MEDIUM'
 * toPrismaEnum(null)     // => null
 */
export function toPrismaEnum<T extends string>(
  value: T | null | undefined
): Uppercase<T> | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toUpperCase() as Uppercase<T>;
}

/**
 * Convert a Prisma enum value to frontend format (lowercase)
 *
 * @example
 * toFrontendEnum('ACTIVE') // => 'active'
 * toFrontendEnum('MEDIUM') // => 'medium'
 * toFrontendEnum(null)     // => null
 */
export function toFrontendEnum<T extends string>(
  value: T | null | undefined
): Lowercase<T> | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toLowerCase() as Lowercase<T>;
}

/**
 * Convert a frontend enum value to Prisma format with a default fallback
 *
 * @example
 * toPrismaEnumWithDefault('active', 'DRAFT') // => 'ACTIVE'
 * toPrismaEnumWithDefault(null, 'DRAFT')     // => 'DRAFT'
 */
export function toPrismaEnumWithDefault<T extends string, D extends string>(
  value: T | null | undefined,
  defaultValue: D
): Uppercase<T> | D {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value.toUpperCase() as Uppercase<T>;
}

/**
 * Convert a Prisma enum value to frontend format with a default fallback
 *
 * @example
 * toFrontendEnumWithDefault('ACTIVE', 'draft') // => 'active'
 * toFrontendEnumWithDefault(null, 'draft')     // => 'draft'
 */
export function toFrontendEnumWithDefault<T extends string, D extends string>(
  value: T | null | undefined,
  defaultValue: D
): Lowercase<T> | D {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() as Lowercase<T>;
}

// ============================================================================
// TYPE-SAFE CONVERSIONS
// ============================================================================

/**
 * Type-safe conversion for SAM Goal Status
 */
export function toGoalStatusPrisma(
  value: SAMGoalStatusFrontend | null | undefined
): SAMGoalStatusPrisma | null {
  return toPrismaEnum(value) as SAMGoalStatusPrisma | null;
}

export function toGoalStatusFrontend(
  value: SAMGoalStatusPrisma | null | undefined
): SAMGoalStatusFrontend | null {
  return toFrontendEnum(value) as SAMGoalStatusFrontend | null;
}

/**
 * Type-safe conversion for SAM Goal Priority
 */
export function toGoalPriorityPrisma(
  value: SAMGoalPriorityFrontend | null | undefined
): SAMGoalPriorityPrisma | null {
  return toPrismaEnum(value) as SAMGoalPriorityPrisma | null;
}

export function toGoalPriorityFrontend(
  value: SAMGoalPriorityPrisma | null | undefined
): SAMGoalPriorityFrontend | null {
  return toFrontendEnum(value) as SAMGoalPriorityFrontend | null;
}

/**
 * Type-safe conversion for SAM Mastery Level
 */
export function toMasteryLevelPrisma(
  value: SAMMasteryLevelFrontend | null | undefined
): SAMMasteryLevelPrisma | null {
  return toPrismaEnum(value) as SAMMasteryLevelPrisma | null;
}

export function toMasteryLevelFrontend(
  value: SAMMasteryLevelPrisma | null | undefined
): SAMMasteryLevelFrontend | null {
  return toFrontendEnum(value) as SAMMasteryLevelFrontend | null;
}

/**
 * Type-safe conversion for SAM Step Status
 */
export function toStepStatusPrisma(
  value: SAMStepStatusFrontend | null | undefined
): SAMStepStatusPrisma | null {
  return toPrismaEnum(value) as SAMStepStatusPrisma | null;
}

export function toStepStatusFrontend(
  value: SAMStepStatusPrisma | null | undefined
): SAMStepStatusFrontend | null {
  return toFrontendEnum(value) as SAMStepStatusFrontend | null;
}

/**
 * Type-safe conversion for SAM Plan Status
 */
export function toPlanStatusPrisma(
  value: SAMPlanStatusFrontend | null | undefined
): SAMPlanStatusPrisma | null {
  return toPrismaEnum(value) as SAMPlanStatusPrisma | null;
}

export function toPlanStatusFrontend(
  value: SAMPlanStatusPrisma | null | undefined
): SAMPlanStatusFrontend | null {
  return toFrontendEnum(value) as SAMPlanStatusFrontend | null;
}

/**
 * Type-safe conversion for SAM Difficulty
 */
export function toDifficultyPrisma(
  value: SAMDifficultyFrontend | null | undefined
): SAMDifficultyPrisma | null {
  return toPrismaEnum(value) as SAMDifficultyPrisma | null;
}

export function toDifficultyFrontend(
  value: SAMDifficultyPrisma | null | undefined
): SAMDifficultyFrontend | null {
  return toFrontendEnum(value) as SAMDifficultyFrontend | null;
}

// ============================================================================
// OBJECT NORMALIZATION
// ============================================================================

/**
 * Normalize an object's enum fields from frontend to Prisma format
 *
 * @example
 * normalizeForPrisma({ status: 'active', priority: 'high' }, ['status', 'priority'])
 * // => { status: 'ACTIVE', priority: 'HIGH' }
 */
export function normalizeForPrisma<T extends Record<string, unknown>>(
  obj: T,
  enumFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of enumFields) {
    const value = result[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = value.toUpperCase();
    }
  }

  return result;
}

/**
 * Normalize an object's enum fields from Prisma to frontend format
 *
 * @example
 * normalizeForFrontend({ status: 'ACTIVE', priority: 'HIGH' }, ['status', 'priority'])
 * // => { status: 'active', priority: 'high' }
 */
export function normalizeForFrontend<T extends Record<string, unknown>>(
  obj: T,
  enumFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of enumFields) {
    const value = result[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = value.toLowerCase();
    }
  }

  return result;
}

/**
 * Normalize a goal object for frontend consumption
 */
export function normalizeGoalForFrontend<
  T extends {
    status?: string | null;
    priority?: string | null;
    currentMastery?: string | null;
    targetMastery?: string | null;
  }
>(goal: T): T {
  return normalizeForFrontend(goal, [
    'status',
    'priority',
    'currentMastery',
    'targetMastery',
  ]);
}

/**
 * Normalize a goal input for Prisma
 */
export function normalizeGoalForPrisma<
  T extends {
    status?: string | null;
    priority?: string | null;
    currentMastery?: string | null;
    targetMastery?: string | null;
  }
>(input: T): T {
  return normalizeForPrisma(input, [
    'status',
    'priority',
    'currentMastery',
    'targetMastery',
  ]);
}

/**
 * Normalize a subGoal object for frontend consumption
 */
export function normalizeSubGoalForFrontend<
  T extends {
    status?: string | null;
    type?: string | null;
    difficulty?: string | null;
  }
>(subGoal: T): T {
  return normalizeForFrontend(subGoal, ['status', 'type', 'difficulty']);
}

/**
 * Normalize a plan object for frontend consumption
 */
export function normalizePlanForFrontend<
  T extends {
    status?: string | null;
  }
>(plan: T): T {
  return normalizeForFrontend(plan, ['status']);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if a value is a valid SAM Goal Status (frontend format)
 */
export function isValidGoalStatus(
  value: unknown
): value is SAMGoalStatusFrontend {
  return (
    typeof value === 'string' &&
    SAMGoalStatusValues.frontend.includes(value as SAMGoalStatusFrontend)
  );
}

/**
 * Check if a value is a valid SAM Goal Priority (frontend format)
 */
export function isValidGoalPriority(
  value: unknown
): value is SAMGoalPriorityFrontend {
  return (
    typeof value === 'string' &&
    SAMGoalPriorityValues.frontend.includes(value as SAMGoalPriorityFrontend)
  );
}

/**
 * Check if a value is a valid SAM Mastery Level (frontend format)
 */
export function isValidMasteryLevel(
  value: unknown
): value is SAMMasteryLevelFrontend {
  return (
    typeof value === 'string' &&
    SAMMasteryLevelValues.frontend.includes(value as SAMMasteryLevelFrontend)
  );
}

/**
 * Check if a value is a valid SAM Step Status (frontend format)
 */
export function isValidStepStatus(
  value: unknown
): value is SAMStepStatusFrontend {
  return (
    typeof value === 'string' &&
    SAMStepStatusValues.frontend.includes(value as SAMStepStatusFrontend)
  );
}

/**
 * Check if a value is a valid SAM Plan Status (frontend format)
 */
export function isValidPlanStatus(
  value: unknown
): value is SAMPlanStatusFrontend {
  return (
    typeof value === 'string' &&
    SAMPlanStatusValues.frontend.includes(value as SAMPlanStatusFrontend)
  );
}

/**
 * Check if a value is a valid SAM Difficulty (frontend format)
 */
export function isValidDifficulty(
  value: unknown
): value is SAMDifficultyFrontend {
  return (
    typeof value === 'string' &&
    SAMDifficultyValues.frontend.includes(value as SAMDifficultyFrontend)
  );
}
