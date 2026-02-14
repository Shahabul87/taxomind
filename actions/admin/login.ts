"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { headers } from "next/headers";

import { db } from "@/lib/db";
import { adminSignIn } from "@/auth.admin"; // PHASE 2: Use admin-specific signIn
import { LoginSchema } from "@/schemas";
import { getAdminAccountByEmail } from "@/data/admin";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { queueVerificationEmail, queue2FAEmail } from "@/lib/queue/email-queue-simple";
import {
  generateVerificationToken,
  generateTwoFactorToken
} from "@/lib/tokens";
import {
  getTwoFactorConfirmationByAdminId
} from "@/data/admin-two-factor-confirmation";
import {
  decryptTOTPSecret,
  verifyTOTPToken,
  verifyRecoveryCode
} from "@/lib/auth/totp";
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
 * Admin Login Action - Separate from user login
 *
 * Enhanced security for administrator authentication:
 * - Stricter rate limiting
 * - ADMIN role verification
 * - Enhanced audit logging
 * - IP address tracking
 * - Future: Mandatory MFA enforcement
 */
export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
) => {
  const ip = await getClientIp();
  console.log('[admin-login] Admin login attempt started from IP:', ip);

  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    console.log('[admin-login] Invalid fields');
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;

  // Stricter rate limiting for admin logins (3 attempts instead of 5)
  const identifier = email;
  const rateLimitResult = await rateLimitAuth('admin-login', identifier);

  if (!rateLimitResult.success) {
    console.log('[admin-login] Rate limit exceeded');
    await authAuditHelpers.logSignInFailed(
      email,
      `Admin login rate limit exceeded - ${rateLimitResult.retryAfter}s remaining`,
      'credentials',
      {
        attemptCount: rateLimitResult.remaining,
        failureReason: `Admin rate limit - ${rateLimitResult.limit} attempts`
      }
    );
    return {
      error: `Too many admin login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }

  const existingAdmin = await getAdminAccountByEmail(email);

  if (!existingAdmin || !existingAdmin.email || !existingAdmin.password) {
    console.log('[admin-login] Invalid credentials - admin not found');
    await authAuditHelpers.logSignInFailed(email, 'Admin login - Admin not found or invalid credentials', 'credentials');
    return { error: "Invalid admin credentials!" };
  }

  // Role verification (SUPERADMIN or ADMIN allowed)
  console.log('[admin-login] Admin found with role:', existingAdmin.role);

  if (!existingAdmin.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingAdmin.email,
    );

    await queueVerificationEmail({
      userEmail: verificationToken.email,
      userName: existingAdmin.name || "Admin",
      verificationToken: verificationToken.token,
      expiresAt: verificationToken.expires,
      userId: existingAdmin.id,
      timestamp: new Date(),
      isResend: true,
    });

    console.log('[admin-login] Admin email not verified - sent verification email');
    return { success: "Admin verification email sent!" };
  }

  if (existingAdmin.isTwoFactorEnabled && existingAdmin.email) {
    if (code) {
      let isCodeValid = false;
      let verificationMethod = '';

      type AdminWithTotp = typeof existingAdmin & {
        totpEnabled?: boolean;
        totpVerified?: boolean;
        totpSecret?: string;
        recoveryCodes?: string[];
      };
      const adminWithTotp = existingAdmin as AdminWithTotp;

      if (adminWithTotp.totpEnabled && adminWithTotp.totpVerified && adminWithTotp.totpSecret) {
        try {
          if (code.length === 6 && /^\d{6}$/.test(code)) {
            const decryptedSecret = await decryptTOTPSecret(adminWithTotp.totpSecret);
            isCodeValid = verifyTOTPToken(code, decryptedSecret);
            verificationMethod = 'TOTP';
            console.log('[admin-login] TOTP verification attempted');
          }

          if (!isCodeValid && code.length > 6) {
            const recoveryResult = await verifyRecoveryCode(code, adminWithTotp.recoveryCodes || []);
            if (recoveryResult.isValid) {
              isCodeValid = true;
              verificationMethod = 'Recovery Code';

              if (recoveryResult.remainingCodes) {
                await db.adminAccount.update({
                  where: { id: existingAdmin.id },
                  data: { recoveryCodes: recoveryResult.remainingCodes }
                });
              }
              console.log('[admin-login] Admin recovery code used');
            }
          }
        } catch (error) {
          console.log('[admin-login] TOTP/recovery code error:', error instanceof Error ? error.message : String(error));
        }
      }

      if (!isCodeValid) {
        const twoFactorToken = await db.twoFactorToken.findFirst({
          where: { token: code },
        });

        if (twoFactorToken) {
          const hasExpired = new Date(twoFactorToken.expires) < new Date();
          if (!hasExpired) {
            isCodeValid = true;
            verificationMethod = 'Email 2FA';
            await db.twoFactorToken.delete({ where: { id: twoFactorToken.id } });
            console.log('[admin-login] Email 2FA validated');
          } else {
            console.log('[admin-login] Email 2FA expired');
          }
        }
      }

      if (!isCodeValid) {
        console.log('[admin-login] 2FA invalid code');
        await authAuditHelpers.logTwoFactorFailed(existingAdmin.id, existingAdmin.email, {
          failureReason: 'Invalid 2FA code (admin login)'
        });
        return { error: "Invalid admin 2FA code!" };
      }

      const existingConfirmation = await getTwoFactorConfirmationByAdminId(existingAdmin.id);
      if (existingConfirmation) {
        await db.adminTwoFactorConfirmation.delete({ where: { id: existingConfirmation.id } });
      }

      await db.adminTwoFactorConfirmation.create({ data: { adminAccountId: existingAdmin.id } });
      console.log(`[admin-login] Admin 2FA validated via ${verificationMethod}`);

      await authAuditHelpers.logTwoFactorVerified(existingAdmin.id, existingAdmin.email);
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingAdmin.email);

      await queue2FAEmail({
        userEmail: twoFactorToken.email,
        userName: existingAdmin.name || "Admin",
        code: twoFactorToken.token,
        expiresAt: twoFactorToken.expires,
        userId: existingAdmin.id,
        timestamp: new Date(),
        ipAddress: ip,
      });

      console.log('[admin-login] Admin 2FA initiated');

      return {
        twoFactor: true,
        totpEnabled: existingAdmin.totpEnabled && existingAdmin.totpVerified
      };
    }
  }

  // Verify password using passwordUtils (supports both bcrypt and noble/hashes)
  const { verifyPassword } = await import("@/lib/passwordUtils");
  const passwordMatches = await verifyPassword(password, existingAdmin.password);

  if (!passwordMatches) {
    console.log('[admin-login] Invalid credentials - wrong password');
    await authAuditHelpers.logSignInFailed(email, 'Admin login - Invalid password', 'credentials');
    return { error: "Invalid admin credentials!" };
  }

  console.log('[admin-login] Admin credentials validated, calling adminSignIn');

  // Enhanced audit logging for admin logins
  await authAuditHelpers.logSignInSuccess(existingAdmin.id, existingAdmin.email, 'credentials', {
    userRole: existingAdmin.role
  });

  // Call adminSignIn to establish admin session
  // NextAuth v5 signIn throws NEXT_REDIRECT on success - let it propagate
  try {
    await adminSignIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard/admin",
    });

    console.log('[admin-login] Admin session established successfully');

    return {
      success: "Admin authenticated!",
      redirectTo: callbackUrl || "/dashboard/admin",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  } catch (error: unknown) {
    // Re-throw NEXT_REDIRECT errors - they should bubble up to Next.js
    const errorObj = error as { message?: string; digest?: string; type?: string };
    if (errorObj?.message?.includes("NEXT_REDIRECT") || errorObj?.digest?.includes("NEXT_REDIRECT")) {
      console.log('[admin-login] Admin signin successful (redirect thrown)');
      throw error;
    }

    console.error('[admin-login] Failed to establish admin session:', error);

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // Password was already verified above, so this is a session/callback issue
          console.error('[admin-login] CredentialsSignin error despite valid password - check signIn callback, emailVerified, or 2FA confirmation');
          return { error: "Admin session could not be established. Check server logs for details." };
        case "AccessDenied":
          return { error: "Admin access denied. Your account may need verification." };
        default:
          return { error: `Admin sign-in failed: ${error.type}` };
      }
    }

    return { error: "An unexpected error occurred during admin login." };
  }
};
