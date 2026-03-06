"use client";

import DOMPurify from "isomorphic-dompurify";

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
}

const SAFE_ALLOWED_TAGS = [
  "p", "br", "strong", "b", "i", "em", "u", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "a", "blockquote",
  "code", "pre", "span", "div"
];

const SAFE_ALLOWED_TAG_SET = new Set(SAFE_ALLOWED_TAGS);

/**
 * Decode HTML-entity-encoded angle brackets back to literal < and >.
 * Handles double-encoded (&amp;lt;), named (&lt;), and numeric (&#60;, &#x3C;) entities.
 * Only decodes if the content has entity-encoded HTML structure.
 * DOMPurify runs after, so this is safe.
 */
function decodeEntityEncodedTags(html: string): string {
  let result = html;
  result = result.replace(/&amp;(lt|gt|#60|#62|#x3[cCeE]);/gi, "&$1;");
  if (!/(?:&lt;|&#60;|&#x3[cC];)\s*\/?\s*[a-zA-Z]/.test(result)) return result;
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
 * Fix malformed HTML tags with spaces inside them.
 * AI-generated content sometimes produces `< strong >`, `< /p >`, `< h2 >` etc.
 * Also decodes entity-encoded tags (&lt;h2&gt; → <h2>).
 */
function normalizeHtmlTags(html: string): string {
  let result = decodeEntityEncodedTags(html);
  result = result.replace(/<\s*(\/?\s*[a-zA-Z][a-zA-Z0-9]*)\s*>/g, (match, tag: string) => {
    const normalized = tag.replace(/\s+/g, "");
    const tagName = normalized.replace(/^\//, "").toLowerCase();
    if (SAFE_ALLOWED_TAG_SET.has(tagName)) {
      return `<${normalized}>`;
    }
    return match;
  });
  return result;
}

/**
 * Safely renders HTML content by sanitizing it first
 * This prevents XSS attacks while allowing safe HTML formatting
 *
 * ✅ Fixed: Removed server/client branch to prevent hydration errors
 * isomorphic-dompurify works on both server and client
 */
export function SafeHtmlRenderer({ html, className = "" }: SafeHtmlRendererProps) {
  // Normalize malformed tags (e.g. `< strong >` → `<strong>`) then sanitize
  const normalized = normalizeHtmlTags(html);
  const sanitizedHtml = DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS: SAFE_ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

/**
 * Component for rendering section descriptions
 */
export function SectionDescription({ content }: { content: string }) {
  return (
    <SafeHtmlRenderer
      html={content}
      className="text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
    />
  );
}

/**
 * Component for rendering learning objectives
 */
export function LearningObjectives({ content }: { content: string }) {
  return (
    <SafeHtmlRenderer
      html={content}
      className="prose prose-sm dark:prose-invert max-w-none [&>ul]:list-disc [&>ul]:ml-5 [&>ul>li]:mb-1.5 [&>ul>li]:text-sm [&>ul>li]:marker:text-green-500"
    />
  );
}