"use client";

import { motion } from "framer-motion";
import { EnterpriseSettings } from "./enterprise-settings";
import { SettingsUser } from "@/types/settings";

interface SettingsPageClientProps {
  user: SettingsUser;
}

/**
 * @deprecated Use SettingsPageWithLayout instead
 * This component is kept for backward compatibility
 */
export const SettingsPageClient = ({ user }: SettingsPageClientProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-gray-900 dark:text-gray-100"
    >
      <EnterpriseSettings user={user} />
    </motion.div>
  );
};
