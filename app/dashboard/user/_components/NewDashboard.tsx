"use client";

import React, { useState } from "react";
import type { User as NextAuthUser } from "next-auth";
import { ActivityStream } from "./ActivityStream";
import { EmptyState } from "./EmptyState";
import { useActivities } from "@/hooks/use-activities";
import { Loader2, LayoutDashboard, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

// Enhanced Gamification Components
import {
  LevelProgressBar,
  AchievementsWidget,
  LeaderboardWidget,
  StreakWidget,
} from "@/components/gamification";

// Learning Command Center
import { LearningCommandCenter } from "./learning-command-center";

// SkillBuildTracker Dashboard - Connected to real API
import SkillBuildTrackerConnected from "@/components/dashboard/smart/skill-build-tracker-connected";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
}

type DashboardView = "learning" | "gamification" | "skills";

export function NewDashboard({ user, viewMode }: NewDashboardProps) {
  const [dashboardView, setDashboardView] = useState<DashboardView>("learning");

  const {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    updateActivity,
    deleteActivity,
  } = useActivities();

  // Event handlers
  const handleViewDetails = (id: string) => {
    console.log("View details for activity:", id);
    // TODO: Navigate to activity detail page or open modal
  };

  const handleEdit = (id: string) => {
    console.log("Edit activity:", id);
    // TODO: Open edit modal with activity data
  };

  const handleDelete = async (id: string) => {
    const success = await deleteActivity(id);
    if (!success) {
      console.error("Failed to delete activity");
      // TODO: Show error toast
    }
  };

  const handleToggleComplete = async (id: string) => {
    const activity = activities.find((a) => a.id === id);
    if (!activity) return;

    const isCompleted =
      activity.status === "SUBMITTED" || activity.status === "GRADED";

    const success = await updateActivity(id, {
      status: isCompleted ? "NOT_STARTED" : "SUBMITTED",
      completedAt: isCompleted ? undefined : new Date(),
    });

    if (!success) {
      console.error("Failed to toggle activity completion");
      // TODO: Show error toast
    }
  };

  const handleToggleFavorite = async (id: string) => {
    console.log("Toggle favorite for activity:", id);
    // TODO: Implement favorite functionality (add to schema if needed)
  };

  // View Toggle Component (shared across views)
  const ViewToggle = () => (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-slate-200/50 bg-white/80 p-1 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <Button
        variant={dashboardView === "learning" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("learning")}
        className="gap-2"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span className="hidden sm:inline">Learning</span>
      </Button>
      <Button
        variant={dashboardView === "skills" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("skills")}
        className="gap-2"
      >
        <Target className="h-4 w-4" />
        <span className="hidden sm:inline">Skills</span>
      </Button>
      <Button
        variant={dashboardView === "gamification" ? "default" : "ghost"}
        size="sm"
        onClick={() => setDashboardView("gamification")}
        className="gap-2"
      >
        <Trophy className="h-4 w-4" />
        <span className="hidden sm:inline">Achievements</span>
      </Button>
    </div>
  );

  // Show Learning Command Center as the default view
  if (dashboardView === "learning") {
    return (
      <div className="relative min-h-full">
        <ViewToggle />
        <LearningCommandCenter user={user} />
      </div>
    );
  }

  // Skills view with SkillBuildTracker (connected to real API)
  if (dashboardView === "skills") {
    return (
      <div className="relative min-h-full">
        <ViewToggle />
        <div className="pt-16">
          <SkillBuildTrackerConnected />
        </div>
      </div>
    );
  }

  // Gamification view
  return (
    <div className="relative min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <ViewToggle />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Gamification Section */}
        <section className="mb-8 pt-12">
          {/* Level Progress Header */}
          <div className="mb-6">
            <LevelProgressBar />
          </div>

          {/* Gamification Widgets Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Streak Widget */}
            <div className="lg:col-span-1">
              <StreakWidget />
            </div>

            {/* Achievements Widget */}
            <div className="lg:col-span-2">
              <AchievementsWidget maxDisplay={6} />
            </div>
          </div>

          {/* Leaderboard (Full Width) */}
          <div className="mt-6">
            <LeaderboardWidget maxDisplay={5} />
          </div>
        </section>

        {/* Activity Stream Section */}
        {isLoading && activities.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                Loading activities...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activities.length === 0 ? (
          <EmptyState type="activities" />
        ) : (
          <ActivityStream
            activities={activities}
            viewMode={viewMode}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleComplete={handleToggleComplete}
            onToggleFavorite={handleToggleFavorite}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
