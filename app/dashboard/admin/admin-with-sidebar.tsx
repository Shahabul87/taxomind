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
  Bell,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        <LayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: (
        <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Courses",
      href: "/dashboard/admin/courses",
      icon: (
        <BookOpen className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: (
        <BarChart3 className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Reports",
      href: "/dashboard/admin/reports",
      icon: (
        <FileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/dashboard/admin/settings",
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
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
              <LogOut className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
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
      {children ? (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-10 dark:border-neutral-700 dark:bg-slate-800/90 dark:backdrop-blur-sm">
            {children}
          </div>
        </div>
      ) : (
        <DashboardContent user={user} />
      )}
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

// Dashboard Content Component
const DashboardContent = ({ user }: { user: User }) => {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex h-full w-full flex-1 flex-col gap-4 overflow-y-auto rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-10 dark:border-neutral-700 dark:bg-slate-800/90 dark:backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back, {user.name || "Admin"}! Here&apos;s your overview.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Users",
              value: "1,234",
              change: "+12%",
              icon: Users,
            },
            {
              title: "Total Courses",
              value: "56",
              change: "+3 new",
              icon: BookOpen,
            },
            {
              title: "Active Sessions",
              value: "89",
              change: "+23",
              icon: BarChart3,
            },
            {
              title: "Reports",
              value: "24",
              change: "+5 pending",
              icon: FileText,
            },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Sections */}
        <div className="grid flex-1 gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="flex flex-col bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                {[
                  {
                    title: "New user registered",
                    time: "2 minutes ago",
                    color: "bg-blue-500",
                  },
                  {
                    title: "Course published",
                    time: "15 minutes ago",
                    color: "bg-green-500",
                  },
                  {
                    title: "Report submitted",
                    time: "1 hour ago",
                    color: "bg-yellow-500",
                  },
                  {
                    title: "System update",
                    time: "3 hours ago",
                    color: "bg-purple-500",
                  },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={cn("mt-1 h-2 w-2 rounded-full", activity.color)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="flex flex-col bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Add User", icon: Users },
                  { label: "Create Course", icon: BookOpen },
                  { label: "View Reports", icon: FileText },
                  { label: "System Settings", icon: Settings },
                ].map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
