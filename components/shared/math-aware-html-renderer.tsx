"use client";

import { useMemo, useState, useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";

// Dynamically loaded katex module - cached at module level
let katexModule: typeof import('katex') | null = null;
let katexLoadPromise: Promise<typeof import('katex')> | null = null;

function loadKatex(): Promise<typeof import('katex')> {
  if (katexModule) return Promise.resolve(katexModule);
  if (!katexLoadPromise) {
    katexLoadPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => {
      katexModule = mod;
      return mod;
    });
  }
  return katexLoadPromise;
}

/** Returns the katex default export if loaded, or null */
function getKatex(): typeof import('katex')['default'] | null {
  return katexModule ? katexModule.default : null;
}

interface MathAwareHtmlRendererProps {
  html: string;
  className?: string;
  as?: "div" | "span";
}

/**
 * Convert readable math notation (Unicode symbols, function names) to LaTeX
 * so KaTeX can render it properly.
 */
function toLatex(text: string): string {
  let latex = text;

  // Unicode superscripts → LaTeX
  latex = latex.replace(/²/g, "^{2}");
  latex = latex.replace(/³/g, "^{3}");
  latex = latex.replace(/⁴/g, "^{4}");
  latex = latex.replace(/⁵/g, "^{5}");

  // Unicode symbols → LaTeX commands
  latex = latex.replace(/→/g, "\\to ");
  latex = latex.replace(/←/g, "\\leftarrow ");
  latex = latex.replace(/≠/g, "\\neq ");
  latex = latex.replace(/≤/g, "\\leq ");
  latex = latex.replace(/≥/g, "\\geq ");
  latex = latex.replace(/≈/g, "\\approx ");
  latex = latex.replace(/×/g, "\\times ");
  latex = latex.replace(/÷/g, "\\div ");
  latex = latex.replace(/±/g, "\\pm ");
  latex = latex.replace(/∞/g, "\\infty ");
  latex = latex.replace(/·/g, "\\cdot ");

  // Greek letters
  latex = latex.replace(/π/g, "\\pi ");
  latex = latex.replace(/θ/g, "\\theta ");
  latex = latex.replace(/α/g, "\\alpha ");
  latex = latex.replace(/β/g, "\\beta ");
  latex = latex.replace(/γ/g, "\\gamma ");
  latex = latex.replace(/δ/g, "\\delta ");
  latex = latex.replace(/Δ/g, "\\Delta ");
  latex = latex.replace(/ε/g, "\\varepsilon ");
  latex = latex.replace(/σ/g, "\\sigma ");
  latex = latex.replace(/μ/g, "\\mu ");
  latex = latex.replace(/λ/g, "\\lambda ");
  latex = latex.replace(/φ/g, "\\varphi ");

  // Math operators
  latex = latex.replace(/∑/g, "\\sum ");
  latex = latex.replace(/∫/g, "\\int ");
  latex = latex.replace(/∂/g, "\\partial ");
  latex = latex.replace(/√/g, "\\sqrt ");

  // Function names → upright LaTeX form
  // Use letter-only boundaries (not \b) because _ is a word char in regex
  // and lim_{h→0} would fail to match with \blim\b
  // lim with subscript: place subscript below using \limits
  latex = latex.replace(/(?<![a-zA-Z])lim_/g, "\\lim\\limits_");
  // lim without subscript
  latex = latex.replace(/(?<![a-zA-Z\\])lim(?![a-zA-Z_])/g, "\\lim");
  latex = latex.replace(/(?<![a-zA-Z])sin(?![a-zA-Z])/g, "\\sin");
  latex = latex.replace(/(?<![a-zA-Z])cos(?![a-zA-Z])/g, "\\cos");
  latex = latex.replace(/(?<![a-zA-Z])tan(?![a-zA-Z])/g, "\\tan");
  latex = latex.replace(/(?<![a-zA-Z])cot(?![a-zA-Z])/g, "\\cot");
  latex = latex.replace(/(?<![a-zA-Z])sec(?![a-zA-Z])/g, "\\sec");
  latex = latex.replace(/(?<![a-zA-Z])csc(?![a-zA-Z])/g, "\\csc");
  latex = latex.replace(/(?<![a-zA-Z])arcsin(?![a-zA-Z])/g, "\\arcsin");
  latex = latex.replace(/(?<![a-zA-Z])arccos(?![a-zA-Z])/g, "\\arccos");
  latex = latex.replace(/(?<![a-zA-Z])arctan(?![a-zA-Z])/g, "\\arctan");
  latex = latex.replace(/(?<![a-zA-Z])log(?![a-zA-Z])/g, "\\log");
  latex = latex.replace(/(?<![a-zA-Z])ln(?![a-zA-Z])/g, "\\ln");
  latex = latex.replace(/(?<![a-zA-Z])exp(?![a-zA-Z])/g, "\\exp");
  latex = latex.replace(/(?<![a-zA-Z])max(?![a-zA-Z])/g, "\\max");
  latex = latex.replace(/(?<![a-zA-Z])min(?![a-zA-Z])/g, "\\min");
  latex = latex.replace(/(?<![a-zA-Z])sup(?![a-zA-Z])/g, "\\sup");
  latex = latex.replace(/(?<![a-zA-Z])inf(?![a-zA-Z])/g, "\\inf");

  return latex;
}

