/**
 * SAM Integration Profile Helpers
 * Provides Taxomind-specific integration profile and capability registry.
 */

import { createTaxomindIntegrationProfile } from '@sam-ai/adapter-taxomind';
import {
  createCapabilityRegistry,
  type CapabilityRegistry,
  type IntegrationProfile,
} from '@sam-ai/integration';

let cachedProfile: IntegrationProfile | null = null;
let cachedRegistry: CapabilityRegistry | null = null;

function getBaseProfile(): IntegrationProfile {
  if (!cachedProfile) {
    cachedProfile = createTaxomindIntegrationProfile();
  }
  return cachedProfile;
}

export function getSAMIntegrationProfile(
  featureOverrides?: Partial<IntegrationProfile['features']>
): IntegrationProfile {
  const baseProfile = getBaseProfile();
  if (!featureOverrides || Object.keys(featureOverrides).length === 0) {
    return baseProfile;
  }

  return {
    ...baseProfile,
    features: {
      ...baseProfile.features,
      ...featureOverrides,
    },
  };
}

export function getSAMCapabilityRegistry(
  profile?: IntegrationProfile
): CapabilityRegistry {
  const resolvedProfile = profile ?? getBaseProfile();

  if (resolvedProfile === cachedProfile) {
    if (!cachedRegistry) {
      cachedRegistry = createCapabilityRegistry(resolvedProfile);
    }
    return cachedRegistry;
  }

  return createCapabilityRegistry(resolvedProfile);
}
