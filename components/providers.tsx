"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "./providers/theme-provider";
import { InterventionProvider } from "@/components/sam/interventions";
import { RealtimeProvider } from "./providers/realtime-provider";
import { SAM_FEATURES } from "@/lib/sam/feature-flags";

// Stable auth provider with no auto-reload functionality
const CustomAuthProvider = ({ children, session }: { children: ReactNode, session: unknown }) => {
  // No error handling or reload logic - keep it simple and stable
  return (
    <SessionProvider
      session={session as Parameters<typeof SessionProvider>[0]['session']}
      refetchInterval={0} // Never auto-refetch
      refetchOnWindowFocus={false} // Never refetch on focus
      refetchWhenOffline={false} // Never refetch when offline
    >
      {children}
    </SessionProvider>
  );
};

export interface ProvidersProps {
  children: React.ReactNode;
  session?: unknown;
}

/**
 * Inner component that conditionally wraps children with RealtimeProvider
 * Must be inside InterventionProvider since RealtimeProvider uses useInterventionContextOptional
 *
 * NOTE: WebSocket is currently disabled - RealtimeProvider requires a running socket server
 * Set NEXT_PUBLIC_SAM_WEBSOCKET_ENABLED=true to enable when socket server is available
 */
function RealtimeWrapper({ children }: { children: React.ReactNode }) {
  // WebSocket disabled - return children directly without RealtimeProvider
  // This prevents connection errors when no socket server is running
  return <>{children}</>;

  /*
  // Uncomment when WebSocket server is available:
  return (
    <RealtimeProvider
      autoConnect={true}
      reconnect={{
        enabled: true,
        maxAttempts: 5,
        baseDelay: 1000,
      }}
      heartbeatInterval={30000}
      connectionTimeout={10000}
    >
      {children}
    </RealtimeProvider>
  );
  */
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <CustomAuthProvider session={session}>
      <ThemeProvider>
        <InterventionProvider
          maxVisible={3}
          defaultAutoDismiss={true}
          defaultAutoDismissDelay={8000}
        >
          <RealtimeWrapper>
            {children}
          </RealtimeWrapper>
        </InterventionProvider>
      </ThemeProvider>
    </CustomAuthProvider>
  );
} 
