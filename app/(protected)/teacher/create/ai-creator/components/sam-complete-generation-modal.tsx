"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Target, BookOpen, CheckCircle, Loader2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SAMCompleteGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  progress: {
    step: 'idle' | 'description' | 'objectives' | 'chapters' | 'complete';
    message: string;
    percentage: number;
  };
  error: string | null;
  onGenerate: () => void;
  formData: any;
  samContext: string[];
}

const GENERATION_STEPS = [
  {
    id: 'description',
    title: 'Course Description',
    icon: BookOpen,
    description: 'Enhancing course description using SAM context'
  },
  {
    id: 'objectives',
    title: 'Learning Objectives',
    icon: Target,
    description: 'Generating comprehensive learning objectives'
  },
  {
    id: 'chapters',
    title: 'Chapter Structure',
    icon: Brain,
    description: 'Creating Bloom\'s-focused chapters and sections'
  }
];

export function SAMCompleteGenerationModal({
  isOpen,
  onClose,
  isGenerating,
  progress,
  error,
  onGenerate,
  formData,
  samContext
}: SAMCompleteGenerationModalProps) {
  
  const currentStepIndex = GENERATION_STEPS.findIndex(step => step.id === progress.step);
  
  const getStepStatus = (stepIndex: number) => {
    if (currentStepIndex > stepIndex) return 'completed';
    if (currentStepIndex === stepIndex) return 'current';
    return 'pending';
  };

  const canGenerate = formData.courseTitle?.length >= 10 && 
                     formData.courseShortOverview?.length >= 50 && 
                     formData.courseCategory;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-white/20">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  SAM Complete Course Generation
                </DialogTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Generate your entire course structure using SAM's contextual knowledge
                </p>
              </div>
            </div>
            {!isGenerating && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Context Summary */}
          <Card className="p-4 backdrop-blur-sm bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-white/20">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-600" />
              SAM's Context Knowledge
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Course:</span>
                <p className="text-slate-600 dark:text-slate-400 truncate">{formData.courseTitle || 'Untitled'}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Target:</span>
                <p className="text-slate-600 dark:text-slate-400">{formData.targetAudience || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Difficulty:</span>
                <Badge variant="outline" className="text-xs">{formData.difficulty || 'Not set'}</Badge>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Structure:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  {formData.chapterCount || 8} chapters, {formData.sectionsPerChapter || 3} sections each
                </p>
              </div>
            </div>
            
            {samContext.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                  SAM Context ({samContext.length} interactions):
                </span>
                <div className="mt-1 max-h-20 overflow-y-auto">
                  {samContext.slice(-2).map((context, index) => (
                    <p key={index} className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      • {context}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Generation Progress */}
          {isGenerating && (
            <Card className="p-4 backdrop-blur-sm bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-white/20">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                  SAM is working...
                </span>
              </div>
              
              <div className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                    <span>{progress.message}</span>
                    <span>{progress.percentage}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                </div>

                {/* Step Progress */}
                <div className="space-y-2">
                  {GENERATION_STEPS.map((step, index) => {
                    const status = getStepStatus(index);
                    const StepIcon = step.icon;
                    
                    return (
                      <div key={step.id} className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
                        status === 'completed' && "bg-green-500/20 text-green-700 dark:text-green-300",
                        status === 'current' && "bg-blue-500/20 text-blue-700 dark:text-blue-300",
                        status === 'pending' && "bg-slate-200/50 text-slate-500 dark:bg-slate-700/50"
                      )}>
                        <div className={cn(
                          "p-1.5 rounded-lg",
                          status === 'completed' && "bg-green-500",
                          status === 'current' && "bg-blue-500",
                          status === 'pending' && "bg-slate-400"
                        )}>
                          {status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 text-white" />
                          ) : status === 'current' ? (
                            <Loader2 className="h-3 w-3 text-white animate-spin" />
                          ) : (
                            <StepIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs">{step.title}</div>
                          <div className="text-xs opacity-75">{step.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="p-4 backdrop-blur-sm bg-red-500/10 border border-red-300/50">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Generation Failed</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
            </Card>
          )}

          {/* Completion Status */}
          {progress.step === 'complete' && !error && (
            <Card className="p-4 backdrop-blur-sm bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-300/50">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Course Structure Generated Successfully!</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                SAM has created your complete course structure. You can now review and modify each section using the individual SAM assistants.
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {canGenerate ? (
                "✓ Ready to generate course structure"
              ) : (
                "⚠ Complete course title and overview first"
              )}
            </div>
            
            <div className="flex gap-2">
              {!isGenerating && (
                <Button variant="outline" onClick={onClose} size="sm">
                  Cancel
                </Button>
              )}
              
              <Button
                onClick={onGenerate}
                disabled={!canGenerate || isGenerating}
                className={cn(
                  "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600",
                  "shadow-lg hover:shadow-xl transition-all duration-200",
                  isGenerating && "animate-pulse"
                )}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-2" />
                    Generate Course Structure
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}