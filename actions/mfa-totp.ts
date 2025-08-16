"use server";

import * as z from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createTOTPSetup,
  encryptTOTPSecret,
  encryptRecoveryCodes,
  decryptTOTPSecret,
  verifyTOTPToken,
  generateRecoveryCodes,
  verifyRecoveryCode,
  validateTOTPSetup,
} from "@/lib/auth/totp";
import { logger } from "@/lib/logger";

// Validation schemas
const TOTPSetupSchema = z.object({});

const TOTPVerifySchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be exactly 6 digits"),
});

const TOTPDisableSchema = z.object({
  token: z.string().optional(),
  recoveryCode: z.string().optional(),
  confirmDisable: z.boolean().default(true),
}).refine(
  (data) => data.token || data.recoveryCode,
  {
    message: "Either token or recovery code is required",
  }
);

const RecoveryCodesSchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be exactly 6 digits"),
  confirmRegenerate: z.boolean().default(true),
});

/**
 * Initiates TOTP setup for the authenticated user
 */
export const setupTOTP = async (values: z.infer<typeof TOTPSetupSchema>) => {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: "Unauthorized - Please log in first" };
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Check if user already has TOTP enabled
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { 
        totpEnabled: true, 
        totpVerified: true,
        totpSecret: true 
      }
    });

    if (!existingUser) {
      return { error: "User not found" };
    }

    if (existingUser.totpEnabled && existingUser.totpVerified) {
      return { error: "TOTP is already enabled for this account" };
    }

    // Generate TOTP setup data
    const totpSetup = await createTOTPSetup(userEmail);
    
    // Validate setup data
    const validation = validateTOTPSetup(totpSetup);
    if (!validation.isValid) {
      logger.error("[TOTP_SETUP_ACTION_ERROR] Invalid setup data", {
        userId,
        errors: validation.errors
      });
      return { error: "Failed to generate TOTP setup data" };
    }

    // Encrypt secret and recovery codes
    const encryptedSecret = await encryptTOTPSecret(totpSetup.secret);
    const encryptedRecoveryCodes = await encryptRecoveryCodes(totpSetup.backupCodes);

    // Store encrypted data in database (but don&apos;t enable TOTP yet)
    await db.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        recoveryCodes: encryptedRecoveryCodes,
        totpEnabled: false, // Will be enabled after verification
        totpVerified: false,
      }
    });

    // Log the setup attempt
    logger.info("[TOTP_SETUP_ACTION_SUCCESS]", {
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: {
        qrCodeUrl: totpSetup.qrCodeUrl,
        backupCodes: totpSetup.backupCodes,
        setupComplete: false,
        message: "TOTP setup initiated. Please scan the QR code with your authenticator app and verify with a token."
      }
    };

  } catch (error: any) {
    logger.error("[TOTP_SETUP_ACTION_ERROR]", {
      error: error.message,
      stack: error.stack,
    });
    
    return { error: "Failed to setup TOTP. Please try again." };
  }
};

/**
 * Verifies TOTP token during initial setup to enable TOTP MFA
 */
