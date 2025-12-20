/**
 * Premium Subscription System
 *
 * Centralized exports for premium-related utilities.
 */

// Premium status checks
export {
  checkPremiumAccess,
  isPremiumUser,
  activatePremium,
  deactivatePremium,
  extendPremium,
  processExpiredSubscriptions,
  type PremiumStatus,
} from "./check-premium";

// Course enrollment checks
export {
  checkEnrollment,
  isEnrolled,
  canAccessSectionContent,
  getProtectedVideoUrl,
  checkMultipleSectionAccess,
  type EnrollmentStatus,
  type ContentAccessResult,
} from "./check-enrollment";

// SAM AI access control
export {
  canAccessSamFeature,
  incrementSamUsage,
  getRemainingFreeUsage,
  getAvailableFeatures,
  type SAMFeature,
  type SAMAccessResult,
} from "./sam-access";

// SAM API Guards (for protecting API routes)
export {
  createSAMGuardedHandler,
  checkSAMAccess,
  SAMGuards,
  type SAMGuardContext,
} from "./sam-api-guard";