/**
 * Check if content is programming code (not math).
 * Only triggers on definitive programming patterns to avoid false positives.
 */
function isProgrammingCode(content: string): boolean {
  return (
    // JavaScript/TypeScript keywords
    /\b(function|const|let|var|return|class|import|export|async|await|typeof|instanceof|switch|case|break|continue|throw|try|catch|finally|yield|void|delete|new)\b/.test(
      content
    ) ||
    // Arrow functions or strict equality
    /=>|===|!==/.test(content) ||
    // Semicolons at end
    /;\s*$/.test(content) ||
    // Common JS object access
    /\b(console|document|window|process|module|require)\b/.test(content) ||
    // Comments
    /\/\/|\/\*/.test(content) ||
    // HTML tags — require closing > to avoid false-positive on math inequalities like x<y
    /<\/?[a-z][a-z0-9]*\s*>/i.test(content)
  );
}

/**
 * Check if content contains LaTeX backslash commands — if so, it's definitely math.
 * Matches both single (\frac) and double-escaped (\\frac) backslashes,
 * since AI-generated content often stores LaTeX with escaped backslashes.
 */
function hasLatexCommands(content: string): boolean {
  return /\\{1,2}(?:frac|lim|limits|int|sum|prod|sqrt|to|infty|alpha|beta|gamma|delta|theta|pi|sigma|mu|lambda|phi|partial|nabla|cdot|times|div|pm|leq|geq|neq|approx|equiv|sin|cos|tan|log|ln|exp|max|min|left|right|text|mathrm|mathbf)\b/.test(
    content
  );
}

/**
 * Normalize double-escaped backslashes (\\command) to single (\command)
 * for known LaTeX commands. AI-generated content often stores \frac as \\frac.
 */
function normalizeLatexBackslashes(text: string): string {
  return text.replace(
    /\\\\(?=(?:frac|lim|limits|int|sum|prod|sqrt|to|infty|alpha|beta|gamma|delta|theta|pi|sigma|mu|lambda|phi|partial|nabla|cdot|times|div|pm|leq|geq|neq|approx|equiv|sin|cos|tan|log|ln|exp|max|min|left|right|text|mathrm|mathbf|mathit)\b)/g,
    "\\"
  );
}

/**
 * Normalize Unicode characters that break KaTeX parsing.
 */
function normalizeMathChars(text: string): string {
  return text
    .replace(/\u2013/g, "-") // en-dash → minus
    .replace(/\u2014/g, "--") // em-dash → double minus
    .replace(/\u2018/g, "'") // left single quote
    .replace(/\u2019/g, "'") // right single quote
    .replace(/\u201C/g, '"') // left double quote
    .replace(/\u201D/g, '"') // right double quote
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/\u2212/g, "-"); // minus sign (U+2212)
}

/**
 * Protect currency dollar signs from being interpreted as LaTeX math delimiters.
 *
 * Financial content uses $5, $100, $3.50, $1,000 as currency amounts.
 * Without protection, the $...$ inline math regex matches text between
 * consecutive dollar signs (e.g. "$8. Sam thought: Why $" becomes garbled
 * italic math with spaces stripped).
 *
 * Converts $N to &#36;N ONLY when followed by non-alphanumeric characters
 * (space, punctuation, HTML tags, etc.), preserving math expressions like
 * $5x$ or $5\frac{1}{2}$ where $ is followed by digit+letter/command.
 */
