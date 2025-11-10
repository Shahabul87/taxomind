"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Target,
  CheckSquare,
  Sparkles,
  Clock,
  Award,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  type?: "activities" | "todos" | "goals" | "studyPlans";
  onAction?: () => void;
  actionLabel?: string;
}

const emptyStateConfig = {
  activities: {
    icon: Calendar,
    title: "No Activities Yet",
    description:
      "Your activity stream will show all your upcoming assignments, quizzes, and study sessions in one place.",
    gradient: "from-blue-500 to-indigo-500",
    actionLabel: "Create Activity",
    illustrations: [
      { icon: BookOpen, color: "from-emerald-500 to-teal-500", delay: 0.1 },
      { icon: Award, color: "from-purple-500 to-pink-500", delay: 0.2 },
      { icon: Clock, color: "from-orange-500 to-red-500", delay: 0.3 },
    ],
  },
  todos: {
    icon: CheckSquare,
    title: "No Todos Yet",
    description:
      "Create todos to track your daily tasks and keep yourself organized.",
    gradient: "from-purple-500 to-pink-500",
    actionLabel: "Add Todo",
    illustrations: [
      { icon: CheckSquare, color: "from-blue-500 to-indigo-500", delay: 0.1 },
      { icon: Target, color: "from-emerald-500 to-teal-500", delay: 0.2 },
      { icon: Sparkles, color: "from-violet-500 to-purple-500", delay: 0.3 },
    ],
  },
  goals: {
    icon: Target,
    title: "No Goals Set",
    description:
      "Set goals to track your progress and stay motivated on your learning journey.",
    gradient: "from-orange-500 to-red-500",
    actionLabel: "Create Goal",
    illustrations: [
      { icon: Target, color: "from-blue-500 to-indigo-500", delay: 0.1 },
      { icon: TrendingUp, color: "from-emerald-500 to-teal-500", delay: 0.2 },
      { icon: Award, color: "from-yellow-500 to-amber-500", delay: 0.3 },
    ],
  },
  studyPlans: {
    icon: BookOpen,
    title: "No Study Plans",
    description:
      "Create a personalized study plan to organize your learning schedule and achieve your goals.",
    gradient: "from-emerald-500 to-teal-500",
    actionLabel: "Create Study Plan",
    illustrations: [
      { icon: BookOpen, color: "from-blue-500 to-indigo-500", delay: 0.1 },
      { icon: Calendar, color: "from-purple-500 to-pink-500", delay: 0.2 },
      { icon: Clock, color: "from-orange-500 to-red-500", delay: 0.3 },
    ],
  },
};

export function EmptyState({
  type = "activities",
  onAction,
  actionLabel,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const MainIcon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Main Icon with Gradient Background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className={cn(
          "relative mb-8 p-8 rounded-3xl",
          "bg-gradient-to-br",
          config.gradient,
          "shadow-2xl"
        )}
      >
        <MainIcon className="h-20 w-20 text-white" />

        {/* Floating Illustrations */}
        {config.illustrations.map((illustration, index) => {
          const Icon = illustration.icon;
          const angle = (index * 120) - 60; // Spread 3 items evenly around a circle
          const radius = 100; // Distance from center
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                x,
                y,
              }}
              transition={{
                delay: illustration.delay,
                duration: 0.5,
                type: "spring",
                stiffness: 150,
              }}
              className={cn(
                "absolute p-3 rounded-xl",
                "bg-gradient-to-r",
                illustration.color,
                "shadow-lg"
              )}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Text Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="max-w-md space-y-3"
      >
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
          {config.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {config.description}
        </p>
      </motion.div>

      {/* Action Button */}
      {onAction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <Button
            onClick={onAction}
            size="lg"
            className={cn(
              "bg-gradient-to-r text-white shadow-lg hover:shadow-xl",
              "transition-all duration-300 hover:scale-105",
              config.gradient
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {actionLabel || config.actionLabel}
          </Button>
        </motion.div>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
