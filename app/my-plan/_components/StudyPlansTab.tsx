"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Calendar, Clock, BookOpen, Loader2, Target } from "lucide-react";
import { format, differenceInWeeks } from "date-fns";
import { UpdateStudyPlanModal } from "./UpdateStudyPlanModal";
import { toast } from "sonner";

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  weeklyHoursGoal: number;
  status: string;
  aiGenerated: boolean;
  aiPrompt: string | null;
  createdAt: string;
}

export function StudyPlansTab() {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<StudyPlan | null>(null);
  const [planToUpdate, setPlanToUpdate] = useState<StudyPlan | null>(null);

  const fetchStudyPlans = async () => {
    try {
      const response = await fetch("/api/dashboard/study-plans");
      const result = await response.json();

      if (result.success) {
        setStudyPlans(result.data);
      } else {
        toast.error(result.error?.message || "Failed to load study plans");
      }
    } catch (error) {
      console.error("Error fetching study plans:", error);
      toast.error("Failed to load study plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlans();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/dashboard/study-plans/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setStudyPlans((prev) => prev.filter((plan) => plan.id !== id));
        toast.success("Study plan deleted successfully");
      } else {
        toast.error(result.error?.message || "Failed to delete study plan");
      }
    } catch (error) {
      console.error("Error deleting study plan:", error);
      toast.error("Failed to delete study plan");
    } finally {
      setDeleteLoading(null);
      setPlanToDelete(null);
    }
  };

  const handleUpdateSuccess = (updatedPlan: StudyPlan) => {
    setStudyPlans((prev) =>
      prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
    );
    setPlanToUpdate(null);
    toast.success("Study plan updated successfully");
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

  if (studyPlans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Study Plans Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            Create your first study plan from the dashboard to organize your learning schedule.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {studyPlans.map((plan) => {
          const weeks = differenceInWeeks(new Date(plan.endDate), new Date(plan.startDate));
          const totalHours = weeks * plan.weeklyHoursGoal;

          return (
            <Card key={plan.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
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
                    {plan.aiGenerated && (
                      <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
                        AI
                      </Badge>
                    )}
                  </div>
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
                    {format(new Date(plan.startDate), "MMM dd, yyyy")} -{" "}
                    {format(new Date(plan.endDate), "MMM dd, yyyy")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{plan.weeklyHoursGoal} hours/week</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {weeks} weeks plan
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Total: ~{totalHours} hours
                      </p>
                    </div>
                  </div>
                </div>

                {plan.aiPrompt && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                      AI Prompt:
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                      {plan.aiPrompt}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
        <UpdateStudyPlanModal
          isOpen={!!planToUpdate}
          onClose={() => setPlanToUpdate(null)}
          plan={planToUpdate}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}
