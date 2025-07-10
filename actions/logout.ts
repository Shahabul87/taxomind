"use server";

import { signOut } from "@/auth";

export const logout = async () => {
  try {
    console.log("Server action logout called");
    
    // Sign out without redirect to avoid NEXT_REDIRECT error in console
    await signOut({ redirect: false });
    
    console.log("Server action logout completed successfully");
    
    // Return success - let client handle redirect
    return { success: true };
  } catch (error) {
    console.error("Server action logout error:", error);
    
    // Return error info
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};