function protectCurrencyDollars(html: string): string {
  // Match $ followed by digits (with optional comma separators and decimal),
  // but ONLY when followed by non-alphanumeric (currency context).
  // Lookahead ensures $5x (math) is NOT matched, but $5, $5. $5<p> ARE matched.
  return html.replace(
    /\$(\d[\d,]*(?:\.\d{1,2})?)(?=[\s.,;:!?'")\]}>]|<|&[a-z#]|$)/g,
    '&#36;$1'
  );
}

/**
 * Check if content found between $...$ delimiters is likely mathematical
 * notation rather than natural language that happens to contain dollar signs.
 *
 * This prevents financial text like "8. Sam thought: Why " (matched between
 * two currency $) from being rendered as KaTeX math, which would strip all
 * spaces and italicize the text.
 */
function isLikelyInlineMath(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;

  // Contains LaTeX backslash commands → definitely math
  if (hasLatexCommands(trimmed)) return true;
  if (/\\[a-zA-Z]{2,}/.test(trimmed)) return true;

  // Contains braces, subscript, or superscript notation → likely math
  if (/[{}^_]/.test(trimmed)) return true;

  // Contains Unicode math symbols → likely math
  if (MATH_INDICATOR_RE.test(trimmed)) return true;

  // Too many words → natural language, not math
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;

  // Contains common English words → not math
  if (/\b(the|is|are|was|were|for|and|but|not|with|this|that|from|how|what|why|when|can|will|would|could|should|have|has|been|just|than|then|also|each|same|other|about|after|before|into|over|much|very|you|your|its|our|his|her|they|them|their|said|thought|asked|wanted|because)\b/i.test(trimmed)) {
    return false;
  }

  // Sentence-like structure (period/! followed by capital) → not math
  if (/[.!?]\s+[A-Z]/.test(trimmed)) return false;

  // Quoted text in multi-word content → not math
  if (/"[^"]*"/.test(trimmed) && words.length > 2) return false;

  // Bare numbers with a trailing operator (e.g. "180 -", "18.50 -") are NOT math —
  // they're fragments from currency amounts split by $...$ regex
  if (/^\d[\d.,]*\s*[+\-*/]?\s*$/.test(trimmed)) return false;

  // Contains math operators (=, +, -, etc.) in short expressions → math
  if (/[+\-*/=]/.test(trimmed) && words.length <= 3) return true;
  // Multiple math-like characters (parentheses, operators) in longer expressions
  const mathCharCount = (trimmed.match(/[+\-*/=()[\]]/g) || []).length;
  if (mathCharCount >= 2 && words.length <= 5) return true;

  // Short without spaces → might be a variable or expression
  if (trimmed.length <= 15 && !/\s/.test(trimmed)) return true;

  // Default: not math (safer to leave as-is than garble text)
  return false;
}

/**
 * Render math to HTML using KaTeX. Returns null on failure or if katex is not yet loaded.
 */
function renderMath(
  content: string,
  displayMode: boolean
): string | null {
  const k = getKatex();
  if (!k) return null;

  const decoded = decodeHtmlEntities(content.trim());
  const normalized = normalizeMathChars(decoded);
  const deduped = normalizeLatexBackslashes(normalized);
  const latex = toLatex(deduped);
  try {
    return k.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: "#cc0000",
      strict: false,
      trust: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

/** Unicode characters that indicate mathematical content */
const MATH_INDICATOR_RE =
  /[²³⁴⁵→←≠≤≥≈×÷±∞·πθαβγδΔεσμλφ∑∫∂√]/;

/** Matches a non-space run containing at least one Unicode math indicator */
const UNICODE_MATH_SEGMENT_RE =
  /\S*[²³⁴⁵→←≠≤≥≈×÷±∞·πθαβγδΔεσμλφ∑∫∂√]\S*/g;

/**
 * Decode HTML entities back to raw characters for KaTeX processing.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

interface MathSegment {
  start: number;
  end: number;
}

/**
 * Detect ASCII math expressions in plain text and return their positions.
 * Matches patterns like f(x), f'(x), lim_{h→0}, (f(x+h)-f(x))/h, 3x+1, x^2
 */
function findMathSegments(text: string): MathSegment[] {
  const segments: MathSegment[] = [];

  const patterns: RegExp[] = [
    // Single-letter function calls: f(x), f'(x), g(t+h), f(x+h)
    /(?<![a-zA-Z])[a-zA-Z]'?\([a-zA-Z0-9+\-*/,.\s→←≠≤≥≈×÷±∞·]*\)/g,
    // Named function calls with parens: lim(...), sin(x)
    /\b(?:lim|sin|cos|tan|log|ln|exp|sqrt|max|min)\s*\([^)]*\)/g,
    // Subscript/superscript notation: lim_{h→0}, x^{2}, x^2
    /[a-zA-Z]+_\{[^}]+\}/g,
    /[a-zA-Z]\^\{[^}]+\}/g,
    /[a-zA-Z]\^\d+/g,
    // Parenthesized expression divided by something: (expr)/var
    /\([^()]*(?:\([^)]*\)[^()]*)*\)\/[a-zA-Z0-9(]+(?:\([^)]*\))?/g,
    // Algebraic terms: 3x, 2y+1, coefficient-variable patterns
    /(?<![a-zA-Z])\d+[a-zA-Z](?=[+\-*/=^)]|\s|$)/g,
    // Square bracket expression with division: [f(a+h)-f(a)]/h
    /\[[^\]]+\]\s*\/\s*[a-zA-Z0-9]+/g,
    // Math operator with subscript followed by bracket body: lim_{h→0} [expr]/var
    /(?:lim|sum|prod|int|sup|inf|max|min)(?:_\{[^}]+\})?\s*\[[^\]]+\](?:\s*\/\s*\S+)?/g,
    // Unicode math (existing)
    UNICODE_MATH_SEGMENT_RE,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      segments.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  return segments;
}

