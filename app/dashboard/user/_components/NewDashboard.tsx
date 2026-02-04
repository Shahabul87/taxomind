"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { User as NextAuthUser } from "next-auth";
import { Loader2 } from "lucide-react";

// ToDos sub-tab promoted to main tab
import { ToDosSubTab } from "./learning-tabs/tabs/ToDosSubTab";

// Shared overlays — rendered once at wrapper level (eliminates 10× duplication)
import {
  CelebrationOverlay,
  useCelebration,
} from "@/components/sam/CelebrationOverlay";
import {
  ToolApprovalDialog,
  useToolApproval,
} from "@/components/sam/ToolApprovalDialog";


// ---------------------------------------------------------------------------
// Skeleton loading fallback for code-split tabs
// ---------------------------------------------------------------------------

function TabSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Loading tab&hellip;
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic tab imports — each tab is code-split and loaded on demand
// ---------------------------------------------------------------------------

const AnalyticsTab = dynamic(
  () => import("./tabs/AnalyticsTab").then((m) => m.AnalyticsTab),
  { ssr: false, loading: TabSkeleton },
);

// Hidden tabs (re-enable later): CognitiveTab, GamificationTab, InnovationTab, CreateTab, CareerTab, SocialTab

const SkillsTab = dynamic(
  () => import("./tabs/SkillsTab").then((m) => m.SkillsTab),
  { ssr: false, loading: TabSkeleton },
);

const PracticeTab = dynamic(
  () => import("./tabs/PracticeTab").then((m) => m.PracticeTab),
  { ssr: false, loading: TabSkeleton },
);

const GoalsTab = dynamic(
  () => import("./tabs/GoalsTab").then((m) => m.GoalsTab),
  { ssr: false, loading: TabSkeleton },
);

const GapsTab = dynamic(
  () => import("./tabs/GapsTab").then((m) => m.GapsTab),
  { ssr: false, loading: TabSkeleton },
);

// Hidden tab (re-enable later): InsightsTab

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardView =
  | "todos"
  | "analytics"
  | "skills"
  | "practice"
  | "goals"
  | "gaps";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
  activeTab: DashboardView;
  onCreateStudyPlan?: () => void;
  studyPlanRefreshKey?: number;
  onCreateCoursePlan?: () => void;
  coursePlanRefreshKey?: number;
  onCreateBlogPlan?: () => void;
  blogPlanRefreshKey?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewDashboard({
  user,
  viewMode,
  activeTab,
  onCreateStudyPlan,
  studyPlanRefreshKey,
  onCreateCoursePlan,
  coursePlanRefreshKey,
  onCreateBlogPlan,
  blogPlanRefreshKey,
}: NewDashboardProps) {
  // Shared hooks — rendered once at wrapper level
  const { celebration, dismissCelebration } = useCelebration();
  const {
    pendingRequest,
    isOpen: isToolApprovalOpen,
    isProcessing: isToolApprovalProcessing,
    handleApprove: handleToolApprove,
    handleDeny: handleToolDeny,
    setIsOpen: setToolApprovalOpen,
  } = useToolApproval({
    onApproved: (_requestId, toolId) => {
      console.log("Tool approved:", toolId);
    },
    onDenied: (_requestId, toolId) => {
      console.log("Tool denied:", toolId);
    },
  });

  const userId = user.id ?? "";

  // Render the active tab content
  function renderTab() {
    switch (activeTab) {
      case "todos":
        return (
          <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-green-900/10 dark:to-emerald-900/10">
            <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
              <ToDosSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />
            </div>
          </div>
        );

      case "analytics":
        return <AnalyticsTab userId={userId} />;

      case "skills":
        return <SkillsTab userId={userId} />;

      case "practice":
        return <PracticeTab />;

      case "goals":
        return (
          <GoalsTab
            user={user}
            onCreateStudyPlan={onCreateStudyPlan}
            studyPlanRefreshKey={studyPlanRefreshKey}
            onCreateCoursePlan={onCreateCoursePlan}
            coursePlanRefreshKey={coursePlanRefreshKey}
            onCreateBlogPlan={onCreateBlogPlan}
            blogPlanRefreshKey={blogPlanRefreshKey}
          />
        );

      case "gaps":
        return <GapsTab />;

      default:
        return (
          <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-green-900/10 dark:to-emerald-900/10">
            <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
              <ToDosSubTab user={user} onCreateStudyPlan={onCreateStudyPlan} />
            </div>
          </div>
        );
    }
  }

  return (
    <>
      {renderTab()}

      {/* Shared overlays — rendered once instead of per-tab */}
      <ToolApprovalDialog
        request={pendingRequest}
        open={isToolApprovalOpen}
        onOpenChange={setToolApprovalOpen}
        onApprove={handleToolApprove}
        onDeny={handleToolDeny}
        isProcessing={isToolApprovalProcessing}
      />
      <CelebrationOverlay
        celebration={celebration}
        onDismiss={dismissCelebration}
      />
    </>
  );
}
