/**
 * Bloom's Taxonomy Enum Normalizer
 *
 * Handles conversion between frontend lowercase format ('remember', 'understand', etc.)
 * and Prisma/backend uppercase format ('REMEMBER', 'UNDERSTAND', etc.).
 *
 * This ensures consistent Bloom's level handling across the application:
 * - Frontend components use lowercase for display and user interaction
 * - Backend/Prisma uses uppercase as defined in the schema enum
 */

import { BloomsLevel as PrismaBloomsLevel } from '@prisma/client';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Prisma/Backend uppercase Bloom's level format
 */
export type BloomsLevelUppercase = PrismaBloomsLevel;

/**
 * Frontend lowercase Bloom's level format
 */
export type BloomsLevelLowercase =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

/**
 * Union type accepting both formats
 */
export type BloomsLevelAny = BloomsLevelUppercase | BloomsLevelLowercase;

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid Bloom's levels in uppercase (Prisma format)
 */
export const BLOOMS_LEVELS_UPPERCASE = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
] as const;

/**
 * Valid Bloom's levels in lowercase (frontend format)
 */
export const BLOOMS_LEVELS_LOWERCASE = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;

/**
 * Bloom's Taxonomy hierarchy (lower order to higher order)
 */
export const BLOOMS_HIERARCHY: BloomsLevelUppercase[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

/**
 * Lower-order thinking skills (LOT)
 */
export const LOWER_ORDER_LEVELS: BloomsLevelUppercase[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
];

/**
 * Higher-order thinking skills (HOT)
 */
export const HIGHER_ORDER_LEVELS: BloomsLevelUppercase[] = [
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a string is a valid Bloom's level (case-insensitive)
 */
export function isValidBloomsLevel(level: string): boolean {
  return BLOOMS_LEVELS_UPPERCASE.includes(
    level.toUpperCase() as BloomsLevelUppercase
  );
}

/**
 * Check if a level is a lower-order thinking skill
 */
export function isLowerOrderLevel(level: BloomsLevelAny): boolean {
  const normalized = normalizeToUppercase(level);
  return LOWER_ORDER_LEVELS.includes(normalized);
}

/**
 * Check if a level is a higher-order thinking skill
 */
export function isHigherOrderLevel(level: BloomsLevelAny): boolean {
  const normalized = normalizeToUppercase(level);
  return HIGHER_ORDER_LEVELS.includes(normalized);
}

// ============================================================================
// Normalization Functions
// ============================================================================

/**
 * Normalize a Bloom's level to uppercase (Prisma format)
 *
 * @param level - The level to normalize (any case)
 * @returns Uppercase Bloom's level
 * @throws Error if level is invalid
 *
 * @example
 * normalizeToUppercase('remember') // Returns 'REMEMBER'
 * normalizeToUppercase('ANALYZE')  // Returns 'ANALYZE'
 */
export function normalizeToUppercase(level: string): BloomsLevelUppercase {
  const normalized = level.toUpperCase() as BloomsLevelUppercase;

  if (!BLOOMS_LEVELS_UPPERCASE.includes(normalized)) {
    throw new Error(
      `Invalid Bloom's level: "${level}". Valid levels are: ${BLOOMS_LEVELS_UPPERCASE.join(', ')}`
    );
  }

  return normalized;
}

/**
 * Normalize a Bloom's level to lowercase (frontend format)
 *
 * @param level - The level to normalize (any case)
 * @returns Lowercase Bloom's level
 * @throws Error if level is invalid
 *
 * @example
 * normalizeToLowercase('REMEMBER') // Returns 'remember'
 * normalizeToLowercase('analyze')  // Returns 'analyze'
 */
export function normalizeToLowercase(level: string): BloomsLevelLowercase {
  const normalized = level.toLowerCase() as BloomsLevelLowercase;

  if (!BLOOMS_LEVELS_LOWERCASE.includes(normalized)) {
    throw new Error(
      `Invalid Bloom's level: "${level}". Valid levels are: ${BLOOMS_LEVELS_LOWERCASE.join(', ')}`
    );
  }

  return normalized;
}

/**
 * Safely normalize to uppercase with a fallback value
 *
 * @param level - The level to normalize
 * @param fallback - Fallback value if normalization fails (default: 'UNDERSTAND')
 * @returns Normalized uppercase level or fallback
 *
 * @example
 * normalizeToUppercaseSafe('remember')     // Returns 'REMEMBER'
 * normalizeToUppercaseSafe('invalid')      // Returns 'UNDERSTAND'
 * normalizeToUppercaseSafe('invalid', 'APPLY') // Returns 'APPLY'
 */
export function normalizeToUppercaseSafe(
  level: string | null | undefined,
  fallback: BloomsLevelUppercase = 'UNDERSTAND'
): BloomsLevelUppercase {
  if (!level) {
    return fallback;
  }

  try {
    return normalizeToUppercase(level);
  } catch {
    return fallback;
  }
}

/**
 * Safely normalize to lowercase with a fallback value
 *
 * @param level - The level to normalize
 * @param fallback - Fallback value if normalization fails (default: 'understand')
 * @returns Normalized lowercase level or fallback
 *
 * @example
 * normalizeToLowercaseSafe('REMEMBER')     // Returns 'remember'
 * normalizeToLowercaseSafe('invalid')      // Returns 'understand'
 */
export function normalizeToLowercaseSafe(
  level: string | null | undefined,
  fallback: BloomsLevelLowercase = 'understand'
): BloomsLevelLowercase {
  if (!level) {
    return fallback;
  }

  try {
    return normalizeToLowercase(level);
  } catch {
    return fallback;
  }
}

// ============================================================================
// Batch Normalization Functions
// ============================================================================

/**
 * Normalize an array of Bloom's levels to uppercase
 *
 * @param levels - Array of levels to normalize
 * @param skipInvalid - If true, skip invalid levels instead of throwing
 * @returns Array of normalized uppercase levels
 *
 * @example
 * normalizeArrayToUppercase(['remember', 'APPLY']) // Returns ['REMEMBER', 'APPLY']
 */
export function normalizeArrayToUppercase(
  levels: string[],
  skipInvalid = false
): BloomsLevelUppercase[] {
  if (skipInvalid) {
    return levels
      .filter(isValidBloomsLevel)
      .map((level) => level.toUpperCase() as BloomsLevelUppercase);
  }

  return levels.map(normalizeToUppercase);
}

/**
 * Normalize a Record of Bloom's levels (e.g., from frontend selector)
 *
 * @param levels - Record with lowercase keys and boolean values
 * @returns Record with uppercase keys and same boolean values
 *
 * @example
 * normalizeRecordToUppercase({ remember: true, understand: false })
 * // Returns { REMEMBER: true, UNDERSTAND: false }
 */
export function normalizeRecordToUppercase(
  levels: Record<BloomsLevelLowercase, boolean>
): Record<BloomsLevelUppercase, boolean> {
  const result: Record<BloomsLevelUppercase, boolean> = {
    REMEMBER: false,
    UNDERSTAND: false,
    APPLY: false,
    ANALYZE: false,
    EVALUATE: false,
    CREATE: false,
  };

  for (const [key, value] of Object.entries(levels)) {
    try {
      const normalized = normalizeToUppercase(key);
      result[normalized] = value;
    } catch {
      // Skip invalid keys
    }
  }

  return result;
}

/**
 * Normalize a Record of Bloom's levels to lowercase (for frontend)
 *
 * @param levels - Record with uppercase keys and boolean values
 * @returns Record with lowercase keys and same boolean values
 */
export function normalizeRecordToLowercase(
  levels: Record<BloomsLevelUppercase, boolean>
): Record<BloomsLevelLowercase, boolean> {
  const result: Record<BloomsLevelLowercase, boolean> = {
    remember: false,
    understand: false,
    apply: false,
    analyze: false,
    evaluate: false,
    create: false,
  };

  for (const [key, value] of Object.entries(levels)) {
    try {
      const normalized = normalizeToLowercase(key);
      result[normalized] = value;
    } catch {
      // Skip invalid keys
    }
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the hierarchy index of a Bloom's level (0-5)
 * Lower values = lower-order thinking, higher values = higher-order thinking
 *
 * @param level - The Bloom's level (any case)
 * @returns Index in the hierarchy (0-5)
 *
 * @example
 * getBloomsHierarchyIndex('REMEMBER') // Returns 0
 * getBloomsHierarchyIndex('create')   // Returns 5
 */
export function getBloomsHierarchyIndex(level: BloomsLevelAny): number {
  const normalized = normalizeToUppercase(level);
  return BLOOMS_HIERARCHY.indexOf(normalized);
}

/**
 * Compare two Bloom's levels
 *
 * @param a - First level
 * @param b - Second level
 * @returns Negative if a < b, positive if a > b, 0 if equal
 *
 * @example
 * compareBloomsLevels('REMEMBER', 'CREATE') // Returns negative number
 * compareBloomsLevels('CREATE', 'REMEMBER') // Returns positive number
 */
export function compareBloomsLevels(
  a: BloomsLevelAny,
  b: BloomsLevelAny
): number {
  return getBloomsHierarchyIndex(a) - getBloomsHierarchyIndex(b);
}

/**
 * Sort an array of Bloom's levels by hierarchy (ascending)
 *
 * @param levels - Array of levels to sort
 * @returns Sorted array from lower to higher order
 */
export function sortBloomsLevels<T extends BloomsLevelAny>(levels: T[]): T[] {
  return [...levels].sort((a, b) => compareBloomsLevels(a, b));
}

/**
 * Get the display name for a Bloom's level
 *
 * @param level - The Bloom's level (any case)
 * @returns Capitalized display name
 *
 * @example
 * getBloomsDisplayName('REMEMBER') // Returns 'Remember'
 * getBloomsDisplayName('analyze')  // Returns 'Analyze'
 */
export function getBloomsDisplayName(level: BloomsLevelAny): string {
  const normalized = normalizeToLowercase(level);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Get selected levels from a boolean record
 *
 * @param levels - Record of levels with boolean values
 * @returns Array of selected (true) levels in uppercase
 */
export function getSelectedLevels(
  levels: Record<BloomsLevelLowercase | BloomsLevelUppercase, boolean>
): BloomsLevelUppercase[] {
  return Object.entries(levels)
    .filter(([, selected]) => selected)
    .map(([level]) => normalizeToUppercaseSafe(level))
    .filter((level): level is BloomsLevelUppercase => level !== null);
}

// ============================================================================
// Default Export
// ============================================================================

export const bloomsNormalizer = {
  // Validation
  isValid: isValidBloomsLevel,
  isLowerOrder: isLowerOrderLevel,
  isHigherOrder: isHigherOrderLevel,

  // Single normalization
  toUppercase: normalizeToUppercase,
  toLowercase: normalizeToLowercase,
  toUppercaseSafe: normalizeToUppercaseSafe,
  toLowercaseSafe: normalizeToLowercaseSafe,

  // Batch normalization
  arrayToUppercase: normalizeArrayToUppercase,
  recordToUppercase: normalizeRecordToUppercase,
  recordToLowercase: normalizeRecordToLowercase,

  // Utilities
  getHierarchyIndex: getBloomsHierarchyIndex,
  compare: compareBloomsLevels,
  sort: sortBloomsLevels,
  getDisplayName: getBloomsDisplayName,
  getSelected: getSelectedLevels,

  // Constants
  UPPERCASE: BLOOMS_LEVELS_UPPERCASE,
  LOWERCASE: BLOOMS_LEVELS_LOWERCASE,
  HIERARCHY: BLOOMS_HIERARCHY,
  LOWER_ORDER: LOWER_ORDER_LEVELS,
  HIGHER_ORDER: HIGHER_ORDER_LEVELS,
};
