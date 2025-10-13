/**
 * Admin Authentication API Handlers - Phase 2
 *
 * Separate API endpoint for admin authentication: /api/admin-auth/*
 * Uses admin-specific NextAuth instance with:
 * - Different session cookie (admin-session-token)
 * - Shorter session duration (4 hours)
 * - Enhanced security logging
 * - Mandatory role verification
 */

import { adminHandlers } from "@/auth.admin";

// Export NextAuth handlers for admin authentication
export const { GET, POST } = adminHandlers;
