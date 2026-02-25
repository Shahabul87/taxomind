import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import { db } from "@/lib/db";
import { 
  createTOTPSetup, 
  encryptTOTPSecret, 
  encryptRecoveryCodes,
  validateTOTPSetup
} from "@/lib/auth/totp";

// Force Node.js runtime
export const runtime = 'nodejs';

const TOTPSetupSchema = z.object({
  // No additional fields needed for setup - we get user from session
});

/**
 * POST /api/auth/mfa/totp/setup
 * 
 * Generates TOTP secret and QR code for MFA setup
 * Returns: secret (encrypted), qrCodeUrl, and recovery codes
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
      return NextResponse.json(
        { error: "User not found" },
        { 
          status: 404,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    if (existingUser.totpEnabled && existingUser.totpVerified) {
      return NextResponse.json(
        { error: "TOTP is already enabled for this account" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Generate TOTP setup data
    const totpSetup = await createTOTPSetup(userEmail);
    
    // Validate setup data
    const validation = validateTOTPSetup(totpSetup);
    if (!validation.isValid) {
      logger.error("[TOTP_SETUP_ERROR] Invalid setup data", {
        userId,
        errors: validation.errors
      });
      return NextResponse.json(
        { error: "Failed to generate TOTP setup data" },
        { 
          status: 500,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Encrypt secret and recovery codes
    const encryptedSecret = await encryptTOTPSecret(totpSetup.secret);
    const encryptedRecoveryCodes = await encryptRecoveryCodes(totpSetup.backupCodes);

    // Store encrypted data in database (but don't enable TOTP yet)
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
    logger.info("[TOTP_SETUP_INITIATED]", {
      userId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    // Return setup data (don't return the actual secret for security)
    return NextResponse.json(
      {
        success: true,
        data: {
          qrCodeUrl: totpSetup.qrCodeUrl,
          backupCodes: totpSetup.backupCodes, // Show backup codes once during setup
          setupComplete: false,
          message: "TOTP setup initiated. Please scan the QR code with your authenticator app and verify with a token."
        }
      },
      {
        status: 200,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );

  } catch (error: any) {
    logger.error("[TOTP_SETUP_ERROR]", {
      error: error.message,
    });
    
    return NextResponse.json(
      { error: "Failed to setup TOTP. Please try again." },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}

/**
 * GET /api/auth/mfa/totp/setup
 * 
 * Get current TOTP setup status for the user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's TOTP status
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const remainingRecoveryCodes = user.recoveryCodes?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        totpEnabled: user.totpEnabled,
        totpVerified: user.totpVerified,
        twoFactorEnabled: user.isTwoFactorEnabled,
        remainingRecoveryCodes,
        setupRequired: !user.totpEnabled || !user.totpVerified,
      }
    });

  } catch (error: any) {
    logger.error("[TOTP_STATUS_ERROR]", error);
    
    return NextResponse.json(
      { error: "Failed to get TOTP status" },
      { status: 500 }
    );
  }
}