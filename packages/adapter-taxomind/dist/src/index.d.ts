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
import { AdapterFactory, CapabilityRegistry, type IntegrationProfile } from '@sam-ai/integration';
export * from './profile';
export * from './adapters';
import { TAXOMIND_PROFILE_ID, TAXOMIND_PROFILE_VERSION } from './profile/taxomind-profile';
import { PrismaDatabaseAdapter } from './adapters/prisma-database-adapter';
import { NextAuthAdapter } from './adapters/nextauth-adapter';
import { AnthropicAIAdapter, TaxomindAIService } from './adapters/anthropic-ai-adapter';
import { TaxomindVectorService } from './adapters/pgvector-adapter';
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
export declare function initializeTaxomindIntegration(options: TaxomindIntegrationOptions): TaxomindIntegrationContext;
/**
 * Get the singleton Taxomind integration context
 * Must be initialized first with initializeTaxomindIntegration
 */
export declare function getTaxomindIntegration(): TaxomindIntegrationContext;
/**
 * Set the singleton Taxomind integration context
 */
export declare function setTaxomindIntegration(context: TaxomindIntegrationContext): void;
/**
 * Initialize and set the singleton context
 */
export declare function bootstrapTaxomindIntegration(options: TaxomindIntegrationOptions): TaxomindIntegrationContext;
export { TAXOMIND_PROFILE_ID, TAXOMIND_PROFILE_VERSION };
export declare const VERSION = "0.1.0";
//# sourceMappingURL=index.d.ts.map