/**
 * Stripe SDK Singleton - Enterprise Implementation
 *
 * Provides a single, validated Stripe instance for all payment operations.
 * Features:
 * - Lazy initialization (avoids build-time errors)
 * - Safe environment validation at runtime
 * - Automatic retry configuration
 * - TypeScript strict typing
 */

import Stripe from "stripe";
import { logger } from "@/lib/logger";

// Lazy-loaded Stripe instance (created on first access, not at build time)
let _stripeInstance: Stripe | null = null;

/**
 * Get the Stripe SDK instance (lazy initialization)
 * This prevents build-time errors when env vars aren't available
 */
function getStripeInstance(): Stripe {
  if (_stripeInstance) {
    return _stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    const errorMessage = "[STRIPE] STRIPE_SECRET_KEY is not configured";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  _stripeInstance = new Stripe(secretKey, {
    apiVersion: "2023-10-16",
    typescript: true,
    maxNetworkRetries: 3,
    telemetry: false,
  });

  return _stripeInstance;
}

/**
 * Stripe SDK instance configured for enterprise use
 * Uses a Proxy to enable lazy initialization while maintaining the same API
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance();
    const value = instance[prop as keyof Stripe];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

/**
 * Validate Stripe configuration at runtime
 * Call this during app startup to verify Stripe is properly configured
 */
export async function validateStripeConfiguration(): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) {
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
  return Boolean(process.env.STRIPE_SECRET_KEY);
}