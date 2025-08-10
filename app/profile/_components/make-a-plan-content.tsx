"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Calendar, CheckSquare, Clock, BookOpen, BarChart, Lightbulb, AlertTriangle } from "lucide-react";
import { TaskPlanner } from "./make-a-plan/task-planner";
import { CalendarView } from "./make-a-plan/calendar-view";
import { CoursePlanner } from "./make-a-plan/course-planner";
import { ProgressDashboard } from "./make-a-plan/progress-dashboard";
import { useToast } from "@/components/ui/use-toast";
import { logger } from '@/lib/logger';

interface MakeAPlanContentProps {
  userId: string;
}

export const MakeAPlanContent = ({ userId }: MakeAPlanContentProps) => {
  const [activeTab, setActiveTab] = useState("tasks");
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  
  // Validate required props
  useEffect(() => {
    if (!userId) {
      logger.error("MakeAPlanContent: userId is required but was not provided");
      setError("User authentication error. Please try signing out and back in.");
      toast({
        title: "Error",
        description: "User ID is missing. Please sign out and sign back in.",
        variant: "destructive"
      });
    } else {
      setError(null);
    }
  }, [userId, toast]);
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">Authentication Error</h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className={cn(
        "flex flex-col gap-2 p-6 rounded-xl",
        "bg-gradient-to-r from-blue-600/80 to-purple-600/80 dark:from-blue-900/70 dark:to-purple-900/70",
        "shadow-lg"
      )}>
        <h1 className="text-3xl font-bold text-white">Planning Dashboard</h1>
        <p className="text-blue-100 dark:text-blue-200">
          Organize your tasks, schedule, and learning journey in one place
        </p>
      </div>
      
      {/* Planning Tabs */}
      <Tabs 
        defaultValue="tasks" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 h-auto p-1 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm rounded-xl">
          <TabsTrigger 
            value="tasks" 
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-teal-600 data-[state=active]:text-white",
              "data-[state=inactive]:text-gray-700 data-[state=inactive]:dark:text-gray-300"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white",
              "data-[state=inactive]:text-gray-700 data-[state=inactive]:dark:text-gray-300"
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger 
            value="courses" 
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white",
              "data-[state=inactive]:text-gray-700 data-[state=inactive]:dark:text-gray-300"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </TabsTrigger>
          <TabsTrigger 
            value="progress" 
            className={cn(
              "flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white",
              "data-[state=inactive]:text-gray-700 data-[state=inactive]:dark:text-gray-300"
            )}
          >
            <BarChart className="h-4 w-4" />
            <span>Progress</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="mt-6">
          <TaskPlanner userId={userId} />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <CalendarView key={`calendar-${userId}`} userId={userId} />
        </TabsContent>
        
        <TabsContent value="courses" className="mt-6">
          <CoursePlanner userId={userId} />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-6">
          <ProgressDashboard userId={userId} />
        </TabsContent>
      </Tabs>
      
      {/* Quick Ideas Section */}
      <div className={cn(
        "p-6 rounded-xl mt-4",
        "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
        "border border-gray-200 dark:border-gray-800"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Planning Tips</h3>
        </div>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1 mt-0.5">
              <CheckSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <span>Break down large tasks into smaller, manageable subtasks</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1 mt-0.5">
              <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Set specific timeframes for task completion to stay accountable</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1 mt-0.5">
              <BookOpen className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            </div>
            <span>Create realistic course schedules with buffer time for revisions</span>
          </li>
        </ul>
      </div>
    </motion.div>
  );
}; 