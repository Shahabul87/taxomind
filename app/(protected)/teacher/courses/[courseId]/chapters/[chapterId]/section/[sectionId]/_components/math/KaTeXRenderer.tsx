'use client';

import { useMemo, memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
 */
const KaTeXRendererComponent = ({
  math,
  displayMode = true,
  className = ''
}: KaTeXRendererProps) => {
  // Memoize the rendered HTML to avoid re-rendering on every parent update
  const html = useMemo(() => {
    if (!math) return '';

    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false,
        trust: false,
        macros: {},
        output: 'html', // Explicitly use HTML output (not MathML)
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return '<span class="text-red-500 text-sm">Error rendering equation</span>';
    }
  }, [math, displayMode]);

  // Use dangerouslySetInnerHTML to let React know it shouldn't touch this HTML
  // This prevents removeChild errors during reconciliation
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
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
