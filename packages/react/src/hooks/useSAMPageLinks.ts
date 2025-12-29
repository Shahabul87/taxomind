/**
 * @sam-ai/react - useSAMPageLinks Hook
 * Collects visible page links and stores them in SAM page metadata.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSAMContext } from '../context/SAMContext';
import type { SAMPageLink, UseSAMPageLinksOptions, UseSAMPageLinksReturn } from '../types';

const DEFAULT_SELECTOR = 'a[href]';

function normalizeText(value?: string | null): string | undefined {
  const text = value?.trim();
  return text ? text.replace(/\s+/g, ' ') : undefined;
}

function isHidden(element: HTMLElement): boolean {
  if (element.getAttribute('aria-hidden') === 'true') return true;
  if (element.hidden) return true;
  const rects = element.getClientRects();
  return rects.length === 0;
}

function buildLink(element: HTMLAnchorElement, options: UseSAMPageLinksOptions): SAMPageLink | null {
  if (!options.includeHidden && isHidden(element)) return null;

  const href = element.getAttribute('href') || '';
  if (!href) return null;

  const link: SAMPageLink = {
    href,
  };

  if (options.includeText !== false) {
    link.text = normalizeText(element.textContent);
  }

  if (options.includeAriaLabel !== false) {
    link.ariaLabel = normalizeText(element.getAttribute('aria-label'));
  }

  if (options.includeTitle !== false) {
    link.title = normalizeText(element.getAttribute('title'));
  }

  if (options.includeRel) {
    link.rel = normalizeText(element.getAttribute('rel'));
  }

  if (options.includeTarget) {
    link.target = normalizeText(element.getAttribute('target'));
  }

  return link;
}

function dedupeLinks(links: SAMPageLink[]): SAMPageLink[] {
  const seen = new Set<string>();
  const output: SAMPageLink[] = [];

  for (const link of links) {
    const key = `${link.href}|${link.text ?? ''}|${link.ariaLabel ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(link);
  }

  return output;
}

export function useSAMPageLinks(
  options: UseSAMPageLinksOptions = {}
): UseSAMPageLinksReturn {
  const { context, updatePage } = useSAMContext();
  const [links, setLinks] = useState<SAMPageLink[]>([]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Use ref for context to avoid infinite loops (refresh updates metadata which would retrigger itself)
  const contextRef = useRef(context);
  contextRef.current = context;

  // Use ref for updatePage to keep callback stable
  const updatePageRef = useRef(updatePage);
  updatePageRef.current = updatePage;

  const refresh = useCallback(() => {
    if (typeof document === 'undefined') return;

    const opts = optionsRef.current;
    const selector = opts.selector ?? DEFAULT_SELECTOR;
    const maxLinks = opts.maxLinks ?? 80;

    const elements = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
    const collected: SAMPageLink[] = [];

    for (const element of elements) {
      if (collected.length >= maxLinks) break;
      const link = buildLink(element, opts);
      if (link) collected.push(link);
    }

    const finalLinks = opts.dedupe === false ? collected : dedupeLinks(collected);
    setLinks(finalLinks);

    // Access current context via ref to avoid dependency cycle
    const currentMetadata = contextRef.current.page.metadata ?? {};
    const nextMetadata = {
      ...currentMetadata,
      links: finalLinks,
      linkCount: finalLinks.length,
    };

    updatePageRef.current({ metadata: nextMetadata });
    opts.onLinks?.(finalLinks);
  }, []); // Empty deps - uses refs for mutable values

  useEffect(() => {
    if (options.enabled === false) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const throttleMs = options.throttleMs ?? 500;

    const schedule = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        refresh();
      }, throttleMs);
    };

    refresh();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', schedule);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [options.enabled, options.throttleMs, refresh]);

  return { links, refresh };
}
