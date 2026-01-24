"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  StepCourseSelection,
  StepLearningProfile,
  StepScheduleConfig,
  StepAIPreview,
  type WizardData,
  type GeneratedPlan,
} from "./wizard-steps";

interface CreateStudyPlanWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: "Course", description: "Select a course" },
  { id: 2, title: "Profile", description: "Learning preferences" },
  { id: 3, title: "Schedule", description: "Set your schedule" },
  { id: 4, title: "Generate", description: "AI-powered plan" },
] as const;

const initialWizardData: WizardData = {
  courseType: "enrolled",
  enrolledCourseId: undefined,
  enrolledCourseTitle: undefined,
  newCourse: undefined,
  skillLevel: "beginner",
  learningStyles: [],
  priorKnowledge: [],
  primaryGoal: "complete",
  targetMastery: "competent",
  motivation: "career",
  startDate: new Date(),
  targetEndDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks from now
  preferredTimeSlot: "flexible",
  dailyStudyHours: 2,
  studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  includePractice: true,
  includeAssessments: true,
  includeProjects: false,
};

export function CreateStudyPlanWizard({
  isOpen,
  onClose,
  onSuccess,
}: CreateStudyPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);
  const [stepValidity, setStepValidity] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: true,
    4: false,
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateWizardData = useCallback((updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateStepValidity = useCallback((step: number, valid: boolean) => {
    setStepValidity((prev) => ({ ...prev, [step]: valid }));
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/sam/study-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Course info
          courseId: wizardData.enrolledCourseId,
          courseTitle: wizardData.enrolledCourseTitle || wizardData.newCourse?.title,
          newCourse: wizardData.newCourse,
          courseType: wizardData.courseType,

          // Learning profile
          skillLevel: wizardData.skillLevel,
          learningStyles: wizardData.learningStyles,
          priorKnowledge: wizardData.priorKnowledge,
          primaryGoal: wizardData.primaryGoal,
          targetMastery: wizardData.targetMastery,
          motivation: wizardData.motivation,

          // Schedule
          startDate: wizardData.startDate.toISOString(),
          targetEndDate: wizardData.targetEndDate.toISOString(),
          preferredTimeSlot: wizardData.preferredTimeSlot,
          dailyStudyHours: wizardData.dailyStudyHours,
          studyDays: wizardData.studyDays,

          // Preferences
          includePractice: wizardData.includePractice,
          includeAssessments: wizardData.includeAssessments,
          includeProjects: wizardData.includeProjects,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setGeneratedPlan(result.data);
        setStepValidity((prev) => ({ ...prev, 4: true }));
        toast.success("Study plan generated successfully!");
      } else {
        toast.error(result.error?.message || "Failed to generate study plan");
      }
    } catch (error) {
      console.error("Error generating study plan:", error);
      toast.error("Failed to generate study plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan) {
      toast.error("Please generate a plan first");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/sam/study-plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Plan data
          plan: generatedPlan,

          // Course info
          courseId: wizardData.enrolledCourseId,
          newCourse: wizardData.newCourse,
          courseType: wizardData.courseType,

          // Learning profile (for metadata)
          skillLevel: wizardData.skillLevel,
          learningStyles: wizardData.learningStyles,
          targetMastery: wizardData.targetMastery,
          motivation: wizardData.motivation,

          // Schedule
          startDate: wizardData.startDate.toISOString(),
          targetEndDate: wizardData.targetEndDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Study plan saved successfully! Check your Goals tab.");
        onSuccess?.();
        handleClose();
      } else {
        toast.error(result.error?.message || "Failed to save study plan");
      }
    } catch (error) {
      console.error("Error saving study plan:", error);
      toast.error("Failed to save study plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setWizardData(initialWizardData);
    setGeneratedPlan(null);
    setStepValidity({ 1: false, 2: false, 3: true, 4: false });
    onClose();
  };

  const canProceed = stepValidity[currentStep];
  const isLastStep = currentStep === 4;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create AI Study Plan
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {STEPS[currentStep - 1].description}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                    currentStep > step.id
                      ? "bg-emerald-500 text-white"
                      : currentStep === step.id
                      ? "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium hidden sm:block",
                    currentStep >= step.id
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 rounded-full transition-colors",
                    currentStep > step.id
                      ? "bg-emerald-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepCourseSelection
                  data={wizardData}
                  onUpdate={updateWizardData}
                  isValid={stepValidity[1]}
                  onValidChange={(valid) => updateStepValidity(1, valid)}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepLearningProfile
                  data={wizardData}
                  onUpdate={updateWizardData}
                  isValid={stepValidity[2]}
                  onValidChange={(valid) => updateStepValidity(2, valid)}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepScheduleConfig
                  data={wizardData}
                  onUpdate={updateWizardData}
                  isValid={stepValidity[3]}
                  onValidChange={(valid) => updateStepValidity(3, valid)}
                />
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepAIPreview
                  data={wizardData}
                  onUpdate={updateWizardData}
                  isValid={stepValidity[4]}
                  onValidChange={(valid) => updateStepValidity(4, valid)}
                  generatedPlan={generatedPlan}
                  onGeneratedPlanChange={setGeneratedPlan}
                  isGenerating={isGenerating}
                  onGenerate={handleGenerate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={isSaving}
          >
            {currentStep === 1 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          <div className="flex gap-3">
            {isLastStep ? (
              <Button
                onClick={handleSave}
                disabled={!canProceed || isSaving}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Study Plan
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateStudyPlanWizard;