/**
 * Merge overlapping/adjacent math segments and extend across math operators
 * (=, +, -, etc.) to form complete expressions like "f'(x) = lim_{h→0} (f(x+h)-f(x))/h"
 */
function mergeAndExtendSegments(
  segments: MathSegment[],
  text: string
): MathSegment[] {
  if (segments.length === 0) return [];

  // Sort by start position
  const sorted = [...segments].sort((a, b) => a.start - b.start);

  // Merge overlapping segments
  const merged: MathSegment[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      last.end = Math.max(last.end, sorted[i].end);
    } else {
      merged.push({ ...sorted[i] });
    }
  }

  // Extend across math operators connecting adjacent segments
  const mathConnector = /^\s*[=+\-*/]\s*$/;
  const extended: MathSegment[] = [merged[0]];
  for (let i = 1; i < merged.length; i++) {
    const last = extended[extended.length - 1];
    const gap = text.slice(last.end, merged[i].start);
    if (mathConnector.test(gap)) {
      // Merge: the gap is just a math operator with spaces
      last.end = merged[i].end;
    } else {
      extended.push({ ...merged[i] });
    }
  }

  return extended;
}

/**
 * Check if text at a given range looks like it could be valid math for KaTeX.
 * Filters out false positives (single letters, common English words, etc.)
 */
function isLikelyMath(expr: string): boolean {
  const trimmed = expr.trim();
  // Must be at least 2 chars
  if (trimmed.length < 2) return false;
  // Single word without math chars is not math
  if (/^[a-zA-Z]+$/.test(trimmed)) return false;
  // Must contain at least one math indicator
  return (
    MATH_INDICATOR_RE.test(trimmed) ||
    /[()=+\-*/^_{}']/.test(trimmed) ||
    /\d+[a-zA-Z]/.test(trimmed)
  );
}

/**
 * Detect ASCII math expressions in plain text and render them via KaTeX.
 * Processes a text node (no HTML) and returns text with math wrapped in
 * <span class="math-inline">...</span>.
 */
function renderAsciiMath(text: string): string {
  const segments = findMathSegments(text);
  if (segments.length === 0) return text;

  const extended = mergeAndExtendSegments(segments, text);

  // Build result by replacing segments right-to-left to preserve indices
  let result = text;
  for (let i = extended.length - 1; i >= 0; i--) {
    const seg = extended[i];
    const expr = result.slice(seg.start, seg.end);

    if (!isLikelyMath(expr)) continue;

    // Strip trailing punctuation
    const trailingMatch = expr.match(/[.,;:!?]+$/);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const mathExpr = trailing ? expr.slice(0, -trailing.length) : expr;

    if (!mathExpr.trim()) continue;

    const rendered = renderMath(mathExpr.trim(), false);
    if (rendered) {
      const replacement = `<span class="math-inline">${rendered}</span>${trailing}`;
      result = result.slice(0, seg.start) + replacement + result.slice(seg.end);
    }
  }

  return result;
}

/**
 * Find the end of a balanced brace group starting at pos.
 * pos should point to the opening '{'. Returns index after closing '}'.
 */
function skipBraceGroup(text: string, pos: number): number {
  if (pos >= text.length || text[pos] !== "{") return pos;
  let depth = 1;
  let i = pos + 1;
  while (i < text.length && depth > 0) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") depth--;
    i++;
  }
  return i;
}

/**
 * From a position after a LaTeX command name, skip over all following
 * subscripts (_{}), superscripts (^{}), and brace groups ({}).
 */
function skipLatexArgs(text: string, pos: number): number {
  let i = pos;
  while (i < text.length) {
    if (text[i] === " ") {
      i++;
      continue;
    }
    if (text[i] === "{") {
      i = skipBraceGroup(text, i);
      continue;
    }
    if (text[i] === "_" || text[i] === "^") {
      i++;
      if (i < text.length && text[i] === "{") {
        i = skipBraceGroup(text, i);
      } else if (i < text.length) {
        i++;
      }
      continue;
    }
    break;
  }
  return i;
}

/** Regex for "structural" LaTeX commands that take brace arguments */
const STRUCTURAL_CMD_RE =
  /\\(?:frac|lim|limits|int|sum|prod|sqrt)\b/;

/** Regex for any LaTeX command (structural + decorative) */
const ANY_CMD_RE =
  /\\(?:frac|lim|limits|int|sum|prod|sqrt|to|infty|cdot|times|div|pm|leq|geq|neq|approx|equiv|left|right|text|mathrm|mathbf|alpha|beta|gamma|delta|theta|pi|sigma|mu|lambda|phi|partial|nabla|sin|cos|tan|log|ln|exp|max|min|sup|inf)\b/;

