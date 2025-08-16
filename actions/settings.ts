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
        user.email, 
        'PASSWORD_CHANGE_FAILED', 
        'Incorrect current password provided'
      );
      return { error: "Incorrect password!" };
    }

    const hashedPassword = await hashPassword(values.newPassword);
    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      name: values.name,
      email: values.email,
      password: values.password,
      isTwoFactorEnabled: values.isTwoFactorEnabled,
    }
  });

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