"use server";

import * as z from "zod";

import { db } from "@/lib/db";
import { SettingsSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { hashPassword, verifyPassword } from "@/lib/passwordUtils";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const settings = async (
  values: z.infer<typeof SettingsSchema>
) => {
  const user = await currentUser();

  if (!user || !user.id) {
    return { error: "Unauthorized" }
  }

  const dbUser = await getUserById(user.id);

  if (!dbUser) {
    return { error: "Unauthorized" }
  }

  if (user.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }

  if (values.email && values.email !== user.email) {
    const existingUser = await getUserByEmail(values.email);

    if (existingUser && existingUser.id !== user.id) {
      return { error: "Email already in use!" }
    }

    const verificationToken = await generateVerificationToken(
      values.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: "Verification email sent!" };
  }

  if (values.password && values.newPassword && dbUser.password) {
    const passwordsMatch = await verifyPassword(
      values.password,
      dbUser.password,
    );

    if (!passwordsMatch) {
      // Log failed password change attempt
      await authAuditHelpers.logSuspiciousActivity(
        user.id, 
        user.email || undefined, 
        'PASSWORD_CHANGE_FAILED', 
        'Incorrect current password provided'
      );
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await hashPassword(values.newPassword);
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  // Prepare update data - only include fields that are provided
  const updateData: any = {};

  // Basic account info
  if (values.name !== undefined) updateData.name = values.name;
  if (values.email !== undefined) updateData.email = values.email;
  if (values.password !== undefined) updateData.password = values.password;
  if (values.isTwoFactorEnabled !== undefined) updateData.isTwoFactorEnabled = values.isTwoFactorEnabled;

  // Profile fields
  if (values.phone !== undefined) updateData.phone = values.phone || null;
  if (values.image !== undefined) updateData.image = values.image || null;
  if (values.bio !== undefined) updateData.bio = values.bio || null;
  if (values.location !== undefined) updateData.location = values.location || null;
  if (values.website !== undefined) updateData.website = values.website || null;
  if (values.learningStyle !== undefined) updateData.learningStyle = values.learningStyle;

  // Update user in database
  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: updateData
  });

  // TODO: Handle notification and privacy preferences
  // These should be stored in separate UserPreferences table
  // For now, we just acknowledge them in the response

  // Log setting changes
  if (values.password) {
    await authAuditHelpers.logPasswordChanged(user.id!, user.email!, 'settings');
  }

  if (values.isTwoFactorEnabled !== undefined && values.isTwoFactorEnabled !== dbUser.isTwoFactorEnabled) {
    if (values.isTwoFactorEnabled) {
      await authAuditHelpers.logTwoFactorEnabled(user.id!, user.email!);
    } else {
      await authAuditHelpers.logTwoFactorDisabled(user.id!, user.email!);
    }
  }

  return { success: "Settings Updated!" }
}