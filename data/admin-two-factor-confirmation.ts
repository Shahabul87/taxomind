import { db } from "@/lib/db";

export const getTwoFactorConfirmationByAdminId = async (adminId: string) => {
  try {
    const twoFactorConfirmation = await db.adminTwoFactorConfirmation.findUnique({
      where: { adminId }
    });

    return twoFactorConfirmation;
  } catch {
    return null;
  }
};
