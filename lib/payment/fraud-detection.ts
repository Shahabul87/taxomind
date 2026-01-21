/**
 * Payment Fraud Detection - Enterprise Implementation
 *
 * Provides fraud detection capabilities for payment processing:
 * - Recent failed payment detection
 * - Rapid checkout attempt detection
 * - New account risk assessment
 * - IP-based velocity checks
 * - Suspicious pattern detection
 */

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Fraud check result
 */
export interface FraudCheckResult {
  /** Whether the payment should be allowed */
  allowed: boolean;
  /** Risk score (0-100, higher = more risky) */
  riskScore: number;
  /** Flags indicating specific risk factors */
  flags: string[];
  /** Additional details for logging */
  details: Record<string, unknown>;
}

/**
 * Fraud check configuration
 */
export interface FraudCheckConfig {
  /** Maximum risk score allowed (default: 50) */
  maxRiskScore?: number;
  /** Check for recent failed payments */
  checkFailedPayments?: boolean;
  /** Check for rapid checkout attempts */
  checkRapidAttempts?: boolean;
  /** Check account age */
  checkAccountAge?: boolean;
  /** Check IP velocity */
  checkIpVelocity?: boolean;
}

const DEFAULT_CONFIG: FraudCheckConfig = {
  maxRiskScore: 50,
  checkFailedPayments: true,
  checkRapidAttempts: true,
  checkAccountAge: true,
  checkIpVelocity: true,
};

/**
 * Check payment for fraud indicators
 *
 * @param userId - The user making the payment
 * @param courseId - The course being purchased
 * @param ip - Client IP address
 * @param config - Optional configuration overrides
 */
