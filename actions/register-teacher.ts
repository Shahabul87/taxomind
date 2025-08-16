"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { RegisterTeacherSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/passwordUtils";
import { logger } from "@/lib/logger";

export const registerTeacher = async (values: z.infer<typeof RegisterTeacherSchema>) => {
  const validatedFields = RegisterTeacherSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, qualifications, experience, subjects } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return { error: "Email already in use!" };
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Parse subjects string into array
    const subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);

    // Create user with USER role initially (can become teacher after verification)
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // All users start as USER role
        isTeacher: false, // Will be set to true after verification
      },
    });

    // Create instructor verification request
    await db.instructorVerification.create({
      data: {
        userId: user.id,
        status: "PENDING",
        documentType: "QUALIFICATION",
        documentUrl: "", // Will be updated when documents are uploaded
        verificationNotes: `Qualifications: ${qualifications}\nExperience: ${experience}\nSubjects: ${subjectsArray.join(', ')}`,
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "CREATE",
        entityType: "USER",
        entityId: user.id,
        context: {
          type: "TEACHER_REGISTRATION",
          email,
          name,
          qualifications,
          experience,
          subjects: subjectsArray
        }
      }
    });

    // Send verification email
    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    logger.info(`Teacher registration initiated for ${email}`);

    return { 
      success: "Registration successful! Please check your email to verify your account. Your instructor application will be reviewed by our admin team." 
    };
  } catch (error) {
    logger.error("Error in teacher registration:", error);
    return { error: "Something went wrong during registration!" };
  }
};