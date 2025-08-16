"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart2, 
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  Rocket,
  ArrowRight,
  BookOpen
} from "lucide-react";

interface ProgressDashboardProps {
  userId: string;
}

export function ProgressDashboard({ userId }: ProgressDashboardProps) {
  // Stats data (this would come from API in real app)
  const stats = {
    tasksCompleted: 32,
    tasksTotal: 45,
    taskCompletionRate: 71, // Percentage
    coursesProgress: 67, // Percentage 
    streak: 12, // Days
    weeklyTaskCompletion: [7, 5, 8, 6, 9, 4, 3], // Last 7 days
    upcomingDeadlines: 4,
    recentCompletions: [
      { title: "Complete Module 3 Quiz", type: "course", date: "2 hours ago" },
      { title: "Publish Draft Videos", type: "task", date: "Yesterday" },
      { title: "Create Course Outline", type: "task", date: "2 days ago" }
    ],
    categoryCompletion: [
      { category: "Course Planning", completed: 10, total: 12 },
      { category: "Content Creation", completed: 8, total: 15 },
      { category: "Marketing", completed: 5, total: 7 },
      { category: "Admin", completed: 9, total: 11 }
    ]
  };
  
  // Calculate task completion percentage for each category
  const categoryPercentages = stats.categoryCompletion.map(cat => ({
    ...cat,
    percentage: Math.round((cat.completed / cat.total) * 100)
  }));
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Completion */}
        <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.tasksCompleted}/{stats.tasksTotal}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.taskCompletionRate}% complete
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-medium">
                  {stats.taskCompletionRate}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Course Progress */}
        <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.coursesProgress}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall completion
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                  {stats.coursesProgress}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Streak */}
        <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <Award className="h-4 w-4 mr-2 text-amber-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.streak} days
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Keep it up!
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Deadlines */}
        <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-red-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.upcomingDeadlines}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next 7 days
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <Card className="md:col-span-2 bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
              Weekly Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between pt-6">
              {stats.weeklyTaskCompletion.map((count, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-12 bg-purple-500 dark:bg-purple-600 rounded-t-md"
                    style={{ height: `${(count / 10) * 100}%` }}
                  ></div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Completions */}
        <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Recent Completions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentCompletions.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center",
                    item.type === 'course' 
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  )}>
                    {item.type === 'course' ? <BookOpen className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
                    <div className="flex items-center mt-1">
                      <Badge className={cn(
                        "text-xs",
                        item.type === 'course' 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                      )}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{item.date}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button variant="link" className="p-0 h-auto text-sm text-purple-600 dark:text-purple-400">
                View all completions
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Category Progress */}
      <Card className="bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <PieChart className="h-4 w-4 mr-2 text-indigo-500" />
            Category Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryPercentages.map((category, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.category}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {category.completed}/{category.total}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      index % 4 === 0 ? "bg-purple-500" :
                      index % 4 === 1 ? "bg-blue-500" :
                      index % 4 === 2 ? "bg-amber-500" :
                      "bg-green-500"
                    )}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 