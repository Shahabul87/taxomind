"use client";

import React from "react";
import { SmartHeader } from "./smart-header";
import { SmartSidebar } from "./smart-sidebar";
import type { User as NextAuthUser } from "next-auth";

interface DashboardLayoutWrapperProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ user, children }: DashboardLayoutWrapperProps) {
  return (
    <>
      <SmartHeader user={user} />
      <SmartSidebar user={user} />
      <div className="ml-[72px] min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 pt-16 transition-all duration-300">
        {children}
      </div>
    </>
  );
}
