"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  RefreshCw, 
  Home, 
  Sparkles, 
  ArrowRight, 
  Timer, 
  Play, 
  CheckCheck,
  Target,
  BookOpen,
  Users,
  Rocket,
  TrendingUp,
  Zap,
  Shield,
  Award,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnterpriseProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  onReset?: () => void;
  onHome?: () => void;
  lastAutoSave?: Date | null;
  className?: string;
  completedSteps?: number[];
  estimatedTimeRemaining?: string;
  userRole?: 'educator' | 'enterprise' | 'premium';
}

const ENTERPRISE_STEP_DATA = [
  {
    id: 1,
    label: 'Foundation',
    description: 'Course Identity',
    icon: BookOpen,
    estimate: '3-5 min',
    tooltip: 'Establish course foundation with title, description, and strategic positioning',
    keyTasks: ['Course Title', 'Description', 'Category', 'Learning Objectives'],
    priority: 'critical',
    completionCriteria: ['Title (min 10 chars)', 'Description (min 50 chars)', 'Category selected']
  },
  {
    id: 2,
    label: 'Audience',
    description: 'Learner Profiling',
    icon: Users,
    estimate: '2-4 min',
    tooltip: 'Define target audience with precision for maximum engagement and retention',
    keyTasks: ['Demographics', 'Skill Level', 'Learning Preferences', 'Success Metrics'],
    priority: 'high',
    completionCriteria: ['Target audience defined', 'Difficulty level set', 'Prerequisites listed']
  },
  {
    id: 3,
    label: 'Architecture',
    description: 'Content Strategy',
    icon: Brain,
    estimate: '5-8 min',
    tooltip: 'Design comprehensive learning architecture with proven pedagogical frameworks',
    keyTasks: ['Learning Path', 'Assessment Strategy', 'Content Modules', 'Bloom\'s Taxonomy'],
    priority: 'critical',
    completionCriteria: ['2+ learning goals', '2+ Bloom\'s categories', 'Assessment plan']
  },
  {
    id: 4,
    label: 'Launch',
    description: 'Course Deployment',
    icon: Rocket,
    estimate: '2-3 min',
    tooltip: 'Final review, optimization, and intelligent course generation with enterprise controls',
    keyTasks: ['Quality Assurance', 'Final Review', 'Generation Settings', 'Launch Strategy'],
    priority: 'high',
    completionCriteria: ['All previous steps complete', 'Quality checks passed']
  }
];

const ENTERPRISE_METRICS = {
  educator: {
    badge: 'Educator',
    color: 'blue',
    features: ['Basic Analytics', 'Standard Templates', 'Email Support']
  },
  premium: {
    badge: 'Premium',
    color: 'purple',
    features: ['Advanced Analytics', 'Custom Templates', 'Priority Support', 'A/B Testing']
  },
  enterprise: {
    badge: 'Enterprise',
    color: 'emerald',
    features: ['Enterprise Analytics', 'Custom Branding', '24/7 Support', 'Advanced AI', 'White-label']
  }
};

