'use client';

import { type ReactNode } from 'react';
import {
  isDashboardFeatureEnabled,
  type DashboardFeatureFlag,
} from './feature-flags';

interface FeatureGateProps {
  /** The feature flag key that controls visibility */
  feature: DashboardFeatureFlag;
  /** Content to render when the feature is enabled */
  children: ReactNode;
  /** Optional fallback to render when the feature is disabled */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on a dashboard feature flag.
 *
 * When disabled, nothing is rendered and the children bundle
 * should be loaded via `next/dynamic` so it is code-split away.
 *
 * @example
 * ```tsx
 * <FeatureGate feature="CAREER_TAB_ENABLED">
 *   <CareerTab />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  if (!isDashboardFeatureEnabled(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
