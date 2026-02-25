'use client';

import { useState, useEffect, useRef, memo } from 'react';
import 'katex/dist/katex.min.css';
import { createRichSanitizedMarkup } from '@/lib/utils/sanitize-html';

// katex is dynamically imported to reduce initial bundle size
type KaTeXModule = typeof import('katex');

interface KaTeXRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * KaTeX renderer using dangerouslySetInnerHTML (React-recommended approach).
 * This prevents React from trying to reconcile KaTeX-generated DOM nodes.
 *
 * Research findings:
 * - Using innerHTML causes React reconciliation conflicts
 * - dangerouslySetInnerHTML tells React to not manage the HTML content
 * - katex.renderToString() is the recommended approach for React
 * - Memoization prevents unnecessary re-renders
 * - katex is dynamically imported to reduce initial bundle size
 */
const KaTeXRendererComponent = ({
  math,
  displayMode = true,
  className = ''
}: KaTeXRendererProps) => {
  const [html, setHtml] = useState<string>('');
  const katexRef = useRef<KaTeXModule | null>(null);

  // Dynamically load katex module
  useEffect(() => {
    let cancelled = false;

    const loadKatex = async () => {
      if (!katexRef.current) {
        const katexModule = await import('katex');
        if (!cancelled) {
          katexRef.current = katexModule;
        }
      }
      if (cancelled) return;

      if (!math) {
        setHtml('');
        return;
      }

      try {
        const katex = katexRef.current!.default;
        const rendered = katex.renderToString(math, {
          displayMode,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: false,
          trust: false,
          macros: {},
          output: 'html', // Explicitly use HTML output (not MathML)
        });
        setHtml(rendered);
      } catch (error) {
        console.error('KaTeX rendering error:', error);
        setHtml('<span class="text-red-500 text-sm">Error rendering equation</span>');
      }
    };

    loadKatex();
    return () => { cancelled = true; };
  }, [math, displayMode]);

  // Use dangerouslySetInnerHTML to let React know it shouldn't touch this HTML
  // This prevents removeChild errors during reconciliation
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={createRichSanitizedMarkup(html)}
      suppressHydrationWarning
    />
  );
};

KaTeXRendererComponent.displayName = 'KaTeXRenderer';

// Memoize to prevent unnecessary re-renders
// Only re-render when math or displayMode actually changes
export const KaTeXRenderer = memo(
  KaTeXRendererComponent,
  (prevProps, nextProps) =>
    prevProps.math === nextProps.math &&
    prevProps.displayMode === nextProps.displayMode &&
    prevProps.className === nextProps.className
);
