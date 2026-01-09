"use client";

import { motion } from "framer-motion";
import {
  User,
  Shield,
  Lock,
  Bell,
  DollarSign,
  Eye,
  Calendar,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsTab } from "@/types/settings";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  isTeacher: boolean;
  isAffiliate: boolean;
}

const tabs = [
  {
    id: "account" as SettingsTab,
    label: "Account",
    icon: User,
    description: "Basic account information"
  },
  {
    id: "security" as SettingsTab,
    label: "Security",
    icon: Shield,
    description: "Password and authentication"
  },
  {
    id: "privacy" as SettingsTab,
    label: "Privacy",
    icon: Lock,
    description: "Data and privacy controls"
  },
  {
    id: "profile" as SettingsTab,
    label: "Profile",
    icon: Eye,
    description: "Public profile settings"
  },
  {
    id: "notifications" as SettingsTab,
    label: "Notifications",
    icon: Bell,
    description: "Email and push preferences"
  },
  {
    id: "financial" as SettingsTab,
    label: "Financial",
    icon: DollarSign,
    description: "Wallet and earnings",
    requiresRole: true
  },
  {
    id: "calendar" as SettingsTab,
    label: "Calendar",
    icon: Calendar,
    description: "Google Calendar sync"
  },
  {
    id: "ai-providers" as SettingsTab,
    label: "AI Providers",
    icon: Bot,
    description: "Choose AI providers for tasks"
  }
];

export const SettingsTabs = ({
  activeTab,
  onTabChange,
  isTeacher,
  isAffiliate
}: SettingsTabsProps) => {
  const filteredTabs = tabs.filter(tab => {
    if (tab.requiresRole) {
      return isTeacher || isAffiliate;
    }
    return true;
  });

  return (
    <div className="mb-8">
      {/* Desktop Tabs - Analytics Style */}
      <div className="hidden lg:block">
        <div className={cn(
          "bg-white/80 dark:bg-slate-800/80",
          "backdrop-blur-sm",
          "p-1 rounded-xl",
          "border border-slate-200/50 dark:border-slate-700/50",
          "shadow-sm",
          "inline-flex gap-1"
        )}>
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  "flex items-center gap-2",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-lg border-2 border-blue-400/50 dark:border-indigo-400/50 pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Mobile Dropdown - Analytics Style */}
      <div className="lg:hidden">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as SettingsTab)}
          className={cn(
            "w-full px-4 py-3 rounded-xl",
            "bg-white/80 dark:bg-slate-800/80",
            "backdrop-blur-sm",
            "border border-slate-200/50 dark:border-slate-700/50",
            "text-slate-900 dark:text-slate-100",
            "shadow-sm",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-all duration-200"
          )}
        >
          {filteredTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
