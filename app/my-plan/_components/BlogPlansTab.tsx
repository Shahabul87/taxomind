"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Calendar, Newspaper, Users, Target, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { UpdateBlogPlanModal } from "./UpdateBlogPlanModal";
import { toast } from "sonner";

interface BlogPlan {
  id: string;
  title: string;
  description: string | null;
  topics: string[];
  startPublishingDate: string;
  postFrequency: string;
  specificDays: string | null;
  platform: string | null;
  targetAudience: string | null;
  contentGoal: string;
  writingReminders: boolean;
  publishingReminders: boolean;
  deadlineAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: string;
  createdAt: string;
}

export function BlogPlansTab() {
  const [blogPlans, setBlogPlans] = useState<BlogPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<BlogPlan | null>(null);
  const [planToUpdate, setPlanToUpdate] = useState<BlogPlan | null>(null);

  const fetchBlogPlans = async () => {
    try {
      const response = await fetch("/api/dashboard/blog-plans");
      const result = await response.json();

      if (result.success) {
        setBlogPlans(result.data);
      } else {
        toast.error(result.error?.message || "Failed to load blog plans");
      }
    } catch (error) {
      console.error("Error fetching blog plans:", error);
      toast.error("Failed to load blog plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPlans();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/dashboard/blog-plans/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setBlogPlans((prev) => prev.filter((plan) => plan.id !== id));
        toast.success("Blog plan deleted successfully");
      } else {
        toast.error(result.error?.message || "Failed to delete blog plan");
      }
    } catch (error) {
      console.error("Error deleting blog plan:", error);
      toast.error("Failed to delete blog plan");
    } finally {
      setDeleteLoading(null);
      setPlanToDelete(null);
    }
  };

  const handleUpdateSuccess = (updatedPlan: BlogPlan) => {
    setBlogPlans((prev) =>
      prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
    );
    setPlanToUpdate(null);
    toast.success("Blog plan updated successfully");
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (blogPlans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Newspaper className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Blog Plans Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            Create your first blog plan from the dashboard to start your content creation journey.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {blogPlans.map((plan) => (
          <Card key={plan.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={
                    plan.status === "ACTIVE"
                      ? "default"
                      : plan.status === "COMPLETED"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {plan.status}
                </Badge>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPlanToUpdate(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPlanToDelete(plan)}
                    disabled={deleteLoading === plan.id}
                  >
                    {deleteLoading === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg">{plan.title}</CardTitle>
              {plan.description && (
                <CardDescription className="line-clamp-2">
                  {plan.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Starts {format(new Date(plan.startPublishingDate), "MMM dd, yyyy")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{plan.postFrequency}</Badge>
                <Badge variant="outline">{plan.contentGoal.replace(/_/g, " ")}</Badge>
              </div>

              {plan.topics.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {plan.platform && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Newspaper className="h-4 w-4" />
                  <span>Platform: {plan.platform}</span>
                </div>
              )}

              {plan.targetAudience && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {plan.targetAudience}
                    </p>
                  </div>
                </div>
              )}

              {plan.specificDays && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Publishing on: {plan.specificDays}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!planToDelete} onOpenChange={() => setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{planToDelete?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => planToDelete && handleDelete(planToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Modal */}
      {planToUpdate && (
        <UpdateBlogPlanModal
          isOpen={!!planToUpdate}
          onClose={() => setPlanToUpdate(null)}
          plan={planToUpdate}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}
