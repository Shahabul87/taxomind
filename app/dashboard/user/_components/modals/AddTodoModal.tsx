"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckSquare, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TodoData) => void;
}

export interface TodoData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  tags?: string[];
}

const priorityColors = {
  LOW: "from-slate-500 to-slate-600",
  MEDIUM: "from-blue-500 to-indigo-500",
  HIGH: "from-orange-500 to-red-500",
  URGENT: "from-red-500 to-rose-500",
};

export function AddTodoModal({ isOpen, onClose, onSubmit }: AddTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description,
        dueDate,
        priority,
        tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setPriority("MEDIUM");
      setTags("");
      onClose();
    } catch (error) {
      console.error("Error creating todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Add Todo
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quick task management
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              Task <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Complete assignment..."
              className="mt-2"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Due Date and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !dueDate && "text-slate-500"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Optional"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-400" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="homework, project, reading (comma-separated)"
              className="mt-2"
            />
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
              className={cn(
                "bg-gradient-to-r text-white",
                priorityColors[priority]
              )}
              disabled={isSubmitting || !title}
            >
              {isSubmitting ? "Adding..." : "Add Todo"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