/**
 * Detect and render raw LaTeX expressions that appear in plain text
 * without any delimiters ($, backticks, <code> tags).
 * Also handles double-escaped backslashes (\\frac → \frac).
 */
function renderRawLatexInText(text: string): string {
  // Quick check: does the text contain any LaTeX-like commands?
  if (!/\\{1,2}(?:frac|lim|limits|int|sum|prod|sqrt)\b/.test(text)) {
    return text;
  }

  // Normalize double backslashes to single for known LaTeX commands
  const normalized = normalizeLatexBackslashes(text);

  // Find all structural LaTeX command positions
  const cmdRegex = new RegExp(STRUCTURAL_CMD_RE.source, "g");
  let match: RegExpExecArray | null;
  const ranges: MathSegment[] = [];

  while ((match = cmdRegex.exec(normalized)) !== null) {
    const cmdStart = match.index;
    let end = cmdStart + match[0].length;

    // Skip all arguments (brace groups, subscripts, superscripts)
    end = skipLatexArgs(normalized, end);

    // Continue if another LaTeX command follows
    let extended = true;
    while (extended) {
      extended = false;
      let peek = end;
      while (peek < normalized.length && normalized[peek] === " ") peek++;
      const nextCmd = normalized.slice(peek).match(new RegExp("^" + ANY_CMD_RE.source));
      if (nextCmd) {
        end = peek + nextCmd[0].length;
        end = skipLatexArgs(normalized, end);
        extended = true;
      }
    }

    // Extend backwards to capture preceding math context (variables, operators, primes)
    let start = cmdStart;
    while (start > 0) {
      const ch = normalized[start - 1];
      if (
        /[a-zA-Z0-9'()\[\]=+\-*/^_{}., ]/.test(ch) ||
        /[→←≠≤≥≈×÷±∞·πθαβγδΔεσμλφ∑∫∂√\u2212]/.test(ch)
      ) {
        start--;
      } else {
        break;
      }
    }
    // Trim leading spaces
    while (start < cmdStart && normalized[start] === " ") start++;
    // Trim trailing spaces
    while (end > start && normalized[end - 1] === " ") end--;

    ranges.push({ start, end });
  }

  if (ranges.length === 0) return text;

  // Merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start);
  const merged: MathSegment[] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i].start <= last.end + 1) {
      last.end = Math.max(last.end, ranges[i].end);
    } else {
      merged.push({ ...ranges[i] });
    }
  }

  // Render right-to-left to preserve positions
  let result = normalized;
  for (let i = merged.length - 1; i >= 0; i--) {
    const { start, end } = merged[i];
    let expr = result.slice(start, end).trim();
    if (!expr) continue;

    // Strip trailing punctuation
    const trailingMatch = expr.match(/[.,;:!?]+$/);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    if (trailing) expr = expr.slice(0, -trailing.length).trim();

    const isComplex = /\\(?:frac|int|sum|prod)\b/.test(expr);
    const rendered = renderMath(expr, isComplex);
    if (rendered) {
      const replacement = isComplex
        ? `<div class="my-3 overflow-x-auto">${rendered}</div>${trailing}`
        : `<span class="math-inline">${rendered}</span>${trailing}`;
      result = result.slice(0, start) + replacement + result.slice(end);
    }
  }

  return result;
}

/**
 * Render math strictly — returns non-null ONLY if KaTeX fully parses
 * the expression without errors. Used to test if an entire text block
 * is a valid math expression. Returns null if katex is not yet loaded.
 */
function renderMathStrict(
  content: string,
  displayMode: boolean
): string | null {
  const k = getKatex();
  if (!k) return null;

  const decoded = decodeHtmlEntities(content.trim());
  const normalized = normalizeMathChars(decoded);
  const deduped = normalizeLatexBackslashes(normalized);
  const latex = toLatex(deduped);
  try {
    return k.renderToString(latex, {
      displayMode,
      throwOnError: true,
      strict: "error",
      trust: false,
      output: "html",
    });
  } catch {
    return null;
  }
}

/**
 * Process raw LaTeX expressions using DOM traversal.
 * Uses element.textContent which naturally joins text across <br> tags,
 * solving the problem of formulas split across line breaks.
 */
