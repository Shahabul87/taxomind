/**
 * Math Validator — Post-Processing LaTeX Validation and Fixup
 *
 * Validates and fixes mathematical notation in AI-generated HTML content.
 * Applied after parsing AI responses and before saving to DB.
 *
 * Checks and fixes:
 * 1. <code> tags containing math → Convert to $...$ delimiters
 * 2. Unmatched $ delimiters → Log warning, attempt to close
 * 3. Display equations not isolated → Ensure $$...$$ is on its own paragraph
 * 4. Common LaTeX errors → Fix \frac a b to \frac{a}{b}, etc.
 */

import { logger } from '@/lib/logger';

/** Patterns that indicate math content rather than programming code */
const MATH_INDICATORS = [
  /\\frac/,
  /\\sum/,
  /\\int/,
  /\\lim/,
  /\\sqrt/,
  /\\alpha|\\beta|\\gamma|\\theta|\\lambda|\\sigma|\\pi|\\omega|\\delta|\\epsilon|\\mu/,
  /\\to|\\infty|\\approx|\\neq|\\leq|\\geq|\\in|\\subset/,
  /\\times|\\cdot|\\div|\\pm/,
  /\\sin|\\cos|\\tan|\\log|\\ln|\\det/,
  /\\begin\{/,
  /\\left[([|]/,
  /\^{.*}/,
  /_{.*}/,
  // Standalone math expressions: x^2, e^x, n!, etc. (only if no typical code chars)
  /^[a-zA-Z0-9_\\{}^+\-=()[\]|,.\s]+$/,
];

/** Patterns that indicate programming code (NOT math) */
const CODE_INDICATORS = [
  /\bfunction\b/,
  /\bconst\b|\blet\b|\bvar\b/,
  /\breturn\b/,
  /\bimport\b|\bexport\b/,
  /\bclass\b/,
  /\bif\b.*\(|else\b/,
  /\bfor\b.*\(|\bwhile\b/,
  /=>|===|!==|\?\?/,
  /console\.|document\.|window\./,
  /\bdef\b|\bprint\b/,
  /SELECT\b|INSERT\b|UPDATE\b|DELETE\b/i,
  /\bpip\b|\bnpm\b/,
];

function looksLikeMath(content: string): boolean {
  // Check for code indicators first (higher priority)
  for (const pattern of CODE_INDICATORS) {
    if (pattern.test(content)) return false;
  }
  // Check for math indicators
  for (const pattern of MATH_INDICATORS) {
    if (pattern.test(content)) return true;
  }
  return false;
}

export interface MathValidationResult {
  html: string;
  fixesApplied: string[];
  hasUnresolvedIssues: boolean;
}

/**
 * Validate and fix mathematical notation in HTML content.
 * Returns the fixed HTML and a list of applied fixes.
 */
export function validateAndFixMath(html: string): MathValidationResult {
  const fixesApplied: string[] = [];
  let hasUnresolvedIssues = false;
  let result = html;

  // Fix 1: Convert <code> tags containing math to $...$ delimiters
  result = result.replace(/<code>(.*?)<\/code>/g, (_match, content: string) => {
    if (looksLikeMath(content)) {
      fixesApplied.push(`Converted <code>${content.slice(0, 40)}...</code> to inline math`);
      return `$${content}$`;
    }
    return _match;
  });

  // Fix 2: Common LaTeX structural errors
  // Fix \frac a b → \frac{a}{b}
  result = result.replace(
    /\\frac\s+([a-zA-Z0-9])\s+([a-zA-Z0-9])/g,
    (_match, num: string, den: string) => {
      fixesApplied.push(`Fixed \\frac spacing: \\frac{${num}}{${den}}`);
      return `\\frac{${num}}{${den}}`;
    }
  );

  // Fix \sqrt a → \sqrt{a} (single character without braces)
  result = result.replace(
    /\\sqrt\s+([a-zA-Z0-9])(?![{a-zA-Z0-9])/g,
    (_match, arg: string) => {
      fixesApplied.push(`Fixed \\sqrt spacing: \\sqrt{${arg}}`);
      return `\\sqrt{${arg}}`;
    }
  );

  // Fix 3: Display equations not properly isolated
  // Ensure $$...$$ blocks are on their own paragraph
  result = result.replace(
    /([^\n])\$\$([^$]+)\$\$([^\n])/g,
    (_match, before: string, equation: string, after: string) => {
      // Don't wrap if already inside a <p> tag
      if (before.includes('<p>') || after.includes('</p>')) {
        return _match;
      }
      fixesApplied.push('Isolated display equation into its own paragraph');
      return `${before}</p>\n<p>$$${equation}$$</p>\n<p>${after}`;
    }
  );

  // Fix 4: Unmatched $ delimiters
  // Count $ signs that are not part of $$
  const singleDollarCount = countSingleDollars(result);
  if (singleDollarCount % 2 !== 0) {
    hasUnresolvedIssues = true;
    fixesApplied.push('Warning: Unmatched $ delimiter detected');
    logger.warn('[MATH_VALIDATOR] Unmatched $ delimiter in content', {
      singleDollarCount,
      snippet: result.slice(0, 200),
    });
  }

  // Fix 5: Double-escaped backslashes in math contexts (\\\\frac → \\frac)
  result = result.replace(
    /\$([^$]+)\$/g,
    (_match, content: string) => {
      const fixed = content.replace(/\\\\(frac|sum|int|lim|sqrt|alpha|beta|gamma|theta|pi|sigma|lambda|omega|sin|cos|tan|log|ln|to|infty|approx|neq|leq|geq|times|cdot|div|pm|left|right|begin|end|text)/g, '\\$1');
      if (fixed !== content) {
        fixesApplied.push('Fixed double-escaped backslashes in math');
      }
      return `$${fixed}$`;
    }
  );

  if (fixesApplied.length > 0) {
    logger.info('[MATH_VALIDATOR] Applied fixes to math content', {
      fixCount: fixesApplied.length,
      fixes: fixesApplied,
      hasUnresolvedIssues,
    });
  }

  return { html: result, fixesApplied, hasUnresolvedIssues };
}

/**
 * Count single $ signs (not part of $$ display equations).
 */
function countSingleDollars(text: string): number {
  let count = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === '$') {
      if (i + 1 < text.length && text[i + 1] === '$') {
        // Skip $$ pair (display math opening or closing)
        i += 2;
        // Find the closing $$
        const closingIdx = text.indexOf('$$', i);
        if (closingIdx >= 0) {
          i = closingIdx + 2;
        }
        continue;
      }
      count++;
    }
    i++;
  }
  return count;
}
