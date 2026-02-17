/**
 * Injectable Database Provider for SAM Store Adapters
 *
 * All store files import `getDb()` from this module instead of importing
 * `db` directly from `@/lib/db`. This enables:
 *
 * 1. Test isolation via `withScopedDb(mockPrisma, () => { ... })`
 * 2. True dependency injection without changing store class constructors
 * 3. Zero breaking changes — `getDb()` returns the same default `db` at runtime
 *
 * @example
 * // In store files:
 * import { getDb } from './db-provider';
 * const user = await getDb().user.findUnique({ where: { id } });
 *
 * // In tests:
 * import { withScopedDb } from '@/lib/sam/stores/db-provider';
 * withScopedDb(mockPrisma, () => {
 *   const store = createPrismaGoalStore();
 *   // store now uses mockPrisma internally
 * });
 */

import { db as defaultDb } from '@/lib/db';

type PrismaClient = typeof defaultDb;

/** Scoped DB override for test isolation */
let scopedDb: PrismaClient | null = null;

/**
 * Get the active Prisma client.
 * Returns the scoped override if set, otherwise the default singleton.
 */
export function getDb(): PrismaClient {
  return scopedDb ?? defaultDb;
}

/**
 * Run a callback with a scoped DB instance (for testing).
 * Restores the previous scope on completion, even if `fn` throws.
 *
 * NOT for production use — intended for unit/integration test isolation.
 */
export function withScopedDb<T>(prisma: PrismaClient, fn: () => T): T {
  const prev = scopedDb;
  scopedDb = prisma;
  try {
    return fn();
  } finally {
    scopedDb = prev;
  }
}

export type { PrismaClient };
