'use client';

import dynamic from 'next/dynamic';

// Client-side wrapper for CSS Error Monitor
const CSSErrorMonitor = dynamic(
  () => import('./css-error-monitor').then(mod => mod.CSSErrorMonitor),
  { ssr: false }
);

export function CSSErrorMonitorClient() {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return <CSSErrorMonitor />;
}