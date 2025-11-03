"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";
import { EnterpriseSettings } from "./enterprise-settings";
import { SettingsUser } from "@/types/settings";
import type { User as NextAuthUser } from "next-auth";

interface SettingsPageWithLayoutProps {
  user: SettingsUser;
  dashboardUser: NextAuthUser & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}

export const SettingsPageWithLayout = ({ user, dashboardUser }: SettingsPageWithLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Smart Header */}
      <SmartHeader user={dashboardUser} />

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Smart Sidebar */}
        <SmartSidebar user={dashboardUser} />

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex-1 min-h-[calc(100vh-4rem)]",
            "lg:ml-64", // Offset for expanded sidebar
            "transition-all duration-300"
          )}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EnterpriseSettings user={user} />
          </div>
        </motion.main>
      </div>
    </div>
  );
};
