import { db } from "@/lib/db";

export const getTwoFactorConfirmationByAdminId = async (adminAccountId: string) => {
  try {
    const twoFactorConfirmation = await db.adminTwoFactorConfirmation.findUnique({
      where: { adminAccountId }
    });

    return twoFactorConfirmation;
  } catch {
    return null;
  }
};
