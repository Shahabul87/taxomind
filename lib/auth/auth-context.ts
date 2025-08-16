"use client";

import { useSession } from "next-auth/react";

export interface AuthContextUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
  isTeacher?: boolean;
  isAffiliate?: boolean;
}

export function useAuth() {
  const { data, status } = useSession();
  return {
    user: (data?.user || null) as AuthContextUser | null,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}


