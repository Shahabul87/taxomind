'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  BookOpen,
  Target,
  RefreshCw,
  Brain,
  Play,
  FileText,
  ClipboardList,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Learning Task Types
const TASK_TYPES = [
  { value: 'STUDY', label: 'Study', icon: BookOpen, color: 'bg-blue-500', description: 'Read/study course materials' },
  { value: 'PRACTICE', label: 'Practice', icon: Target, color: 'bg-green-500', description: 'Do exercises/problems' },
  { value: 'REVIEW', label: 'Review', icon: RefreshCw, color: 'bg-amber-500', description: 'Revisit past content' },
  { value: 'QUIZ_PREP', label: 'Quiz', icon: Brain, color: 'bg-purple-500', description: 'Prepare for tests' },
  { value: 'WATCH', label: 'Watch', icon: Play, color: 'bg-red-500', description: 'Video lectures' },
  { value: 'READ', label: 'Read', icon: FileText, color: 'bg-cyan-500', description: 'Supplementary materials' },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: ClipboardList, color: 'bg-orange-500', description: 'Homework/submissions' },
] as const;

// Time estimate options in minutes
const TIME_ESTIMATES = [
  { value: 15, label: '15m' },
  { value: 30, label: '30m' },
  { value: 45, label: '45m' },
  { value: 60, label: '1h' },
  { value: 90, label: '1.5h' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
] as const;

// Priority options
const PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-400' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-400' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-400' },
] as const;

interface Course {
  id: string;
  title: string;
  imageUrl?: string;
  category?: { name: string };
}

interface Chapter {
  id: string;
  title: string;
  position: number;
}

export interface LearningTodoData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  taskType: string;
  courseId?: string;
  chapterId?: string;
  estimatedMinutes?: number;
}

interface AddLearningTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LearningTodoData) => Promise<void>;
}

export function AddLearningTodoModal({
  isOpen,
  onClose,
  onSubmit,
}: AddLearningTodoModalProps) {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskType, setTaskType] = useState('STUDY');
  const [courseId, setCourseId] = useState<string>();
  const [chapterId, setChapterId] = useState<string>();
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch enrolled courses
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch('/api/enrollments/my-courses');
      const data = await response.json();
      if (data.success) {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  // Fetch chapters when course changes
  const fetchChapters = useCallback(async (selectedCourseId: string) => {
    setLoadingChapters(true);
    setChapters([]);
    setChapterId(undefined);
    try {
      const response = await fetch(`/api/courses/${selectedCourseId}/chapters`);
      const data = await response.json();
      if (data.success || Array.isArray(data)) {
        setChapters(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    } finally {
      setLoadingChapters(false);
    }
  }, []);

  // Load courses when modal opens
  useEffect(() => {
    if (isOpen && courses.length === 0) {
      fetchCourses();
    }
  }, [isOpen, courses.length, fetchCourses]);

  // Load chapters when course changes
  useEffect(() => {
    if (courseId) {
      fetchChapters(courseId);
    } else {
      setChapters([]);
      setChapterId(undefined);
    }
  }, [courseId, fetchChapters]);

  // Auto-generate title based on selections
  useEffect(() => {
    if (!title && courseId && taskType) {
      const course = courses.find((c) => c.id === courseId);
      const typeLabel = TASK_TYPES.find((t) => t.value === taskType)?.label || 'Study';
      if (course) {
        const chapter = chapters.find((c) => c.id === chapterId);
        if (chapter) {
          setTitle(`${typeLabel}: ${course.title} - ${chapter.title}`);
        } else {
          setTitle(`${typeLabel}: ${course.title}`);
        }
      }
    }
  }, [courseId, chapterId, taskType, courses, chapters, title]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setPriority('MEDIUM');
    setTaskType('STUDY');
    setCourseId(undefined);
    setChapterId(undefined);
    setEstimatedMinutes(30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        priority,
        taskType,
        courseId,
        chapterId,
        estimatedMinutes,
      });

      resetForm();
      onClose();
      toast.success('Learning task created!');
    } catch (error) {
      console.error('Error creating learning task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Add Learning Task
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Course-linked task management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Type Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Task Type</Label>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = taskType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setTaskType(type.value)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all duration-200',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    )}
                  >
                    <div className={cn('p-1 rounded-lg', type.color)}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isSelected
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task Title */}
          <div>
            <Label htmlFor="title">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Study Options Pricing Fundamentals"
              className="mt-2"
              required
              autoFocus
            />
          </div>

          {/* Course & Chapter Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Link to Course</Label>
              <Select
                value={courseId || 'none'}
                onValueChange={(val) => setCourseId(val === 'none' ? undefined : val)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={loadingCourses ? 'Loading...' : 'Select course'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{course.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Link to Chapter</Label>
              <Select
                value={chapterId || 'none'}
                onValueChange={(val) => setChapterId(val === 'none' ? undefined : val)}
                disabled={!courseId || loadingChapters}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={
                      loadingChapters
                        ? 'Loading...'
                        : !courseId
                          ? 'Select course first'
                          : 'Select chapter'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chapter</SelectItem>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Ch {chapter.position}: {chapter.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Focus on Greeks calculation, review formulas..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Estimated Time */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Estimated Time</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_ESTIMATES.map((time) => {
                const isSelected = estimatedMinutes === time.value;
                return (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => setEstimatedMinutes(time.value)}
                    className={cn(
                      'px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                      isSelected
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    )}
                  >
                    {time.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal mt-2',
                      !dueDate && 'text-slate-500'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : 'Optional'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as typeof priority)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', p.color)} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Suggestions Banner (Future) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">SAM AI Suggestions</span>
              <span className="text-xs text-violet-500 dark:text-violet-400 ml-auto">Coming Soon</span>
            </div>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">
              Get personalized task recommendations based on your learning progress
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Add Learning Task
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default AddLearningTodoModal;
