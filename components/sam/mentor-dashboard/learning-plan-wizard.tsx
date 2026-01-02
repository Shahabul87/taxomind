"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Zap,
  Brain,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  description?: string;
  chapters?: Array<{ id: string; title: string }>;
}

interface LearningPlanWizardProps {
  courses: Course[];
  onPlanCreated?: (plan: CreatedPlan) => void;
  onClose?: () => void;
}

interface CreatedPlan {
  id: string;
  courseId: string;
  goal: string;
  targetDate: string;
  timeBudgetMinutes: number;
  weeklyPlan: unknown;
}

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual', icon: '👁️', description: 'Learn through diagrams and videos' },
  { id: 'auditory', label: 'Auditory', icon: '👂', description: 'Learn through listening and discussion' },
  { id: 'reading', label: 'Reading', icon: '📖', description: 'Learn through text and notes' },
  { id: 'kinesthetic', label: 'Hands-on', icon: '🤲', description: 'Learn by doing and practicing' },
] as const;

const FOCUS_AREAS = [
  'Fundamentals',
  'Advanced Concepts',
  'Practical Applications',
  'Problem Solving',
  'Theory & Principles',
  'Real-world Projects',
];

export function LearningPlanWizard({ courses, onPlanCreated, onClose }: LearningPlanWizardProps) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [timeBudget, setTimeBudget] = useState(240); // minutes per week
  const [learningStyle, setLearningStyle] = useState<string>('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return selectedCourse !== '';
      case 2: return goal.length >= 10 && targetDate !== '';
      case 3: return timeBudget >= 30;
      case 4: return true;
      default: return false;
    }
  }, [step, selectedCourse, goal, targetDate, timeBudget]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleCreatePlan = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/sam/mentor/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          goal,
          targetDate: new Date(targetDate).toISOString(),
          timeBudgetMinutes: timeBudget,
          focusAreas,
          preferredLearningStyle: learningStyle || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create plan');
      }

      toast.success('Learning plan created successfully!');
      onPlanCreated?.(data.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create plan');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl mx-4"
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

          <CardHeader className="relative border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">Create Learning Plan</CardTitle>
                  <CardDescription className="text-slate-400">
                    Step {step} of {totalSteps}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <Progress value={progress} className="mt-4 h-1" />
          </CardHeader>

          <CardContent className="relative p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Course */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-white mb-6">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Select a Course</h3>
                  </div>

                  <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {courses.map((course) => (
                      <button
                        key={course.id}
                        onClick={() => setSelectedCourse(course.id)}
                        className={cn(
                          "w-full p-4 rounded-xl text-left transition-all duration-200",
                          "border border-white/10 hover:border-purple-500/50",
                          "bg-white/5 hover:bg-white/10",
                          selectedCourse === course.id && "border-purple-500 bg-purple-500/10"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-white">{course.title}</h4>
                            {course.description && (
                              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            {course.chapters && (
                              <Badge variant="secondary" className="mt-2 bg-white/10 text-slate-300">
                                {course.chapters.length} chapters
                              </Badge>
                            )}
                          </div>
                          {selectedCourse === course.id && (
                            <div className="p-1 rounded-full bg-purple-500">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {courses.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No courses available. Enroll in a course first.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Goal & Timeline */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-white mb-6">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Set Your Goal</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">What do you want to achieve?</Label>
                      <Input
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g., Master Python fundamentals for data science"
                        className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Be specific about what you want to learn
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-300">Target completion date</Label>
                      <div className="relative mt-2">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="pl-10 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    {selectedCourseData && (
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-sm text-purple-300">
                          <Sparkles className="w-4 h-4 inline mr-2" />
                          Creating a plan for: <strong>{selectedCourseData.title}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Time Budget */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-white mb-6">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Weekly Time Commitment</h3>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Label className="text-slate-300">Hours per week</Label>
                        <span className="text-2xl font-bold text-white">
                          {Math.floor(timeBudget / 60)}h {timeBudget % 60}m
                        </span>
                      </div>
                      <Slider
                        value={[timeBudget]}
                        onValueChange={([value]) => setTimeBudget(value)}
                        min={30}
                        max={1200}
                        step={30}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>30 min</span>
                        <span>20 hours</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Light', minutes: 120, icon: '🌱' },
                        { label: 'Moderate', minutes: 300, icon: '🌿' },
                        { label: 'Intensive', minutes: 600, icon: '🌳' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => setTimeBudget(preset.minutes)}
                          className={cn(
                            "p-4 rounded-xl text-center transition-all duration-200",
                            "border border-white/10 hover:border-purple-500/50",
                            "bg-white/5 hover:bg-white/10",
                            timeBudget === preset.minutes && "border-purple-500 bg-purple-500/10"
                          )}
                        >
                          <span className="text-2xl">{preset.icon}</span>
                          <p className="text-sm text-white mt-2">{preset.label}</p>
                          <p className="text-xs text-slate-400">
                            {Math.floor(preset.minutes / 60)}h/week
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Learning Style & Focus */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-white mb-6">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold">Personalize Your Experience</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-slate-300 mb-3 block">Learning Style (Optional)</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {LEARNING_STYLES.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setLearningStyle(style.id)}
                            className={cn(
                              "p-3 rounded-xl text-left transition-all duration-200",
                              "border border-white/10 hover:border-purple-500/50",
                              "bg-white/5 hover:bg-white/10",
                              learningStyle === style.id && "border-purple-500 bg-purple-500/10"
                            )}
                          >
                            <span className="text-xl">{style.icon}</span>
                            <p className="text-sm text-white mt-1">{style.label}</p>
                            <p className="text-xs text-slate-400">{style.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300 mb-3 block">Focus Areas (Optional)</Label>
                      <div className="flex flex-wrap gap-2">
                        {FOCUS_AREAS.map((area) => (
                          <button
                            key={area}
                            onClick={() => toggleFocusArea(area)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm transition-all duration-200",
                              "border border-white/10 hover:border-purple-500/50",
                              focusAreas.includes(area)
                                ? "bg-purple-500 text-white border-purple-500"
                                : "bg-white/5 text-slate-300 hover:bg-white/10"
                            )}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/10">
                      <h4 className="text-sm font-medium text-white mb-3">Plan Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Course</span>
                          <span className="text-white">{selectedCourseData?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Goal</span>
                          <span className="text-white truncate max-w-[200px]">{goal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Date</span>
                          <span className="text-white">{targetDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Weekly Time</span>
                          <span className="text-white">{Math.floor(timeBudget / 60)}h {timeBudget % 60}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Footer */}
          <div className="relative px-6 py-4 border-t border-white/10 flex justify-between">
            <Button
              variant="ghost"
              onClick={step === 1 ? onClose : handleBack}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreatePlan}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
