/**
 * Taxomind Accessibility Module
 *
 * Comprehensive WCAG 2.1 Level AA compliance utilities for educational content.
 *
 * Standards:
 * - WCAG 2.1 Level AA
 * - Section 508
 * - EN 301 549
 */

export {
  WCAGColorContrast,
  ScreenReaderUtils,
  KeyboardNavigationUtils,
  ReadabilityAnalyzer,
  TimeAccommodationCalculator,
  AltTextGenerator,
  AccessibilityAuditor,
  wcagUtils,
  type ColorRGB,
  type ContrastResult,
  type AccessibilityAuditResult,
  type AccessibilityIssue,
  type ReadabilityResult,
  type TimeAccommodation,
} from './wcag-utils';
