"use client";

import React from "react";
import { LayoutSideBar } from "../layout/LayoutSideBar";

// More flexible typing that accepts any user-like object
interface SidebarContainerProps {
  user: any;
  children?: React.ReactNode;
  onDashboardTabChange?: (tab: string) => void;
  currentDashboardTab?: string;
}

export function SidebarContainer({ user, children, onDashboardTabChange, currentDashboardTab }: SidebarContainerProps) {
  // Only render the sidebar if there&apos;s a logged-in user
  if (user) {
    // Render the new slim rail sidebar
    return <LayoutSideBar user={user} />;
  }

  // Otherwise just render the children
  return <>{children}</>;
} 