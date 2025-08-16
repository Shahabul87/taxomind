import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByToken } from "@/data/two-factor-token";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";

// Force Node.js runtime
export const runtime = 'nodejs';

const TwoFactorSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6).max(6),
});

export async function POST(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await withAuthRateLimit(req, 'twoFactor');
  
  // If rateLimitResult is a NextResponse (rate limit exceeded), return it
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }
  
  try {
    const body = await req.json();
    const validatedFields = TwoFactorSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    const { email, token } = validatedFields.data;

    const existingUser = await getUserByEmail(email);
    if (!existingUser || !existingUser.email) {
      return NextResponse.json(
        { error: "User not found!" },
        { 
          status: 404,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    if (!existingUser.isTwoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled!" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Validate the 2FA token
    const twoFactorToken = await getTwoFactorTokenByToken(token);
    if (!twoFactorToken || twoFactorToken.email !== email) {
      return NextResponse.json(
        { error: "Invalid code!" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    const hasExpired = new Date(twoFactorToken.expires) < new Date();
    if (hasExpired) {
      return NextResponse.json(
        { error: "Code has expired!" },
        { 
          status: 400,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Delete the used token
    await db.twoFactorToken.delete({
      where: { id: twoFactorToken.id }
    });

    // Create or update two-factor confirmation
    const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
    if (existingConfirmation) {
      await db.twoFactorConfirmation.delete({
        where: { id: existingConfirmation.id }
      });
    }

    await db.twoFactorConfirmation.create({
      data: { userId: existingUser.id }
    });

    return NextResponse.json(
      { success: "Two-factor authentication verified!" },
      {
        status: 200,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );

  } catch (error: any) {
    logger.error("[2FA_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}