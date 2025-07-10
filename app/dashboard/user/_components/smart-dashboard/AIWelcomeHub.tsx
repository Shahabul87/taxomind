"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Calendar, Target, TrendingUp, 
  BookOpen, Clock, Zap, ChevronRight,
  Sun, Moon, Coffee, Sunrise
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "next-auth";

interface AIWelcomeHubProps {
  user: User;
}

export function AIWelcomeHub({ user }: AIWelcomeHubProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dailyGoal, setDailyGoal] = useState(30); // minutes
  const [todayProgress, setTodayProgress] = useState(12); // minutes

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return { text: "Good night", icon: Moon, color: "from-purple-600 to-blue-600" };
    if (hour < 12) return { text: "Good morning", icon: Sun, color: "from-purple-500 to-blue-500" };
    if (hour < 17) return { text: "Good afternoon", icon: Coffee, color: "from-blue-500 to-purple-500" };
    if (hour < 21) return { text: "Good evening", icon: Sunrise, color: "from-purple-500 to-blue-600" };
    return { text: "Good night", icon: Moon, color: "from-purple-600 to-blue-600" };
  };

  const getAIInsight = () => {
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    
    if (hour >= 6 && hour < 9) {
      return "Perfect time for focused learning! Your brain is most receptive in the morning.";
    }
    if (hour >= 9 && hour < 12) {
      return "Peak performance hours! Great time to tackle challenging topics.";
    }
    if (hour >= 12 && hour < 14) {
      return "Post-lunch learning can be enhanced with interactive content.";
    }
    if (hour >= 14 && hour < 17) {
      return "Ideal for collaborative learning and practical applications.";
    }
    if (hour >= 17 && hour < 20) {
      return "Wind down with review sessions and light reading.";
    }
    return "Time to rest! Consistent sleep helps consolidate learning.";
  };

  const getSmartSuggestions = () => {
    const progressPercent = (todayProgress / dailyGoal) * 100;
    
    if (progressPercent < 25) {
      return [
        { action: "Start with 5-minute quiz", type: "quickstart", icon: Zap },
        { action: "Review yesterday's notes", type: "review", icon: BookOpen },
        { action: "Set today's focus", type: "planning", icon: Target }
      ];
    }
    if (progressPercent < 75) {
      return [
        { action: "Continue active course", type: "continue", icon: ChevronRight },
        { action: "Practice with AI tutor", type: "practice", icon: Sparkles },
        { action: "Join study group", type: "social", icon: TrendingUp }
      ];
    }
    return [
      { action: "Complete daily goal", type: "complete", icon: Target },
      { action: "Explore new topics", type: "explore", icon: BookOpen },
      { action: "Share your progress", type: "share", icon: TrendingUp }
    ];
  };

  const greeting = getTimeGreeting();
  const GreetingIcon = greeting.icon;
  const progressPercent = (todayProgress / dailyGoal) * 100;

  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/20 to-blue-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.3),transparent_50%)]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Personal Welcome */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800/90 to-slate-700/90 backdrop-blur-sm border border-slate-600/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-full bg-gradient-to-r ${greeting.color} text-white`}>
                    <GreetingIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {greeting.text}, {user.name?.split(' ')[0]}!
                    </h1>
                    <p className="text-slate-300 mt-1">
                      {currentTime.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-lg p-6 mb-6 border border-slate-600/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-white">AI Learning Insight</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {getAIInsight()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getSmartSuggestions().map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-4 bg-slate-800/40 hover:bg-slate-700/60 border border-slate-600/30 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <suggestion.icon className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-white">
                            {suggestion.action}
                          </span>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-0 shadow-lg bg-gradient-to-b from-slate-800/90 to-slate-700/90 backdrop-blur-sm h-full border border-slate-600/50">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-green-100">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-white">Today's Progress</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">Daily Goal</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {Math.round(progressPercent)}%
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      {todayProgress} of {dailyGoal} minutes
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-slate-300">Focus Time</span>
                      </div>
                      <p className="text-2xl font-bold text-white">2h 15m</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-300">Streak</span>
                      </div>
                      <p className="text-2xl font-bold text-white">12 days</p>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-slate-300">Weekly Trend</span>
                    </div>
                    <p className="text-sm text-slate-400">
                      Up 23% from last week
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}