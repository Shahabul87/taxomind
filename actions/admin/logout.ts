"use server";

import { adminSignOut as signOut } from "@/auth.admin";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";

export const adminLogout = async () => {
  try {
    // Sign out admin without redirect to avoid NEXT_REDIRECT error
    await signOut({ redirect: false });

    logger.info("Admin logout successful");

    // Return success - let client handle redirect
    return { success: true };
  } catch (error: any) {
    logger.error("Admin logout error:", error);

    // Return error info
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Server-side redirect function for admin logout
export const adminLogoutAndRedirect = async () => {
  try {
    // Sign out admin
    await signOut({ redirect: false });

    logger.info("Admin logout and redirect initiated");
  } catch (error: any) {
    logger.error("Admin logout error:", error);
  }

  // Always redirect to admin login page
  redirect("/admin/auth/login");
};