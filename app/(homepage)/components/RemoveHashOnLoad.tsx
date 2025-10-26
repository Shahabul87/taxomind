'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RemoveHashOnLoad() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run on homepage
    if (pathname === '/' && window.location.hash) {
      // Remove hash from URL without reloading
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [pathname]);

  return null;
}
