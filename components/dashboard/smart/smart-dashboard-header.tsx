"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target,
  Sparkles,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";

interface SmartDashboardHeaderProps {
  user: User;
  userData: any;
  aiInsights: any;
}

export default function SmartDashboardHeader({ 
  user, 
  userData, 
  aiInsights 
}: SmartDashboardHeaderProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());
  }, []);

  const getTimeBasedGreeting = () => {
    if (!isClient) return "Hello"; // Fallback during SSR
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getAIPersonalizedMessage = () => {
    if (!aiInsights?.personalizedMessage) {
      return "Ready to continue your learning journey?";
    }
    return aiInsights.personalizedMessage;
  };

  const todayDate = isClient ? currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Loading...';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: User Info & Greeting */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-4 ring-white/50 shadow-lg">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {aiInsights?.isActiveToday && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {getTimeBasedGreeting()}, {user.name?.split(' ')[0] || 'there'}!
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{todayDate}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  {getAIPersonalizedMessage()}
                </p>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="flex flex-wrap gap-3">
              {aiInsights?.todayFocus && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                  <Target className="h-3 w-3 mr-1" />
                  Today&apos;s Focus: {aiInsights.todayFocus}
                </Badge>
              )}
              
              {aiInsights?.learningStreak && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {aiInsights.learningStreak} day streak
                </Badge>
              )}
              
              {aiInsights?.estimatedTimeToday && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {aiInsights.estimatedTimeToday} min today
                </Badge>
              )}
            </div>
          </div>

          {/* AI Motivation Message */}
          {aiInsights?.motivationalMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-purple-200/50 dark:border-purple-700/50"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    AI Insight
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {aiInsights.motivationalMessage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 