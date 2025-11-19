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
} from "lucide-react";
import { motion } from "framer-motion";
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
  const [open, setOpen] = useState(false);
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
        "mx-auto flex w-full flex-1 flex-col overflow-hidden md:flex-row",
        "h-screen", // Full screen height for admin dashboard
        "bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-hidden">
            {open ? <Logo /> : <LogoIcon />}
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
              className="flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors duration-150 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full text-left"
            >
              <LogOut className="h-6 w-6 shrink-0 text-red-500 dark:text-red-400" />
              <span className={cn(
                "text-sm",
                !open && "hidden"
              )}>
                Logout
              </span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-10 dark:border-neutral-700 dark:bg-slate-800/90 dark:backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

// Logo Component
const Logo = () => {
  return (
    <Link
      href="/dashboard/admin"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre font-medium text-black dark:text-white"
      >
        Taxomind Admin
      </motion.span>
    </Link>
  );
};

// Logo Icon Component (collapsed state)
const LogoIcon = () => {
  return (
    <Link
      href="/dashboard/admin"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500" />
    </Link>
  );
};

