/**
 * Tests for SAM Feature Flags extensions (Gaps 2 & 3)
 *
 * Verifies the new MULTI_AGENT_COORDINATION and REALTIME_INTERVENTIONS flags.
 */

describe('SAM Feature Flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('MULTI_AGENT_COORDINATION flag', () => {
    it('should be disabled by default', async () => {
      delete process.env.SAM_MULTI_AGENT_COORDINATION;
      const { SAM_FEATURES } = await import('@/lib/sam/feature-flags');
      expect(SAM_FEATURES.MULTI_AGENT_COORDINATION).toBe(false);
    });

    it('should be enabled when explicitly set to true', async () => {
      process.env.SAM_MULTI_AGENT_COORDINATION = 'true';
      const { SAM_FEATURES } = await import('@/lib/sam/feature-flags');
      expect(SAM_FEATURES.MULTI_AGENT_COORDINATION).toBe(true);
    });

    it('should be disabled when explicitly set to false', async () => {
      process.env.SAM_MULTI_AGENT_COORDINATION = 'false';
      const { SAM_FEATURES } = await import('@/lib/sam/feature-flags');
      expect(SAM_FEATURES.MULTI_AGENT_COORDINATION).toBe(false);
    });
  });

  describe('REALTIME_INTERVENTIONS flag', () => {
    it('should be disabled by default', async () => {
      delete process.env.SAM_REALTIME_INTERVENTIONS;
      const { SAM_FEATURES } = await import('@/lib/sam/feature-flags');
      expect(SAM_FEATURES.REALTIME_INTERVENTIONS).toBe(false);
    });

    it('should be enabled when explicitly set to true', async () => {
      process.env.SAM_REALTIME_INTERVENTIONS = 'true';
      const { SAM_FEATURES } = await import('@/lib/sam/feature-flags');
      expect(SAM_FEATURES.REALTIME_INTERVENTIONS).toBe(true);
    });
  });

  describe('FEATURE_DEPENDENCIES', () => {
    it('should include entries for new flags', async () => {
      const { FEATURE_DEPENDENCIES } = await import('@/lib/sam/feature-flags');
      expect(FEATURE_DEPENDENCIES).toHaveProperty('MULTI_AGENT_COORDINATION');
      expect(FEATURE_DEPENDENCIES).toHaveProperty('REALTIME_INTERVENTIONS');
    });

    it('new flags should have no dependencies', async () => {
      const { FEATURE_DEPENDENCIES } = await import('@/lib/sam/feature-flags');
      expect(FEATURE_DEPENDENCIES.MULTI_AGENT_COORDINATION).toEqual([]);
      expect(FEATURE_DEPENDENCIES.REALTIME_INTERVENTIONS).toEqual([]);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should work with new feature keys', async () => {
      delete process.env.SAM_MULTI_AGENT_COORDINATION;
      const { isFeatureEnabled } = await import('@/lib/sam/feature-flags');
      expect(isFeatureEnabled('MULTI_AGENT_COORDINATION')).toBe(false);
      expect(isFeatureEnabled('REALTIME_INTERVENTIONS')).toBe(false);
    });
  });

  describe('getEnabledFeatures', () => {
    it('should not include new flags when disabled', async () => {
      delete process.env.SAM_MULTI_AGENT_COORDINATION;
      delete process.env.SAM_REALTIME_INTERVENTIONS;
      const { getEnabledFeatures } = await import('@/lib/sam/feature-flags');
      const enabled = getEnabledFeatures();
      expect(enabled).not.toContain('MULTI_AGENT_COORDINATION');
      expect(enabled).not.toContain('REALTIME_INTERVENTIONS');
    });
  });

  describe('canEnableFeature', () => {
    it('should return true for new flags (no dependencies)', async () => {
      const { canEnableFeature } = await import('@/lib/sam/feature-flags');
      expect(canEnableFeature('MULTI_AGENT_COORDINATION')).toBe(true);
      expect(canEnableFeature('REALTIME_INTERVENTIONS')).toBe(true);
    });
  });
});
