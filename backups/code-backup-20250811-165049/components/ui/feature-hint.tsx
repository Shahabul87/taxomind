"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  X, 
  Star, 
  ChevronRight, 
  Sparkles,
  Crown,
  Zap,
  Info,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface FeatureHintProps {
  featureId: string;
  title: string;
  description: string;
  isNew?: boolean;
  priority?: "low" | "medium" | "high";
  category?: "basic" | "advanced" | "expert";
  children?: React.ReactNode;
  onDismiss?: () => void;
  onActivate?: () => void;
  className?: string;
}

interface FeatureProgressIndicatorProps {
  totalFeatures: number;
  unlockedFeatures: number;
  className?: string;
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high": return <Star className="w-4 h-4" />;
    case "medium": return <Lightbulb className="w-4 h-4" />;
    case "low": return <Info className="w-4 h-4" />;
    default: return <Lightbulb className="w-4 h-4" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "expert": return <Crown className="w-4 h-4" />;
    case "advanced": return <Zap className="w-4 h-4" />;
    case "basic": return <CheckCircle className="w-4 h-4" />;
    default: return <Lightbulb className="w-4 h-4" />;
  }
};

const getPriorityColors = (priority: string) => {
  switch (priority) {
    case "high": 
      return {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        text: "text-red-700 dark:text-red-300",
        accent: "text-red-600 dark:text-red-400"
      };
    case "medium":
      return {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        border: "border-yellow-200 dark:border-yellow-800",
        text: "text-yellow-700 dark:text-yellow-300",
        accent: "text-yellow-600 dark:text-yellow-400"
      };
    case "low":
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400"
      };
    default:
      return {
        bg: "bg-gray-50 dark:bg-gray-900/20",
        border: "border-gray-200 dark:border-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        accent: "text-gray-600 dark:text-gray-400"
      };
  }
};

export const FeatureHint = ({
  featureId,
  title,
  description,
  isNew = false,
  priority = "medium",
  category = "basic",
  children,
  onDismiss,
  onActivate,
  className
}: FeatureHintProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  
  const colors = getPriorityColors(priority);
  
  useEffect(() => {
    // Mark as seen after a short delay
    const timer = setTimeout(() => {
      setHasBeenSeen(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleActivate = () => {
    onActivate?.();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn("relative", className)}
      >
        <Card className={cn(
          "relative overflow-hidden transition-all duration-200",
          colors.bg,
          colors.border,
          isNew && "ring-2 ring-purple-400 dark:ring-purple-600"
        )}>
          {/* New badge */}
          {isNew && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-purple-600 text-white text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New
              </Badge>
            </div>
          )}
          
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Feature Icon */}
              <div className={cn(
                "flex-shrink-0 p-2 rounded-lg",
                colors.bg,
                colors.text
              )}>
                {getCategoryIcon(category)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={cn("font-medium text-sm", colors.text)}>
                    {title}
                  </h4>
                  <div className={cn("flex items-center", colors.accent)}>
                    {getPriorityIcon(priority)}
                  </div>
                </div>
                
                <p className={cn("text-xs mb-3", colors.text, "opacity-80")}>
                  {description}
                </p>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {onActivate && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleActivate}
                      className={cn(
                        "h-7 px-3 text-xs",
                        priority === "high" && "bg-red-600 hover:bg-red-700",
                        priority === "medium" && "bg-yellow-600 hover:bg-yellow-700",
                        priority === "low" && "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      Try it
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className={cn("h-7 px-2 text-xs", colors.text)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Custom content */}
            {children && (
              <div className="mt-3 pt-3 border-t border-current/10">
                {children}
              </div>
            )}
          </CardContent>
          
          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-60 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </Button>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export const FeatureProgressIndicator = ({
  totalFeatures,
  unlockedFeatures,
  className
}: FeatureProgressIndicatorProps) => {
  const progressPercentage = Math.round((unlockedFeatures / totalFeatures) * 100);
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-yellow-500";
    if (percentage >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressText = (percentage: number) => {
    if (percentage >= 90) return "Feature Master! 🎉";
    if (percentage >= 75) return "Advanced User 🚀";
    if (percentage >= 50) return "Getting There 💪";
    if (percentage >= 25) return "Learning Fast 📚";
    return "Just Started 🌟";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Feature Progress
          </span>
        </div>
        <Badge variant="outline" className="text-xs">
          {unlockedFeatures}/{totalFeatures}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {getProgressText(progressPercentage)}
          </span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {progressPercentage}%
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-2" 
        />
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Keep exploring to unlock more powerful features!
        </div>
      </div>
    </motion.div>
  );
};