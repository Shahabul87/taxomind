"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { queueVerificationEmail } from "@/lib/queue/email-queue-simple";
import { rateLimitAuth } from "@/lib/rate-limit";
import * as bcrypt from "bcryptjs";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;
  
  // Get client IP for rate limiting (using fallback for now)
  // Headers not available in server actions called from client components
  const ip = 'unknown';
  
  // Apply rate limiting with IP and email combination
  // Use email-only for rate limiting since we can't get IP in server actions
  const identifier = email;
  const rateLimitResult = await rateLimitAuth('register', identifier);
  
  if (!rateLimitResult.success) {
    return { 
      error: `Too many registration attempts. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    };
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { 
      error: "Email already in use!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }

  try {
    const newUser = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Log successful account creation
    await authAuditHelpers.logAccountCreated(newUser.id, email, name);

    const verificationToken = await generateVerificationToken(email);

    // Queue verification email for background processing
    await queueVerificationEmail({
      userEmail: verificationToken.email,
      userName: name,
      verificationToken: verificationToken.token,
      expiresAt: verificationToken.expires,
      userId: newUser.id,
      timestamp: new Date(),
    });

    return {
      success: "Confirmation email sent!",
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  } catch (e) {
    // Enhanced error logging for production debugging
    console.error('[Register Error]:', {
      error: e,
      message: e instanceof Error ? e.message : 'Unknown error',
      code: (e as any)?.code,
      meta: (e as any)?.meta,
      stack: process.env.NODE_ENV === 'development' ? (e instanceof Error ? e.stack : undefined) : undefined
    });

    // Log registration failure
    await authAuditHelpers.logSuspiciousActivity(
      undefined,
      email,
      'REGISTRATION_ERROR',
      `Registration failed: ${e instanceof Error ? e.message : 'Unknown error'}`
    );

    // Provide more specific error messages in production
    let errorMessage = "Something went wrong during registration!";

    if (e instanceof Error) {
      // Check for Prisma-specific errors
      if (e.message.includes('P2002')) {
        errorMessage = "Email already exists!";
      } else if (e.message.includes('P2021')) {
        errorMessage = "Database table not found. Please contact support.";
      } else if (e.message.includes('P2025')) {
        errorMessage = "Database record not found.";
      } else if (e.message.includes('connection') || e.message.includes('connect')) {
        errorMessage = "Database connection error. Please try again later.";
      }
    }

    return {
      error: errorMessage,
      rateLimitInfo: {
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset
      }
    };
  }
};