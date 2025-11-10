"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Calendar, Clock, Target, BookOpen, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { UpdateCoursePlanModal } from "./UpdateCoursePlanModal";
import { toast } from "sonner";

interface CoursePlan {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  targetCompletionDate: string | null;
  daysPerWeek: number;
  timePerSession: number;
  difficultyLevel: string;
  courseType: string;
  learningGoals: string | null;
  studyReminders: boolean;
  progressCheckins: boolean;
  milestoneAlerts: boolean;
  syncToGoogleCalendar: boolean;
  status: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    imageUrl: string | null;
  } | null;
}

export function CoursePlansTab() {
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<CoursePlan | null>(null);
  const [planToUpdate, setPlanToUpdate] = useState<CoursePlan | null>(null);

  const fetchCoursePlans = async () => {
    try {
      const response = await fetch("/api/dashboard/course-plans");
      const result = await response.json();

      if (result.success) {
        setCoursePlans(result.data);
      } else {
        toast.error(result.error?.message || "Failed to load course plans");
      }
    } catch (error) {
      console.error("Error fetching course plans:", error);
      toast.error("Failed to load course plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursePlans();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/dashboard/course-plans/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setCoursePlans((prev) => prev.filter((plan) => plan.id !== id));
        toast.success("Course plan deleted successfully");
      } else {
        toast.error(result.error?.message || "Failed to delete course plan");
      }
    } catch (error) {
      console.error("Error deleting course plan:", error);
      toast.error("Failed to delete course plan");
    } finally {
      setDeleteLoading(null);
      setPlanToDelete(null);
    }
  };

  const handleUpdateSuccess = (updatedPlan: CoursePlan) => {
    setCoursePlans((prev) =>
      prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
    );
    setPlanToUpdate(null);
    toast.success("Course plan updated successfully");
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

  if (coursePlans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            No Course Plans Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
            Create your first course plan from the dashboard to start organizing your learning journey.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {coursePlans.map((plan) => (
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
                  {format(new Date(plan.startDate), "MMM dd, yyyy")}
                  {plan.targetCompletionDate &&
                    ` - ${format(new Date(plan.targetCompletionDate), "MMM dd, yyyy")}`}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {plan.daysPerWeek}x/week, {plan.timePerSession}min
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{plan.difficultyLevel}</Badge>
                <Badge variant="outline">{plan.courseType}</Badge>
              </div>

              {plan.learningGoals && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                      {plan.learningGoals}
                    </p>
                  </div>
                </div>
              )}

              {plan.course && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Course: <span className="font-medium">{plan.course.title}</span>
                  </p>
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
        <UpdateCoursePlanModal
          isOpen={!!planToUpdate}
          onClose={() => setPlanToUpdate(null)}
          plan={planToUpdate}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
}
