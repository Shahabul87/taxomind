"use client";

import { useEffect } from 'react';

/**
 * Client component to hide the header on blog detail pages
 * This ensures the header is hidden even if CSS :has() is not supported
 */
export function HideHeader() {
  useEffect(() => {
    // Find and hide all header elements
    const headers = document.querySelectorAll('header');
    headers.forEach(header => {
      (header as HTMLElement).style.display = 'none';
    });

    // Cleanup function to restore headers when component unmounts
    return () => {
      headers.forEach(header => {
        (header as HTMLElement).style.display = '';
      });
    };
  }, []);

  return null; // This component doesn't render anything
}