export const verifyTOTP = async (values: z.infer<typeof TOTPVerifySchema>) => {
  const validatedFields = TOTPVerifySchema.safeParse(values);

  if (!validatedFields.success) {
    return { 
      error: "Invalid token format",
      details: validatedFields.error.flatten().fieldErrors
    };
  }

  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: "Unauthorized - Please log in first" };
    }

    const { token } = validatedFields.data;
    const userId = session.user.id;

    // Get user&apos;s TOTP data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totpSecret: true,
        totpEnabled: true,
        totpVerified: true,
        email: true,
      }
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if TOTP setup has been initiated
    if (!user.totpSecret) {
      return { error: "TOTP setup not initiated. Please start setup first." };
    }

    // Check if already verified and enabled
    if (user.totpEnabled && user.totpVerified) {
      return { error: "TOTP is already enabled for this account" };
    }

    // Decrypt the stored TOTP secret
    const decryptedSecret = await decryptTOTPSecret(user.totpSecret);
    
    // Verify the provided token
    const isTokenValid = verifyTOTPToken(token, decryptedSecret);
    
    if (!isTokenValid) {
      logger.warn("[TOTP_VERIFY_ACTION_FAILED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        reason: "Invalid token"
      });

      return { error: "Invalid verification code. Please try again." };
    }

    // Token is valid - enable TOTP for the user
    await db.user.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        totpVerified: true,
        isTwoFactorEnabled: true, // Also enable the general 2FA flag
      }
    });

    // Log successful TOTP setup
    logger.info("[TOTP_ENABLED_ACTION]", {
      userId,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      method: "TOTP"
    });

    return {
      success: true,
      message: "TOTP has been successfully enabled for your account",
      data: {
        totpEnabled: true,
        totpVerified: true,
        setupComplete: true,
      }
    };

  } catch (error: any) {
    logger.error("[TOTP_VERIFY_ACTION_ERROR]", {
      error: error.message,
      stack: error.stack,
    });
    
    return { error: "Failed to verify TOTP token. Please try again." };
  }
};

/**
 * Disables TOTP MFA for the authenticated user
 */
export const disableTOTP = async (values: z.infer<typeof TOTPDisableSchema>) => {
  const validatedFields = TOTPDisableSchema.safeParse(values);

  if (!validatedFields.success) {
    return { 
      error: "Invalid request data",
      details: validatedFields.error.flatten().fieldErrors
    };
  }

  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: "Unauthorized - Please log in first" };
    }

    const { token, recoveryCode, confirmDisable } = validatedFields.data;
    const userId = session.user.id;

    if (!confirmDisable) {
      return { error: "Confirmation required to disable TOTP" };
    }

    // Get user&apos;s TOTP data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totpSecret: true,
        totpEnabled: true,
        totpVerified: true,
        recoveryCodes: true,
        email: true,
      }
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if TOTP is currently enabled
    if (!user.totpEnabled || !user.totpVerified) {
      return { error: "TOTP is not currently enabled for this account" };
    }

    let isVerified = false;
    let verificationMethod = "";
    let updatedRecoveryCodes = user.recoveryCodes;

    // Verify using TOTP token
    if (token) {
      try {
        const decryptedSecret = await decryptTOTPSecret(user.totpSecret!);
        isVerified = verifyTOTPToken(token, decryptedSecret);
        verificationMethod = "TOTP";
      } catch (decryptError: any) {
        logger.error("[TOTP_DISABLE_ACTION_DECRYPT_ERROR]", {
          userId,
          error: decryptError.message,
        });
        
        return { error: "Failed to verify TOTP token" };
      }
    }
    
    // Verify using recovery code (if TOTP failed or wasn&apos;t provided)
    if (!isVerified && recoveryCode) {
      try {
        const recoveryResult = await verifyRecoveryCode(recoveryCode, user.recoveryCodes || []);
        isVerified = recoveryResult.isValid;
        
        if (isVerified && recoveryResult.remainingCodes) {
          updatedRecoveryCodes = recoveryResult.remainingCodes;
          verificationMethod = "Recovery Code";
        }
      } catch (recoveryError: any) {
        logger.error("[RECOVERY_CODE_VERIFY_ACTION_ERROR]", {
          userId,
          error: recoveryError.message,
        });
      }
    }

    if (!isVerified) {
      logger.warn("[TOTP_DISABLE_ACTION_FAILED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        reason: "Invalid verification",
        method: token ? "TOTP" : "Recovery Code"
      });

      return { error: "Invalid verification code. Please try again." };
    }

    // Disable TOTP for the user
    await db.user.update({
      where: { id: userId },
      data: {
        totpSecret: null, // Clear the secret
        totpEnabled: false,
        totpVerified: false,
        recoveryCodes: updatedRecoveryCodes, // Update recovery codes if one was used
        isTwoFactorEnabled: false, // Also disable the general 2FA flag
      }
    });

    // Log successful TOTP disable
    logger.info("[TOTP_DISABLED_ACTION]", {
      userId,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      verificationMethod,
    });

    return {
      success: true,
      message: "TOTP has been successfully disabled for your account",
      data: {
        totpEnabled: false,
        totpVerified: false,
        twoFactorEnabled: false,
      }
    };

  } catch (error: any) {
    logger.error("[TOTP_DISABLE_ACTION_ERROR]", {
      error: error.message,
      stack: error.stack,
    });
    
    return { error: "Failed to disable TOTP. Please try again." };
  }
};

