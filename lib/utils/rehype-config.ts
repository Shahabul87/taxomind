import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';

/**
 * Shared rehype-sanitize schema for all ReactMarkdown components that use rehype-raw.
 * Mirrors the allowed tags from lib/utils/sanitize-html.ts DEFAULT_CONFIG + code-related tags.
 */
export const rehypeSanitizeSchema: RehypeSanitizeOptions = {
  tagNames: [
    'p', 'br', 'strong', 'b', 'i', 'em', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'blockquote',
    'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption', 'hr', 'sup', 'sub', 'mark', 'del', 'ins',
    // Code-specific
    'details', 'summary', 'kbd', 'var', 'samp', 'abbr', 'dl', 'dt', 'dd',
  ],
  attributes: {
    '*': ['className', 'style', 'id'],
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    code: ['className'],
    pre: ['className'],
    span: ['className', 'style'],
    td: ['colSpan', 'rowSpan'],
    th: ['colSpan', 'rowSpan'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};
