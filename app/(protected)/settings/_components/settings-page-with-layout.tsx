"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MobileLayout } from "@/components/layouts/MobileLayout";
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
    <MobileLayout
      user={dashboardUser}
      showHeader={true}
      showSidebar={true}
      showBottomBar={false} // Settings might not need bottom bar for better form focus
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EnterpriseSettings user={user} />
        </div>
      </motion.main>
    </MobileLayout>
  );
};
