"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { adminSignIn } from "@/auth.admin"; // PHASE 2: Use admin-specific signIn
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { queueVerificationEmail, queue2FAEmail } from "@/lib/queue/email-queue-simple";
import {
  generateVerificationToken,
  generateTwoFactorToken
} from "@/lib/tokens";
import {
  getTwoFactorConfirmationByUserId
} from "@/data/two-factor-confirmation";
import {
  decryptTOTPSecret,
  verifyTOTPToken,
  verifyRecoveryCode
} from "@/lib/auth/totp";
import { rateLimitAuth } from "@/lib/rate-limit";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

/**
 * Admin Login Action - Separate from user login
 *
 * Enhanced security for administrator authentication:
 * - Stricter rate limiting
 * - ADMIN role verification
 * - Enhanced audit logging
 * - Future: Mandatory MFA enforcement
 */
export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
) => {
  console.log('[admin-login] Admin login attempt started');

  const ip = 'unknown';

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

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    console.log('[admin-login] Invalid credentials - user not found');
    await authAuditHelpers.logSignInFailed(email, 'Admin login - User not found or invalid credentials', 'credentials');
    return { error: "Invalid admin credentials!" };
  }

  // CRITICAL: Verify user has ADMIN role
  if (existingUser.role !== 'ADMIN') {
    console.log('[admin-login] SECURITY ALERT - Non-admin attempted admin login:', email);
    await authAuditHelpers.logSuspiciousActivity(
      existingUser.id,
      email,
      'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      'User without ADMIN role attempted to access admin login'
    );
    return { error: "Access denied. This portal is for administrators only." };
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );

    await queueVerificationEmail({
      userEmail: verificationToken.email,
      userName: existingUser.name || "Admin",
      verificationToken: verificationToken.token,
      expiresAt: verificationToken.expires,
      userId: existingUser.id,
      timestamp: new Date(),
      isResend: true,
    });

    console.log('[admin-login] Admin email not verified - sent verification email');
    return { success: "Admin verification email sent!" };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      let isCodeValid = false;
      let verificationMethod = '';

      type UserWithTotp = typeof existingUser & {
        totpEnabled?: boolean;
        totpVerified?: boolean;
        totpSecret?: string;
        recoveryCodes?: string[];
      };
      const userWithTotp = existingUser as UserWithTotp;

      if (userWithTotp.totpEnabled && userWithTotp.totpVerified && userWithTotp.totpSecret) {
        try {
          if (code.length === 6 && /^\d{6}$/.test(code)) {
            const decryptedSecret = await decryptTOTPSecret(userWithTotp.totpSecret);
            isCodeValid = verifyTOTPToken(code, decryptedSecret);
            verificationMethod = 'TOTP';
            console.log('[admin-login] TOTP verification attempted');
          }

          if (!isCodeValid && code.length > 6) {
            const recoveryResult = await verifyRecoveryCode(code, userWithTotp.recoveryCodes || []);
            if (recoveryResult.isValid) {
              isCodeValid = true;
              verificationMethod = 'Recovery Code';

              if (recoveryResult.remainingCodes) {
                await db.user.update({
                  where: { id: existingUser.id },
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
        await authAuditHelpers.logTwoFactorFailed(existingUser.id, existingUser.email, {
          failureReason: 'Invalid 2FA code (admin login)'
        });
        return { error: "Invalid admin 2FA code!" };
      }

      const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({ where: { id: existingConfirmation.id } });
      }

      await db.twoFactorConfirmation.create({ data: { userId: existingUser.id } });
      console.log(`[admin-login] Admin 2FA validated via ${verificationMethod}`);

      await authAuditHelpers.logTwoFactorVerified(existingUser.id, existingUser.email);
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);

      await queue2FAEmail({
        userEmail: twoFactorToken.email,
        userName: existingUser.name || "Admin",
        code: twoFactorToken.token,
        expiresAt: twoFactorToken.expires,
        userId: existingUser.id,
        timestamp: new Date(),
        ipAddress: ip,
      });

      console.log('[admin-login] Admin 2FA initiated');

      return {
        twoFactor: true,
        totpEnabled: existingUser.totpEnabled && existingUser.totpVerified
      };
    }
  }

  // Verify password using passwordUtils (supports both bcrypt and noble/hashes)
  const { verifyPassword } = await import("@/lib/passwordUtils");
  const passwordMatches = await verifyPassword(password, existingUser.password);

  if (!passwordMatches) {
    console.log('[admin-login] Invalid credentials - wrong password');
    await authAuditHelpers.logSignInFailed(email, 'Admin login - Invalid password', 'credentials');
    return { error: "Invalid admin credentials!" };
  }

  console.log('[admin-login] Admin credentials validated, calling adminSignIn');

  // Enhanced audit logging for admin logins
  await authAuditHelpers.logSignInSuccess(existingUser.id, existingUser.email, 'credentials', {
    userRole: existingUser.role
  });

  // PHASE 2: Call adminSignIn to establish admin session
  // NextAuth v5 signIn throws NEXT_REDIRECT on success
  try {
    await adminSignIn("credentials", {
      email,
      password,
      redirect: false,  // We'll handle redirect in the form
    });

    console.log('[admin-login] Admin session established successfully');
  } catch (error: any) {
    // NextAuth throws NEXT_REDIRECT on successful signin - this is expected
    if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
      console.log('[admin-login] Admin signin successful (redirect thrown)');
      return {
        success: "Admin authenticated!",
        redirectTo: callbackUrl || "/dashboard/admin",
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset
        }
      };
    }

    console.error('[admin-login] Failed to establish admin session:', error);
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid admin credentials!" };
        default:
          return { error: "Failed to sign in as admin!" };
      }
    }

    // Other unexpected errors
    return { error: "An unexpected error occurred during admin login" };
  }

  // If we reach here (no redirect thrown), session was established
  return {
    success: "Admin authenticated!",
    redirectTo: callbackUrl || "/dashboard/admin",
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
};
