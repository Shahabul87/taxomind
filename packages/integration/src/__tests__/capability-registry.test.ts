/**
 * Tests for @sam-ai/integration - Capability Registry
 * Covers: CapabilityRegistry (profile access, capability checks, feature flags, tools, limits)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CapabilityRegistry, createCapabilityRegistry } from '../registry/capability-registry';
import { ProfileBuilder } from '../detection/profile-builder';
import type { IntegrationProfile } from '../types/profile';

function createTestProfile(configure?: (builder: ProfileBuilder) => void): IntegrationProfile {
  const builder = new ProfileBuilder('test-profile', 'Test Profile')
    .prisma({ supportsVectors: true })
    .pgvector()
    .nextAuth(['admin', 'user'])
    .anthropic()
    .websocket()
    .allFeatures();

  if (configure) configure(builder);
  return builder.build();
}

describe('CapabilityRegistry', () => {
  let registry: CapabilityRegistry;
  let profile: IntegrationProfile;

  beforeEach(() => {
    profile = createTestProfile();
    registry = new CapabilityRegistry(profile);
  });

  describe('profile access', () => {
    it('returns the integration profile', () => {
      expect(registry.getProfile()).toBe(profile);
    });

    it('returns profile ID', () => {
      expect(registry.getProfileId()).toBe('test-profile');
    });

    it('returns profile name', () => {
      expect(registry.getProfileName()).toBe('Test Profile');
    });

    it('updates profile', () => {
      registry.updateProfile({ version: '2.0.0' });
      expect(registry.getProfile().version).toBe('2.0.0');
    });
  });

  describe('database capabilities', () => {
    it('reports database available', () => {
      expect(registry.hasDatabase()).toBe(true);
    });

    it('returns database capability', () => {
      const db = registry.getDatabase();
      expect(db.type).toBe('prisma');
      expect(db.supportsTransactions).toBe(true);
    });

    it('reports vector database available', () => {
      expect(registry.hasVectorDatabase()).toBe(true);
    });

    it('reports vector database unavailable when not configured', () => {
      const noVectorProfile = createTestProfile((b) => b.database({ supportsVectors: false, vectorAdapter: 'none' }));
      const reg = new CapabilityRegistry(noVectorProfile);
      expect(reg.hasVectorDatabase()).toBe(false);
    });

    it('reports transaction support', () => {
      expect(registry.supportsTransactions()).toBe(true);
    });
  });

  describe('auth capabilities', () => {
    it('reports auth available', () => {
      expect(registry.hasAuth()).toBe(true);
    });

    it('returns available roles', () => {
      expect(registry.getAvailableRoles()).toContain('admin');
      expect(registry.getAvailableRoles()).toContain('user');
    });

    it('reports multi-tenant not supported', () => {
      expect(registry.supportsMultiTenant()).toBe(false);
    });
  });

  describe('AI capabilities', () => {
    it('reports AI available', () => {
      expect(registry.hasAI()).toBe(true);
    });

    it('returns chat provider', () => {
      expect(registry.getChatProvider()).toBe('anthropic');
    });

    it('returns embedding provider', () => {
      expect(registry.getEmbeddingProvider()).toBe('openai');
    });

    it('reports streaming support', () => {
      expect(registry.supportsStreaming()).toBe(true);
    });

    it('reports function calling support', () => {
      expect(registry.supportsFunctionCalling()).toBe(true);
    });
  });

  describe('realtime capabilities', () => {
    it('reports realtime available', () => {
      expect(registry.hasRealtime()).toBe(true);
    });

    it('returns realtime type', () => {
      expect(registry.getRealtimeType()).toBe('websocket');
    });

    it('reports presence support', () => {
      expect(registry.supportsPresence()).toBe(true);
    });
  });

  describe('notification capabilities', () => {
    it('reports notifications available', () => {
      expect(registry.hasNotifications()).toBe(true);
    });

    it('returns notification channels', () => {
      const channels = registry.getNotificationChannels();
      expect(channels).toContain('in_app');
    });
  });

  describe('feature flags', () => {
    it('checks feature is enabled', () => {
      expect(registry.isFeatureEnabled('goalPlanning')).toBe(true);
    });

    it('overrides feature flag', () => {
      registry.setFeatureOverride('goalPlanning', false);
      expect(registry.isFeatureEnabled('goalPlanning')).toBe(false);
    });

    it('clears feature overrides', () => {
      registry.setFeatureOverride('goalPlanning', false);
      registry.clearFeatureOverrides();
      expect(registry.isFeatureEnabled('goalPlanning')).toBe(true);
    });
  });

  describe('feature availability', () => {
    it('reports all features available with full profile', () => {
      const availability = registry.getFeatureAvailability();
      expect(availability.goalPlanning.available).toBe(true);
      expect(availability.toolExecution.available).toBe(true);
      expect(availability.learningAnalytics.available).toBe(true);
    });

    it('reports goal planning unavailable without AI', () => {
      const noAiProfile = createTestProfile((b) => b.ai({ available: false }));
      const reg = new CapabilityRegistry(noAiProfile);
      const availability = reg.getFeatureAvailability();

      expect(availability.goalPlanning.available).toBe(false);
      expect(availability.goalPlanning.reason).toContain('AI required');
    });

    it('reports tool execution unavailable without auth', () => {
      const noAuthProfile = createTestProfile((b) => b.noAuth());
      const reg = new CapabilityRegistry(noAuthProfile);
      const availability = reg.getFeatureAvailability();

      expect(availability.toolExecution.available).toBe(false);
      expect(availability.toolExecution.reason).toContain('Auth required');
    });

    it('reports realTimeSync unavailable without realtime', () => {
      const noRtProfile = createTestProfile((b) => b.noRealtime());
      const reg = new CapabilityRegistry(noRtProfile);
      const availability = reg.getFeatureAvailability();

      expect(availability.realTimeSync.available).toBe(false);
    });

    it('reports feature unavailable when disabled in profile', () => {
      const noGoalProfile = createTestProfile((b) => b.features({ goalPlanning: false }));
      const reg = new CapabilityRegistry(noGoalProfile);
      const availability = reg.getFeatureAvailability();

      expect(availability.goalPlanning.available).toBe(false);
      expect(availability.goalPlanning.reason).toContain('disabled');
    });
  });

  describe('tool configuration', () => {
    it('returns undefined for non-existent tool', () => {
      expect(registry.getToolConfig('unknown')).toBeUndefined();
    });

    it('reports tool disabled when not found', () => {
      expect(registry.isToolEnabled('unknown')).toBe(false);
    });

    it('returns enabled tools (empty by default)', () => {
      const tools = registry.getEnabledTools();
      expect(Array.isArray(tools)).toBe(true);
    });
  });

  describe('environment', () => {
    it('reports runtime', () => {
      expect(registry.getRuntime()).toBe('node');
    });

    it('reports framework', () => {
      // ProfileBuilder default
      expect(registry.getFramework()).toBeDefined();
    });
  });

  describe('limits', () => {
    it('returns undefined for unconfigured limits', () => {
      expect(registry.getLimit('maxGoalsPerUser')).toBeUndefined();
    });

    it('checks if within limit (undefined means no limit)', () => {
      expect(registry.isWithinLimit('maxGoalsPerUser', 100)).toBe(true);
    });
  });

  describe('factory function', () => {
    it('creates a CapabilityRegistry', () => {
      const reg = createCapabilityRegistry(profile);
      expect(reg).toBeInstanceOf(CapabilityRegistry);
    });
  });
});
