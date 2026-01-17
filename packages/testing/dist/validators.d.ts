/**
 * @sam-ai/testing - Validation Rules
 * Built-in validators for golden tests
 */
import type { ValidationRule, ValidationResult } from './types';
/**
 * Deep equality check
 */
export declare const equalsValidator: ValidationRule;
/**
 * Check if actual contains expected keys
 */
export declare const containsKeysValidator: ValidationRule;
/**
 * Check if actual is not null/undefined
 */
export declare const notNullValidator: ValidationRule;
/**
 * Check if actual is an array with items
 */
export declare const nonEmptyArrayValidator: ValidationRule;
/**
 * Check if string matches a pattern
 */
export declare const matchesPatternValidator: ValidationRule;
/**
 * Check if number is within range
 */
export declare const inRangeValidator: ValidationRule;
/**
 * Check if array length is within range
 */
export declare const arrayLengthValidator: ValidationRule;
/**
 * Check if string length is within range
 */
export declare const stringLengthValidator: ValidationRule;
/**
 * Check if object has required type
 */
export declare const typeOfValidator: ValidationRule;
/**
 * Check if confidence score is above threshold
 */
export declare const confidenceValidator: ValidationRule;
/**
 * Check if output passes quality gates
 */
export declare const qualityGateValidator: ValidationRule;
/**
 * Check if response time is acceptable
 */
export declare const responseTimeValidator: ValidationRule;
/**
 * Create all built-in validators
 */
export declare function createBuiltInValidators(): ValidationRule[];
/**
 * Create a custom validator
 */
export declare function createValidator(name: string, validate: (actual: unknown, expected: unknown, context?: Record<string, unknown>) => ValidationResult): ValidationRule;
//# sourceMappingURL=validators.d.ts.map