'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/web-vitals'

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring on client side only
    if (typeof window !== 'undefined') {
      initWebVitals()
    }
  }, [])

  return <>{children}</>
}