export function EnterpriseProgressTracker({ 
  currentStep, 
  totalSteps, 
  onStepClick,
  onReset,
  onHome,
  lastAutoSave,
  className,
  completedSteps = [],
  estimatedTimeRemaining = "8-12 min",
  userRole = 'premium'
}: EnterpriseProgressTrackerProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const [animatedProgress, setAnimatedProgress] = React.useState(0);
  const userMetrics = ENTERPRISE_METRICS[userRole];

  // Animate progress bar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  const totalEstimatedTime = ENTERPRISE_STEP_DATA.reduce((acc, step) => {
    const min = parseInt(step.estimate.split('-')[0]);
    const max = parseInt(step.estimate.split('-')[1] || step.estimate.split(' ')[0]);
    return acc + (min + max) / 2;
  }, 0);

  const completedTime = ENTERPRISE_STEP_DATA
    .filter((_, index) => index + 1 < currentStep)
    .reduce((acc, step) => {
      const min = parseInt(step.estimate.split('-')[0]);
      const max = parseInt(step.estimate.split('-')[1] || step.estimate.split(' ')[0]);
      return acc + (min + max) / 2;
    }, 0);

  return (
    <TooltipProvider>
      <div className={cn("w-full h-full flex flex-col", className)}>
        {/* Enterprise Header */}
        <Card className="p-4 mb-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                  Course Progress
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enterprise Creation Workflow
                </p>
              </div>
            </div>
            <Badge 
              variant={userRole === 'enterprise' ? 'default' : 'secondary'}
              className={cn(
                "px-3 py-1 font-medium",
                userRole === 'enterprise' && "bg-emerald-500 hover:bg-emerald-600",
                userRole === 'premium' && "bg-purple-500 hover:bg-purple-600 text-white",
                userRole === 'educator' && "bg-blue-500 hover:bg-blue-600 text-white"
              )}
            >
              {userMetrics.badge}
            </Badge>
          </div>

          {/* Progress Overview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Overall Progress</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {Math.round(animatedProgress)}% Complete
              </span>
            </div>
            
            <Progress 
              value={animatedProgress} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{Math.round(completedTime)} min completed</span>
              <span>~{Math.round(totalEstimatedTime - completedTime)} min remaining</span>
            </div>
          </div>
        </Card>

        {/* Steps Container */}
        <div className="flex-1 space-y-3">
          {ENTERPRISE_STEP_DATA.map((stepData, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            const isClickable = onStepClick && stepNumber <= currentStep;
            const IconComponent = stepData.icon;
            
            return (
              <Tooltip key={stepNumber}>
                <TooltipTrigger asChild>
                  <Card
                    className={cn(
                      "p-4 transition-all duration-300 ease-out cursor-pointer",
                      "hover:shadow-md active:scale-[0.98]",
                      isCompleted && [
                        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
                        "shadow-green-100/50 dark:shadow-green-900/20"
                      ],
                      isCurrent && [
                        "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20",
                        "border-indigo-200 dark:border-indigo-700",
                        "shadow-indigo-200/60 dark:shadow-indigo-900/30",
                        "ring-2 ring-indigo-200 dark:ring-indigo-800"
                      ],
                      isUpcoming && [
                        "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700",
                        "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      ],
                      !isClickable && "cursor-default"
                    )}
                    onClick={() => isClickable && onStepClick(stepNumber)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Step Icon & Number */}
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                        isCompleted && "bg-green-500 text-white",
                        isCurrent && "bg-gradient-to-r from-indigo-500 to-purple-500 text-white",
                        isUpcoming && "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <IconComponent className="h-6 w-6" />
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "font-bold text-base",
                            isCompleted && "text-green-700 dark:text-green-400",
                            isCurrent && "text-indigo-700 dark:text-indigo-300",
                            isUpcoming && "text-slate-600 dark:text-slate-400"
                          )}>
                            {stepData.label}
                          </h4>
                          
                          <div className="flex items-center gap-2">
                            {stepData.priority === 'critical' && (
                              <Badge variant="destructive" className="text-xs px-2 py-0">
                                Critical
                              </Badge>
                            )}
                            <span className={cn(
                              "text-xs font-medium",
                              isCompleted && "text-green-600 dark:text-green-400",
                              isCurrent && "text-indigo-600 dark:text-indigo-400",
                              isUpcoming && "text-slate-500 dark:text-slate-400"
                            )}>
                              {isCompleted ? "✓ Complete" : 
                               isCurrent ? "In Progress" : 
                               stepData.estimate}
                            </span>
                          </div>
                        </div>
                        
                        <p className={cn(
                          "text-sm mb-2",
                          isCompleted && "text-green-600 dark:text-green-500",
                          isCurrent && "text-indigo-600 dark:text-indigo-400",
                          isUpcoming && "text-slate-500 dark:text-slate-500"
                        )}>
                          {stepData.description}
                        </p>

                        {/* Key Tasks Preview */}
                        {isCurrent && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {stepData.keyTasks.slice(0, 2).map((task, taskIndex) => (
                                <Badge
                                  key={taskIndex}
                                  variant="outline"
                                  className="text-xs px-2 py-0 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
                                >
                                  {task}
                                </Badge>
                              ))}
                              {stepData.keyTasks.length > 2 && (
                                <Badge variant="outline" className="text-xs px-2 py-0">
                                  +{stepData.keyTasks.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Step Number Badge */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                        isCompleted && "bg-green-500 border-green-400 text-white",
                        isCurrent && "bg-indigo-500 border-indigo-400 text-white",
                        isUpcoming && "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400"
                      )}>
                        {stepNumber}
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                
                <TooltipContent side="right" className="max-w-sm">
                  <div className="space-y-2">
                    <div className="font-medium">{stepData.label} - {stepData.description}</div>
                    <div className="text-xs text-muted-foreground">{stepData.tooltip}</div>
                    
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        Key Tasks:
                      </div>
                      <ul className="text-xs space-y-0.5">
                        {stepData.keyTasks.map((task, taskIndex) => (
                          <li key={taskIndex} className="flex items-center gap-1">
                            <Circle className="h-2 w-2 text-indigo-400" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-600">
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Estimated time: {stepData.estimate}
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Enterprise Features Footer */}
        <Card className="p-3 mt-4 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Enterprise Features Active
              </span>
            </div>
            
            <div className="flex gap-1">
              {onHome && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onHome} className="h-8 w-8 p-0">
                      <Home className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to course selection</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {onReset && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onReset} className="h-8 w-8 p-0">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset progress and start over</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </Card>

        {/* Auto-save Status */}
        {lastAutoSave && (
          <div className="mt-3 flex justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Saved {new Date(lastAutoSave).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}