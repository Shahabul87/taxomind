"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { queueVerificationEmail } from "@/lib/queue/email-queue-simple";
import { rateLimitAuth } from "@/lib/rate-limit-server";

const ResendVerificationSchema = z.object({
  email: z.string().email({
    message: "Valid email is required",
  }),
});

export const resendVerification = async (
  values: z.infer<typeof ResendVerificationSchema>
) => {
  const validatedFields = ResendVerificationSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email address!" };
  }

  const { email } = validatedFields.data;

  // Apply rate limiting - max 3 resend attempts per 15 minutes per email
  const rateLimitResult = await rateLimitAuth('resend-verification', email, {
    points: 3,
    duration: 15 * 60, // 15 minutes
  });

  if (!rateLimitResult.success) {
    return {
      error: `Too many resend attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  const existingUser = await getUserByEmail(email);

  // Generic message for security (don't reveal if email exists)
  if (!existingUser || !existingUser.email) {
    return {
      success: "If an account exists with this email, a verification link has been sent.",
    };
  }

  // If already verified, return success without sending email
  if (existingUser.emailVerified) {
    return {
      success: "Your email is already verified. You can log in now.",
      alreadyVerified: true,
    };
  }

  // Check if a recent verification token exists (within last 2 minutes)
  const recentToken = await db.verificationToken.findFirst({
    where: {
      identifier: existingUser.email,
      expires: { gt: new Date(Date.now() - 2 * 60 * 1000) }, // Last 2 minutes
    },
    orderBy: { expires: 'desc' },
  });

  if (recentToken) {
    return {
      error: "A verification email was recently sent. Please check your inbox or wait 2 minutes before requesting another.",
      recentlySent: true,
    };
  }

  try {
    // Generate new verification token
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );

    // Queue verification email
    const emailQueued = await queueVerificationEmail({
      userEmail: verificationToken.email,
      userName: existingUser.name || "User",
      verificationToken: verificationToken.token,
      expiresAt: verificationToken.expires,
      userId: existingUser.id,
      timestamp: new Date(),
      isResend: true,
    });

    if (!emailQueued) {
      return {
        error: "Failed to send verification email. Please try again later.",
      };
    }

    console.log('[resend-verification] Email queued for:', email);

    return {
      success: "Verification email sent! Please check your inbox and spam folder.",
      emailSent: true,
    };
  } catch (error) {
    console.error('[resend-verification] Error:', error);
    return {
      error: "Something went wrong. Please try again later.",
    };
  }
};
