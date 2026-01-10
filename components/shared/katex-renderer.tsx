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
 * Shared KaTeX renderer using dangerouslySetInnerHTML (React-recommended approach).
 * This prevents React from trying to reconcile KaTeX-generated DOM nodes.
 *
 * Used by both teacher and student views for consistent math rendering.
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
        output: 'html',
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return '<span class="text-red-500 text-sm">Error rendering equation</span>';
    }
  }, [math, displayMode]);

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
export const KaTeXRenderer = memo(
  KaTeXRendererComponent,
  (prevProps, nextProps) =>
    prevProps.math === nextProps.math &&
    prevProps.displayMode === nextProps.displayMode &&
    prevProps.className === nextProps.className
);

/**
 * Helper function to clean LaTeX delimiters
 */
export const cleanLatex = (latex: string): string => {
  if (!latex) return latex;

  let cleaned = latex.trim();

  // Remove display math delimiters: \[ ... \]
  if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]')) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // Remove display math delimiters: $$ ... $$
  if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // Remove inline math delimiters: $ ... $
  if (cleaned.startsWith('$') && cleaned.endsWith('$') && !cleaned.startsWith('$$')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
};