/**
 * Generates new recovery codes for the authenticated user
 */
export const regenerateRecoveryCodes = async (values: z.infer<typeof RecoveryCodesSchema>) => {
  const validatedFields = RecoveryCodesSchema.safeParse(values);

  if (!validatedFields.success) {
    return { 
      error: "Invalid request data",
      details: validatedFields.error.flatten().fieldErrors
    };
  }

  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: "Unauthorized - Please log in first" };
    }

    const { token, confirmRegenerate } = validatedFields.data;
    const userId = session.user.id;

    if (!confirmRegenerate) {
      return { error: "Confirmation required to regenerate recovery codes" };
    }

    // Get user&apos;s TOTP data
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totpSecret: true,
        totpEnabled: true,
        totpVerified: true,
        recoveryCodes: true,
        email: true,
      }
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if TOTP is currently enabled
    if (!user.totpEnabled || !user.totpVerified || !user.totpSecret) {
      return { error: "TOTP must be enabled to manage recovery codes" };
    }

    // Verify TOTP token before regenerating codes
    const decryptedSecret = await decryptTOTPSecret(user.totpSecret);
    const isTokenValid = verifyTOTPToken(token, decryptedSecret);
    
    if (!isTokenValid) {
      logger.warn("[RECOVERY_CODES_ACTION_VERIFY_FAILED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        reason: "Invalid TOTP token"
      });

      return { error: "Invalid verification code. Please try again." };
    }

    // Generate new recovery codes
    const newRecoveryCodes = generateRecoveryCodes();
    
    // Encrypt the new recovery codes
    const encryptedRecoveryCodes = await encryptRecoveryCodes(newRecoveryCodes);

    // Update the user&apos;s recovery codes in the database
    await db.user.update({
      where: { id: userId },
      data: {
        recoveryCodes: encryptedRecoveryCodes,
      }
    });

    // Log successful recovery codes regeneration
    logger.info("[RECOVERY_CODES_ACTION_REGENERATED]", {
      userId,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      previousCodesCount: user.recoveryCodes?.length || 0,
      newCodesCount: newRecoveryCodes.length,
    });

    return {
      success: true,
      message: "New recovery codes have been generated successfully",
      data: {
        recoveryCodes: newRecoveryCodes, // Show the new codes once
        totalCodes: newRecoveryCodes.length,
        warning: "Please save these codes in a secure location. They will not be shown again.",
      }
    };

  } catch (error: any) {
    logger.error("[RECOVERY_CODES_ACTION_ERROR]", {
      error: error.message,
      stack: error.stack,
    });
    
    return { error: "Failed to generate recovery codes. Please try again." };
  }
};

/**
 * Get TOTP status for the authenticated user
 */
export const getTOTPStatus = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const userId = session.user.id;

    // Get user&apos;s TOTP status
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        totpVerified: true,
        isTwoFactorEnabled: true,
        recoveryCodes: true,
      }
    });

    if (!user) {
      return { error: "User not found" };
    }

    const remainingRecoveryCodes = user.recoveryCodes?.length || 0;

    return {
      success: true,
      data: {
        totpEnabled: user.totpEnabled,
        totpVerified: user.totpVerified,
        twoFactorEnabled: user.isTwoFactorEnabled,
        remainingRecoveryCodes,
        setupRequired: !user.totpEnabled || !user.totpVerified,
      }
    };

  } catch (error: any) {
    logger.error("[TOTP_STATUS_ACTION_ERROR]", error);
    
    return { error: "Failed to get TOTP status" };
  }
};