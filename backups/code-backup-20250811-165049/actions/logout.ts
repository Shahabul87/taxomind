"use server";

import { signOut } from "@/auth";
import { logger } from '@/lib/logger';

export const logout = async () => {
  try {

    // Sign out without redirect to avoid NEXT_REDIRECT error in console
    await signOut({ redirect: false });

    // Return success - let client handle redirect
    return { success: true };
  } catch (error) {
    logger.error("Server action logout error:", error);
    
    // Return error info
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};