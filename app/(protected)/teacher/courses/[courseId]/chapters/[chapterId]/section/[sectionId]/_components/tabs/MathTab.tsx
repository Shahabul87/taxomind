"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Calculator } from "lucide-react";
import { MathEquationForm } from "../_explanations/_MathTabComponents/math-equation-form";
import { ExplanationsList } from "../explanations-list-new";
import { logger } from '@/lib/logger';
import { cn } from "@/lib/utils";

interface MathTabProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData: any;
}

export const MathTab = ({
  courseId,
  chapterId,
  sectionId,
  initialData
}: MathTabProps) => {
  const router = useRouter();
  const [mathEquationsRefreshCounter, setMathEquationsRefreshCounter] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create storage key for this section
  const storageKey = `activeTab_${courseId}_${chapterId}_${sectionId}`;

  // Debounced refresh function to prevent multiple simultaneous calls
  const debouncedRefresh = useCallback(() => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes

    setIsRefreshing(true);
    try {
      router.refresh();
    } catch (error: any) {
      logger.error("Error during router refresh:", error);
    } finally {
      // Reset flag after a delay
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [router, isRefreshing]);

  // Handle math equation added
  const handleMathEquationAdded = useCallback(() => {
    setMathEquationsRefreshCounter(prev => prev + 1);

    // Ensure we stay on the math tab after adding equation
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'math');
    }

    // Use debounced refresh
    debouncedRefresh();
  }, [storageKey, debouncedRefresh]);

  // Edit math explanation (navigate to edit page)
  const handleEdit = useCallback((id: string) => {
    router.push(`/teacher/courses/${courseId}/chapters/${chapterId}/section/${sectionId}/math-equations/${id}`);
  }, [router, courseId, chapterId, sectionId]);

  // Delete math explanation
  const handleDelete = useCallback(async (id: string) => {
    if (isRefreshing) return; // Prevent action during refresh

    try {
      await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/math-equations/${id}`);
      debouncedRefresh();
    } catch (error: any) {
      logger.error("Error deleting math explanation:", error);
      throw error;
    }
  }, [courseId, chapterId, sectionId, debouncedRefresh, isRefreshing]);

  // Create new math explanation
  const handleCreate = useCallback(() => {
    // Scroll to the form section
    const formElement = document.getElementById('math-equation-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Memoize the mapped items to prevent unnecessary re-renders
  const mappedItems = useCallback(() => {
    if (!initialData?.mathExplanations) return [];

    return initialData.mathExplanations.map((item: any) => ({
      id: item.id,
      heading: item.title,
      explanation: item.content, // Using content field for explanation
      equation: item.equation,
      imageUrl: item.imageUrl,
      mode: item.mode,
      type: "math" as const
    }));
  }, [initialData?.mathExplanations]);

  return (
    <div className={cn(
      "p-4 mt-4 rounded-xl",
      "border border-gray-200 dark:border-gray-700/50",
      "bg-white/50 dark:bg-gray-800/40",
      "hover:bg-gray-50 dark:hover:bg-gray-800/60",
      "transition-all duration-200",
      "backdrop-blur-sm"
    )}>
      <div className="font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2 mb-4">
        <div className="flex items-center gap-x-2">
          <div className={cn(
            "p-2 w-fit rounded-lg",
            "bg-purple-50 dark:bg-purple-500/10"
          )}>
            <Calculator className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Additional Math Resources
            </h3>
            <p className="text-xs text-muted-foreground">
              Add mathematical equations and explanations
            </p>
          </div>
        </div>
      </div>

      <div id="math-equation-form" className="mt-4">
        <MathEquationForm
          courseId={courseId}
          chapterId={chapterId}
          sectionId={sectionId}
          initialData={initialData}
          onEquationAdded={handleMathEquationAdded}
        />
      </div>

      {/* Math explanations list */}
      {initialData?.mathExplanations && initialData.mathExplanations.length > 0 && (
        <div className="mt-6">
          <ExplanationsList
            key={`${mathEquationsRefreshCounter}-${initialData?.mathExplanations?.length || 0}`}
            items={mappedItems()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateClick={handleCreate}
            type="math"
          />
        </div>
      )}
    </div>
  );
}; 