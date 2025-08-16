import axios from "axios";
import { logger } from '@/lib/logger';

export interface Task {
  id: string;
  title: string;
  description: string;
  startTime?: Date | null;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  hasReminder: boolean;
  reminderDate?: Date | null;
  reminderType?: string | null;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  startTime?: Date | null;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  hasReminder?: boolean;
  reminderDate?: Date | null;
  reminderType?: string | null;
}

export interface UpdateTaskParams {
  id: string;
  title?: string;
  description?: string;
  startTime?: Date | null;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  completed?: boolean;
  hasReminder?: boolean;
  reminderDate?: Date | null;
  reminderType?: string | null;
  reminderSent?: boolean;
}

export const TaskService = {
  // Fetch all tasks for the current user
  getAllTasks: async (): Promise<Task[]> => {
    try {
      const response = await axios.get('/api/tasks');
      return response.data;
    } catch (error: any) {
      logger.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Create a new task
  createTask: async (taskData: CreateTaskParams): Promise<Task> => {
    try {
      const response = await axios.post('/api/tasks', taskData);
      return response.data;
    } catch (error: any) {
      logger.error('Error creating task:', error);
      throw error;
    }
  },

  // Update an existing task
  updateTask: async (taskData: UpdateTaskParams): Promise<Task> => {
    try {
      const response = await axios.patch('/api/tasks', taskData);
      return response.data;
    } catch (error: any) {
      logger.error('Error updating task:', error);
      throw error;
    }
  },

  // Toggle task completion status
  toggleTaskCompletion: async (id: string, completed: boolean): Promise<Task> => {
    try {
      const response = await axios.patch('/api/tasks', { id, completed });
      return response.data;
    } catch (error: any) {
      logger.error('Error toggling task completion:', error);
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/tasks?taskId=${id}`);
    } catch (error: any) {
      logger.error('Error deleting task:', error);
      throw error;
    }
  },

  // Get upcoming tasks (tasks due in the next X days)
  getUpcomingTasks: async (days: number = 7): Promise<Task[]> => {
    try {
      const tasks = await TaskService.getAllTasks();
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return !task.completed && dueDate >= now && dueDate <= future;
      });
    } catch (error: any) {
      logger.error('Error fetching upcoming tasks:', error);
      throw error;
    }
  },

  // Get overdue tasks
  getOverdueTasks: async (): Promise<Task[]> => {
    try {
      const tasks = await TaskService.getAllTasks();
      const now = new Date();
      
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return !task.completed && dueDate < now;
      });
    } catch (error: any) {
      logger.error('Error fetching overdue tasks:', error);
      throw error;
    }
  },

  // Get tasks due today
  getTasksDueToday: async (): Promise<Task[]> => {
    try {
      const tasks = await TaskService.getAllTasks();
      const today = new Date();
      
      return tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        return !task.completed && 
          dueDate.getDate() === today.getDate() &&
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getFullYear() === today.getFullYear();
      });
    } catch (error: any) {
      logger.error('Error fetching tasks due today:', error);
      throw error;
    }
  }
}; 