'use client';

/**
 * SAMAssistantWrapper
 *
 * Client-side wrapper for SAMAssistant that uses dynamic import with SSR disabled.
 * This prevents server-only modules (like lib/sam/realtime/index.ts) from being
 * bundled into the client bundle.
 *
 * Singleton guard: Only one SAMAssistant instance renders at a time.
 * Multiple <SAMAssistantWrapper /> mounts are safe — the first one wins,
 * subsequent mounts render nothing.
 *
 * Canonical mount: app/layout.tsx (global, covers all pages)
 */

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const SAMAssistant = dynamic(
  () => import('./SAMAssistant').then(mod => mod.SAMAssistant),
  { ssr: false }
);

let globallyMounted = false;

export function SAMAssistantWrapper() {
  const ownsMount = useRef(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!globallyMounted) {
      globallyMounted = true;
      ownsMount.current = true;
      setActive(true);
    }
    return () => {
      if (ownsMount.current) {
        globallyMounted = false;
        ownsMount.current = false;
      }
    };
  }, []);

  if (!active) return null;
  return <SAMAssistant />;
}

export default SAMAssistantWrapper;
