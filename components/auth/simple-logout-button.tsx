"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { logger } from '@/lib/logger';

interface SimpleLogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
}

export const SimpleLogoutButton = ({
  children,
  className
}: SimpleLogoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);

      // Use NextAuth's client-side signOut - most reliable method
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      });

    } catch (error) {
      logger.error("SimpleLogoutButton: Logout error:", error);
      // Fallback: force redirect
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