"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  Shield,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { adminLogout } from "@/actions/admin/logout";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

interface AdminWithSidebarProps {
  user: User;
  children?: React.ReactNode;
}

export function AdminWithSidebar({ user, children }: AdminWithSidebarProps) {
  const [open, setOpen] = useState(false); // Start with sidebar closed on mobile
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const result = await adminLogout();
      if (result.success) {
        // Redirect to admin login page
        router.push("/admin/auth/login");
      } else {
        console.error("Logout failed:", result.error);
        // Still redirect to login page even on error
        router.push("/admin/auth/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Redirect anyway to be safe
      router.push("/admin/auth/login");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/admin",
      icon: (
        <LayoutDashboard className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: (
        <Users className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Courses",
      href: "/dashboard/admin/courses",
      icon: (
        <BookOpen className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: (
        <BarChart3 className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Agentic Tools",
      href: "/dashboard/admin/agentic-tools",
      icon: (
        <Wrench className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Reports",
      href: "/dashboard/admin/reports",
      icon: (
        <FileText className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: (
        <Settings className="h-6 w-6 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex w-full flex-col md:flex-row",
        "h-screen", // Full screen height for admin dashboard
        "bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-hidden">
            <Logo open={open} />
            <div className="mt-8 flex flex-col gap-2 overflow-y-auto no-scrollbar">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <SidebarLink
              link={{
                label: user.name || user.email || "Admin",
                href: "/dashboard/admin/profile",
                icon: user.image ? (
                  <Image
                    src={user.image}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    width={28}
                    height={28}
                    alt="Avatar"
                  />
                ) : (
                  <Shield className="h-7 w-7 shrink-0 rounded-full bg-neutral-200 p-1 dark:bg-neutral-700" />
                ),
              }}
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left"
            >
              <LogOut className="h-6 w-6 shrink-0 text-red-500 dark:text-red-400" />
              <span
                className={cn(
                  "text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ease-out",
                  open ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                )}
              >
                Logout
              </span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 w-full min-h-0">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto md:rounded-tl-2xl border-t md:border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-slate-800/90 dark:backdrop-blur-sm pt-14 md:pt-0 pb-safe">
          {children}
        </div>
      </div>
    </div>
  );
}

// Logo Component with smooth animation
const Logo = ({ open }: { open: boolean }) => {
  return (
    <Link
      href="/dashboard/admin"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500" />
      <span
        className={cn(
          "whitespace-nowrap overflow-hidden font-medium text-black dark:text-white transition-all duration-300 ease-out",
          open ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
        )}
      >
        Taxomind Admin
      </span>
    </Link>
  );
};
