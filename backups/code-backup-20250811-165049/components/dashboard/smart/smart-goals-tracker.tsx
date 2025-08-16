"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp,
  Brain,
  Calendar,
  Flag,
  Zap,
  Star,
  ArrowRight,
  BookOpen,
  Users,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PAUSED' | 'NOT_STARTED';
  progress: number;
  targetDate: string; // ISO string to prevent hydration issues
  createdAt: string; // ISO string to prevent hydration issues
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface AIRecommendedGoal {
  id: string;
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  reason: string;
  category: string;
}

interface SmartGoalsTrackerProps {
  goals?: Goal[];
  milestones?: any[];
  aiRecommendedGoals?: AIRecommendedGoal[];
}

const MOCK_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Complete React Mastery Course",
    description: "Master React fundamentals and advanced patterns",
    category: "LEARNING",
    status: "IN_PROGRESS",
    progress: 75,
    targetDate: "2024-12-31",
    createdAt: "2024-06-01",
    milestones: [
      { id: "milestone-1-1", title: "Complete Hooks Module", completed: true },
      { id: "milestone-1-2", title: "Build Todo App", completed: true },
      { id: "milestone-1-3", title: "Advanced Patterns", completed: false },
      { id: "milestone-1-4", title: "Final Project", completed: false }
    ]
  },
  {
    id: "goal-2",
    title: "Publish Technical Blog Series",
    description: "Share knowledge through 10 comprehensive articles",
    category: "CONTENT_CREATION",
    status: "IN_PROGRESS",
    progress: 60,
    targetDate: "2024-11-30",
    createdAt: "2024-05-15",
    milestones: [
      { id: "milestone-2-1", title: "Research Topics", completed: true },
      { id: "milestone-2-2", title: "Write 5 Posts", completed: true },
      { id: "milestone-2-3", title: "Write 5 More Posts", completed: false },
      { id: "milestone-2-4", title: "Promote Content", completed: false }
    ]
  },
  {
    id: "goal-3",
    title: "Build Professional Network",
    description: "Connect with 100+ industry professionals",
    category: "NETWORKING",
    status: "IN_PROGRESS",
    progress: 45,
    targetDate: "2024-10-15",
    createdAt: "2024-06-10",
    milestones: [
      { id: "milestone-3-1", title: "Optimize LinkedIn Profile", completed: true },
      { id: "milestone-3-2", title: "Connect with 25 people", completed: true },
      { id: "milestone-3-3", title: "Connect with 50 people", completed: false },
      { id: "milestone-3-4", title: "Reach 100 connections", completed: false }
    ]
  }
];

const MOCK_AI_GOALS: AIRecommendedGoal[] = [
  {
    id: "ai-goal-1",
    title: "Learn TypeScript",
    description: "Enhance your React skills with type safety",
    estimatedDuration: "3 weeks",
    difficulty: "Intermediate",
    category: "LEARNING",
    reason: "Complements your React progress and is highly sought after in the job market"
  },
  {
    id: "ai-goal-2", 
    title: "Contribute to Open Source",
    description: "Build your GitHub profile and give back to the community",
    estimatedDuration: "Ongoing",
    difficulty: "Beginner",
    category: "DEVELOPMENT",
    reason: "Perfect way to practice skills, build reputation, and expand your network"
  }
];

export default function SmartGoalsTracker({ 
  goals = [],
  milestones = [],
  aiRecommendedGoals = []
}: SmartGoalsTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Use provided data or fallback to mock data
  const displayGoals = useMemo(() => {
    return goals.length > 0 ? goals : MOCK_GOALS;
  }, [goals]);

  const displayAIGoals = useMemo(() => {
    return aiRecommendedGoals.length > 0 ? aiRecommendedGoals : MOCK_AI_GOALS;
  }, [aiRecommendedGoals]);

  // Filter goals by category
  const filteredGoals = useMemo(() => {
    if (selectedCategory === "all") return displayGoals;
    return displayGoals.filter(goal => goal.category === selectedCategory);
  }, [displayGoals, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(displayGoals.map(goal => goal.category)));
    return ["all", ...cats];
  }, [displayGoals]);

  const getStatusColor = (status: string): string => {
    const statusColors = {
      'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'PAUSED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'NOT_STARTED': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return statusColors[status as keyof typeof statusColors] || statusColors.NOT_STARTED;
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      'LEARNING': BookOpen,
      'CONTENT_CREATION': Star,
      'NETWORKING': Users,
      'CAREER': Trophy,
      'DEVELOPMENT': Target
    };
    return iconMap[category as keyof typeof iconMap] || Target;
  };

  const getDifficultyColor = (difficulty: string): string => {
    const difficultyColors = {
      'Beginner': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Intermediate': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Advanced': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.Beginner;
  };

  // Calculate stats
  const stats = useMemo(() => {
    const completed = displayGoals.filter(g => g.status === 'COMPLETED').length;
    const inProgress = displayGoals.filter(g => g.status === 'IN_PROGRESS').length;
    const avgProgress = displayGoals.length > 0 
      ? Math.round(displayGoals.reduce((acc, goal) => acc + goal.progress, 0) / displayGoals.length)
      : 0;
    
    return { completed, inProgress, avgProgress };
  }, [displayGoals]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-lg">
              <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Smart Goals Tracker
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track and achieve your learning objectives
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={`category-${category}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category === "all" ? "All Categories" : category.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Active Goals */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Flag className="h-4 w-4 text-orange-500" />
            Active Goals ({filteredGoals.filter(goal => goal.status !== 'COMPLETED').length})
          </h4>
          
          <div className="space-y-3">
            {filteredGoals
              .filter(goal => goal.status !== 'COMPLETED')
              .slice(0, 3)
              .map((goal, index) => {
                const Icon = getCategoryIcon(goal.category);
                const completedMilestones = goal.milestones.filter(m => m.completed).length;
                const totalMilestones = goal.milestones.length;
                
                return (
                  <motion.div
                    key={`goal-${goal.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                              {goal.title}
                            </h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {goal.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(goal.status)}>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {goal.progress}%
                          </span>
                        </div>
                        <Progress 
                          value={goal.progress} 
                          className="h-2 bg-gray-200 dark:bg-gray-700" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <CheckCircle className="h-3 w-3" />
                            <span>{completedMilestones}/{totalMilestones} milestones</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-auto p-1">
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>

        {/* AI Recommended Goals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Recommended Goals</h4>
          </div>
          
          <div className="space-y-3">
            {displayAIGoals.slice(0, 2).map((goal, index) => (
              <motion.div
                key={`ai-goal-${goal.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-purple-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {goal.title}
                      </h5>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDifficultyColor(goal.difficulty)}`}
                      >
                        {goal.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{goal.estimatedDuration}</span>
                      </div>
                    </div>
                    <div className="bg-purple-100/50 dark:bg-purple-900/30 rounded-lg p-2">
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        <span className="font-medium">AI Insight:</span> {goal.reason}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs shrink-0 bg-white/50 dark:bg-gray-800/50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.div 
            className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completed}
            </p>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">
              Completed
            </p>
          </motion.div>
          
          <motion.div 
            className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.inProgress}
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
              In Progress
            </p>
          </motion.div>
          
          <motion.div 
            className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.avgProgress}%
            </p>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 font-medium">
              Avg Progress
            </p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
} 