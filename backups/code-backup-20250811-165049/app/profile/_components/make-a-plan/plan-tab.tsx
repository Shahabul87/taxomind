"use client";

import { useState } from "react";
import { TaskPlanner } from "./task-planner";
import { CalendarView } from "./calendar-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckSquare, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanTabProps {
  userId: string;
}

export function PlanTab({ userId }: PlanTabProps) {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="w-full h-[calc(100vh-9rem)] flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="border-b bg-white dark:bg-gray-950 px-2">
          <TabsList className="h-16">
            <TabsTrigger 
              value="tasks"
              className={cn(
                "flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-gray-900/80",
                "data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600",
                "transition-all duration-200"
              )}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-base">Task Planner</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className={cn(
                "flex items-center gap-2 px-4 py-3 data-[state=active]:bg-white/80 dark:data-[state=active]:bg-gray-900/80",
                "data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600",
                "transition-all duration-200"
              )}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-base">Calendar</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent 
          value="tasks" 
          className="flex-1 overflow-auto p-4 mt-0"
        >
          <TaskPlanner userId={userId} />
        </TabsContent>
        
        <TabsContent 
          value="calendar" 
          className="flex-1 overflow-auto mt-0 p-4"
        >
          <CalendarView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 