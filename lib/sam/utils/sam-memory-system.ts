/**
 * SAM Memory System
 *
 * This module now uses the persistent client adapter instead of the in-memory stub.
 * The adapter provides the same API but persists data via API routes to the database.
 *
 * @see ./sam-memory-client.ts for the implementation
 * @see /api/sam/wizard-memory for the API route
 */

export { samMemory } from './sam-memory-client';
