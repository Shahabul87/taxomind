/**
 * Tests for @sam-ai/adapter-taxomind - Taxomind Profile
 * Covers: createTaxomindIntegrationProfile, entity mappings, tool configs, data sources, constants
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTaxomindIntegrationProfile,
  taxomindEntityMappings,
  taxomindToolConfigurations,
  taxomindDataSources,
  TAXOMIND_PROFILE_ID,
  TAXOMIND_PROFILE_VERSION,
} from '../profile/taxomind-profile';

describe('Taxomind Profile', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createTaxomindIntegrationProfile', () => {
    it('creates a profile with correct identity', () => {
      const profile = createTaxomindIntegrationProfile();

      expect(profile.id).toBe('taxomind-lms');
      expect(profile.name).toBe('Taxomind LMS');
      expect(profile.version).toBe('1.0.0');
      expect(profile.description).toContain('Taxomind');
    });

    it('sets environment framework to nextjs', () => {
      const profile = createTaxomindIntegrationProfile();

      expect(profile.environment.framework).toBe('nextjs');
      expect(profile.environment.runtime).toBe('node');
    });

    it('detects development mode from options', () => {
      const profile = createTaxomindIntegrationProfile({ isDevelopment: true });

      expect(profile.environment.isDevelopment).toBe(true);
    });

    it('detects development mode from NODE_ENV', () => {
      process.env.NODE_ENV = 'development';
      const profile = createTaxomindIntegrationProfile();

      expect(profile.environment.isDevelopment).toBe(true);
    });

    it('detects production mode', () => {
      process.env.NODE_ENV = 'production';
      const profile = createTaxomindIntegrationProfile();

      expect(profile.environment.isProduction).toBe(true);
    });

    it('sets region from options', () => {
      const profile = createTaxomindIntegrationProfile({ region: 'us-east-1' });

      expect(profile.environment.region).toBe('us-east-1');
    });

    it('detects region from RAILWAY_REGION env', () => {
      process.env.RAILWAY_REGION = 'us-west-2';
      const profile = createTaxomindIntegrationProfile();

      expect(profile.environment.region).toBe('us-west-2');
    });

    describe('database capabilities', () => {
      it('configures prisma with pgvector', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.capabilities.database.available).toBe(true);
        expect(profile.capabilities.database.type).toBe('prisma');
        expect(profile.capabilities.database.supportsTransactions).toBe(true);
        expect(profile.capabilities.database.supportsVectors).toBe(true);
        expect(profile.capabilities.database.vectorAdapter).toBe('pgvector');
      });
    });

    describe('auth capabilities', () => {
      it('configures nextauth with roles', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.capabilities.auth.available).toBe(true);
        expect(profile.capabilities.auth.provider).toBe('nextauth');
        expect(profile.capabilities.auth.roles).toContain('ADMIN');
        expect(profile.capabilities.auth.roles).toContain('USER');
        expect(profile.capabilities.auth.roles).toContain('TEACHER');
        expect(profile.capabilities.auth.sessionStrategy).toBe('jwt');
      });
    });

    describe('AI capabilities', () => {
      it('configures anthropic chat with openai embeddings', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.capabilities.ai.available).toBe(true);
        expect(profile.capabilities.ai.chatProvider).toBe('anthropic');
        expect(profile.capabilities.ai.embeddingProvider).toBe('openai');
        expect(profile.capabilities.ai.supportsStreaming).toBe(true);
        expect(profile.capabilities.ai.supportsFunctionCalling).toBe(true);
      });
    });

    describe('realtime capabilities', () => {
      it('configures websocket with presence', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.capabilities.realtime.available).toBe(true);
        expect(profile.capabilities.realtime.type).toBe('websocket');
        expect(profile.capabilities.realtime.supportsPresence).toBe(true);
      });
    });

    describe('features', () => {
      it('enables all major features', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.features.goalPlanning).toBe(true);
        expect(profile.features.toolExecution).toBe(true);
        expect(profile.features.proactiveInterventions).toBe(true);
        expect(profile.features.selfEvaluation).toBe(true);
        expect(profile.features.learningAnalytics).toBe(true);
        expect(profile.features.memorySystem).toBe(true);
        expect(profile.features.knowledgeGraph).toBe(true);
        expect(profile.features.realTimeSync).toBe(true);
      });
    });

    describe('limits', () => {
      it('sets session and tool limits', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.limits.maxSessionDuration).toBe(180);
        expect(profile.limits.maxToolCallsPerSession).toBe(100);
        expect(profile.limits.maxMemoryEntriesPerUser).toBe(50000);
      });
    });

    describe('metadata', () => {
      it('includes taxomind tags', () => {
        const profile = createTaxomindIntegrationProfile();

        expect(profile.metadata.tags).toContain('taxomind');
        expect(profile.metadata.tags).toContain('lms');
        expect(profile.metadata.tags).toContain('educational');
      });

      it('detects local deployment platform', () => {
        delete process.env.VERCEL;
        delete process.env.RAILWAY_ENVIRONMENT;
        const profile = createTaxomindIntegrationProfile();

        expect(profile.metadata.customData?.deploymentPlatform).toBe('local');
      });

      it('detects railway deployment', () => {
        process.env.RAILWAY_ENVIRONMENT = 'production';
        const profile = createTaxomindIntegrationProfile();

        expect(profile.metadata.customData?.deploymentPlatform).toBe('railway');
      });
    });
  });

  describe('taxomindEntityMappings', () => {
    it('contains all LMS entities', () => {
      const entities = Object.keys(taxomindEntityMappings);

      expect(entities).toContain('user');
      expect(entities).toContain('course');
      expect(entities).toContain('chapter');
      expect(entities).toContain('section');
      expect(entities).toContain('progress');
      expect(entities).toContain('enrollment');
    });

    it('contains all SAM entities', () => {
      const entities = Object.keys(taxomindEntityMappings);

      expect(entities).toContain('samGoal');
      expect(entities).toContain('samPlan');
      expect(entities).toContain('samMemory');
      expect(entities).toContain('samSession');
    });

    it('maps user entity to User table', () => {
      const userEntity = taxomindEntityMappings.user;

      expect(userEntity.tableName).toBe('User');
      expect(userEntity.idField).toBe('id');
      expect(userEntity.fields.email).toBeDefined();
      expect(userEntity.fields.email.required).toBe(true);
    });

    it('maps course entity correctly', () => {
      const courseEntity = taxomindEntityMappings.course;

      expect(courseEntity.tableName).toBe('Course');
      expect(courseEntity.fields.title.required).toBe(true);
      expect(courseEntity.fields.teacherId.required).toBe(true);
      expect(courseEntity.timestamps?.createdAt).toBe('createdAt');
    });
  });

  describe('taxomindToolConfigurations', () => {
    it('has all tool categories', () => {
      expect(taxomindToolConfigurations.content).toBeDefined();
      expect(taxomindToolConfigurations.assessment).toBeDefined();
      expect(taxomindToolConfigurations.communication).toBeDefined();
      expect(taxomindToolConfigurations.analytics).toBeDefined();
      expect(taxomindToolConfigurations.system).toBeDefined();
      expect(taxomindToolConfigurations.external).toBeDefined();
    });

    it('has content lookup tools', () => {
      const contentTools = taxomindToolConfigurations.content;
      const toolIds = contentTools.map((t) => t.id);

      expect(toolIds).toContain('course_lookup');
      expect(toolIds).toContain('chapter_lookup');
      expect(toolIds).toContain('section_lookup');
    });

    it('has assessment tools with correct permissions', () => {
      const assessmentTools = taxomindToolConfigurations.assessment;
      const submitTool = assessmentTools.find((t) => t.id === 'assessment_submit');

      expect(submitTool).toBeDefined();
      expect(submitTool!.requiresConfirmation).toBe(true);
      expect(submitTool!.permissionLevel).toBe('read_write');
    });

    it('has system tools for goals and memory', () => {
      const systemTools = taxomindToolConfigurations.system;
      const toolIds = systemTools.map((t) => t.id);

      expect(toolIds).toContain('memory_store');
      expect(toolIds).toContain('memory_recall');
      expect(toolIds).toContain('goal_create');
      expect(toolIds).toContain('goal_update');
    });

    it('applies rate limits to external tools', () => {
      const externalTools = taxomindToolConfigurations.external;
      const searchTool = externalTools.find((t) => t.id === 'web_search');

      expect(searchTool?.rateLimit).toBeDefined();
      expect(searchTool!.rateLimit!.maxCalls).toBe(20);
    });
  });

  describe('taxomindDataSources', () => {
    it('has curriculum, user history, external knowledge, and realtime sources', () => {
      const types = taxomindDataSources.map((ds) => ds.type);

      expect(types).toContain('curriculum');
      expect(types).toContain('user_history');
      expect(types).toContain('external_knowledge');
      expect(types).toContain('real_time');
    });

    it('enables caching for curriculum with 1 hour TTL', () => {
      const curriculum = taxomindDataSources.find((ds) => ds.type === 'curriculum');

      expect(curriculum?.cacheEnabled).toBe(true);
      expect(curriculum?.cacheTTL).toBe(3600);
    });

    it('disables realtime data source by default', () => {
      const realtime = taxomindDataSources.find((ds) => ds.type === 'real_time');

      expect(realtime?.enabled).toBe(false);
    });
  });

  describe('constants', () => {
    it('exports correct profile ID', () => {
      expect(TAXOMIND_PROFILE_ID).toBe('taxomind-lms');
    });

    it('exports correct profile version', () => {
      expect(TAXOMIND_PROFILE_VERSION).toBe('1.0.0');
    });
  });
});