function processRawLatexViaDom(html: string): string {
  if (typeof window === "undefined") return html;

  const container = document.createElement("div");
  container.innerHTML = html;

  const leafSelector =
    "p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th";
  const blocks = container.querySelectorAll(leafSelector);

  for (const block of Array.from(blocks)) {
    // Only process leaf-level blocks (no nested block children)
    if (block.querySelector(leafSelector)) continue;

    // Skip blocks already containing rendered math from earlier steps
    if (
      block.innerHTML.includes("math-inline") ||
      block.innerHTML.includes("katex")
    )
      continue;

    // textContent joins text across <br> tags — this is the key fix
    const rawText = block.textContent || "";
    const normalized = normalizeLatexBackslashes(rawText.trim());

    if (!hasLatexCommands(normalized)) continue;

    // Strategy 1: Try rendering the entire block as a single math expression.
    // Works for standalone formula paragraphs.
    const isComplex = /\\(?:frac|int|sum|prod)\b/.test(normalized);
    const fullRender = renderMathStrict(normalized, isComplex);
    if (fullRender) {
      block.innerHTML = isComplex
        ? `<div class="my-3 overflow-x-auto">${fullRender}</div>`
        : `<span class="math-inline">${fullRender}</span>`;
      continue;
    }

    // Strategy 2: Partial rendering — find and render LaTeX fragments
    // within mixed text+math content.
    const partialRender = renderRawLatexInText(normalized);
    if (partialRender !== normalized) {
      block.innerHTML = partialRender;
    }
  }

  return container.innerHTML;
}

/**
 * Process sanitized HTML to render math content:
 * 1. Protect <pre><code>...</code></pre> (actual code blocks)
 * 2. Convert $$...$$ → KaTeX display math
 * 3. Convert $...$ → KaTeX inline math
 * 4. Convert standalone <code>...</code> → KaTeX inline math
 * 4-pre. Join LaTeX expressions split across line breaks
 * 4a. Detect raw LaTeX commands in plain text → KaTeX math
 * 4b. Convert Unicode math symbols in plain text → KaTeX inline math
 */
