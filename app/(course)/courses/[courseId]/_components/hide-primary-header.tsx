"use client";

import { useEffect } from 'react';

type Props = {
  selector?: string;
};

// Hides the primary site header for the lifetime of the page.
export function HidePrimaryHeader({ selector = 'header[aria-label="Primary"], header' }: Props): JSX.Element | null {
  useEffect(() => {
    const header = document.querySelector(selector) as HTMLElement | null;
    if (!header) return;
    const prev = header.style.display;
    header.style.display = 'none';
    return () => {
      header.style.display = prev || '';
    };
  }, [selector]);
  return null;
}

