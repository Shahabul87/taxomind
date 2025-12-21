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
export { db, getDb, getDbMetrics, checkDatabaseHealth } from './db-pooled';

// For backward compatibility, also export as default
export { db as default } from './db-pooled'; 
