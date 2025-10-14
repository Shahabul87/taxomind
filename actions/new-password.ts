"use server";

import * as z from "zod";
import { headers } from "next/headers";

import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimitAuth } from "@/lib/rate-limit-server";
import * as bcrypt from "bcryptjs";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema> ,
  token?: string | null,
) => {
  if (!token) {
    return { error: "Missing token!" };
  }

  // Get client IP for rate limiting
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  const ip = forwarded?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
  
  // Apply rate limiting with IP and token combination
  const identifier = `${ip}:${token.substring(0, 8)}`; // Use first 8 chars of token
  const rateLimitResult = await rateLimitAuth('reset', identifier); // Use reset endpoint limit
  
  if (!rateLimitResult.success) {
    return { 
      error: `Too many password reset attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { 
      error: "Invalid fields!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { 
      error: "Invalid token!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { 
      error: "Token has expired!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { 
      error: "Email does not exist!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  await db.passwordResetToken.delete({
    where: { id: existingToken.id }
  });

  // Log successful password reset
  await authAuditHelpers.logPasswordChanged(
    existingUser.id, 
    existingUser.email || '', 
    'reset'
  );

  return { 
    success: "Password updated!",
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
};