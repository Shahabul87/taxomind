/**
 * Stripe SDK Singleton - Enterprise Implementation
 *
 * Provides a single, validated Stripe instance for all payment operations.
 * Features:
 * - Safe environment validation
 * - Automatic retry configuration
 * - TypeScript strict typing
 */

import Stripe from "stripe";
import { logger } from "@/lib/logger";

// Validate Stripe secret key at module load
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  const errorMessage = "[FATAL] STRIPE_SECRET_KEY is not configured. Payment system cannot start.";
  logger.error(errorMessage);

  // In production, throw to prevent silent failures
  if (process.env.NODE_ENV === "production") {
    throw new Error(errorMessage);
  }
}

/**
 * Stripe SDK instance configured for enterprise use
 * - maxNetworkRetries: Automatic retries for transient failures
 * - telemetry: Disabled for privacy
 */
export const stripe = new Stripe(STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
  typescript: true,
  maxNetworkRetries: 3,
  telemetry: false,
});

/**
 * Validate Stripe configuration at runtime
 * Call this during app startup to verify Stripe is properly configured
 */
export async function validateStripeConfiguration(): Promise<boolean> {
  if (!STRIPE_SECRET_KEY) {
    logger.error("[STRIPE] Secret key not configured");
    return false;
  }

  try {
    // Verify key works by fetching account info
    await stripe.accounts.retrieve();
    logger.info("[STRIPE] Configuration validated successfully");
    return true;
  } catch (error) {
    logger.error("[STRIPE] Configuration validation failed:", error);
    return false;
  }
}

/**
 * Check if Stripe is configured (for conditional logic)
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_SECRET_KEY);
}