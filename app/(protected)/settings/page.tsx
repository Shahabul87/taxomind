"use client";

import { PrivateDetailsSettingsPage } from "./private-details";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/hooks/use-current-user";
import ConditionalHeader from "@/app/(homepage)/user-header";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const user = useCurrentUser();
  
  // Convert undefined to null to match expected type
  const userForHeader = user && user.id ? {
    id: user.id,
    role: user.role
  } : null;

  return (
    <>
      <ConditionalHeader user={userForHeader} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "min-h-screen pt-20",
          "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
          "dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-700",
          "text-gray-900 dark:text-gray-100"
        )}
      >
        <PrivateDetailsSettingsPage />
      </motion.div>
    </>
  );
}

export default SettingsPage;