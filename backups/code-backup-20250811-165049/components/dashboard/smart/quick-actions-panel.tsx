"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  Search,
  Bookmark,
  Share2,
  Settings,
  Zap,
  Lightbulb,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { User } from "next-auth";

interface QuickActionsPanelProps {
  user: User;
  suggestions: any;
}

export default function QuickActionsPanel({ 
  user, 
  suggestions 
}: QuickActionsPanelProps) {
  const quickActions = [
    {
      title: "Create Course",
      description: "Share your expertise",
      icon: BookOpen,
      href: "/teacher/courses/new",
      color: "blue",
      suggested: suggestions?.createCourse
    },
    {
      title: "Write Post",
      description: "Share your thoughts",
      icon: FileText,
      href: "/post/new",
      color: "green",
      suggested: suggestions?.writePost
    },
    {
      title: "Join Group",
      description: "Connect with peers",
      icon: Users,
      href: "/groups",
      color: "purple",
      suggested: suggestions?.joinGroup
    },
    {
      title: "Schedule Event",
      description: "Plan your learning",
      icon: Calendar,
      href: "/calendar",
      color: "orange",
      suggested: suggestions?.scheduleEvent
    },
    {
      title: "Explore Courses",
      description: "Discover new skills",
      icon: Search,
      href: "/discover",
      color: "indigo",
      suggested: suggestions?.exploreCourses
    },
    {
      title: "My Resources",
      description: "Access saved content",
      icon: Bookmark,
      href: "/resources",
      color: "pink",
      suggested: suggestions?.accessResources
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
        button: "bg-blue-600 hover:bg-blue-700 text-white"
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        icon: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
        button: "bg-green-600 hover:bg-green-700 text-white"
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        icon: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
        button: "bg-purple-600 hover:bg-purple-700 text-white"
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400",
        button: "bg-orange-600 hover:bg-orange-700 text-white"
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
        button: "bg-indigo-600 hover:bg-indigo-700 text-white"
      },
      pink: {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        icon: "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400",
        button: "bg-pink-600 hover:bg-pink-700 text-white"
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const aiSuggestions = [
    {
      title: "Complete React Course",
      description: "You're 75% done!",
      icon: Target,
      action: "Continue",
      href: "/course/react-basics"
    },
    {
      title: "Share Your Project",
      description: "Show off your work",
      icon: Share2,
      action: "Share",
      href: "/post/new"
    },
    {
      title: "Join React Community",
      description: "Connect with developers",
      icon: Users,
      action: "Join",
      href: "/groups/react"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get things done faster
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100">AI Suggestions</h4>
          </div>
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={`suggestion-${suggestion.title}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-lg border border-yellow-200/50 dark:border-yellow-700/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-yellow-100 dark:bg-yellow-900/50 rounded">
                    <suggestion.icon className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                <Link href={suggestion.href}>
                  <Button size="sm" variant="outline" className="text-xs">
                    {suggestion.action}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Popular Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const colorClasses = getColorClasses(action.color);
              const Icon = action.icon;
              
              return (
                <motion.div
                  key={`action-${action.title}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link href={action.href}>
                    <Card className={`${colorClasses.bg} border-none hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden`}>
                      {action.suggested && (
                        <Badge 
                          variant="outline" 
                          className="absolute top-2 right-2 text-xs bg-white/80 dark:bg-gray-800/80"
                        >
                          Suggested
                        </Badge>
                      )}
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className={`p-2 rounded-lg w-fit ${colorClasses.icon}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {action.title}
                            </h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Settings Quick Access */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/profile">
            <Button variant="outline" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Profile Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 