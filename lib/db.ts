// NOTE: Cannot use 'server-only' here because lib/db.ts is transitively
// imported by client components (ChatWindow → preset-tracker → db.ts).
// The import chain needs refactoring before this guard can be added.

/**
 * Database Client Export
 *
 * This file now exports the enhanced database client with connection pooling,
 * monitoring, and performance tracking.
 *
 * IMPORTANT: The database client uses lazy initialization to prevent
 * build-time and early runtime errors when DATABASE_URL isn't immediately available.
 */

// Re-export the enhanced database client
export { db, getDb, getDbMetrics, checkDatabaseHealth, getBasePrismaClient } from './db-pooled';

// For backward compatibility, also export as default
export { db as default } from './db-pooled'; 
