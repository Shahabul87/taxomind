import React from "react";
import { BarChart, LineChart, TrendingUp, Award } from "lucide-react";

export default function PerformanceStats() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Performance Stats</h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Course Completion</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">4 of 6 courses completed</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">67%</span>
        </div>
        
        <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Award className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Achievements</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">8 badges earned</p>
            </div>
          </div>
          <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-2 py-1 rounded-full">
            +3 this month
          </span>
        </div>
        
        <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <LineChart className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Quiz Scores</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Average score across tests</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">85%</span>
        </div>
        
        <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Learning Streak</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Consecutive days active</p>
            </div>
          </div>
          <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">7 days</span>
        </div>
      </div>
    </div>
  );
} 