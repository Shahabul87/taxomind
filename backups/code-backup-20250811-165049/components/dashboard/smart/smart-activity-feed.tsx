"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Activity,
  BookOpen,
  MessageCircle,
  Heart,
  Share2,
  Trophy,
  Clock,
  TrendingUp,
  Lightbulb,
  CheckCircle,
  PlayCircle,
  FileText,
  Users,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface SmartActivityFeedProps {
  activities: any[];
  aiCategorization: any;
}

export default function SmartActivityFeed({ 
  activities, 
  aiCategorization 
}: SmartActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'course_progress':
        return BookOpen;
      case 'comment':
        return MessageCircle;
      case 'like':
        return Heart;
      case 'share':
        return Share2;
      case 'achievement':
        return Trophy;
      case 'lesson_completed':
        return CheckCircle;
      case 'video_watched':
        return PlayCircle;
      case 'post_created':
        return FileText;
      case 'group_joined':
        return Users;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    const colors = {
      course_progress: "blue",
      comment: "green",
      like: "red",
      share: "purple",
      achievement: "yellow",
      lesson_completed: "emerald",
      video_watched: "indigo",
      post_created: "pink",
      group_joined: "cyan"
    };
    return colors[type as keyof typeof colors] || "gray";
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
      green: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
      red: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400",
      yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400",
      emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
      indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
      pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400",
      cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400",
      gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  // Generate mock activities if none provided
  const mockActivities = [
    {
      id: "1",
      type: "lesson_completed",
      title: "Completed: Introduction to React Hooks",
      description: "Finished lesson in 'Modern React Development' course",
      createdAt: new Date('2024-06-19T14:00:00'), // Fixed time
      metadata: { course: "Modern React Development", lesson: "Introduction to React Hooks" }
    },
    {
      id: "2",
      type: "achievement",
      title: "Achievement Unlocked: Fast Learner",
      description: "Completed 3 lessons in a single day",
      createdAt: new Date('2024-06-19T11:00:00'), // Fixed time
      metadata: { badge: "Fast Learner", points: 50 }
    },
    {
      id: "3",
      type: "post_created",
      title: "Created new post: JavaScript Best Practices",
      description: "Shared insights about clean code practices",
      createdAt: new Date('2024-06-18T16:00:00'), // Fixed time
      metadata: { postTitle: "JavaScript Best Practices", reactions: 12 }
    },
    {
      id: "4",
      type: "course_progress",
      title: "Progress Update: Next.js Mastery",
      description: "Reached 75% completion",
      createdAt: new Date('2024-06-17T10:00:00'), // Fixed time
      metadata: { course: "Next.js Mastery", progress: 75 }
    },
    {
      id: "5",
      type: "comment",
      title: "Commented on: TypeScript Guide",
      description: "Added helpful explanation about interfaces",
      createdAt: new Date('2024-06-16T14:30:00'), // Fixed time
      metadata: { postTitle: "TypeScript Guide", engagement: "high" }
    }
  ];

  const displayActivities = activities?.length > 0 ? activities : mockActivities;
  const recentActivities = displayActivities.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Smart Activity Feed</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your recent learning activities and achievements
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Insights Summary */}
        {aiCategorization && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                AI Activity Insights
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {aiCategorization.summary || "You've been consistently active with a strong focus on practical learning. Your engagement pattern shows peak activity in the mornings."}
            </p>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="space-y-4">
          {recentActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);
            const colorClasses = getColorClasses(color);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${colorClasses}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {activity.description}
                      </p>
                      
                      {/* Activity Metadata */}
                      {activity.metadata && (
                        <div className="flex items-center gap-2 mt-2">
                          {activity.metadata.course && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.course}
                            </Badge>
                          )}
                          {activity.metadata.points && (
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              +{activity.metadata.points} pts
                            </Badge>
                          )}
                          {activity.metadata.reactions && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Heart className="h-3 w-3" />
                              <span>{activity.metadata.reactions}</span>
                            </div>
                          )}
                          {activity.metadata.progress && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <TrendingUp className="h-3 w-3" />
                              <span>{activity.metadata.progress}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View More Button */}
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            View All Activities
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 