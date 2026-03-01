"use server";

import { signOut } from "@/auth";
import { logger } from '@/lib/logger';
import { currentUser } from "@/lib/auth";
import { authAuditHelpers } from "@/lib/audit/auth-audit";

export const logout = async (forced: boolean = false) => {
  try {
    // Get user info before logout for audit logging
    const user = await currentUser();
    
    // Sign out without redirect to avoid NEXT_REDIRECT error in console
    await signOut({ redirect: false });

    // Log successful logout
    if (user) {
      await authAuditHelpers.logSignOut(user.id, user.email || undefined, forced);
    } else {
      // Log anonymous logout attempt
      await authAuditHelpers.logSignOut(undefined, undefined, forced);
    }

    // Return success - let client handle redirect
    return { success: true };
  } catch (error: any) {
    logger.error("Server action logout error:", error);
    
    // Log logout error
    const user = await currentUser().catch(() => null);
    if (user) {
      await authAuditHelpers.logSuspiciousActivity(
        user.id, 
        user.email || undefined, 
        'LOGOUT_ERROR', 
        `Logout failed: ${error?.message || 'Unknown error'}`
      );
    }
    
    // Return error info
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};