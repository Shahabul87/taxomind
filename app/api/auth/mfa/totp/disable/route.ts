import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import { db } from "@/lib/db";
import { 
  decryptTOTPSecret,
  verifyTOTPToken,
  verifyRecoveryCode
} from "@/lib/auth/totp";

// Force Node.js runtime
export const runtime = 'nodejs';

const TOTPDisableSchema = z.object({
  // Either TOTP token or recovery code can be used for verification
  token: z.string().optional(),
  recoveryCode: z.string().optional(),
  confirmDisable: z.boolean().default(true), // Extra confirmation
}).refine(
  (data) => data.token || data.recoveryCode,
  {
    message: "Either token or recovery code is required",
  }
);

/**
 * POST /api/auth/mfa/totp/disable
 * 
 * Disables TOTP MFA for the authenticated user
 * Requires either a valid TOTP token or recovery code for verification
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await withAuthRateLimit(req, 'twoFactor');
  
  // If rateLimitResult is a NextResponse (rate limit exceeded), return it
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }
  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in first" },
        { 
          status: 401,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Validate request body
    const body = await req.json();
    const validatedFields = TOTPDisableSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validatedFields.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    const { token, recoveryCode, confirmDisable } = validatedFields.data;
    const userId = session.user.id;

    if (!confirmDisable) {
      return NextResponse.json(
        { error: "Confirmation required to disable TOTP" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Get user's TOTP data
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
      return NextResponse.json(
        { error: "User not found" },
        { 
          status: 404,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Check if TOTP is currently enabled
    if (!user.totpEnabled || !user.totpVerified) {
      return NextResponse.json(
        { error: "TOTP is not currently enabled for this account" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
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
        logger.error("[TOTP_DISABLE_DECRYPT_ERROR]", {
          userId,
          error: decryptError.message,
          timestamp: new Date().toISOString(),
        });
        
        return NextResponse.json(
          { error: "Failed to verify TOTP token" },
          { 
            status: 500,
            headers: rateLimitResult.headers as Record<string, string>
          }
        );
      }
    }
    
    // Verify using recovery code (if TOTP failed or wasn't provided)
    if (!isVerified && recoveryCode) {
      try {
        const recoveryResult = await verifyRecoveryCode(recoveryCode, user.recoveryCodes || []);
        isVerified = recoveryResult.isValid;
        
        if (isVerified && recoveryResult.remainingCodes) {
          updatedRecoveryCodes = recoveryResult.remainingCodes;
          verificationMethod = "Recovery Code";
        }
      } catch (recoveryError: any) {
        logger.error("[RECOVERY_CODE_VERIFY_ERROR]", {
          userId,
          error: recoveryError.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (!isVerified) {
      logger.warn("[TOTP_DISABLE_FAILED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        reason: "Invalid verification",
        method: token ? "TOTP" : "Recovery Code"
      });

      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
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
    logger.info("[TOTP_DISABLED]", {
      userId,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      verificationMethod,
    });

    return NextResponse.json(
      {
        success: true,
        message: "TOTP has been successfully disabled for your account",
        data: {
          totpEnabled: false,
          totpVerified: false,
          twoFactorEnabled: false,
        }
      },
      {
        status: 200,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );

  } catch (error: any) {
    logger.error("[TOTP_DISABLE_ERROR]", {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: "Failed to disable TOTP. Please try again." },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}