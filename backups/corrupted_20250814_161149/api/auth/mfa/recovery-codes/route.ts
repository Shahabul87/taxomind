import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import { db } from "@/lib/db";
import { 
  generateRecoveryCodes,
  encryptRecoveryCodes,
  decryptTOTPSecret,
  verifyTOTPToken
} from "@/lib/auth/totp";

// Force Node.js runtime
export const runtime = 'nodejs';

const RecoveryCodesSchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be exactly 6 digits"),
  confirmRegenerate: z.boolean().default(true),
});

/**
 * POST /api/auth/mfa/recovery-codes
 * 
 * Generates new recovery codes for the authenticated user
 * Requires TOTP token verification and invalidates all existing recovery codes
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await withAuthRateLimit(req, 'mfa-recovery');
  
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
    const validatedFields = RecoveryCodesSchema.safeParse(body);

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

    const { token, confirmRegenerate } = validatedFields.data;
    const userId = session.user.id;

    if (!confirmRegenerate) {
      return NextResponse.json(
        { error: "Confirmation required to regenerate recovery codes" },
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
    if (!user.totpEnabled || !user.totpVerified || !user.totpSecret) {
      return NextResponse.json(
        { error: "TOTP must be enabled to manage recovery codes" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    try {
      // Verify TOTP token before regenerating codes
      const decryptedSecret = await decryptTOTPSecret(user.totpSecret);
      const isTokenValid = verifyTOTPToken(token, decryptedSecret);
      
      if (!isTokenValid) {
        logger.warn("[RECOVERY_CODES_VERIFY_FAILED]", {
          userId,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          reason: "Invalid TOTP token"
        });

        return NextResponse.json(
          { error: "Invalid verification code. Please try again." },
          { 
            status: 400,
            headers: rateLimitResult.headers as Record<string, string>
          }
        );
      }

      // Generate new recovery codes
      const newRecoveryCodes = generateRecoveryCodes();
      
      // Encrypt the new recovery codes
      const encryptedRecoveryCodes = await encryptRecoveryCodes(newRecoveryCodes);

      // Update the user's recovery codes in the database
      await db.user.update({
        where: { id: userId },
        data: {
          recoveryCodes: encryptedRecoveryCodes,
        }
      });

      // Log successful recovery codes regeneration
      logger.info("[RECOVERY_CODES_REGENERATED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        previousCodesCount: user.recoveryCodes?.length || 0,
        newCodesCount: newRecoveryCodes.length,
      });

      return NextResponse.json(
        {
          success: true,
          message: "New recovery codes have been generated successfully",
          data: {
            recoveryCodes: newRecoveryCodes, // Show the new codes once
            totalCodes: newRecoveryCodes.length,
            warning: "Please save these codes in a secure location. They will not be shown again.",
          }
        },
        {
          status: 200,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );

    } catch (decryptError: any) {
      logger.error("[RECOVERY_CODES_DECRYPT_ERROR]", {
        userId,
        error: decryptError.message,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: "Failed to verify TOTP token due to encryption error" },
        { 
          status: 500,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

  } catch (error: any) {
    logger.error("[RECOVERY_CODES_ERROR]", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: "Failed to generate recovery codes. Please try again." },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}

/**
 * GET /api/auth/mfa/recovery-codes
 * 
 * Get recovery codes status (count only, not the actual codes)
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

    // Get user's recovery codes count
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        totpEnabled: true,
        totpVerified: true,
        recoveryCodes: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        totpEnabled: user.totpEnabled,
        totpVerified: user.totpVerified,
        recoveryCodesCount: user.recoveryCodes?.length || 0,
        canRegenerateRecoveryCodes: user.totpEnabled && user.totpVerified,
      }
    });

  } catch (error: any) {
    logger.error("[RECOVERY_CODES_STATUS_ERROR]", error);
    
    return NextResponse.json(
      { error: "Failed to get recovery codes status" },
      { status: 500 }
    );
  }
}