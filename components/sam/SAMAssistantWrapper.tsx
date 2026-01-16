'use client';

/**
 * SAMAssistantWrapper
 *
 * Client-side wrapper for SAMAssistant that uses dynamic import with SSR disabled.
 * This prevents server-only modules (like lib/sam/realtime/index.ts) from being
 * bundled into the client bundle.
 */

import dynamic from 'next/dynamic';

const SAMAssistant = dynamic(
  () => import('./SAMAssistant').then(mod => mod.SAMAssistant),
  { ssr: false }
);

export function SAMAssistantWrapper() {
  return <SAMAssistant />;
}

export default SAMAssistantWrapper;
