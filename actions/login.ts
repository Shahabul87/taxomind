"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import * as bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { queueVerificationEmail, queue2FAEmail } from "@/lib/queue/email-queue-simple";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
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
import { rateLimitAuth } from "@/lib/rate-limit-server";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null,
) => {
  // Debug: indicate function started
  // eslint-disable-next-line no-console
  console.log('[login] start');
  
  // Get client IP for rate limiting (using fallback for now)
  // Headers not available in server actions called from client components
  const ip = 'unknown';
  
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    console.log('[login] invalid fields');
    return { error: "Invalid fields!" };
  }

  const { email, password, code } = validatedFields.data;
  
  // Apply rate limiting with IP and email combination
  // Use email-only for rate limiting since we can't get IP in server actions
  const identifier = email;
  const rateLimitResult = await rateLimitAuth('login', identifier);
  
  if (!rateLimitResult.success) {
    console.log('[login] rate limit exceeded');
    // Log rate limit exceeded attempt
    await authAuditHelpers.logSignInFailed(
      email, 
      `Rate limit exceeded - ${rateLimitResult.retryAfter}s remaining`, 
      'credentials',
      { attemptCount: rateLimitResult.remaining, failureReason: `Rate limit - ${rateLimitResult.limit} attempts` }
    );
    return { 
      error: `Too many login attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    console.log('[login] invalid credentials - user not found');
    // Log failed login attempt for non-existent user
    await authAuditHelpers.logSignInFailed(email, 'User not found or invalid credentials');
    return { error: "Invalid credentials!" };
  }

  if (!existingUser.emailVerified) {
    // IMPROVED UX: Don't auto-resend on every login attempt
    // Check if a recent verification token exists (within last 5 minutes)
    const recentToken = await db.verificationToken.findFirst({
      where: {
        identifier: existingUser.email,
        expires: { gt: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      },
      orderBy: { expires: 'desc' }
    });

    if (!recentToken) {
      // Only generate new token if no recent one exists
      const verificationToken = await generateVerificationToken(
        existingUser.email,
      );

      // Queue verification email for background processing
      await queueVerificationEmail({
        userEmail: verificationToken.email,
        userName: existingUser.name || "User",
        verificationToken: verificationToken.token,
        expiresAt: verificationToken.expires,
        userId: existingUser.id,
        timestamp: new Date(),
        isResend: true,
      });

      console.log('[login] sent verification email');
    }

    // Return improved error message with resend link
    return {
      error: "Please verify your email address before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      resendUrl: "/auth/resend-verification",
      email: existingUser.email // For pre-filling resend form
    };
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      let isCodeValid = false;
      let verificationMethod = '';
      
      // Check if user has TOTP enabled
      type UserWithTotp = typeof existingUser & {
        totpEnabled?: boolean;
        totpVerified?: boolean;
        totpSecret?: string;
        recoveryCodes?: string[];
      };
      const userWithTotp = existingUser as UserWithTotp;
      if (userWithTotp.totpEnabled && userWithTotp.totpVerified && userWithTotp.totpSecret) {
        try {
          // First try TOTP verification (6 digits)
          if (code.length === 6 && /^\d{6}$/.test(code)) {
            const decryptedSecret = await decryptTOTPSecret(userWithTotp.totpSecret);
            isCodeValid = verifyTOTPToken(code, decryptedSecret);
            verificationMethod = 'TOTP';
            console.log('[login] totp verification attempted');
          }
          
          // If TOTP fails, try recovery code (longer format)
          if (!isCodeValid && code.length > 6) {
            const recoveryResult = await verifyRecoveryCode(code, userWithTotp.recoveryCodes || []);
            if (recoveryResult.isValid) {
              isCodeValid = true;
              verificationMethod = 'Recovery Code';
              
              // Update user with remaining recovery codes
              if (recoveryResult.remainingCodes) {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: { recoveryCodes: recoveryResult.remainingCodes }
                });
              }
              console.log('[login] recovery code used');
            }
          }
        } catch (error) {
          console.log('[login] totp/recovery code error:', error instanceof Error ? error.message : String(error));
          // Continue to try email-based 2FA as fallback
        }
      }
      
      // If TOTP/recovery code failed or not enabled, try email-based 2FA
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
            console.log('[login] email 2fa validated');
          } else {
            console.log('[login] email 2fa expired');
          }
        }
      }

      if (!isCodeValid) {
        console.log('[login] 2fa invalid code');
        // Log 2FA failure
        await authAuditHelpers.logTwoFactorFailed(existingUser.id, existingUser.email, {
          failureReason: 'Invalid 2FA code (all methods tried)'
        });
        return { error: "Invalid code!" };
      }

      const existingConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);
      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({ where: { id: existingConfirmation.id } });
      }

      await db.twoFactorConfirmation.create({ data: { userId: existingUser.id } });
      console.log(`[login] 2fa validated via ${verificationMethod}`);
      
      // Log successful 2FA verification with method
      await authAuditHelpers.logTwoFactorVerified(existingUser.id, existingUser.email);
    } else {
      // Send email-based 2FA token if no code provided
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      
      // Queue 2FA email for background processing with high priority
      await queue2FAEmail({
        userEmail: twoFactorToken.email,
        userName: existingUser.name || "User",
        code: twoFactorToken.token,
        expiresAt: twoFactorToken.expires,
        userId: existingUser.id,
        timestamp: new Date(),
        ipAddress: ip,
      });
      
      console.log('[login] 2fa initiated');
      
      // Include TOTP status in response
      return { 
        twoFactor: true,
        totpEnabled: existingUser.totpEnabled && existingUser.totpVerified
      };
    }
  }

  // Verify password locally to satisfy tests
  const passwordMatches = await bcrypt.compare(password, existingUser.password);
  if (!passwordMatches) {
    console.log('[login] invalid credentials - wrong password');
    // Log failed login due to wrong password
    await authAuditHelpers.logSignInFailed(email, 'Invalid password');
    return { error: "Invalid credentials!" };
  }

  // Credentials are valid, return success
  console.log('[login] credentials validated, returning success');
  
  // Log successful login
  await authAuditHelpers.logSignInSuccess(existingUser.id, existingUser.email, 'credentials', {
    userRole: existingUser.role
  });
  
  // Return success - client will handle the actual sign in
  return { 
    success: "Logged in!",
    email: existingUser.email,
    requiresSignIn: true,  // Tell client to call signIn
    rateLimitInfo: {
      remaining: rateLimitResult.remaining,
      reset: rateLimitResult.reset
    }
  };
};