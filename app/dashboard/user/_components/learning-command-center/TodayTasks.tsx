'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Flag,
  Plus,
  Trash2,
  GripVertical,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { LearningTask, TaskPriority } from './types';

interface TodayTasksProps {
  tasks: LearningTask[];
  onToggleComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: (title: string) => void;
}

const priorityConfig: Record<TaskPriority, { color: string; bgColor: string; label: string; icon: string }> = {
  LOW: { color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-700', label: 'Low', icon: '○' },
  MEDIUM: { color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Medium', icon: '◐' },
  HIGH: { color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/30', label: 'High', icon: '●' },
  URGENT: { color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', label: 'Urgent', icon: '◉' },
};

function TaskItem({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: LearningTask;
  index: number;
  onToggle?: () => void;
  onDelete?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const priority = priorityConfig[task.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-all ${
        task.completed
          ? 'border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20'
          : 'border-slate-200/50 bg-white/50 hover:bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'
      }`}
    >
      {/* Drag Handle */}
      <motion.div
        animate={{ opacity: isHovered ? 0.5 : 0 }}
        className="cursor-grab"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </motion.div>

      {/* Checkbox */}
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className={task.completed ? 'border-emerald-500 bg-emerald-500' : ''}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              task.completed
                ? 'text-slate-500 line-through'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {task.title}
          </span>
          {task.priority !== 'LOW' && (
            <Badge
              variant="secondary"
              className={`${priority.bgColor} ${priority.color} text-xs`}
            >
              <Flag className="mr-1 h-2.5 w-2.5" />
              {priority.label}
            </Badge>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {task.courseName && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {task.courseName}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due today
            </span>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <motion.div animate={{ opacity: isHovered ? 1 : 0 }}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-500"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

export function TodayTasks({
  tasks,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
}: TodayTasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  // Sort tasks: incomplete first, then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask?.(newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
    }
  };

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Today&apos;s Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {completedCount}/{tasks.length}
              </span>{' '}
              done
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
          <span className="text-xs font-medium text-emerald-600">
            {Math.round(progress)}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sortedTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onToggle={() => onToggleComplete?.(task.id)}
              onDelete={() => onDeleteTask?.(task.id)}
            />
          ))}
        </AnimatePresence>

        {/* Add Task Input */}
        <AnimatePresence>
          {isAddingTask ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 pt-2"
            >
              <Circle className="h-4 w-4 text-slate-300" />
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you need to do?"
                className="h-9 flex-1 bg-white/50 dark:bg-slate-800/50"
                autoFocus
              />
              <Button size="sm" onClick={handleAddTask}>
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
              >
                Cancel
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                onClick={() => setIsAddingTask(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add a task
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {tasks.length === 0 && !isAddingTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm text-slate-500">
              No tasks yet. Add one to get started!
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
