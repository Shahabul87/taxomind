"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathAwareHtmlRendererProps {
  html: string;
  className?: string;
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
    // HTML tags
    /<\/?[a-z]+/i.test(content)
  );
}

/**
 * Render math to HTML using KaTeX. Returns null on failure.
 */
function renderMath(
  content: string,
  displayMode: boolean
): string | null {
  const latex = toLatex(content.trim());
  try {
    return katex.renderToString(latex, {
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
    .replace(/&quot;/g, '"');
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
 * Process sanitized HTML to render math content:
 * 1. Protect <pre><code>...</code></pre> (actual code blocks)
 * 2. Convert $$...$$ → KaTeX display math
 * 3. Convert $...$ → KaTeX inline math
 * 4. Convert standalone <code>...</code> → KaTeX inline math
 * 4b. Convert Unicode math symbols in plain text → KaTeX inline math
 */
function processMathInHtml(html: string): string {
  let result = html;

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

  // Step 3: Process $...$ (inline math)
  result = result.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
    (_, content) => {
      const rendered = renderMath(content, false);
      return rendered
        ? `<span class="math-inline">${rendered}</span>`
        : `<code>${content}</code>`;
    }
  );

  // Step 4: Process standalone <code>...</code> tags as inline math
  result = result.replace(/<code>([^<]+)<\/code>/g, (match, content) => {
    const trimmed = content.trim();

    // Skip empty
    if (!trimmed) return match;

    // Skip programming code
    if (isProgrammingCode(trimmed)) return match;

    const rendered = renderMath(trimmed, false);
    return rendered
      ? `<span class="math-inline">${rendered}</span>`
      : match;
  });

  // Step 4b: Process math expressions in text nodes (Unicode + ASCII patterns)
  // Split by HTML tags so we only process text content, not tag attributes
  // or already-rendered KaTeX output
  const parts = result.split(/(<[^>]+>)/);
  for (let i = 0; i < parts.length; i++) {
    // Skip HTML tags
    if (parts[i].startsWith("<")) continue;
    // Skip pre-block placeholders
    if (parts[i].includes("__PRE_BLOCK_")) continue;
    // Skip already-rendered KaTeX
    if (parts[i].includes("math-inline")) continue;

    // renderAsciiMath handles both Unicode math AND ASCII math patterns
    // in a single pass with proper segment merging
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
];

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
  const processedHtml = useMemo(() => {
    if (!text) return "";

    // Escape HTML since input is plain text
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

    // Process $$...$$ (display math)
    html = html.replace(/\$\$([^$]+)\$\$/g, (_, content) => {
      const decoded = decodeHtmlEntities(content);
      const rendered = renderMath(decoded, true);
      return rendered
        ? `<div class="my-3 overflow-x-auto">${rendered}</div>`
        : `<code>${content}</code>`;
    });

    // Process $...$ (inline math) — skip if content has too many words
    html = html.replace(
      /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
      (_, content) => {
        if (content.trim().split(/\s+/).length > 8) return `$${content}$`;
        const decoded = decodeHtmlEntities(content);
        const rendered = renderMath(decoded, false);
        return rendered
          ? `<span class="math-inline">${rendered}</span>`
          : `<code>${content}</code>`;
      }
    );

    // Process Unicode + ASCII math patterns in a single pass
    if (!html.includes("math-inline")) {
      const decoded = decodeHtmlEntities(html);
      html = renderAsciiMath(decoded);
    }

    return html;
  }, [text]);

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
}: MathAwareHtmlRendererProps) {
  const processedHtml = useMemo(() => {
    if (!html) return "";

    // Step 1: Sanitize HTML (security)
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });

    // Step 2: Process math content
    return processMathInHtml(sanitized);
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      suppressHydrationWarning
    />
  );
}
