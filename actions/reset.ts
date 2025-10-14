"use server";

import * as z from "zod";
// import { headers } from "next/headers"; // Removed - causes build error

import { ResetSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generatePasswordResetToken } from "@/lib/tokens";
import { queuePasswordResetEmail } from "@/lib/queue/email-queue-simple";
import { rateLimitAuth } from "@/lib/rate-limit-server";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;
  
  // Get client IP for rate limiting (using fallback for now)
  // Headers not available in server actions called from client components
  const ip = 'unknown';
  
  // Apply rate limiting with IP and email combination
  // Use email-only for rate limiting since we can't get IP in server actions
  const identifier = email;
  const rateLimitResult = await rateLimitAuth('reset', identifier);
  
  if (!rateLimitResult.success) {
    return { 
      error: `Too many password reset attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { 
      error: "Email not found!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  
  // Queue password reset email for background processing
  await queuePasswordResetEmail({
    userEmail: passwordResetToken.email,
    userName: existingUser.name || "User",
    resetToken: passwordResetToken.token,
    expiresAt: passwordResetToken.expires,
    userId: existingUser.id,
    timestamp: new Date(),
    ipAddress: ip,
  });

  // Log password reset request
  await authAuditHelpers.logPasswordResetRequested(email);

  return { 
    success: "Reset email sent!",
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
}