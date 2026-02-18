'use client';

import { useMemo, useState, useEffect, memo } from 'react';

interface KaTeXRendererProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

// Cached katex module reference so we only dynamically import once
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

/**
 * Shared KaTeX renderer using dangerouslySetInnerHTML (React-recommended approach).
 * This prevents React from trying to reconcile KaTeX-generated DOM nodes.
 *
 * Used by both teacher and student views for consistent math rendering.
 * KaTeX and its CSS are dynamically imported to reduce initial bundle size.
 */
const KaTeXRendererComponent = ({
  math,
  displayMode = true,
  className = ''
}: KaTeXRendererProps) => {
  const [katexReady, setKatexReady] = useState(!!katexModule);

  useEffect(() => {
    if (!katexModule) {
      loadKatex().then(() => setKatexReady(true));
    }
  }, []);

  // Memoize the rendered HTML to avoid re-rendering on every parent update
  const html = useMemo(() => {
    if (!math || !katexReady || !katexModule) return '';

    try {
      return katexModule.default.renderToString(math, {
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
  }, [math, displayMode, katexReady]);

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
