"use client";

import React from "react";
import { HomeSidebar } from "./home-sidebar";

// More flexible typing that accepts any user-like object
interface SidebarContainerProps {
  user: any;
  children?: React.ReactNode;
  onDashboardTabChange?: (tab: string) => void;
  currentDashboardTab?: string;
}

export function SidebarContainer({ user, children, onDashboardTabChange, currentDashboardTab }: SidebarContainerProps) {
  // Only render the sidebar if there's a logged-in user
  if (user) {
    // If children are provided, render them inside the sidebar
    if (children) {
      return <HomeSidebar>{children}</HomeSidebar>;
    }
    // Otherwise just render the sidebar without content
    return <HomeSidebar />;
  }

  // Otherwise just render the children
  return <>{children}</>;
} 