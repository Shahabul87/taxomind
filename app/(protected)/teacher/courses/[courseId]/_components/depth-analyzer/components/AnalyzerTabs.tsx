"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Shield, Layers, BookOpen, Target, Lightbulb } from "lucide-react";
import type { TabValue } from "../types";

interface AnalyzerTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isEnhanced: boolean;
  hasDeepContentAnalysis: boolean;
  children: React.ReactNode;
}

export function AnalyzerTabs({
  activeTab,
  onTabChange,
  isEnhanced,
  hasDeepContentAnalysis,
  children,
}: AnalyzerTabsProps) {
  const tabs: Array<{
    value: TabValue;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    showBadge?: boolean;
  }> = [
    {
      value: "overview",
      label: "Overview",
      icon: Gauge,
      color: "violet",
    },
    {
      value: "standards",
      label: "Standards",
      icon: Shield,
      color: "emerald",
      showBadge: isEnhanced,
    },
    {
      value: "deep-analysis",
      label: "Deep Analysis",
      icon: Layers,
      color: "cyan",
      showBadge: hasDeepContentAnalysis,
    },
    {
      value: "chapters",
      label: "Chapters",
      icon: BookOpen,
      color: "indigo",
    },
    {
      value: "objectives",
      label: "Objectives",
      icon: Target,
      color: "purple",
    },
    {
      value: "recommendations",
      label: "Tips",
      icon: Lightbulb,
      color: "amber",
    },
  ];

  const getTabColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      violet: "data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=active]:shadow-violet-500/10",
      emerald: "data-[state=active]:text-emerald-600 data-[state=active]:dark:text-emerald-400 data-[state=active]:shadow-emerald-500/10",
      cyan: "data-[state=active]:text-cyan-600 data-[state=active]:dark:text-cyan-400 data-[state=active]:shadow-cyan-500/10",
      indigo: "data-[state=active]:text-indigo-600 data-[state=active]:dark:text-indigo-400 data-[state=active]:shadow-indigo-500/10",
      purple: "data-[state=active]:text-purple-600 data-[state=active]:dark:text-purple-400 data-[state=active]:shadow-purple-500/10",
      amber: "data-[state=active]:text-amber-600 data-[state=active]:dark:text-amber-400 data-[state=active]:shadow-amber-500/10",
    };
    return colorMap[color] || colorMap.violet;
  };

  const getBadgeColor = (color: string) => {
    const colorMap: Record<string, string> = {
      emerald: "bg-emerald-400",
      cyan: "bg-cyan-400",
    };
    return colorMap[color] || "bg-violet-400";
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <div className="w-full overflow-x-auto scrollbar-hidden -mx-2 sm:mx-0 px-2 sm:px-0">
        <TabsList className="inline-flex w-full min-w-[700px] sm:min-w-0 sm:grid sm:grid-cols-6 gap-1 sm:gap-1.5 backdrop-blur-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl h-auto p-1.5 sm:p-2 shadow-inner">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`relative text-[10px] xs:text-xs sm:text-sm font-medium px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-300
                data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-white/50 dark:data-[state=inactive]:hover:bg-slate-700/50
                data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-lg
                flex-shrink-0 whitespace-nowrap
                ${getTabColorClasses(tab.color)}`}
            >
              <tab.icon className="h-3.5 w-3.5 mr-1.5 hidden sm:inline-block" />
              {tab.label}
              {tab.showBadge && (
                <span className="ml-1.5 flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${getBadgeColor(tab.color)} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${getBadgeColor(tab.color).replace("-400", "-500")}`} />
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
