/**
 * Tests for @sam-ai/integration - Profile Builder
 * Covers: ProfileBuilder (fluent API, presets, build)
 */

import { describe, it, expect } from 'vitest';
import { ProfileBuilder, createProfileBuilder, createTaxomindProfile } from '../detection/profile-builder';

describe('ProfileBuilder', () => {
  it('creates a profile with id and name', () => {
    const profile = new ProfileBuilder('test', 'Test Profile').build();

    expect(profile.id).toBe('test');
    expect(profile.name).toBe('Test Profile');
    expect(profile.version).toBe('1.0.0');
  });

  it('sets version and description', () => {
    const profile = new ProfileBuilder('test', 'Test')
      .version('2.0.0')
      .description('A test profile')
      .build();

    expect(profile.version).toBe('2.0.0');
    expect(profile.description).toBe('A test profile');
  });

  describe('environment', () => {
    it('sets nextjs framework', () => {
      const profile = new ProfileBuilder('test', 'Test').nextjs().build();
      expect(profile.environment.framework).toBe('nextjs');
    });

    it('sets express framework', () => {
      const profile = new ProfileBuilder('test', 'Test').express().build();
      expect(profile.environment.framework).toBe('express');
    });

    it('sets standalone framework', () => {
      const profile = new ProfileBuilder('test', 'Test').standalone().build();
      expect(profile.environment.framework).toBe('standalone');
    });
  });

  describe('database', () => {
    it('configures prisma database', () => {
      const profile = new ProfileBuilder('test', 'Test').prisma().build();

      expect(profile.capabilities.database.available).toBe(true);
      expect(profile.capabilities.database.type).toBe('prisma');
      expect(profile.capabilities.database.supportsTransactions).toBe(true);
    });

    it('configures prisma with pgvector', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .prisma({ supportsVectors: true })
        .pgvector()
        .build();

      expect(profile.capabilities.database.supportsVectors).toBe(true);
      expect(profile.capabilities.database.vectorAdapter).toBe('pgvector');
    });

    it('configures in-memory database', () => {
      const profile = new ProfileBuilder('test', 'Test').inMemoryDatabase().build();

      expect(profile.capabilities.database.type).toBe('in_memory');
      expect(profile.capabilities.database.supportsTransactions).toBe(false);
    });
  });

  describe('auth', () => {
    it('configures nextAuth', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .nextAuth(['admin', 'user'])
        .build();

      expect(profile.capabilities.auth.available).toBe(true);
      expect(profile.capabilities.auth.provider).toBe('nextauth');
      expect(profile.capabilities.auth.roles).toContain('admin');
    });

    it('configures clerk', () => {
      const profile = new ProfileBuilder('test', 'Test').clerk().build();

      expect(profile.capabilities.auth.provider).toBe('clerk');
      expect(profile.capabilities.auth.supportsMultiTenant).toBe(true);
    });

    it('configures no auth', () => {
      const profile = new ProfileBuilder('test', 'Test').noAuth().build();

      expect(profile.capabilities.auth.available).toBe(false);
      expect(profile.capabilities.auth.provider).toBe('anonymous');
    });
  });

  describe('AI', () => {
    it('configures anthropic', () => {
      const profile = new ProfileBuilder('test', 'Test').anthropic().build();

      expect(profile.capabilities.ai.available).toBe(true);
      expect(profile.capabilities.ai.chatProvider).toBe('anthropic');
      expect(profile.capabilities.ai.supportsStreaming).toBe(true);
    });

    it('configures openai', () => {
      const profile = new ProfileBuilder('test', 'Test').openai().build();

      expect(profile.capabilities.ai.chatProvider).toBe('openai');
      expect(profile.capabilities.ai.embeddingProvider).toBe('openai');
    });

    it('configures openai embeddings', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .anthropic()
        .openaiEmbeddings()
        .build();

      expect(profile.capabilities.ai.chatProvider).toBe('anthropic');
      expect(profile.capabilities.ai.embeddingProvider).toBe('openai');
    });
  });

  describe('realtime', () => {
    it('configures websocket', () => {
      const profile = new ProfileBuilder('test', 'Test').websocket().build();

      expect(profile.capabilities.realtime.available).toBe(true);
      expect(profile.capabilities.realtime.type).toBe('websocket');
      expect(profile.capabilities.realtime.supportsPresence).toBe(true);
      expect(profile.features.realTimeSync).toBe(true);
    });

    it('configures SSE', () => {
      const profile = new ProfileBuilder('test', 'Test').sse().build();

      expect(profile.capabilities.realtime.type).toBe('sse');
      expect(profile.capabilities.realtime.supportsPresence).toBe(false);
    });

    it('configures no realtime', () => {
      const profile = new ProfileBuilder('test', 'Test').noRealtime().build();

      expect(profile.capabilities.realtime.available).toBe(false);
      expect(profile.features.realTimeSync).toBe(false);
    });
  });

  describe('notifications', () => {
    it('adds email channel', () => {
      const profile = new ProfileBuilder('test', 'Test').email().build();
      expect(profile.capabilities.notifications.channels).toContain('email');
    });

    it('adds push channel', () => {
      const profile = new ProfileBuilder('test', 'Test').push().build();
      expect(profile.capabilities.notifications.channels).toContain('push');
    });

    it('does not duplicate channels', () => {
      const profile = new ProfileBuilder('test', 'Test').email().email().build();
      const emailCount = profile.capabilities.notifications.channels.filter((c) => c === 'email').length;
      expect(emailCount).toBe(1);
    });
  });

  describe('cache and queue', () => {
    it('configures redis', () => {
      const profile = new ProfileBuilder('test', 'Test').redis().build();

      expect(profile.capabilities.cache.available).toBe(true);
      expect(profile.capabilities.cache.type).toBe('redis');
      expect(profile.capabilities.queue.available).toBe(true);
      expect(profile.capabilities.queue.type).toBe('bullmq');
    });
  });

  describe('features', () => {
    it('enables all features', () => {
      const profile = new ProfileBuilder('test', 'Test').allFeatures().build();

      expect(profile.features.goalPlanning).toBe(true);
      expect(profile.features.toolExecution).toBe(true);
      expect(profile.features.learningAnalytics).toBe(true);
    });

    it('sets minimal features', () => {
      const profile = new ProfileBuilder('test', 'Test').minimalFeatures().build();

      expect(profile.features.goalPlanning).toBe(false);
      expect(profile.features.selfEvaluation).toBe(true);
      expect(profile.features.memorySystem).toBe(false);
    });

    it('sets individual features', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .features({ goalPlanning: false, knowledgeGraph: false })
        .build();

      expect(profile.features.goalPlanning).toBe(false);
      expect(profile.features.knowledgeGraph).toBe(false);
    });
  });

  describe('data sources', () => {
    it('adds curriculum data source', () => {
      const profile = new ProfileBuilder('test', 'Test').curriculum().build();

      expect(profile.dataSources).toHaveLength(1);
      expect(profile.dataSources[0].type).toBe('curriculum');
      expect(profile.dataSources[0].enabled).toBe(true);
    });

    it('adds user history data source', () => {
      const profile = new ProfileBuilder('test', 'Test').userHistory().build();

      expect(profile.dataSources).toHaveLength(1);
      expect(profile.dataSources[0].type).toBe('user_history');
    });
  });

  describe('metadata', () => {
    it('adds tags', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .tags('lms', 'education')
        .build();

      expect(profile.metadata.tags).toContain('lms');
      expect(profile.metadata.tags).toContain('education');
    });

    it('adds custom data', () => {
      const profile = new ProfileBuilder('test', 'Test')
        .customData({ tenant: 'acme' })
        .build();

      expect(profile.metadata.customData?.tenant).toBe('acme');
    });
  });

  describe('factory functions', () => {
    it('createProfileBuilder creates a builder', () => {
      const builder = createProfileBuilder('test', 'Test');
      expect(builder).toBeInstanceOf(ProfileBuilder);
    });

    it('createTaxomindProfile creates a Taxomind-specific profile', () => {
      const builder = createTaxomindProfile();
      const profile = builder.build();

      expect(profile.id).toBe('taxomind');
      expect(profile.name).toBe('Taxomind LMS');
      expect(profile.capabilities.database.type).toBe('prisma');
      expect(profile.capabilities.auth.provider).toBe('nextauth');
      expect(profile.capabilities.ai.chatProvider).toBe('anthropic');
      expect(profile.dataSources.length).toBeGreaterThan(0);
      expect(profile.metadata.tags).toContain('lms');
    });
  });
});
