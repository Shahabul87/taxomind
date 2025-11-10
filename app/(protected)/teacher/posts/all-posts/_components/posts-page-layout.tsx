"use client";

import React from "react";
import type { User as NextAuthUser } from "next-auth";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

interface PostsPageLayoutProps {
  user: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
  children: React.ReactNode;
}

export function PostsPageLayout({ user, children }: PostsPageLayoutProps) {
  return (
    <>
      <SmartSidebar user={user} />
      <div className="ml-[72px]">
        <div className="flex flex-col h-screen overflow-hidden">
          <SmartHeader user={user} />
          <div className="flex-1 overflow-y-auto pt-16">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
