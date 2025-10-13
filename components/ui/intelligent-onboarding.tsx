"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Brain, 
  Target, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  X,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  actionText?: string;
  actionUrl?: string;
  completed?: boolean;
}

interface OnboardingFlow {
  role: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  estimatedTime: string;
}

interface IntelligentOnboardingProps {
  userRole: "USER" | "ADMIN";
  isTeacher?: boolean;
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const teacherOnboarding: OnboardingFlow = {
  role: "USER",
  title: "Welcome to AI-Enhanced Teaching",
  description: "Let's get you set up with powerful AI tools to create better courses and assessments.",
  estimatedTime: "5 minutes",
  steps: [
    {
      id: "ai-course-creation",
      title: "AI Course Creation Assistant",
      description: "Generate course structures, learning objectives, and content with AI",
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Our AI assistant can help you create comprehensive courses in minutes. It will:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Generate course outlines based on your topic</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Create learning objectives aligned with Bloom&apos;s taxonomy</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Suggest chapter structures and content</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "Try AI Course Creation",
      actionUrl: "/teacher/create"
    },
    {
      id: "blooms-taxonomy",
      title: "Bloom's Taxonomy Integration",
      description: "Create assessments that target specific cognitive levels",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Our platform automatically integrates Bloom&apos;s Taxonomy to ensure your assessments cover all cognitive levels:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"].map((level, index) => (
              <Badge key={level} variant="outline" className="justify-center">
                {level}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The AI will automatically suggest questions for each level and provide cognitive analytics.
          </p>
        </div>
      ),
      actionText: "Explore Assessments",
      actionUrl: "/teacher/courses"
    },
    {
      id: "ai-exam-assistant",
      title: "AI Exam & Quiz Generator",
      description: "Generate high-quality questions with explanations instantly",
      icon: <Sparkles className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Create comprehensive exams and quizzes with our AI assistant:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Multiple choice, true/false, and short answer questions</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Automatic difficulty calibration</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Detailed explanations for each answer</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "analytics-dashboard",
      title: "Predictive Analytics Dashboard",
      description: "Monitor student progress and identify at-risk learners",
      icon: <BookOpen className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get insights into your students&apos; learning patterns:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Real-time progress tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Early intervention recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Cognitive gap analysis</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "View Analytics",
      actionUrl: "/teacher/courses"
    }
  ]
};

const studentOnboarding: OnboardingFlow = {
  role: "USER",
  title: "Welcome to Personalized Learning",
  description: "Discover how AI adapts to your learning style and helps you succeed.",
  estimatedTime: "3 minutes",
  steps: [
    {
      id: "adaptive-learning",
      title: "Adaptive Learning Path",
      description: "AI creates a personalized learning journey based on your progress",
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Your learning experience adapts to you:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Content difficulty adjusts to your performance</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Personalized study recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Smart scheduling based on your learning patterns</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "Start Learning",
      actionUrl: "/my-courses"
    },
    {
      id: "ai-tutor",
      title: "AI Tutor Assistant",
      description: "Get instant help and explanations whenever you need them",
      icon: <GraduationCap className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Your personal AI tutor is available 24/7:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Context-aware explanations</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Step-by-step problem solving</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Adaptive questioning to check understanding</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "Try AI Tutor",
      actionUrl: "/ai-tutor"
    },
    {
      id: "progress-tracking",
      title: "Smart Progress Tracking",
      description: "Monitor your learning journey with detailed analytics",
      icon: <Target className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Track your progress with intelligent insights:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Cognitive skill development tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Learning pattern analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Personalized improvement suggestions</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "View Dashboard",
      actionUrl: "/dashboard"
    }
  ]
};

const adminOnboarding: OnboardingFlow = {
  role: "ADMIN",
  title: "Welcome to AI-Powered Administration",
  description: "Manage your institution with advanced analytics and AI insights.",
  estimatedTime: "4 minutes",
  steps: [
    {
      id: "institutional-analytics",
      title: "Institutional Analytics",
      description: "Monitor performance across all courses and departments",
      icon: <BookOpen className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Get comprehensive insights into your institution:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Cross-course performance benchmarking</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Teacher effectiveness metrics</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Student success predictions</span>
            </li>
          </ul>
        </div>
      ),
      actionText: "View Analytics",
      actionUrl: "/admin/dashboard"
    },
    {
      id: "ai-content-management",
      title: "AI Content Management",
      description: "Oversee AI-generated content quality and consistency",
      icon: <Brain className="w-6 h-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Ensure quality and consistency across AI-generated content:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Content quality monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>AI usage analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span>Institutional guideline enforcement</span>
            </li>
          </ul>
        </div>
      )
    }
  ]
};

export const IntelligentOnboarding = ({
  userRole,
  isTeacher,
  isVisible,
  onComplete,
  onSkip
}: IntelligentOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const getOnboardingFlow = () => {
    if (userRole === "ADMIN") {
      return adminOnboarding;
    } else if (isTeacher) {
      return teacherOnboarding;
    } else {
      return studentOnboarding;
    }
  };

  const flow = getOnboardingFlow();
  const progress = ((currentStep + 1) / flow.steps.length) * 100;

  const handleNext = () => {
    if (currentStep < flow.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleComplete = () => {
    // Save onboarding completion to localStorage
    localStorage.setItem(`onboarding-completed-${userRole}`, "true");
    onComplete();
  };

  if (!isVisible) return null;

  const currentStepData = flow.steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {flow.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {flow.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Step {currentStep + 1} of {flow.steps.length}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {flow.estimatedTime} total
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      {currentStepData.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {currentStepData.title}
                      </CardTitle>
                      <CardDescription>
                        {currentStepData.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentStepData.content}
                  
                  {currentStepData.actionText && currentStepData.actionUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          handleStepComplete(currentStepData.id);
                          window.open(currentStepData.actionUrl, '_blank');
                        }}
                      >
                        {currentStepData.actionText}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onSkip}>
                Skip tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep === flow.steps.length - 1 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};