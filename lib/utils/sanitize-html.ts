import DOMPurify from 'isomorphic-dompurify';

/**
 * Default DOMPurify configuration for general HTML content.
 * Allows safe HTML formatting tags while preventing XSS.
 */
const DEFAULT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'i', 'em', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote',
    'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption', 'hr', 'sup', 'sub', 'mark', 'del', 'ins',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height', 'id'],
  ALLOW_DATA_ATTR: false,
};

/**
 * Extended config for rich content (math, iframes, KaTeX).
 * Used in course content, explanations, and math-heavy components.
 */
const RICH_CONTENT_CONFIG: DOMPurify.Config = {
  ADD_TAGS: [
    'iframe', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac',
    'munder', 'mover', 'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mtext',
    'annotation', 'semantics',
  ],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'xmlns', 'encoding'],
  ALLOWED_TAGS: [
    ...DEFAULT_CONFIG.ALLOWED_TAGS as string[],
    'svg', 'path', 'line', 'circle', 'rect', 'g',
  ],
  ALLOWED_ATTR: [
    ...DEFAULT_CONFIG.ALLOWED_ATTR as string[],
    'd', 'viewBox', 'fill', 'stroke', 'stroke-width', 'cx', 'cy', 'r', 'x', 'y',
    'x1', 'y1', 'x2', 'y2', 'transform',
  ],
  ALLOW_DATA_ATTR: true,
};

/**
 * Sanitize HTML string using DOMPurify with safe defaults.
 */
export function sanitizeHtml(dirty: string, config?: DOMPurify.Config): string {
  return DOMPurify.sanitize(dirty, config ?? DEFAULT_CONFIG);
}

/**
 * Sanitize HTML for rich content (math, iframes, KaTeX, SVG).
 */
export function sanitizeRichHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, RICH_CONTENT_CONFIG);
}

/**
 * Create a sanitized markup object for React's dangerouslySetInnerHTML.
 * Use this as a drop-in replacement:
 *   dangerouslySetInnerHTML={createSanitizedMarkup(html)}
 */
export function createSanitizedMarkup(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}

/**
 * Create a sanitized markup object for rich content.
 * Use for components that render math, code, or embedded content.
 */
export function createRichSanitizedMarkup(html: string): { __html: string } {
  return { __html: sanitizeRichHtml(html) };
}
