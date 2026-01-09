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
 * WebSocket is enabled when SAM_FEATURES.WEBSOCKET_ENABLED is true.
 * The RealtimeProvider gracefully handles missing WebSocket server by checking
 * for NEXT_PUBLIC_WS_URL before attempting connection.
 */
function RealtimeWrapper({ children }: { children: React.ReactNode }) {
  // Enable RealtimeProvider when feature flag is on
  // The provider itself handles graceful degradation when no WS server is available
  if (SAM_FEATURES.WEBSOCKET_ENABLED) {
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
  }

  // Feature flag disabled - skip RealtimeProvider entirely
  return <>{children}</>;
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
