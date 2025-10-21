"use client";

import { motion } from "framer-motion";
import {
  User,
  Shield,
  Lock,
  Bell,
  DollarSign,
  Eye
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
      {/* Desktop Tabs */}
      <div className="hidden lg:block">
        <nav className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative px-6 py-4 text-sm font-medium transition-all duration-300",
                  "hover:text-blue-600 dark:hover:text-blue-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400"
                )}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Dropdown */}
      <div className="lg:hidden">
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as SettingsTab)}
          className={cn(
            "w-full px-4 py-3 rounded-lg",
            "bg-white dark:bg-slate-800",
            "border border-slate-200 dark:border-slate-700",
            "text-slate-900 dark:text-slate-100",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