export async function checkPaymentFraud(
  userId: string,
  courseId: string,
  ip: string,
  config: FraudCheckConfig = {}
): Promise<FraudCheckResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const flags: string[] = [];
  const details: Record<string, unknown> = {};
  let riskScore = 0;

  try {
    // Run all checks in parallel for performance
    const checkPromises: Promise<void>[] = [];

    // Check 1: Recent failed payments
    if (mergedConfig.checkFailedPayments) {
      checkPromises.push(
        (async () => {
          const recentFailures = await db.paymentTransaction.count({
            where: {
              userId,
              status: "FAILED",
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
              },
            },
          });

          details.recentFailedPayments = recentFailures;

          if (recentFailures >= 5) {
            flags.push("HIGH_FAILURE_RATE");
            riskScore += 40;
          } else if (recentFailures >= 3) {
            flags.push("MULTIPLE_RECENT_FAILURES");
            riskScore += 25;
          } else if (recentFailures >= 1) {
            flags.push("RECENT_FAILURE");
            riskScore += 10;
          }
        })()
      );
    }

    // Check 2: Rapid checkout attempts
    if (mergedConfig.checkRapidAttempts) {
      checkPromises.push(
        (async () => {
          const recentAttempts = await db.paymentTransaction.count({
            where: {
              userId,
              createdAt: {
                gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
              },
            },
          });

          details.recentCheckoutAttempts = recentAttempts;

          if (recentAttempts >= 10) {
            flags.push("VERY_RAPID_ATTEMPTS");
            riskScore += 50;
          } else if (recentAttempts >= 5) {
            flags.push("RAPID_ATTEMPTS");
            riskScore += 30;
          } else if (recentAttempts >= 3) {
            flags.push("MULTIPLE_ATTEMPTS");
            riskScore += 10;
          }
        })()
      );
    }

    // Check 3: Account age
    if (mergedConfig.checkAccountAge) {
      checkPromises.push(
        (async () => {
          const user = await db.user.findUnique({
            where: { id: userId },
            select: { createdAt: true, emailVerified: true },
          });

          if (user) {
            const accountAgeDays =
              (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

            details.accountAgeDays = Math.floor(accountAgeDays);
            details.emailVerified = !!user.emailVerified;

            if (accountAgeDays < 0.042) {
              // Less than 1 hour
              flags.push("VERY_NEW_ACCOUNT");
              riskScore += 30;
            } else if (accountAgeDays < 1) {
              flags.push("NEW_ACCOUNT");
              riskScore += 20;
            } else if (accountAgeDays < 7) {
              flags.push("RECENT_ACCOUNT");
              riskScore += 5;
            }

            // Unverified email is a risk factor
            if (!user.emailVerified) {
              flags.push("UNVERIFIED_EMAIL");
              riskScore += 15;
            }
          }
        })()
      );
    }

    // Check 4: IP-based velocity
    if (mergedConfig.checkIpVelocity && ip !== "unknown") {
      checkPromises.push(
        (async () => {
          // Check payment transactions from this IP in the last hour
          // Note: This requires storing IP in metadata
          const recentFromIp = await db.paymentTransaction.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
              },
              metadata: {
                path: ["clientIp"],
                equals: ip,
              },
            },
          });

          details.transactionsFromIp = recentFromIp;

          if (recentFromIp >= 10) {
            flags.push("HIGH_IP_VELOCITY");
            riskScore += 25;
          } else if (recentFromIp >= 5) {
            flags.push("MODERATE_IP_VELOCITY");
            riskScore += 10;
          }
        })()
      );
    }

    // Check 5: Multiple pending transactions for same course
    checkPromises.push(
      (async () => {
        const pendingForCourse = await db.paymentTransaction.count({
          where: {
            userId,
            courseId,
            status: { in: ["PENDING", "PROCESSING"] },
          },
        });

        details.pendingForCourse = pendingForCourse;

        if (pendingForCourse >= 1) {
          flags.push("PENDING_TRANSACTION_EXISTS");
          riskScore += 15;
        }
      })()
    );

    // Check 6: Previous successful purchase of same course
    checkPromises.push(
      (async () => {
        const existingPurchase = await db.paymentTransaction.findFirst({
          where: {
            userId,
            courseId,
            status: "COMPLETED",
          },
        });

        if (existingPurchase) {
          flags.push("ALREADY_PURCHASED");
          riskScore += 100; // Should not happen, enrollment check should catch this
          details.existingPurchaseId = existingPurchase.id;
        }
      })()
    );

    // Wait for all checks to complete
    await Promise.all(checkPromises);

    // Determine if allowed
    const allowed =
      riskScore < (mergedConfig.maxRiskScore ?? DEFAULT_CONFIG.maxRiskScore!);

    // Log high-risk attempts
    if (riskScore >= 30) {
      logger.warn(
        `[FRAUD_DETECTION] High risk payment attempt: userId=${userId}, score=${riskScore}, flags=${flags.join(",")}`
      );
    }

    return {
      allowed,
      riskScore,
      flags,
      details,
    };
  } catch (error) {
    // Log error but allow payment to proceed (fail open for better UX)
    logger.error("[FRAUD_DETECTION] Error during fraud check:", error);

    return {
      allowed: true,
      riskScore: 0,
      flags: ["FRAUD_CHECK_ERROR"],
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Check subscription payment for fraud
 * Similar to course checkout but with subscription-specific checks
 */
export async function checkSubscriptionFraud(
  userId: string,
  ip: string,
  planType: string
): Promise<FraudCheckResult> {
  const flags: string[] = [];
  const details: Record<string, unknown> = { planType };
  let riskScore = 0;

  try {
    // Run checks in parallel
    const [
      recentFailures,
      recentAttempts,
      user,
      existingSubscription,
    ] = await Promise.all([
      // Recent failed subscription payments
      db.auditLog.count({
        where: {
          userId,
          entityType: "PremiumSubscription",
          action: "UPDATE",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          changes: {
            path: ["event"],
            equals: "PAYMENT_FAILED",
          },
        },
      }),

      // Recent subscription checkout attempts
      db.webhookEvent.count({
        where: {
          eventType: { contains: "checkout.session" },
          payload: {
            path: ["data", "object", "metadata", "userId"],
            equals: userId,
          },
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      }),

      // User info
      db.user.findUnique({
        where: { id: userId },
        select: {
          createdAt: true,
          emailVerified: true,
          isPremium: true,
          premiumPlan: true,
        },
      }),

      // Check if already has active subscription
      db.user.findFirst({
        where: {
          id: userId,
          isPremium: true,
        },
      }),
    ]);

    details.recentFailures = recentFailures;
    details.recentAttempts = recentAttempts;

    // Failed subscription payments
    if (recentFailures >= 3) {
      flags.push("MULTIPLE_SUBSCRIPTION_FAILURES");
      riskScore += 30;
    }

    // Rapid attempts
    if (recentAttempts >= 5) {
      flags.push("RAPID_SUBSCRIPTION_ATTEMPTS");
      riskScore += 25;
    }

    // Account age check
    if (user) {
      const accountAgeDays =
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      details.accountAgeDays = Math.floor(accountAgeDays);

      if (accountAgeDays < 1 && planType === "LIFETIME") {
        flags.push("NEW_ACCOUNT_LIFETIME_ATTEMPT");
        riskScore += 35;
      } else if (accountAgeDays < 1) {
        flags.push("NEW_ACCOUNT");
        riskScore += 15;
      }

      if (!user.emailVerified) {
        flags.push("UNVERIFIED_EMAIL");
        riskScore += 20;
      }
    }

    // Already premium check (upgrade vs new)
    if (existingSubscription) {
      details.hasExistingSubscription = true;
      // This is likely an upgrade, lower risk
      riskScore = Math.max(0, riskScore - 10);
    }

    const allowed = riskScore < 50;

    if (riskScore >= 30) {
      logger.warn(
        `[FRAUD_DETECTION] High risk subscription attempt: userId=${userId}, plan=${planType}, score=${riskScore}`
      );
    }

    return {
      allowed,
      riskScore,
      flags,
      details,
    };
  } catch (error) {
    logger.error("[FRAUD_DETECTION] Error during subscription fraud check:", error);

    return {
      allowed: true,
      riskScore: 0,
      flags: ["FRAUD_CHECK_ERROR"],
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Report a confirmed fraud event (for future ML/pattern detection)
 */
export async function reportFraudEvent(
  userId: string,
  eventType: "CHARGEBACK" | "DISPUTE" | "MANUAL_FLAG",
  details: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action: "CREATE",
        entityType: "FraudEvent",
        entityId: crypto.randomUUID(),
        changes: {
          eventType,
          ...details,
          reportedAt: new Date().toISOString(),
        },
      },
    });

    logger.warn(
      `[FRAUD_DETECTION] Fraud event reported: userId=${userId}, type=${eventType}`
    );
  } catch (error) {
    logger.error("[FRAUD_DETECTION] Error reporting fraud event:", error);
  }
}
