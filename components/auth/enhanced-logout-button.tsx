"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
}

export function useLogout(options?: {
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    options?.onStart?.();
    try {
      await signOut({ callbackUrl: "/auth/login" });
    } finally {
      setIsLoggingOut(false);
      options?.onComplete?.();
    }
  }, [isLoggingOut, options]);

  return { isLoggingOut, logout };
}

export function EnhancedLogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true,
  className = "",
  onLogoutStart,
  onLogoutComplete,
}: LogoutButtonProps) {
  const { isLoggingOut, logout } = useLogout({
    onStart: onLogoutStart,
    onComplete: onLogoutComplete,
  });

  return (
    <button
      onClick={logout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 ${className}`}
      data-variant={variant}
      data-size={size}
    >
      {showIcon && (
        isLoggingOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )
      )}
      {showText && (isLoggingOut ? "Signing out..." : "Sign Out")}
    </button>
  );
}
