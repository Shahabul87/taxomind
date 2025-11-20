"use server";

import * as z from "zod";
import { headers } from "next/headers";

import { ResetSchema } from "@/schemas";
import { getAdminAccountByEmail } from "@/data/admin";
import { generatePasswordResetToken } from "@/lib/tokens";
import { queuePasswordResetEmail } from "@/lib/queue/email-queue-simple";
import { rateLimitAuth } from "@/lib/rate-limit-server";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

/**
 * Get client IP address from request headers
 * Checks multiple headers in order of reliability
 */
const getClientIp = async (): Promise<string> => {
  const headersList = await headers();

  // Check common proxy headers
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one (client IP)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const trueClientIp = headersList.get('true-client-ip'); // Akamai/Cloudflare
  if (trueClientIp) {
    return trueClientIp;
  }

  return 'unknown';
};

/**
 * Admin Password Reset Action
 *
 * Enhanced security for administrator password reset:
 * - Stricter rate limiting
 * - ADMIN role verification
 * - IP address tracking
 * - Enhanced audit logging
 */
export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;
  const ip = await getClientIp();

  console.log('[admin-reset] Admin password reset requested from IP:', ip);

  // Stricter rate limiting for admin password resets (3 attempts instead of 5)
  const identifier = email;
  const rateLimitResult = await rateLimitAuth('admin-reset', identifier);

  if (!rateLimitResult.success) {
    console.log('[admin-reset] Rate limit exceeded');
    return {
      error: `Too many admin password reset attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }

  const existingAdmin = await getAdminAccountByEmail(email);

  if (!existingAdmin) {
    console.log('[admin-reset] Admin account not found');
    // Don't reveal whether admin exists - generic message
    return {
      success: "If an admin account exists with this email, a reset link has been sent.",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  // Admin accounts are in AdminAccount table, so we know it's an admin
  // No role check needed - AdminAccount only contains ADMIN or SUPERADMIN roles

  const passwordResetToken = await generatePasswordResetToken(email);

  // Queue admin password reset email
  await queuePasswordResetEmail({
    userEmail: passwordResetToken.email,
    userName: existingAdmin.name || "Admin",
    resetToken: passwordResetToken.token,
    expiresAt: passwordResetToken.expires,
    userId: existingAdmin.id,
    timestamp: new Date(),
    ipAddress: ip,
  });

  // Log admin password reset request
  await authAuditHelpers.logPasswordResetRequested(email);

  console.log('[admin-reset] Admin password reset email queued for:', email);

  return {
    success: "Admin password reset email sent!",
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
};
