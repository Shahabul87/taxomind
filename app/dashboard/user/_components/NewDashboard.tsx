"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { User as NextAuthUser } from "next-auth";
import { Loader2 } from "lucide-react";

// Learning Tabs Container — not code-split (always visible on default tab)
import { LearningTabsContainer } from "./learning-tabs";

// Shared overlays — rendered once at wrapper level (eliminates 10× duplication)
import {
  CelebrationOverlay,
  useCelebration,
} from "@/components/sam/CelebrationOverlay";
import {
  ToolApprovalDialog,
  useToolApproval,
} from "@/components/sam/ToolApprovalDialog";

// Feature Gate for new tabs
import { FeatureGate } from "@/lib/dashboard/FeatureGate";

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

const CognitiveTab = dynamic(
  () => import("./tabs/CognitiveTab").then((m) => m.CognitiveTab),
  { ssr: false, loading: TabSkeleton },
);

const SkillsTab = dynamic(
  () => import("./tabs/SkillsTab").then((m) => m.SkillsTab),
  { ssr: false, loading: TabSkeleton },
);

const PracticeTab = dynamic(
  () => import("./tabs/PracticeTab").then((m) => m.PracticeTab),
  { ssr: false, loading: TabSkeleton },
);

const GamificationTab = dynamic(
  () => import("./tabs/GamificationTab").then((m) => m.GamificationTab),
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

const InnovationTab = dynamic(
  () => import("./tabs/InnovationTab").then((m) => m.InnovationTab),
  { ssr: false, loading: TabSkeleton },
);

const CreateTab = dynamic(
  () => import("./tabs/CreateTab").then((m) => m.CreateTab),
  { ssr: false, loading: TabSkeleton },
);

const CareerTab = dynamic(
  () => import("./tabs/CareerTab").then((m) => m.CareerTab),
  { ssr: false, loading: TabSkeleton },
);

const SocialTab = dynamic(
  () => import("./tabs/SocialTab").then((m) => m.SocialTab),
  { ssr: false, loading: TabSkeleton },
);

const InsightsTab = dynamic(
  () => import("./tabs/InsightsTab").then((m) => m.InsightsTab),
  { ssr: false, loading: TabSkeleton },
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardView =
  | "learning"
  | "analytics"
  | "cognitive"
  | "skills"
  | "practice"
  | "gamification"
  | "goals"
  | "gaps"
  | "innovation"
  | "create"
  | "career"
  | "social"
  | "insights";

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
      case "learning":
        return (
          <div className="relative min-h-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10">
            <LearningTabsContainer
              user={user}
              onCreateStudyPlan={onCreateStudyPlan}
            />
          </div>
        );

      case "analytics":
        return <AnalyticsTab userId={userId} />;

      case "cognitive":
        return <CognitiveTab userId={userId} />;

      case "skills":
        return <SkillsTab userId={userId} />;

      case "practice":
        return <PracticeTab />;

      case "gamification":
        return <GamificationTab userId={userId} viewMode={viewMode} />;

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

      case "innovation":
        return <InnovationTab userId={userId} />;

      case "create":
        return <CreateTab userId={userId} />;

      case "career":
        return (
          <FeatureGate feature="CAREER_TAB_ENABLED" fallback={<TabSkeleton />}>
            <CareerTab userId={userId} />
          </FeatureGate>
        );

      case "social":
        return (
          <FeatureGate feature="SOCIAL_TAB_ENABLED" fallback={<TabSkeleton />}>
            <SocialTab userId={userId} />
          </FeatureGate>
        );

      case "insights":
        return (
          <FeatureGate
            feature="INSIGHTS_TAB_ENABLED"
            fallback={<TabSkeleton />}
          >
            <InsightsTab />
          </FeatureGate>
        );

      default:
        return <GamificationTab userId={userId} viewMode={viewMode} />;
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
