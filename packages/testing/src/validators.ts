/**
 * @sam-ai/testing - Validation Rules
 * Built-in validators for golden tests
 */

import type { ValidationRule, ValidationResult } from './types';

// ============================================================================
// BUILT-IN VALIDATORS
// ============================================================================

/**
 * Deep equality check
 */
export const equalsValidator: ValidationRule = {
  name: 'equals',
  validate(actual: unknown, expected: unknown): ValidationResult {
    const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
    return {
      passed: isEqual,
      message: isEqual ? undefined : 'Output does not match expected',
    };
  },
};

/**
 * Check if actual contains expected keys
 */
export const containsKeysValidator: ValidationRule = {
  name: 'containsKeys',
  validate(actual: unknown, expected: unknown): ValidationResult {
    if (!actual || typeof actual !== 'object' || !expected || typeof expected !== 'object') {
      return { passed: false, message: 'Both actual and expected must be objects' };
    }

    const expectedKeys = Object.keys(expected as Record<string, unknown>);
    const actualKeys = Object.keys(actual as Record<string, unknown>);
    const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));

    return {
      passed: missingKeys.length === 0,
      message: missingKeys.length > 0 ? `Missing keys: ${missingKeys.join(', ')}` : undefined,
    };
  },
};

/**
 * Check if actual is not null/undefined
 */
export const notNullValidator: ValidationRule = {
  name: 'notNull',
  validate(actual: unknown): ValidationResult {
    return {
      passed: actual !== null && actual !== undefined,
      message: actual === null || actual === undefined ? 'Output is null or undefined' : undefined,
    };
  },
};

/**
 * Check if actual is an array with items
 */
export const nonEmptyArrayValidator: ValidationRule = {
  name: 'nonEmptyArray',
  validate(actual: unknown): ValidationResult {
    const isArray = Array.isArray(actual);
    const hasItems = isArray && actual.length > 0;

    return {
      passed: hasItems,
      message: !isArray ? 'Output is not an array' : !hasItems ? 'Array is empty' : undefined,
    };
  },
};

/**
 * Check if string matches a pattern
 */
export const matchesPatternValidator: ValidationRule = {
  name: 'matchesPattern',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    if (typeof actual !== 'string') {
      return { passed: false, message: 'Actual is not a string' };
    }

    const pattern = context?.pattern as string | undefined;
    if (!pattern) {
      return { passed: false, message: 'No pattern provided in context' };
    }

    const regex = new RegExp(pattern);
    return {
      passed: regex.test(actual),
      message: !regex.test(actual) ? `String does not match pattern: ${pattern}` : undefined,
    };
  },
};

/**
 * Check if number is within range
 */
export const inRangeValidator: ValidationRule = {
  name: 'inRange',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    if (typeof actual !== 'number') {
      return { passed: false, message: 'Actual is not a number' };
    }

    const min = context?.min as number | undefined;
    const max = context?.max as number | undefined;

    if (min !== undefined && actual < min) {
      return { passed: false, message: `Value ${actual} is less than minimum ${min}` };
    }
    if (max !== undefined && actual > max) {
      return { passed: false, message: `Value ${actual} is greater than maximum ${max}` };
    }

    return { passed: true };
  },
};

/**
 * Check if array length is within range
 */
export const arrayLengthValidator: ValidationRule = {
  name: 'arrayLength',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    if (!Array.isArray(actual)) {
      return { passed: false, message: 'Actual is not an array' };
    }

    const min = context?.min as number | undefined;
    const max = context?.max as number | undefined;
    const exact = context?.exact as number | undefined;

    if (exact !== undefined && actual.length !== exact) {
      return { passed: false, message: `Array length ${actual.length} does not equal ${exact}` };
    }
    if (min !== undefined && actual.length < min) {
      return { passed: false, message: `Array length ${actual.length} is less than minimum ${min}` };
    }
    if (max !== undefined && actual.length > max) {
      return { passed: false, message: `Array length ${actual.length} is greater than maximum ${max}` };
    }

    return { passed: true };
  },
};

