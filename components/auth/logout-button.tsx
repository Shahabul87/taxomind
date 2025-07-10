"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export const LogoutButton = ({
  children,
  className
}: LogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      
      // Use NextAuth's client-side signOut - most reliable method
      // This handles the session cleanup and redirect automatically
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });
      
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: force redirect to clear any cached state
      window.location.href = "/";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <span 
      onClick={onClick} 
      className={`flex cursor-pointer hover:text-cyan-500 transition-colors ${className}`}
      style={{ opacity: isLoading ? 0.7 : 1 }}
    >
      {isLoading ? "Signing out..." : children}
    </span>
  );
};