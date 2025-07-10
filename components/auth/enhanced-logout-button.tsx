"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EnhancedLogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  redirectTo?: string;
}

export const EnhancedLogoutButton = ({
  children,
  className,
  redirectTo = "/"
}: EnhancedLogoutButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      
      // Using NextAuth's client-side signOut - no NEXT_REDIRECT errors
      await signOut({ 
        callbackUrl: redirectTo,
        redirect: true 
      });
      
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: manual redirect
      router.push(redirectTo);
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

// Alternative approach: Simple logout function for any component
export const useLogout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const logout = async (redirectTo: string = "/") => {
    try {
      setIsLoading(true);
      await signOut({ 
        callbackUrl: redirectTo,
        redirect: true 
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback
      window.location.href = redirectTo;
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
};