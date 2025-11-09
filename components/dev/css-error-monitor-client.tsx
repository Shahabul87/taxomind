'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Client-side wrapper for CSS Error Monitor
const CSSErrorMonitor = dynamic(
  () => import('./css-error-monitor').then(mod => mod.CSSErrorMonitor),
  { ssr: false }
);

export function CSSErrorMonitorClient() {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Only check environment on client side to avoid hydration mismatch
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  if (!isDev) {
    return null;
  }

  return <CSSErrorMonitor />;
}