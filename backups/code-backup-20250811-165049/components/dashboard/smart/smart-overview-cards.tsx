"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Star,
  Zap,
  Activity,
  Award,
  PlayCircle,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

interface SmartOverviewCardsProps {
  userData: any;
  analytics: any[];
  achievements: any[];
}

export default function SmartOverviewCards({ 
  userData, 
  analytics, 
  achievements 
}: SmartOverviewCardsProps) {
  const coursesCreated = userData?.courses?.length || 0;
  const coursesEnrolled = userData?.enrollments?.length || 0;
  const postsCreated = userData?.posts?.length || 0;
  const ideasShared = userData?.ideas?.length || 0;

  // Calculate completion rate using mock data
  const calculateCompletionRate = () => {
    if (!userData?.enrollments || userData.enrollments.length === 0) return 0;
    
    // Mock completion rate since we removed deep nesting (consistent based on user data)
    const mockCompletionRate = 78; // Consistent value
    return mockCompletionRate;
  };

  const completionRate = calculateCompletionRate();

  // Calculate learning streak
  const calculateLearningStreak = () => {
    // This would be calculated from user activities
    return 12; // Placeholder
  };

  const learningStreak = calculateLearningStreak();

  // Calculate total learning time
  const calculateTotalLearningTime = () => {
    // This would be calculated from course progress and activities
    return 47; // Consistent hours
  };

  const totalLearningTime = calculateTotalLearningTime();

  const overviewCards = [
    {
      title: "Courses Enrolled",
      value: coursesEnrolled,
      subtitle: `${coursesCreated} created`,
      icon: BookOpen,
      color: "blue",
      progress: completionRate,
      trend: coursesEnrolled > 0 ? "+12%" : "0%",
      description: "Active learning paths"
    },
    {
      title: "Learning Streak",
      value: learningStreak,
      subtitle: "days",
      icon: Zap,
      color: "orange",
      progress: Math.min((learningStreak / 30) * 100, 100),
      trend: "+2 days",
      description: "Consistent learning"
    },
    {
      title: "Skills Acquired",
      value: achievements.length + Math.floor(coursesEnrolled * 0.7),
      subtitle: `${achievements.length} certified`,
      icon: Award,
      color: "green",
      progress: 75,
      trend: "+3 this month",
      description: "Knowledge gained"
    },
    {
      title: "Content Created",
      value: postsCreated + ideasShared,
      subtitle: `${postsCreated} posts, ${ideasShared} ideas`,
      icon: FileText,
      color: "purple",
      progress: Math.min(((postsCreated + ideasShared) / 20) * 100, 100),
      trend: postsCreated > 0 ? "+15%" : "0%",
      description: "Sharing knowledge"
    },
    {
      title: "Learning Time",
      value: totalLearningTime,
      subtitle: "hours this month",
      icon: Clock,
      color: "indigo",
      progress: Math.min((totalLearningTime / 100) * 100, 100),
      trend: "+8 hrs",
      description: "Time invested"
    },
    {
      title: "Community Impact",
      value: userData?.posts?.reduce((total: number, post: any) => total + (post.comments?.length || 0), 0) || 0,
      subtitle: "comments received",
      icon: Users,
      color: "pink",
      progress: 60,
      trend: "+24%",
      description: "Engagement level"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
        text: "text-blue-600 dark:text-blue-400",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        icon: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
        text: "text-orange-600 dark:text-orange-400",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        icon: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
        text: "text-green-600 dark:text-green-400",
        badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        icon: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
        text: "text-purple-600 dark:text-purple-400",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        icon: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
        text: "text-indigo-600 dark:text-indigo-400",
        badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
      },
      pink: {
        bg: "bg-pink-50 dark:bg-pink-900/20",
        icon: "bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400",
        text: "text-pink-600 dark:text-pink-400",
        badge: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {overviewCards.map((card, index) => {
        const colorClasses = getColorClasses(card.color);
        const Icon = card.icon;
        
        return (
          <motion.div
            key={`card-${card.title}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className={`${colorClasses.bg} border-none shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={`${colorClasses.badge} border-transparent text-xs`}>
                    {card.trend}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {card.value}
                    </span>
                    {card.subtitle && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {card.subtitle}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
                
                {card.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className={`font-medium ${colorClasses.text}`}>
                        {Math.round(card.progress)}%
                      </span>
                    </div>
                    <Progress 
                      value={card.progress} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
} 