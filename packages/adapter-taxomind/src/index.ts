/**
 * @sam-ai/adapter-taxomind - Taxomind Adapter Package
 *
 * This package provides concrete adapter implementations for the
 * Taxomind LMS, bridging SAM AI's integration layer with Taxomind's
 * specific infrastructure (Prisma, NextAuth, PgVector, Anthropic).
 *
 * Key Components:
 * - TaxomindIntegrationProfile: Complete profile for Taxomind LMS
 * - PrismaDatabaseAdapter: Database operations via Prisma
 * - NextAuthAdapter: Authentication via NextAuth.js
 * - AnthropicAIAdapter: AI chat via Claude API
 * - SAMVectorEmbeddingAdapter: Vector storage via SAMVectorEmbedding table
 * - PgVectorAdapter: Vector search via PostgreSQL pgvector
 * - TaxomindVectorService: Combined embedding + vector storage
 */

import type { PrismaClient } from '@prisma/client';
import {
  AdapterFactory,
  CapabilityRegistry,
  type IntegrationProfile,
} from '@sam-ai/integration';

// ============================================================================
// EXPORTS
// ============================================================================

export * from './profile';
export * from './adapters';

// ============================================================================
// TAXOMIND INTEGRATION BOOTSTRAP
// ============================================================================

import {
  createTaxomindIntegrationProfile,
  TAXOMIND_PROFILE_ID,
  TAXOMIND_PROFILE_VERSION,
} from './profile/taxomind-profile';

import {
  createPrismaDatabaseAdapter,
  PrismaDatabaseAdapter,
} from './adapters/prisma-database-adapter';

import {
  createNextAuthAdapter,
  NextAuthAdapter,
} from './adapters/nextauth-adapter';

import {
  createAnthropicAIAdapter,
  createTaxomindAIService,
  AnthropicAIAdapter,
  TaxomindAIService,
} from './adapters/anthropic-ai-adapter';

import { TaxomindVectorService } from './adapters/pgvector-adapter';
import { createTaxomindSAMVectorService } from './adapters/sam-vector-embedding-adapter';

// ============================================================================
// TAXOMIND INTEGRATION CONTEXT
// ============================================================================

/**
 * Complete Taxomind integration context
 * Contains all adapters and the integration profile
 */
export interface TaxomindIntegrationContext {
  profile: IntegrationProfile;
  registry: CapabilityRegistry;
  factory: AdapterFactory;
  adapters: {
    database: PrismaDatabaseAdapter;
    auth: NextAuthAdapter;
    ai: AnthropicAIAdapter;
    aiService: TaxomindAIService;
    vector: TaxomindVectorService;
  };
}

/**
 * Options for initializing Taxomind integration
 */
export interface TaxomindIntegrationOptions {
  prisma: PrismaClient;
  isDevelopment?: boolean;
  region?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

/**
 * Initialize complete Taxomind integration
 * This is the main entry point for integrating SAM with Taxomind
 */
export function initializeTaxomindIntegration(
  options: TaxomindIntegrationOptions
): TaxomindIntegrationContext {
  // Create the integration profile
  const profile = createTaxomindIntegrationProfile({
    isDevelopment: options.isDevelopment,
    region: options.region,
  });

  // Create capability registry
  const registry = new CapabilityRegistry(profile);

  // Create adapter factory
  const factory = new AdapterFactory(profile);

  // Create adapters
  const database = createPrismaDatabaseAdapter(options.prisma);
  const auth = createNextAuthAdapter(options.prisma);
  const ai = createAnthropicAIAdapter({
    apiKey: options.anthropicApiKey,
  });
  const aiService = createTaxomindAIService({
    anthropicApiKey: options.anthropicApiKey,
    openaiApiKey: options.openaiApiKey,
  });
  const vector = createTaxomindSAMVectorService(options.prisma, {
    openaiApiKey: options.openaiApiKey,
  });

  // Register adapters with factory using provider functions
  factory.registerDatabaseAdapter(() => database);
  factory.registerAuthAdapter(() => auth);
  factory.registerAIAdapter(() => ai);
  factory.registerVectorAdapter(() => vector.getAdapter());
  factory.registerEmbeddingAdapter(() => vector.getEmbeddingProvider());

  return {
    profile,
    registry,
    factory,
    adapters: {
      database,
      auth,
      ai,
      aiService,
      vector,
    },
  };
}

// ============================================================================
// SINGLETON MANAGEMENT
// ============================================================================

let _integrationContext: TaxomindIntegrationContext | null = null;

/**
 * Get the singleton Taxomind integration context
 * Must be initialized first with initializeTaxomindIntegration
 */
export function getTaxomindIntegration(): TaxomindIntegrationContext {
  if (!_integrationContext) {
    throw new Error(
      'Taxomind integration not initialized. Call initializeTaxomindIntegration first.'
    );
  }
  return _integrationContext;
}

/**
 * Set the singleton Taxomind integration context
 */
export function setTaxomindIntegration(
  context: TaxomindIntegrationContext
): void {
  _integrationContext = context;
}

/**
 * Initialize and set the singleton context
 */
export function bootstrapTaxomindIntegration(
  options: TaxomindIntegrationOptions
): TaxomindIntegrationContext {
  const context = initializeTaxomindIntegration(options);
  setTaxomindIntegration(context);
  return context;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export { TAXOMIND_PROFILE_ID, TAXOMIND_PROFILE_VERSION };

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '0.1.0';
