"use client";

import { useEffect, useState, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";

/** Allowed HTML tags for AI-generated course content (matches server-side sanitizeHtmlOutput) */
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "i", "em", "u",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "a", "blockquote", "code", "pre",
  "span", "div", "sub", "sup",
  "table", "thead", "tbody", "tr", "th", "td",
];

/** Allowed HTML attributes for AI-generated course content */
const ALLOWED_ATTR = ["href", "target", "rel", "class", "style"];

interface ClientOnlyHtmlProps {
  html: string;
  className?: string;
}

export function ClientOnlyHtml({ html, className }: ClientOnlyHtmlProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sanitizedHtml = useMemo(() => {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });
  }, [html]);

  // Don't render anything on server or before mount
  if (!mounted) {
    return <div className={className} />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
