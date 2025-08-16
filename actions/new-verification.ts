"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { rateLimitAuth } from "@/lib/rate-limit";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const newVerification = async (token: string) => {
  // Get client IP for rate limiting
  const headersList = headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  const ip = forwarded?.split(',')[0].trim() || realIp || cfConnectingIp || 'unknown';
  
  // Apply rate limiting with IP and token combination
  const identifier = `${ip}:${token.substring(0, 8)}`; // Use first 8 chars of token for identification
  const rateLimitResult = await rateLimitAuth('verify', identifier);
  
  if (!rateLimitResult.success) {
    return { 
      error: `Too many verification attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }
  
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { 
      error: "Token does not exist!",
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

  await db.user.update({
    where: { id: existingUser.id },
    data: { 
      emailVerified: new Date(),
      email: existingToken.email,
    }
  });

  await db.verificationToken.delete({
    where: { id: existingToken.id }
  });

  // Log successful email verification
  await authAuditHelpers.logEmailVerified(existingToken.email, existingUser.id);

  return { 
    success: "Email verified!",
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
};