function processMathInHtml(html: string): string {
  let result = html;

  // Step 0: Protect currency dollar signs BEFORE any $...$ math matching.
  // Converts "$5" → "&#36;5" only when followed by non-alphanumeric context
  // (space, punctuation, HTML tags), preserving math like "$5x$".
  result = protectCurrencyDollars(result);

  // Step 1: Protect <pre><code>...</code></pre> with placeholders
  const preBlocks: string[] = [];
  result = result.replace(
    /<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (match) => {
      preBlocks.push(match);
      return `__PRE_BLOCK_${preBlocks.length - 1}__`;
    }
  );

  // Step 2: Process $$...$$ (display math) before $...$
  result = result.replace(/\$\$([^$]+)\$\$/g, (_, content) => {
    const rendered = renderMath(content, true);
    return rendered
      ? `<div class="my-3 overflow-x-auto">${rendered}</div>`
      : `<code>${content}</code>`;
  });

  // Step 3: Process $...$ (inline math) with content validation.
  // The isLikelyInlineMath check prevents natural language between dollar
  // signs from being rendered as math (which strips spaces and italicizes).
  result = result.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
    (match, content) => {
      if (!isLikelyInlineMath(content)) return match;
      const rendered = renderMath(content, false);
      return rendered
        ? `<span class="math-inline">${rendered}</span>`
        : match;
    }
  );

  // Step 3b: Convert backtick-wrapped LaTeX to math
  result = result.replace(/`([^`]+)`/g, (match, content) => {
    const decoded = decodeHtmlEntities(content.trim());
    if (!decoded || !hasLatexCommands(decoded)) return match;
    const isComplex = /\\(?:frac|int|sum|prod)\b/.test(decoded);
    const rendered = renderMath(decoded, isComplex);
    if (!rendered) return match;
    return isComplex
      ? `<div class="my-3 overflow-x-auto">${rendered}</div>`
      : `<span class="math-inline">${rendered}</span>`;
  });

  // Step 4: Process standalone <code>...</code> tags as inline math
  result = result.replace(
    /<code(?:\s[^>]*)?>([\s\S]+?)<\/code>/g,
    (match, content) => {
      const decoded = decodeHtmlEntities(content.trim());

      // Skip empty
      if (!decoded) return match;

      // If content has LaTeX commands, it's definitely math — skip programming check
      if (hasLatexCommands(decoded)) {
        const isComplex = /\\(?:frac|int|sum|prod)\b/.test(decoded);
        const rendered = renderMath(decoded, isComplex);
        if (!rendered) return match;
        return isComplex
          ? `<div class="my-3 overflow-x-auto">${rendered}</div>`
          : `<span class="math-inline">${rendered}</span>`;
      }

      // Skip programming code
      if (isProgrammingCode(decoded)) return match;

      const rendered = renderMath(decoded, false);
      return rendered
        ? `<span class="math-inline">${rendered}</span>`
        : match;
    }
  );

  // Step 4a: Process raw LaTeX via DOM traversal.
  // element.textContent joins text across <br> tags, solving the problem
  // of formulas split across line breaks by AI-generated content.
  result = processRawLatexViaDom(result);

  // Step 4b: Process remaining math expressions in text nodes
  // (Unicode symbols, ASCII math patterns like f(x), x^2, etc.)
  const parts = result.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    // Skip HTML tags
    if (parts[i].startsWith("<")) continue;
    // Skip pre-block placeholders
    if (parts[i].includes("__PRE_BLOCK_")) continue;
    // Skip already-rendered KaTeX
    if (parts[i].includes("math-inline") || parts[i].includes("katex"))
      continue;

    parts[i] = renderAsciiMath(parts[i]);
  }
  result = parts.join("");

  // Step 5: Restore <pre><code> blocks
  preBlocks.forEach((block, i) => {
    result = result.replace(`__PRE_BLOCK_${i}__`, block);
  });

  return result;
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
  "sub",
  "sup",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

/** Set of allowed tag names for quick lookup */
const ALLOWED_TAG_SET = new Set(ALLOWED_TAGS);

/**
 * Detect whether content has entity-encoded HTML structure.
 * Looks for patterns like &lt;h2&gt;, &lt;/p&gt;, &#60;strong&#62; etc.
 */
function hasEntityEncodedHtml(html: string): boolean {
  return /(?:&lt;|&#60;|&#x3[cC];)\s*\/?\s*[a-zA-Z]/.test(html);
}

/**
 * Decode all HTML-entity-encoded angle brackets back to literal < and >.
 *
 * AI-generated content sometimes gets double-encoded during storage (e.g. via
 * TipTap serialization or API response escaping), producing:
 *   &lt;h2&gt;Title&lt;/h2&gt;  instead of  <h2>Title</h2>
 *   &amp;lt;p&amp;gt;text&amp;lt;/p&amp;gt;  (double-encoded)
 *   &#60;strong&#62;bold&#60;/strong&#62;  (numeric entities)
 *
 * Security: DOMPurify runs AFTER this step and sanitizes the decoded HTML,
 * so decoding entities here cannot introduce XSS.
 */
function decodeEntityEncodedTags(html: string): string {
  let result = html;

  // Step 1: Unwrap double-encoded entities: &amp;lt; → &lt;, &amp;gt; → &gt;
  result = result.replace(/&amp;(lt|gt|#60|#62|#x3[cCeE]);/gi, "&$1;");

  // Step 2: Only decode if content actually has entity-encoded HTML structure.
  // This avoids breaking intentional entities in content that has no encoded tags.
  if (!hasEntityEncodedHtml(result)) return result;

  // Step 3: Decode ALL angle-bracket entities (named + numeric).
  // DOMPurify sanitizes after, so this is safe.
  result = result
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#60;/g, "<")
    .replace(/&#62;/g, ">")
    .replace(/&#x3[cC];/g, "<")
    .replace(/&#x3[eE];/g, ">");

  return result;
}

/**
 * Fix malformed HTML in AI-generated content. Handles:
 * 1. Entity-encoded tags: &lt;h2&gt; → <h2> (including numeric &#60;h2&#62;)
 * 2. Double-encoded: &amp;lt;h2&amp;gt; → <h2>
 * 3. Spaced tags: < strong > → <strong>, < /p > → </p>
 *
 * DOMPurify runs after this step to sanitize the result.
 */
function normalizeHtmlTags(html: string): string {
  // First, decode entity-encoded tags (&lt;h2&gt; → <h2>)
  let result = decodeEntityEncodedTags(html);

  // Then, fix literal spaced tags (< h2 > → <h2>)
  result = result.replace(
    /<\s*(\/?\s*[a-zA-Z][a-zA-Z0-9]*)\s*>/g,
    (match, tag: string) => {
      const normalized = tag.replace(/\s+/g, "");
      const tagName = normalized.replace(/^\//, "").toLowerCase();
      if (ALLOWED_TAG_SET.has(tagName)) {
        return `<${normalized}>`;
      }
      return match;
    },
  );

  return result;
}

const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders plain text with math expression support.
 *
 * Detects and renders:
 * - $...$ inline math and $$...$$ display math
 * - Unicode math symbols (², →, π, etc.) with surrounding context
 *
 * Use this for plain text content (not HTML) that may contain math,
 * such as exam questions and answer options.
 */
export function MathText({ text, className }: MathTextProps) {
  const [katexReady, setKatexReady] = useState(!!katexModule);

  useEffect(() => {
    if (!katexModule) {
      loadKatex().then(() => setKatexReady(true));
    }
  }, []);

  const processedHtml = useMemo(() => {
    // katexReady is included as a dependency to re-process once katex loads
    if (!text || !katexReady) return text || "";

    // Escape HTML since input is plain text
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // Protect currency dollar signs before math processing
    html = protectCurrencyDollars(html);

    // Process $$...$$ (display math)
    html = html.replace(/\$\$([^$]+)\$\$/g, (_, content) => {
      const decoded = decodeHtmlEntities(content);
      const rendered = renderMath(decoded, true);
      return rendered
        ? `<div class="my-3 overflow-x-auto">${rendered}</div>`
        : `<code>${content}</code>`;
    });

    // Process $...$ (inline math) with content validation
    html = html.replace(
      /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
      (match, content) => {
        if (!isLikelyInlineMath(content)) return match;
        const decoded = decodeHtmlEntities(content);
        const rendered = renderMath(decoded, false);
        return rendered
          ? `<span class="math-inline">${rendered}</span>`
          : match;
      }
    );

    // Process Unicode + ASCII math patterns in a single pass
    if (!html.includes("math-inline")) {
      const decoded = decodeHtmlEntities(html);
      html = renderAsciiMath(decoded);
    }

    // Sanitize the final HTML to prevent XSS from math content
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
  }, [text, katexReady]);

  if (!text) return null;

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      suppressHydrationWarning
    />
  );
}

/**
 * HTML renderer that sanitizes content AND renders math expressions via KaTeX.
 *
 * Handles:
 * - <code> tags containing math → KaTeX inline math
 * - $...$ → KaTeX inline math
 * - $$...$$ → KaTeX display math
 * - Unicode math symbols in plain text → KaTeX inline math
 * - <pre><code>...</code></pre> → preserved as code blocks
 *
 * Use this instead of SafeHtmlRenderer for content that may contain
 * mathematical expressions (section descriptions, learning objectives, etc.).
 */
export function MathAwareHtmlRenderer({
  html,
  className = "",
  as: Tag = "div",
}: MathAwareHtmlRendererProps) {
  const [katexReady, setKatexReady] = useState(!!katexModule);

  useEffect(() => {
    if (!katexModule) {
      loadKatex().then(() => setKatexReady(true));
    }
  }, []);

  const processedHtml = useMemo(() => {
    if (!html) return "";

    // Step 0: Normalize malformed HTML tags (e.g. `< strong >` → `<strong>`)
    const normalized = normalizeHtmlTags(html);

    // Step 1: Sanitize HTML (security) - always runs even before katex loads
    const sanitized = DOMPurify.sanitize(normalized, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });

    // Step 2: Process math content (only when katex is loaded)
    if (!katexReady) return sanitized;
    return processMathInHtml(sanitized);
  }, [html, katexReady]);

  return (
    <Tag
      className={className}
      style={{ overflowWrap: "break-word", wordBreak: "break-word" }}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      suppressHydrationWarning
    />
  );
}

/**
 * Truncate HTML content by visible text length, preserving HTML structure and math notation.
 * Counts only visible text characters (not HTML tags or attributes).
 *
 * @returns { html: string; isTruncated: boolean }
 */
export function truncateHtmlWithMath(
  html: string,
  maxLength: number
): { html: string; isTruncated: boolean } {
  if (!html || typeof window === "undefined") {
    return { html: html || "", isTruncated: false };
  }

  const div = document.createElement("div");
  div.innerHTML = normalizeHtmlTags(html);
  const textContent = div.textContent || div.innerText || "";

  if (textContent.length <= maxLength) {
    return { html, isTruncated: false };
  }

  // Walk the DOM tree, counting visible text characters
  // and cloning nodes until we hit the limit
  const truncated = document.createElement("div");
  let charCount = 0;

  function walkAndTruncate(source: Node, target: Node): boolean {
    for (const child of Array.from(source.childNodes)) {
      if (charCount >= maxLength) return true;

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent || "";
        const remaining = maxLength - charCount;
        if (text.length <= remaining) {
          target.appendChild(document.createTextNode(text));
          charCount += text.length;
        } else {
          target.appendChild(
            document.createTextNode(text.substring(0, remaining) + "...")
          );
          charCount = maxLength;
          return true;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const cloned = element.cloneNode(false);
        target.appendChild(cloned);
        const done = walkAndTruncate(child, cloned);
        if (done) return true;
      }
    }
    return false;
  }

  walkAndTruncate(div, truncated);
  return { html: truncated.innerHTML, isTruncated: true };
}

/**
 * Extract list items or paragraphs from HTML content, preserving inner HTML
 * (including math notation) instead of stripping to plain text.
 *
 * @returns Array of HTML strings (one per item)
 */
export function extractItemsPreservingHtml(html: string): string[] {
  if (!html || typeof window === "undefined") return [];

  const div = document.createElement("div");
  div.innerHTML = html;

  const listItems = div.querySelectorAll("li");
  if (listItems.length > 0) {
    return Array.from(listItems)
      .map((li) => li.innerHTML.trim())
      .filter(Boolean);
  }

  const paragraphs = div.querySelectorAll("p");
  if (paragraphs.length > 0) {
    return Array.from(paragraphs)
      .map((p) => p.innerHTML.trim())
      .filter(Boolean);
  }

  // Fallback: split by newlines, return as-is
  return (div.innerHTML || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
