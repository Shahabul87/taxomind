'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Loader2,
  Sparkles,
  Target,
  X,
  BookOpen,
  Flag,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Goal } from './types';

interface GoalCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreated: (goal: Goal) => void;
}

interface Course {
  id: string;
  title: string;
}

const priorityOptions = [
  { value: 'low', label: 'Low', description: 'Nice to achieve', color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', description: 'Should complete', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', description: 'Important goal', color: 'bg-orange-100 text-orange-700' },
  { value: 'critical', label: 'Critical', description: 'Must achieve', color: 'bg-red-100 text-red-700' },
];

const masteryOptions = [
  { value: 'novice', label: 'Novice', description: 'Just starting out' },
  { value: 'beginner', label: 'Beginner', description: 'Basic understanding' },
  { value: 'intermediate', label: 'Intermediate', description: 'Good working knowledge' },
  { value: 'advanced', label: 'Advanced', description: 'Deep understanding' },
  { value: 'expert', label: 'Expert', description: 'Complete mastery' },
];

export function GoalCreationDialog({
  open,
  onOpenChange,
  onGoalCreated,
}: GoalCreationDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState('medium');
  const [courseId, setCourseId] = useState<string>('none');
  const [currentMastery, setCurrentMastery] = useState<string>('none');
  const [targetMastery, setTargetMastery] = useState<string>('none');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Fetch courses
  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await fetch('/api/courses?limit=50');
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not { courses: [...] }
        const coursesArray = Array.isArray(data) ? data : (data.courses || []);
        setCourses(coursesArray);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setTargetDate(undefined);
    setPriority('medium');
    setCourseId('none');
    setCurrentMastery('none');
    setTargetMastery('none');
    setTags([]);
    setTagInput('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sam/agentic/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate?.toISOString(),
          priority,
          courseId: courseId === 'none' ? undefined : courseId,
          currentMastery: currentMastery === 'none' ? undefined : currentMastery,
          targetMastery: targetMastery === 'none' ? undefined : targetMastery,
          tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const data = await response.json();
      if (data.success) {
        onGoalCreated(data.data);
        handleClose();
      } else {
        throw new Error(data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep2 = title.trim().length > 0;
  const canSubmit = title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
          <DialogHeader className="relative p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Create Learning Goal</DialogTitle>
                <DialogDescription className="text-violet-100">
                  Set a new goal and let SAM help you achieve it
                </DialogDescription>
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-4">
              {[1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => s === 1 || canProceedToStep2 ? setStep(s) : null}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    step === s
                      ? 'bg-white/20 text-white'
                      : 'text-violet-200 hover:text-white hover:bg-white/10',
                    s === 2 && !canProceedToStep2 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className={cn(
                    'w-5 h-5 rounded-full text-xs flex items-center justify-center',
                    step === s ? 'bg-white text-violet-600' : 'bg-white/20'
                  )}>
                    {s}
                  </span>
                  {s === 1 ? 'Basics' : 'Details'}
                </button>
              ))}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Temporarily removed AnimatePresence to debug Select issue */}
            {step === 1 && (
              <div
                className="space-y-5"
              >
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    Goal Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Master React Hooks"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you want to achieve..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Flag className="w-4 h-4 text-violet-500" />
                    Priority Level
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPriority(option.value)}
                        className={cn(
                          'p-3 rounded-xl border-2 transition-all text-left',
                          priority === option.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-violet-300'
                        )}
                      >
                        <Badge className={cn('mb-1', option.color)}>
                          {option.label}
                        </Badge>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-violet-500" />
                    Target Date (optional)
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-11',
                          !targetDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, 'PPP') : 'Pick a target date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {step === 2 && (
              <div
                className="space-y-5"
              >
                {/* Course Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    Link to Course (optional)
                  </Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a course..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No course linked</SelectItem>
                      {courses
                        .filter((course) => course.id && course.id.trim() !== '')
                        .map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mastery Levels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-violet-500" />
                      Current Level
                    </Label>
                    <Select value={currentMastery} onValueChange={setCurrentMastery}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {masteryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Target Level</Label>
                    <Select value={targetMastery} onValueChange={setTargetMastery}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {masteryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 gap-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Create Goal
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
