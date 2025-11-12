"use client";

import { Clock, CheckCircle, Users, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Clock,
    label: "Avg. Response Time",
    value: "< 2 hours",
    description: "We respond quickly",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: CheckCircle,
    label: "Resolution Rate",
    value: "98%",
    description: "First contact resolution",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Users,
    label: "Support Team",
    value: "24/7",
    description: "Always here to help",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: TrendingUp,
    label: "Customer Satisfaction",
    value: "4.9/5",
    description: "Based on 10,000+ reviews",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
];

export const SupportStats = () => {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Why Choose Our Support?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We&apos;re committed to providing exceptional support to help you succeed
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <div className={`${stat.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
