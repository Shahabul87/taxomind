"use client";

import React from "react";
import type { User as NextAuthUser } from "next-auth";
import { ActivityStream } from "./ActivityStream";
import { EmptyState } from "./EmptyState";
import { useActivities } from "@/hooks/use-activities";
import { Loader2 } from "lucide-react";

interface NewDashboardProps {
  user: NextAuthUser;
  viewMode: "grid" | "list";
}

export function NewDashboard({ user, viewMode }: NewDashboardProps) {
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

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
