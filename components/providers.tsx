"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";

// Stable auth provider with no auto-reload functionality
const CustomAuthProvider = ({ children, session }: { children: ReactNode, session: any }) => {
  // No error handling or reload logic - keep it simple and stable
  return (
    <SessionProvider 
      session={session}
      refetchInterval={0} // Never auto-refetch
      refetchOnWindowFocus={false} // Never refetch on focus
      refetchWhenOffline={false} // Never refetch when offline
    >
      {children}
    </SessionProvider>
  );
};

export function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode,
  session?: any
}) {
  return (
    <CustomAuthProvider session={session}>
      {children}
    </CustomAuthProvider>
  );
} 