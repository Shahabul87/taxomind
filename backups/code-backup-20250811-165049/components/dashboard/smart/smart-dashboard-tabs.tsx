"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Target, 
  User, 
  Zap,
  BarChart3,
  Brain,
  Calendar,
  Award
} from "lucide-react";

// Import existing components
import AIInsightsPanel from "./ai-insights-panel";
import SmartOverviewCards from "./smart-overview-cards";
import LearningProgressHub from "./learning-progress-hub";
import SmartActivityFeed from "./smart-activity-feed";
import PersonalizedRecommendations from "./personalized-recommendations";
import SkillGrowthTracker from "./skill-growth-tracker";
import QuickActionsPanel from "./quick-actions-panel";
import EnhancedProfileSummary from "./enhanced-profile-summary";
import SmartGoalsTracker from "./smart-goals-tracker";
import PerformanceAnalytics from "./performance-analytics";

interface SmartDashboardTabsProps {
  user: any;
  dashboardData: any;
}

const SmartDashboardTabs: React.FC<SmartDashboardTabsProps> = ({ user, dashboardData }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      color: "blue",
      description: "Dashboard summary & AI insights"
    },
    {
      id: "learning",
      label: "Learning",
      icon: BookOpen,
      color: "emerald",
      description: "Courses & progress tracking"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      color: "purple",
      description: "Performance metrics & trends"
    },
    {
      id: "goals",
      label: "Goals",
      icon: Target,
      color: "orange",
      description: "Goal tracking & milestones"
    },
    {
      id: "skills",
      label: "Skills",
      icon: Brain,
      color: "pink",
      description: "Skill development & growth"
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      color: "indigo",
      description: "Profile & achievements"
    }
  ];

  const getTabColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        active: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
      },
      emerald: {
        active: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
      },
      purple: {
        active: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
      },
      orange: {
        active: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
      },
      pink: {
        active: "text-pink-700 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
      },
      indigo: {
        active: "text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
        inactive: "text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
      }
    };
    return isActive ? colors[color as keyof typeof colors].active : colors[color as keyof typeof colors].inactive;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* AI Insights Panel */}
            <AIInsightsPanel 
              insights={dashboardData.aiInsights}
              learningData={dashboardData.learningAnalytics}
              userId={user.id || ""}
            />
            
            {/* Overview Cards */}
            <SmartOverviewCards 
              userData={dashboardData.userData}
              analytics={dashboardData.userAnalytics}
              achievements={dashboardData.achievements}
            />

            {/* Quick Actions & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SmartActivityFeed 
                  activities={dashboardData.activities}
                  aiCategorization={dashboardData.aiCategorizedActivities}
                />
              </div>
              <div>
                <QuickActionsPanel 
                  user={user}
                  suggestions={dashboardData.quickActionSuggestions}
                />
              </div>
            </div>
          </div>
        );

      case "learning":
        return (
          <div className="space-y-6">
            <LearningProgressHub 
              courses={dashboardData.userData.courses || []}
              enrollments={dashboardData.enrollments}
              progress={dashboardData.learningProgress}
            />
            
            <PersonalizedRecommendations 
              recommendations={dashboardData.recommendations}
              userPreferences={dashboardData.userData.preferences || {}}
              learningStyle={dashboardData.learningStyle}
            />
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <PerformanceAnalytics 
              analytics={dashboardData.performanceMetrics}
              trends={dashboardData.performanceTrends}
              benchmarks={dashboardData.benchmarks}
            />
          </div>
        );

      case "goals":
        return (
          <div className="space-y-6">
            <SmartGoalsTracker 
              goals={dashboardData.userData.goals?.map((goal: any) => ({
                ...goal,
                progress: goal.currentValue && goal.targetValue 
                  ? (goal.currentValue / goal.targetValue) * 100 
                  : 0,
                milestones: []
              })) || []}
              milestones={dashboardData.milestones}
              aiRecommendedGoals={dashboardData.aiRecommendedGoals?.map((goal: any, index: number) => ({
                ...goal,
                id: `ai-goal-${index}`,
                difficulty: "Medium",
                reason: "AI-generated based on your learning patterns"
              })) || []}
            />
          </div>
        );

      case "skills":
        return (
          <div className="space-y-6">
            <SkillGrowthTracker 
              skills={dashboardData.skillData}
              growthMetrics={dashboardData.skillGrowthMetrics}
              industryBenchmarks={dashboardData.skillBenchmarks}
            />
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <EnhancedProfileSummary 
              user={user}
              userData={dashboardData.userData}
              socialAccounts={dashboardData.userData.socialMediaAccounts}
              achievements={dashboardData.achievements}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center p-4 rounded-lg border-2 border-transparent transition-all duration-200 ${getTabColorClasses(tab.color, isActive)}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className="text-xs opacity-75 text-center mt-1 hidden md:block">
                  {tab.description}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SmartDashboardTabs; 