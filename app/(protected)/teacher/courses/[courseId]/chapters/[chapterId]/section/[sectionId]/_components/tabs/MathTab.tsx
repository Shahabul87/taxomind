"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Calculator, Sigma, BookOpen, Sparkles, Zap, Target } from "lucide-react";
import { MathEquationForm } from "../_explanations/_MathTabComponents/math-equation-form";
import { ExplanationsList } from "../explanations-list-new";
import { logger } from '@/lib/logger';

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
    } catch (error) {
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
    } catch (error) {
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
    <div className="animate-fadeIn">

      <div className="space-y-8">
        {/* Math Equation Form - now full width */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-300"></div>
          <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Math Explanation Creator
              </h2>
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
          </div>
        </div>
        
        {/* Math explanations list - now shown below */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Created Math Explanations
          </h3>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                  <ExplanationsList 
                    key={`${mathEquationsRefreshCounter}-${initialData?.mathExplanations?.length || 0}`} // More stable key
                    items={mappedItems()}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCreateClick={handleCreate}
                    type="math"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 