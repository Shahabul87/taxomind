/**
 * Taxomind Prisma Database Adapter
 *
 * Provides a singleton database adapter configured for Taxomind's Prisma schema.
 */

import {
  createPrismaSAMAdapter,
  type PrismaSAMAdapterConfig,
} from '@sam-ai/adapter-prisma';
import type { SAMDatabaseAdapter } from '@sam-ai/core';
import { db } from '@/lib/db';

// ============================================================================
// ADAPTER CONFIGURATION
// ============================================================================

/**
 * Taxomind-specific Prisma adapter configuration
 * Maps Taxomind's Prisma schema model names to SAM's expected names
 */
const TAXOMIND_PRISMA_CONFIG: PrismaSAMAdapterConfig = {
  prisma: db as unknown as PrismaSAMAdapterConfig['prisma'],
  debug: process.env.NODE_ENV === 'development',
  modelNames: {
    user: 'user',
    course: 'course',
    chapter: 'chapter',
    section: 'section',
    questionBank: 'questionBank',
    studentBloomsProgress: 'studentBloomsProgress',
    cognitiveSkillProgress: 'cognitiveSkillProgress',
    samInteraction: 'sAMInteraction',
    courseBloomsAnalysis: 'courseBloomsAnalysis',
  },
};

// ============================================================================
// SINGLETON ADAPTER
// ============================================================================

let taxomindAdapter: SAMDatabaseAdapter | null = null;

/**
 * Create or get the Taxomind database adapter
 */
export function createTaxomindDatabaseAdapter(): SAMDatabaseAdapter {
  if (!taxomindAdapter) {
    taxomindAdapter = createPrismaSAMAdapter(TAXOMIND_PRISMA_CONFIG);
  }
  return taxomindAdapter;
}

/**
 * Get the Taxomind database adapter (alias for convenience)
 */
export function getTaxomindDatabaseAdapter(): SAMDatabaseAdapter {
  return createTaxomindDatabaseAdapter();
}

/**
 * Reset the adapter (for testing)
 */
export function resetTaxomindDatabaseAdapter(): void {
  taxomindAdapter = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check if the database is connected
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const adapter = createTaxomindDatabaseAdapter();
    return adapter.healthCheck();
  } catch {
    return false;
  }
}

/**
 * Get a raw Prisma client for complex queries
 * Use sparingly - prefer the adapter methods when possible
 */
export function getRawPrismaClient() {
  return db;
}