/**
 * Check if string length is within range
 */
export const stringLengthValidator: ValidationRule = {
  name: 'stringLength',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    if (typeof actual !== 'string') {
      return { passed: false, message: 'Actual is not a string' };
    }

    const min = context?.min as number | undefined;
    const max = context?.max as number | undefined;

    if (min !== undefined && actual.length < min) {
      return { passed: false, message: `String length ${actual.length} is less than minimum ${min}` };
    }
    if (max !== undefined && actual.length > max) {
      return { passed: false, message: `String length ${actual.length} is greater than maximum ${max}` };
    }

    return { passed: true };
  },
};

/**
 * Check if object has required type
 */
export const typeOfValidator: ValidationRule = {
  name: 'typeOf',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    const expectedType = context?.type as string | undefined;
    if (!expectedType) {
      return { passed: false, message: 'No type provided in context' };
    }

    const actualType = typeof actual;
    return {
      passed: actualType === expectedType,
      message: actualType !== expectedType ? `Expected type ${expectedType}, got ${actualType}` : undefined,
    };
  },
};

/**
 * Check if confidence score is above threshold
 */
export const confidenceValidator: ValidationRule = {
  name: 'confidence',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    const confidence = (actual as Record<string, unknown>)?.confidence as number | undefined;
    if (typeof confidence !== 'number') {
      return { passed: false, message: 'No confidence score found in output' };
    }

    const threshold = (context?.threshold as number) ?? 0.7;
    return {
      passed: confidence >= threshold,
      message: confidence < threshold
        ? `Confidence ${confidence} is below threshold ${threshold}`
        : undefined,
    };
  },
};

/**
 * Check if output passes quality gates
 */
export const qualityGateValidator: ValidationRule = {
  name: 'qualityGate',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    const output = actual as Record<string, unknown>;
    const requiredGates = (context?.gates as string[]) ?? ['completeness', 'accuracy', 'relevance'];
    const threshold = (context?.threshold as number) ?? 0.8;

    const failures: string[] = [];

    for (const gate of requiredGates) {
      const score = output?.[gate] as number | undefined;
      if (typeof score !== 'number') {
        failures.push(`Missing score for gate: ${gate}`);
      } else if (score < threshold) {
        failures.push(`${gate}: ${score} < ${threshold}`);
      }
    }

    return {
      passed: failures.length === 0,
      message: failures.length > 0 ? `Quality gate failures: ${failures.join(', ')}` : undefined,
    };
  },
};

/**
 * Check if response time is acceptable
 */
export const responseTimeValidator: ValidationRule = {
  name: 'responseTime',
  validate(actual: unknown, _expected: unknown, context?: Record<string, unknown>): ValidationResult {
    const duration = (actual as Record<string, unknown>)?.duration as number | undefined;
    if (typeof duration !== 'number') {
      return { passed: true }; // Skip if no duration available
    }

    const maxMs = (context?.maxMs as number) ?? 5000;
    return {
      passed: duration <= maxMs,
      message: duration > maxMs
        ? `Response time ${duration}ms exceeds maximum ${maxMs}ms`
        : undefined,
    };
  },
};

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create all built-in validators
 */
export function createBuiltInValidators(): ValidationRule[] {
  return [
    equalsValidator,
    containsKeysValidator,
    notNullValidator,
    nonEmptyArrayValidator,
    matchesPatternValidator,
    inRangeValidator,
    arrayLengthValidator,
    stringLengthValidator,
    typeOfValidator,
    confidenceValidator,
    qualityGateValidator,
    responseTimeValidator,
  ];
}

/**
 * Create a custom validator
 */
export function createValidator(
  name: string,
  validate: (
    actual: unknown,
    expected: unknown,
    context?: Record<string, unknown>
  ) => ValidationResult
): ValidationRule {
  return { name, validate };
}
