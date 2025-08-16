"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logger } from '@/lib/logger';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Clock, 
  Calendar,
  Tag,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  Timer,
  Circle,
  MoreVertical,
  BellRing,
  CheckSquare
} from "lucide-react";
import { format, differenceInMinutes, differenceInHours, differenceInDays, isValid, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { TaskService } from "@/app/actions/task-service";
import type { Task } from "@/app/actions/task-service";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskPlannerProps {
  userId: string;
}

// Define a reminder type
interface ReminderItem {
  id: string;
  date: Date | null;
  type: string | null;
}

export function TaskPlanner({ userId }: TaskPlannerProps) {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  
  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // New task form state
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    startTime: Date | null;
    dueDate: Date;
    priority: 'low' | 'medium' | 'high';
    category: string;
    completed: boolean;
    hasReminder: boolean;
    reminders: ReminderItem[];
  }>({
    title: "",
    description: "",
    startTime: null,
    dueDate: new Date(),
    priority: "medium",
    category: "Course Planning",
    completed: false,
    hasReminder: false,
    reminders: []
  });
  
  // Categories for tasks
  const categories = [
    "Course Planning", 
    "Content Creation", 
    "Research", 
    "Marketing", 
    "Admin", 
    "Personal"
  ];
  
  // Reminder types
  const reminderTypes = [
    { value: "email", label: "Email" },
    { value: "push", label: "Push Notification" },
    { value: "in-app", label: "In-App Alert" }
  ];
  
  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);
  
  // Load tasks
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const taskData = await TaskService.getAllTasks();
      setTasks(taskData);
    } catch (error: any) {
      logger.error("Failed to load tasks:", error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter tasks based on the selected tab
  const filteredTasks = tasks.filter(task => {
    if (selectedTab === "all") return true;
    if (selectedTab === "completed") return task.completed;
    if (selectedTab === "due-today") {
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      return (
        !task.completed && 
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear()
      );
    }
    if (selectedTab === "upcoming") {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !task.completed && new Date(task.dueDate) > today;
    }
    if (selectedTab === "overdue") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !task.completed && new Date(task.dueDate) < today;
    }
    return true;
  });
  
  // Handle reminder toggle
  const handleReminderToggle = (checked: boolean) => {
    if (checked && newTask.reminders.length === 0) {
      // If toggling on and no reminders exist, create a default one
      const defaultReminder: ReminderItem = {
        id: crypto.randomUUID(),
        date: new Date(new Date(newTask.dueDate).getTime() - 60 * 60 * 1000), // 1 hour before
        type: "in-app"
      };
      
      setNewTask({
        ...newTask,
        hasReminder: checked,
        reminders: [defaultReminder]
      });
    } else {
      setNewTask({
        ...newTask,
        hasReminder: checked
      });
    }
  };

  // Add a new reminder
  const addReminder = () => {
    const newReminder: ReminderItem = {
      id: crypto.randomUUID(),
      date: new Date(new Date(newTask.dueDate).getTime() - 60 * 60 * 1000), // 1 hour before
      type: "in-app"
    };
    
    setNewTask({
      ...newTask,
      reminders: [...newTask.reminders, newReminder]
    });
  };
  
  // Remove a reminder
  const removeReminder = (id: string) => {
    setNewTask({
      ...newTask,
      reminders: newTask.reminders.filter(reminder => reminder.id !== id)
    });
  };
  
  // Update a reminder date
  const updateReminderDate = (id: string, dateString: string) => {
    if (!dateString) return;
    
    setNewTask({
      ...newTask,
      reminders: newTask.reminders.map(reminder => {
        if (reminder.id === id) {
          const currentTime = reminder.date ? formatTimeForInput(reminder.date) : null;
          const newDate = createDateFromInputs(dateString, currentTime);
          
          return {
            ...reminder,
            date: newDate
          };
        }
        return reminder;
      })
    });
  };
  
  // Update a reminder time
  const updateReminderTime = (id: string, timeString: string) => {
    if (!timeString) return;
    
    setNewTask({
      ...newTask,
      reminders: newTask.reminders.map(reminder => {
        if (reminder.id === id) {
          const dateString = reminder.date ? formatDateForInput(reminder.date) : formatDateForInput(new Date());
          const newDateTime = createDateFromInputs(dateString, timeString);
          
          return {
            ...reminder,
            date: newDateTime
          };
        }
        return reminder;
      })
    });
  };
  
  // Update a reminder type
  const updateReminderType = (id: string, type: string) => {
    setNewTask({
      ...newTask,
      reminders: newTask.reminders.map(reminder => {
        if (reminder.id === id) {
          return {
            ...reminder,
            type
          };
        }
        return reminder;
      })
    });
  };

  // Helper function for creating a proper date object from date and time inputs
  const createDateFromInputs = (dateString: string, timeString: string | null = null) => {
    if (!dateString) return null;
    
    // Create a base date object at noon to avoid timezone issues
    const baseDate = new Date(`${dateString}T12:00:00`);
    
    // If time is provided, update the hours and minutes
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }
    
    return baseDate;
  };

  // Helper function to format date for input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Helper function to format time for input
  const formatTimeForInput = (date: Date | null) => {
    if (!date) return "";
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Set task start date and time separately
  const setTaskStartDate = (dateString: string) => {
    if (!dateString) {
      setNewTask(prev => ({ ...prev, startTime: null }));
      return;
    }
    
    try {
      // Get current start time if it exists
      const currentTime = newTask.startTime ? formatTimeForInput(newTask.startTime) : null;
      const newDate = createDateFromInputs(dateString, currentTime);
      
      setNewTask(prev => ({
        ...prev,
        startTime: newDate
      }));
    } catch (error: any) {
      logger.error("Error setting start date:", error);
      toast.error("Error setting date. Please try again.");
    }
  };
  
  const setTaskStartTime = (timeString: string) => {
    if (!timeString) return;
    
    try {
      // If there's no start date yet, use today's date
      const dateString = newTask.startTime ? formatDateForInput(newTask.startTime) : formatDateForInput(new Date());
      const newDateTime = createDateFromInputs(dateString, timeString);
      
      setNewTask(prev => ({
        ...prev,
        startTime: newDateTime
      }));
    } catch (error: any) {
      logger.error("Error setting start time:", error);
      toast.error("Error setting time. Please try again.");
    }
  };
  
  // Set task due date and time separately
  const setTaskDueDate = (dateString: string) => {
    if (!dateString) return;
    
    try {
      // Get current due time if it exists
      const currentTime = formatTimeForInput(newTask.dueDate);
      const newDate = createDateFromInputs(dateString, currentTime);
      
      setNewTask(prev => ({
        ...prev,
        dueDate: newDate
      }));
    } catch (error: any) {
      logger.error("Error setting due date:", error);
      toast.error("Error setting date. Please try again.");
    }
  };
  
  const setTaskDueTime = (timeString: string) => {
    if (!timeString) return;
    
    try {
      const dateString = formatDateForInput(newTask.dueDate);
      const newDateTime = createDateFromInputs(dateString, timeString);
      
      setNewTask(prev => ({
        ...prev,
        dueDate: newDateTime
      }));
    } catch (error: any) {
      logger.error("Error setting due time:", error);
      toast.error("Error setting time. Please try again.");
    }
  };
  
  // Helper function to calculate and format duration between two dates
  const calculateDuration = (startDate: Date, endDate: Date) => {
    const minutes = differenceInMinutes(endDate, startDate);
    
    if (minutes < 0) {
      return "Invalid time range";
    }
    
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = differenceInHours(endDate, startDate);
    if (hours < 24) {
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    }
    
    const days = differenceInDays(endDate, startDate);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
  };

  // Reset task form
  const resetTaskForm = () => {
    setNewTask({
      title: "",
      description: "",
      startTime: null,
      dueDate: new Date(),
      priority: "medium",
      category: "Course Planning",
      completed: false,
      hasReminder: false,
      reminders: []
    });
  };

  // Handle dialog open state change
  const handleDialogOpenChange = (open: boolean) => {
    setIsNewTaskOpen(open);
    if (!open) {
      // Reset form when closing dialog
      resetTaskForm();
    }
  };

  // Helper function to adjust date for timezone
  const adjustDateForTimezone = (dateString: string) => {
    // Create a date object from the input string
    const date = new Date(dateString);
    // Set the time to noon to avoid timezone issues
    date.setHours(12, 0, 0, 0);
    return date;
  };

  // Add a new task
  const handleAddTask = async () => {
    try {
      // Basic form validation
      if (!newTask.title.trim()) {
        toast.error("Please enter a task title");
        return;
      }
      
      if (!newTask.dueDate) {
        toast.error("Please select a due date");
        return;
      }
      
      // Validate start and end time
      if (newTask.startTime) {
        const startDate = new Date(newTask.startTime);
        const dueDate = new Date(newTask.dueDate);
        
        if (!isValid(startDate)) {
          toast.error("Invalid start time");
          return;
        }
        
        if (startDate > dueDate) {
          toast.error("Start time cannot be after due date");
          return;
        }
      }
      
      if (!isValid(new Date(newTask.dueDate))) {
        toast.error("Invalid due date");
        return;
      }
      
      // Validation for reminders
      if (newTask.hasReminder && newTask.reminders.length > 0) {
        for (const reminder of newTask.reminders) {
          if (!reminder.date) {
            toast.error("Please select a reminder date for all reminders");
            return;
          }
          
          if (!isValid(new Date(reminder.date))) {
            toast.error("Invalid reminder date");
            return;
          }
          
          if (!reminder.type) {
            toast.error("Please select a reminder type for all reminders");
            return;
          }
          
          // Optional: warn if reminder is after due date but allow it
          if (new Date(reminder.date) > new Date(newTask.dueDate)) {
            toast.warning("One or more reminders are set to occur after the due date");
            break; // Only show this warning once
          }
        }
      }
      
      setIsLoading(true);
      
      const createdTask = await TaskService.createTask({
        title: newTask.title,
        description: newTask.description,
        startTime: newTask.startTime,
        dueDate: newTask.dueDate,
        priority: newTask.priority,
        category: newTask.category,
        hasReminder: newTask.hasReminder,
        reminders: newTask.reminders.map(r => ({
          date: r.date,
          type: r.type
        }))
      });
      
      setTasks([...tasks, createdTask]);
      toast.success("Task added successfully!");
      
      // Reset form
      resetTaskForm();
      setIsNewTaskOpen(false);
    } catch (error: any) {
      logger.error("Failed to add task:", error);
      toast.error("Failed to add task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle task completion
  const toggleTaskComplete = async (id: string, completed: boolean) => {
    try {
      setIsLoading(true);
      const updatedTask = await TaskService.toggleTaskCompletion(id, !completed);
      
      setTasks(tasks.map(task => 
        task.id === id ? updatedTask : task
      ));
      
      toast.success(`Task marked as ${!completed ? 'completed' : 'incomplete'}`);
    } catch (error: any) {
      logger.error("Failed to update task:", error);
      toast.error("Failed to update task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a task
  const deleteTask = async (id: string) => {
    try {
      setIsLoading(true);
      await TaskService.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
      toast.success("Task deleted successfully");
    } catch (error: any) {
      logger.error("Failed to delete task:", error);
      toast.error("Failed to delete task. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get priority color
  const getPriorityColor = (priority: string, isBackground = false) => {
    switch (priority) {
      case 'high':
        return isBackground ? 'bg-red-100 dark:bg-red-900/30' : 'text-red-600 dark:text-red-400';
      case 'medium':
        return isBackground ? 'bg-amber-100 dark:bg-amber-900/30' : 'text-amber-600 dark:text-amber-400';
      default:
        return isBackground ? 'bg-blue-100 dark:bg-blue-900/30' : 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Tabs & Add Button */}
      <div className="flex justify-between items-center">
        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="w-full"
        >
          <TabsList className="bg-white/20 dark:bg-gray-900/20 p-1 h-auto">
            <TabsTrigger 
              value="all"
              className={cn(
                "text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100",
                "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
              )}
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="due-today"
              className={cn(
                "text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100",
                "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
              )}
            >
              Due Today
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming"
              className={cn(
                "text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100",
                "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
              )}
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger 
              value="overdue"
              className={cn(
                "text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100",
                "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
              )}
            >
              Overdue
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className={cn(
                "text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100",
                "data-[state=inactive]:text-gray-600 dark:data-[state=inactive]:text-gray-400"
              )}
            >
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Dialog open={isNewTaskOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px] md:max-w-[750px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Task Details Section */}
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900/20">
                <div className="flex items-center mb-3">
                  <CheckSquare className="h-4 w-4 mr-2 text-gray-500" />
                  <h3 className="font-medium text-sm">Task Details</h3>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4 mb-3">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Task title"
                    className="col-span-3"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4 mb-3">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Task description (optional)"
                    className="col-span-3"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4 mb-3">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Task Timing Section */}
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <h3 className="font-medium text-sm">Task Timing</h3>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {/* Start Date and Time - Separate controls */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Start Date & Time (Optional)
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                          <input
                            type="date"
                            className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                            value={newTask.startTime ? formatDateForInput(newTask.startTime) : ""}
                            onChange={(e) => setTaskStartDate(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Set start date</p>
                      </div>
                      <div className="relative">
                        <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                          <input
                            type="time"
                            className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                            value={newTask.startTime ? formatTimeForInput(newTask.startTime) : ""}
                            onChange={(e) => setTaskStartTime(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Set start time</p>
                      </div>
                    </div>
                    {!newTask.startTime && (
                      <p className="text-xs text-gray-500 italic">Leave blank for tasks without a specific start time</p>
                    )}
                  </div>

                  {/* Due Date and Time - Separate controls */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-500" />
                      Due Date & Time
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                          <input
                            type="date"
                            className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                            value={formatDateForInput(newTask.dueDate)}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Set due date</p>
                      </div>
                      <div className="relative">
                        <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-red-500 focus-within:border-red-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                          <input
                            type="time"
                            className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                            value={formatTimeForInput(newTask.dueDate)}
                            onChange={(e) => setTaskDueTime(e.target.value)}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Set due time</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">This task is due on {format(newTask.dueDate, "PPPP")} at {format(newTask.dueDate, "h:mm a")}</p>
                  </div>
                  
                  {/* Duration info - shows calculated duration between start and end time */}
                  {newTask.startTime && (
                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center text-blue-600 dark:text-blue-300">
                      <Timer className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        Duration: {calculateDuration(newTask.startTime, newTask.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reminder Section Redesigned */}
              <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-900/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <BellRing className="h-4 w-4 mr-2 text-gray-500" />
                    <h3 className="font-medium text-sm">Reminders</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {newTask.hasReminder ? "Enabled" : "Disabled"}
                    </span>
                    <Switch 
                      checked={newTask.hasReminder}
                      onCheckedChange={handleReminderToggle}
                    />
                  </div>
                </div>
                
                {newTask.hasReminder && (
                  <div className="border rounded-md p-4 bg-white dark:bg-gray-800 space-y-5 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Reminder Schedule</h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs gap-1 border-dashed"
                        onClick={addReminder}
                      >
                        <Plus className="h-3 w-3" /> Add Reminder
                      </Button>
                    </div>
                    
                    {newTask.reminders.length === 0 ? (
                      <div className="text-center p-4 border border-dashed rounded-md">
                        <p className="text-sm text-gray-500">No reminders yet. Add your first reminder.</p>
                      </div>
                    ) : (
                      <ScrollArea className={newTask.reminders.length > 2 ? "h-[300px]" : ""}>
                        <div className="space-y-4">
                          {newTask.reminders.map((reminder, index) => (
                            <div key={reminder.id} className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/20">
                              <div className="flex justify-between items-center mb-3">
                                <h5 className="text-sm font-medium flex items-center">
                                  <BellRing className="h-3.5 w-3.5 mr-2 text-purple-500" />
                                  Reminder #{index + 1}
                                </h5>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 rounded-full"
                                  onClick={() => removeReminder(reminder.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="relative">
                                  <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                                    <input
                                      type="date"
                                      className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                                      value={reminder.date ? formatDateForInput(reminder.date) : ""}
                                      onChange={(e) => updateReminderDate(reminder.id, e.target.value)}
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">Set reminder date</p>
                                </div>
                                <div className="relative">
                                  <div className="border rounded-md flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-800">
                                    <input
                                      type="time"
                                      className="flex-1 py-2 px-3 focus:outline-none bg-transparent"
                                      value={reminder.date ? formatTimeForInput(reminder.date) : ""}
                                      onChange={(e) => updateReminderTime(reminder.id, e.target.value)}
                                    />
                                  </div>
                                  <p className="mt-1 text-xs text-gray-500">Set reminder time</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-500">Notification Type</Label>
                                <RadioGroup 
                                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                                  value={reminder.type || ""}
                                  onValueChange={(value) => updateReminderType(reminder.id, value)}
                                >
                                  {reminderTypes.map((type) => (
                                    <div 
                                      key={type.value} 
                                      className={cn(
                                        "flex items-center gap-2 border rounded-md p-2 cursor-pointer transition-all",
                                        "hover:bg-gray-50 dark:hover:bg-gray-700",
                                        reminder.type === type.value ? 
                                          "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : 
                                          "border-gray-200 dark:border-gray-700"
                                      )}
                                      onClick={() => updateReminderType(reminder.id, type.value)}
                                    >
                                      <RadioGroupItem value={type.value} id={`${reminder.id}-${type.value}`} className="text-purple-500" />
                                      <Label 
                                        htmlFor={`${reminder.id}-${type.value}`} 
                                        className="cursor-pointer text-xs font-medium"
                                      >
                                        {type.label}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                              
                              {reminder.date && newTask.dueDate && (
                                <div className="mt-3 text-xs text-gray-500">
                                  {new Date(reminder.date) < new Date(newTask.dueDate) 
                                    ? `This reminder will notify you ${calculateDuration(reminder.date, newTask.dueDate)} before the deadline`
                                    : "Warning: This reminder is set after the due date"}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewTaskOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTask} 
                className={cn(
                  "text-white",
                  isLoading 
                    ? "bg-gray-500 cursor-not-allowed" 
                    : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                )}
                disabled={!newTask.title || !newTask.dueDate || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-1">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                    Adding...
                  </div>
                ) : (
                  <>Add Task</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Task List */}
      <div className="space-y-4">
        {isLoading && tasks.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 space-y-2">
            <CheckCircle className="h-12 w-12 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsNewTaskOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add your first task
            </Button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                task.completed 
                  ? "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800" 
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskComplete(task.id, task.completed)}
                    className="mt-1"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "font-medium",
                        task.completed && "line-through text-gray-500 dark:text-gray-400"
                      )}>
                        {task.title}
                      </h3>
                    </div>
                    
                    {task.description && (
                      <p className={cn(
                        "text-sm text-gray-600 dark:text-gray-400",
                        task.completed && "line-through text-gray-400 dark:text-gray-500"
                      )}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <div className={cn(
                        "flex items-center text-xs rounded-full px-2 py-1",
                        task.completed 
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-500" 
                          : getPriorityColor(task.priority, true)
                      )}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span className={task.completed ? "text-gray-500" : getPriorityColor(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "flex items-center text-xs rounded-full px-2 py-1",
                        "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      )}>
                        <Tag className="h-3 w-3 mr-1" />
                        <span>{task.category}</span>
                      </div>
                      
                      {task.startTime && (
                        <div className={cn(
                          "flex items-center text-xs rounded-full px-2 py-1",
                          "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        )}>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>Start: {format(new Date(task.startTime), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex items-center text-xs rounded-full px-2 py-1",
                        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      )}>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>End: {format(new Date(task.dueDate), "MMM d, h:mm a")}</span>
                      </div>
                      
                      {task.hasReminder && (
                        <div className={cn(
                          "flex items-center text-xs rounded-full px-2 py-1",
                          "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        )}>
                          <BellRing className="h-3 w-3 mr-1" />
                          <span>Reminder set</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditingTask(task.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleTaskComplete(task.id, task.completed)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as {task.completed ? 'incomplete' : 'complete'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 