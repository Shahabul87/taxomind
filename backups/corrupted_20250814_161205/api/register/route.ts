// pages/api/register.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from '@/lib/logger';
import { withAuthRateLimit } from '@/lib/auth-rate-limit-middleware';

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/passwordUtils";

// Force Node.js runtime to avoid Edge Runtime issues with bcrypt
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await withAuthRateLimit(req, 'register');
  
  // If rateLimitResult is a NextResponse (rate limit exceeded), return it
  if (rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }
  
  try {
    // Parse and validate the request body using Zod schema
    const body = await req.json();
    const validatedFields = RegisterSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid fields!" },
        { status: 400 },
        { headers: rateLimitResult.headers as Record<string, string> }
      );
    }

    // Map input fields to match the user model
    const { name, email, password } = validatedFields.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists!" },
        { 
          status: 409,
          headers: rateLimitResult.headers as Record<string, string>
        }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // Generate verification token and send a verification email
    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(verificationToken.email, verificationToken.token);

    // Return success response with rate limit headers
    return NextResponse.json({ 
      user: {
        name: user.name,
        email: user.email,
      }
    }, { 
      status: 201,
      headers: rateLimitResult.headers as Record<string, string>
    });
  } catch (error: any) {
    logger.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: rateLimitResult.headers as Record<string, string>
      }
    );
  }
}

