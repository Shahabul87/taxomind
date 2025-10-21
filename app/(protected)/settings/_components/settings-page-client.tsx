"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EnterpriseSettings } from "./enterprise-settings";
import { SettingsUser } from "@/types/settings";

interface SettingsPageClientProps {
  user: SettingsUser;
}

export const SettingsPageClient = ({ user }: SettingsPageClientProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "min-h-screen",
        "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
        "dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-700",
        "text-gray-900 dark:text-gray-100"
      )}
    >
      <EnterpriseSettings user={user} />
    </motion.div>
  );
};
