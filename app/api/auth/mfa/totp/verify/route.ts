import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';
import { db } from "@/lib/db";
import { 
  decryptTOTPSecret,
  verifyTOTPToken
} from "@/lib/auth/totp";

// Force Node.js runtime
export const runtime = 'nodejs';

const TOTPVerifySchema = z.object({
  token: z.string().min(6).max(6).regex(/^\d{6}$/, "Token must be exactly 6 digits"),
});

/**
 * POST /api/auth/mfa/totp/verify
 * 
 * Verifies TOTP token during initial setup to enable TOTP MFA
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
    const validatedFields = TOTPVerifySchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { 
          error: "Invalid token format",
          details: validatedFields.error.flatten().fieldErrors
        },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    const { token } = validatedFields.data;
    const userId = session.user.id;

    // Get user's TOTP data
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
      return NextResponse.json(
        { error: "User not found" },
        { 
          status: 404,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Check if TOTP setup has been initiated
    if (!user.totpSecret) {
      return NextResponse.json(
        { error: "TOTP setup not initiated. Please start setup first." },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Check if already verified and enabled
    if (user.totpEnabled && user.totpVerified) {
      return NextResponse.json(
        { error: "TOTP is already enabled for this account" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    try {
      // Decrypt the stored TOTP secret
      const decryptedSecret = await decryptTOTPSecret(user.totpSecret);
      
      // Verify the provided token
      const isTokenValid = verifyTOTPToken(token, decryptedSecret);
      
      if (!isTokenValid) {
        logger.warn("[TOTP_VERIFY_FAILED]", {
          userId,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          reason: "Invalid token"
        });

        return NextResponse.json(
          { error: "Invalid verification code. Please try again." },
          { 
            status: 400,
            headers: rateLimitResult.headers as Record<string, string>
          }
        );
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
      logger.info("[TOTP_ENABLED]", {
        userId,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        method: "TOTP"
      });

      return NextResponse.json(
        {
          success: true,
          message: "TOTP has been successfully enabled for your account",
          data: {
            totpEnabled: true,
            totpVerified: true,
            setupComplete: true,
          }
        },
        {
          status: 200,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );

    } catch (decryptError: unknown) {
      const decryptMessage = decryptError instanceof Error ? decryptError.message : 'Unknown error';
      logger.error("[TOTP_DECRYPT_ERROR]", {
        userId,
        error: decryptMessage,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: "Failed to verify token due to encryption error" },
        {
          status: 500,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error("[TOTP_VERIFY_ERROR]", {
      error: message,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: "Failed to verify TOTP token. Please try again." },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}